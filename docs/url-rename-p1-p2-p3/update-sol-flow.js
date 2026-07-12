#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════
 *  Patch sol-flow.js — Việt hoá breadcrumb + URLs
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  Input:  live-html/sol-flow.js
 *  Output: current-html-updated/sol-flow.js
 * ═══════════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');

const INPUT = path.join(__dirname, 'live-html', 'sol-flow.js');
const OUTPUT_DIR = path.join(__dirname, 'current-html-updated');
const OUTPUT = path.join(OUTPUT_DIR, 'sol-flow.js');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

let content = fs.readFileSync(INPUT, 'utf8');

const RULES = [
  // ───── Breadcrumb step labels + URLs ─────
  { from: "{ n:1, label:'P1 · DNA', done:!!p1, active:onP1, href:'/p1.html' }",
    to: "{ n:1, label:'Khám phá bản thân', done:!!p1, active:onP1, href:'/kham-pha-ban-than/' }" },
  { from: "{ n:2, label:'P2 · Nguồn lực', done:!!p2, active:onP2, href:'/p2.html' }",
    to: "{ n:2, label:'Kiểm kê nguồn lực', done:!!p2, active:onP2, href:'/kiem-ke-nguon-luc/' }" },
  { from: "{ n:3, label:'P3 · Hướng đi', done:false, active:onP3, href:'/p3.html' }",
    to: "{ n:3, label:'La bàn hướng đi', done:false, active:onP3, href:'/la-ban-huong-di/' }" },

  // ───── Path detection (support both old + new URLs) ─────
  { from: "const onP1 = /\\/p1(\\.html)?$/.test(path) || path === '/';",
    to: "const onP1 = /\\/p1(\\.html)?$/.test(path) || /\\/kham-pha-ban-than\\/?$/.test(path) || path === '/';" },
  { from: "const onP2 = /\\/p2(\\.html)?$/.test(path);",
    to: "const onP2 = /\\/p2(\\.html)?$/.test(path) || /\\/kiem-ke-nguon-luc\\/?$/.test(path);" },
  { from: "const onP3 = /\\/p3/.test(path);",
    to: "const onP3 = /\\/p3/.test(path) || /\\/la-ban-huong-di\\/?$/.test(path);" },

  // ───── P1 Summary Card — empty state ─────
  { from: 'P1 chưa hoàn thành', to: 'Khám phá bản thân (P1) chưa hoàn thành' },
  { from: 'Bạn cần hoàn thành bài P1 trước', to: 'Anh cần hoàn thành bước Khám phá trước' },
  { from: 'Làm P1 ngay →', to: 'Bắt đầu Khám phá ngay →' },
  { from: '<a href="/p1.html" class="sol-btn-view"', to: '<a href="/kham-pha-ban-than/" class="sol-btn-view"' },

  // ───── P1 Summary Card — completed state ─────
  { from: 'P1 hoàn thành · Năng lực chính:', to: 'Khám phá hoàn thành · Năng lực chính:' },
  { from: 'DNA Hướng Đi đã xác định', to: 'DNA Hướng Đi đã xác định' }, // giữ nguyên — đây là title hay
  { from: '↺ Làm lại P1', to: '↺ Làm lại Khám phá' },
  { from: '↺ Làm lại P2', to: '↺ Làm lại Kiểm kê' },

  // ───── Reset confirms ─────
  { from: 'Xóa kết quả P1 và làm lại bài trắc nghiệm DNA?', to: 'Xoá kết quả Khám phá bản thân và làm lại bài DNA Test?' },
  { from: 'Xóa kết quả P2 và khai báo lại nguồn lực?', to: 'Xoá kết quả Kiểm kê nguồn lực và khai báo lại?' },
  { from: 'Xóa tất cả kết quả P1 + P2 và bắt đầu lại từ đầu?', to: 'Xoá tất cả kết quả và bắt đầu lại từ đầu?' },

  // ───── Inline href updates trong P2 card / generic ─────
  { from: 'href="/p1.html"', to: 'href="/kham-pha-ban-than/"' },
  { from: 'href="/p2.html"', to: 'href="/kiem-ke-nguon-luc/"' },
  { from: 'href="/p3.html"', to: 'href="/la-ban-huong-di/"' },
  { from: "location.href='/p1.html'", to: "location.href='/kham-pha-ban-than/'" },
  { from: "location.href='/p2.html'", to: "location.href='/kiem-ke-nguon-luc/'" },
  { from: "location.href='/p3.html'", to: "location.href='/la-ban-huong-di/'" },
  { from: 'location.href = "/p1.html"', to: 'location.href = "/kham-pha-ban-than/"' },
  { from: 'location.href = "/p2.html"', to: 'location.href = "/kiem-ke-nguon-luc/"' },
  { from: 'location.href = "/p3.html"', to: 'location.href = "/la-ban-huong-di/"' },

  // ───── Generic P2 / P3 labels trong card title ─────
  { from: 'P2 chưa hoàn thành', to: 'Kiểm kê nguồn lực (P2) chưa hoàn thành' },
  { from: 'Bạn cần hoàn thành bài P2', to: 'Anh cần hoàn thành bước Kiểm kê' },
  { from: 'Làm P2 ngay →', to: 'Bắt đầu Kiểm kê ngay →' },
  { from: 'P2 hoàn thành', to: 'Kiểm kê hoàn thành' },
];

// Apply rules
let totalChanges = 0;
for (const rule of RULES) {
  const before = content;
  content = content.split(rule.from).join(rule.to);
  const occurrences = (before.split(rule.from).length - 1);
  if (occurrences > 0) {
    console.log(`✅ "${rule.from.substring(0, 50)}..."  ×${occurrences}`);
    totalChanges += occurrences;
  }
}

// Voice replacement — careful, only in user-facing strings (not in code comments)
// Approach: only replace "Bạn" / "bạn" that appears inside string literals (after quote)
// To be safe, just count remaining for awareness:
const banCount = (content.match(/\bBạn\b/g) || []).length;
const banLowerCount = (content.match(/\bbạn\b/g) || []).length;

// Apply voice (full file — JS comments + strings)
content = content.replace(/\bBạn\b/g, 'Anh');
content = content.replace(/\bbạn\b/g, 'anh');

console.log(`\n✅ Voice rules: ${banCount} "Bạn" + ${banLowerCount} "bạn" → "Anh"/"anh"`);

fs.writeFileSync(OUTPUT, content, 'utf8');

console.log(`\n═══════════════════════════════════════════════════════════════════`);
console.log(`  ✅ Total: ${totalChanges + banCount + banLowerCount} changes`);
console.log(`  Output: ${OUTPUT}`);
console.log(`═══════════════════════════════════════════════════════════════════`);

// Verify
const newContent = fs.readFileSync(OUTPUT, 'utf8');
console.log('\nVerify:');
console.log(`  "P1 · DNA" remaining:        ${(newContent.match(/P1 · DNA/g) || []).length}`);
console.log(`  "P2 · Nguồn lực" remaining:  ${(newContent.match(/P2 · Nguồn lực/g) || []).length}`);
console.log(`  "P3 · Hướng đi" remaining:   ${(newContent.match(/P3 · Hướng đi/g) || []).length}`);
console.log(`  "Khám phá bản thân":         ${(newContent.match(/Khám phá bản thân/g) || []).length}`);
console.log(`  "Kiểm kê nguồn lực":         ${(newContent.match(/Kiểm kê nguồn lực/g) || []).length}`);
console.log(`  "La bàn hướng đi":           ${(newContent.match(/La bàn hướng đi/g) || []).length}`);
console.log(`  /p1.html href remaining:     ${(newContent.match(/href="\/p1\.html"/g) || []).length}`);
console.log(`  /kham-pha-ban-than href:     ${(newContent.match(/href="\/kham-pha-ban-than\/"/g) || []).length}`);
