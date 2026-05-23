#!/usr/bin/env node
/**
 * BATCH VIETNAMESE V2 — Việt hoá tối đa + Dân dã hoá
 *
 * Source of truth: SOL_BUSINESS_MODEL_CANONICAL.md Section 12.5
 *
 * Khác V1:
 *   - 80+ terms glossary (V1 chỉ 17)
 *   - Loosen PROTECT rules: heading vẫn replace từ thông dụng (Skill, Trigger, Plan B...)
 *     Chỉ PROTECT clinical/brand acronyms (FTND, CBT, MI, COPD, Champix, NRT, Sol, Q-Day)
 *   - Multi-word phrases ƯU TIÊN match TRƯỚC single words
 *   - Tone transformations (hàn lâm → dân dã)
 *
 * Quy tắc PROTECT:
 *   1. Slug + URLs: KHÔNG touch
 *   2. JSON-LD "name", "url", "@type": KHÔNG touch (SEO structured data)
 *   3. <title> tag content: thay được từ thông dụng
 *   4. <hN> headings: thay được từ thông dụng
 *   5. Clinical acronyms (FTND, CBT, MI, COPD, NRT, AVE — sau lần đầu): giữ
 *   6. Brand terms (Sol, Q-Day, Champix, Wellbutrin, Bupropion, Varenicline): giữ
 *
 * Usage:
 *   node batch-vietnamese-v2.js                       # dry-run all
 *   node batch-vietnamese-v2.js --real                # execute real
 *   node batch-vietnamese-v2.js --file=PILLAR-cai-thuoc-la-vinh-vien.html
 *   node batch-vietnamese-v2.js --priority            # 7 bài priority Khang
 *   node batch-vietnamese-v2.js --report=audit.md     # output detailed audit
 */

const fs = require('fs');
const path = require('path');

const ARTICLES_DIR = path.resolve(__dirname, '..', '..', 'wiki-skeletons', 'wiki-articles');
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

const PRIORITY_FILES = [
  'PILLAR-cai-thuoc-la-vinh-vien.html',
  'PILLAR-cach-bo-thuoc-khong-tai-nghien.html',
  'B2-cold-turkey-vs-giam-dan.html',
  'PILLAR-vape-co-hai-nhu-thuoc-la-khong.html',
  'CHIP-cai-thuoc-bao-nhieu-lan-moi-thanh-cong.html',
  'CHIP-khong-the-cai-thuoc-da-thu-moi-cach.html',
  'CHIP-mat-y-chi-cai-thuoc-phai-lam-sao.html',
];

// ─── PROTECT (chỉ giữ acronym chuyên môn + brand terms) ───────────────
// Lưu ý: KHÔNG protect "AVE" alone vì block "AVE Recovery" multi-word match.
// AVE sẽ giữ qua context (e.g., "(AVE)" trong giải thích).
const PROTECT_PATTERNS = [
  /<a\s[^>]*href=[^>]*>/gi,          // URL attributes
  /href="[^"]*"/gi,                  // href value
  /<script[\s\S]*?<\/script>/gi,     // JSON-LD scripts
  /<style[\s\S]*?<\/style>/gi,       // CSS
  /<!--[\s\S]*?-->/g,                // HTML comments
  /\bFTND\b/g, /\bCBT\b/g, /\bNRT\b/g, /\bCOPD\b/g,
  /\(AVE\)/g, /\bAVE\)/g,            // chỉ protect "(AVE)" trong giải thích
  /\bChampix\b/g, /\bVarenicline\b/g, /\bBupropion\b/g, /\bWellbutrin\b/g, /\bNicorette\b/g,
  /\bSol\b/g,                        // brand
  /\bQ-Day\b/g,                      // brand
  /\bSổ Hành Trình\b/g,              // Sol-specific
  /\bVoice của Khang\b/g,            // already correct
  /\bKhang chia sẻ qua Voice\b/g,
];

// ─── REPLACEMENTS ─────────────────────────────────────────────────────
// MULTI-WORD PHRASES — phải match TRƯỚC single words (order matters)
const RULES_MULTIWORD = [
  // CLEANUP DUPLICATES (Pass 2) — phải match đầu tiên
  { from: /\bKỹ năng kỹ năng\b/gi, to: 'Kỹ năng', label: 'CLEANUP: Kỹ năng dup' },
  { from: /\bAVE Phục hồi\b/g, to: 'Phục hồi sau lỡ điếu (AVE)', label: 'CLEANUP: AVE order' },
  { from: /\bAVE phục hồi\b/g, to: 'phục hồi sau lỡ điếu (AVE)', label: 'CLEANUP: AVE order lower' },
  { from: /\bSkill này\b/g, to: 'Kỹ năng này', label: 'CLEANUP: Skill này' },
  { from: /\bskill này\b/g, to: 'kỹ năng này', label: 'CLEANUP: skill này' },
  { from: /\btriệu chứng cai \(triệu chứng cai\)\b/gi, to: 'triệu chứng cai', label: 'CLEANUP: withdrawal dup' },

  // NEW TERMS (Pass 2 add)
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
  { from: /\btapering phase\b/g, to: 'giai đoạn giảm dần', label: 'tapering phase' },
  { from: /\bTapering\b/g, to: 'Giảm dần', label: 'Tapering' },
  { from: /\bemotional crisis\b/gi, to: 'khủng hoảng cảm xúc', label: 'emotional crisis' },
  { from: /\bemotion-specific\b/gi, to: 'theo từng cảm xúc', label: 'emotion-specific' },
  { from: /\bperfect storm\b/gi, to: '"bão hoàn hảo"', label: 'perfect storm' },
  { from: /\bpeer testimonials?\b/gi, to: 'lời chia sẻ từ anh em', label: 'peer testimonial' },
  { from: /\bpeer supports?\b/gi, to: 'hỗ trợ từ anh em', label: 'peer support' },
  { from: /\bAMA hàng tháng\b/g, to: 'Hỏi-Đáp hàng tháng (AMA)', label: 'AMA monthly' },
  { from: /\bcohort\b/g, to: 'nhóm cohort', label: 'cohort' },
  { from: /\bMaintenance stage transition\b/gi, to: 'chuyển sang giai đoạn duy trì', label: 'Maintenance stage transition' },
  { from: /\bAction stage\b/gi, to: 'giai đoạn đang cai', label: 'Action stage' },
  { from: /\bneural pathways?\b/gi, to: 'đường dẫn thần kinh', label: 'neural pathway' },
  { from: /\bprefrontal cortex function\b/gi, to: 'chức năng vỏ não trán', label: 'prefrontal cortex' },
  { from: /\bdanh tính reinforcement\b/gi, to: 'củng cố danh tính', label: 'danh tính reinforcement leak' },

  // Stress / Social
  { from: /\bstress event lớn\b/g, to: 'sự kiện căng thẳng lớn', label: 'stress event lớn' },
  { from: /\bStress events?\b/g, to: 'Sự kiện căng thẳng', label: 'Stress event' },
  { from: /\bstress events?\b/g, to: 'sự kiện căng thẳng', label: 'stress event' },
  { from: /\bSocial triggers?\b/g, to: 'Tình huống xã hội gây thèm', label: 'Social trigger' },
  { from: /\bsocial triggers?\b/g, to: 'tình huống xã hội gây thèm', label: 'social trigger' },

  // Plan B / Recovery
  { from: /\bPlan B if-then\b/g, to: 'Kế hoạch B "nếu-thì"', label: 'Plan B if-then' },
  { from: /\bPlan B\b/g, to: 'Kế hoạch B', label: 'Plan B' },
  { from: /\bif-then plan(s|ning)?\b/gi, to: 'kế hoạch "nếu-thì"', label: 'if-then plan' },
  { from: /\bAVE Recovery\b/g, to: 'Phục hồi sau lỡ điếu', label: 'AVE Recovery' },
  { from: /\bRecovery 60 phút\b/g, to: 'Phục hồi 60 phút', label: 'Recovery 60 phút' },

  // High-Risk
  { from: /\bHigh-Risk Situations?\b/g, to: 'Tình huống nguy cơ cao', label: 'High-Risk Situation' },
  { from: /\bhigh-risk situations?\b/g, to: 'tình huống nguy cơ cao', label: 'high-risk situation' },

  // Identity / Self
  { from: /\bIdentity Reinforcement\b/g, to: 'Củng cố bản thân mới', label: 'Identity Reinforcement' },
  { from: /\bIdentity (loss|change)\b/g, to: 'Thay đổi danh tính', label: 'Identity change' },
  { from: /\bSelf-?efficacy\b/gi, to: 'sự tự tin cai thuốc', label: 'self-efficacy' },
  { from: /\bSelf-?talk\b/gi, to: 'tự nói chuyện với mình', label: 'self-talk' },
  { from: /\bSelf-?monitoring\b/gi, to: 'tự theo dõi', label: 'self-monitoring' },
  { from: /\bSelf-?regulation\b/gi, to: 'tự điều tiết', label: 'self-regulation' },

  // Community / Accountability
  { from: /\bCommunity \+ Accountability Long-term\b/g, to: 'Cộng đồng + Trách nhiệm dài hạn', label: 'Community+Accountability' },
  { from: /\bCommunity Long-term\b/g, to: 'Cộng đồng dài hạn', label: 'Community Long-term' },
  { from: /\bAccountability Long-term\b/g, to: 'Trách nhiệm dài hạn', label: 'Accountability Long-term' },
  { from: /\bAccountability partners?\b/gi, to: 'bạn đồng hành chia trách nhiệm', label: 'accountability partner' },

  // Long-term mindset
  { from: /\bLong-term mindset\b/gi, to: 'Tư duy dài hạn', label: 'Long-term mindset' },
  { from: /\bLong-term thinking\b/gi, to: 'Suy nghĩ dài hạn', label: 'Long-term thinking' },
  { from: /\bMindset shift\b/gi, to: 'Thay đổi tư duy', label: 'Mindset shift' },
  { from: /\bGrowth mindset\b/gi, to: 'Tư duy phát triển', label: 'Growth mindset' },

  // Reward / Cue
  { from: /\bReward circuit reset\b/gi, to: 'Đặt lại hệ thống tưởng thưởng', label: 'Reward circuit reset' },
  { from: /\bReward circuits?\b/gi, to: 'hệ thống tưởng thưởng', label: 'reward circuit' },
  { from: /\bReward systems?\b/gi, to: 'hệ thống tưởng thưởng', label: 'reward system' },
  { from: /\bCue exposure\b/gi, to: 'tiếp xúc với tín hiệu thèm', label: 'cue exposure' },
  { from: /\bCue reactivity\b/gi, to: 'phản ứng với tín hiệu thèm', label: 'cue reactivity' },
  { from: /\bcues?\b(?!\s*=)/gi, to: 'tín hiệu thèm', label: 'cue' },

  // Coping / Behavior
  { from: /\bCoping (strategy|strategies|skills?|mechanisms?)\b/gi, to: 'cách ứng phó', label: 'coping strategy' },
  { from: /\bBehavioral patterns?\b/gi, to: 'thói quen hành vi', label: 'behavioral pattern' },
  { from: /\bBehavior(al)? change\b/gi, to: 'thay đổi hành vi', label: 'behavior change' },
  { from: /\bAction plans?\b/gi, to: 'kế hoạch hành động', label: 'action plan' },
  { from: /\bEmotional regulation\b/gi, to: 'điều tiết cảm xúc', label: 'emotional regulation' },
  { from: /\bEmotion regulation\b/gi, to: 'điều tiết cảm xúc', label: 'emotion regulation' },
  { from: /\bMental rehearsal\b/gi, to: 'tập dượt trong đầu', label: 'mental rehearsal' },
  { from: /\bCognitive restructuring\b/gi, to: 'sắp xếp lại suy nghĩ', label: 'cognitive restructuring' },
  { from: /\bGoal-?setting\b/gi, to: 'đặt mục tiêu', label: 'goal-setting' },

  // Stages of Change
  { from: /\bStages of Change\b/g, to: 'Các giai đoạn thay đổi', label: 'Stages of Change' },
  { from: /\bPre-?contemplation\b/gi, to: 'chưa nghĩ tới chuyện cai', label: 'Pre-contemplation' },
  { from: /\bContemplation\b/g, to: 'đang cân nhắc cai', label: 'Contemplation' },
  { from: /\bPreparation stage\b/gi, to: 'giai đoạn chuẩn bị cai', label: 'Preparation stage' },
  { from: /\bMaintenance stage\b/gi, to: 'giai đoạn duy trì', label: 'Maintenance stage' },
  { from: /\bTermination stage\b/gi, to: 'giai đoạn tự do hoàn toàn', label: 'Termination stage' },

  // Mindfulness / CBT supporting terms
  { from: /\bMindfulness practice\b/gi, to: 'thực hành chánh niệm', label: 'mindfulness practice' },
  { from: /\bMindfulness meditation\b/gi, to: 'thiền chánh niệm', label: 'mindfulness meditation' },
  { from: /\bMindfulness-based\b/gi, to: 'dựa trên chánh niệm', label: 'mindfulness-based' },

  // Misc multi-word
  { from: /\bIdentity loss\b/gi, to: 'mất danh tính', label: 'identity loss' },
  { from: /\bCompensatory smoking\b/gi, to: 'hút bù', label: 'compensatory smoking' },
  { from: /\bStimulus control\b/gi, to: 'kiểm soát kích thích', label: 'stimulus control' },
  { from: /\bSocial smoking\b/gi, to: 'hút khi tụ tập', label: 'social smoking' },
  { from: /\bSocial pressure\b/gi, to: 'áp lực xã hội', label: 'social pressure' },
  { from: /\bSocial support\b/gi, to: 'sự ủng hộ từ xã hội', label: 'social support' },
];

// SINGLE WORDS — match SAU multi-word
const RULES_SINGLE = [
  // Cấp 1 — TUYỆT ĐỐI VIỆT HOÁ
  { from: /\bSkill (\d+)\b/g, to: 'Kỹ năng $1', label: 'Skill N' },
  { from: /\bSkills?\b/g, to: 'Kỹ năng', label: 'Skill' },
  { from: /\bskills?\b(?!\s*=)/g, to: 'kỹ năng', label: 'skill' },
  { from: /\bTriggers?\b/g, to: 'Tình huống thèm', label: 'Trigger' },
  { from: /\btriggers?\b/gi, to: 'tình huống thèm', label: 'trigger' },
  { from: /\bCravings?\b/g, to: 'Cơn thèm', label: 'Craving' },
  { from: /\bcravings?\b/gi, to: 'cơn thèm', label: 'craving' },
  { from: /\bWithdrawals?\b/g, to: 'Triệu chứng cai', label: 'Withdrawal' },
  { from: /\bwithdrawals?\b/gi, to: 'triệu chứng cai', label: 'withdrawal' },
  { from: /\bRelapses?\b/g, to: 'Tái nghiện', label: 'Relapse' },
  { from: /\brelapses?\b/gi, to: 'tái nghiện', label: 'relapse' },
  { from: /\bLapses?\b/g, to: 'Lỡ điếu', label: 'Lapse' },
  { from: /\blapses?\b/gi, to: 'lỡ điếu', label: 'lapse' },
  { from: /\bCessation\b/g, to: 'Cai thuốc', label: 'Cessation' },
  { from: /\bcessation\b/g, to: 'cai thuốc', label: 'cessation' },
  { from: /\bAbstinence\b/g, to: 'Kiêng dứt', label: 'Abstinence' },
  { from: /\babstinence\b/g, to: 'kiêng dứt', label: 'abstinence' },
  { from: /\bWillpower\b/g, to: 'Ý chí', label: 'Willpower' },
  { from: /\bwillpower\b/g, to: 'ý chí', label: 'willpower' },
  { from: /\bCold turkey\b/g, to: 'Bỏ đột ngột', label: 'Cold turkey' },
  { from: /\bcold turkey\b/g, to: 'bỏ đột ngột', label: 'cold turkey' },

  // Cấp 1.5 — Identity, Recovery, Community
  { from: /\bIdentity\b/g, to: 'Danh tính', label: 'Identity' },
  { from: /\bidentity\b/g, to: 'danh tính', label: 'identity' },
  { from: /\bRecovery\b/g, to: 'Phục hồi', label: 'Recovery' },
  { from: /\brecovery\b/g, to: 'phục hồi', label: 'recovery' },
  { from: /\bCommunity\b/g, to: 'Cộng đồng', label: 'Community' },
  { from: /\bAccountability\b/g, to: 'Trách nhiệm', label: 'Accountability' },
  { from: /\bMindset\b/g, to: 'Tư duy', label: 'Mindset' },
  { from: /\bmindset\b/g, to: 'tư duy', label: 'mindset' },
  { from: /\bReward\b/g, to: 'Phần thưởng', label: 'Reward' },
  { from: /\breward\b(?!\s*=)/g, to: 'phần thưởng', label: 'reward' },
  { from: /\bMindfulness\b/g, to: 'Chánh niệm', label: 'Mindfulness' },
  { from: /\bmindfulness\b/g, to: 'chánh niệm', label: 'mindfulness' },

  // Cấp 1 misc
  { from: /\bExit reason(s)?\b/gi, to: 'lý do bỏ', label: 'exit reason' },
  { from: /\bLong-term\b/g, to: 'Dài hạn', label: 'Long-term' },
  { from: /\blong-term\b/g, to: 'dài hạn', label: 'long-term' },
  { from: /\bShort-term\b/g, to: 'Ngắn hạn', label: 'Short-term' },
  { from: /\bshort-term\b/g, to: 'ngắn hạn', label: 'short-term' },
  { from: /\bif-then\b/gi, to: '"nếu-thì"', label: 'if-then' },
];

// ─── SMART REPLACE ────────────────────────────────────────────────────
function smartReplace(html, multiWordRules, singleRules) {
  // Step 1: Protect URLs, scripts, styles, comments, clinical/brand acronyms
  const protectedRegions = [];
  let working = html;
  for (const pattern of PROTECT_PATTERNS) {
    working = working.replace(pattern, (match) => {
      const idx = protectedRegions.length;
      protectedRegions.push(match);
      return `__SOLPROTECTv2_${idx}__`;
    });
  }

  // Step 2: Apply multi-word phrases FIRST
  const counts = {};
  for (const rule of [...multiWordRules, ...singleRules]) {
    const before = working;
    working = working.replace(rule.from, rule.to);
    const matches = (before.match(rule.from) || []).length;
    if (matches > 0) {
      counts[rule.label] = (counts[rule.label] || 0) + matches;
    }
  }

  // Step 3: Restore protected regions
  for (let i = protectedRegions.length - 1; i >= 0; i--) {
    working = working.replace(`__SOLPROTECTv2_${i}__`, protectedRegions[i]);
  }

  return { html: working, counts };
}

// ─── MAIN ─────────────────────────────────────────────────────────────
function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--real');
  const priority = args.includes('--priority');
  const fileArg = args.find(a => a.startsWith('--file='));
  const reportArg = args.find(a => a.startsWith('--report='));

  let files;
  if (fileArg) {
    files = [fileArg.replace('--file=', '')];
  } else if (priority) {
    files = PRIORITY_FILES;
  } else {
    files = fs.readdirSync(ARTICLES_DIR)
      .filter(f => f.endsWith('.html') && !f.includes('.bak'));
  }

  console.log(`\n${'━'.repeat(72)}`);
  console.log(`  BATCH VIETNAMESE V2 — Việt hoá tối đa + Dân dã`);
  console.log(`  Mode: ${dryRun ? '🔍 DRY-RUN' : '⚡ REAL'}`);
  console.log(`  Files: ${files.length}`);
  console.log(`${'━'.repeat(72)}\n`);

  const stats = {
    totalFiles: 0,
    changedFiles: 0,
    totalReplacements: 0,
    byTerm: {},
    byFile: {},
  };

  const auditLines = [];
  auditLines.push(`# AUDIT VIETNAMESE V2 — ${new Date().toISOString().slice(0, 10)}`);
  auditLines.push(``);
  auditLines.push(`Mode: ${dryRun ? 'DRY-RUN' : 'REAL'}  |  Files scanned: ${files.length}`);
  auditLines.push(``);

  for (const fileName of files) {
    const filePath = path.join(ARTICLES_DIR, fileName);
    if (!fs.existsSync(filePath)) {
      console.log(`✗ NOT FOUND: ${fileName}`);
      continue;
    }
    stats.totalFiles++;

    const original = fs.readFileSync(filePath, 'utf-8');
    const { html: replaced, counts } = smartReplace(original, RULES_MULTIWORD, RULES_SINGLE);

    const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

    if (replaced !== original && totalCount > 0) {
      stats.changedFiles++;
      stats.totalReplacements += totalCount;
      stats.byFile[fileName] = totalCount;

      for (const [term, n] of Object.entries(counts)) {
        stats.byTerm[term] = (stats.byTerm[term] || 0) + n;
      }

      console.log(`✓ ${fileName}  (${totalCount} fixes)`);
      Object.entries(counts).slice(0, 5).forEach(([term, n]) => {
        console.log(`    [${term}] × ${n}`);
      });
      if (Object.keys(counts).length > 5) {
        console.log(`    ... (+${Object.keys(counts).length - 5} more rules)`);
      }

      // Audit lines per file
      auditLines.push(`### ${fileName}`);
      auditLines.push(`Total: ${totalCount} fixes`);
      for (const [term, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
        auditLines.push(`- \`${term}\` × ${n}`);
      }
      auditLines.push(``);

      if (!dryRun) {
        fs.writeFileSync(filePath + '.bak4', original, 'utf-8');
        fs.writeFileSync(filePath, replaced, 'utf-8');
      }
    }
  }

  // Summary
  console.log(`\n${'━'.repeat(72)}`);
  console.log(`✓ SUMMARY: ${stats.changedFiles}/${stats.totalFiles} files, ${stats.totalReplacements} total replacements`);
  console.log(`\n📊 Top 10 terms replaced:`);
  Object.entries(stats.byTerm)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([term, n], i) => {
      console.log(`  ${i + 1}. ${term.padEnd(40)} × ${n}`);
    });
  console.log(`\n📋 Top 10 files most-changed:`);
  Object.entries(stats.byFile)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([fn, n], i) => {
      console.log(`  ${i + 1}. ${fn.padEnd(55)} × ${n}`);
    });
  console.log(`${'━'.repeat(72)}`);

  // Write audit report
  auditLines.unshift(``);
  auditLines.unshift(`Total replacements: ${stats.totalReplacements}`);
  auditLines.unshift(`Files changed: ${stats.changedFiles}/${stats.totalFiles}`);
  auditLines.unshift(``);
  auditLines.splice(2, 0, ``, `## Top 10 terms replaced`);
  const top10 = Object.entries(stats.byTerm).sort((a, b) => b[1] - a[1]).slice(0, 10);
  top10.forEach(([term, n], i) => {
    auditLines.splice(4 + i, 0, `${i + 1}. \`${term}\` × ${n}`);
  });
  auditLines.splice(4 + top10.length, 0, ``, `## Top 10 files most-changed`);
  const topFiles = Object.entries(stats.byFile).sort((a, b) => b[1] - a[1]).slice(0, 10);
  topFiles.forEach(([fn, n], i) => {
    auditLines.splice(5 + top10.length + i, 0, `${i + 1}. \`${fn}\` × ${n}`);
  });
  auditLines.splice(5 + top10.length + topFiles.length, 0, ``, `---`, ``, `## Per-file detail`);

  const reportPath = reportArg
    ? reportArg.replace('--report=', '')
    : path.join(PROJECT_ROOT, 'docs', 'VIETNAMESE_FIX_V2_AUDIT.md');
  fs.writeFileSync(reportPath, auditLines.join('\n'), 'utf-8');
  console.log(`\n📝 Audit report → ${reportPath}`);

  if (dryRun) {
    console.log(`\n💡 Để execute thật: thêm flag --real`);
  } else {
    console.log(`\n✓ DONE. Backup .bak4 đã tạo cho mỗi file changed.`);
    console.log(`📋 Next: re-publish wiki articles qua publish-*.js scripts.`);
  }
  console.log(``);
}

main();
      stats.totalReplacements += totalCount;
      stats.byFile[fileName] = totalCount;

      for (const [term, n] of Object.entries(counts)) {
        stats.byTerm[term] = (stats.byTerm[term] || 0) + n;
      }

      console.log(`✓ ${fileName}  (${totalCount} fixes)`);
      Object.entries(counts).slice(0, 5).forEach(([term, n]) => {
        console.log(`    [${term}] × ${n}`);
      });
      if (Object.keys(counts).length > 5) {
        console.log(`    ... (+${Object.keys(counts).length - 5} more rules)`);
      }

      auditLines.push(`### ${fileName}`);
      auditLines.push(`Total: ${totalCount} fixes`);
      for (const [term, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
        auditLines.push(`- \`${term}\` × ${n}`);
      }
      auditLines.push(``);

      if (!dryRun) {
        fs.writeFileSync(filePath + '.bak4', original, 'utf-8');
        fs.writeFileSync(filePath, replaced, 'utf-8');
      }
    }
  }

  console.log(`\n${'━'.repeat(72)}`);
  console.log(`✓ SUMMARY: ${stats.changedFiles}/${stats.totalFiles} files, ${stats.totalReplacements} total replacements`);
  console.log(`\n📊 Top 10 terms replaced:`);
  Object.entries(stats.byTerm).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([term, n], i) => {
    console.log(`  ${i + 1}. ${term.padEnd(40)} × ${n}`);
  });
  console.log(`\n📋 Top 10 files most-changed:`);
  Object.entries(stats.byFile).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([fn, n], i) => {
    console.log(`  ${i + 1}. ${fn.padEnd(55)} × ${n}`);
  });
  console.log(`${'━'.repeat(72)}`);

  const reportPath = reportArg ? reportArg.replace('--report=', '') : path.join(PROJECT_ROOT, 'docs', 'VIETNAMESE_FIX_V2_AUDIT.md');
  fs.writeFileSync(reportPath, auditLines.join('\n'), 'utf-8');
  console.log(`\n📝 Audit report → ${reportPath}`);

  if (dryRun) {
    console.log(`\n💡 Để execute thật: thêm flag --real`);
  } else {
    console.log(`\n✓ DONE. Backup .bak4 đã tạo cho mỗi file changed.`);
  }
  console.log(``);
}

main();
