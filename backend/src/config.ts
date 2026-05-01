// backend/src/config.ts
// Centralised config with typed env access.

import 'dotenv/config';

function req(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined) {
    throw new Error(`Missing env var: ${name}`);
  }
  return v;
}

function opt(name: string, fallback = ''): string {
  return process.env[name] ?? fallback;
}

function bool(name: string, fallback = false): boolean {
  const v = process.env[name];
  if (v === undefined) return fallback;
  return v === 'true' || v === '1';
}

function num(name: string, fallback: number): number {
  const v = process.env[name];
  if (v === undefined) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export const config = {
  env: opt('NODE_ENV', 'development'),
  port: num('PORT', 4000),
  publicOrigin: opt('PUBLIC_ORIGIN', 'http://localhost:4000'),
  corsOrigins: opt('CORS_ORIGINS', 'http://localhost:5173').split(',').map((s) => s.trim()),

  db: {
    url: req('DATABASE_URL'),
  },

  auth: {
    jwtSecret: req('JWT_SECRET', 'dev-secret-change-me'),
    jwtExpiresIn: opt('JWT_EXPIRES_IN', '30d'),
    otpTtlMinutes: num('OTP_TTL_MINUTES', 5),
    otpDevMode: bool('OTP_DEV_MODE', true),
    // Zalo OAuth — config từ Zalo Developer App
    // App Khang: https://developers.zalo.me/app/3779171417159107862
    zaloAppId: opt('ZALO_APP_ID', ''),
    zaloAppSecret: opt('ZALO_APP_SECRET', ''),
    // Callback URL phải khớp với cấu hình tab Login trong Zalo Developer.
    // Dev local: http://localhost:4000/api/auth/zalo/callback
    // Prod:     https://bothuocla.sol.vn/api/auth/zalo/callback
    // Test:     https://sol.vn/api/auth/zalo/callback (tạm khi chưa deploy bothuocla)
    zaloRedirectUri: opt(
      'ZALO_REDIRECT_URI',
      'http://localhost:4000/api/auth/zalo/callback',
    ),
    // Frontend URL — backend redirect user về đây sau khi OAuth xong
    // (kèm token trong query string).
    zaloFrontendUrl: opt('ZALO_FRONTEND_URL', 'http://localhost:5173'),
  },

  ai: {
    enabled: bool('ENABLE_AI', true),
    apiKey: opt('ANTHROPIC_API_KEY', ''),
    modelPrimary: opt('CLAUDE_MODEL_PRIMARY', 'claude-haiku-4-5-20251001'),
    modelEscalated: opt('CLAUDE_MODEL_ESCALATED', 'claude-sonnet-4-6'),
    dailyQuotaMsgs: num('AI_DAILY_QUOTA_MSGS', 30),
    maxOutputTokens: num('AI_MAX_OUTPUT_TOKENS', 400),
  },

  push: {
    publicKey: opt('VAPID_PUBLIC_KEY'),
    privateKey: opt('VAPID_PRIVATE_KEY'),
    subject: opt('VAPID_SUBJECT', 'mailto:hello@sol.vn'),
  },

  features: {
    scheduler: bool('ENABLE_SCHEDULER', true),
  },
};

export type Config = typeof config;
