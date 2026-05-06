// frontend/src/types/index.ts

export type MessageRole = 'USER' | 'ASSISTANT' | 'SYSTEM';
export type MessageType =
  | 'CHAT'
  | 'MORNING_GOAL'
  | 'SCIENCE_TIP'
  | 'PHENOMENA_ALERT'
  | 'EXERCISE_CARD'
  | 'CHECKIN_PROMPT'
  | 'CHECKIN_STEP'
  | 'NIGHT_STORY'
  | 'STREAK_MILESTONE'
  | 'CRISIS_PROMPT'
  | 'SYSTEM_NOTICE'
  | 'WIKI_LINK';

export type ConversationState = 'IDLE' | 'CHECKIN_FLOW' | 'EXERCISE_FLOW' | 'AI_CHAT' | 'CRISIS_MODE';
export type WidgetMode = 'normal' | 'busy' | 'whisper' | 'calm';

export interface Message {
  id: string;
  role: MessageRole;
  type: MessageType;
  content: string;
  metadata?: Record<string, any>;
  readAt?: string | null;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  /** Cách Sol gọi user: "anh" | "chị" | "em" | "bạn" | tuỳ chỉnh ("Ngài"…). Free string ≤ 8 ký tự. */
  pronouns: string;
  /** Tên trợ lý AI: "Sol Trợ lý" | "Sol Phó tướng" | "Sol Đồng hành" | tuỳ chỉnh. ≤ 24 ký tự. */
  assistantName?: string;
  ftndScore?: number | null;
  quitDate?: string | null;
  dayNumber: number;
  checkinStreak: number;
  longestStreak: number;
  lastCheckinDate?: string | null;
  missedDaysInRow: number;
  refundEligible: boolean;
  settings: {
    quietHoursStart?: string;
    quietHoursEnd?: string;
    quietStart?: string;
    quietEnd?: string;
    mode?: WidgetMode;
    calmModeUntil?: string;
    pushPrefs?: Record<string, boolean>;
    /** Số điếu hút mỗi ngày (ước tính lúc còn hút) */
    cigsPerDay?: number;
    /** Giá trung bình mỗi điếu (VND) */
    pricePerCig?: number;
    /** Ngôn ngữ giai đoạn — 'dramatic' (default) hoặc 'clinical'. */
    phaseLanguage?: 'dramatic' | 'clinical';
  };
  riskyHours: number[];
  topTriggers: string[];
  // ── Hồ sơ cai thuốc (group 1) — optional, user điền dần ───────────────
  /** Tuổi user (18-120). */
  age?: number | null;
  /** Số năm đã hút (0-90). */
  yearsSmoked?: number | null;
  /** 0-5 lý do user tự viết, vd ["vì cu Tí", "ho buổi sáng"]. */
  quitReasons?: string[];
  /** Pricing tier — gói thực sự đang giữ (chưa tính expire). */
  tier?: UserTier;
  /** Tier hiệu lực sau khi tính expire (KHOI_DONG hết hạn → FREE). */
  effectiveTier?: UserTier;
  /** Trạng thái tier (computed) — refund eligibility, days left… */
  tierState?: TierState;
  /** Đội key vd "2026-04". NULL nếu chưa đặt Q-Day. */
  cohortKey?: string | null;
  /** Danh sách feature key user được phép truy cập (computed). */
  features?: string[];
  state: ConversationState;
  isAdmin?: boolean;
}

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
    /**
     * FREE user trong tuần đầu (7 ngày sau Q-Day) được boost quota 5 → 15.
     * null nếu không trong cửa sổ boost.
     */
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

/* ────────────────────────── PAYMENTS / REFUNDS ─────────────────── */

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

/* ────────────────────────── VOICE LIBRARY ──────────────────────── */

export type VoiceTriggerType = 'DAY_MATCH' | 'CRISIS' | 'MILESTONE' | 'MANUAL';

export interface QDayChecklistItem {
  id: string;
  label: string;
  description?: string;
  wikiUrl?: string;
  required: boolean;
  onlyForTier?: 'KHOI_DONG' | 'DONG_HANH';
  icon?: string;
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

export interface VoiceInboxItem {
  id: string;          // delivery id
  voiceId: string;
  title: string;
  audioUrl: string;
  durationSec: number | null;
  transcript: string | null;
  tag: string | null;
  deliveredAt: string;
  playedAt: string | null;
}

export interface CheckinOption {
  label: string;
  value: Record<string, any>;
}

export interface CheckinStepMeta {
  step: number;
  options: CheckinOption[];
  acceptsFreeText?: boolean;
}

export interface CrisisPromptMeta {
  stage: 'breathing' | 'remind' | 'support';
  actions: Array<{ label: string; action: string }>;
}

export interface ExerciseCardMeta {
  dayNumber: number;
  exerciseKey: string;
  title?: string;
  prompt?: string;
  wikiUrl?: string;
}

export interface RoadmapDay {
  day: number;
  isToday: boolean;
  locked: boolean;
  checkinDone: boolean;
  smoked?: boolean | null;
  exercisesDone: number;
}

export interface Roadmap {
  today: number;
  days: RoadmapDay[];
  streak: number;
  longestStreak: number;
}
