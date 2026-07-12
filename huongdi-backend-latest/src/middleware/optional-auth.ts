// ═══════════════════════════════════════════════════════════════
// Optional Auth Middleware — parse JWT nếu có, không fail nếu không
// Path: /var/www/huongdi/backend/src/middleware/optional-auth.ts
// ═══════════════════════════════════════════════════════════════

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'huongdi-fallback-secret';

/**
 * Optional Auth — parse JWT từ Authorization header nếu có.
 * KHÔNG fail 401 nếu không có token — vì các endpoint như /p1/result
 * cho phép cả anonymous (sessionId) lẫn logged-in user.
 *
 * Nếu có JWT hợp lệ → attach req.user = { userId, tier, role }
 * Nếu không có / invalid → next() bình thường (req.user = undefined)
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = (req.headers.authorization || req.headers.Authorization) as string | undefined;
    if (!authHeader) return next();

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return next();

    const token = parts[1];
    if (!token) return next();

    // Verify + decode
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded && decoded.userId) {
      (req as any).user = {
        userId: decoded.userId,
        tier: decoded.tier,
        role: decoded.role,
        type: decoded.type,
      };
    }
  } catch (err) {
    // Invalid/expired token — silent, continue as anonymous
  }
  next();
}

export default optionalAuth;
