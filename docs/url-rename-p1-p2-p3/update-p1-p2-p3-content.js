#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════
 *  Update content 3 HTML files (P1/P2/P3) — User-friendly Vietnamese
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  Replacement strategy: 2-layer naming
 *    - Display name lớn ở UI (Khám phá bản thân / Kiểm kê nguồn lực / La bàn hướng đi)
 *    - (P1)/(P2)/(P3) subtitle nhỏ — brand mark (như SWOT/OKR)
 *    - Voice "bạn" → "anh" trong copy chính
 *    - Internal links /p1.html → /kham-pha-ban-than/
 *
 *  Usage:
 *    cd C:\BOTHUOCLA\sol-widget\docs\url-rename-p1-p2-p3
 *    node update-p1-p2-p3-content.js
 *    # Output: current-html-updated/{p1,p2,p3}.html
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
// REPLACEMENT RULES — Áp dụng cho cả 3 files
// ════════════════════════════════════════════════════════════════════════
const COMMON_REPLACEMENTS = [
  // ── Internal href links ─────────────────────────────────────────────
  { from: 'href="/p1.html"', to: 'href="/kham-pha-ban-than/"' },
  { from: 'href="/p2.html"', to: 'href="/kiem-ke-nguon-luc/"' },
  { from: 'href="/p3.html"', to: 'href="/la-ban-huong-di/"' },
  { from: "location.href='/p1.html'", to: "location.href='/kham-pha-ban-than/'" },
  { from: "location.href='/p2.html'", to: "location.href='/kiem-ke-nguon-luc/'" },
  { from: "location.href='/p3.html'", to: "location.href='/la-ban-huong-di/'" },

  // ── Top navigation (sub-nav huongdi) ────────────────────────────────
  { from: '>P1 Khám phá<', to: '>Khám phá bản thân<' },
  { from: '>P2 Nguồn lực<', to: '>Kiểm kê nguồn lực<' },
  { from: '>P3 Kết quả<', to: '>La bàn hướng đi<' },

  // ── Footer link labels (master footer) ──────────────────────────────
  { from: '>P1 — DNA Test (20 câu)<', to: '>Khám phá bản thân (P1) — DNA Test 20 câu<' },
  { from: '>P2 — Bản đồ nguồn lực<', to: '>Kiểm kê nguồn lực (P2) — Bản đồ vốn-network-sức<' },
  { from: '>P3 — Kết quả 37 hướng<', to: '>La bàn hướng đi (P3) — Match top 5/37 hướng<' },

  // ── Schema.org JSON-LD "name" field ─────────────────────────────────
  { from: '"name": "P1 — DNA Test"', to: '"name": "Khám phá bản thân (P1)"' },
  { from: '"name": "P2 — Nguồn Lực"', to: '"name": "Kiểm kê nguồn lực (P2)"' },
  { from: '"name": "P3 — 37 Hướng Đi"', to: '"name": "La bàn hướng đi (P3)"' },

  // ── Inline JS labels (P3 step indicator + CTAs) ─────────────────────
  { from: "lbl:'P1 — Khám phá bản thân'", to: "lbl:'Khám phá bản thân (P1)'" },
  { from: "lbl:'P2 — Khai báo nguồn lực'", to: "lbl:'Kiểm kê nguồn lực (P2)'" },
  { from: "Tiếp tục P2: Khai báo nguồn lực →", to: "Tiếp tục: Kiểm kê nguồn lực →" },
  { from: "Tiếp tục: Khai báo nguồn lực", to: "Tiếp tục: Kiểm kê nguồn lực" },

  // ── Body text — Inline P1/P2/P3 references ──────────────────────────
  { from: 'Sửa P2', to: 'Sửa Kiểm kê nguồn lực' },
  { from: 'Làm lại P1', to: 'Làm lại Khám phá bản thân' },
  { from: 'Bắt đầu từ P1', to: 'Bắt đầu Khám phá bản thân' },
  { from: '<h3>P1 + P2 → Tìm hướng đi</h3>', to: '<h3>Khám phá bản thân + Kiểm kê nguồn lực → Tìm hướng đi</h3>' },

  // ── P2 page intro copy ──────────────────────────────────────────────
  { from: 'P2 không hỏi bạn muốn gì — P2 hỏi bạn đang có gì', to: 'Bước này không hỏi anh muốn gì — mà hỏi anh đang có gì' },
  { from: 'P1 nói bạn <em>phù hợp</em> với điều gì — P2 nói điều đó có <em>khả thi</em>', to: 'Bước 1 nói anh <em>phù hợp</em> với điều gì — bước này nói điều đó có <em>khả thi</em>' },

  // ── Voice "bạn" → "anh" (chỉ trong H1 + heading lớn) ────────────────
  { from: '<h1>Bạn tạo ra giá trị <em>theo cách nào?</em></h1>', to: '<h1>Anh tạo ra giá trị <em>theo cách nào?</em></h1>' },
  { from: '<h1>Bạn đang có <em>gì</em> trong tay?</h1>', to: '<h1>Anh đang có <em>gì</em> trong tay?</h1>' },
  { from: '<h1>🎯 Hướng đi phù hợp với bạn</h1>', to: '<h1>🎯 Hướng đi phù hợp với anh</h1>' },
];

// Per-file specific replacements
const FILE_SPECIFIC = {
  'p1.html': [
    // Title + Meta
    { from: /<title>[^<]+<\/title>/, to: '<title>Khám phá bản thân (P1) — DNA Test 20 câu cho đàn ông Việt 40-65 · Đi Cùng Sol</title>' },
    { from: /<meta name="description" content="[^"]+"/, to: '<meta name="description" content="Khám phá bản thân (P1) — Bài DNA Test 20 câu cho đàn ông Việt 40-65 tìm hướng tái khởi nghiệp. Founder Khang Sol, 20+ năm CNTT. Miễn phí."' },
    // CTA buttons
    { from: 'Tiếp tục: Khai báo nguồn lực →', to: 'Tiếp tục: Kiểm kê nguồn lực →' },
  ],

  'p2.html': [
    { from: /<title>[^<]+<\/title>/, to: '<title>Kiểm kê nguồn lực (P2) — Bản đồ Vốn · Time · Network · Sức 45+ · Đi Cùng Sol</title>' },
    { from: /<meta name="description" content="[^"]+"/, to: '<meta name="description" content="Kiểm kê nguồn lực (P2) — Đánh giá 8 trục anh đang có: kinh nghiệm, vốn, thời gian, công nghệ, network, sức khoẻ, gia đình, học hỏi. 5 phút có bản đồ rõ."' },
    // CTA tới P3
    { from: '<a href="/kham-pha-ban-than/" class="btn-p3">Xem hướng đi phù hợp →</a>', to: '<a href="/la-ban-huong-di/" class="btn-p3">Xem hướng đi phù hợp →</a>' },
    { from: 'class="btn-p3">Xem hướng đi phù hợp', to: 'class="btn-p3" href="/la-ban-huong-di/">Xem hướng đi phù hợp' },
  ],

  'p3.html': [
    { from: /<title>[^<]+<\/title>/, to: '<title>La bàn hướng đi (P3) — Top 5/37 Hướng Tái Khởi Nghiệp 45+ · Đi Cùng Sol</title>' },
    { from: /<meta name="description" content="[^"]+"/, to: '<meta name="description" content="La bàn hướng đi (P3) — Hệ thống so khớp DNA + nguồn lực → 37 hướng tái khởi nghiệp xếp hạng % phù hợp với anh. Roadmap 30/90/180 ngày cụ thể."' },
  ],
};

// ════════════════════════════════════════════════════════════════════════
// Main
// ════════════════════════════════════════════════════════════════════════
const files = ['p1.html', 'p2.html', 'p3.html'];

console.log('═══════════════════════════════════════════════════════════════════');
console.log('  Update content P1/P2/P3 — User-friendly Vietnamese');
console.log('═══════════════════════════════════════════════════════════════════\n');

for (const fname of files) {
  const inputPath = path.join(INPUT_DIR, fname);
  const outputPath = path.join(OUTPUT_DIR, fname);

  if (!fs.existsSync(inputPath)) {
    console.log(`⚠️  Skip ${fname} — not found`);
    continue;
  }

  let content = fs.readFileSync(inputPath, 'utf8');
  const sizeBefore = content.length;
  let totalChanges = 0;

  // Apply common replacements
  for (const rule of COMMON_REPLACEMENTS) {
    const before = content;
    if (typeof rule.from === 'string') {
      content = content.split(rule.from).join(rule.to);
    } else {
      content = content.replace(rule.from, rule.to);
    }
    if (before !== content) {
      const occurrences = (before.match(new RegExp(typeof rule.from === 'string' ? rule.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : rule.from.source, 'g')) || []).length;
      totalChanges += occurrences;
    }
  }

  // Apply file-specific replacements
  const specific = FILE_SPECIFIC[fname] || [];
  for (const rule of specific) {
    const before = content;
    if (typeof rule.from === 'string') {
      content = content.split(rule.from).join(rule.to);
    } else {
      content = content.replace(rule.from, rule.to);
    }
    if (before !== content) totalChanges++;
  }

  fs.writeFileSync(outputPath, content, 'utf8');

  const sizeAfter = content.length;
  console.log(`✅ ${fname}`);
  console.log(`   Size: ${(sizeBefore/1024).toFixed(1)} KB → ${(sizeAfter/1024).toFixed(1)} KB`);
  console.log(`   Changes: ~${totalChanges} replacements`);
  console.log('');
}

console.log('═══════════════════════════════════════════════════════════════════');
console.log('  ✅ HOÀN TẤT — Files đã update tại:');
console.log(`     ${OUTPUT_DIR}`);
console.log('═══════════════════════════════════════════════════════════════════');
console.log('');
console.log('Next: Upload lên VPS thay file cũ:');
console.log('  scp current-html-updated/p1.html sol-vps:/var/www/huongdi/public/p1.html');
console.log('  scp current-html-updated/p2.html sol-vps:/var/www/huongdi/public/p2.html');
console.log('  scp current-html-updated/p3.html sol-vps:/var/www/huongdi/public/p3.html');
console.log('');
console.log('Cũng cần update bản trong new path:');
console.log('  scp current-html-updated/p1.html sol-vps:/var/www/huongdi/public/kham-pha-ban-than/index.html');
console.log('  scp current-html-updated/p2.html sol-vps:/var/www/huongdi/public/kiem-ke-nguon-luc/index.html');
console.log('  scp current-html-updated/p3.html sol-vps:/var/www/huongdi/public/la-ban-huong-di/index.html');
