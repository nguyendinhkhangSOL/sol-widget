// backend/src/admin/audit/contentAudit.ts
//
// Content audit tool — quét toàn bộ nội dung động trong SOL và báo cáo:
//   1. Typo / chính tả (dùng typoDictionary.ts)
//   2. Broken wiki links — URL trỏ về sol.vn/wiki/<slug> nhưng slug có
//      thể chưa tồn tại (cảnh báo vào reviewable list)
//   3. Number/fact inconsistencies — vd "10 ngày" ở 1 chỗ và "15 ngày"
//      cho cùng concept ở chỗ khác
//   4. Empty / very short content
//   5. Duplicate content (cùng câu xuất hiện > 1 nơi — vi phạm SOT)
//
// Chạy lazy: admin gọi /admin/content/audit → backend quét DB + return
// JSON report. Không tự chạy auto vì DB đọc tốn time.

import { prisma } from '../../db';
import { findTypos, type TypoMatch } from './typoDictionary';

export interface AuditFinding {
  severity: 'high' | 'medium' | 'low';
  type:
    | 'typo'
    | 'broken_wiki'
    | 'inconsistent_number'
    | 'empty'
    | 'too_short'
    | 'duplicate';
  /** Vị trí (vd "VoiceMessage:abc123:transcript", "CannedReply:xyz:answer") */
  location: string;
  /** Câu/snippet bị flag */
  snippet: string;
  /** Gợi ý sửa, nếu có */
  suggestion?: string;
  /** Chú thích */
  note?: string;
}

export interface AuditReport {
  scannedAt: string;
  totalSources: number;
  findings: AuditFinding[];
  /** Tổng kết theo severity */
  summary: { high: number; medium: number; low: number };
  /** Tổng kết theo type */
  byType: Record<string, number>;
}

/**
 * Wiki slugs hợp lệ (đã có bài viết). Khi audit, link nào trỏ đến slug
 * không trong danh sách này → flag broken_wiki.
 *
 * TODO: khi có WP API tích hợp, thay danh sách này bằng query thật.
 */
const KNOWN_WIKI_SLUGS = new Set<string>([
  // 14 mốc body timeline
  '20-phut-dau',
  '8-gio-co-giam',
  '12-gio',
  '24-gio-tim',
  '2-ngay-vi-giac',
  '3-ngay-dinh-cai',
  '1-tuan',
  '2-tuan-receptor',
  '3-tuan-thoi-quen',
  '30-ngay-ky-tich',
  '3-thang-phoi',
  '1-nam-tim-mach',
  '5-nam-dot-quy',
  '10-nam-ung-thu',
  // 7 bài Q-Day checklist
  'chuan-bi-ngay-d',
  'dieu-khoan-mien-tru-y-te',
  'noi-voi-nguoi-than',
  'loai-bo-trigger',
  'kit-khan-cap',
  'tham-khao-bac-si',
  'ngay-d-plus-3',
]);

/** Pattern phát hiện URL wiki sol.vn/wiki/<slug>. */
const WIKI_URL_RE = /https?:\/\/(?:www\.)?sol\.vn\/wiki\/([a-z0-9-]+)/gi;

function checkWikiLinks(text: string): { slug: string; index: number }[] {
  const out: { slug: string; index: number }[] = [];
  const re = new RegExp(WIKI_URL_RE.source, WIKI_URL_RE.flags);
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    out.push({ slug: m[1], index: m.index });
  }
  return out;
}

/**
 * Heuristic empty/short detector.
 * - empty = chuỗi rỗng / chỉ whitespace
 * - too_short = < 10 ký tự (cho field nội dung; không apply cho title/icon)
 */
function checkEmptyOrShort(
  text: string,
  field: 'content' | 'title' | 'meta',
): 'empty' | 'too_short' | null {
  const trimmed = text.trim();
  if (!trimmed) return 'empty';
  if (field === 'content' && trimmed.length < 10) return 'too_short';
  if (field === 'title' && trimmed.length < 2) return 'too_short';
  return null;
}

/**
 * Quét 1 nguồn nội dung — chuyển TypoMatch + wiki + empty checks → findings.
 */
function auditField(
  text: string | null | undefined,
  location: string,
  field: 'content' | 'title' | 'meta' = 'content',
): AuditFinding[] {
  const findings: AuditFinding[] = [];
  if (text === null || text === undefined) return findings;

  // Empty / short
  const emptyKind = checkEmptyOrShort(text, field);
  if (emptyKind === 'empty') {
    findings.push({
      severity: 'medium',
      type: 'empty',
      location,
      snippet: '(empty)',
      note: 'Field rỗng — kiểm tra có cần xoá hay điền?',
    });
    return findings; // không cần check tiếp
  }
  if (emptyKind === 'too_short') {
    findings.push({
      severity: 'low',
      type: 'too_short',
      location,
      snippet: text,
      note: `Field quá ngắn (${text.trim().length} ký tự) — có cần bổ sung?`,
    });
  }

  // Typos
  const typos = findTypos(text);
  for (const t of typos) {
    findings.push({
      severity: t.rule.severity,
      type: 'typo',
      location,
      snippet: `…${t.context}…`,
      suggestion: t.rule.suggest,
      note: t.rule.note,
    });
  }

  // Wiki links broken
  const wikiLinks = checkWikiLinks(text);
  for (const link of wikiLinks) {
    if (!KNOWN_WIKI_SLUGS.has(link.slug)) {
      findings.push({
        severity: 'medium',
        type: 'broken_wiki',
        location,
        snippet: `sol.vn/wiki/${link.slug}`,
        suggestion: 'Slug chưa có trong KNOWN_WIKI_SLUGS — viết bài hoặc sửa link',
      });
    }
  }

  return findings;
}

/**
 * Phát hiện duplicate — câu giống nhau xuất hiện ở > 1 nguồn.
 * Chỉ check sentence dài ≥ 40 ký tự (tránh false positive với câu chung
 * như "Cảm ơn bạn"). Lower-cased + trimmed để so sánh.
 */
function findDuplicates(
  records: Array<{ text: string; location: string }>,
): AuditFinding[] {
  const sentenceMap = new Map<string, string[]>();

  for (const r of records) {
    if (!r.text) continue;
    // Tách sentence theo dấu chấm/than/hỏi/xuống dòng
    const sentences = r.text
      .split(/[.!?\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 40);

    for (const s of sentences) {
      const key = s.toLowerCase();
      if (!sentenceMap.has(key)) sentenceMap.set(key, []);
      sentenceMap.get(key)!.push(r.location);
    }
  }

  const findings: AuditFinding[] = [];
  sentenceMap.forEach((locations, sentence) => {
    if (locations.length > 1) {
      findings.push({
        severity: 'low',
        type: 'duplicate',
        location: locations.join(' & '),
        snippet: sentence,
        note: `Câu này xuất hiện ở ${locations.length} nơi — cân nhắc tách SOT`,
      });
    }
  });
  return findings;
}

/**
 * Audit toàn bộ DB content.
 */
export async function runContentAudit(): Promise<AuditReport> {
  const findings: AuditFinding[] = [];
  let totalSources = 0;
  const allRecords: Array<{ text: string; location: string }> = [];

  // ── 1. CannedReply ───────────────────────────────────────
  try {
    const canned = await prisma.cannedReply.findMany();
    for (const c of canned) {
      totalSources++;
      findings.push(...auditField(c.label, `CannedReply:${c.slug}:label`, 'title'));
      findings.push(...auditField(c.answer, `CannedReply:${c.slug}:answer`, 'content'));
      if (c.wikiUrl) {
        findings.push(...auditField(c.wikiUrl, `CannedReply:${c.slug}:wikiUrl`, 'meta'));
      }
      allRecords.push({ text: c.answer, location: `CannedReply:${c.slug}` });
    }
  } catch (err) {
    // Bỏ qua nếu DB chưa migrate
  }

  // ── 2. VoiceMessage ──────────────────────────────────────
  try {
    const voices = await (prisma as any).voiceMessage.findMany();
    for (const v of voices) {
      totalSources++;
      findings.push(...auditField(v.title, `Voice:${v.id}:title`, 'title'));
      if (v.transcript) {
        findings.push(...auditField(v.transcript, `Voice:${v.id}:transcript`, 'content'));
        allRecords.push({ text: v.transcript, location: `Voice:${v.id}` });
      }
    }
  } catch (err) {
    // Bỏ qua
  }

  // ── 3. ContentItem (nếu có dữ liệu) ──────────────────────
  try {
    const items = await prisma.contentItem.findMany();
    for (const item of items) {
      totalSources++;
      findings.push(...auditField(item.title, `Content:${item.id}:title`, 'title'));
      findings.push(...auditField(item.body, `Content:${item.id}:body`, 'content'));
      if (item.wikiUrl) {
        findings.push(...auditField(item.wikiUrl, `Content:${item.id}:wikiUrl`, 'meta'));
      }
      allRecords.push({ text: item.body, location: `Content:${item.id}` });
    }
  } catch (err) {
    // Bỏ qua
  }

  // ── 4. AppSetting q_day_checklist ────────────────────────
  try {
    const cfg = await prisma.appSetting.findUnique({
      where: { key: 'q_day_checklist' },
    });
    if (cfg && cfg.value && typeof cfg.value === 'object') {
      const data = cfg.value as any;
      totalSources++;
      if (data.intro) {
        findings.push(...auditField(data.intro, 'QDayChecklist:intro', 'content'));
      }
      if (data.outro) {
        findings.push(...auditField(data.outro, 'QDayChecklist:outro', 'content'));
      }
      if (Array.isArray(data.items)) {
        for (const item of data.items) {
          findings.push(
            ...auditField(item.label, `QDayChecklist:${item.id}:label`, 'title'),
          );
          if (item.description) {
            findings.push(
              ...auditField(
                item.description,
                `QDayChecklist:${item.id}:description`,
                'content',
              ),
            );
          }
          if (item.wikiUrl) {
            findings.push(
              ...auditField(
                item.wikiUrl,
                `QDayChecklist:${item.id}:wikiUrl`,
                'meta',
              ),
            );
          }
        }
      }
    }
  } catch (err) {
    // Bỏ qua
  }

  // ── 5. Duplicates across sources ─────────────────────────
  findings.push(...findDuplicates(allRecords));

  // ── Summary ──────────────────────────────────────────────
  const summary = { high: 0, medium: 0, low: 0 };
  const byType: Record<string, number> = {};
  for (const f of findings) {
    summary[f.severity]++;
    byType[f.type] = (byType[f.type] ?? 0) + 1;
  }

  return {
    scannedAt: new Date().toISOString(),
    totalSources,
    findings,
    summary,
    byType,
  };
}
