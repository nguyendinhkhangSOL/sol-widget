// backend/src/admin/content/routes.ts
// Admin content management routes — mounted at /admin/content
//
// Tất cả route đã được protected bởi authMiddleware + adminMiddleware
// (apply qua adminRouter trong src/admin/routes.ts).

import { Router } from 'express';
import { z } from 'zod';
import {
  listContent,
  getOne,
  updateContent,
  listRevisions,
  restoreRevision,
  createContent,
  deleteContent,
  type ListFilter,
} from './service';
import { lintContent, renderPreview, type MockUserPreview } from './linter';
import type { AuthedRequest } from '../../auth/middleware';

export const contentRouter = Router();

// ─── GET / — list with filters ──────────────────────────────────────────
contentRouter.get('/', async (req, res) => {
  const filter: ListFilter = {
    module: req.query.module as any,
    dayNumber: req.query.dayNumber ? parseInt(String(req.query.dayNumber), 10) : undefined,
    voice: req.query.voice as any,
    search: req.query.search ? String(req.query.search) : undefined,
    published: (req.query.published as any) ?? 'all',
    hasTargeting: (req.query.hasTargeting as any) ?? 'all',
  };
  const result = await listContent(filter);
  res.json(result);
});

// ─── GET /:id — single item ─────────────────────────────────────────────
contentRouter.get('/:id', async (req, res) => {
  const item = await getOne(req.params.id);
  if (!item) return res.status(404).json({ error: 'not_found' });
  res.json(item);
});

// ─── PATCH /:id — update content + auto revision snapshot ───────────────
const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  body: z.string().min(1).max(2000).optional(),
  voice: z.enum(['KHANG_SOL', 'SOL_DONG_HANH']).optional(),
  priority: z.number().int().min(0).max(1000).optional(),
  targetRules: z.any().optional(),
  published: z.boolean().optional(),
  wikiUrl: z.string().url().nullable().optional(),
  moment: z.enum(['COFFEE_MORNING', 'TEA_AFTERNOON', 'POST_LUNCH', 'POST_DINNER', 'PRE_SOCIAL_DRINK', 'PRE_BEDTIME', 'GENERIC']).nullable().optional(),
  changeNote: z.string().max(500).optional(),
});

contentRouter.patch('/:id', async (req: AuthedRequest, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_payload', detail: parsed.error.flatten() });

  try {
    const updated = await updateContent(req.params.id, parsed.data, req.userId!);
    res.json(updated);
  } catch (err: any) {
    if (err.message === 'Content item not found') return res.status(404).json({ error: 'not_found' });
    throw err;
  }
});

// ─── POST / — create new content ────────────────────────────────────────
const createSchema = z.object({
  dayNumber: z.number().int().min(1).max(365),
  module: z.enum(['MORNING_GOAL', 'SCIENCE_TIP', 'PHENOMENA_ALERT', 'EXERCISE', 'NIGHT_STORY']),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(2000),
  voice: z.enum(['KHANG_SOL', 'SOL_DONG_HANH']).optional(),
  priority: z.number().int().min(0).max(1000).optional(),
  targetRules: z.any().optional(),
  wikiUrl: z.string().url().optional(),
  pushTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  exerciseKey: z.string().max(100).optional(),
  published: z.boolean().optional(),
});

contentRouter.post('/', async (req: AuthedRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_payload', detail: parsed.error.flatten() });

  const created = await createContent(parsed.data, req.userId!);
  res.json(created);
});

// ─── DELETE /:id ────────────────────────────────────────────────────────
contentRouter.delete('/:id', async (req, res) => {
  await deleteContent(req.params.id);
  res.json({ ok: true });
});

// ─── GET /:id/revisions ─────────────────────────────────────────────────
contentRouter.get('/:id/revisions', async (req, res) => {
  const revisions = await listRevisions(req.params.id);
  res.json({ revisions });
});

// ─── POST /:id/restore/:versionNum ──────────────────────────────────────
contentRouter.post('/:id/restore/:versionNum', async (req: AuthedRequest, res) => {
  const versionNum = parseInt(req.params.versionNum, 10);
  if (isNaN(versionNum)) return res.status(400).json({ error: 'invalid_version' });

  try {
    const restored = await restoreRevision(req.params.id, versionNum, req.userId!);
    res.json(restored);
  } catch (err: any) {
    if (err.message === 'Revision not found') return res.status(404).json({ error: 'revision_not_found' });
    throw err;
  }
});

// ─── POST /preview — render text với mock user + lint warnings ──────────
const previewSchema = z.object({
  title: z.string().optional(),
  body: z.string(),
  voice: z.enum(['KHANG_SOL', 'SOL_DONG_HANH']).optional(),
  dayNumber: z.number().int().min(1).max(365).optional(),
  mockUser: z
    .object({
      name: z.string().optional(),
      pronouns: z.string().optional(),
      assistantName: z.string().optional(),
      quitReasons: z.array(z.string()).optional(),
      topTriggers: z.array(z.string()).optional(),
      age: z.number().optional(),
      gender: z.enum(['male', 'female']).optional(),
      region: z.enum(['north', 'central', 'south']).optional(),
    })
    .optional(),
});

contentRouter.post('/preview', async (req, res) => {
  const parsed = previewSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_payload', detail: parsed.error.flatten() });

  const { title, body, dayNumber = 14, mockUser = {} } = parsed.data;
  const renderedTitle = title ? renderPreview(title, mockUser as MockUserPreview, dayNumber) : '';
  const renderedBody = renderPreview(body, mockUser as MockUserPreview, dayNumber);

  const titleWarnings = title ? lintContent(title, 'title') : [];
  const bodyWarnings = lintContent(body, 'body');

  res.json({
    renderedTitle,
    renderedBody,
    titleWarnings,
    bodyWarnings,
    mockUser,
    dayNumber,
  });
});

// ─── POST /lint — chỉ lint không render preview (faster) ────────────────
contentRouter.post('/lint', async (req, res) => {
  const text = String(req.body?.text ?? '');
  const context = (req.body?.context === 'title' ? 'title' : 'body') as 'title' | 'body';
  const warnings = lintContent(text, context);
  res.json({ warnings });
});
