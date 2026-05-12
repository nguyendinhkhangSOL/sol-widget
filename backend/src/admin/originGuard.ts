// backend/src/admin/originGuard.ts
//
// Defense-in-depth: chỉ cho phép admin routes (mounted dưới /admin) khi
// Origin header thuộc whitelist admin domain. Block ngay trước
// authMiddleware để giảm load DB cho request từ origin không hợp lệ.
//
// CORS đã filter ở mức trình duyệt (browser preflight), nhưng tool như
// curl/Postman/server-to-server có thể bypass CORS — guard này check thêm.
//
// Apply: adminRouter.use(adminOriginGuard) trước authMiddleware.
//
// Dev: cho phép localhost:5176 (admin Vite). Prod: chỉ admin.sol.vn.

import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

const PROD_ALLOWED = new Set<string>([
  'https://admin.sol.vn',
]);

const DEV_ALLOWED = new Set<string>([
  'http://localhost:5176',
  'http://127.0.0.1:5176',
]);

/**
 * Parse origin/referer thành `protocol://host` (không có path/query).
 * referer thường có dạng `http://localhost:5176/users` → trả `http://localhost:5176`.
 */
function normalizeOrigin(raw: string): string {
  if (!raw) return '';
  try {
    const u = new URL(raw);
    return `${u.protocol}//${u.host}`;
  } catch {
    return raw.replace(/\/$/, '').split(/[?/]/)[0];
  }
}

export function adminOriginGuard(req: Request, res: Response, next: NextFunction) {
  // Bỏ qua trong NODE_ENV=test để unit test admin routes thuận tiện
  if (process.env.NODE_ENV === 'test') return next();

  // CORS preflight (OPTIONS) — cors() middleware đã handle. Skip để tránh
  // false positive (preflight không có Authorization header).
  if (req.method === 'OPTIONS') return next();

  const rawOrigin = req.headers.origin || req.headers.referer || '';
  const host = normalizeOrigin(String(rawOrigin));

  // Dev: allow cả prod origin lẫn localhost (server-to-server testing)
  // Prod: strict — chỉ admin.sol.vn
  const isProd = process.env.NODE_ENV === 'production';
  const allowed = isProd ? PROD_ALLOWED : new Set<string>([...PROD_ALLOWED, ...DEV_ALLOWED]);

  // Server-to-server (cron, Bash) → Origin header rỗng — vẫn cho qua
  // (authMiddleware sau sẽ check JWT có isAdmin không).
  if (!host) return next();

  if (allowed.has(host)) return next();

  logger.warn(
    { origin: host, path: req.path, ip: req.ip },
    'admin route blocked by originGuard',
  );

  return res.status(403).json({
    error: 'admin_origin_blocked',
    message: 'Admin endpoints chỉ accept request từ admin.sol.vn.',
  });
}
