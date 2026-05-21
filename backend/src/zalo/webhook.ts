// backend/src/zalo/webhook.ts
//
// Webhook receiver từ Zalo OA. Zalo gửi POST tới /api/zalo/webhook khi:
//   - user_send_text: user gửi tin text vào OA
//   - user_send_image / user_send_audio / user_send_link: media
//   - follow / unfollow: user follow/unfollow OA
//   - user_click_chatnow: user click "Quan tâm OA" trong bài viết
//
// Sol xử lý chính event "user_send_text" — match intent + reply qua oaClient.
//
// Docs: https://developers.zalo.me/docs/api/official-account-api/webhook/su-kien-tin-nhan

import type { Request, Response } from 'express';
import { prisma } from '../db';
import { logger } from '../utils/logger';
import { verifyZaloSignature } from './signature';
import { oaSendText, oaGetUserInfo } from './oaClient';
import { routeUserMessage, generateAIReply } from './intentRouter';
import {
  buildWelcomeText,
  buildWelcomeButtons,
  handleJourneyChoice,
  handleQDayPick,
  handleCancelJourney,
  isJourneyChoiceCommand,
  isQDayPickCommand,
  isStartCommand,
  isCancelCommand,
} from './welcomeFlow';
import { triggerSos, isSosCommand, isVictoryCommand, handleVictory } from './sosHandler';

const OA_ID = process.env.ZALO_OA_ID ?? '3049397094672064963';

/**
 * Express handler cho POST /api/zalo/webhook.
 *
 * Yêu cầu: middleware express.json() phải KÈM rawBody capture (em sẽ wire ở routes).
 */
export async function handleZaloWebhook(req: Request, res: Response): Promise<void> {
  // 1. Verify signature
  const rawBody = (req as any).rawBody as string | undefined;
  const signature = req.header('X-Zalo-Signature') ?? req.header('x-zalo-signature');
  if (!rawBody) {
    logger.warn('Zalo webhook missing rawBody — middleware chưa wire đúng');
    res.status(400).json({ error: 'missing_raw_body' });
    return;
  }
  if (!verifyZaloSignature(rawBody, signature)) {
    logger.warn({ signature }, 'Zalo webhook signature INVALID — reject');
    res.status(401).json({ error: 'invalid_signature' });
    return;
  }

  // 2. Acknowledge ngay (Zalo timeout 10s)
  res.status(200).json({ ok: true });

  // 3. Process event async (không block response)
  const event = req.body;
  processEvent(event).catch((err) => {
    logger.error({ err, event }, 'Zalo webhook process error');
  });
}

/**
 * Process 1 event từ Zalo. Async — không cần response Express.
 */
async function processEvent(event: any): Promise<void> {
  const eventName = event?.event_name as string | undefined;
  const sender = event?.sender;
  const senderId = sender?.id as string | undefined;
  const senderName = sender?.display_name as string | undefined;

  if (!eventName || !senderId) {
    logger.warn({ event }, 'Zalo webhook event thiếu event_name hoặc sender.id');
    return;
  }

  logger.info({ eventName, senderId }, 'Zalo OA webhook received');

  switch (eventName) {
    case 'user_send_text':
      await handleUserText(senderId, event.message?.text ?? '', senderName);
      break;
    case 'follow':
      await handleFollow(senderId, senderName);
      break;
    case 'unfollow':
      await handleUnfollow(senderId);
      break;
    case 'user_send_image':
    case 'user_send_audio':
    case 'user_send_video':
    case 'user_send_link':
      await handleUserMedia(senderId, eventName, senderName);
      break;
    case 'user_click_chatnow':
    case 'user_click_button':
      logger.info({ eventName, senderId }, 'User clicked OA CTA — no action needed');
      break;
    default:
      logger.debug({ eventName }, 'Zalo OA event ignored');
  }
}

/**
 * Upsert ZaloOAUser khi user follow / nhắn lần đầu.
 */
async function upsertZaloOAUser(senderId: string, senderName?: string): Promise<{ id: string; userId: string | null }> {
  // Lấy info từ Zalo nếu name chưa có
  let displayName = senderName;
  let avatarUrl: string | undefined;
  if (!displayName) {
    const info = await oaGetUserInfo(senderId);
    displayName = info?.name;
    avatarUrl = info?.avatar;
  }

  const existing = await prisma.zaloOAUser.findUnique({ where: { zaloUserId: senderId } });
  if (existing) {
    await prisma.zaloOAUser.update({
      where: { zaloUserId: senderId },
      data: {
        displayName: displayName ?? existing.displayName,
        avatarUrl: avatarUrl ?? existing.avatarUrl,
        lastChatAt: new Date(),
      },
    });
    return { id: existing.id, userId: existing.userId };
  }

  const created = await prisma.zaloOAUser.create({
    data: {
      zaloUserId: senderId,
      oaId: OA_ID,
      displayName,
      avatarUrl,
      lastChatAt: new Date(),
      totalMsgIn: 1,
    },
  });
  return { id: created.id, userId: created.userId };
}

/**
 * Xử lý event user_send_text.
 *
 * Order ưu tiên:
 *   1. SOS keyword/command         → triggerSos (critical → 115)
 *   2. /victory                    → handleVictory
 *   3. /huy                        → handleCancelJourney
 *   4. /lo-trinh-*                 → handleJourneyChoice
 *   5. /q-day-* hoặc Q-Day reply  → handleQDayPick (nếu state = waiting_qday)
 *   6. "bắt đầu" / "menu"          → resend welcome
 *   7. Default                     → intentRouter (canned reply / AI / CRISIS)
 */
async function handleUserText(senderId: string, text: string, senderName?: string): Promise<void> {
  const { userId } = await upsertZaloOAUser(senderId, senderName);

  // Increment msg in count
  await prisma.zaloOAUser.update({
    where: { zaloUserId: senderId },
    data: { totalMsgIn: { increment: 1 } },
  });

  const trimmed = text.trim();

  // ─── Sprint 2: Command dispatch ─────────────────────────────────
  if (isSosCommand(trimmed)) {
    await triggerSos({
      senderId,
      senderName,
      triggerType: 'button',
      userMessage: text,
    });
    return;
  }

  if (isVictoryCommand(trimmed)) {
    await handleVictory(senderId, senderName);
    return;
  }

  if (isCancelCommand(trimmed)) {
    await handleCancelJourney(senderId, senderName);
    return;
  }

  if (isJourneyChoiceCommand(trimmed)) {
    await handleJourneyChoice(senderId, trimmed, senderName);
    return;
  }

  if (isStartCommand(trimmed)) {
    // Resend welcome
    await oaSendText({
      recipientId: senderId,
      text: buildWelcomeText(senderName),
      buttons: buildWelcomeButtons() as any,
    });
    return;
  }

  // Check if user đang trong waiting_qday state
  if (userId) {
    const userState = await prisma.userState.findUnique({ where: { userId } });
    const stateData = (userState?.stateData as any) ?? {};
    if (stateData.flow === 'journey_choice' && stateData.step === 'waiting_qday') {
      if (isQDayPickCommand(trimmed) || /\d{1,2}\/\d{1,2}/.test(trimmed)) {
        await handleQDayPick(senderId, trimmed, senderName);
        return;
      }
    }
  }

  // Route intent
  const result = await routeUserMessage(text);

  let replyText = '';
  let buttons: Array<{ title: string; type: string; payload?: any }> = [];

  if (result.type === 'CRISIS') {
    // Sprint 2: auto-trigger SOS alert + auto reply via sosHandler
    await triggerSos({
      senderId,
      senderName,
      triggerType: 'keyword',
      matchedKeyword: result.matchedKeyword,
      userMessage: text,
    });
    return; // sosHandler đã gửi reply
  } else if (result.type === 'CANNED') {
    replyText = result.reply;
    if (result.wikiUrl) {
      buttons = [{ title: 'Đọc thêm', type: 'oa.open.url', payload: { url: result.wikiUrl } }];
    }
  } else if (result.type === 'AI_FALLBACK') {
    // Lấy context user nếu đã merge với User Sol
    let userContext: any = {};
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, pronouns: true, quitDate: true },
      });
      if (user) {
        const day = user.quitDate
          ? Math.floor((Date.now() - user.quitDate.getTime()) / 86400000) + 1
          : undefined;
        userContext = { name: user.name, pronouns: user.pronouns, day };
      }
    }
    replyText = await generateAIReply(text, userContext);
    buttons = [{ title: 'Mở Sol đầy đủ', type: 'oa.open.url', payload: { url: 'https://bothuocla.sol.vn' } }];
  }

  // Gửi reply
  const sendResult = await oaSendText({
    recipientId: senderId,
    text: replyText,
    buttons: buttons.length > 0 ? buttons as any : undefined,
  });

  if (sendResult.ok) {
    await prisma.zaloOAUser.update({
      where: { zaloUserId: senderId },
      data: { totalMsgOut: { increment: 1 } },
    });
  } else {
    logger.warn({ senderId, error: sendResult.error }, 'Failed to send OA reply');
  }
}

/**
 * Xử lý event follow.
 */
async function handleFollow(senderId: string, senderName?: string): Promise<void> {
  await upsertZaloOAUser(senderId, senderName);

  // Sprint 2: gửi welcome + 3 button journey choice
  await oaSendText({
    recipientId: senderId,
    text: buildWelcomeText(senderName),
    buttons: buildWelcomeButtons() as any,
  });

  logger.info({ senderId }, 'User followed OA Sol — welcome message sent with journey buttons');
}

async function handleUnfollow(senderId: string): Promise<void> {
  await prisma.zaloOAUser.updateMany({
    where: { zaloUserId: senderId },
    data: { blockedAt: new Date() },
  });
  logger.info({ senderId }, 'User unfollowed OA Sol');
}

async function handleUserMedia(senderId: string, eventName: string, senderName?: string): Promise<void> {
  await upsertZaloOAUser(senderId, senderName);
  // Sol hiện chỉ hỗ trợ text — reply nhắc user gõ tin
  await oaSendText({
    recipientId: senderId,
    text:
      'Cảm ơn anh đã gửi.\n\n' +
      'Hiện Sol chỉ hỗ trợ tin nhắn text. Anh gõ câu hỏi giúp mình — vd:\n' +
      '"Tôi đang thèm thuốc" hoặc "Bao lâu thì hết thèm?"',
  });
}
