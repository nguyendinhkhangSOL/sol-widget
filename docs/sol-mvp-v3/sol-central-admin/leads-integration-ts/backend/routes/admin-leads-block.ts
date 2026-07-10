/**
 * ═══════════════════════════════════════════════════════════════
 * APPEND vào cuối file /var/www/huongdi/backend/src/routes/admin.ts
 * (giả định admin.ts đã có auth middleware sẵn)
 * ═══════════════════════════════════════════════════════════════
 *
 * Nếu admin.ts có pattern kiểu:
 *   const router = Router();
 *   router.use(requireAdmin);  // hoặc middleware similar
 *   router.get('/directions', ...);
 *
 * Thì append các routes dưới đây, chúng sẽ tự động chia sẻ auth.
 *
 * NHỚ: Ở đầu file admin.ts đảm bảo có:
 *   import { PrismaClient } from '@prisma/client';
 *   import crypto from 'crypto';
 *   import { sendMagicLinkToUser, makeZaloDeepLink, makeZaloMessage } from '../services/notification';
 *   const prisma = new PrismaClient();
 */

// ═════════════════ LEADS MANAGEMENT ═════════════════

/**
 * GET /api/admin/leads?status=pending&search=xxx&page=1&limit=50
 */
router.get('/leads', async (req, res) => {
  try {
    const status = String(req.query.status || 'all');
    const search = String(req.query.search || '').trim();
    const page   = Math.max(1, parseInt(String(req.query.page || '1')));
    const limit  = Math.min(200, parseInt(String(req.query.limit || '50')));
    const skip   = (page - 1) * limit;

    const where: any = {};
    if (status !== 'all') where.paymentStatus = status;
    if (search) {
      where.OR = [
        { ten:   { contains: search, mode: 'insensitive' } },
        { sdt:   { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
        { zalo:  { contains: search } },
      ];
    }

    const [total, leads, summaryRows] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.lead.groupBy({
        by:  ['paymentStatus'],
        _count: { _all: true },
        _sum:   { amount: true },
      }),
    ]);

    const summary = summaryRows.map(r => ({
      payment_status: r.paymentStatus,
      count:          r._count._all,
      total:          r._sum.amount || 0,
    }));

    return res.json({ success: true, leads, total, page, limit, summary });
  } catch (err: any) {
    console.error('[GET /admin/leads]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/admin/leads/:id — chi tiết + notification history
 */
router.get('/leads/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const lead = await prisma.lead.findUnique({
    where:   { id },
    include: { notifications: { orderBy: { sentAt: 'desc' } } },
  });
  if (!lead) return res.status(404).json({ success: false, message: 'Not found' });
  return res.json({ success: true, lead });
});

/**
 * POST /api/admin/leads/:id/approve
 * Body: { notes?: string }
 * → Generate magic_token, set paid, expires +365d, send email user
 */
router.post('/leads/:id/approve', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) return res.status(404).json({ success: false, message: 'Not found' });
    if (lead.paymentStatus === 'activated') {
      return res.status(400).json({ success: false, message: 'Lead đã activated.' });
    }

    const token   = require('crypto').randomBytes(24).toString('hex');
    const now     = new Date();
    const expires = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    const username = (req as any).user?.username || 'admin';

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        paymentStatus: 'paid',
        magicToken:    token,
        magicSentAt:   now,
        expiresAt:     expires,
        approvedBy:    username,
        notes:         req.body?.notes || lead.notes,
      }
    });

    const magicLink = `https://sol.vn/kich-hoat/?token=${token}`;
    const notif = await sendMagicLinkToUser(updated, magicLink);

    return res.json({
      success:     true,
      magic_link:  magicLink,
      expires_at:  expires,
      notification: notif,
    });
  } catch (err: any) {
    console.error('[POST /admin/leads/:id/approve]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/admin/leads/:id/reject
 * Body: { reason: string }
 */
router.post('/leads/:id/reject', async (req, res) => {
  const id = parseInt(req.params.id);
  const reason = String(req.body?.reason || '').trim();
  if (!reason) return res.status(400).json({ success: false, message: 'Nhập lý do.' });

  const username = (req as any).user?.username || 'admin';

  try {
    await prisma.lead.update({
      where: { id },
      data:  { paymentStatus: 'cancelled', cancelReason: reason, approvedBy: username },
    });
    return res.json({ success: true });
  } catch {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
});

/**
 * POST /api/admin/leads/:id/resend-magic
 * Gửi lại magic link (email + trả về Zalo message mẫu)
 */
router.post('/leads/:id/resend-magic', async (req, res) => {
  const id = parseInt(req.params.id);
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead || !lead.magicToken) {
    return res.status(400).json({ success: false, message: 'Lead chưa approve. Approve trước.' });
  }
  const magicLink = `https://sol.vn/kich-hoat/?token=${lead.magicToken}`;
  const notif = await sendMagicLinkToUser(lead, magicLink);
  return res.json({ success: true, magic_link: magicLink, notification: notif });
});

/**
 * GET /api/admin/leads/:id/zalo-helper
 * Trả về deep-link + tin nhắn mẫu để Khang copy paste vào Zalo cá nhân
 */
router.get('/leads/:id/zalo-helper', async (req, res) => {
  const id = parseInt(req.params.id);
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead || !lead.magicToken) {
    return res.status(400).json({ success: false, message: 'Lead chưa approve.' });
  }
  const magicLink = `https://sol.vn/kich-hoat/?token=${lead.magicToken}`;
  return res.json({
    success:      true,
    deep_link:    makeZaloDeepLink(lead.zalo || lead.sdt),
    message:      makeZaloMessage(lead, magicLink),
    magic_link:   magicLink,
  });
});
