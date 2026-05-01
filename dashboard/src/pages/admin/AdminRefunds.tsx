// dashboard/src/pages/admin/AdminRefunds.tsx
// Refund queue. Khang đọc lý do, approve/deny, đánh dấu processed sau khi
// chuyển tiền thật.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { TIER_COLOR, TIER_LABEL, formatVnd } from '../../lib/featureGates';

type Item = Awaited<ReturnType<typeof api.adminListRefunds>>['items'][number];

export function AdminRefunds() {
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState<string>('REQUESTED');
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const r = await api.adminListRefunds(filter || undefined);
    setItems(r.items);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  async function decide(id: string, decision: 'approve' | 'deny') {
    setBusy(id);
    setMsg(null);
    try {
      await api.adminRefundDecision(id, { decision, adminNote: note[id] });
      setMsg(decision === 'approve' ? 'Đã duyệt — user về Free.' : 'Đã từ chối.');
      await load();
    } catch (e: any) {
      setMsg('Lỗi: ' + (e?.message ?? 'unknown'));
    } finally {
      setBusy(null);
    }
  }

  async function markProcessed(id: string) {
    setBusy(id);
    try {
      await api.adminRefundProcessed(id);
      setMsg('Đã đánh dấu processed.');
      await load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {['REQUESTED', 'APPROVED', 'PROCESSED', 'DENIED', ''].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setFilter(s)}
            className={
              'px-3 py-1.5 rounded-full text-meta font-medium ' +
              (filter === s
                ? 'bg-sol-ink text-white'
                : 'border border-sol-line text-sol-ink-2 hover:bg-sol-paper')
            }
          >
            {s || 'Tất cả'}
          </button>
        ))}
      </div>

      {msg && (
        <div className="bg-sol-green-soft border border-sol-green/30 text-sol-green-ink rounded-xl p-3 text-meta">
          {msg}
        </div>
      )}

      {items.length === 0 && (
        <div className="sol-card p-6 text-center text-sol-ink-3">
          Không có yêu cầu nào ở trạng thái này.
        </div>
      )}

      <div className="space-y-3">
        {items.map((r) => {
          const c = TIER_COLOR[r.user.tier];
          return (
            <div key={r.id} className="sol-card p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <Link to={`/admin/users/${r.user.id}`} className="font-bold text-sol-ink underline">
                    {r.user.name}
                  </Link>
                  <span className="ml-2 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full" style={{ background: c.light, color: c.bg }}>
                    {TIER_LABEL[r.user.tier]}
                  </span>
                  <div className="text-meta text-sol-ink-3 mt-0.5">
                    {r.user.phone} · {new Date(r.createdAt).toLocaleString('vi-VN')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold tabular-nums text-sol-orange">
                    {formatVnd(r.amountVnd)}
                  </div>
                  <div className="text-meta text-sol-ink-3">
                    Đã dùng {r.daysUsed} ngày · {r.status}
                  </div>
                </div>
              </div>
              {r.reason && (
                <div className="mt-3 bg-sol-paper rounded-xl p-3 text-meta italic">
                  "{r.reason}"
                </div>
              )}
              {r.adminNote && (
                <div className="mt-2 text-meta text-sol-ink-2">
                  Khang note: {r.adminNote}
                </div>
              )}

              {r.status === 'REQUESTED' && (
                <div className="mt-3 space-y-2">
                  <textarea
                    placeholder="Ghi chú nội bộ (tuỳ chọn)…"
                    value={note[r.id] ?? ''}
                    onChange={(e) => setNote((n) => ({ ...n, [r.id]: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl border border-sol-line text-meta"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => decide(r.id, 'approve')}
                      disabled={busy === r.id}
                      className="flex-1 py-2 rounded-xl bg-sol-green text-white font-semibold disabled:opacity-50"
                    >
                      ✓ Duyệt — hoàn tiền
                    </button>
                    <button
                      onClick={() => decide(r.id, 'deny')}
                      disabled={busy === r.id}
                      className="flex-1 py-2 rounded-xl border border-sol-line font-semibold disabled:opacity-50"
                    >
                      ✗ Từ chối
                    </button>
                  </div>
                </div>
              )}

              {r.status === 'APPROVED' && (
                <button
                  onClick={() => markProcessed(r.id)}
                  disabled={busy === r.id}
                  className="mt-3 w-full py-2 rounded-xl border border-sol-line font-semibold"
                >
                  ✅ Đã chuyển tiền cho user — đánh dấu Processed
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
