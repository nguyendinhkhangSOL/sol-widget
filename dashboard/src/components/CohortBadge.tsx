// dashboard/src/components/CohortBadge.tsx
//
// Day 6 (2026-05-21): Hiển thị Cohort severity (LIGHT / MODERATE / HEAVY)
// từ FTND result. Đọc cohort từ:
//   1. user.settings.severityCohort (set bởi POST /journey/onboarding/ftnd)
//   2. fallback: derive từ user.ftndScore (0-3=LIGHT, 4-6=MODERATE, 7-10=HEAVY)
//   3. null nếu chưa có FTND result
//
// Tích hợp Layout.tsx sidebar — hiện cạnh Tier badge.

import type { Cohort } from '../lib/ftnd';

interface User {
  ftndScore?: number;
  ftndCohort?: string | null;  // V2 dedicated field (2026-05-22)
  settings?: any;
}

/**
 * Derive severity cohort từ user state. Priority:
 *   1. user.ftndCohort (V2 dedicated field, sau migration 22/5/2026)
 *   2. user.settings.severityCohort (legacy fallback)
 *   3. user.ftndScore (derive nếu chỉ có score)
 *   4. null nếu chưa có FTND data
 */
export function getSeverityCohort(user: User | null | undefined): Cohort | null {
  if (!user) return null;
  // 1. V2 field
  const fromField = user.ftndCohort;
  if (fromField === 'LIGHT' || fromField === 'MODERATE' || fromField === 'HEAVY') {
    return fromField as Cohort;
  }
  // 2. Legacy settings
  const fromSettings = user.settings?.severityCohort as Cohort | undefined;
  if (fromSettings === 'LIGHT' || fromSettings === 'MODERATE' || fromSettings === 'HEAVY') {
    return fromSettings;
  }
  // 3. Derive from score
  if (typeof user.ftndScore === 'number') {
    if (user.ftndScore <= 3) return 'LIGHT';
    if (user.ftndScore <= 6) return 'MODERATE';
    return 'HEAVY';
  }
  return null;
}

const COHORT_VISUAL: Record<Cohort, {
  emoji: string;
  label: string;
  audienceShort: string;
  border: string;
  bg: string;
  text: string;
  dot: string;
}> = {
  LIGHT: {
    emoji: '🟢',
    label: 'Nhẹ',
    audienceShort: 'Dưới 10 điếu/ngày',
    border: 'border-sol-green',
    bg: 'bg-sol-green-soft',
    text: 'text-sol-green-ink',
    dot: '#16A34A',
  },
  MODERATE: {
    emoji: '🟡',
    label: 'Trung bình',
    audienceShort: '10–20 điếu/ngày',
    border: 'border-sol-orange',
    bg: 'bg-sol-orange-soft',
    text: 'text-sol-orange-ink',
    dot: '#D97706',
  },
  HEAVY: {
    emoji: '🔴',
    label: 'Nặng',
    audienceShort: 'Trên 1 bao/ngày',
    border: 'border-sol-red',
    bg: 'bg-sol-red-soft',
    text: 'text-sol-red-ink',
    dot: '#DC2626',
  },
};

interface CohortBadgeProps {
  cohort: Cohort | null;
  size?: 'sm' | 'md';
  /** Hiển thị thêm score (vd "MODERATE · 5/10") */
  score?: number | null;
  /** Hiện 1 dòng phụ ngắn (audience hint) */
  withSubtitle?: boolean;
}

export function CohortBadge({ cohort, size = 'md', score, withSubtitle = false }: CohortBadgeProps) {
  if (!cohort) return null;
  const v = COHORT_VISUAL[cohort];

  if (size === 'sm') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${v.border} ${v.bg} ${v.text} text-[11px] font-semibold uppercase tracking-wide`}
        title={v.audienceShort}
      >
        <span aria-hidden="true">{v.emoji}</span>
        <span>{v.label}</span>
        {typeof score === 'number' && <span className="opacity-70">{score}/10</span>}
      </span>
    );
  }

  return (
    <div
      className={`rounded-lg px-3 py-2 border-l-4 ${v.border} ${v.bg}`}
      title={v.audienceShort}
    >
      <div className="flex items-center justify-between">
        <span className={`text-meta font-bold uppercase tracking-wide ${v.text}`}>
          {v.emoji} {v.label}
        </span>
        {typeof score === 'number' && (
          <span className={`text-meta font-semibold ${v.text} opacity-80`}>
            {score}/10
          </span>
        )}
      </div>
      {withSubtitle && (
        <div className="text-[11px] text-sol-ink-2 mt-0.5">{v.audienceShort}</div>
      )}
    </div>
  );
}
