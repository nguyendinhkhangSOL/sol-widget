// backend/src/scheduler/worker.ts
// Cron jobs:
//  - every minute: flush due Notification rows
//  - 20:00 local: enqueue evening check-in prompts for all active users
//  - 07:00 local: enqueue morning_goal content
//  - user-specific "crisis_prep" based on risky hours
//
// Run separately: `pnpm worker` or docker compose service.

import cron from 'node-cron';
import { prisma } from '../db';
import { computeDayNumber, isSameLocalDay } from '../utils/dayNumber';
import { sendWebPush } from '../notifications/webpush';
import { emitToUser } from '../socket/emitter';
import { logger } from '../utils/logger';
import { config } from '../config';
import { personalize, buildGreeting } from '../utils/personalize';

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
async function enqueueDailyContent(module: 'MORNING_GOAL' | 'SCIENCE_TIP' | 'PHENOMENA_ALERT' | 'EXERCISE_REMINDER' | 'NIGHT_STORY') {
  const users = await prisma.user.findMany({ where: { quitDate: { not: null } } });

  for (const user of users) {
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

    const existing = await prisma.notification.findFirst({
      where: {
        userId: user.id,
        type: module as any,
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
        type: module as any,
        title,
        body,
        wikiUrl: item.wikiUrl,
        ctaLabel: item.wikiUrl ? 'Đọc sâu' : null,
        ctaAction: item.wikiUrl ?? null,
        channels: ['IN_WIDGET'],
        scheduledAt: new Date(),
        metadata: { dayNumber: day, module },
      },
    });
  }
}

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
    };
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'EVENING_CHECKIN',
        title: buildGreeting('evening', pCtx),
        body:
          user.pronouns === 'bạn'
            ? `Ngày ${day} — 30 giây thôi nhé. Mình chờ bạn.`
            : `Ngày ${day} — 30 giây thôi ${user.pronouns} ơi. Mình chờ ${user.pronouns}.`,
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

// ─── Boot ──────────────────────────────────────────────────────────────────

export function startScheduler() {
  if (!config.features.scheduler) {
    logger.info('Scheduler disabled (ENABLE_SCHEDULER=false)');
    return;
  }

  // Every minute — deliver due notifications.
  cron.schedule('* * * * *', () => {
    deliverDueNotifications().catch((e) => logger.error({ err: e }, 'deliverDueNotifications failed'));
  });

  // 07:00 Asia/Ho_Chi_Minh — morning goal
  cron.schedule('0 7 * * *', () => {
    enqueueDailyContent('MORNING_GOAL').catch((e) => logger.error({ err: e }, 'morning goal enqueue failed'));
  }, { timezone: 'Asia/Ho_Chi_Minh' });

  // 10:00 — science tip
  cron.schedule('0 10 * * *', () => {
    enqueueDailyContent('SCIENCE_TIP').catch((e) => logger.error({ err: e }, 'science tip enqueue failed'));
  }, { timezone: 'Asia/Ho_Chi_Minh' });

  // 14:00 — phenomena alert (only on days that have one)
  cron.schedule('0 14 * * *', () => {
    enqueueDailyContent('PHENOMENA_ALERT').catch((e) => logger.error({ err: e }, 'phenomena enqueue failed'));
  }, { timezone: 'Asia/Ho_Chi_Minh' });

  // 16:30 — exercise reminder
  cron.schedule('30 16 * * *', () => {
    enqueueDailyContent('EXERCISE_REMINDER').catch((e) => logger.error({ err: e }, 'exercise reminder enqueue failed'));
  }, { timezone: 'Asia/Ho_Chi_Minh' });

  // 20:00 — evening check-in (web push + widget)
  cron.schedule('0 20 * * *', () => {
    enqueueEveningCheckin().catch((e) => logger.error({ err: e }, 'evening checkin enqueue failed'));
  }, { timezone: 'Asia/Ho_Chi_Minh' });

  // 21:30 — night story
  cron.schedule('30 21 * * *', () => {
    enqueueDailyContent('NIGHT_STORY').catch((e) => logger.error({ err: e }, 'night story enqueue failed'));
  }, { timezone: 'Asia/Ho_Chi_Minh' });

  // Every 30 min — crisis prep for users whose pattern matches
  cron.schedule('0,30 * * * *', () => {
    enqueueCrisisPrep().catch((e) => logger.error({ err: e }, 'crisis prep enqueue failed'));
  });

  logger.info('Scheduler started — 7 cron jobs active');
}
