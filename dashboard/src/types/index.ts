export type WidgetMode = 'normal' | 'busy' | 'whisper' | 'calm';

/* ────────────────────────── PRICING TIERS ──────────────────────── */

export type UserTier = 'FREE' | 'KHOI_DONG' | 'DONG_HANH' | 'ALUMNI';

export interface TierState {
  tier: UserTier;
  daysIntoTier: number | null;
  daysRemaining: number | null;
  inMaintenance: boolean;
  maintenanceDaysRemaining: number | null;
  canRequestRefund: boolean;
  refundAmountVnd: number;
}

export interface TierMe extends TierState {
  effectiveTier: UserTier;
  features: string[];
  daily: {
    used: number;
    limit: number | null;
    unlimited: boolean;
    /** FREE user tuần đầu (7 ngày sau Q-Day) được boost 5 → 15. */
    firstWeekBoost: {
      active: true;
      dayOfBoost: number;
      daysRemaining: number;
      boostedLimit: number;
      normalLimit: number;
    } | null;
  };
}

export interface TierCatalogItem {
  id: UserTier;
  label: string;
  priceVnd: number;
  durationDays: number | null;
  refundable?: boolean;
  refundFromDay?: number;
  bullets: string[];
  callout?: string;
}

export interface TierCatalog {
  tiers: TierCatalogItem[];
  note: {
    freeDailyQuota: number;
    maintenanceDailyQuota: number;
    maintenanceDays: number;
    refundMinDay: number;
  };
}

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELED' | 'REFUNDED';
export type PaymentProvider = 'MOCK' | 'MOMO' | 'VIETQR' | 'BANK_TRANSFER';
export type RefundStatus = 'REQUESTED' | 'APPROVED' | 'DENIED' | 'PROCESSED';

export interface PaymentLog {
  id: string;
  userId: string;
  targetTier: UserTier;
  amountVnd: number;
  provider: PaymentProvider;
  providerOrderId?: string | null;
  status: PaymentStatus;
  paidAt?: string | null;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface RefundRequestRecord {
  id: string;
  userId: string;
  paymentId: string;
  daysUsed: number;
  amountVnd: number;
  reason?: string | null;
  status: RefundStatus;
  adminNote?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  processedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type VoiceTriggerType = 'DAY_MATCH' | 'CRISIS' | 'MILESTONE' | 'MANUAL';

export interface VoiceMessage {
  id: string;
  title: string;
  audioUrl: string;
  durationSec: number | null;
  transcript: string | null;
  triggerType: VoiceTriggerType;
  dayMatch: number | null;
  tag: string | null;
  minTier: UserTier;
  enabled: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface VoiceInboxItem {
  id: string;
  voiceId: string;
  title: string;
  audioUrl: string;
  durationSec: number | null;
  transcript: string | null;
  tag: string | null;
  deliveredAt: string;
  playedAt: string | null;
}

/* ────────────────────────── Q-DAY CHECKLIST ───────────────────── */

export interface QDayChecklistItem {
  id: string;
  label: string;
  description?: string;
  wikiUrl?: string;
  required: boolean;
  onlyForTier?: 'KHOI_DONG' | 'DONG_HANH';
  icon?: string;
  /** Server inject: timestamp user đã tick. NULL nếu chưa tick. */
  checkedAt?: string | null;
}

export interface QDayChecklistState {
  intro?: string;
  outro?: string;
  items: QDayChecklistItem[];
  requiredCount: number;
  requiredDoneCount: number;
  allRequiredDone: boolean;
}

export interface QDayChecklistConfig {
  intro?: string;
  outro?: string;
  items: Array<Omit<QDayChecklistItem, 'checkedAt'>>;
}

/* ────────────────────────── COHORT ─────────────────────────────── */

export interface Cohort {
  key: string;
  label: string;
  startDate: string;
  endDate: string;
  totalMembers: number;
  paidMembers: number;
  alumniMembers: number;
  churnedMembers: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  phone: string;
  name?: string;
  /** Cách Sol gọi user — "anh" | "chị" | "em" | "bạn" | tuỳ chỉnh ("Ngài"…). Free string ≤ 8 ký tự. */
  pronouns?: string;
  /** Tên user dùng để gọi trợ lý — "Sol Trợ lý"|"Sol Phó tướng"|"Sol Đồng hành"|tuỳ chỉnh. ≤ 24 ký tự. */
  assistantName?: string;
  quitDate?: string;
  ftndScore?: number;
  checkinStreak: number;
  longestStreak: number;
  missedDaysInRow: number;
  refundEligible: boolean;
  riskyHours?: number[];
  topTriggers?: string[];
  // ── Hồ sơ cai thuốc (group 1) — optional, user điền dần ───────────────
  /** Tuổi user (18-120). */
  age?: number | null;
  /** Số năm đã hút (0-90). */
  yearsSmoked?: number | null;
  /** 0-5 lý do user tự viết, vd ["vì cu Tí", "ho buổi sáng"]. */
  quitReasons?: string[];
  /** Pricing tier — gói thực sự đang giữ (chưa tính expire). */
  tier?: UserTier;
  /** Tier hiệu lực sau khi tính expire. */
  effectiveTier?: UserTier;
  /** Trạng thái tier (computed) — refund eligibility, days left… */
  tierState?: TierState;
  /** Cohort key vd "2026-04". NULL nếu chưa đặt Q-Day. */
  cohortKey?: string | null;
  /** Danh sách feature key. */
  features?: string[];
  isAdmin?: boolean;
  settings?: {
    mode?: WidgetMode;
    quietStart?: string;
    quietEnd?: string;
    calmModeUntil?: string;
    /** Số điếu hút mỗi ngày (ước tính lúc còn hút) — dùng để tính tiền tiết kiệm & tuổi thọ */
    cigsPerDay?: number;
    /** Giá trung bình mỗi điếu (VND) */
    pricePerCig?: number;
    /**
     * Ngôn ngữ giai đoạn:
     * - 'dramatic' (default): tên Việt hoá hình ảnh — Chiến Trường / Đống Tro Tàn / Ánh Bình Minh / Tự Do
     * - 'clinical': tên y khoa trung tính — Withdrawal / Slump / Habit Reset / Consolidation
     * Toggle trong Settings cho user trí thức muốn ngôn ngữ trung tính hơn.
     */
    phaseLanguage?: 'dramatic' | 'clinical';
    /** Dữ liệu "Sổ Tay 30 Ngày" (workbook). In ra được, nuôi AI cá nhân hóa. */
    workbook?: WorkbookData;
  };
  state?: string;
}

/* ──────────────────────────────────────────────────────────
   WORKBOOK — Sổ Tay 30 Ngày Bỏ Thuốc.
   Lưu hết trong settings.workbook (JSON) để khỏi migration.
   ──────────────────────────────────────────────────────── */

export interface WorkbookNetworkEntry {
  name: string;
  relation: string;
  contact: string;
  role: string;
}

export interface WorkbookCravingLog {
  date: string;
  time: string;
  situation: string;
  emotion: string;
  action: string;
  result: string;
}

export interface WorkbookTrigger {
  trigger: string;
  plan: string;
}

export interface WorkbookDay {
  date?: string;
  habits?: {
    'no-smoke'?: boolean;
    water?: boolean;
    exercise?: boolean;
    sleep?: boolean;
    mentor?: boolean;
  };
  /** Mood value 2–5 (khớp với MOOD_OPTIONS) */
  mood?: number;
  /** Cơn thèm 1–10 */
  cravingLevel?: number;
  cravingCount?: number;
  win?: string;
  hard?: string;
  tomorrow?: string;
  note?: string;
}

export interface WorkbookWeekReflection {
  win?: string;
  lesson?: string;
  hard?: string;
  goal?: string;
  reward?: string;
}

export interface WorkbookData {
  version: 1;
  userName?: string;
  quitDate?: string;
  updatedAt?: string;

  // Prep phase checklists (key → checked)
  prep?: Record<string, boolean>;

  // Section 1: Why
  whys?: [string?, string?, string?, string?];
  roleModel?: string;

  // Section 2: Pledge
  pledgeSignature?: string;
  pledgeDate?: string;

  // Section 3: Network
  network?: WorkbookNetworkEntry[];

  // Section 4: Money (mirrored from settings but user can override usage goal)
  moneyGoal?: string;

  // Section 5: Craving log
  cravings?: WorkbookCravingLog[];

  // Section 6: Relapse plan
  triggers?: [WorkbookTrigger?, WorkbookTrigger?, WorkbookTrigger?];
  relapseMantra?: string;

  // Daily entries — 1..30
  days?: Record<number, WorkbookDay>;

  // Weekly reflections — 1..4
  weeks?: Record<number, WorkbookWeekReflection>;

  // Post-30
  postGoal?: string;
  postShare?: string;
  postLetter?: string;
}

export interface CheckIn {
  id: string;
  date: string;
  dayNumber: number;
  smoked: boolean;
  cravingIntensity: number;
  mood: number;
  note?: string | null;
  isSickDay?: boolean;
  createdAt: string;
}

export interface RoadmapDay {
  dayNumber: number;
  isLocked: boolean;
  isToday: boolean;
  checkinDone: boolean;
  exercisesDone: number;
  totalExercises: number;
  titles: string[];
}

export interface Roadmap {
  days: RoadmapDay[];
}

export interface ExerciseEntry {
  id: string;
  exerciseKey: string;
  dayNumber: number;
  content: Record<string, any>;
  completedAt?: string | null;
  createdAt: string;
}
