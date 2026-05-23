/**
 * Sol AI Mentor — entry point
 * Ported from backend/src/ai/mentor.ts with raw SQL + cohort-aware quota
 */

import { query, queryOne } from '@/lib/db';
import { getProvider } from './providers';
import { getAiSettings, getCohortQuota } from './settings';
import { buildSystemPrompt, buildRecentContextMessage, type MentorContext } from './prompts';

export interface MentorReply {
  content: string;
  modelUsed: string;
  provider?: string;
  promptTokens?: number;
  completionTokens?: number;
  latencyMs: number;
  quotaExceeded?: boolean;
  truncated?: boolean;
  error?: string;
}

const CRISIS_KEYWORDS = [
  'muốn chết',
  'tự tử',
  'tuyệt vọng',
  'không muốn sống',
  'kết thúc',
  'tự hại',
  'chán sống'
];

function shouldEscalate(userMessage: string, ctx: MentorContext): boolean {
  const lower = userMessage.toLowerCase();
  if (CRISIS_KEYWORDS.some((k) => lower.includes(k))) return true;
  if (userMessage.length > 200) return true;
  if (ctx.currentMood === 'declining' && ctx.checkinStreak < 3) return true;
  return false;
}

/**
 * Count user messages today (for quota check)
 */
async function getTodayMessageCount(memberId: number): Promise<number> {
  const row = await queryOne<{ count: string }>(
    `SELECT COUNT(*) AS count FROM messages
     WHERE member_id = $1 AND role = 'USER' AND type = 'CHAT'
       AND created_at >= DATE_TRUNC('day', NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')`,
    [memberId]
  );
  return parseInt(row?.count || '0', 10);
}

export interface AskMentorInput {
  memberId: number | null;       // null = anonymous visitor (no quota)
  threadId: number;
  userMessage: string;
  ctx: MentorContext;
}

export async function askMentor(input: AskMentorInput): Promise<MentorReply> {
  const t0 = Date.now();
  const settings = await getAiSettings();

  // Quota check (per-cohort, only for members)
  if (input.memberId) {
    const used = await getTodayMessageCount(input.memberId);
    const quota = getCohortQuota(input.ctx.cohort ?? null, input.ctx.isTrialActive);

    if (used >= quota) {
      return {
        content: `Hôm nay mình đã trò chuyện khá nhiều với ${input.ctx.pronouns} rồi (${used}/${quota} tin). Để giữ chất lượng, mình nghỉ đến mai nhé. Nếu khó quá thì tap "Tôi đang rất thèm!" để mình hỗ trợ khẩn cấp.`,
        modelUsed: 'quota',
        latencyMs: Date.now() - t0,
        quotaExceeded: true
      };
    }
  }

  if (!settings.enabled || !settings.apiKey) {
    return {
      content: `Hiện mình chưa kết nối được AI. Nếu cần hỗ trợ gấp, nhắn Zalo Khang Sol nhé — founder sẽ liên lạc trong 24h.`,
      modelUsed: 'no-api-key',
      latencyMs: Date.now() - t0
    };
  }

  const escalate = shouldEscalate(input.userMessage, input.ctx);
  const model = escalate ? settings.modelEscalated : settings.modelPrimary;

  const systemPrompt = buildSystemPrompt(input.ctx);
  const contextMsg = buildRecentContextMessage(input.ctx);

  // Last 10 messages for short-term memory
  const recent = input.ctx.recentMessages.slice(-10).map((m) => ({
    role: m.role,
    content: m.content
  }));

  try {
    const adapter = getProvider(settings.provider);
    const out = await adapter.chat({
      apiKey: settings.apiKey,
      model,
      system: systemPrompt,
      maxOutputTokens: settings.maxOutputTokens,
      temperature: settings.temperature,
      messages: [
        { role: 'user', content: `${contextMsg}\n\n[User message:]\n${input.userMessage}` },
        ...recent,
        { role: 'user', content: input.userMessage }
      ]
    });

    return {
      content: out.text || 'Mình nghe rồi. Kể thêm cho mình nghe.',
      modelUsed: out.modelUsed,
      provider: settings.provider,
      promptTokens: out.promptTokens,
      completionTokens: out.completionTokens,
      latencyMs: Date.now() - t0,
      truncated: out.truncated
    };
  } catch (err: any) {
    console.error('[ai/mentor] call failed:', err?.message || err);
    return {
      content: 'Mình đang kẹt chút, thử lại sau 30 giây nhé. Nếu khó quá thì nhắn Zalo Khang Sol — flow hỗ trợ offline.',
      modelUsed: 'error',
      provider: settings.provider,
      latencyMs: Date.now() - t0,
      error: err?.message || String(err)
    };
  }
}

/**
 * Quick provider ping for admin test
 */
export async function pingProvider(opts: {
  provider: 'openai' | 'anthropic' | 'gemini';
  apiKey: string;
  model: string;
}): Promise<{ ok: boolean; latencyMs: number; sample?: string; error?: string }> {
  const t0 = Date.now();
  try {
    const adapter = getProvider(opts.provider);
    const out = await adapter.chat({
      apiKey: opts.apiKey,
      model: opts.model,
      system: 'You are a terse assistant. Respond in 1 short Vietnamese sentence.',
      maxOutputTokens: 40,
      temperature: 0.2,
      messages: [{ role: 'user', content: 'Chào, bạn đã sẵn sàng hỗ trợ người cai thuốc chưa?' }]
    });
    return { ok: true, latencyMs: Date.now() - t0, sample: out.text.slice(0, 200) };
  } catch (err: any) {
    return { ok: false, latencyMs: Date.now() - t0, error: err?.message ?? String(err) };
  }
}
