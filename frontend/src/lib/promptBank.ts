// frontend/src/lib/promptBank.ts
// Kho "mồi nhử" (prompt chips) — để người dùng không phải nghĩ câu hỏi.
// Chia theo bối cảnh: giờ, trigger, tình trạng hành trình, câu hỏi FAQ.
//
// Mỗi chip có thể:
//  - gửi luôn vào chat (kind: 'chat')  → prompt dài trong `send`
//  - mở wiki / link (kind: 'wiki')     → `url`
//  - chuyển view (kind: 'view')        → `view`

import type { User } from '../types';
import type { WidgetView } from '../state/store';

export type PromptKind = 'chat' | 'wiki' | 'view' | 'sos';

export interface Prompt {
  id: string;
  kind: PromptKind;
  icon: string;
  label: string;
  /** Tin nhắn sẽ gửi vào chat nếu kind='chat' */
  send?: string;
  /** URL wiki nếu kind='wiki' */
  url?: string;
  /** View nếu kind='view' */
  view?: WidgetView;
  /** Màu accent cho chip (hex) */
  accent?: string;
  /** Ưu tiên — số càng lớn càng nổi */
  weight?: number;
}

/* ─── FAQ BIÊN TẬP SẴN ──────────────────────────────────────────
   Những câu hỏi người cai hay hỏi nhất — câu trả lời được biên tập
   để chất lượng cao, có dẫn wiki. AI nhận được sẽ trả lời sâu,
   đúng giọng Sol.
   ──────────────────────────────────────────────────────────── */

export const FAQ_PROMPTS: Prompt[] = [
  {
    id: 'faq-1dieu',
    kind: 'chat',
    icon: '⚠️',
    label: 'Chỉ 1 điếu có sao không?',
    send:
      'Tôi đang muốn hút chỉ 1 điếu — cho bản thân nghỉ một chút. ' +
      'Có thật sự nguy hiểm không, và tại sao?',
    accent: '#C04331',
    weight: 5,
  },
  {
    id: 'faq-tang-can',
    kind: 'chat',
    icon: '⚖️',
    label: 'Tôi sợ tăng cân khi bỏ thuốc',
    send:
      'Tôi nghe nói bỏ thuốc sẽ tăng cân — làm sao để kiểm soát? ' +
      'Có nguy hiểm bằng hút thuốc không?',
    accent: '#FB8C00',
    weight: 3,
  },
  {
    id: 'faq-bao-lau-het-them',
    kind: 'chat',
    icon: '⏳',
    label: 'Bao lâu thì hết thèm?',
    send: 'Thật sự thì bao lâu thì cơn thèm nicotin sẽ hết hẳn? Tôi đang ở giai đoạn nào?',
    accent: '#3949AB',
    weight: 4,
  },
  {
    id: 'faq-vape-an-toan',
    kind: 'chat',
    icon: '💨',
    label: 'Chuyển sang vape có an toàn?',
    send:
      'Tôi đang cân nhắc chuyển qua thuốc lá điện tử để bỏ thuốc thật. ' +
      'Đây có phải là cách an toàn không?',
    accent: '#7E57C2',
    weight: 3,
  },
  {
    id: 'faq-mat-ngu',
    kind: 'chat',
    icon: '🌙',
    label: 'Mất ngủ khi bỏ thuốc',
    send: 'Từ khi bỏ thuốc tôi rất khó ngủ. Có bình thường không? Làm sao để ngủ ngon lại?',
    accent: '#5C6BC0',
    weight: 3,
  },
  {
    id: 'faq-cau-gat',
    kind: 'chat',
    icon: '😤',
    label: 'Tôi hay cáu gắt — có bình thường không?',
    send: 'Từ khi bỏ thuốc tôi dễ cáu, dễ giận. Điều này có bình thường không, và bao giờ hết?',
    accent: '#E57373',
    weight: 2,
  },
];

/* ─── SOS — KHI CƠN THÈM ĐẾN ─────────────────────────────────── */

export const SOS_PROMPTS: Prompt[] = [
  {
    id: 'sos-crisis',
    kind: 'view',
    icon: '🆘',
    label: 'Tôi đang thèm nặng — SOS 90 giây',
    view: 'crisis',
    accent: '#C04331',
    weight: 10,
  },
  {
    id: 'sos-craving-now',
    kind: 'chat',
    icon: '🔥',
    label: 'Tôi đang thèm thuốc ngay bây giờ',
    send: 'Tôi đang thèm thuốc rất mạnh ngay lúc này. Hãy giúp tôi vượt qua 5 phút tới.',
    accent: '#E53935',
    weight: 9,
  },
  {
    id: 'sos-breath',
    kind: 'chat',
    icon: '🧘',
    label: 'Hướng dẫn tôi hít thở',
    send: 'Dẫn tôi đi qua một bài hít thở 4-7-8 chậm để làm dịu cơn thèm.',
    accent: '#26A69A',
    weight: 7,
  },
  {
    id: 'sos-distraction',
    kind: 'chat',
    icon: '🎯',
    label: 'Đánh lạc hướng tôi 5 phút',
    send: 'Cho tôi một việc cụ thể để làm trong 5 phút tới để não quên cơn thèm.',
    accent: '#FB8C00',
    weight: 6,
  },
];

/* ─── TRONG HÀNH TRÌNH — THEO GIỜ TRONG NGÀY ────────────────── */

export const IN_JOURNEY_TIME_PROMPTS: Prompt[] = [
  {
    id: 'morning-goal',
    kind: 'chat',
    icon: '🌅',
    label: 'Hôm nay tôi nên tập trung điều gì?',
    send: 'Hôm nay tôi cần tập trung điều gì để tránh tái phát? Cho tôi 1 mục tiêu nhỏ.',
    accent: '#FFA726',
    weight: 4,
  },
  {
    id: 'post-meal',
    kind: 'chat',
    icon: '🍚',
    label: 'Tôi đang thèm sau khi ăn',
    send: 'Tôi vừa ăn xong và cơn thèm thuốc dâng lên — đây là thói quen cũ. Giúp tôi vượt qua lúc này.',
    accent: '#EF6C00',
    weight: 5,
  },
  {
    id: 'post-work',
    kind: 'chat',
    icon: '💼',
    label: 'Tan sở xong tôi hay thèm',
    send: 'Tôi vừa tan làm và tay đang tự đưa ra mua thuốc theo thói quen. Nhắc tôi vì sao không nên.',
    accent: '#5E35B1',
    weight: 4,
  },
  {
    id: 'evening-story',
    kind: 'chat',
    icon: '🌙',
    label: 'Kể tôi nghe câu chuyện kết thúc ngày',
    send: 'Đêm nay kể tôi nghe 1 câu chuyện ngắn về người đã bỏ thuốc thành công — để tôi ngủ yên.',
    accent: '#3949AB',
    weight: 2,
  },
  {
    id: 'late-night',
    kind: 'chat',
    icon: '🌌',
    label: 'Khuya rồi tôi vẫn thèm',
    send: 'Giờ này vẫn chưa ngủ được và đang thèm thuốc. Giúp tôi xoa dịu não để ngủ.',
    accent: '#1A237E',
    weight: 5,
  },
];

/* ─── TRONG HÀNH TRÌNH — CELEBRATION / THÀNH QUẢ ────────────── */

export const MILESTONE_PROMPTS: Prompt[] = [
  {
    id: 'show-progress',
    kind: 'chat',
    icon: '📊',
    label: 'Cho tôi xem tôi đã đi được bao xa',
    send: 'Tóm tắt cho tôi biết: tôi đã không hút bao lâu, tiết kiệm được bao nhiêu, cơ thể thay đổi thế nào.',
    accent: '#43A047',
    weight: 4,
  },
  {
    id: 'streak-5',
    kind: 'chat',
    icon: '🔥',
    label: 'Xem thành quả 5 ngày qua',
    send: 'Cho tôi xem 5 ngày vừa rồi tôi đã làm được gì, trigger nào xuất hiện nhiều nhất, mood ra sao.',
    accent: '#FB8C00',
    weight: 3,
  },
  {
    id: 'body-now',
    kind: 'chat',
    icon: '🫁',
    label: 'Cơ thể tôi đang thế nào?',
    send: 'Ở giai đoạn hiện tại, cơ thể tôi đang hồi phục như thế nào? Kể tôi nghe điều tích cực đang diễn ra bên trong.',
    accent: '#26A69A',
    weight: 3,
  },
];

/* ─── PRE-JOURNEY — CHUẨN BỊ TRƯỚC KHI BỎ ───────────────────── */

export const PRE_JOURNEY_PROMPTS: Prompt[] = [
  {
    id: 'pre-set-date',
    kind: 'view',
    icon: '📅',
    label: 'Đặt ngày bắt đầu bỏ thuốc',
    view: 'settings',
    accent: '#43A047',
    weight: 10,
  },
  {
    id: 'pre-reasons',
    kind: 'chat',
    icon: '💡',
    label: 'Giúp tôi tìm lý do đủ mạnh để bỏ',
    send:
      'Tôi muốn bỏ nhưng chưa có động lực thật rõ. Hỏi tôi vài câu để giúp tôi tìm ra 3 lý do đủ mạnh.',
    accent: '#E8812E',
    weight: 8,
  },
  {
    id: 'pre-addiction-level',
    kind: 'chat',
    icon: '🧬',
    label: 'Mức nghiện của tôi tới đâu?',
    send: 'Giúp tôi đánh giá mức độ phụ thuộc nicotin của tôi (FTND) bằng câu hỏi đơn giản.',
    accent: '#5C6BC0',
    weight: 6,
  },
  {
    id: 'pre-what-expect',
    kind: 'chat',
    icon: '🗺️',
    label: 'Tuần đầu sẽ như thế nào?',
    send: 'Kể cho tôi biết tuần đầu tiên bỏ thuốc sẽ cảm thấy như thế nào — để tôi không bị bất ngờ.',
    accent: '#3A7CA5',
    weight: 5,
  },
  {
    id: 'pre-wiki-science',
    kind: 'wiki',
    icon: '📚',
    label: 'Đọc: "Tại sao nicotin khó bỏ"',
    url: 'https://sol.vn/wiki/tai-sao-nicotin-kho-bo',
    accent: '#7E57C2',
    weight: 4,
  },
  {
    id: 'pre-method',
    kind: 'chat',
    icon: '🛠️',
    label: 'Phương pháp nào hợp với tôi?',
    send: 'So sánh các cách bỏ thuốc (nicotine patch, vape, bỏ nguyên, cold turkey) — đâu là cách phù hợp cho người mới?',
    accent: '#26A69A',
    weight: 4,
  },
];

/* ─── BỘ LỌC / CHỌN HÔM NAY ─────────────────────────────────── */

/**
 * Chip được chọn để hiển thị TRÊN chat composer — tối đa 3–4 cái.
 * Ưu tiên theo bối cảnh:
 *  - Giờ nguy hiểm (riskyHours) → SOS
 *  - Giờ trong ngày
 *  - Ngày sau checkin → celebration
 */
export function pickContextPrompts(user: User | null): Prompt[] {
  const now = new Date();
  const hour = now.getHours();
  const picks: Prompt[] = [];

  if (!user?.quitDate) {
    // Pre-journey: luôn gợi ý đặt ngày + tìm lý do + FAQ nhẹ
    picks.push(
      PRE_JOURNEY_PROMPTS.find((p) => p.id === 'pre-set-date')!,
      PRE_JOURNEY_PROMPTS.find((p) => p.id === 'pre-reasons')!,
      PRE_JOURNEY_PROMPTS.find((p) => p.id === 'pre-what-expect')!,
      FAQ_PROMPTS.find((p) => p.id === 'faq-bao-lau-het-them')!,
    );
    return picks.filter(Boolean);
  }

  // In journey
  const risky = user.riskyHours?.includes(hour);
  if (risky) {
    picks.push(
      SOS_PROMPTS.find((p) => p.id === 'sos-craving-now')!,
      SOS_PROMPTS.find((p) => p.id === 'sos-breath')!,
    );
  }

  // Giờ trong ngày
  if (hour < 10) picks.push(IN_JOURNEY_TIME_PROMPTS.find((p) => p.id === 'morning-goal')!);
  else if (hour >= 11 && hour <= 14) picks.push(IN_JOURNEY_TIME_PROMPTS.find((p) => p.id === 'post-meal')!);
  else if (hour >= 17 && hour <= 19) picks.push(IN_JOURNEY_TIME_PROMPTS.find((p) => p.id === 'post-work')!);
  else if (hour >= 20 && hour <= 22) picks.push(IN_JOURNEY_TIME_PROMPTS.find((p) => p.id === 'evening-story')!);
  else if (hour >= 23 || hour < 5) picks.push(IN_JOURNEY_TIME_PROMPTS.find((p) => p.id === 'late-night')!);

  // Luôn kèm 1 milestone / progress
  picks.push(MILESTONE_PROMPTS.find((p) => p.id === 'show-progress')!);

  // Nếu đã kéo streak > 3, thêm 1 chip celebration
  if ((user.checkinStreak ?? 0) >= 3) {
    picks.push(MILESTONE_PROMPTS.find((p) => p.id === 'body-now')!);
  }

  return picks.filter(Boolean).slice(0, 4);
}

/**
 * Chip hiển thị trong "ngăn mở rộng" — người dùng nhấn "Xem thêm câu hỏi"
 * để duyệt đầy đủ.
 */
export function allQuestionsByCategory(user: User | null) {
  const inJourney = !!user?.quitDate;
  return [
    {
      heading: 'Câu hỏi hay gặp',
      prompts: FAQ_PROMPTS,
    },
    {
      heading: inJourney ? 'Khi đang thèm' : 'Khi sắp bắt đầu',
      prompts: inJourney ? SOS_PROMPTS : PRE_JOURNEY_PROMPTS,
    },
    {
      heading: inJourney ? 'Theo giờ trong ngày' : 'Tìm hiểu thêm',
      prompts: inJourney ? IN_JOURNEY_TIME_PROMPTS : FAQ_PROMPTS.slice(0, 3),
    },
    {
      heading: 'Thành quả của tôi',
      prompts: MILESTONE_PROMPTS,
    },
  ];
}
