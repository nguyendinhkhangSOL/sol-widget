// Recovery science — base curves for body rings + phase detection
// References: CDC, NHS, SmokeFree.gov, WHO — normalized to exponential approach curves.

export interface Phase {
  key: string;
  label: string;
  sub: string;
  color: string;        // hex
  bg: string;           // rgba
  emoji: string;
}

export function elapsedMs(quitDate?: string, nowMs = Date.now()): number {
  if (!quitDate) return 0;
  return Math.max(0, nowMs - new Date(quitDate).getTime());
}

export function hmsFromMs(ms: number): { days: number; h: number; m: number; s: number; hours: number } {
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const hours = totalSec / 3600;
  return { days, h, m, s, hours };
}

export function pad2(n: number) {
  return n.toString().padStart(2, '0');
}

// ─── PHASE ──────────────────────────────────────────────
// Mỗi phase có 2 phiên bản tên + sub:
//   - dramatic: tên Việt hoá, hình ảnh ("72h Tử chiến", "Đống Tro Tàn"...)
//                — mặc định, dễ kết nối cho người 45+ Việt.
//   - clinical: tên y khoa ("Withdrawal", "Slump", ...) — cho user trí thức
//                muốn ngôn ngữ trung tính hơn. Toggle qua user.settings.phaseLanguage.

export type PhaseLanguage = 'dramatic' | 'clinical';

interface PhaseDef {
  minHours: number;
  phase: Phase;
  /** Phiên bản tên/sub khi user chọn 'clinical'. */
  clinical?: { label: string; sub: string };
}

const PHASES: PhaseDef[] = [
  {
    minHours: 0,
    phase: {
      key: 'hour0',
      label: 'Giờ 0',
      sub: 'Bước đầu tiên',
      color: '#C17E2A',
      bg: 'rgba(193,126,42,.18)',
      emoji: '🟡',
    },
    clinical: { label: 'Hour 0 — Baseline', sub: 'First hour after last cigarette' },
  },
  {
    minHours: 0.33,
    phase: {
      key: 'war72',
      label: '72h Tử chiến',
      sub: 'Đỉnh withdrawal — trận lớn nhất',
      color: '#D4604A',
      bg: 'rgba(212,96,74,.2)',
      emoji: '🔴',
    },
    clinical: { label: 'Acute Withdrawal (0–72h)', sub: 'Peak symptoms — strongest cravings' },
  },
  {
    minHours: 72,
    phase: {
      key: 'hold48',
      label: '48h Cầm cự',
      sub: 'Dopamine đang tái cân bằng',
      color: '#B8860B',
      bg: 'rgba(232,129,46,.2)',
      emoji: '🟠',
    },
    clinical: { label: 'Post-acute Phase (D3–5)', sub: 'Dopamine recalibrating' },
  },
  {
    minHours: 120,
    phase: {
      key: 'week1',
      label: 'Tuần đầu',
      sub: 'Cán đích tuần đầu tiên',
      color: '#D6A13A',
      bg: 'rgba(214,161,58,.2)',
      emoji: '🟡',
    },
    clinical: { label: 'Week 1 — Stabilization', sub: 'Crossing the highest-relapse zone' },
  },
  {
    minHours: 168,
    phase: {
      key: 'rebuild552',
      label: '552h Tái thiết',
      sub: 'Phổi và mạch máu đang xây lại',
      color: '#3A6EA8',
      bg: 'rgba(58,110,168,.2)',
      emoji: '🔵',
    },
    clinical: { label: 'Reconstruction (W2–4)', sub: 'Lung cilia + vessels rebuilding' },
  },
  {
    minHours: 720,
    phase: {
      key: 'month1',
      label: 'Tháng đầu',
      sub: 'Ho mãn tính bắt đầu giảm',
      color: '#4A8A5A',
      bg: 'rgba(74,138,90,.2)',
      emoji: '🟢',
    },
    clinical: { label: 'Month 1 — Consolidation', sub: 'Chronic cough subsiding' },
  },
  {
    minHours: 2160,
    phase: {
      key: 'month3',
      label: '3 tháng — Phổi hồi phục',
      sub: 'Cilia tái tạo, dung tích phổi tăng 30%',
      color: '#6BA37C',
      bg: 'rgba(107,163,124,.2)',
      emoji: '🌿',
    },
    clinical: { label: 'Month 3 — Pulmonary Recovery', sub: 'Cilia regrown, FEV1 up to 30%' },
  },
  {
    minHours: 8760,
    phase: {
      key: 'year1',
      label: '1 năm — Ánh sáng',
      sub: 'Nguy cơ tim mạch giảm 50%',
      color: '#C9A227',
      bg: 'rgba(201,162,39,.25)',
      emoji: '⭐',
    },
    clinical: { label: 'Year 1 — Cardiovascular Recovery', sub: 'CHD risk halved' },
  },
];

export function phaseAt(hours: number, language: PhaseLanguage = 'dramatic'): Phase {
  let currentDef = PHASES[0];
  for (const p of PHASES) {
    if (hours >= p.minHours) currentDef = p;
  }
  if (language === 'clinical' && currentDef.clinical) {
    return {
      ...currentDef.phase,
      label: currentDef.clinical.label,
      sub: currentDef.clinical.sub,
    };
  }
  return currentDef.phase;
}

// ─── RECOVERY RINGS ──────────────────────────────────────
// Exponential approach: recovery(t) = target * (1 - e^(-t/τ))
// τ (tau) tuned to hit key medical milestones roughly:
// - Heart: 20min → ~5%, 24h → ~40%, 1 week → ~90%, 1 year → 99%
// - Lungs: 2 weeks → 20%, 9 months → 70%, 1 year → 85%
// - Brain: 3 days → 30%, 2 weeks → 60%, 3 months → 90%
// - Immune: 2 weeks → 25%, 1 month → 45%, 3 months → 75%
//
// PERSONALIZATION (v2): nhân τ với hệ số tuỳ vào yearsSmoked.
// - Phổi & não nhạy nhất với độ dài hút thuốc (cilia tổn, nAChR upregulate).
// - Tim & miễn dịch ít nhạy hơn — chỉ scale nhẹ.
// Công thức: τ_personalized = τ_base × (1 + yearsSmoked × factor)
//   factor: lung=0.020, brain=0.015, immune=0.010, heart=0.005
//   yearsSmoked=0 → không thay đổi
//   yearsSmoked=30 → lung×1.60, brain×1.45, immune×1.30, heart×1.15
//   yearsSmoked=40 → lung×1.80, brain×1.60, immune×1.40, heart×1.20
// Cap maxFactor = 2.0 để không cho τ quá lớn (yearsSmoked > 50).

const TAU_BASE = {
  heart: 48,
  lung: 3500,
  brain: 350,
  immune: 900,
} as const;

const TAU_YEARS_FACTOR = {
  heart: 0.005,
  lung: 0.020,
  brain: 0.015,
  immune: 0.010,
} as const;

const TAU_MAX_MULTIPLIER = 2.0;

export interface OrganRing {
  key: 'heart' | 'lung' | 'brain' | 'immune';
  label: string;
  color: string;
  tau: number;           // in hours, personalized
  tauBase: number;       // before personalization (debug/transparency)
  pct: number;           // 0..1
  status: string;        // dynamic label
  badge: string;         // small badge text
  badgeBg: string;
}

function curve(hours: number, tauHours: number): number {
  return 1 - Math.exp(-hours / tauHours);
}

/**
 * Tính τ cá nhân hoá cho 1 cơ quan.
 * yearsSmoked < 0 hoặc undefined → coi như 0 (dùng baseline).
 */
export function personalizedTau(
  organ: keyof typeof TAU_BASE,
  yearsSmoked?: number | null,
): number {
  const base = TAU_BASE[organ];
  const ys = Math.max(0, yearsSmoked ?? 0);
  const mult = Math.min(TAU_MAX_MULTIPLIER, 1 + ys * TAU_YEARS_FACTOR[organ]);
  return base * mult;
}

export function ringsAt(hours: number, yearsSmoked?: number | null): OrganRing[] {
  const tauHeart = personalizedTau('heart', yearsSmoked);
  const tauLung = personalizedTau('lung', yearsSmoked);
  const tauBrain = personalizedTau('brain', yearsSmoked);
  const tauImmune = personalizedTau('immune', yearsSmoked);

  const heart = curve(hours, tauHeart);
  const lung = curve(hours, tauLung);
  const brain = curve(hours, tauBrain);
  const immune = curve(hours, tauImmune);

  const rings: OrganRing[] = [
    {
      key: 'heart',
      label: 'Tim mạch',
      color: '#D4604A',
      tau: tauHeart,
      tauBase: TAU_BASE.heart,
      pct: heart,
      status: heart > 0.9 ? 'Rất tốt' : heart > 0.6 ? 'Đang hồi phục' : heart > 0.3 ? 'Đang ổn định' : 'Khởi động',
      badge: `${heart > 0.9 ? 'Xuất sắc' : heart > 0.6 ? 'Rất tốt' : heart > 0.3 ? 'Đang lên' : 'Bắt đầu'} ${Math.round(heart * 100)}%`,
      badgeBg: heart > 0.6 ? 'rgba(74,138,90,.18)' : 'rgba(212,96,74,.18)',
    },
    {
      key: 'lung',
      label: 'Phổi',
      color: '#3A6EA8',
      tau: tauLung,
      tauBase: TAU_BASE.lung,
      pct: lung,
      status: lung > 0.7 ? 'Dung tích tốt' : lung > 0.4 ? 'Dung tích tăng' : lung > 0.1 ? 'Cilia tái tạo' : 'Khởi động',
      badge: `${lung > 0.7 ? 'Tuyệt vời' : lung > 0.4 ? 'Rất tốt' : lung > 0.1 ? 'Đang lên' : 'Bắt đầu'} ${Math.round(lung * 100)}%`,
      badgeBg: lung > 0.4 ? 'rgba(58,110,168,.18)' : 'rgba(193,126,42,.18)',
    },
    {
      key: 'brain',
      label: 'Não bộ',
      color: '#7C5EA6',
      tau: tauBrain,
      tauBase: TAU_BASE.brain,
      pct: brain,
      status: brain > 0.8 ? 'Cân bằng dopamine' : brain > 0.5 ? 'Cân bằng' : brain > 0.2 ? 'Đang xây lại' : 'Khởi động',
      badge: `${brain > 0.8 ? 'Xuất sắc' : brain > 0.5 ? 'Rất tốt' : brain > 0.2 ? 'Đang lên' : 'Bắt đầu'} ${Math.round(brain * 100)}%`,
      badgeBg: brain > 0.5 ? 'rgba(124,94,166,.18)' : 'rgba(193,126,42,.18)',
    },
    {
      key: 'immune',
      label: 'Miễn dịch',
      color: '#4A8A5A',
      tau: tauImmune,
      tauBase: TAU_BASE.immune,
      pct: immune,
      status: immune > 0.7 ? 'Kháng viêm cao' : immune > 0.4 ? 'Bạch cầu tăng' : immune > 0.15 ? 'Đang phục hồi' : 'Khởi động',
      badge: `${immune > 0.7 ? 'Xuất sắc' : immune > 0.4 ? 'Hồi phục tốt' : immune > 0.15 ? 'Đang lên' : 'Bắt đầu'} ${Math.round(immune * 100)}%`,
      badgeBg: immune > 0.4 ? 'rgba(74,138,90,.18)' : 'rgba(193,126,42,.18)',
    },
  ];
  return rings;
}

// ─── MILESTONES ─────────────────────────────────────────
export interface Milestone {
  key: string;
  name: string;
  desc: string;
  icon: string;
  atHours: number;
}

export const MILESTONES: Milestone[] = [
  { key: 'heart20', name: 'Tim mạch ổn định', desc: 'Sau 20 phút', icon: '❤️', atHours: 0.33 },
  { key: 'oxy8', name: 'Oxy máu hồi phục', desc: 'Sau 8 giờ', icon: '🫁', atHours: 8 },
  { key: 'heart24', name: 'Nguy cơ đau tim giảm', desc: 'Ngày 1', icon: '⚡', atHours: 24 },
  { key: 'taste48', name: 'Vị giác & khứu giác', desc: 'Ngày 2', icon: '✨', atHours: 48 },
  { key: 'war72', name: 'Vượt 72h Tử chiến', desc: 'Trận lớn nhất đã qua', icon: '🔥', atHours: 72 },
  { key: 'hold5', name: 'Vượt 5 ngày', desc: '48h Cầm cự hoàn thành', icon: '💪', atHours: 120 },
  { key: 'week1', name: 'Tuần đầu hoàn chỉnh', desc: '7 ngày — cột mốc vàng', icon: '🌟', atHours: 168 },
  { key: 'week2', name: 'Hai tuần — tuần hoàn máu tốt', desc: '14 ngày', icon: '🩸', atHours: 336 },
  { key: 'month1', name: 'Một tháng — hoàn thành 30 ngày', desc: 'Ngày 30', icon: '🏆', atHours: 720 },
  { key: 'month3', name: '3 tháng — phổi tự làm sạch', desc: 'Cilia tái tạo', icon: '🌿', atHours: 2160 },
  { key: 'year1', name: '1 năm — Ánh sáng', desc: 'Tim mạch nguy cơ giảm 50%', icon: '☀️', atHours: 8760 },
];

// ─── IDENTITY PROGRESSION ───────────────────────────────
export interface Identity {
  key: string;
  title: string;
  sub: string;
  icon: string;
  atHours: number;
  /** Phiên bản 'clinical' khi user chọn ngôn ngữ trung tính. */
  clinicalTitle?: string;
  clinicalSub?: string;
}

/**
 * IDENTITY V2 — 4 giai đoạn (cắt từ 7).
 *
 * Lý do UX: 7 stage tạo cảm giác hành trình "vô tận", user lứa tuổi 45+
 * Việt khó nhớ. 4 stage gọn — mỗi stage là một chuyển đổi tâm lý rõ ràng,
 * không phải trick "thêm milestone để engagement".
 *
 * Mốc khoa học giữ nguyên (Hughes 2007, Lally 2010, Surgeon General 2020):
 *   - 0h: Bắt đầu — quyết định đã đặt
 *   - 168h (7 ngày): Vượt tuần đầu — qua đỉnh withdrawal
 *   - 672h (28 ngày): Người không hút — habit reformation theo Lally
 *   - 8760h (1 năm): Đại sứ — CHD risk -50%, identity shift hoàn tất
 */
export const IDENTITY: Identity[] = [
  {
    key: 'newcomer',
    title: 'Người mới bắt đầu',
    sub: 'Giờ 0 — Quyết định đã đặt, bước đầu tiên dũng cảm nhất',
    clinicalTitle: 'Day 0 — Quitter',
    clinicalSub: 'Decision committed, first hour after last cigarette',
    icon: '🌱',
    atHours: 0,
  },
  {
    key: 'week1',
    title: 'Người vượt cám dỗ',
    sub: 'Ngày 7 — Qua đỉnh withdrawal, dopamine tự nhiên quay lại',
    clinicalTitle: 'Week 1 — Stabilized',
    clinicalSub: 'Past peak symptoms, out of highest-relapse zone',
    icon: '🌟',
    atHours: 168,
  },
  {
    key: 'reformed',
    title: 'Người không hút',
    sub: 'Ngày 28 — Habit cũ đã ngắt, đây là bạn của hôm nay',
    clinicalTitle: 'Day 28 — Reformed',
    clinicalSub: 'Habit reformation per Lally 2010 (median 66d)',
    icon: '🔨',
    atHours: 672,
  },
  {
    key: 'ambassador',
    title: 'Đại sứ Sol',
    sub: 'Năm 1+ — Tim mạch -50%, trở thành ngọn đuốc cho người khác',
    clinicalTitle: 'Year 1+ — Ambassador',
    clinicalSub: 'CHD risk -50%, identity shift complete',
    icon: '🧭',
    atHours: 8760,
  },
];

/** Lấy identity hiện tại theo language preference. */
export function identityAt(hours: number, language: PhaseLanguage = 'dramatic'): Identity {
  let current = IDENTITY[0];
  for (const id of IDENTITY) {
    if (hours >= id.atHours) current = id;
  }
  if (language === 'clinical' && current.clinicalTitle) {
    return {
      ...current,
      title: current.clinicalTitle,
      sub: current.clinicalSub ?? current.sub,
    };
  }
  return current;
}

// ─── SAVINGS CALCULATOR ─────────────────────────────────
export const DEFAULT_CIGS_PER_DAY = 15;
export const DEFAULT_PRICE_PER_CIG = 1500; // VND — trung bình điếu thuốc nội

export interface SavingsInput {
  cigsPerDay: number;    // default 15
  pricePerCig: number;   // VND, default 1500
}

export function calcSavings(
  hours: number,
  input: SavingsInput = { cigsPerDay: DEFAULT_CIGS_PER_DAY, pricePerCig: DEFAULT_PRICE_PER_CIG }
) {
  const cigsNotSmoked = Math.floor((hours / 24) * input.cigsPerDay);
  const amount = cigsNotSmoked * input.pricePerCig;
  const daily = input.cigsPerDay * input.pricePerCig;
  // Life extended: ~11 min gained per cigarette skipped (WHO estimate)
  const lifeMinutes = cigsNotSmoked * 11;
  return { cigsNotSmoked, amount, daily, lifeMinutes };
}

export function formatVnd(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1) + 'tr';
  if (n >= 1000) return Math.round(n / 1000) + 'k';
  return n.toString();
}

export function formatVndFull(n: number): string {
  return n.toLocaleString('vi-VN') + 'đ';
}

export function formatLifeAdded(minutes: number): string {
  if (minutes < 60) return `+${minutes}ph`;
  const hours = minutes / 60;
  if (hours < 24) return `+${hours.toFixed(1)}h`;
  const days = hours / 24;
  return `+${days.toFixed(1)}n`;
}
