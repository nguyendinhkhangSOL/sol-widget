/**
 * Public API: POST /api/leads
 * REFACTORED — Unified auth:
 *   1. User đã login → INSERT lead with userId = current
 *   2. Email/phone đã có account (có password) → 409 conflict, force login
 *   3. Shell user tồn tại (email/phone đã có, password NULL) → reuse + tạo lead
 *   4. Email/phone hoàn toàn mới → tạo shell user + tạo lead
 *
 * File: /var/www/huongdi/backend/src/routes/leads.ts
 */

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { notifyKhang } from '../services/notification';
import { optionalAuth } from '../middleware/optional-auth';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'huongdi-fallback-secret';
const JWT_EXPIRES_IN = '30d';
const BCRYPT_ROUNDS = 12;

// Rate limit: max 5 submissions per SDT per 24h
const submissions = new Map<string, number[]>();

function isRateLimited(sdt: string): boolean {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const arr = (submissions.get(sdt) || []).filter(t => now - t < day);
  submissions.set(sdt, arr);
  return arr.length >= 5;
}
function recordSubmission(sdt: string): void {
  const arr = submissions.get(sdt) || [];
  arr.push(Date.now());
  submissions.set(sdt, arr);
}
function isValidPhone(sdt: string): boolean {
  return /^0\d{9}$/.test(String(sdt).replace(/[.\s-]/g, ''));
}
function normalizePhone(sdt: string): string {
  return String(sdt).replace(/[.\s-]/g, '');
}
function normalizeEmail(e?: string): string | null {
  if (!e) return null;
  const s = String(e).trim().toLowerCase();
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(s)) return null;
  return s;
}

const PACKAGE_AMOUNTS: Record<string, number> = {
  active:  499000,
  founder: 1999000,
  renewal: 499000,
};

interface LeadPayload {
  ten:    string;
  sdt:    string;
  email?: string;
  zalo?:  string;
  goi:    string;
}

// ─── POST /api/leads (REFACTORED with optionalAuth) ─────
router.post('/leads', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { ten, sdt, email, zalo, goi } = req.body as LeadPayload;
    const currentUserId = (req as any).user?.userId; // From optionalAuth middleware

    if (!ten || !sdt || !goi) {
      return res.status(400).json({
        success: false, message: 'Vui lòng điền đủ Tên, SĐT, và Gói.'
      });
    }
    if (!isValidPhone(sdt)) {
      return res.status(400).json({
        success: false, message: 'SĐT không hợp lệ. Định dạng: 09xxxxxxxx (10 số)'
      });
    }
    if (!PACKAGE_AMOUNTS[goi]) {
      return res.status(400).json({ success: false, message: 'Gói không hợp lệ.' });
    }

    const cleanSdt = normalizePhone(sdt);
    const cleanEmail = normalizeEmail(email);

    if (isRateLimited(cleanSdt)) {
      return res.status(429).json({
        success: false, message: 'Quá nhiều lần submit. Vui lòng thử lại sau 24h.'
      });
    }

    const amount = PACKAGE_AMOUNTS[goi];
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '');
    const ua = String(req.headers['user-agent'] || '');
    const ref = String(req.headers['referer'] || '');

    // ⭐ Determine user (4 cases)
    let targetUserId: string | null = null;
    let isNewShellUser = false;

    if (currentUserId) {
      // Case 1: User đã login
      const currentUser = await prisma.user.findUnique({ where: { id: currentUserId } });
      if (!currentUser) {
        return res.status(401).json({ success: false, message: 'Phiên đăng nhập không hợp lệ.' });
      }
      targetUserId = currentUser.id;
    } else {
      // Case 2/3/4: Chưa login → check email/phone
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: cleanSdt },
            ...(cleanEmail ? [{ email: cleanEmail }] : []),
          ],
        },
      });

      if (existingUser && existingUser.passwordHash) {
        // Case 2: Đã có account với password → force login
        return res.status(409).json({
          success: false,
          errorCode: 'ACCOUNT_EXISTS',
          message: 'Email/SĐT đã có tài khoản Sol. Vui lòng đăng nhập trước để tiếp tục thanh toán.',
          redirect: `/dang-nhap/?next=${encodeURIComponent('/thanh-toan/?goi=' + goi)}`,
        });
      }

      if (existingUser && !existingUser.passwordHash) {
        // Case 3: Shell user tồn tại (email/phone đã có, password NULL) → reuse
        targetUserId = existingUser.id;
      } else {
        // Case 4: Hoàn toàn mới → create shell user
        const newShellUser = await prisma.user.create({
          data: {
            phone: cleanSdt,
            email: cleanEmail,
            displayName: ten.trim().substring(0, 100),
            passwordHash: null, // Shell — chờ set qua magic link
            tier: 'FREE',
            role: 'USER',
          } as any,
        });
        targetUserId = newShellUser.id;
        isNewShellUser = true;
        console.log(`[leads] Created shell user ${newShellUser.id} for pay-first ${cleanEmail || cleanSdt}`);
      }
    }

    // ⭐ Tạo lead LUÔN với userId
    const lead = await prisma.lead.create({
      data: {
        userId: targetUserId!,
        ten:       ten.trim(),
        sdt:       cleanSdt,
        email:     cleanEmail,
        zalo:      zalo ? normalizePhone(zalo) : null,
        goi:       goi.toUpperCase() as any,
        amount,
        ipAddress: ip,
        userAgent: ua,
        referer:   ref,
      }
    });

    recordSubmission(cleanSdt);

    // Async notify Khang
    setImmediate(() => {
      notifyKhang(lead).catch(err => {
        console.error('[leads] notifyKhang failed:', err);
      });
    });

    return res.json({
      success: true,
      lead_id: lead.id,
      user_id: targetUserId,
      is_new_shell_user: isNewShellUser,
      message: isNewShellUser
        ? `Đã ghi nhận đơn của anh/chị ${ten}. Sau khi chuyển khoản, chúng tôi gửi email/Zalo link kích hoạt để anh/chị đặt mật khẩu và bắt đầu dùng Sol La Bàn.`
        : `Đã ghi nhận đơn của anh/chị ${ten}. Chuyển khoản xong, chúng tôi kích hoạt trong 2-4 giờ.`,
      payment_info: {
        bank:          'Techcombank',
        account:       '11522026076011',
        account_name:  'CONG TY CO PHAN VINET',
        amount,
        transfer_note: `SOL ${cleanSdt}`,
      }
    });
  } catch (err: any) {
    console.error('[POST /leads] error:', err);
    return res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống. Vui lòng liên hệ Zalo 0912727381.'
    });
  }
});

/**
 * GET /api/activate?token=xxx
 * REFACTORED — Verify magic link + check password_required
 */
router.get('/activate', async (req: Request, res: Response) => {
  const token = String(req.query.token || '');
  if (!token || token.length < 20) {
    return res.status(400).json({ success: false, message: 'Token không hợp lệ.' });
  }

  const lead = await prisma.lead.findUnique({
    where: { magicToken: token },
    include: { user: true },
  });
  if (!lead) {
    return res.status(404).json({ success: false, message: 'Link không tồn tại.' });
  }
  if (lead.paymentStatus === 'CANCELLED') {
    return res.status(400).json({ success: false, message: 'Đơn đã bị huỷ.' });
  }
  if (lead.expiresAt && lead.expiresAt < new Date()) {
    return res.status(400).json({ success: false, message: 'Link đã hết hạn. LH Zalo 0912727381.' });
  }

  const firstActivation = lead.paymentStatus !== 'ACTIVATED';
  const tier: 'ACTIVE' | 'FOUNDER' = lead.goi === 'FOUNDER' ? 'FOUNDER' : 'ACTIVE';
  const tierStartedAt = new Date();
  const tierExpiresAt = lead.goi === 'FOUNDER' ? null : lead.expiresAt;

  if (firstActivation) {
    // Update lead
    await prisma.lead.update({
      where: { id: lead.id },
      data:  { paymentStatus: 'ACTIVATED', activatedAt: tierStartedAt }
    });

    // ⭐ Upsert user
    if (lead.userId) {
      // User đã link (từ /leads refactored)
      await prisma.user.update({
        where: { id: lead.userId },
        data: {
          tier: tier as any,
          tierStartedAt: tierStartedAt as any,
          tierExpiresAt: tierExpiresAt as any,
          activeLeadId: lead.id,
          displayName: lead.user?.displayName || lead.ten,
          email: lead.user?.email || lead.email || undefined,
          phone: lead.user?.phone || lead.sdt,
          lastSeenAt: new Date(),
        } as any,
      });
    } else {
      // Legacy fallback: orphan lead → find/create user
      const existing = await prisma.user.findFirst({
        where: { OR: [{ phone: lead.sdt }, ...(lead.email ? [{ email: lead.email }] : [])] },
      });
      if (existing) {
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            tier: tier as any,
            tierStartedAt: tierStartedAt as any,
            tierExpiresAt: tierExpiresAt as any,
            activeLeadId: lead.id,
            lastSeenAt: new Date(),
          } as any,
        });
        await prisma.lead.update({ where: { id: lead.id }, data: { userId: existing.id } });
      } else {
        const newUser = await prisma.user.create({
          data: {
            phone: lead.sdt,
            email: lead.email || null,
            displayName: lead.ten,
            tier: tier as any,
            tierStartedAt: tierStartedAt as any,
            tierExpiresAt: tierExpiresAt as any,
            activeLeadId: lead.id,
            lastSeenAt: new Date(),
          } as any,
        });
        await prisma.lead.update({ where: { id: lead.id }, data: { userId: newUser.id } });
      }
    }
  }

  // Re-fetch to get updated user
  const refreshedLead = await prisma.lead.findUnique({
    where: { id: lead.id },
    include: { user: true },
  });

  return res.json({
    success: true,
    tier: refreshedLead?.user?.tier?.toLowerCase() || (lead.goi === 'FOUNDER' ? 'founder' : 'active'),
    ten: lead.ten,
    email: lead.email,
    expires_at: refreshedLead?.user?.tierExpiresAt || lead.expiresAt,
    first_activation: firstActivation,
    password_required: !refreshedLead?.user?.passwordHash,
    user_id: refreshedLead?.userId,
  });
});

/**
 * POST /api/activate/set-password
 * NEW — Shell user (từ pay-first) đặt password + auto login
 * Body: { token, password }
 */
router.post('/activate/set-password', async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body || {};

    if (!token || String(token).length < 20) {
      return res.status(400).json({ success: false, message: 'Token không hợp lệ.' });
    }
    if (!password || String(password).length < 6) {
      return res.status(400).json({
        success: false, message: 'Mật khẩu tối thiểu 6 ký tự.',
      });
    }

    const lead = await prisma.lead.findUnique({
      where: { magicToken: token },
      include: { user: true },
    });
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Link không tồn tại.' });
    }
    if (lead.expiresAt && lead.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Link đã hết hạn.' });
    }
    if (!lead.userId || !lead.user) {
      return res.status(400).json({
        success: false, message: 'Đơn chưa được kích hoạt. Vui lòng liên hệ Zalo 0912727381.'
      });
    }
    if (lead.user.passwordHash) {
      return res.status(400).json({
        success: false, message: 'Tài khoản đã đặt mật khẩu. Vui lòng đăng nhập.',
        redirect: '/dang-nhap/',
      });
    }

    const passwordHash = await bcrypt.hash(String(password), BCRYPT_ROUNDS);
    const now = new Date();

    const updatedUser = await prisma.user.update({
      where: { id: lead.userId },
      data: {
        passwordHash,
        emailVerified: !!lead.user.email,
        lastLoginAt: now,
      } as any,
    });

    const jwtToken = jwt.sign(
      { userId: updatedUser.id, tier: updatedUser.tier, role: updatedUser.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      success: true,
      token: jwtToken,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        phone: updatedUser.phone,
        displayName: (updatedUser as any).displayName,
        tier: updatedUser.tier,
        tierExpiresAt: updatedUser.tierExpiresAt,
      },
      message: `🎉 Chào mừng ${(updatedUser as any).displayName || 'bạn'}! Tài khoản Sol La Bàn ${updatedUser.tier} đã sẵn sàng.`,
    });
  } catch (err: any) {
    console.error('[POST /activate/set-password]', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
});

export default router;
