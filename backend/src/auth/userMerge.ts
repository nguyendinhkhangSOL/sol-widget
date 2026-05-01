// backend/src/auth/userMerge.ts
//
// Khi user ẩn danh (deviceUid) bind phone hoặc Zalo, có thể đã tồn tại 1 user
// với phone/zaloId đó (vd user mở widget ở 2 site khác nhau, mỗi site 1 anon
// user, sau đó liên kết cùng 1 Zalo). Ta MERGE anon vào user "khoẻ" hơn:
//
//   - Chuyển toàn bộ messages, checkIns, exercises, notifications,
//     crisisEvents, payments, refunds, voiceDeliveries… từ anon → existing
//   - Nếu existing chưa có quitDate nhưng anon có → copy quitDate
//   - Settings: existing wins (vì đã được tinh chỉnh nhiều hơn)
//   - Streak / counters: cộng dồn (an toàn hơn lấy max — không mất ngày)
//   - Delete anon user sau cùng
//
// Tất cả trong 1 transaction để không nửa vời nếu lỗi.

import { prisma } from '../db';
import { logger } from '../utils/logger';

interface MergeResult {
  targetUserId: string;
  mergedFromUserId: string | null;
}

/**
 * Merge anon user vào existing user (nếu existing tồn tại).
 * - Nếu `existingUserId` null → upgrade anon thành user thường (set phone/zaloId, isAnonymous=false)
 * - Nếu existing tồn tại → chuyển data từ anon sang existing, xoá anon
 *
 * Trả về `targetUserId` = user còn sống sau merge (caller cấp JWT cho user này).
 */
export async function mergeOrUpgrade({
  anonUserId,
  existingUserId,
  phone,
  zaloUserId,
  name,
  pictureUrl,
}: {
  anonUserId: string;
  existingUserId: string | null;
  phone?: string | null;
  zaloUserId?: string | null;
  name?: string | null;
  pictureUrl?: string | null;
}): Promise<MergeResult> {
  // Trường hợp 1: KHÔNG có existing user — upgrade anon thành user thường
  if (!existingUserId) {
    const updateData: any = { isAnonymous: false };
    if (phone) updateData.phone = phone;
    if (zaloUserId) updateData.zaloUserId = zaloUserId;
    if (name) updateData.name = name;
    // pictureUrl chưa có field — bỏ qua

    await prisma.user.update({
      where: { id: anonUserId },
      data: updateData,
    });

    logger.info({ anonUserId, phone, zaloUserId }, 'Anon user upgraded');
    return { targetUserId: anonUserId, mergedFromUserId: null };
  }

  // Trường hợp 2: Đã có user → MERGE anon vào existing
  // (anon chỉ có data ngắn ngày — nếu existing có hành trình lâu hơn, ưu tiên existing)

  if (anonUserId === existingUserId) {
    // Cùng user — không cần merge
    return { targetUserId: existingUserId, mergedFromUserId: null };
  }

  await prisma.$transaction(async (tx) => {
    // 1. Chuyển foreign-key relations từ anon sang existing
    await tx.message.updateMany({
      where: { userId: anonUserId },
      data: { userId: existingUserId },
    });
    await tx.checkIn.updateMany({
      where: { userId: anonUserId },
      data: { userId: existingUserId },
    });
    await tx.exerciseEntry.updateMany({
      where: { userId: anonUserId },
      data: { userId: existingUserId },
    });
    await tx.notification.updateMany({
      where: { userId: anonUserId },
      data: { userId: existingUserId },
    });
    await tx.pushSubscription.updateMany({
      where: { userId: anonUserId },
      data: { userId: existingUserId },
    });
    await tx.crisisEvent.updateMany({
      where: { userId: anonUserId },
      data: { userId: existingUserId },
    });
    await tx.paymentLog.updateMany({
      where: { userId: anonUserId },
      data: { userId: existingUserId },
    });
    await tx.refundRequest.updateMany({
      where: { userId: anonUserId },
      data: { userId: existingUserId },
    });
    await tx.voiceDelivery.updateMany({
      where: { userId: anonUserId },
      data: { userId: existingUserId },
    });

    // 2. UserState là 1-1, xoá của anon (existing đã có)
    await tx.userState.deleteMany({ where: { userId: anonUserId } });

    // 3. Merge counters: cộng dồn
    const [anon, existing] = await Promise.all([
      tx.user.findUnique({ where: { id: anonUserId } }),
      tx.user.findUnique({ where: { id: existingUserId } }),
    ]);

    if (anon && existing) {
      await tx.user.update({
        where: { id: existingUserId },
        data: {
          totalDaysActive: existing.totalDaysActive + anon.totalDaysActive,
          // checkinStreak / longestStreak: lấy MAX (không cộng — streak là chuỗi liên tục)
          checkinStreak: Math.max(existing.checkinStreak, anon.checkinStreak),
          longestStreak: Math.max(existing.longestStreak, anon.longestStreak),
          // quitDate: nếu existing chưa có, lấy của anon (anon có thể đã đặt Q-Day trước)
          quitDate: existing.quitDate ?? anon.quitDate,
          // Update name/picture nếu có data mới từ Zalo
          ...(name && !existing.name ? { name } : {}),
          // deviceUid: chuyển sang device mới (anon's deviceUid)
          deviceUid: anon.deviceUid ?? existing.deviceUid,
          // Đảm bảo flag không ẩn danh
          isAnonymous: false,
        },
      });
    }

    // 4. Xoá anon user
    await tx.user.delete({ where: { id: anonUserId } });
  });

  logger.info({ anonUserId, existingUserId }, 'Anon user merged into existing');
  return { targetUserId: existingUserId, mergedFromUserId: anonUserId };
}
