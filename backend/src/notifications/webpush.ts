// backend/src/notifications/webpush.ts
import webpush from 'web-push';
import { config } from '../config';
import { prisma } from '../db';
import { logger } from '../utils/logger';

let configured = false;

function ensureConfigured(): boolean {
  if (configured) return true;
  if (!config.push.publicKey || !config.push.privateKey) {
    logger.warn('VAPID keys not set — web push disabled');
    return false;
  }
  webpush.setVapidDetails(config.push.subject, config.push.publicKey, config.push.privateKey);
  configured = true;
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
  data?: Record<string, any>;
}

export async function sendWebPush(userId: string, payload: PushPayload): Promise<{ sent: number; failed: number }> {
  if (!ensureConfigured()) return { sent: 0, failed: 0 };

  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  let sent = 0;
  let failed = 0;

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      );
      await prisma.pushSubscription.update({
        where: { id: sub.id },
        data: { lastUsedAt: new Date() },
      });
      sent += 1;
    } catch (err: any) {
      failed += 1;
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        // Gone — remove subscription.
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => null);
      } else {
        logger.warn({ err: err?.message, userId }, 'web push failed');
      }
    }
  }

  return { sent, failed };
}
