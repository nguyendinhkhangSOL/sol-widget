/**
 * Admin auth helper — simple query/cookie-based for v0.2
 * TODO: replace with proper session auth (NextAuth, custom JWT) trong v0.3
 */

import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const ADMIN_KEY = process.env.ADMIN_PANEL_KEY || 'khang-sol-2026';

export function isAdminAuthorized(): boolean {
  const cookie = cookies().get('sol_admin_key')?.value;
  return cookie === ADMIN_KEY;
}

export function isAdminAuthorizedRequest(request: NextRequest): boolean {
  const cookieKey = request.cookies.get('sol_admin_key')?.value;
  if (cookieKey === ADMIN_KEY) return true;
  // Allow query param too (for API testing)
  const queryKey = request.nextUrl.searchParams.get('admin_key');
  return queryKey === ADMIN_KEY;
}

export function checkAdminKey(key: string): boolean {
  return key === ADMIN_KEY;
}
