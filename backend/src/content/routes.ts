// backend/src/content/routes.ts
// Daily content package endpoint. Frontend uses this to render roadmap items,
// science tips, phenomena alerts, night stories.

import { Router } from 'express';
import { prisma } from '../db';
import { authMiddleware, type AuthedRequest } from '../auth/middleware';
import { computeDayNumber } from '../utils/dayNumber';

export const contentRouter = Router();
contentRouter.use(authMiddleware);

contentRouter.get('/day/today', async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) return res.status(404).json({ error: 'user_not_found' });
  const day = computeDayNumber(user.quitDate);
  return serveDay(day, req.userId!, res);
});

contentRouter.get('/day/:day', async (req: AuthedRequest, res) => {
  const day = parseInt(req.params.day, 10);
  if (!(day >= 1 && day <= 30)) return res.status(400).json({ error: 'invalid_day' });
  return serveDay(day, req.userId!, res);
});

async function serveDay(day: number, userId: string, res: any) {
  const items = await prisma.contentItem.findMany({
    where: { dayNumber: day, published: true },
    orderBy: { module: 'asc' },
  });

  const grouped: Record<string, any[]> = {
    MORNING_GOAL: [],
    SCIENCE_TIP: [],
    PHENOMENA_ALERT: [],
    EXERCISE: [],
    NIGHT_STORY: [],
  };
  for (const it of items) grouped[it.module].push(it);

  const exerciseEntries = await prisma.exerciseEntry.findMany({
    where: { userId, dayNumber: day },
  });
  const exerciseMap = new Map(exerciseEntries.map((e) => [e.exerciseKey, e]));

  // Decorate exercises with user progress.
  grouped.EXERCISE = grouped.EXERCISE.map((ex) => ({
    ...ex,
    progress: ex.exerciseKey ? exerciseMap.get(ex.exerciseKey) ?? null : null,
  }));

  // Check-in state for today.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkin = await prisma.checkIn.findUnique({
    where: { userId_date: { userId, date: today } },
  });

  return res.json({
    day,
    checkinDone: !!checkin,
    content: grouped,
  });
}

// Canned quick-reply chips for widget chat (founder-edited, render NGAY).
// Public to all logged-in users — không có dữ liệu nhạy cảm.
contentRouter.get('/canned-replies', async (_req, res) => {
  const items = await prisma.cannedReply.findMany({
    where: { enabled: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
  res.json({
    items: items.map((it) => ({
      id: it.slug, // expose slug as id để widget không bị lệch khi DB tạo cuid mới
      icon: it.icon,
      label: it.label,
      answer: it.answer,
      wikiUrl: it.wikiUrl,
      wikiLabel: it.wikiLabel,
      reusable: it.reusable,
      // Trigger filter — frontend dùng để match user message → render NGAY
      triggers: (it as any).triggers ?? [],
      priority: (it as any).priority ?? 100,
      minScore: (it as any).minScore ?? 0.5,
    })),
  });
});

// Roadmap overview (all 30 days with progress)
contentRouter.get('/roadmap', async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) return res.status(404).json({ error: 'user_not_found' });

  const today = computeDayNumber(user.quitDate);

  const checkins = await prisma.checkIn.findMany({ where: { userId: req.userId! } });
  const exercises = await prisma.exerciseEntry.findMany({ where: { userId: req.userId! } });

  const checkinByDay = new Map<number, typeof checkins[number]>();
  for (const c of checkins) checkinByDay.set(c.dayNumber, c);

  const exerciseCountByDay = new Map<number, number>();
  for (const e of exercises) {
    if (!e.completedAt) continue;
    exerciseCountByDay.set(e.dayNumber, (exerciseCountByDay.get(e.dayNumber) ?? 0) + 1);
  }

  const days = Array.from({ length: 30 }, (_, i) => {
    const d = i + 1;
    const ci = checkinByDay.get(d);
    return {
      day: d,
      isToday: d === today,
      locked: d > today + 1,
      checkinDone: !!ci,
      smoked: ci?.smoked ?? null,
      exercisesDone: exerciseCountByDay.get(d) ?? 0,
    };
  });

  return res.json({ today, days, streak: user.checkinStreak, longestStreak: user.longestStreak });
});
