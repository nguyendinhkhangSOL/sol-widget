// backend/src/utils/personalize.ts
// Replace {pronoun} / {name} / {assistant} / {selfRef} / {greet} placeholders
// in nội dung do admin viết, để 1 mẫu chung phục vụ tất cả user — mỗi user
// thấy đúng cách xưng hô của mình.
//
// Dùng được trong:
//  - Daily content notifications (MORNING_GOAL, SCIENCE_TIP, NIGHT_STORY…)
//  - Evening check-in inline copy
//  - Crisis prep inline copy
//
// Chiến lược: text không có placeholder → trả nguyên (no-op).

export interface PersonalizationCtx {
  name?: string | null;
  pronouns?: string | null;
  assistantName?: string | null;
}

export function personalize(
  text: string | null | undefined,
  ctx: PersonalizationCtx,
): string {
  if (!text) return '';

  const pronouns = (ctx.pronouns || 'bạn').trim();
  const name = (ctx.name || '').trim();
  const assistantName = (ctx.assistantName || 'Sol Đồng hành').trim();

  // Nếu user đặt tên có tiền tố "Sol " (Sol Phó tướng, Sol Vợ yêu) thì
  // selfRef = phần sau ("Phó tướng", "Vợ yêu") để AI tự xưng tự nhiên hơn.
  const selfRef = assistantName.startsWith('Sol ')
    ? assistantName.slice(4) || assistantName
    : assistantName;

  // Lời chào ghép — "anh Khang" / "Đại ca Khang" / chỉ "Đại ca" nếu chưa có tên.
  const greet = name ? `${pronouns} ${name}` : pronouns;

  return text
    .replace(/\{assistantName\}/g, assistantName)
    .replace(/\{assistant\}/g, assistantName)
    .replace(/\{selfRef\}/g, selfRef)
    .replace(/\{pronouns\}/g, pronouns)
    .replace(/\{pronoun\}/g, pronouns)
    .replace(/\{name\}/g, name)
    .replace(/\{greet\}/g, greet);
}

/**
 * Mẫu lời chào theo giờ — dùng cho preview trong Settings + worker.
 * Trả lại 1 chuỗi sẵn sàng dùng (đã gắn pronoun/name/assistant nếu cần).
 */
export function buildGreeting(slot: 'morning' | 'evening' | 'night', ctx: PersonalizationCtx): string {
  const pronouns = (ctx.pronouns || 'bạn').trim();
  const name = (ctx.name || '').trim();
  const greet = name ? `${pronouns} ${name}` : pronouns;
  if (slot === 'morning') return `Chào buổi sáng, ${greet} ☀️`;
  if (slot === 'evening') return `Chốt ngày thôi ${pronouns} ơi`;
  return `Khuya rồi ${pronouns} ơi 🌙`;
}
