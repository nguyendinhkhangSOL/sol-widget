// ═══════════════════════════════════════════════════════════════
// API CLIENT — Directions + Case Studies
// APPEND vào /var/www/huongdi/admin/src/utils/api.ts
// (cuối file, sau existing exports)
// ═══════════════════════════════════════════════════════════════

import axios from 'axios';

// Reuse existing api instance từ api.ts đã có
// Nếu file này standalone, import từ đúng path:
// import { api } from './api';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export type DirectionStatus = 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';
export type CaseStudyTier = 'REAL_ANON' | 'COMPOSITE' | 'REASONING';
export type ContentStatus = 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';

export interface DirectionListItem {
  id: string;
  slug: string;
  title: string;
  emoji: string;
  cluster: string;
  category: string;
  categoryLabel: string;
  isNew: boolean;
  status: DirectionStatus;
  version: number;
  income: { min: number; max: number };
  timeline: string;
  publishedAt: string | null;
  updatedAt: string;
  lastEditedBy: string | null;
}

export interface Direction extends DirectionListItem {
  desc: string;
  pFit: { people: number; expert: number; builder: number; independent: number };
  rReq: { capital: number; time: number; tech: number; network: number; risk: number; energy: number };
  bonus: { income_speed: number };
  reasons: string[];
  roadmap4Tuan: any;

  // 46 fields mới
  tags: string[];
  keywords: string[];
  industryVerticals: Record<string, number> | null;
  regionSuitability: Record<string, number> | null;
  genderTilt: string;

  nangKhieuUuTien: any;
  tinhCachPhaHop: any;
  mucDoHocHoi: string;
  mucDoRuiRoDauTu: string;

  businessType: string;
  revenueModel: string[];
  scaleType: string;
  remotePossibility: number;
  travelRequired: number;

  hoursPerWeek: any;
  timeToFirstRevenue: string | null;
  timeToStableIncome: string | null;
  chiSoThanhCong: any;
  chiSoThatBai: any;
  thietBiPhanMem: any;

  caseStudyIds: string[];
  articleIds: string[];
  promptIds: string[];
  mucDoCanhTranh: string;
  xuHuongThiTruong: string;

  soNamNgheToiThieu: number | null;
  ketQuaCuTheYeuCau: any;
  bufferThang: number | null;
  phapLyMaNganh: string | null;
  thueKhoanPercent: number | null;
  chungChiBatBuoc: string | null;
  chiPhiVnDiaChi: any;
  rangBuocGiaDinh: any;
  vanHoaBanHangVn: any;
  ruiRoTuoi40_60: any;

  roadmap12Tuan: any;
  giaiDoan3TieuDe: any;
  saiLam5: any;
  solActiveFramework: any;
  congCu10: any;

  aiDaNuot: string[] | null;
  aiChuaNuot: string[] | null;
  aiMoatScore: number | null;

  nguonDataFounder: string | null;
  nguonDataPublic: string | null;
  discountFactorFormula: string | null;
  networkConfirmedBy: string | null;

  changeNote: string | null;
  createdAt: string;
  revisions?: DirectionRevision[];
}

export interface DirectionRevision {
  id: number;
  directionId: string;
  versionNum: number;
  snapshot: any;
  editedBy: string;
  changeNote: string | null;
  editedAt: string;
}

export interface CaseStudy {
  id: string;
  directionId: string | null;
  personaName: string;
  personaAge: number | null;
  personaBg: string | null;
  tier: CaseStudyTier;
  contentHtml: string;
  contentSummary: string | null;
  wordCount: number | null;
  imageUrl: string | null;
  personaRevenue: string | null;
  personaTimeToWin: string | null;
  status: ContentStatus;
  publishedAt: string | null;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────
// API HELPERS
// ─────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_BASE || 'https://huongdi.sol.vn';

function getAuthHeaders() {
  const token = localStorage.getItem('admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiRequest<T>(
  method: string,
  path: string,
  body?: any
): Promise<T> {
  const res = await axios({
    method,
    url: `${API_BASE}${path}`,
    data: body,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });
  return res.data;
}

// ─────────────────────────────────────────────────────────────
// DIRECTIONS API
// ─────────────────────────────────────────────────────────────

export const directionsApi = {
  // Admin list
  list: (params?: {
    category?: string;
    cluster?: string;
    status?: DirectionStatus;
    q?: string;
  }) => {
    const qs = params
      ? '?' + new URLSearchParams(params as any).toString()
      : '';
    return apiRequest<{
      success: boolean;
      count: number;
      data: DirectionListItem[];
      summary: Array<{ status: DirectionStatus; _count: number }>;
    }>('GET', `/api/admin/directions${qs}`);
  },

  // Detail (with revisions)
  get: (id: string) =>
    apiRequest<{ success: boolean; data: Direction }>(
      'GET',
      `/api/admin/directions/${id}`
    ),

  // Create
  create: (data: Partial<Direction>) =>
    apiRequest<{ success: boolean; data: Direction }>(
      'POST',
      '/api/admin/directions',
      data
    ),

  // Update (auto-version)
  update: (id: string, data: Partial<Direction> & { changeNote?: string }) =>
    apiRequest<{ success: boolean; data: Direction }>(
      'PUT',
      `/api/admin/directions/${id}`,
      data
    ),

  // Archive (soft-delete)
  archive: (id: string) =>
    apiRequest<{ success: boolean; data: Direction }>(
      'DELETE',
      `/api/admin/directions/${id}`
    ),

  // Revisions list
  revisions: (id: string) =>
    apiRequest<{
      success: boolean;
      count: number;
      data: DirectionRevision[];
    }>('GET', `/api/admin/directions/${id}/revisions`),

  // Revert
  revert: (id: string, versionNum: number) =>
    apiRequest<{ success: boolean; data: Direction }>(
      'POST',
      `/api/admin/directions/${id}/revert/${versionNum}`
    ),
};

// ─────────────────────────────────────────────────────────────
// CASE STUDIES API
// ─────────────────────────────────────────────────────────────

export const caseStudiesApi = {
  list: (params?: {
    directionId?: string;
    tier?: CaseStudyTier;
    status?: ContentStatus;
  }) => {
    const qs = params
      ? '?' + new URLSearchParams(params as any).toString()
      : '';
    return apiRequest<{
      success: boolean;
      count: number;
      data: CaseStudy[];
    }>('GET', `/api/admin/case-studies${qs}`);
  },

  get: (id: string) =>
    apiRequest<{ success: boolean; data: CaseStudy }>(
      'GET',
      `/api/admin/case-studies/${id}`
    ),

  create: (data: Partial<CaseStudy>) =>
    apiRequest<{ success: boolean; data: CaseStudy }>(
      'POST',
      '/api/admin/case-studies',
      data
    ),

  update: (id: string, data: Partial<CaseStudy>) =>
    apiRequest<{ success: boolean; data: CaseStudy }>(
      'PUT',
      `/api/admin/case-studies/${id}`,
      data
    ),

  archive: (id: string) =>
    apiRequest<{ success: boolean; data: CaseStudy }>(
      'DELETE',
      `/api/admin/case-studies/${id}`
    ),
};

// ─────────────────────────────────────────────────────────────
// HELPER — Category + cluster labels
// ─────────────────────────────────────────────────────────────

export const CATEGORY_LABELS: Record<string, string> = {
  chuyenmon: 'Chuyên Môn',
  daotao: 'Đào Tạo',
  noidungso: 'Nội Dung Số',
  kinhdoanh: 'Kinh Doanh',
  daily: 'Đại Lý & Kết Nối',
  dichvu: 'Dịch Vụ',
  dauthu: 'Đầu Tư & Thụ Động',
};

export const CLUSTER_LABELS: Record<string, string> = {
  A: 'A — Chuyên môn B2B Bán thời gian',
  B: 'B — Chuyên gia Chia sẻ',
  C: 'C — Sản phẩm Số / Cộng đồng',
  D: 'D — Tech / SaaS / Product',
  E: 'E — Đầu tư / Đại lý / Nhượng quyền',
  F: 'F — Retail / Physical / Local',
};

export const STATUS_LABELS: Record<DirectionStatus, string> = {
  DRAFT: '📝 Nháp',
  REVIEW: '👀 Chờ duyệt',
  PUBLISHED: '✅ Đã đăng',
  ARCHIVED: '🗄️ Đã ẩn',
};

export const STATUS_COLORS: Record<DirectionStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  REVIEW: 'bg-amber-100 text-amber-800',
  PUBLISHED: 'bg-emerald-100 text-emerald-800',
  ARCHIVED: 'bg-red-100 text-red-700',
};

export const CASE_STUDY_TIER_LABELS: Record<CaseStudyTier, string> = {
  REAL_ANON: '🟢 Thực (đã ẩn danh)',
  COMPOSITE: '🟡 Composite',
  REASONING: '🔵 Reasoning-based',
};
