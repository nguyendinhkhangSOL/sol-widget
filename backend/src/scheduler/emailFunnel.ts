// backend/src/scheduler/emailFunnel.ts
//
// Email funnel — Sol v3 schedule (12-05-2026).
//
// Cron daily 8:00 AM gửi mail theo dayInJourney + idempotent qua
// notificationPrefs.emailFunnel.daysSent[]. Mỗi user nhận tối đa 12 mail
// trong 52 ngày, theo 4 chặng (Nhận Diện → Kiểm Soát → Làm Chủ → Người Tự Do).
// Schedule: Day 0/4/7 (Nhận Diện) · 11/17/21 (Kiểm Soát) · 22/30/40/45/51/52
// (Làm Chủ → Tốt nghiệp).
//
// Trigger condition:
//   1. user.email != null (đã bind qua Email Magic Link)
//   2. user.quitDate != null (đã onboard)
//   3. notificationPrefs.emailFunnel.optOut !== true
//   4. dayInJourney khớp với schedule
//   5. dayInJourney CHƯA có trong daysSent (idempotent)
//
// Templates: voice mix Khang Sol (founder cá nhân) + Sol Đồng hành
// (giáo dục nhẹ). KHÔNG dùng Sol generic AI tone.
//
// Test: chạy `node dist/scripts/runEmailFunnel.js --day=7 --dryRun`

import { prisma } from '../db';
import { computeDayNumber } from '../utils/dayNumber';
import { logger } from '../utils/logger';
import { sendEmail } from '../auth/email/smtpClient';
import { EMAIL_FUNNEL_TEMPLATES, type EmailFunnelTemplate } from './emailFunnelTemplates';

/** Render template với pronoun + name của user. */
function renderTemplate(
  tpl: EmailFunnelTemplate,
  user: { name: string; pronouns: string; email: string },
): { subject: string; html: string; text: string } {
  const pronoun = user.pronouns || 'anh';
  const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

  const replace = (s: string) =>
    s
      .replace(/\{pronoun\}/g, pronoun)
      .replace(/\{Pronoun\}/g, cap(pronoun))
      .replace(/\{name\}/g, user.name || pronoun)
      .replace(/\{appUrl\}/g, process.env.APP_URL || 'https://bothuocla.sol.vn');

  return {
    subject: replace(tpl.subject),
    html: wrapHtml(replace(tpl.htmlBody), pronoun),
    text: replace(tpl.textBody),
  };
}

/** Wrap content với HTML shell brand-consistent. */
function wrapHtml(body: string, pronoun: string): string {
  const cap = pronoun.charAt(0).toUpperCase() + pronoun.slice(1);
  return `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><title>Sol</title></head>
<body style="font-family: 'Be Vietnam Pro', Arial, sans-serif; background: #FBF7F0; padding: 24px; color: #2C2A27; line-height: 1.7;">
  <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
    <div style="background: linear-gradient(135deg, #B25C2C 0%, #B8860B 100%); padding: 20px 24px; color: white;">
      <div style="font-size: 12px; letter-spacing: 1px; opacity: 0.85; text-transform: uppercase;">Đi Cùng Sol</div>
      <div style="font-size: 18px; font-weight: 700; margin-top: 4px;">Khang gửi ${cap}</div>
    </div>
    <div style="padding: 24px;">
      ${body}
    </div>
    <div style="padding: 16px 24px; border-top: 1px solid #E8DFC8; font-size: 11px; color: #8B6914; background: #FFF4EA;">
      Sol — Sống Lại · Làm Lại Tốt Hơn · <a href="https://bothuocla.sol.vn" style="color: #B25C2C;">bothuocla.sol.vn</a><br>
      Không muốn nhận mail nữa? <a href="mailto:khang@sol.vn?subject=unsubscribe" style="color: #8B6914;">Reply để Sol dừng.</a>
    </div>
  </div>
</body>
</html>`;
}

/** Cron entry — gọi từ worker.ts cron 8:00 AM mỗi ngày. */
export async function runEmailFunnelDaily(): Promise<void> {
  logger.info('emailFunnel: tick start');

  // Query active users với email + quitDate
  const users = await prisma.user.findMany({
    where: {
      email: { not: null },
      quitDate: { not: null },
      exitedAt: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      pronouns: true,
      quitDate: true,
      notificationPrefs: true,
    },
  });

  let sent = 0;
  let skipped = 0;
  let errors = 0;

  for (const u of users) {
    if (!u.email || !u.quitDate) continue;

    const prefs = (u.notificationPrefs as any) ?? {};
    if (prefs.emailFunnel?.optOut === true) {
      skipped++;
      continue;
    }

    const dayInJourney = computeDayNumber(u.quitDate);
    const tpl = EMAIL_FUNNEL_TEMPLATES.find((t) => t.day === dayInJourney);
    if (!tpl) continue; // Day không có mail trong funnel

    const daysSent: number[] = prefs.emailFunnel?.daysSent ?? [];
    if (daysSent.includes(dayInJourney)) {
      skipped++;
      continue; // Idempotent — đã gửi
    }

    try {
      const rendered = renderTemplate(tpl, {
        name: u.name,
        pronouns: u.pronouns,
        email: u.email,
      });

      const result = await sendEmail({
        to: u.email,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      });

      if (!result.ok) {
        errors++;
        logger.warn({ userId: u.id, day: dayInJourney, error: result.error }, 'emailFunnel send failed');
        continue;
      }

      // Mark sent — append vào daysSent array
      const nextPrefs = {
        ...prefs,
        emailFunnel: {
          ...(prefs.emailFunnel ?? {}),
          daysSent: [...daysSent, dayInJourney],
          lastSentAt: new Date().toISOString(),
        },
      };

      await prisma.user.update({
        where: { id: u.id },
        data: { notificationPrefs: nextPrefs },
      });

      sent++;
      logger.info({ userId: u.id, day: dayInJourney, subject: rendered.subject }, 'emailFunnel sent');
    } catch (err: any) {
      errors++;
      logger.error({ err, userId: u.id, day: dayInJourney }, 'emailFunnel exception');
    }
  }

  logger.info({ sent, skipped, errors, total: users.length }, 'emailFunnel: tick done');
}
