/**
 * Dump nội dung 3 ZNS template Phase 5 ra console để copy-paste lên Zalo Manager.
 *
 * Run: node dump-zns-templates.cjs
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const templates = await prisma.zaloTemplate.findMany({
    where: {
      code: { in: ['SOL_DAILY_CHIP', 'SOL_SOS_CRISIS', 'SOL_MILESTONE_GENERIC'] },
    },
    orderBy: { code: 'asc' },
  });

  if (templates.length === 0) {
    console.log('Không tìm thấy template nào — kiểm tra seed_phase5_journey_templates.sql đã chạy chưa?');
    await prisma.$disconnect();
    return;
  }

  for (const t of templates) {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════════════');
    console.log('  ' + t.code);
    console.log('═══════════════════════════════════════════════════════════════════════');
    console.log('');
    console.log('Tên trong Zalo Manager:');
    console.log('  ' + t.zaloManagerName);
    console.log('');
    console.log('Tag: ' + t.tag + ' (' + (t.tag === '2' ? 'Customer Care' : t.tag === '1' ? 'Transactional' : 'Promotion') + ')');
    console.log('Tổng ký tự: ' + t.charCount);
    console.log('Trạng thái hiện tại: ' + t.status);
    console.log('');
    console.log('─── TIÊU ĐỀ (title) ─────────────────────────────────────');
    console.log(t.title);
    console.log('');
    console.log('─── NỘI DUNG (body) ─────────────────────────────────────');
    console.log(t.body);
    console.log('');
    console.log('─── PARAMS (tham số động) ───────────────────────────────');
    console.log('  ' + t.params.join(', '));
    console.log('');
    console.log('─── CTA BUTTONS ─────────────────────────────────────────');
    const buttons = Array.isArray(t.ctaButtons) ? t.ctaButtons : [];
    buttons.forEach((b, i) => {
      console.log('  Button ' + (i + 1) + ':');
      console.log('    Label: ' + b.label);
      console.log('    Type:  ' + b.type);
      console.log('    Value: ' + b.value);
    });
    console.log('');
  }

  console.log('');
  console.log('───────────────────────────────────────────────────────────────────────');
  console.log('  HƯỚNG DẪN SUBMIT');
  console.log('───────────────────────────────────────────────────────────────────────');
  console.log('');
  console.log('  1. Đăng nhập https://oa.zalo.me');
  console.log('  2. Quản lý OA → Tin nhắn ZNS → Quản lý mẫu tin');
  console.log('  3. Nút "Tạo mẫu tin mới" → chọn Tag "Customer Care"');
  console.log('  4. Paste Tiêu đề + Nội dung + Buttons từ trên');
  console.log('  5. Submit → đợi 3-5 ngày làm việc');
  console.log('  6. Khi APPROVED, copy "ID mẫu tin" (18 số) — cập nhật DB:');
  console.log('');
  console.log('     node update-template-id.cjs SOL_DAILY_CHIP <ID_TỪ_ZALO>');
  console.log('');

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Error:', err);
  await prisma.$disconnect();
  process.exit(1);
});
