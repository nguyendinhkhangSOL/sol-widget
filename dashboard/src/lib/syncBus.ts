// dashboard/src/lib/syncBus.ts
// Copy logic giống frontend/src/lib/syncBus.ts — đồng bộ state giữa
// widget embed và dashboard qua window CustomEvent.

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
