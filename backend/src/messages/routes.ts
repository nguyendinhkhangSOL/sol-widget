// backend/src/messages/routes.ts
// Inbound user messages → 2 paths:
//   1. CANNED path (chip click)  — metadata.cannedReplyId + cannedAnswer
//      → persist Q&A trực tiếp, KHÔNG gọi AI, KHÔNG tốn quota.
//   2. AI path (free-typed)      — qua dispatchMessage + state machine.
//      → tốn quota (FREE / ALUMNI / DONG_HANH-maintenance bị limit).
//
// Trust-client cho canned answer: client gửi sẵn text đã resolve (handle
// chip dynamic như "Hôm nay ngày mấy" — dependent trên user state). User
// đã authed → chỉ persist vào row của chính mình → không có abuse vector
// (user có thể type bất kỳ text nào trong AI path đằng nào).
//
// Socket.IO cũng dùng dispatchMessage trực tiếp (không qua route này).

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

/* ─── Canned reply path — chip click ──────────────────────────────────
 * Khi metadata có cannedReplyId, persist chip Q&A mà KHÔNG qua AI.
 * Yêu cầu: metadata.cannedAnswer phải có (FE đã resolve cho dynamic chip).
 * Optional: wikiUrl, wikiLabel cho marketing CTA loop sang sol.vn.
 */
async function handleCannedReply(
  req: AuthedRequest,
  res: any,
  body: { content: string; metadata?: Record<string, any> },
) {
  const userId = req.userId!;
  const md = body.metadata ?? {};
  const cannedReplyId = String(md.cannedReplyId ?? '');
  const cannedAnswer = typeof md.cannedAnswer === 'string' ? md.cannedAnswer.trim() : '';

  if (!cannedReplyId || !cannedAnswer) {
    return res.status(400).json({ error: 'missing_canned_fields' });
  }

  // Persist user message (chip label) — type CHAT, distinguish chip qua
  // metadata.cannedReplyId + isCannedReply (enum chưa có CHIP_REPLY value).
  const userMsg = await prisma.message.create({
    data: {
      userId,
      role: 'USER',
      type: 'CHAT',
      content: body.content,
      metadata: { cannedReplyId, isCannedReply: true },
    },
  });

  // Persist canned bot answer
  const botMsg = await prisma.message.create({
    data: {
      userId,
      role: 'ASSISTANT',
      type: 'CHAT',
      content: cannedAnswer,
      metadata: {
        cannedReplyId,
        isCannedReply: true,
        wikiUrl: md.wikiUrl ?? null,
        wikiLabel: md.wikiLabel ?? null,
      },
    },
  });

  // Emit cho Socket.IO clients khác (vd dashboard mở widget song song)
  emitToUser(userId, 'message:new', botMsg);

  return res.json({ userMessage: userMsg, outbound: [botMsg] });
}

/* ─── AI path — free-typed, qua state machine + quota gate ──────────── */
async function handleAiMessage(req: AuthedRequest, res: any, body: { content: string; metadata?: Record<string, any> }) {
  const userId = req.userId!;
  const { content, metadata } = body;

  // Persist user message
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

  // Dispatch through state machine
  const result = await dispatchMessage(userId, content, metadata ?? {});

  // Persist + emit outbound replies
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

  emitToUser(userId, 'state:change', { state: result.newState });

  return res.json({ userMessage: userMsg, outbound, state: result.newState });
}

/* ─── POST / — entry point: chia path theo metadata ──────────────────── */
messagesRouter.post('/', async (req: AuthedRequest, res, next) => {
  const parsed = sendSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_payload' });

  const cannedReplyId = (parsed.data.metadata as any)?.cannedReplyId;

  if (cannedReplyId) {
    // Canned path — KHÔNG qua quota gate, KHÔNG dispatch AI
    return handleCannedReply(req, res, parsed.data);
  }

  // AI path — apply quota middleware rồi mới dispatch
  return messageQuotaMiddleware(req, res, () => {
    handleAiMessage(req, res, parsed.data).catch(next);
  });
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
