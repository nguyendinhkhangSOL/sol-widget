/**
 * Provider-agnostic AI chat interface
 * Ported từ backend/src/ai/providers/types.ts
 *
 * 3 providers support: OpenAI / Anthropic / Gemini (no SDK, pure fetch)
 */

export type AiProvider = 'openai' | 'anthropic' | 'gemini';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatCallInput {
  apiKey: string;
  model: string;
  system: string;
  messages: ChatMessage[];
  maxOutputTokens: number;
  temperature?: number;
}

export interface ChatCallOutput {
  text: string;
  promptTokens?: number;
  completionTokens?: number;
  truncated?: boolean;
  modelUsed: string;
}

export interface ProviderAdapter {
  id: AiProvider;
  label: string;
  defaultModelPrimary: string;
  defaultModelEscalated: string;
  availableModels: { id: string; label: string }[];
  chat: (input: ChatCallInput) => Promise<ChatCallOutput>;
}
