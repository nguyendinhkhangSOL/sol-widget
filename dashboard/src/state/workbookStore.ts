// Zustand store cho Sổ Tay 30 Ngày.
// Nguồn dữ liệu chính là localStorage (nhanh, offline-first).
// Ngày khi có backend model, swap hook load/save sang API là xong — schema không đổi.

import { create } from 'zustand';

// ─── Types ──────────────────────────────────────────────────────────────

export interface WorkbookNetworkRow {
  name: string;
  relation: string;
  contact: string;
  role: string;
}

export interface WorkbookCravingLogRow {
  date: string;
  time: string;
  situation: string;
  emotion: string;
  action: string;
  result: string;
}

export interface WorkbookDayLog {
  date?: string;
  habits: {
    'no-smoke'?: boolean;
    water?: boolean;
    exercise?: boolean;
    sleep?: boolean;
    mentor?: boolean;
  };
  mood?: number;       // 2–5 (hard..excellent)
  craving?: number;    // 0–10 (0 = chưa đánh dấu)
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

export interface WorkbookIdentity {
  q1: string; // "Tôi là ai khi không có thuốc lá trong tay?"
  q2: string; // "Người không hút làm gì khi stress?"
  q3: string; // "5 năm tới tôi muốn được biết là người gì?"
  q4: string; // "Vợ/con tôi muốn tôi trở thành người gì?"
  q5: string; // "Câu nào tôi muốn người khác nói về tôi?"
  q6: string; // "Một người không hút bữa nhậu thế nào?"
  q7: string; // "Đến cuối đời, di sản tôi để lại là gì?"
}

export interface WorkbookData {
  // Header
  userName: string;
  quitDate: string;

  // Pre-quit checklists: { [itemKey]: true }
  preCheck: Record<string, boolean>;

  // Section 1 — Why
  why1: string;
  why2: string;
  why3: string;
  why4: string;
  roleModel: string;

  // Section "Bản Thân" — Identity reframe (Allen Carr-inspired)
  // 7 prompts user trả lời trước Q-Day, replay khi craving Phase 3-4
  identity: WorkbookIdentity;

  // Section 2 — Pledge
  pledgeSig: string;
  pledgeDate: string;

  // Section 3 — Network (3 rows cố định, có thể thêm)
  network: WorkbookNetworkRow[];

  // Section 4 — Money
  cigsDay: number;
  packPrice: number; // giá 1 bao (nghìn đồng)
  moneyGoal: string;

  // Section 5 — Craving log
  cravingLog: WorkbookCravingLogRow[];

  // Section 6 — Relapse plan
  trig1T: string; trig1P: string;
  trig2T: string; trig2P: string;
  trig3T: string; trig3P: string;
  relapseMantra: string;

  // 30-day logs
  days: Record<number, WorkbookDayLog>;

  // Week reflections
  weeks: {
    1?: WorkbookWeekReflection;
    2?: WorkbookWeekReflection;
    3?: WorkbookWeekReflection;
    4?: WorkbookWeekReflection;
  };

  // Post-30
  postGoal: string;
  postShare: string;
  postLetter: string;

  // Meta
  updatedAt: number;
}

function emptyDay(): WorkbookDayLog {
  return { habits: {} };
}

function emptyData(): WorkbookData {
  return {
    userName: '',
    quitDate: '',
    preCheck: {},
    why1: '', why2: '', why3: '', why4: '',
    roleModel: '',
    identity: { q1: '', q2: '', q3: '', q4: '', q5: '', q6: '', q7: '' },
    pledgeSig: '', pledgeDate: '',
    network: [
      { name: '', relation: '', contact: '', role: '' },
      { name: '', relation: '', contact: '', role: '' },
      { name: '', relation: '', contact: '', role: '' },
    ],
    cigsDay: 15,
    packPrice: 25,
    moneyGoal: '',
    cravingLog: Array.from({ length: 5 }, () => ({
      date: '', time: '', situation: '', emotion: '😤 Căng thẳng', action: '', result: '✅ Vượt qua',
    })),
    trig1T: '', trig1P: '',
    trig2T: '', trig2P: '',
    trig3T: '', trig3P: '',
    relapseMantra: '',
    days: {},
    weeks: {},
    postGoal: '', postShare: '', postLetter: '',
    updatedAt: 0,
  };
}

// ─── Persistence ────────────────────────────────────────────────────────

const STORAGE_KEY = 'sol_workbook_v1';

function loadFromStorage(): WorkbookData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    const parsed = JSON.parse(raw) as Partial<WorkbookData>;
    const base = emptyData();
    return {
      ...base,
      ...parsed,
      // Defensive merge cho nested object — schema cũ chưa có identity,
      // hoặc identity có thể null/partial → merge vào base
      identity: { ...base.identity, ...(parsed.identity ?? {}) },
    };
  } catch {
    return emptyData();
  }
}

let saveTimer: number | null = null;
function scheduleSave(data: WorkbookData) {
  if (saveTimer != null) window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // quota exceeded — fail silent
    }
  }, 500);
}

// ─── Store ──────────────────────────────────────────────────────────────

interface WorkbookStore {
  data: WorkbookData;
  saveStatus: 'idle' | 'saving' | 'saved';

  // Generic field setter — mutates any top-level field
  set<K extends keyof WorkbookData>(key: K, value: WorkbookData[K]): void;

  // Pre-quit checklist toggle
  togglePreCheck: (key: string) => void;

  // Network
  setNetworkCell: (row: number, field: keyof WorkbookNetworkRow, value: string) => void;
  addNetworkRow: () => void;

  // Craving log
  setCravingLogCell: (row: number, field: keyof WorkbookCravingLogRow, value: string) => void;
  addCravingLogRow: () => void;

  // Day log
  setDayField: (day: number, field: keyof WorkbookDayLog, value: any) => void;
  toggleHabit: (day: number, habit: keyof WorkbookDayLog['habits']) => void;
  setDayMood: (day: number, mood: number) => void;
  setDayCraving: (day: number, craving: number) => void;

  // Week reflection
  setWeekField: (week: 1 | 2 | 3 | 4, field: keyof WorkbookWeekReflection, value: string) => void;

  // Import / export / reset
  exportJSON: () => string;
  importJSON: (json: string) => boolean;
  reset: () => void;
}

function commit(data: WorkbookData, set: (s: Partial<WorkbookStore>) => void) {
  const next = { ...data, updatedAt: Date.now() };
  set({ data: next, saveStatus: 'saving' });
  scheduleSave(next);
  // Flip to "saved" after the debounce fires
  window.setTimeout(() => set({ saveStatus: 'saved' }), 700);
}

export const useWorkbook = create<WorkbookStore>((set, get) => ({
  data: loadFromStorage(),
  saveStatus: 'idle',

  set: (key, value) => {
    const data = { ...get().data, [key]: value };
    commit(data, set);
  },

  togglePreCheck: (key) => {
    const cur = get().data;
    const preCheck = { ...cur.preCheck, [key]: !cur.preCheck[key] };
    commit({ ...cur, preCheck }, set);
  },

  setNetworkCell: (row, field, value) => {
    const cur = get().data;
    const network = cur.network.map((r, i) => (i === row ? { ...r, [field]: value } : r));
    commit({ ...cur, network }, set);
  },
  addNetworkRow: () => {
    const cur = get().data;
    commit({ ...cur, network: [...cur.network, { name: '', relation: '', contact: '', role: '' }] }, set);
  },

  setCravingLogCell: (row, field, value) => {
    const cur = get().data;
    const cravingLog = cur.cravingLog.map((r, i) => (i === row ? { ...r, [field]: value } : r));
    commit({ ...cur, cravingLog }, set);
  },
  addCravingLogRow: () => {
    const cur = get().data;
    commit(
      {
        ...cur,
        cravingLog: [
          ...cur.cravingLog,
          { date: '', time: '', situation: '', emotion: '😤 Căng thẳng', action: '', result: '✅ Vượt qua' },
        ],
      },
      set,
    );
  },

  setDayField: (day, field, value) => {
    const cur = get().data;
    const prev = cur.days[day] ?? emptyDay();
    const next = { ...prev, [field]: value };
    commit({ ...cur, days: { ...cur.days, [day]: next } }, set);
  },

  toggleHabit: (day, habit) => {
    const cur = get().data;
    const prev = cur.days[day] ?? emptyDay();
    const habits = { ...prev.habits, [habit]: !prev.habits[habit] };
    commit({ ...cur, days: { ...cur.days, [day]: { ...prev, habits } } }, set);
  },

  setDayMood: (day, mood) => {
    const cur = get().data;
    const prev = cur.days[day] ?? emptyDay();
    commit({ ...cur, days: { ...cur.days, [day]: { ...prev, mood } } }, set);
  },

  setDayCraving: (day, craving) => {
    const cur = get().data;
    const prev = cur.days[day] ?? emptyDay();
    commit({ ...cur, days: { ...cur.days, [day]: { ...prev, craving } } }, set);
  },

  setWeekField: (week, field, value) => {
    const cur = get().data;
    const prev = cur.weeks[week] ?? {};
    const next = { ...prev, [field]: value };
    commit({ ...cur, weeks: { ...cur.weeks, [week]: next } }, set);
  },

  exportJSON: () => JSON.stringify(get().data, null, 2),

  importJSON: (json) => {
    try {
      const parsed = JSON.parse(json) as Partial<WorkbookData>;
      const base = emptyData();
      const data = {
        ...base,
        ...parsed,
        identity: { ...base.identity, ...(parsed.identity ?? {}) },
      };
      commit(data, set);
      return true;
    } catch {
      return false;
    }
  },

  reset: () => {
    const data = emptyData();
    commit(data, set);
  },
}));

// ─── Helpers exposed for components ─────────────────────────────────────

export function preCheckStats(data: WorkbookData, phaseKey: string, totalItems: number) {
  const keys = Object.keys(data.preCheck).filter((k) => data.preCheck[k] && k.startsWith(phasePrefix(phaseKey)));
  return { done: keys.length, total: totalItems };
}

function phasePrefix(phaseKey: string): string {
  // Match key prefix → item key pattern dùng trong lib/workbook.ts
  switch (phaseKey) {
    case '7ngay': return 'p7_';
    case '3ngay': return 'p3_';
    case '1ngay': return 'p1_';
    case 'd0':    return 'pd0_';
    default:      return '';
  }
}

/** Số ngày đã check "Không hút thuốc" trong 30 ngày */
export function daysComplete(data: WorkbookData): number {
  let count = 0;
  for (let d = 1; d <= 30; d++) {
    if (data.days[d]?.habits['no-smoke']) count++;
  }
  return count;
}

/** % hoàn thành trong 1 tuần (dựa trên "no-smoke") */
export function weekProgressPct(data: WorkbookData, week: 1 | 2 | 3 | 4): number {
  const start = (week - 1) * 7 + 1;
  const end = week === 4 ? 30 : week * 7;
  const total = end - start + 1;
  let done = 0;
  for (let d = start; d <= end; d++) {
    if (data.days[d]?.habits['no-smoke']) done++;
  }
  return Math.round((done / total) * 100);
}
