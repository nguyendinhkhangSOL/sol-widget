import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isAdminAuthorizedRequest } from '@/lib/admin-auth';
import { pingProvider } from '@/lib/ai/mentor';
import { getAiSettings } from '@/lib/ai/settings';

const Schema = z.object({
  provider: z.enum(['openai', 'anthropic', 'gemini']),
  apiKey: z.string().min(1).optional(),
  model: z.string().min(1)
});

export async function POST(request: NextRequest) {
  if (!isAdminAuthorizedRequest(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Invalid input' }, { status: 400 });
    }

    let key = parsed.data.apiKey;
    if (!key) {
      // Use current key from settings
      const s = await getAiSettings(true);
      key = s.apiKey;
    }
    if (!key) {
      return NextResponse.json({ ok: false, error: 'Không có API key (chưa save)' });
    }

    const result = await pingProvider({
      provider: parsed.data.provider,
      apiKey: key,
      model: parsed.data.model
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[admin/ai/ping]', err);
    return NextResponse.json({ ok: false, error: err.message || 'Server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
