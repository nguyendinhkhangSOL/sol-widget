// backend/src/zalo/intentRouter.ts
//
// Khi user gửi tin vào OA Sol qua Zalo, intent router quyết định:
//   1. Match với 42 cannedReplies có sẵn (cùng logic widget)
//   2. Nếu match score ≥ 0.6 → trả reply có sẵn (instant)
//   3. Nếu không match → fallback Claude AI (Sol Đồng hành)
//   4. Nếu phát hiện CRISIS keyword → escalate Khang qua Telegram
//
// Reply chat OA 1-1 KHÔNG bị Zalo review nội dung → có thể dùng từ "y tế đầy đủ".

import { prisma } from '../db';
import { logger } from '../utils/logger';

// ─── Crisis detection ──────────────────────────────────────────────────
// Keywords báo hiệu user đang khủng hoảng → escalate Khang
const CRISIS_KEYWORDS = [
  // Khủng hoảng cai thuốc
  'sắp hút', 'không kiềm', 'kìm', 'chịu không nổi', 'thua rồi',
  'bỏ cuộc', 'không nổi', 'thèm chết được', 'cứu',
  // Y tế khẩn
  'khạc máu', 'ho ra máu', 'đau ngực dữ', 'khó thở dữ',
  // Tâm lý khẩn
  'tự hại', 'tự tử', 'không muốn sống', 'kết thúc', 'không thiết',
];

export type IntentMatchResult =
  | { type: 'CANNED'; cannedSlug: string; reply: string; wikiUrl?: string }
  | { type: 'AI_FALLBACK'; userText: string }
  | { type: 'CRISIS'; userText: string; matchedKeyword: string };

/**
 * Normalize tiếng Việt — lowercase + bỏ dấu (để fuzzy match với triggers).
 */
function normalizeVi(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Detect crisis keywords trong user message.
 */
function detectCrisis(userText: string): string | null {
  const lower = userText.toLowerCase();
  for (const kw of CRISIS_KEYWORDS) {
    if (lower.includes(kw)) return kw;
  }
  return null;
}

/**
 * Match score giữa user input và triggers của 1 canned reply.
 * Score 0-1: 1 = match hoàn hảo (full phrase contains), 0 = không match.
 */
function matchScore(userTextNorm: string, triggers: string[]): number {
  if (!triggers || triggers.length === 0) return 0;
  let bestScore = 0;
  for (const trigger of triggers) {
    const trigNorm = normalizeVi(trigger);
    if (!trigNorm) continue;
    if (userTextNorm.includes(trigNorm)) {
      // Full match → score cao theo length của trigger (trigger dài match → tin cậy cao hơn)
      const score = Math.min(1, 0.5 + (trigNorm.length / userTextNorm.length) * 0.5);
      bestScore = Math.max(bestScore, score);
    } else {
      // Partial match: tách từ, count overlap
      const trigWords = trigNorm.split(' ');
      const userWords = userTextNorm.split(' ');
      const overlap = trigWords.filter(w => userWords.includes(w)).length;
      if (overlap > 0 && trigWords.length > 0) {
        const score = (overlap / trigWords.length) * 0.5; // partial cap 0.5
        bestScore = Math.max(bestScore, score);
      }
    }
  }
  return bestScore;
}

/**
 * Route user message vào 1 trong 3 outcome.
 *
 * @param userText Tin user gửi vào OA Sol
 * @returns IntentMatchResult với type CANNED/AI_FALLBACK/CRISIS
 */
export async function routeUserMessage(userText: string): Promise<IntentMatchResult> {
  // 1. Crisis detection — ưu tiên cao nhất
  const crisisKw = detectCrisis(userText);
  if (crisisKw) {
    return { type: 'CRISIS', userText, matchedKeyword: crisisKw };
  }

  // 2. Match canned replies
  const cannedReplies = await prisma.cannedReply.findMany({
    where: { enabled: true },
    select: { slug: true, label: true, answer: true, triggers: true, priority: true, minScore: true, wikiUrl: true },
    orderBy: { priority: 'desc' },
  });

  const userNorm = normalizeVi(userText);
  let bestMatch: { slug: string; reply: string; wikiUrl?: string; score: number } | null = null;

  for (const cr of cannedReplies) {
    const score = matchScore(userNorm, cr.triggers ?? []);
    const minScore = cr.minScore ?? 0.5;
    if (score >= minScore && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { slug: cr.slug, reply: cr.answer, wikiUrl: cr.wikiUrl ?? undefined, score };
    }
  }

  if (bestMatch) {
    logger.info({ slug: bestMatch.slug, score: bestMatch.score }, 'OA chat matched canned reply');
    return {
      type: 'CANNED',
      cannedSlug: bestMatch.slug,
      reply: bestMatch.reply,
      wikiUrl: bestMatch.wikiUrl,
    };
  }

  // 3. Fallback Claude AI (Sol Đồng hành)
  return { type: 'AI_FALLBACK', userText };
}

/**
 * Generate AI reply qua Claude khi không match canned.
 * Dùng prompt "Sol Đồng hành" — cùng style với chat widget.
 */
export async function generateAIReply(userText: string, userContext?: { name?: string; pronouns?: string; day?: number }): Promise<string> {
  // Stub — em sẽ implement đầy đủ khi tích hợp Claude API.
  // Hiện tại return placeholder reply.
  const pronoun = userContext?.pronouns ?? 'anh';
  return `Cảm ơn ${pronoun} đã nhắn Sol. Mình sẽ trả lời chi tiết trong vài giây nữa — hoặc ${pronoun} mở Sol app để chat đầy đủ: https://bothuocla.sol.vn`;
}
