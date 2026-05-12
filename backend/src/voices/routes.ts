/**
 * KHANG VOICE LIBRARY
 * ───────────────────
 * Channel #2 — voice clips Khang post broadcast.
 *
 * Endpoints:
 *   GET  /voices                — list voice (filter by topic, tier-aware)
 *   GET  /voices/auto-play/:trigger — get voice for auto-play context
 *   POST /voices/:id/listen     — track listen + completion
 *   POST /voices/:id/react      — react 👍 / 🙏
 */

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authMiddleware, tierMiddleware, type AuthedRequest } from '../auth/middleware';
import type { UserTier } from '@prisma/client';

const router = Router();

// Tier hierarchy: FREE < KHOI_DONG < DONG_HANH < ALUMNI
const TIER_LEVEL: Record<UserTier, number> = {
  FREE: 0,
  KHOI_DONG: 1,
  DONG_HANH: 2,
  ALUMNI: 2, // alumni có quyền đọc như DONG_HANH (lifetime asset)
};

function userCanAccessTier(userTier: UserTier, requiredTier: UserTier): boolean {
  return TIER_LEVEL[userTier] >= TIER_LEVEL[requiredTier];
}

// ─── List voice library (filter by topic, tier-gated) ──────────────────
router.get('/', authMiddleware, tierMiddleware, async (req: AuthedRequest, res) => {
  const topic = req.query.topic as string | undefined;
  const limit = Math.min(parseInt((req.query.limit as string) || '20'), 50);
  const cursor = req.query.cursor as string | undefined;

  const userTier = req.userTier!;

  // Filter voice user có quyền nghe
  const allowedTiers: UserTier[] = ['FREE'];
  if (userCanAccessTier(userTier, 'KHOI_DONG')) allowedTiers.push('KHOI_DONG');
  if (userCanAccessTier(userTier, 'DONG_HANH')) allowedTiers.push('DONG_HANH');

  const voices = await prisma.khangVoice.findMany({
    where: {
      status: 'PUBLISHED',
      isQuestionReply: false, // exclude voice replies (riêng tab Hỏi Khang)
      minTier: { in: allowedTiers },
      ...(topic ? { topic } : {}),
    },
    orderBy: [{ pinnedAt: 'desc' }, { createdAt: 'desc' }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      title: true,
      description: true,
      audioUrl: true,
      durationSec: true,
      topic: true,
      pinnedAt: true,
      listenCount: true,
      reactCount: true,
      createdAt: true,
    },
  });

  const hasMore = voices.length > limit;
  const items = hasMore ? voices.slice(0, limit) : voices;

  // Mark user's listening progress
  const voiceIds = items.map((v) => v.id);
  const listens = await prisma.khangVoiceListen.findMany({
    where: { userId: req.userId!, voiceId: { in: voiceIds } },
    select: { voiceId: true, completionPct: true },
  });
  const listenMap = new Map(listens.map((l) => [l.voiceId, l.completionPct]));

  res.json({
    items: items.map((v) => ({
      ...v,
      myCompletionPct: listenMap.get(v.id) || 0,
    })),
    nextCursor: hasMore ? items[items.length - 1].id : null,
  });
});

// ─── Get voice for auto-play trigger ───────────────────────────────────
// Trigger: "onboard" | "lapse" | "qday" | "crisis_90s"
router.get('/auto-play/:trigger', authMiddleware, tierMiddleware, async (req: AuthedRequest, res) => {
  const { trigger } = req.params;

  const voice = await prisma.khangVoice.findFirst({
    where: {
      autoPlayTrigger: trigger,
      status: 'PUBLISHED',
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      audioUrl: true,
      durationSec: true,
    },
  });

  if (!voice) {
    return res.status(404).json({ error: 'No voice for this trigger yet' });
  }

  res.json({ voice });
});

// ─── Track listen + completion ─────────────────────────────────────────
const listenSchema = z.object({
  completionPct: z.number().int().min(0).max(100),
  context: z.enum(['auto', 'manual', 'push']).default('manual'),
});

router.post('/:id/listen', authMiddleware, tierMiddleware, async (req: AuthedRequest, res) => {
  const { id } = req.params;
  const parsed = listenSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  // Upsert: if user đã listen → update completion (max)
  const existing = await prisma.khangVoiceListen.findFirst({
    where: { voiceId: id, userId: req.userId! },
    orderBy: { createdAt: 'desc' },
  });

  if (existing) {
    if (parsed.data.completionPct > existing.completionPct) {
      await prisma.khangVoiceListen.update({
        where: { id: existing.id },
        data: { completionPct: parsed.data.completionPct },
      });
    }
  } else {
    await prisma.khangVoiceListen.create({
      data: {
        voiceId: id,
        userId: req.userId!,
        completionPct: parsed.data.completionPct,
        context: parsed.data.context,
      },
    });
    // Increment counter chỉ khi first listen
    await prisma.khangVoice.update({
      where: { id },
      data: { listenCount: { increment: 1 } },
    });
  }

  res.json({ ok: true });
});

// ─── React voice ───────────────────────────────────────────────────────
const reactVoiceSchema = z.object({
  type: z.number().int().min(1).max(2),
});

router.post('/:id/react', authMiddleware, tierMiddleware, async (req: AuthedRequest, res) => {
  const { id } = req.params;
  const parsed = reactVoiceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    await prisma.khangVoiceReaction.create({
      data: { voiceId: id, userId: req.userId!, reactionType: parsed.data.type },
    });
    await prisma.khangVoice.update({
      where: { id },
      data: { reactCount: { increment: 1 } },
    });
  } catch (err: any) {
    if (err.code === 'P2002') {
      await prisma.khangVoiceReaction.deleteMany({
        where: { voiceId: id, userId: req.userId! },
      });
      await prisma.khangVoice.update({
        where: { id },
        data: { reactCount: { decrement: 1 } },
      });
      return res.json({ ok: true, toggled: 'off' });
    }
    throw err;
  }

  res.json({ ok: true, toggled: 'on' });
});

export default router;
