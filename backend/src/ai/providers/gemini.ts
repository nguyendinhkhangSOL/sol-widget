// backend/src/ai/providers/gemini.ts
// Google Gemini API — https://ai.google.dev/gemini-api/docs/text-generation
// Gemini dùng REST: POST /v1beta/models/{model}:generateContent?key={apiKey}

import type { ProviderAdapter, ChatCallInput, ChatCallOutput } from './types';

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

async function chat(input: ChatCallInput): Promise<ChatCallOutput> {
  const url = `${BASE}/${encodeURIComponent(input.model)}:generateContent?key=${encodeURIComponent(input.apiKey)}`;

  // Gemini không có field "system" riêng ở v1 — dùng systemInstruction
  const body = {
    systemInstruction: {
      role: 'system',
      parts: [{ text: input.system }],
    },
    contents: input.messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    generationConfig: {
      maxOutputTokens: input.maxOutputTokens,
      temperature: input.temperature ?? 0.7,
    },
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const msg = await safeText(resp);
    throw new Error(`gemini ${resp.status}: ${msg}`);
  }

  const data: any = await resp.json();
  const candidate = data.candidates?.[0];
  const text: string = (candidate?.content?.parts ?? [])
    .map((p: any) => p.text ?? '')
    .join('')
    .trim();

  return {
    text,
    promptTokens: data.usageMetadata?.promptTokenCount,
    completionTokens: data.usageMetadata?.candidatesTokenCount,
    truncated: candidate?.finishReason === 'MAX_TOKENS',
    modelUsed: input.model,
  };
}

async function safeText(r: Response) {
  try {
    return await r.text();
  } catch {
    return '<no body>';
  }
}

export const geminiAdapter: ProviderAdapter = {
  id: 'gemini',
  label: 'Google Gemini',
  defaultModelPrimary: 'gemini-2.0-flash',
  defaultModelEscalated: 'gemini-2.5-pro',
  availableModels: [
    { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (nhanh, rẻ)' },
    { id: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite' },
    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (cao cấp)' },
  ],
  chat,
};
