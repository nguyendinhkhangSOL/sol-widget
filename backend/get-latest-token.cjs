/**
 * Lấy magic link token gần đây nhất từ DB → in URL để copy paste.
 *
 * Run: node get-latest-token.cjs [email] [adminUrl]
 *
 * Vd:
 *   node get-latest-token.cjs nguyendinhkhang@gmail.com http://localhost:5176
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const EMAIL = process.argv[2] || 'nguyendinhkhang@gmail.com';
const ADMIN_URL = process.argv[3] || 'http://localhost:5176';

async function main() {
  const token = await prisma.emailVerificationToken.findFirst({
    where: { email: EMAIL, consumedAt: null, expiresAt: { gte: new Date() } },
    orderBy: { createdAt: 'desc' },
  });

  if (!token) {
    console.log('Không có token hợp lệ cho', EMAIL);
    console.log('→ Vào /login bấm "Gửi link" để generate token mới');
    await prisma.$disconnect();
    return;
  }

  // Lookup user
  const user = token.fromUserId ? await prisma.user.findUnique({
    where: { id: token.fromUserId },
    select: { id: true, email: true, name: true, isAdmin: true },
  }) : null;

  // Promote to admin nếu chưa
  if (user && !user.isAdmin) {
    await prisma.user.update({
      where: { id: user.id },
      data: { isAdmin: true },
    });
    console.log(`✓ Promoted ${user.email} to admin`);
  }

  console.log('');
  console.log('═'.repeat(70));
  console.log('  MAGIC LINK (latest valid token)');
  console.log('═'.repeat(70));
  console.log('');
  console.log(`  ${ADMIN_URL}/auth/email?token=${token.token}`);
  console.log('');
  console.log(`  Email:   ${token.email}`);
  console.log(`  User:    ${user?.name ?? '(no name)'} (${user?.id})`);
  console.log(`  Admin:   ${user?.isAdmin ?? false}`);
  console.log(`  Expires: ${token.expiresAt.toLocaleString('vi-VN')}`);
  console.log('');
  console.log('═'.repeat(70));

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Error:', err);
  await prisma.$disconnect();
  process.exit(1);
});
