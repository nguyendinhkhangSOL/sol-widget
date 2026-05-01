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
  computeTierState,
  effectiveTier,
  featuresFor,
  quotaForUser,
} from './featureGates';
import {
  userChecklistState,
  checkItem,
  uncheckItem,
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

tiersRouter.get('/catalog', (_req, res) => {
  res.json({
    tiers: [
      {
        id: 'FREE',
        label: 'Miễn phí',
        priceVnd: TIER_PRICE_VND.FREE,
        durationDays: null,
        bullets: [
          'Quan sát SOL — đặt Q-Day khi sẵn sàng',
          `Tuần đầu ${FREE_FIRST_WEEK_QUOTA} tin AI/ngày, sau đó ${FREE_DAILY_MESSAGE_QUOTA}/ngày`,
          'Sổ tay mẫu Tuần 1 (chỉ xem)',
          '3 bài tập vượt cơn thèm cơ bản',
          '1 voice message Khang chào mừng',
          'Đọc tường cộng đồng',
        ],
      },
      {
        id: 'KHOI_DONG',
        label: 'Khởi động — 10 ngày đầu',
        priceVnd: TIER_PRICE_VND.KHOI_DONG,
        durationDays: TIER_DURATION_DAYS.KHOI_DONG,
        refundable: false,
        bullets: [
          'Chat không giới hạn với Sol',
          'Sổ tay đầy đủ Tuần 1 + Tuần 2',
          '12 bài tập theo từng ngày',
          '3 voice Khang (Ngày 1, 3, 7)',
          'Báo cáo Ngày 10 cá nhân hoá (PDF)',
          '3 nhắc nhở/ngày + nhắc theo trigger',
          'Khang được alert khi bạn khủng hoảng',
        ],
        callout: '10 ngày khó nhất. Đừng để chỉ một mình.',
      },
      {
        id: 'DONG_HANH',
        label: 'Đồng hành & Bảo trì — 60 ngày',
        priceVnd: TIER_PRICE_VND.DONG_HANH,
        durationDays: TIER_DURATION_DAYS.DONG_HANH + MAINTENANCE_DAYS,
        refundable: true,
        refundFromDay: REFUND_MIN_DAY,
        bullets: [
          'Toàn bộ tính năng Khởi động',
          'Sổ tay 4 tuần đầy đủ + ghi chú duy trì',
          '24 bài tập + 8 bài duy trì',
          '6 voice Khang + thư cuối Ngày 30',
          'Báo cáo Ngày 30 + Album hành trình (PDF cao cấp)',
          `30 ngày bảo trì sau cai (${MAINTENANCE_DAILY_MESSAGE_QUOTA} tin/ngày)`,
          'Khang ưu tiên + voice gọi lại khi khủng hoảng',
          `Hoàn tiền theo tỷ lệ ngày còn lại từ Ngày ${REFUND_MIN_DAY}`,
          'Huy hiệu Alumni vĩnh viễn + cộng đồng cohort',
        ],
        callout: 'Khang giữ lời — hoàn tiền nếu bạn cần dừng.',
      },
    ],
    note: {
      freeDailyQuota: FREE_DAILY_MESSAGE_QUOTA,
      maintenanceDailyQuota: MAINTENANCE_DAILY_MESSAGE_QUOTA,
      maintenanceDays: MAINTENANCE_DAYS,
      refundMinDay: REFUND_MIN_DAY,
    },
  });
});
