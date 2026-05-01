// backend/src/voice/routes.ts
//
// Public:
//   GET /voice/inbox → danh sách voice user được phép nghe (đã delivered)
//   POST /voice/:id/played → đánh dấu user đã nghe
//
// Admin CRUD qua /admin/voice — xem admin/routes.ts.

import { Router } from 'express';
import { prisma } from '../db';
import { authMiddleware, type AuthedRequest } from '../auth/middleware';
import { effectiveTier } from '../tiers/featureGates';

export const voiceRouter = Router();
voiceRouter.use(authMiddleware);

voiceRouter.get('/inbox', async (req: AuthedRequest, res) => {
  const u = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: {
      tier: true,
      tierStartedAt: true,
      tierExpiresAt: true,
      maintenanceUntil: true,
    },
  });
  if (!u) return res.status(404).json({ error: 'user_not_found' });

  const eff = effectiveTier(u);

  const deliveries = await prisma.voiceDelivery.findMany({
    where: { userId: req.userId! },
    include: { voice: true },
    orderBy: { deliveredAt: 'desc' },
    take: 30,
  });

  res.json({
    items: deliveries.map((d) => ({
      id: d.id,
      voiceId: d.voiceId,
      title: d.voice.title,
      audioUrl: d.voice.audioUrl,
      durationSec: d.voice.durationSec,
      transcript: d.voice.transcript,
      tag: d.voice.tag,
      deliveredAt: d.deliveredAt,
      playedAt: d.playedAt,
    })),
    effectiveTier: eff,
  });
});

voiceRouter.post('/:id/played', async (req: AuthedRequest, res) => {
  const delivery = await prisma.voiceDelivery.findUnique({
    where: { id: req.params.id },
  });
  if (!delivery || delivery.userId !== req.userId) {
    return res.status(404).json({ error: 'not_found' });
  }
  await prisma.voiceDelivery.update({
    where: { id: delivery.id },
    data: { playedAt: delivery.playedAt ?? new Date() },
  });
  res.json({ ok: true });
});
