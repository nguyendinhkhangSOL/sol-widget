// backend/src/zalo/journeyAdminRoutes.ts
//
// Admin API cho Phase 5 — 51-Day Journey scheduler.
//
//   POST   /api/zalo/journey/enroll            — enroll 1 user vào journey
//   POST   /api/zalo/journey/cancel/:userId    — cancel pending pushes
//   GET    /api/zalo/journey/queue             — xem 24h push sắp gửi
//   GET    /api/zalo/journey/users             — list users đang journey
//   GET    /api/zalo/journey/users/:id         — detail 1 user + schedule
//   GET    /api/zalo/journey/sos               — SOS alerts pending + recent
//   POST   /api/zalo/journey/sos/:id/respond   — Khang trả lời SOS alert
//   POST   /api/zalo/journey/sos/:id/resolve   — Khang đánh dấu xong
//   GET    /api/zalo/journey/stats             — dashboard tổng quan
//
// Tất cả yêu cầu admin (req.user.isAdmin = true).

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { logger } from '../utils/logger';
import { authMiddleware, type AuthedRequest } from '../auth/middleware';
import { enrollUser, cancelJourney, type JourneyType } from './journeyEngine';
import { generateMemoryBookData, renderMemoryBookHtml, type MemoryBookMilestone } from '../services/memoryBook';
import { sendAdminAlertTest } from '../services/adminAlert';

export const journeyAdminRouter = Router();
journeyAdminRouter.use(authMiddleware);

async function requireAdmin(userId: string): Promise<boolean> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } });
  return !!u?.isAdmin;
}

// ─── POST /enroll ───────────────────────────────────────────────────────
const enrollSchema = z.object({
  userId: z.string().min(1),
  journeyType: z.enum(['lam-quen', 'giam-dan', 'q-day', 'full-51', 'maintenance']),
  qDayDate: z.string().datetime(),
  preferredHour: z.number().int().min(0).max(23).optional(),
  timezone: z.string().optional(),
});

journeyAdminRouter.post('/enroll', async (req: AuthedRequest, res) => {
  if (!(await requireAdmin(req.userId!))) {
    return res.status(403).json({ error: 'forbidden' });
  }
  const parsed = enrollSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_input', issues: parsed.error.issues });
  }
  try {
    const r = await enrollUser({
      userId: parsed.data.userId,
      journeyType: parsed.data.journeyType as JourneyType,
      qDayDate: new Date(parsed.data.qDayDate),
      preferredHour: parsed.data.preferredHour,
      timezone: parsed.data.timezone,
    });
    return res.json({ ok: true, ...r });
  } catch (e: any) {
    logger.error({ err: e }, 'enroll failed');
    return res.status(500).json({ error: 'enroll_failed', message: e.message });
  }
});

// ─── POST /cancel/:userId ───────────────────────────────────────────────
journeyAdminRouter.post('/cancel/:userId', async (req: AuthedRequest, res) => {
  if (!(await requireAdmin(req.userId!))) {
    return res.status(403).json({ error: 'forbidden' });
  }
  const reason = (req.body?.reason as string) ?? 'admin_cancel';
  const count = await cancelJourney(req.params.userId, reason);
  return res.json({ ok: true, cancelled: count });
});

// ─── GET /queue — 24h push sắp gửi ──────────────────────────────────────
journeyAdminRouter.get('/queue', async (req: AuthedRequest, res) => {
  if (!(await requireAdmin(req.userId!))) {
    return res.status(403).json({ error: 'forbidden' });
  }
  const horizonHours = Math.min(parseInt(req.query.hours as string) || 24, 168);
  const from = new Date();
  const to = new Date(Date.now() + horizonHours * 60 * 60 * 1000);

  const queue = await prisma.scheduledPush.findMany({
    where: { scheduledAt: { gte: from, lte: to }, status: 'pending' },
    orderBy: { scheduledAt: 'asc' },
    take: 500,
    include: {
      user: { select: { id: true, name: true, phone: true, currentJourneyDay: true } },
    },
  });

  // Group theo hour bucket
  const byHour: Record<string, number> = {};
  for (const p of queue) {
    const hourKey = p.scheduledAt.toISOString().slice(0, 13);
    byHour[hourKey] = (byHour[hourKey] || 0) + 1;
  }

  return res.json({
    horizonHours,
    total: queue.length,
    byHour,
    estCostVnd: queue.length * 300,
    items: queue.slice(0, 100).map((p) => ({
      id: p.id,
      userId: p.userId,
      userName: p.user.name,
      phone: p.user.phone?.slice(0, 3) + '***' + (p.user.phone?.slice(-3) ?? ''),
      currentDay: p.user.currentJourneyDay,
      dayOffset: p.dayOffset,
      templateCode: p.templateCode,
      scheduledAt: p.scheduledAt,
      wikiSlug: p.wikiSlug,
    })),
  });
});

// ─── GET /users — list user đang journey ────────────────────────────────
journeyAdminRouter.get('/users', async (req: AuthedRequest, res) => {
  if (!(await requireAdmin(req.userId!))) {
    return res.status(403).json({ error: 'forbidden' });
  }
  const status = (req.query.status as string) || 'active';
  const journeyType = req.query.journeyType as string | undefined;

  const users = await prisma.user.findMany({
    where: {
      journeyStatus: status,
      ...(journeyType ? { journeyType } : {}),
    },
    select: {
      id: true, name: true, phone: true,
      journeyType: true, qDayDate: true,
      currentJourneyDay: true, journeyStatus: true,
      preferredPushHour: true, journeyEnrolledAt: true,
      messagingProfile: { select: { totalSent: true, totalOpened: true, totalClicked: true } },
    },
    orderBy: { currentJourneyDay: 'asc' },
    take: 200,
  });

  return res.json({
    total: users.length,
    items: users.map((u) => ({
      id: u.id,
      name: u.name,
      phone: u.phone?.slice(0, 3) + '***' + (u.phone?.slice(-3) ?? ''),
      journeyType: u.journeyType,
      qDayDate: u.qDayDate,
      currentDay: u.currentJourneyDay,
      status: u.journeyStatus,
      preferredHour: u.preferredPushHour,
      enrolledAt: u.journeyEnrolledAt,
      sent: u.messagingProfile?.totalSent ?? 0,
      opened: u.messagingProfile?.totalOpened ?? 0,
      clicked: u.messagingProfile?.totalClicked ?? 0,
    })),
  });
});

// ─── GET /users/:id — detail + schedule ─────────────────────────────────
journeyAdminRouter.get('/users/:id', async (req: AuthedRequest, res) => {
  if (!(await requireAdmin(req.userId!))) {
    return res.status(403).json({ error: 'forbidden' });
  }
  const u = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true, name: true, phone: true,
      journeyType: true, qDayDate: true, currentJourneyDay: true,
      journeyStatus: true, preferredPushHour: true, pushTimezone: true,
      journeyEnrolledAt: true, journeyEndedAt: true,
      messagingProfile: true,
      scheduledPushes: {
        orderBy: { dayOffset: 'asc' },
        select: {
          id: true, dayOffset: true, templateCode: true, wikiSlug: true,
          scheduledAt: true, status: true, sentAt: true, errorMessage: true,
        },
      },
    },
  });
  if (!u) return res.status(404).json({ error: 'not_found' });
  return res.json(u);
});

// ─── GET /sos — alerts pending ──────────────────────────────────────────
journeyAdminRouter.get('/sos', async (req: AuthedRequest, res) => {
  if (!(await requireAdmin(req.userId!))) {
    return res.status(403).json({ error: 'forbidden' });
  }
  const status = (req.query.status as string) || 'pending,auto_responded,admin_responding';
  const statuses = status.split(',').map((s) => s.trim());

  const alerts = await prisma.sOSAlert.findMany({
    where: { status: { in: statuses } },
    orderBy: [{ severity: 'asc' }, { triggeredAt: 'desc' }],
    take: 100,
    include: {
      user: { select: { id: true, name: true, phone: true, currentJourneyDay: true } },
    },
  });

  // Severity order: critical > high > medium > low
  const SEVERITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  alerts.sort((a, b) => {
    const sa = SEVERITY_ORDER[a.severity] ?? 99;
    const sb = SEVERITY_ORDER[b.severity] ?? 99;
    if (sa !== sb) return sa - sb;
    return b.triggeredAt.getTime() - a.triggeredAt.getTime();
  });

  return res.json({
    total: alerts.length,
    items: alerts.map((a) => ({
      id: a.id,
      userId: a.userId,
      userName: a.user.name,
      currentDay: a.user.currentJourneyDay,
      triggerType: a.triggerType,
      matchedKeyword: a.matchedKeyword,
      userMessage: a.userMessage,
      severity: a.severity,
      status: a.status,
      triggeredAt: a.triggeredAt,
      respondedAt: a.respondedAt,
      respondedByAdminId: a.respondedByAdminId,
    })),
  });
});

// ─── POST /sos/:id/respond ──────────────────────────────────────────────
journeyAdminRouter.post('/sos/:id/respond', async (req: AuthedRequest, res) => {
  if (!(await requireAdmin(req.userId!))) {
    return res.status(403).json({ error: 'forbidden' });
  }
  const message = (req.body?.message as string)?.trim();
  if (!message) return res.status(400).json({ error: 'message_required' });

  const updated = await prisma.sOSAlert.update({
    where: { id: req.params.id },
    data: {
      status: 'admin_responding',
      respondedByAdminId: req.userId!,
      respondedAt: new Date(),
      responseMessage: message,
    },
  });
  // TODO: also send via Zalo OA Free Message (within 48h window)
  return res.json({ ok: true, alert: updated });
});

// ─── POST /sos/:id/resolve ──────────────────────────────────────────────
journeyAdminRouter.post('/sos/:id/resolve', async (req: AuthedRequest, res) => {
  if (!(await requireAdmin(req.userId!))) {
    return res.status(403).json({ error: 'forbidden' });
  }
  const notes = (req.body?.notes as string) ?? '';
  const updated = await prisma.sOSAlert.update({
    where: { id: req.params.id },
    data: { status: 'resolved', resolvedAt: new Date(), resolutionNotes: notes },
  });
  return res.json({ ok: true, alert: updated });
});

// ─── GET /stats — dashboard tổng quan ───────────────────────────────────
journeyAdminRouter.get('/stats', async (req: AuthedRequest, res) => {
  if (!(await requireAdmin(req.userId!))) {
    return res.status(403).json({ error: 'forbidden' });
  }
  const today0 = new Date(); today0.setHours(0, 0, 0, 0);
  const tomorrow0 = new Date(today0.getTime() + 24 * 60 * 60 * 1000);
  const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [totalActive, totalGraduated, todaySent, todayPending, sosOpen, sentLast7d] = await Promise.all([
    prisma.user.count({ where: { journeyStatus: 'active' } }),
    prisma.user.count({ where: { journeyStatus: 'graduated' } }),
    prisma.scheduledPush.count({ where: { sentAt: { gte: today0, lt: tomorrow0 } } }),
    prisma.scheduledPush.count({ where: { scheduledAt: { gte: today0, lt: tomorrow0 }, status: 'pending' } }),
    prisma.sOSAlert.count({ where: { status: { in: ['pending', 'auto_responded'] } } }),
    prisma.scheduledPush.count({ where: { sentAt: { gte: last7d }, status: 'sent' } }),
  ]);

  return res.json({
    users: {
      activeJourney: totalActive,
      graduated: totalGraduated,
    },
    today: {
      sent: todaySent,
      pending: todayPending,
      estCostVnd: todayPending * 300,
    },
    sos: {
      open: sosOpen,
    },
    last7d: {
      totalSent: sentLast7d,
    },
  });
});

// ─── Phase 5 final: Memory Book endpoints ──────────────────────────────

// GET /api/zalo/journey/memory-book/:userId/:milestone — view HTML album
// Public-readable (admin can preview, user can share)
journeyAdminRouter.get('/memory-book/:userId/:milestone', async (req: AuthedRequest, res) => {
  const milestone = parseInt(req.params.milestone) as MemoryBookMilestone;
  if (![30, 60, 90, 180, 365].includes(milestone)) {
    return res.status(400).json({ error: 'invalid_milestone' });
  }
  try {
    const data = await generateMemoryBookData(req.params.userId, milestone);
    const html = renderMemoryBookHtml(data);
    res.set('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  } catch (e: any) {
    return res.status(404).json({ error: 'memory_book_failed', message: e.message });
  }
});

// POST /api/zalo/journey/memory-book/:userId/:milestone/regenerate
// Admin trigger regenerate (vd test trước khi user đến milestone)
journeyAdminRouter.post('/memory-book/:userId/:milestone/regenerate', async (req: AuthedRequest, res) => {
  if (!(await requireAdmin(req.userId!))) {
    return res.status(403).json({ error: 'forbidden' });
  }
  const milestone = parseInt(req.params.milestone) as MemoryBookMilestone;
  try {
    const data = await generateMemoryBookData(req.params.userId, milestone);
    return res.json({
      ok: true,
      shareUrl: data.shareUrl,
      generatedAt: data.generatedAt,
      stats: data.stats,
    });
  } catch (e: any) {
    return res.status(500).json({ error: 'regenerate_failed', message: e.message });
  }
});

// POST /api/zalo/journey/admin-alert-test
// Admin gửi test alert qua tất cả channels (Zalo + Email) để verify
journeyAdminRouter.post('/admin-alert-test', async (req: AuthedRequest, res) => {
  if (!(await requireAdmin(req.userId!))) {
    return res.status(403).json({ error: 'forbidden' });
  }
  const result = await sendAdminAlertTest();
  return res.json({
    ok: result.zalo || result.email || result.sms,
    dispatched: result,
    message: 'Admin alert test sent. Check Zalo OA + Email',
    hint: {
      zalo: result.zalo ? 'OK' : 'Cau hinh KHANG_ZALO_USER_ID + Khang follow OA Sol',
      email: result.email ? 'OK' : 'Cau hinh KHANG_ALERT_EMAIL + SMTP_*',
      sms: 'SMS chua implement (Sprint 5)',
    },
  });
});
