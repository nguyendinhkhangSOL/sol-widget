// backend/src/seed/qdayChips.ts
//
// PHASE 4 — 30 chip Q-Day cho Zalo push + App Sol.
//
// Mỗi chip = 1 ngày trong series Bỏ Thuốc 30 Ngày. Slug `qday-N` (N=1..30).
// Data lấy từ qdayChips.json (sinh bởi scripts/wp-publisher/extract-chip-summaries.js
// từ 30 file HTML wiki-skeletons/wiki-articles/QDAY-NN-*.html).
//
// Quy ước seed:
//   - sortOrder = 1000 + dayNumber → 1001..1030 (sort sau 42 chip hiện có)
//   - reusable  = false (push-only, không hiển thị lặp lại trong widget chat)
//   - enabled   = true
//   - triggers  = [] (push-only, không match từ chat tự do)
//   - priority  = 100 (default)
//   - wikiUrl   = sol.vn URL chuẩn (UTM tagged) — đã verify với handoff doc
//
// Re-generate JSON:
//   cd C:\BOTHUOCLA\sol-widget\scripts\wp-publisher
//   node extract-chip-summaries.js
//   cp qday-chips.json ../../backend/src/seed/qdayChips.json

import rawChips from './qdayChips.json';

export interface QdayChip {
  dayNumber: number;
  slug: string;          // 'qday-1' .. 'qday-30'
  icon: string;          // emoji 1-2 codepoint
  label: string;         // 'Ngày N — Tiêu đề'
  answer: string;        // text body 50-80 từ, '\n\n' separator giữa các đoạn
  wikiUrl: string;       // https://sol.vn/<slug>/?utm_source=zalo&utm_campaign=qday-N
  wikiLabel: string;     // 'Đọc Ngày N đầy đủ trên sol.vn'
  sourceFile?: string;   // metadata — file HTML nguồn (debug)
  originalWikiUrl?: string; // metadata — URL gốc trong HTML (có thể khác wikiUrl nếu HTML có slug cũ)
  canonicalSlug?: string;   // metadata — slug LIVE trên sol.vn
  wordCount?: number;    // metadata — số từ answer
}

export const QDAY_CHIPS: QdayChip[] = rawChips as QdayChip[];
