#!/usr/bin/env node
/**
 * Batch Việt hoá smart — bảo toàn SEO.
 *
 * Quy tắc:
 *   1. PROTECT terms trong <h1>, <h2>, <h3>, <h4>, <title>, JSON-LD "name" (FAQ Q tiêu đề), title tag
 *      → Giữ thuật ngữ Anh cho SEO match
 *   2. REPLACE trong body paragraphs, list items, FAQ answers (text trong "acceptedAnswer.text")
 *      → Việt hoá cho người đọc
 *   3. BACKUP mỗi file → .bak trước khi sửa
 *   4. KEEP slug + focus keyword (không touch)
 *
 * Usage:
 *   node batch-vietnamese.js                  # process tất cả 104 bài
 *   node batch-vietnamese.js --priority       # chỉ 8 bài priority
 *   node batch-vietnamese.js --dry-run        # preview, không save
 *   node batch-vietnamese.js --file=GIAMDAN-02-ban-do-trigger.html  # 1 file
 */

const fs = require('fs');
const path = require('path');

const ARTICLES_DIR = path.resolve(__dirname, '..', '..', 'wiki-skeletons', 'wiki-articles');

const PRIORITY_FILES = [
  'PILLAR-cai-thuoc-la-vinh-vien.html',
  'PILLAR-cach-bo-thuoc-khong-tai-nghien.html',
  'B2-cold-turkey-vs-giam-dan.html',
  'PILLAR-vape-co-hai-nhu-thuoc-la-khong.html',
  'CHIP-cai-thuoc-bao-nhieu-lan-moi-thanh-cong.html',
  'CHIP-khong-the-cai-thuoc-da-thu-moi-cach.html',
  'CHIP-mat-y-chi-cai-thuoc-phai-lam-sao.html',
];

// Quy tắc replace — em chỉ apply cho terms 100% safe + có Vietnamese sát nghĩa
const REPLACEMENTS = [
  // Severity 1 — phải Việt hoá
  { from: /\bcravings?\b/gi, to: 'cơn thèm', label: 'craving' },
  { from: /\bwithdrawal\b/gi, to: 'triệu chứng cai (withdrawal)', label: 'withdrawal' },
  { from: /\bcold turkey\b/gi, to: 'bỏ đột ngột (cold turkey)', label: 'cold turkey' },
  { from: /\brelapse(s|d)?\b/gi, to: (m) => m.endsWith('s') ? 'tái nghiện' : m.endsWith('d') ? 'tái nghiện' : 'tái nghiện', label: 'relapse' },
  { from: /\blapse(s|d)?\b/gi, to: (m) => 'vấp', label: 'lapse' },
  { from: /\bwillpower\b/gi, to: 'ý chí', label: 'willpower' },
  // Severity 2 — khuyến nghị Việt hoá
  { from: /\babstinence\b/gi, to: 'kiêng dứt thuốc', label: 'abstinence' },
  { from: /\bcessation\b/gi, to: 'cai thuốc', label: 'cessation' },
  { from: /\bemotion regulation\b/gi, to: 'kỹ năng điều tiết cảm xúc', label: 'emotion regulation' },
  { from: /\bsocial trigger\b/gi, to: 'tình huống xã hội', label: 'social trigger' },
  { from: /\bidentity loss\b/gi, to: 'mất danh tính', label: 'identity loss' },
  { from: /\bself-?efficacy\b/gi, to: 'sự tự tin cai thuốc', label: 'self-efficacy' },
  { from: /\bcompensatory smoking\b/gi, to: 'hút bù', label: 'compensatory' },
  { from: /\bstimulus control\b/gi, to: 'kiểm soát kích thích', label: 'stimulus' },
  { from: /\bmindfulness\b/gi, to: 'chánh niệm (mindfulness)', label: 'mindfulness' },
  { from: /\bstress event\b/gi, to: 'sự cố stress lớn', label: 'stress event' },
  { from: /\bcoping (strategy|strategies|skills?)\b/gi, to: 'cách ứng phó', label: 'coping' },
  // "trigger" - safe to replace globally khi không trong heading/JSON name
  { from: /\btriggers?\b/gi, to: 'tình huống thèm', label: 'trigger' },
];

/**
 * Smart replace — bảo vệ SEO trong:
 *   - <h1>, <h2>, <h3>, <h4>, <h5>, <h6>
 *   - <title>...</title>
 *   - "name": "..." (JSON-LD FAQ Q tiêu đề)
 *   - <summary>...</summary> (visible FAQ accordion tiêu đề)
 *
 * Approach: thay protected regions bằng placeholder __PROTECT_N__,
 * apply replacements, restore placeholder.
 */
function smartReplace(html, replacements) {
  const protectPatterns = [
    /<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi,
    /<summary[^>]*>[\s\S]*?<\/summary>/gi,
    /<title[^>]*>[\s\S]*?<\/title>/gi,
    /"name":\s*"[^"]*"/g,
  ];

  // Step 1: Extract & save protected regions
  const protectedRegions = [];
  let working = html;
  for (const pattern of protectPatterns) {
    working = working.replace(pattern, (match) => {
      const idx = protectedRegions.length;
      protectedRegions.push(match);
      return `__SOLPROTECT_${idx}__`;
    });
  }

  // Step 2: Apply replacements trên working (đã bảo vệ)
  const counts = {};
  for (const rule of replacements) {
    let count = 0;
    working = working.replace(rule.from, (match, ...args) => {
      count++;
      if (typeof rule.to === 'function') return rule.to(match);
      return rule.to;
    });
    if (count > 0) counts[rule.label] = count;
  }

  // Step 3: Restore protected regions
  working = working.replace(/__SOLPROTECT_(\d+)__/g, (m, idx) => {
    return protectedRegions[parseInt(idx)];
  });

  return { html: working, counts };
}

function processFile(filePath, dryRun = false) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { html: updated, counts } = smartReplace(raw, REPLACEMENTS);

  if (updated === raw) {
    return { changed: false, counts: {} };
  }

  if (!dryRun) {
    // Backup
    const bakPath = filePath + '.bak';
    if (!fs.existsSync(bakPath)) {
      fs.writeFileSync(bakPath, raw, 'utf-8');
    }
    fs.writeFileSync(filePath, updated, 'utf-8');
  }

  return { changed: true, counts };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const priorityOnly = args.includes('--priority');
  const fileArg = args.find((a) => a.startsWith('--file='));
  const singleFile = fileArg ? fileArg.slice(7) : null;

  let files;
  if (singleFile) {
    files = [path.join(ARTICLES_DIR, singleFile)];
  } else if (priorityOnly) {
    files = PRIORITY_FILES.map((f) => path.join(ARTICLES_DIR, f));
  } else {
    files = fs.readdirSync(ARTICLES_DIR)
      .filter((f) => f.endsWith('.html') && !f.endsWith('.bak'))
      .filter((f) => f.startsWith('PILLAR-') || f.startsWith('LAMQUEN-') || f.startsWith('GIAMDAN-') || f.startsWith('QDAY-') || /^[AB]\d/.test(f) || f.startsWith('CHIP-'))
      .map((f) => path.join(ARTICLES_DIR, f));
  }

  console.log(`\n▶ Batch Việt hoá ${files.length} bài${dryRun ? ' (DRY RUN)' : ''}${priorityOnly ? ' (PRIORITY)' : ''}\n`);

  const grandTotal = {};
  let changedFiles = 0;
  let skippedFiles = 0;

  for (const filePath of files) {
    const name = path.basename(filePath);
    if (!fs.existsSync(filePath)) {
      console.log(`  ✗ ${name} — không tồn tại`);
      continue;
    }
    try {
      const { changed, counts } = processFile(filePath, dryRun);
      if (changed) {
        changedFiles++;
        const total = Object.values(counts).reduce((s, c) => s + c, 0);
        console.log(`  ✓ ${name.padEnd(60)} ${total} thay đổi`);
        for (const [label, count] of Object.entries(counts)) {
          grandTotal[label] = (grandTotal[label] || 0) + count;
        }
      } else {
        skippedFiles++;
      }
    } catch (e) {
      console.log(`  ✗ ${name} — ${e.message}`);
    }
  }

  console.log('');
  console.log('━'.repeat(70));
  console.log(`  Files changed: ${changedFiles}  |  Files unchanged: ${skippedFiles}`);
  console.log('━'.repeat(70));
  console.log('  Replacements per term (toàn bộ batch):');
  const sorted = Object.entries(grandTotal).sort(([, a], [, b]) => b - a);
  for (const [label, count] of sorted) {
    console.log(`    ${label.padEnd(25)} ${count}`);
  }
  console.log('');

  if (dryRun) {
    console.log('  → DRY RUN — không có file nào bị sửa. Run lại không có --dry-run để apply.');
  } else {
    console.log('  → Backups saved as *.bak. Run audit để verify:');
    console.log('     node audit-vietnamese.js --top=10');
  }
  console.log('');
}

main().catch((err) => { console.error(err); process.exit(1); });
