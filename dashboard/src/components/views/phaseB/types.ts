// dashboard/src/components/views/phaseB/types.ts
// Mirror frontend/src/components/views/phaseB/types.ts. Khi đổi gì,
// đồng bộ cả 2 — payload backend chung.

// LEGACY Stage (giữ tương thích với code chưa migrate sang cohort)
export type Stage = 'NHAN_THUC' | 'HANH_DONG' | 'GIAI_PHONG' | 'TAI_THIET' | 'DAI_SU';

// V2 — Cohort-aware (canonical 2026-05-18)
export type Cohort = 'LIGHT' | 'MODERATE' | 'HEAVY';
export type JourneyChapter = 'NHAN_DIEN' | 'KIEM_SOAT' | 'LAM_CHU' | 'TAI_THIET';

export interface ChapterRange {
  start: number;
  end: number;
  total: number;
}

export interface BodyMilestone {
  daysAfterQDay: number;
  emoji: string;
  title: string;
  detail: string;
}

export interface DashboardData {
  user: {
    id: string;
    name: string;
    pronouns: string;
    assistantName: string;
    quitDate: string | null;
    exitedAt: string | null;
    qDayConfirmedAt: string | null;
    cigsBaseline: number;
    pricePerCig: number;
    onboardingCompletedAt: string | null;
  };
  journey: {
    // LEGACY 88-day fields (giữ tương thích với code cũ)
    dayInJourney: number;
    qDay: number;
    totalDays: number;
    progressPercent: number;
    stage: Stage;
    stageLabel: string;
    stageTagline: string;
    stageEmoji: string;
    stageColor: string;
    dayInStage: number;
    totalInStage: number;
    progressInStage: number;
  };
  // V2 — Cohort-aware (canonical 2026-05-18). NEW UI dùng cái này.
  journeyV2?: {
    dayInJourney: number;
    cohort: Cohort;
    cohortLabel: string;       // 'NHẸ' | 'VỪA' | 'NẶNG'
    cohortEmoji: string;
    cohortTagline: string;
    totalDays: number;         // 35 / 52 / 65
    qDay: number;              // 15 / 22 / 28
    progressPercent: number;
    completedMainJourney: boolean;
    memoryBookReady: boolean;
    chapter: JourneyChapter;
    chapterLabel: string;
    chapterTagline: string;
    chapterEmoji: string;
    chapterColor: string;
    dayInChapter: number;
    totalInChapter: number | null;  // null khi TAI_THIET (vô hạn)
    progressInChapter: number;
    chapters: {
      NHAN_DIEN: ChapterRange;
      KIEM_SOAT: ChapterRange;
      LAM_CHU: ChapterRange;
    };
    taiThietStart: number;
  };
  qDayV2?: {
    qDay: number;
    isPreQDay: boolean;
    isQDay: boolean;
    isPostQDay: boolean;
    needsConfirmation: boolean;
    daysUntilQDay: number;
    qDayConfirmedAt: string | null;
    clockEnabled: boolean;
  };
  qDay: {
    isPreQDay: boolean;
    isQDay: boolean;
    isPostQDay: boolean;
    needsConfirmation: boolean;
    daysUntilQDay: number;
    qDayConfirmedAt: string | null;
    clockEnabled: boolean;
    recentSlip: boolean;
    lastSlipLogId: string | null;
  };
  mode: {
    key: 'AWARENESS' | 'CONTROL' | 'AUTONOMY';
    label: string;
    emoji: string;
    tagline: string;
    color: string;
  };
  today: {
    cigsCount: number;
    cigsSkipped: number;
    peakHour: number | null;
    topTrigger: string | null;
  };
  story: string[];
  nextInsight: string;
  pattern: { hourly: number[]; cigsAvg7d: number };
  stats: {
    cigsLogged: number;
    cigsSkipped: number;
    cigsToday: number;
    moneySaved: number;
    moneySavedSign: 'positive' | 'negative' | 'zero';
    streak: number;
    triggerCounts: Record<string, number>;
    baseline: number;
    pricePerCig: number;
  };
  milestones: {
    unlocked: BodyMilestone[];
    next: BodyMilestone | null;
  };
  cohort: Array<{ pseudonym: string; dayInJourney: number; stageLabel: string }>;
}

export interface PhaseProps {
  data: DashboardData;
  onReload: () => void;
  onShowExit: () => void;
}
