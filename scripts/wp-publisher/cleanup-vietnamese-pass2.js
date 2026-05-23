#!/usr/bin/env node
/**
 * CLEANUP PASS 2 — fix leftover sau khi batch-vietnamese-v2 chạy pass 1.
 *
 * Vấn đề pass 1 để lại:
 *   - "Kỹ năng kỹ năng" duplicate
 *   - "AVE Phục hồi" order ngược
 *   - "technique", "high-risk", "reinforcement", "late maintenance"... chưa Việt hoá
 *
 * Usage:
 *   node cleanup-vietnamese-pass2.js                 # dry-run
 *   node cleanup-vietnamese-pass2.js --real          # execute
 */

const fs = require('fs');
const path = require('path');
const ARTICLES_DIR = path.resolve(__dirname, '..', '..', 'wiki-skeletons', 'wiki-articles');

const PROTECT_PATTERNS = [
  /<a\s[^>]*href=[^>]*>/gi,
  /href="[^"]*"/gi,
  /<script[\s\S]*?<\/script>/gi,
  /<style[\s\S]*?<\/style>/gi,
  /<!--[\s\S]*?-->/g,
  /\(AVE\)/g,
  /\bChampix\b/g, /\bVarenicline\b/g, /\bBupropion\b/g, /\bWellbutrin\b/g, /\bNicorette\b/g,
  /\bSol\b/g, /\bQ-Day\b/g,
  /\bSổ Hành Trình\b/g,
  /\bVoice của Khang\b/g,
  /\bKhang chia sẻ qua Voice\b/g,
];

const RULES = [
  // FIX duplicates from pass 1
  { from: /\bKỹ năng kỹ năng\b/gi, to: 'Kỹ năng', label: 'dup: Kỹ năng kỹ năng' },
  { from: /\bAVE Phục hồi\b/g, to: 'Phục hồi sau lỡ điếu (AVE)', label: 'order: AVE Phục hồi' },
  { from: /\bAVE phục hồi\b/g, to: 'phục hồi sau lỡ điếu (AVE)', label: 'order: AVE phục hồi' },
  { from: /\btriệu chứng cai \(triệu chứng cai\)\b/gi, to: 'triệu chứng cai', label: 'dup: triệu chứng cai' },
  { from: /\bdanh tính reinforcement\b/gi, to: 'củng cố danh tính', label: 'leak: danh tính reinforcement' },
  { from: /\bdanh tính Reinforcement\b/g, to: 'củng cố danh tính', label: 'leak: danh tính Reinforcement' },

  // NEW terms not covered in pass 1
  { from: /\bhigh-risk\b/gi, to: 'nguy cơ cao', label: 'high-risk' },
  { from: /\bHigh-risk\b/g, to: 'Nguy cơ cao', label: 'High-risk' },
  { from: /\btechniques?\b/gi, to: 'kỹ thuật', label: 'technique' },
  { from: /\bTechniques?\b/g, to: 'Kỹ thuật', label: 'Technique' },
  { from: /\breinforcements?\b/gi, to: 'củng cố', label: 'reinforcement' },
  { from: /\bReinforcements?\b/g, to: 'Củng cố', label: 'Reinforcement' },
  { from: /\bLate maintenance\b/gi, to: 'Giai đoạn duy trì cuối', label: 'Late maintenance' },
  { from: /\blate maintenance\b/g, to: 'giai đoạn duy trì cuối', label: 'late maintenance' },
  { from: /\bHierarchical reductions?\b/gi, to: 'Giảm theo từng bậc', label: 'Hierarchical reduction' },
  { from: /\bhierarchical reductions?\b/g, to: 'giảm theo từng bậc', label: 'hierarchical reduction' },
  { from: /\bTapering phase\b/gi, to: 'Giai đoạn giảm dần', label: 'Tapering phase' },
  { from: /\bTapering\b/g, to: 'Giảm dần', label: 'Tapering' },
  { from: /\bemotional crisis\b/gi, to: 'khủng hoảng cảm xúc', label: 'emotional crisis' },
  { from: /\bemotion-specific\b/gi, to: 'theo từng cảm xúc', label: 'emotion-specific' },
  { from: /\bperfect storm\b/gi, to: '"bão hoàn hảo"', label: 'perfect storm' },
  { from: /\bpeer testimonials?\b/gi, to: 'lời chia sẻ từ anh em', label: 'peer testimonial' },
  { from: /\bpeer supports?\b/gi, to: 'hỗ trợ từ anh em', label: 'peer support' },
  { from: /\bAMA hàng tháng\b/g, to: 'Hỏi-Đáp hàng tháng', label: 'AMA monthly' },
  { from: /\bMaintenance stage transition\b/gi, to: 'chuyển sang giai đoạn duy trì', label: 'Maintenance transition' },
  { from: /\bAction stage\b/gi, to: 'giai đoạn đang cai', label: 'Action stage' },
  { from: /\bneural pathways?\b/gi, to: 'đường dẫn thần kinh', label: 'neural pathway' },
  { from: /\bprefrontal cortex function\b/gi, to: 'chức năng vỏ não trán', label: 'prefrontal cortex' },
  { from: /\bSocial trigger lớn\b/gi, to: 'Tình huống xã hội lớn', label: 'Social trigger lớn' },
  { from: /\bSkill này\b/g, to: 'Kỹ năng này', label: 'Skill này' },
  { from: /\bskill này\b/g, to: 'kỹ năng này', label: 'skill này' },
];

function smartReplace(html) {
  const protectedRegions = [];
  let working = html;
  for (const pattern of PROTECT_PATTERNS) {
    working = working.replace(pattern, (match) => {
      const idx = protectedRegions.length;
      protectedRegions.push(match);
      return `__SOLCLEANUP_${idx}__`;
    });
  }
  const counts = {};
  for (const rule of RULES) {
    const before = working;
    working = working.replace(rule.from, rule.to);
    const matches = (before.match(rule.from) || []).length;
    if (matches > 0) counts[rule.label] = matches;
  }
  for (let i = protectedRegions.length - 1; i >= 0; i--) {
    working = working.replace(`__SOLCLEANUP_${i}__`, protectedRegions[i]);
  }
  return { html: working, counts };
}

function main() {
  const dryRun = !process.argv.includes('--real');
  const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.html') && !f.includes('.bak'));

  console.log(`\nCLEANUP PASS 2 — ${dryRun ? 'DRY-RUN' : 'REAL'} — ${files.length} files\n`);

  const stats = { changed: 0, total: 0, byTerm: {} };

  for (const fileName of files) {
    const filePath = path.join(ARTICLES_DIR, fileName);
    const original = fs.readFileSync(filePath, 'utf-8');
    const { html: replaced, counts } = smartReplace(original);
    const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

    if (replaced !== original && totalCount > 0) {
      stats.changed++;
      stats.total += totalCount;
      for (const [t, n] of Object.entries(counts)) {
        stats.byTerm[t] = (stats.byTerm[t] || 0) + n;
      }
      console.log(`✓ ${fileName} (${totalCount})`);
      if (!dryRun) {
        fs.writeFileSync(filePath + '.bak5', original, 'utf-8');
        fs.writeFileSync(filePath, replaced, 'utf-8');
      }
    }
  }

  console.log(`\n━━━━ SUMMARY: ${stats.changed} files, ${stats.total} replacements`);
  console.log(`\nTop terms:`);
  Object.entries(stats.byTerm).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([t, n]) => {
    console.log(`  ${t.padEnd(45)} × ${n}`);
  });
  console.log(``);
}

main();
