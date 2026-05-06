// backend/src/scripts/resetEmailAuth.ts
// Dev tool: reset email binding cho 1 user để test lại flow magic link.
//
// Run trong Docker:
//   docker compose exec backend node dist/scripts/resetEmailAuth.js <email>
//
// Hoặc clear tất cả email + token (dev only):
//   docker compose exec backend node dist/scripts/resetEmailAuth.js --all

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error('Usage: resetEmailAuth.js <email> | --all');
    process.exit(1);
  }

  if (arg === '--all') {
    const tokens = await prisma.emailVerificationToken.deleteMany({});
    const users = await prisma.user.updateMany({
      where: { email: { not: null } },
      data: { email: null },
    });
    console.log(`Cleared ALL email bindings:`);
    console.log(`  Tokens deleted: ${tokens.count}`);
    console.log(`  Users unbound:  ${users.count}`);
  } else {
    const email = arg.trim().toLowerCase();
    const userBefore = await prisma.user.findUnique({ where: { email } });
    if (!userBefore) {
      console.log(`No user found with email "${email}". Nothing to reset.`);
    } else {
      await prisma.user.update({
        where: { id: userBefore.id },
        data: { email: null },
      });
      console.log(`User #${userBefore.id} (name: ${userBefore.name}) email cleared.`);
    }
    const tokens = await prisma.emailVerificationToken.deleteMany({ where: { email } });
    console.log(`Tokens deleted for ${email}: ${tokens.count}`);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});
