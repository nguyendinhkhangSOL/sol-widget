/**
 * Verify worker đang chạy đúng — reset failed records về pending để
 * worker fire lại trong < 5 phút.
 *
 * Run: node check-worker-alive.cjs
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Count records theo status
  const counts = await prisma.scheduledPush.groupBy({
    by: ['status'],
    _count: { _all: true },
  });

  console.log('\n▶ ScheduledPush status breakdown:\n');
  for (const c of counts) {
    console.log(`  ${c.status.padEnd(15)}: ${c._count._all}`);
  }

  // 2. Reset failed → pending để worker fire lại
  const reset = await prisma.scheduledPush.updateMany({
    where: {
      status: 'failed',
      errorCode: 'TEMPLATE_NOT_APPROVED',
    },
    data: {
      status: 'pending',
      retryCount: 0,
      errorMessage: null,
      errorCode: null,
    },
  });

  console.log(`\n▶ Reset ${reset.count} records từ failed → pending\n`);
  console.log('→ Trong < 5 phút, worker sẽ scan lại và log "fireDuePushes: scanning batch"');
  console.log('→ Vẫn fail (TEMPLATE_NOT_APPROVED) nhưng anh sẽ THẤY LOG = worker đang sống.\n');

  // 3. Liệt kê 3 record mẫu
  const sample = await prisma.scheduledPush.findMany({
    where: { status: 'pending' },
    take: 3,
    orderBy: { scheduledAt: 'asc' },
    select: { id: true, dayOffset: true, templateCode: true, scheduledAt: true },
  });
  if (sample.length > 0) {
    console.log('  Sample pending records:');
    for (const s of sample) {
      console.log(`    Day ${String(s.dayOffset).padStart(3)} | ${s.templateCode} | scheduled ${s.scheduledAt.toISOString()}`);
    }
  }
  console.log('');

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Error:', err);
  await prisma.$disconnect();
  process.exit(1);
});
