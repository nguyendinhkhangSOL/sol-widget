// backend/src/ai/providers/index.ts
// Registry & factory — chọn adapter theo id.

import type { ProviderAdapter, AiProvider } from './types';
import { anthropicAdapter } from './anthropic';
import { openaiAdapter } from './openai';
import { geminiAdapter } from './gemini';

export const ALL_PROVIDERS: ProviderAdapter[] = [
  anthropicAdapter,
  openaiAdapter,
  geminiAdapter,
];

const byId = new Map<AiProvider, ProviderAdapter>(
  ALL_PROVIDERS.map((p) => [p.id, p])
);

export function getProvider(id: AiProvider): ProviderAdapter {
  const p = byId.get(id);
  if (!p) throw new Error(`Unknown AI provider: ${id}`);
  return p;
}

export function providerCatalog() {
  return ALL_PROVIDERS.map((p) => ({
    id: p.id,
    label: p.label,
    defaultModelPrimary: p.defaultModelPrimary,
    defaultModelEscalated: p.defaultModelEscalated,
    availableModels: p.availableModels,
  }));
}

export type { AiProvider, ProviderAdapter, ChatCallInput, ChatCallOutput } from './types';
