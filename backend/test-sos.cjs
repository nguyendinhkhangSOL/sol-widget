/**
 * Tạo SOS alert giả để test admin UI Sprint 3.
 *
 * Run: node test-sos.cjs [severity]
 *
 * Vd:
 *   node test-sos.cjs           # severity = critical (default)
 *   node test-sos.cjs high      # high severity
 *   node test-sos.cjs medium    # medium
 *   node test-sos.cjs low       # low
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SAMPLES = {
  critical: {
    triggerType: 'keyword',
    matchedKeyword: 'đau ngực dữ',
    userMessage: 'Em đau ngực dữ dội, khó thở, tim đập nhanh',
    severity: 'critical',
  },
  high: {
    triggerType: 'button',
    matchedKeyword: null,
    userMessage: 'Em sắp hút lại rồi anh ơi cứu em',
    severity: 'high',
  },
  medium: {
    triggerType: 'keyword',
    matchedKeyword: 'tự hại',
    userMessage: 'Em buồn quá không thiết sống',
    severity: 'medium',
  },
  low: {
    triggerType: 'no_reply_3d',
    matchedKeyword: null,
    userMessage: null,
    severity: 'low',
  },
};

async function main() {
  const sev = process.argv[2] || 'critical';
  const sample = SAMPLES[sev];
  if (!sample) {
    console.error('Severity invalid. Use: critical | high | medium | low');
    process.exit(1);
  }

  const user = await prisma.user.findFirst({
    where: { name: 'Test User Phase5' },
    select: { id: true, name: true },
  });
  if (!user) {
    console.error('Test user not found. Run test-enroll-user.cjs first.');
    process.exit(1);
  }

  const alert = await prisma.sOSAlert.create({
    data: {
      userId: user.id,
      ...sample,
      status: 'pending',
    },
  });

  console.log(`\n✅ Created SOS alert for ${user.name}`);
  console.log(`   ID:       ${alert.id}`);
  console.log(`   Severity: ${alert.severity}`);
  console.log(`   Trigger:  ${alert.triggerType}`);
  console.log(`   Message:  ${alert.userMessage ?? '(no message)'}`);
  console.log('');
  console.log('→ Refresh trang http://localhost:5173/zalo-sos để xem alert');
  console.log('  Nếu bật 🔔 âm cảnh báo + severity=critical → sẽ nghe bíp 3 lần');
  console.log('');

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Error:', err);
  await prisma.$disconnect();
  process.exit(1);
});
