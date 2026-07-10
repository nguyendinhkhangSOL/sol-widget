// ═══════════════════════════════════════════════════════════════
// /api/sol-dong-hanh/* — AI Coach cho Active/Founder tier
// Deploy: /var/www/huongdi/backend/src/routes/sol-dong-hanh.ts
// Mount: app.use('/api/sol-dong-hanh', solDongHanhRoutes)
// ═══════════════════════════════════════════════════════════════

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();
const prisma = new PrismaClient();

// ─── Anthropic client (fallback to null nếu chưa có API key) ──
const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// ─── Pricing per model (USD per 1M tokens) ────────────────────
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'claude-3-5-haiku-20241022': { input: 0.80, output: 4.00 },  // Haiku 3.5
  'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 }, // Sonnet 3.5
};

const TIER_MODEL: Record<string, string> = {
  ACTIVE: 'claude-3-5-haiku-20241022',
  FOUNDER: 'claude-3-5-sonnet-20241022',
};

const TIER_QUOTA: Record<string, number> = {
  ACTIVE: 30,
  FOUNDER: 500,   // Effectively unlimited
};

// ═══════════════════════════════════════════════════════════════
// GET /api/sol-dong-hanh/state — Trạng thái + quota
// ═══════════════════════════════════════════════════════════════
router.get('/state', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const tier = (req as any).user?.tier || 'FREE';

    if (tier === 'FREE' || tier === 'EXPIRED') {
      return res.json({
        success: true,
        state: 'LOCKED',
        message: 'Sol Đồng Hành AI chỉ có ở gói Active (499k/năm) hoặc Founder.',
        upgradeUrl: '/thanh-toan/',
      });
    }

    // Quota check
    const monthKey = getCurrentMonthKey();
    const quota = await getOrInitQuota(userId, monthKey, tier);

    // Recent conversations
    const conversations = await (prisma as any).solChatConversation?.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      include: { messages: { take: 1, orderBy: { createdAt: 'asc' } } },
    }).catch(() => []) || [];

    return res.json({
      success: true,
      state: 'ACTIVE',
      tier,
      model: TIER_MODEL[tier],
      quota: {
        used: quota.messagesUsed,
        limit: quota.quotaLimit,
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
    console.error('[GET /sol-dong-hanh/state]', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// POST /api/sol-dong-hanh/chat — Gửi 1 tin nhắn
// Body: { conversationId?, message }
// ═══════════════════════════════════════════════════════════════
router.post('/chat', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const tier = (req as any).user?.tier || 'FREE';
    const { conversationId, message } = req.body || {};

    if (!message || typeof message !== 'string' || message.length < 1) {
      return res.status(400).json({ success: false, message: 'Message required' });
    }

    // Tier check
    if (tier !== 'ACTIVE' && tier !== 'FOUNDER') {
      return res.status(403).json({
        success: false,
        message: 'Sol Đồng Hành AI chỉ có ở gói Active hoặc Founder.',
        upgradeUrl: '/thanh-toan/',
      });
    }

    // Quota check
    const monthKey = getCurrentMonthKey();
    const quota = await getOrInitQuota(userId, monthKey, tier);
    if (quota.messagesUsed >= quota.quotaLimit) {
      return res.status(429).json({
        success: false,
        message: `Đã dùng hết ${quota.quotaLimit} messages tháng này. Nâng cấp Founder để unlimited hoặc chờ tháng sau.`,
        quota,
      });
    }

    // Anthropic client check
    if (!anthropic) {
      return res.status(503).json({
        success: false,
        message: 'AI service chưa sẵn sàng. Liên hệ admin.',
      });
    }

    // ─── Get or create conversation ─────────────────────────
    let conversation;
    if (conversationId) {
      conversation = await (prisma as any).solChatConversation.findFirst({
        where: { id: conversationId, userId },
        include: { messages: { orderBy: { createdAt: 'asc' }, take: 20 } },
      });
      if (!conversation) {
        return res.status(404).json({ success: false, message: 'Conversation not found' });
      }
    } else {
      // Load context P1/P2/direction
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

    // ─── Build system prompt với context ────────────────────
    const context = await loadUserContext(userId);
    const systemPrompt = buildSystemPrompt(context);

    // Build message history (last 10)
    const history = (conversation.messages || []).slice(-10).map((m: any) => ({
      role: m.role,
      content: m.content,
    }));

    // Save user message
    await (prisma as any).solChatMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message,
      },
    });

    // ─── Call Anthropic API ───────────────────────────────
    const model = TIER_MODEL[tier];
    const response = await anthropic.messages.create({
      model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        ...history,
        { role: 'user', content: message },
      ],
    });

    const assistantMessage = response.content[0]?.type === 'text' ? response.content[0].text : '';
    const tokensIn = response.usage.input_tokens;
    const tokensOut = response.usage.output_tokens;
    const pricing = MODEL_PRICING[model];
    const costUsd = (tokensIn * pricing.input + tokensOut * pricing.output) / 1_000_000;

    // Save assistant message
    await (prisma as any).solChatMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: assistantMessage,
        tokensIn,
        tokensOut,
        model,
        costUsd,
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
        tokensIn,
        tokensOut,
        costUsd: costUsd.toFixed(4),
        model,
      },
      quota: {
        used: quota.messagesUsed + 1,
        limit: quota.quotaLimit,
        remaining: quota.quotaLimit - quota.messagesUsed - 1,
      },
    });
  } catch (err: any) {
    console.error('[POST /sol-dong-hanh/chat]', err);
    return res.status(500).json({
      success: false,
      message: 'Lỗi AI: ' + (err.message || 'unknown'),
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// GET /api/sol-dong-hanh/conversations/:id — Load conversation
// ═══════════════════════════════════════════════════════════════
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
    console.error('[GET conversation]', err);
    return res.status(500).json({ success: false });
  }
});

// ─── Helpers ─────────────────────────────────────────────────

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
    data: {
      userId,
      monthKey,
      messagesUsed: 0,
      quotaLimit: TIER_QUOTA[tier] || 30,
    },
  });
}

async function loadUserContext(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { displayName: true, tier: true } as any,
  });

  const p1 = await (prisma as any).p1Result?.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  }).catch(() => null);

  const p2 = await (prisma as any).p2Result?.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  }).catch(() => null);

  const savedDir = await (prisma as any).savedDirection?.findFirst({
    where: { userId },
    include: { direction: true },
    orderBy: { createdAt: 'asc' },
  }).catch(() => null);

  // Determine phase từ Sổ Hành Trình
  let phase = null;
  if (savedDir) {
    const startDate = new Date(savedDir.createdAt);
    const now = new Date();
    const day = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    phase = day <= 30 ? 'D30' : day <= 60 ? 'D60' : 'D90';
  }

  return {
    user,
    p1,
    p2,
    direction: savedDir?.direction || null,
    phase,
  };
}

function buildSystemPrompt(ctx: any): string {
  const parts = [
    `Bạn là Sol — AI Coach cá nhân hoá cho chuyên gia 40-60 tuổi tại Việt Nam đang chuyển đổi nghề nghiệp trong thời AI 2026.`,
    ``,
    `NGUYÊN TẮC:`,
    `- Trả lời tiếng Việt, tone empathetic + practical (không lý thuyết chung chung)`,
    `- Ngắn gọn, actionable — 3-5 bullet points là đủ`,
    `- Context user luôn được ưu tiên hơn general advice`,
    `- Không tự claim là "chuyên gia" — bạn là coach hỗ trợ`,
    `- Nếu user hỏi topic ngoài chuyên môn (y khoa, luật, tài chính) → nhắc user consult expert thật`,
    ``,
    `THÔNG TIN USER:`,
    `- Tên: ${ctx.user?.displayName || 'anh chị'}`,
    `- Gói: ${ctx.user?.tier || 'ACTIVE'}`,
  ];

  if (ctx.p1) {
    parts.push(`- DNA 4 chiều: Người ${ctx.p1.people} · Chuyên môn ${ctx.p1.expert} · Xây dựng ${ctx.p1.builder} · Độc lập ${ctx.p1.independent}`);
    parts.push(`  → Rank 1: ${ctx.p1.rank1} · Rank 2: ${ctx.p1.rank2}`);
  } else {
    parts.push(`- Chưa làm P1 (Khám phá bản thân)`);
  }

  if (ctx.p2) {
    parts.push(`- Nguồn lực: Kinh nghiệm ${ctx.p2.experience} · Vốn ${ctx.p2.capital} · Thời gian ${ctx.p2.time} · Công nghệ ${ctx.p2.technology} · Network ${ctx.p2.network} · Rủi ro ${ctx.p2.risk} · Năng lượng ${ctx.p2.energy}`);
    parts.push(`  → Mục tiêu thu nhập: ${ctx.p2.incomeGoal || 'chưa xác định'}`);
  } else {
    parts.push(`- Chưa làm P2 (Kiểm kê nguồn lực)`);
  }

  if (ctx.direction) {
    parts.push(`- Hướng đi đã chọn: ${ctx.direction.name}`);
    parts.push(`- Giai đoạn Sổ Hành Trình: ${ctx.phase || 'chưa bắt đầu'}`);
  }

  parts.push(``, `Hãy dùng context này để trả lời câu hỏi tiếp theo của user một cách cá nhân hoá + thực tế.`);

  return parts.join('\n');
}

export default router;
