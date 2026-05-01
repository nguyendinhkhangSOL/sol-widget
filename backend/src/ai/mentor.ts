// backend/src/ai/mentor.ts
// AI mentor — đa provider (Claude / OpenAI / Gemini), quota, escalate.
// Cấu hình lấy từ DB (admin-editable) qua `getAiSettings()`.

import { prisma } from '../db';
import { logger } from '../utils/logger';
import { getProvider } from './providers';
import { getAiSettings } from './settings';
import {
  buildSystemPrompt,
  buildRecentContextMessage,
  type MentorContext,
} from './prompts';

export interface MentorReply {
  content: string;
  modelUsed: string;
  provider?: string;
  promptTokens?: number;
  completionTokens?: number;
  latencyMs: number;
  quotaExceeded?: boolean;
  truncated?: boolean;
}

// Heuristic escalate — câu hỏi nặng → model mạnh hơn.
function shouldEscalate(userMessage: string, ctx: MentorContext): boolean {
  const crisisKeywords = [
    'muốn chết',
    'tự tử',
    'tuyệt vọng',
    'không muốn sống',
    'kết thúc',
    'tự hại',
  ];
  const lower = userMessage.toLowerCase();
  if (crisisKeywords.some((k) => lower.includes(k))) return true;
  if (userMessage.length > 200) return true;
  if (ctx.currentMood === 'declining' && ctx.checkinStreak < 3) return true;
  return false;
}

async function getTodayMessageCount(userId: string): Promise<number> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return prisma.message.count({
    where: { userId, role: 'USER', createdAt: { gte: start } },
  });
}

export async function askMentor(
  userId: string,
  userMessage: string,
  ctx: MentorContext
): Promise<MentorReply> {
  const t0 = Date.now();
  const settings = await getAiSettings();

  // Quota
  const used = await getTodayMessageCount(userId);
  if (used >= settings.dailyQuotaMsgs) {
    return {
      content:
        'Hôm nay mình đã trò chuyện khá nhiều rồi — để giữ chất lượng, mình nghỉ đến mai nhé. Nếu khó quá thì tap SOS để mình hỗ trợ khẩn cấp.',
      modelUsed: 'quota',
      latencyMs: Date.now() - t0,
      quotaExceeded: true,
    };
  }

  if (!settings.enabled || !settings.apiKey) {
    return {
      content:
        'Hiện mình chưa kết nối được AI. Nếu cần hỗ trợ gấp, tap SOS nhé — founder sẽ liên lạc.',
      modelUsed: 'none',
      latencyMs: Date.now() - t0,
    };
  }

  const escalate = shouldEscalate(userMessage, ctx);
  const model = escalate ? settings.modelEscalated : settings.modelPrimary;

  const systemPrompt = buildSystemPrompt(ctx);
  const contextMsg = buildRecentContextMessage(ctx);

  const recent = ctx.recentMessages.slice(-10).map((m) => ({
    role: m.role,
    content: m.content,
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
        { role: 'user', content: `${contextMsg}\n\n[User message:]\n${userMessage}` },
        ...recent,
        { role: 'user', content: userMessage },
      ],
    });

    return {
      content: out.text || 'Mình nghe bạn. Kể thêm không?',
      modelUsed: out.modelUsed,
      provider: settings.provider,
      promptTokens: out.promptTokens,
      completionTokens: out.completionTokens,
      latencyMs: Date.now() - t0,
      truncated: out.truncated,
    };
  } catch (err: any) {
    logger.error(
      { err: err?.message, provider: settings.provider, model },
      'AI mentor call failed'
    );
    return {
      content:
        'Mình đang kẹt chút, thử lại sau 30 giây nhé. Nếu khó quá thì tap SOS — mình có flow hỗ trợ offline.',
      modelUsed: 'error',
      provider: settings.provider,
      latencyMs: Date.now() - t0,
    };
  }
}

/**
 * Gọi 1 phát ngắn để admin test API key hoạt động.
 * Dùng prompt rất nhẹ để tiết kiệm token.
 */
export async function pingProvider(opts: {
  provider: import('./providers').AiProvider;
  apiKey: string;
  model: string;
}): Promise<{
  ok: boolean;
  latencyMs: number;
  sample?: string;
  error?: string;
}> {
  const t0 = Date.now();
  try {
    const adapter = getProvider(opts.provider);
    const out = await adapter.chat({
      apiKey: opts.apiKey,
      model: opts.model,
      system: 'You are a terse assistant. Respond in 1 short Vietnamese sentence.',
      maxOutputTokens: 40,
      temperature: 0.2,
      messages: [{ role: 'user', content: 'Chào, bạn đã sẵn sàng hỗ trợ người cai thuốc chưa?' }],
    });
    return {
      ok: true,
      latencyMs: Date.now() - t0,
      sample: out.text.slice(0, 200),
    };
  } catch (err: any) {
    return {
      ok: false,
      latencyMs: Date.now() - t0,
      error: err?.message ?? String(err),
    };
  }
}
