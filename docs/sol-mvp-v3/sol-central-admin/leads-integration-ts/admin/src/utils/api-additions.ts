/**
 * APPEND vào cuối file /var/www/huongdi/admin/src/utils/api.ts
 */

// ── Types ────────────────────────────────────────────────
export interface Lead {
  id: number;
  ten: string;
  sdt: string;
  email: string | null;
  zalo: string | null;
  goi: 'ACTIVE' | 'FOUNDER' | 'RENEWAL';
  amount: number;
  paymentStatus: 'PENDING' | 'PAID' | 'ACTIVATED' | 'EXPIRED' | 'CANCELLED';
  magicToken: string | null;
  activatedAt: string | null;
  expiresAt: string | null;
  notes: string | null;
  approvedBy: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadSummary {
  payment_status: string;
  count: number;
  total: number;
}

export interface LeadsResponse {
  success: boolean;
  leads: Lead[];
  total: number;
  page: number;
  limit: number;
  summary: LeadSummary[];
}

export interface ZaloHelper {
  success: boolean;
  deep_link: string;
  message: string;
  magic_link: string;
}

// ── API calls ─────────────────────────────────────────────
export const getLeads = (params: {
  status?: string; search?: string; page?: number; limit?: number;
}) =>
  api.get<LeadsResponse>('/admin/leads', { params }).then(r => r.data);

export const getLead = (id: number) =>
  api.get(`/admin/leads/${id}`).then(r => r.data);

export const approveLead = (id: number, notes?: string) =>
  api.post(`/admin/leads/${id}/approve`, { notes }).then(r => r.data);

export const rejectLead = (id: number, reason: string) =>
  api.post(`/admin/leads/${id}/reject`, { reason }).then(r => r.data);

export const resendMagic = (id: number) =>
  api.post(`/admin/leads/${id}/resend-magic`).then(r => r.data);

export const getZaloHelper = (id: number) =>
  api.get<ZaloHelper>(`/admin/leads/${id}/zalo-helper`).then(r => r.data);
