// dashboard/src/components/views/phaseB/types.ts
// Mirror frontend/src/components/views/phaseB/types.ts. Khi đổi gì,
// đồng bộ cả 2 — payload backend chung.

export type Stage = 'NHAN_THUC' | 'HANH_DONG' | 'GIAI_PHONG' | 'TAI_THIET' | 'DAI_SU';

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
