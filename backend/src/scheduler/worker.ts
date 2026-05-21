// backend/src/scheduler/worker.ts
// Cron jobs:
//  - every minute: flush due Notification rows
//  - 07:00 morning_goal, 10:00 science_tip, 14:00 phenomena, 16:30 exercise,
//    20:00 evening_checkin, 21:30 night_story
//  - 07:30 streak_milestone, 19:00 missed_day, 10:30 re-engagement,
//    Fri 18:00 founder_weekly
//  - every 30 min: crisis_prep cho user có riskyHours
//
// Run separately: `pnpm worker` or docker compose service.

import cron from 'node-cron';
import { prisma } from '../db';
import { computeDayNumber } from '../utils/dayNumber';
import { sendWebPush } from '../notifications/webpush';
import { emitToUser } from '../socket/emitter';
import { logger } from '../utils/logger';
import { config } from '../config';
import { personalize, buildGreeting } from '../utils/personalize';
import {
  mergeWithDefaults,
  isInQuietHours,
  isInActiveWindow,
  detectCurrentMoment,
  effectiveDailyMax,
} from '../users/notificationPrefs';
import { runEmailFunnelDaily } from './emailFunnel';
import { fireDuePushes, expireStaleScheduledPushes } from '../zalo/scheduledPushFirer';
import { recomputeAllActiveUsers } from '../zalo/journeyEngine';
import { fireRandomTip } from '../zalo/randomTipFirer';
import { firePrepReminders } from '../zalo/qdayPrepReminder';
import { generateMilestoneMemoryBooks } from '../services/memoryBook';
// Adaptive funnel: lazy import để tránh fail build nếu file có TS error.
// Production có thể nhập lại sau khi sửa.

// Respect quiet hours stored in user settings.
function isWithinQuietHours(settings: any): boolean {
  if (!settings?.quietHoursStart || !settings?.quietHoursEnd) return false;
  const now = new Date();
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const start = settings.quietHoursStart;
  const end = settings.quietHoursEnd;
  if (start <= end) return hhmm >= start && hhmm < end;
  return hhmm >= start || hhmm < end; // wraps midnight
}

function isCalmMode(settings: any): boolean {
  if (settings?.mode !== 'calm') return false;
  if (!settings?.calmModeUntil) return true;
  return new Date(settings.calmModeUntil).getTime() > Date.now();
}

// ─── every minute: deliver due notifications ─────────────────────────────
async function deliverDueNotifications() {
  const now = new Date();
  const due = await prisma.notification.findMany({
    where: { status: 'SCHEDULED', scheduledAt: { lte: now } },
    take: 200,
  });

  for (const n of due) {
    const user = await prisma.user.findUnique({ where: { id: n.userId } });
    if (!user) continue;

    const isCrisis = n.type === 'CRISIS_PREP';
    const settings = user.settings as any;

    // Respect quiet hours (except crisis).
    if (!isCrisis && isWithinQuietHours(settings)) {
      await prisma.notification.update({
        where: { id: n.id },
        data: { status: 'SUPPRESSED' },
      });
      continue;
    }

    // Respect calm mode (except crisis and evening check-in).
    if (!isCrisis && n.type !== 'EVENING_CHECKIN' && isCalmMode(settings)) {
      await prisma.notification.update({
        where: { id: n.id },
        data: { status: 'SUPPRESSED' },
      });
      continue;
    }

    // Persist into message log so it shows in widget.
    const msg = await prisma.message.create({
      data: {
        userId: n.userId,
        role: 'ASSISTANT',
        type:
          n.type === 'EVENING_CHECKIN'
            ? 'CHECKIN_PROMPT'
            : n.type === 'CRISIS_PREP'
            ? 'PHENOMENA_ALERT'
            : n.type === 'MORNING_GOAL'
            ? 'MORNING_GOAL'
            : n.type === 'SCIENCE_TIP'
            ? 'SCIENCE_TIP'
            : n.type === 'PHENOMENA_ALERT'
            ? 'PHENOMENA_ALERT'
            : n.type === 'EXERCISE_REMINDER'
            ? 'EXERCISE_CARD'
            : n.type === 'NIGHT_STORY'
            ? 'NIGHT_STORY'
            : n.type === 'STREAK_MILESTONE'
            ? 'STREAK_MILESTONE'
            : 'SYSTEM_NOTICE',
        content: `${n.title}\n${n.body}`.trim(),
        metadata: {
          notificationId: n.id,
          ctaLabel: n.ctaLabel,
          ctaAction: n.ctaAction,
          wikiUrl: n.wikiUrl,
        },
      },
    });
    emitToUser(n.userId, 'message:new', msg);

    // External web push if channel includes WEB_PUSH and not quiet.
    if (n.channels.includes('WEB_PUSH')) {
      await sendWebPush(n.userId, {
        title: n.title,
        body: n.body,
        url: n.ctaAction ?? '/',
        tag: n.type,
        data: { notificationId: n.id, ctaAction: n.ctaAction },
      });
    }

    await prisma.notification.update({
      where: { id: n.id },
      data: { sentAt: new Date(), status: 'SENT' },
    });
  }
}

// ─── enqueue daily content for all users ──────────────────────────────────
// Map ContentModule → NotificationType.
// ContentModule có 5 giá trị (matching ContentItem.module).
// NotificationType có thêm EXERCISE_REMINDER (rename của EXERCISE), NIGHT_STORY mới.
type ContentModuleParam = 'MORNING_GOAL' | 'SCIENCE_TIP' | 'PHENOMENA_ALERT' | 'EXERCISE' | 'NIGHT_STORY';

function moduleToNotifType(m: ContentModuleParam): 'MORNING_GOAL' | 'SCIENCE_TIP' | 'PHENOMENA_ALERT' | 'EXERCISE_REMINDER' | 'NIGHT_STORY' {
  if (m === 'EXERCISE') return 'EXERCISE_REMINDER';
  return m;
}

// User opt-in smart scheduler khi đã set dailyMax (qua /users/me/notification-prefs).
// Worker fix-cron skip user opt-in để tránh duplicate.
function userHasSmartPrefs(user: any): boolean {
  const prefs = user.notificationPrefs as any;
  return !!prefs?.dailyMax;
}

async function enqueueDailyContent(module: ContentModuleParam) {
  const users = await prisma.user.findMany({
    where: { quitDate: { not: null } },
  });

  for (const user of users) {
    // Skip user đã opt-in smart scheduler — họ nhận qua smartSchedulerSweep
    if (userHasSmartPrefs(user)) continue;

    const day = computeDayNumber(user.quitDate);
    const items = await prisma.contentItem.findMany({
      where: { dayNumber: day, module: module as any, published: true },
    });
    if (items.length === 0) continue;

    // Do not re-enqueue if already scheduled for this day.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const notifType = moduleToNotifType(module);
    const existing = await prisma.notification.findFirst({
      where: {
        userId: user.id,
        type: notifType,
        scheduledAt: { gte: today, lt: tomorrow },
      },
    });
    if (existing) continue;

    const item = items[0];

    // Cá nhân hoá: thay {pronoun}, {name}, {assistant}… trong nội dung admin viết.
    const pCtx = {
      name: user.name,
      pronouns: user.pronouns,
      assistantName: user.assistantName,
      // LEVEL 3 — pass story personalization vars
      quitReasons: user.quitReasons,
      topTriggers: user.topTriggers,
    };
    let title = personalize(item.title, pCtx);
    let body = personalize(item.body, pCtx);

    // Thêm lời chào động lên đầu morning_goal & night_story nếu admin chưa
    // tự nhúng {greet}.
    if (module === 'MORNING_GOAL' && !item.body.includes('{greet}') && !/^chào/i.test(body)) {
      body = `${buildGreeting('morning', pCtx)}\n${body}`;
    } else if (module === 'NIGHT_STORY' && !item.body.includes('{greet}') && !/^khuya/i.test(body)) {
      body = `${buildGreeting('night', pCtx)}\n${body}`;
    }

    await prisma.notification.create({
      data: {
        userId: user.id,
        type: notifType,
        title,
        body,
        wikiUrl: item.wikiUrl,
        ctaLabel: item.wikiUrl ? 'Đọc sâu' : null,
        ctaAction: item.wikiUrl ?? null,
        // FIX: thiếu WEB_PUSH → user enable push không nhận được. Phenomena/exercise
        // chỉ in-widget vì không quá khẩn; morning_goal + night_story + science_tip
        // phải push để chạm user khi họ chưa mở widget.
        channels:
          module === 'MORNING_GOAL' || module === 'NIGHT_STORY' || module === 'SCIENCE_TIP'
            ? ['IN_WIDGET', 'WEB_PUSH']
            : ['IN_WIDGET'],
        scheduledAt: new Date(),
        metadata: { dayNumber: day, module },
      },
    });
  }
}

// ─── 30 EVENING_CHECKIN variants — slot 20:00 voice arc theo ngày ─────────
// Mỗi entry là body cho check-in prompt ngày tương ứng. {pronoun}, {topReason}…
// được thay tự động qua personalize(). {day} thay bằng dayNumber.
const EVENING_CHECKIN_PROMPTS: Record<string, string> = {
  // Khởi động
  '1': `Ngày {day} — đêm đầu sạch. 30 giây check-in: hôm nay thèm mạnh nhất lúc nào?`,
  '2': `Ngày {day} — đỉnh thèm hôm nay thế nào {pronoun}? 30 giây để mình biết.`,
  // Đỉnh sóng
  '3': `Ngày {day} — bức tường đã qua. {pronoun} ổn không? 30 giây check.`,
  '4': `Ngày {day} — đêm qua ngủ ổn không? 30 giây — mình điều chỉnh nội dung mai cho hợp.`,
  '5': `Ngày {day} — cuối tuần đầu. Cảm xúc hôm nay: 1 (khó) tới 5 (ổn)?`,
  // Bức tường
  '6': `Ngày {day} — gần 1 tuần. Mai check-in xong mình kể tin vui Day 7.`,
  '7': `Ngày {day} — 168 giờ. Tự hào tới đâu trên 1-10?`,
  '8': `Ngày {day} — tuần 2 đầu. Trận khó hôm nay là gì?`,
  '9': `Ngày {day} — đếm cơn thèm hôm nay được không?`,
  '10': `Ngày {day} — 1/3 chặng. Người thân có nhận thấy thay đổi không?`,
  // Bước ngoặt
  '11': `Ngày {day} — tim chậm hơn rồi. {pronoun} thấy khác chưa?`,
  '12': `Ngày {day} — tay ấm hơn? Da đỡ xám? 30 giây.`,
  '13': `Ngày {day} — mai 2 tuần. Tối nay 30 giây thôi.`,
  '14': `Ngày {day} — RECEPTOR GIẢM 40%. Cảm giác hôm nay 1-10?`,
  // Tự tin giả
  '15': `Ngày {day} — nửa chặng. Hôm nay có lúc nào "thử 1 điếu" lướt qua không?`,
  '16': `Ngày {day} — tăng cân chút? Tâm trạng vẫn ổn chứ?`,
  '17': `Ngày {day} — hôm nay có nhậu/tiệc không? Vượt qua không?`,
  '18': `Ngày {day} — đêm qua mơ hút? Tỉnh dậy ổn không?`,
  '19': `Ngày {day} — ho có đỡ không? 30 giây check.`,
  '20': `Ngày {day} — lo âu tự nhiên không? 30 giây.`,
  '21': `Ngày {day} — 3 tuần. Thói quen mới đã thấy chưa?`,
  // Nội hóa
  '22': `Ngày {day} — hôm nay {pronoun} có nói "tôi không hút thuốc" lần nào chưa?`,
  '23': `Ngày {day} — ai rủ hôm nay không? {pronoun} từ chối thế nào?`,
  '24': `Ngày {day} — tiền tiết kiệm tới đâu? Kế hoạch dùng?`,
  '25': `Ngày {day} — hơi thở dài hơn? Leo cầu thang khác?`,
  '26': `Ngày {day} — bữa cơm có ngon hơn không?`,
  '27': `Ngày {day} — sắp 30. Plan Day 30 chưa?`,
  '28': `Ngày {day} — 2 đêm nữa. Phòng vệ vẫn giữ chứ?`,
  // Cột mốc
  '29': `Ngày {day} — đêm cuối trước cột mốc. Cảm xúc 1-10?`,
  '30': `Ngày {day} — KỶ LỤC. Nhìn lại 30 ngày — tự hào nhất điều gì?`,
  // Fallback cho Day 31+
  'default': `Ngày {day} — 30 giây thôi {pronoun} ơi. Mình chờ {pronoun}.`,
};

async function enqueueEveningCheckin() {
  const users = await prisma.user.findMany({ where: { quitDate: { not: null } } });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  for (const user of users) {
    // Skip if already checked in.
    const ci = await prisma.checkIn.findUnique({
      where: { userId_date: { userId: user.id, date: today } },
    });
    if (ci) continue;

    const existing = await prisma.notification.findFirst({
      where: {
        userId: user.id,
        type: 'EVENING_CHECKIN',
        scheduledAt: { gte: today, lt: tomorrow },
      },
    });
    if (existing) continue;

    const day = computeDayNumber(user.quitDate);
    const pCtx = {
      name: user.name,
      pronouns: user.pronouns,
      assistantName: user.assistantName,
      // LEVEL 3 — pass story personalization vars
      quitReasons: user.quitReasons,
      topTriggers: user.topTriggers,
    };
    const checkInBody = personalize(EVENING_CHECKIN_PROMPTS[day] ?? EVENING_CHECKIN_PROMPTS.default, pCtx)
      .replace(/\{day\}/g, String(day));
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'EVENING_CHECKIN',
        title: buildGreeting('evening', pCtx),
        body: checkInBody,
        ctaLabel: 'Bắt đầu check-in',
        ctaAction: 'open_checkin',
        channels: ['IN_WIDGET', 'WEB_PUSH'],
        scheduledAt: new Date(),
      },
    });
  }
}

async function enqueueCrisisPrep() {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  // Run half-hour before any user's risky hour.
  const targetHour = (hour + (minute >= 30 ? 1 : 0)) % 24;

  const users = await prisma.user.findMany({
    where: { riskyHours: { has: targetHour } },
  });

  for (const user of users) {
    const day = computeDayNumber(user.quitDate);
    const pCtx = {
      name: user.name,
      pronouns: user.pronouns,
      assistantName: user.assistantName,
      // LEVEL 3 — pass story personalization vars
      quitReasons: user.quitReasons,
      topTriggers: user.topTriggers,
    };
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'CRISIS_PREP',
        title: `30 phút nữa là giờ khó của ${user.pronouns}`,
        body: personalize(
          'Plan B của {pronoun} đã sẵn sàng chưa? Thở 4-7-8 với mình nếu thấy khó.',
          pCtx,
        ),
        ctaLabel: 'Mở breathing',
        ctaAction: 'open_crisis_breathing',
        channels: ['IN_WIDGET', 'WEB_PUSH'],
        scheduledAt: new Date(),
        metadata: { riskyHour: targetHour, dayNumber: day },
      },
    });
  }
}

// ─── Streak milestone — celebrate Sol v3 schedule ─────────────────────────
// Sol v3 milestones theo 4 chặng:
//   Day 1   — bắt đầu Nhận Diện
//   Day 7   — kết Nhận Diện → mai vào Kiểm Soát
//   Day 14  — giữa Kiểm Soát
//   Day 21  — kết Kiểm Soát → mai Q-Day
//   Day 22  — Q-Day (Làm Chủ Day 1)
//   Day 30  — 1 tuần Làm Chủ
//   Day 51  — kết Làm Chủ → mai lễ tốt nghiệp
//   Day 52  — LỄ TỐT NGHIỆP → Người Tự Do
//   Day 90  — 100% tự do (tham khảo y khoa)
const STREAK_MILESTONES: Record<number, { title: string; body: string; emoji: string }> = {
  1: {
    emoji: '🌱',
    title: '1 ngày — bắt đầu Nhận Diện',
    body: 'Ngày đầu trong Sol — {pronoun} không cần bỏ thuốc ngay, chỉ quan sát: hút lúc nào, vì sao, cảm xúc gì. Mai dễ hơn.',
  },
  3: {
    emoji: '👀',
    title: '3 ngày — bắt đầu nhìn thấy pattern',
    body: '{pronoun} đã ghi nhận 2-3 cơn thèm. Sol đang học nhịp của {pronoun}. Đừng đánh giá — chỉ quan sát.',
  },
  7: {
    emoji: '🌿',
    title: '7 ngày — kết Nhận Diện',
    body: 'Hết 7 ngày Nhận Diện. Mai vào Kiểm Soát — bắt đầu giảm tần suất hút có ý thức. {pronoun} đã hiểu rõ mình hơn rồi.',
  },
  14: {
    emoji: '🟡',
    title: '14 ngày — giữa Kiểm Soát',
    body: 'Đã 1 tuần ở Kiểm Soát. {pronoun} đang giảm dần — không nhất thiết phải sạch, chỉ cần giảm đều. Còn 1 tuần nữa tới Q-Day.',
  },
  21: {
    emoji: '🔔',
    title: '21 ngày — kết Kiểm Soát, mai Q-Day',
    body: '{pronoun} đã đi qua 7 ngày Nhận Diện + 14 ngày Kiểm Soát. Mai là Q-Day — Day 22, bắt đầu Làm Chủ. Tối nay đọc lại 3 lý do {pronoun} muốn bỏ.',
  },
  22: {
    emoji: '🔴',
    title: 'Q-Day — Day 22, bắt đầu Làm Chủ',
    body: 'Hôm nay là Q-Day. Từ giờ {pronoun} cai hẳn 30 ngày Làm Chủ. 24h đầu khó nhất — Sol bên {pronoun}.',
  },
  30: {
    emoji: '💪',
    title: '30 ngày — 1 tuần Làm Chủ',
    body: '8 ngày sạch sau Q-Day. Nicotin gần hết khỏi cơ thể {pronoun}. Tự hào.',
  },
  51: {
    emoji: '🎉',
    title: '51 ngày — kết Làm Chủ',
    body: '30 ngày Làm Chủ hoàn thành. Mai là Day 52 — Lễ Tốt Nghiệp. {pronoun} đã đi từ "không bỏ được" tới "Người Tự Do".',
  },
  52: {
    emoji: '🌟',
    title: 'Day 52 — LỄ TỐT NGHIỆP, Người Tự Do',
    body: '{pronoun} đã tốt nghiệp Sol. Từ giờ truy cập miễn phí mãi mãi. Tự do thật sự. — Khang Sol',
  },
  90: {
    emoji: '🏆',
    title: '90 ngày — 100% tự do',
    body: '90 ngày là cột mốc não bộ ổn định. Từ giờ cuộc sống không thuốc là mặc định, không phải nỗ lực.',
  },
};

async function enqueueStreakMilestones() {
  const users = await prisma.user.findMany({ where: { quitDate: { not: null } } });
  for (const user of users) {
    const day = computeDayNumber(user.quitDate);
    const ms = STREAK_MILESTONES[day];
    if (!ms) continue;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existing = await prisma.notification.findFirst({
      where: {
        userId: user.id,
        type: 'STREAK_MILESTONE',
        scheduledAt: { gte: today, lt: tomorrow },
      },
    });
    if (existing) continue;

    const pCtx = {
      name: user.name,
      pronouns: user.pronouns,
      assistantName: user.assistantName,
      // LEVEL 3 — pass story personalization vars
      quitReasons: user.quitReasons,
      topTriggers: user.topTriggers,
    };

    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'STREAK_MILESTONE',
        title: `${ms.emoji} ${ms.title}`,
        body: personalize(ms.body, pCtx),
        ctaLabel: 'Xem hành trình',
        ctaAction: 'open_progress',
        channels: ['IN_WIDGET', 'WEB_PUSH'],
        scheduledAt: new Date(),
        metadata: { dayNumber: day, milestone: day },
      },
    });
  }
}

// ─── Missed-day — user vắng check-in 24h ──────────────────────────────────
async function enqueueMissedDay() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const users = await prisma.user.findMany({ where: { quitDate: { not: null } } });

  for (const user of users) {
    // Skip nếu user mới (chưa từng check-in) — sẽ là re-engagement chứ không phải missed
    const totalCheckins = await prisma.checkIn.count({ where: { userId: user.id } });
    if (totalCheckins === 0) continue;

    // Skip nếu hôm qua user CÓ check-in
    const yesterdayCi = await prisma.checkIn.findUnique({
      where: { userId_date: { userId: user.id, date: yesterday } },
    });
    if (yesterdayCi) continue;

    // Skip nếu hôm nay đã check-in (có thể user check-in sớm)
    const todayCi = await prisma.checkIn.findUnique({
      where: { userId_date: { userId: user.id, date: today } },
    });
    if (todayCi) continue;

    // Idempotent — không bắn lại trong ngày
    const existing = await prisma.notification.findFirst({
      where: {
        userId: user.id,
        type: 'MISSED_DAY',
        scheduledAt: { gte: today, lt: tomorrow },
      },
    });
    if (existing) continue;

    const day = computeDayNumber(user.quitDate);
    const pCtx = {
      name: user.name,
      pronouns: user.pronouns,
      assistantName: user.assistantName,
      // LEVEL 3 — pass story personalization vars
      quitReasons: user.quitReasons,
      topTriggers: user.topTriggers,
    };

    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'MISSED_DAY',
        title: `Hôm qua mình không thấy ${user.pronouns}`,
        body: personalize(
          'Lỡ một ngày không phải thất bại. Hôm nay quay lại là tiếp tục — mình vẫn ở đây cho {pronoun}. 30 giây check-in thôi.',
          pCtx,
        ),
        ctaLabel: 'Check-in hôm nay',
        ctaAction: 'open_checkin',
        channels: ['IN_WIDGET', 'WEB_PUSH'],
        scheduledAt: new Date(),
        metadata: { dayNumber: day, missedDate: yesterday.toISOString() },
      },
    });
  }
}

// ─── Re-engagement — user vắng 7+ ngày, nhẹ nhàng kéo lại ──────────────────
async function enqueueReengagement() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const users = await prisma.user.findMany({ where: { quitDate: { not: null } } });

  for (const user of users) {
    // Tìm hoạt động cuối — message cuối hoặc check-in cuối
    const lastMsg = await prisma.message.findFirst({
      where: { userId: user.id, role: 'USER' },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });
    const lastCi = await prisma.checkIn.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    const lastActivity =
      lastMsg && lastCi
        ? lastMsg.createdAt > lastCi.createdAt
          ? lastMsg.createdAt
          : lastCi.createdAt
        : lastMsg?.createdAt ?? lastCi?.createdAt;

    if (!lastActivity) continue;
    if (lastActivity > sevenDaysAgo) continue;

    // Tránh spam — chỉ bắn 1 lần mỗi 7 ngày
    const recentReengagement = await prisma.notification.findFirst({
      where: {
        userId: user.id,
        type: 'REENGAGEMENT',
        scheduledAt: { gte: sevenDaysAgo },
      },
    });
    if (recentReengagement) continue;

    const day = computeDayNumber(user.quitDate);
    const pCtx = {
      name: user.name,
      pronouns: user.pronouns,
      assistantName: user.assistantName,
      // LEVEL 3 — pass story personalization vars
      quitReasons: user.quitReasons,
      topTriggers: user.topTriggers,
    };

    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'REENGAGEMENT',
        title: `${user.pronouns ?? 'Bạn'} ơi, mình nhớ ${user.pronouns ?? 'bạn'}`,
        body: personalize(
          'Hành trình của {pronoun} không có deadline. Nếu hôm nay là ngày {pronoun} muốn quay lại — mình ở đây, không phán xét. Kể mình nghe {pronoun} đang thế nào.',
          pCtx,
        ),
        ctaLabel: 'Mở chat',
        ctaAction: 'open_chat',
        channels: ['IN_WIDGET', 'WEB_PUSH'],
        scheduledAt: new Date(),
        metadata: { dayNumber: day, daysSinceLastActivity: Math.floor((Date.now() - lastActivity.getTime()) / 86400000) },
      },
    });
  }
}

// ─── Founder weekly — Khang note thứ 6 18:00 cho tất cả user active ───────
const FOUNDER_WEEKLY_NOTES: { title: string; body: string }[] = [
  {
    title: 'Thư thứ Sáu — Khang Sol',
    body: 'Tuần này {pronoun} thế nào? Tuần này mình muốn nhắc {pronoun} một câu mình tự nhủ mỗi sáng: "Hôm nay không phải hôm qua — mình có thể chọn lại." {pronoun} cũng vậy nhé. — Khang Sol',
  },
  {
    title: 'Thư thứ Sáu — Khang Sol',
    body: 'Tuần này có điều gì khiến {pronoun} thấy khó không? Mình muốn nghe — kể mình một câu thôi cũng được. Mình đọc hết. — Khang Sol',
  },
  {
    title: 'Thư thứ Sáu — Khang Sol',
    body: 'Mình đang viết bài về phenomena tuần thứ 4 — nhiều người báo "tự nhiên buồn không lý do". Bình thường — não đang điều chỉnh dopamine. Cuối tuần đọc nhé, mình gửi link ở widget. — Khang Sol',
  },
  {
    title: 'Thư thứ Sáu — Khang Sol',
    body: 'Tuần này mình đọc lại Allen Carr. Một câu hay: "Bỏ thuốc không phải mất gì — là tìm lại." {pronoun} đang tìm lại điều gì? — Khang Sol',
  },
];

async function enqueueFounderWeekly() {
  const users = await prisma.user.findMany({ where: { quitDate: { not: null } } });

  // Chọn note theo tuần trong năm — xoay vòng qua 4 note
  const weekNum = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (7 * 86400000));
  const note = FOUNDER_WEEKLY_NOTES[weekNum % FOUNDER_WEEKLY_NOTES.length];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  for (const user of users) {
    // Idempotent — 1 note/tuần/user
    const existing = await prisma.notification.findFirst({
      where: {
        userId: user.id,
        type: 'FOUNDER_WEEKLY',
        scheduledAt: { gte: today, lt: tomorrow },
      },
    });
    if (existing) continue;

    const pCtx = {
      name: user.name,
      pronouns: user.pronouns,
      assistantName: user.assistantName,
      // LEVEL 3 — pass story personalization vars
      quitReasons: user.quitReasons,
      topTriggers: user.topTriggers,
    };

    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'FOUNDER_WEEKLY',
        title: note.title,
        body: personalize(note.body, pCtx),
        ctaLabel: 'Đọc tiếp',
        ctaAction: 'open_chat',
        channels: ['IN_WIDGET', 'WEB_PUSH'],
        scheduledAt: new Date(),
        metadata: { weekNum, noteIndex: weekNum % FOUNDER_WEEKLY_NOTES.length },
      },
    });
  }
}

// ─── Q-DAY PUSH SCHEDULER (Sol v3 — 12-05-2026) ────────────────────────────
// Sol v3 schedule: Q-Day = Day 22 = bắt đầu chặng LÀM CHỦ (cai hẳn 30 ngày).
//   Day 20 T-2  — sáng 7h "Còn 2 ngày là Q-Day"
//   Day 21 T-1  — tối 21h Khang Sol message "Mai anh quyết" (cuối Kiểm Soát)
//   Day 22 Q-DAY — sáng 7h "Hôm nay là Q-Day. Bấm vào để bắt đầu."
//
// Query users matching dayInJourney = 20/21/22 AND qDayConfirmedAt IS NULL.
// Idempotent: 1 notif/ngày/user/phase. CTA → open_overview để hiện ceremony.

type QDayPhase = 'T_MINUS_2' | 'T_MINUS_1_EVENING' | 'Q_DAY';

const Q_DAY_TARGETS: Record<QDayPhase, { dayInJourney: number; title: string; body: string; ctaLabel: string }> = {
  T_MINUS_2: {
    dayInJourney: 20,
    title: '🎯 Còn 2 ngày là Q-Day',
    body: 'Còn 2 ngày là Q-Day — ngày {pronoun} cam kết bỏ hẳn. {pronoun} đang chuẩn bị thế nào? Tối nay viết 3 lý do {pronoun} muốn bỏ — để mai đọc lại. — Sol đồng hành',
    ctaLabel: 'Mở chuẩn bị',
  },
  T_MINUS_1_EVENING: {
    dayInJourney: 21,
    title: '🌅 Đêm nay là đêm cuối Kiểm Soát',
    body: 'Mình là Khang. Mai {pronoun} chỉ cần xác nhận. {pronoun} đã đi qua 7 ngày Nhận Diện + 14 ngày Kiểm Soát — Sol đã đo nhịp, đội Sol đã sẵn sàng. Tối nay ngồi yên 10 phút, đọc lại 3 lý do. Mai bấm "Tôi cam kết" — đồng hồ Tự Do của {pronoun} bắt đầu. Mình ở đó. — Khang Sol',
    ctaLabel: 'Đọc lại lý do',
  },
  Q_DAY: {
    dayInJourney: 22,
    title: '🌅 Hôm nay là Q-Day — bắt đầu Làm Chủ',
    body: 'Hôm nay là Q-Day của {pronoun} — Day 22, bắt đầu chặng Làm Chủ 30 ngày. Bấm vào Tổng quan — bấm "Tôi cam kết — bật đồng hồ Tự Do". Đội Sol sẽ thấy: "Một đồng đội vừa Q-Day". 24 giờ tới là 24 giờ khó nhất sinh học — Sol bên {pronoun}. — Khang Sol',
    ctaLabel: 'Cam kết Q-Day',
  },
};

async function enqueueQDayPushes(phase: QDayPhase) {
  const target = Q_DAY_TARGETS[phase];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Lấy tất cả user có quitDate, chưa exit, chưa confirm Q-Day, không phải DAI_SU.
  const users = await prisma.user.findMany({
    where: {
      quitDate: { not: null },
      qDayConfirmedAt: null,
      exitedAt: null,
    },
  });

  let enqueued = 0;
  for (const user of users) {
    const day = computeDayNumber(user.quitDate);
    if (day !== target.dayInJourney) continue;

    // Idempotent — không bắn 2 lần cùng phase trong cùng ngày
    const existing = await prisma.notification.findFirst({
      where: {
        userId: user.id,
        type: 'CUSTOM',
        scheduledAt: { gte: today, lt: tomorrow },
        metadata: { path: ['qDayPhase'], equals: phase } as any,
      },
    });
    if (existing) continue;

    const pCtx = {
      name: user.name,
      pronouns: user.pronouns,
      assistantName: user.assistantName,
      quitReasons: user.quitReasons,
      topTriggers: user.topTriggers,
    };

    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'CUSTOM',
        title: personalize(target.title, pCtx),
        body: personalize(target.body, pCtx),
        ctaLabel: target.ctaLabel,
        ctaAction: 'open_overview',
        // Q-Day push CRITICAL — luôn cả IN_WIDGET + WEB_PUSH (skip quietHours
        // không apply trong deliverDueNotifications cho CUSTOM type? Em check
        // logic — CUSTOM chỉ bị suppress nếu match isCrisis=false + quietHours.
        // Q-Day push SHOULD respect quiet hours của user — nếu user set 22-7h
        // quiet thì 7h sáng vừa hết quiet → OK gửi.)
        channels: ['IN_WIDGET', 'WEB_PUSH'],
        scheduledAt: new Date(),
        metadata: { qDayPhase: phase, dayInJourney: day },
      },
    });
    enqueued++;
  }

  if (enqueued > 0) {
    logger.info({ phase, enqueued }, 'Q-Day push enqueued');
  }
}

// ─── SMART SCHEDULER (Phase 5) — replace fix-cron cho user opt-in ────────
// Chạy mỗi 15 phút, quét tất cả user có notificationPrefs.dailyMax set.
// Match content với current moment (±15 phút) hoặc GENERIC fallback.
// Apply quietHours, activeWindow, dailyMax, weekendReduce.
async function smartSchedulerSweep() {
  const now = new Date();
  const users = await prisma.user.findMany({
    where: { quitDate: { not: null } },
  });

  for (const user of users) {
    if (!userHasSmartPrefs(user)) continue;

    const prefs = mergeWithDefaults(user.notificationPrefs as any);

    // Skip nếu trong quiet hours
    if (isInQuietHours(now, prefs)) continue;
    // Skip nếu ngoài active window
    if (!isInActiveWindow(now, prefs)) continue;

    // Đếm tin gửi hôm nay
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sentToday = await prisma.notification.count({
      where: {
        userId: user.id,
        scheduledAt: { gte: today, lt: tomorrow },
        status: { in: ['SCHEDULED', 'SENT', 'DELIVERED', 'READ'] },
      },
    });

    const cap = effectiveDailyMax(prefs, now);
    if (sentToday >= cap) continue;

    // Detect current moment
    const currentMoment = detectCurrentMoment(now, prefs.moments);
    const day = computeDayNumber(user.quitDate);

    // Tìm content match: moment match HOẶC moment null (GENERIC fallback)
    const candidates = await prisma.contentItem.findMany({
      where: {
        dayNumber: day,
        published: true,
        OR: [
          { moment: currentMoment as any },
          { moment: null },
        ],
      },
      orderBy: { priority: 'desc' },
    });

    if (candidates.length === 0) continue;

    // Filter: chưa gửi hôm nay (theo unique [dayNumber + module])
    const sentTypes = await prisma.notification.findMany({
      where: {
        userId: user.id,
        scheduledAt: { gte: today, lt: tomorrow },
      },
      select: { metadata: true, type: true },
    });
    const sentDayModules = new Set(
      sentTypes.map((n: any) => `${n.metadata?.dayNumber}::${n.metadata?.module}`),
    );

    const fresh = candidates.filter((c) => !sentDayModules.has(`${day}::${c.module}`));
    if (fresh.length === 0) continue;

    // Prioritize moment-matched > GENERIC fallback
    fresh.sort((a, b) => {
      const am = a.moment === currentMoment ? 1 : 0;
      const bm = b.moment === currentMoment ? 1 : 0;
      if (am !== bm) return bm - am;
      return b.priority - a.priority;
    });

    const item = fresh[0];

    // Personalize + enqueue (giống enqueueDailyContent)
    const pCtx = {
      name: user.name,
      pronouns: user.pronouns,
      assistantName: user.assistantName,
      quitReasons: user.quitReasons,
      topTriggers: user.topTriggers,
    };
    let title = personalize(item.title, pCtx);
    let body = personalize(item.body, pCtx);

    if (item.module === 'MORNING_GOAL' && !item.body.includes('{greet}') && !/^chào/i.test(body)) {
      body = `${buildGreeting('morning', pCtx)}\n${body}`;
    } else if (item.module === 'NIGHT_STORY' && !item.body.includes('{greet}') && !/^khuya/i.test(body)) {
      body = `${buildGreeting('night', pCtx)}\n${body}`;
    }

    const notifType = moduleToNotifType(item.module as ContentModuleParam);

    await prisma.notification.create({
      data: {
        userId: user.id,
        type: notifType as any,
        title,
        body,
        wikiUrl: item.wikiUrl,
        ctaLabel: item.wikiUrl ? 'Đọc sâu' : null,
        ctaAction: item.wikiUrl ?? null,
        channels:
          item.module === 'MORNING_GOAL' || item.module === 'NIGHT_STORY' || item.module === 'SCIENCE_TIP'
            ? ['IN_WIDGET', 'WEB_PUSH']
            : ['IN_WIDGET'],
        scheduledAt: new Date(),
        metadata: { dayNumber: day, module: item.module, moment: currentMoment, smart: true },
      },
    });

    logger.debug({ userId: user.id, day, module: item.module, moment: currentMoment, sentToday: sentToday + 1, cap }, 'smart_scheduler enqueued');
  }
}

export function startScheduler() {
  if (!config.features.scheduler) {
    logger.info('Scheduler disabled (ENABLE_SCHEDULER=false)');
    return;
  }

  // Every minute — deliver due notifications.
  cron.schedule('* * * * *', () => {
    deliverDueNotifications().catch((e) => logger.error({ err: e }, 'deliverDueNotifications failed'));
  });

  // Every 15 min — Smart scheduler sweep (Phase 5) cho user opt-in
  cron.schedule('*/15 * * * *', () => {
    smartSchedulerSweep().catch((e) => logger.error({ err: e }, 'smartSchedulerSweep failed'));
  });

  // 07:00 Asia/Ho_Chi_Minh — morning goal
  cron.schedule('0 7 * * *', () => {
    enqueueDailyContent('MORNING_GOAL').catch((e) => logger.error({ err: e }, 'morning goal enqueue failed'));
  }, { timezone: 'Asia/Ho_Chi_Minh' });

  // 07:30 — streak milestone
  cron.schedule('30 7 * * *', () => {
    enqueueStreakMilestones().catch((e) => logger.error({ err: e }, 'streak milestone enqueue failed'));
  }, { timezone: 'Asia/Ho_Chi_Minh' });

  // 10:00 — science tip
  cron.schedule('0 10 * * *', () => {
    enqueueDailyContent('SCIENCE_TIP').catch((e) => logger.error({ err: e }, 'science tip enqueue failed'));
  }, { timezone: 'Asia/Ho_Chi_Minh' });

  // 10:30 — re-engagement (user vắng 7+ ngày)
  cron.schedule('30 10 * * *', () => {
    enqueueReengagement().catch((e) => logger.error({ err: e }, 're-engagement enqueue failed'));
  }, { timezone: 'Asia/Ho_Chi_Minh' });

  // 14:00 — phenomena alert (only on days that have one)
  cron.schedule('0 14 * * *', () => {
    enqueueDailyContent('PHENOMENA_ALERT').catch((e) => logger.error({ err: e }, 'phenomena enqueue failed'));
  }, { timezone: 'Asia/Ho_Chi_Minh' });

  // 16:30 — exercise reminder
  cron.schedule('30 16 * * *', () => {
    enqueueDailyContent('EXERCISE').catch((e) => logger.error({ err: e }, 'exercise reminder enqueue failed'));
  }, { timezone: 'Asia/Ho_Chi_Minh' });

  // 18:00 thứ Sáu — Founder weekly note (chỉ thứ 6)
  cron.schedule('0 18 * * 5', () => {
    enqueueFounderWeekly().catch((e) => logger.error({ err: e }, 'founder weekly enqueue failed'));
  }, { timezone: 'Asia/Ho_Chi_Minh' });

  // 19:00 — missed-day (user hôm qua không check-in)
  cron.schedule('0 19 * * *', () => {
    enqueueMissedDay().catch((e) => logger.error({ err: e }, 'missed-day enqueue failed'));
  }, { timezone: 'Asia/Ho_Chi_Minh' });

  // 20:00 — evening check-in (web push + widget)
  cron.schedule('0 20 * * *', () => {
    enqueueEveningCheckin().catch((e) => logger.error({ err: e }, 'evening checkin enqueue failed'));
  }, { timezone: 'Asia/Ho_Chi_Minh' });

  // ─── Adaptive email funnel (state-based, pivot 2026-05-08) ─────────
  // Re-enabled Sprint 1 — đã fix TS errors. Cron chạy mỗi giờ ở phút 15.
  // YÊU CẦU: chạy `docker exec sol-widget-backend-1 npx prisma generate` trước
  // khi build để Prisma client biết model LapseEvent.
  cron.schedule('15 * * * *', () => {
    import('./emailFunnelAdaptive').then(m => m.runAdaptiveEmailFunnel())
      .catch((e) => logger.error({ err: e }, 'adaptive email funnel failed'));
  }, { timezone: 'Asia/Ho_Chi_Minh' });

  // 21:30 — night story
  cron.schedule('30 21 * * *', () => {
    enqueueDailyContent('NIGHT_STORY').catch((e) => logger.error({ err: e }, 'night story enqueue failed'));
  }, { timezone: 'Asia/Ho_Chi_Minh' });

  // ─── PHASE B — Q-Day push schedule ──────────────────────────────────
  // Day 26 sáng 7h — T-2 reminder
  cron.schedule('0 7 * * *', () => {
    enqueueQDayPushes('T_MINUS_2').catch((e) => logger.error({ err: e }, 'Q-Day T-2 enqueue failed'));
  }, { timezone: 'Asia/Ho_Chi_Minh' });

  // Day 27 tối 21h — T-1 evening Khang Sol message
  cron.schedule('0 21 * * *', () => {
    enqueueQDayPushes('T_MINUS_1_EVENING').catch((e) => logger.error({ err: e }, 'Q-Day T-1 enqueue failed'));
  }, { timezone: 'Asia/Ho_Chi_Minh' });

  // Day 28 sáng 7h — Q-Day morning
  cron.schedule('5 7 * * *', () => {
    // 7:05 (sau MORNING_GOAL 7:00 5 phút) để không trùng cùng giây
    enqueueQDayPushes('Q_DAY').catch((e) => logger.error({ err: e }, 'Q-Day enqueue failed'));
  }, { timezone: 'Asia/Ho_Chi_Minh' });

  // Every 30 min — crisis prep for users whose pattern matches
  cron.schedule('0,30 * * * *', () => {
    enqueueCrisisPrep().catch((e) => logger.error({ err: e }, 'crisis prep enqueue failed'));
  });

  // 8:00 sáng — Email funnel chunked promise ladder
  // Gửi 14 mail theo dayInJourney (Day 0, 4, 7, 12, 17, 21, 27, 28, 35,
  // 50, 75, 80, 86, 88). Idempotent qua notificationPrefs.emailFunnel.daysSent.
  // Yêu cầu user đã bind email + có quitDate + chưa opt-out.
  cron.schedule('0 8 * * *', () => {
    runEmailFunnelDaily().catch((e) => logger.error({ err: e }, 'emailFunnel daily failed'));
  }, { timezone: 'Asia/Ho_Chi_Minh' });

  // ── Phase 5: 51-Day Journey scheduler ─────────────────────────────────
  // Fire pending ScheduledPush mỗi 5 phút (nhanh nhạy với preferredPushHour
  // user chọn). Mỗi run query LIMIT 50 due-pending.
  cron.schedule('*/5 * * * *', () => {
    fireDuePushes().catch((e) => logger.error({ err: e }, 'fireDuePushes failed'));
  }, { timezone: 'Asia/Ho_Chi_Minh' });

  // Recompute currentJourneyDay cho user active (7:30 AM mỗi ngày)
  cron.schedule('30 7 * * *', () => {
    recomputeAllActiveUsers().catch((e) => logger.error({ err: e }, 'recomputeAllActiveUsers failed'));
  }, { timezone: 'Asia/Ho_Chi_Minh' });

  // Expire stale pending push (3 AM mỗi ngày — cleanup)
  cron.schedule('0 3 * * *', () => {
    expireStaleScheduledPushes().catch((e) => logger.error({ err: e }, 'expireStaleScheduledPushes failed'));
  }, { timezone: 'Asia/Ho_Chi_Minh' });

  // Sprint 2: Random tip high-craving hours (5 khung giờ VN: 7h30/10/13h30/16h30/21h)
  cron.schedule('30 7 * * *', () => {
    fireRandomTip().catch((e) => logger.error({ err: e }, 'fireRandomTip [sau-ca-phe] failed'));
  }, { timezone: 'Asia/Ho_Chi_Minh' });
  cron.schedule('0 10 * * *', () => {
    fireRandomTip().catch((e) => logger.error({ err: e }, 'fireRandomTip [giai-lao] failed'));
  }, { timezone: 'Asia/Ho_Chi_Minh' });
  cron.schedule('30 13 * * *', () => {
    fireRandomTip().catch((e: unknown) => logger.error({ err: e }, 'fireRandomTip [sau-com-trua] failed'));
  }, { timezone: 'Asia/Ho_Chi_Minh' });
  cron.schedule('30 16 * * *', () => {
    fireRandomTip().catch((e: unknown) => logger.error({ err: e }, 'fireRandomTip [cuoi-gio-lam] failed'));
  }, { timezone: 'Asia/Ho_Chi_Minh' });
  cron.schedule('0 21 * * *', () => {
    fireRandomTip().catch((e: unknown) => logger.error({ err: e }, 'fireRandomTip [toi-nhau] failed'));
  }, { timezone: 'Asia/Ho_Chi_Minh' });

  // Sprint 4: T-7 prep reminder cho user enrolled chưa confirm checklist (19:00)
  cron.schedule('0 19 * * *', () => {
    firePrepReminders().catch((e: unknown) => logger.error({ err: e }, 'firePrepReminders failed'));
  }, { timezone: 'Asia/Ho_Chi_Minh' });

  // Phase 5 final: Memory Book generator cho user đạt mốc D30/60/90/180/365 (8:00 mỗi ngày)
  cron.schedule('0 8 * * *', () => {
    generateMilestoneMemoryBooks()
      .then((r: unknown) => logger.info(r as object, 'Memory books generated'))
      .catch((e: unknown) => logger.error({ err: e }, 'generateMilestoneMemoryBooks failed'));
  }, { timezone: 'Asia/Ho_Chi_Minh' });

  logger.info('Scheduler started — 26 cron jobs active (Phase 5 final enabled)');
}

// FIXED 2026-05-21: Đã xóa auto-start `startScheduler();` ở cuối file.
// Trước đây gọi 2 lần: 1 lần ở đây + 1 lần trong index.ts line 133 → mỗi cron
// chạy 2× → double ZNS spend + double AI cost. Nay chỉ index.ts gọi 1 lần.
//
// Nếu chạy worker riêng (separate process), dùng:
//   tsx -e "import('./worker').then(m => m.startScheduler())"
// hoặc thêm `if (require.main === module) startScheduler();` ở dưới.
