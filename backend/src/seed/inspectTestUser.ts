// backend/src/seed/inspectTestUser.ts
// Print test user fields để debug Level 3 personalize.

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const u = await prisma.user.findUnique({ where: { email: 'test@sol.vn' } });
  if (!u) {
    console.log('✗ Chưa có test@sol.vn');
    process.exit(1);
  }
  console.log('=== test@sol.vn ===');
  console.log('  id:           ', u.id);
  console.log('  name:         ', u.name);
  console.log('  pronouns:     ', u.pronouns);
  console.log('  assistantName:', u.assistantName);
  console.log('  quitDate:     ', u.quitDate?.toISOString());
  console.log('  quitReasons:  ', JSON.stringify(u.quitReasons));
  console.log('  topTriggers:  ', JSON.stringify(u.topTriggers));
  console.log('  tier:         ', u.tier);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
