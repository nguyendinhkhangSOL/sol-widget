// backend/src/zalo/oaClient.ts
//
// Zalo OA API client — wrap các endpoint Sol cần:
//   1. Lấy OA access token (refresh nếu hết hạn)
//   2. Send message tới user (text + attachment + buttons)
//   3. Get user info từ zaloUserId
//   4. ZNS send (template-based push)
//
// OAuth flow OA khác với Login App:
//   - OA dùng "OA access token" (refresh mỗi 90 ngày, hoặc tạo mới qua Zalo Manager)
//   - Token này KHÁC với user access token (Login OAuth)
//
// Env vars (backend/.env):
//   ZALO_OA_ID            3049397094672064963
//   ZALO_OA_ACCESS_TOKEN  long-lived token từ Zalo OA Manager
//   ZALO_OA_REFRESH_TOKEN (optional, để auto-refresh)
//
// Docs:
//   - OA Send Message: https://developers.zalo.me/docs/api/official-account-api/tin-tu-van/tin-text
//   - ZNS Send: https://developers.zalo.me/docs/api/official-account-api/zns

import { logger } from '../utils/logger';

const ZALO_OA_API_BASE = 'https://openapi.zalo.me/v3.0/oa';
const ZALO_ZNS_API_BASE = 'https://business.openapi.zalo.me';

export interface OASendTextParams {
  /** Zalo user ID (lấy từ webhook event sender.id) */
  recipientId: string;
  /** Text message (UTF-8, max ~2000 ký tự) */
  text: string;
  /** Optional: buttons attachment (max 3) */
  buttons?: Array<{
    title: string;
    type: 'oa.open.url' | 'oa.query.show' | 'oa.open.phone' | 'oa.open.sms';
    payload?: string | { url?: string; phone?: string };
  }>;
}

export interface ZNSSendParams {
  /** Số phone (E.164: 84912727381) — Zalo dùng phone để identify user */
  phone: string;
  /** Zalo template ID (sau khi approved) */
  templateId: string;
  /** Template data — fill các tham số động */
  templateData: Record<string, string | number>;
  /** Optional tracking ID (Sol gen) */
  trackingId?: string;
}

/**
 * Lấy OA access token. Mặc định đọc từ env. Production có thể implement
 * refresh logic nếu token expire (Zalo trả về 216 hoặc -201).
 */
function getOAAccessToken(): string {
  const token = process.env.ZALO_OA_ACCESS_TOKEN;
  if (!token) {
    throw new Error('ZALO_OA_ACCESS_TOKEN chưa cấu hình trong .env');
  }
  return token;
}

/**
 * Gửi tin nhắn text (kèm buttons optional) từ OA Sol tới 1 user.
 *
 * Dùng cho REPLY message — không phải push proactively. Reply 1-1 không bị
 * Zalo review nội dung, có thể dùng từ "y tế đầy đủ".
 *
 * Window 48h: chỉ được reply trong 48h sau user gửi tin cuối. Sau 48h muốn
 * push phải dùng ZNS (template approved).
 */
export async function oaSendText(params: OASendTextParams): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  try {
    const token = getOAAccessToken();
    const body: any = {
      recipient: { user_id: params.recipientId },
      message: { text: params.text },
    };
    if (params.buttons && params.buttons.length > 0) {
      body.message = {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'request_user_info', // Zalo OA template wrap
            elements: [
              {
                title: '',
                subtitle: params.text,
                buttons: params.buttons,
              },
            ],
          },
        },
      };
    }

    const res = await fetch(`${ZALO_OA_API_BASE}/message`, {
      method: 'POST',
      headers: {
        'access_token': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data: any = await res.json();

    if (data.error !== 0 && data.error !== undefined) {
      logger.warn({ recipientId: params.recipientId, zaloError: data }, 'OA send text failed');
      return { ok: false, error: data.message ?? 'unknown' };
    }

    return { ok: true, messageId: data.data?.message_id };
  } catch (err: any) {
    logger.error({ err, recipientId: params.recipientId }, 'OA send text exception');
    return { ok: false, error: err.message ?? 'exception' };
  }
}

/**
 * Gửi ZNS template tới user (push proactively).
 *
 * Yêu cầu:
 * - Template đã APPROVED bởi Zalo (templateId valid)
 * - User có Zalo account với phone match
 * - Khang đã đăng ký ZNS service trên Zalo Business Manager
 *
 * Chi phí: 250-500đ/tin tuỳ gói.
 */
export async function znsSendTemplate(params: ZNSSendParams): Promise<{ ok: boolean; messageId?: string; sendingMode?: string; error?: string }> {
  try {
    const token = getOAAccessToken();
    const body = {
      phone: params.phone,
      template_id: params.templateId,
      template_data: params.templateData,
      tracking_id: params.trackingId ?? `sol-${Date.now()}`,
    };

    const res = await fetch(`${ZALO_ZNS_API_BASE}/message/template`, {
      method: 'POST',
      headers: {
        'access_token': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data: any = await res.json();

    if (data.error !== 0 && data.error !== undefined) {
      logger.warn({ phone: params.phone, templateId: params.templateId, zaloError: data }, 'ZNS send failed');
      return { ok: false, error: data.message ?? 'unknown' };
    }

    return {
      ok: true,
      messageId: data.data?.msg_id,
      sendingMode: data.data?.sending_mode,
    };
  } catch (err: any) {
    logger.error({ err, phone: params.phone }, 'ZNS send exception');
    return { ok: false, error: err.message ?? 'exception' };
  }
}

/**
 * Get user info từ zaloUserId (lấy display name, avatar).
 * Dùng khi user follow OA — Sol cần lưu displayName.
 */
export async function oaGetUserInfo(zaloUserId: string): Promise<{ name?: string; avatar?: string } | null> {
  try {
    const token = getOAAccessToken();
    const url = `${ZALO_OA_API_BASE}/getprofile?data=${encodeURIComponent(JSON.stringify({ user_id: zaloUserId }))}`;
    const res = await fetch(url, {
      headers: { 'access_token': token },
    });
    const data: any = await res.json();

    if (data.error !== 0 && data.error !== undefined) {
      logger.warn({ zaloUserId, zaloError: data }, 'OA get user info failed');
      return null;
    }
    return {
      name: data.data?.display_name,
      avatar: data.data?.avatar,
    };
  } catch (err: any) {
    logger.error({ err, zaloUserId }, 'OA get user info exception');
    return null;
  }
}
