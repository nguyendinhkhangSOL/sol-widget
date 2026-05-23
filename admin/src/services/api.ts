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

  // ─── Email magic link auth (2026-05-06) ─────────────────────────────
  // redirectTo (optional): URL origin caller muốn link verify trỏ về.
  //   - Default (omit): backend dùng APP_URL trong .env (bothuocla.sol.vn)
  //   - Admin login: pass window.location.origin (vd 'http://localhost:5176')
  //   Backend whitelist các origin Sol owns; tránh open redirect.
  requestEmailLink: (email: string, redirectTo?: string) =>
    request<{ ok: boolean; message: string }>('/auth/email/request', {
      method: 'POST',
      body: JSON.stringify({ email, redirectTo }),
    }),

  verifyEmailToken: async (token: string) => {
    const res = await fetch(`${BASE_URL}/auth/email/verify?token=${encodeURIComponent(token)}`);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      let body: any = text;
      try { body = JSON.parse(text); } catch { /* keep text */ }
      throw new ApiError(res.status, body, `API ${res.status}`);
    }
    return (await res.json()) as {
      ok: boolean;
      token: string;
      userId: string;
      mergedFromUserId: string | null;
      message: string;
    };
  },

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

  // Canned quick-replies (chip chat) — public endpoint cho dashboard.
  // Trả ALL chip enabled. Dashboard tự rank/filter (xem lib/chipRanking.ts).
  getCannedReplies: () =>
    request<{
      items: Array<{
        id: string;
        icon: string;
        label: string;
        answer: string;
        wikiUrl?: string | null;
        wikiLabel?: string | null;
        reusable: boolean;
        triggers?: string[];
        priority?: number;
        minScore?: number;
      }>;
    }>("/content/canned-replies"),

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

  /* ───── Admin — Content management (Phase 1 + Phase 5) ───────── */
  adminContentList: (params: {
    module?: string;
    dayNumber?: number;
    voice?: 'KHANG_SOL' | 'SOL_DONG_HANH';
    search?: string;
    published?: 'all' | 'true' | 'false';
    hasTargeting?: 'all' | 'yes' | 'no';
  } = {}) => {
    const qs = new URLSearchParams();
    if (params.module) qs.set('module', params.module);
    if (params.dayNumber !== undefined) qs.set('dayNumber', String(params.dayNumber));
    if (params.voice) qs.set('voice', params.voice);
    if (params.search) qs.set('search', params.search);
    if (params.published) qs.set('published', params.published);
    if (params.hasTargeting) qs.set('hasTargeting', params.hasTargeting);
    return request<{ items: ContentItem[]; total: number }>(`/admin/content?${qs.toString()}`);
  },

  adminContentGet: (id: string) =>
    request<ContentItem>(`/admin/content/${id}`),

  adminContentCreate: (body: {
    dayNumber: number;
    module: ContentItem['module'];
    title: string;
    body: string;
    voice?: 'KHANG_SOL' | 'SOL_DONG_HANH';
    priority?: number;
    targetRules?: any;
    wikiUrl?: string;
    pushTime?: string;
    exerciseKey?: string;
    published?: boolean;
  }) =>
    request<ContentItem>('/admin/content', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  adminContentDelete: (id: string) =>
    request<{ ok: boolean }>(`/admin/content/${id}`, { method: 'DELETE' }),

  adminContentUpdate: (id: string, patch: ContentItemUpdate) =>
    request<ContentItem>(`/admin/content/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  adminContentRevisions: (id: string) =>
    request<{ revisions: ContentItemRevision[] }>(`/admin/content/${id}/revisions`),

  adminContentRestore: (id: string, versionNum: number) =>
    request<ContentItem>(`/admin/content/${id}/restore/${versionNum}`, { method: 'POST' }),

  adminContentPreview: (body: {
    title?: string;
    body: string;
    voice?: 'KHANG_SOL' | 'SOL_DONG_HANH';
    dayNumber?: number;
    mockUser?: {
      name?: string;
      pronouns?: string;
      assistantName?: string;
      quitReasons?: string[];
      topTriggers?: string[];
      age?: number;
      gender?: 'male' | 'female';
      region?: 'north' | 'central' | 'south';
    };
  }) =>
    request<{
      renderedTitle: string;
      renderedBody: string;
      titleWarnings: LintWarning[];
      bodyWarnings: LintWarning[];
      mockUser: any;
      dayNumber: number;
    }>('/admin/content/preview', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // ─── Journey Phase B (88-day) ───────────────────────────────────────────
  getJourneyDashboard: () =>
    request<any>('/journey/dashboard'),

  qdayConfirm: () =>
    request<{ ok: boolean; qDayConfirmedAt: string; message: string }>(
      '/journey/qday-confirm',
      { method: 'POST' },
    ),

  submitOnboardingBaseline: (body: { cigsBaseline: number; pricePerCig: number }) =>
    request<{
      ok: boolean;
      user: {
        id: string;
        cigsBaseline: number;
        pricePerCig: number;
        onboardingCompletedAt: string;
        quitDate: string;
        pronouns: string;
      };
      message: string;
    }>('/journey/onboarding/baseline', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getMoneyBreakdown: () =>
    request<{
      days: Array<{ day: number; cigs: number; avoided: number; moneyDelta: number; cumulative: number }>;
      baseline: number;
      pricePerCig: number;
    }>('/journey/money-breakdown'),

  logCigarette: (body: {
    trigger?: 'STRESS' | 'EATING' | 'IDLE' | 'SOCIAL' | 'OTHER';
    context?: string;
    delayedMin?: number;
    skipped?: boolean;
  }) =>
    request<any>('/journey/cigarette', { method: 'POST', body: JSON.stringify(body) }),

  exitJourney: (reason?: string) =>
    request<{ ok: boolean; journal: any; message: string }>('/journey/exit', {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  resumeJourney: () =>
    request<{ ok: boolean; message: string }>('/journey/resume', { method: 'POST' }),
};

// ─── Admin content types (Phase 1 + 5) ───────────────────────────────────
export type MomentEnum =
  | 'COFFEE_MORNING'
  | 'TEA_AFTERNOON'
  | 'POST_LUNCH'
  | 'POST_DINNER'
  | 'PRE_SOCIAL_DRINK'
  | 'PRE_BEDTIME'
  | 'GENERIC';

export interface ContentItem {
  id: string;
  dayNumber: number;
  module: 'MORNING_GOAL' | 'SCIENCE_TIP' | 'PHENOMENA_ALERT' | 'EXERCISE' | 'NIGHT_STORY';
  title: string;
  body: string;
  voice: 'KHANG_SOL' | 'SOL_DONG_HANH';
  priority: number;
  targetRules: any | null;
  published: boolean;
  wikiUrl: string | null;
  pushTime: string | null;
  exerciseKey: string | null;
  moment: MomentEnum | null;
  lastEditedBy: string | null;
  updatedAt: string;
  revisionCount?: number;
}

export interface ContentItemUpdate {
  title?: string;
  body?: string;
  voice?: 'KHANG_SOL' | 'SOL_DONG_HANH';
  priority?: number;
  targetRules?: any;
  published?: boolean;
  wikiUrl?: string | null;
  moment?: MomentEnum | null;
  changeNote?: string;
}

export interface ContentItemRevision {
  id: string;
  contentItemId: string;
  versionNum: number;
  title: string;
  body: string;
  voice: 'KHANG_SOL' | 'SOL_DONG_HANH';
  targetRules: any | null;
  priority: number;
  editedBy: string;
  editedAt: string;
  changeNote: string | null;
}

export interface LintWarning {
  severity: 'high' | 'medium' | 'low';
  message: string;
  excerpt?: string;
}


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

/* ────────────────────────── ZALO TEMPLATES ──────────────────────────── */
// Sol v3 (12-05-2026) — CRUD ZNS template trong admin

export type ZaloTemplateStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';

export interface ZaloTemplate {
  id: string;
  code: string;
  zaloManagerName: string;
  zaloTemplateId: string | null;
  tag: '1' | '2' | '3';
  title: string;
  body: string;
  ctaButtons: Array<{ label: string; type: string; value?: string }>;
  params: string[];
  charCount: number;
  status: ZaloTemplateStatus;
  rejectReason: string | null;
  voiceTemplateCode: string | null;
  textFallbackCode: string | null;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  approvedAt: string | null;
}

export const zaloApi = {
  listTemplates: () => request<{ items: ZaloTemplate[] }>('/api/zalo/templates'),
  getTemplate: (code: string) => request<ZaloTemplate>(`/api/zalo/templates/${encodeURIComponent(code)}`),
  createTemplate: (data: Omit<ZaloTemplate, 'id' | 'charCount' | 'status' | 'rejectReason' | 'zaloTemplateId' | 'createdAt' | 'updatedAt' | 'submittedAt' | 'approvedAt'>) =>
    request<ZaloTemplate>('/api/zalo/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTemplate: (code: string, data: Partial<ZaloTemplate>) =>
    request<ZaloTemplate>(`/api/zalo/templates/${encodeURIComponent(code)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  archiveTemplate: (code: string) =>
    request<ZaloTemplate>(`/api/zalo/templates/${encodeURIComponent(code)}`, {
      method: 'DELETE',
    }),
  submitTemplate: (code: string) =>
    request<{ status: ZaloTemplateStatus; message: string }>(
      `/api/zalo/templates/${encodeURIComponent(code)}/submit`,
      { method: 'POST', body: JSON.stringify({}) },
    ),
  testSendTemplate: (code: string) =>
    request<{ ok: boolean; message: string }>(
      `/api/zalo/templates/${encodeURIComponent(code)}/test`,
      { method: 'POST', body: JSON.stringify({}) },
    ),
};

/* ────────────────────────── MESSAGING CONTROL ───────────────────────── */

export type MessagingIntensity = 'LIGHT' | 'MEDIUM' | 'HEAVY' | 'CUSTOM';
export type CohortKey = 'LIGHT' | 'MODERATE' | 'HEAVY';

export interface MessagingPolicy {
  id?: string;
  scope: 'GLOBAL' | 'COHORT' | 'USER';
  cohortKey?: string | null;
  userId?: string | null;
  intensity: MessagingIntensity;
  config: Record<string, any>;
  enabled: boolean;
  isDefault?: boolean;
}

export interface UserMessagingProfile {
  userId: string;
  cohortKey: CohortKey;
  ftndScore: number | null;
  boostMode: boolean;
  boostUntil: string | null;
  muteUntil: string | null;
  crisisThreshold: number | null;
  engagementScore: number;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  totalBlocked: number;
  notes: string | null;
  isDefault?: boolean;
}

export interface MessagingStats {
  sent24h: number;
  sent7d: number;
  opened7d: number;
  clicked7d: number;
  openRate: number;
  clickRate: number;
  cost30dVnd: number;
  cohorts: { LIGHT: number; MODERATE: number; HEAVY: number };
  totalFollowers: number;
  blockRate: number;
  perTemplate: Array<{ code: string; sent: number; cost: number }>;
}

export const messagingApi = {
  getGlobal: () => request<MessagingPolicy>('/api/messaging/policy/global'),
  updateGlobal: (data: Partial<MessagingPolicy>) =>
    request<MessagingPolicy>('/api/messaging/policy/global', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getCohort: (key: CohortKey) =>
    request<MessagingPolicy>(`/api/messaging/policy/cohort/${key}`),
  updateCohort: (key: CohortKey, data: Partial<MessagingPolicy>) =>
    request<MessagingPolicy>(`/api/messaging/policy/cohort/${key}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getProfile: (userId: string) =>
    request<UserMessagingProfile>(`/api/messaging/profile/${encodeURIComponent(userId)}`),
  updateProfile: (userId: string, data: Partial<UserMessagingProfile>) =>
    request<UserMessagingProfile>(`/api/messaging/profile/${encodeURIComponent(userId)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getStats: () => request<MessagingStats>('/api/messaging/stats'),
  searchUsers: (q?: string) =>
    request<{ items: Array<{ id: string; name: string | null; phone: string | null; email: string | null; pronouns: string | null; tier: string | null; ftndScore: number | null; messagingProfile: UserMessagingProfile | null }> }>(
      `/api/messaging/users${q ? '?q=' + encodeURIComponent(q) : ''}`,
    ),
};

// ─────────────────────────────────────────────────────────────────
// Phase 5 — 51-Day Journey Scheduler (Sprint 3 admin dashboard)
// ─────────────────────────────────────────────────────────────────

export type JourneyType = 'lam-quen' | 'giam-dan' | 'q-day' | 'full-51' | 'maintenance';
export type JourneyStatus = 'active' | 'paused' | 'graduated' | 'relapsed';
export type SosSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface JourneyQueueItem {
  id: string;
  userId: string;
  userName: string | null;
  phone: string | null;
  currentDay: number | null;
  dayOffset: number;
  templateCode: string;
  scheduledAt: string;
  wikiSlug: string | null;
}

export interface JourneyQueueResponse {
  horizonHours: number;
  total: number;
  byHour: Record<string, number>;
  estCostVnd: number;
  items: JourneyQueueItem[];
}

export interface JourneyUser {
  id: string;
  name: string | null;
  phone: string | null;
  journeyType: JourneyType | null;
  qDayDate: string | null;
  currentDay: number | null;
  status: JourneyStatus | null;
  preferredHour: number;
  enrolledAt: string | null;
  sent: number;
  opened: number;
  clicked: number;
}

export interface SOSAlertItem {
  id: string;
  userId: string;
  userName: string | null;
  currentDay: number | null;
  triggerType: string;
  matchedKeyword: string | null;
  userMessage: string | null;
  severity: SosSeverity;
  status: string;
  triggeredAt: string;
  respondedAt: string | null;
  respondedByAdminId: string | null;
}

export interface JourneyStats {
  users: { activeJourney: number; graduated: number };
  today: { sent: number; pending: number; estCostVnd: number };
  sos: { open: number };
  last7d: { totalSent: number };
}

export const journeyApi = {
  stats: () => request<JourneyStats>('/api/zalo/journey/stats'),
  queue: (hours: number = 24) =>
    request<JourneyQueueResponse>(`/api/zalo/journey/queue?hours=${hours}`),
  users: (status: JourneyStatus = 'active', journeyType?: JourneyType) =>
    request<{ total: number; items: JourneyUser[] }>(
      `/api/zalo/journey/users?status=${status}${journeyType ? '&journeyType=' + journeyType : ''}`,
    ),
  userDetail: (id: string) =>
    request<any>(`/api/zalo/journey/users/${encodeURIComponent(id)}`),
  sosList: (status: string = 'pending,auto_responded,admin_responding') =>
    request<{ total: number; items: SOSAlertItem[] }>(
      `/api/zalo/journey/sos?status=${encodeURIComponent(status)}`,
    ),
  sosRespond: (alertId: string, message: string) =>
    request<{ ok: boolean }>(`/api/zalo/journey/sos/${encodeURIComponent(alertId)}/respond`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
  sosResolve: (alertId: string, notes?: string) =>
    request<{ ok: boolean }>(`/api/zalo/journey/sos/${encodeURIComponent(alertId)}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ notes: notes ?? '' }),
    }),
  enroll: (data: { userId: string; journeyType: JourneyType; qDayDate: string; preferredHour?: number }) =>
    request<{ ok: boolean; created: number; userId: string }>('/api/zalo/journey/enroll', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  cancel: (userId: string, reason?: string) =>
    request<{ ok: boolean; cancelled: number }>(
      `/api/zalo/journey/cancel/${encodeURIComponent(userId)}`,
      { method: 'POST', body: JSON.stringify({ reason: reason ?? 'admin_cancel' }) },
    ),
};
