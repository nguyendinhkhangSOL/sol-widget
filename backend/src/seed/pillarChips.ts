// backend/src/seed/pillarChips.ts
//
// 7 PILLAR Tier 1 chip — extract từ PILLAR-*.html chip-summary box.
// Data từ scripts/wp-publisher/pillar-chips.json (sinh bởi extract-pillar-chips.js).
//
// Refresh:
//   cd scripts/wp-publisher && node extract-pillar-chips.js
//   cp pillar-chips.json ../../backend/src/seed/pillarChips.json

import rawChips from './pillarChips.json';

export interface PillarChip {
  slug: string;        // pillar-cai-thuoc-vinh-vien
  wpSlug: string;      // cai-thuoc-la-vinh-vien (WP slug)
  icon: string;        // 🎯
  label: string;       // "Cai thuốc lá vĩnh viễn — Khoa học + Phương pháp Sol"
  answer: string;      // body text (multi-line, \n separated)
  wikiUrl: string;     // full URL with UTM
  wikiLabel: string;   // "Đọc bài đầy đủ trên sol.vn"
}

export const PILLAR_CHIPS: PillarChip[] = rawChips as PillarChip[];
