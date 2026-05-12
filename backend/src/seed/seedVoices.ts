/**
 * Seed 5 voice Khang MVP — placeholder audio files.
 *
 * Run: npx tsx src/seed/seedVoices.ts
 *
 * Sau khi Khang record MP3 thật, replace file trong dashboard/public/audio/
 * Cùng filename — không cần update DB.
 */

import { prisma } from '../db';

const PUBLIC_AUDIO_BASE =
  process.env.PUBLIC_AUDIO_BASE || 'https://bothuocla.sol.vn/audio';

const VOICES = [
  {
    title: 'Anh không yếu — đây là não 25 năm',
    description:
      'Khang welcome anh em mới vào Sol. 60 giây đầu — Khang nói: "Anh không yếu. Não anh đã wire 30 năm với điếu thuốc. Đây là cơ chế, không phải nhân cách."',
    filename: 'khang-day-0-welcome.mp3',
    durationSec: 60,
    topic: 'psychoeducation',
    minTier: 'FREE' as const,
    autoPlayTrigger: 'onboard',
    pinnedAt: new Date(),
  },
  {
    title: 'Một điếu không phải thất bại',
    description:
      'Voice quan trọng nhất khi anh hút lại. Khang nói: "Một điếu không phải fail. Anh ổn. Tôi vẫn ở đây. Mai sáng mở app lại nhé."',
    filename: 'khang-lapse-friendly.mp3',
    durationSec: 90,
    topic: 'lapse',
    minTier: 'FREE' as const,
    autoPlayTrigger: 'lapse',
    pinnedAt: new Date(),
  },
  {
    title: 'Anh đợi tôi 90 giây',
    description:
      'Khi anh đang thèm — bấm Crisis Timer. Khang ngồi cùng anh 90 giây. "Anh không cần bỏ. Chỉ đợi 90 giây."',
    filename: 'khang-crisis-90s.mp3',
    durationSec: 90,
    topic: 'general',
    minTier: 'KHOI_DONG' as const,
    autoPlayTrigger: 'crisis_90s',
  },
  {
    title: 'Anh đã thấy mình rồi',
    description:
      'Voice Day 7 sau khi báo cáo Quan Sát. Khang nói: "Anh đã thấy mình rồi. Tao thấy. 7 ngày anh đã làm điều mà 30 năm anh chưa làm."',
    filename: 'khang-day-7-report.mp3',
    durationSec: 180,
    topic: 'milestone',
    minTier: 'FREE' as const,
    autoPlayTrigger: null,
  },
  {
    title: '14 ngày — anh đã giảm',
    description:
      'Voice Day 14 milestone Sol Start. Khang celebrate kết quả thực + nhắc anh không ép.',
    filename: 'khang-day-14-milestone.mp3',
    durationSec: 300,
    topic: 'milestone',
    minTier: 'KHOI_DONG' as const,
    autoPlayTrigger: null,
  },
];

async function seed() {
  console.log('Seeding 5 Khang voice MVP...');

  for (const v of VOICES) {
    const existing = await prisma.khangVoice.findFirst({
      where: { title: v.title },
    });
    if (existing) {
      console.log(`  ⏭  Skip "${v.title}" (already exists)`);
      continue;
    }

    await prisma.khangVoice.create({
      data: {
        title: v.title,
        description: v.description,
        audioUrl: `${PUBLIC_AUDIO_BASE}/${v.filename}`,
        durationSec: v.durationSec,
        topic: v.topic,
        minTier: v.minTier,
        autoPlayTrigger: v.autoPlayTrigger,
        pinnedAt: v.pinnedAt,
        status: 'PUBLISHED',
        isQuestionReply: false,
        internalNotes: 'Seed MVP — placeholder audio. Khang record thật sau.',
      },
    });
    console.log(`  ✅ Created "${v.title}"`);
  }

  console.log('Seed voices done.');
}

seed()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
