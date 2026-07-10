// ═══════════════════════════════════════════════════════════════
// SEED 36 direction + 3 case study vào Prisma DB
// Run: npx ts-node backend/seed/seed-directions.ts
// Idempotent: safe chạy nhiều lần (upsert)
// ═══════════════════════════════════════════════════════════════

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// ─── STEP 1: Load extracted directions ───────────────────────
const directionsPath = path.join(__dirname, 'directions-extracted.json');
if (!fs.existsSync(directionsPath)) {
  console.error(`❌ ${directionsPath} không tồn tại`);
  console.error(`   Chạy trước: npx ts-node backend/seed/extract-from-buoc3.ts`);
  process.exit(1);
}

const directions = JSON.parse(fs.readFileSync(directionsPath, 'utf-8'));

// ─── STEP 2: Case studies metadata ───────────────────────────
const CASE_STUDIES = [
  {
    id: '01',
    directionId: 'freelancer-ke-toan', // OR chọn 'tu-van-kinh-doanh' nếu match hơn
    personaName: 'Anh Đức 48 tuổi — Fractional CFO F&B',
    personaAge: 48,
    personaBg: 'Cựu Giám đốc Tài chính ngân hàng 22 năm. Chuyển sang làm Fractional CFO cho chuỗi F&B 5-15 chi nhánh.',
    tier: 'REAL_ANON',
    personaRevenue: '75 triệu/tháng',
    personaTimeToWin: '12 tháng',
    contentHtmlFile: 'case-studies/01-fractional-cfo-anh-duc.html',
    wordCount: 2500,
    contentSummary: 'Anh Đức 48 tuổi cựu Giám đốc Tài chính chuyển sang làm Fractional CFO cho F&B chuỗi. Sau 12 tháng đạt 75 triệu/tháng qua 3 khách × 25 triệu.',
  },
  {
    id: '02',
    directionId: 'coaching-ca-nhan',
    personaName: 'Anh Thắng 46 tuổi — Career Coach ICF ACC',
    personaAge: 46,
    personaBg: 'Cựu HR Director. Đăng ký chứng chỉ ICF ACC. Pilot cohort 5 khách miễn phí → paid clients.',
    tier: 'REAL_ANON',
    personaRevenue: '30-45 triệu/tháng',
    personaTimeToWin: '10 tháng',
    contentHtmlFile: 'case-studies/02-career-coach-anh-thang.html',
    wordCount: 2600,
    contentSummary: 'Anh Thắng 46 tuổi cựu HR Director đạt chứng chỉ ICF ACC, pilot 5 khách miễn phí, chuyển sang paid coaching 30-45 triệu/tháng sau 10 tháng.',
  },
  {
    id: '03',
    directionId: 'youtube-podcast', // Chị Lan có LinkedIn + Newsletter → content creator
    personaName: 'Chị Lan 44 tuổi — Chuyên gia chia sẻ',
    personaAge: 44,
    personaBg: 'Cựu Marketing Director. Xây LinkedIn 25k followers + Newsletter 5k subscribers.',
    tier: 'REAL_ANON',
    personaRevenue: '30 triệu/tháng',
    personaTimeToWin: '9 tháng',
    contentHtmlFile: 'case-studies/03-content-creator-chi-lan.html',
    wordCount: 2800,
    contentSummary: 'Chị Lan 44 tuổi cựu Marketing Director xây LinkedIn 25k + Newsletter 5k subscribers, đạt 30 triệu/tháng qua Brand deal + Tư vấn + Sản phẩm số sau 9 tháng.',
  },
];

/**
 * Read HTML content file if exists (fallback empty)
 */
function readHtmlFile(relPath: string): string {
  // Adjust path — assumes seed script runs from /var/www/huongdi/backend/
  const paths = [
    path.join(__dirname, '../../../../', relPath),
    path.join(__dirname, '../../../', relPath),
    path.join(__dirname, '../../', relPath),
    path.join('/var/www/huongdi/public/', relPath),
  ];

  for (const p of paths) {
    if (fs.existsSync(p)) {
      return fs.readFileSync(p, 'utf-8');
    }
  }

  console.warn(`⚠️  HTML file not found: ${relPath} (will seed empty content)`);
  return '';
}

// ═══════════════════════════════════════════════════════════════
// MAIN SEED
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log('🌱 Sol La Bàn — Seed 36 direction + 3 case study\n');

  // ─── DIRECTIONS ───────────────────────────────────────────
  let directionsUpserted = 0;
  let directionsSkipped = 0;

  for (const d of directions) {
    try {
      // Check if exists first for logging
      const existing = await prisma.direction.findUnique({ where: { id: d.id } });

      const result = await prisma.direction.upsert({
        where: { id: d.id },
        update: {
          // Chỉ update các field CƠ BẢN (KHÔNG override admin đã edit)
          // Nếu direction đã có → không seed lại toàn bộ
          // Nếu muốn force reseed: xoá row trước
          slug: d.slug,
          title: d.title,
          emoji: d.emoji,
          category: d.category,
          categoryLabel: d.categoryLabel,
          isNew: d.isNew,
        },
        create: {
          ...d,
          publishedAt: d.publishedAt ? new Date(d.publishedAt) : null,
        },
      });

      if (existing) {
        console.log(`  ⏭  Skip existing: ${d.id}`);
        directionsSkipped++;
      } else {
        console.log(`  ✅ Created: ${d.id}`);
        directionsUpserted++;
      }
    } catch (err: any) {
      console.error(`  ❌ Failed: ${d.id} — ${err.message}`);
    }
  }

  console.log(`\n📊 Directions: ${directionsUpserted} created, ${directionsSkipped} preserved (existing)\n`);

  // ─── CASE STUDIES ─────────────────────────────────────────
  let caseStudiesUpserted = 0;
  let caseStudiesSkipped = 0;

  for (const cs of CASE_STUDIES) {
    try {
      const existing = await prisma.caseStudy.findUnique({ where: { id: cs.id } });

      const contentHtml = readHtmlFile(cs.contentHtmlFile);

      const result = await prisma.caseStudy.upsert({
        where: { id: cs.id },
        update: {
          personaName: cs.personaName,
          personaAge: cs.personaAge,
          personaBg: cs.personaBg,
          tier: cs.tier as any,
          personaRevenue: cs.personaRevenue,
          personaTimeToWin: cs.personaTimeToWin,
          wordCount: cs.wordCount,
          contentSummary: cs.contentSummary,
          // KHÔNG override contentHtml nếu đã có (admin edit)
        },
        create: {
          id: cs.id,
          directionId: cs.directionId,
          personaName: cs.personaName,
          personaAge: cs.personaAge,
          personaBg: cs.personaBg,
          tier: cs.tier as any,
          personaRevenue: cs.personaRevenue,
          personaTimeToWin: cs.personaTimeToWin,
          contentHtml,
          contentSummary: cs.contentSummary,
          wordCount: cs.wordCount,
          status: 'PUBLISHED',
          publishedAt: new Date(),
          authorId: 'khang-sol',
        },
      });

      // Update direction.caseStudyIds
      const direction = await prisma.direction.findUnique({
        where: { id: cs.directionId },
      });
      if (direction) {
        const csIds = direction.caseStudyIds || [];
        if (!csIds.includes(cs.id)) {
          await prisma.direction.update({
            where: { id: cs.directionId },
            data: { caseStudyIds: [...csIds, cs.id] },
          });
        }
      }

      if (existing) {
        console.log(`  ⏭  Case Study skip: ${cs.id} — ${cs.personaName}`);
        caseStudiesSkipped++;
      } else {
        console.log(`  ✅ Case Study created: ${cs.id} — ${cs.personaName}`);
        caseStudiesUpserted++;
      }
    } catch (err: any) {
      console.error(`  ❌ Case Study failed: ${cs.id} — ${err.message}`);
    }
  }

  console.log(`\n📊 Case Studies: ${caseStudiesUpserted} created, ${caseStudiesSkipped} preserved\n`);

  // ─── VERIFY ───────────────────────────────────────────────
  const totalDirs = await prisma.direction.count();
  const totalCases = await prisma.caseStudy.count();

  console.log(`✅ FINAL: DB có ${totalDirs} direction, ${totalCases} case study\n`);

  if (totalDirs < 36) {
    console.warn(`⚠️  Chỉ có ${totalDirs}/36 direction — có thể parser fail 1 số record`);
  }
}

main()
  .catch((e) => {
    console.error('🚨 Seed FAILED:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
