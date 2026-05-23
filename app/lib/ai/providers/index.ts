/**
 * Provider registry — get adapter by id
 */

import { openaiAdapter } from './openai';
import { anthropicAdapter } from './anthropic';
import { geminiAdapter } from './gemini';
import type { ProviderAdapter, AiProvider } from './types';

export type { AiProvider, ProviderAdapter, ChatMessage, ChatCallInput, ChatCallOutput } from './types';

const REGISTRY: Record<AiProvider, ProviderAdapter> = {
  openai: openaiAdapter,
  anthropic: anthropicAdapter,
  gemini: geminiAdapter
};

export function getProvider(id: AiProvider): ProviderAdapter {
  const adapter = REGISTRY[id];
  if (!adapter) {
    throw new Error(`Unknown AI provider: ${id}`);
  }
  return adapter;
}

export function listProviders(): ProviderAdapter[] {
  return Object.values(REGISTRY);
}
