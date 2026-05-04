// backend/src/users/notificationPrefs.ts
// Phase 5 — Smart notification preferences logic.
// User route + helper functions cho worker.ts dùng.

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authMiddleware, type AuthedRequest } from '../auth/middleware';

export interface NotificationPrefs {
  dailyMax?: number;          // 1-5, default 3
  activeStart?: string;        // "HH:MM", default "09:00"
  activeEnd?: string;          // "HH:MM", default "21:00"
  quietStart?: string;         // "HH:MM", default "22:00"
  quietEnd?: string;           // "HH:MM", default "06:00"
  weekendReduce?: boolean;     // default true
  moments?: {
    coffeeMorning?: string;     // "HH:MM" hoặc null
    teaAfternoon?: string;
    postLunch?: string;
    postDinner?: string;
    preSocialDrink?: string;
    preBedtime?: string;
  };
  consecutiveUnopened?: number; // Phase 6 anti-spam counter
}

export const DEFAULT_PREFS: Required<Omit<NotificationPrefs, 'consecutiveUnopened'>> & { consecutiveUnopened: number } = {
  dailyMax: 3,
  activeStart: '09:00',
  activeEnd: '21:00',
  quietStart: '22:00',
  quietEnd: '06:00',
  weekendReduce: true,
  moments: {},
  consecutiveUnopened: 0,
};

export function mergeWithDefaults(prefs: any): NotificationPrefs {
  return { ...DEFAULT_PREFS, ...(prefs ?? {}), moments: { ...(prefs?.moments ?? {}) } };
}

// ─── Helper functions cho smart scheduler ─────────────────────────────────

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
}

function nowToMinutes(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

/**
 * Check if `now` is in user's quiet hours window.
 * Hỗ trợ wrap qua midnight (vd 22:00 → 06:00).
 */
export function isInQuietHours(now: Date, prefs: NotificationPrefs): boolean {
  const qs = prefs.quietStart ?? DEFAULT_PREFS.quietStart;
  const qe = prefs.quietEnd ?? DEFAULT_PREFS.quietEnd;
  const cur = nowToMinutes(now);
  const s = timeToMinutes(qs);
  const e = timeToMinutes(qe);
  if (s < e) return cur >= s && cur < e;
  return cur >= s || cur < e; // wraps midnight
}

/**
 * Check if `now` is in active window (sau Active Start, trước Active End).
 */
export function isInActiveWindow(now: Date, prefs: NotificationPrefs): boolean {
  const as = prefs.activeStart ?? DEFAULT_PREFS.activeStart;
  const ae = prefs.activeEnd ?? DEFAULT_PREFS.activeEnd;
  const cur = nowToMinutes(now);
  const s = timeToMinutes(as);
  const e = timeToMinutes(ae);
  if (s < e) return cur >= s && cur < e;
  return cur >= s || cur < e;
}

export function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

/**
 * Detect current moment based on user's declared schedule.
 * Returns Moment enum value if within ±15 minutes of any declared time, else 'GENERIC'.
 */
export function detectCurrentMoment(now: Date, moments: NotificationPrefs['moments']): string {
  if (!moments) return 'GENERIC';
  const cur = nowToMinutes(now);

  const map: Record<string, string> = {
    coffeeMorning: 'COFFEE_MORNING',
    teaAfternoon: 'TEA_AFTERNOON',
    postLunch: 'POST_LUNCH',
    postDinner: 'POST_DINNER',
    preSocialDrink: 'PRE_SOCIAL_DRINK',
    preBedtime: 'PRE_BEDTIME',
  };

  for (const [key, momentEnum] of Object.entries(map)) {
    const t = (moments as any)[key];
    if (!t) continue;
    const diff = Math.abs(cur - timeToMinutes(t));
    // Wrap-aware: nếu diff > 720 (12h), tính ngược
    const wrappedDiff = Math.min(diff, 1440 - diff);
    if (wrappedDiff <= 15) return momentEnum;
  }

  return 'GENERIC';
}

/**
 * Tính daily max thực tế (apply weekend reduce).
 */
export function effectiveDailyMax(prefs: NotificationPrefs, now: Date): number {
  const base = prefs.dailyMax ?? DEFAULT_PREFS.dailyMax;
  if (isWeekend(now) && (prefs.weekendReduce ?? DEFAULT_PREFS.weekendReduce)) {
    return Math.max(1, Math.ceil(base / 2));
  }
  return base;
}

// ─── Express router — user-facing prefs API ──────────────────────────────

export const notificationPrefsRouter = Router();
notificationPrefsRouter.use(authMiddleware);

notificationPrefsRouter.get('/', async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) return res.status(404).json({ error: 'not_found' });
  res.json(mergeWithDefaults(user.notificationPrefs));
});

const updateSchema = z.object({
  dailyMax: z.number().int().min(1).max(5).optional(),
  activeStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  activeEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  quietStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  quietEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  weekendReduce: z.boolean().optional(),
  moments: z.object({
    coffeeMorning: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
    teaAfternoon: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
    postLunch: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
    postDinner: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
    preSocialDrink: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
    preBedtime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  }).optional(),
});

notificationPrefsRouter.patch('/', async (req: AuthedRequest, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_payload', detail: parsed.error.flatten() });

  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) return res.status(404).json({ error: 'not_found' });

  const current = mergeWithDefaults(user.notificationPrefs);
  const merged = {
    ...current,
    ...parsed.data,
    moments: { ...current.moments, ...(parsed.data.moments ?? {}) },
  };

  // Clean null values trong moments (user clear)
  if (parsed.data.moments) {
    for (const [k, v] of Object.entries(parsed.data.moments)) {
      if (v === null) delete (merged.moments as any)[k];
    }
  }

  await prisma.user.update({
    where: { id: req.userId! },
    data: { notificationPrefs: merged as any },
  });

  res.json(merged);
});
