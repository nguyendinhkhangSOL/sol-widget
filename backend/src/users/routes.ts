// backend/src/users/routes.ts
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authMiddleware, type AuthedRequest } from '../auth/middleware';
import { computeDayNumber } from '../utils/dayNumber';
import { computeTierState, effectiveTier, featuresFor } from '../tiers/featureGates';
// assertChecklistComplete removed — Q-Day flexible pivot 2026-05-08

export const usersRouter = Router();
usersRouter.use(authMiddleware);

usersRouter.get('/me', async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    include: { state: true },
  });
  if (!user) return res.status(404).json({ error: 'user_not_found' });

  const dayNumber = computeDayNumber(user.quitDate);
  const tierState = computeTierState(user);
  const effTier = effectiveTier(user);

  return res.json({
    id: user.id,
    name: user.name,
    // Identity fields — FE dùng để biết user đã liên kết chưa
    phone: user.phone,
    email: user.email,
    zaloUserId: user.zaloUserId,
    isAnonymous: user.isAnonymous,
    pronouns: user.pronouns,
    assistantName: user.assistantName,
    ftndScore: user.ftndScore,
    quitDate: user.quitDate,
    // Day 9 (2026-05-22): expose onboardingCompletedAt để FE App.tsx
    // route ngay tới /test-ftnd nếu chưa onboarding (tránh phải gọi
    // /journey/dashboard rồi mới biết redirect — flash Overview)
    onboardingCompletedAt: user.onboardingCompletedAt,
    cigsBaseline: user.cigsBaseline,
    pricePerCig: user.pricePerCig,
    dayNumber,
    checkinStreak: user.checkinStreak,
    longestStreak: user.longestStreak,
    lastCheckinDate: user.lastCheckinDate,
    missedDaysInRow: user.missedDaysInRow,
    refundEligible: user.refundEligible,
    isAdmin: user.isAdmin,
    settings: user.settings,
    riskyHours: user.riskyHours,
    topTriggers: user.topTriggers,
    // Deep profile (group 1)
    age: user.age,
    yearsSmoked: user.yearsSmoked,
    quitReasons: user.quitReasons,
    // Tier system
    tier: user.tier,
    effectiveTier: effTier,
    tierState,
    features: featuresFor(effTier),
    cohortKey: user.cohortKey,
    state: user.state?.state ?? 'IDLE',
  });
});

const patchSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  // Free-form pronouns: anh/chị/em/Ngài/Đại ca… ≤ 8 ký tự
  pronouns: z.string().min(1).max(8).optional(),
  // Tên trợ lý ≤ 24 ký tự
  assistantName: z.string().min(1).max(24).optional(),
  ftndScore: z.number().int().min(0).max(10).optional(),
  settings: z.record(z.any()).optional(),
  riskyHours: z.array(z.number().int().min(0).max(23)).optional(),
  topTriggers: z.array(z.string().min(1).max(40)).max(5).optional(),
  // ── Hồ sơ cai thuốc (group 1) — đều optional, có thể clear bằng null ───
  age: z.number().int().min(18).max(120).nullable().optional(),
  yearsSmoked: z.number().int().min(0).max(90).nullable().optional(),
  // 0..5 lý do, mỗi câu ≤ 80 ký tự (vd "vì cu Tí cháu nội"). Cho phép
  // mảng rỗng để user "xoá hết".
  quitReasons: z.array(z.string().min(1).max(80)).max(5).optional(),
  // Q-Day — chỉ chấp nhận khi user đã tick xong checklist. ISO date string.
  // Cho phép null để user reset.
  quitDate: z.string().datetime().nullable().optional(),
});

usersRouter.patch('/me', async (req: AuthedRequest, res) => {
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_payload' });

  const existing = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!existing) return res.status(404).json({ error: 'user_not_found' });

  // ─── Q-DAY FLEXIBLE (pivot 2026-05-08) ─────────────────────────────
  // User có quyền chọn Q-Day bất kỳ ngày nào, đổi bất kỳ lúc nào, reset
  // bất kỳ lúc nào. KHÔNG gate bằng checklist nữa. Match tagline "Đi cùng
  // Sol — Bỏ thuốc lá khi nào anh quyết".
  //
  // Validation duy nhất: ngày trong tương lai (không cho set Q-Day quá khứ
  // ngẫu nhiên). Cho phép từ hôm nay → 6 tháng sau.
  const isSettingNewQDay =
    parsed.data.quitDate !== undefined &&
    parsed.data.quitDate !== null &&
    (!existing.quitDate || new Date(parsed.data.quitDate).getTime() !== existing.quitDate.getTime());

  if (isSettingNewQDay && parsed.data.quitDate) {
    const newQDay = new Date(parsed.data.quitDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sixMonthsFromNow = new Date(today.getTime() + 180 * 24 * 60 * 60 * 1000);

    if (newQDay < today) {
      return res.status(400).json({
        error: 'q_day_in_past',
        message: 'Q-Day phải là ngày từ hôm nay trở đi.',
      });
    }
    if (newQDay > sixMonthsFromNow) {
      return res.status(400).json({
        error: 'q_day_too_far',
        message: 'Q-Day xa nhất 6 tháng từ hôm nay.',
      });
    }
  }

  const mergedSettings =
    parsed.data.settings !== undefined
      ? { ...(existing.settings as object), ...parsed.data.settings }
      : undefined;

  const updated = await prisma.user.update({
    where: { id: req.userId! },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.pronouns !== undefined ? { pronouns: parsed.data.pronouns } : {}),
      ...(parsed.data.assistantName !== undefined ? { assistantName: parsed.data.assistantName } : {}),
      ...(parsed.data.ftndScore !== undefined ? { ftndScore: parsed.data.ftndScore } : {}),
      ...(mergedSettings !== undefined ? { settings: mergedSettings } : {}),
      ...(parsed.data.riskyHours !== undefined ? { riskyHours: parsed.data.riskyHours } : {}),
      ...(parsed.data.topTriggers !== undefined ? { topTriggers: parsed.data.topTriggers } : {}),
      ...(parsed.data.age !== undefined ? { age: parsed.data.age } : {}),
      ...(parsed.data.yearsSmoked !== undefined ? { yearsSmoked: parsed.data.yearsSmoked } : {}),
      ...(parsed.data.quitReasons !== undefined ? { quitReasons: parsed.data.quitReasons } : {}),
      ...(parsed.data.quitDate !== undefined
        ? { quitDate: parsed.data.quitDate ? new Date(parsed.data.quitDate) : null }
        : {}),
    },
  });
  return res.json({ ok: true, user: { id: updated.id, name: updated.name } });
});
