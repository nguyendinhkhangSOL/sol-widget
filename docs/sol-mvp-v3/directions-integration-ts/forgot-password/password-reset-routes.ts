// ═══════════════════════════════════════════════════════════════
// /api/auth/forgot-password + /reset-password
// Deploy: /var/www/huongdi/backend/src/routes/password-reset.ts
// Mount trong index.ts: app.use('/api/auth', passwordResetRoutes)
// ═══════════════════════════════════════════════════════════════

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const router = Router();
const prisma = new PrismaClient();

// ─── SMTP Config ────────────────────────────────────────
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.zoho.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465');
const SMTP_SECURE = process.env.SMTP_SECURE === 'true' || SMTP_PORT === 465;
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || 'Sol La Bàn <noreply@sol.vn>';
const APP_URL = process.env.APP_URL || 'https://huongdi.sol.vn';

const transporter = (SMTP_USER && SMTP_PASS) ? nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,  // true for 465 SSL, false for 587 STARTTLS
  auth: { user: SMTP_USER, pass: SMTP_PASS },
}) : null;

// Rate limit — 1 request/email/5 phút để tránh spam
const rateLimitCache = new Map<string, number>();
const RATE_LIMIT_MS = 5 * 60 * 1000;

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const last = rateLimitCache.get(key);
  if (last && now - last < RATE_LIMIT_MS) return false;
  rateLimitCache.set(key, now);
  // Cleanup old entries
  for (const [k, v] of rateLimitCache.entries()) {
    if (now - v > RATE_LIMIT_MS * 2) rateLimitCache.delete(k);
  }
  return true;
}

// ═══════════════════════════════════════════════════════════════
// POST /api/auth/forgot-password
// Body: { email }
// Response: { success: true } — luôn success (không leak user tồn tại hay không)
// ═══════════════════════════════════════════════════════════════
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body || {};
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'Email required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Rate limit per email
    if (!checkRateLimit(normalizedEmail)) {
      return res.status(429).json({
        success: false,
        message: 'Vui lòng chờ 5 phút trước khi yêu cầu lại.',
      });
    }

    // Find user (silent — không tiết lộ user có tồn tại)
    const user = await prisma.user.findFirst({
      where: { email: normalizedEmail },
      select: { id: true, email: true, displayName: true } as any,
    });

    // ALWAYS return success (security best practice)
    // Nếu user tồn tại → thực hiện gửi email
    if (user && transporter) {
      // Generate token
      const token = crypto.randomBytes(32).toString('hex');  // 64 hex chars
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Save token
      await (prisma as any).passwordResetToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
          ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip || null,
          userAgent: req.headers['user-agent']?.substring(0, 300) || null,
        },
      });

      // Send email (async, không block response)
      const resetUrl = `${APP_URL}/dat-lai-mat-khau/?token=${token}`;
      sendResetEmail(user, resetUrl).catch((err) => {
        console.error('[Email send error]', err);
      });
    }

    return res.json({
      success: true,
      message: 'Nếu email tồn tại trong hệ thống, chúng tôi đã gửi link đặt lại mật khẩu. Kiểm tra hộp thư (kể cả Spam).',
    });
  } catch (err: any) {
    console.error('[POST /forgot-password]', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// POST /api/auth/reset-password
// Body: { token, newPassword }
// ═══════════════════════════════════════════════════════════════
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Thiếu token hoặc mật khẩu.' });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu tối thiểu 6 ký tự.' });
    }

    // Find token
    const tokenRecord = await (prisma as any).passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!tokenRecord) {
      return res.status(404).json({ success: false, message: 'Token không hợp lệ.' });
    }
    if (tokenRecord.usedAt) {
      return res.status(400).json({ success: false, message: 'Token đã được dùng. Vui lòng yêu cầu link mới.' });
    }
    if (new Date() > new Date(tokenRecord.expiresAt)) {
      return res.status(400).json({ success: false, message: 'Token hết hạn. Vui lòng yêu cầu link mới.' });
    }

    // Update password
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: tokenRecord.userId },
      data: { passwordHash } as any,
    });

    // Mark token used
    await (prisma as any).passwordResetToken.update({
      where: { id: tokenRecord.id },
      data: { usedAt: new Date() },
    });

    // Invalidate all other unused tokens for this user
    await (prisma as any).passwordResetToken.updateMany({
      where: { userId: tokenRecord.userId, usedAt: null, id: { not: tokenRecord.id } },
      data: { usedAt: new Date() },
    });

    return res.json({
      success: true,
      message: 'Mật khẩu đã được đặt lại. Vui lòng đăng nhập lại.',
      email: tokenRecord.user.email,
    });
  } catch (err: any) {
    console.error('[POST /reset-password]', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// GET /api/auth/verify-reset-token/:token
// Check token còn valid không (để frontend hiện form hoặc error)
// ═══════════════════════════════════════════════════════════════
router.get('/verify-reset-token/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const rec = await (prisma as any).passwordResetToken.findUnique({
      where: { token },
      include: { user: { select: { email: true } } },
    });

    if (!rec) return res.status(404).json({ valid: false, reason: 'not_found' });
    if (rec.usedAt) return res.status(400).json({ valid: false, reason: 'used' });
    if (new Date() > new Date(rec.expiresAt)) return res.status(400).json({ valid: false, reason: 'expired' });

    return res.json({ valid: true, email: rec.user.email });
  } catch (err: any) {
    return res.status(500).json({ valid: false, reason: 'error' });
  }
});

// ─── Email sender ──────────────────────────────────────

async function sendResetEmail(user: any, resetUrl: string) {
  if (!transporter) {
    console.warn('[Email] SMTP not configured');
    return;
  }

  const html = buildEmailHtml(user.displayName || 'anh chị', resetUrl);
  const text = `Chào ${user.displayName || 'anh chị'},

Bạn hoặc ai đó vừa yêu cầu đặt lại mật khẩu cho tài khoản Sol La Bàn.

Click link dưới đây để đặt lại mật khẩu (hết hạn sau 1 giờ):
${resetUrl}

Nếu không phải bạn yêu cầu, bỏ qua email này. Mật khẩu vẫn nguyên vẹn.

— Sol La Bàn
sol.vn`;

  await transporter.sendMail({
    from: SMTP_FROM,
    to: user.email,
    subject: '🧭 Đặt lại mật khẩu Sol La Bàn',
    text,
    html,
  });
}

function buildEmailHtml(name: string, resetUrl: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0; padding:0; font-family: Arial, sans-serif; background:#F8FAFC;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin:0 auto; padding:20px;">
    <tr><td>
      <!-- Header -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#0F172A; padding:24px; border-radius:8px 8px 0 0;">
        <tr><td style="text-align:center;">
          <div style="font-size:24px; font-weight:800; color:white;">🧭 Sol <span style="color:#F59E0B;">La Bàn</span></div>
          <div style="font-size:12px; color:#94A3B8; margin-top:4px;">Hành trình cho chuyên gia 40+ Việt Nam</div>
        </td></tr>
      </table>

      <!-- Body -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:white; padding:32px; border-radius:0 0 8px 8px;">
        <tr><td>
          <h2 style="color:#0F172A; margin-top:0;">Đặt lại mật khẩu</h2>
          <p style="color:#334155; line-height:1.6;">Chào <strong>${escapeHtml(name)}</strong>,</p>
          <p style="color:#334155; line-height:1.6;">
            Bạn (hoặc ai đó) vừa yêu cầu đặt lại mật khẩu cho tài khoản Sol La Bàn.
            Click nút dưới đây để đặt mật khẩu mới:
          </p>

          <div style="text-align:center; margin:32px 0;">
            <a href="${resetUrl}" style="background:#F59E0B; color:#0F172A; padding:14px 32px; border-radius:8px; text-decoration:none; font-weight:700; display:inline-block; font-size:15px;">
              Đặt mật khẩu mới →
            </a>
          </div>

          <p style="color:#64748B; font-size:13px; line-height:1.6;">
            Hoặc copy link này vào trình duyệt:<br>
            <a href="${resetUrl}" style="color:#F59E0B; word-break:break-all;">${resetUrl}</a>
          </p>

          <div style="background:#FEF3C7; border-left:4px solid #F59E0B; padding:12px 16px; margin:24px 0; border-radius:4px;">
            <p style="margin:0; color:#78350F; font-size:13px;">
              ⏱ Link hết hạn sau <strong>1 giờ</strong> vì lý do bảo mật.<br>
              🔒 Nếu không phải bạn yêu cầu, bỏ qua email này. Mật khẩu vẫn nguyên vẹn.
            </p>
          </div>

          <p style="color:#94A3B8; font-size:12px; margin-top:32px; padding-top:16px; border-top:1px solid #E2E8F0;">
            Email tự động từ Sol La Bàn. Không reply email này.<br>
            Cần hỗ trợ? Truy cập <a href="https://huongdi.sol.vn/lien-he/" style="color:#F59E0B;">huongdi.sol.vn/lien-he/</a>
          </p>
        </td></tr>
      </table>

      <!-- Footer -->
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px; text-align:center;">
        <tr><td>
          <p style="color:#94A3B8; font-size:12px; margin:0;">
            Sol La Bàn — <a href="https://sol.vn" style="color:#F59E0B; text-decoration:none;">sol.vn</a><br>
            Hệ thống 5 bước tự khám phá hướng đi cho chuyên gia 40+
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function escapeHtml(str: string): string {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c] || c));
}

export default router;
