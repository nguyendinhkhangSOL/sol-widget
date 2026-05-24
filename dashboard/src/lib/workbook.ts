// Pure logic cho Sổ Tay 30 Ngày.
// Không side effects — test được dễ.

import type { CheckIn, WorkbookData, WorkbookDay } from '../types';

export type PhaseKey = 'chien_truong' | 'dong_tro_tan' | 'anh_binh_minh' | 'tu_do';

export type PhaseLanguage = 'dramatic' | 'clinical';

export interface PhaseInfo {
  key: PhaseKey;
  /** Tên dramatic (Việt hoá, hình ảnh) — mặc định */
  label: string;
  /** Tên clinical (y khoa, trung tính) — toggle qua user.settings.phaseLanguage */
  clinicalLabel: string;
  color: string; // darkest hue cho badge
  light: string; // bg nhạt cho card
}

export const PHASES: Record<PhaseKey, PhaseInfo> = {
  chien_truong:   { key: 'chien_truong',   label: 'Chiến Trường',  clinicalLabel: 'Withdrawal Week',   color: '#6D0808', light: '#FCE4EC' },
  dong_tro_tan:   { key: 'dong_tro_tan',   label: 'Đống Tro Tàn',  clinicalLabel: 'Slump Week',        color: '#BF360C', light: '#FBE9E7' },
  anh_binh_minh:  { key: 'anh_binh_minh',  label: 'Ánh Bình Minh', clinicalLabel: 'Habit Reset',       color: '#E65100', light: '#FFF3E0' },
  tu_do:          { key: 'tu_do',          label: 'Tự Do',         clinicalLabel: 'Consolidation',     color: '#2E7D32', light: '#E8F5E9' },
};

/** Lấy label của 1 phase theo language preference. */
export function phaseLabel(phase: PhaseInfo, language: PhaseLanguage = 'dramatic'): string {
  return language === 'clinical' ? phase.clinicalLabel : phase.label;
}

// Gradient 30 ngày — khớp với hero color band (từ đỏ đậm → xanh)
export const DAY_COLORS: string[] = [
  // 1-7: Chiến Trường (đỏ đậm → đỏ)
  '#6D0808', '#6D0808', '#6D0808', '#8B1A1A', '#8B1A1A', '#C62828', '#C62828',
  // 8-14: Đống Tro Tàn (cam đỏ → nâu cam)
  '#D84315', '#D84315', '#D84315', '#BF360C', '#BF360C', '#BF360C', '#BF360C',
  // 15-21: Ánh Bình Minh (cam sáng → vàng cam)
  '#E65100', '#E65100', '#E65100', '#F57F17', '#F57F17', '#F57F17', '#F57F17',
  // 22-30: Tự Do (vàng → xanh lá)
  '#F9A825', '#F9A825', '#F9A825', '#7CB342', '#7CB342', '#7CB342', '#2E7D32', '#2E7D32', '#2E7D32',
];

export function phaseForDay(day: number): PhaseInfo {
  if (day <= 7) return PHASES.chien_truong;
  if (day <= 14) return PHASES.dong_tro_tan;
  if (day <= 21) return PHASES.anh_binh_minh;
  return PHASES.tu_do;
}

export function colorForDay(day: number): string {
  const idx = Math.max(1, Math.min(30, day)) - 1;
  return DAY_COLORS[idx];
}

export interface WeekInfo {
  week: 1 | 2 | 3 | 4;
  days: number[]; // 1..7, 8..14, ...
  phase: PhaseInfo;
  title: string;
  blurb: string;
  ebookLink?: string;
}

export const WEEKS: WeekInfo[] = [
  {
    week: 1,
    days: [1, 2, 3, 4, 5, 6, 7],
    phase: PHASES.chien_truong,
    title: 'Tuần 1 · Chiến Trường',
    blurb: 'Cơn thèm mạnh nhất. Uống nhiều nước, hít thở sâu, gọi người hỗ trợ.',
    ebookLink: 'https://bothuocla.sol.vn/ebook',
  },
  {
    week: 2,
    days: [8, 9, 10, 11, 12, 13, 14],
    phase: PHASES.dong_tro_tan,
    title: 'Tuần 2 · Đống Tro Tàn',
    blurb: 'Thể chất nhẹ hơn nhưng đầu óc vẫn bấp bênh. Giữ thói quen, tránh tình huống gây thèm.',
    ebookLink: 'https://bothuocla.sol.vn/ebook',
  },
  {
    week: 3,
    days: [15, 16, 17, 18, 19, 20, 21],
    phase: PHASES.anh_binh_minh,
    title: 'Tuần 3 · Ánh Bình Minh',
    blurb: 'Receptor nicotine giảm mạnh. Lần đầu có ngày quên thuốc — bình thường.',
    ebookLink: 'https://bothuocla.sol.vn/ebook',
  },
  {
    week: 4,
    days: [22, 23, 24, 25, 26, 27, 28, 29, 30],
    phase: PHASES.tu_do,
    title: 'Tuần 4 · Tự Do',
    blurb: 'Không phải hết thèm — mà là có lựa chọn. Xây bản sắc mới.',
    ebookLink: 'https://bothuocla.sol.vn/ebook',
  },
];

// ─── Mood & craving options ─────────────────────────────────────────────

export const MOOD_OPTIONS = [
  { key: 'excellent', label: '😄 Xuất sắc', value: 5 },
  { key: 'good',      label: '😊 Tốt',      value: 4 },
  { key: 'neutral',   label: '😐 Bình thường', value: 3 },
  { key: 'hard',      label: '😤 Khó khăn', value: 2 },
] as const;

export type MoodKey = typeof MOOD_OPTIONS[number]['key'];

export function moodKeyFromValue(v: number | undefined): MoodKey | null {
  if (v == null) return null;
  if (v >= 5) return 'excellent';
  if (v >= 4) return 'good';
  if (v >= 3) return 'neutral';
  return 'hard';
}

export const HABIT_KEYS = [
  { key: 'no-smoke', label: '✅ Không hút thuốc' },
  { key: 'water',    label: '💧 Uống đủ nước' },
  { key: 'exercise', label: '🏃 Vận động' },
  { key: 'sleep',    label: '😴 Ngủ đủ giấc' },
  { key: 'mentor',   label: '🤖 Check-in Sol Mentor' },
] as const;

export type HabitKey = typeof HABIT_KEYS[number]['key'];

export const CRAVING_SITUATIONS = [
  '😤 Căng thẳng',
  '😴 Buồn chán',
  '😄 Vui vẻ',
  '🍺 Nhậu nhẹt',
  '☕ Sau cà phê',
  '😔 Cô đơn',
] as const;

export const CRAVING_RESULTS = ['✅ Vượt qua', '💪 Gần vượt qua', '❌ Hút 1 điếu'] as const;

// ─── Pre-quit checklists ────────────────────────────────────────────────

export interface PreQuitItem {
  key: string;
  title: string;
  sub: string;
}

export interface PreQuitPhase {
  key: '7ngay' | '3ngay' | '1ngay' | 'd0';
  badge: string;
  title: string;
  color: string;
  bg: string;
  items: PreQuitItem[];
}

export const PRE_QUIT_PHASES: PreQuitPhase[] = [
  {
    key: '7ngay',
    badge: '📅 7 Ngày Trước',
    title: '7 Ngày Trước',
    color: '#7B1FA2',
    bg: '#F3E5F5',
    items: [
      { key: 'p7_1', title: 'Đặt Ngày G (Quit Date) chính thức', sub: 'Ghi vào đây và thông báo cho người thân' },
      { key: 'p7_2', title: 'Nói cho ít nhất 1 người thân biết', sub: 'Người biết = người có thể giúp bạn' },
      { key: 'p7_3', title: 'Đọc Ebook Sol Chương 1–3', sub: 'Hiểu cơ chế nghiện — không thể chiến thắng kẻ thù mà không biết nó là ai' },
      { key: 'p7_4', title: 'Đăng ký bothuocla.sol.vn và kích hoạt Dashboard', sub: 'Để đếm ngược đến Giờ G từ đúng thời điểm' },
      { key: 'p7_5', title: 'Xác định 3 tình huống gây thèm chính của mình', sub: 'Khi nào bạn thường hút thuốc nhất?' },
      { key: 'p7_6', title: 'Chuẩn bị "vũ khí thay thế"', sub: 'Kẹo cao su, nước lạnh, trà xanh, hạt dưa…' },
      { key: 'p7_7', title: 'Lập kế hoạch "30 phút đầu tiên mỗi sáng"', sub: 'Buổi sáng là thời điểm nguy hiểm nhất — chuẩn bị trước' },
    ],
  },
  {
    key: '3ngay',
    badge: '⚡ 3 Ngày Trước',
    title: '3 Ngày Trước',
    color: '#C62828',
    bg: '#FFEBEE',
    items: [
      { key: 'p3_1', title: 'Giảm số điếu hút mỗi ngày (giảm 50%)', sub: 'Không cần ép — chỉ làm chậm lại' },
      { key: 'p3_2', title: 'Thử nghiệm 1 kỹ thuật thay thế cơn thèm', sub: 'Hít thở 4-7-8, đi bộ 5 phút, uống nước lạnh' },
      { key: 'p3_3', title: 'Chia sẻ mục tiêu lên cộng đồng Sol', sub: 'Tuyên bố công khai = cam kết mạnh hơn' },
      { key: 'p3_4', title: 'Dọn dẹp thuốc lá ra khỏi tầm với', sub: 'Bắt đầu giảm sự hiện diện của thuốc lá trong không gian sống' },
    ],
  },
  {
    key: '1ngay',
    badge: '🌅 1 Ngày Trước',
    title: '1 Ngày Trước',
    color: '#D84315',
    bg: '#FBE9E7',
    items: [
      { key: 'p1_1', title: 'Vứt bỏ TẤT CẢ thuốc lá và bật lửa trong nhà', sub: 'Không để "phòng hờ" — não sẽ tìm kiếm nó' },
      { key: 'p1_2', title: 'Đọc lại "Lý Do" của mình', sub: 'Nhắc nhở mình tại sao mình làm điều này' },
      { key: 'p1_3', title: 'Báo cho mạng lưới hỗ trợ: "Ngày mai là Ngày G"', sub: 'Họ sẽ check-in bạn vào sáng mai' },
      { key: 'p1_4', title: 'Ngủ sớm — cơ thể cần năng lượng cho ngày mai', sub: 'Mệt = ý chí yếu = dễ gục ngã hơn' },
    ],
  },
  {
    key: 'd0',
    badge: '🔥 Sáng Ngày G',
    title: 'Sáng Ngày G',
    color: '#6D0808',
    bg: '#FCE4EC',
    items: [
      { key: 'pd0_1', title: 'Uống 1 ly nước lớn NGAY khi thức dậy', sub: 'Trước khi làm bất cứ điều gì khác' },
      { key: 'pd0_2', title: 'Đọc to lời cam kết của mình', sub: 'Nghe tiếng mình nói = não tin hơn' },
      { key: 'pd0_3', title: 'Kích hoạt "Giờ G" trên Sol Dashboard', sub: 'Đồng hồ đếm bắt đầu — tiền tiết kiệm bắt đầu tích lũy' },
      { key: 'pd0_4', title: 'Nhắn tin cho 1 người hỗ trợ: "Hôm nay là Ngày G của tôi"', sub: 'Nói ra = không có đường lùi' },
      { key: 'pd0_5', title: 'Chat với Sol AI Mentor ngay bây giờ', sub: 'Nhận hướng dẫn cụ thể cho ngày đầu tiên của bạn' },
    ],
  },
];

// ─── Money math ─────────────────────────────────────────────────────────

export interface MoneyInputs {
  cigsPerDay: number;
  packPrice: number; // giá 1 bao (nghìn đồng) → × 1000 = VND
}

export function calcMoneySavings(inp: MoneyInputs) {
  const daily = Math.max(0, inp.cigsPerDay) / 20 * Math.max(0, inp.packPrice) * 1000; // VND per day
  return {
    day: daily,
    week: daily * 7,
    month: daily * 30,
    year: daily * 365,
    fiveYear: daily * 365 * 5,
  };
}

export function fmtVnd(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0đ';
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} tỷ`;
  if (n >= 1_000_000) return `${Math.round(n / 100_000) / 10}tr`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return `${Math.round(n)}đ`;
}

export function fmtVndFull(n: number): string {
  if (!Number.isFinite(n)) return '0đ';
  return Math.round(n).toLocaleString('vi-VN') + 'đ';
}

// ─── Milestones cuối mỗi tuần ─────────────────────────────────────────

export interface WeekMilestone {
  week: 1 | 2 | 3 | 4;
  title: string;
  desc: string;
  science: string;
  emoji: string;
  color: string;
}

export const WEEK_MILESTONES: WeekMilestone[] = [
  {
    week: 1,
    emoji: '🎉',
    title: '1 Tuần Không Thuốc!',
    desc: 'Mức CO trong máu đã bình thường. Vị giác và khứu giác bắt đầu phục hồi.',
    science: '🔬 Sau 7 ngày, cơ quan nội tạng bắt đầu quá trình tự sửa chữa đáng kể.',
    color: '#8B1A1A',
  },
  {
    week: 2,
    emoji: '🌱',
    title: '2 Tuần — Đỉnh Cơn Thèm Đã Qua',
    desc: 'Số receptor nicotine trong não đã giảm ~40%. Cơn thèm thưa dần, nhẹ dần.',
    science: '🔬 Tuần 2: huyết áp, nhịp tim ổn định. Tuần hoàn máu đã cải thiện 20–30%.',
    color: '#BF360C',
  },
  {
    week: 3,
    emoji: '✨',
    title: '3 Tuần — Lần Đầu Không Nghĩ Đến Thuốc',
    desc: 'Nhung mao phổi đang mọc lại. Tuần đầu có thể quên thuốc vài giờ liền.',
    science: '🔬 Não bộ tái cân bằng dopamine. Cảm giác vui tự nhiên đang quay về.',
    color: '#E65100',
  },
  {
    week: 4,
    emoji: '🏆',
    title: '30 Ngày — Kỳ Tích!',
    desc: 'Bạn vừa hoàn thành điều mà <10% người hút thuốc làm được. Phổi phục hồi ~30% cơ năng.',
    science: '🔬 Nguy cơ đau tim đã giảm 50% so với Giờ G. Bạn đang viết lại sinh học của mình.',
    color: '#2E7D32',
  },
];

export function weekOf(day: number): 1 | 2 | 3 | 4 {
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  return 4;
}

// ─── Empty workbook factory ──────────────────────────────────────────

export function emptyWorkbook(): WorkbookData {
  return {
    version: 1,
    prep: {},
    whys: ['', '', '', ''],
    roleModel: '',
    pledgeSignature: '',
    pledgeDate: '',
    network: [
      { name: '', relation: '', contact: '', role: '' },
      { name: '', relation: '', contact: '', role: '' },
      { name: '', relation: '', contact: '', role: '' },
    ],
    moneyGoal: '',
    cravings: [],
    triggers: [
      { trigger: '', plan: '' },
      { trigger: '', plan: '' },
      { trigger: '', plan: '' },
    ],
    relapseMantra: '',
    days: {},
    weeks: { 1: {}, 2: {}, 3: {}, 4: {} },
    postGoal: '',
    postShare: '',
    postLetter: '',
  };
}

// ─── Merge check-ins (widget) → day entries (workbook) ───────────────
// Check-in bên ngoài widget → auto populate habits.no-smoke + mood + cravingLevel.
// Không ghi đè nếu user đã điền tay (đảm bảo ưu tiên người dùng).

export function mergeCheckinsIntoDays(
  checkins: CheckIn[],
  existing: Record<number, WorkbookDay> = {},
): Record<number, WorkbookDay> {
  const out: Record<number, WorkbookDay> = { ...existing };
  for (const c of checkins) {
    const d = c.dayNumber;
    if (!d || d < 1 || d > 30) continue;
    const cur = out[d] ?? {};
    out[d] = {
      ...cur,
      date: cur.date || c.date?.slice(0, 10),
      cravingLevel: cur.cravingLevel ?? c.cravingIntensity,
      mood: cur.mood ?? c.mood,
      habits: {
        'no-smoke': cur.habits?.['no-smoke'] ?? !c.smoked,
        water: cur.habits?.water,
        exercise: cur.habits?.exercise,
        sleep: cur.habits?.sleep,
        mentor: cur.habits?.mentor,
      },
      note: cur.note || c.note || undefined,
    };
  }
  return out;
}

// ─── Progress (overall + per-week) ───────────────────────────────────

export function calcProgress(
  days: Record<number, WorkbookDay> = {},
): { done: number; total: number; pct: number } {
  let done = 0;
  for (let d = 1; d <= 30; d++) {
    if (days[d]?.habits?.['no-smoke']) done++;
  }
  return { done, total: 30, pct: Math.round((done / 30) * 100) };
}

export function calcWeekPct(
  week: 1 | 2 | 3 | 4,
  days: Record<number, WorkbookDay> = {},
): number {
  const start = (week - 1) * 7 + 1;
  const end = Math.min(start + 6, 30);
  let filled = 0;
  let count = 0;
  for (let d = start; d <= end; d++) {
    count++;
    const e = days[d];
    if (!e) continue;
    const cells = [
      e.habits?.['no-smoke'],
      e.habits?.water,
      e.habits?.exercise,
      e.habits?.sleep,
      e.habits?.mentor,
      e.mood !== undefined,
      e.cravingLevel !== undefined,
    ];
    filled += cells.filter(Boolean).length / cells.length;
  }
  return count ? Math.round((filled / count) * 100) : 0;
}

// ─── Debounced saver helper ──────────────────────────────────────────

export function createDebouncedSaver<T>(
  fn: (v: T) => void,
  delay = 800,
): (v: T) => void {
  let timer: any = null;
  let latest: T | null = null;
  return (v: T) => {
    latest = v;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      if (latest !== null) fn(latest as T);
      timer = null;
    }, delay);
  };
}
