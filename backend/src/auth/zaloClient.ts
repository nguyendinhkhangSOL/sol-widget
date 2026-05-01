// backend/src/auth/zaloClient.ts
//
// Zalo OAuth v4 client — chỉ wrap 2 endpoint cần thiết cho login flow:
//   1. POST /v4/oa/access_token   (exchange code → access_token)  — KHÔNG đúng cho user login!
//   2. GET  /v2.0/me              (fetch user info từ access_token)
//
// Lưu ý: Zalo có 2 luồng OAuth:
//   - "Login OAuth" cho user thường (oauth.zaloapp.com/v4/permission)
//     → cấp access_token để gọi openapi.zalo.me/v2.0/me
//   - "OA OAuth" cho người quản trị OA (oauth.zaloapp.com/v4/oa/permission)
//     → cấp OA access_token để gọi openapi.zalo.me/v2.0/oa/...
//
// Module này dùng LOGIN OAuth — để xác thực user đăng nhập widget bằng
// Zalo cá nhân của họ. KHÔNG nhầm với OA OAuth.
//
// Docs: https://developers.zalo.me/docs/social/login
//       https://developers.zalo.me/docs/api/social-api/tham-khao/user-access-token-post-4316

import { config } from '../config';
import { logger } from '../utils/logger';
import crypto from 'crypto';

const ZALO_OAUTH_BASE = 'https://oauth.zaloapp.com/v4';
const ZALO_OPENAPI_BASE = 'https://openapi.zalo.me/v2.0';

/**
 * Generate URL để redirect user sang Zalo authorize.
 * State = random string để chống CSRF; FE/BE phải verify khớp khi nhận callback.
 *
 * Zalo Login URL pattern:
 *   https://oauth.zaloapp.com/v4/permission?app_id=...&redirect_uri=...&state=...
 */
export function buildZaloAuthUrl(state: string, codeChallenge: string): string {
  const params = new URLSearchParams({
    app_id: config.auth.zaloAppId,
    redirect_uri: config.auth.zaloRedirectUri,
    state,
    // Zalo yêu cầu PKCE (code_challenge + code_verifier) cho web flow
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });
  return `${ZALO_OAUTH_BASE}/permission?${params.toString()}`;
}

/**
 * PKCE helpers — sinh code_verifier (random) + code_challenge (SHA256 base64url).
 * Code verifier giữ ở backend session/state cache để gửi lại khi exchange token.
 */
export function generatePkce(): { verifier: string; challenge: string } {
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url');
  return { verifier, challenge };
}

export function generateState(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Exchange OAuth code → user access_token.
 * Zalo trả về:
 *   { access_token: "...", refresh_token: "...", expires_in: 3600 }
 */
export async function exchangeCodeForToken(
  code: string,
  codeVerifier: string,
): Promise<{ accessToken: string; refreshToken?: string; expiresIn: number }> {
  if (!config.auth.zaloAppId || !config.auth.zaloAppSecret) {
    throw new Error('zalo_not_configured');
  }

  const body = new URLSearchParams({
    code,
    app_id: config.auth.zaloAppId,
    grant_type: 'authorization_code',
    code_verifier: codeVerifier,
  });

  const res = await fetch(`${ZALO_OAUTH_BASE}/access_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      secret_key: config.auth.zaloAppSecret,
    },
    body: body.toString(),
  });

  const data = (await res.json()) as any;

  if (!res.ok || !data.access_token) {
    logger.error({ status: res.status, data }, 'Zalo exchangeCodeForToken failed');
    throw new Error('zalo_exchange_failed');
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: Number(data.expires_in ?? 3600),
  };
}

/**
 * Fetch Zalo user info dùng access_token.
 * Zalo trả về:
 *   { id: "1234567890", name: "Nguyễn A", picture: { data: { url: "..." } } }
 */
export async function fetchZaloUser(
  accessToken: string,
): Promise<{ id: string; name: string; pictureUrl?: string }> {
  // Zalo /me endpoint cần fields query để chỉ định
  const fields = ['id', 'name', 'picture'].join(',');
  const url = `${ZALO_OPENAPI_BASE}/me?fields=${fields}`;

  const res = await fetch(url, {
    headers: { access_token: accessToken },
  });

  const data = (await res.json()) as any;

  if (!res.ok || !data.id) {
    logger.error({ status: res.status, data }, 'Zalo fetchZaloUser failed');
    throw new Error('zalo_user_fetch_failed');
  }

  return {
    id: String(data.id),
    name: String(data.name ?? '').trim() || 'Zalo User',
    pictureUrl: data.picture?.data?.url,
  };
}
