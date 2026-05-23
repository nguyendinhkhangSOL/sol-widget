import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getFtndResult, validateAnswers } from '@/lib/ftnd';
import { queryOne } from '@/lib/db';
import { randomUUID } from 'crypto';

const RequestSchema = z.object({
  answers: z.array(
    z.object({
      q: z.number().int().min(1).max(6),
      a: z.number().int().min(0).max(3)
    })
  ).length(6),
  utm_source: z.string().optional(),
  utm_campaign: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const validation = validateAnswers(parsed.data.answers);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Câu trả lời không hợp lệ', details: validation.errors },
        { status: 400 }
      );
    }

    const result = getFtndResult(parsed.data.answers);

    const sessionId =
      request.cookies.get('sol_session')?.value || randomUUID();
    const userAgent = request.headers.get('user-agent') || null;
    const referrer = request.headers.get('referer') || null;
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      null;

    const inserted = await queryOne<{ id: number }>(
      `INSERT INTO test_results
        (session_id, ftnd_score, cohort, answers, user_agent, ip_address, referrer, utm_source, utm_campaign)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        sessionId,
        result.score,
        result.cohort,
        JSON.stringify(parsed.data.answers),
        userAgent,
        ip,
        referrer,
        parsed.data.utm_source || null,
        parsed.data.utm_campaign || null
      ]
    );

    if (!inserted) {
      throw new Error('Insert failed');
    }

    const response = NextResponse.json({
      id: inserted.id,
      score: result.score,
      cohort: result.cohort,
      plan: {
        id: result.plan.id,
        name: result.plan.name,
        audienceLabel: result.plan.audienceLabel,
        totalDays: result.plan.totalDays,
        totalPrice: result.plan.totalPrice,
        freeDays: result.plan.freeDays,
        paidDays: result.plan.paidDays,
        dailyRate: result.plan.dailyRate
      }
    });

    if (!request.cookies.get('sol_session')) {
      response.cookies.set('sol_session', sessionId, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30
      });
    }

    return response;
  } catch (err: any) {
    console.error('[/api/test-result] Error:', err);
    return NextResponse.json(
      { error: 'Lỗi server. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
