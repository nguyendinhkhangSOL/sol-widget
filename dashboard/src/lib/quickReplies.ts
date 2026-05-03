// frontend/src/lib/quickReplies.ts
//
// Quick replies — câu hỏi ngắn quen thuộc với câu trả lời biên tập tay sẵn.
// Khi user bấm chip → render NGAY (không qua AI):
//   1. Tin nhắn user (label của chip)
//   2. Tin nhắn bot (answer được biên tập sẵn — nhanh, chính xác hơn AI)
//
// Mỗi chip có id (= slug từ DB); sau khi bấm sẽ lưu vào localStorage
// 'sol-qr-used' → lần truy cập sau câu đó không hiện nữa (trừ chip có
// reusable: true).
//
// ─── Nguồn dữ liệu (theo thứ tự ưu tiên) ──────────────────────────────────
//   1. Backend: GET /content/canned-replies   (founder biên tập qua /admin)
//   2. localStorage cache (offline / load chậm) — TTL 24h
//   3. Hardcoded fallback (cuối cùng) — đảm bảo widget không "trống" khi
//      backend chết.
//
// Triết lý:
//  • Câu hỏi ngắn — người 45+ nhìn 1 cái là hiểu, không cần đọc
//  • Trả lời 3-5 câu — đủ thực dụng, không lan man
//  • Khẳng định, không "có lẽ", không "tôi nghĩ" — họ cần bác sĩ thẳng thắn
//  • Mỗi câu trả lời kết thúc bằng 1 hành động cụ thể hoặc 1 câu trấn an

import type { User } from '../types';
import { daysSober, hoursSober } from './bodyClock';
import { api } from '../services/api';

export interface QuickReply {
  id: string;
  icon: string;
  label: string;
  /** Câu trả lời biên tập sẵn. Function-form chỉ dùng cho fallback hardcoded. */
  answer: string | ((user: User | null) => string);
  /** Link "Xem thêm" tới wiki (tuỳ chọn) — sẽ render dưới câu trả lời. */
  wikiUrl?: string | null;
  wikiLabel?: string | null;
  reusable?: boolean;
  /** Trigger phrases để match user message → render NGAY không qua AI. */
  triggers?: string[];
  /** Priority cho conflict (cao = thắng). Default 100. CRITICAL = 1000. */
  priority?: number;
  /** Min match score (0-1). Default 0.5. CRITICAL hạ xuống 0.3. */
  minScore?: number;
}

const STORAGE_KEY = 'sol-qr-used';
const CACHE_KEY = 'sol-qr-cache-v1';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

/* ─── Persistence: chip đã dùng ──────────────────────────────── */

export function getUsedIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markUsed(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const used = getUsedIds();
    if (!used.includes(id)) {
      used.push(id);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(used));
    }
  } catch {
    /* localStorage có thể bị disable — bỏ qua */
  }
}

export function resetUsed(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/* ─── Cache cho câu trả lời từ backend ───────────────────────── */

interface CacheShape {
  cachedAt: number;
  items: QuickReply[];
}

function readCache(): CacheShape | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheShape;
    if (!parsed?.cachedAt || !Array.isArray(parsed.items)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(items: QuickReply[]): void {
  if (typeof window === 'undefined') return;
  try {
    const data: CacheShape = { cachedAt: Date.now(), items };
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

/* ─── Fallback hardcoded (cuối cùng) ─────────────────────────── */
// Dùng khi backend chưa kịp trả về (lần load đầu, không có cache).
// Cũng giữ 2 chip "động" có function answer (ngày mấy / động lực) — dynamic
// chỉ chạy được trong client, không phù hợp cho DB.

const FALLBACK_REPLIES: QuickReply[] = [
  {
    id: 'them-thuoc',
    icon: '🤔',
    label: 'Tôi đang thèm thuốc',
    reusable: true,
    answer:
      'Cơn thèm chỉ kéo dài 3–5 phút rồi tự dịu. Bạn thử ngay 1 trong 3 cách: hít thở 4-7-8 ba lần · uống ngụm nước lạnh · đi 200 bước. Sau 5 phút quay lại đây — phần lớn cơn đã qua. Bạn không phải đấu một mình.',
  },
  {
    id: 'bo-cuoc',
    icon: '😢',
    label: 'Tôi muốn bỏ cuộc',
    answer:
      'Mệt là dấu hiệu cơ thể đang sửa, không phải dấu hiệu thất bại. Bạn không cần "cai cả đời" — chỉ cần không hút trong 1 giờ tới. Một giờ thôi.',
  },
  {
    id: 'bao-lau-het-them',
    icon: '⏳',
    label: 'Bao lâu thì hết thèm?',
    answer:
      'Cơn thèm cấp tính (thể chất): 3–7 ngày, đỉnh ở ngày 2-3. Cơn thèm tâm lý: 4–12 tuần. Sau 3 tháng, hầu như không còn nhớ. Bạn đang ở giai đoạn khó nhất.',
  },
  {
    id: 'qr-ngay-may',
    icon: '📅',
    label: 'Hôm nay ngày mấy rồi?',
    reusable: true,
    answer: (user) => {
      if (!user?.quitDate) {
        return 'Bạn chưa đặt ngày bắt đầu. Vào Cài đặt → "Ngày bắt đầu bỏ thuốc" để Sol đếm cùng bạn.';
      }
      const d = daysSober(user.quitDate);
      const h = hoursSober(user.quitDate);
      if (d === 0) {
        return `Hôm nay là Ngày 0 — bạn đã không hút trong ${h} giờ. Đây là 24 giờ khó nhất của hành trình.`;
      }
      if (d <= 3) return `Hôm nay là Ngày ${d} — đang trong giai đoạn 72h Tử chiến. Vượt được, 80% trận đánh đã qua.`;
      if (d <= 7) return `Hôm nay là Ngày ${d}/30. Tuần đầu — phổi bắt đầu tự làm sạch, vị giác quay lại.`;
      if (d <= 14) return `Hôm nay là Ngày ${d}/30. Tuần thứ 2 — tuần hoàn máu cải thiện rõ. Cơn thèm tâm lý là mặt trận chính từ đây.`;
      if (d <= 30) return `Hôm nay là Ngày ${d}/30. Đã đi được ${Math.round((d / 30) * 100)}% chặng. Sắp về đích!`;
      return `Hôm nay là Ngày ${d} — đã vượt mốc 30 ngày. Bạn không còn là người "đang cai" mà là người "đã bỏ".`;
    },
  },
  {
    id: 'qr-dong-luc',
    icon: '💪',
    label: 'Cho tôi thêm động lực',
    reusable: true,
    answer: (user) => {
      const d = user?.quitDate ? daysSober(user.quitDate) : 0;
      const streak = user?.checkinStreak ?? 0;
      const base =
        'Mỗi giờ bạn không hút, cơ thể đang sửa chữa thật. Nhịp tim chậm lại, oxy lên não đầy hơn, tế bào niêm mạc miệng đang lành. ';
      if (d === 0) return base + 'Bạn đã làm điều khó nhất: bắt đầu. Hôm nay không cần hoàn hảo — chỉ cần không hút.';
      if (streak >= 7) return base + `Bạn đã giữ chuỗi ${streak} ngày — đây không còn là thử nghiệm, đây là con người mới của bạn.`;
      return base + `Bạn đã đi được ${d} ngày — mỗi ngày kế tiếp dễ hơn 2%.`;
    },
  },
];

/* ─── Bộ nhớ trong-process cho lần truy cập trong cùng session ─ */
let inMemory: QuickReply[] | null = null;

/** Hai chip dynamic (ngày mấy / động lực) luôn được gắn thêm vào danh sách
 * từ DB — vì DB chỉ chứa text tĩnh, không tính được theo user. */
const DYNAMIC_REPLIES: QuickReply[] = FALLBACK_REPLIES.filter((r) =>
  typeof r.answer === 'function'
);

/** Khởi tạo: nạp cache nếu có rồi gọi API ngầm để refresh. */
export async function refreshQuickReplies(): Promise<void> {
  // 1. Cache local — dùng ngay nếu còn tươi
  const cached = readCache();
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    inMemory = [...cached.items, ...DYNAMIC_REPLIES];
  }

  // 2. Gọi backend (best-effort)
  try {
    const r = await api.getCannedReplies();
    const fromApi: QuickReply[] = r.items.map((it) => ({
      id: it.id,
      icon: it.icon,
      label: it.label,
      answer: it.answer,
      wikiUrl: it.wikiUrl ?? undefined,
      wikiLabel: it.wikiLabel ?? undefined,
      reusable: it.reusable,
      triggers: (it as any).triggers ?? [],
      priority: (it as any).priority ?? 100,
      minScore: (it as any).minScore ?? 0.5,
    }));
    inMemory = [...fromApi, ...DYNAMIC_REPLIES];
    writeCache(fromApi);
  } catch {
    // Backend chết → giữ cache hiện tại nếu có, không thì rớt về fallback
    if (!inMemory) inMemory = [...FALLBACK_REPLIES];
  }
}

/* ─── Bộ lọc cho hiển thị ─────────────────────────────────────── */

/**
 * Lấy danh sách chip để hiển thị, đã loại bỏ những câu user từng bấm.
 * Đồng bộ — trả về kết quả từ in-memory cache. Gọi `refreshQuickReplies()`
 * sớm trong app boot để đảm bảo có dữ liệu.
 */
export function pickQuickReplies(user: User | null, n = 8): QuickReply[] {
  void user;
  const source = inMemory ?? FALLBACK_REPLIES;
  const used = new Set(getUsedIds());
  return source.filter((q) => q.reusable || !used.has(q.id)).slice(0, n);
}

/** Resolve answer: function form (dynamic) hoặc string. */
export function resolveAnswer(qr: QuickReply, user: User | null): string {
  return typeof qr.answer === 'function' ? qr.answer(user) : qr.answer;
}

/**
 * Lấy ALL chip (kể cả đã used) dùng cho intent matcher.
 * Khác pickQuickReplies — không filter used vì matcher work trên triggers,
 * không phải button click.
 */
export function getAllChips(): QuickReply[] {
  return inMemory ?? FALLBACK_REPLIES;
}
