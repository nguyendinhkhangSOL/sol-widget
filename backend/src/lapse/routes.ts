/**
 * LAPSE-FRIENDLY UX
 * ─────────────────
 * User log "đã hút" — KHÔNG reset streak. Sol nói "Một điếu không phải fail".
 *
 * Flow:
 *   POST /lapse              — log lapse event + auto-play voice "lapse-friendly"
 *   POST /lapse/:id/recover  — mark anh đã quay lại (recoveredAt)
 *   POST /lapse/:id/reflect  — anh viết reflection (optional)
 *   GET  /lapse              — list user's lapses
 *
 * Reference: docs/SCIENCE_AUDIT — Marlatt 1985 abstinence violation effect.
 */

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authMiddleware, type AuthedRequest } from '../auth/middleware';

const router = Router();

// ─── Log lapse event ───────────────────────────────────────────────────
const lapseSchema = z.object({
  cigaretteCount: z.number().int().min(1).max(50),
  context: z
    .enum([
      'social_drinking',
      'stress',
      'funeral',
      'wedding',
      'alone_late_night',
      'after_meal',
      'family_conflict',
      'other',
    ])
    .optional(),
  reflection: z.string().max(2000).optional(),
});

router.post('/', authMiddleware, async (req: AuthedRequest, res) => {
  const parsed = lapseSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const lapse = await prisma.lapseEvent.create({
    data: {
      userId: req.userId!,
      cigaretteCount: parsed.data.cigaretteCount,
      context: parsed.data.context,
      reflection: parsed.data.reflection,
    },
  });

  // Get lapse-friendly voice for auto-play
  const voice = await prisma.khangVoice.findFirst({
    where: { autoPlayTrigger: 'lapse', status: 'PUBLISHED' },
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, audioUrl: true, durationSec: true },
  });

  // Mark voice played
  if (voice) {
    await prisma.lapseEvent.update({
      where: { id: lapse.id },
      data: { voicePlayed: true },
    });
  }

  res.json({
    lapse,
    voice,
    message: 'Một điếu không phải fail. Anh ổn. Tôi vẫn ở đây.',
  });
});

// ─── Mark recovered (anh quay lại Sol sau lapse) ───────────────────────
router.post('/:id/recover', authMiddleware, async (req: AuthedRequest, res) => {
  const { id } = req.params;

  const lapse = await prisma.lapseEvent.findFirst({
    where: { id, userId: req.userId! },
  });
  if (!lapse) return res.status(404).json({ error: 'Lapse not found' });
  if (lapse.recoveredAt) return res.json({ lapse, alreadyRecovered: true });

  const updated = await prisma.lapseEvent.update({
    where: { id },
    data: { recoveredAt: new Date() },
  });

  res.json({ lapse: updated });
});

// ─── Add reflection sau lapse (optional) ───────────────────────────────
const reflectSchema = z.object({
  reflection: z.string().min(5).max(2000),
});

router.post('/:id/reflect', authMiddleware, async (req: AuthedRequest, res) => {
  const { id } = req.params;
  const parsed = reflectSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const lapse = await prisma.lapseEvent.findFirst({
    where: { id, userId: req.userId! },
  });
  if (!lapse) return res.status(404).json({ error: 'Lapse not found' });

  const updated = await prisma.lapseEvent.update({
    where: { id },
    data: { reflection: parsed.data.reflection },
  });

  res.json({ lapse: updated });
});

// ─── List user's lapses ────────────────────────────────────────────────
router.get('/', authMiddleware, async (req: AuthedRequest, res) => {
  const items = await prisma.lapseEvent.findMany({
    where: { userId: req.userId! },
    orderBy: { lapsedAt: 'desc' },
    take: 50,
  });
  res.json({ items });
});

// ─── Stats: lapse-recovery time ────────────────────────────────────────
router.get('/stats', authMiddleware, async (req: AuthedRequest, res) => {
  const lapses = await prisma.lapseEvent.findMany({
    where: { userId: req.userId!, recoveredAt: { not: null } },
    select: { lapsedAt: true, recoveredAt: true, cigaretteCount: true },
  });

  const totalLapses = lapses.length;
  const recoveryTimes = lapses
    .filter((l) => l.recoveredAt)
    .map((l) => (l.recoveredAt!.getTime() - l.lapsedAt.getTime()) / (60 * 60 * 1000)); // hours

  const avgRecoveryHours =
    recoveryTimes.length > 0
      ? recoveryTimes.reduce((a, b) => a + b, 0) / recoveryTimes.length
      : null;

  const within24h = recoveryTimes.filter((h) => h <= 24).length;

  res.json({
    totalLapses,
    avgRecoveryHours: avgRecoveryHours ? Math.round(avgRecoveryHours * 10) / 10 : null,
    within24hCount: within24h,
    within24hRate: totalLapses > 0 ? Math.round((within24h / totalLapses) * 100) : null,
  });
});

export default router;
