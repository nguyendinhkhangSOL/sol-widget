// backend/src/auth/email/smtpClient.ts
// SMTP client cho email magic link auth.
//
// Provider hiện tại: Brevo (smtp-relay.brevo.com:587 STARTTLS).
// Env vars cần (backend/.env):
//   SMTP_HOST          smtp-relay.brevo.com
//   SMTP_PORT          587
//   SMTP_SECURE        false  (STARTTLS, KHÔNG SSL direct)
//   SMTP_USER          <id>@smtp-brevo.com (login của Brevo, KHÔNG phải khang@sol.vn)
//   SMTP_PASSWORD      SMTP key Brevo (32 chars)
//   EMAIL_FROM         "Đi Cùng Sol <khang@sol.vn>"
//   EMAIL_REPLY_TO     khang@sol.vn (optional)
//   APP_URL            https://bothuocla.sol.vn (cho magic link CTA)

import nodemailer, { Transporter } from 'nodemailer';
import { logger } from '../../utils/logger';

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = (process.env.SMTP_SECURE || 'false') === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!user || !pass) {
    logger.warn('SMTP credentials missing — email auth disabled');
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
    // Brevo free: 300 mail/ngày, rate limit nhẹ. Pool conservative.
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
  });

  return transporter;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  try {
    const t = getTransporter();
    const from = process.env.EMAIL_FROM || 'Đi Cùng Sol <khang@sol.vn>';
    const replyTo = process.env.EMAIL_REPLY_TO || undefined;

    // FIX (Sol v5, 22-5-2026): gửi CHỈ html, KHÔNG có text part.
    // Lý do: Brevo/nodemailer khi có cả text+html sinh multipart/alternative
    // → bug Content-Type bị strip ở đâu đó → Gmail thấy raw base64.
    // Single-part text/html = không multipart boundary nào → không lỗi parse.
    // Trade-off: mất accessibility với text-only client (rất hiếm 2026).
    //
    // text param vẫn nhận để giữ API contract (caller pass thoải mái),
    // nhưng KHÔNG forward vào sendMail.
    void text;

    const info = await t.sendMail({
      from,
      to,
      replyTo,
      subject,
      html,
      // Quoted-printable: UTF-8 readable, ít edge case hơn base64.
      textEncoding: 'quoted-printable',
      // Headers cho deliverability + anti-abuse (KHÔNG set Content-Type —
      // để nodemailer tự gen 'text/html; charset=utf-8').
      headers: {
        'X-Mailer': 'Sol-Companion',
        'List-Unsubscribe': '<mailto:khang@sol.vn?subject=unsubscribe>',
      },
    });

    logger.info({ to, messageId: info.messageId }, 'email sent');
    return { ok: true, messageId: info.messageId };
  } catch (err: any) {
    logger.error({ err, to }, 'email send failed');
    return { ok: false, error: err?.message ?? 'unknown' };
  }
}

/** Verify SMTP connection on startup (optional health check). */
export async function verifySmtpConnection(): Promise<boolean> {
  try {
    const t = getTransporter();
    await t.verify();
    logger.info('SMTP connection OK');
    return true;
  } catch (err: any) {
    logger.warn({ err: err?.message }, 'SMTP verify failed — email auth may not work');
    return false;
  }
}
