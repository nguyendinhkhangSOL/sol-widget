// admin/src/lib/zaloLinter.ts
//
// Linter cho ZNS template — scan từ ngữ cấm theo policy Zalo + Sol guidelines.
// Trả về danh sách issues + cấp độ + suggestion.

export type LintLevel = 'CRITICAL' | 'WARNING' | 'INFO';

export interface LintIssue {
  level: LintLevel;
  text: string;           // từ bị detect
  position: number;       // index trong string
  suggestion?: string;    // gợi ý thay thế
  reason: string;         // tại sao
}

interface LintRule {
  pattern: RegExp;
  level: LintLevel;
  suggestion?: string;
  reason: string;
}

// ─── Danh sách rule (priority CRITICAL → WARNING → INFO) ──────────────
const RULES: LintRule[] = [
  // CRITICAL — Y tế, gây reject 100%
  { pattern: /\bcai thuốc(\s*lá)?\b/gi, level: 'CRITICAL', suggestion: 'hành trình thay đổi thói quen', reason: 'Zalo cấm từ "cai thuốc lá" — coi là y tế. Sol nên định vị là habit tracker.' },
  { pattern: /\bbỏ thuốc(\s*lá)?\b/gi, level: 'CRITICAL', suggestion: 'chuyển sang thói quen mới', reason: 'Zalo cấm từ "bỏ thuốc" — y tế.' },
  { pattern: /\bthèm thuốc\b/gi, level: 'CRITICAL', suggestion: 'cơn thèm / moment khó', reason: 'Cấm từ "thèm thuốc".' },
  { pattern: /\bnicotin?e?\b/gi, level: 'CRITICAL', suggestion: 'chất gây nghiện (hoặc bỏ)', reason: 'Cấm tên hoạt chất.' },
  { pattern: /\bphổi\b/gi, level: 'CRITICAL', suggestion: 'cơ thể', reason: 'Cấm tên cơ quan/bệnh.' },
  { pattern: /\b(điều trị|chữa)\b/gi, level: 'CRITICAL', suggestion: 'hỗ trợ / đồng hành', reason: 'Cấm từ y tế "điều trị/chữa".' },
  { pattern: /\b(ung thư|tổn thương|bệnh)\b/gi, level: 'CRITICAL', suggestion: '(bỏ — không gợi)', reason: 'Cấm gợi ý bệnh tật.' },
  { pattern: /\b(tim mạch|huyết áp|cholesterol)\b/gi, level: 'CRITICAL', suggestion: 'sự thay đổi cơ thể', reason: 'Cấm chỉ số y khoa.' },
  { pattern: /\b(champix|varenicline|bupropion)\b/gi, level: 'CRITICAL', suggestion: 'tham khảo bác sĩ', reason: 'Cấm tên thuốc cụ thể.' },

  // WARNING — có thể reject
  { pattern: /\bsức kh(ỏ|o)e\b/gi, level: 'WARNING', suggestion: 'cảm giác / năng lượng', reason: 'Từ "sức khỏe" có thể bị review nặng. Cân nhắc.' },
  { pattern: /\b(hồi phục|lành lại)\b/gi, level: 'WARNING', suggestion: 'điều chỉnh / cải thiện', reason: 'Từ "hồi phục" gợi y tế. Cân nhắc.' },
  { pattern: /\b(khuyến mãi|giảm giá|miễn phí|free)\b/gi, level: 'WARNING', suggestion: '—', reason: 'Từ quảng cáo yêu cầu Tag 3 (Promotion) — Sol đang dùng Tag 2.' },
  { pattern: /%/g, level: 'WARNING', suggestion: '—', reason: 'Ký tự % thường gắn với khuyến mãi — yêu cầu Tag 3.' },
  { pattern: /\b(click ngay|mua ngay|nhận ngay|đăng ký ngay)\b/gi, level: 'WARNING', suggestion: 'CTA cụ thể hơn (Mở Sol, Nghe Khang)', reason: 'Tone quảng cáo bị reject Tag 1/2.' },

  // INFO — best practice, không reject nhưng nên fix
  { pattern: /\b(bit\.ly|tinyurl\.com|t\.co|goo\.gl)\b/gi, level: 'INFO', suggestion: 'bothuocla.sol.vn/...', reason: 'Link rút gọn bị Zalo CẤM. Dùng URL đầy đủ.' },
  { pattern: /(facebook\.com|fb\.com|tiktok\.com|instagram\.com|youtube\.com)/gi, level: 'INFO', suggestion: 'bothuocla.sol.vn / sol.vn', reason: 'Link MXH bị Zalo cấm.' },
  // Detect không dấu tiếng Việt (heuristic: nếu có chuỗi 4+ chữ thường không dấu trông giống Việt)
  { pattern: /\b(cai thuoc|bo thuoc|them thuoc|suc khoe|cot moc)\b/gi, level: 'INFO', suggestion: 'Có dấu tiếng Việt', reason: 'Zalo yêu cầu tiếng Việt có dấu.' },
];

/**
 * Lint 1 đoạn text. Trả về list issues sorted theo level (CRITICAL trước).
 */
export function lintZNSText(text: string): LintIssue[] {
  const issues: LintIssue[] = [];
  for (const rule of RULES) {
    const matches = text.matchAll(rule.pattern);
    for (const m of matches) {
      if (m.index === undefined) continue;
      issues.push({
        level: rule.level,
        text: m[0],
        position: m.index,
        suggestion: rule.suggestion,
        reason: rule.reason,
      });
    }
  }
  // Sort: CRITICAL > WARNING > INFO, then by position
  const order: Record<LintLevel, number> = { CRITICAL: 0, WARNING: 1, INFO: 2 };
  return issues.sort((a, b) => order[a.level] - order[b.level] || a.position - b.position);
}

/**
 * Kiểm tra template có pass review không (không có CRITICAL issue).
 */
export function canSubmitTemplate(text: string): boolean {
  const issues = lintZNSText(text);
  return !issues.some(i => i.level === 'CRITICAL');
}

/**
 * Count ký tự template (cho cảnh báo > 400 limit).
 */
export function countChars(title: string, body: string): { total: number; title: number; body: number } {
  return {
    total: title.length + body.length,
    title: title.length,
    body: body.length,
  };
}

/**
 * Detect tham số động {name}, {day}, ... trong text.
 */
export function extractParams(text: string): string[] {
  const matches = text.matchAll(/\{(\w+)\}/g);
  const params = new Set<string>();
  for (const m of matches) {
    params.add(m[1]);
  }
  return Array.from(params);
}
