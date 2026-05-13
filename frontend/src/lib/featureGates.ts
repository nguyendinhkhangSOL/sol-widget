// frontend/src/lib/featureGates.ts
// Mirror của backend/src/tiers/featureGates.ts. Dùng cho UX hiển thị/gating.
// QUAN TRỌNG: chỉ là "best-effort" để UI không hiển thị nút disabled khi user
// chưa có quyền — server vẫn là nguồn tin cậy duy nhất.

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

// Brand colors Sol v4 (13-05-2026, Khang) — gradient theo hành trình:
// Nâu (bắt đầu, gốc rễ) → Vàng (nỗ lực) → Cam đậm (cai hẳn) → XANH (tự do, sạch)
export const TIER_COLOR: Record<UserTier, { bg: string; text: string; light: string }> = {
  FREE:      { bg: '#5C3A1E', text: '#ffffff', light: '#F5F0E8' },  // 🌱 Nâu — NHẬN DIỆN (gốc rễ, mở đầu)
  KHOI_DONG: { bg: '#B8860B', text: '#ffffff', light: '#FFF8E1' },  // 🟡 Vàng — KIỂM SOÁT (nỗ lực)
  DONG_HANH: { bg: '#B25C2C', text: '#ffffff', light: '#FFF4EA' },  // 🔴 Cam đậm — LÀM CHỦ (cai hẳn)
  ALUMNI:    { bg: '#2E7D32', text: '#ffffff', light: '#E8F5E9' },  // 🌟 Xanh — NGƯỜI TỰ DO (sạch, tự do)
};

export const TIER_PRICE_VND: Record<UserTier, number> = {
  FREE: 0,
  KHOI_DONG: 99_000,    // Kiểm Soát 14 ngày
  DONG_HANH: 199_000,   // Làm Chủ 30 ngày
  ALUMNI: 0,            // Người Tự Do — forever miễn phí
};

// Sol v3: Số ngày mỗi chặng (hiển thị progress, countdown Q-Day, etc)
export const TIER_DURATION_DAYS: Record<UserTier, number> = {
  FREE: 7,              // Nhận Diện
  KHOI_DONG: 14,        // Kiểm Soát
  DONG_HANH: 30,        // Làm Chủ (Q-Day = Day 22 = day 0 của tier này)
  ALUMNI: 0,            // forever
};

// Sol v3: Emoji cho mỗi chặng (consistent với landing pages)
// Sol v4 — emoji match màu mới: 🌱 (mầm) → 🟡 → 🔴 → 🌿 (lá xanh tự do)
export const TIER_EMOJI: Record<UserTier, string> = {
  FREE: '🌱',
  KHOI_DONG: '🟡',
  DONG_HANH: '🔴',
  ALUMNI: '🌿',    // lá xanh — sạch, tự do (đổi từ 🌟)
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
