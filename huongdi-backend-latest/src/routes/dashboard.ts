// ═══════════════════════════════════════════════════════════════
// /api/user/dashboard — State machine + Next action
// Path: /var/www/huongdi/backend/src/routes/dashboard.ts
// Mount in index.ts: app.use('/api/user', dashboardRouter)
// ═══════════════════════════════════════════════════════════════

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// ─── Journey State enum ────────────────────────────────────────
type JourneyState =
  | 'BLANK'              // Đăng ký nhưng chưa làm gì
  | 'P1_DONE'            // Đã P1, chưa P2
  | 'P2_DONE'            // Đã P2, chưa xem P3
  | 'P3_VIEWED'          // Đã xem P3 (chưa pick direction)
  | 'DIRECTION_CHOSEN'   // Đã pick 1 direction (saved)
  | 'ROADMAP_ACTIVE'     // Active tier + đang chạy roadmap
  | 'ROADMAP_COMPLETE';  // Hoàn thành 90 ngày

interface NextAction {
  title: string;
  cta: string;
  url: string;
  reason: string;
  icon?: string;
}

// ═══════════════════════════════════════════════════════════════
// GET /api/user/dashboard  — Trả về state + next action + summary
// ═══════════════════════════════════════════════════════════════
router.get('/dashboard', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // ─── Fetch user + related data ──────────────────────────────
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        email: true,
        displayName: true,
        tier: true,
        role: true,
        tierExpiresAt: true,
        createdAt: true,
      } as any,
    });

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Get latest P1 (nếu có)
    const p1 = await (prisma as any).p1Result.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    }).catch(() => null);

    // Get latest P2 (nếu có)
    const p2 = await (prisma as any).p2Result.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    }).catch(() => null);

    // Get saved directions (nếu có)
    const savedDirs = await (prisma as any).savedDirection?.findMany({
      where: { userId },
      include: { direction: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }).catch(() => []) || [];

    // Get P3_VIEW event (nếu đã xem P3)
    const p3Viewed = await (prisma as any).userEvent?.findFirst({
      where: { userId, eventType: 'P3_VIEW' },
      orderBy: { createdAt: 'desc' },
    }).catch(() => null);

    // Get outcomes (nếu đang trong roadmap)
    const outcomes = await (prisma as any).userOutcome?.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    }).catch(() => []) || [];

    // ─── Determine journey state ─────────────────────────────────
    // Defensive cast — TypeScript strict mode blocks otherwise
    const userAny: any = user;
    const savedDirsAny: any[] = savedDirs as any[];
    const outcomesAny: any[] = outcomes as any[];
    const tierStr: string = String(userAny.tier || 'FREE');

    let state: JourneyState = 'BLANK';
    if (p1 && !p2) state = 'P1_DONE';
    else if (p1 && p2 && !p3Viewed) state = 'P2_DONE';
    else if (p1 && p2 && p3Viewed && savedDirsAny.length === 0) state = 'P3_VIEWED';
    else if (savedDirsAny.length > 0 && tierStr === 'FREE') state = 'DIRECTION_CHOSEN';
    else if (savedDirsAny.length > 0 && (tierStr === 'ACTIVE' || tierStr === 'FOUNDER')) {
      const hasD90 = outcomesAny.some((o: any) => o.checkpoint === 'D90');
      state = hasD90 ? 'ROADMAP_COMPLETE' : 'ROADMAP_ACTIVE';
    }

    // ─── Determine next action ────────────────────────────────────
    const nextActionMap: Record<JourneyState, NextAction> = {
      BLANK: {
        title: 'Khám phá DNA nghề nghiệp',
        cta: 'Bắt đầu Bước 1',
        url: '/kham-pha-ban-than/',
        reason: 'Trả lời 20 câu hỏi (10 phút) để biết mình là kiểu người nào trong 4 chiều: Người / Chuyên môn / Xây dựng / Độc lập.',
        icon: '🧬',
      },
      P1_DONE: {
        title: 'Kiểm kê nguồn lực',
        cta: 'Bước 2',
        url: '/kiem-ke-nguon-luc/',
        reason: `Anh chị đã có DNA (rank 1 là ${p1?.rank1 || 'chuyên gia'}). Bước 2 kiểm kê 7 nguồn lực: kinh nghiệm, vốn, thời gian, công nghệ, network, khẩu vị rủi ro, năng lượng.`,
        icon: '💼',
      },
      P2_DONE: {
        title: 'Mở la bàn hướng đi',
        cta: 'Xem P3',
        url: '/la-ban-huong-di/',
        reason: 'Có P1 + P2 rồi. Bây giờ xem Top 3 hướng đi phù hợp nhất — kèm giải thích WHY match.',
        icon: '🧭',
      },
      P3_VIEWED: {
        title: 'Chọn 1 hướng đi để bắt đầu',
        cta: 'Lưu direction',
        url: '/la-ban-huong-di/',
        reason: 'Anh chị đã xem 3 hướng đi. Chọn 1 hướng phù hợp nhất để bắt đầu roadmap 90 ngày.',
        icon: '🎯',
      },
      DIRECTION_CHOSEN: {
        title: 'Mở khoá roadmap 90 ngày',
        cta: 'Nâng cấp Active 499k',
        url: '/thanh-toan/',
        reason: `Anh chị đã chọn "${(savedDirsAny[0] as any)?.direction?.name || 'hướng đi'}". Roadmap 90 ngày cá nhân hoá + Sổ Hành Trình + Prompt Studio đang chờ.`,
        icon: '🔓',
      },
      ROADMAP_ACTIVE: {
        title: 'Tiếp tục Sổ Hành Trình',
        cta: 'Xem tiến độ',
        url: '/so-hanh-trinh/',
        reason: `Đang ở giai đoạn ${(outcomesAny[0] as any)?.checkpoint || 'D30'}. Update outcome tuần này để giữ momentum.`,
        icon: '📓',
      },
      ROADMAP_COMPLETE: {
        title: 'Chia sẻ kết quả cho cộng đồng',
        cta: 'Viết case study',
        url: '/toi/case-study/',
        reason: 'Anh chị đã hoàn thành 90 ngày! Chia sẻ hành trình để giúp người sau + tăng brand cá nhân.',
        icon: '🏆',
      },
    };

    // ─── Progress calculation (0-100%) ────────────────────────────
    const progressMap: Record<JourneyState, number> = {
      BLANK: 0,
      P1_DONE: 20,
      P2_DONE: 40,
      P3_VIEWED: 55,
      DIRECTION_CHOSEN: 70,
      ROADMAP_ACTIVE: 85,
      ROADMAP_COMPLETE: 100,
    };

    // ─── Response ────────────────────────────────────────────────
    return res.json({
      success: true,
      state,
      progress: {
        percent: progressMap[state],
        p1_done: !!p1,
        p2_done: !!p2,
        p3_viewed: !!p3Viewed,
        direction_chosen: savedDirsAny.length > 0,
        roadmap_active: state === 'ROADMAP_ACTIVE',
        roadmap_complete: state === 'ROADMAP_COMPLETE',
      },
      nextAction: nextActionMap[state],
      user: {
        id: user.id,
        displayName: (user as any).displayName || 'Sol Member',
        phone: user.phone,
        email: user.email,
        tier: user.tier,
        role: (user as any).role,
        tierExpiresAt: (user as any).tierExpiresAt,
      },
      summary: {
        p1: p1 ? {
          id: p1.id,
          rank1: p1.rank1,
          rank2: p1.rank2,
          scores: {
            people: p1.people,
            expert: p1.expert,
            builder: p1.builder,
            independent: p1.independent,
          },
          createdAt: p1.createdAt,
        } : null,
        p2: p2 ? {
          id: p2.id,
          topResource: findTopP2Resource(p2),
          scores: {
            experience: p2.experience,
            capital: p2.capital,
            time: p2.time,
            technology: p2.technology,
            network: p2.network,
            risk: p2.risk,
            energy: p2.energy,
          },
          incomeGoal: p2.incomeGoal,
          createdAt: p2.createdAt,
        } : null,
        savedDirections: savedDirsAny.slice(0, 3).map((s: any) => ({
          id: s.id,
          directionId: s.directionId,
          directionName: s.direction?.name || null,
          directionSlug: s.direction?.slug || null,
          matchScore: s.matchScore,
          savedAt: s.createdAt,
        })),
        outcomes: outcomesAny.slice(0, 3).map((o: any) => ({
          id: o.id,
          checkpoint: o.checkpoint,
          started: o.started,
          firstClient: o.firstClient,
          firstRevenue: o.firstRevenue,
          revenueLevel: o.revenueLevel,
        })),
      },
    });
  } catch (err: any) {
    console.error('[GET /user/dashboard]', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
});

// Helper: Tìm nguồn lực mạnh nhất trong P2
function findTopP2Resource(p2: any): string {
  const resources = {
    experience: p2.experience,
    capital: p2.capital,
    time: p2.time,
    technology: p2.technology,
    network: p2.network,
    risk: p2.risk,
    energy: p2.energy,
  };
  const topKey = Object.entries(resources).sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[0];
  return topKey || 'experience';
}

export default router;
