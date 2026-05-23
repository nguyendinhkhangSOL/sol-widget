import { NextRequest, NextResponse } from 'next/server';
import { checkAdminKey } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  try {
    const { key } = await request.json();
    if (!key || typeof key !== 'string') {
      return NextResponse.json({ error: 'Key required' }, { status: 400 });
    }

    if (!checkAdminKey(key)) {
      // Throttle to slow brute force a bit
      await new Promise(r => setTimeout(r, 500));
      return NextResponse.json({ error: 'Sai key' }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set('sol_admin_key', key, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete('sol_admin_key');
  return res;
}

export const dynamic = 'force-dynamic';
