import { NextResponse } from 'next/server';

// Deprecated — replaced by /api/onboarding (phone-first)
export async function POST() {
  return NextResponse.json(
    { error: 'Endpoint deprecated. Use /api/onboarding instead.' },
    { status: 410 }
  );
}
