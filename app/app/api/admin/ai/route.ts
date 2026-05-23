import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isAdminAuthorizedRequest } from '@/lib/admin-auth';
import { saveAiSettings, maskAiSettings, getAiSettings } from '@/lib/ai/settings';

const Schema = z.object({
  enabled: z.boolean().optional(),
  provider: z.enum(['openai', 'anthropic', 'gemini']).optional(),
  apiKey: z.string().min(1).optional(),
  modelPrimary: z.string().min(1).optional(),
  modelEscalated: z.string().min(1).optional(),
  dailyQuotaMsgs: z.number().int().min(1).max(10000).optional(),
  maxOutputTokens: z.number().int().min(50).max(8000).optional(),
  temperature: z.number().min(0).max(1).optional()
});

export async function GET(request: NextRequest) {
  if (!isAdminAuthorizedRequest(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const s = await getAiSettings(true);
  return NextResponse.json({ ok: true, settings: maskAiSettings(s) });
}

export async function PATCH(request: NextRequest) {
  if (!isAdminAuthorizedRequest(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid' }, { status: 400 });
    }
    const updated = await saveAiSettings(parsed.data, 'admin');
    return NextResponse.json({ ok: true, settings: maskAiSettings(updated) });
  } catch (err: any) {
    console.error('[admin/ai PATCH]', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
