// backend/src/services/adminAlert.ts
//
// Multi-channel admin alert system — Sol v4 Phase 5 final (VN-optimized).
//
// Khi user trigger SOS critical/high, Sol push alert tới Khang qua:
//   Layer 1: Zalo OA → Khang Zalo cá nhân (primary, free, fastest)
//   Layer 2: Email → khang@sol.vn (backup, async, archive)
//   Layer 3: SMS Viettel (TODO Sprint 5, chỉ critical)
//
// Khang phải follow OA Sol bằng Zalo cá nhân → set env KHANG_ZALO_USER_ID.
// Email: dùng nodemailer infrastructure sẵn có (SMTP_HOST, SMTP_USER...).
//
// Setup env:
//   KHANG_ZALO_USER_ID=<zaloUserId of Khang cá nhân>
//   KHANG_ALERT_EMAIL=khang@sol.vn  (hoặc nhiều email, comma-separated)

import { logger } from '../utils/logger';
import { oaSendText } from '../zalo/oaClient';

export interface AdminAlertParams {
  alertId: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  userName: string;
  currentDay: number | null;
  triggerType: string;
  matchedKeyword?: string | null;
  userMessage?: string | null;
  triggeredAt: Date;
  adminDashboardUrl?: string;
}

/**
 * Send alert tới Khang qua tất cả channels khả dụng.
 * Layer 1: Zalo OA (primary)
 * Layer 2: Email (backup)
 * Layer 3: SMS critical (TODO)
 */
export async function sendAdminAlert(p: AdminAlertParams): Promise<{
  zalo: boolean;
  email: boolean;
  sms: boolean;
}> {
  const results = { zalo: false, email: false, sms: false };

  // ─── Layer 1: Zalo OA ────────────────────────────────────────────
  results.zalo = await sendZaloAdminAlert(p);

  // ─── Layer 2: Email ──────────────────────────────────────────────
  // Chỉ gửi email cho high/critical (medium/low quá nhiều noise)
  if (p.severity === 'critical' || p.severity === 'high') {
    results.email = await sendEmailAdminAlert(p);
  }

  // ─── Layer 3: SMS (TODO) ─────────────────────────────────────────
  if (p.severity === 'critical' && process.env.VIETTEL_SMS_API_KEY) {
    // results.sms = await sendSmsAdminAlert(p);
    logger.info('SMS layer not yet implemented (Sprint 5)');
  }

  logger.info(
    { alertId: p.alertId, severity: p.severity, ...results },
    'Admin alert dispatched',
  );
  return results;
}

/** Layer 1: Send alert qua Zalo OA tới Khang cá nhân */
async function sendZaloAdminAlert(p: AdminAlertParams): Promise<boolean> {
  const khangZaloId = process.env.KHANG_ZALO_USER_ID;
  if (!khangZaloId) {
    logger.debug('KHANG_ZALO_USER_ID chưa cấu hình — skip Zalo alert');
    return false;
  }

  const emoji = { critical: '🚨🚨🚨', high: '⚠️', medium: '⚡', low: 'ℹ️' }[p.severity];
  const severityLabel = p.severity.toUpperCase();
  const timeStr = p.triggeredAt.toLocaleTimeString('vi-VN', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh',
  });

  let text = `${emoji} SOS ${severityLabel}\n\n`;
  text += `User: ${p.userName}`;
  if (p.currentDay !== null && p.currentDay !== undefined) {
    text += ` (Day ${p.currentDay})`;
  }
  text += `\nLúc: ${timeStr}\n`;

  if (p.matchedKeyword) {
    text += `Keyword: "${p.matchedKeyword}"\n`;
  }
  if (p.userMessage) {
    const truncated = p.userMessage.slice(0, 150);
    text += `Tin: "${truncated}"\n`;
  }

  if (p.severity === 'critical') {
    text += `\n🆘 HÀNH ĐỘNG NGAY:\n`;
    text += `• Mở admin dashboard\n`;
    text += `• Liên hệ user trực tiếp\n`;
    text += `• Y tế khẩn → gợi 115`;
  }

  const buttons: Array<{ title: string; type: any; payload: any }> = [
    {
      title: 'Mở Admin',
      type: 'oa.open.url',
      payload: { url: p.adminDashboardUrl ?? 'http://localhost:5176/zalo-sos' },
    },
  ];

  if (p.severity === 'critical') {
    buttons.push({
      title: 'Gọi user',
      type: 'oa.open.phone',
      payload: { phone: '02439931800' },
    });
  }

  try {
    const result = await oaSendText({
      recipientId: khangZaloId,
      text,
      buttons,
    });
    if (result.ok) {
      logger.info({ alertId: p.alertId }, '✓ Admin alert sent via Zalo OA');
      return true;
    }
    logger.warn(
      { alertId: p.alertId, error: result.error },
      'Zalo admin alert failed (có thể out of 48h window)',
    );
    return false;
  } catch (err: any) {
    logger.error({ err, alertId: p.alertId }, 'Zalo admin alert exception');
    return false;
  }
}

/** Layer 2: Send alert qua Email tới Khang */
async function sendEmailAdminAlert(p: AdminAlertParams): Promise<boolean> {
  const recipientEmails = (process.env.KHANG_ALERT_EMAIL ?? '')
    .split(',').map((s) => s.trim()).filter(Boolean);
  if (recipientEmails.length === 0) {
    logger.debug('KHANG_ALERT_EMAIL chưa cấu hình — skip email alert');
    return false;
  }

  try {
    const { sendEmail } = await import('../auth/email/smtpClient');
    const severityColor = {
      critical: '#dc2626', high: '#f59e0b', medium: '#3b82f6', low: '#6b7280',
    }[p.severity];
    const severityIcon = {
      critical: '🚨🚨🚨', high: '⚠️', medium: '⚡', low: 'ℹ️',
    }[p.severity];

    const subject = `${severityIcon} [SOS ${p.severity.toUpperCase()}] ${p.userName} - ${p.triggerType}`;
    const adminUrl = p.adminDashboardUrl ?? 'http://localhost:5176/zalo-sos';

    const html = `
<!DOCTYPE html>
<html><body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#fafaf7;padding:24px;">
<div style="max-width:580px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;border:2px solid ${severityColor};">

<div style="background:${severityColor};color:white;padding:20px 24px;">
  <div style="font-size:24px;font-weight:900;">${severityIcon} SOS ${p.severity.toUpperCase()}</div>
  <div style="font-size:14px;opacity:.9;margin-top:4px;">Sol Crisis Alert · ${p.triggeredAt.toLocaleString('vi-VN')}</div>
</div>

<div style="padding:24px;">
  <h2 style="margin:0 0 12px;color:#2d2820;font-size:18px;">User: ${escapeHtml(p.userName)}${p.currentDay !== null ? ` (Day ${p.currentDay})` : ''}</h2>

  <table style="width:100%;border-collapse:collapse;font-size:14px;">
    <tr><td style="padding:6px 0;color:#5d4f3a;width:120px;">Trigger:</td><td><code style="background:#f5f0e3;padding:2px 6px;border-radius:4px;">${p.triggerType}</code></td></tr>
    ${p.matchedKeyword ? `<tr><td style="padding:6px 0;color:#5d4f3a;">Keyword:</td><td>"<strong>${escapeHtml(p.matchedKeyword)}</strong>"</td></tr>` : ''}
    ${p.userMessage ? `<tr><td style="padding:6px 0;color:#5d4f3a;vertical-align:top;">Tin user:</td><td><em>"${escapeHtml(p.userMessage)}"</em></td></tr>` : ''}
    <tr><td style="padding:6px 0;color:#5d4f3a;">Alert ID:</td><td><code style="font-size:11px;">${p.alertId}</code></td></tr>
  </table>

  ${p.severity === 'critical' ? `
  <div style="background:#fef2f2;border-left:4px solid ${severityColor};padding:16px;margin:20px 0;border-radius:0 6px 6px 0;">
    <strong>🆘 HÀNH ĐỘNG NGAY:</strong>
    <ul style="margin:8px 0 0 20px;padding:0;">
      <li>Mở admin dashboard → reply qua Zalo OA</li>
      <li>Nếu y tế khẩn → hướng dẫn user gọi 115</li>
      <li>Sau khi xử lý → click "Resolve"</li>
    </ul>
  </div>
  ` : ''}

  <div style="margin-top:24px;text-align:center;">
    <a href="${adminUrl}" style="display:inline-block;background:${severityColor};color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">
      📋 Mở Admin Dashboard
    </a>
  </div>

  <p style="margin-top:32px;font-size:12px;color:#8b8580;text-align:center;">
    Tin tự động từ Sol · Không reply email này · <a href="${adminUrl}" style="color:${severityColor};">View in browser</a>
  </p>
</div>
</div>
</body></html>`.trim();

    for (const email of recipientEmails) {
      await sendEmail({
        to: email,
        subject,
        html,
        text: `SOS ${p.severity.toUpperCase()} từ user ${p.userName}. Mở ${adminUrl}`,
      });
    }
    logger.info({ alertId: p.alertId, recipients: recipientEmails.length }, '✓ Admin alert sent via email');
    return true;
  } catch (err: any) {
    logger.error({ err, alertId: p.alertId }, 'Email admin alert exception');
    return false;
  }
}

/** Test alert — gửi tin test qua tất cả channels */
export async function sendAdminAlertTest(): Promise<{ zalo: boolean; email: boolean; sms: boolean }> {
  return sendAdminAlert({
    alertId: 'TEST_' + Date.now(),
    severity: 'critical',
    userName: 'Test User',
    currentDay: 3,
    triggerType: 'test',
    matchedKeyword: 'đau ngực dữ',
    userMessage: 'Đây là tin TEST từ Sol Admin Alert. Nếu anh nhận được, system hoạt động OK.',
    triggeredAt: new Date(),
    adminDashboardUrl: 'http://localhost:5176/zalo-sos',
  });
}

function escapeHtml(s: string | null | undefined): string {
  if (!s) return '';
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c),
  );
}
