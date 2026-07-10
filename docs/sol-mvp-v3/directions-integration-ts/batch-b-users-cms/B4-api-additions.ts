// ═══════════════════════════════════════════════════════════════
// BATCH B — Admin API client additions
// APPEND vào /var/www/huongdi/admin/src/utils/api.ts
// (Update existing getUsers signature + add getUserDetail)
// ═══════════════════════════════════════════════════════════════

// ⚠️ REPLACE existing getUsers if signature khác:
// export async function getUsers(page: number = 1) { ... }
// with new signature:

export async function getUsers(
  page: number = 1,
  opts?: { tier?: string; search?: string; limit?: number }
) {
  const params = new URLSearchParams({ page: String(page) });
  if (opts?.tier) params.set('tier', opts.tier);
  if (opts?.search) params.set('search', opts.search);
  if (opts?.limit) params.set('limit', String(opts.limit));

  const res = await api.get(`/admin/users?${params.toString()}`);
  return res.data;
}

// NEW: Get user detail with relations
export async function getUserDetail(id: string) {
  const res = await api.get(`/admin/users/${id}`);
  return res.data;
}

// NEW: Update user tier (super admin)
export async function updateUserTier(id: string, tier: string, tierExpiresAt?: string) {
  const res = await api.patch(`/admin/users/${id}/tier`, { tier, tierExpiresAt });
  return res.data;
}

// NEW: List anonymous sessions
export async function getAnonymousSessions(limit: number = 100) {
  const res = await api.get(`/admin/sessions?limit=${limit}`);
  return res.data;
}
