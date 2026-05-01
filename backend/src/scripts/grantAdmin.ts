// backend/src/scripts/grantAdmin.ts
// CLI tiện lợi: cấp / thu hồi / kiểm tra quyền admin cho một user.
//
// Dùng:
//   npm run admin:grant  -- <phone>        # cấp quyền admin
//   npm run admin:revoke -- <phone>        # thu hồi quyền admin
//   npm run admin:list                     # liệt kê mọi admin hiện có
//
// Phone có thể nhập dạng "0901234567" hoặc "+84901234567" — script sẽ
// normalize nhẹ để tìm cả hai biến thể.

import { prisma } from '../db';

type Mode = 'grant' | 'revoke' | 'list';

function normalizePhoneVariants(raw: string): string[] {
  const trimmed = raw.trim().replace(/\s+/g, '');
  const digits = trimmed.replace(/[^\d+]/g, '');
  const variants = new Set<string>([trimmed, digits]);

  // 0901234567 ↔ +84901234567
  if (digits.startsWith('0')) {
    variants.add('+84' + digits.slice(1));
    variants.add('84' + digits.slice(1));
  } else if (digits.startsWith('+84')) {
    variants.add('0' + digits.slice(3));
    variants.add('84' + digits.slice(3));
  } else if (digits.startsWith('84')) {
    variants.add('0' + digits.slice(2));
    variants.add('+' + digits);
  }
  return Array.from(variants).filter(Boolean);
}

async function findUser(phone: string) {
  const variants = normalizePhoneVariants(phone);
  const user = await prisma.user.findFirst({
    where: { phone: { in: variants } },
    select: { id: true, phone: true, name: true, isAdmin: true },
  });
  return { user, variants };
}

async function grant(phone: string) {
  const { user, variants } = await findUser(phone);
  if (!user) {
    console.error(`✗ Không tìm thấy user với phone: ${phone}`);
    console.error(`  Đã thử các biến thể: ${variants.join(', ')}`);
    console.error(
      `  Gợi ý: user cần đăng nhập qua widget ít nhất 1 lần để được tạo trong DB,`
    );
    console.error(`  rồi mới chạy lại lệnh này.`);
    process.exit(1);
  }
  if (user.isAdmin) {
    console.log(`ℹ  ${user.phone} (${user.name ?? 'chưa có tên'}) đã là admin rồi.`);
    return;
  }
  await prisma.user.update({ where: { id: user.id }, data: { isAdmin: true } });
  console.log(`✓ Đã cấp quyền admin cho ${user.phone} (${user.name ?? 'chưa có tên'}).`);
  console.log(`  Nhắc người dùng đăng xuất/đăng nhập lại để token refresh state.`);
}

async function revoke(phone: string) {
  const { user } = await findUser(phone);
  if (!user) {
    console.error(`✗ Không tìm thấy user với phone: ${phone}`);
    process.exit(1);
  }
  if (!user.isAdmin) {
    console.log(`ℹ  ${user.phone} không phải là admin, không cần thu hồi.`);
    return;
  }
  await prisma.user.update({ where: { id: user.id }, data: { isAdmin: false } });
  console.log(`✓ Đã thu hồi quyền admin của ${user.phone}.`);
}

async function list() {
  const admins = await prisma.user.findMany({
    where: { isAdmin: true },
    select: { phone: true, name: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  if (admins.length === 0) {
    console.log('Chưa có admin nào trong hệ thống.');
    console.log('Chạy:  npm run admin:grant -- <phone>   để cấp quyền.');
    return;
  }
  console.log(`Có ${admins.length} admin:`);
  for (const a of admins) {
    console.log(`  - ${a.phone}  ${a.name ? `· ${a.name}` : ''}`);
  }
}

async function main() {
  const [modeRaw, phone] = process.argv.slice(2);
  const mode = (modeRaw ?? '').toLowerCase() as Mode;

  if (!['grant', 'revoke', 'list'].includes(mode)) {
    console.error('Cách dùng:');
    console.error('  npm run admin:grant  -- <phone>');
    console.error('  npm run admin:revoke -- <phone>');
    console.error('  npm run admin:list');
    process.exit(1);
  }

  if (mode === 'list') {
    await list();
  } else {
    if (!phone) {
      console.error(`Thiếu phone. Ví dụ:  npm run admin:${mode} -- 0901234567`);
      process.exit(1);
    }
    if (mode === 'grant') await grant(phone);
    else await revoke(phone);
  }
}

main()
  .catch((err) => {
    console.error('Lỗi:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
