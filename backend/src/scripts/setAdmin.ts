// backend/src/scripts/setAdmin.ts
//
// Set User.isAdmin = true theo email.
//
// Usage:
//   npx tsx src/scripts/setAdmin.ts nguyendinhkhang@gmail.com
//   npx tsx src/scripts/setAdmin.ts khang@sol.vn --revoke   (gỡ quyền admin)
//
// Docker:
//   docker compose exec backend node dist/scripts/setAdmin.js nguyendinhkhang@gmail.com

import { prisma } from '../db';

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: setAdmin.ts <email> [--revoke]');
    process.exit(1);
  }

  const email = args[0].trim().toLowerCase();
  const revoke = args.includes('--revoke');
  const targetIsAdmin = !revoke;

  console.log(`[setAdmin] Looking for user with email: ${email}`);

  const user = await prisma.user.findFirst({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      isAdmin: true,
      isAnonymous: true,
      createdAt: true,
    },
  });

  if (!user) {
    console.error(`[setAdmin] ❌ User with email "${email}" not found.`);
    console.error(`           User phải bind email qua Email Magic Link trước (gửi /auth/email/request).`);
    process.exit(1);
  }

  console.log(`[setAdmin] Found user:`);
  console.log(`           id:          ${user.id}`);
  console.log(`           email:       ${user.email}`);
  console.log(`           name:        ${user.name || '(none)'}`);
  console.log(`           isAdmin:     ${user.isAdmin}  ${user.isAdmin === targetIsAdmin ? '(unchanged)' : `→ ${targetIsAdmin}`}`);
  console.log(`           isAnonymous: ${user.isAnonymous}`);
  console.log(`           createdAt:   ${user.createdAt.toISOString()}`);

  if (user.isAdmin === targetIsAdmin) {
    console.log(`[setAdmin] ℹ️  No change needed.`);
    process.exit(0);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { isAdmin: targetIsAdmin },
    select: { id: true, email: true, isAdmin: true },
  });

  if (revoke) {
    console.log(`[setAdmin] ✅ Revoked admin from ${updated.email}.`);
  } else {
    console.log(`[setAdmin] ✅ Granted admin to ${updated.email}.`);
    console.log(`[setAdmin]    User cần logout + login lại admin.sol.vn để JWT mới có claim isAdmin.`);
  }

  await prisma.$disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('[setAdmin] fatal:', err);
  process.exit(1);
});
