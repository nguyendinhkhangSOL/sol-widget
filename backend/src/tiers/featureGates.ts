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

// ─────────────────── PRICING & SCHEDULE (Sol v3 — 12-05-2026) ─────────
// 4 chặng: NHẬN DIỆN (7d FREE) → KIỂM SOÁT (14d 99k) → LÀM CHỦ (30d 199k)
//          → NGƯỜI TỰ DO (forever FREE, Day 52+)
// Schedule: 7+14+30 = 51 ngày Sol-active + Day 52 lễ tốt nghiệp
// Total paid: 99k + 199k = 298.000đ = đúng 1 tháng tiền thuốc (10k/ngày × 30)

export const TIER_PRICE_VND: Record<UserTier, number> = {
  FREE: 0,
  KHOI_DONG: 99_000,    // Kiểm Soát 14 ngày
  DONG_HANH: 199_000,   // Làm Chủ 30 ngày (UPDATED Sol v3)
  ALUMNI: 0,            // Người Tự Do — forever miễn phí
};

export const TIER_DURATION_DAYS: Record<UserTier, number> = {
  FREE: 7,              // Nhận Diện 7 ngày (Day 1-7)
  KHOI_DONG: 14,        // Kiểm Soát 14 ngày (Day 8-21) — UPDATED từ 10
  DONG_HANH: 30,        // Làm Chủ 30 ngày (Day 22-51, Q-Day Day 22)
  ALUMNI: 0,            // Người Tự Do — forever (no expiration)
};

/**
 * DEPRECATED (Sol v3): Maintenance window concept không còn dùng.
 * Sol v3: Day 52+ → ALUMNI tự động miễn phí mãi, không có period bảo trì.
 * Constant giữ tạm để backward compat — set = 0.
 */
export const MAINTENANCE_DAYS = 0;

/**
 * FREE tier (Nhận Diện): số tin nhắn AI tối đa/ngày.
 * Sol v3 đã nâng từ 5 → 30 để khách thử kỹ trong 7 ngày miễn phí.
 */
export const FREE_DAILY_MESSAGE_QUOTA = 30;

/**
 * FREE: quota tuần đầu — giữ nguyên cho compatibility.
 * Sol v3: 7 ngày NHẬN DIỆN có quota 30 tin/ngày (đã merge với FREE_DAILY).
 */
export const FREE_FIRST_WEEK_QUOTA = 30;
export const FREE_FIRST_WEEK_DAYS = 7;

/** ALUMNI (Người Tự Do): số tin/ngày — chỉ support, không content mới. */
export const MAINTENANCE_DAILY_MESSAGE_QUOTA = 5;

// ─────────────────── REFUND POLICY (Sol v3) ───────────────────────────
// KIỂM SOÁT (99k): Day 21 conditional refund nếu đi đủ lộ trình ≥80% metric
//                  mà không thấy giảm số điếu → hoàn 100%.
// LÀM CHỦ (199k): Day 14 trở đi pro-rated refund:
//                  refund_vnd = (30 - daysUsed) / 30 × 199.000

/** Hoàn tiền chỉ áp dụng từ ngày này trở đi (cho DONG_HANH/Làm Chủ). */
export const REFUND_MIN_DAY = 14;

/** Pro-rated formula: (FULL_DAYS - daysUsed) / FULL_DAYS × REFUND_BASE_VND */
export const REFUND_FULL_DAYS = 30;
export const REFUND_BASE_VND = 199_000;  // UPDATED: 100k → 199k (Sol v3)

// ─────────────────── METRIC THRESHOLDS (Refund conditional) ───────────
// KIỂM SOÁT refund nếu đạt ≥80% các metric sau:
export const KHOI_DONG_METRIC_THRESHOLDS = {
  min_checkin_days: 12,      // ≥12/14 ngày check-in
  min_workbook_done: 10,     // ≥10/14 bài Sổ Hành Trình
  min_plan_b_triggers: 3,    // ≥3/5 trigger Plan B viết
  min_crisis_logs: 10,       // ≥10 lần dùng công cụ khi thèm
  min_reduction_pct: 30,     // ≥30% giảm số điếu/ngày
};

// LÀM CHỦ refund nếu đạt ≥80% các metric sau:
export const DONG_HANH_METRIC_THRESHOLDS = {
  must_qday_commit: true,    // Bắt buộc Q-Day Ceremony Day 22
  min_checkin_days: 24,      // ≥24/30 ngày check-in
  min_workbook_done: 20,     // ≥20/26 bài Sổ Hành Trình
  min_crisis_logs: 10,       // ≥10 lần Crisis Timer
  min_clean_streak: 21,      // ≥21 ngày sạch liên tiếp
};

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
