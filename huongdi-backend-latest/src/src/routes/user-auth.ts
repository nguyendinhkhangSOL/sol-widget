// ═══════════════════════════════════════════════════════════════
// /api/user/*  — Unified auth routes (Free register + Session merge)
// Deploy: copy to /var/www/huongdi/backend/src/routes/user-auth.ts
// Mount in index.ts: app.use('/api/user', userAuthRouter)
// ═══════════════════════════════════════════════════════════════

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'huongdi-fallback-secret';
const JWT_EXPIRES_IN = '30d';
const BCRYPT_ROUNDS = 12;

// ─── Helper: normalize phone / email ─────────────────────────────
function normalizePhone(raw?: string): string | null {
  if (!raw) return null;
  const cleaned = String(raw).replace(/[^0-9+]/g, '').trim();
  if (cleaned.length < 9) return null;
  return cleaned;
}
function normalizeEmail(raw?: string): string | null {
  if (!raw) return null;
  const e = String(raw).trim().toLowerCase();
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(e)) return null;
  return e;
}

// ─── Helper: merge anonymous session → user ──────────────────────
async function mergeSessionToUser(sessionId: string, userId: string) {
  const result: Record<string, number> = { events: 0, p1: 0, p2: 0 };
  try {
    const anyPrisma = prisma as any;
    if (anyPrisma.userEvent?.updateMany) {
      const r = await anyPrisma.userEvent.updateMany({
        where: { sessionId, userId: null },
        data: { userId },
      });
      result.events = r.count || 0;
    }
    if (anyPrisma.userP1Result?.updateMany) {
      const r = await anyPrisma.userP1Result.updateMany({
        where: { sessionId, userId: null },
        data: { userId },
      });
      result.p1 = r.count || 0;
    }
    if (anyPrisma.userP2Result?.updateMany) {
      const r = await anyPrisma.userP2Result.updateMany({
        where: { sessionId, userId: null },
        data: { userId },
      });
      result.p2 = r.count || 0;
    }
  } catch (err) {
    console.warn('[mergeSessionToUser] warning', err);
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════
// POST /api/user/register  — Free tier register
// Body: { phone?, email?, password, displayName?, sessionId? }
// ═══════════════════════════════════════════════════════════════
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { phone, email, password, displayName, sessionId } = req.body || {};

    // Validation
    if (!password || String(password).length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu tối thiểu 6 ký tự.',
      });
    }
    const normPhone = normalizePhone(phone);
    const normEmail = normalizeEmail(email);
    if (!normPhone && !normEmail) {
      return res.status(400).json({
        success: false,
        message: 'Cần số điện thoại hoặc email hợp lệ.',
      });
    }

    // Check unique
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          normPhone ? { phone: normPhone } : {},
          normEmail ? { email: normEmail } : {},
        ].filter(o => Object.keys(o).length > 0),
      },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Số điện thoại hoặc email đã tồn tại. Vui lòng đăng nhập.',
      });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        phone: normPhone,
        email: normEmail,
        displayName: (displayName || 'Sol Member').toString().trim().substring(0, 100),
        passwordHash,
        tier: 'FREE',
        role: 'USER',
        lastLoginAt: new Date(),
      } as any,
    });

    // Merge session if provided
    let merged = {};
    if (sessionId) {
      merged = await mergeSessionToUser(String(sessionId), user.id);
    }

    const token = jwt.sign(
      { userId: user.id, tier: user.tier, role: user.role },
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
        role: (user as any).role,
      },
      merged,
    });
  } catch (err: any) {
    console.error('[POST /user/register]', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// POST /api/user/link-session  — Merge anonymous → user (auth req)
// Body: { sessionId }
// ═══════════════════════════════════════════════════════════════
router.post('/link-session', requireAuth, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body || {};
    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'sessionId required' });
    }
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const merged = await mergeSessionToUser(String(sessionId), userId);
    return res.json({ success: true, merged });
  } catch (err: any) {
    console.error('[POST /user/link-session]', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// GET /api/user/me  — Get current user info (auth req)
// ═══════════════════════════════════════════════════════════════
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ success: false });
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        email: true,
        displayName: true,
        tier: true,
        role: true,
        tierExpiresAt: true,
        lastLoginAt: true,
        createdAt: true,
      } as any,
    });
    if (!user) return res.status(404).json({ success: false });
    return res.json({ success: true, user });
  } catch (err: any) {
    console.error('[GET /user/me]', err);
    return res.status(500).json({ success: false });
  }
});

export default router;
