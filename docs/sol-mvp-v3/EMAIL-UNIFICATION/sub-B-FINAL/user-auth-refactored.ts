// ═══════════════════════════════════════════════════════════════
// /api/user/*  — REFACTORED cho Unified Auth
// - /register: link orphan lead → auto ACTIVE nếu email đã pay
// - /check-email: cho frontend /thanh-toan/ debounce
// - /me: đã có sẵn, giữ nguyên
// - /link-session: đã có sẵn, giữ nguyên
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

// ─── Helpers ─────────────────────────────────────────────
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

async function mergeSessionToUser(sessionId: string, userId: string) {
  const result: Record<string, number> = { events: 0, p1: 0, p2: 0 };
  try {
    const anyPrisma = prisma as any;
    if (anyPrisma.userEvent?.updateMany) {
      const r = await anyPrisma.userEvent.updateMany({
        where: { sessionId, userId: null }, data: { userId },
      });
      result.events = r.count || 0;
    }
    if (anyPrisma.userP1Result?.updateMany) {
      const r = await anyPrisma.userP1Result.updateMany({
        where: { sessionId, userId: null }, data: { userId },
      });
      result.p1 = r.count || 0;
    }
    if (anyPrisma.userP2Result?.updateMany) {
      const r = await anyPrisma.userP2Result.updateMany({
        where: { sessionId, userId: null }, data: { userId },
      });
      result.p2 = r.count || 0;
    }
  } catch (err) {
    console.warn('[mergeSessionToUser] warning', err);
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════
// POST /api/user/register  — REFACTORED
// Now: auto-link orphan lead + auto-upgrade tier
// ═══════════════════════════════════════════════════════════════
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { phone, email, password, displayName, sessionId } = req.body || {};

    // Validation
    if (!password || String(password).length < 6) {
      return res.status(400).json({
        success: false, message: 'Mật khẩu tối thiểu 6 ký tự.',
      });
    }
    const normPhone = normalizePhone(phone);
    const normEmail = normalizeEmail(email);
    if (!normPhone && !normEmail) {
      return res.status(400).json({
        success: false, message: 'Cần số điện thoại hoặc email hợp lệ.',
      });
    }

    // Check existing (any user - regardless of whether they have password)
    const existingWithPassword = await prisma.user.findFirst({
      where: {
        AND: [
          { passwordHash: { not: null } }, // Chỉ block nếu user đã có password
          {
            OR: [
              normPhone ? { phone: normPhone } : {},
              normEmail ? { email: normEmail } : {},
            ].filter(o => Object.keys(o).length > 0),
          },
        ],
      },
    });
    if (existingWithPassword) {
      return res.status(409).json({
        success: false, message: 'Số điện thoại hoặc email đã tồn tại. Vui lòng đăng nhập.',
      });
    }

    // ⭐ Check shell user (email/phone đã có nhưng chưa set password — từ pay-first flow)
    const shellUser = await prisma.user.findFirst({
      where: {
        AND: [
          { passwordHash: null },
          {
            OR: [
              normPhone ? { phone: normPhone } : {},
              normEmail ? { email: normEmail } : {},
            ].filter(o => Object.keys(o).length > 0),
          },
        ],
      },
      include: {
        leads: {
          where: { paymentStatus: 'ACTIVATED' },
          orderBy: { activatedAt: 'desc' },
          take: 1,
        },
      },
    });

    // ⭐ Check orphan lead (chưa link user_id)
    const orphanLead = normEmail
      ? await prisma.lead.findFirst({
          where: {
            email: normEmail,
            userId: null,
            paymentStatus: { in: ['ACTIVATED', 'PAID' as any] },
          },
          orderBy: { activatedAt: 'desc' },
        })
      : null;

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const now = new Date();

    // ⭐ TRANSACTION: create/update user + link lead
    const user = await prisma.$transaction(async (tx) => {
      // Case 1: Shell user tồn tại (email đã pay trước qua /thanh-toan/) — UPDATE
      if (shellUser) {
        const latestActivatedLead = shellUser.leads[0];
        const shouldUpgrade = !!latestActivatedLead;
        const upgraded = await tx.user.update({
          where: { id: shellUser.id },
          data: {
            passwordHash,
            displayName: shellUser.displayName || (displayName || 'Sol Member').toString().trim().substring(0, 100),
            phone: shellUser.phone || normPhone,
            email: shellUser.email || normEmail,
            lastLoginAt: now,
            emailVerified: !!(shellUser.emailVerified || normEmail),
            // Auto-upgrade tier từ shell → ACTIVE nếu có lead activated
            tier: shouldUpgrade && shellUser.tier === 'FREE' ? (latestActivatedLead.goi as any) : shellUser.tier,
            tierStartedAt: shouldUpgrade && !shellUser.tierStartedAt ? (latestActivatedLead.activatedAt || now) : shellUser.tierStartedAt,
            tierExpiresAt: shouldUpgrade && !shellUser.tierExpiresAt
              ? (latestActivatedLead.goi === 'FOUNDER' ? null : latestActivatedLead.expiresAt)
              : shellUser.tierExpiresAt,
            activeLeadId: shellUser.activeLeadId || latestActivatedLead?.id,
          } as any,
        });
        console.log(`[register] Activated shell user ${shellUser.id} → tier=${upgraded.tier}`);
        return upgraded;
      }

      // Case 2: Orphan lead tồn tại (email đã pay + tạo lead riêng chưa link user)
      if (orphanLead) {
        const tier: 'ACTIVE' | 'FOUNDER' = orphanLead.goi === 'FOUNDER' ? 'FOUNDER' : 'ACTIVE';
        const newUser = await tx.user.create({
          data: {
            phone: normPhone,
            email: normEmail,
            displayName: (displayName || orphanLead.ten || 'Sol Member').toString().trim().substring(0, 100),
            passwordHash,
            tier: tier as any,
            tierStartedAt: orphanLead.activatedAt || now,
            tierExpiresAt: tier === 'FOUNDER' ? null : orphanLead.expiresAt,
            activeLeadId: orphanLead.id,
            role: 'USER',
            lastLoginAt: now,
          } as any,
        });
        // Link orphan lead
        await tx.lead.update({
          where: { id: orphanLead.id },
          data: { userId: newUser.id },
        });
        console.log(`[register] Linked orphan lead #${orphanLead.id} to new user ${newUser.id} → tier=${tier}`);
        return newUser;
      }

      // Case 3: User hoàn toàn mới, không có lead → FREE bình thường
      return await tx.user.create({
        data: {
          phone: normPhone,
          email: normEmail,
          displayName: (displayName || 'Sol Member').toString().trim().substring(0, 100),
          passwordHash,
          tier: 'FREE',
          role: 'USER',
          lastLoginAt: now,
        } as any,
      });
    });

    // Merge session
    let merged = {};
    if (sessionId) merged = await mergeSessionToUser(String(sessionId), user.id);

    const token = jwt.sign(
      { userId: user.id, tier: user.tier, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user.id, phone: user.phone, email: user.email,
        displayName: (user as any).displayName,
        tier: user.tier, role: (user as any).role,
        tierExpiresAt: user.tierExpiresAt,
      },
      merged,
      autoActivated: user.tier !== 'FREE',
      message: user.tier !== 'FREE'
        ? `Chào mừng! Tài khoản của bạn đã tự động kích hoạt Sol La Bàn ${user.tier}.`
        : 'Đăng ký thành công.',
    });
  } catch (err: any) {
    console.error('[POST /user/register]', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// GET /api/user/check-email  — For frontend /thanh-toan/ debounce
// Query: ?email=xxx
// ═══════════════════════════════════════════════════════════════
router.get('/check-email', async (req: Request, res: Response) => {
  try {
    const email = normalizeEmail(String(req.query.email || ''));
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email không hợp lệ' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, passwordHash: true, tier: true },
    });

    if (!user) {
      return res.json({ success: true, exists: false });
    }

    return res.json({
      success: true,
      exists: true,
      hasPassword: !!user.passwordHash,
      tier: user.tier,
      suggestedAction: user.passwordHash ? 'login' : 'set_password_via_magic_link',
    });
  } catch (err: any) {
    console.error('[GET /user/check-email]', err);
    return res.status(500).json({ success: false });
  }
});

// ═══════════════════════════════════════════════════════════════
// POST /api/user/link-session  (giữ nguyên)
// ═══════════════════════════════════════════════════════════════
router.post('/link-session', requireAuth, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body || {};
    if (!sessionId) return res.status(400).json({ success: false, message: 'sessionId required' });
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const merged = await mergeSessionToUser(String(sessionId), userId);
    return res.json({ success: true, merged });
  } catch (err: any) {
    console.error('[POST /user/link-session]', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// GET /api/user/me  (giữ nguyên)
// ═══════════════════════════════════════════════════════════════
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ success: false });
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, phone: true, email: true, displayName: true,
        tier: true, role: true, tierExpiresAt: true, tierStartedAt: true,
        lastLoginAt: true, createdAt: true, activeLeadId: true,
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
