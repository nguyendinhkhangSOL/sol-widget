/**
 * Sub-B / File 1 of 4 — /api/auth/register (REFACTORED)
 *
 * Vấn đề cũ:
 *   - Chỉ INSERT users, không check orphan lead
 *   - Nếu email đã có lead PAID nhưng chưa activate → tạo user mới KHÔNG link → user vẫn FREE
 *
 * Fix:
 *   - Check email trong leads (orphan: user_id IS NULL, status PAID/ACTIVATED)
 *   - Nếu có: INSERT users + LINK leads.user_id + Set tier=ACTIVE
 *   - Nếu không: INSERT users tier=FREE bình thường
 *
 * Integration:
 *   Đè lên file backend/src/auth/routes.ts function handleRegister
 *   Hoặc create new handler + wire vào router
 */

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { addMonths } from 'date-fns';
import { prisma } from '../db';
import { generateJwt } from './jwt';
import { logger } from '../utils/logger';

interface RegisterInput {
  email: string;
  phone: string;
  password: string;
  displayName?: string;
}

export async function handleRegister(req: Request, res: Response) {
  const input = req.body as RegisterInput;

  // ─── Validation ────────────────────────────
  if (!input.email || !input.phone || !input.password) {
    return res.status(400).json({
      error: 'MISSING_FIELDS',
      message: 'Thiếu email, phone hoặc password',
    });
  }

  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();

  // ─── Check trùng ────────────────────────────
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(409).json({
      error: 'EMAIL_EXISTS',
      message: 'Email đã có tài khoản. Vui lòng đăng nhập.',
      redirect: '/dang-nhap/',
    });
  }

  const existingPhone = await prisma.user.findFirst({ where: { phone } });
  if (existingPhone) {
    return res.status(409).json({
      error: 'PHONE_EXISTS',
      message: 'SĐT đã có tài khoản khác.',
    });
  }

  // ─── ⭐ TÌM ORPHAN LEAD (đã thanh toán chưa activate) ────────
  const orphanLead = await prisma.lead.findFirst({
    where: {
      email,
      userId: null,
      paymentStatus: { in: ['PAID', 'ACTIVATED'] },
    },
    orderBy: { createdAt: 'desc' },
  });

  const passwordHash = await bcrypt.hash(input.password, 12);
  const now = new Date();

  // ─── Transaction: tạo user + link lead nếu có ────────
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        phone,
        displayName: input.displayName || email.split('@')[0],
        passwordHash,
        passwordSetAt: now,
        emailVerified: false,
        provider: 'EMAIL',
        role: 'USER',
        isActive: true,
        source: orphanLead ? 'thanhtoan' : 'dangky',
        status: 'active',
        // ⭐ Nếu có orphan lead PAID → tier = ACTIVE + expires
        tier: orphanLead ? 'ACTIVE' : 'FREE',
        tierStartedAt: orphanLead ? (orphanLead.activatedAt || now) : null,
        tierExpiresAt: orphanLead
          ? addMonths(orphanLead.activatedAt || now, 12)
          : null,
        activeLeadId: orphanLead?.id || null,
        sourceLeadId: orphanLead?.id || null,
      },
    });

    // ⭐ Link orphan lead về user vừa tạo
    if (orphanLead) {
      await tx.lead.update({
        where: { id: orphanLead.id },
        data: {
          userId: user.id,
          // Clear magic_token (đã activate qua đăng ký)
          magicToken: null,
          magicTokenExpiresAt: null,
          passwordHash: passwordHash,  // Legacy compat, may deprecate later
          passwordSetAt: now,
        },
      });

      logger.info(
        `[register] Linked orphan lead #${orphanLead.id} to new user ${user.id} — tier auto-upgraded to ACTIVE`
      );
    }

    return user;
  });

  const token = generateJwt(result);

  return res.status(201).json({
    user: {
      id: result.id,
      email: result.email,
      phone: result.phone,
      displayName: result.displayName,
      tier: result.tier,
      tierExpiresAt: result.tierExpiresAt,
    },
    token,
    autoUpgraded: !!orphanLead,
    message: orphanLead
      ? `Chào mừng! Tài khoản của bạn đã tự động kích hoạt Sol La Bàn Active (từ đơn thanh toán #${orphanLead.id}).`
      : 'Đăng ký thành công. Chào mừng đến với Sol La Bàn!',
  });
}
