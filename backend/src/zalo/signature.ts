// backend/src/zalo/signature.ts
//
// Verify Zalo OA webhook signature.
//
// Zalo gửi header X-Zalo-Signature mỗi request webhook.
// Signature = HMAC-SHA256(body, ZALO_APP_SECRET).
//
// Mục đích: chống request giả mạo từ kẻ khác POST vào /api/zalo/webhook.
// Backend Sol verify signature trước khi xử lý — fail = 401.
//
// Docs: https://developers.zalo.me/docs/api/official-account-api/webhook
import crypto from 'crypto';
import { config } from '../config';
import { logger } from '../utils/logger';

/**
 * Verify Zalo webhook signature.
 * @param rawBody Raw request body (string, BEFORE JSON.parse)
 * @param signature Header X-Zalo-Signature từ Zalo
 * @returns true nếu signature hợp lệ
 */
export function verifyZaloSignature(rawBody: string, signature: string | undefined): boolean {
  if (!signature) return false;
  const secret = config.auth.zaloAppSecret;
  if (!secret) {
    logger.warn('ZALO_APP_SECRET chưa cấu hình — bỏ qua signature verify (dev mode)');
    return process.env.NODE_ENV !== 'production'; // dev mode: pass; prod: reject
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('hex');

  // Zalo format: "mac=<hex>". Bóc lấy phần hex.
  const provided = signature.startsWith('mac=') ? signature.slice(4) : signature;

  // Constant-time compare để tránh timing attack
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(provided, 'hex'),
    );
  } catch {
    return false;
  }
}
