/**
 * KHOẢNG LẶNG — Anonymous Confessions Feed
 * ─────────────────────────────────────────
 * Channel #3 trong Silent Companionship architecture.
 *
 * User submit confession ngắn ANONYMOUS (không avatar, không tên hiển thị).
 * User khác chỉ react (👍 / 🙏 / "Tôi cũng vậy") — KHÔNG comment chéo.
 * Admin curate — xóa toxic, không edit nội dung.
 *
 * Flow:
 *   GET  /confessions          — list public, paginated, sort by created/popular
 *   POST /confessions          — submit confession (default PENDING, auto-approved nếu safe)
 *   POST /confessions/:id/read — mark đã đọc (idempotent)
 *   POST /confessions/:id/react — react (1-5 type)
 *   GET  /confessions/mine     — user xem confession mình đã viết
 *
 * Reference: docs/SILENT_COMPANIONSHIP_2026-05-08.md
 */

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authMiddleware, type AuthedRequest } from '../auth/middleware';

const router = Router();

// ─── List public confessions ────────────────────────────────────────────
router.get('/', authMiddleware, async (req: AuthedRequest, res) => {
  const limit = Math.min(parseInt((req.query.limit as string) || '20'), 50);
  const cursor = req.query.cursor as string | undefined;
  const sort = (req.query.sort as string) || 'recent'; // 'recent' | 'popular'

  const orderBy =
    sort === 'popular'
      ? [{ readCount: 'desc' as const }, { createdAt: 'desc' as const }]
      : [{ pinnedAt: 'desc' as const }, { createdAt: 'desc' as const }];

  const confessions = await prisma.confession.findMany({
    where: { status: 'PUBLISHED' },
    orderBy,
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      content: true,
      readCount: true,
      reactCount: true,
      pinnedAt: true,
      createdAt: true,
      autoTag: true,
      // KHÔNG select authorId — anonymous public
    },
  });

  const hasMore = confessions.length > limit;
  const items = hasMore ? confessions.slice(0, limit) : confessions;

  // Check user đã react/đã đọc cho mỗi confession (mark UI state)
  const confessionIds = items.map((c) => c.id);
  const [userReactions, userReads] = await Promise.all([
    prisma.confessionReaction.findMany({
      where: { confessionId: { in: confessionIds }, userId: req.userId! },
      select: { confessionId: true, reactionType: true },
    }),
    prisma.confessionRead.findMany({
      where: { confessionId: { in: confessionIds }, userId: req.userId! },
      select: { confessionId: true },
    }),
  ]);

  const reactionMap = new Map<string, number[]>();
  userReactions.forEach((r) => {
    const existing = reactionMap.get(r.confessionId) || [];
    existing.push(r.reactionType);
    reactionMap.set(r.confessionId, existing);
  });
  const readSet = new Set(userReads.map((r) => r.confessionId));

  res.json({
    items: items.map((c) => ({
      ...c,
      myReactions: reactionMap.get(c.id) || [],
      hasRead: readSet.has(c.id),
    })),
    nextCursor: hasMore ? items[items.length - 1].id : null,
  });
});

// ─── Submit confession ──────────────────────────────────────────────────
const submitSchema = z.object({
  content: z.string().min(20).max(800),
});

router.post('/', authMiddleware, async (req: AuthedRequest, res) => {
  const parsed = submitSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { content } = parsed.data;

  // Rate limit: 1 confession / user / 24h
  const recent = await prisma.confession.findFirst({
    where: {
      authorId: req.userId!,
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });
  if (recent) {
    return res.status(429).json({
      error: 'Anh chỉ có thể viết 1 bài/ngày. Hãy ngẫm thêm rồi viết tuần sau.',
    });
  }

  // Auto-tag heuristic (rough — sau wire AI)
  let autoTag: string | null = null;
  const lower = content.toLowerCase();
  if (lower.includes('hút lại') || lower.includes('relapse') || lower.includes('lapse')) {
    autoTag = 'lapse';
  } else if (lower.includes('vợ') || lower.includes('con') || lower.includes('cha')) {
    autoTag = 'family';
  } else if (lower.includes('q-day') || lower.includes('ngày sạch')) {
    autoTag = 'milestone';
  } else if (lower.includes('thèm') || lower.includes('cơn')) {
    autoTag = 'trigger';
  }

  // TODO: AI moderation — toxicity check. Tạm PUBLISHED ngay.
  const confession = await prisma.confession.create({
    data: {
      authorId: req.userId!,
      content,
      status: 'PUBLISHED',
      autoTag,
    },
    select: {
      id: true,
      content: true,
      createdAt: true,
      autoTag: true,
    },
  });

  res.json({ confession });
});

// ─── Mark đã đọc (idempotent) ────────────────────────────────────────────
router.post('/:id/read', authMiddleware, async (req: AuthedRequest, res) => {
  const { id } = req.params;

  try {
    await prisma.confessionRead.create({
      data: { confessionId: id, userId: req.userId! },
    });
    // Increment cached counter
    await prisma.confession.update({
      where: { id },
      data: { readCount: { increment: 1 } },
    });
  } catch (err: any) {
    // Unique constraint = đã đọc rồi → ignore
    if (err.code !== 'P2002') throw err;
  }

  res.json({ ok: true });
});

// ─── React 👍 / 🙏 / "Tôi cũng vậy" ──────────────────────────────────────
const reactSchema = z.object({
  type: z.number().int().min(1).max(5),
});

router.post('/:id/react', authMiddleware, async (req: AuthedRequest, res) => {
  const { id } = req.params;
  const parsed = reactSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    await prisma.confessionReaction.create({
      data: { confessionId: id, userId: req.userId!, reactionType: parsed.data.type },
    });
    await prisma.confession.update({
      where: { id },
      data: { reactCount: { increment: 1 } },
    });
  } catch (err: any) {
    // Đã react cùng type rồi → toggle off
    if (err.code === 'P2002') {
      await prisma.confessionReaction.deleteMany({
        where: {
          confessionId: id,
          userId: req.userId!,
          reactionType: parsed.data.type,
        },
      });
      await prisma.confession.update({
        where: { id },
        data: { reactCount: { decrement: 1 } },
      });
      return res.json({ ok: true, toggled: 'off' });
    }
    throw err;
  }

  res.json({ ok: true, toggled: 'on' });
});

// ─── User xem confession mình đã viết ───────────────────────────────────
router.get('/mine', authMiddleware, async (req: AuthedRequest, res) => {
  const items = await prisma.confession.findMany({
    where: { authorId: req.userId! },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      content: true,
      status: true,
      readCount: true,
      reactCount: true,
      createdAt: true,
    },
  });
  res.json({ items });
});

export default router;
