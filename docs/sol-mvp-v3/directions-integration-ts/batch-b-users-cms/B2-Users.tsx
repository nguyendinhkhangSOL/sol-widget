// ═══════════════════════════════════════════════════════════════
// BATCH B — Users.tsx (enrich với tier + filter + search + link detail)
// REPLACE file: /var/www/huongdi/admin/src/pages/Users.tsx
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getUsers } from '../utils/api';

const TIER_BADGE: Record<string, { color: string; label: string }> = {
  FREE:    { color: 'badge-blue',   label: '🆓 Free' },
  ACTIVE:  { color: 'badge-green',  label: '✅ Active' },
  FOUNDER: { color: 'badge-yellow', label: '⭐ Founder' },
  EXPIRED: { color: 'badge-red',    label: '⏰ Expired' },
};

const ROLE_COLOR: Record<string, string> = {
  USER: 'badge-blue',
  ANALYST: 'badge-yellow',
  CONTENT_EDITOR: 'badge-green',
  RESEARCH_EDITOR: 'badge-green',
  SUPER_ADMIN: 'badge-red',
};

export default function Users() {
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [tier, setTier] = useState<string>('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getUsers(page, { tier, search }).then(setData).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [page, tier]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const tierCounts = useMemo(() => {
    const map: Record<string, number> = {};
    (data?.tierCounts || []).forEach((t: any) => { map[t.tier] = t._count; });
    return map;
  }, [data]);

  if (loading && !data) return <div style={{ color: 'var(--text2)' }}>Đang tải...</div>;

  return (
    <div>
      {/* Header + KPI cards */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
          👥 Users ({data?.total.toLocaleString()})
        </h1>

        {/* Tier counts */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {['FREE', 'ACTIVE', 'FOUNDER', 'EXPIRED'].map(t => (
            <div key={t} className="card" style={{ padding: '10px 14px', minWidth: 100 }}>
              <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase' }}>
                {TIER_BADGE[t].label}
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>
                {tierCounts[t] || 0}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: 12, marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Tìm phone / email / tên..."
            style={{
              width: '100%', padding: '8px 12px', borderRadius: 6,
              border: '1px solid var(--border)', background: 'var(--surface)',
              color: 'var(--text)', fontSize: 14,
            }}
          />
        </div>
        <div>
          <select
            value={tier}
            onChange={e => { setTier(e.target.value); setPage(1); }}
            style={{
              padding: '8px 12px', borderRadius: 6,
              border: '1px solid var(--border)', background: 'var(--surface)',
              color: 'var(--text)', fontSize: 14,
            }}
          >
            <option value="">Tất cả tier</option>
            <option value="FREE">🆓 Free</option>
            <option value="ACTIVE">✅ Active</option>
            <option value="FOUNDER">⭐ Founder</option>
            <option value="EXPIRED">⏰ Expired</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Người dùng</th>
              <th>Tier</th>
              <th>Hết hạn</th>
              <th>P1</th>
              <th>P2</th>
              <th>Đã lưu</th>
              <th>Events</th>
              <th>Lần cuối</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data?.users.map((u: any) => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {u.avatarUrl && <img src={u.avatarUrl} style={{ width: 28, height: 28, borderRadius: '50%' }} />}
                    <div>
                      <div style={{ fontWeight: 600 }}>{u.displayName || '—'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                        {u.phone || u.email || u.zaloId || '—'}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`badge ${TIER_BADGE[u.tier]?.color || 'badge-blue'}`}>
                    {TIER_BADGE[u.tier]?.label || u.tier}
                  </span>
                </td>
                <td style={{ fontSize: 12, color: 'var(--text2)' }}>
                  {u.tierExpiresAt ? new Date(u.tierExpiresAt).toLocaleDateString('vi') : '—'}
                </td>
                <td style={{ color: u._count.p1Results > 0 ? 'var(--green)' : 'var(--text2)' }}>
                  {u._count.p1Results || '—'}
                </td>
                <td style={{ color: u._count.p2Results > 0 ? 'var(--green)' : 'var(--text2)' }}>
                  {u._count.p2Results || '—'}
                </td>
                <td>{u._count.savedDirs || '—'}</td>
                <td>{u._count.events || '—'}</td>
                <td style={{ fontSize: 12, color: 'var(--text2)' }}>
                  {u.lastSeenAt ? new Date(u.lastSeenAt).toLocaleDateString('vi') : '—'}
                </td>
                <td>
                  <Link to={`/users/${u.id}`} className="btn btn-sm btn-ghost">
                    Chi tiết →
                  </Link>
                </td>
              </tr>
            ))}
            {(!data?.users || data.users.length === 0) && (
              <tr>
                <td colSpan={9} style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>
                  Không có user nào khớp filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data?.pages > 1 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'center' }}>
          <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Trước</button>
          <span style={{ padding: '5px 12px', color: 'var(--text2)' }}>Trang {page} / {data.pages}</span>
          <button className="btn btn-ghost btn-sm" disabled={page === data.pages} onClick={() => setPage(p => p + 1)}>Sau →</button>
        </div>
      )}
    </div>
  );
}
