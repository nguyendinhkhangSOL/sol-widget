// backend/src/zalo/messagingRoutes.ts
//
// API cho Bộ Điều Khiển Tin Nhắn (Messaging Control Center).
//   GET    /api/messaging/policy                — list tất cả policies
//   GET    /api/messaging/policy/global         — get global default
//   PUT    /api/messaging/policy/global         — update global
//   GET    /api/messaging/policy/cohort/:key    — get cohort (LIGHT/MODERATE/HEAVY)
//   PUT    /api/messaging/policy/cohort/:key    — update cohort rules
//   GET    /api/messaging/profile/:userId       — get user messaging profile
//   PUT    /api/messaging/profile/:userId       — update user override
//   GET    /api/messaging/stats                 — dashboard stats (sent/open/click 7d)
//
// Tất cả endpoints yêu cầu admin.

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { logger } from '../utils/logger';
import { authMiddleware, type AuthedRequest } from '../auth/middleware';

export const messagingRouter = Router();
messagingRouter.use(authMiddleware);

async function requireAdmin(userId: string): Promise<boolean> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } });
  return !!u?.isAdmin;
}

// ─── Validation schemas ─────────────────────────────────────────────────
const policySchema = z.object({
  intensity: z.enum(['LIGHT', 'MEDIUM', 'HEAVY', 'CUSTOM']).default('MEDIUM'),
  config: z.record(z.any()).default({}),
  enabled: z.boolean().default(true),
});

const profileSchema = z.object({
  cohortKey: z.enum(['LIGHT', 'MODERATE', 'HEAVY']).optional(),
  ftndScore: z.number().int().min(0).max(10).optional(),
  boostMode: z.boolean().optional(),
  boostUntil: z.string().datetime().optional().nullable(),
  muteUntil: z.string().datetime().optional().nullable(),
  crisisThreshold: z.number().int().min(1).max(10).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

// ─── GET /policy — list tất cả ──────────────────────────────────────────
messagingRouter.get('/policy', async (req: AuthedRequest, res) => {
  if (!(await requireAdmin(req.userId!))) {
    return res.status(403).json({ error: 'forbidden' });
  }
  const policies = await prisma.messagingPolicy.findMany({
    orderBy: [{ scope: 'asc' }, { cohortKey: 'asc' }],
  });
  res.json({ items: policies });
});

// ─── GET /policy/global ─────────────────────────────────────────────────
messagingRouter.get('/policy/global', async (req: AuthedRequest, res) => {
  if (!(await requireAdmin(req.userId!))) {
    return res.status(403).json({ error: 'forbidden' });
  }
  const policy = await prisma.messagingPolicy.findFirst({
    where: { scope: 'GLOBAL' },
  });
  if (!policy) {
    // Return default
    return res.json({
      scope: 'GLOBAL',
      intensity: 'MEDIUM',
      config: {},
      enabled: true,
      isDefault: true,
    });
  }
  res.json(policy);
});

// ─── PUT /policy/global ─────────────────────────────────────────────────
messagingRouter.put('/policy/global', async (req: AuthedRequest, res) => {
  if (!(await requireAdmin(req.userId!))) {
    return res.status(403).json({ error: 'forbidden' });
  }
  const parsed = policySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_body', details: parsed.error.format() });
  }

  const existing = await prisma.messagingPolicy.findFirst({
    where: { scope: 'GLOBAL' },
  });

  let result;
  if (existing) {
    result = await prisma.messagingPolicy.update({
      where: { id: existing.id },
      data: {
        intensity: parsed.data.intensity,
        config: parsed.data.config,
        enabled: parsed.data.enabled,
      },
    });
  } else {
    result = await prisma.messagingPolicy.create({
      data: {
        scope: 'GLOBAL',
        intensity: parsed.data.intensity,
        config: parsed.data.config,
        enabled: parsed.data.enabled,
        createdBy: req.userId,
      },
    });
  }
  logger.info({ scope: 'GLOBAL', intensity: parsed.data.intensity }, 'MessagingPolicy global updated');
  res.json(result);
});

// ─── GET /policy/cohort/:key ────────────────────────────────────────────
messagingRouter.get('/policy/cohort/:key', async (req: AuthedRequest, res) => {
  if (!(await requireAdmin(req.userId!))) {
    return res.status(403).json({ error: 'forbidden' });
  }
  const key = req.params.key.toUpperCase();
  if (!['LIGHT', 'MODERATE', 'HEAVY'].includes(key)) {
    return res.status(400).json({ error: 'invalid_cohort' });
  }

  const policy = await prisma.messagingPolicy.findFirst({
    where: { scope: 'COHORT', cohortKey: key },
  });
  if (!policy) {
    // Default rules per cohort
    const defaults: Record<string, any> = {
      LIGHT: {
        SOL_DAILY_CHECKIN: { enabled: false, reason: 'Light cohort skip daily' },
        SOL_VOICE_RELEASE: { enabled: true, days: [1, 22, 52] },
        SOL_T_MINUS_2: { enabled: false },
        crisisThreshold: 8,
      },
      MODERATE: {
        SOL_DAILY_CHECKIN: { enabled: true, sendHour: 20 },
        SOL_VOICE_RELEASE: { enabled: true, days: [1, 3, 7, 14, 22, 30, 51] },
        SOL_T_MINUS_2: { enabled: true, sendHour: 7 },
        crisisThreshold: 7,
      },
      HEAVY: {
        SOL_DAILY_CHECKIN: { enabled: true, sendHours: [8, 20] },
        SOL_VOICE_RELEASE: { enabled: true, days: [1, 3, 5, 7, 10, 14, 17, 22, 30, 51] },
        SOL_T_MINUS_2: { enabled: true, sendHour: 7, startDay: 18 },
        crisisThreshold: 6,
        escalateToKhang: true,
      },
    };
    return res.json({
      scope: 'COHORT',
      cohortKey: key,
      intensity: key === 'LIGHT' ? 'LIGHT' : key === 'HEAVY' ? 'HEAVY' : 'MEDIUM',
      config: defaults[key],
      enabled: true,
      isDefault: true,
    });
  }
  res.json(policy);
});

// ─── PUT /policy/cohort/:key ────────────────────────────────────────────
messagingRouter.put('/policy/cohort/:key', async (req: AuthedRequest, res) => {
  if (!(await requireAdmin(req.userId!))) {
    return res.status(403).json({ error: 'forbidden' });
  }
  const key = req.params.key.toUpperCase();
  if (!['LIGHT', 'MODERATE', 'HEAVY'].includes(key)) {
    return res.status(400).json({ error: 'invalid_cohort' });
  }
  const parsed = policySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_body', details: parsed.error.format() });
  }

  const existing = await prisma.messagingPolicy.findFirst({
    where: { scope: 'COHORT', cohortKey: key },
  });

  let result;
  if (existing) {
    result = await prisma.messagingPolicy.update({
      where: { id: existing.id },
      data: parsed.data,
    });
  } else {
    result = await prisma.messagingPolicy.create({
      data: {
        scope: 'COHORT',
        cohortKey: key,
        intensity: parsed.data.intensity,
        config: parsed.data.config,
        enabled: parsed.data.enabled,
        createdBy: req.userId,
      },
    });
  }
  res.json(result);
});

// ─── GET /profile/:userId ───────────────────────────────────────────────
messagingRouter.get('/profile/:userId', async (req: AuthedRequest, res) => {
  if (!(await requireAdmin(req.userId!))) {
    return res.status(403).json({ error: 'forbidden' });
  }
  const profile = await prisma.userMessagingProfile.findUnique({
    where: { userId: req.params.userId },
  });
  if (!profile) {
    return res.json({
      userId: req.params.userId,
      cohortKey: 'MODERATE',
      ftndScore: null,
      boostMode: false,
      muteUntil: null,
      crisisThreshold: null,
      engagementScore: 0,
      totalSent: 0,
      totalOpened: 0,
      totalClicked: 0,
      totalBlocked: 0,
      isDefault: true,
    });
  }
  res.json(profile);
});

// ─── PUT /profile/:userId ───────────────────────────────────────────────
messagingRouter.put('/profile/:userId', async (req: AuthedRequest, res) => {
  if (!(await requireAdmin(req.userId!))) {
    return res.status(403).json({ error: 'forbidden' });
  }
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_body', details: parsed.error.format() });
  }

  // Ensure user exists
  const user = await prisma.user.findUnique({ where: { id: req.params.userId } });
  if (!user) return res.status(404).json({ error: 'user_not_found' });

  const data: any = { ...parsed.data };
  if (data.boostUntil) data.boostUntil = new Date(data.boostUntil);
  if (data.muteUntil) data.muteUntil = new Date(data.muteUntil);

  const result = await prisma.userMessagingProfile.upsert({
    where: { userId: req.params.userId },
    update: data,
    create: {
      userId: req.params.userId,
      cohortKey: data.cohortKey ?? 'MODERATE',
      ...data,
    },
  });
  logger.info({ userId: req.params.userId }, 'UserMessagingProfile updated');
  res.json(result);
});

// ─── GET /stats — dashboard tổng quan ──────────────────────────────────
messagingRouter.get('/stats', async (req: AuthedRequest, res) => {
  if (!(await requireAdmin(req.userId!))) {
    return res.status(403).json({ error: 'forbidden' });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Tổng tin 24h
  const sent24h = await prisma.zNSLog.count({
    where: { sentAt: { gte: today, lt: tomorrow } },
  });
  const sent7d = await prisma.zNSLog.count({
    where: { sentAt: { gte: sevenDaysAgo } },
  });
  const opened7d = await prisma.zNSLog.count({
    where: { sentAt: { gte: sevenDaysAgo }, openedAt: { not: null } },
  });
  const clicked7d = await prisma.zNSLog.count({
    where: { sentAt: { gte: sevenDaysAgo }, clickedAt: { not: null } },
  });
  const cost30d = await prisma.zNSLog.aggregate({
    where: { sentAt: { gte: thirtyDaysAgo } },
    _sum: { costVnd: true },
  });

  // User cohort distribution
  const cohorts = await prisma.userMessagingProfile.groupBy({
    by: ['cohortKey'],
    _count: { userId: true },
  });
  const cohortMap: Record<string, number> = { LIGHT: 0, MODERATE: 0, HEAVY: 0 };
  cohorts.forEach((c) => { cohortMap[c.cohortKey] = c._count.userId; });

  // Block rate
  const totalBlocked = await prisma.zaloOAUser.count({ where: { blockedAt: { not: null } } });
  const totalFollowers = await prisma.zaloOAUser.count();

  // Per-template stats
  const perTemplate = await prisma.zNSLog.groupBy({
    by: ['templateCode'],
    where: { sentAt: { gte: sevenDaysAgo } },
    _count: { id: true },
    _sum: { costVnd: true },
  });

  res.json({
    sent24h,
    sent7d,
    opened7d,
    clicked7d,
    openRate: sent7d > 0 ? Math.round((opened7d / sent7d) * 100) : 0,
    clickRate: sent7d > 0 ? Math.round((clicked7d / sent7d) * 100) : 0,
    cost30dVnd: cost30d._sum.costVnd ?? 0,
    cohorts: cohortMap,
    totalFollowers,
    blockRate: totalFollowers > 0 ? Math.round((totalBlocked / totalFollowers) * 100 * 10) / 10 : 0,
    perTemplate: perTemplate.map((t) => ({
      code: t.templateCode,
      sent: t._count.id,
      cost: t._sum.costVnd ?? 0,
    })),
  });
});

// ─── GET /users — list users với profile để admin chọn ──────────────────
messagingRouter.get('/users', async (req: AuthedRequest, res) => {
  if (!(await requireAdmin(req.userId!))) {
    return res.status(403).json({ error: 'forbidden' });
  }
  const search = (req.query.q as string) ?? '';
  const limit = Math.min(parseInt((req.query.limit as string) ?? '50'), 200);

  const users = await prisma.user.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {},
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      pronouns: true,
      tier: true,
      quitDate: true,
      ftndScore: true,
      messagingProfile: true,
    },
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  res.json({ items: users });
});
