// backend/src/ai/providers/types.ts
// Chuẩn hoá interface chat qua 3 provider: Anthropic Claude / OpenAI / Google Gemini.
// Dùng fetch trực tiếp — không phụ thuộc SDK — để dễ bảo trì & không bị khoá registry.

export type AiProvider = 'anthropic' | 'openai' | 'gemini';

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
  /** Mô hình gợi ý mặc định — nhanh + rẻ */
  defaultModelPrimary: string;
  /** Mô hình dùng khi escalate (câu hỏi nặng, khủng hoảng) */
  defaultModelEscalated: string;
  /** Danh sách model cho dropdown */
  availableModels: { id: string; label: string }[];
  chat: (input: ChatCallInput) => Promise<ChatCallOutput>;
}
