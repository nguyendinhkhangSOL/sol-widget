// backend/src/ai/providers/openai.ts
// OpenAI Chat Completions API — https://platform.openai.com/docs/api-reference/chat

import type { ProviderAdapter, ChatCallInput, ChatCallOutput } from './types';

const ENDPOINT = 'https://api.openai.com/v1/chat/completions';

async function chat(input: ChatCallInput): Promise<ChatCallOutput> {
  const resp = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${input.apiKey}`,
    },
    body: JSON.stringify({
      model: input.model,
      max_tokens: input.maxOutputTokens,
      temperature: input.temperature ?? 0.7,
      messages: [
        { role: 'system', content: input.system },
        ...input.messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    }),
  });

  if (!resp.ok) {
    const body = await safeText(resp);
    throw new Error(`openai ${resp.status}: ${body}`);
  }

  const data: any = await resp.json();
  const choice = data.choices?.[0];
  const text = (choice?.message?.content ?? '').trim();

  return {
    text,
    promptTokens: data.usage?.prompt_tokens,
    completionTokens: data.usage?.completion_tokens,
    truncated: choice?.finish_reason === 'length',
    modelUsed: data.model ?? input.model,
  };
}

async function safeText(r: Response) {
  try {
    return await r.text();
  } catch {
    return '<no body>';
  }
}

export const openaiAdapter: ProviderAdapter = {
  id: 'openai',
  label: 'OpenAI',
  defaultModelPrimary: 'gpt-4o-mini',
  defaultModelEscalated: 'gpt-4o',
  availableModels: [
    { id: 'gpt-4o-mini', label: 'GPT-4o mini (nhanh, rẻ)' },
    { id: 'gpt-4o', label: 'GPT-4o (cân bằng)' },
    { id: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { id: 'o1-mini', label: 'o1-mini (lý luận)' },
  ],
  chat,
};
