/**
 * ═══════════════════════════════════════════════════════════════
 * Sol V1.2 — Auth endpoints (Password-based)
 * File: /var/www/huongdi/backend/src/routes/auth.ts
 * ═══════════════════════════════════════════════════════════════
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'sol-v1.2-fallback-secret-change-me';
const JWT_EXPIRES_IN = '30d';
const BCRYPT_ROUNDS = 10;

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

interface JWTPayload {
  leadId: number;
  sdt: string;
  tier: string;
}

function signToken(lead: any): string {
  const payload: JWTPayload = {
    leadId: lead.id,
    sdt: lead.sdt,
    tier: (lead.goi || 'ACTIVE').toLowerCase(),
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function validatePassword(pwd: string): { ok: boolean; error?: string } {
  if (!pwd || pwd.length < 8) {
    return { ok: false, error: 'Mật khẩu phải có ít nhất 8 ký tự.' };
  }
  if (!/[0-9]/.test(pwd)) {
    return { ok: false, error: 'Mật khẩu phải có ít nhất 1 số.' };
  }
  if (pwd.length > 100) {
    return { ok: false, error: 'Mật khẩu quá dài (tối đa 100 ký tự).' };
  }
  return { ok: true };
}

function normalizePhone(sdt: string): string {
  return String(sdt).replace(/[.\s-]/g, '');
}

function normalizeEmail(email: string): string {
  return String(email).trim().toLowerCase();
}

// Rate limit for login attempts
const loginAttempts = new Map<string, number[]>();
function checkLoginRateLimit(identifier: string): boolean {
  const now = Date.now();
  const window = 15 * 60 * 1000; // 15 minutes
  const arr = (loginAttempts.get(identifier) || []).filter(t => now - t < window);
  loginAttempts.set(identifier, arr);
  return arr.length < 5; // Max 5 attempts per 15min per identifier
}
function recordLoginAttempt(identifier: string): void {
  const arr = loginAttempts.get(identifier) || [];
  arr.push(Date.now());
  loginAttempts.set(identifier, arr);
}

// ═══════════════════════════════════════════════════════════════
// POST /api/auth/set-password
// Body: { token: string (magic_token), password: string, password_confirm: string }
// Auth: magic_token
// ═══════════════════════════════════════════════════════════════
router.post('/set-password', async (req: Request, res: Response) => {
  try {
    const { token, password, password_confirm } = req.body;

    if (!token || String(token).length < 20) {
      return res.status(400).json({ success: false, message: 'Token không hợp lệ.' });
    }

    if (!password || !password_confirm) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập mật khẩu và xác nhận.' });
    }

    if (password !== password_confirm) {
      return res.status(400).json({ success: false, message: 'Mật khẩu xác nhận không khớp.' });
    }

    const validation = validatePassword(password);
    if (!validation.ok) {
      return res.status(400).json({ success: false, message: validation.error });
    }

    // Verify magic_token
    const lead = await prisma.lead.findUnique({ where: { magicToken: String(token) } });
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Link không hợp lệ hoặc đã hết hạn.' });
    }
    if (lead.paymentStatus === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Tài khoản đã bị huỷ.' });
    }
    if (lead.expiresAt && lead.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Link đã hết hạn.' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Update lead
    const updated = await prisma.lead.update({
      where: { id: lead.id },
      data: {
        passwordHash,
        passwordSetAt: new Date(),
        // Auto-activate nếu chưa
        paymentStatus: lead.paymentStatus === 'PAID' ? 'ACTIVATED' as any : lead.paymentStatus,
        activatedAt: lead.activatedAt || new Date(),
        lastLoginAt: new Date(),
      }
    });

    // Sign JWT
    const jwtToken = signToken(updated);

    return res.json({
      success: true,
      message: 'Đặt mật khẩu thành công.',
      token: jwtToken,
      tier: (updated.goi || 'ACTIVE').toLowerCase(),
      ten: updated.ten,
      expires_at: updated.expiresAt,
    });
  } catch (err: any) {
    console.error('[POST /auth/set-password]', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống. Vui lòng thử lại.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// POST /api/auth/login
// Body: { identifier: string (SDT or Email), password: string }
// ═══════════════════════════════════════════════════════════════
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập SDT/Email và mật khẩu.' });
    }

    const ident = String(identifier).trim();

    // Rate limit
    if (!checkLoginRateLimit(ident)) {
      return res.status(429).json({
        success: false,
        message: 'Quá nhiều lần đăng nhập sai. Vui lòng thử lại sau 15 phút.'
      });
    }
    recordLoginAttempt(ident);

    // Query lead by SDT or email
    const isEmail = ident.includes('@');
    const lead = isEmail
      ? await prisma.lead.findFirst({ where: { email: normalizeEmail(ident) } })
      : await prisma.lead.findFirst({ where: { sdt: normalizePhone(ident) } });

    if (!lead) {
      return res.status(401).json({
        success: false,
        message: 'SDT/Email không tồn tại. Vui lòng đăng ký tại /thanh-toan/.',
        code: 'NOT_FOUND'
      });
    }

    // Check password hash
    if (!lead.passwordHash) {
      return res.status(401).json({
        success: false,
        message: 'Anh/chị chưa đặt mật khẩu. Vui lòng dùng link kích hoạt đã nhận qua Zalo/Email để đặt mật khẩu.',
        code: 'PASSWORD_NOT_SET'
      });
    }

    // Check status
    if (lead.paymentStatus === 'CANCELLED') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị huỷ. Vui lòng liên hệ Zalo 0912727381.',
        code: 'CANCELLED'
      });
    }
    if (lead.paymentStatus === 'PENDING') {
      return res.status(403).json({
        success: false,
        message: 'Đơn của anh/chị đang chờ chuyển khoản. Vui lòng CK theo memo đã cấp.',
        code: 'PENDING_PAYMENT'
      });
    }
    if (lead.expiresAt && lead.expiresAt < new Date()) {
      return res.status(403).json({
        success: false,
        message: 'Gói đã hết hạn. Vui lòng gia hạn.',
        code: 'EXPIRED'
      });
    }

    // Verify password
    const match = await bcrypt.compare(password, lead.passwordHash);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu không đúng. Vui lòng thử lại hoặc click "Quên mật khẩu".',
        code: 'WRONG_PASSWORD'
      });
    }

    // Update last login
    await prisma.lead.update({
      where: { id: lead.id },
      data: { lastLoginAt: new Date() }
    });

    // Sign JWT
    const jwtToken = signToken(lead);

    return res.json({
      success: true,
      token: jwtToken,
      tier: (lead.goi || 'ACTIVE').toLowerCase(),
      ten: lead.ten,
      email: lead.email,
      expires_at: lead.expiresAt,
    });
  } catch (err: any) {
    console.error('[POST /auth/login]', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống. Vui lòng thử lại.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// GET /api/auth/me
// Header: Authorization: Bearer <JWT>
// ═══════════════════════════════════════════════════════════════
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return res.status(401).json({ success: false, message: 'Thiếu token.' });
    }

    let payload: JWTPayload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (e: any) {
      return res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn.', code: 'INVALID_TOKEN' });
    }

    const lead = await prisma.lead.findUnique({ where: { id: payload.leadId } });
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản.' });
    }

    return res.json({
      success: true,
      user: {
        id: lead.id,
        ten: lead.ten,
        sdt: lead.sdt,
        email: lead.email,
        tier: (lead.goi || 'ACTIVE').toLowerCase(),
        payment_status: lead.paymentStatus,
        activated_at: lead.activatedAt,
        expires_at: lead.expiresAt,
        last_login_at: lead.lastLoginAt,
      }
    });
  } catch (err: any) {
    console.error('[GET /auth/me]', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
});

export { router as authRouter };

// ═══════════════════════════════════════════════════════════════
// POST /api/auth/admin-login
// Body: { email: string, password: string }
// Returns: JWT với payload {userId, role, type:'admin'}
// ═══════════════════════════════════════════════════════════════
router.post('/admin/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu.' });
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    if (!checkLoginRateLimit(normalizedEmail)) {
      return res.status(429).json({ success: false, message: 'Quá nhiều lần đăng nhập sai. Thử lại sau 15 phút.' });
    }
    recordLoginAttempt(normalizedEmail);

    const admin = await prisma.adminUser.findUnique({ where: { email: normalizedEmail } });
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Đăng nhập thất bại' });
    }
    if (!admin.isActive) {
      return res.status(401).json({ success: false, message: 'Tài khoản đã bị vô hiệu hoá.' });
    }
    if (!admin.passwordHash) {
      return res.status(401).json({ success: false, message: 'Tài khoản chưa đặt mật khẩu.' });
    }

    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Đăng nhập thất bại' });
    }

    // Update last login
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    // Sign admin JWT
    const adminToken = jwt.sign(
      { userId: admin.id, role: admin.role, type: 'admin' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      success: true,
      token: adminToken,
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err: any) {
    console.error('[POST /auth/admin-login]', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
});



// ═══════════════════════════════════════════════════════════════
// UNIFIED LOGIN — query User table (both admin + regular)
// Body: { identifier: string, password: string }
//   identifier = phone OR email
// Returns JWT {userId, tier, role}
// ═══════════════════════════════════════════════════════════════
router.post('/login-v2', async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body || {};
    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập thông tin đăng nhập.' });
    }
    const idStr = String(identifier).trim();
    const isEmail = idStr.includes('@');
    const normId = isEmail ? idStr.toLowerCase() : idStr.replace(/[^0-9+]/g, '');

    if (!checkLoginRateLimit(normId)) {
      return res.status(429).json({ success: false, message: 'Quá nhiều lần đăng nhập sai. Thử lại sau 15 phút.' });
    }
    recordLoginAttempt(normId);

    const user = await prisma.user.findFirst({
      where: isEmail ? { email: normId } : { phone: normId }
    });

    if (!user || !(user as any).passwordHash) {
      return res.status(401).json({ success: false, message: 'Đăng nhập thất bại.' });
    }

    const ok = await bcrypt.compare(password, (user as any).passwordHash);
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Đăng nhập thất bại.' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() } as any
    });

    const token = jwt.sign(
      { userId: user.id, tier: user.tier, role: (user as any).role || 'USER' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        displayName: (user as any).displayName,
        tier: user.tier,
        role: (user as any).role || 'USER',
      }
    });
  } catch (err: any) {
    console.error('[POST /auth/login-v2]', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
});

// Alias: /admin/login → /login-v2 (backward compat)
router.post('/admin/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body || {};
    // Adapt admin-style body to unified format
    const idStr = String(email || '').trim();
    if (!idStr || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu.' });
    }
    const normEmail = idStr.toLowerCase();

    if (!checkLoginRateLimit(normEmail)) {
      return res.status(429).json({ success: false, message: 'Quá nhiều lần đăng nhập sai. Thử lại sau 15 phút.' });
    }
    recordLoginAttempt(normEmail);

    const user = await prisma.user.findFirst({ where: { email: normEmail } });
    if (!user || !(user as any).passwordHash) {
      return res.status(401).json({ success: false, message: 'Đăng nhập thất bại.' });
    }
    const ok = await bcrypt.compare(password, (user as any).passwordHash);
    if (!ok) return res.status(401).json({ success: false, message: 'Đăng nhập thất bại.' });

    const role = (user as any).role || 'USER';
    if (!['SUPER_ADMIN', 'RESEARCH_EDITOR', 'CONTENT_EDITOR', 'ANALYST'].includes(role)) {
      return res.status(403).json({ success: false, message: 'Không có quyền truy cập admin.' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() } as any
    });

    const token = jwt.sign(
      { userId: user.id, tier: user.tier, role, type: 'admin' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      success: true,
      token,
      admin: { id: user.id, email: user.email, role },
    });
  } catch (err: any) {
    console.error('[POST /auth/admin/login]', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
});

// POST /api/auth/set-password (v2 — save to User)
router.post('/set-password-v2', async (req: Request, res: Response) => {
  try {
    const { token: magicToken, password } = req.body || {};
    if (!magicToken || !password || String(password).length < 6) {
      return res.status(400).json({ success: false, message: 'Thiếu token hoặc mật khẩu (>=6 ký tự).' });
    }

    const lead = await prisma.lead.findFirst({ where: { magicToken } });
    if (!lead) return res.status(404).json({ success: false, message: 'Token không hợp lệ.' });
    if (lead.paymentStatus !== 'ACTIVATED' && lead.paymentStatus !== 'PAID') {
      return res.status(400).json({ success: false, message: 'Đơn hàng chưa được kích hoạt.' });
    }

    // Find or create User
    const normEmail = lead.email ? lead.email.toLowerCase() : null;
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          normEmail ? { email: normEmail } : {},
          lead.sdt ? { phone: lead.sdt } : {},
        ].filter(o => Object.keys(o).length > 0)
      }
    });

    const passwordHash = await bcrypt.hash(password, 12);

    if (!user) {
      user = await prisma.user.create({
        data: {
          phone: lead.sdt,
          email: normEmail,
          displayName: lead.ten || 'Sol Member',
          passwordHash,
          tier: lead.goi === 'FOUNDER' ? 'FOUNDER' : 'ACTIVE',
          role: 'USER',
          activeLeadId: lead.id,
          tierStartedAt: lead.activatedAt || new Date(),
          tierExpiresAt: lead.expiresAt,
        } as any
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          tier: lead.goi === 'FOUNDER' ? 'FOUNDER' : 'ACTIVE',
          activeLeadId: lead.id,
          tierStartedAt: lead.activatedAt || new Date(),
          tierExpiresAt: lead.expiresAt,
          lastLoginAt: new Date(),
        } as any
      });
    }

    // Update lead.userId link
    try {
      await (prisma.lead as any).update({
        where: { id: lead.id },
        data: { userId: user.id }
      });
    } catch {}

    const jwtToken = jwt.sign(
      { userId: user.id, tier: user.tier, role: (user as any).role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      success: true,
      token: jwtToken,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        displayName: (user as any).displayName,
        tier: user.tier,
        role: (user as any).role,
      }
    });
  } catch (err: any) {
    console.error('[POST /auth/set-password-v2]', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
});



export default router;
