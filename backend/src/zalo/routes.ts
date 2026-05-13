// backend/src/zalo/routes.ts
//
// Express routes cho Zalo OA module.
//   POST /api/zalo/webhook            ← Zalo POST event vào đây
//   GET  /api/zalo/oa/user/:id        ← Admin: xem ZaloOAUser detail
//   GET  /api/zalo/zns/log            ← Admin: ZNS send history
//   GET  /api/zalo/health             ← Health check

import { Router, raw } from 'express';
import { handleZaloWebhook } from './webhook';
import { zaloTemplateRouter } from './templateRoutes';
import { prisma } from '../db';
import { authMiddleware, type AuthedRequest } from '../auth/middleware';

export const zaloRouter = Router();

// Template CRUD (admin only) — mount trước webhook để tránh conflict path
zaloRouter.use('/templates', zaloTemplateRouter);

/**
 * Webhook endpoint — Zalo POST tới đây.
 *
 * Cần raw body để verify signature → dùng express.raw() thay vì express.json().
 * Sau khi capture rawBody, parse JSON manually trong handler.
 */
zaloRouter.post(
  '/webhook',
  raw({ type: 'application/json', limit: '256kb' }),
  (req, res, next) => {
    // Capture raw body string trước khi parse
    const rawBody = (req.body as Buffer)?.toString('utf8') ?? '';
    (req as any).rawBody = rawBody;
    try {
      req.body = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      res.status(400).json({ error: 'invalid_json' });
      return;
    }
    next();
  },
  handleZaloWebhook,
);

/**
 * Health check — Zalo có thể GET endpoint này khi verify webhook URL.
 */
zaloRouter.get('/webhook', (_req, res) => {
  res.json({ ok: true, service: 'sol-zalo-oa', timestamp: new Date().toISOString() });
});

/**
 * Admin only — xem ZaloOAUser detail.
 */
zaloRouter.get('/oa/user/:id', authMiddleware, async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! }, select: { isAdmin: true } });
  if (!user?.isAdmin) {
    res.status(403).json({ error: 'forbidden' });
    return;
  }
  const oaUser = await prisma.zaloOAUser.findUnique({ where: { id: req.params.id } });
  if (!oaUser) {
    res.status(404).json({ error: 'not_found' });
    return;
  }
  res.json(oaUser);
});

/**
 * Admin — ZNS send history (last 100).
 */
zaloRouter.get('/zns/log', authMiddleware, async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! }, select: { isAdmin: true } });
  if (!user?.isAdmin) {
    res.status(403).json({ error: 'forbidden' });
    return;
  }
  const logs = await prisma.zNSLog.findMany({
    orderBy: { sentAt: 'desc' },
    take: 100,
  });
  res.json({ items: logs });
});

zaloRouter.get('/health', (_req, res) => {
  res.json({
    ok: true,
    oaId: process.env.ZALO_OA_ID ?? '3049397094672064963',
    accessTokenConfigured: !!process.env.ZALO_OA_ACCESS_TOKEN,
    appSecretConfigured: !!process.env.ZALO_APP_SECRET,
  });
});
