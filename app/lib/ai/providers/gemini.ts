/**
 * Google Gemini adapter
 * Endpoint: https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
 */

import type { ProviderAdapter, ChatCallInput, ChatCallOutput } from './types';

async function chat(input: ChatCallInput): Promise<ChatCallOutput> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${input.model}:generateContent?key=${input.apiKey}`;

  // Gemini expects: contents[].parts[].text + role 'user'|'model'
  const contents = input.messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents,
      systemInstruction: {
        parts: [{ text: input.system }]
      },
      generationConfig: {
        maxOutputTokens: input.maxOutputTokens,
        temperature: input.temperature ?? 0.7
      }
    })
  });

  if (!resp.ok) {
    const body = await resp.text().catch(() => '<no body>');
    throw new Error(`gemini ${resp.status}: ${body.slice(0, 200)}`);
  }

  const data: any = await resp.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';

  return {
    text,
    promptTokens: data.usageMetadata?.promptTokenCount,
    completionTokens: data.usageMetadata?.candidatesTokenCount,
    truncated: data.candidates?.[0]?.finishReason === 'MAX_TOKENS',
    modelUsed: input.model
  };
}

export const geminiAdapter: ProviderAdapter = {
  id: 'gemini',
  label: 'Google Gemini',
  defaultModelPrimary: 'gemini-2.0-flash',
  defaultModelEscalated: 'gemini-2.5-pro',
  availableModels: [
    { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (free tier 1500/day)' },
    { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' }
  ],
  chat
};
