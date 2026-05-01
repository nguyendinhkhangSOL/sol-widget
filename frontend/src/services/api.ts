// frontend/src/services/api.ts
// Typed fetch wrapper for the SOL backend.

import type {
  Message,
  RoadmapDay,
  User,
  Roadmap,
  TierMe,
  TierCatalog,
  PaymentLog,
  RefundRequestRecord,
  VoiceInboxItem,
  UserTier,
  QDayChecklistState,
} from '../types';

export interface ApiConfig {
  baseUrl: string;
  getToken: () => string | null;
}

let config: ApiConfig = {
  baseUrl: import.meta?.env?.VITE_API_BASE ?? 'http://localhost:4000',
  getToken: () => localStorage.getItem('sol_token'),
};

export function setApiConfig(next: Partial<ApiConfig>) {
  config = { ...config, ...next };
}

/**
 * Lỗi API có structured payload (JSON). Code 402 = paywall. Code 4xx khác
 * thường là validation. Frontend bắt instance này để hiển thị paywall modal.
 */
export class ApiError extends Error {
  status: number;
  body: any;
  constructor(status: number, body: any, message?: string) {
    super(message ?? `API ${status}`);
    this.status = status;
    this.body = body;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = config.getToken();
  const res = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let body: any = text;
    try { body = JSON.parse(text); } catch { /* keep text */ }
    throw new ApiError(res.status, body, `API ${res.status}`);
  }
  return (await res.json()) as T;
}

// ─── Auth ──────────────────────────────────────────────────────────────────
export const api = {
  // Anonymous-first: tạo user ẩn danh từ deviceUid (FE generate UUID lưu localStorage).
  // Idempotent: gọi nhiều lần với cùng deviceUid → trả về cùng user.
  anonymous: (deviceUid: string, originDomain?: string) =>
    request<{ token: string; userId: string; isAnonymous: boolean }>(
      '/auth/anonymous',
      {
        method: 'POST',
        body: JSON.stringify({ deviceUid, originDomain }),
      },
    ),

  // Trả URL Zalo authorize cho FE redirect. Yêu cầu auth (anon JWT đã có).
  zaloInit: () => request<{ url: string }>('/auth/zalo/init'),

  // Bind phone vào anon user hiện tại (yêu cầu đã anon login).
  // Gửi OTP → DEV mode log ra console backend, prod gửi SMS thật.
  bindPhoneRequest: (phone: string) =>
    request<{ ok: boolean; expiresInSec: number }>('/auth/bind-phone/request', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),

  bindPhoneVerify: (phone: string, code: string) =>
    request<{ token: string; userId: string; recoveryCode: string | null }>(
      '/auth/bind-phone/verify',
      {
        method: 'POST',
        body: JSON.stringify({ phone, code }),
      },
    ),

  // Layer 3: dùng mã khôi phục offline khi mất cả Zalo + SĐT.
  // Trả về JWT mới + recoveryCode mới (để user save lại — mã cũ đã invalidate).
  recover: (code: string) =>
    request<{ token: string; userId: string; recoveryCode: string }>(
      '/auth/recover',
      {
        method: 'POST',
        body: JSON.stringify({ code }),
      },
    ),

  requestOtp: (phone: string) =>
    request<{ ok: boolean; expiresInSec: number }>('/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),

  verifyOtp: (
    phone: string,
    code: string,
    opts: { name?: string; pronouns?: string; assistantName?: string } = {},
  ) =>
    request<{ token: string; userId: string }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, code, ...opts }),
    }),

  // ─── User ───────────────────────────────────────────────────────────────
  getMe: () => request<User>('/users/me'),

  patchMe: (body: Partial<User>) =>
    request<{ ok: boolean }>('/users/me', { method: 'PATCH', body: JSON.stringify(body) }),

  // ─── Messages ───────────────────────────────────────────────────────────
  getMessages: (limit = 50) =>
    request<{ messages: Message[] }>(`/messages?limit=${limit}`),

  sendMessage: (content: string, metadata?: Record<string, any>) =>
    request<{ userMessage: Message; outbound: Message[]; state: string }>('/messages', {
      method: 'POST',
      body: JSON.stringify({ content, metadata }),
    }),

  markRead: (ids: string[]) =>
    request<{ ok: boolean }>('/messages/read', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),

  // ─── Check-ins ──────────────────────────────────────────────────────────
  getCheckinToday: () => request<{ checkin: any; date: string }>('/checkins/today'),

  submitCheckin: (body: Record<string, any>) =>
    request<{ ok: boolean; checkin: any; dayNumber: number }>('/checkins', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // ─── Exercises ──────────────────────────────────────────────────────────
  getExercisesForDay: (day: number) =>
    request<{ day: number; exercises: any[] }>(`/exercises/day/${day}`),

  saveExercise: (exerciseKey: string, content: Record<string, any>, complete = false) =>
    request<{ ok: boolean; entry: any }>('/exercises/save', {
      method: 'POST',
      body: JSON.stringify({ exerciseKey, content, complete }),
    }),

  // ─── Content / Roadmap ──────────────────────────────────────────────────
  getDailyContent: (day?: number) =>
    request<{ day: number; checkinDone: boolean; content: Record<string, any[]> }>(
      day ? `/content/day/${day}` : '/content/day/today'
    ),

  getRoadmap: () => request<Roadmap>('/content/roadmap'),

  // ─── Notifications ──────────────────────────────────────────────────────
  getVapidKey: () => request<{ publicKey: string }>('/notifications/vapid-key'),

  subscribePush: (sub: PushSubscriptionJSON & { userAgent?: string }) =>
    request<{ ok: boolean }>('/notifications/subscribe', {
      method: 'POST',
      body: JSON.stringify(sub),
    }),

  getInbox: () => request<{ inbox: any[] }>('/notifications/inbox'),

  markNotificationRead: (id: string) =>
    request<{ ok: boolean }>(`/notifications/${id}/read`, { method: 'POST' }),

  // ─── Canned quick-replies (chip chat) ───────────────────────────────────
  getCannedReplies: () =>
    request<{
      items: Array<{
        id: string; // = slug ổn định, dùng cho localStorage 'sol-qr-used'
        icon: string;
        label: string;
        answer: string;
        wikiUrl?: string | null;
        wikiLabel?: string | null;
        reusable: boolean;
      }>;
    }>('/content/canned-replies'),

  // ─── Tier / Payment / Refund / Voice ────────────────────────────────────
  getTierMe: () => request<TierMe>('/tiers/me'),
  getTierCatalog: () => request<TierCatalog>('/tiers/catalog'),

  checkout: (targetTier: Exclude<UserTier, 'FREE' | 'ALUMNI'>, provider: 'mock' | 'momo' | 'vietqr' | 'bank_transfer' = 'mock') =>
    request<{ ok: boolean; payment: PaymentLog; mock?: boolean; nextStep?: string }>(
      '/payments/checkout',
      { method: 'POST', body: JSON.stringify({ targetTier, provider }) },
    ),
  getPayments: () => request<{ items: PaymentLog[] }>('/payments/me'),

  requestRefund: (reason?: string) =>
    request<{ ok: boolean; refund: RefundRequestRecord }>('/refunds/request', {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  getMyRefunds: () => request<{ items: RefundRequestRecord[] }>('/refunds/me'),
  cancelRefund: (id: string) =>
    request<{ ok: boolean }>(`/refunds/${id}/cancel`, { method: 'POST' }),

  getVoiceInbox: () =>
    request<{ items: VoiceInboxItem[]; effectiveTier: UserTier }>('/voice/inbox'),
  markVoicePlayed: (deliveryId: string) =>
    request<{ ok: boolean }>(`/voice/${deliveryId}/played`, { method: 'POST' }),

  /* ───── Q-Day checklist ──────────────────────────────────── */
  getQDayChecklist: (targetTier: UserTier = 'FREE') =>
    request<QDayChecklistState>(`/tiers/q-day-checklist?targetTier=${targetTier}`),
  checkQDayItem: (itemId: string) =>
    request<QDayChecklistState>('/tiers/q-day-checklist/check', {
      method: 'POST',
      body: JSON.stringify({ itemId }),
    }),
  uncheckQDayItem: (itemId: string) =>
    request<QDayChecklistState>('/tiers/q-day-checklist/uncheck', {
      method: 'POST',
      body: JSON.stringify({ itemId }),
    }),
};
