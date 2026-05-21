// backend/src/zalo/welcomeFlow.ts
//
// Welcome + Journey choice flow cho user follow OA Sol.
//
// Flow:
//   1. User follow OA → handleFollow() gửi welcome + 3 button journey choice
//   2. User click button → text "/lo-trinh-{type}" → handleJourneyChoice()
//      → tạo/link User Sol + lưu state waiting_qday + hỏi Q-Day
//   3. User reply Q-Day (text như "hôm nay", "ngày mai", "+3 ngày", "20/05"...)
//      → handleQDayPick() parse → enrollUser() → 51 ScheduledPush tạo ra
//
// Commands accept:
//   /lo-trinh-full-51       → 7+14+30 ngày (recommended)
//   /lo-trinh-lam-quen      → 7 ngày Làm Quen only
//   /lo-trinh-giam-dan      → 14 ngày Giảm Dần only
//   /lo-trinh-q-day         → 30 ngày Q-Day only
//   /lo-trinh-maintenance   → Post-D30 maintenance
//   /huy                    → cancel current journey
//   sos / cứu / khẩn cấp    → trigger SOS

import { prisma } from '../db';
import { logger } from '../utils/logger';
import { oaSendText } from './oaClient';
import { enrollUser, cancelJourney, type JourneyType } from './journeyEngine';

const HOTLINE_CSKH = '02439931800';

/** Welcome buttons gửi sau khi user follow OA */
export function buildWelcomeButtons() {
  return [
    {
      title: '🆕 Tôi vừa quyết tâm (7+14+30 ngày)',
      type: 'oa.query.show',
      payload: '/lo-trinh-full-51',
    },
    {
      title: '🚀 Tôi đã sẵn sàng (14+30 ngày)',
      type: 'oa.query.show',
      payload: '/lo-trinh-giam-dan',
    },
    {
      title: '💪 Cai đã lâu — chỉ cần duy trì',
      type: 'oa.query.show',
      payload: '/lo-trinh-maintenance',
    },
  ];
}

/** Welcome message text */
export function buildWelcomeText(senderName?: string): string {
  return (
    `Chào ${senderName ?? 'anh'}!\n\n` +
    `Mình là Sol — đồng hành cai thuốc cùng Khang.\n\n` +
    `Khang đã hút 30 năm, cai 5 năm. Sol giúp anh:\n` +
    `• 7 ngày LÀM QUEN — hiểu cơ chế nghiện\n` +
    `• 14 ngày GIẢM DẦN — chuẩn bị cắt\n` +
    `• 30 ngày Q-DAY — duy trì + maintenance\n\n` +
    `Tổng 51 ngày — miễn phí.\n\n` +
    `Anh chọn lộ trình phù hợp:`
  );
}

/** Khi user click 1 trong 3 button journey choice */
export async function handleJourneyChoice(
  senderId: string,
  journeyChoice: string,
  senderName?: string,
): Promise<void> {
  // Parse journey type từ "/lo-trinh-full-51"
  const m = journeyChoice.match(/^\/lo-trinh-(.+)$/);
  if (!m) return;
  const journeyType = m[1] as JourneyType;

  if (!['full-51', 'lam-quen', 'giam-dan', 'q-day', 'maintenance'].includes(journeyType)) {
    await oaSendText({
      recipientId: senderId,
      text: 'Lộ trình không hợp lệ. Bạn chọn 1 trong: full-51, lam-quen, giam-dan, q-day, maintenance.',
    });
    return;
  }

  // Lookup ZaloOAUser → User Sol (tạo nếu chưa có)
  const userId = await getOrCreateUserFromZalo(senderId, senderName);

  // Lưu state waiting_qday vào UserState
  await prisma.userState.upsert({
    where: { userId },
    create: {
      userId,
      state: 'IDLE',
      stateData: { flow: 'journey_choice', step: 'waiting_qday', journeyType },
    },
    update: {
      stateData: { flow: 'journey_choice', step: 'waiting_qday', journeyType },
    },
  });

  // Maintenance không cần Q-Day picker → enroll luôn
  if (journeyType === 'maintenance') {
    await enrollUser({
      userId,
      journeyType,
      qDayDate: new Date(),
      preferredHour: 7,
    });
    await oaSendText({
      recipientId: senderId,
      text:
        `Đã ghi nhận! Sol sẽ gửi tin maintenance 1 lần/tuần.\n\n` +
        `Khi anh cần hỗ trợ, gõ "sos" — em sẽ trả lời ngay.\n\n` +
        `Hotline: ${HOTLINE_CSKH}`,
    });
    return;
  }

  // Hỏi Q-Day
  const journeyLabel = {
    'full-51': '7 NGÀY LÀM QUEN + 14 NGÀY GIẢM DẦN + 30 NGÀY Q-DAY',
    'lam-quen': '7 NGÀY LÀM QUEN',
    'giam-dan': '14 NGÀY GIẢM DẦN + 30 NGÀY Q-DAY',
    'q-day': '30 NGÀY Q-DAY',
  }[journeyType] ?? 'lộ trình của anh';

  await oaSendText({
    recipientId: senderId,
    text:
      `Tuyệt vời! Anh chọn ${journeyLabel}.\n\n` +
      `Q-Day là ngày anh cam kết CẮT SẠCH thuốc.\n` +
      `Anh muốn Q-Day vào khi nào?`,
    buttons: [
      { title: 'Hôm nay', type: 'oa.query.show', payload: '/q-day-today' },
      { title: 'Ngày mai', type: 'oa.query.show', payload: '/q-day-tomorrow' },
      { title: '+7 ngày nữa', type: 'oa.query.show', payload: '/q-day-plus7' },
    ] as any,
  });
}

/** Khi user reply Q-Day pick */
export async function handleQDayPick(
  senderId: string,
  pickText: string,
  senderName?: string,
): Promise<void> {
  const userId = await getOrCreateUserFromZalo(senderId, senderName);

  // Lấy state để biết journeyType đã chọn
  const userState = await prisma.userState.findUnique({ where: { userId } });
  const stateData = (userState?.stateData as any) ?? {};
  const journeyType = stateData.journeyType as JourneyType | undefined;

  if (!journeyType || stateData.step !== 'waiting_qday') {
    await oaSendText({
      recipientId: senderId,
      text: 'Anh chưa chọn lộ trình. Gõ "bắt đầu" để Sol gửi lại menu.',
    });
    return;
  }

  // Parse Q-Day
  let qDayDate: Date;
  const lower = pickText.toLowerCase().trim();
  if (lower === '/q-day-today' || lower.includes('hôm nay')) {
    qDayDate = new Date();
  } else if (lower === '/q-day-tomorrow' || lower.includes('ngày mai') || lower.includes('mai')) {
    qDayDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
  } else if (lower === '/q-day-plus7' || lower.includes('+7') || lower.includes('tuần sau')) {
    qDayDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  } else {
    // Try parse DD/MM hoặc DD/MM/YYYY
    const dm = pickText.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/);
    if (dm) {
      const day = parseInt(dm[1]);
      const month = parseInt(dm[2]) - 1;
      const year = dm[3] ? parseInt(dm[3]) : new Date().getFullYear();
      qDayDate = new Date(year, month, day, 7, 0, 0);
      // Nếu ngày này đã qua trong năm, tự dời sang năm sau
      if (qDayDate.getTime() < Date.now()) {
        qDayDate.setFullYear(qDayDate.getFullYear() + 1);
      }
    } else {
      // Không parse được — yêu cầu chọn lại
      await oaSendText({
        recipientId: senderId,
        text:
          `Sol chưa hiểu "${pickText.slice(0, 50)}".\n\n` +
          `Anh chọn 1 trong: "Hôm nay", "Ngày mai", "+7 ngày nữa", hoặc gõ ngày kiểu "20/05".`,
      });
      return;
    }
  }

  // Enroll
  try {
    const result = await enrollUser({
      userId,
      journeyType,
      qDayDate,
      preferredHour: 7,
    });

    // Clear state
    await prisma.userState.update({
      where: { userId },
      data: { state: 'IDLE', stateData: {} },
    });

    const qDayStr = qDayDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    await oaSendText({
      recipientId: senderId,
      text:
        `Tuyệt! Sol đã set Q-Day: ${qDayStr}.\n\n` +
        `Mỗi sáng 7h em sẽ gửi 1 bài chip + link wiki.\n` +
        `Bài đầu tiên sẽ đến vào sáng mai.\n\n` +
        `Khi nào cần SOS, gõ "sos" hoặc bấm nút.\n` +
        `Hotline: ${HOTLINE_CSKH}\n\n` +
        `Đã tạo ${result.created} lịch tin. Chúc anh thành công!`,
      buttons: [
        { title: 'Mở Sol đầy đủ', type: 'oa.open.url', payload: { url: 'https://bothuocla.sol.vn' } },
        { title: 'Tôi đang khó', type: 'oa.query.show', payload: '/sos' },
      ] as any,
    });

    logger.info({ userId, journeyType, qDayDate, created: result.created }, 'User enrolled via Zalo flow');
  } catch (err: any) {
    logger.error({ err, userId, journeyType }, 'Failed to enroll user from Zalo flow');
    await oaSendText({
      recipientId: senderId,
      text: `Có lỗi khi đăng ký lộ trình. Vui lòng thử lại sau hoặc liên hệ hotline ${HOTLINE_CSKH}.`,
    });
  }
}

/** Cancel current journey + remove pending push */
export async function handleCancelJourney(senderId: string, senderName?: string): Promise<void> {
  const userId = await getOrCreateUserFromZalo(senderId, senderName);
  const count = await cancelJourney(userId, 'user_cancel_via_zalo');
  await oaSendText({
    recipientId: senderId,
    text:
      `Đã huỷ lộ trình. ${count} tin đã được dừng.\n\n` +
      `Khi nào muốn quay lại, gõ "bắt đầu" — Sol vẫn ở đây.`,
  });
}

/** Get hoặc create User Sol từ ZaloOAUser. Anonymous-first.
 *  Nếu ZaloOAUser.userId NULL → tạo User Sol mới, link 2 chiều.
 */
export async function getOrCreateUserFromZalo(
  senderId: string,
  senderName?: string,
): Promise<string> {
  const oa = await prisma.zaloOAUser.findUnique({ where: { zaloUserId: senderId } });
  if (!oa) throw new Error(`ZaloOAUser not found for ${senderId}`);

  // Đã link → trả về userId
  if (oa.userId) return oa.userId;

  // Tạo User Sol mới (anonymous-first, no phone yet)
  const newUser = await prisma.user.create({
    data: {
      zaloUserId: senderId,
      name: senderName ?? oa.displayName ?? 'Bạn',
      pronouns: 'anh',
      isAnonymous: false, // có Zalo ID nên không còn anonymous
      preferredPushHour: 7,
      pushTimezone: 'Asia/Ho_Chi_Minh',
    },
  });

  // Link ZaloOAUser → User Sol
  await prisma.zaloOAUser.update({
    where: { zaloUserId: senderId },
    data: { userId: newUser.id },
  });

  logger.info({ zaloUserId: senderId, userId: newUser.id }, 'Created new User Sol from Zalo follow');
  return newUser.id;
}

/** Check nếu text từ user là journey choice command */
export function isJourneyChoiceCommand(text: string): boolean {
  return /^\/lo-trinh-/.test(text.trim());
}

/** Check nếu text từ user là Q-Day pick */
export function isQDayPickCommand(text: string): boolean {
  const lower = text.toLowerCase().trim();
  return (
    /^\/q-day-/.test(lower) ||
    /^(hôm nay|ngày mai|mai|\+7 ngày|tuần sau)$/.test(lower) ||
    /\d{1,2}\/\d{1,2}/.test(lower)
  );
}

/** Check nếu text là "bắt đầu" — gửi lại welcome */
export function isStartCommand(text: string): boolean {
  const lower = text.toLowerCase().trim();
  return /^(bắt đầu|start|menu|lo trinh|lộ trình)$/.test(lower);
}

/** Check nếu text là "/huy" */
export function isCancelCommand(text: string): boolean {
  return /^\/huy$/.test(text.trim().toLowerCase());
}
