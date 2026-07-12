import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/db';
import { optionalAuth } from '../middleware/auth';

export const p1Router = Router();

const P1Schema = z.object({
  sessionId: z.string(),
  people: z.number().min(0).max(100),
  expert: z.number().min(0).max(100),
  builder: z.number().min(0).max(100),
  independent: z.number().min(0).max(100),
  rank1: z.string(),
  rank2: z.string(),
  rank3: z.string(),
  rank4: z.string(),
  rawAnswers: z.record(z.any()),
  version: z.number().default(1),
});

// ── POST /api/p1/result ───────────────────────────────────
// Save P1 result to DB (anonymous or authenticated)
p1Router.post('/result', optionalAuth, async (req, res, next) => {
  try {
    const body = P1Schema.parse(req.body);
    const result = await prisma.p1Result.create({
      data: {
        userId: req.user?.userId ?? null,
        sessionId: body.sessionId,
        people: body.people,
        expert: body.expert,
        builder: body.builder,
        independent: body.independent,
        rank1: body.rank1,
        rank2: body.rank2,
        rank3: body.rank3,
        rank4: body.rank4,
        rawAnswers: body.rawAnswers,
        version: body.version,
      },
    });
    res.status(201).json({ id: result.id });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/p1/result/latest ─────────────────────────────
// Get latest P1 result for current user
p1Router.get('/result/latest', optionalAuth, async (req, res, next) => {
  try {
    const sessionId = req.query.sessionId as string;
    const where = req.user?.userId
      ? { userId: req.user.userId }
      : sessionId
      ? { sessionId }
      : null;

    if (!where) return res.json(null);

    const result = await prisma.p1Result.findFirst({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});
