// backend/src/checkins/routes.ts
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authMiddleware, type AuthedRequest } from '../auth/middleware';
import { computeDayNumber } from '../utils/dayNumber';

export const checkinsRouter = Router();
checkinsRouter.use(authMiddleware);

// ── History ────────────────────────────────────────────────────────────────
checkinsRouter.get('/', async (req: AuthedRequest, res) => {
  const days = Math.min(parseInt(String(req.query.days ?? '30'), 10) || 30, 90);
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const checkins = await prisma.checkIn.findMany({
    where: { userId: req.userId!, date: { gte: since } },
    orderBy: { date: 'asc' },
  });

  return res.json({ checkins });
});

// ── Today status ───────────────────────────────────────────────────────────
checkinsRouter.get('/today', async (req: AuthedRequest, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ci = await prisma.checkIn.findUnique({
    where: { userId_date: { userId: req.userId!, date: today } },
  });
  return res.json({ checkin: ci, date: today });
});

// ── Bulk submit (alternative to structured flow in widget) ──────────────────
const submitSchema = z.object({
  smoked: z.boolean(),
  smokeCount: z.number().int().min(0).max(99).optional(),
  cravingIntensity: z.number().int().min(1).max(10),
  mood: z.number().int().min(1).max(5),
  note: z.string().max(500).optional(),
  hardestMoment: z.string().max(60).optional(),
  copingAction: z.string().max(200).optional(),
  win: z.string().max(200).optional(),
  isSickDay: z.boolean().optional(),
});

checkinsRouter.post('/', async (req: AuthedRequest, res) => {
  const parsed = submitSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_payload' });

  const userId = req.userId!;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ error: 'user_not_found' });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayNumber = computeDayNumber(user.quitDate);

  const checkin = await prisma.checkIn.upsert({
    where: { userId_date: { userId, date: today } },
    create: {
      userId,
      dayNumber,
      date: today,
      ...parsed.data,
      smokeCount: parsed.data.smoked ? (parsed.data.smokeCount ?? 1) : 0,
    },
    update: {
      ...parsed.data,
      smokeCount: parsed.data.smoked ? (parsed.data.smokeCount ?? 1) : 0,
    },
  });

  return res.json({ ok: true, checkin, dayNumber });
});
