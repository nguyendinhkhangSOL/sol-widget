// backend/src/ai/settings.ts
// Nguồn sự thật duy nhất về cấu hình AI đang chạy.
// Ưu tiên: DB (AppSetting 'ai') → env (legacy). Cache 30 giây in-process để
// tránh gọi DB mỗi tin nhắn. `invalidateAiSettings()` gọi sau PATCH admin.

import { prisma } from '../db';
import { config } from '../config';
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
  /** Được set nếu config đang đến từ env (legacy) */
  source: 'db' | 'env';
}

let cached: AiSettings | null = null;
let cachedAt = 0;
const TTL_MS = 30_000;

function fromEnv(): AiSettings {
  return {
    enabled: config.ai.enabled,
    provider: 'anthropic',
    apiKey: config.ai.apiKey,
    modelPrimary: config.ai.modelPrimary,
    modelEscalated: config.ai.modelEscalated,
    dailyQuotaMsgs: config.ai.dailyQuotaMsgs,
    maxOutputTokens: config.ai.maxOutputTokens,
    temperature: 0.7,
    source: 'env',
  };
}

export async function getAiSettings(force = false): Promise<AiSettings> {
  const now = Date.now();
  if (!force && cached && now - cachedAt < TTL_MS) return cached;

  const row = await prisma.appSetting.findUnique({ where: { key: 'ai' } });
  const v: any = row?.value ?? {};
  const env = fromEnv();

  const merged: AiSettings = {
    enabled: typeof v.enabled === 'boolean' ? v.enabled : env.enabled,
    provider: (v.provider as AiProvider) ?? env.provider,
    apiKey: typeof v.apiKey === 'string' && v.apiKey ? v.apiKey : env.apiKey,
    modelPrimary: v.modelPrimary ?? env.modelPrimary,
    modelEscalated: v.modelEscalated ?? env.modelEscalated,
    dailyQuotaMsgs: Number.isFinite(v.dailyQuotaMsgs)
      ? Number(v.dailyQuotaMsgs)
      : env.dailyQuotaMsgs,
    maxOutputTokens: Number.isFinite(v.maxOutputTokens)
      ? Number(v.maxOutputTokens)
      : env.maxOutputTokens,
    temperature: Number.isFinite(v.temperature) ? Number(v.temperature) : 0.7,
    source: row ? 'db' : 'env',
  };

  cached = merged;
  cachedAt = now;
  return merged;
}

export function invalidateAiSettings() {
  cached = null;
  cachedAt = 0;
}

/** Dạng public (che apiKey) — dùng cho admin UI & logs. */
export function maskAiSettings(s: AiSettings) {
  const k = s.apiKey ?? '';
  const masked =
    k.length > 8 ? `${k.slice(0, 4)}…${k.slice(-4)}` : k ? '••••' : '';
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
    source: s.source,
  };
}

/** Persist settings từ admin UI. apiKey=='' giữ nguyên key cũ (không overwrite). */
export async function saveAiSettings(
  patch: Partial<AiSettings>,
  adminUserId: string
): Promise<AiSettings> {
  const current = await getAiSettings(true);

  const next: AiSettings = {
    ...current,
    ...patch,
    // Nếu admin KHÔNG nhập key (để trống), giữ key cũ — chỉ overwrite khi có giá trị
    apiKey: patch.apiKey && patch.apiKey.length > 0 ? patch.apiKey : current.apiKey,
    source: 'db',
  };

  await prisma.appSetting.upsert({
    where: { key: 'ai' },
    create: {
      key: 'ai',
      value: toDb(next),
      updatedBy: adminUserId,
    },
    update: {
      value: toDb(next),
      updatedBy: adminUserId,
    },
  });

  invalidateAiSettings();
  return next;
}

function toDb(s: AiSettings) {
  // Không lưu field `source` — nó là trạng thái runtime.
  const { source: _source, ...rest } = s;
  return rest as any;
}
