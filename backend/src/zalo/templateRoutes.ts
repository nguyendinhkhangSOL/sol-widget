// backend/src/zalo/templateRoutes.ts
//
// CRUD endpoints cho ZaloTemplate (Admin only).
//   GET    /api/zalo/templates           — list tất cả
//   GET    /api/zalo/templates/:code     — chi tiết 1 template
//   POST   /api/zalo/templates           — tạo mới
//   PUT    /api/zalo/templates/:code     — update
//   DELETE /api/zalo/templates/:code     — archive (soft delete)
//   POST   /api/zalo/templates/:code/submit — submit lên Zalo (TODO Phase 2: gọi API Zalo Business Manager)
//
// Tất cả endpoints yêu cầu user.isAdmin = true.

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { logger } from '../utils/logger';
import { authMiddleware, type AuthedRequest } from '../auth/middleware';

export const zaloTemplateRouter = Router();
zaloTemplateRouter.use(authMiddleware);

// ─── Admin guard ────────────────────────────────────────────────────────
async function requireAdmin(userId: string): Promise<boolean> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } });
  return !!u?.isAdmin;
}

// ─── Schema validation ──────────────────────────────────────────────────
const ctaButtonSchema = z.object({
  label: z.string().min(1).max(40),
  type: z.enum(['OPEN_URL', 'MAKE_PHONE_CALL', 'OPEN_ZALO_CHAT', 'SEND_SMS', 'COPY']),
  value: z.string().max(500).optional(),
});

const templateSchema = z.object({
  code: z.string().regex(/^SOL_[A-Z0-9_]+$/, 'Code phải dạng SOL_XXX uppercase').min(5).max(40),
  zaloManagerName: z.string().min(10).max(60),
  tag: z.enum(['1', '2', '3']).default('2'),
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(800),
  ctaButtons: z.array(ctaButtonSchema).max(2).default([]),
  params: z.array(z.string()).default([]),
  voiceTemplateCode: z.string().optional(),
  textFallbackCode: z.string().optional(),
});

// ─── GET /api/zalo/templates — list ─────────────────────────────────────
zaloTemplateRouter.get('/', async (req: AuthedRequest, res) => {
  if (!(await requireAdmin(req.userId!))) {
    return res.status(403).json({ error: 'forbidden' });
  }
  const items = await prisma.zaloTemplate.findMany({
    orderBy: { updatedAt: 'desc' },
  });
  res.json({ items });
});

// ─── GET /api/zalo/templates/:code ──────────────────────────────────────
zaloTemplateRouter.get('/:code', async (req: AuthedRequest, res) => {
  if (!(await requireAdmin(req.userId!))) {
    return res.status(403).json({ error: 'forbidden' });
  }
  const tpl = await prisma.zaloTemplate.findUnique({ where: { code: req.params.code } });
  if (!tpl) return res.status(404).json({ error: 'not_found' });
  res.json(tpl);
});

// ─── POST /api/zalo/templates — create new ──────────────────────────────
zaloTemplateRouter.post('/', async (req: AuthedRequest, res) => {
  if (!(await requireAdmin(req.userId!))) {
    return res.status(403).json({ error: 'forbidden' });
  }
  const parsed = templateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_body', details: parsed.error.format() });
  }
  const data = parsed.data;

  // Check code unique
  const existing = await prisma.zaloTemplate.findUnique({ where: { code: data.code } });
  if (existing) {
    return res.status(409).json({ error: 'code_exists' });
  }

  const charCount = data.title.length + data.body.length;
  if (charCount > 400) {
    return res.status(400).json({ error: 'char_count_exceeded', charCount });
  }

  const created = await prisma.zaloTemplate.create({
    data: {
      code: data.code,
      zaloManagerName: data.zaloManagerName,
      tag: data.tag,
      title: data.title,
      body: data.body,
      ctaButtons: data.ctaButtons,
      params: data.params,
      voiceTemplateCode: data.voiceTemplateCode,
      textFallbackCode: data.textFallbackCode,
      charCount,
      status: 'DRAFT',
      createdBy: req.userId,
    },
  });
  logger.info({ code: data.code, createdBy: req.userId }, 'ZaloTemplate created');
  res.json(created);
});

// ─── PUT /api/zalo/templates/:code — update ─────────────────────────────
zaloTemplateRouter.put('/:code', async (req: AuthedRequest, res) => {
  if (!(await requireAdmin(req.userId!))) {
    return res.status(403).json({ error: 'forbidden' });
  }
  const parsed = templateSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_body', details: parsed.error.format() });
  }
  const data = parsed.data;

  const existing = await prisma.zaloTemplate.findUnique({ where: { code: req.params.code } });
  if (!existing) return res.status(404).json({ error: 'not_found' });

  // Recompute charCount if title/body changed
  const title = data.title ?? existing.title;
  const body = data.body ?? existing.body;
  const charCount = title.length + body.length;
  if (charCount > 400) {
    return res.status(400).json({ error: 'char_count_exceeded', charCount });
  }

  const updated = await prisma.zaloTemplate.update({
    where: { code: req.params.code },
    data: {
      ...data,
      charCount,
      // Nếu đã APPROVED và Khang edit → status về DRAFT (cần resubmit)
      ...(existing.status === 'APPROVED' && (data.title || data.body || data.ctaButtons)
        ? { status: 'DRAFT', zaloTemplateId: null, approvedAt: null }
        : {}),
    },
  });
  logger.info({ code: req.params.code }, 'ZaloTemplate updated');
  res.json(updated);
});

// ─── DELETE /api/zalo/templates/:code — soft archive ────────────────────
zaloTemplateRouter.delete('/:code', async (req: AuthedRequest, res) => {
  if (!(await requireAdmin(req.userId!))) {
    return res.status(403).json({ error: 'forbidden' });
  }
  const existing = await prisma.zaloTemplate.findUnique({ where: { code: req.params.code } });
  if (!existing) return res.status(404).json({ error: 'not_found' });

  const archived = await prisma.zaloTemplate.update({
    where: { code: req.params.code },
    data: { status: 'ARCHIVED', archivedAt: new Date() },
  });
  res.json(archived);
});

// ─── POST /:code/submit — submit Zalo (mock) ───────────────────────────
zaloTemplateRouter.post('/:code/submit', async (req: AuthedRequest, res) => {
  if (!(await requireAdmin(req.userId!))) {
    return res.status(403).json({ error: 'forbidden' });
  }
  const existing = await prisma.zaloTemplate.findUnique({ where: { code: req.params.code } });
  if (!existing) return res.status(404).json({ error: 'not_found' });
  if (existing.status !== 'DRAFT' && existing.status !== 'REJECTED') {
    return res.status(400).json({ error: 'invalid_status', current: existing.status });
  }

  // TODO Phase 2: gọi Zalo Business Manager API submit template.
  // Hiện tại mock — chỉ chuyển status PENDING.
  const updated = await prisma.zaloTemplate.update({
    where: { code: req.params.code },
    data: { status: 'PENDING', submittedAt: new Date(), rejectReason: null },
  });
  logger.info({ code: req.params.code }, 'ZaloTemplate submitted to Zalo (mock)');
  res.json({
    ...updated,
    message: 'Submitted to Zalo (mock mode). Phase 2 sẽ wire API thật.',
  });
});

// ─── POST /:code/test — gửi ZNS test cho admin ──────────────────────────
zaloTemplateRouter.post('/:code/test', async (req: AuthedRequest, res) => {
  if (!(await requireAdmin(req.userId!))) {
    return res.status(403).json({ error: 'forbidden' });
  }
  const existing = await prisma.zaloTemplate.findUnique({ where: { code: req.params.code } });
  if (!existing) return res.status(404).json({ error: 'not_found' });

  // TODO Phase 2: gọi ZNS API gửi test cho Khang phone.
  res.json({
    ok: true,
    message: `Test send mock — sẽ gửi tin ZNS template ${existing.code} tới Khang (Phase 2).`,
  });
});
