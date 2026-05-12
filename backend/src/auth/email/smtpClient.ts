// backend/src/auth/email/smtpClient.ts
// SMTP client cho email magic link auth.
//
// Provider: Zoho Mail (smtp.zoho.com:465 SSL).
// Env vars cần (backend/.env):
//   SMTP_HOST          smtp.zoho.com
//   SMTP_PORT          465
//   SMTP_SECURE        true (SSL/TLS direct, không STARTTLS)
//   SMTP_USER          noreply@sol.vn (full email)
//   SMTP_PASSWORD      app password Zoho (không phải password thật — tạo qua Zoho settings)
//   EMAIL_FROM         "Sol <noreply@sol.vn>" hoặc just "noreply@sol.vn"
//   EMAIL_REPLY_TO     khang@sol.vn (founder reply, optional)
//   APP_URL            https://bothuocla.sol.vn (cho magic link CTA)

import nodemailer, { Transporter } from 'nodemailer';
import { logger } from '../../utils/logger';

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST || 'smtp.zoho.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = (process.env.SMTP_SECURE || 'true') === 'true';
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
    // Zoho rate limit: 50 emails/connection. Reuse connection conservatively.
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
    const from = process.env.EMAIL_FROM || 'Sol <noreply@sol.vn>';
    const replyTo = process.env.EMAIL_REPLY_TO || undefined;

    const info = await t.sendMail({
      from,
      to,
      replyTo,
      subject,
      text,
      html,
      // FIX (Sol v3): force UTF-8 base64 encoding cho text/html parts.
      // Lý do: 1 số SMTP relay (kể cả Zoho) strip accent tiếng Việt
      // trong phần text/plain nếu encoding không explicit → "bạn" → "b???n".
      // Base64 đảm bảo bytes nguyên vẹn end-to-end.
      textEncoding: 'base64',
      encoding: 'utf-8',
      // Headers cho deliverability + anti-abuse
      headers: {
        'X-Mailer': 'Sol-Companion',
        'List-Unsubscribe': '<mailto:khang@sol.vn?subject=unsubscribe>',
        'Content-Type': 'text/html; charset=UTF-8',
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
