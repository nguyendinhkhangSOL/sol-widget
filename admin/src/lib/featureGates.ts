// dashboard/src/lib/featureGates.ts
// Mirror của backend/src/tiers/featureGates.ts (UI-only — server là nguồn thật).

import type { UserTier } from '../types';

// Sol v3 (12-05-2026) — Display tier labels theo 4 chặng tiến hoá:
//   Nhận Diện   (FREE 7d)         → quan sát mình hút lúc nào, vì sao
//   Kiểm Soát   (KHOI_DONG 14d)   → giảm tần suất hút có ý thức
//   Làm Chủ     (DONG_HANH 30d)   → Q-Day Day 22, cai hẳn 30 ngày
//   Người Tự Do (ALUMNI forever)  → Day 52+, miễn phí mãi, Đại Sứ Sol optional
// Schedule: 7+14+30 = 51 ngày + Day 52 lễ tốt nghiệp
// Total paid: 99k + 199k = 298.000đ = đúng 1 tháng tiền thuốc
// DB code identifiers (FREE/KHOI_DONG/DONG_HANH/ALUMNI) GIỮ NGUYÊN — chỉ đổi display.
export const TIER_LABEL: Record<UserTier, string> = {
  FREE: 'Nhận Diện',
  KHOI_DONG: 'Kiểm Soát',
  DONG_HANH: 'Làm Chủ',
  ALUMNI: 'Người Tự Do',
};

// Brand colors Sol v3 — đồng bộ với landing pages
export const TIER_COLOR: Record<UserTier, { bg: string; text: string; light: string }> = {
  FREE:      { bg: '#2E7D32', text: '#ffffff', light: '#E8F5E9' },  // 🌱 Xanh — NHẬN DIỆN
  KHOI_DONG: { bg: '#B8860B', text: '#ffffff', light: '#FFF8E1' },  // 🟡 Vàng — KIỂM SOÁT
  DONG_HANH: { bg: '#B25C2C', text: '#ffffff', light: '#FFF4EA' },  // 🔴 Cam đậm — LÀM CHỦ (KHUYẾN NGHỊ)
  ALUMNI:    { bg: '#5C3A1E', text: '#ffffff', light: '#F5F0E8' },  // 🌟 Nâu — NGƯỜI TỰ DO
};

export const TIER_PRICE_VND: Record<UserTier, number> = {
  FREE: 0,
  KHOI_DONG: 99_000,
  DONG_HANH: 199_000,
  ALUMNI: 0,
};

export const TIER_DURATION_DAYS: Record<UserTier, number> = {
  FREE: 7,
  KHOI_DONG: 14,
  DONG_HANH: 30,
  ALUMNI: 0,
};

export const TIER_EMOJI: Record<UserTier, string> = {
  FREE: '🌱',
  KHOI_DONG: '🟡',
  DONG_HANH: '🔴',
  ALUMNI: '🌟',
};

export type FeatureKey =
  | 'chat.unlimited'
  | 'chat.memory.long'
  | 'workbook.read.sample'
  | 'workbook.read.week1_2'
  | 'workbook.read.full'
  | 'workbook.write'
  | 'workbook.maintenance'
  | 'exercises.basic_3'
  | 'exercises.week1_2_12'
  | 'exercises.full_24_plus_8'
  | 'voice.welcome_only'
  | 'voice.day_1_3_7'
  | 'voice.day_1_3_7_14_21_30_letter'
  | 'report.day10'
  | 'report.day30_album'
  | 'notify.daily_basic'
  | 'notify.smart_3x'
  | 'notify.maintenance_30d'
  | 'community.read'
  | 'community.write'
  | 'community.cohort_badge'
  | 'crisis.alert_to_khang'
  | 'crisis.priority_callback'
  | 'refund.eligible'
  | 'data.checkin_history_7d'
  | 'data.checkin_history_full'
  | 'data.export_pdf';

const MATRIX: Record<UserTier, Set<FeatureKey>> = {
  FREE: new Set([
    'workbook.read.sample',
    'exercises.basic_3',
    'voice.welcome_only',
    'notify.daily_basic',
    'community.read',
    'data.checkin_history_7d',
  ]),
  KHOI_DONG: new Set([
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
  DONG_HANH: new Set([
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
  ALUMNI: new Set([
    'workbook.read.full',
    'community.read',
    'community.write',
    'community.cohort_badge',
    'data.checkin_history_full',
    'data.export_pdf',
  ]),
};

export function hasFeature(tier: UserTier | undefined, key: FeatureKey): boolean {
  if (!tier) return false;
  return MATRIX[tier].has(key);
}

export function formatVnd(n: number): string {
  return n.toLocaleString('vi-VN') + 'đ';
}
