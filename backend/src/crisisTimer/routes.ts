/**
 * CRISIS TIMER — 90s urge surfing
 * ─────────────────────────────────
 * User bấm "Tôi đang thèm" → timer start + voice Khang play 90s.
 * Sau timer: anh hút hay không? → outcome data.
 *
 * Endpoints:
 *   POST /crisis-timer/start   — start timer + return voice URL
 *   POST /crisis-timer/:id/end — end timer with outcome
 *
 * Reference: Brewer 2011 mindfulness urge surfing RCT (1.6x quit rate).
 */

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authMiddleware, type AuthedRequest } from '../auth/middleware';

const router = Router();

// ─── Start crisis timer ────────────────────────────────────────────────
const startSchema = z.object({
  triggerContext: z
    .enum(['stress', 'social', 'habit', 'boredom', 'after_meal', 'unknown'])
    .default('unknown'),
});

router.post('/start', authMiddleware, async (req: AuthedRequest, res) => {
  const parsed = startSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const log = await prisma.crisisTimerLog.create({
    data: {
      userId: req.userId!,
      triggerContext: parsed.data.triggerContext,
    },
  });

  // Get voice for crisis 90s
  const voice = await prisma.khangVoice.findFirst({
    where: { autoPlayTrigger: 'crisis_90s', status: 'PUBLISHED' },
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, audioUrl: true, durationSec: true },
  });

  res.json({
    timerId: log.id,
    durationSec: 90,
    voice: voice || null,
    message: 'Anh đợi tôi 90 giây. Cùng nhau.',
  });
});

// ─── End timer with outcome ─────────────────────────────────────────────
const endSchema = z.object({
  outcome: z.enum(['delayed_no_smoke', 'smoked_after', 'abandoned']),
  delayDurationSec: z.number().int().min(0).max(3600).optional(),
  notes: z.string().max(1000).optional(),
});

router.post('/:id/end', authMiddleware, async (req: AuthedRequest, res) => {
  const { id } = req.params;
  const parsed = endSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const log = await prisma.crisisTimerLog.findFirst({
    where: { id, userId: req.userId! },
  });
  if (!log) return res.status(404).json({ error: 'Timer not found' });

  // Calculate duration if not provided
  const delaySec =
    parsed.data.delayDurationSec ??
    Math.round((Date.now() - log.startedAt.getTime()) / 1000);

  const updated = await prisma.crisisTimerLog.update({
    where: { id },
    data: {
      endedAt: new Date(),
      delayDurationSec: delaySec,
      outcome: parsed.data.outcome,
      notes: parsed.data.notes,
    },
  });

  // Encouragement message based on outcome
  let message = '';
  if (parsed.data.outcome === 'delayed_no_smoke') {
    if (delaySec >= 300) message = 'Anh đợi được 5 phút. Tao thấy.';
    else if (delaySec >= 180) message = 'Anh đợi được 3 phút. Tao thấy.';
    else if (delaySec >= 90) message = 'Anh đợi được 90 giây. Đó là quyết định của anh.';
    else message = 'Anh đợi được. Lần sau có thể lâu hơn.';
  } else if (parsed.data.outcome === 'smoked_after') {
    message = 'Một điếu không phải fail. Anh đã thử. Lần sau anh đợi lâu hơn được.';
  } else {
    message = 'Anh quay lại lúc nào cũng được.';
  }

  res.json({ timer: updated, message });
});

// ─── Stats: delay capacity ─────────────────────────────────────────────
router.get('/stats', authMiddleware, async (req: AuthedRequest, res) => {
  const logs = await prisma.crisisTimerLog.findMany({
    where: { userId: req.userId!, outcome: { not: null } },
    select: { delayDurationSec: true, outcome: true, startedAt: true },
    orderBy: { startedAt: 'desc' },
    take: 100,
  });

  const successful = logs.filter((l) => l.outcome === 'delayed_no_smoke');
  const avgDelay =
    successful.length > 0
      ? successful.reduce((sum, l) => sum + (l.delayDurationSec || 0), 0) / successful.length
      : 0;
  const maxDelay =
    successful.length > 0 ? Math.max(...successful.map((l) => l.delayDurationSec || 0)) : 0;

  res.json({
    totalAttempts: logs.length,
    successCount: successful.length,
    successRate: logs.length > 0 ? Math.round((successful.length / logs.length) * 100) : 0,
    avgDelaySec: Math.round(avgDelay),
    maxDelaySec: maxDelay,
  });
});

export default router;
