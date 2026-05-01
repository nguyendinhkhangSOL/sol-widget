// backend/src/admin/audit/typoDictionary.ts
//
// Bộ từ điển typo phổ biến tiếng Việt cho user 45+. Chia 2 nhóm:
//   1. Lỗi mất dấu (gõ vội không bỏ dấu) — vd "khong" → "không"
//   2. Lỗi chính tả Việt phổ biến — vd "trị" vs "chị", "sữa" vs "sửa"
//
// Khi audit, mỗi lỗi pattern → suggest correction.
// KHÔNG dùng lib spell check vì chưa có lib Việt nào đủ chính xác cho
// admin tool. Tự maintain dictionary chính xác hơn cho domain SOL.

export interface TypoRule {
  /** Pattern tìm trong text (case-insensitive với word boundary) */
  wrong: RegExp;
  /** Gợi ý sửa */
  suggest: string;
  /** Mức độ — 'high' = chắc chắn sai, 'medium' = có thể sai context */
  severity: 'high' | 'medium';
  /** Chú thích cho admin */
  note?: string;
}

/**
 * Lỗi phổ biến trong content SOL. Mở rộng dần khi gặp pattern mới.
 * Word boundary \b giúp tránh false positive (vd "không" sẽ không match "khôn").
 */
export const TYPO_RULES: TypoRule[] = [
  // ── 1. Mất dấu phổ biến ──────────────────────────────────
  { wrong: /\bkhong\b/gi, suggest: 'không', severity: 'high', note: 'Mất dấu sắc' },
  { wrong: /\bduoc\b/gi, suggest: 'được', severity: 'high', note: 'Mất dấu' },
  { wrong: /\bnguoi\b/gi, suggest: 'người', severity: 'high' },
  { wrong: /\bnhung\b/gi, suggest: 'những / nhưng', severity: 'medium', note: 'Tuỳ context' },
  { wrong: /\bvoi\b/gi, suggest: 'với', severity: 'medium' },
  { wrong: /\bcua\b/gi, suggest: 'của', severity: 'medium' },
  { wrong: /\bthuoc\b/gi, suggest: 'thuốc', severity: 'high' },
  { wrong: /\bcuoc\b/gi, suggest: 'cuộc', severity: 'medium' },
  { wrong: /\bsong\b/gi, suggest: 'sống / sông', severity: 'medium', note: 'Tuỳ context' },

  // ── 2. Chính tả Việt phổ biến ────────────────────────────
  { wrong: /\bxử lí\b/gi, suggest: 'xử lý', severity: 'medium', note: 'Chuẩn từ điển VN' },
  { wrong: /\bthực thi\b/gi, suggest: 'thi hành / triển khai', severity: 'medium' },
  { wrong: /\btriễn khai\b/gi, suggest: 'triển khai', severity: 'high' },
  { wrong: /\bgian dối\b/gi, suggest: 'gian dối', severity: 'medium' },
  { wrong: /\bsữa chữa\b/gi, suggest: 'sửa chữa', severity: 'high', note: 'sữa = milk, sửa = fix' },
  { wrong: /\bxữ lý\b/gi, suggest: 'xử lý', severity: 'high' },
  { wrong: /\bxen kẽ\b/gi, suggest: 'xen kẽ', severity: 'medium' },
  { wrong: /\bxuyên xuốt\b/gi, suggest: 'xuyên suốt', severity: 'high' },
  { wrong: /\bsuất xắc\b/gi, suggest: 'xuất sắc', severity: 'high' },
  { wrong: /\bchia sẽ\b/gi, suggest: 'chia sẻ', severity: 'high' },
  { wrong: /\bvô tâm\b/gi, suggest: 'vô tâm', severity: 'medium' },

  // ── 3. Domain SOL specific ───────────────────────────────
  { wrong: /\bcai nghiện\b/gi, suggest: 'cai nghiện', severity: 'medium' },
  { wrong: /\bnicotin\b/gi, suggest: 'nicotine', severity: 'medium', note: 'Chuẩn quốc tế' },
  { wrong: /\bkahng\b/gi, suggest: 'Khang', severity: 'high' },
  { wrong: /\bSOl\b/g, suggest: 'SOL hoặc Sol', severity: 'medium' },
  { wrong: /\bsoll\b/gi, suggest: 'SOL', severity: 'high' },

  // ── 4. Spacing / punctuation ─────────────────────────────
  // Lỗi double space
  { wrong: /  +/g, suggest: '(double space — bỏ 1 space)', severity: 'medium' },
  // Lỗi space trước dấu câu
  { wrong: / [.,;:!?]/g, suggest: '(không có space trước dấu câu)', severity: 'medium' },
];

/**
 * Quét 1 đoạn text, trả về danh sách lỗi tìm thấy.
 */
export interface TypoMatch {
  rule: TypoRule;
  /** Vị trí lỗi (0-indexed) */
  index: number;
  /** Đoạn text bị match */
  matched: string;
  /** ~30 ký tự context xung quanh */
  context: string;
}

export function findTypos(text: string): TypoMatch[] {
  const results: TypoMatch[] = [];
  for (const rule of TYPO_RULES) {
    // Reset regex (vì global flag có lastIndex)
    const re = new RegExp(rule.wrong.source, rule.wrong.flags);
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      const start = Math.max(0, match.index - 15);
      const end = Math.min(text.length, match.index + match[0].length + 15);
      results.push({
        rule,
        index: match.index,
        matched: match[0],
        context: text.slice(start, end),
      });
      // Tránh infinite loop với zero-width match
      if (match[0].length === 0) re.lastIndex++;
    }
  }
  return results;
}
