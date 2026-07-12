/**
 * Notification service — Email cho Khang + Zalo helpers
 * File: /var/www/huongdi/backend/src/services/notification.ts
 *
 * NPM deps cần cài (nếu chưa có):
 *   npm install nodemailer
 *   npm install -D @types/nodemailer
 */

import nodemailer from 'nodemailer';
import { PrismaClient, Lead } from '@prisma/client';

const prisma = new PrismaClient();

const CONFIG = {
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'Sol Payment Bot <hello@sol.vn>',
  },
  adminEmail:      process.env.ADMIN_EMAIL || 'nguyendinhkhang@gmail.com',
  adminZaloPhone:  process.env.ADMIN_ZALO  || '0912727381',
};

function transporter() {
  return nodemailer.createTransport({
    host: CONFIG.smtp.host,
    port: CONFIG.smtp.port,
    secure: CONFIG.smtp.port === 465,
    auth: { user: CONFIG.smtp.user, pass: CONFIG.smtp.pass },
  });
}

async function sendEmail(
  to: string, subject: string, html: string
): Promise<{ status: 'sent'|'failed', error?: string }> {
  try {
    await transporter().sendMail({ from: CONFIG.smtp.from, to, subject, html });
    return { status: 'sent' };
  } catch (err: any) {
    return { status: 'failed', error: err.message };
  }
}

async function logNotification(
  leadId: number, channel: string, result: { status: string; error?: string }
) {
  await prisma.leadNotification.create({
    data: {
      leadId,
      channel: channel.toUpperCase() as any,
      status: result.status.toUpperCase() as any,
      errorMessage: result.error || null,
    },
  });
}

// ═══════════════════════════════════════════════
// Zalo helpers
// ═══════════════════════════════════════════════

export function makeZaloDeepLink(phone: string | null): string | null {
  if (!phone) return null;
  const clean = String(phone).replace(/[.\s-]/g, '');
  return `https://zalo.me/${clean}`;
}

export function makeZaloMessage(lead: Lead, magicLink: string): string {
  const goiLabel = lead.goi === 'FOUNDER' ? 'Founder trọn đời' : 'Active 1 năm';
  return `Chào anh/chị ${lead.ten},

Cảm ơn anh/chị đã tin tưởng Sol La Bàn. Em xác nhận đã nhận thanh toán cho gói ${goiLabel}.

Đây là link kích hoạt tài khoản của anh/chị:
${magicLink}

Chỉ cần click link → Sol sẽ tự động kích hoạt trong 3 giây. Sau đó anh/chị có thể vào huongdi.sol.vn để dùng đầy đủ 37 mô hình + 40 câu hỏi AI.

Nếu có gì khó khăn, anh/chị nhắn Zalo em bất cứ lúc nào.

Trân trọng,
Khang Sol · Founder Sol.vn`;
}

// ═══════════════════════════════════════════════
// notifyKhang khi có lead mới
// ═══════════════════════════════════════════════

export async function notifyKhang(lead: Lead) {
  const goiLabel   = lead.goi === 'FOUNDER' ? 'FOUNDER 1.999k' : 'ACTIVE 499k';
  const amountFmt  = lead.amount.toLocaleString('vi-VN') + 'đ';
  const zaloDeep   = makeZaloDeepLink(lead.zalo || lead.sdt);
  const adminUrl   = 'https://adminhuongdi.sol.vn/leads';

  const html = `
    <div style="font-family:Arial,sans-serif; max-width:600px; margin:0 auto;">
      <div style="background:linear-gradient(135deg,#F59E0B,#D97706); color:#fff; padding:20px; border-radius:12px 12px 0 0;">
        <h2 style="margin:0;">🔔 LEAD MỚI — ${goiLabel}</h2>
        <p style="margin:8px 0 0; font-size:20px; font-weight:700;">${amountFmt}</p>
      </div>
      <div style="background:#fff; padding:24px; border:1px solid #E5E7EB; border-top:none; border-radius:0 0 12px 12px;">
        <table style="width:100%; border-collapse:collapse;">
          <tr><td style="padding:8px 0; border-bottom:1px solid #F3F4F6;"><b>Tên</b></td><td>${lead.ten}</td></tr>
          <tr><td style="padding:8px 0; border-bottom:1px solid #F3F4F6;"><b>SĐT</b></td><td>${lead.sdt}</td></tr>
          <tr><td style="padding:8px 0; border-bottom:1px solid #F3F4F6;"><b>Email</b></td><td>${lead.email || '(không có)'}</td></tr>
          <tr><td style="padding:8px 0; border-bottom:1px solid #F3F4F6;"><b>Zalo</b></td><td><a href="${zaloDeep}">${lead.zalo || lead.sdt}</a> 💬</td></tr>
          <tr><td style="padding:8px 0;"><b>Gói</b></td><td>${goiLabel}</td></tr>
        </table>
        <div style="background:#FEF3C7; padding:14px; border-left:4px solid #F59E0B; margin:16px 0;">
          <b>Nội dung CK dự kiến:</b> <code style="background:#fff; padding:3px 8px;">SOL ${lead.sdt}</code>
        </div>
        <div style="text-align:center;">
          <a href="${adminUrl}" style="display:inline-block; background:#F59E0B; color:#fff; padding:14px 28px; border-radius:8px; text-decoration:none; font-weight:bold;">→ Vào Admin approve</a>
        </div>
      </div>
    </div>
  `;

  const result = await sendEmail(
    CONFIG.adminEmail,
    `[Sol] 🔔 Lead mới ${goiLabel} — ${lead.ten} (${lead.sdt})`,
    html
  );
  await logNotification(lead.id, 'email_khang', result);
  return result;
}

// ═══════════════════════════════════════════════
// sendMagicLinkToUser sau approve
// ═══════════════════════════════════════════════

export async function sendMagicLinkToUser(lead: Lead, magicLink: string) {
  const results: any = {};

  if (lead.email) {
    const html = `
      <div style="font-family:Arial,sans-serif; max-width:600px; margin:0 auto;">
        <div style="background:linear-gradient(135deg,#F59E0B,#D97706); color:#fff; padding:24px; border-radius:12px 12px 0 0; text-align:center;">
          <h1 style="margin:0; font-size:24px;">🎉 Chào ${lead.ten}!</h1>
        </div>
        <div style="background:#fff; padding:32px 24px; border:1px solid #E5E7EB; border-top:none; border-radius:0 0 12px 12px; text-align:center;">
          <p>Cảm ơn anh/chị đã tin tưởng Sol La Bàn. Nhấn nút bên dưới để kích hoạt:</p>
          <p style="margin:32px 0;">
            <a href="${magicLink}" style="display:inline-block; background:linear-gradient(135deg,#F59E0B,#D97706); color:#fff; padding:18px 48px; border-radius:12px; text-decoration:none; font-weight:bold; font-size:16px;">
              → Kích hoạt Sol Active
            </a>
          </p>
          <p style="font-size:13px; color:#6B7280;">
            Cần trợ giúp? <a href="https://zalo.me/0912727381">Chat Zalo Khang</a>
          </p>
        </div>
      </div>
    `;
    const r = await sendEmail(lead.email, '🎉 Kích hoạt Sol Active', html);
    await logNotification(lead.id, 'email_user', r);
    results.email = r;
  } else {
    results.email = { status: 'skipped', reason: 'no email' };
  }

  // Zalo manual info (Khang gửi thủ công)
  results.zalo_manual = {
    deep_link: makeZaloDeepLink(lead.zalo || lead.sdt),
    message:   makeZaloMessage(lead, magicLink),
  };
  await logNotification(lead.id, 'zalo_user', { status: 'sent' });

  return results;
}
