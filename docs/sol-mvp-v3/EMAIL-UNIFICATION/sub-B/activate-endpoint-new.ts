/**
 * Sub-B / File 4 of 4 — /api/auth/activate (NEW endpoint)
 *
 * Handle magic link activation cho pay-first users:
 *   - User pay xong → webhook confirmed → user tier=ACTIVE (nhưng chưa có password)
 *   - Gửi email link https://huongdi.sol.vn/kich-hoat?token=xxx
 *   - User click link → landing page /kich-hoat/index.html
 *   - Frontend POST /api/auth/activate với token + password
 *
 * Endpoint này SET password + auto-login (return JWT).
 *
 * Integration:
 *   Add vào backend/src/auth/routes.ts:
 *     router.post('/activate', handleActivate);
 *   Wire vào router chính (usually / auth/ prefix)
 */

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db';
import { generateJwt } from './jwt';
import { logger } from '../utils/logger';

interface ActivateInput {
  token: string;
  password: string;
  confirmPassword?: string;
}

export async function handleActivate(req: Request, res: Response) {
  const input = req.body as ActivateInput;

  // ─── Validation ────────────────────────────
  if (!input.token || !input.password) {
    return res.status(400).json({
      error: 'MISSING_FIELDS',
      message: 'Thiếu token hoặc password',
    });
  }

  if (input.confirmPassword && input.password !== input.confirmPassword) {
    return res.status(400).json({
      error: 'PASSWORD_MISMATCH',
      message: 'Mật khẩu xác nhận không khớp',
    });
  }

  if (input.password.length < 8) {
    return res.status(400).json({
      error: 'PASSWORD_TOO_SHORT',
      message: 'Mật khẩu tối thiểu 8 ký tự',
    });
  }

  // ─── ⭐ Find lead by magic_token ────────────────────────────
  const lead = await prisma.lead.findFirst({
    where: {
      magicToken: input.token,
      magicTokenExpiresAt: { gt: new Date() }, // Chưa expire
    },
    include: { user: true },
  });

  if (!lead) {
    return res.status(400).json({
      error: 'INVALID_OR_EXPIRED_TOKEN',
      message: 'Link kích hoạt không hợp lệ hoặc đã hết hạn. Vui lòng liên hệ hỗ trợ.',
      contactZalo: 'https://zalo.me/0912727381',
    });
  }

  const user = lead.user;
  if (!user) {
    logger.error(`[activate] Lead ${lead.id} has no user linked — data inconsistency`);
    return res.status(500).json({
      error: 'DATA_ERROR',
      message: 'Lỗi hệ thống. Vui lòng liên hệ admin.',
    });
  }

  if (user.passwordHash) {
    // User đã có password → không thể activate lại
    return res.status(400).json({
      error: 'ALREADY_ACTIVATED',
      message: 'Tài khoản đã được kích hoạt. Vui lòng đăng nhập.',
      redirect: '/dang-nhap/',
    });
  }

  // ─── ⭐ Set password + activate ────────────────────────────
  const passwordHash = await bcrypt.hash(input.password, 12);
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    // Update user
    await tx.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordSetAt: now,
        emailVerified: true,
        status: 'active', // Từ pending_activation → active
        lastLoginAt: now,
      },
    });

    // Invalidate magic token (single-use)
    await tx.lead.update({
      where: { id: lead.id },
      data: {
        magicToken: null,
        magicTokenExpiresAt: null,
      },
    });
  });

  const refreshedUser = await prisma.user.findUnique({ where: { id: user.id } });
  const token = generateJwt(refreshedUser!);

  logger.info(`[activate] User ${user.id} activated via magic link (lead ${lead.id})`);

  return res.status(200).json({
    user: {
      id: refreshedUser!.id,
      email: refreshedUser!.email,
      phone: refreshedUser!.phone,
      displayName: refreshedUser!.displayName,
      tier: refreshedUser!.tier,
      tierExpiresAt: refreshedUser!.tierExpiresAt,
    },
    token,
    message: `🎉 Chào mừng ${refreshedUser!.displayName || ''}! Tài khoản Sol La Bàn ${lead.goi} đã kích hoạt thành công.`,
    redirect: '/toi/',
  });
}

// ─── Endpoint verify token (dùng khi user click magic link) ────────
export async function handleVerifyActivationToken(req: Request, res: Response) {
  const token = req.params.token;

  const lead = await prisma.lead.findFirst({
    where: {
      magicToken: token,
      magicTokenExpiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      email: true,
      ten: true,
      goi: true,
      magicTokenExpiresAt: true,
      user: { select: { passwordHash: true, displayName: true } },
    },
  });

  if (!lead) {
    return res.status(400).json({
      valid: false,
      message: 'Link kích hoạt không hợp lệ hoặc đã hết hạn',
    });
  }

  if (lead.user?.passwordHash) {
    return res.status(400).json({
      valid: false,
      message: 'Tài khoản đã được kích hoạt',
    });
  }

  return res.json({
    valid: true,
    email: lead.email,
    displayName: lead.user?.displayName || lead.ten,
    goi: lead.goi,
    expiresAt: lead.magicTokenExpiresAt,
  });
}
