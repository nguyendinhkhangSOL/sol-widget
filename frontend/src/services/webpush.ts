// frontend/src/services/webpush.ts

import { api } from './api';

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(normalized);
  // Cấp phát ArrayBuffer (không phải SharedArrayBuffer) cho đúng kiểu mà
  // PushSubscriptionOptionsInit['applicationServerKey'] yêu cầu trên TS 5+.
  const buf = new ArrayBuffer(raw.length);
  const arr = new Uint8Array(buf);
  for (let i = 0; i < raw.length; ++i) arr[i] = raw.charCodeAt(i);
  return arr;
}

export async function registerServiceWorker(swUrl = '/sol-sw.js'): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register(swUrl);
  } catch (err) {
    console.warn('SW registration failed', err);
    return null;
  }
}

export async function requestPushPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export async function subscribeToPush(): Promise<boolean> {
  const reg = await registerServiceWorker();
  if (!reg) return false;
  const { publicKey } = await api.getVapidKey();
  if (!publicKey) return false;

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  const json = sub.toJSON() as PushSubscriptionJSON;
  await api.subscribePush({ ...json, userAgent: navigator.userAgent });
  return true;
}
