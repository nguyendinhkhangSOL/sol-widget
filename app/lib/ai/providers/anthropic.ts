/**
 * Anthropic Claude adapter
 * Endpoint: https://api.anthropic.com/v1/messages
 */

import type { ProviderAdapter, ChatCallInput, ChatCallOutput } from './types';

const ENDPOINT = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';

async function chat(input: ChatCallInput): Promise<ChatCallOutput> {
  const resp = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': input.apiKey,
      'anthropic-version': API_VERSION
    },
    body: JSON.stringify({
      model: input.model,
      max_tokens: input.maxOutputTokens,
      temperature: input.temperature ?? 0.7,
      system: input.system,
      messages: input.messages.map((m) => ({ role: m.role, content: m.content }))
    })
  });

  if (!resp.ok) {
    const body = await resp.text().catch(() => '<no body>');
    throw new Error(`anthropic ${resp.status}: ${body.slice(0, 200)}`);
  }

  const data: any = await resp.json();
  const text = data.content?.[0]?.text?.trim() ?? '';

  return {
    text,
    promptTokens: data.usage?.input_tokens,
    completionTokens: data.usage?.output_tokens,
    truncated: data.stop_reason === 'max_tokens',
    modelUsed: data.model ?? input.model
  };
}

export const anthropicAdapter: ProviderAdapter = {
  id: 'anthropic',
  label: 'Anthropic Claude',
  defaultModelPrimary: 'claude-haiku-4-5-20251001',
  defaultModelEscalated: 'claude-sonnet-4-6',
  availableModels: [
    { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 (nhanh, rẻ)' },
    { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6 (cân bằng)' },
    { id: 'claude-opus-4-6', label: 'Claude Opus 4.6 (mạnh nhất)' }
  ],
  chat
};
