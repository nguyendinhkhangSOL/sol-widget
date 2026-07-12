/**
 * Bulk generate 90-day roadmaps for 36 remaining directions using Claude API.
 *
 * Prerequisites:
 *   1. Chạy từ /var/www/huongdi/backend/ (đã có Prisma + @anthropic-ai/sdk installed)
 *   2. ANTHROPIC_API_KEY trong .env
 *   3. File sample: /tmp/sample-roadmap-freelancer.json
 *
 * Usage:
 *   node scripts/generate-roadmaps.js [--test <slug>] [--only <slug1,slug2>] [--dry-run]
 *
 * Flags:
 *   --test <slug>   Generate only 1 direction by slug (for testing)
 *   --only <list>   Generate only specific slugs (comma-separated)
 *   --dry-run       Show what would be generated, don't actually call API
 *
 * Output: JSON files in /tmp/roadmaps-generated/
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');
const { PrismaClient } = require('@prisma/client');

// ─── Config ────────────────────────────────
const SAMPLE_FILE = '/tmp/sample-roadmap-freelancer.json';
const OUTPUT_DIR = '/tmp/roadmaps-generated';
const SKIP_DIRECTION_ID = '214e7b23-a38a-4d6a-8c81-91bd3297d1a8'; // Freelancer Chuyên Môn (already done manually)
const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 16000;
const DELAY_BETWEEN_CALLS_MS = 2000; // 2s to avoid rate limits
const MAX_RETRIES = 2;

// ─── Parse CLI args ────────────────────────
const args = process.argv.slice(2);
const testSlug = args.includes('--test') ? args[args.indexOf('--test') + 1] : null;
const onlySlugs = args.includes('--only')
  ? args[args.indexOf('--only') + 1].split(',').map(s => s.trim())
  : null;
const dryRun = args.includes('--dry-run');

// ─── Setup clients ─────────────────────────
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY not found in .env');
  process.exit(1);
}
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const prisma = new PrismaClient();

// ─── Prompt template ───────────────────────
function buildPrompt(direction, sampleRoadmap) {
  const barriers = direction.barriers ? JSON.stringify(direction.barriers, null, 2) : '(chưa có)';

  return `Bạn là chuyên gia coach nghề nghiệp cho người Việt Nam 40-60 tuổi. Nhiệm vụ: viết roadmap 90 ngày CHI TIẾT cho mô hình kinh doanh sau, theo format JSON identical với sample.

═══ MÔ HÌNH ═══
Tên: ${direction.name}
Slug: ${direction.slug}
Tagline: ${direction.tagline || '(N/A)'}

Description:
${direction.description || '(N/A)'}

Vì sao phù hợp 40-60:
${direction.why_fit || '(N/A)'}

Rào cản đặc thù:
${barriers}

DNA fit scores (0-100):
- People (thích tiếp xúc): ${direction.vp_people}
- Expert (chuyên môn sâu): ${direction.vp_expert}
- Builder (thích tự xây): ${direction.vp_builder}
- Independent (tự chủ): ${direction.vp_independent}

Resource requirements (0-100, cao = cần nhiều):
- Capital (vốn): ${direction.vr_capital}
- Time (thời gian): ${direction.vr_time}
- Tech (công nghệ): ${direction.vr_tech}
- Network (quan hệ): ${direction.vr_network}
- Risk (rủi ro): ${direction.vr_risk}
- Energy (năng lượng): ${direction.vr_energy}

═══ SAMPLE REFERENCE (Freelancer Chuyên Môn) ═══
${JSON.stringify(sampleRoadmap, null, 2)}

═══ YÊU CẦU OUTPUT ═══
Trả về CHỈ JSON hợp lệ (không markdown wrapping, không giải thích). Schema y hệt sample:

1. version: "1.0"
2. direction_id: "${direction.id}"
3. direction_name: "${direction.name}"
4. total_weeks: 12
5. total_actions: khoảng 40-50 (tổng actions trong 12 tuần)
6. phases: 3 giai đoạn [Định vị (T1-4), Momentum (T5-8), Khách #1 (T9-12)] — MỖI phase có "goal" cụ thể cho mô hình này
7. weeks: 12 tuần, mỗi tuần có 3-5 actions:
   - id: "wX-aY" format
   - title: hành động cụ thể, imperative (không "bạn nên..." mà "Làm...")
   - type: reflection | research | output | outreach | learn
   - time_min: 30-180 phút (thực tế)
   - tools: array công cụ cụ thể (VD ["Canva", "LinkedIn"])
   - output: kết quả cụ thể có thể verify được (VD "1 URL portfolio live", "3 case studies 400-500 chữ")
8. metadata: target_income_end_90d, target_pipeline_end_90d, prerequisites (3-5 items), common_failures (3-5 items), success_indicators (3 milestones tuần 4, 8, 12)

═══ QUY TẮC CHẤT LƯỢNG ═══

- Ngôn ngữ tiếng Việt, dùng "bạn/anh/chị" — chuẩn hoá 1 kiểu xuyên suốt
- Tools phải cụ thể: tên platform/app thực (Notion, Canva, Fastwork.vn, Sepay, ...)
- Actions phải phù hợp thực tế Việt Nam (VD MST cá nhân, thuế khoán, Zalo, VietQR)
- Output phải MEASURABLE (verify được, có số/URL/document cụ thể)
- Considering DNA scores: nếu mô hình có vp_people cao → nhiều outreach actions. Nếu vp_expert cao → nhiều content thought leadership actions
- Considering resources: nếu vr_capital cao → phase 1 phải có action về capital planning. Nếu vr_tech cao → phase 1 học tech
- Time realistic: total hours 12 tuần ≤ 120h (10h/tuần average)
- Phase 3 (Khách #1) phải kết thúc bằng: đóng deal đầu + retention plan

TRẢ VỀ CHỈ JSON.`;
}

// ─── Main generation function ─────────────
async function generateForDirection(direction, sampleRoadmap, retries = 0) {
  const prompt = buildPrompt(direction, sampleRoadmap);

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].text.trim();

    // Try to extract JSON (handle case where response wraps in markdown)
    let jsonStr = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
    if (jsonMatch) jsonStr = jsonMatch[1];

    // Parse & validate
    const json = JSON.parse(jsonStr);

    // Sanity checks
    if (!json.weeks || json.weeks.length !== 12) {
      throw new Error(`Invalid: expected 12 weeks, got ${json.weeks?.length}`);
    }
    if (!json.phases || json.phases.length !== 3) {
      throw new Error(`Invalid: expected 3 phases, got ${json.phases?.length}`);
    }
    if (!json.metadata) {
      throw new Error('Missing metadata');
    }

    // Force correct IDs (in case AI hallucinates)
    json.direction_id = direction.id;
    json.direction_name = direction.name;

    return {
      ok: true,
      json,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      },
    };
  } catch (e) {
    if (retries < MAX_RETRIES) {
      console.log(`   ⚠  Retry ${retries + 1}/${MAX_RETRIES}: ${e.message}`);
      await sleep(3000);
      return generateForDirection(direction, sampleRoadmap, retries + 1);
    }
    return { ok: false, error: e.message };
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ─── Main flow ────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  Bulk Generate Roadmaps — 36 Directions       ');
  console.log('═══════════════════════════════════════════════');
  console.log('');

  // Load sample
  if (!fs.existsSync(SAMPLE_FILE)) {
    console.error(`❌ Sample file not found: ${SAMPLE_FILE}`);
    console.error('   Please copy sample-roadmap-freelancer-chuyen-mon.json to /tmp/');
    process.exit(1);
  }
  const sampleRoadmap = JSON.parse(fs.readFileSync(SAMPLE_FILE, 'utf-8'));
  console.log(`✓ Sample loaded: ${sampleRoadmap.direction_name} (${sampleRoadmap.total_actions} actions)`);

  // Fetch directions
  let where = { id: { not: SKIP_DIRECTION_ID } };
  if (testSlug) {
    where = { slug: testSlug };
  } else if (onlySlugs) {
    where = { slug: { in: onlySlugs } };
  }

  const directions = await prisma.direction.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
  });

  console.log(`✓ Fetched ${directions.length} direction(s) to process`);
  console.log('');

  if (dryRun) {
    console.log('DRY RUN — Would generate for:');
    directions.forEach((d, i) => console.log(`  ${i + 1}. ${d.name} (${d.slug})`));
    await prisma.$disconnect();
    return;
  }

  // Ensure output dir
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Process each direction
  let successCount = 0;
  let failCount = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  for (const [i, direction] of directions.entries()) {
    const outputFile = path.join(OUTPUT_DIR, `roadmap-${direction.slug}.json`);

    // Skip if already exists (idempotent)
    if (fs.existsSync(outputFile)) {
      console.log(`[${i + 1}/${directions.length}] SKIP (exists): ${direction.name}`);
      continue;
    }

    process.stdout.write(`[${i + 1}/${directions.length}] ${direction.name}... `);
    const startTime = Date.now();
    const result = await generateForDirection(direction, sampleRoadmap);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    if (result.ok) {
      fs.writeFileSync(outputFile, JSON.stringify(result.json, null, 2));
      totalInputTokens += result.usage.input_tokens;
      totalOutputTokens += result.usage.output_tokens;
      console.log(`✓ ${duration}s (${result.usage.input_tokens}i/${result.usage.output_tokens}o tokens, ${result.json.total_actions} actions)`);
      successCount++;
    } else {
      console.log(`✗ FAILED: ${result.error}`);
      failCount++;
    }

    if (i < directions.length - 1) await sleep(DELAY_BETWEEN_CALLS_MS);
  }

  await prisma.$disconnect();

  // Summary
  const inputCost = (totalInputTokens / 1_000_000) * 3;
  const outputCost = (totalOutputTokens / 1_000_000) * 15;
  const totalCost = inputCost + outputCost;

  console.log('');
  console.log('═══════════════════════════════════════════════');
  console.log(`✅ Complete — ${successCount} success, ${failCount} failed`);
  console.log(`📊 Tokens: ${totalInputTokens} input + ${totalOutputTokens} output`);
  console.log(`💰 Estimated cost: $${totalCost.toFixed(2)} (${inputCost.toFixed(2)} + ${outputCost.toFixed(2)})`);
  console.log(`📁 Output: ${OUTPUT_DIR}`);
  console.log('═══════════════════════════════════════════════');
  console.log('');
  console.log('Next: Review 1-2 generated files, then run import script.');
}

main().catch(e => {
  console.error('Fatal error:', e);
  prisma.$disconnect();
  process.exit(1);
});
