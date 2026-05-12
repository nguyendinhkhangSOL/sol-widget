/**
 * Email Funnel Adaptive — State-based, không tied vào Day timeline cố định.
 *
 * Pivot 2026-05-08: thay vì gửi email theo dayInJourney cứng, gửi theo
 * USER STATE thật. Match tagline "Đi cùng Sol — Bỏ thuốc lá khi nào anh quyết".
 *
 * 7 trigger:
 *   1. QUICK_WIN_DAY3       — user joined ≥3 ngày + đã log baseline → báo cáo Quick Win
 *   2. REPORT_DAY7          — user joined ≥7 ngày + đã log đủ → báo cáo Day 7 + invite Sol Start
 *   3. SOL_START_DAY14      — user paid Sol Start + 14 ngày sau → báo cáo + invite Sol Control
 *   4. Q_DAY_PREP           — user pick Q-Day, 3 ngày trước → prep checklist
 *   5. Q_DAY_MORNING        — Q-Day morning (6h sáng) → voice Khang
 *   6. LAPSE_COMPASSION     — user log lapse, sau 4h chưa quay lại → "Khang nhắn anh"
 *   7. CLEAN_30_DAYS        — user đạt 30 ngày sạch → milestone celebrate
 *
 * Idempotent qua field User.settings.adaptiveEmailsSent: string[] (trigger names).
 *
 * Run: Cron mỗi giờ (16 jobs/24h scheduler).
 */

import { logger } from '../utils/logger';
import { prisma } from '../db';
import { sendEmail } from '../auth/email/smtpClient';

// ─── Templates state-based ─────────────────────────────────────────────
interface AdaptiveEmailTemplate {
  trigger: string;
  subject: (ctx: TemplateCtx) => string;
  htmlBody: (ctx: TemplateCtx) => string;
}

interface TemplateCtx {
  pronoun: string;
  Pronoun: string;
  appUrl: string;
  data?: Record<string, any>;
}

const ADAPTIVE_TEMPLATES: AdaptiveEmailTemplate[] = [
  // ─── 1. QUICK WIN DAY 3 — báo cáo cá nhân tự động ─────────────────────
  {
    trigger: 'QUICK_WIN_DAY3',
    subject: () => 'Báo cáo 3 ngày của anh đã sẵn',
    htmlBody: (ctx) => `
<p>Khang ơi —</p>
<p>3 ngày anh đã quan sát. Báo cáo của anh:</p>
<ul>
  <li>Trung bình <strong>${ctx.data?.avgPerDay ?? 'X'} điếu/ngày</strong></li>
  <li>Top trigger: <strong>${ctx.data?.topTrigger ?? 'sau cà phê'}</strong></li>
  <li>Khoảnh khắc tổn thương nhất: <strong>${ctx.data?.vulnerableHour ?? '21h-23h'}</strong></li>
</ul>
<p>Lần đầu sau 25 năm anh nhìn rõ chính mình.</p>
<p style="margin-top: 24px;">
  <a href="${ctx.appUrl}" style="display: inline-block; background: #B25C2C; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Mở app xem báo cáo đầy đủ</a>
</p>
<p style="margin-top: 24px; color: #5A5650;">Anh quyết — Sol đợi.<br>— Khang Sol</p>
    `,
  },

  // ─── 2. REPORT DAY 7 — báo cáo + invite Sol Start ─────────────────────
  {
    trigger: 'REPORT_DAY7',
    subject: () => 'Hết 7 ngày Sol Khám Phá — anh quyết tiếp gì',
    htmlBody: (ctx) => `
<p>Khang ơi —</p>
<p>7 ngày anh đã quan sát. Báo cáo đầy đủ đã sẵn trong app.</p>
<p>Nếu anh muốn đi tiếp <strong>14 ngày bẻ phản xạ tự động</strong> — Sol Start <strong>99k</strong> chờ anh.</p>
<p>Đa số anh em đi qua Sol Start:</p>
<ul>
  <li>Giảm 20-40% hút vô thức</li>
  <li>Delay được cơn thèm 5-15 phút</li>
  <li>Bẻ 2-3 thói quen tự động</li>
</ul>
<p>Không thấy giá trị → trả 99k. Không hỏi.</p>
<p style="margin-top: 24px;">
  <a href="${ctx.appUrl}/pricing" style="display: inline-block; background: #B25C2C; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Thử Sol Start — 99k</a>
</p>
<p style="margin-top: 12px;">
  <a href="${ctx.appUrl}" style="color: #8A857C; text-decoration: none;">Hoặc tiếp tục Sol Khám Phá miễn phí</a>
</p>
<p style="margin-top: 24px; color: #5A5650;">Anh quyết — Sol đợi.<br>— Khang Sol</p>
    `,
  },

  // ─── 3. SOL START DAY 14 — báo cáo + invite Sol Control ───────────────
  {
    trigger: 'SOL_START_DAY14',
    subject: () => '14 ngày Sol Start kết thúc — anh đi tiếp?',
    htmlBody: (ctx) => `
<p>Khang ơi —</p>
<p>14 ngày Sol Start của anh kết thúc. Báo cáo đầy đủ đã sẵn — Control Score của anh đã tăng.</p>
<p>Bây giờ Sol Control <strong>99k/tháng</strong> — đồng hành dài hơn:</p>
<ul>
  <li>Q-Day chính thức — anh chọn ngày</li>
  <li>Voice Khang mỗi tuần</li>
  <li>Lapse-recovery 24h khi anh hút lại</li>
  <li>Mục tiêu 30 ngày sạch liên tiếp</li>
</ul>
<p>Hủy bất kỳ tháng nào. Tháng đầu không thấy giá trị → trả 99k. Không hỏi.</p>
<p style="margin-top: 24px;">
  <a href="${ctx.appUrl}/pricing" style="display: inline-block; background: #B25C2C; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Sol đi cùng anh — 99k/tháng</a>
</p>
<p style="margin-top: 24px; color: #5A5650;">Anh quyết — Sol đợi.<br>— Khang Sol</p>
    `,
  },

  // ─── 4. Q-DAY PREP — 3 ngày trước Q-Day ───────────────────────────────
  {
    trigger: 'Q_DAY_PREP',
    subject: () => 'Q-Day của anh — 3 ngày nữa',
    htmlBody: (ctx) => `
<p>Khang ơi —</p>
<p>Q-Day anh chọn còn 3 ngày nữa. Đây là 3 việc nhỏ chuẩn bị:</p>
<ul>
  <li>Viết Plan B cho 5 trigger lớn nhất (Workbook tab)</li>
  <li>Nói với 1 người trong nhà về quyết định của anh</li>
  <li>Đặt 1 chai nước trên bàn — trigger để uống thay điếu</li>
</ul>
<p>Sáng Q-Day, mở app — voice Khang sẽ đợi anh ở đó.</p>
<p style="margin-top: 24px;">
  <a href="${ctx.appUrl}/journey" style="display: inline-block; background: #B25C2C; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Mở Workbook chuẩn bị</a>
</p>
<p style="margin-top: 24px; color: #5A5650;">Mình ngồi với anh từ trước.<br>— Khang Sol</p>
    `,
  },

  // ─── 5. Q-DAY MORNING — sáng ngày Q-Day ────────────────────────────────
  {
    trigger: 'Q_DAY_MORNING',
    subject: () => 'Hôm nay là ngày anh chọn',
    htmlBody: (ctx) => `
<p>Khang ơi —</p>
<p>Hôm nay là ngày anh chọn. Mình không nói chúc may mắn. Mình ngồi đây với anh.</p>
<p>Day 1 sẽ khó. Đêm nay anh sẽ thèm. Khi đó, mở app — voice Khang đã sẵn.</p>
<p>Anh đợi 90 giây cùng tôi mỗi lần thèm — Crisis Timer trong app.</p>
<p>Một điếu không phải fail. Anh quay lại lúc nào cũng được.</p>
<p style="margin-top: 24px;">
  <a href="${ctx.appUrl}" style="display: inline-block; background: #B25C2C; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 700;">Mở app — bắt đầu Day 1</a>
</p>
<p style="margin-top: 24px; color: #5A5650;">Tôi không đi đâu cả. Anh quyết — tôi đợi.<br>— Khang Sol</p>
    `,
  },

  // ─── 6. LAPSE COMPASSION — sau lapse 4h chưa quay lại ─────────────────
  {
    trigger: 'LAPSE_COMPASSION',
    subject: () => 'Hôm qua khó. Hôm nay sao em?',
    htmlBody: (ctx) => `
<p>Khang đây.</p>
<p>Hôm qua anh hút lại. Mình thấy. Không phán xét gì cả.</p>
<p>Một đêm không phải fail. Đó là life. Mình cũng đã ở đó.</p>
<p>Mở app cũng được. Không mở cũng được. Tôi vẫn ở đây.</p>
<p>Khi anh sẵn sàng — Sol KHÔNG reset gì cả. Anh tiếp tục từ chỗ anh đang ở.</p>
<p style="margin-top: 24px;">
  <a href="${ctx.appUrl}" style="display: inline-block; background: #B25C2C; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Mở app khi anh sẵn sàng</a>
</p>
<p style="margin-top: 24px; color: #5A5650;">Một điếu không phải fail.<br>— Khang</p>
    `,
  },

  // ─── 7. CLEAN 30 DAYS — milestone 30 ngày sạch ─────────────────────────
  {
    trigger: 'CLEAN_30_DAYS',
    subject: () => '30 ngày sạch — mình thấy anh rồi',
    htmlBody: (ctx) => `
<p>Khang ơi —</p>
<p>Anh đã sạch 30 ngày. Mình thấy anh rồi.</p>
<p>Đây không phải đỉnh — là đoạn dốc anh đã qua. Đoạn sau dễ hơn. Nhưng mình vẫn ở đây.</p>
<p>Anh đã làm điều mà 95% anh em hút 30 năm không làm được.</p>
<p>Nếu anh muốn — anh có thể viết 1 confession trong Khoảng Lặng. Không cần tên. Không cần kể nhiều. Chỉ một câu cho anh em sau.</p>
<p style="margin-top: 24px;">
  <a href="${ctx.appUrl}/doc" style="display: inline-block; background: #B25C2C; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Viết Khoảng Lặng</a>
</p>
<p style="margin-top: 24px; color: #5A5650;">Tôi tự hào về anh.<br>— Khang Sol</p>
    `,
  },
];

// ─── State detector — check users phù hợp với trigger nào ──────────────

interface UserSettings {
  adaptiveEmailsSent?: string[];
  workbook?: any;
  [key: string]: any;
}

async function getSentTriggers(userId: string): Promise<string[]> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { settings: true },
  });
  const settings = (u?.settings as UserSettings) ?? {};
  return settings.adaptiveEmailsSent ?? [];
}

async function markTriggerSent(userId: string, trigger: string) {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { settings: true },
  });
  const settings: UserSettings = (u?.settings as UserSettings) ?? {};
  const sent = new Set(settings.adaptiveEmailsSent ?? []);
  sent.add(trigger);
  await prisma.user.update({
    where: { id: userId },
    data: {
      settings: { ...settings, adaptiveEmailsSent: Array.from(sent) },
    },
  });
}

// ─── Main runner — chạy mỗi giờ ────────────────────────────────────────

export async function runAdaptiveEmailFunnel() {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Trigger 1: QUICK_WIN_DAY3
  await runTrigger1QuickWinDay3(threeDaysAgo);

  // Trigger 2: REPORT_DAY7
  await runTrigger2ReportDay7(sevenDaysAgo);

  // Trigger 6: LAPSE_COMPASSION (sau lapse 4h chưa quay lại)
  const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
  await runTrigger6LapseCompassion(fourHoursAgo, oneDayAgo);

  // (Trigger 3, 4, 5, 7 cần state thêm — defer cho version sau khi có data thật)
}

async function runTrigger1QuickWinDay3(threshold: Date) {
  const users = await prisma.user.findMany({
    where: {
      createdAt: { lte: threshold },
      email: { not: null },
    },
    select: { id: true, email: true, pronouns: true, settings: true, createdAt: true },
    take: 100, // batch
  });

  for (const u of users) {
    if (!u.email) continue;
    const sent = ((u.settings as UserSettings)?.adaptiveEmailsSent ?? []) as string[];
    if (sent.includes('QUICK_WIN_DAY3')) continue;

    // Check user has logged at least 3 cigarettes (proof they're engaged)
    const logCount = await prisma.cigaretteLog.count({
      where: { userId: u.id },
    });
    if (logCount < 3) continue;

    // Compute report data
    const logs = await prisma.cigaretteLog.findMany({
      where: { userId: u.id },
      select: { smokedAt: true, trigger: true },
      take: 100,
    });

    const avgPerDay = Math.round(logs.length / 3);
    const triggerCounts: Record<string, number> = {};
    logs.forEach((l) => {
      const t = l.trigger || 'unknown';
      triggerCounts[t] = (triggerCounts[t] || 0) + 1;
    });
    const topTrigger = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

    const vulnerableHours: Record<number, number> = {};
    logs.forEach((l) => {
      const h = l.smokedAt.getHours();
      vulnerableHours[h] = (vulnerableHours[h] || 0) + 1;
    });
    const topHour = Object.entries(vulnerableHours).sort((a, b) => b[1] - a[1])[0]?.[0];
    const vulnerableHour = topHour ? `${topHour}h-${parseInt(topHour) + 1}h` : null;

    await sendAdaptiveEmail(
      u.id,
      u.email,
      'QUICK_WIN_DAY3',
      {
        pronoun: u.pronouns,
        Pronoun: u.pronouns.charAt(0).toUpperCase() + u.pronouns.slice(1),
        appUrl: process.env.APP_URL ?? 'http://localhost:5174',
        data: { avgPerDay, topTrigger, vulnerableHour },
      },
    );
  }
}

async function runTrigger2ReportDay7(threshold: Date) {
  const users = await prisma.user.findMany({
    where: {
      createdAt: { lte: threshold },
      email: { not: null },
      tier: 'FREE', // chỉ FREE — paid user đã ở Sol Start/Control
    },
    select: { id: true, email: true, pronouns: true, settings: true },
    take: 100,
  });

  for (const u of users) {
    if (!u.email) continue;
    const sent = ((u.settings as UserSettings)?.adaptiveEmailsSent ?? []) as string[];
    if (sent.includes('REPORT_DAY7')) continue;

    await sendAdaptiveEmail(u.id, u.email, 'REPORT_DAY7', {
      pronoun: u.pronouns,
      Pronoun: u.pronouns.charAt(0).toUpperCase() + u.pronouns.slice(1),
      appUrl: process.env.APP_URL ?? 'http://localhost:5174',
    });
  }
}

async function runTrigger6LapseCompassion(fourHoursAgo: Date, oneDayAgo: Date) {
  // Find lapses 4-24h ago, user chưa recovery
  const lapses = await prisma.lapseEvent.findMany({
    where: {
      lapsedAt: { gte: oneDayAgo, lte: fourHoursAgo },
      recoveredAt: null,
    },
    include: {
      user: {
        select: { id: true, email: true, pronouns: true, settings: true },
      },
    },
    take: 100,
  });

  for (const l of lapses) {
    if (!l.user.email) continue;
    // Use lapse ID as unique key per lapse
    const key = `LAPSE_COMPASSION_${l.id}`;
    const sent = ((l.user.settings as UserSettings)?.adaptiveEmailsSent ?? []) as string[];
    if (sent.includes(key)) continue;

    await sendAdaptiveEmail(l.user.id, l.user.email, 'LAPSE_COMPASSION', {
      pronoun: l.user.pronouns,
      Pronoun: l.user.pronouns.charAt(0).toUpperCase() + l.user.pronouns.slice(1),
      appUrl: process.env.APP_URL ?? 'http://localhost:5174',
    });

    // Mark with lapse-specific key
    await markTriggerSent(l.user.id, key);
  }
}

async function sendAdaptiveEmail(
  userId: string,
  email: string,
  triggerName: string,
  ctx: TemplateCtx,
) {
  const tpl = ADAPTIVE_TEMPLATES.find((t) => t.trigger === triggerName);
  if (!tpl) {
    logger.warn({ userId, triggerName }, 'adaptiveEmail template not found');
    return;
  }

  try {
    const subject = tpl.subject(ctx);
    const html = tpl.htmlBody(ctx);
    // Plain text fallback — strip HTML tags + decode entities
    const text = html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim();

    const result = await sendEmail({
      to: email,
      subject,
      html,
      text,
    });

    if (result.error) {
      logger.warn({ userId, triggerName, error: result.error }, 'adaptiveEmail send failed');
      return;
    }

    await markTriggerSent(userId, triggerName);
    logger.info({ userId, triggerName, subject }, 'adaptiveEmail sent');
  } catch (err) {
    logger.error({ err, userId, triggerName }, 'adaptiveEmail exception');
  }
}
