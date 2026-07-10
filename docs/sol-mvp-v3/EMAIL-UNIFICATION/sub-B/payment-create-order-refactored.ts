/**
 * Sub-B / File 2 of 4 — /api/payment/create-order (REFACTORED)
 *
 * Vấn đề cũ:
 *   - INSERT leads với user_id = NULL luôn → orphan
 *   - Nếu email đã có user → không link
 *   - Không tạo user shell cho pay-first flow
 *
 * Fix:
 *   - Case A: User đã login → INSERT lead với user_id = current
 *   - Case B: Email đã có user (chưa login) → REJECT, redirect /dang-nhap/
 *   - Case C: Email mới → CREATE user shell (password=NULL) + INSERT lead + gen magic_token
 *
 * Integration:
 *   Đè lên file backend/src/payments/routes.ts function handleCreateOrder
 */

import { Request, Response } from 'express';
import crypto from 'crypto';
import { addDays } from 'date-fns';
import { prisma } from '../db';
import { logger } from '../utils/logger';

const PRICING: Record<string, number> = {
  ACTIVE: 499_000,
  FOUNDER: 1_999_000,
};

const MAGIC_TOKEN_TTL_DAYS = 7;

interface CreateOrderInput {
  email: string;
  phone: string;
  ten: string;
  zalo?: string;
  goi: 'ACTIVE' | 'FOUNDER';
  type?: 'renew' | 'new';
}

export async function handleCreateOrder(req: Request, res: Response) {
  const input = req.body as CreateOrderInput;
  const currentUser = req.user; // Nếu có JWT middleware → set req.user

  // ─── Validation ────────────────────────────
  if (!input.email || !input.phone || !input.ten || !input.goi) {
    return res.status(400).json({
      error: 'MISSING_FIELDS',
      message: 'Thiếu thông tin bắt buộc',
    });
  }

  const email = input.email.trim().toLowerCase();
  const amount = PRICING[input.goi];
  if (!amount) {
    return res.status(400).json({ error: 'INVALID_PACKAGE' });
  }

  // ─── ⭐ Determine user ────────────────────────────
  let targetUser: any = null;
  let isNewShellUser = false;

  if (currentUser) {
    // ─── Case A: User đã login ────
    targetUser = await prisma.user.findUnique({ where: { id: currentUser.id } });
    if (!targetUser) {
      return res.status(401).json({ error: 'INVALID_SESSION' });
    }

    // Check email trong request matches session
    if (targetUser.email !== email) {
      return res.status(400).json({
        error: 'EMAIL_MISMATCH',
        message: 'Email không khớp với tài khoản đang đăng nhập.',
      });
    }
  } else {
    // ─── Case B/C: Chưa login → check email ────
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser && existingUser.passwordHash) {
      // ⚠ Case B: Email đã có account VÀ đã set password → force login
      return res.status(409).json({
        error: 'ACCOUNT_EXISTS',
        message: 'Email đã có tài khoản Sol. Vui lòng đăng nhập trước để tiếp tục thanh toán.',
        redirect: `/dang-nhap/?next=${encodeURIComponent('/thanh-toan/?goi=' + input.goi)}`,
      });
    }

    if (existingUser && !existingUser.passwordHash) {
      // ⭐ Shell user tồn tại (từ lần thanh toán trước chưa activate)
      // → Reuse shell user, tạo lead mới
      targetUser = existingUser;
    } else {
      // ─── Case C: Email hoàn toàn mới → tạo shell user ────
      targetUser = await prisma.user.create({
        data: {
          email,
          phone: input.phone,
          displayName: input.ten,
          passwordHash: null, // Shell user, chưa có password
          emailVerified: false,
          provider: 'EMAIL',
          role: 'USER',
          isActive: true,
          source: 'thanhtoan',
          status: 'pending_activation',
          tier: 'FREE', // Chưa upgrade cho đến khi webhook confirm PAID
        },
      });
      isNewShellUser = true;

      logger.info(`[payment] Created shell user ${targetUser.id} for pay-first email ${email}`);
    }
  }

  // ─── ⭐ Generate magic_token nếu user chưa có password ────────
  const needsPasswordSetup = !targetUser.passwordHash;
  const magicToken = needsPasswordSetup
    ? crypto.randomBytes(32).toString('hex') // 64-char hex
    : null;
  const magicTokenExpiresAt = magicToken
    ? addDays(new Date(), MAGIC_TOKEN_TTL_DAYS)
    : null;

  // ─── Tạo lead ────────────────────────────
  const lead = await prisma.lead.create({
    data: {
      userId: targetUser.id, // ⭐ LUÔN có user_id
      ten: input.ten,
      email,
      sdt: input.phone,
      zalo: input.zalo || null,
      goi: input.goi as any,
      amount,
      paymentStatus: 'PENDING',
      magicToken,
      magicTokenExpiresAt,
      expiresAt: addDays(new Date(), 90), // Order expiry
      ipAddress: req.ip,
      userAgent: req.get('user-agent') || null,
      referer: req.get('referer') || null,
    },
  });

  // Update user.source_lead_id nếu chưa có
  if (!targetUser.sourceLeadId) {
    await prisma.user.update({
      where: { id: targetUser.id },
      data: { sourceLeadId: lead.id },
    });
  }

  // ─── Generate VietQR ────────────────────────────
  const qrCode = generateVietQR(amount, lead.id);

  return res.status(201).json({
    leadId: lead.id,
    userId: targetUser.id,
    isNewShellUser,
    needsPasswordSetup,
    qrCode,
    amount,
    bankAccount: {
      bank: 'Techcombank',
      accountNumber: '11522026076011',
      accountName: 'CTY CP VINET',
      transferNote: `SOL${lead.id}`,
    },
    message: needsPasswordSetup
      ? 'Sau khi thanh toán, chúng tôi sẽ gửi email link kích hoạt tài khoản để bạn đặt mật khẩu.'
      : 'Thanh toán và tài khoản của bạn sẽ tự động nâng cấp lên Active.',
  });
}

function generateVietQR(amount: number, leadId: number): string {
  // Placeholder — replace với logic VietQR thực
  const params = new URLSearchParams({
    amount: String(amount),
    addInfo: `SOL${leadId}`,
    accountName: 'CTY CP VINET',
  });
  return `https://img.vietqr.io/image/TCB-11522026076011-compact.png?${params}`;
}
