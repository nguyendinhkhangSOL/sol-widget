#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════
 *  Update content P1/P2/P3 — V2 COMPREHENSIVE
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  V2 fixes:
 *    - Catch ALL "bạn" → "anh" trong copy (whole-word regex)
 *    - P1/P2/P3 references trong body text (intro, why-section)
 *    - Schema "name" với case Việt
 *    - Coaching (P1) → Coaching (theo bước Khám phá)
 *
 *  Usage:
 *    node update-p1-p2-p3-content-v2.js
 * ═══════════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');

const INPUT_DIR = path.join(__dirname, 'current-html');
const OUTPUT_DIR = path.join(__dirname, 'current-html-updated');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ════════════════════════════════════════════════════════════════════════
// COMMON RULES — Áp dụng cho cả 3 files
// ════════════════════════════════════════════════════════════════════════
const COMMON = [
  // ───── Internal href ─────
  { from: 'href="/p1.html"', to: 'href="/kham-pha-ban-than/"' },
  { from: 'href="/p2.html"', to: 'href="/kiem-ke-nguon-luc/"' },
  { from: 'href="/p3.html"', to: 'href="/la-ban-huong-di/"' },
  { from: "location.href='/p1.html'", to: "location.href='/kham-pha-ban-than/'" },
  { from: "location.href='/p2.html'", to: "location.href='/kiem-ke-nguon-luc/'" },
  { from: "location.href='/p3.html'", to: "location.href='/la-ban-huong-di/'" },

  // ───── Top navigation ─────
  { from: '>P1 Khám phá<', to: '>Khám phá bản thân<' },
  { from: '>P2 Nguồn lực<', to: '>Kiểm kê nguồn lực<' },
  { from: '>P3 Kết quả<', to: '>La bàn hướng đi<' },

  // ───── Footer link labels ─────
  { from: '>P1 — DNA Test (20 câu)<', to: '>Khám phá bản thân (P1) — DNA Test 20 câu<' },
  { from: '>P2 — Bản đồ nguồn lực<', to: '>Kiểm kê nguồn lực (P2) — Bản đồ vốn-network-sức<' },
  { from: '>P3 — Kết quả 37 hướng<', to: '>La bàn hướng đi (P3) — Match top 5/37 hướng<' },

  // ───── Schema.org JSON-LD ─────
  { from: '"name": "P1 — DNA Test"', to: '"name": "Khám phá bản thân (P1)"' },
  { from: '"name": "P2 — Nguồn Lực"', to: '"name": "Kiểm kê nguồn lực (P2)"' },
  { from: '"name": "P3 — 37 Hướng Đi"', to: '"name": "La bàn hướng đi (P3)"' },

  // ───── Inline JS labels ─────
  { from: "lbl:'P1 — Khám phá bản thân'", to: "lbl:'Khám phá bản thân (P1)'" },
  { from: "lbl:'P2 — Khai báo nguồn lực'", to: "lbl:'Kiểm kê nguồn lực (P2)'" },
  { from: "Tiếp tục P2: Khai báo nguồn lực", to: "Tiếp tục: Kiểm kê nguồn lực" },
  { from: "Tiếp tục: Khai báo nguồn lực", to: "Tiếp tục: Kiểm kê nguồn lực" },

  // ───── Body P1/P2/P3 inline references ─────
  { from: 'Sửa P2', to: 'Sửa bước Kiểm kê' },
  { from: 'Làm lại P1', to: 'Làm lại Khám phá' },
  { from: 'Bắt đầu từ P1', to: 'Bắt đầu Khám phá bản thân' },

  // ───── Why-section explanation copy (P2 intro) ─────
  { from: 'Tại sao P2 quan trọng hơn P1?', to: 'Tại sao Kiểm kê nguồn lực quan trọng không kém Khám phá bản thân?' },
  { from: 'Nhiều người <strong>phù hợp với Coaching</strong> (P1) nhưng', to: 'Nhiều người <strong>phù hợp với Coaching</strong> (theo bước Khám phá bản thân) nhưng' },
  { from: 'P2 không hỏi bạn muốn gì — P2 hỏi bạn đang có gì', to: 'Bước này không hỏi anh muốn gì — mà hỏi anh đang có gì' },
  { from: 'P1 nói bạn <em>phù hợp</em> với điều gì — P2 nói điều đó có <em>khả thi</em>', to: 'Bước Khám phá nói anh <em>phù hợp</em> với điều gì — bước này nói điều đó có <em>khả thi</em>' },

  // ───── P2 transition to P3 ─────
  { from: '<h3>P1 + P2 → Tìm hướng đi</h3>', to: '<h3>Khám phá bản thân + Kiểm kê nguồn lực → La bàn hướng đi</h3>' },

  // ───── H1 voice "Bạn" → "Anh" ─────
  { from: '<h1>Bạn tạo ra giá trị <em>theo cách nào?</em></h1>', to: '<h1>Anh tạo ra giá trị <em>theo cách nào?</em></h1>' },
  { from: '<h1>Bạn đang có <em>gì</em> trong tay?</h1>', to: '<h1>Anh đang có <em>gì</em> trong tay?</h1>' },
  { from: '<h1>🎯 Hướng đi phù hợp với bạn</h1>', to: '<h1>🎯 Hướng đi phù hợp với anh</h1>' },
];

// ════════════════════════════════════════════════════════════════════════
// REGEX RULES — "Bạn"/"bạn" → "Anh"/"anh"
// ════════════════════════════════════════════════════════════════════════
const VOICE_RULES = [
  // Match "Bạn" (capitalized, beginning of sentence/label) → "Anh"
  { from: /\bBạn\b/g, to: 'Anh' },

  // Match standalone "bạn" → "anh" (lowercase, mid-sentence)
  // Won't match "bạn" inside hyphenated/joined words because \b
  { from: /\bbạn\b/g, to: 'anh' },
];

// ════════════════════════════════════════════════════════════════════════
// PER-FILE specific (title + meta)
// ════════════════════════════════════════════════════════════════════════
const FILE_SPECIFIC = {
  'p1.html': [
    { from: /<title>[^<]+<\/title>/, to: '<title>Khám phá bản thân (P1) — DNA Test 20 câu cho đàn ông Việt 40-65 · Đi Cùng Sol</title>' },
    { from: /<meta name="description" content="[^"]+"/, to: '<meta name="description" content="Khám phá bản thân (P1) — Bài DNA Test 20 câu cho đàn ông Việt 40-65 tìm hướng tái khởi nghiệp. Founder Khang Sol, 20+ năm CNTT. Miễn phí."' },
    { from: 'Tiếp tục: Khai báo nguồn lực →', to: 'Tiếp tục: Kiểm kê nguồn lực →' },
  ],

  'p2.html': [
    { from: /<title>[^<]+<\/title>/, to: '<title>Kiểm kê nguồn lực (P2) — Bản đồ Vốn · Time · Network · Sức 45+ · Đi Cùng Sol</title>' },
    { from: /<meta name="description" content="[^"]+"/, to: '<meta name="description" content="Kiểm kê nguồn lực (P2) — Đánh giá 8 trục anh đang có: kinh nghiệm, vốn, thời gian, công nghệ, network, sức khoẻ, gia đình, học hỏi. 5 phút có bản đồ rõ."' },
  ],

  'p3.html': [
    { from: /<title>[^<]+<\/title>/, to: '<title>La bàn hướng đi (P3) — Top 5/37 Hướng Tái Khởi Nghiệp 45+ · Đi Cùng Sol</title>' },
    { from: /<meta name="description" content="[^"]+"/, to: '<meta name="description" content="La bàn hướng đi (P3) — Hệ thống so khớp DNA + nguồn lực → 37 hướng tái khởi nghiệp xếp hạng % phù hợp với anh. Roadmap 30/90/180 ngày cụ thể."' },
  ],
};

// ════════════════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════════════════
function applyRule(content, rule) {
  if (typeof rule.from === 'string') {
    const matches = content.split(rule.from).length - 1;
    return { content: content.split(rule.from).join(rule.to), matches };
  } else {
    let matches = 0;
    const newContent = content.replace(rule.from, () => { matches++; return rule.to; });
    return { content: newContent, matches };
  }
}

// ════════════════════════════════════════════════════════════════════════
// Main
// ════════════════════════════════════════════════════════════════════════
const files = ['p1.html', 'p2.html', 'p3.html'];

console.log('═══════════════════════════════════════════════════════════════════');
console.log('  Update content P1/P2/P3 — V2 COMPREHENSIVE');
console.log('═══════════════════════════════════════════════════════════════════\n');

for (const fname of files) {
  const inputPath = path.join(INPUT_DIR, fname);
  const outputPath = path.join(OUTPUT_DIR, fname);

  if (!fs.existsSync(inputPath)) {
    console.log(`⚠️  Skip ${fname} — not found at ${inputPath}`);
    continue;
  }

  let content = fs.readFileSync(inputPath, 'utf8');
  let stats = { common: 0, voice: 0, specific: 0 };

  // Apply common
  for (const rule of COMMON) {
    const { content: newContent, matches } = applyRule(content, rule);
    content = newContent;
    stats.common += matches;
  }

  // Apply voice (regex)
  for (const rule of VOICE_RULES) {
    const { content: newContent, matches } = applyRule(content, rule);
    content = newContent;
    stats.voice += matches;
  }

  // Apply file-specific
  const specific = FILE_SPECIFIC[fname] || [];
  for (const rule of specific) {
    const { content: newContent, matches } = applyRule(content, rule);
    content = newContent;
    stats.specific += matches;
  }

  fs.writeFileSync(outputPath, content, 'utf8');

  console.log(`✅ ${fname}`);
  console.log(`   - Common rules:  ${stats.common} replacements`);
  console.log(`   - Voice rules:   ${stats.voice} replacements (Bạn/bạn → Anh/anh)`);
  console.log(`   - File-specific: ${stats.specific} replacements`);
  console.log('');
}

// Verify no remaining patterns
console.log('═══════════════════════════════════════════════════════════════════');
console.log('  VERIFY remaining patterns');
console.log('═══════════════════════════════════════════════════════════════════');

for (const fname of files) {
  const outputPath = path.join(OUTPUT_DIR, fname);
  const content = fs.readFileSync(outputPath, 'utf8');

  const checks = [
    { name: 'P1 Khám phá (nav)', pattern: /P1 Khám phá/ },
    { name: '/p1.html href', pattern: /href="\/p1\.html"/ },
    { name: '"bạn" tiếng việt', pattern: /\bbạn\b/ },
    { name: '"Bạn" tiếng việt', pattern: /\bBạn\b/ },
    { name: 'P2 trong body text', pattern: /<[^>]*>P2 /i },
  ];

  console.log(`\n${fname}:`);
  for (const { name, pattern } of checks) {
    const remaining = (content.match(new RegExp(pattern.source, 'g')) || []).length;
    const status = remaining === 0 ? '✅' : `⚠️  ${remaining} chỗ còn lại`;
    console.log(`  ${status} ${name}`);
  }
}

console.log('\n═══════════════════════════════════════════════════════════════════');
console.log('  ✅ HOÀN TẤT — Files tại:');
console.log(`     ${OUTPUT_DIR}`);
console.log('═══════════════════════════════════════════════════════════════════');
