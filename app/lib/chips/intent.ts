/**
 * Intent Matcher — match user message → CHIP canned reply
 * Ported from frontend/src/lib/intentMatcher.ts
 */

import type { QuickReply } from './types';

const NEGATION_PREFIXES = ['khong', 'chua', 'chang', 'da het', 'khong con', 'hoan toan khong', 'da khong con'];

/**
 * Normalize Vietnamese text:
 *  - Lowercase
 *  - Strip diacritics (NFD + remove combining marks)
 *  - đ → d
 *  - Non-alphanumeric → space
 *  - Collapse whitespace
 */
export function normalizeVi(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // combining marks
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function computeScore(normalizedUserText: string, triggers: string[]): number {
  if (triggers.length === 0) return 0;
  let matches = 0;
  let exactPhraseBonus = 0;

  for (const trigger of triggers) {
    const normalizedTrigger = normalizeVi(trigger);
    if (!normalizedTrigger) continue;
    if (normalizedUserText.includes(normalizedTrigger)) {
      matches++;
      const re = new RegExp(`\\b${escapeRegex(normalizedTrigger)}\\b`);
      if (re.test(normalizedUserText)) {
        exactPhraseBonus = Math.max(exactPhraseBonus, 0.3);
      }
    }
  }

  if (matches === 0) return 0;
  const base = Math.min(1.0, matches / Math.max(2, triggers.length / 2));
  return base + exactPhraseBonus;
}

function isNegated(normalizedUserText: string): boolean {
  const prefix = normalizedUserText.slice(0, 50);
  return NEGATION_PREFIXES.some((neg) => prefix.includes(neg));
}

export interface MatchResult {
  chip: QuickReply;
  score: number;
}

/**
 * Find best CHIP matching user message.
 * Returns null if no chip passes threshold or user message is negated.
 */
export function matchUserMessage(text: string, chips: QuickReply[]): MatchResult | null {
  const trimmed = text.trim();
  if (trimmed.length < 2) return null;

  const normalized = normalizeVi(trimmed);
  if (normalized.length < 2) return null;
  if (isNegated(normalized)) return null;

  let best: MatchResult | null = null;

  for (const chip of chips) {
    const triggers = chip.triggers ?? [];
    if (!triggers.length) continue;

    const score = computeScore(normalized, triggers);
    const minScore = chip.minScore ?? 0.5;
    const priority = chip.priority ?? 100;

    if (score < minScore) continue;

    if (!best || priority > (best.chip.priority ?? 100) || (priority === (best.chip.priority ?? 100) && score > best.score)) {
      best = { chip, score };
    }
  }

  return best;
}
