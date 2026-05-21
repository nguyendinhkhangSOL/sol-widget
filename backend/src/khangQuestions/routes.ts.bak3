/**
 * HỎI KHANG — Anonymous Mailbox + Voice Reply Broadcast
 * ──────────────────────────────────────────────────────
 * Channel #5 — moat đặc biệt nhất Sol.
 *
 * Flow:
 *   1. User submit câu hỏi anonymous
 *   2. Khang đọc inbox 1-2 lần/tuần (admin UI)
 *   3. Khang pick 3-5 câu đáng quan tâm chung → SELECTED
 *   4. Khang voice reply 5-10 phút broadcast (KhangVoice với isQuestionReply=true)
 *   5. Tất cả user xem được voice replies trong tab "Hỏi"
 *
 * Reference: docs/SOL_CHANNELS_NO_GROUP_2026-05-08.md
 */

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authMiddleware, type AuthedRequest } from '../auth/middleware';

const router = Router();

// ─── Submit câu hỏi anonymous ──────────────────────────────────────────
const submitSchema = z.object({
  content: z.string().min(20).max(1000),
});

router.post('/', authMiddleware, async (req: AuthedRequest, res) => {
  const parsed = submitSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  // Rate limit: 1 câu/user/tuần
  const recent = await prisma.khangQuestion.findFirst({
    where: {
      authorId: req.userId!,
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
  });
  if (recent) {
    return res.status(429).json({
      error: 'Anh chỉ gửi 1 câu/tuần. Khang sẽ đọc tất cả.',
    });
  }

  const question = await prisma.khangQuestion.create({
    data: {
      authorId: req.userId!,
      content: parsed.data.content,
      status: 'PENDING',
    },
    select: { id: true, content: true, createdAt: true, status: true },
  });

  res.json({ question });
});

// ─── List voice replies (đã ANSWERED) — public broadcast ───────────────
router.get('/voice-replies', authMiddleware, async (req: AuthedRequest, res) => {
  const limit = Math.min(parseInt((req.query.limit as string) || '20'), 50);
  const cursor = req.query.cursor as string | undefined;

  // Voice replies = KhangVoice với isQuestionReply=true
  const voices = await prisma.khangVoice.findMany({
    where: {
      isQuestionReply: true,
      status: 'PUBLISHED',
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      title: true,
      description: true,
      audioUrl: true,
      durationSec: true,
      topic: true,
      listenCount: true,
      reactCount: true,
      createdAt: true,
      // Reverse find: questions linked to this voice
      questionReplies: {
        select: {
          id: true,
          content: true,
          // KHÔNG select authorId — anonymous public
        },
        take: 5, // Top 5 questions Khang trả lời trong voice này
      },
    },
  });

  const hasMore = voices.length > limit;
  const items = hasMore ? voices.slice(0, limit) : voices;

  res.json({
    items,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  });
});

// ─── User xem câu hỏi của mình ──────────────────────────────────────────
router.get('/mine', authMiddleware, async (req: AuthedRequest, res) => {
  const items = await prisma.khangQuestion.findMany({
    where: { authorId: req.userId! },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      content: true,
      status: true,
      selectedAt: true,
      voiceReplyId: true,
      voiceReply: {
        select: {
          id: true,
          title: true,
          audioUrl: true,
          durationSec: true,
        },
      },
      upvoteCount: true,
      createdAt: true,
    },
  });
  res.json({ items });
});

// ─── Upvote câu hỏi của người khác (signal cho Khang biết câu nào nóng) ─
router.post('/:id/upvote', authMiddleware, async (req: AuthedRequest, res) => {
  const { id } = req.params;

  try {
    await prisma.khangQuestionUpvote.create({
      data: { questionId: id, userId: req.userId! },
    });
    await prisma.khangQuestion.update({
      where: { id },
      data: { upvoteCount: { increment: 1 } },
    });
  } catch (err: any) {
    // Đã upvote → toggle off
    if (err.code === 'P2002') {
      await prisma.khangQuestionUpvote.deleteMany({
        where: { questionId: id, userId: req.userId! },
      });
      await prisma.khangQuestion.update({
        where: { id },
        data: { upvoteCount: { decrement: 1 } },
      });
      return res.json({ ok: true, toggled: 'off' });
    }
    throw err;
  }

  res.json({ ok: true, toggled: 'on' });
});

export default router;
