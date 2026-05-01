// frontend/src/lib/deviceUid.ts
//
// Device UID — UUID v4 random, lưu localStorage. Dùng làm "anonymous identity"
// cho user trước khi họ liên kết Zalo/phone. Không phải secret — chỉ là
// random ID để backend biết "đây là cùng device đã từng vào".
//
// Lifecycle:
//   - User mở widget lần đầu → generate UUID → lưu localStorage
//   - User clear cookies / dùng incognito → lost UUID → tạo mới = user mới
//   - User liên kết Zalo/phone → backend lưu zaloId/phone, deviceUid vẫn còn
//     để recovery khi user mở lại trên cùng browser

const STORAGE_KEY = 'sol_device_uid';

/** Generate UUID v4 — fallback đơn giản nếu crypto.randomUUID không có. */
function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback cho browser cũ / iframe sandbox restrictive
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
    // localStorage bị block (Safari ITP, incognito strict) — fallback in-memory.
    // Mỗi lần load page = device mới (không lý tưởng nhưng không crash).
    return generateUuid();
  }
}

/** Detect domain widget đang được nhúng (origin của parent frame nếu trong iframe). */
export function getOriginDomain(): string {
  try {
    // Nếu chạy trong iframe, lấy referrer (parent URL) — nếu không cùng-origin
    // thì document.referrer là tất cả ta có.
    if (window.self !== window.top && document.referrer) {
      return new URL(document.referrer).hostname;
    }
    return window.location.hostname;
  } catch {
    return window.location.hostname;
  }
}
