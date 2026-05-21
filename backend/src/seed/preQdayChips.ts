// backend/src/seed/preQdayChips.ts
//
// PHASE 4B (Pre-Q-Day) — Chips cho 7 ngày Làm quen + 14 ngày Giảm dần.
//
// Mỗi chip = 1 ngày trong lộ trình Pre-Q-Day. Slug DB:
//   - 'lam-quen-N' (N=1..7) — orientation phase, contemplation stage
//   - 'giam-dan-N' (N=1..14) — tapering phase, reduction stage
//
// Data lấy từ preQdayChips.json (sinh bởi scripts/wp-publisher/extract-pre-qday-chips.js
// từ HTML files LAMQUEN-NN-*.html + GIAMDAN-NN-*.html).
//
// Quy ước seed:
//   - sortOrder lam-quen: 2000 + dayNumber → 2001..2007
//   - sortOrder giam-dan: 3000 + dayNumber → 3001..3014
//   - reusable, enabled, triggers, priority, minScore: như qdayChips
//   - wikiUrl: sol.vn URL chuẩn UTM tagged
//
// Re-generate JSON:
//   cd C:\BOTHUOCLA\sol-widget\scripts\wp-publisher
//   node extract-pre-qday-chips.js
//   cp pre-qday-chips.json ../../backend/src/seed/preQdayChips.json

import rawChips from './preQdayChips.json';

export interface PreQdayChip {
  phase: 'lam-quen' | 'giam-dan';
  dayNumber: number;
  slug: string;          // 'lam-quen-1' .. 'lam-quen-7' | 'giam-dan-1' .. 'giam-dan-14'
  wpSlug: string;        // full WP slug for URL
  icon: string;
  label: string;
  answer: string;
  wikiUrl: string;
  wikiLabel: string;
  sourceFile?: string;
  originalWikiUrl?: string;
  wordCount?: number;
}

export const PRE_QDAY_CHIPS: PreQdayChip[] = rawChips as PreQdayChip[];
