// backend/src/tiers/featureGates.ts
//
// Single source of truth cho ma trận tính năng theo gói. Mọi nơi check tier
// (middleware, routes, scheduler, prompts) đều import từ đây.
//
// Đồng bộ với phiên bản frontend ở:
//   dashboard/src/lib/featureGates.ts
//   frontend/src/lib/featureGates.ts
// (3 bản — backend là nguồn gốc, FE chỉ dùng cho UX hiển thị, không tin
// được; check thật phải ở backend.)

import type { UserTier } from '@prisma/client';

/* ─────────────────── PRICING ─────────────────────────────────────── */

export const TIER_PRICE_VND: Record<UserTier, number> = {
  FREE: 0,
  KHOI_DONG: 99_000,
  DONG_HANH: 199_000,
  ALUMNI: 0,
};

export const TIER_DURATION_DAYS: Record<UserTier, number> = {
  FREE: 0,
  KHOI_DONG: 10,
  DONG_HANH: 30, // + 30 ngày bảo trì
  ALUMNI: 0,
};

/** Số ngày bảo trì sau khi tierExpiresAt đã qua (chỉ DONG_HANH). */
export const MAINTENANCE_DAYS = 30;

/** FREE: số tin nhắn AI tối đa trong 1 ngày (sau tuần đầu). */
export const FREE_DAILY_MESSAGE_QUOTA = 5;

/**
 * FREE: quota mở rộng cho tuần đầu (7 ngày sau Q-Day).
 * Lý do UX: tuần 1 là lúc cám dỗ + lo lắng cao nhất, user mới cần
 * trải nghiệm AI nhiều hơn 5 tin để hiểu giá trị + xây trust → quyết định mua.
 * Sau ngày 7, hạ về FREE_DAILY_MESSAGE_QUOTA = 5.
 */
export const FREE_FIRST_WEEK_QUOTA = 15;
export const FREE_FIRST_WEEK_DAYS = 7;

/** ALUMNI / DONG_HANH trong cửa sổ bảo trì: số tin/ngày. */
export const MAINTENANCE_DAILY_MESSAGE_QUOTA = 10;

/** Hoàn tiền chỉ áp dụng từ ngày này trở đi. */
export const REFUND_MIN_DAY = 15;

/** Hoàn tiền theo công thức: (FULL_DAYS - daysUsed) / 20 × 100_000. */
export const REFUND_FULL_DAYS = 30;
export const REFUND_BASE_VND = 100_000;

/* ───────────────── FEATURE KEYS ──────────────────────────────────── */

export type FeatureKey =
  // Chat
  | 'chat.unlimited'
  | 'chat.memory.long' // 30+ ngày memory thay vì 7
  // Workbook
  | 'workbook.read.sample'
  | 'workbook.read.week1_2'
  | 'workbook.read.full'
  | 'workbook.write'
  | 'workbook.maintenance' // 30 ngày sau cai
  // Exercises
  | 'exercises.basic_3'
  | 'exercises.week1_2_12'
  | 'exercises.full_24_plus_8'
  // Voice library
  | 'voice.welcome_only'
  | 'voice.day_1_3_7'
  | 'voice.day_1_3_7_14_21_30_letter'
  // Reports
  | 'report.day10'
  | 'report.day30_album'
  // Notifications
  | 'notify.daily_basic'
  | 'notify.smart_3x'
  | 'notify.maintenance_30d'
  // Community
  | 'community.read'
  | 'community.write'
  | 'community.cohort_badge'
  // Crisis
  | 'crisis.alert_to_khang'
  | 'crisis.priority_callback'
  // Refund
  | 'refund.eligible'
  // Data
  | 'data.checkin_history_7d'
  | 'data.checkin_history_full'
  | 'data.export_pdf';

/* ─────────────── MATRIX (đơn giản & rõ) ──────────────────────────── */

const MATRIX: Record<UserTier, Set<FeatureKey>> = {
  FREE: new Set<FeatureKey>([
    'workbook.read.sample',
    'exercises.basic_3',
    'voice.welcome_only',
    'notify.daily_basic',
    'community.read',
    'data.checkin_history_7d',
  ]),
  KHOI_DONG: new Set<FeatureKey>([
    'chat.unlimited',
    'workbook.read.week1_2',
    'workbook.write',
    'exercises.week1_2_12',
    'voice.day_1_3_7',
    'report.day10',
    'notify.smart_3x',
    'community.read',
    'community.write',
    'crisis.alert_to_khang',
    'data.checkin_history_full',
  ]),
  DONG_HANH: new Set<FeatureKey>([
    'chat.unlimited',
    'chat.memory.long',
    'workbook.read.full',
    'workbook.write',
    'workbook.maintenance',
    'exercises.full_24_plus_8',
    'voice.day_1_3_7_14_21_30_letter',
    'report.day10',
    'report.day30_album',
    'notify.smart_3x',
    'notify.maintenance_30d',
    'community.read',
    'community.write',
    'community.cohort_badge',
    'crisis.alert_to_khang',
    'crisis.priority_callback',
    'refund.eligible',
    'data.checkin_history_full',
    'data.export_pdf',
  ]),
  ALUMNI: new Set<FeatureKey>([
    'workbook.read.full',
    'community.read',
    'community.write',
    'community.cohort_badge',
    'data.checkin_history_full',
    'data.export_pdf',
  ]),
};

export function hasFeature(tier: UserTier, key: FeatureKey): boolean {
  return MATRIX[tier].has(key);
}

export function featuresFor(tier: UserTier): FeatureKey[] {
  return Array.from(MATRIX[tier]);
}

/* ─────────── TIER STATE COMPUTATION ─────────────────────────────── */

export interface TierState {
  tier: UserTier;
  // Ngày thứ N kể từ khi mua (1-based). Null nếu chưa mua.
  daysIntoTier: number | null;
  // Ngày còn lại tới khi hết gói chính.
  daysRemaining: number | null;
  // Đang trong cửa sổ bảo trì? (chỉ DONG_HANH sau ngày 30)
  inMaintenance: boolean;
  // Maintenance còn bao ngày.
  maintenanceDaysRemaining: number | null;
  // Có thể yêu cầu hoàn tiền không?
  canRequestRefund: boolean;
  // Tính sẵn số tiền hoàn được nếu request bây giờ.
  refundAmountVnd: number;
}

interface TierUserSnapshot {
  tier: UserTier;
  tierStartedAt: Date | null;
  tierExpiresAt: Date | null;
  maintenanceUntil: Date | null;
}

export function computeTierState(u: TierUserSnapshot, now = new Date()): TierState {
  const startedMs = u.tierStartedAt?.getTime() ?? null;
  const expiresMs = u.tierExpiresAt?.getTime() ?? null;
  const maintMs = u.maintenanceUntil?.getTime() ?? null;
  const nowMs = now.getTime();

  const daysIntoTier = startedMs !== null
    ? Math.floor((nowMs - startedMs) / 86_400_000) + 1
    : null;

  const daysRemaining = expiresMs !== null
    ? Math.max(0, Math.ceil((expiresMs - nowMs) / 86_400_000))
    : null;

  const inMaintenance =
    u.tier === 'DONG_HANH' &&
    expiresMs !== null && nowMs > expiresMs &&
    maintMs !== null && nowMs <= maintMs;

  const maintenanceDaysRemaining = inMaintenance && maintMs !== null
    ? Math.max(0, Math.ceil((maintMs - nowMs) / 86_400_000))
    : null;

  // Refund chỉ cho DONG_HANH, từ Ngày 15+, còn trong cửa sổ chính.
  const canRequestRefund =
    u.tier === 'DONG_HANH' &&
    !inMaintenance &&
    daysIntoTier !== null && daysIntoTier >= REFUND_MIN_DAY &&
    daysRemaining !== null && daysRemaining > 0;

  let refundAmountVnd = 0;
  if (u.tier === 'DONG_HANH' && daysIntoTier !== null && daysIntoTier >= REFUND_MIN_DAY) {
    const remaining = REFUND_FULL_DAYS - daysIntoTier;
    if (remaining > 0) {
      // (remaining / 20) × 100_000, làm tròn xuống 1000đ
      const raw = (remaining / 20) * REFUND_BASE_VND;
      refundAmountVnd = Math.floor(raw / 1000) * 1000;
    }
  }

  return {
    tier: u.tier,
    daysIntoTier,
    daysRemaining,
    inMaintenance,
    maintenanceDaysRemaining,
    canRequestRefund,
    refundAmountVnd,
  };
}

/** Tier hiệu lực thực tế dựa trên thời gian (trong db tier có thể chưa
 *  được scheduler "promote" lên ALUMNI). Dùng cho effectiveTier khi check
 *  feature gates real-time. */
export function effectiveTier(u: TierUserSnapshot, now = new Date()): UserTier {
  // Đã qua maintenanceUntil → ALUMNI
  if (u.tier === 'DONG_HANH' && u.maintenanceUntil && now > u.maintenanceUntil) {
    return 'ALUMNI';
  }
  // KHOI_DONG hết hạn mà chưa upgrade → quay về FREE
  if (u.tier === 'KHOI_DONG' && u.tierExpiresAt && now > u.tierExpiresAt) {
    return 'FREE';
  }
  return u.tier;
}

/* ──────── Daily message quota cho FREE / MAINTENANCE ────────── */

export function quotaFor(tier: UserTier, inMaintenance: boolean): number | null {
  if (tier === 'FREE') return FREE_DAILY_MESSAGE_QUOTA;
  if (tier === 'ALUMNI') return MAINTENANCE_DAILY_MESSAGE_QUOTA;
  if (tier === 'DONG_HANH' && inMaintenance) return MAINTENANCE_DAILY_MESSAGE_QUOTA;
  return null; // unlimited
}

/**
 * Quota dựa trên tier + Q-Day age. FREE user trong tuần đầu (7 ngày kể từ
 * quitDate) được boost lên FREE_FIRST_WEEK_QUOTA (15) để có cơ hội trải nghiệm
 * AI đủ nhiều — tăng conversion.
 *
 * Nếu user FREE chưa đặt Q-Day (quitDate=null), vẫn dùng quota chuẩn (5),
 * không boost — vì chưa cam kết.
 */
export function quotaForUser(
  tier: UserTier,
  inMaintenance: boolean,
  quitDate: Date | string | null | undefined,
): number | null {
  const base = quotaFor(tier, inMaintenance);
  if (base === null) return null; // unlimited tier — không cần boost
  if (tier !== 'FREE') return base; // chỉ boost FREE
  if (!quitDate) return base; // chưa đặt Q-Day → không boost
  const start = new Date(quitDate).getTime();
  if (isNaN(start)) return base;
  const ageDays = Math.floor((Date.now() - start) / 86400000);
  if (ageDays < 0) return base; // future Q-Day (lạ) → không boost
  if (ageDays < FREE_FIRST_WEEK_DAYS) return FREE_FIRST_WEEK_QUOTA;
  return base;
}
