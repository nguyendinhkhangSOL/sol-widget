import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/db';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const savedRouter = Router();

// ── GET /api/saved ────────────────────────────────────────
savedRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const saved = await prisma.savedDirection.findMany({
      where: { userId: req.user!.userId },
      include: {
        direction: {
          select: { id: true, name: true, slug: true, tagline: true, category: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(saved);
  } catch (err) {
    next(err);
  }
});

// ── POST /api/saved ───────────────────────────────────────
const SaveSchema = z.object({
  directionId: z.string(),
  matchScore: z.number().min(0).max(100).optional(),
  notes: z.string().max(500).optional(),
});

savedRouter.post('/', requireAuth, async (req, res, next) => {
  try {
    const body = SaveSchema.parse(req.body);
    const saved = await prisma.savedDirection.upsert({
      where: { userId_directionId: { userId: req.user!.userId, directionId: body.directionId } },
      update: { matchScore: body.matchScore, notes: body.notes },
      create: { userId: req.user!.userId, directionId: body.directionId, matchScore: body.matchScore, notes: body.notes },
    });
    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/saved/:directionId ────────────────────────
savedRouter.delete('/:directionId', requireAuth, async (req, res, next) => {
  try {
    await prisma.savedDirection.deleteMany({
      where: { userId: req.user!.userId, directionId: req.params.directionId as string },
    });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
