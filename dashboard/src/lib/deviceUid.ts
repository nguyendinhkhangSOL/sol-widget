// dashboard/src/lib/deviceUid.ts
//
// Device UID — UUID v4 random, lưu localStorage. Dashboard dùng cùng key
// `sol_device_uid` với widget để khi user dùng cả 2 trên cùng browser, là
// cùng anonymous identity → JWT cùng user.

const STORAGE_KEY = 'sol_device_uid';

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getOrCreateDeviceUid(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing && existing.length >= 8) return existing;
    const fresh = generateUuid();
    localStorage.setItem(STORAGE_KEY, fresh);
    return fresh;
  } catch {
    return generateUuid();
  }
}

export function getOriginDomain(): string {
  try {
    return window.location.hostname;
  } catch {
    return 'unknown';
  }
}
