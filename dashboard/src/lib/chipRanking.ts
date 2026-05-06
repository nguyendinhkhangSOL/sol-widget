// dashboard/src/lib/chipRanking.ts
//
// Ranking chips để hiển thị 8-12 chip phù hợp nhất với CONTEXT user lúc đó.
// KHÁC với intentMatcher (match user message text) — đây là "display ranking"
// để chọn chip nào nên xuất hiện trong empty/idle state của chat.
//
// 3 trục ranking:
//   1. Priority CRITICAL (vd "tôi sắp hút lại") — luôn top, không filter
//   2. Day-aware — chip slug chứa "ngay-N" matching daysSober → boost lớn
//   3. Time-aware — đêm (22-6h) ưu tiên chip ngủ/khó ngủ; sáng ưu tiên
//                   chip động lực; chiều muộn (16-19h) ưu tiên chip thèm
//
// Ngoài ra:
//  - Bỏ chip non-reusable đã used (lưu trong localStorage 'sol-qr-used')
//  - Reusable chip ("thèm thuốc", "động lực") luôn pass filter
//  - Cap ở maxN, default 10
//
// Triết lý: KHÔNG cần DB schema mới — đơn giản dùng heuristic trên slug.
// Khi nào có nhiều data hơn (click rate per chip), chuyển sang ML ranking.

import type { QuickReply } from './quickReplies';
import type { User } from '../types';
import { daysSober } from './bodyClock';
import { getUsedIds } from './quickReplies';

/* ─── Heuristic: slug → category gợi ý ──────────────────────── */

const NIGHT_KEYWORDS = /\b(ngu|insom|toi|kho-ngu|mat-ngu|dem|khuya)\b/;
const MORNING_KEYWORDS = /\b(sang|bat-dau|moi-ngay|hom-nay|day-som)\b/;
const CRAVING_KEYWORDS = /\b(them|thuoc|crave|nicotine)\b/;
const MOOD_KEYWORDS = /\b(buon|chan|met|stress|lo-au|tieu-cuc)\b/;
const CRITICAL_KEYWORDS = /\b(sos|khan-cap|hut-lai|sap-hut|tu-bo|bo-cuoc|that-bai)\b/;

/* ─── Score 1 chip với context ──────────────────────────────── */

interface RankContext {
  daysSober: number;
  hour: number; // 0-23
  isNight: boolean; // 22h-6h
  isMorning: boolean; // 6h-10h
  isLateAfternoon: boolean; // 16h-19h
}

function scoreChip(chip: QuickReply, ctx: RankContext): number {
  const slug = chip.id.toLowerCase();
  const label = chip.label.toLowerCase();
  const haystack = `${slug} ${label}`;

  let score = chip.priority ?? 100;

  // 1. CRITICAL chip — boost cực mạnh, luôn ở top
  if ((chip.priority ?? 100) >= 1000 || CRITICAL_KEYWORDS.test(haystack)) {
    score += 5000;
  }

  // 2. Day-aware: slug chứa "ngay-N" matching daysSober → +500
  const dayMatch = slug.match(/\bngay-(\d+)\b/);
  if (dayMatch) {
    const chipDay = parseInt(dayMatch[1], 10);
    const diff = Math.abs(chipDay - ctx.daysSober);
    if (diff === 0) score += 500;
    else if (diff === 1) score += 250;
    else if (diff <= 3) score += 100;
  }

  // 3. Phase-of-journey context (D1-3 = đỉnh khó, D4-7 = ổn định, D8-30 = duy trì)
  if (ctx.daysSober <= 3) {
    // 3 ngày đầu: ưu tiên chip về thèm + động lực + cơ thể
    if (CRAVING_KEYWORDS.test(haystack)) score += 200;
    if (/dong-luc|tin-tuong|co-the|trien-vong/.test(haystack)) score += 150;
  } else if (ctx.daysSober <= 7) {
    // Tuần đầu: ưu tiên chip về tâm lý + thói quen
    if (MOOD_KEYWORDS.test(haystack)) score += 150;
    if (/thoi-quen|tam-ly|cam-xuc/.test(haystack)) score += 120;
  } else if (ctx.daysSober <= 30) {
    // Tháng đầu: ưu tiên duy trì + tránh tái phát
    if (/duy-tri|tai-phat|cam-do|gap-ban-cu/.test(haystack)) score += 150;
  }

  // 4. Time-of-day boost
  if (ctx.isNight && NIGHT_KEYWORDS.test(haystack)) score += 200;
  if (ctx.isMorning && MORNING_KEYWORDS.test(haystack)) score += 100;
  if (ctx.isLateAfternoon && CRAVING_KEYWORDS.test(haystack)) score += 150;

  // 5. Reusable bonus — chip "luôn dùng được" như "động lực", "thèm thuốc"
  if (chip.reusable) score += 50;

  return score;
}

/* ─── Public: rank list chips theo context ─────────────────── */

export interface RankedChip extends QuickReply {
  _score: number;
}

export function rankChips(
  chips: QuickReply[],
  user: User | null,
  options: {
    maxN?: number;
    now?: Date;
    criticalMode?: 'mix' | 'exclude' | 'cap1';
  } = {},
): RankedChip[] {
  const maxN = options.maxN ?? 10;
  const now = options.now ?? new Date();
  const hour = now.getHours();
  const criticalMode = options.criticalMode ?? 'mix';

  const ctx: RankContext = {
    daysSober: user?.quitDate ? daysSober(user.quitDate) : 0,
    hour,
    isNight: hour >= 22 || hour < 6,
    isMorning: hour >= 6 && hour < 10,
    isLateAfternoon: hour >= 16 && hour < 19,
  };

  const used = new Set(getUsedIds());

  const isCritical = (c: QuickReply) => {
    if ((c.priority ?? 100) >= 1000) return true;
    const haystack = `${c.id.toLowerCase()} ${c.label.toLowerCase()}`;
    return CRITICAL_KEYWORDS.test(haystack);
  };

  let pool = chips
    .filter((chip) => chip.reusable || !used.has(chip.id))
    .map((chip) => ({ ...chip, _score: scoreChip(chip, ctx) }));

  if (criticalMode === 'exclude') {
    pool = pool.filter((c) => !isCritical(c));
  } else if (criticalMode === 'cap1') {
    const critical = pool.filter(isCritical).slice(0, 1);
    const normal = pool.filter((c) => !isCritical(c));
    pool = [...normal, ...critical];
  }

  return pool.sort((a, b) => b._score - a._score).slice(0, maxN);
}
