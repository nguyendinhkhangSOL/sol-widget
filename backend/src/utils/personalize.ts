// backend/src/utils/personalize.ts
// Replace placeholders trong nội dung do admin viết → mỗi user thấy đúng
// cách xưng hô + LÝ DO BỎ THUỐC + TRIGGER cá nhân của họ.
//
// Dùng được trong:
//  - Daily content notifications (MORNING_GOAL, SCIENCE_TIP, NIGHT_STORY…)
//  - Evening check-in inline copy
//  - Crisis prep inline copy
//  - STREAK_MILESTONE / MISSED_DAY / REENGAGEMENT body
//
// Chiến lược: text không có placeholder → trả nguyên (no-op).
//
// LEVEL 3 PERSONALIZATION (2026-05-04):
//   {topReason} = quitReasons[0] — replay câu user đã viết (vd "vì cu Tí")
//   {topTrigger} = topTriggers[0] — vd "nhậu", "cà phê sáng"
//   {reasonsList} = "vì cu Tí, ho buổi sáng, vợ nhăn" (full list, comma-sep)
// Theo Allen Carr + Smoke Free: replay user's own words tăng compliance 30-40%.

export interface PersonalizationCtx {
  name?: string | null;
  pronouns?: string | null;
  assistantName?: string | null;
  // LEVEL 3 — story personalization
  quitReasons?: string[] | null;
  topTriggers?: string[] | null;
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

  // ── LEVEL 3 — story personalization ────────────────────────────────────
  // Lý do đầu tiên (mạnh nhất) — fallback graceful nếu user chưa điền.
  const reasonsList = (ctx.quitReasons ?? []).filter(Boolean).map((s) => s.trim()).filter((s) => s.length > 0);
  const topReason = reasonsList[0] ?? 'lý do của ' + pronouns;
  const reasonsListStr = reasonsList.length > 0 ? reasonsList.join(', ') : '';

  // Trigger đầu tiên — fallback "tình huống khó của anh"
  const triggersList = (ctx.topTriggers ?? []).filter(Boolean).map((s) => s.trim()).filter((s) => s.length > 0);
  const topTrigger = triggersList[0] ?? 'tình huống khó của ' + pronouns;

  return text
    .replace(/\{assistantName\}/g, assistantName)
    .replace(/\{assistant\}/g, assistantName)
    .replace(/\{selfRef\}/g, selfRef)
    .replace(/\{pronouns\}/g, pronouns)
    .replace(/\{pronoun\}/g, pronouns)
    .replace(/\{name\}/g, name)
    .replace(/\{greet\}/g, greet)
    // LEVEL 3
    .replace(/\{topReason\}/g, topReason)
    .replace(/\{reasonsList\}/g, reasonsListStr)
    .replace(/\{topTrigger\}/g, topTrigger);
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
