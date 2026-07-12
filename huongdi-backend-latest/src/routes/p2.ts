import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/db';
import { optionalAuth } from '../middleware/auth';

export const p2Router = Router();

const P2Schema = z.object({
  sessionId: z.string(),
  experience: z.number().min(0).max(100),
  capital: z.number().min(0).max(100),
  time: z.number().min(0).max(100),
  technology: z.number().min(0).max(100),
  network: z.number().min(0).max(100),
  risk: z.number().min(0).max(100),
  energy: z.number().min(0).max(100),
  incomeGoal: z.string(),
  rawAnswers: z.record(z.any()),
  version: z.number().default(1),
});

// ── POST /api/p2/result ───────────────────────────────────
p2Router.post('/result', optionalAuth, async (req, res, next) => {
  try {
    const body = P2Schema.parse(req.body);
    const result = await prisma.p2Result.create({
      data: {
        userId: req.user?.userId ?? null,
        sessionId: body.sessionId,
        experience: body.experience,
        capital: body.capital,
        time: body.time,
        technology: body.technology,
        network: body.network,
        risk: body.risk,
        energy: body.energy,
        incomeGoal: body.incomeGoal,
        rawAnswers: body.rawAnswers,
        version: body.version,
      },
    });
    res.status(201).json({ id: result.id });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/p2/result/latest ─────────────────────────────
p2Router.get('/result/latest', optionalAuth, async (req, res, next) => {
  try {
    const sessionId = req.query.sessionId as string;
    const where = req.user?.userId
      ? { userId: req.user.userId }
      : sessionId
      ? { sessionId }
      : null;

    if (!where) return res.json(null);

    const result = await prisma.p2Result.findFirst({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});
