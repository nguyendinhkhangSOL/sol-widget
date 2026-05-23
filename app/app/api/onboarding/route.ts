import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query, queryOne } from '@/lib/db';
import { validateVietnamesePhone } from '@/lib/vietqr';

const RequestSchema = z.object({
  phone: z.string(),
  full_name: z.string().min(2, 'Tên quá ngắn').max(255),
  cohort: z.enum(['LIGHT', 'MODERATE', 'HEAVY']),
  test_result_id: z.number().int().optional(),
  source: z.string().max(50).optional().default('organic'),
  email: z.string().email().optional(),
  metadata: z.record(z.any()).optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Validate phone
    const phoneCheck = validateVietnamesePhone(data.phone);
    if (!phoneCheck.valid || !phoneCheck.cleaned) {
      return NextResponse.json(
        { error: phoneCheck.error || 'SĐT không hợp lệ' },
        { status: 400 }
      );
    }
    const phone = phoneCheck.cleaned;

    // Get FTND score from test_results
    let ftndScore: number | null = null;
    if (data.test_result_id) {
      const test = await queryOne<{ ftnd_score: number }>(
        `SELECT ftnd_score FROM test_results WHERE id = $1`,
        [data.test_result_id]
      );
      if (test) ftndScore = test.ftnd_score;
    }

    // Check if member already exists
    const existing = await queryOne<{ id: number; stage: string }>(
      `SELECT id, stage FROM members WHERE phone = $1`,
      [phone]
    );

    let memberId: number;
    let isNew = false;

    if (existing) {
      // Update existing member
      const updated = await queryOne<{ id: number }>(
        `UPDATE members SET
          full_name = COALESCE($2, full_name),
          email = COALESCE($3, email),
          cohort = COALESCE($4, cohort),
          ftnd_score = COALESCE($5, ftnd_score),
          test_result_id = COALESCE($6, test_result_id),
          updated_at = NOW(),
          last_active_at = NOW()
         WHERE phone = $1
         RETURNING id`,
        [
          phone,
          data.full_name,
          data.email || null,
          data.cohort,
          ftndScore,
          data.test_result_id || null
        ]
      );
      memberId = updated!.id;
    } else {
      // Insert new member with 7-day trial
      const inserted = await queryOne<{ id: number }>(
        `INSERT INTO members
          (phone, full_name, email, cohort, ftnd_score, test_result_id, source,
           stage, trial_started_at, trial_ends_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'recognition', NOW(), NOW() + INTERVAL '7 days')
         RETURNING id`,
        [
          phone,
          data.full_name,
          data.email || null,
          data.cohort,
          ftndScore,
          data.test_result_id || null,
          data.source || 'organic'
        ]
      );
      memberId = inserted!.id;
      isNew = true;
    }

    // Record initial checkin
    await query(
      `INSERT INTO checkins (member_id, date, action_type, metadata)
       VALUES ($1, CURRENT_DATE, 'signup', $2)
       ON CONFLICT (member_id, date, action_type) DO NOTHING`,
      [memberId, JSON.stringify({ source: data.source, cohort: data.cohort })]
    );

    // TODO: Send Zalo OA notification to user (when Zalo OA is setup)
    // TODO: Send admin notification (email/Zalo to Khang)

    return NextResponse.json({
      ok: true,
      member_id: memberId,
      phone,
      cohort: data.cohort,
      is_new: isNew,
      trial_days: 7,
      message: isNew
        ? '7 ngày Nhận Diện đã bắt đầu. Khang sẽ Zalo cho anh trong 24h.'
        : 'Cập nhật thông tin thành công.'
    });
  } catch (err: any) {
    console.error('[/api/onboarding] Error:', err);
    return NextResponse.json(
      { error: 'Lỗi server. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
