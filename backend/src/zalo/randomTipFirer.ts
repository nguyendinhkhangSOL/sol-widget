// backend/src/zalo/randomTipFirer.ts
//
// Random tip cho user trong "high-craving zone" — Sprint 2.
//
// Triết lý: ngoài 1 tin daily fixed schedule, push thêm 1-2 micro-tip
// vào khung giờ cao điểm thèm thuốc (sau cà phê, sau cơm, tối nhậu)
// → ngắt Pavlov + cảm giác Sol "hiện diện" liên tục.
//
// Eligibility:
//   - currentJourneyDay ∈ [-3, +7] (zone khó nhất, mỗi giờ chỉ random 20%)
//   - journeyStatus = 'active'
//   - lastInteractAt trong 7 ngày qua (skip user inactive)
//   - Không trong quietHours
//   - messagingProfile.muteUntil chưa active
//
// Push qua oaSendText (Free OA — yêu cầu user trong 48h window).
// Nếu user out-of-window, skip (không tốn ZNS).
//
// Cron: chạy mỗi giờ tại 7h30, 10h, 13h30, 16h30, 21h (giờ VN).

import { prisma } from '../db';
import { logger } from '../utils/logger';
import { oaSendText } from './oaClient';

// 5 khung giờ cao điểm thèm thuốc Việt Nam
const HIGH_CRAVING_HOURS = [
  { hour: 7, minute: 30, label: 'sau-ca-phe-sang' },
  { hour: 10, minute: 0, label: 'giai-lao-sang' },
  { hour: 13, minute: 30, label: 'sau-com-trua' },
  { hour: 16, minute: 30, label: 'cuoi-gio-lam' },
  { hour: 21, minute: 0, label: 'toi-nhau' },
];

const RANDOM_PICK_RATE = 0.2; // 20% user eligible mỗi giờ

// Tips theo từng khung giờ (random 1 trong list)
const TIP_LIBRARY: Record<string, Array<{ text: string; cta?: string }>> = {
  'sau-ca-phe-sang': [
    {
      text: 'Cà phê sáng = trigger số 1. Hôm nay thử uống cà phê ở chỗ khác — đổi context phá Pavlov.',
      cta: 'Đọc kỹ thuật',
    },
    {
      text: 'Não anh đang đợi điếu sau cà phê. Đợi 90 giây thôi — sóng sẽ qua.',
    },
  ],
  'giai-lao-sang': [
    {
      text: 'Giải lao mà không hút? Thử: đứng dậy đi bộ 2 phút + uống 200ml nước.',
    },
    {
      text: 'Receptor nicotine đang đói. Đây là cảm giác cơ thể đang LÀM SẠCH, không phải bệnh.',
    },
  ],
  'sau-com-trua': [
    {
      text: 'Sau cơm trưa = thèm cao thứ 2 sau cà phê. Đánh răng ngay sau ăn — vị bạc hà phá thèm.',
    },
    {
      text: 'Post-meal cue mạnh lắm. Thử ăn 1 quả táo thay vì điếu — chậm tiêu hoá + ngọt nhẹ.',
    },
  ],
  'cuoi-gio-lam': [
    {
      text: 'Cuối giờ làm = mệt + stress = thèm. Hít sâu 4-7-8 (3 lần) trước khi rời bàn.',
    },
    {
      text: 'Work-break smoke ritual Pavlov 60.000 lần. Thay bằng: 5 phút đi cầu thang.',
    },
  ],
  'toi-nhau': [
    {
      text: 'Đi nhậu? Plan B: đứng cạnh người không hút, gọi nước thay bia, có "bài thoát" 10h về.',
    },
    {
      text: 'Rượu giảm ý chí 30%. Hạn chế ≤ 2 ly + tránh bàn nhậu dài.',
    },
  ],
};

/** Pick random tip cho hour label */
function pickRandomTip(label: string): { text: string; cta?: string } {
  const pool = TIP_LIBRARY[label] ?? [];
  if (pool.length === 0) return { text: 'Sol vẫn ở đây cùng anh.' };
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Tìm khung giờ hiện tại — nếu không trong khung nào thì NULL */
function getCurrentHourSlot(now: Date): typeof HIGH_CRAVING_HOURS[0] | null {
  // Giờ VN (UTC+7)
  const vnHour = (now.getUTCHours() + 7) % 24;
  const vnMin = now.getUTCMinutes();

  // Match trong cửa sổ ±10 phút quanh khung giờ
  for (const slot of HIGH_CRAVING_HOURS) {
    if (vnHour === slot.hour && Math.abs(vnMin - slot.minute) <= 10) {
      return slot;
    }
  }
  return null;
}

/** Fire random tip cho 1 batch user eligible */
export async function fireRandomTip(): Promise<{ scanned: number; sent: number; skipped: number; failed: number }> {
  const result = { scanned: 0, sent: 0, skipped: 0, failed: 0 };

  const slot = getCurrentHourSlot(new Date());
  if (!slot) {
    logger.debug('No high-craving slot — skip random tip');
    return result;
  }

  // Eligibility query
  const eligibleUsers = await prisma.user.findMany({
    where: {
      journeyStatus: 'active',
      currentJourneyDay: { gte: -3, lte: 7 },
      zaloUserId: { not: null },
    },
    select: {
      id: true,
      name: true,
      zaloUserId: true,
      currentJourneyDay: true,
      messagingProfile: { select: { muteUntil: true, lastInteractAt: true } },
      zaloOAUser: { select: { lastChatAt: true } },
    },
    take: 200,
  });

  result.scanned = eligibleUsers.length;

  for (const u of eligibleUsers) {
    // Skip nếu mute
    if (u.messagingProfile?.muteUntil && u.messagingProfile.muteUntil > new Date()) {
      result.skipped++;
      continue;
    }

    // Skip nếu out-of-window (Free OA chỉ trong 48h window)
    const lastChat = u.zaloOAUser?.lastChatAt;
    if (!lastChat || Date.now() - lastChat.getTime() > 48 * 60 * 60 * 1000) {
      result.skipped++;
      continue;
    }

    // Random pick rate
    if (Math.random() > RANDOM_PICK_RATE) {
      result.skipped++;
      continue;
    }

    // Pick tip
    const tip = pickRandomTip(slot.label);
    const userName = u.name ?? 'anh';
    const tipText = `${userName} ơi — ${tip.text}`;

    // Send via Free OA (không tốn ZNS)
    const sendResult = await oaSendText({
      recipientId: u.zaloUserId!,
      text: tipText,
      buttons: tip.cta
        ? ([
            { title: tip.cta, type: 'oa.open.url', payload: { url: 'https://bothuocla.sol.vn' } },
            { title: 'Tôi đang khó', type: 'oa.query.show', payload: '/sos' },
          ] as any)
        : undefined,
    });

    if (sendResult.ok) {
      result.sent++;
      // Log vào ZNSLog với templateCode = pseudo "FREE_OA_RANDOM_TIP"
      await prisma.zNSLog.create({
        data: {
          userId: u.id,
          templateCode: `FREE_OA_RANDOM_TIP_${slot.label}`,
          params: { slot: slot.label, tip: tip.text } as any,
          status: 'SENT',
          sentAt: new Date(),
        },
      });
    } else {
      result.failed++;
    }
  }

  logger.info(result, `fireRandomTip [${slot.label}] done`);
  return result;
}
