import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getMemberByPhone, getMemberIdFromSession, loadProfile, saveProfile, type ProfilePatch } from '@/lib/profile';
import { validateVietnamesePhone } from '@/lib/vietqr';

// ============================================================
// GET /api/profile?phone=0901234567  hoặc  GET /api/profile (session)
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const phone = request.nextUrl.searchParams.get('phone');
    let memberId: number | null = null;

    if (phone) {
      const check = validateVietnamesePhone(phone);
      if (!check.valid || !check.cleaned) {
        return NextResponse.json({ error: 'SĐT không hợp lệ' }, { status: 400 });
      }
      memberId = await getMemberByPhone(check.cleaned);
    } else {
      const sessionId = request.cookies.get('sol_session')?.value;
      if (sessionId) memberId = await getMemberIdFromSession(sessionId);
    }

    if (!memberId) {
      return NextResponse.json({ error: 'Không tìm thấy thông tin. Vui lòng đăng ký lại.' }, { status: 404 });
    }

    const profile = await loadProfile(memberId);
    if (!profile) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, profile });
  } catch (err: any) {
    console.error('[/api/profile GET] Error:', err);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

// ============================================================
// PATCH /api/profile — update profile
// ============================================================
const PatchSchema = z.object({
  phone: z.string().optional(), // required nếu không có session
  pronouns: z.string().min(1).max(20).optional(),
  assistant_name: z.string().min(1).max(50).optional(),
  quit_reasons: z.array(z.string().min(1).max(200)).max(5).optional(),
  top_triggers: z.array(z.string().min(1).max(50)).max(10).optional(),
  age: z.number().int().min(15).max(99).nullable().optional(),
  years_smoked: z.number().int().min(0).max(70).nullable().optional(),
  cigarettes_per_day: z.number().int().min(1).max(100).nullable().optional(),
  quiet_hours_start: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  quiet_hours_end: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  preferred_morning_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  preferred_evening_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  current_mood: z.enum(['improving', 'declining', 'stable']).optional(),
  mode: z.enum(['normal', 'calm', 'whisper', 'busy']).optional()
});

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = PatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    let memberId: number | null = null;

    if (parsed.data.phone) {
      const check = validateVietnamesePhone(parsed.data.phone);
      if (!check.valid || !check.cleaned) {
        return NextResponse.json({ error: 'SĐT không hợp lệ' }, { status: 400 });
      }
      memberId = await getMemberByPhone(check.cleaned);
    } else {
      const sessionId = request.cookies.get('sol_session')?.value;
      if (sessionId) memberId = await getMemberIdFromSession(sessionId);
    }

    if (!memberId) {
      return NextResponse.json({ error: 'Không xác định được tài khoản' }, { status: 401 });
    }

    const { phone: _phone, ...patch } = parsed.data;
    await saveProfile(memberId, patch as ProfilePatch);

    // Reload + return
    const updated = await loadProfile(memberId);
    return NextResponse.json({ ok: true, profile: updated });
  } catch (err: any) {
    console.error('[/api/profile PATCH] Error:', err);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
