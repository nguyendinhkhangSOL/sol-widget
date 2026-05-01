// backend/src/auth/recoveryCode.ts
//
// Recovery code (Layer 3) — phao cứu khi user mất cả Zalo + SĐT.
//
// Format: "SOL-XXXX-XXXX-XXXX" (12 ký tự random + prefix)
// Pool ký tự: 29 chars (bỏ 0, O, 1, I, L vì dễ nhầm với nhau khi viết tay)
// Entropy: ~58 bit — đủ chống brute force, vẫn đủ ngắn để user chép tay
//
// Backend lưu bcrypt hash, KHÔNG lưu plaintext. Plaintext chỉ tồn tại
// trong response gửi về FE 1 lần khi sinh — sau đó user phải tự save.

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../db';

// Pool 29 ký tự — bỏ 0, O, 1, I, L (dễ nhầm khi viết tay/đọc to)
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** Sinh 1 mã random 12 ký tự, format "SOL-XXXX-XXXX-XXXX". */
export function generateRecoveryCode(): string {
  const buf = crypto.randomBytes(12);
  const chars: string[] = [];
  for (let i = 0; i < 12; i++) {
    chars.push(ALPHABET[buf[i] % ALPHABET.length]);
  }
  return `SOL-${chars.slice(0, 4).join('')}-${chars.slice(4, 8).join('')}-${chars.slice(8, 12).join('')}`;
}

/**
 * Normalize input từ user — bỏ spaces, dấu gạch ngang, lowercase, giữ chỉ
 * ký tự alphabet hợp lệ. Dùng cho cả lúc save lẫn verify để không lệ thuộc
 * vào cách user gõ.
 */
function normalize(code: string): string {
  return code
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .replace(/[OIL01]/g, (c) => ({ O: '', I: '', L: '', '0': '', '1': '' })[c] ?? c);
}

/** Hash mã trước khi save DB (bcrypt cost 10 — đủ secure cho one-shot use). */
export async function hashRecoveryCode(code: string): Promise<string> {
  return bcrypt.hash(normalize(code), 10);
}

/** So sánh mã user nhập với hash trong DB. */
export async function verifyRecoveryCode(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(normalize(plain), hash);
}

/**
 * Sinh + save mã mới cho user. Trả về plaintext (caller phải gửi cho FE
 * NGAY trong response, sau đó plaintext bị quên).
 */
export async function issueRecoveryCode(userId: string): Promise<string> {
  const code = generateRecoveryCode();
  const hash = await hashRecoveryCode(code);
  await prisma.user.update({
    where: { id: userId },
    data: { recoveryCodeHash: hash },
  });
  return code;
}

/**
 * Tìm user có recovery code khớp với mã user nhập. Vì bcrypt mỗi lần hash
 * ra khác, không thể index trực tiếp — phải scan các user có recoveryCodeHash
 * != null và bcrypt.compare từng cái. Để O(N), nhưng N nhỏ (chỉ user đã
 * bind) và rare path (chỉ chạy khi user lost everything).
 *
 * Optimization tương lai: thêm cột `recoveryCodePrefix` (4 ký tự đầu, không
 * hash) để filter trước khi bcrypt compare → giảm xuống O(N/29^4).
 */
export async function findUserByRecoveryCode(plainCode: string): Promise<string | null> {
  const candidates = await prisma.user.findMany({
    where: { recoveryCodeHash: { not: null } },
    select: { id: true, recoveryCodeHash: true },
  });

  for (const u of candidates) {
    if (!u.recoveryCodeHash) continue;
    const ok = await verifyRecoveryCode(plainCode, u.recoveryCodeHash);
    if (ok) return u.id;
  }
  return null;
}

/** Invalidate mã hiện tại (sau khi user dùng xong, force sinh mã mới). */
export async function invalidateRecoveryCode(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { recoveryCodeHash: null },
  });
}
