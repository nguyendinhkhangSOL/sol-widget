// backend/src/exercises/routes.ts
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authMiddleware, type AuthedRequest } from '../auth/middleware';
import { computeDayNumber } from '../utils/dayNumber';

export const exercisesRouter = Router();
exercisesRouter.use(authMiddleware);

// ── List content for a specific day (exercise metadata + user progress) ────
exercisesRouter.get('/day/:day', async (req: AuthedRequest, res) => {
  const day = parseInt(req.params.day, 10);
  if (!(day >= 1 && day <= 30)) return res.status(400).json({ error: 'invalid_day' });

  const items = await prisma.contentItem.findMany({
    where: { dayNumber: day, module: 'EXERCISE', published: true },
  });

  const entries = await prisma.exerciseEntry.findMany({
    where: { userId: req.userId!, dayNumber: day },
  });

  const entryMap = new Map(entries.map((e) => [e.exerciseKey, e]));

  return res.json({
    day,
    exercises: items.map((it) => ({
      id: it.id,
      exerciseKey: it.exerciseKey,
      title: it.title,
      body: it.body,
      wikiUrl: it.wikiUrl,
      imageUrl: it.imageUrl,
      audioUrl: it.audioUrl,
      schema: it.exerciseSchema,
      progress: it.exerciseKey ? entryMap.get(it.exerciseKey) ?? null : null,
    })),
  });
});

// ── Save / complete an exercise entry ─────────────────────────────────────
const saveSchema = z.object({
  exerciseKey: z.string().min(1).max(100),
  content: z.record(z.any()),
  complete: z.boolean().optional(),
});

exercisesRouter.post('/save', async (req: AuthedRequest, res) => {
  const parsed = saveSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_payload' });

  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) return res.status(404).json({ error: 'user_not_found' });
  const dayNumber = computeDayNumber(user.quitDate);

  const entry = await prisma.exerciseEntry.upsert({
    where: {
      userId_dayNumber_exerciseKey: {
        userId: req.userId!,
        dayNumber,
        exerciseKey: parsed.data.exerciseKey,
      },
    },
    create: {
      userId: req.userId!,
      dayNumber,
      exerciseKey: parsed.data.exerciseKey,
      content: parsed.data.content,
      completedAt: parsed.data.complete ? new Date() : null,
    },
    update: {
      content: parsed.data.content,
      ...(parsed.data.complete ? { completedAt: new Date() } : {}),
    },
  });

  return res.json({ ok: true, entry });
});
