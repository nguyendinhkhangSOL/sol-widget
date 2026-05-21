// backend/src/tiers/routes.ts
// Các endpoint liên quan tier:
//   GET  /tiers/me      → trạng thái tier hiện tại của user (computed)
//   GET  /tiers/catalog → danh sách gói + giá + tính năng
//
// Endpoint upgrade thật ra nằm ở /payments/checkout (vì gắn với thanh toán).

import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, type AuthedRequest } from '../auth/middleware';
import { prisma } from '../db';
import {
  TIER_PRICE_VND,
  TIER_DURATION_DAYS,
  FREE_DAILY_MESSAGE_QUOTA,
  FREE_FIRST_WEEK_QUOTA,
  FREE_FIRST_WEEK_DAYS,
  MAINTENANCE_DAILY_MESSAGE_QUOTA,
  MAINTENANCE_DAYS,
  REFUND_MIN_DAY,
  COHORT_DURATIONS,
  cohortFromFTND,
  durationForTier,
  qDayForCohort,
  computeTierState,
  effectiveTier,
  featuresFor,
  quotaForUser,
} from './featureGates';
import {
  userChecklistState,
  checkItem,
  uncheckItem,
  confirmChecklistAndEnroll,
} from './qDayChecklist';

export const tiersRouter = Router();
tiersRouter.use(authMiddleware);

tiersRouter.get('/me', async (req: AuthedRequest, res) => {
  const u = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: {
      tier: true,
      tierStartedAt: true,
      tierExpiresAt: true,
      maintenanceUntil: true,
      dailyMessageCount: true,
      dailyMessageDate: true,
      quitDate: true,
    },
  });
  if (!u) return res.status(404).json({ error: 'user_not_found' });

  const state = computeTierState(u);
  const eff = effectiveTier(u);
  const limit = quotaForUser(eff, state.inMaintenance, u.quitDate);

  // Tính count hôm nay (reset cross-day)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dailyDate = u.dailyMessageDate ? new Date(u.dailyMessageDate) : null;
  const sameDay =
    dailyDate &&
    dailyDate.getFullYear() === today.getFullYear() &&
    dailyDate.getMonth() === today.getMonth() &&
    dailyDate.getDate() === today.getDate();
  const used = sameDay ? u.dailyMessageCount : 0;

  // Đang trong tuần đầu boost? FE dùng để hiện badge "tuần đầu — 15 tin"
  const ageDays = u.quitDate
    ? Math.floor((Date.now() - new Date(u.quitDate).getTime()) / 86400000)
    : null;
  const inFirstWeekBoost =
    eff === 'FREE' && ageDays !== null && ageDays >= 0 && ageDays < FREE_FIRST_WEEK_DAYS;

  res.json({
    ...state,
    effectiveTier: eff,
    features: featuresFor(eff),
    daily: {
      used,
      limit,
      unlimited: limit === null,
      // Cho FE hiện banner "Tuần đầu được 15 tin/ngày — còn N ngày"
      firstWeekBoost: inFirstWeekBoost
        ? {
            active: true,
            dayOfBoost: ageDays! + 1,
            daysRemaining: FREE_FIRST_WEEK_DAYS - ageDays!,
            boostedLimit: FREE_FIRST_WEEK_QUOTA,
            normalLimit: FREE_DAILY_MESSAGE_QUOTA,
          }
        : null,
    },
  });
});

/* ─────────────── Q-DAY CHECKLIST ─────────────────────── */
//
// "System requirements" — tick xong required items mới được đặt quitDate
// hoặc mua gói. Xem backend/src/tiers/qDayChecklist.ts.

tiersRouter.get('/q-day-checklist', async (req: AuthedRequest, res) => {
  const targetTier = (String(req.query.targetTier ?? 'FREE') as
    | 'FREE'
    | 'KHOI_DONG'
    | 'DONG_HANH');
  const state = await userChecklistState(req.userId!, targetTier);
  res.json(state);
});

const checkItemSchema = z.object({ itemId: z.string().min(1).max(80) });

tiersRouter.post('/q-day-checklist/check', async (req: AuthedRequest, res) => {
  const parsed = checkItemSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_body' });
  await checkItem(req.userId!, parsed.data.itemId);
  const state = await userChecklistState(req.userId!);
  res.json(state);
});

tiersRouter.post('/q-day-checklist/uncheck', async (req: AuthedRequest, res) => {
  const parsed = checkItemSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_body' });
  await uncheckItem(req.userId!, parsed.data.itemId);
  const state = await userChecklistState(req.userId!);
  res.json(state);
});

// ─── Sprint 4: Confirm checklist → trigger Phase 5 enrollment ─────────────
// POST /tiers/q-day-checklist/confirm-and-enroll
//   body: { qDayDate?: ISO, journeyType?: 'full-51' | 'lam-quen' | ... }
// Guard: assertChecklistComplete (3 required ticked) → enrollUser() → 52 ScheduledPush
const confirmEnrollSchema = z.object({
  qDayDate: z.string().datetime().optional(),
  journeyType: z.enum(['lam-quen', 'giam-dan', 'q-day', 'full-51', 'maintenance']).optional(),
});

tiersRouter.post('/q-day-checklist/confirm-and-enroll', async (req: AuthedRequest, res) => {
  const parsed = confirmEnrollSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_body', issues: parsed.error.issues });
  }
  try {
    const result = await confirmChecklistAndEnroll({
      userId: req.userId!,
      qDayDate: parsed.data.qDayDate ? new Date(parsed.data.qDayDate) : undefined,
      journeyType: parsed.data.journeyType,
    });
    return res.json(result);
  } catch (err: any) {
    if (err.statusCode === 412 && err.payload) {
      return res.status(412).json(err.payload);
    }
    return res.status(500).json({ error: 'confirm_enroll_failed', message: err.message });
  }
});

// ─────────────── TIER CATALOG (Sol v3 — 12-05-2026) ─────────────────────
// 4 chặng tiến hoá: NHẬN DIỆN → KIỂM SOÁT → LÀM CHỦ → NGƯỜI TỰ DO
// Tổng: 7 + 14 + 30 = 51 ngày Sol-active + Day 52 lễ tốt nghiệp
// Tổng phí: 99k (Kiểm Soát) + 199k (Làm Chủ) = 298.000đ = đúng 1 tháng tiền thuốc
tiersRouter.get('/catalog', (_req, res) => {
  res.json({
    tiers: [
      {
        id: 'FREE',
        label: 'Nhận Diện',
        emoji: '🌱',
        tagline: 'Quan sát mình hút lúc nào, vì sao',
        priceVnd: TIER_PRICE_VND.FREE,                    // 0
        durationDays: TIER_DURATION_DAYS.FREE,            // 7
        refundable: false,
        bullets: [
          'Quan sát: hút lúc nào, ở đâu, vì sao',
          `Chat AI Sol ${FREE_DAILY_MESSAGE_QUOTA} tin/ngày`,
          'Sổ tay mẫu Tuần 1 (chỉ đọc)',
          '3 bài tập vượt cơn thèm cơ bản',
          '1 Voice của Khang chia sẻ chào mừng',
          'Đọc tường cộng đồng',
          'Không cần bỏ thuốc — chỉ quan sát',
        ],
        callout: '7 ngày miễn phí — không cần thẻ.',
      },
      {
        id: 'KHOI_DONG',
        label: 'Kiểm Soát',
        emoji: '🟡',
        tagline: 'Giảm tần suất hút có ý thức',
        priceVnd: TIER_PRICE_VND.KHOI_DONG,               // 99.000
        durationDays: TIER_DURATION_DAYS.KHOI_DONG,       // 14
        refundable: true,
        refundType: 'conditional',                        // Day 21 nếu ≥80% metric mà không giảm
        bullets: [
          'Chat Sol không giới hạn',
          'Sổ Hành Trình đầy đủ Tuần 1 + Tuần 2 (14 bài)',
          '12 bài tập theo từng ngày',
          '3 Voice của Khang (Ngày 1, 3, 7)',
          'Báo cáo Ngày 7 cá nhân hoá (PDF)',
          'Nhắc nhở thông minh 3 lần/ngày',
          'Plan B trigger (≥3 trigger)',
          'Khang được alert khi anh khủng hoảng',
        ],
        callout: '14 ngày — giảm 30% số điếu hoặc hoàn 99k.',
      },
      {
        id: 'DONG_HANH',
        label: 'Làm Chủ',
        emoji: '🔴',
        tagline: 'Cai hẳn 30 ngày — Q-Day Day 22',
        priceVnd: TIER_PRICE_VND.DONG_HANH,               // 199.000
        durationDays: TIER_DURATION_DAYS.DONG_HANH,       // 30
        refundable: true,
        refundType: 'prorated',                           // (30-daysUsed)/30 × 199k
        refundFromDay: REFUND_MIN_DAY,
        qDayDay: 22,                                      // Day 22 = Q-Day Ceremony
        recommended: true,
        bullets: [
          'Toàn bộ Kiểm Soát + memory dài hạn 30+ ngày',
          'Sổ Hành Trình 4 tuần đầy đủ (26 bài)',
          '24 bài tập + 8 bài duy trì',
          '6 Voice của Khang + thư cuối Ngày 30',
          'Báo cáo Ngày 21 + Album hành trình Ngày 51 (PDF cao cấp)',
          'Q-Day Ceremony Day 22 — cam kết cai',
          'Khang ưu tiên + Voice gọi lại khi khủng hoảng',
          'Huy hiệu cohort vĩnh viễn',
          `Hoàn tiền tỷ lệ ngày còn lại từ Ngày ${REFUND_MIN_DAY}`,
        ],
        callout: 'KHUYẾN NGHỊ — Khang đi cùng đến Day 51.',
      },
      {
        id: 'ALUMNI',
        label: 'Người Tự Do',
        emoji: '🌟',
        tagline: 'Day 52+ · Miễn phí mãi mãi',
        priceVnd: TIER_PRICE_VND.ALUMNI,                  // 0
        durationDays: null,                               // forever
        refundable: false,
        forever: true,
        bullets: [
          'Truy cập Sổ Hành Trình đầy đủ',
          'Đọc & viết cộng đồng cohort',
          'Huy hiệu Người Tự Do vĩnh viễn',
          'Lễ tốt nghiệp Day 52 — chứng nhận từ Khang',
          'Export PDF lịch sử check-in',
          `${MAINTENANCE_DAILY_MESSAGE_QUOTA} tin Sol/ngày (support)`,
          'Đại Sứ Sol (tuỳ chọn) — giúp người mới',
        ],
        callout: 'Tự do thật sự. Miễn phí. Mãi mãi.',
      },
    ],
    schedule: {
      totalDaysSolActive: 51,                             // 7+14+30
      qDayDay: 22,                                        // Day 22 = bắt đầu Làm Chủ
      graduationDay: 52,                                  // Day 52 lễ tốt nghiệp
      totalPaidVnd: TIER_PRICE_VND.KHOI_DONG + TIER_PRICE_VND.DONG_HANH,  // 298.000
    },
    note: {
      freeDailyQuota: FREE_DAILY_MESSAGE_QUOTA,
      alumniDailyQuota: MAINTENANCE_DAILY_MESSAGE_QUOTA,
      refundMinDay: REFUND_MIN_DAY,
      // Sol v3: maintenance window đã DEPRECATE (Day 52+ = ALUMNI forever)
      maintenanceDays: MAINTENANCE_DAYS,
    },
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Sol v4 (13-05-2026) — 3 lộ trình theo Mức Lệ Thuộc (FTND cohort)
// ═══════════════════════════════════════════════════════════════════════
// GET /tiers/cohorts — trả về 3 lộ trình Light/Moderate/Heavy
// FE dùng để hiển thị anh em chọn lộ trình phù hợp Mức Lệ Thuộc của mình.
tiersRouter.get('/cohorts', (_req, res) => {
  res.json({
    cohorts: [
      {
        key: 'LIGHT',
        label: 'Nhẹ',
        emoji: '🟢',
        ftndRange: '0-3',
        ftndDescription: 'Hút < 10 điếu/ngày, dưới 5 năm',
        ...COHORT_DURATIONS.LIGHT,
        rationale: 'Mức Lệ Thuộc thấp → 21 ngày Làm Chủ là đủ. Cơ sở: Hughes 2004 — light smoker có thể quit 3-4 tuần.',
        recommendedFor: 'Anh em mới hút hoặc hút ít, đã có ý định bỏ.',
      },
      {
        key: 'MODERATE',
        label: 'Vừa',
        emoji: '🟡',
        ftndRange: '4-6',
        ftndDescription: 'Hút 10-20 điếu/ngày, 5-15 năm',
        ...COHORT_DURATIONS.MODERATE,
        rationale: 'Chuẩn nhất cho phần đông anh em — Sol v3 đã có nhiều case thành công.',
        recommendedFor: 'Đa số anh em hút lâu nhưng chưa quá nặng.',
      },
      {
        key: 'HEAVY',
        label: 'Nặng',
        emoji: '🔴',
        ftndRange: '7-10',
        ftndDescription: 'Hút > 20 điếu/ngày, > 15 năm',
        ...COHORT_DURATIONS.HEAVY,
        rationale: 'Lệ thuộc sâu → cần thêm 1 tuần Kiểm Soát + tuần đệm trước Quyết Định. Ngày Quyết Định linh hoạt 22-28 — anh em tự chọn.',
        recommendedFor: 'Anh em hút >20 năm, >1 bao/ngày, đã thử cai trước.',
      },
    ],
    // Mỗi cohort có pricing khác nhau (Sol v4 — Khang chốt)
    pricing: {
      LIGHT: { trial: 49_000, weekly: 25_000, full: 149_000, payAfter: 99_000 },     // Rẻ hơn vì lộ trình ngắn
      MODERATE: { trial: 49_000, weekly: 30_000, full: 249_000, payAfter: 199_000 }, // Default Sol v4
      HEAVY: { trial: 49_000, weekly: 35_000, full: 349_000, payAfter: 249_000 },    // Cao hơn vì lộ trình dài + risk
    },
  });
});

// POST /tiers/cohort — user khai FTND score → Sol auto-assign cohort
const cohortAssignSchema = z.object({
  ftndScore: z.number().int().min(0).max(10),
  preferredQDay: z.number().int().min(15).max(35).optional(),
});

tiersRouter.post('/cohort', async (req: AuthedRequest, res) => {
  const parsed = cohortAssignSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_body', details: parsed.error.format() });
  }
  const { ftndScore, preferredQDay } = parsed.data;
  const cohort = cohortFromFTND(ftndScore);
  const qDay = qDayForCohort(cohort, preferredQDay);

  // Lưu vào UserMessagingProfile (Sol v4 đã có model)
  await prisma.userMessagingProfile.upsert({
    where: { userId: req.userId! },
    update: { ftndScore, cohortKey: cohort },
    create: { userId: req.userId!, ftndScore, cohortKey: cohort },
  });

  res.json({
    cohort,
    cohortConfig: COHORT_DURATIONS[cohort],
    qDayDay: qDay,
    totalJourneyDays: COHORT_DURATIONS[cohort].totalDays,
    message: `Sol đã chọn lộ trình ${cohort === 'LIGHT' ? 'Nhẹ 35 ngày' : cohort === 'HEAVY' ? 'Nặng 65 ngày' : 'Vừa 52 ngày'} cho anh.`,
  });
});
