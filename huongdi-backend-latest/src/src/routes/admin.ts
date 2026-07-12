import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { DirCategory, DirStatus, Confidence } from '@prisma/client';
import { prisma } from '../utils/db';
import { requireAuth, requireAdmin, requireSuperAdmin } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import crypto from 'crypto';
import { sendMagicLinkToUser, makeZaloDeepLink, makeZaloMessage } from '../services/notification';

export const adminRouter = Router();

// All admin routes require auth + admin role
adminRouter.use(requireAuth, requireAdmin);

// ── GET /api/admin/dashboard ──────────────────────────────
adminRouter.get('/dashboard', async (_req, res, next) => {
  try {
    const [
      totalUsers,
      totalDirections,
      totalP1,
      totalP2,
      recentEvents,
      topDirections,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.direction.count({ where: { status: 'PUBLISHED' } }),
      prisma.p1Result.count(),
      prisma.p2Result.count(),
      prisma.userEvent.groupBy({
        by: ['eventType'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      prisma.savedDirection.groupBy({
        by: ['directionId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
    ]);

    // Funnel: P1 → P2 → P3 conversion
    const p3Views = await prisma.userEvent.count({ where: { eventType: 'P3_VIEW' } });

    res.json({
      totalUsers,
      totalDirections,
      totalP1,
      totalP2,
      p3Views,
      funnel: {
        p1: totalP1,
        p2: totalP2,
        p3: p3Views,
        p1ToP2: totalP1 > 0 ? Math.round((totalP2 / totalP1) * 100) : 0,
        p2ToP3: totalP2 > 0 ? Math.round((p3Views / totalP2) * 100) : 0,
      },
      eventBreakdown: recentEvents,
      topSavedDirections: topDirections,
    });
  } catch (err) {
    next(err);
  }
});

// ── DIRECTIONS CRUD ───────────────────────────────────────

const DirUpsertSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  tagline: z.string().optional(),
  category: z.nativeEnum(DirCategory),
  status: z.nativeEnum(DirStatus).default('DRAFT'),
  confidence: z.nativeEnum(Confidence).default('LOW'),
  sortOrder: z.number().default(0),
  // Vector P
  vpPeople: z.number().min(0).max(100),
  vpExpert: z.number().min(0).max(100),
  vpBuilder: z.number().min(0).max(100),
  vpIndependent: z.number().min(0).max(100),
  // Vector R
  vrCapital: z.number().min(0).max(100),
  vrTime: z.number().min(0).max(100),
  vrTech: z.number().min(0).max(100),
  vrNetwork: z.number().min(0).max(100),
  vrRisk: z.number().min(0).max(100),
  vrEnergy: z.number().min(0).max(100),
  // Vector B
  vbIncomeSpeed: z.number().min(0).max(100),
  vbIncomePot: z.number().min(0).max(100),
  vbScalability: z.number().min(0).max(100),
  vbAiLeverage: z.number().min(0).max(100),
  // Vector S
  vsExpLeverage: z.number().min(0).max(100),
  vsRelLeverage: z.number().min(0).max(100),
  vsLearningDiff: z.number().min(0).max(100),
  vsHealthReq: z.number().min(0).max(100),
  // Content
  description: z.string().optional(),
  whyFit: z.string().optional(),
  barriers: z.array(z.string()).optional(),
  solArticleUrl: z.string().url().nullish().or(z.literal('')),
  ebookUrl: z.string().url().nullish().or(z.literal('')),
  roadmap30: z.any().optional(),
  roadmap90: z.any().optional(),
  roadmap180: z.any().optional(),
});

adminRouter.get('/directions', async (_req, res, next) => {
  try {
    const dirs = await prisma.direction.findMany({
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
      include: { _count: { select: { savedBy: true, caseStudies: true } } },
    });
    res.json(dirs);
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/directions', async (req, res, next) => {
  try {
    const body = DirUpsertSchema.parse(req.body);
    const dir = await prisma.direction.create({
      data: {
        ...body,
        barriers: body.barriers ?? [],
        createdById: req.user!.userId,
        publishedAt: body.status === 'PUBLISHED' ? new Date() : null,
      },
    });
    res.status(201).json(dir);
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/directions/:id', async (req, res, next) => {
  try {
    const dir = await prisma.direction.findUnique({
      where: { id: req.params.id as string },
      include: { caseStudies: true },
    });
    if (!dir) throw new AppError(404, 'Direction not found', 'NOT_FOUND');
    res.json(dir);
  } catch (err) {
    next(err);
  }
});

adminRouter.put('/directions/:id', async (req, res, next) => {
  try {
    const body = DirUpsertSchema.parse(req.body);
    const existing = await prisma.direction.findUnique({ where: { id: req.params.id as string } });
    if (!existing) throw new AppError(404, 'Direction not found', 'NOT_FOUND');

    const wasUnpublished = existing.status !== 'PUBLISHED';
    const nowPublished = body.status === 'PUBLISHED';

    const dir = await prisma.direction.update({
      where: { id: req.params.id as string },
      data: {
        ...body,
        barriers: body.barriers ?? [],
        version: { increment: 1 },
        publishedAt: wasUnpublished && nowPublished ? new Date() : existing.publishedAt,
      },
    });
    res.json(dir);
  } catch (err) {
    next(err);
  }
});

adminRouter.delete('/directions/:id', requireSuperAdmin, async (req, res, next) => {
  try {
    await prisma.direction.update({
      where: { id: req.params.id as string },
      data: { status: 'ARCHIVED' },
    });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// ── Live Match Preview ────────────────────────────────────
// Admin enters direction vectors → instant match % against sample P1/P2
adminRouter.post('/directions/preview-match', async (req, res, next) => {
  try {
    const body = z.object({
      // Direction vectors being tested
      vpPeople: z.number(), vpExpert: z.number(), vpBuilder: z.number(), vpIndependent: z.number(),
      vrCapital: z.number(), vrTime: z.number(), vrTech: z.number(),
      vrNetwork: z.number(), vrRisk: z.number(), vrEnergy: z.number(),
      vbIncomeSpeed: z.number(), vbIncomePot: z.number(), vbScalability: z.number(), vbAiLeverage: z.number(),
      // User vectors to test against
      p1: z.object({ people: z.number(), expert: z.number(), builder: z.number(), independent: z.number() }),
      p2: z.object({ experience: z.number(), capital: z.number(), time: z.number(), technology: z.number(), network: z.number(), risk: z.number(), energy: z.number() }),
    }).parse(req.body);

    const pm = cosineSim(
      [body.p1.people, body.p1.expert, body.p1.builder, body.p1.independent],
      [body.vpPeople, body.vpExpert, body.vpBuilder, body.vpIndependent]
    );
    const rm = cosineSim(
      [body.p2.experience, body.p2.capital, body.p2.time, body.p2.technology, body.p2.network, body.p2.risk, body.p2.energy],
      [body.vrCapital, body.vrTime, body.vrTech, body.vrNetwork, body.vrRisk, body.vrEnergy, body.vrCapital]
    );
    const gm = (body.vbIncomeSpeed + body.vbIncomePot + body.vbScalability + body.vbAiLeverage) / 400;
    const score = Math.min(Math.round((pm * 0.5 + rm * 0.35 + gm * 0.15) * 100), 99);

    res.json({ matchScore: score, pm: Math.round(pm * 100), rm: Math.round(rm * 100), gm: Math.round(gm * 100) });
  } catch (err) {
    next(err);
  }
});

// ── USERS ─────────────────────────────────────────────────
// ─── REPLACE existing adminRouter.get('/users', ...) ─────────
adminRouter.get('/users', async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Math.min(Number(req.query.limit || 50), 200);
    const tier = req.query.tier as string | undefined;
    const search = (req.query.search as string || '').trim();

    const where: any = {};
    if (tier && ['FREE', 'ACTIVE', 'FOUNDER', 'EXPIRED'].includes(tier)) {
      where.tier = tier;
    }
    if (search) {
      where.OR = [
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total, tierCounts] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
        select: {
          id: true,
          email: true,
          zaloId: true,
          phone: true,
          displayName: true,
          avatarUrl: true,
          tier: true,
          tierStartedAt: true,
          tierExpiresAt: true,
          activeLeadId: true,
          role: true,
          isActive: true,
          lastSeenAt: true,
          createdAt: true,
          _count: {
            select: {
              p1Results: true,
              p2Results: true,
              savedDirs: true,
              outcomes: true,
              events: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
      prisma.user.groupBy({ by: ['tier'], _count: true }),
    ]);

    res.json({
      users,
      total,
      page,
      pages: Math.ceil(total / limit),
      tierCounts,
    });
  } catch (err) {
    next(err);
  }
});

// ─── NEW: GET /api/admin/users/:id — Detail ─────────────────
adminRouter.get('/users/:id', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id as string },
      include: {
        activeLead: true,
        p1Results: { orderBy: { createdAt: 'desc' }, take: 10 },
        p2Results: { orderBy: { createdAt: 'desc' }, take: 10 },
        savedDirs: {
          orderBy: { createdAt: 'desc' },
          include: {
            direction: {
              select: { id: true, name: true, slug: true, category: true, tagline: true },
            },
          },
        },
        outcomes: {
          orderBy: { createdAt: 'desc' },
          include: {
            direction: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        events: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
});

// ─── NEW: PATCH /api/admin/users/:id/tier — Manual tier update ─
adminRouter.patch('/users/:id/tier', requireSuperAdmin, async (req, res, next) => {
  try {
    const { tier, tierExpiresAt } = z.object({
      tier: z.enum(['FREE', 'ACTIVE', 'FOUNDER', 'EXPIRED']),
      tierExpiresAt: z.string().datetime().optional(),
    }).parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.params.id as string },
      data: {
        tier: tier as any,
        tierStartedAt: new Date(),
        tierExpiresAt: tierExpiresAt ? new Date(tierExpiresAt) : null,
      },
    });

    res.json(user);
  } catch (err) {
    next(err);
  }
});

// ─── NEW: GET /api/admin/sessions — Anonymous sessions ──────
// P1/P2 results với userId = null → sessions chưa đăng ký
adminRouter.get('/sessions', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit || 100), 500);

    // Aggregate anonymous sessions từ p1_results + p2_results
    const p1Sessions = await prisma.p1Result.findMany({
      where: { userId: null },
      select: { sessionId: true, createdAt: true, people: true, expert: true, builder: true, independent: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const p2Sessions = await prisma.p2Result.findMany({
      where: { userId: null },
      select: { sessionId: true, createdAt: true, experience: true, capital: true, incomeGoal: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Merge by sessionId
    const merged = new Map<string, any>();

    p1Sessions.forEach(p1 => {
      merged.set(p1.sessionId, {
        sessionId: p1.sessionId,
        p1: p1,
        p2: null,
        latestActivity: p1.createdAt,
      });
    });

    p2Sessions.forEach(p2 => {
      const existing = merged.get(p2.sessionId);
      if (existing) {
        existing.p2 = p2;
        if (p2.createdAt > existing.latestActivity) {
          existing.latestActivity = p2.createdAt;
        }
      } else {
        merged.set(p2.sessionId, {
          sessionId: p2.sessionId,
          p1: null,
          p2: p2,
          latestActivity: p2.createdAt,
        });
      }
    });

    const sessions = Array.from(merged.values()).sort((a, b) =>
      new Date(b.latestActivity).getTime() - new Date(a.latestActivity).getTime()
    );

    res.json({
      total: sessions.length,
      sessions: sessions.slice(0, limit),
    });
  } catch (err) {
    next(err);
  }
});

adminRouter.patch('/users/:id/role', requireSuperAdmin, async (req, res, next) => {
  try {
    const { role } = z.object({ role: z.string() }).parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.params.id as string },
      data: { role: role as any },
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// ── ADMIN USERS ───────────────────────────────────────────
adminRouter.post('/admins', requireSuperAdmin, async (req, res, next) => {
  try {
    const body = z.object({
      email: z.string().email(),
      password: z.string().min(10),
      displayName: z.string(),
      role: z.string(),
    }).parse(req.body);

    const passwordHash = await bcrypt.hash(body.password, 12);
    const admin = await prisma.adminUser.create({
      data: { email: body.email, passwordHash, displayName: body.displayName, role: body.role as any },
    });
    res.status(201).json({ id: admin.id, email: admin.email, displayName: admin.displayName, role: admin.role });
  } catch (err) {
    next(err);
  }
});

// ── Helpers ───────────────────────────────────────────────
function cosineSim(a: number[], b: number[]): number {
  const dot = a.reduce((sum, v, i) => sum + v * (b[i] ?? 0), 0);
  const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}


// ═════════════════ LEADS MANAGEMENT (User Management V1) ═════════════════

adminRouter.get('/leads', async (req, res) => {
  try {
    const statusRaw = String(req.query.status || 'all').toUpperCase();
    const search    = String(req.query.search || '').trim();
    const page      = Math.max(1, parseInt(String(req.query.page || '1')));
    const limit     = Math.min(200, parseInt(String(req.query.limit || '50')));
    const skip      = (page - 1) * limit;

    const where: any = {};
    if (statusRaw !== 'ALL') where.paymentStatus = statusRaw as any;
    if (search) {
      where.OR = [
        { ten:   { contains: search, mode: 'insensitive' } },
        { sdt:   { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
        { zalo:  { contains: search } },
      ];
    }

    const [total, leads, summaryRows] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit, skip }),
      prisma.lead.groupBy({
        by: ['paymentStatus'],
        _count: { _all: true },
        _sum: { amount: true },
      }),
    ]);

    const summary = summaryRows.map(r => ({
      payment_status: r.paymentStatus,
      count: r._count._all,
      total: r._sum.amount || 0,
    }));

    return res.json({ success: true, leads, total, page, limit, summary });
  } catch (err: any) {
    console.error('[GET /admin/leads]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

adminRouter.get('/leads/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { notifications: { orderBy: { sentAt: 'desc' } } },
  });
  if (!lead) return res.status(404).json({ success: false, message: 'Not found' });
  return res.json({ success: true, lead });
});

adminRouter.post('/leads/:id/approve', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) return res.status(404).json({ success: false, message: 'Not found' });
    if (lead.paymentStatus === 'ACTIVATED') {
      return res.status(400).json({ success: false, message: 'Lead đã activated.' });
    }

    const token   = crypto.randomBytes(24).toString('hex');
    const now     = new Date();
    const expires = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    const username = (req as any).user?.username || 'admin';

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        paymentStatus: 'PAID' as any,
        magicToken:    token,
        magicSentAt:   now,
        expiresAt:     expires,
        approvedBy:    username,
        notes:         req.body?.notes || lead.notes,
      }
    });

    const magicLink = `https://sol.vn/kich-hoat/?token=${token}`;
    let notif: any = { status: 'skipped', message: 'SMTP not configured' };
    try {
      notif = await sendMagicLinkToUser(updated, magicLink);
    } catch (e: any) {
      console.warn('[approve] sendMagicLinkToUser failed:', e.message);
      notif = { status: 'FAILED', error: e.message };
    }

    return res.json({ success: true, magic_link: magicLink, expires_at: expires, notification: notif });
  } catch (err: any) {
    console.error('[POST /admin/leads/:id/approve]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

adminRouter.post('/leads/:id/reject', async (req, res) => {
  const id = parseInt(req.params.id);
  const reason = String(req.body?.reason || '').trim();
  if (!reason) return res.status(400).json({ success: false, message: 'Nhập lý do.' });
  const username = (req as any).user?.username || 'admin';
  try {
    await prisma.lead.update({
      where: { id },
      data: { paymentStatus: 'CANCELLED' as any, cancelReason: reason, approvedBy: username },
    });
    return res.json({ success: true });
  } catch {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
});

adminRouter.post('/leads/:id/resend-magic', async (req, res) => {
  const id = parseInt(req.params.id);
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead || !lead.magicToken) {
    return res.status(400).json({ success: false, message: 'Lead chưa approve. Approve trước.' });
  }
  const magicLink = `https://sol.vn/kich-hoat/?token=${lead.magicToken}`;
  const notif = await sendMagicLinkToUser(lead, magicLink);
  return res.json({ success: true, magic_link: magicLink, notification: notif });
});

adminRouter.get('/leads/:id/zalo-helper', async (req, res) => {
  const id = parseInt(req.params.id);
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead || !lead.magicToken) {
    return res.status(400).json({ success: false, message: 'Lead chưa approve.' });
  }
  const magicLink = `https://sol.vn/kich-hoat/?token=${lead.magicToken}`;
  return res.json({
    success:    true,
    deep_link:  makeZaloDeepLink(lead.zalo || lead.sdt),
    message:    makeZaloMessage(lead, magicLink),
    magic_link: magicLink,
  });
});
