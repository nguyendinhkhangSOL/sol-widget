import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query, queryOne } from '@/lib/db';
import { isAdminAuthorizedRequest } from '@/lib/admin-auth';
import { invalidateChipsCache } from '@/lib/chips/loader';

const ChipSchema = z.object({
  id: z.number().int().optional(),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, 'Slug chỉ chữ thường, số, dấu gạch ngang').optional(),
  label: z.string().min(1).max(150).optional(),
  icon: z.string().max(10).optional(),
  answer: z.string().min(1).max(4000).optional(),
  wiki_url: z.string().max(500).nullable().optional(),
  wiki_label: z.string().max(150).nullable().optional(),
  reusable: z.boolean().optional(),
  sort_order: z.number().int().optional(),
  enabled: z.boolean().optional(),
  triggers: z.array(z.string().min(1).max(100)).max(50).optional(),
  priority: z.number().int().min(0).max(10000).optional(),
  min_score: z.number().min(0).max(1).optional(),
  category: z.string().max(50).nullable().optional()
});

// CREATE
export async function POST(request: NextRequest) {
  if (!isAdminAuthorizedRequest(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const parsed = ChipSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid' }, { status: 400 });
    }
    const d = parsed.data;
    if (!d.slug || !d.label || !d.answer) {
      return NextResponse.json({ error: 'slug, label, answer là bắt buộc' }, { status: 400 });
    }

    const inserted = await queryOne<{ id: number }>(
      `INSERT INTO canned_replies
        (slug, label, icon, answer, wiki_url, wiki_label, reusable, sort_order, enabled,
         triggers, priority, min_score, category)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id`,
      [
        d.slug, d.label, d.icon || '💬', d.answer,
        d.wiki_url || null, d.wiki_label || null,
        d.reusable ?? false, d.sort_order ?? 100, d.enabled ?? true,
        d.triggers ?? [], d.priority ?? 100, d.min_score ?? 0.5, d.category || 'other'
      ]
    );

    invalidateChipsCache();
    return NextResponse.json({ ok: true, id: inserted!.id });
  } catch (err: any) {
    if (err.code === '23505') {
      return NextResponse.json({ error: 'Slug đã tồn tại' }, { status: 409 });
    }
    console.error('[canned POST]', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

// UPDATE
export async function PATCH(request: NextRequest) {
  if (!isAdminAuthorizedRequest(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const parsed = ChipSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid' }, { status: 400 });
    }
    const { id, ...d } = parsed.data;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const sets: string[] = [];
    const vals: any[] = [id];
    let i = 2;
    function add(col: string, val: any) {
      sets.push(`${col} = $${i}`);
      vals.push(val);
      i++;
    }

    if (d.slug !== undefined) add('slug', d.slug);
    if (d.label !== undefined) add('label', d.label);
    if (d.icon !== undefined) add('icon', d.icon || '💬');
    if (d.answer !== undefined) add('answer', d.answer);
    if (d.wiki_url !== undefined) add('wiki_url', d.wiki_url || null);
    if (d.wiki_label !== undefined) add('wiki_label', d.wiki_label || null);
    if (d.reusable !== undefined) add('reusable', d.reusable);
    if (d.sort_order !== undefined) add('sort_order', d.sort_order);
    if (d.enabled !== undefined) add('enabled', d.enabled);
    if (d.triggers !== undefined) add('triggers', d.triggers);
    if (d.priority !== undefined) add('priority', d.priority);
    if (d.min_score !== undefined) add('min_score', d.min_score);
    if (d.category !== undefined) add('category', d.category);

    if (sets.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });

    await query(
      `UPDATE canned_replies SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $1`,
      vals
    );

    invalidateChipsCache();
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err.code === '23505') {
      return NextResponse.json({ error: 'Slug đã tồn tại' }, { status: 409 });
    }
    console.error('[canned PATCH]', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

// DELETE ?id=N
export async function DELETE(request: NextRequest) {
  if (!isAdminAuthorizedRequest(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const id = parseInt(request.nextUrl.searchParams.get('id') || '0', 10);
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await query(`DELETE FROM canned_replies WHERE id = $1`, [id]);
    invalidateChipsCache();
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[canned DELETE]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
