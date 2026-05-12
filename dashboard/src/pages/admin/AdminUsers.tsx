// dashboard/src/pages/admin/AdminUsers.tsx
// Danh sách user với filter (tier, riskScore) + search.

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type AdminUserListItem } from '../../services/api';
import { TIER_COLOR, TIER_LABEL } from '../../lib/featureGates';
import type { UserTier } from '../../types';

export function AdminUsers() {
  const [items, setItems] = useState<AdminUserListItem[]>([]);
  const [q, setQ] = useState('');
  const [tier, setTier] = useState<string>('');
  const [minRisk, setMinRisk] = useState<string>('');
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await api.adminListUsers({
        q: q || undefined,
        tier: tier || undefined,
        minRisk: minRisk ? Number(minRisk) : undefined,
        limit: 200,
      });
      setItems(r.items);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const stats = useMemo(() => {
    const tally: Record<string, number> = {};
    for (const u of items) tally[u.tier] = (tally[u.tier] ?? 0) + 1;
    return tally;
  }, [items]);

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <label className="text-meta text-sol-ink-3 font-semibold uppercase tracking-wider">
            Tìm kiếm
          </label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            placeholder="Tên / phone / email"
            className="block w-full mt-1 px-3 py-2 rounded-xl border border-sol-line text-body focus:outline-none focus:ring-2 focus:ring-sol-green"
          />
        </div>
        <div>
          <label className="text-meta text-sol-ink-3 font-semibold uppercase tracking-wider">Tier</label>
          <select value={tier} onChange={(e) => setTier(e.target.value)} className="block mt-1 px-3 py-2 rounded-xl border border-sol-line text-body">
            <option value="">Tất cả</option>
            <option value="FREE">🌱 Nhận Diện</option>
            <option value="KHOI_DONG">🟡 Kiểm Soát</option>
            <option value="DONG_HANH">🔴 Làm Chủ</option>
            <option value="ALUMNI">🌟 Người Tự Do</option>
          </select>
        </div>
        <div>
          <label className="text-meta text-sol-ink-3 font-semibold uppercase tracking-wider">Risk ≥</label>
          <input value={minRisk} onChange={(e) => setMinRisk(e.target.value)} placeholder="0" className="block mt-1 w-20 px-3 py-2 rounded-xl border border-sol-line text-body" />
        </div>
        <button onClick={load} disabled={loading} className="sol-btn-primary">
          {loading ? 'Đang lọc…' : 'Lọc'}
        </button>
      </div>

      {/* Tally chips */}
      <div className="flex gap-2 flex-wrap">
        {(['FREE', 'KHOI_DONG', 'DONG_HANH', 'ALUMNI'] as UserTier[]).map((t) => {
          const c = TIER_COLOR[t];
          return (
            <span
              key={t}
              className="px-2.5 py-1 rounded-full text-meta font-semibold"
              style={{ background: c.light, color: c.bg }}
            >
              {TIER_LABEL[t]}: {stats[t] ?? 0}
            </span>
          );
        })}
      </div>

      <div className="sol-card overflow-x-auto">
        <table className="min-w-full text-meta">
          <thead className="bg-sol-paper text-sol-ink-3 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="text-left px-4 py-3">User</th>
              <th className="text-left px-4 py-3">Phone</th>
              <th className="text-left px-4 py-3">Tier</th>
              <th className="text-right px-4 py-3">Risk</th>
              <th className="text-right px-4 py-3">Streak</th>
              <th className="text-left px-4 py-3">Đội</th>
              <th className="text-left px-4 py-3">Hết hạn</th>
              <th className="text-right px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((u) => {
              const c = TIER_COLOR[u.tier];
              return (
                <tr key={u.id} className="border-t border-sol-line">
                  <td className="px-4 py-2.5 font-semibold text-sol-ink">{u.name}</td>
                  <td className="px-4 py-2.5 text-sol-ink-2">{u.phone}</td>
                  <td className="px-4 py-2.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold" style={{ background: c.light, color: c.bg }}>
                      {TIER_LABEL[u.tier]}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    <span className={u.riskScore >= 70 ? 'text-sol-red-ink font-bold' : 'text-sol-ink-2'}>
                      {u.riskScore}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{u.checkinStreak}</td>
                  <td className="px-4 py-2.5 text-sol-ink-2">{u.cohortKey ?? '—'}</td>
                  <td className="px-4 py-2.5 text-sol-ink-3">
                    {u.tierExpiresAt ? new Date(u.tierExpiresAt).toLocaleDateString('vi-VN') : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Link to={`/admin/users/${u.id}`} className="sol-btn-secondary sol-btn-sm">
                      Chi tiết ›
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {items.length === 0 && !loading && (
          <div className="p-6 text-center text-sol-ink-3">Không tìm thấy user.</div>
        )}
      </div>
    </div>
  );
}
