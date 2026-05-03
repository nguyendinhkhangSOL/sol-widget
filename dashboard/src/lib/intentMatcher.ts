// frontend/src/lib/intentMatcher.ts
//
// Intent matcher — match user message với canned reply trigger phrases.
// Khi match thành công → render answer NGAY (không gọi AI).
//
// 3 lớp logic:
//   1. Normalize Vietnamese (lowercase + bỏ dấu + bỏ ký tự đặc biệt)
//   2. Score mỗi chip theo trigger overlap + priority
//   3. Threshold + tie-breaker (priority cao thắng) → return chip hoặc null
//
// Hiệu năng: O(n × m) với n = số chip (~30), m = số trigger trung bình (~5)
// = 150 string operations / message → < 1ms. Negligible.

import type { QuickReply } from './quickReplies';

/**
 * Normalize Vietnamese text cho match:
 *  - Lowercase
 *  - Bỏ dấu (NFD decompose + bỏ combining marks)
 *  - Đổi đ/Đ → d
 *  - Thay ký tự không phải chữ/số bằng space
 *  - Collapse whitespace
 */
export function normalizeVi(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    // Bỏ combining diacritical marks (range U+0300 → U+036F)
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Words cho thấy user PHỦ ĐỊNH triệu chứng — không match.
 * Vd "không thèm thuốc nữa" KHÔNG match chip them-thuoc.
 */
const NEGATION_PREFIXES = [
  'khong',
  'chua',
  'chang',
  'da het',
  'khong con',
  'hoan toan khong',
  'da khong con',
];

/**
 * Compute match score cho 1 chip với user message đã normalize.
 * Score = (số trigger match) / (số trigger tổng) + bonus exact phrase.
 * Range: 0.0 (no match) → 1.5+ (mọi trigger match + exact phrase).
 */
function computeScore(normalizedUserText: string, triggers: string[]): number {
  if (triggers.length === 0) return 0;

  let matches = 0;
  let exactPhraseBonus = 0;

  for (const trigger of triggers) {
    const normalizedTrigger = normalizeVi(trigger);
    if (!normalizedTrigger) continue;

    // Substring match — đủ cho đa số case
    if (normalizedUserText.includes(normalizedTrigger)) {
      matches++;

      // Bonus 0.3 nếu cụm từ xuất hiện riêng (word boundary)
      const re = new RegExp(`\\b${escapeRegex(normalizedTrigger)}\\b`);
      if (re.test(normalizedUserText)) {
        exactPhraseBonus = Math.max(exactPhraseBonus, 0.3);
      }
    }
  }

  if (matches === 0) return 0;

  // Score base = ratio matches/triggers, max 1.0
  const base = Math.min(1.0, matches / Math.max(2, triggers.length / 2));
  return base + exactPhraseBonus;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Detect negation: user phủ định trigger.
 * Heuristic đơn giản — kiểm tra prefix của câu (10 từ đầu).
 */
function isNegated(normalizedUserText: string): boolean {
  // Lấy 30 chars đầu để check phủ định
  const prefix = normalizedUserText.slice(0, 50);
  return NEGATION_PREFIXES.some((neg) => prefix.includes(neg));
}

export interface MatchResult {
  chip: QuickReply;
  score: number;
  matched: boolean;
}

/**
 * Tìm chip match best với user message.
 * Trả về null nếu không có chip nào pass threshold.
 *
 * Logic:
 *   1. Normalize user message
 *   2. Loop qua mọi chip có triggers, compute score
 *   3. Filter chip có score >= chip.minScore (default 0.5)
 *   4. Sort theo (priority desc, score desc) → chip thắng
 *   5. Apply negation filter — nếu user phủ định, skip non-CRITICAL chip
 *      (CRITICAL vẫn match — vì "không có máu" không nên skip cảnh báo y tế?
 *       Thực tế: "không khạc máu" KHÔNG nên match → check carefully)
 */
export function matchUserMessage(
  text: string,
  chips: QuickReply[],
): MatchResult | null {
  const trimmed = text.trim();
  if (trimmed.length < 2) return null;

  const normalized = normalizeVi(trimmed);
  if (normalized.length < 2) return null;

  // Quá ngắn không đủ context
  if (normalized.split(' ').length < 1) return null;

  const negated = isNegated(normalized);

  let best: MatchResult | null = null;

  for (const chip of chips) {
    const triggers = (chip as any).triggers ?? [];
    if (!Array.isArray(triggers) || triggers.length === 0) continue;

    const score = computeScore(normalized, triggers);
    const minScore = (chip as any).minScore ?? 0.5;
    const priority = (chip as any).priority ?? 100;

    if (score < minScore) continue;

    // Negation: nếu user phủ định, KHÔNG match (kể cả CRITICAL)
    // Vd "tôi không khạc máu" hoặc "đã hết thèm rồi" → skip
    if (negated) continue;

    if (
      !best ||
      priority > ((best.chip as any).priority ?? 100) ||
      (priority === ((best.chip as any).priority ?? 100) && score > best.score)
    ) {
      best = { chip, score, matched: true };
    }
  }

  return best;
}
