/**
 * CHIP types — QuickReply interface
 * Ported from frontend/src/lib/quickReplies.ts
 */

export interface QuickReply {
  id: string;            // = slug từ DB
  icon: string;          // emoji
  label: string;         // hiển thị nút CHIP
  answer: string;        // câu trả lời render
  wikiUrl?: string;
  wikiLabel?: string;
  reusable?: boolean;
  triggers?: string[];   // keywords cho intent matching
  priority?: number;     // 100 default, >=1000 = CRITICAL
  minScore?: number;     // 0.5 default
  category?: string;     // 'sos' | 'qday' | 'pre_qday' | 'pillar' | 'craving' | 'trigger'
  sortOrder?: number;
}

export interface ChipRankingContext {
  daysSober?: number;        // số ngày từ Quit Day (0 nếu chưa start)
  currentHour?: number;      // 0-23 hour now (Asia/Ho_Chi_Minh)
  showOnlyCategory?: string; // filter (vd: chỉ 'qday')
  mode?: 'mix' | 'exclude_used' | 'cap1_per_category';
  usedChipIds?: string[];    // chip đã dùng gần đây
}
