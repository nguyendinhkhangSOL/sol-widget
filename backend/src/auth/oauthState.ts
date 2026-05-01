// backend/src/auth/oauthState.ts
//
// Lưu OAuth state (anti-CSRF token) + PKCE verifier ngắn hạn (5 phút) giữa
// /auth/zalo/init và /auth/zalo/callback. In-memory Map đủ cho single instance;
// nếu sau scale ra nhiều worker, chuyển sang Redis.

interface PendingState {
  userId: string | null; // user hiện tại đang login (anonymous) — sau callback sẽ bind/merge
  codeVerifier: string;
  expiresAt: number;
}

const store = new Map<string, PendingState>();

/** TTL 5 phút — đủ cho user click Zalo + accept + redirect về. */
const TTL_MS = 5 * 60 * 1000;

export function saveState(state: string, payload: Omit<PendingState, 'expiresAt'>): void {
  // Dọn rác cũ song song
  cleanup();
  store.set(state, { ...payload, expiresAt: Date.now() + TTL_MS });
}

export function consumeState(state: string): PendingState | null {
  const entry = store.get(state);
  if (!entry) return null;
  store.delete(state); // 1-shot use
  if (entry.expiresAt < Date.now()) return null;
  return entry;
}

function cleanup() {
  const now = Date.now();
  for (const [k, v] of store.entries()) {
    if (v.expiresAt < now) store.delete(k);
  }
}

// Dọn định kỳ mỗi phút (tránh memory leak nếu OAuth không bao giờ callback)
setInterval(cleanup, 60_000).unref();
