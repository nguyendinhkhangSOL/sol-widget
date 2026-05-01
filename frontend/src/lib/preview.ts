// frontend/src/lib/preview.ts
// Mẫu hiển thị Sol sẽ chào / nói chuyện với user thế nào — để user xem
// trước khi đổi cách xưng hô + tên trợ lý trong Settings.
//
// Chạy hoàn toàn client-side, không gọi backend.

export interface PreviewCtx {
  name?: string | null;
  pronouns?: string | null;
  assistantName?: string | null;
}

function selfRefOf(assistantName: string): string {
  return assistantName.startsWith('Sol ')
    ? assistantName.slice(4) || assistantName
    : assistantName;
}

export interface PreviewSamples {
  morning: string;
  chatGreeting: string;
  craving: string;
  evening: string;
  signature: string;
}

export function buildPreviewSamples(ctx: PreviewCtx, dayNumber = 5): PreviewSamples {
  const pronouns = (ctx.pronouns || 'bạn').trim();
  const name = (ctx.name || '').trim();
  const assistantName = (ctx.assistantName || 'Sol Đồng hành').trim();
  const selfRef = selfRefOf(assistantName);
  const greet = name ? `${pronouns} ${name}` : pronouns;
  const Greet = greet.charAt(0).toUpperCase() + greet.slice(1);

  return {
    morning: `Chào buổi sáng, ${greet} ☀️ Hôm nay ngày ${dayNumber}/30 — phổi của ${pronouns} đang khá lên rồi đấy.`,
    chatGreeting: `${Greet} ơi, ${selfRef} đây. Hôm nay ${pronouns} thấy thế nào?`,
    craving: `Mình hiểu ${pronouns} đang căng. Thử thở 4-7-8 với mình nhé. ${Greet} nhớ ngày 1 mình đã viết lý do gì không?`,
    evening: `Chốt ngày thôi ${pronouns} ơi — 30 giây để mình ghi nhận hôm nay nhé.`,
    signature: assistantName,
  };
}
