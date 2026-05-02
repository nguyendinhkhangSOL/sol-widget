// frontend/src/lib/syncBus.ts
//
// Cross-app event bus dùng window.CustomEvent — đồng bộ state giữa widget
// và dashboard khi cả 2 chạy cùng tab browser.
//
// Vấn đề: widget và dashboard là 2 React app riêng → mỗi cái có Zustand
// store riêng. Cùng JWT (localStorage) nhưng KHÔNG share user/checkins
// object. Khi user check-in từ widget, dashboard không biết → stale.
//
// Solution: emit window event sau mỗi action → cả 2 app listen → invalidate.
//
// Events:
//   - 'sol:token-changed'  — sau khi token đổi (login phone, Zalo bind, recovery)
//   - 'sol:user-changed'   — sau khi user object update (rename, settings save)
//   - 'sol:checkin'        — sau khi user submit check-in
//
// File này có ở cả frontend/ và dashboard/ (giống logic, copy).

export type SyncEvent = 'sol:token-changed' | 'sol:user-changed' | 'sol:checkin';

export function emitSync(event: SyncEvent, detail?: any): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(event, { detail }));
}

export function onSync(event: SyncEvent, handler: (detail?: any) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const listener = (e: Event) => handler((e as CustomEvent).detail);
  window.addEventListener(event, listener);
  return () => window.removeEventListener(event, listener);
}
