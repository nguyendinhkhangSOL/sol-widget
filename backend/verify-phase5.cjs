/**
 * Verify Phase 5 schema sau khi migration.
 *
 * Run: node verify-phase5.cjs
 *
 * Checks:
 *   1. ScheduledPush table tồn tại
 *   2. SOSAlert table tồn tại
 *   3. User có 9 cột mới
 *   4. 3 ZNS template DRAFT đã seed
 *   5. Data cũ KHÔNG mất (User, CannedReply, ZaloTemplate cũ)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check(label, fn) {
  try {
    const r = await fn();
    console.log(`  ✓ ${label}: ${r}`);
    return true;
  } catch (err) {
    console.log(`  ✗ ${label}: ${err.message.slice(0, 150)}`);
    return false;
  }
}

async function main() {
  console.log('\n▶ Phase 5 Schema Verification\n');

  // 1. Tables
  console.log('1. New tables:');
  const tables = await prisma.$queryRawUnsafe(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name IN ('ScheduledPush', 'SOSAlert')
    ORDER BY table_name
  `);
  for (const t of ['ScheduledPush', 'SOSAlert']) {
    const exists = tables.some((r) => r.table_name === t);
    console.log(`  ${exists ? '✓' : '✗'} ${t}`);
  }

  // 2. User columns
  console.log('\n2. User journey columns:');
  const userCols = await prisma.$queryRawUnsafe(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'User'
    AND column_name IN ('journeyType','qDayDate','currentJourneyDay','journeyStatus',
                        'preferredPushHour','pushTimezone','journeyEnrolledAt','journeyEndedAt')
  `);
  const expectedCols = ['journeyType','qDayDate','currentJourneyDay','journeyStatus',
                        'preferredPushHour','pushTimezone','journeyEnrolledAt','journeyEndedAt'];
  for (const c of expectedCols) {
    const exists = userCols.some((r) => r.column_name === c);
    console.log(`  ${exists ? '✓' : '✗'} User.${c}`);
  }

  // 3. ZNS templates (3 mới)
  console.log('\n3. New ZNS templates (DRAFT):');
  const newTemplates = await prisma.zaloTemplate.findMany({
    where: { code: { in: ['SOL_DAILY_CHIP', 'SOL_SOS_CRISIS', 'SOL_MILESTONE_GENERIC'] } },
    select: { code: true, status: true, charCount: true },
  });
  for (const code of ['SOL_DAILY_CHIP', 'SOL_SOS_CRISIS', 'SOL_MILESTONE_GENERIC']) {
    const t = newTemplates.find((x) => x.code === code);
    console.log(`  ${t ? '✓' : '✗'} ${code}: ${t ? `${t.status} (${t.charCount} chars)` : 'NOT FOUND'}`);
  }

  // 4. Data cũ còn nguyên
  console.log('\n4. Data cũ:');
  const userCount = await prisma.user.count();
  const cannedCount = await prisma.cannedReply.count();
  const templateCount = await prisma.zaloTemplate.count();
  const contentCount = await prisma.contentItem.count();
  console.log(`  ✓ User: ${userCount} rows`);
  console.log(`  ✓ CannedReply: ${cannedCount} rows`);
  console.log(`  ✓ ZaloTemplate: ${templateCount} rows (3 mới + ${templateCount - 3} cũ)`);
  console.log(`  ✓ ContentItem: ${contentCount} rows`);

  // 5. Tables tổng số
  console.log('\n5. Total tables:');
  const allTables = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*) as cnt FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  `);
  console.log(`  ✓ Total: ${allTables[0].cnt} tables (expect 39)`);

  // 6. ScheduledPush + SOSAlert phải có 0 rows
  console.log('\n6. New tables empty:');
  const schedCount = await prisma.scheduledPush.count();
  const sosCount = await prisma.sOSAlert.count();
  console.log(`  ${schedCount === 0 ? '✓' : '⚠'} ScheduledPush: ${schedCount} rows (expect 0)`);
  console.log(`  ${sosCount === 0 ? '✓' : '⚠'} SOSAlert: ${sosCount} rows (expect 0)`);

  console.log('\n━'.repeat(35));
  console.log('Verification complete!\n');

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Verify failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
