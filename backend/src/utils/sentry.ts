// backend/src/utils/sentry.ts
//
// Sentry error monitoring cho backend Express + Socket.IO.
// Config qua env: SENTRY_DSN (nếu rỗng → tắt Sentry, không crash).
//
// Lazy require để @sentry/node không phải dependency cứng — npm install
// chưa chạy thì Sentry tự bypass, không break build.
//
// Setup:
//   1. Tạo account tại https://sentry.io (free tier 5k events/month)
//   2. Tạo project "sol-backend" → copy DSN
//   3. backend/.env: SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
//   4. npm install (sẽ pull @sentry/node theo dependencies)

import type { Request, Response, NextFunction } from 'express';
import { config } from '../config';

let Sentry: any = null;
let initialized = false;

function loadSentry(): any {
  if (Sentry) return Sentry;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Sentry = require('@sentry/node');
    return Sentry;
  } catch {
    return null;
  }
}

export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    console.log('[sentry] DSN không có — bỏ qua. Set SENTRY_DSN để bật.');
    return;
  }

  const S = loadSentry();
  if (!S) {
    console.log('[sentry] @sentry/node chưa cài — chạy npm install để bật.');
    return;
  }

  S.init({
    dsn,
    environment: config.env,
    tracesSampleRate: config.env === 'production' ? 0.5 : 1.0,
    beforeSend(event: any, hint: any) {
      const error = hint.originalException as any;
      // Bỏ qua 4xx errors có status code
      if (error?.statusCode && error.statusCode < 500) {
        return null;
      }
      return event;
    },
    initialScope: {
      tags: { service: 'sol-backend' },
    },
  });

  initialized = true;
  console.log('[sentry] Initialized — env:', config.env);
}

export function sentryErrorHandler(
  err: any,
  _req: Request,
  _res: Response,
  next: NextFunction,
) {
  if (initialized && Sentry) {
    Sentry.captureException(err);
  }
  next(err);
}

export function captureError(err: unknown, context?: Record<string, any>) {
  if (!initialized || !Sentry) return;
  Sentry.captureException(err, { extra: context });
}

export function setUser(userId: string | null) {
  if (!initialized || !Sentry) return;
  if (userId) {
    Sentry.setUser({ id: userId });
  } else {
    Sentry.setUser(null);
  }
}
