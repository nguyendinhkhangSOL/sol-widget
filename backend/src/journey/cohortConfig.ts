// backend/src/journey/cohortConfig.ts
// ─────────────────────────────────────────────────────────────────────────
// SOL — 3-Cohort FTND Journey Config (canonical 2026-05-18)
//
// Replaces rigid 88-day journey. Mỗi user sau FTND test (6 câu) được assign
// vào 1 trong 3 cohort theo nicotine severity:
//
//   🟢 LIGHT     (FTND 0-3)  — 35 ngày — Nhận Diện 7 + Kiểm Soát 7  + Làm Chủ 21, Q-Day Day 15
//   🟡 MODERATE  (FTND 4-6)  — 52 ngày — Nhận Diện 7 + Kiểm Soát 14 + Làm Chủ 30, Q-Day Day 22
//   🔴 HEAVY     (FTND 7-10) — 65 ngày — Nhận Diện 7 + Kiểm Soát 21 + Làm Chủ 30, Q-Day Day 22-28
//
// Day 66+ = "Tái Thiết" extension MIỄN PHÍ (bảo trì thành công, anti-relapse,
// không giới hạn thời gian, không tăng giá). Marketing language.
//
// Source: SOL_BUSINESS_MODEL_CANONICAL.md (anh Khang confirm 22/5/2026).
// ─────────────────────────────────────────────────────────────────────────

export type Cohort = 'LIGHT' | 'MODERATE' | 'HEAVY';

/** 4 chặng — tên Vietnamese theo canonical 2026-05-18 */
export type JourneyChapter =
  | 'NHAN_DIEN'   // Chặng 1: Nhận Diện (7 ngày, FREE)
  | 'KIEM_SOAT'   // Chặng 2: Kiểm Soát (7/14/21 ngày tùy cohort)
  | 'LAM_CHU'     // Chặng 3: Làm Chủ (21/30/30 ngày tùy cohort)
  | 'TAI_THIET';  // Chặng 4: Tái Thiết — extension miễn phí Day 66+

export interface ChapterRange {
  start: number;       // dayInJourney inclusive
  end: number;         // inclusive (cuối chặng)
  total: number;       // end - start + 1
}

export interface CohortDef {
  cohort: Cohort;
  emoji: string;
  label: string;         // "NHẸ" | "VỪA" | "NẶNG"
  labelEn: string;       // "Light" | "Moderate" | "Heavy"
  tagline: string;       // 1 câu mô tả
  ftndMin: number;
  ftndMax: number;
  totalDays: number;     // lộ trình chính (không tính Tái Thiết)
  qDay: number;          // dayInJourney của Q-Day
  /** Boundaries của 3 chặng chính */
  chapters: Record<Exclude<JourneyChapter, 'TAI_THIET'>, ChapterRange>;
  /** Tái thiết bắt đầu Day (totalDays + 1) → infinity */
  taiThietStart: number;
}

// ─── 3 cohort definitions ─────────────────────────────────────────────────

export const COHORT_DEFS: Record<Cohort, CohortDef> = {
  LIGHT: {
    cohort: 'LIGHT',
    emoji: '🟢',
    label: 'NHẸ',
    labelEn: 'Light',
    tagline: 'Phụ thuộc nhẹ — 35 ngày là đủ',
    ftndMin: 0,
    ftndMax: 3,
    totalDays: 35,
    qDay: 15,
    chapters: {
      NHAN_DIEN: { start: 1,  end: 7,  total: 7  },
      KIEM_SOAT: { start: 8,  end: 14, total: 7  },
      LAM_CHU:   { start: 15, end: 35, total: 21 },
    },
    taiThietStart: 36,
  },
  MODERATE: {
    cohort: 'MODERATE',
    emoji: '🟡',
    label: 'VỪA',
    labelEn: 'Moderate',
    tagline: 'Phụ thuộc vừa — 52 ngày dopamine reset',
    ftndMin: 4,
    ftndMax: 6,
    totalDays: 52,
    qDay: 22,
    chapters: {
      NHAN_DIEN: { start: 1,  end: 7,  total: 7  },
      KIEM_SOAT: { start: 8,  end: 21, total: 14 },
      LAM_CHU:   { start: 22, end: 52, total: 30 },
    },
    taiThietStart: 53,
  },
  HEAVY: {
    cohort: 'HEAVY',
    emoji: '🔴',
    label: 'NẶNG',
    labelEn: 'Heavy',
    tagline: 'Phụ thuộc nặng — 65 ngày cho não phục hồi',
    ftndMin: 7,
    ftndMax: 10,
    totalDays: 65,
    qDay: 28, // linh hoạt 22-28, mặc định 28
    chapters: {
      NHAN_DIEN: { start: 1,  end: 7,  total: 7  },
      KIEM_SOAT: { start: 8,  end: 28, total: 21 },
      LAM_CHU:   { start: 29, end: 65, total: 37 },
    },
    taiThietStart: 66,
  },
};

// ─── Chapter labels (Vietnamese) ──────────────────────────────────────────

export const CHAPTER_LABELS: Record<JourneyChapter, string> = {
  NHAN_DIEN: 'Nhận Diện',
  KIEM_SOAT: 'Kiểm Soát',
  LAM_CHU:   'Làm Chủ',
  TAI_THIET: 'Tái Thiết',
};

export const CHAPTER_TAGLINES: Record<JourneyChapter, string> = {
  NHAN_DIEN: 'Quan sát — chưa thay đổi gì',
  KIEM_SOAT: 'Giảm dần — xây thói quen mới',
  LAM_CHU:   'Bỏ hẳn — đồng hồ tự do',
  TAI_THIET: 'Bảo trì thành công — chống tái phát',
};

export const CHAPTER_EMOJI: Record<JourneyChapter, string> = {
  NHAN_DIEN: '🌱',
  KIEM_SOAT: '🔥',
  LAM_CHU:   '🚭',
  TAI_THIET: '🌟',
};

export const CHAPTER_COLORS: Record<JourneyChapter, string> = {
  NHAN_DIEN: '#B25C2C',     // sol-clay
  KIEM_SOAT: '#B8860B',     // sol-gold
  LAM_CHU:   '#3A7CA5',     // sol-blue (tự do)
  TAI_THIET: '#5C3A1E',     // sol-earth (vững chãi)
};

// ─── Cohort assignment from FTND score ────────────────────────────────────

/**
 * Auto-assign cohort theo FTND score (0-10).
 * Fagerström Test for Nicotine Dependence — chuẩn quốc tế từ 1991.
 */
export function assignCohortFromFTND(ftndScore: number): Cohort {
  if (ftndScore <= 3) return 'LIGHT';
  if (ftndScore <= 6) return 'MODERATE';
  return 'HEAVY';
}

// ─── Helper: derive chapter từ dayInJourney + cohort ──────────────────────

/**
 * Trả về chặng hiện tại của user. Day 1-7 = NHAN_DIEN cho mọi cohort.
 * Day > totalDays = TAI_THIET (extension miễn phí, không giới hạn).
 */
export function deriveChapter(dayInJourney: number, cohort: Cohort): JourneyChapter {
  if (dayInJourney <= 0) return 'NHAN_DIEN'; // pre-onboarding fallback
  const def = COHORT_DEFS[cohort];
  if (dayInJourney <= def.chapters.NHAN_DIEN.end) return 'NHAN_DIEN';
  if (dayInJourney <= def.chapters.KIEM_SOAT.end) return 'KIEM_SOAT';
  if (dayInJourney <= def.chapters.LAM_CHU.end)   return 'LAM_CHU';
  return 'TAI_THIET';
}

export interface ChapterDayInfo {
  chapter: JourneyChapter;
  chapterLabel: string;
  chapterTagline: string;
  chapterEmoji: string;
  chapterColor: string;
  dayInChapter: number;    // 1-based within chapter
  totalInChapter: number;  // total days in chapter (Infinity nếu TAI_THIET)
  progressInChapter: number; // 0..1 (luôn = 0 cho TAI_THIET vì vô hạn)
}

export function getChapterDayInfo(dayInJourney: number, cohort: Cohort): ChapterDayInfo {
  const chapter = deriveChapter(dayInJourney, cohort);
  const def = COHORT_DEFS[cohort];

  let dayInChapter: number;
  let totalInChapter: number;
  let progressInChapter: number;

  if (chapter === 'TAI_THIET') {
    dayInChapter = Math.max(1, dayInJourney - def.totalDays);
    totalInChapter = Infinity;
    progressInChapter = 0; // vô hạn → không có progress chính xác
  } else {
    const r = def.chapters[chapter];
    dayInChapter = Math.max(1, dayInJourney - r.start + 1);
    totalInChapter = r.total;
    progressInChapter = Math.min(1, Math.max(0, dayInChapter / r.total));
  }

  return {
    chapter,
    chapterLabel: CHAPTER_LABELS[chapter],
    chapterTagline: CHAPTER_TAGLINES[chapter],
    chapterEmoji: CHAPTER_EMOJI[chapter],
    chapterColor: CHAPTER_COLORS[chapter],
    dayInChapter,
    totalInChapter,
    progressInChapter,
  };
}

// ─── Q-Day helpers per cohort ─────────────────────────────────────────────

export interface QDayStateV2 {
  isPreQDay: boolean;
  isQDay: boolean;
  isPostQDay: boolean;
  needsConfirmation: boolean;
  daysUntilQDay: number;
  qDayConfirmedAt: Date | null;
  clockEnabled: boolean;
  qDay: number;            // ngày Q-Day cụ thể theo cohort
}

export function deriveQDayStateV2(
  dayInJourney: number,
  qDayConfirmedAt: Date | null | undefined,
  cohort: Cohort,
): QDayStateV2 {
  const qDay = COHORT_DEFS[cohort].qDay;
  const confirmedAt = qDayConfirmedAt ? new Date(qDayConfirmedAt) : null;
  const isPreQDay = dayInJourney >= qDay - 2 && dayInJourney < qDay;
  const isQDay = dayInJourney === qDay;
  const isPostQDay = dayInJourney > qDay;
  const needsConfirmation = dayInJourney >= qDay && confirmedAt === null;
  const daysUntilQDay = qDay - dayInJourney;
  const clockEnabled = dayInJourney >= qDay + 1 && confirmedAt !== null;

  return {
    isPreQDay,
    isQDay,
    isPostQDay,
    needsConfirmation,
    daysUntilQDay,
    qDayConfirmedAt: confirmedAt,
    clockEnabled,
    qDay,
  };
}

// ─── Memory Book trigger theo cohort ──────────────────────────────────────
//
// Sổ Lưu Niệm auto-generate khi user hoàn thành lộ trình chính:
//   LIGHT     → Day 35
//   MODERATE  → Day 52
//   HEAVY     → Day 65
//
// Override trigger cũ D30/60/90/180/365 (memoryBook.ts cũ).

export function getMemoryBookTriggerDay(cohort: Cohort): number {
  return COHORT_DEFS[cohort].totalDays;
}

export function shouldGenerateMemoryBook(dayInJourney: number, cohort: Cohort): boolean {
  return dayInJourney === COHORT_DEFS[cohort].totalDays;
}
