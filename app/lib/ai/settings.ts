/**
 * AI Settings — DB-backed (app_settings table) with 30s in-process cache
 * Ported from backend/src/ai/settings.ts
 */

import { queryOne, query } from '@/lib/db';
import type { AiProvider } from './providers';

export interface AiSettings {
  enabled: boolean;
  provider: AiProvider;
  apiKey: string;
  modelPrimary: string;
  modelEscalated: string;
  dailyQuotaMsgs: number;
  maxOutputTokens: number;
  temperature: number;
  source: 'db' | 'env';
}

let cached: AiSettings | null = null;
let cachedAt = 0;
const TTL_MS = 30_000;

function fromEnv(): AiSettings {
  // Provider-specific key lookup: OPENAI_API_KEY > ANTHROPIC_API_KEY > GEMINI_API_KEY
  const provider: AiProvider =
    (process.env.AI_PROVIDER as AiProvider) ||
    (process.env.OPENAI_API_KEY ? 'openai' : process.env.ANTHROPIC_API_KEY ? 'anthropic' : 'gemini');

  const apiKey =
    provider === 'openai'
      ? process.env.OPENAI_API_KEY || ''
      : provider === 'anthropic'
        ? process.env.ANTHROPIC_API_KEY || ''
        : process.env.GEMINI_API_KEY || '';

  return {
    enabled: process.env.AI_ENABLED !== 'false',
    provider,
    apiKey,
    modelPrimary: process.env.AI_MODEL_PRIMARY || defaultModel(provider, 'primary'),
    modelEscalated: process.env.AI_MODEL_ESCALATED || defaultModel(provider, 'escalated'),
    dailyQuotaMsgs: Number(process.env.AI_DAILY_QUOTA_MSGS || 30),
    maxOutputTokens: Number(process.env.AI_MAX_OUTPUT_TOKENS || 400),
    temperature: Number(process.env.AI_TEMPERATURE || 0.7),
    source: 'env'
  };
}

function defaultModel(provider: AiProvider, level: 'primary' | 'escalated'): string {
  const map: Record<AiProvider, { primary: string; escalated: string }> = {
    openai: { primary: 'gpt-4o-mini', escalated: 'gpt-4o' },
    anthropic: { primary: 'claude-haiku-4-5-20251001', escalated: 'claude-sonnet-4-6' },
    gemini: { primary: 'gemini-2.0-flash', escalated: 'gemini-2.5-pro' }
  };
  return map[provider][level];
}

export async function getAiSettings(force = false): Promise<AiSettings> {
  const now = Date.now();
  if (!force && cached && now - cachedAt < TTL_MS) return cached;

  const row = await queryOne<{ value: any }>(
    `SELECT value FROM app_settings WHERE key = 'ai'`
  );

  const v = row?.value ?? {};
  const env = fromEnv();

  const merged: AiSettings = {
    enabled: typeof v.enabled === 'boolean' ? v.enabled : env.enabled,
    provider: (v.provider as AiProvider) ?? env.provider,
    apiKey: typeof v.apiKey === 'string' && v.apiKey ? v.apiKey : env.apiKey,
    modelPrimary: v.modelPrimary ?? env.modelPrimary,
    modelEscalated: v.modelEscalated ?? env.modelEscalated,
    dailyQuotaMsgs: Number.isFinite(v.dailyQuotaMsgs) ? Number(v.dailyQuotaMsgs) : env.dailyQuotaMsgs,
    maxOutputTokens: Number.isFinite(v.maxOutputTokens) ? Number(v.maxOutputTokens) : env.maxOutputTokens,
    temperature: Number.isFinite(v.temperature) ? Number(v.temperature) : env.temperature,
    source: row ? 'db' : 'env'
  };

  cached = merged;
  cachedAt = now;
  return merged;
}

export function invalidateAiSettings(): void {
  cached = null;
  cachedAt = 0;
}

/**
 * Per-cohort daily quota (LIGHT=15, MODERATE=30, HEAVY=50, trial=100)
 * Phù hợp mô hình business mới
 */
export function getCohortQuota(cohort: 'LIGHT' | 'MODERATE' | 'HEAVY' | null, isTrialActive: boolean): number {
  if (isTrialActive) return 100; // unlimited cảm giác cho trial
  switch (cohort) {
    case 'LIGHT': return 15;
    case 'MODERATE': return 30;
    case 'HEAVY': return 50;
    default: return 10; // visitor anonymous
  }
}

export async function saveAiSettings(patch: Partial<AiSettings>, adminUserId: string): Promise<AiSettings> {
  const current = await getAiSettings(true);
  const next: AiSettings = {
    ...current,
    ...patch,
    apiKey: patch.apiKey && patch.apiKey.length > 0 ? patch.apiKey : current.apiKey,
    source: 'db'
  };

  const { source: _src, ...rest } = next;

  await query(
    `INSERT INTO app_settings (key, value, updated_by) VALUES ('ai', $1::jsonb, $2)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = NOW()`,
    [JSON.stringify(rest), adminUserId]
  );

  invalidateAiSettings();
  return next;
}

export function maskAiSettings(s: AiSettings) {
  const k = s.apiKey ?? '';
  const masked = k.length > 8 ? `${k.slice(0, 4)}…${k.slice(-4)}` : k ? '••••' : '';
  return {
    enabled: s.enabled,
    provider: s.provider,
    apiKeyMasked: masked,
    hasApiKey: !!k,
    modelPrimary: s.modelPrimary,
    modelEscalated: s.modelEscalated,
    dailyQuotaMsgs: s.dailyQuotaMsgs,
    maxOutputTokens: s.maxOutputTokens,
    temperature: s.temperature,
    source: s.source
  };
}
