/**
 * Sol API Sync v2 patch — additions to sol-api-sync.js
 * Purpose: Send JWT + userId when authenticated
 * ─────────────────────────────────────────────────────────
 * Add này vào TRƯỚC block "─── Session ID ───" trong sol-api-sync.js
 */

// ─── Auth Helpers ───────────────────────────────────────────
function getJwt() {
  return localStorage.getItem('sol_jwt') || null;
}

function getCurrentUser() {
  try {
    const raw = localStorage.getItem('sol_user');
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

// Build headers with auth if present
function authHeaders(extra) {
  const h = Object.assign({ 'Content-Type': 'application/json' }, extra || {});
  const jwt = getJwt();
  if (jwt) h['Authorization'] = 'Bearer ' + jwt;
  return h;
}

/**
 * PATCH INSTRUCTIONS:
 * ─────────────────────────────────────────────────────────
 * Trong tất cả fetch() call của sol-api-sync.js:
 *   headers: { 'Content-Type': 'application/json' }
 * ĐỔI THÀNH:
 *   headers: authHeaders()
 *
 * Backend đã có middleware optional-auth extract JWT
 * → nếu có JWT → auto link data với user.id
 * → nếu không → fallback sessionId anonymous
 */
