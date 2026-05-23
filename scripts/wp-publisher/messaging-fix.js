#!/usr/bin/env node
/**
 * MESSAGING FIX BATCH SCRIPT
 *
 * Purpose: Fix các pattern messaging sai trong toàn dự án.
 * 1. "Voice Khang" / "giọng Khang" → "Voice của Khang" / "Khang chia sẻ qua Voice"
 * 2. "Sol miễn phí 100%" → context (Freemium Honest)
 * 3. "(có gói Pro 50k)" → pricing đúng (149k/249k/349k)
 * 4. "Không bán gì cả" → specific ("không bán thuốc/khoá học/quảng cáo")
 *
 * Triết lý:
 * - DRY-RUN mặc định — chỉ print, không write
 * - Real mode: backup .bak3 trước khi write
 * - Scoped — chỉ fix UI labels + content, KHÔNG fix code enum/comments
 *
 * Usage:
 *   node messaging-fix.js --dry-run                # default
 *   node messaging-fix.js --dry-run --pass=1       # chỉ pass 1 (docs)
 *   node messaging-fix.js --pass=1 --real          # execute pass 1
 *   node messaging-fix.js --pass=2 --real          # execute pass 2 (wiki)
 *   node messaging-fix.js --all --real             # execute all
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

// ─── RULES ───────────────────────────────────────────────────────────────

// PASS 1: Docs + Marketing markdown + Code files
// Rule: literal substring → replace (case-sensitive — order matters: specific before generic)
const RULES_PASS1 = [
  // ── Voice Khang SPECIFIC variants (specific must come BEFORE generic) ──
  { from: 'label="Voice Khang"', to: 'label="Voice của Khang"', tag: 'UI label JSX' },
  { from: "label: 'Voice Khang'", to: "label: 'Voice của Khang'", tag: 'UI label object' },
  { from: 'label: "Voice Khang"', to: 'label: "Voice của Khang"', tag: 'UI label object' },
  { from: '🎙️ Voice Khang', to: '🎙️ Voice của Khang', tag: 'UI heading' },
  { from: 'trang Voice Khang', to: 'trang Voice của Khang', tag: 'UI nav reference' },
  { from: 'Voice Khang trả lời', to: 'Khang trả lời qua Voice', tag: 'UI tab' },

  // ── Lowercase voice Khang + variants ──
  { from: 'voice Khang chào mừng', to: 'Voice của Khang chia sẻ chào mừng', tag: 'tier feature lowercase' },
  { from: 'voice Khang (Ngày', to: 'Voice của Khang (Ngày', tag: 'tier feature timing' },
  { from: 'voice Khang +', to: 'Voice của Khang +', tag: 'tier feature' },
  { from: 'voice Khang Day', to: 'Voice của Khang Day', tag: 'context day' },
  { from: 'voice Khang adapt', to: 'Voice của Khang điều chỉnh', tag: 'context adaptive' },
  { from: 'voice Khang record', to: 'Voice của Khang record', tag: 'internal note' },
  { from: 'voice Khang opening', to: 'Voice của Khang opening', tag: 'internal note' },
  { from: 'voice Khang ngắn', to: 'Voice của Khang ngắn', tag: 'context' },
  { from: 'voice Khang đặc biệt', to: 'Voice của Khang đặc biệt', tag: 'context' },
  { from: 'paid voice Khang', to: 'paid Voice của Khang', tag: 'tier' },
  { from: 'voice Khang lapse', to: 'Voice của Khang lapse-friendly', tag: 'internal' },
  { from: 'voice Khang Sol', to: 'Voice của Khang Sol', tag: 'wiki landing' },

  // ── Voice Khang in admin/messaging UI ──
  { from: 'Voice Khang cột mốc', to: 'Voice Khang chia sẻ cột mốc', tag: 'admin description' },
  { from: 'Voice Khang chào mừng', to: 'Voice Khang chia sẻ chào mừng', tag: 'tier feature' },

  // ── giọng Khang / Sol AI giọng tôi ──
  { from: 'giọng Khang', to: 'Khang chia sẻ qua Voice', tag: 'content phrase' },
  { from: 'Giọng Khang', to: 'Khang chia sẻ qua Voice', tag: 'content phrase (capitalized)' },
  { from: 'Sol AI giọng tôi', to: 'Sol AI hỗ trợ + Khang chia sẻ qua Voice', tag: 'wiki article' },
  { from: 'AI giọng tôi', to: 'AI hỗ trợ + Khang chia sẻ qua Voice', tag: 'wiki article variant' },
  { from: 'chatbot AI giọng tôi', to: 'chatbot AI + Khang chia sẻ qua Voice', tag: 'fanpage/wiki' },

  // ── Khang voice (mixed EN-VN) ──
  { from: 'Khang voice reply', to: 'Khang trả lời qua Voice', tag: 'UI text HoiKhang' },
  { from: 'Khang voice opening', to: 'Voice của Khang opening', tag: 'comment' },
  { from: 'Khang voice quote', to: 'Voice của Khang quote', tag: 'checkpoint' },
  { from: 'Khang voice ', to: 'Voice của Khang ', tag: 'EN-VN mixed' },

  // ── Miễn phí 100% (Freemium Honest) ──
  { from: 'Sol miễn phí 100%', to: 'Sol miễn phí vào trải nghiệm', tag: 'Freemium Honest tagline' },
  { from: '"Miễn phí 100%"', to: '"Miễn phí vào trải nghiệm"', tag: 'video script quote' },
  { from: 'miễn phí 100%', to: 'miễn phí vào trải nghiệm', tag: 'inline phrase' },

  // ── Pricing CŨ ──
  { from: '(có gói Pro 50k)', to: '(có 3 Lộ trình mở rộng: 149k / 249k / 349k)', tag: 'pricing fix B4' },
  { from: 'Hoàn toàn miễn phí (có gói Pro 50k)', to: 'Miễn phí dùng — có 3 Lộ trình mở rộng từ 149k/249k/349k tuỳ Mức Lệ Thuộc', tag: 'pricing fix B4 full' },

  // ── Không bán gì cả (generic) → specific ──
  { from: 'không bán gì cả', to: 'không bán thuốc, không bán khoá học, không quảng cáo', tag: 'specific moat' },
  { from: 'Không bán gì cả', to: 'Không bán thuốc, không bán khoá học, không quảng cáo', tag: 'specific moat' },
  { from: 'KHÔNG bán gì cả', to: 'KHÔNG bán thuốc, KHÔNG bán khoá học, KHÔNG quảng cáo', tag: 'specific moat caps' },

  // ── App miễn phí Sol (specific replacement) ──
  { from: 'App miễn phí Sol — chatbot AI giọng Khang', to: 'App Sol miễn phí dùng — chatbot AI + Khang chia sẻ qua Voice', tag: 'fanpage' },
];

// PASS 2: Wiki articles HTML (sol.vn published content)
// More careful — content for end users
const RULES_PASS2 = [
  // ── Voice Khang in wiki HTML ──
  { from: 'tai nghe + Khang voice', to: 'tai nghe + Voice của Khang', tag: 'wiki content' },
  { from: 'Khang voice', to: 'Voice của Khang', tag: 'wiki content' },
  { from: 'voice Khang Sol', to: 'Voice của Khang Sol', tag: 'wiki' },
  { from: 'Voice Khang Sol:', to: 'Voice của Khang Sol:', tag: 'wiki landing' },
  { from: 'voice Khang', to: 'Voice của Khang', tag: 'wiki content' },
  { from: 'Voice Khang', to: 'Voice của Khang', tag: 'wiki UI text' },

  // ── giọng Khang in wiki ──
  { from: 'giọng Khang', to: 'Khang chia sẻ qua Voice', tag: 'wiki content phrase' },
  { from: 'Giọng Khang', to: 'Khang chia sẻ qua Voice', tag: 'wiki content (capitalized)' },
  { from: 'Sol AI giọng tôi', to: 'Sol AI hỗ trợ + Khang chia sẻ qua Voice', tag: 'wiki article' },
  { from: 'AI giọng tôi', to: 'AI hỗ trợ + Khang chia sẻ qua Voice', tag: 'wiki variant' },
  { from: 'chatbot AI giọng tôi', to: 'chatbot AI + Khang chia sẻ qua Voice', tag: 'wiki PILLAR' },

  // ── Pricing/Freemium wiki content ──
  { from: 'Hoàn toàn miễn phí (có gói Pro 50k)', to: 'Miễn phí vào trải nghiệm — có 3 Lộ trình mở rộng: 149k/249k/349k tuỳ Mức Lệ Thuộc', tag: 'B4 pricing fix' },
  { from: 'miễn phí 100%', to: 'miễn phí vào trải nghiệm', tag: 'wiki Freemium Honest' },
  { from: 'Sol miễn phí 100%', to: 'Sol miễn phí vào trải nghiệm', tag: 'wiki Freemium' },
];

// ─── FILE SCANNING ───────────────────────────────────────────────────────

function shouldSkip(filePath) {
  // Skip backup files
  if (/\.bak\d*$/.test(filePath)) return true;
  if (/\.OLD\./.test(filePath)) return true;
  // Skip dependencies
  if (filePath.includes('node_modules')) return true;
  if (filePath.includes('.git')) return true;
  if (filePath.includes('dist')) return true;
  if (filePath.includes('build')) return true;
  return false;
}

function walkDir(dir, callback) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (shouldSkip(fullPath)) continue;
    if (entry.isDirectory()) {
      walkDir(fullPath, callback);
    } else if (entry.isFile()) {
      callback(fullPath);
    }
  }
}

function processFile(filePath, rules, dryRun) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;
  const changes = [];

  for (const rule of rules) {
    if (content.includes(rule.from)) {
      const before = content;
      content = content.split(rule.from).join(rule.to);
      const count = (before.length - content.length === 0)
        ? before.split(rule.from).length - 1
        : Math.abs((before.match(new RegExp(escapeRegex(rule.from), 'g')) || []).length);
      if (count > 0) {
        changes.push({ rule: rule.tag, from: rule.from, to: rule.to, count });
      }
    }
  }

  if (content !== original) {
    if (!dryRun) {
      // Backup .bak3
      fs.writeFileSync(filePath + '.bak3', original, 'utf-8');
      fs.writeFileSync(filePath, content, 'utf-8');
    }
    return { changed: true, changes };
  }
  return { changed: false, changes: [] };
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── PASSES ──────────────────────────────────────────────────────────────

function runPass1(dryRun) {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`PASS 1 — Docs + Marketing + Code UI labels  [${dryRun ? 'DRY-RUN' : 'REAL'}]`);
  console.log(`${'═'.repeat(70)}\n`);

  const dirs = [
    path.join(ROOT, 'docs'),
    path.join(ROOT, 'frontend', 'src'),
    path.join(ROOT, 'dashboard', 'src'),
    path.join(ROOT, 'backend', 'src'),
    path.join(ROOT, 'admin', 'src'),
  ];
  const exts = ['.md', '.tsx', '.ts', '.jsx', '.js'];

  const stats = { filesScanned: 0, filesChanged: 0, totalReplacements: 0 };

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    walkDir(dir, (fp) => {
      if (!exts.some(ext => fp.endsWith(ext))) return;
      stats.filesScanned++;
      const result = processFile(fp, RULES_PASS1, dryRun);
      if (result.changed) {
        stats.filesChanged++;
        const relPath = path.relative(ROOT, fp);
        const totalCount = result.changes.reduce((a, c) => a + c.count, 0);
        stats.totalReplacements += totalCount;
        console.log(`✓ ${relPath}  (${totalCount} fix${totalCount > 1 ? 'es' : ''})`);
        for (const c of result.changes) {
          console.log(`    [${c.tag}] x${c.count}`);
        }
      }
    });
  }

  console.log(`\n📊 Pass 1 Summary: ${stats.filesChanged}/${stats.filesScanned} files changed, ${stats.totalReplacements} replacements.`);
  return stats;
}

function runPass2(dryRun) {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`PASS 2 — Wiki articles HTML (sol.vn content)  [${dryRun ? 'DRY-RUN' : 'REAL'}]`);
  console.log(`${'═'.repeat(70)}\n`);

  const dir = path.join(ROOT, 'wiki-skeletons', 'wiki-articles');
  const stats = { filesScanned: 0, filesChanged: 0, totalReplacements: 0 };

  if (!fs.existsSync(dir)) {
    console.log('⚠ Wiki articles dir not found.');
    return stats;
  }

  walkDir(dir, (fp) => {
    if (!fp.endsWith('.html')) return;
    if (fp.includes('.bak')) return;
    stats.filesScanned++;
    const result = processFile(fp, RULES_PASS2, dryRun);
    if (result.changed) {
      stats.filesChanged++;
      const relPath = path.relative(ROOT, fp);
      const totalCount = result.changes.reduce((a, c) => a + c.count, 0);
      stats.totalReplacements += totalCount;
      console.log(`✓ ${relPath}  (${totalCount} fix${totalCount > 1 ? 'es' : ''})`);
      for (const c of result.changes) {
        console.log(`    [${c.tag}] x${c.count}`);
      }
    }
  });

  console.log(`\n📊 Pass 2 Summary: ${stats.filesChanged}/${stats.filesScanned} files changed, ${stats.totalReplacements} replacements.`);
  return stats;
}

// ─── MAIN ────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--real');
  const pass1Only = args.includes('--pass=1');
  const pass2Only = args.includes('--pass=2');
  const all = args.includes('--all') || (!pass1Only && !pass2Only);

  console.log(`\n${'━'.repeat(70)}`);
  console.log(`  MESSAGING FIX BATCH — Sol Project`);
  console.log(`  Mode: ${dryRun ? '🔍 DRY-RUN (no writes)' : '⚡ REAL EXECUTION'}`);
  console.log(`${'━'.repeat(70)}`);

  const overall = { filesChanged: 0, totalReplacements: 0 };

  if (all || pass1Only) {
    const s = runPass1(dryRun);
    overall.filesChanged += s.filesChanged;
    overall.totalReplacements += s.totalReplacements;
  }
  if (all || pass2Only) {
    const s = runPass2(dryRun);
    overall.filesChanged += s.filesChanged;
    overall.totalReplacements += s.totalReplacements;
  }

  console.log(`\n${'━'.repeat(70)}`);
  console.log(`✓ OVERALL: ${overall.filesChanged} files, ${overall.totalReplacements} replacements`);
  if (dryRun) {
    console.log(`\n💡 Để execute thật: thêm flag --real`);
    console.log(`   Backup .bak3 sẽ được tạo trước khi ghi.`);
  } else {
    console.log(`\n✓ DONE. Backups saved as *.bak3 next to mỗi file đã sửa.`);
    console.log(`📋 Next: Re-publish wiki articles đã sửa via WP REST API.`);
  }
  console.log(`${'━'.repeat(70)}\n`);
}

main();
