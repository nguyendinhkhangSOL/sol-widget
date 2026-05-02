// backend/src/users/routes.ts
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authMiddleware, type AuthedRequest } from '../auth/middleware';
import { computeDayNumber } from '../utils/dayNumber';
import { computeTierState, effectiveTier, featuresFor } from '../tiers/featureGates';
import { assertChecklistComplete } from '../tiers/qDayChecklist';

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

  // Gate Q-Day: chỉ cho set quitDate mới khi đã tick xong checklist.
  // Cho phép set quitDate = null (reset) hoặc giữ nguyên giá trị cũ mà không gate.
  const isSettingNewQDay =
    parsed.data.quitDate !== undefined &&
    parsed.data.quitDate !== null &&
    (!existing.quitDate || new Date(parsed.data.quitDate).getTime() !== existing.quitDate.getTime());

  if (isSettingNewQDay) {
    try {
      await assertChecklistComplete(req.userId!, 'FREE');
    } catch (err: any) {
      if (err?.statusCode === 412 && err?.payload) {
        return res.status(412).json(err.payload);
      }
      throw err;
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
