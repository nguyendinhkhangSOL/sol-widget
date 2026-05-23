/**
 * CHIP Loader — load enabled chips from DB with 60s in-process cache
 */

import { query } from '@/lib/db';
import type { QuickReply } from './types';

let cached: QuickReply[] | null = null;
let cachedAt = 0;
const TTL_MS = 60_000;

interface ChipRow {
  slug: string;
  label: string;
  icon: string;
  answer: string;
  wiki_url: string | null;
  wiki_label: string | null;
  reusable: boolean;
  triggers: string[] | null;
  priority: number;
  min_score: number;
  category: string | null;
  sort_order: number;
}

export async function loadEnabledChips(force = false): Promise<QuickReply[]> {
  const now = Date.now();
  if (!force && cached && now - cachedAt < TTL_MS) return cached;

  const rows = await query<ChipRow>(
    `SELECT slug, label, icon, answer, wiki_url, wiki_label, reusable,
            triggers, priority, min_score, category, sort_order
     FROM canned_replies
     WHERE enabled = TRUE
     ORDER BY priority DESC, sort_order ASC`
  );

  const chips: QuickReply[] = rows.map((r) => ({
    id: r.slug,
    label: r.label,
    icon: r.icon || '💬',
    answer: r.answer,
    wikiUrl: r.wiki_url || undefined,
    wikiLabel: r.wiki_label || undefined,
    reusable: r.reusable,
    triggers: r.triggers ?? [],
    priority: r.priority,
    minScore: r.min_score,
    category: r.category || undefined,
    sortOrder: r.sort_order
  }));

  cached = chips;
  cachedAt = now;
  return chips;
}

export function invalidateChipsCache(): void {
  cached = null;
  cachedAt = 0;
}
