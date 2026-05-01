// dashboard/src/lib/featureGates.ts
// Mirror của backend/src/tiers/featureGates.ts (UI-only — server là nguồn thật).

import type { UserTier } from '../types';

export const TIER_LABEL: Record<UserTier, string> = {
  FREE: 'Miễn phí',
  KHOI_DONG: 'Khởi động',
  DONG_HANH: 'Đồng hành',
  ALUMNI: 'Alumni',
};

export const TIER_COLOR: Record<UserTier, { bg: string; text: string; light: string }> = {
  FREE:      { bg: '#94a3b8', text: '#ffffff', light: '#f1f5f9' },
  KHOI_DONG: { bg: '#f97316', text: '#ffffff', light: '#fff7ed' },
  DONG_HANH: { bg: '#16a34a', text: '#ffffff', light: '#f0fdf4' },
  ALUMNI:    { bg: '#7c3aed', text: '#ffffff', light: '#f5f3ff' },
};

export const TIER_PRICE_VND: Record<UserTier, number> = {
  FREE: 0,
  KHOI_DONG: 99_000,
  DONG_HANH: 199_000,
  ALUMNI: 0,
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
