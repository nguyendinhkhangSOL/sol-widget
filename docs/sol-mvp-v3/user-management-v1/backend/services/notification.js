/**
 * Notification service — PHASE 1 (Zalo cá nhân Khang)
 * ═════════════════════════════════════════════════════════════
 * Không dùng Telegram/Zalo OA ở phase này.
 *
 * FLOW PHASE 1:
 *   1. User submit form → Backend save DB
 *   2. Backend gửi Email cho Khang (immediate, chi tiết đầy đủ)
 *   3. Backend gửi SMS OTP cho Khang (optional, real-time push)
 *   4. Web Push notification tới Admin browser (nếu đang mở)
 *   5. Khang mở Admin → xem lead → approve
 *   6. Admin panel cung cấp 3 công cụ:
 *      - Copy magic link
 *      - Deep-link mở Zalo Web với user (zalo.me/PHONE)
 *      - Copy tin nhắn mẫu (pre-formatted) → Khang paste vào Zalo
 *   7. Khang mở Zalo app/web → paste tin → gửi thủ công cho user
 *
 * PHASE 2 (sau):
 *   - Setup Zalo Official Account (ZOA)
 *   - Tự động gửi magic link qua ZNS/OA message → user
 *   - Khang chỉ cần approve, không cần copy-paste
 */

const https = require('https');

const CONFIG = {
  smtp: {
    host:     process.env.SMTP_HOST || 'smtp.gmail.com',
    port:     parseInt(process.env.SMTP_PORT || '587'),
    user:     process.env.SMTP_USER || 'hello@sol.vn',
    pass:     process.env.SMTP_PASS || '',
    fromName: 'Sol Payment Bot'
  },
  adminEmail: process.env.ADMIN_EMAIL || 'nguyendinhkhang@gmail.com',
  adminZaloPhone: process.env.ADMIN_ZALO || '0912727381',
  smsGateway: {
    // Optional — Vietnamese SMS gateway (Speedsms, Esms, VietGuys)
    enabled:  !!process.env.SMS_API_KEY,
    apiKey:   process.env.SMS_API_KEY || '',
    phone:    process.env.ADMIN_SMS_PHONE || '0912727381'
  }
};

// ═══════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════

/**
 * Tạo deep-link Zalo — click sẽ mở Zalo Web/App với chat user
 * @param {string} phone — SĐT user (10 số)
 * @returns {string} URL zalo.me
 */
function makeZaloDeepLink(phone) {
  if (!phone) return null;
  const clean = String(phone).replace(/[.\s-]/g, '');
  return `https://zalo.me/${clean}`;
}

/**
 * Format tin nhắn mẫu để Khang copy paste vào Zalo
 * @param {object} lead
 * @param {string} magicLink
 * @returns {string} Multi-line message
 */
function makeZaloMessage(lead, magicLink) {
  const goiLabel = lead.goi === 'founder' ? 'Founder trọn đời' : 'Active 1 năm';
  return `Chào anh/chị ${lead.ten},

Cảm ơn anh/chị đã tin tưởng Sol La Bàn. Em xác nhận đã nhận thanh toán cho gói ${goiLabel}.

Đây là link kích hoạt tài khoản của anh/chị:
${magicLink}

Chỉ cần click link → Sol sẽ tự động kích hoạt trong 3 giây. Sau đó anh/chị có thể vào huongdi.sol.vn để dùng đầy đủ 37 mô hình + 40 câu hỏi AI.

Nếu có gì khó khăn, anh/chị nhắn Zalo em bất cứ lúc nào.

Trân trọng,
Khang Sol · Founder Sol.vn`;
}

/**
 * Send Email qua nodemailer
 */
async function sendEmail(to, subject, html) {
  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: CONFIG.smtp.host,
      port: CONFIG.smtp.port,
      secure: CONFIG.smtp.port === 465,
      auth: { user: CONFIG.smtp.user, pass: CONFIG.smtp.pass }
    });
    await transporter.sendMail({
      from: `"${CONFIG.smtp.fromName}" <${CONFIG.smtp.user}>`,
      to, subject, html
    });
    return { status: 'sent' };
  } catch (err) {
    return { status: 'failed', error: err.message };
  }
}

/**
 * Send SMS qua Speedsms.vn / Esms.vn / VietGuys (nếu configured)
 * Placeholder — implement theo gateway anh chọn
 */
async function sendSMS(phone, message) {
  if (!CONFIG.smsGateway.enabled) {
    return { status: 'skipped', reason: 'SMS gateway not configured' };
  }
  // TODO: Implement theo API của gateway anh chọn
  // Ví dụ Speedsms:
  //   POST https://api.speedsms.vn/index.php/sms/send
  //   Auth: Basic base64(apiKey:)
  //   Body: { to, content, sms_type: 2, sender: 'SOL' }
  return { status: 'not_implemented' };
}

function logNotification(db, leadId, channel, result) {
  db.prepare(`
    INSERT INTO notifications (lead_id, channel, status, error_message)
    VALUES (?, ?, ?, ?)
  `).run(leadId, channel, result.status, result.error || null);
}

// ═══════════════════════════════════════════════
// PUBLIC — Notify Khang khi có lead mới
// ═══════════════════════════════════════════════

exports.notifyKhang = async function(lead, db) {
  const adminUrl = 'https://adminhuongdi.sol.vn/#/leads';
  const goiLabel = lead.goi === 'founder' ? 'FOUNDER 1.999k' : 'ACTIVE 499k';
  const amountFmt = lead.amount.toLocaleString('vi-VN') + 'đ';
  const zaloDeepLink = makeZaloDeepLink(lead.zalo || lead.sdt);

  // ── EMAIL cho Khang ──
  const emailHtml = `
    <div style="font-family:Arial,sans-serif; max-width:600px; margin:0 auto;">
      <div style="background:linear-gradient(135deg,#F59E0B,#D97706); color:#fff; padding:20px; border-radius:12px 12px 0 0;">
        <h2 style="margin:0;">🔔 LEAD MỚI — ${goiLabel}</h2>
        <p style="margin:8px 0 0; font-size:20px; font-weight:700;">${amountFmt}</p>
      </div>
      <div style="background:#fff; padding:24px; border:1px solid #E5E7EB; border-top:none; border-radius:0 0 12px 12px;">
        <table style="width:100%; border-collapse:collapse; margin:0 0 20px;">
          <tr><td style="padding:8px 0; border-bottom:1px solid #F3F4F6; width:100px;"><strong>Tên</strong></td><td style="padding:8px 0; border-bottom:1px solid #F3F4F6;">${lead.ten}</td></tr>
          <tr><td style="padding:8px 0; border-bottom:1px solid #F3F4F6;"><strong>SĐT</strong></td><td style="padding:8px 0; border-bottom:1px solid #F3F4F6;"><a href="tel:${lead.sdt}">${lead.sdt}</a></td></tr>
          <tr><td style="padding:8px 0; border-bottom:1px solid #F3F4F6;"><strong>Email</strong></td><td style="padding:8px 0; border-bottom:1px solid #F3F4F6;">${lead.email || '(không có)'}</td></tr>
          <tr><td style="padding:8px 0; border-bottom:1px solid #F3F4F6;"><strong>Zalo</strong></td><td style="padding:8px 0; border-bottom:1px solid #F3F4F6;"><a href="${zaloDeepLink}">${lead.zalo || lead.sdt}</a> 💬</td></tr>
          <tr><td style="padding:8px 0;"><strong>Gói</strong></td><td style="padding:8px 0;">${goiLabel}</td></tr>
        </table>

        <div style="background:#FEF3C7; padding:14px; border-left:4px solid #F59E0B; border-radius:4px; margin:16px 0;">
          <strong>Nội dung CK dự kiến:</strong>
          <code style="background:#fff; padding:4px 8px; border-radius:4px; font-size:15px; display:inline-block; margin-top:4px;">SOL ${lead.sdt}</code>
        </div>

        <div style="text-align:center; margin-top:24px;">
          <a href="${adminUrl}" style="display:inline-block; background:#F59E0B; color:#fff; padding:14px 28px; border-radius:8px; text-decoration:none; font-weight:bold;">
            → Vào Admin Panel để approve
          </a>
          <p style="margin:12px 0 0;">
            <a href="${zaloDeepLink}" style="color:#0068FF; font-weight:600; text-decoration:none;">💬 Mở Zalo chat với ${lead.ten}</a>
          </p>
        </div>

        <hr style="margin:24px 0; border:none; border-top:1px solid #F3F4F6;">
        <p style="font-size:12px; color:#9CA3AF; margin:0;">
          Lead ID: #${lead.id} · IP: ${lead.ip_address || '?'} · ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
        </p>
      </div>
    </div>
  `;

  const emailResult = await sendEmail(
    CONFIG.adminEmail,
    `[Sol] 🔔 Lead mới ${goiLabel} — ${lead.ten} (${lead.sdt})`,
    emailHtml
  );
  logNotification(db, lead.id, 'email_khang', emailResult);

  // ── SMS optional (chỉ khi có API key) ──
  const smsMessage = `[Sol] LEAD MOI ${goiLabel}: ${lead.ten} - ${lead.sdt} - Vao admin de approve.`;
  const smsResult = await sendSMS(CONFIG.smsGateway.phone, smsMessage);
  logNotification(db, lead.id, 'sms_khang', smsResult);

  return { email: emailResult, sms: smsResult };
};

// ═══════════════════════════════════════════════
// PUBLIC — Send magic link tới User sau khi approve
// PHASE 1: Auto-send Email (nếu có), còn Zalo Khang gửi thủ công
// PHASE 2: Sẽ tích hợp Zalo OA để tự động gửi ZNS
// ═══════════════════════════════════════════════

exports.sendMagicLinkToUser = async function(lead, magicLink, db) {
  const results = {};

  // ── 1. Auto email nếu user có email ──
  if (lead.email) {
    const html = `
      <div style="font-family:Arial,sans-serif; max-width:600px; margin:0 auto;">
        <div style="background:linear-gradient(135deg,#F59E0B,#D97706); color:#fff; padding:24px; border-radius:12px 12px 0 0; text-align:center;">
          <h1 style="margin:0; font-size:24px;">🎉 Chào ${lead.ten}!</h1>
          <p style="margin:8px 0 0;">Gói ${lead.goi === 'founder' ? 'Founder trọn đời' : 'Active 1 năm'} của anh/chị đã sẵn sàng</p>
        </div>
        <div style="background:#fff; padding:32px 24px; border:1px solid #E5E7EB; border-top:none; border-radius:0 0 12px 12px; text-align:center;">
          <p style="font-size:16px; color:#374151;">Cảm ơn anh/chị đã tin tưởng Sol La Bàn. Nhấn nút bên dưới để kích hoạt ngay:</p>
          <p style="margin:32px 0;">
            <a href="${magicLink}" style="display:inline-block; background:linear-gradient(135deg,#F59E0B,#D97706); color:#fff; padding:18px 48px; border-radius:12px; text-decoration:none; font-weight:bold; font-size:16px; box-shadow:0 8px 24px rgba(245,158,11,0.35);">
              → Kích hoạt Sol Active
            </a>
          </p>
          <p style="font-size:13px; color:#6B7280;">Hoặc copy link:<br>
            <code style="background:#F9FAFB; padding:6px 10px; border-radius:4px; word-break:break-all; display:inline-block; margin-top:6px; font-size:12px;">${magicLink}</code>
          </p>
          <hr style="margin:24px 0; border:none; border-top:1px solid #F3F4F6;">
          <p style="font-size:13px; color:#6B7280;">
            Link có hiệu lực 365 ngày.<br>
            Cần trợ giúp? <a href="https://zalo.me/0912727381">Chat Zalo Khang</a> hoặc gọi <a href="tel:02439931800">024.3993.1800</a>
          </p>
        </div>
      </div>
    `;
    const r = await sendEmail(lead.email, '🎉 Kích hoạt Sol Active của anh/chị', html);
    logNotification(db, lead.id, 'email_user', r);
    results.email = r;
  } else {
    results.email = { status: 'skipped', reason: 'User không có email' };
  }

  // ── 2. Trả ra Zalo deep-link + tin nhắn mẫu để Khang gửi thủ công ──
  results.zalo_manual = {
    deep_link: makeZaloDeepLink(lead.zalo || lead.sdt),
    pre_filled_message: makeZaloMessage(lead, magicLink),
    instruction: 'Click deep_link → mở Zalo chat với user → dán pre_filled_message → Gửi'
  };

  logNotification(db, lead.id, 'zalo_user', {
    status: 'sent',
    note: 'Manual instructions returned to admin'
  });

  return {
    ...results,
    magic_link_to_share: magicLink
  };
};

// Export helpers cho admin panel
exports.makeZaloDeepLink = makeZaloDeepLink;
exports.makeZaloMessage = makeZaloMessage;
