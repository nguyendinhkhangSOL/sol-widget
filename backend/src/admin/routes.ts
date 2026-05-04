// backend/src/admin/routes.ts
// Admin-only endpoints. Tất cả yêu cầu authMiddleware + adminMiddleware.

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authMiddleware, adminMiddleware, type AuthedRequest } from '../auth/middleware';
import {
  getAiSettings,
  saveAiSettings,
  maskAiSettings,
} from '../ai/settings';
import { providerCatalog } from '../ai/providers';
import { pingProvider } from '../ai/mentor';
import { computeTierState, effectiveTier } from '../tiers/featureGates';
import { applyTierUpgrade } from '../payments/routes';
import {
  getChecklistConfig,
  saveChecklistConfig,
  type QDayChecklistConfig,
} from '../tiers/qDayChecklist';
import { runContentAudit } from './audit/contentAudit';
import { contentRouter } from './content/routes';

export const adminRouter = Router();

adminRouter.use(authMiddleware, adminMiddleware);

// /admin/content/audit — content audit (runContentAudit), MUST be before content router mount
// because content router has GET /:id which would match "/audit" as if id="audit".
adminRouter.get('/content/audit', async (_req, res) => {
  const report = await runContentAudit();
  res.json(report);
});

// Mount content management routes — /admin/content/*
adminRouter.use('/content', contentRouter);

/* ─── DASHBOARD STATS ─────────────────────────────────────── */

adminRouter.get('/stats', async (_req, res) => {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    usersTotal,
    usersActive7d,
    usersInJourney,
    messagesToday,
    messagesUser24h,
    messagesAi24h,
    checkinsToday,
    crises24h,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { lastCheckinDate: { gte: since7d } } }),
    prisma.user.count({ where: { quitDate: { not: null } } }),
    prisma.message.count({
      where: { createdAt: { gte: startOfDay() } },
    }),
    prisma.message.count({
      where: { role: 'USER', createdAt: { gte: since24h } },
    }),
    prisma.message.count({
      where: { role: 'ASSISTANT', createdAt: { gte: since24h } },
    }),
    prisma.checkIn.count({ where: { createdAt: { gte: startOfDay() } } }),
    prisma.crisisEvent.count({ where: { createdAt: { gte: since24h } } }),
  ]);

  res.json({
    users: {
      total: usersTotal,
      active7d: usersActive7d,
      inJourney: usersInJourney,
    },
    messages: {
      today: messagesToday,
      user24h: messagesUser24h,
      ai24h: messagesAi24h,
    },
    checkins: {
      today: checkinsToday,
    },
    crises: {
      last24h: crises24h,
    },
    timestamp: new Date().toISOString(),
  });
});

function startOfDay() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/* ─── AI SETTINGS ─────────────────────────────────────────── */

adminRouter.get('/settings/ai', async (_req, res) => {
  const s = await getAiSettings(true);
  res.json({
    current: maskAiSettings(s),
    providers: providerCatalog(),
  });
});

const aiPatchSchema = z.object({
  enabled: z.boolean().optional(),
  provider: z.enum(['anthropic', 'openai', 'gemini']).optional(),
  /** Empty string → giữ key cũ. Non-empty string → overwrite. */
  apiKey: z.string().optional(),
  modelPrimary: z.string().min(1).optional(),
  modelEscalated: z.string().min(1).optional(),
  dailyQuotaMsgs: z.number().int().min(1).max(10000).optional(),
  maxOutputTokens: z.number().int().min(50).max(4000).optional(),
  temperature: z.number().min(0).max(2).optional(),
});

adminRouter.patch('/settings/ai', async (req: AuthedRequest, res) => {
  const parsed = aiPatchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_body', details: parsed.error.format() });
  }
  const next = await saveAiSettings(parsed.data, req.userId!);
  res.json({ current: maskAiSettings(next) });
});

/* ─── TEST CONNECTION ─────────────────────────────────────── */

const testSchema = z.object({
  provider: z.enum(['anthropic', 'openai', 'gemini']),
  /** Nếu để trống → dùng key đã lưu trong DB */
  apiKey: z.string().optional(),
  model: z.string().optional(),
});

adminRouter.post('/settings/ai/test', async (req, res) => {
  const parsed = testSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_body' });
  }

  const current = await getAiSettings(true);
  const apiKey = parsed.data.apiKey && parsed.data.apiKey.length > 0
    ? parsed.data.apiKey
    : current.apiKey;
  const model = parsed.data.model || current.modelPrimary;

  if (!apiKey) {
    return res.status(400).json({ error: 'no_api_key' });
  }

  const result = await pingProvider({
    provider: parsed.data.provider,
    apiKey,
    model,
  });
  res.json(result);
});

/* ─── CANNED QUICK-REPLY CHIPS ────────────────────────────── */
//
// Founder/admin biên tập chip + câu trả lời sẵn cho widget chat.
// Slug là khoá ổn định cho localStorage 'sol-qr-used' của widget — không
// đổi khi sửa label/answer. Nếu xoá → tạo lại sẽ tạo slug mới (chip trở
// nên "mới" với tất cả user, kể cả người đã dùng phiên bản cũ).

const slugRe = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

const cannedReplyCreateSchema = z.object({
  slug: z.string().min(2).max(64).regex(slugRe, 'slug chỉ chứa a-z, 0-9, dấu gạch ngang'),
  label: z.string().min(1).max(80),
  icon: z.string().min(1).max(8).optional(),
  answer: z.string().min(1).max(2000),
  wikiUrl: z.string().url().max(500).optional().or(z.literal('').transform(() => undefined)),
  wikiLabel: z.string().max(80).optional().or(z.literal('').transform(() => undefined)),
  reusable: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(10000).optional(),
  enabled: z.boolean().optional(),
  // Trigger filter — admin biên tập cụm từ user có thể gõ
  triggers: z.array(z.string().min(1).max(80)).max(20).optional(),
  priority: z.number().int().min(0).max(10000).optional(),
  minScore: z.number().min(0).max(1).optional(),
});

const cannedReplyUpdateSchema = cannedReplyCreateSchema.partial().extend({
  // slug không cho sửa — đổi slug = tạo bản ghi mới cho user widget
  slug: z.undefined().optional(),
});

adminRouter.get('/canned-replies', async (_req, res) => {
  const items = await prisma.cannedReply.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
  res.json({ items });
});

adminRouter.post('/canned-replies', async (req, res) => {
  const parsed = cannedReplyCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_body', details: parsed.error.format() });
  }
  try {
    const created = await prisma.cannedReply.create({
      data: {
        slug: parsed.data.slug,
        label: parsed.data.label,
        icon: parsed.data.icon ?? '💬',
        answer: parsed.data.answer,
        wikiUrl: parsed.data.wikiUrl ?? null,
        wikiLabel: parsed.data.wikiLabel ?? null,
        reusable: parsed.data.reusable ?? false,
        sortOrder: parsed.data.sortOrder ?? 100,
        enabled: parsed.data.enabled ?? true,
        triggers: parsed.data.triggers ?? [],
        priority: parsed.data.priority ?? 100,
        minScore: parsed.data.minScore ?? 0.5,
      } as any,
    });
    res.status(201).json(created);
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return res.status(409).json({ error: 'slug_taken' });
    }
    throw err;
  }
});

adminRouter.patch('/canned-replies/:id', async (req, res) => {
  const parsed = cannedReplyUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_body', details: parsed.error.format() });
  }
  try {
    const updated = await prisma.cannedReply.update({
      where: { id: req.params.id },
      data: {
        label: parsed.data.label,
        icon: parsed.data.icon,
        answer: parsed.data.answer,
        wikiUrl: parsed.data.wikiUrl,
        wikiLabel: parsed.data.wikiLabel,
        reusable: parsed.data.reusable,
        sortOrder: parsed.data.sortOrder,
        enabled: parsed.data.enabled,
        triggers: parsed.data.triggers,
        priority: parsed.data.priority,
        minScore: parsed.data.minScore,
      } as any,
    });
    res.json(updated);
  } catch (err: any) {
    if (err?.code === 'P2025') {
      return res.status(404).json({ error: 'not_found' });
    }
    throw err;
  }
});

adminRouter.delete('/canned-replies/:id', async (req, res) => {
  try {
    await prisma.cannedReply.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err: any) {
    if (err?.code === 'P2025') {
      return res.status(404).json({ error: 'not_found' });
    }
    throw err;
  }
});

/* ──────────────────────────────────────────────────────────────────
   USERS (list + detail + admin actions)
   ────────────────────────────────────────────────────────────────── */

adminRouter.get('/users', async (req, res) => {
  const q = String(req.query.q ?? '').trim();
  const tier = req.query.tier ? String(req.query.tier) : undefined;
  const minRisk = req.query.minRisk ? Number(req.query.minRisk) : undefined;
  const limit = Math.min(parseInt(String(req.query.limit ?? '50'), 10) || 50, 200);

  const where: any = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q } },
      { email: { contains: q, mode: 'insensitive' } },
    ];
  }
  if (tier) where.tier = tier;
  if (minRisk) where.riskScore = { gte: minRisk };

  const items = await prisma.user.findMany({
    where,
    orderBy: [{ riskScore: 'desc' }, { createdAt: 'desc' }],
    take: limit,
    select: {
      id: true,
      name: true,
      phone: true,
      tier: true,
      tierStartedAt: true,
      tierExpiresAt: true,
      maintenanceUntil: true,
      quitDate: true,
      checkinStreak: true,
      lastCheckinDate: true,
      riskScore: true,
      cohortKey: true,
      createdAt: true,
    },
  });

  res.json({ items });
});

adminRouter.get('/users/:id', async (req, res) => {
  const u = await prisma.user.findUnique({
    where: { id: req.params.id },
  });
  if (!u) return res.status(404).json({ error: 'not_found' });

  const [checkins, exercises, recentMessages, refunds, voiceDeliveries, payments] =
    await Promise.all([
      prisma.checkIn.findMany({
        where: { userId: u.id },
        orderBy: { date: 'desc' },
        take: 60,
      }),
      prisma.exerciseEntry.findMany({
        where: { userId: u.id },
        orderBy: { startedAt: 'desc' },
        take: 60,
      }),
      prisma.message.findMany({
        where: { userId: u.id },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      prisma.refundRequest.findMany({
        where: { userId: u.id },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.voiceDelivery.findMany({
        where: { userId: u.id },
        include: { voice: { select: { title: true, tag: true } } },
        orderBy: { deliveredAt: 'desc' },
        take: 20,
      }),
      prisma.paymentLog.findMany({
        where: { userId: u.id },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

  const tierState = computeTierState(u);

  res.json({
    user: {
      ...u,
      effectiveTier: effectiveTier(u),
      tierState,
    },
    checkins,
    exercises,
    recentMessages: recentMessages.reverse(),
    refunds,
    voiceDeliveries,
    payments,
  });
});

const adminPatchUserSchema = z.object({
  isAdmin: z.boolean().optional(),
  tier: z.enum(['FREE', 'KHOI_DONG', 'DONG_HANH', 'ALUMNI']).optional(),
  riskScore: z.number().int().min(0).max(100).optional(),
  // Admin có thể "tặng gói" cho user (vd test user, comp cho complaint)
  comp: z.enum(['KHOI_DONG', 'DONG_HANH']).optional(),
});

adminRouter.patch('/users/:id', async (req: AuthedRequest, res) => {
  const parsed = adminPatchUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_body', details: parsed.error.format() });
  }
  const { comp, ...rest } = parsed.data;

  if (Object.keys(rest).length > 0) {
    await prisma.user.update({
      where: { id: req.params.id },
      data: rest,
    });
  }

  // Tặng gói: tạo PaymentLog với amountVnd=0, status=PAID, provider=MOCK +
  // upgrade tier
  if (comp) {
    await prisma.paymentLog.create({
      data: {
        userId: req.params.id,
        targetTier: comp,
        amountVnd: 0,
        provider: 'MOCK',
        status: 'PAID',
        paidAt: new Date(),
        metadata: { compBy: req.userId, reason: 'admin_comp' },
      },
    });
    await applyTierUpgrade(req.params.id, comp);
  }

  const updated = await prisma.user.findUnique({ where: { id: req.params.id } });
  res.json({ ok: true, user: updated });
});

/* ──────────────────────────────────────────────────────────────────
   ADMIN — REFUND QUEUE
   ────────────────────────────────────────────────────────────────── */

adminRouter.get('/refunds', async (req, res) => {
  const status = req.query.status ? String(req.query.status) : undefined;
  const items = await prisma.refundRequest.findMany({
    where: status ? { status: status as any } : {},
    include: {
      user: { select: { id: true, name: true, phone: true, tier: true } },
      payment: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json({ items });
});

const refundDecisionSchema = z.object({
  decision: z.enum(['approve', 'deny']),
  adminNote: z.string().max(2000).optional(),
  amountVndOverride: z.number().int().min(0).optional(),
});

adminRouter.post('/refunds/:id/decision', async (req: AuthedRequest, res) => {
  const parsed = refundDecisionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_body' });
  }

  const refund = await prisma.refundRequest.findUnique({
    where: { id: req.params.id },
    include: { payment: true },
  });
  if (!refund) return res.status(404).json({ error: 'not_found' });
  if (refund.status !== 'REQUESTED') {
    return res.status(400).json({ error: 'already_decided', status: refund.status });
  }

  const now = new Date();

  if (parsed.data.decision === 'deny') {
    await prisma.refundRequest.update({
      where: { id: refund.id },
      data: {
        status: 'DENIED',
        adminNote: parsed.data.adminNote,
        approvedBy: req.userId,
        approvedAt: now,
      },
    });
    return res.json({ ok: true });
  }

  // Approve: mark refund + payment + downgrade user
  const finalAmount = parsed.data.amountVndOverride ?? refund.amountVnd;
  await prisma.$transaction([
    prisma.refundRequest.update({
      where: { id: refund.id },
      data: {
        status: 'APPROVED',
        adminNote: parsed.data.adminNote,
        approvedBy: req.userId,
        approvedAt: now,
        amountVnd: finalAmount,
      },
    }),
    prisma.paymentLog.update({
      where: { id: refund.paymentId },
      data: { status: 'REFUNDED' },
    }),
    prisma.user.update({
      where: { id: refund.userId },
      data: {
        tier: 'FREE',
        tierExpiresAt: null,
        maintenanceUntil: null,
      },
    }),
  ]);

  res.json({ ok: true });
});

adminRouter.post('/refunds/:id/processed', async (req, res) => {
  const refund = await prisma.refundRequest.findUnique({ where: { id: req.params.id } });
  if (!refund) return res.status(404).json({ error: 'not_found' });
  if (refund.status !== 'APPROVED') {
    return res.status(400).json({ error: 'not_approved_yet' });
  }
  await prisma.refundRequest.update({
    where: { id: refund.id },
    data: { status: 'PROCESSED', processedAt: new Date() },
  });
  res.json({ ok: true });
});

/* ──────────────────────────────────────────────────────────────────
   ADMIN — VOICE LIBRARY (CRUD)
   ────────────────────────────────────────────────────────────────── */

const voiceCreateSchema = z.object({
  title: z.string().min(1).max(200),
  audioUrl: z.string().url().max(1000),
  durationSec: z.number().int().min(0).max(3600).optional(),
  transcript: z.string().max(10000).optional(),
  triggerType: z.enum(['DAY_MATCH', 'CRISIS', 'MILESTONE', 'MANUAL']),
  dayMatch: z.number().int().min(1).max(60).nullable().optional(),
  tag: z.string().max(80).optional(),
  minTier: z.enum(['FREE', 'KHOI_DONG', 'DONG_HANH', 'ALUMNI']).optional(),
  enabled: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(10000).optional(),
});

adminRouter.get('/voice', async (_req, res) => {
  const items = await prisma.voiceMessage.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });
  res.json({ items });
});

adminRouter.post('/voice', async (req, res) => {
  const parsed = voiceCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_body', details: parsed.error.format() });
  }
  const created = await prisma.voiceMessage.create({
    data: {
      title: parsed.data.title,
      audioUrl: parsed.data.audioUrl,
      durationSec: parsed.data.durationSec ?? null,
      transcript: parsed.data.transcript ?? null,
      triggerType: parsed.data.triggerType,
      dayMatch: parsed.data.dayMatch ?? null,
      tag: parsed.data.tag ?? null,
      minTier: parsed.data.minTier ?? 'FREE',
      enabled: parsed.data.enabled ?? true,
      sortOrder: parsed.data.sortOrder ?? 100,
    },
  });
  res.status(201).json(created);
});

adminRouter.patch('/voice/:id', async (req, res) => {
  const parsed = voiceCreateSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_body' });
  }
  try {
    const updated = await prisma.voiceMessage.update({
      where: { id: req.params.id },
      data: parsed.data as any,
    });
    res.json(updated);
  } catch (err: any) {
    if (err?.code === 'P2025') return res.status(404).json({ error: 'not_found' });
    throw err;
  }
});

adminRouter.delete('/voice/:id', async (req, res) => {
  try {
    await prisma.voiceMessage.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err: any) {
    if (err?.code === 'P2025') return res.status(404).json({ error: 'not_found' });
    throw err;
  }
});

/** Gửi voice manual cho 1 user (trigger từ User Detail). */
adminRouter.post('/voice/:id/send', async (req, res) => {
  const targetUserId = String(req.body?.userId ?? '');
  if (!targetUserId) return res.status(400).json({ error: 'userId_required' });

  const voice = await prisma.voiceMessage.findUnique({ where: { id: req.params.id } });
  if (!voice) return res.status(404).json({ error: 'voice_not_found' });

  // Idempotent: nếu đã có delivery thì coi như OK
  const existing = await prisma.voiceDelivery.findUnique({
    where: { userId_voiceId: { userId: targetUserId, voiceId: voice.id } },
  });
  if (existing) return res.json({ ok: true, delivery: existing, skipped: true });

  const delivery = await prisma.voiceDelivery.create({
    data: { userId: targetUserId, voiceId: voice.id },
  });
  res.json({ ok: true, delivery });
});

/* ──────────────────────────────────────────────────────────────────
   ADMIN — COHORTS
   ────────────────────────────────────────────────────────────────── */

adminRouter.get('/cohorts', async (_req, res) => {
  const cohorts = await prisma.cohort.findMany({ orderBy: { startDate: 'desc' } });
  // Bổ sung thống kê live mỗi cohort
  const enriched = await Promise.all(
    cohorts.map(async (c) => {
      const [total, paid, alumni] = await Promise.all([
        prisma.user.count({ where: { cohortKey: c.key } }),
        prisma.user.count({ where: { cohortKey: c.key, tier: { in: ['KHOI_DONG', 'DONG_HANH'] } } }),
        prisma.user.count({ where: { cohortKey: c.key, tier: 'ALUMNI' } }),
      ]);
      return { ...c, totalMembers: total, paidMembers: paid, alumniMembers: alumni };
    }),
  );
  res.json({ items: enriched });
});

/* ──────────────────────────────────────────────────────────────────
   ADMIN — ANALYTICS (FUNNEL + REVENUE)
   ────────────────────────────────────────────────────────────────── */

adminRouter.get('/analytics/funnel', async (_req, res) => {
  const [
    totalUsers,
    qDaySet,
    paidKhoiDong,
    paidDongHanh,
    completed,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { quitDate: { not: null } } }),
    prisma.user.count({ where: { tier: 'KHOI_DONG' } }),
    prisma.user.count({ where: { tier: 'DONG_HANH' } }),
    prisma.user.count({ where: { tier: 'ALUMNI' } }),
  ]);

  res.json({
    steps: [
      { key: 'visit', label: 'Đăng ký FREE', count: totalUsers },
      { key: 'q_day', label: 'Đặt Q-Day', count: qDaySet },
      { key: 'khoi_dong', label: 'Mua Khởi động 99k', count: paidKhoiDong },
      { key: 'dong_hanh', label: 'Mua Đồng hành 199k', count: paidDongHanh },
      { key: 'alumni', label: 'Hoàn thành (Alumni)', count: completed },
    ],
  });
});

adminRouter.get('/analytics/revenue', async (req, res) => {
  const days = Math.min(Number(req.query.days ?? 30), 365);
  const since = new Date(Date.now() - days * 86_400_000);

  const [paid, refunded, byTier] = await Promise.all([
    prisma.paymentLog.aggregate({
      where: { status: 'PAID', paidAt: { gte: since } },
      _sum: { amountVnd: true },
      _count: true,
    }),
    prisma.paymentLog.aggregate({
      where: { status: 'REFUNDED', updatedAt: { gte: since } },
      _sum: { amountVnd: true },
      _count: true,
    }),
    prisma.paymentLog.groupBy({
      by: ['targetTier'],
      where: { status: 'PAID', paidAt: { gte: since } },
      _sum: { amountVnd: true },
      _count: true,
    }),
  ]);

  res.json({
    rangeDays: days,
    paid: {
      totalVnd: paid._sum.amountVnd ?? 0,
      count: paid._count,
    },
    refunded: {
      totalVnd: refunded._sum.amountVnd ?? 0,
      count: refunded._count,
    },
    netVnd: (paid._sum.amountVnd ?? 0) - (refunded._sum.amountVnd ?? 0),
    byTier: byTier.map((t) => ({
      tier: t.targetTier,
      totalVnd: t._sum.amountVnd ?? 0,
      count: t._count,
    })),
  });
});

/* ──────────────────────────────────────────────────────────────────
   ADMIN — DASHBOARD (Khang nhìn 5 phút mỗi sáng)
   "needs_attention" = top user cần Khang theo riskScore + missed days +
   refund window approaching.
   ────────────────────────────────────────────────────────────────── */

adminRouter.get('/dashboard', async (_req, res) => {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    needsAttention,
    pendingRefunds,
    paidToday,
    revenueToday,
    activeNow,
    checkinsToday,
    crises24h,
    funnelSnapshot,
  ] = await Promise.all([
    prisma.user.findMany({
      where: {
        OR: [
          { riskScore: { gte: 70 } },
          { missedDaysInRow: { gte: 2 } },
        ],
        tier: { not: 'FREE' },
      },
      orderBy: { riskScore: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        phone: true,
        tier: true,
        riskScore: true,
        missedDaysInRow: true,
        lastCheckinDate: true,
        tierStartedAt: true,
        tierExpiresAt: true,
      },
    }),
    prisma.refundRequest.count({ where: { status: 'REQUESTED' } }),
    prisma.paymentLog.count({ where: { status: 'PAID', paidAt: { gte: today } } }),
    prisma.paymentLog.aggregate({
      where: { status: 'PAID', paidAt: { gte: today } },
      _sum: { amountVnd: true },
    }),
    prisma.message.count({ where: { createdAt: { gte: since24h }, role: 'USER' } }),
    prisma.checkIn.count({ where: { createdAt: { gte: today } } }),
    prisma.crisisEvent.count({ where: { createdAt: { gte: since24h } } }),
    prisma.user.groupBy({ by: ['tier'], _count: true }),
  ]);

  res.json({
    needsAttention,
    pendingRefundsCount: pendingRefunds,
    paidToday,
    revenueTodayVnd: revenueToday._sum.amountVnd ?? 0,
    activeUsers24h: activeNow,
    checkinsToday,
    crises24h,
    tierBreakdown: funnelSnapshot.map((g) => ({ tier: g.tier, count: g._count })),
    timestamp: new Date().toISOString(),
  });
});

/* ──────────────────────────────────────────────────────────────────
   ADMIN — WIKI ANALYTICS (mock; tích hợp Search Console + GA4 sau)
   Endpoint trả về dữ liệu giả lập cho widget admin. Khi tích hợp
   Google Search Console API, sửa hàm này.
   ────────────────────────────────────────────────────────────────── */

/* ──────────────────────────────────────────────────────────────────
   ADMIN — Q-DAY CHECKLIST (config edit)
   ────────────────────────────────────────────────────────────────── */

const checklistItemSchema = z.object({
  id: z.string().min(1).max(80),
  label: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  wikiUrl: z.string().url().max(500).optional().or(z.literal('').transform(() => undefined)),
  required: z.boolean(),
  onlyForTier: z.enum(['KHOI_DONG', 'DONG_HANH']).optional(),
  icon: z.string().max(8).optional(),
});

const checklistConfigSchema = z.object({
  intro: z.string().max(2000).optional(),
  outro: z.string().max(2000).optional(),
  items: z.array(checklistItemSchema).min(1).max(30),
});

adminRouter.get('/q-day-checklist', async (_req, res) => {
  const cfg = await getChecklistConfig();
  res.json(cfg);
});

adminRouter.put('/q-day-checklist', async (req: AuthedRequest, res) => {
  const parsed = checklistConfigSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_body', details: parsed.error.format() });
  }
  const next = await saveChecklistConfig(parsed.data as QDayChecklistConfig, req.userId);
  res.json(next);
});

/* ──────────────────────────────────────────────────────────────────
   ADMIN — CONTENT AUDIT
   Quét toàn bộ content động (canned replies, voice, content items,
   q-day-checklist) → trả findings về typo / broken wiki / empty / duplicate.
   ────────────────────────────────────────────────────────────────── */

adminRouter.get('/wiki/stats', async (_req, res) => {
  const wpAdminUrl = process.env.WP_ADMIN_URL ?? 'https://sol.vn/wp-admin';
  const wpFrontUrl = process.env.WP_FRONT_URL ?? 'https://sol.vn/wiki';

  // Đọc danh sách bài thực từ folder wiki-skeletons/. Khi GSC/GA4 tích hợp,
  // trả thêm field views7d/conv thật. Hiện tại views/conv = 0 vì chưa publish.
  const fs = await import('node:fs/promises');
  const path = await import('node:path');

  // wiki-skeletons nằm ở repo root. Backend chạy từ ./backend nên cwd = backend/,
  // wiki-skeletons = ../wiki-skeletons. Dùng process.cwd() cho ESM-safe.
  const wikiBase = path.resolve(process.cwd(), '..', 'wiki-skeletons');

  type Post = { title: string; slug: string; phase?: string; group: string; views7d: number; conv: number };
  const posts: Post[] = [];

  async function scanFolder(folderPath: string, group: string) {
    try {
      const files = await fs.readdir(folderPath);
      for (const f of files) {
        if (!f.endsWith('.md') || f.startsWith('000_INDEX')) continue;
        const full = path.join(folderPath, f);
        const content = await fs.readFile(full, 'utf-8');
        // Parse frontmatter đơn giản (không dùng gray-matter dep)
        const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
        if (!fmMatch) continue;
        const fm = fmMatch[1];
        const titleMatch = fm.match(/^title:\s*"?(.+?)"?\s*$/m);
        const slugMatch = fm.match(/^slug:\s*"?(.+?)"?\s*$/m);
        const phaseMatch = fm.match(/^phase:\s*"?(.+?)"?\s*$/m);
        if (!titleMatch || !slugMatch) continue;
        posts.push({
          title: titleMatch[1].trim(),
          slug: slugMatch[1].trim(),
          phase: phaseMatch?.[1]?.trim(),
          group,
          views7d: 0,
          conv: 0,
        });
      }
    } catch {
      // folder không tồn tại — skip
    }
  }

  await scanFolder(wikiBase, 'Timeline (14 mốc)');
  await scanFolder(path.join(wikiBase, 'chips'), 'Chip — triệu chứng/tâm lý/trigger');

  res.json({
    wpAdminUrl,
    wpFrontUrl,
    integrationStatus: 'local-skeleton',
    totalArticles: posts.length,
    topPosts: posts,
    note: `${posts.length} bài skeleton trong wiki-skeletons/. Khang biên tập + publish lên WordPress sol.vn → tích hợp GSC/GA4 để có views/conv thật.`,
  });
});
