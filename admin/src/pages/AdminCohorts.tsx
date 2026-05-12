// dashboard/src/pages/admin/AdminCohorts.tsx
// Đội Sol theo tháng — bao nhiêu user đặt Q-Day trong tháng đó, đang ở tier
// nào, retention.

import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Cohort } from '../types';

export function AdminCohorts() {
  const [items, setItems] = useState<Cohort[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.adminListCohorts()
      .then((r) => setItems(r.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <p className="text-meta text-sol-ink-2">
        Đội Sol tự tạo khi user đầu tiên trong tháng đặt Q-Day. Theo dõi
        retention để biết tháng nào hiệu quả.
      </p>

      {loading && <div className="text-sol-ink-2">Đang tải…</div>}
      {!loading && items.length === 0 && (
        <div className="sol-card p-6 text-center text-sol-ink-3">
          Chưa có Đội Sol nào — chưa có user nào đặt Q-Day.
        </div>
      )}

      <div className="sol-card overflow-x-auto">
        <table className="min-w-full text-meta">
          <thead className="bg-sol-paper text-[11px] uppercase text-sol-ink-3 tracking-wider">
            <tr>
              <th className="text-left px-4 py-3">Đội Sol</th>
              <th className="text-right">Tổng</th>
              <th className="text-right">Đã trả phí</th>
              <th className="text-right">Alumni</th>
              <th className="text-right">Tỷ lệ chuyển</th>
              <th className="text-right">Tỷ lệ hoàn thành</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => {
              const conv = c.totalMembers > 0 ? (c.paidMembers / c.totalMembers) * 100 : 0;
              const completion = c.totalMembers > 0 ? (c.alumniMembers / c.totalMembers) * 100 : 0;
              return (
                <tr key={c.key} className="border-t border-sol-line">
                  <td className="px-4 py-2.5 font-semibold text-sol-ink">{c.label}</td>
                  <td className="text-right px-4 py-2.5 tabular-nums">{c.totalMembers}</td>
                  <td className="text-right px-4 py-2.5 tabular-nums">{c.paidMembers}</td>
                  <td className="text-right px-4 py-2.5 tabular-nums">{c.alumniMembers}</td>
                  <td className="text-right px-4 py-2.5 tabular-nums">{conv.toFixed(1)}%</td>
                  <td className="text-right px-4 py-2.5 tabular-nums">{completion.toFixed(1)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
