/**
 * VietQR generator — Sol Widget
 *
 * Dùng img.vietqr.io (FREE, no API key, instant)
 * Docs: https://www.vietqr.io/docs/
 *
 * URL pattern:
 *   https://img.vietqr.io/image/{bank_short_name}-{account_number}-{template}.png
 *     ?amount={amount}&addInfo={content}&accountName={name}
 *
 * Templates:
 *   - compact      (only QR)
 *   - compact2     (logo + QR)
 *   - qr_only      (smallest)
 *   - print        (full info + QR for printing)
 */

import type { Cohort } from './ftnd';

// Sol bank account (HKD Sol Vietnam — đang đăng ký Hộ Kinh Doanh)
const SOL_BANK = process.env.SOL_BANK_SHORT || 'VCB';        // Vietcombank
const SOL_ACCOUNT = process.env.SOL_BANK_ACCOUNT || '0000000000';  // TODO: fill khi HKD có TK
const SOL_ACCOUNT_NAME = process.env.SOL_BANK_NAME || 'HKD SOL VIETNAM';
const QR_TEMPLATE = process.env.SOL_QR_TEMPLATE || 'compact2';

export interface PaymentInfo {
  amount: number;
  content: string;
  bank: string;
  account: string;
  accountName: string;
  qrUrl: string;
}

/**
 * Generate VietQR URL cho payment cá nhân hoá
 *
 * @param amount  Số tiền VNĐ (vd: 140000)
 * @param phone   SĐT Zalo của user (vd: "0901234567")
 * @param cohort  LIGHT / MODERATE / HEAVY
 * @param payType 'full' (trọn gói) | 'weekly' (góp tuần)
 */
export function generatePaymentQR(
  amount: number,
  phone: string,
  cohort: Cohort,
  payType: 'full' | 'weekly' = 'full'
): PaymentInfo {
  // Clean phone (remove spaces, dashes)
  const cleanPhone = phone.replace(/[\s\-()]/g, '');

  // Content format: SOL-{COHORT}-{PHONE}-{TYPE}
  // VD: SOL-MODERATE-0901234567-FULL
  //     SOL-LIGHT-0987654321-WEEK
  const typeSuffix = payType === 'full' ? 'FULL' : 'WEEK';
  const content = `SOL-${cohort}-${cleanPhone}-${typeSuffix}`;

  // Build VietQR URL
  const params = new URLSearchParams({
    amount: amount.toString(),
    addInfo: content,
    accountName: SOL_ACCOUNT_NAME
  });

  const qrUrl = `https://img.vietqr.io/image/${SOL_BANK}-${SOL_ACCOUNT}-${QR_TEMPLATE}.png?${params.toString()}`;

  return {
    amount,
    content,
    bank: SOL_BANK,
    account: SOL_ACCOUNT,
    accountName: SOL_ACCOUNT_NAME,
    qrUrl
  };
}

/**
 * Parse content back to phone + cohort (for admin checking)
 *
 * "SOL-MODERATE-0901234567-FULL" → { cohort: "MODERATE", phone: "0901234567", payType: "full" }
 */
export function parsePaymentContent(content: string): {
  valid: boolean;
  cohort?: Cohort;
  phone?: string;
  payType?: 'full' | 'weekly';
} {
  const pattern = /^SOL-(LIGHT|MODERATE|HEAVY)-(\d{10,11})-(FULL|WEEK)$/i;
  const match = content.trim().toUpperCase().match(pattern);

  if (!match) {
    return { valid: false };
  }

  return {
    valid: true,
    cohort: match[1] as Cohort,
    phone: match[2],
    payType: match[3] === 'FULL' ? 'full' : 'weekly'
  };
}

/**
 * Validate Vietnamese phone number (cho Zalo)
 *
 * Đầu số hợp lệ VN 2026:
 *   - Mobile: 03x, 05x, 07x, 08x, 09x (10 digits)
 *   - Old format: 011x, 012x... (11 digits — sẽ deprecate)
 */
export function validateVietnamesePhone(phone: string): { valid: boolean; cleaned?: string; error?: string } {
  const cleaned = phone.replace(/[\s\-()+]/g, '');

  // Remove leading +84 / 84 / 0
  let normalized = cleaned;
  if (normalized.startsWith('84')) {
    normalized = '0' + normalized.substring(2);
  }
  if (!normalized.startsWith('0')) {
    normalized = '0' + normalized;
  }

  // Length check: 10 hoặc 11 digits
  if (normalized.length < 10 || normalized.length > 11) {
    return { valid: false, error: 'SĐT phải có 10-11 số' };
  }

  // Valid prefixes (2026 standard)
  const validPrefixes = [
    '032', '033', '034', '035', '036', '037', '038', '039',   // Viettel (Vinaphone old)
    '052', '056', '058', '059',                                // Vietnamobile, Gmobile
    '070', '076', '077', '078', '079',                         // Mobifone
    '081', '082', '083', '084', '085', '088',                  // Vinaphone
    '086', '089',                                               // Viettel new
    '090', '091', '092', '093', '094', '095', '096', '097', '098', '099'  // Various
  ];

  const prefix3 = normalized.substring(0, 3);
  if (!validPrefixes.includes(prefix3)) {
    return { valid: false, error: 'Đầu số không hợp lệ' };
  }

  return { valid: true, cleaned: normalized };
}

/**
 * Tính amount cho weekly payment
 *
 * 1 week = 35,000đ (7 days × 5k)
 * 2 weeks = 70,000đ
 * etc.
 */
export function calculateWeeklyAmount(weeks: number): number {
  return weeks * 35000;
}
