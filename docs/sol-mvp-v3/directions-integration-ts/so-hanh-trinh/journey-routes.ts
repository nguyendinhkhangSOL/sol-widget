// ═══════════════════════════════════════════════════════════════
// /api/journey/* — Sổ Hành Trình 90 ngày
// Deploy: /var/www/huongdi/backend/src/routes/journey.ts
// Mount: app.use('/api/journey', journeyRoutes)
// ═══════════════════════════════════════════════════════════════

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════════════
// GET /api/journey/state — Trạng thái hiện tại
// ═══════════════════════════════════════════════════════════════
router.get('/state', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    // Lấy direction đã chọn (earliest saved)
    const savedDir = await (prisma as any).savedDirection?.findFirst({
      where: { userId },
      include: { direction: true },
      orderBy: { createdAt: 'asc' },
    }).catch(() => null);

    if (!savedDir) {
      return res.json({
        success: true,
        state: 'NO_DIRECTION',
        message: 'Chưa chọn hướng đi. Hoàn thành P3 và chọn 1 hướng để bắt đầu.',
      });
    }

    // Tính currentDay dựa trên savedDir.createdAt
    const startDate = new Date(savedDir.createdAt);
    const now = new Date();
    const diffMs = now.getTime() - startDate.getTime();
    const currentDay = Math.min(90, Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1));
    const phase = currentDay <= 30 ? 'D30' : currentDay <= 60 ? 'D60' : 'D90';

    // Lấy tất cả journey days của user
    const allDays = await (prisma as any).journeyDay?.findMany({
      where: { userId },
      orderBy: { day: 'asc' },
    }).catch(() => []) || [];

    const daysLogged = allDays.length;
    const progressPercent = Math.round((currentDay / 90) * 100);

    // Today's entry (nếu có)
    const todayEntry = allDays.find((d: any) => d.day === currentDay);

    return res.json({
      success: true,
      state: currentDay >= 90 ? 'COMPLETED' : 'ACTIVE',
      direction: {
        id: savedDir.directionId,
        slug: savedDir.direction?.slug,
        name: savedDir.direction?.name,
        startedAt: savedDir.createdAt,
      },
      progress: {
        currentDay,
        phase,
        daysRemaining: 90 - currentDay,
        daysLogged,
        progressPercent,
      },
      todayEntry: todayEntry || null,
      recentEntries: allDays.slice(-5).reverse(),
      milestonesByPhase: buildPhaseMilestones(currentDay, allDays),
    });
  } catch (err: any) {
    console.error('[GET /journey/state]', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// POST /api/journey/day — Log 1 ngày (create/update)
// Body: { day, journalContent?, mood?, wins?, blockers?, tasksCompleted? }
// ═══════════════════════════════════════════════════════════════
router.post('/day', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { day, journalContent, mood, wins, blockers, tasksCompleted } = req.body || {};

    if (!day || day < 1 || day > 90) {
      return res.status(400).json({ success: false, message: 'day must be 1-90' });
    }

    const phase = day <= 30 ? 'D30' : day <= 60 ? 'D60' : 'D90';

    // Get direction id (from earliest saved)
    const savedDir = await (prisma as any).savedDirection?.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    }).catch(() => null);

    const data: any = {
      userId,
      day: Number(day),
      phase,
      directionId: savedDir?.directionId || null,
      journalContent: journalContent ?? null,
      mood: mood ? Number(mood) : null,
      wins: Array.isArray(wins) ? wins : [],
      blockers: Array.isArray(blockers) ? blockers : [],
      tasksCompleted: tasksCompleted || null,
    };

    // Upsert
    const entry = await (prisma as any).journeyDay.upsert({
      where: {
        userId_day: { userId, day: Number(day) },
      },
      create: data,
      update: {
        journalContent: data.journalContent,
        mood: data.mood,
        wins: data.wins,
        blockers: data.blockers,
        tasksCompleted: data.tasksCompleted,
      },
    });

    return res.json({ success: true, entry });
  } catch (err: any) {
    console.error('[POST /journey/day]', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// GET /api/journey/days — Danh sách all entries
// ═══════════════════════════════════════════════════════════════
router.get('/days', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const days = await (prisma as any).journeyDay?.findMany({
      where: { userId },
      orderBy: { day: 'asc' },
    }).catch(() => []) || [];

    return res.json({ success: true, days, total: days.length });
  } catch (err: any) {
    console.error('[GET /journey/days]', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// GET /api/journey/roadmap-template — Roadmap 30 milestone hardcoded
// Query: ?category=CHUYEN_MON (fallback default)
// ═══════════════════════════════════════════════════════════════
router.get('/roadmap-template', requireAuth, async (req: Request, res: Response) => {
  const category = (req.query.category as string) || 'DEFAULT';
  const template = getRoadmapTemplate(category);
  return res.json({ success: true, template });
});

// ─── Helpers ─────────────────────────────────────────────────

function buildPhaseMilestones(currentDay: number, allDays: any[]) {
  const template = getRoadmapTemplate('DEFAULT');
  return {
    D30: {
      title: 'Xác định thị trường + audience',
      dayRange: '1-30',
      milestones: template.filter((m: any) => m.day <= 30).map((m: any) => ({
        ...m,
        isDone: allDays.some((d: any) => d.day === m.day && d.journalContent),
      })),
    },
    D60: {
      title: 'Build sản phẩm/dịch vụ MVP',
      dayRange: '31-60',
      milestones: template.filter((m: any) => m.day > 30 && m.day <= 60).map((m: any) => ({
        ...m,
        isDone: allDays.some((d: any) => d.day === m.day && d.journalContent),
      })),
    },
    D90: {
      title: 'Launch + get 5-10 khách đầu',
      dayRange: '61-90',
      milestones: template.filter((m: any) => m.day > 60).map((m: any) => ({
        ...m,
        isDone: allDays.some((d: any) => d.day === m.day && d.journalContent),
      })),
    },
  };
}

function getRoadmapTemplate(category: string) {
  // 30 milestone chuẩn — có thể personalize theo category sau
  return [
    // ─── Phase D30 — Discovery + Positioning (10 milestones)
    { day: 1, title: 'Kick-off: viết vision 1 câu', description: 'Tôi giúp [ai] đạt được [gì] bằng [cách nào]' },
    { day: 3, title: 'Xác định target audience', description: '5 người khách hàng lý tưởng — hồ sơ chi tiết' },
    { day: 7, title: 'Interview 3 khách tiềm năng', description: 'Coffee chat 30 phút, hỏi pain point thật' },
    { day: 10, title: 'Positioning statement', description: 'Điều gì khiến anh chị khác 10 competitor' },
    { day: 14, title: 'Pricing strategy sơ bộ', description: '3 tier: entry / core / premium — mức giá gợi ý' },
    { day: 17, title: 'Landing page V0', description: 'HTML/Notion đơn giản — hero + 3 offer + form' },
    { day: 21, title: 'Interview thêm 5 khách nữa', description: 'Feedback landing page + pricing' },
    { day: 24, title: 'Chỉnh sửa offer + pricing', description: 'Dựa vào feedback 8 người' },
    { day: 27, title: 'Chuẩn bị portfolio 3 case', description: 'Anonymized case của khách cũ' },
    { day: 30, title: 'Milestone 30 — Review + Reflect', description: 'Đã học được gì? Điều chỉnh gì cho D60?' },

    // ─── Phase D60 — Build + Test (10 milestones)
    { day: 33, title: 'Build sản phẩm/dịch vụ MVP', description: 'Package 1 dịch vụ hoặc 1 sản phẩm cụ thể' },
    { day: 36, title: 'Test với 1 khách miễn phí đầu tiên', description: 'Pilot khách — deliver + xin feedback' },
    { day: 40, title: 'Iteration V1', description: 'Fix issue từ pilot' },
    { day: 44, title: 'Get khách trả tiền đầu tiên', description: 'Discount 30-50% để lấy case study' },
    { day: 48, title: 'Deliver + feedback', description: 'Chăm khách VIP — followup 3 lần' },
    { day: 52, title: 'Case study 1 hoàn chỉnh', description: 'Blog/LinkedIn post: before/after + số liệu' },
    { day: 56, title: 'Bắt đầu content marketing', description: '2 post/tuần trên LinkedIn hoặc Facebook' },
    { day: 58, title: 'Get 2-3 khách trả tiền tiếp theo', description: 'Full pricing rồi, không discount' },
    { day: 60, title: 'Milestone 60 — Review revenue', description: 'Doanh thu tháng 2? So với mục tiêu?' },
    { day: 62, title: 'Chuẩn bị scale plan', description: 'Có cần hire assistant? Automation gì?' },

    // ─── Phase D90 — Scale + Moat (10 milestones)
    { day: 65, title: 'Optimize offer top-performer', description: 'Package nào bán chạy nhất? Tăng giá?' },
    { day: 68, title: 'Get thêm 5-10 khách', description: 'Target: 10 khách total sau 90 ngày' },
    { day: 72, title: 'Referral program', description: 'Khách cũ giới thiệu → discount' },
    { day: 75, title: 'Content pillar 12 tháng', description: 'Kế hoạch nội dung cho năm 2 — 50 topic' },
    { day: 78, title: 'Build moat — LinkedIn 2000 follower', description: 'Chuyên môn sâu, không dàn trải' },
    { day: 82, title: 'Automation & delegation', description: 'Task lặp giao cho AI/VA/assistant' },
    { day: 85, title: 'Testimonial 5 khách', description: 'Video ngắn 30-60s — trust signal' },
    { day: 87, title: 'Review 90 ngày trước', description: 'Cái gì work? Cái gì không? Learning?' },
    { day: 89, title: 'Plan Q2 — 90 ngày tiếp', description: 'Target next quarter: 20 khách hoặc scale package' },
    { day: 90, title: 'Milestone 90 — CELEBRATE 🎉', description: 'Anh chị đã hoàn thành 90 ngày! Chia sẻ hành trình' },
  ];
}

export default router;
