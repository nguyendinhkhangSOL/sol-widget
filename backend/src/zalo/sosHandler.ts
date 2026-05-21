// backend/src/zalo/sosHandler.ts
//
// SOS Crisis handler — Sprint 2.
//
// Trigger:
//   1. User click button [Tôi đang khó] trong tin daily/welcome → text "/sos"
//   2. User chat tin match CRISIS keyword (qua intentRouter)
//   3. Admin tạo SOSAlert thủ công qua API
//
// Action khi trigger:
//   1. Tạo SOSAlert record (severity tự động phân loại)
//   2. Auto reply user với hotline 02439931800 + breathing exercise + link
//   3. Emit socket event 'sos:new' → admin nhận push notification real-time
//   4. (Optional) Telegram alert Khang nếu severity = critical

import { prisma } from '../db';
import { logger } from '../utils/logger';
import { oaSendText } from './oaClient';
import { getOrCreateUserFromZalo } from './welcomeFlow';

const HOTLINE_CSKH = '02439931800';
const EMERGENCY_115 = '115';

// ─── Severity classification ─────────────────────────────────────────

/** Map keyword → severity. Critical = đe doạ tính mạng cần 115. */
const CRITICAL_KEYWORDS = ['khạc máu', 'ho ra máu', 'đau ngực dữ', 'khó thở dữ', 'ngất'];
const HIGH_KEYWORDS = ['sắp hút', 'không kiềm', 'chịu không nổi', 'thua rồi', 'cứu', 'không nổi', 'thèm chết được'];
const MEDIUM_KEYWORDS = ['tự hại', 'tự tử', 'không muốn sống', 'kết thúc', 'không thiết', 'bỏ cuộc'];

export type SosSeverity = 'critical' | 'high' | 'medium' | 'low';

export function classifySeverity(matchedKeyword?: string, userText?: string): SosSeverity {
  const haystack = (matchedKeyword ?? userText ?? '').toLowerCase();

  if (CRITICAL_KEYWORDS.some((k) => haystack.includes(k))) return 'critical';
  if (HIGH_KEYWORDS.some((k) => haystack.includes(k))) return 'high';
  if (MEDIUM_KEYWORDS.some((k) => haystack.includes(k))) return 'medium';
  return 'high'; // default cho /sos button — luôn là high (relapse risk)
}

// ─── Auto reply per severity ─────────────────────────────────────────

function buildReplyText(severity: SosSeverity, userName: string): string {
  switch (severity) {
    case 'critical':
      return (
        `${userName} ơi! Đây là khẩn cấp y tế.\n\n` +
        `1. GỌI 115 NGAY (cấp cứu)\n` +
        `2. Nằm yên, không tự lái xe\n` +
        `3. Nói rõ triệu chứng cho 115\n\n` +
        `Hotline CSKH Sol: ${HOTLINE_CSKH}`
      );

    case 'high':
      return (
        `Sol đây ${userName}. Đừng làm gì trong 90 giây.\n\n` +
        `Cơn thèm là sóng — sẽ qua trong 90 giây.\n` +
        `HÍT sâu 4 → CHẶN 7 → THỞ ra 8 (lặp 3 lần).\n\n` +
        `Cần Khang trực tiếp?\n` +
        `Hotline: ${HOTLINE_CSKH}`
      );

    case 'medium':
      return (
        `${userName} ơi, mình thấy anh đang khó.\n\n` +
        `Không phải mình thiếu ý chí — não đang reset dopamine.\n` +
        `2-4 tuần sẽ qua. Khang đã trải qua.\n\n` +
        `Cần nói chuyện trực tiếp?\n` +
        `Hotline CSKH: ${HOTLINE_CSKH}`
      );

    case 'low':
    default:
      return (
        `Sol nhận tin anh. Khang sẽ trả lời sớm.\n\n` +
        `Hotline CSKH: ${HOTLINE_CSKH}`
      );
  }
}

function buildReplyButtons(severity: SosSeverity) {
  if (severity === 'critical') {
    return [
      { title: 'Gọi 115 (cấp cứu)', type: 'oa.open.phone', payload: { phone: EMERGENCY_115 } },
      { title: 'Hotline Sol', type: 'oa.open.phone', payload: { phone: HOTLINE_CSKH } },
    ];
  }

  return [
    { title: 'Gọi hotline Sol', type: 'oa.open.phone', payload: { phone: HOTLINE_CSKH } },
    { title: 'Đọc Sắp hút lại', type: 'oa.open.url', payload: { url: 'https://sol.vn/sap-hut-lai-cuu/' } },
    { title: 'Tôi đã vượt qua', type: 'oa.query.show', payload: '/victory' },
  ];
}

// ─── Main handler ─────────────────────────────────────────────────────

export interface TriggerSosParams {
  senderId: string;
  senderName?: string;
  triggerType: 'button' | 'keyword' | 'admin_manual';
  matchedKeyword?: string;
  userMessage?: string;
}

/** Trigger SOS — tạo SOSAlert + auto reply + emit socket */
export async function triggerSos(p: TriggerSosParams): Promise<{ alertId: string; severity: SosSeverity }> {
  const userId = await getOrCreateUserFromZalo(p.senderId, p.senderName);

  const severity = classifySeverity(p.matchedKeyword, p.userMessage);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, pronouns: true, currentJourneyDay: true },
  });
  const userName = user?.name ?? p.senderName ?? 'anh';

  // 1. Tạo SOSAlert
  const alert = await prisma.sOSAlert.create({
    data: {
      userId,
      triggerType: p.triggerType,
      matchedKeyword: p.matchedKeyword ?? null,
      userMessage: p.userMessage ?? null,
      severity,
      status: 'pending',
    },
  });

  logger.warn({
    alertId: alert.id,
    userId,
    severity,
    triggerType: p.triggerType,
    currentDay: user?.currentJourneyDay,
  }, '🆘 SOS Alert triggered');

  // 2. Auto reply user
  const replyText = buildReplyText(severity, userName);
  const replyButtons = buildReplyButtons(severity);

  const sendResult = await oaSendText({
    recipientId: p.senderId,
    text: replyText,
    buttons: replyButtons as any,
  });

  if (sendResult.ok) {
    await prisma.sOSAlert.update({
      where: { id: alert.id },
      data: { status: 'auto_responded' },
    });
  }

  // 3. Emit socket event cho admin dashboard real-time
  // Dùng broadcast (existing) — admin client subscribe channel 'sos'
  try {
    const emitterModule: any = await import('../socket/emitter');
    if (typeof emitterModule.broadcast === 'function') {
      emitterModule.broadcast('sos:new', {
        alertId: alert.id,
        userId,
        userName,
        severity,
        triggerType: p.triggerType,
        matchedKeyword: p.matchedKeyword,
        userMessage: p.userMessage,
        currentDay: user?.currentJourneyDay,
        triggeredAt: alert.triggeredAt.toISOString(),
      });
    }
  } catch (err) {
    logger.debug({ err }, 'socket broadcast not available — skip emit');
  }

  // 4. Severity high/critical → Multi-channel admin alert (Phase 5 final, VN-optimized)
  // Layer 1: Zalo OA → Khang Zalo cá nhân (primary)
  // Layer 2: Email → khang@sol.vn (backup)
  // Layer 3: SMS (TODO Sprint 5)
  if (severity === 'critical' || severity === 'high') {
    try {
      const { sendAdminAlert } = await import('../services/adminAlert');
      const dispatched = await sendAdminAlert({
        alertId: alert.id,
        severity,
        userName,
        currentDay: user?.currentJourneyDay ?? null,
        triggerType: p.triggerType,
        matchedKeyword: p.matchedKeyword,
        userMessage: p.userMessage,
        triggeredAt: alert.triggeredAt,
        adminDashboardUrl: process.env.ADMIN_DASHBOARD_URL
          ? `${process.env.ADMIN_DASHBOARD_URL}/zalo-sos`
          : 'http://localhost:5176/zalo-sos',
      });
      logger.info({ alertId: alert.id, dispatched }, 'Admin alert dispatched');
    } catch (err) {
      logger.warn({ err, alertId: alert.id }, 'Admin alert failed — fallback to log only');
    }
  }

  return { alertId: alert.id, severity };
}

/** Check nếu text là SOS command */
export function isSosCommand(text: string): boolean {
  const lower = text.toLowerCase().trim();
  return /^(\/sos|sos|cứu|khẩn cấp|emergency)$/.test(lower);
}

/** Check nếu text là /victory (user click "Tôi đã vượt qua") */
export function isVictoryCommand(text: string): boolean {
  return /^\/victory$/.test(text.trim().toLowerCase());
}

/** Handle khi user click "Tôi đã vượt qua" — resolve recent SOS alert */
export async function handleVictory(senderId: string, senderName?: string): Promise<void> {
  const userId = await getOrCreateUserFromZalo(senderId, senderName);

  // Lookup SOS gần đây nhất (trong 6 giờ qua) đang pending
  const recentSos = await prisma.sOSAlert.findFirst({
    where: {
      userId,
      status: { in: ['pending', 'auto_responded'] },
      triggeredAt: { gte: new Date(Date.now() - 6 * 60 * 60 * 1000) },
    },
    orderBy: { triggeredAt: 'desc' },
  });

  if (recentSos) {
    await prisma.sOSAlert.update({
      where: { id: recentSos.id },
      data: {
        status: 'resolved',
        resolvedAt: new Date(),
        resolutionNotes: 'User reported victory via /victory button',
      },
    });
  }

  await oaSendText({
    recipientId: senderId,
    text:
      `Tuyệt vời! Anh đã vượt qua được 1 cơn thèm.\n\n` +
      `Mỗi lần vượt cơn = não yếu thêm 1% trigger cũ.\n` +
      `Khang tự hào về anh.\n\n` +
      `Cứ tiếp tục — bài học hôm nay vẫn chờ anh.`,
  });

  logger.info({ userId, resolvedAlertId: recentSos?.id }, 'User reported victory after SOS');
}
