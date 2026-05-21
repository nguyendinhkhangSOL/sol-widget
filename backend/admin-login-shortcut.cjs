/**
 * Generate magic link admin login URL — bypass email.
 *
 * Run: node admin-login-shortcut.cjs nguyendinhkhang@gmail.com
 *
 * Cách hoạt động:
 *   1. Tìm hoặc tạo User với email
 *   2. Đảm bảo isAdmin=true
 *   3. Tạo EmailVerificationToken thẳng vào DB
 *   4. In ra URL magic link để copy paste
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

const EMAIL = process.argv[2] || 'nguyendinhkhang@gmail.com';
const ADMIN_BASE_URL = process.argv[3] || 'http://localhost:5176';

async function main() {
  // 1. Tìm hoặc tạo User
  let user = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: EMAIL,
        name: 'Khang Sol Admin',
        pronouns: 'anh',
        isAnonymous: false,
        isAdmin: true,
      },
    });
    console.log(`✓ Created new admin user: ${user.id}`);
  } else if (!user.isAdmin) {
    await prisma.user.update({
      where: { id: user.id },
      data: { isAdmin: true },
    });
    console.log(`✓ Promoted existing user to admin: ${user.id}`);
  } else {
    console.log(`✓ Admin user already exists: ${user.id}`);
  }

  // 2. Tạo token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 phút

  await prisma.emailVerificationToken.create({
    data: {
      fromUserId: user.id,
      email: EMAIL,
      token,
      expiresAt,
    },
  });

  const magicUrl = `${ADMIN_BASE_URL}/auth/email?token=${token}`;

  console.log('');
  console.log('═'.repeat(70));
  console.log('  MAGIC LINK ADMIN LOGIN — Copy URL paste vào browser');
  console.log('═'.repeat(70));
  console.log('');
  console.log(`  ${magicUrl}`);
  console.log('');
  console.log(`  Email:   ${EMAIL}`);
  console.log(`  User ID: ${user.id}`);
  console.log(`  Admin:   true`);
  console.log(`  Expires: ${expiresAt.toLocaleString('vi-VN')}`);
  console.log('');
  console.log('═'.repeat(70));

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Error:', err);
  await prisma.$disconnect();
  process.exit(1);
});
