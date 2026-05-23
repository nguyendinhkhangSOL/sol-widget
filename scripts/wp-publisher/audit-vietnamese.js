#!/usr/bin/env node
/**
 * Audit 103 bài SEO sol.vn — kiểm tra mức độ Việt hoá thuật ngữ
 *
 * Quét tất cả HTML trong wiki-skeletons/wiki-articles/
 * Đếm tần suất 20+ thuật ngữ Anh chưa được Việt hoá theo chuẩn v2.
 *
 * Output:
 *   - Report tổng quan (top thuật ngữ + file count)
 *   - Per-file findings (mỗi bài có những từ gì)
 *   - Recommendation: thay cái nào ưu tiên
 *
 * Usage:
 *   node audit-vietnamese.js                  # full audit
 *   node audit-vietnamese.js --top=10         # top 10 worst files
 *   node audit-vietnamese.js --term=trigger   # chi tiết 1 thuật ngữ
 *   node audit-vietnamese.js --csv > out.csv  # export CSV
 */

const fs = require('fs');
const path = require('path');

const ARTICLES_DIR = path.resolve(__dirname, '..', '..', 'wiki-skeletons', 'wiki-articles');

// ─── Quy tắc dịch — 23 thuật ngữ ưu tiên ─────────────────────────
// Mỗi rule: { pattern (regex case-insensitive), vi (cách dịch khuyến nghị), keep (giữ trong ngoặc?) }
const TRANSLATIONS = [
  // Severity 1 — phải Việt hoá (rất phổ thông, người đọc 35-55 không hiểu)
  { pattern: /\btrigger(s|ed|ing)?\b/gi, vi: 'tình huống kích thích thèm thuốc', keep: true, severity: 1, group: 'Behavior' },
  { pattern: /\bcold turkey\b/gi, vi: 'bỏ đột ngột', keep: true, severity: 1, group: 'Method' },
  { pattern: /\bwithdrawal\b/gi, vi: 'triệu chứng cai', keep: true, severity: 1, group: 'Physiology' },
  { pattern: /\blapse(s|d)?\b/gi, vi: 'vấp 1 lần', keep: true, severity: 1, group: 'Behavior' },
  { pattern: /\brelapse(s|d)?\b/gi, vi: 'tái nghiện', keep: true, severity: 1, group: 'Behavior' },
  { pattern: /\bcravings?\b/gi, vi: 'cơn thèm', keep: false, severity: 1, group: 'Physiology' },
  { pattern: /\bwillpower\b/gi, vi: 'ý chí', keep: false, severity: 1, group: 'Psychology' },

  // Severity 2 — nên Việt hoá (chuyên môn, có cách dịch hay)
  { pattern: /\b(nicotine\s+)?receptors?\b/gi, vi: 'điểm tiếp nhận', keep: true, severity: 2, group: 'Physiology' },
  { pattern: /\bNRT\b/g, vi: 'liệu pháp thay thế nicotine', keep: true, severity: 2, group: 'Method' },
  { pattern: /\bCBT\b/g, vi: 'tư vấn tâm lý', keep: true, severity: 2, group: 'Method' },
  { pattern: /\babstinence\b/gi, vi: 'kiêng dứt thuốc', keep: true, severity: 2, group: 'Behavior' },
  { pattern: /\bmindfulness\b/gi, vi: 'chánh niệm', keep: true, severity: 2, group: 'Psychology' },
  { pattern: /\bcompensatory\s+smoking\b/gi, vi: 'hút bù', keep: true, severity: 2, group: 'Behavior' },
  { pattern: /\bstimulus\s+control\b/gi, vi: 'kiểm soát kích thích', keep: true, severity: 2, group: 'Method' },
  { pattern: /\b(?:social\s+)?support\b/gi, vi: 'sự đồng hành', keep: false, severity: 2, group: 'Psychology' },
  { pattern: /\bself-?efficacy\b/gi, vi: 'tự tin vào khả năng bản thân', keep: true, severity: 2, group: 'Psychology' },
  { pattern: /\bcoping\s+(strategy|strategies|skills?)\b/gi, vi: 'cách ứng phó', keep: true, severity: 2, group: 'Psychology' },

  // Severity 3 — có thể giữ (tên thuốc, tổ chức, hormone)
  { pattern: /\bbaseline\b/gi, vi: 'mức cơ sở', keep: true, severity: 3, group: 'General' },
  { pattern: /\bdopamine\b/gi, vi: '(giữ — tên hoá chất)', keep: false, severity: 3, group: 'Physiology', skipFix: true },
  { pattern: /\bcortisol\b/gi, vi: '(giữ — tên hormone)', keep: false, severity: 3, group: 'Physiology', skipFix: true },
  { pattern: /\bserotonin\b/gi, vi: '(giữ — tên hoá chất)', keep: false, severity: 3, group: 'Physiology', skipFix: true },
  { pattern: /\bnicotine\b/gi, vi: '(giữ — tên hoạt chất)', keep: false, severity: 3, group: 'Physiology', skipFix: true },
  { pattern: /\b(Champix|Varenicline|Bupropion|Wellbutrin)\b/g, vi: '(giữ — tên thuốc)', keep: false, severity: 3, group: 'Method', skipFix: true },
  { pattern: /\b(Cochrane|NIDA|WHO|FDA)\b/g, vi: '(giữ — tên tổ chức)', keep: false, severity: 3, group: 'Source', skipFix: true },
  { pattern: /\bFagerstr[oö]m\b/gi, vi: '(giữ — tên test)', keep: false, severity: 3, group: 'Method', skipFix: true },

  // Severity 1 — abbreviation thường dùng quá
  { pattern: /\bFEV1\b/g, vi: 'thể tích thở ra (FEV1)', keep: true, severity: 2, group: 'Medical' },
  { pattern: /\bCO\b(?!\d)/g, vi: 'khí CO', keep: false, severity: 3, group: 'Medical', skipFix: true },
  { pattern: /\bCOPD\b/g, vi: 'bệnh phổi tắc nghẽn mãn tính (COPD)', keep: true, severity: 2, group: 'Medical' },
  { pattern: /\bBMR\b/g, vi: 'tỷ lệ trao đổi chất cơ bản (BMR)', keep: true, severity: 2, group: 'Medical' },
  { pattern: /\bBP\b/g, vi: 'huyết áp', keep: false, severity: 2, group: 'Medical' },
  { pattern: /\bREM\b/g, vi: 'giai đoạn ngủ sâu (REM)', keep: true, severity: 2, group: 'Medical' },
];

const SEVERITY_LABEL = {
  1: '🔴 NÊN VIỆT HOÁ',
  2: '🟡 KHUYẾN NGHỊ VIỆT HOÁ',
  3: '🟢 OK GIỮ',
};

function auditFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  // Strip FAQ JSON-LD (đã được handle riêng) + style tags
  const html = raw
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '');

  const findings = {};
  for (const rule of TRANSLATIONS) {
    const matches = html.match(rule.pattern);
    if (matches && matches.length > 0) {
      // Lưu unique forms (vd "triggers" vs "trigger")
      const forms = {};
      for (const m of matches) {
        const key = m.toLowerCase();
        forms[key] = (forms[key] || 0) + 1;
      }
      findings[rule.pattern.source] = {
        rule,
        count: matches.length,
        forms,
      };
    }
  }
  return findings;
}

function formatPattern(pattern) {
  // Render regex source thành readable
  return pattern.replace(/\\b/g, '').replace(/\?:/g, '').replace(/\(\?\!\\d\)/g, '');
}

async function main() {
  const args = process.argv.slice(2);
  const csvMode = args.includes('--csv');
  const topArg = args.find((a) => a.startsWith('--top='));
  const topN = topArg ? parseInt(topArg.slice(6)) : 999;
  const termArg = args.find((a) => a.startsWith('--term='));
  const termFilter = termArg ? termArg.slice(7).toLowerCase() : null;

  // Lấy tất cả HTML files
  const files = fs.readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith('.html') && (f.startsWith('PILLAR-') || f.startsWith('LAMQUEN-') || f.startsWith('GIAMDAN-') || f.startsWith('QDAY-') || f.startsWith('A') || f.startsWith('B') || f.startsWith('CHIP-')))
    .map((f) => path.join(ARTICLES_DIR, f));

  if (!csvMode) {
    console.log(`\n▶ Audit Việt hoá ${files.length} bài SEO\n`);
  }

  // Aggregate stats
  const fileFindings = []; // { file, total, severity1, severity2, findings }
  const globalCounts = {}; // { patternSrc: { rule, total, fileCount } }

  for (const filePath of files) {
    const findings = auditFile(filePath);
    let total = 0, sev1 = 0, sev2 = 0;
    for (const f of Object.values(findings)) {
      total += f.count;
      if (f.rule.severity === 1) sev1 += f.count;
      else if (f.rule.severity === 2) sev2 += f.count;
      // Tích global
      const key = f.rule.pattern.source;
      if (!globalCounts[key]) globalCounts[key] = { rule: f.rule, total: 0, fileCount: 0 };
      globalCounts[key].total += f.count;
      globalCounts[key].fileCount += 1;
    }
    fileFindings.push({
      file: path.basename(filePath),
      total, severity1: sev1, severity2: sev2,
      findings,
    });
  }

  // Sắp xếp file theo severity 1 + 2 desc (worst first)
  fileFindings.sort((a, b) => (b.severity1 * 3 + b.severity2) - (a.severity1 * 3 + a.severity2));

  if (csvMode) {
    console.log('file,total_terms,severity1_count,severity2_count');
    for (const ff of fileFindings) {
      console.log(`${ff.file},${ff.total},${ff.severity1},${ff.severity2}`);
    }
    return;
  }

  // ─── Section A: Global stats ───
  console.log('━'.repeat(80));
  console.log('  GLOBAL — TẦN SUẤT TỪNG THUẬT NGỮ TRONG TOÀN BỘ 103 BÀI');
  console.log('━'.repeat(80));

  const globalSorted = Object.values(globalCounts).sort((a, b) => b.total - a.total);
  for (const g of globalSorted.slice(0, 30)) {
    if (termFilter && !g.rule.pattern.source.toLowerCase().includes(termFilter)) continue;
    const label = SEVERITY_LABEL[g.rule.severity];
    const patternStr = formatPattern(g.rule.pattern.source).padEnd(40);
    const viStr = g.rule.skipFix ? '(giữ)' : `→ ${g.rule.vi}`;
    console.log(`  ${label} ${patternStr} ${g.total} occurrences trong ${g.fileCount} files  ${viStr}`);
  }

  console.log('');
  console.log('━'.repeat(80));
  console.log(`  TOP ${Math.min(topN, fileFindings.length)} BÀI CẦN VIỆT HOÁ NHẤT`);
  console.log('━'.repeat(80));

  for (const ff of fileFindings.slice(0, topN)) {
    if (ff.severity1 + ff.severity2 === 0) continue;
    console.log(`\n  📄 ${ff.file}`);
    console.log(`     🔴 ${ff.severity1} severity-1  |  🟡 ${ff.severity2} severity-2  |  Total: ${ff.total}`);
    // List top 5 terms in file
    const sorted = Object.values(ff.findings)
      .filter((f) => !f.rule.skipFix)
      .sort((a, b) => b.count - a.count);
    for (const f of sorted.slice(0, 5)) {
      const formsStr = Object.entries(f.forms).map(([k, v]) => `"${k}"×${v}`).join(', ');
      console.log(`        ${SEVERITY_LABEL[f.rule.severity]} ${formsStr} → ${f.rule.vi}`);
    }
  }

  // ─── Summary ───
  const totalSev1 = fileFindings.reduce((s, f) => s + f.severity1, 0);
  const totalSev2 = fileFindings.reduce((s, f) => s + f.severity2, 0);
  const filesWithSev1 = fileFindings.filter((f) => f.severity1 > 0).length;
  const filesWithSev2 = fileFindings.filter((f) => f.severity2 > 0).length;

  console.log('');
  console.log('━'.repeat(80));
  console.log('  TÓM TẮT');
  console.log('━'.repeat(80));
  console.log(`  🔴 Severity 1 (nên Việt hoá): ${totalSev1} occurrences trong ${filesWithSev1}/${fileFindings.length} files`);
  console.log(`  🟡 Severity 2 (khuyến nghị):  ${totalSev2} occurrences trong ${filesWithSev2}/${fileFindings.length} files`);
  console.log(`  📊 Files KHÔNG cần fix:      ${fileFindings.length - filesWithSev1 - filesWithSev2}`);
  console.log('');
  console.log('  → Run với --csv để export Excel');
  console.log('  → Run với --term=<thuật-ngữ> để filter');
  console.log('  → Run với --top=N để xem N file worst');
  console.log('');
}

main().catch((err) => { console.error(err); process.exit(1); });
