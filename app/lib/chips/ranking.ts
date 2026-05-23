/**
 * CHIP Ranking — score chips for "suggested" UI display
 * Ported from frontend/src/lib/chipRanking.ts
 *
 * 3 axes:
 *   - Priority (base score)
 *   - Day-aware (slug 'ngay-N' matches user's day)
 *   - Time-aware (night 22-6h → sleep chips, morning → motivation, afternoon → craving)
 */

import type { QuickReply, ChipRankingContext } from './types';

const CRITICAL_PRIORITY = 1000;
const CRITICAL_BOOST = 5000;
const SOS_REGEX = /sos|khan-cap|hut-lai|sap-hut|bo-cuoc|that-bai|them-thuoc/;

const REUSABLE_BOOST = 50;

interface ScoredChip {
  chip: QuickReply;
  score: number;
}

function getCurrentHour(): number {
  // Default: Asia/Ho_Chi_Minh
  return new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    hour12: false
  }) as any;
}

function isCritical(chip: QuickReply): boolean {
  if ((chip.priority ?? 100) >= CRITICAL_PRIORITY) return true;
  if (SOS_REGEX.test(chip.id)) return true;
  return false;
}

function dayAwareBoost(chip: QuickReply, daysSober?: number): number {
  if (daysSober == null) return 0;

  // Match slug "ngay-N" → boost dựa trên |daysSober - N|
  const match = chip.id.match(/ngay-(\d+)/);
  if (match) {
    const chipDay = parseInt(match[1], 10);
    const diff = Math.abs(daysSober - chipDay);
    if (diff === 0) return 500;
    if (diff === 1) return 250;
    if (diff <= 3) return 100;
    return 0;
  }

  // Phase boost theo category
  if (chip.category === 'sos' || chip.category === 'craving') {
    if (daysSober <= 3) return 200;
    if (daysSober <= 7) return 150;
  }
  if (chip.category === 'pillar') {
    if (daysSober > 7 && daysSober <= 30) return 100;
  }

  return 0;
}

function timeAwareBoost(chip: QuickReply, hour: number): number {
  // Night 22-6h: ngủ, khuya
  if (hour >= 22 || hour < 6) {
    if (chip.id.includes('ngu') || chip.id.includes('khuya') || chip.id.includes('night')) return 200;
  }
  // Morning 6-10h: động lực, ngày mới
  if (hour >= 6 && hour < 10) {
    if (chip.id.includes('dong-luc') || chip.id.includes('sang') || chip.id.includes('morning')) return 100;
  }
  // Late afternoon 16-19h: thèm, bia rượu
  if (hour >= 16 && hour < 19) {
    if (chip.id.includes('them') || chip.id.includes('nhau') || chip.category === 'craving') return 150;
  }
  return 0;
}

/**
 * Rank chips theo 3 axes — return top N
 */
export function rankChips(chips: QuickReply[], ctx: ChipRankingContext = {}, topN = 6): QuickReply[] {
  const hour = ctx.currentHour ?? getCurrentHour();
  const daysSober = ctx.daysSober;
  const usedIds = new Set(ctx.usedChipIds ?? []);

  let pool = chips;

  if (ctx.showOnlyCategory) {
    pool = pool.filter((c) => c.category === ctx.showOnlyCategory);
  }

  // Filter mode: exclude_used
  if (ctx.mode === 'exclude_used') {
    pool = pool.filter((c) => !usedIds.has(c.id));
  }

  const scored: ScoredChip[] = pool.map((chip) => {
    let score = chip.priority ?? 100;

    if (isCritical(chip)) score += CRITICAL_BOOST;
    score += dayAwareBoost(chip, daysSober);
    score += timeAwareBoost(chip, hour);
    if (chip.reusable) score += REUSABLE_BOOST;

    return { chip, score };
  });

  scored.sort((a, b) => b.score - a.score);

  // Mode: cap1_per_category — top 1 per category
  if (ctx.mode === 'cap1_per_category') {
    const seen = new Set<string>();
    const result: QuickReply[] = [];
    for (const s of scored) {
      const cat = s.chip.category ?? 'default';
      if (seen.has(cat)) continue;
      seen.add(cat);
      result.push(s.chip);
      if (result.length >= topN) break;
    }
    return result;
  }

  return scored.slice(0, topN).map((s) => s.chip);
}
