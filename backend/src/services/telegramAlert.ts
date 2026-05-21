// DEPRECATED — Phase 5 final đã chuyển sang adminAlert.ts (multi-channel VN-optimized)
// File này giữ stub để tránh break import cũ.
// TODO: remove sau khi confirm không còn reference.

export async function sendTelegramSosAlert(): Promise<boolean> {
  console.warn('[DEPRECATED] sendTelegramSosAlert — use sendAdminAlert from adminAlert.ts');
  return false;
}

export async function sendTelegramTestAlert(): Promise<boolean> {
  console.warn('[DEPRECATED] sendTelegramTestAlert — use sendAdminAlertTest from adminAlert.ts');
  return false;
}
