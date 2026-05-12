/**
 * Seed Khoảng Lặng — confession placeholders để pilot có content đọc.
 *
 * Run: npx tsx src/seed/seedConfessions.ts
 *
 * Lưu ý: Cần ít nhất 1 user trong DB để gán authorId. Tạo system user hoặc dùng
 * user ID đầu tiên.
 */

import { prisma } from '../db';

const SEED_CONFESSIONS = [
  {
    content:
      'Tôi hút lại sau 11 ngày. Nhưng sáng nay tôi mở Sol lại. Có lẽ thế là đủ rồi.',
    autoTag: 'lapse',
    daysAgo: 2,
  },
  {
    content:
      'Đêm qua 23h tôi crave kinh khủng. Mở voice Khang. Đợi 90 giây. Không hút. Sáng nay vẫn còn cảm giác ấy. Lần đầu sau 25 năm tôi quyết được điều gì đó về mình.',
    autoTag: 'trigger',
    daysAgo: 3,
  },
  {
    content:
      'Vợ tôi không tin tôi nữa. 4 lần fail rồi. Lần này tôi không nói gì với cô ấy. Chỉ mở Sol thôi. Có lẽ ít kỳ vọng mới làm được.',
    autoTag: 'family',
    daysAgo: 7,
  },
  {
    content:
      'Hôm nay tôi sạch ngày thứ 30. Vợ ôm tôi tối qua — lần đầu sau 5 năm. Tôi 47 tuổi, hút 30 năm, fail 4 lần. Cảm ơn ai đó đang đọc. Có thể được.',
    autoTag: 'milestone',
    daysAgo: 5,
  },
  {
    content:
      'Đám tang chú tôi đêm qua. Toàn người hút. Tôi hút 7 điếu. Sáng nay tôi sợ không dám mở app. Nhưng app push một dòng nhẹ "hôm qua khó". Tôi mở. Khang nói "không phải fail". Tôi khóc.',
    autoTag: 'lapse',
    daysAgo: 10,
  },
  {
    content:
      'Tôi 52 tuổi. Bố tôi mất vì ung thư phổi năm tôi 30. Tôi vẫn hút. Hôm nay con gái tôi 18 tuổi sắp đi đại học xa nhà. Tôi muốn cô ấy nhớ tôi không phải mùi thuốc.',
    autoTag: 'family',
    daysAgo: 14,
  },
  {
    content:
      'Đi nhậu tuần này lần đầu sau Q-Day Day 35. Anh em mời thuốc. Tôi nói "đang cai". Một thằng cười. Tôi không hút. Lần đầu tôi không quan tâm bị cười.',
    autoTag: 'trigger',
    daysAgo: 6,
  },
  {
    content:
      'Stress công việc ác liệt tuần này. Ngày nào cũng muốn quay lại. Mở Sol mỗi tối nghe Khang. Không hút điếu nào. Tôi không tin được chính mình.',
    autoTag: 'milestone',
    daysAgo: 4,
  },
  {
    content:
      'Tôi 45 tuổi, bị huyết áp cao. Bác sĩ nói nếu hút tiếp thì 5 năm nữa stroke. Tôi vẫn hút thêm 3 năm sau câu nói đó. Hôm nay Day 8 sạch. Đi khám lại tuần sau.',
    autoTag: 'milestone',
    daysAgo: 8,
  },
  {
    content:
      'Q-Day của tôi tuần sau. Đêm nay tôi run. Mở Sol đọc Khoảng Lặng. Đọc bài của anh Day 30 — cảm ơn anh đã viết. Tôi sẽ thử.',
    autoTag: 'milestone',
    daysAgo: 1,
  },
];

async function seed() {
  console.log('Seeding Khoảng Lặng confessions...');

  // Get or create system user (anonymous author for seed)
  let systemUser = await prisma.user.findFirst({
    where: { name: 'SOL_SYSTEM' },
  });

  if (!systemUser) {
    systemUser = await prisma.user.create({
      data: {
        deviceUid: 'sol-system-seed',
        name: 'SOL_SYSTEM',
        pronouns: 'Sol',
        isAnonymous: true,
      },
    });
    console.log('  ⚙  Created system user');
  }

  for (const c of SEED_CONFESSIONS) {
    const existing = await prisma.confession.findFirst({
      where: { content: c.content },
    });
    if (existing) {
      console.log(`  ⏭  Skip "${c.content.slice(0, 50)}..."`);
      continue;
    }

    const createdAt = new Date(Date.now() - c.daysAgo * 24 * 60 * 60 * 1000);

    await prisma.confession.create({
      data: {
        authorId: systemUser.id,
        content: c.content,
        autoTag: c.autoTag,
        status: 'PUBLISHED',
        // Initial random read counts (simulate organic engagement)
        readCount: Math.floor(Math.random() * 300) + 50,
        reactCount: Math.floor(Math.random() * 100) + 10,
        createdAt,
        updatedAt: createdAt,
      },
    });
    console.log(`  ✅ Created "${c.content.slice(0, 50)}..."`);
  }

  console.log('Seed confessions done.');
}

seed()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
