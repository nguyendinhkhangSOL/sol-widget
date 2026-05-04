// backend/src/seed/resetContentItems.ts
// Wipe ContentItem table sạch rồi seed lại 127 row đúng theo contentItems.ts.
// Dùng khi DB có row mồ côi (vd contentItems.ts đã thay đổi structure).
//
// Run: cd backend && npx tsx src/seed/resetContentItems.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const before = await prisma.contentItem.count();
  console.log(`Trước reset: ${before} ContentItem`);

  const deleted = await prisma.contentItem.deleteMany({});
  console.log(`Đã xoá: ${deleted.count} row`);

  const after = await prisma.contentItem.count();
  console.log(`Sau reset: ${after} ContentItem (kỳ vọng 0)`);

  await prisma.$disconnect();
  console.log('\n✓ Done. Giờ chạy: npx tsx src/seed/runContentItems.ts');
}

main().catch((err) => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});
