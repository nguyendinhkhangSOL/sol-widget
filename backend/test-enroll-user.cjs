/**
 * Test enroll 1 user mẫu vào 51-day journey.
 *
 * Run: node test-enroll-user.cjs <userId>
 *
 * Nếu không truyền userId → tự tạo test user.
 *
 * Verify:
 *   - 51 ScheduledPush được tạo (full-51 journey)
 *   - User.journeyStatus = 'active'
 *   - User.qDayDate được set
 *   - Mỗi push có templateCode + wikiSlug + scheduledAt đúng
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  let userId = process.argv[2];

  if (!userId) {
    // Tìm test user đã có (để re-enroll nếu cần)
    let testUser = await prisma.user.findFirst({
      where: { name: { startsWith: 'Test User Phase5' } },
      orderBy: { createdAt: 'desc' },
    });

    if (testUser) {
      console.log('Dùng test user đã có:', testUser.id);
      // Reset journey state để re-enroll
      await prisma.user.update({
        where: { id: testUser.id },
        data: { journeyStatus: null, qDayConfirmedAt: null, qDayDate: null, journeyType: null },
      });
      await prisma.scheduledPush.deleteMany({ where: { userId: testUser.id } });
      console.log('  ✓ Reset journey state + xoá ScheduledPush cũ');
    } else {
      console.log('Tạo user test mới...');
      const rand = String(Math.floor(Math.random() * 9_999_999)).padStart(7, '0');
      testUser = await prisma.user.create({
        data: {
          phone: `09870${rand.slice(0, 5)}`,
          name: `Test User Phase5 (${rand})`,
          pronouns: 'anh',
          isAnonymous: false,
          preferredPushHour: 7,
          pushTimezone: 'Asia/Ho_Chi_Minh',
        },
      });
      console.log('  ✓ Created user:', testUser.id);
    }
    userId = testUser.id;
  }

  // Q-Day = 5 ngày sau
  const qDayDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
  console.log('Q-Day date:', qDayDate.toISOString());

  // Import journey engine
  const { enrollUser } = require('./dist/zalo/journeyEngine.js');

  console.log('\nEnrolling vào full-51 journey...');
  const result = await enrollUser({
    userId,
    journeyType: 'full-51',
    qDayDate,
    preferredHour: 7,
  });
  console.log('  ✓ Created', result.created, 'ScheduledPush records');

  // Verify
  console.log('\nVerify schedule:');
  const pushes = await prisma.scheduledPush.findMany({
    where: { userId },
    orderBy: { dayOffset: 'asc' },
    select: {
      dayOffset: true, templateCode: true, wikiSlug: true,
      scheduledAt: true, status: true,
    },
  });

  console.log(`  Total: ${pushes.length} records (expect 51)\n`);

  // Print 5 mẫu: first, T-7, Q-Day, D7 (milestone), D30 (milestone)
  const samples = [
    pushes.find((p) => p.dayOffset === -21),
    pushes.find((p) => p.dayOffset === -7),
    pushes.find((p) => p.dayOffset === 0),
    pushes.find((p) => p.dayOffset === 7),
    pushes.find((p) => p.dayOffset === 30),
  ];

  console.log('  Sample records:');
  for (const p of samples) {
    if (!p) continue;
    console.log(`    Day ${String(p.dayOffset).padStart(3)}: ${p.templateCode.padEnd(25)} ${p.wikiSlug ?? '(no slug)'}`);
    console.log(`            scheduledAt: ${p.scheduledAt.toISOString()}`);
  }

  // Stats
  const byTemplate = pushes.reduce((acc, p) => {
    acc[p.templateCode] = (acc[p.templateCode] || 0) + 1;
    return acc;
  }, {});
  console.log('\n  Template distribution:');
  for (const [tpl, count] of Object.entries(byTemplate)) {
    console.log(`    ${tpl}: ${count}`);
  }

  // User state
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true, journeyType: true, qDayDate: true,
      journeyStatus: true, journeyEnrolledAt: true,
      preferredPushHour: true,
    },
  });
  console.log('\n  User state:');
  console.log('    Name:', user.name);
  console.log('    JourneyType:', user.journeyType);
  console.log('    Status:', user.journeyStatus);
  console.log('    Q-Day:', user.qDayDate?.toISOString());
  console.log('    Push hour:', user.preferredPushHour);

  console.log('\n✅ Test enroll complete!\n');
  console.log('🧹 Cleanup (nếu muốn xoá user test):');
  console.log(`   node -e "require('@prisma/client').PrismaClient && (async()=>{const p=new (require('@prisma/client').PrismaClient)();await p.user.delete({where:{id:'${userId}'}});console.log('Deleted');await p.\\$disconnect();})()"`);

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Test failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
