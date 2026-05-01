// backend/src/messages/routes.ts
// Inbound user messages → dispatchMessage → persist user + assistant → return outbound(s).
// Socket.IO also uses dispatchMessage directly.
//
// Tier gate: POST / dùng messageQuotaMiddleware. FREE / ALUMNI /
// DONG_HANH-maintenance bị giới hạn tin/ngày. Vượt → 402 quota_exceeded.

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import {
  authMiddleware,
  messageQuotaMiddleware,
  incrementDailyMessage,
  type AuthedRequest,
} from '../auth/middleware';
import { dispatchMessage } from '../state/machine';
import { emitToUser } from '../socket/emitter';

export const messagesRouter = Router();
messagesRouter.use(authMiddleware);

const sendSchema = z.object({
  content: z.string().max(2000),
  metadata: z.record(z.any()).optional(),
});

messagesRouter.post('/', messageQuotaMiddleware, async (req: AuthedRequest, res) => {
  const parsed = sendSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_payload' });

  const userId = req.userId!;
  const { content, metadata } = parsed.data;

  // Persist user message.
  const userMsg = await prisma.message.create({
    data: {
      userId,
      role: 'USER',
      type: (metadata?.type as any) ?? 'CHAT',
      content,
      metadata: metadata ?? {},
    },
  });

  // Tăng quota (chỉ matter cho FREE / maintenance — middleware đã check OK)
  incrementDailyMessage(userId).catch(() => {});

  // Dispatch through state machine.
  const result = await dispatchMessage(userId, content, metadata ?? {});

  // Persist and emit outbound replies.
  const outbound = [];
  for (const out of result.outbound) {
    const saved = await prisma.message.create({
      data: {
        userId,
        role: 'ASSISTANT',
        type: out.type,
        content: out.content,
        metadata: out.metadata ?? {},
      },
    });
    outbound.push(saved);
    emitToUser(userId, 'message:new', saved);
  }

  // Also broadcast state change.
  emitToUser(userId, 'state:change', { state: result.newState });

  return res.json({ userMessage: userMsg, outbound, state: result.newState });
});

messagesRouter.get('/', async (req: AuthedRequest, res) => {
  const limit = Math.min(parseInt(String(req.query.limit ?? '50'), 10) || 50, 200);
  const before = req.query.before ? new Date(String(req.query.before)) : undefined;

  const messages = await prisma.message.findMany({
    where: {
      userId: req.userId!,
      ...(before ? { createdAt: { lt: before } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return res.json({ messages: messages.reverse() });
});

messagesRouter.post('/read', async (req: AuthedRequest, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String) : [];
  if (ids.length === 0) return res.json({ ok: true, updated: 0 });

  const updated = await prisma.message.updateMany({
    where: { userId: req.userId!, id: { in: ids }, readAt: null },
    data: { readAt: new Date() },
  });

  return res.json({ ok: true, updated: updated.count });
});
