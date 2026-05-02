// dashboard/src/services/api.ts
// Shared API client — uses same endpoints as widget backend.

import type {
  CheckIn,
  ExerciseEntry,
  Roadmap,
  User,
  TierMe,
  TierCatalog,
  PaymentLog,
  RefundRequestRecord,
  VoiceMessage,
  VoiceInboxItem,
  UserTier,
  Cohort,
  QDayChecklistState,
  QDayChecklistConfig,
} from '../types';

export class ApiError extends Error {
  status: number;
  body: any;
  constructor(status: number, body: any, message?: string) {
    super(message ?? `API ${status}`);
    this.status = status;
    this.body = body;
  }
}

const BASE_URL = (import.meta as any).env?.VITE_API_BASE ?? 'http://localhost:4000';

function token() {
  return localStorage.getItem('sol_token');
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const t = token();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (res.status === 401) {
    localStorage.removeItem('sol_token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    let body: any = txt;
    try { body = JSON.parse(txt); } catch { /* keep text */ }
    throw new ApiError(res.status, body, `API ${res.status}`);
  }
  return (await res.json()) as T;
}

export const api = {
  baseUrl: BASE_URL,

  // Generic request helper — cho page Chat tùy ý gọi /messages, /messages/...
  request,

  // Anonymous-first: tạo user ẩn danh từ deviceUid (FE generate UUID lưu localStorage).
  anonymous: (deviceUid: string, originDomain?: string) =>
    request<{ token: string; userId: string; isAnonymous: boolean }>(
      '/auth/anonymous',
      {
        method: 'POST',
        body: JSON.stringify({ deviceUid, originDomain }),
      },
    ),

  // Trả URL Zalo OAuth để FE redirect.
  zaloInit: () => request<{ url: string }>('/auth/zalo/init'),

  // Bind phone vào anon user hiện tại
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

  // Layer 3: dùng mã khôi phục offline.
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

  getMe: () => request<User>('/users/me'),
  patchMe: (body: Partial<User>) =>
    request<{ ok: boolean }>('/users/me', { method: 'PATCH', body: JSON.stringify(body) }),

  getCheckins: (limit = 60) =>
    request<{ checkins: CheckIn[] }>(`/checkins?limit=${limit}`),

  getCheckinToday: () => request<{ checkin: CheckIn | null; date: string }>('/checkins/today'),

  submitCheckin: (body: Partial<CheckIn>) =>
    request<{ ok: boolean; checkin: CheckIn; dayNumber: number }>('/checkins', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getRoadmap: () => request<Roadmap>('/content/roadmap'),

  getDailyContent: (day?: number) =>
    request<{ day: number; checkinDone: boolean; content: Record<string, any[]> }>(
      day ? `/content/day/${day}` : '/content/day/today'
    ),

  getExercisesForDay: (day: number) =>
    request<{ day: number; exercises: ExerciseEntry[] }>(`/exercises/day/${day}`),

  saveExercise: (exerciseKey: string, content: Record<string, any>, complete = false) =>
    request<{ ok: boolean; entry: ExerciseEntry }>('/exercises/save', {
      method: 'POST',
      body: JSON.stringify({ exerciseKey, content, complete }),
    }),

  /* ───────── Admin ──────────────────────────────────────── */

  adminStats: () =>
    request<{
      users: { total: number; active7d: number; inJourney: number };
      messages: { today: number; user24h: number; ai24h: number };
      checkins: { today: number };
      crises: { last24h: number };
      timestamp: string;
    }>('/admin/stats'),

  adminGetAiSettings: () =>
    request<{
      current: {
        enabled: boolean;
        provider: 'anthropic' | 'openai' | 'gemini';
        apiKeyMasked: string;
        hasApiKey: boolean;
        modelPrimary: string;
        modelEscalated: string;
        dailyQuotaMsgs: number;
        maxOutputTokens: number;
        temperature: number;
        source: 'db' | 'env';
      };
      providers: Array<{
        id: 'anthropic' | 'openai' | 'gemini';
        label: string;
        defaultModelPrimary: string;
        defaultModelEscalated: string;
        availableModels: { id: string; label: string }[];
      }>;
    }>('/admin/settings/ai'),

  adminPatchAiSettings: (patch: {
    enabled?: boolean;
    provider?: 'anthropic' | 'openai' | 'gemini';
    apiKey?: string;
    modelPrimary?: string;
    modelEscalated?: string;
    dailyQuotaMsgs?: number;
    maxOutputTokens?: number;
    temperature?: number;
  }) =>
    request<{ current: any }>('/admin/settings/ai', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  adminTestAi: (body: { provider: 'anthropic' | 'openai' | 'gemini'; apiKey?: string; model?: string }) =>
    request<{ ok: boolean; latencyMs: number; sample?: string; error?: string }>(
      '/admin/settings/ai/test',
      { method: 'POST', body: JSON.stringify(body) },
    ),

  /* ───── Canned quick-replies (chips) ──────────────────────── */
  adminListCannedReplies: () =>
    request<{ items: CannedReply[] }>('/admin/canned-replies'),

  adminCreateCannedReply: (body: CannedReplyInput & { slug: string }) =>
    request<CannedReply>('/admin/canned-replies', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  adminUpdateCannedReply: (id: string, body: Partial<CannedReplyInput>) =>
    request<CannedReply>(`/admin/canned-replies/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  adminDeleteCannedReply: (id: string) =>
    request<{ ok: boolean }>(`/admin/canned-replies/${id}`, { method: 'DELETE' }),

  /* ───── Tier / Payment / Refund / Voice (user side) ──────── */
  getTierMe: () => request<TierMe>('/tiers/me'),
  getTierCatalog: () => request<TierCatalog>('/tiers/catalog'),

  checkout: (
    targetTier: Exclude<UserTier, 'FREE' | 'ALUMNI'>,
    provider: 'mock' | 'momo' | 'vietqr' | 'bank_transfer' = 'mock',
  ) =>
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

  /* ───── Admin — extended endpoints ────────────────────────── */
  adminDashboard: () =>
    request<{
      needsAttention: Array<{
        id: string; name: string; phone: string; tier: UserTier;
        riskScore: number; missedDaysInRow: number;
        lastCheckinDate: string | null;
        tierStartedAt: string | null; tierExpiresAt: string | null;
      }>;
      pendingRefundsCount: number;
      paidToday: number;
      revenueTodayVnd: number;
      activeUsers24h: number;
      checkinsToday: number;
      crises24h: number;
      tierBreakdown: { tier: UserTier; count: number }[];
      timestamp: string;
    }>('/admin/dashboard'),

  adminListUsers: (params: { q?: string; tier?: string; minRisk?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set('q', params.q);
    if (params.tier) qs.set('tier', params.tier);
    if (params.minRisk) qs.set('minRisk', String(params.minRisk));
    if (params.limit) qs.set('limit', String(params.limit));
    return request<{ items: AdminUserListItem[] }>(`/admin/users?${qs.toString()}`);
  },

  adminGetUser: (id: string) =>
    request<{
      user: any;
      checkins: CheckIn[];
      exercises: ExerciseEntry[];
      recentMessages: any[];
      refunds: RefundRequestRecord[];
      voiceDeliveries: any[];
      payments: PaymentLog[];
    }>(`/admin/users/${id}`),

  adminPatchUser: (
    id: string,
    body: { isAdmin?: boolean; tier?: UserTier; riskScore?: number; comp?: 'KHOI_DONG' | 'DONG_HANH' },
  ) =>
    request<{ ok: boolean; user: any }>(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  adminListRefunds: (status?: string) =>
    request<{
      items: Array<RefundRequestRecord & {
        user: { id: string; name: string; phone: string; tier: UserTier };
        payment: PaymentLog;
      }>;
    }>(`/admin/refunds${status ? '?status=' + status : ''}`),

  adminRefundDecision: (id: string, body: { decision: 'approve' | 'deny'; adminNote?: string; amountVndOverride?: number }) =>
    request<{ ok: boolean }>(`/admin/refunds/${id}/decision`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  adminRefundProcessed: (id: string) =>
    request<{ ok: boolean }>(`/admin/refunds/${id}/processed`, { method: 'POST' }),

  adminListVoice: () =>
    request<{ items: VoiceMessage[] }>('/admin/voice'),

  adminCreateVoice: (body: Partial<VoiceMessage>) =>
    request<VoiceMessage>('/admin/voice', { method: 'POST', body: JSON.stringify(body) }),

  adminUpdateVoice: (id: string, body: Partial<VoiceMessage>) =>
    request<VoiceMessage>(`/admin/voice/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  adminDeleteVoice: (id: string) =>
    request<{ ok: boolean }>(`/admin/voice/${id}`, { method: 'DELETE' }),

  adminSendVoiceToUser: (voiceId: string, userId: string) =>
    request<{ ok: boolean; delivery: any; skipped?: boolean }>(`/admin/voice/${voiceId}/send`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),

  adminListCohorts: () => request<{ items: Cohort[] }>('/admin/cohorts'),

  adminFunnel: () =>
    request<{ steps: { key: string; label: string; count: number }[] }>('/admin/analytics/funnel'),

  adminRevenue: (days = 30) =>
    request<{
      rangeDays: number;
      paid: { totalVnd: number; count: number };
      refunded: { totalVnd: number; count: number };
      netVnd: number;
      byTier: { tier: UserTier; totalVnd: number; count: number }[];
    }>(`/admin/analytics/revenue?days=${days}`),

  adminWikiStats: () =>
    request<{
      wpAdminUrl: string;
      wpFrontUrl: string;
      integrationStatus: string;
      topPosts: { title: string; slug: string; views7d: number; conv: number }[];
      note: string;
    }>('/admin/wiki/stats'),

  /* ───── Admin — Q-Day checklist config ──────────────────── */
  adminGetChecklist: () => request<QDayChecklistConfig>('/admin/q-day-checklist'),
  adminSaveChecklist: (cfg: QDayChecklistConfig) =>
    request<QDayChecklistConfig>('/admin/q-day-checklist', {
      method: 'PUT',
      body: JSON.stringify(cfg),
    }),

  /* ───── Admin — Content audit ─────────────────────────────── */
  adminContentAudit: () =>
    request<{
      scannedAt: string;
      totalSources: number;
      findings: Array<{
        severity: 'high' | 'medium' | 'low';
        type: 'typo' | 'broken_wiki' | 'inconsistent_number' | 'empty' | 'too_short' | 'duplicate';
        location: string;
        snippet: string;
        suggestion?: string;
        note?: string;
      }>;
      summary: { high: number; medium: number; low: number };
      byType: Record<string, number>;
    }>('/admin/content/audit'),
};

export interface AdminUserListItem {
  id: string;
  name: string;
  phone: string;
  tier: UserTier;
  tierStartedAt: string | null;
  tierExpiresAt: string | null;
  maintenanceUntil: string | null;
  quitDate: string | null;
  checkinStreak: number;
  lastCheckinDate: string | null;
  riskScore: number;
  cohortKey: string | null;
  createdAt: string;
}

export interface CannedReply {
  id: string;
  slug: string;
  label: string;
  icon: string;
  answer: string;
  wikiUrl: string | null;
  wikiLabel: string | null;
  reusable: boolean;
  sortOrder: number;
  enabled: boolean;
  triggers?: string[];
  priority?: number;
  minScore?: number;
  createdAt: string;
  updatedAt: string;
}

export type CannedReplyInput = {
  label: string;
  icon?: string;
  answer: string;
  wikiUrl?: string;
  wikiLabel?: string;
  reusable?: boolean;
  sortOrder?: number;
  enabled?: boolean;
  triggers?: string[];
  priority?: number;
  minScore?: number;
};

export function isAuthed() {
  return !!token();
}

export function setToken(t: string) {
  localStorage.setItem('sol_token', t);
}

export function clearToken() {
  localStorage.removeItem('sol_token');
}
