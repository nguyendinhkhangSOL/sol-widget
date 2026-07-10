// ═══════════════════════════════════════════════════════════════
// /api/sol-dong-hanh/* — Multi-provider (OpenAI + Anthropic)
// Priority: OPENAI_API_KEY > ANTHROPIC_API_KEY
// ═══════════════════════════════════════════════════════════════

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

const router = Router();
const prisma = new PrismaClient();

// ─── Provider detection ─────────────────────────────────
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const PROVIDER = OPENAI_KEY ? 'openai' : (ANTHROPIC_KEY ? 'anthropic' : null);

const openai = OPENAI_KEY ? new OpenAI({ apiKey: OPENAI_KEY }) : null;
const anthropic = ANTHROPIC_KEY ? new Anthropic({ apiKey: ANTHROPIC_KEY }) : null;

console.log(`[Sol Đồng Hành] Provider: ${PROVIDER || 'NONE'}`);

// ─── Model config per tier per provider ────────────────
const MODEL_CONFIG: Record<string, Record<string, { model: string; input: number; output: number }>> = {
  openai: {
    ACTIVE: { model: 'gpt-4o-mini', input: 0.15, output: 0.60 },
    FOUNDER: { model: 'gpt-4o', input: 2.50, output: 10.00 },
  },
  anthropic: {
    ACTIVE: { model: 'claude-3-5-haiku-20241022', input: 0.80, output: 4.00 },
    FOUNDER: { model: 'claude-3-5-sonnet-20241022', input: 3.00, output: 15.00 },
  },
};

const TIER_QUOTA: Record<string, number> = {
  ACTIVE: 30,
  FOUNDER: 500,
};

// ═══════════════════════════════════════════════════════════════
// GET /api/sol-dong-hanh/state
// ═══════════════════════════════════════════════════════════════
router.get('/state', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const tier = (req as any).user?.tier || 'FREE';

    if (tier === 'FREE' || tier === 'EXPIRED') {
      return res.json({
        success: true, state: 'LOCKED',
        message: 'Sol Đồng Hành AI chỉ có ở gói Active hoặc Founder.',
        upgradeUrl: '/thanh-toan/',
      });
    }

    if (!PROVIDER) {
      return res.status(503).json({
        success: false, state: 'NO_PROVIDER',
        message: 'AI service chưa cấu hình. Liên hệ admin.',
      });
    }

    const monthKey = getCurrentMonthKey();
    const quota = await getOrInitQuota(userId, monthKey, tier);
    const modelInfo = MODEL_CONFIG[PROVIDER][tier];

    const conversations = await (prisma as any).solChatConversation?.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      include: { messages: { take: 1, orderBy: { createdAt: 'asc' } } },
    }).catch(() => []) || [];

    return res.json({
      success: true, state: 'ACTIVE', tier,
      provider: PROVIDER,
      model: modelInfo.model,
      quota: {
        used: quota.messagesUsed, limit: quota.quotaLimit,
        remaining: Math.max(0, quota.quotaLimit - quota.messagesUsed),
        monthKey,
      },
      conversations: conversations.map((c: any) => ({
        id: c.id,
        title: c.title || (c.messages[0]?.content?.substring(0, 60) + '...'),
        updatedAt: c.updatedAt,
      })),
    });
  } catch (err: any) {
    console.error('[GET /state]', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// POST /api/sol-dong-hanh/chat
// ═══════════════════════════════════════════════════════════════
router.post('/chat', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const tier = (req as any).user?.tier || 'FREE';
    const { conversationId, message } = req.body || {};

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, message: 'Message required' });
    }

    if (tier !== 'ACTIVE' && tier !== 'FOUNDER') {
      return res.status(403).json({
        success: false,
        message: 'Sol Đồng Hành AI chỉ có ở gói Active hoặc Founder.',
        upgradeUrl: '/thanh-toan/',
      });
    }

    if (!PROVIDER) {
      return res.status(503).json({ success: false, message: 'AI provider chưa cấu hình.' });
    }

    // Quota check
    const monthKey = getCurrentMonthKey();
    const quota = await getOrInitQuota(userId, monthKey, tier);
    if (quota.messagesUsed >= quota.quotaLimit) {
      return res.status(429).json({
        success: false,
        message: `Đã dùng hết ${quota.quotaLimit} messages tháng này.`,
        quota,
      });
    }

    // Get/create conversation
    let conversation;
    if (conversationId) {
      conversation = await (prisma as any).solChatConversation.findFirst({
        where: { id: conversationId, userId },
        include: { messages: { orderBy: { createdAt: 'asc' }, take: 20 } },
      });
      if (!conversation) {
        return res.status(404).json({ success: false, message: 'Not found' });
      }
    } else {
      const context = await loadUserContext(userId);
      conversation = await (prisma as any).solChatConversation.create({
        data: {
          userId,
          directionId: context.direction?.id || null,
          phase: context.phase,
          title: message.substring(0, 60),
        },
      });
      conversation.messages = [];
    }

    const context = await loadUserContext(userId);
    const systemPrompt = buildSystemPrompt(context);
    const history = (conversation.messages || []).slice(-10).map((m: any) => ({
      role: m.role, content: m.content,
    }));

    // Save user message
    await (prisma as any).solChatMessage.create({
      data: { conversationId: conversation.id, role: 'user', content: message },
    });

    // ─── Call AI ──────────────────────────────
    const modelInfo = MODEL_CONFIG[PROVIDER][tier];
    let assistantMessage = '';
    let tokensIn = 0;
    let tokensOut = 0;

    if (PROVIDER === 'openai' && openai) {
      const response = await openai.chat.completions.create({
        model: modelInfo.model,
        max_tokens: 1024,
        messages: [
          { role: 'system', content: systemPrompt },
          ...history,
          { role: 'user', content: message },
        ] as any,
      });
      assistantMessage = response.choices[0]?.message?.content || '';
      tokensIn = response.usage?.prompt_tokens || 0;
      tokensOut = response.usage?.completion_tokens || 0;
    } else if (PROVIDER === 'anthropic' && anthropic) {
      const response = await anthropic.messages.create({
        model: modelInfo.model,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [...history, { role: 'user', content: message }] as any,
      });
      assistantMessage = response.content[0]?.type === 'text' ? response.content[0].text : '';
      tokensIn = response.usage.input_tokens;
      tokensOut = response.usage.output_tokens;
    }

    const costUsd = (tokensIn * modelInfo.input + tokensOut * modelInfo.output) / 1_000_000;

    // Save assistant message
    await (prisma as any).solChatMessage.create({
      data: {
        conversationId: conversation.id, role: 'assistant', content: assistantMessage,
        tokensIn, tokensOut, model: modelInfo.model, costUsd,
      },
    });

    // Update conversation total
    await (prisma as any).solChatConversation.update({
      where: { id: conversation.id },
      data: {
        totalTokens: { increment: tokensIn + tokensOut },
        totalCostUsd: { increment: costUsd },
        title: conversation.title || message.substring(0, 60),
      },
    });

    // Update quota
    await (prisma as any).solChatQuota.update({
      where: { userId_monthKey: { userId, monthKey } },
      data: { messagesUsed: { increment: 1 } },
    });

    return res.json({
      success: true,
      conversationId: conversation.id,
      message: assistantMessage,
      usage: {
        tokensIn, tokensOut,
        costUsd: costUsd.toFixed(4),
        model: modelInfo.model, provider: PROVIDER,
      },
      quota: {
        used: quota.messagesUsed + 1,
        limit: quota.quotaLimit,
        remaining: quota.quotaLimit - quota.messagesUsed - 1,
      },
    });
  } catch (err: any) {
    console.error('[POST /chat]', err);
    return res.status(500).json({
      success: false,
      message: 'Lỗi AI: ' + (err.message || 'unknown'),
    });
  }
});

router.get('/conversations/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const conv = await (prisma as any).solChatConversation?.findFirst({
      where: { id: req.params.id, userId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conv) return res.status(404).json({ success: false });
    return res.json({ success: true, conversation: conv });
  } catch (err: any) {
    return res.status(500).json({ success: false });
  }
});

// ─── Helpers (unchanged) ───────────────────────────────

function getCurrentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

async function getOrInitQuota(userId: string, monthKey: string, tier: string) {
  const existing = await (prisma as any).solChatQuota.findUnique({
    where: { userId_monthKey: { userId, monthKey } },
  });
  if (existing) return existing;
  return (prisma as any).solChatQuota.create({
    data: { userId, monthKey, messagesUsed: 0, quotaLimit: TIER_QUOTA[tier] || 30 },
  });
}

async function loadUserContext(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { displayName: true, tier: true } as any,
  });
  const p1 = await (prisma as any).p1Result?.findFirst({
    where: { userId }, orderBy: { createdAt: 'desc' },
  }).catch(() => null);
  const p2 = await (prisma as any).p2Result?.findFirst({
    where: { userId }, orderBy: { createdAt: 'desc' },
  }).catch(() => null);
  const savedDir = await (prisma as any).savedDirection?.findFirst({
    where: { userId }, include: { direction: true }, orderBy: { createdAt: 'asc' },
  }).catch(() => null);

  let phase = null;
  if (savedDir) {
    const startDate = new Date(savedDir.createdAt);
    const now = new Date();
    const day = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    phase = day <= 30 ? 'D30' : day <= 60 ? 'D60' : 'D90';
  }

  return { user, p1, p2, direction: savedDir?.direction || null, phase };
}

function buildSystemPrompt(ctx: any): string {
  const parts = [
    `Bạn là Sol — AI Coach cá nhân hoá cho chuyên gia 40-60 tuổi tại Việt Nam đang chuyển đổi nghề nghiệp trong thời AI 2026.`,
    ``,
    `NGUYÊN TẮC:`,
    `- Trả lời tiếng Việt, tone empathetic + practical`,
    `- Ngắn gọn, actionable — 3-5 bullet points`,
    `- Context user luôn ưu tiên hơn general advice`,
    `- Nếu user hỏi ngoài chuyên môn (y khoa, luật) → nhắc consult expert thật`,
    ``,
    `THÔNG TIN USER:`,
    `- Tên: ${ctx.user?.displayName || 'anh chị'}`,
    `- Gói: ${ctx.user?.tier || 'ACTIVE'}`,
  ];
  if (ctx.p1) {
    parts.push(`- DNA: Người ${ctx.p1.people} · Chuyên môn ${ctx.p1.expert} · Xây dựng ${ctx.p1.builder} · Độc lập ${ctx.p1.independent}`);
    parts.push(`  → Rank 1: ${ctx.p1.rank1} · Rank 2: ${ctx.p1.rank2}`);
  }
  if (ctx.p2) {
    parts.push(`- Nguồn lực: Kinh nghiệm ${ctx.p2.experience} · Vốn ${ctx.p2.capital} · Thời gian ${ctx.p2.time} · Công nghệ ${ctx.p2.technology} · Network ${ctx.p2.network} · Rủi ro ${ctx.p2.risk} · Năng lượng ${ctx.p2.energy}`);
  }
  if (ctx.direction) {
    parts.push(`- Hướng đi: ${ctx.direction.name}`);
    parts.push(`- Giai đoạn Sổ Hành Trình: ${ctx.phase || 'chưa bắt đầu'}`);
  }
  parts.push(``, `Hãy dùng context này trả lời cá nhân hoá + thực tế.`);
  return parts.join('\n');
}

export default router;
