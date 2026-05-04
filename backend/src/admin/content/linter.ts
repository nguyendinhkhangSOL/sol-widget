// backend/src/admin/content/linter.ts
// Lint engine — check anti-pattern theo MESSAGING_PLAYBOOK Phần 5.
// Dùng trong preview API để cảnh báo Khang trước khi save.
//
// Severity:
//   high   — block-worthy (vd từ tiếng Anh không trong whitelist)
//   medium — warning (câu dài, exclamation dồn)
//   low    — gợi ý (emoji nhiều)

export interface LintWarning {
  severity: 'high' | 'medium' | 'low';
  message: string;
  excerpt?: string;
}

// Từ tiếng Anh nên tránh trong content cho người 45+ Việt
const VN_45_BLACKLIST = [
  'milestone', 'journey', 'comeback', 'commit', 'review', 'hook',
  'session', 'support', 'feature', 'update', 'feedback', 'launch',
  'workout', 'mindset', 'goal', 'habit', 'tracker', 'streak',
  'commitment', 'mission', 'vision', 'target', 'achievement',
];

// Whitelist — từ TA acceptable (đã quen với người Việt 45+ hoặc không thay được)
const WHITELIST = new Set([
  'Plan B', 'OK', 'Day', 'CO', 'NHS', 'CDC', 'WHO', 'BMJ',
  'Mayo', 'Hughes', 'Brody', 'Cosgrove', 'Lally', 'Stanford',
  'PET', 'GABA', 'REM', 'Allen Carr', 'Sol',
]);

// Vietnamese sentence splitter — giữ "." sau số (vd "30.5%")
function splitSentences(text: string): string[] {
  // Tạm thời thay "X.Y" (số thập phân) thành placeholder
  const placeholder = '___DOT___';
  let safe = text.replace(/(\d)\.(\d)/g, `$1${placeholder}$2`);

  const sentences = safe.split(/[.!?。]+/).map((s) => s.trim()).filter(Boolean);
  return sentences.map((s) => s.replace(new RegExp(placeholder, 'g'), '.'));
}

function countWords(s: string): number {
  return s.split(/\s+/).filter(Boolean).length;
}

function hasNonAscii(s: string): boolean {
  return /[^\x00-\x7F]/.test(s);
}

/**
 * Lint nội dung tin nhắn theo MESSAGING_PLAYBOOK.
 * Trả về list warning sorted theo severity desc.
 */
export function lintContent(text: string, context: 'title' | 'body' = 'body'): LintWarning[] {
  const warnings: LintWarning[] = [];
  if (!text || text.trim().length === 0) {
    return [{ severity: 'high', message: 'Nội dung rỗng' }];
  }

  // ── Length checks ─────────────────────────────────────────────────────
  if (context === 'title' && text.length > 120) {
    warnings.push({
      severity: 'medium',
      message: `Title dài ${text.length} ký tự (>120). Push notification có thể bị truncate.`,
    });
  }
  if (context === 'body' && text.length > 2000) {
    warnings.push({
      severity: 'high',
      message: `Body dài ${text.length} ký tự (>2000). Quá dài cho push.`,
    });
  }

  // ── Câu > 20 từ ──────────────────────────────────────────────────────
  const sentences = splitSentences(text);
  sentences.forEach((sent, i) => {
    const wc = countWords(sent);
    if (wc > 20) {
      warnings.push({
        severity: 'medium',
        message: `Câu ${i + 1} dài ${wc} từ (>20)`,
        excerpt: sent.substring(0, 80) + (sent.length > 80 ? '…' : ''),
      });
    }
  });

  // ── Từ tiếng Anh blacklist ───────────────────────────────────────────
  const englishWords = text.match(/\b[a-zA-Z]{4,}\b/g) || [];
  const seenBlacklist = new Set<string>();
  for (const word of englishWords) {
    const lower = word.toLowerCase();
    // Skip nếu trong whitelist
    if ([...WHITELIST].some((w) => w.toLowerCase() === lower)) continue;
    // Skip nếu là từ Việt không dấu (heuristic: từ ngắn < 5 ký tự thường là Việt vd "thua")
    if (word.length < 4) continue;
    if (VN_45_BLACKLIST.includes(lower) && !seenBlacklist.has(lower)) {
      seenBlacklist.add(lower);
      warnings.push({
        severity: 'high',
        message: `"${word}" — từ tiếng Anh xen kẽ, không hợp với người 45+`,
      });
    }
  }

  // ── Exclamation count ────────────────────────────────────────────────
  const exCount = (text.match(/!/g) || []).length;
  if (exCount > 1) {
    warnings.push({
      severity: 'medium',
      message: `${exCount} dấu "!" (>1) — playbook khuyên tối đa 1`,
    });
  }

  // ── Emoji count ──────────────────────────────────────────────────────
  // Approximate emoji match — không hoàn hảo nhưng good enough
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{1F600}-\u{1F64F}]/gu;
  const emojiCount = (text.match(emojiRegex) || []).length;
  if (emojiCount > 1) {
    warnings.push({
      severity: 'low',
      message: `${emojiCount} emoji (>1) — playbook khuyên tối đa 1`,
    });
  }

  // ── Double-space + leading/trailing whitespace ───────────────────────
  if (/\s{2,}/.test(text)) {
    warnings.push({ severity: 'low', message: 'Có khoảng trắng đôi' });
  }
  if (text !== text.trim()) {
    warnings.push({ severity: 'low', message: 'Có whitespace đầu/cuối' });
  }

  // ── Vietnamese check (body must contain Vietnamese chars) ────────────
  if (context === 'body' && !hasNonAscii(text)) {
    warnings.push({
      severity: 'high',
      message: 'Body không có ký tự tiếng Việt — có thể viết sai ngôn ngữ?',
    });
  }

  // ── Sort by severity desc ────────────────────────────────────────────
  const order = { high: 3, medium: 2, low: 1 };
  warnings.sort((a, b) => order[b.severity] - order[a.severity]);

  return warnings;
}

/**
 * Render preview text với mock user → áp dụng personalize giống worker.ts.
 */
import { personalize, type PersonalizationCtx } from '../../utils/personalize';

export interface MockUserPreview {
  name?: string;
  pronouns?: string;
  assistantName?: string;
  quitReasons?: string[];
  topTriggers?: string[];
  age?: number;
  gender?: 'male' | 'female';
  region?: 'north' | 'central' | 'south';
}

export function renderPreview(
  text: string,
  mockUser: MockUserPreview,
  dayNumber: number = 1,
): string {
  const ctx: PersonalizationCtx = {
    name: mockUser.name ?? 'Khang',
    pronouns: mockUser.pronouns ?? 'anh',
    assistantName: mockUser.assistantName ?? 'Sol Đồng hành',
    quitReasons: mockUser.quitReasons ?? ['vì cu Tí'],
    topTriggers: mockUser.topTriggers ?? ['nhậu'],
  };
  let rendered = personalize(text, ctx);
  rendered = rendered.replace(/\{day\}/g, String(dayNumber));
  return rendered;
}
