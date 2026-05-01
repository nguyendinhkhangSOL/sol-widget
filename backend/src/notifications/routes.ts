// backend/src/notifications/routes.ts
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authMiddleware, type AuthedRequest } from '../auth/middleware';
import { config } from '../config';

export const notificationsRouter = Router();
notificationsRouter.use(authMiddleware);

// VAPID public key for client SW registration.
notificationsRouter.get('/vapid-key', (_req, res) => {
  return res.json({ publicKey: config.push.publicKey });
});

const subSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string(), auth: z.string() }),
  userAgent: z.string().optional(),
});

notificationsRouter.post('/subscribe', async (req: AuthedRequest, res) => {
  const parsed = subSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_payload' });

  const { endpoint, keys, userAgent } = parsed.data;
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: {
      userId: req.userId!,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userAgent,
    },
    update: { p256dh: keys.p256dh, auth: keys.auth, userAgent, lastUsedAt: new Date() },
  });
  return res.json({ ok: true });
});

notificationsRouter.post('/unsubscribe', async (req: AuthedRequest, res) => {
  const endpoint = String(req.body?.endpoint ?? '');
  await prisma.pushSubscription.deleteMany({ where: { userId: req.userId!, endpoint } });
  return res.json({ ok: true });
});

// Inbox — fetch undismissed in-widget notifications.
notificationsRouter.get('/inbox', async (req: AuthedRequest, res) => {
  const items = await prisma.notification.findMany({
    where: { userId: req.userId!, sentAt: { not: null } },
    orderBy: { sentAt: 'desc' },
    take: 50,
  });
  return res.json({ inbox: items });
});

notificationsRouter.post('/:id/read', async (req: AuthedRequest, res) => {
  await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.userId! },
    data: { readAt: new Date(), status: 'READ' },
  });
  return res.json({ ok: true });
});
