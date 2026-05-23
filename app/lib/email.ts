// DEPRECATED — Sol v0.2 không dùng email, chuyển sang Zalo OA
// File này giữ empty stub để tránh build error nếu import nhầm

export async function sendWelcomeEmail(): Promise<{ ok: boolean; error?: string }> {
  return { ok: false, error: 'Email service deprecated. Use Zalo OA instead.' };
}
