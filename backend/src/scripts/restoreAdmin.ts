// backend/src/scripts/restoreAdmin.ts
//
// Tạo lại admin user `Khang Sol` với phone `0912727381` đầy đủ data:
// - tier: DONG_HANH (đã đóng phí)
// - quitDate: 9 ngày trước (hành trình đang giữa chừng)
// - isAdmin: true
// - 9 check-ins (mỗi ngày 1 cái, sạch khói)
//
// Chạy:   npx tsx src/scripts/restoreAdmin.ts
// Idempotent: chạy lại không tạo trùng — upsert + skip checkin nếu đã có.

import { prisma } from '../db';

const ADMIN_PHONE = '0912727381';
const ADMIN_NAME = 'Khang Sol';
const QUIT_DAYS_AGO = 9;

async function main() {
  // 1. Tính quitDate = today - 9 ngày (đầu ngày local)
  const quitDate = new Date();
  quitDate.setDate(quitDate.getDate() - QUIT_DAYS_AGO);
  quitDate.setHours(0, 0, 0, 0);

  // 2. Upsert user
  const user = await prisma.user.upsert({
    where: { phone: ADMIN_PHONE },
    update: {
      name: ADMIN_NAME,
      isAdmin: true,
      tier: 'DONG_HANH',
      tierStartedAt: quitDate,
      tierExpiresAt: new Date(quitDate.getTime() + 30 * 86400000),
      quitDate,
      pronouns: 'anh',
      assistantName: 'Sol Đồng hành',
      isAnonymous: false,
      checkinStreak: QUIT_DAYS_AGO,
      longestStreak: QUIT_DAYS_AGO,
      lastCheckinDate: new Date(),
      totalDaysActive: QUIT_DAYS_AGO,
      cohortKey: `${quitDate.getFullYear()}-${String(quitDate.getMonth() + 1).padStart(2, '0')}`,
      settings: {
        quietStart: '22:30',
        quietEnd: '06:30',
        mode: 'normal',
        cigsPerDay: 15,
        pricePerCig: 1000,
      },
    },
    create: {
      phone: ADMIN_PHONE,
      name: ADMIN_NAME,
      isAdmin: true,
      tier: 'DONG_HANH',
      tierStartedAt: quitDate,
      tierExpiresAt: new Date(quitDate.getTime() + 30 * 86400000),
      quitDate,
      pronouns: 'anh',
      assistantName: 'Sol Đồng hành',
      isAnonymous: false,
      checkinStreak: QUIT_DAYS_AGO,
      longestStreak: QUIT_DAYS_AGO,
      lastCheckinDate: new Date(),
      totalDaysActive: QUIT_DAYS_AGO,
      cohortKey: `${quitDate.getFullYear()}-${String(quitDate.getMonth() + 1).padStart(2, '0')}`,
      settings: {
        quietStart: '22:30',
        quietEnd: '06:30',
        mode: 'normal',
        cigsPerDay: 15,
        pricePerCig: 1000,
      },
      state: { create: { state: 'IDLE', stateData: {} } },
    },
  });

  console.log(`✓ User restored: id=${user.id}, phone=${user.phone}, tier=${user.tier}`);
  console.log(`  quitDate: ${user.quitDate?.toISOString().slice(0, 10)} (${QUIT_DAYS_AGO} ngày trước)`);

  // 3. Tạo 9 check-ins (idempotent — skip nếu đã có)
  let created = 0;
  for (let dayNum = 1; dayNum <= QUIT_DAYS_AGO; dayNum++) {
    const date = new Date(quitDate);
    date.setDate(date.getDate() + (dayNum - 1));
    date.setHours(0, 0, 0, 0);

    try {
      await prisma.checkIn.upsert({
        where: { userId_date: { userId: user.id, date } },
        update: {},
        create: {
          userId: user.id,
          date,
          dayNumber: dayNum,
          smoked: false,
          cravingIntensity: 4 + Math.floor(Math.random() * 3), // 4-6
          mood: 3 + Math.floor(Math.random() * 2), // 3-4
          note: dayNum === 1 ? 'Ngày đầu — quyết tâm cao' : dayNum === 7 ? 'Tuần đầu xong, dopamine quay lại' : null,
        },
      });
      created++;
    } catch {
      // Already exists, skip
    }
  }
  console.log(`✓ Check-ins ensured: ${created}/${QUIT_DAYS_AGO}`);

  console.log('\n──────────────────────────────────────');
  console.log('  Login: phone +84 9127 27381 + OTP từ console');
  console.log('  Token sẽ trả user admin với 9 ngày + tier Đồng hành');
  console.log('──────────────────────────────────────\n');

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
