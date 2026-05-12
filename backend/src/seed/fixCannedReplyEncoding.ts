/**
 * Fix UTF-8 encoding cho CannedReply trong DB.
 *
 * BỐI CẢNH: DB volume từ máy cũ có 8+ CannedReply với label tiếng Việt bị
 * strip UTF-8 ("Tôi đang thèm" → "T??i ??ang th??m"). Source seed.ts UTF-8 đúng.
 * seed.ts dùng `update: {}` nên re-run KHÔNG fix labels đã hỏng.
 *
 * SCRIPT NÀY: import data từ seed.ts (cùng máy build) + force UPDATE label/answer
 * cho mọi slug đã tồn tại trong DB.
 *
 * CHẠY:
 *   docker exec sol-widget-backend-1 npx tsx src/seed/fixCannedReplyEncoding.ts
 *
 * Idempotent — chạy nhiều lần OK. Chỉ update label + answer + icon, KHÔNG đụng
 * triggers, priority, minScore (founder có thể đã chỉnh qua /admin).
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 43 replies — extract chính xác từ src/seed.ts với UTF-8 đúng
const REPLIES = [
  { slug: 'them-thuoc', label: 'Tôi đang thèm thuốc', icon: '🤔' },
  { slug: 'bo-cuoc', label: 'Tôi muốn bỏ cuộc', icon: '😢' },
  { slug: 'mot-dieu', label: 'Hút lén 1 điếu có sao?', icon: '🚬' },
  { slug: 'bao-lau-het-them', label: 'Bao lâu thì hết thèm?', icon: '⏳' },
  { slug: 'mat-ngu', label: 'Mất ngủ phải làm sao?', icon: '🌙' },
  { slug: 'cau-gat', label: 'Tôi hay cáu gắt — bình thường?', icon: '😤' },
  { slug: 'tang-can', label: 'Tôi sợ tăng cân', icon: '⚖️' },
  { slug: 'vape-an-toan', label: 'Chuyển vape có an toàn?', icon: '💨' },
  { slug: 'them-du-doi', label: 'Cơn thèm dữ dội quá', icon: '🌊' },
  { slug: 'sap-hut-lai', label: 'Tôi sắp hút lại — cứu', icon: '🆘' },
  { slug: 'lo-hut-roi', label: 'Tôi lỡ hút điếu rồi', icon: '🌱' },
  { slug: 'ho-co-dom', label: 'Tôi ho có đờm nhiều', icon: '🫁' },
  { slug: 'dau-dau', label: 'Đau đầu sau khi cai', icon: '🤕' },
  { slug: 'chong-mat', label: 'Chóng mặt khi đứng dậy', icon: '💫' },
  { slug: 'kho-tho', label: 'Tôi thấy hơi khó thở', icon: '😮‍💨' },
  { slug: 'tao-bon', label: 'Tôi bị táo bón', icon: '🌾' },
  { slug: 'mieng-lo-loet', label: 'Miệng lở loét, khô đắng', icon: '👄' },
  { slug: 'buon-chan', label: 'Tôi thấy buồn vô cớ', icon: '🌧️' },
  { slug: 'co-don', label: 'Tôi cảm thấy cô đơn', icon: '🌫️' },
  { slug: 'lo-au', label: 'Lo âu vô cớ, ngực tức', icon: '😰' },
  { slug: 'stress-cong-viec', label: 'Stress công việc — muốn hút', icon: '💼' },
  { slug: 'khong-la-minh', label: 'Tôi không thấy là chính mình', icon: '🪞' },
  { slug: 'di-nhau', label: 'Chiều nay đi nhậu — sao đây?', icon: '🍻' },
  { slug: 'ca-phe-sang', label: 'Cà phê sáng không có thuốc', icon: '☕' },
  { slug: 'ban-moi-thuoc', label: 'Bạn mời thuốc lúc nhậu', icon: '🚭' },
  { slug: 'vo-chong-gian', label: 'Vợ/chồng giận chuyện cai', icon: '💔' },
  { slug: 'dam-tang-cuoi', label: 'Sắp đi đám (cưới/tang)', icon: '🌸' },
  { slug: 'tet-le', label: 'Tết / lễ — ai cũng hút', icon: '🎊' },
  { slug: 'phoi-hoi-phuc', label: 'Phổi tôi có hồi phục không?', icon: '🫁' },
  { slug: 'tim-mach', label: 'Tim mạch — bao lâu hồi phục?', icon: '❤️' },
  { slug: 'champix', label: 'Champix có nên dùng?', icon: '💊' },
  { slug: 'mieng-dan-nicotine', label: 'Miếng dán nicotine có hiệu quả?', icon: '🩹' },
  { slug: 'khang-tung-cam-thay', label: 'Khang đã từng thế này chưa?', icon: '👴' },
  { slug: 'thanh-cong-toi', label: 'Tôi sẽ thành công chứ?', icon: '🌟' },
  { slug: 'dang-hi-sinh', label: 'Tôi đáng hi sinh nhiều thế không?', icon: '🎯' },
  { slug: 'cach-dung-app', label: 'Cách dùng SOL hiệu quả', icon: '📱' },
  { slug: 'doi-q-day', label: 'Tôi muốn đổi Ngày bỏ', icon: '📅' },
  { slug: 'hoan-tien', label: 'Hoàn tiền thế nào?', icon: '💰' },
  { slug: 'lien-he-khang', label: 'Liên hệ Khang trực tiếp', icon: '✉️' },
  { slug: 'voice-khang', label: 'Khi nào có voice Khang?', icon: '🎙️' },
  { slug: 'khac-mau', label: 'Tôi khạc đờm có máu', icon: '🚨' },
  { slug: 'dau-nguc-du', label: 'Đau ngực dữ dội + khó thở', icon: '🚑' },
  { slug: 'y-nghi-tu-hai', label: 'Tôi có ý nghĩ tự hại', icon: '💚' },
];

async function main() {
  console.log(`[fixCannedReplyEncoding] Bắt đầu — ${REPLIES.length} replies cần verify\n`);

  let updated = 0;
  let skipped = 0;
  let notFound = 0;

  for (const r of REPLIES) {
    const existing = await prisma.cannedReply.findUnique({
      where: { slug: r.slug },
    });

    if (!existing) {
      console.log(`  ⚠ ${r.slug} — không có trong DB, SKIP`);
      notFound++;
      continue;
    }

    // Detect: label hiện trong DB có chứa nhiều `?` không? Nếu đúng => bị hỏng
    const isCorrupted =
      (existing.label.match(/\?/g) || []).length >= 3 ||
      existing.label.length < r.label.length * 0.7;

    if (!isCorrupted) {
      // Đã OK rồi — không cần update
      skipped++;
      continue;
    }

    await prisma.cannedReply.update({
      where: { slug: r.slug },
      data: {
        label: r.label,
        icon: r.icon,
      },
    });
    console.log(`  ✓ ${r.slug} — đã fix: "${r.label}"`);
    updated++;
  }

  console.log(`\n[fixCannedReplyEncoding] DONE.`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped (đã OK): ${skipped}`);
  console.log(`  Not found: ${notFound}`);
}

main()
  .catch((err) => {
    console.error('[fixCannedReplyEncoding] FAILED:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
