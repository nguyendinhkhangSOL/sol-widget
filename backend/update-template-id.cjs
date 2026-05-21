/**
 * Update zaloTemplateId + status='APPROVED' cho 1 template sau khi Zalo duyệt.
 *
 * Run: node update-template-id.cjs <CODE> <ZALO_TEMPLATE_ID>
 *
 * Vd:
 *   node update-template-id.cjs SOL_DAILY_CHIP 1234567890123456789
 *   node update-template-id.cjs SOL_SOS_CRISIS 2345678901234567890
 *   node update-template-id.cjs SOL_MILESTONE_GENERIC 3456789012345678901
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const code = process.argv[2];
  const zaloTemplateId = process.argv[3];

  if (!code || !zaloTemplateId) {
    console.error('Usage: node update-template-id.cjs <CODE> <ZALO_TEMPLATE_ID>');
    console.error('');
    console.error('Available codes:');
    const all = await prisma.zaloTemplate.findMany({
      select: { code: true, status: true, zaloTemplateId: true },
      orderBy: { code: 'asc' },
    });
    for (const t of all) {
      console.error(
        '  ' + t.code.padEnd(30) +
        ' status=' + t.status.padEnd(10) +
        ' id=' + (t.zaloTemplateId ?? 'NULL'),
      );
    }
    await prisma.$disconnect();
    process.exit(1);
  }

  // Validate
  if (!/^\d+$/.test(zaloTemplateId)) {
    console.error('ZALO_TEMPLATE_ID phải là chuỗi số (vd: 1234567890123456789).');
    await prisma.$disconnect();
    process.exit(1);
  }

  const updated = await prisma.zaloTemplate.update({
    where: { code },
    data: {
      zaloTemplateId,
      status: 'APPROVED',
      approvedAt: new Date(),
    },
  });

  console.log('');
  console.log('✓ Updated template:');
  console.log('  Code:           ' + updated.code);
  console.log('  Zalo Template ID: ' + updated.zaloTemplateId);
  console.log('  Status:         ' + updated.status);
  console.log('  Approved at:    ' + updated.approvedAt?.toISOString());
  console.log('');
  console.log('→ Cron fireDuePushes sẽ tự dùng template này từ lần chạy tiếp theo.');
  console.log('');

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Error:', err.message);
  await prisma.$disconnect();
  process.exit(1);
});
