import { query } from '@/lib/db';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { AdminLogin } from '../AdminLogin';
import { CannedRepliesClient } from './CannedRepliesClient';

export interface CannedReplyRow {
  id: number;
  slug: string;
  label: string;
  icon: string;
  answer: string;
  wiki_url: string | null;
  wiki_label: string | null;
  reusable: boolean;
  sort_order: number;
  enabled: boolean;
  triggers: string[] | null;
  priority: number;
  min_score: number;
  category: string | null;
  updated_at: string;
}

export default async function CannedRepliesPage() {
  if (!isAdminAuthorized()) return <AdminLogin />;

  const chips = await query<CannedReplyRow>(
    `SELECT * FROM canned_replies ORDER BY priority DESC, sort_order ASC, id ASC`
  );

  return (
    <>
      <h1 className="admin-page-title">🧩 CHIP / Canned Replies</h1>
      <p className="admin-page-subtitle">
        {chips.length} chips · Match user message → render canned answer ngay (không tốn AI quota).
        Priority ≥ 1000 = CRITICAL.
      </p>

      <CannedRepliesClient initialChips={chips} />
    </>
  );
}
