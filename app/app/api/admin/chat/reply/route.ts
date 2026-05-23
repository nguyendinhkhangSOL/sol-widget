import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query, queryOne } from '@/lib/db';
import { isAdminAuthorizedRequest } from '@/lib/admin-auth';

const Schema = z.object({
  thread_id: z.number().int().positive(),
  content: z.string().min(1).max(4000),
  sender_name: z.string().optional().default('Khang Sol')
});

export async function POST(request: NextRequest) {
  try {
    if (!isAdminAuthorizedRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 });
    }

    const { thread_id, content, sender_name } = parsed.data;

    const thread = await queryOne<{ id: number }>(`SELECT id FROM chat_threads WHERE id = $1`, [thread_id]);
    if (!thread) return NextResponse.json({ error: 'Thread không tồn tại' }, { status: 404 });

    const inserted = await queryOne<{ id: number; created_at: string }>(
      `INSERT INTO chat_messages (thread_id, sender_type, sender_id, sender_name, content, content_type)
       VALUES ($1, 'admin', 'khang', $2, $3, 'text')
       RETURNING id, created_at`,
      [thread_id, sender_name, content]
    );

    return NextResponse.json({ ok: true, message_id: inserted!.id, created_at: inserted!.created_at });
  } catch (err: any) {
    console.error('[/api/admin/chat/reply] Error:', err);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
