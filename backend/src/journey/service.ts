// backend/src/journey/service.ts
// Phase B — 88-day journey: NHAN_THUC + HANH_DONG + GIAI_PHONG + TAI_THIET + DAI_SU
// Q-Day = Day 28. Money saved cumulative cho phép âm.
//
// Triết lý: Không phải 4 gói thời gian — 1 hành trình tiến hoá hành vi 4 lớp.
// Awareness → Rewiring → Stabilization → Maintenance.

export type JourneyStage =
  | 'NHAN_THUC'      // Day 1-7   (Awareness)
  | 'HANH_DONG'      // Day 8-28  (Rewiring) — ngày 28 = Q-Day
  | 'GIAI_PHONG'     // Day 29-58 (Stabilization) — đồng hồ countdown bật
  | 'TAI_THIET'      // Day 59-88 (Maintenance) — anti-relapse
  | 'DAI_SU';        // Day 89+   (Ambassador) — lifetime

export const STAGE_LABELS: Record<JourneyStage, string> = {
  NHAN_THUC: 'Nhận Thức',
  HANH_DONG: 'Hành Động',
  GIAI_PHONG: 'Giải Phóng',
  TAI_THIET: 'Tái Thiết',
  DAI_SU: 'Đại Sứ Sol',
};

export const STAGE_TAGLINES: Record<JourneyStage, string> = {
  NHAN_THUC: 'Quan sát chính mình',
  HANH_DONG: 'Phá bỏ thói quen',
  GIAI_PHONG: 'Bỏ hẳn — sống tự do',
  TAI_THIET: 'Giữ vững — tái thiết',
  DAI_SU: 'Mentor cohort mới',
};

export const STAGE_EMOJI: Record<JourneyStage, string> = {
  NHAN_THUC: '🌱',
  HANH_DONG: '🔥',
  GIAI_PHONG: '🚭',
  TAI_THIET: '🌟',
  DAI_SU: '🦁',
};

export const STAGE_COLORS: Record<JourneyStage, string> = {
  NHAN_THUC: '#B25C2C',     // sol-clay — khởi đầu, đất đỏ
  HANH_DONG: '#B8860B',      // sol-gold — lửa hành động
  GIAI_PHONG: '#3A7CA5',     // sol-blue — bầu trời tự do
  TAI_THIET: '#5C3A1E',      // sol-earth — đất rắn vững chãi
  DAI_SU: '#2C1810',         // sol-deep — đại sứ
};

// Q-DAY = Day 28 (cuối Phase 2 HANH_DONG, ngày user cam kết bỏ hẳn).
// Đồng hồ countdown CHỈ chạy khi qDayConfirmedAt != null AND dayInJourney >= 29.
export const Q_DAY = 28;

// Stage day ranges
export const STAGE_RANGES: Record<JourneyStage, { start: number; end: number; total: number }> = {
  NHAN_THUC:   { start: 1,  end: 7,    total: 7 },
  HANH_DONG:   { start: 8,  end: 28,   total: 21 },
  GIAI_PHONG:  { start: 29, end: 58,   total: 30 },
  TAI_THIET:   { start: 59, end: 88,   total: 30 },
  DAI_SU:      { start: 89, end: 9999, total: 9999 },
};

export function computeDayInJourney(quitDate: Date | null | undefined): number {
  if (!quitDate) return 0;
  const ms = Date.now() - new Date(quitDate).getTime();
  return Math.max(0, Math.floor(ms / 86400000) + 1);
}

export function deriveStage(dayInJourney: number): JourneyStage {
  if (dayInJourney <= 7) return 'NHAN_THUC';
  if (dayInJourney <= 28) return 'HANH_DONG';
  if (dayInJourney <= 58) return 'GIAI_PHONG';
  if (dayInJourney <= 88) return 'TAI_THIET';
  return 'DAI_SU';
}

export function getStageDayInfo(dayInJourney: number) {
  const stage = deriveStage(dayInJourney);
  const r = STAGE_RANGES[stage];
  const dayInStage = dayInJourney - r.start + 1;
  return {
    stage,
    stageLabel: STAGE_LABELS[stage],
    stageTagline: STAGE_TAGLINES[stage],
    stageEmoji: STAGE_EMOJI[stage],
    stageColor: STAGE_COLORS[stage],
    dayInStage: Math.max(1, dayInStage),
    totalInStage: r.total,
    progressInStage: Math.min(1, Math.max(0, dayInStage / r.total)),
  };
}

// ─── Q-Day helpers ─────────────────────────────────────────────────────────

export interface QDayState {
  isPreQDay: boolean;       // Day 26-27, banner appearing
  isQDay: boolean;          // Day 28 exactly
  isPostQDay: boolean;      // Day 29+
  needsConfirmation: boolean; // Day 28+ AND not yet confirmed
  daysUntilQDay: number;    // negative if past
  qDayConfirmedAt: Date | null;
  /**
   * Chỉ cho phép đồng hồ countdown chạy khi cả 2 điều kiện:
   *   1. dayInJourney >= 29
   *   2. qDayConfirmedAt != null
   * Trước Day 29 OR chưa confirm → đồng hồ ẨN.
   */
  clockEnabled: boolean;
}

export function deriveQDayState(
  dayInJourney: number,
  qDayConfirmedAt: Date | null | undefined,
): QDayState {
  const confirmedAt = qDayConfirmedAt ? new Date(qDayConfirmedAt) : null;
  const isPreQDay = dayInJourney >= Q_DAY - 2 && dayInJourney < Q_DAY;
  const isQDay = dayInJourney === Q_DAY;
  const isPostQDay = dayInJourney > Q_DAY;
  const needsConfirmation = dayInJourney >= Q_DAY && confirmedAt === null;
  const daysUntilQDay = Q_DAY - dayInJourney;
  const clockEnabled = dayInJourney >= Q_DAY + 1 && confirmedAt !== null;

  return {
    isPreQDay,
    isQDay,
    isPostQDay,
    needsConfirmation,
    daysUntilQDay,
    qDayConfirmedAt: confirmedAt,
    clockEnabled,
  };
}

// ─── BODY MILESTONES (CDC, NHS, Mayo Clinic) ──────────────────────────────
// Quan trọng: milestones tính từ qDayConfirmedAt (lúc bỏ hẳn), KHÔNG phải quitDate.
// Trước Q-Day, milestones không hiển thị "đã đạt" — vì user vẫn còn hút.
export interface BodyMilestone {
  daysAfterQDay: number;
  emoji: string;
  title: string;
  detail: string;
}

export const BODY_MILESTONES: BodyMilestone[] = [
  { daysAfterQDay: 1,  emoji: '🩸', title: 'CO máu giảm 50%',           detail: 'Sau 8 giờ. Hồng cầu chở oxy hiệu quả hơn (CDC).' },
  { daysAfterQDay: 2,  emoji: '🌬️', title: 'Nicotin sạch máu',          detail: '48 giờ — half-life 2h, 99% đã thải qua nước tiểu (NHS).' },
  { daysAfterQDay: 3,  emoji: '🫁', title: 'Phổi bắt đầu mở',            detail: '72 giờ — ống phế quản giãn, hô hấp dễ hơn.' },
  { daysAfterQDay: 7,  emoji: '👃', title: 'Khứu giác phục hồi',          detail: 'Mũi sạch hắc ín. Cà phê sáng thơm rõ hơn.' },
  { daysAfterQDay: 14, emoji: '🧠', title: 'Receptor giảm 40%',           detail: 'Não đã "tháo" phần lớn nhu cầu nicotin (Brody 2006).' },
  { daysAfterQDay: 21, emoji: '🔥', title: '3 tuần — thói quen mới',     detail: 'Lally 2010 — não bắt đầu coi không-hút là default.' },
  { daysAfterQDay: 30, emoji: '🌸', title: 'Phổi hồi 10% chức năng',     detail: 'NHS — khởi đầu của hồi phục dài hạn.' },
  { daysAfterQDay: 60, emoji: '💎', title: '2 tháng — Tái Thiết',         detail: 'Doll & Hill BMJ 2004 — giảm 90% nguy cơ ung thư phổi nếu cai trước 50 tuổi.' },
];

export function getUnlockedMilestones(qDayConfirmedAt: Date | null | undefined): BodyMilestone[] {
  if (!qDayConfirmedAt) return [];
  const ms = Date.now() - new Date(qDayConfirmedAt).getTime();
  const daysAfter = Math.floor(ms / 86400000);
  return BODY_MILESTONES.filter(m => m.daysAfterQDay <= daysAfter);
}

export function getNextMilestone(qDayConfirmedAt: Date | null | undefined): BodyMilestone | null {
  if (!qDayConfirmedAt) return BODY_MILESTONES[0]; // Show first as preview
  const ms = Date.now() - new Date(qDayConfirmedAt).getTime();
  const daysAfter = Math.floor(ms / 86400000);
  return BODY_MILESTONES.find(m => m.daysAfterQDay > daysAfter) ?? null;
}

// ─── MONEY SAVED — CUMULATIVE PER-DAY DELTA, ALLOW NEGATIVE ──────────────
// Logic mới (Phase B): tính theo từng ngày, cho phép âm khi user hút nhiều
// hơn baseline. Triết lý: gương phản chiếu, không che dấu, không gamify ảo.
//
// Input: array of { day: 1..N, cigsLogged: number }
// Output: tổng tiết kiệm tích luỹ (có thể âm)
export function computeMoneySavedCumulative(
  dailyCigs: Array<{ dayInJourney: number; cigsCount: number }>,
  baseline: number,
  pricePerCig: number,
): number {
  let total = 0;
  for (const d of dailyCigs) {
    const avoidedToday = baseline - d.cigsCount;  // có thể âm
    total += avoidedToday * pricePerCig;
  }
  return total;
}

// Helper: tính money saved theo per-day breakdown (cho biểu đồ Analytics)
export function computeDailyMoneySaved(
  dailyCigs: Array<{ dayInJourney: number; cigsCount: number }>,
  baseline: number,
  pricePerCig: number,
): Array<{ day: number; cigs: number; avoided: number; moneyDelta: number; cumulative: number }> {
  let cumulative = 0;
  return dailyCigs.map(d => {
    const avoided = baseline - d.cigsCount;
    const moneyDelta = avoided * pricePerCig;
    cumulative += moneyDelta;
    return {
      day: d.dayInJourney,
      cigs: d.cigsCount,
      avoided,
      moneyDelta,
      cumulative,
    };
  });
}

// ─── MODE INDICATOR ────────────────────────────────────────────────────────
// 3 trạng thái nhận thức theo Prochaska + tinh chỉnh cho VN.

export type Mode = 'AWARENESS' | 'CONTROL' | 'AUTONOMY';

export const MODE_INFO: Record<Mode, { label: string; emoji: string; tagline: string; color: string }> = {
  AWARENESS: {
    label: 'Awareness Mode',
    emoji: '🌱',
    tagline: 'Đang hiểu hành vi',
    color: '#B25C2C',
  },
  CONTROL: {
    label: 'Control Mode',
    emoji: '🔥',
    tagline: 'Đang thay đổi',
    color: '#B8860B',
  },
  AUTONOMY: {
    label: 'Autonomy Mode',
    emoji: '🌟',
    tagline: 'Đang tự chủ',
    color: '#3A7CA5',
  },
};

// Mode mapping theo phase mới:
//   Day 1-7   NHAN_THUC  → AWARENESS (chỉ quan sát)
//   Day 8-28  HANH_DONG  → CONTROL (đang đổi phản xạ)
//   Day 29-58 GIAI_PHONG → CONTROL (vẫn cần effort, đặc biệt 7 ngày đầu sau Q-Day)
//   Day 59+   TAI_THIET  → AUTONOMY (đã ổn định)
export function deriveMode(dayInJourney: number): Mode {
  if (dayInJourney <= 7) return 'AWARENESS';
  if (dayInJourney <= 58) return 'CONTROL';
  return 'AUTONOMY';
}

// ─── STORY GENERATOR ───────────────────────────────────────────────────────
// AI tự viết 2-4 câu narrative từ data hôm nay + lịch sử.
// KHÔNG dùng Claude API — template engine để tiết kiệm token.

export interface StoryContext {
  dayInJourney: number;
  stage: JourneyStage;
  cigsToday: number;
  cigsAvg7d: number;
  cigsSkippedToday: number;
  topTriggerToday: string | null;
  peakHourToday: number | null;
  pronouns: string;
  mode: Mode;
  qDayConfirmed: boolean;
  daysUntilQDay: number;
}

export function generateStory(ctx: StoryContext): string[] {
  const sentences: string[] = [];
  const p = ctx.pronouns || 'bạn';
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  // ─── Sentence 1: Compare with average (per stage) ───────────────────────
  if (ctx.cigsAvg7d > 0) {
    const diff = ctx.cigsAvg7d - ctx.cigsToday;
    if (diff > 1.5) {
      sentences.push(`Hôm nay ${p} hút ít hơn ${Math.round(diff)} điếu so với trung bình tuần.`);
    } else if (diff < -1.5) {
      sentences.push(`Hôm nay ${p} hút nhiều hơn ${Math.round(-diff)} điếu so với trung bình — bình thường, mai khác.`);
    } else {
      sentences.push(`Hôm nay ${p} hút bằng trung bình tuần — đường đi đang ổn định.`);
    }
  } else if (ctx.dayInJourney <= 1) {
    sentences.push(`Đây là ngày đầu ${p} ghi nhận. Sol bắt đầu đo nhịp của ${p}.`);
  } else if (ctx.stage === 'GIAI_PHONG' && ctx.qDayConfirmed && ctx.cigsToday === 0) {
    sentences.push(`${cap(p)} vừa qua ngày ${ctx.dayInJourney - Q_DAY} không hút. Phổi đang sửa chính mình.`);
  } else {
    sentences.push(`${cap(p)} chưa ghi điếu nào hôm nay. Sol đang quan sát thầm — bấm "+ Ghi điếu" khi cần.`);
  }

  // ─── Sentence 2: Pattern observation ────────────────────────────────────
  if (ctx.peakHourToday !== null) {
    const hour = ctx.peakHourToday;
    let timeOfDay = 'sáng';
    if (hour >= 11 && hour < 14) timeOfDay = 'trưa';
    else if (hour >= 14 && hour < 18) timeOfDay = 'chiều';
    else if (hour >= 18 && hour < 22) timeOfDay = 'tối';
    else if (hour >= 22 || hour < 5) timeOfDay = 'đêm';
    sentences.push(`${cap(p)} thường hút ${timeOfDay} (${hour}h).`);
  }

  // ─── Sentence 3: Trigger insight ────────────────────────────────────────
  if (ctx.topTriggerToday) {
    const triggerVN: Record<string, string> = {
      STRESS: 'sau stress',
      EATING: 'sau cơm',
      IDLE: 'lúc rảnh',
      SOCIAL: 'lúc tụ tập',
      OTHER: 'tình huống khác',
    };
    sentences.push(`Trigger chính hôm nay: ${triggerVN[ctx.topTriggerToday] || 'tình huống khác'}.`);
  }

  // ─── Sentence 4: Stage-specific encouragement ───────────────────────────
  if (ctx.cigsSkippedToday > 0) {
    sentences.push(`${cap(p)} đã trì hoãn / bỏ qua ${ctx.cigsSkippedToday} lần thành công — chiến thắng nhỏ thật sự.`);
  } else if (ctx.stage === 'NHAN_THUC') {
    sentences.push(`Chỉ cần quan sát. Sol đang học cùng ${p}.`);
  } else if (ctx.stage === 'HANH_DONG') {
    if (ctx.daysUntilQDay > 0 && ctx.daysUntilQDay <= 3) {
      sentences.push(`Còn ${ctx.daysUntilQDay} ngày là Q-Day. ${cap(p)} chuẩn bị thế nào?`);
    } else {
      sentences.push(`Mai thử trì hoãn 1 điếu sau ${ctx.topTriggerToday === 'STRESS' ? 'lúc stress' : 'tình huống quen'}.`);
    }
  } else if (ctx.stage === 'GIAI_PHONG') {
    if (ctx.qDayConfirmed) {
      const daysAfterQ = ctx.dayInJourney - Q_DAY;
      sentences.push(`Đã ${daysAfterQ} ngày kể từ Q-Day. ${cap(p)} đang viết lại identity của mình.`);
    } else {
      sentences.push(`${cap(p)} chưa cam kết Q-Day. Sol vẫn đợi — bấm "Tôi cam kết" khi sẵn sàng.`);
    }
  } else if (ctx.stage === 'TAI_THIET') {
    sentences.push(`${cap(p)} đang giữ vững. Sol giảm dần — autonomy mode.`);
  } else {
    // DAI_SU
    sentences.push(`${cap(p)} là Đại Sứ Sol. Sol chỉ là gương phản chiếu.`);
  }

  return sentences;
}

// ─── NEXT INSIGHT — gợi ý nhẹ nhàng theo stage ─────────────────────────────
export function generateNextInsight(ctx: StoryContext): string {
  const p = ctx.pronouns || 'bạn';
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  // Stage-specific
  if (ctx.stage === 'NHAN_THUC') {
    if (!ctx.topTriggerToday) {
      return `Sol gợi ý: ngày mai ${p} ghi rõ trigger mỗi điếu — Sol sẽ thấy pattern.`;
    }
    return `Mai ${p} thử quan sát: trước khi châm điếu, đếm 10 hơi thở.`;
  }

  if (ctx.stage === 'HANH_DONG') {
    if (ctx.daysUntilQDay > 0 && ctx.daysUntilQDay <= 7) {
      return `Còn ${ctx.daysUntilQDay} ngày Q-Day. Tối nay viết 3 lý do ${p} muốn bỏ — để mai đọc lại.`;
    }
    if (ctx.topTriggerToday === 'STRESS') return `Mai 14h thử thay điếu stress bằng 1 cốc nước lạnh + 5 phút đi bộ.`;
    if (ctx.topTriggerToday === 'EATING') return `Mai sau cơm thử đánh răng — vị giác mới làm cơn thèm giảm.`;
    if (ctx.topTriggerToday === 'SOCIAL') return `Tối nay nếu nhậu, gọi 1 chai nước trước. Plan B sẵn.`;
    return `Mai thử trì hoãn 10 phút trước điếu đầu tiên.`;
  }

  if (ctx.stage === 'GIAI_PHONG') {
    if (!ctx.qDayConfirmed) {
      return `${cap(p)} đã đến Phase Giải Phóng. Bấm "Tôi cam kết" để bật đồng hồ tự do.`;
    }
    const daysAfterQ = ctx.dayInJourney - Q_DAY;
    if (daysAfterQ <= 3) return `3 ngày đầu là khó nhất. Sol bên ${p} — gọi khi cần.`;
    if (daysAfterQ <= 7) return `Tuần đầu sau Q-Day — não đang reset. Ngủ đủ giúp giảm cơn thèm.`;
    if (daysAfterQ <= 21) return `${cap(p)} đã qua giai đoạn khó nhất. Receptor đã giảm 40%.`;
    return `${cap(p)} đang ổn định. Sol giảm tần suất nhắc.`;
  }

  if (ctx.stage === 'TAI_THIET') {
    return `${cap(p)} là người không hút. Sol chỉ nhắc khi có nguy cơ relapse.`;
  }

  // DAI_SU
  return `${cap(p)} đã graduate. Chia sẻ với 1 người mới đang muốn cai?`;
}

// ─── BACKWARDS COMPAT ─────────────────────────────────────────────────────
// Cũ: computeMoneySaved (deprecated). Giữ alias để không break code cũ.
// Logic chuyển sang positive-only nếu dùng path cũ.
export function computeMoneySaved(
  dayInJourney: number,
  cigsLogged: number,
  baselineCigsPerDay = 20,
  pricePerCig = 1250,
): number {
  const expectedCigs = dayInJourney * baselineCigsPerDay;
  const cigsAvoided = Math.max(0, expectedCigs - cigsLogged);
  return cigsAvoided * pricePerCig;
}
