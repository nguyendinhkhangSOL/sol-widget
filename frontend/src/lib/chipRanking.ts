// frontend/src/lib/chipRanking.ts
//
// Mirror dashboard/src/lib/chipRanking.ts. Khi đổi gì, đồng bộ cả 2.
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
// Triết lý: KHÔNG cần DB schema mới — đơn giản dùng heuristic trên slug.

import type { QuickReply } from './quickReplies';
import type { User } from '../types';
import { daysSober } from './bodyClock';
import { getUsedIds } from './quickReplies';

const NIGHT_KEYWORDS = /\b(ngu|insom|toi|kho-ngu|mat-ngu|dem|khuya)\b/;
const MORNING_KEYWORDS = /\b(sang|bat-dau|moi-ngay|hom-nay|day-som)\b/;
const CRAVING_KEYWORDS = /\b(them|thuoc|crave|nicotine)\b/;
const MOOD_KEYWORDS = /\b(buon|chan|met|stress|lo-au|tieu-cuc)\b/;
const CRITICAL_KEYWORDS = /\b(sos|khan-cap|hut-lai|sap-hut|tu-bo|bo-cuoc|that-bai)\b/;

interface RankContext {
  daysSober: number;
  hour: number;
  isNight: boolean;
  isMorning: boolean;
  isLateAfternoon: boolean;
}

function scoreChip(chip: QuickReply, ctx: RankContext): number {
  const slug = chip.id.toLowerCase();
  const label = chip.label.toLowerCase();
  const haystack = `${slug} ${label}`;

  let score = chip.priority ?? 100;

  // 1. CRITICAL chip — boost cực mạnh, luôn top
  if ((chip.priority ?? 100) >= 1000 || CRITICAL_KEYWORDS.test(haystack)) {
    score += 5000;
  }

  // 2. Day-aware
  const dayMatch = slug.match(/\bngay-(\d+)\b/);
  if (dayMatch) {
    const chipDay = parseInt(dayMatch[1], 10);
    const diff = Math.abs(chipDay - ctx.daysSober);
    if (diff === 0) score += 500;
    else if (diff === 1) score += 250;
    else if (diff <= 3) score += 100;
  }

  // 3. Phase-of-journey context
  if (ctx.daysSober <= 3) {
    if (CRAVING_KEYWORDS.test(haystack)) score += 200;
    if (/dong-luc|tin-tuong|co-the|trien-vong/.test(haystack)) score += 150;
  } else if (ctx.daysSober <= 7) {
    if (MOOD_KEYWORDS.test(haystack)) score += 150;
    if (/thoi-quen|tam-ly|cam-xuc/.test(haystack)) score += 120;
  } else if (ctx.daysSober <= 30) {
    if (/duy-tri|tai-phat|cam-do|gap-ban-cu/.test(haystack)) score += 150;
  }

  // 4. Time-of-day boost
  if (ctx.isNight && NIGHT_KEYWORDS.test(haystack)) score += 200;
  if (ctx.isMorning && MORNING_KEYWORDS.test(haystack)) score += 100;
  if (ctx.isLateAfternoon && CRAVING_KEYWORDS.test(haystack)) score += 150;

  // 5. Reusable bonus
  if (chip.reusable) score += 50;

  return score;
}

export interface RankedChip extends QuickReply {
  _score: number;
}

export function rankChips(
  chips: QuickReply[],
  user: User | null,
  options: {
    maxN?: number;
    now?: Date;
    /**
     * Lọc behavior với CRITICAL chips (priority ≥ 1000):
     *   'mix' (default) — cho phép critical chips top-rank, dùng cho empty state grid
     *                     (1-2 critical mix với 6-7 chip thường = escape hatch)
     *   'exclude'       — bỏ hẳn critical chips, dùng cho sticky compact bar sau message
     *                     (escape hatch đã ở header SOS button — không cần lặp ở bar)
     *   'cap1'          — giữ tối đa 1 critical ở vị trí thấp nhất
     */
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

  // Helper: chip có phải CRITICAL không (priority ≥ 1000 HOẶC slug/label match
  // CRITICAL_KEYWORDS regex). Cần check cả 2 vì content seeded có chip
  // "sap-hut-lai" priority 300 nhưng slug match "hut-lai" → vẫn là crisis.
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
