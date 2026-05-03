// dashboard/src/pages/admin/AdminHome.tsx
// Bảng điều khiển 5-phút-mỗi-sáng cho founder Khang.
// 6 khu theo spec:
//   1. Hôm nay cần Khang (top user risk)
//   2. Số liệu live (active, doanh thu, conversion)
//   3. Đội Sol tracking (link tới /admin/cohorts)
//   4. Refund queue (link tới /admin/refunds)
//   5. Content cần duyệt (placeholder, future)
//   6. Inbox riêng (placeholder, future)

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { TIER_LABEL, TIER_COLOR, formatVnd } from '../../lib/featureGates';
import type { UserTier } from '../../types';

type Dashboard = Awaited<ReturnType<typeof api.adminDashboard>>;

export function AdminHome() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const d = await api.adminDashboard();
      setData(d);
    } catch (e: any) {
      setErr(e?.message ?? 'Không tải được dashboard.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-meta text-sol-ink-2 max-w-xl">
          Bảng điều khiển 5 phút mỗi sáng. Cập nhật mỗi 30 giây.
        </p>
        <button onClick={load} disabled={loading} className="sol-btn-secondary sol-btn-sm">
          {loading ? 'Đang tải…' : 'Làm mới'}
        </button>
      </div>

      {err && <div className="sol-alert-danger">{err}</div>}

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Khu 1 — Hôm nay cần Khang (full width on lg) */}
          <section className="lg:col-span-2 sol-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-h3 text-sol-ink">🔥 Hôm nay Khang cần chú ý</h2>
              <span className="text-meta text-sol-ink-3">
                {data.needsAttention.length} người
              </span>
            </div>
            {data.needsAttention.length === 0 ? (
              <div className="text-meta text-sol-ink-2 py-4">
                Không có ai đang đỏ. Đội Sol đang ổn — chúc mừng!
              </div>
            ) : (
              <ul className="divide-y divide-sol-line">
                {data.needsAttention.map((u) => (
                  <li key={u.id} className="py-3 flex items-center gap-3">
                    <RiskDot score={u.riskScore} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sol-ink truncate">
                        {u.name} · <TierChip tier={u.tier} />
                      </div>
                      <div className="text-meta text-sol-ink-3">
                        {u.missedDaysInRow > 0
                          ? `Bỏ ${u.missedDaysInRow} ngày check-in`
                          : 'Có dấu hiệu rủi ro'}
                        {' · '} Risk score {u.riskScore}/100
                      </div>
                    </div>
                    <Link to={`/admin/users/${u.id}`} className="sol-btn-secondary sol-btn-sm">
                      Xem ›
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Khu 4 — Refund queue */}
          <section className="sol-card p-5">
            <h2 className="text-h3 text-sol-ink mb-3">💰 Hoàn tiền chờ duyệt</h2>
            <div className="text-display font-bold text-sol-orange">
              {data.pendingRefundsCount}
            </div>
            <Link to="/admin/refunds" className="sol-btn-secondary sol-btn-sm mt-3 inline-flex">
              Xử lý queue ›
            </Link>
          </section>

          {/* Khu 2A — Doanh thu hôm nay */}
          <section className="sol-card p-5">
            <h2 className="text-h3 text-sol-ink mb-3">💵 Doanh thu hôm nay</h2>
            <div className="text-display font-bold text-sol-green">
              {formatVnd(data.revenueTodayVnd)}
            </div>
            <div className="text-meta text-sol-ink-3 mt-1">
              {data.paidToday} đơn thành công
            </div>
          </section>

          {/* Khu 2B — Active users + checkins + crises */}
          <section className="sol-card p-5">
            <h2 className="text-h3 text-sol-ink mb-3">📡 Hoạt động 24h</h2>
            <div className="grid grid-cols-3 gap-2">
              <Mini label="User active" value={data.activeUsers24h} />
              <Mini label="Check-in" value={data.checkinsToday} />
              <Mini
                label="Khủng hoảng"
                value={data.crises24h}
                emphasize={data.crises24h > 0}
              />
            </div>
          </section>

          {/* Khu 3 — Tier breakdown */}
          <section className="sol-card p-5">
            <h2 className="text-h3 text-sol-ink mb-3">🗂️ Phân bổ gói</h2>
            <div className="space-y-2">
              {data.tierBreakdown.map((t) => (
                <div key={t.tier} className="flex items-center justify-between">
                  <TierChip tier={t.tier} />
                  <span className="font-bold tabular-nums">{t.count}</span>
                </div>
              ))}
            </div>
            <Link to="/admin/cohorts" className="sol-btn-secondary sol-btn-sm mt-3 inline-flex">
              Đội Sol theo tháng ›
            </Link>
          </section>

          {/* Khu 5 — Quick links */}
          <section className="lg:col-span-3 sol-card p-5">
            <h2 className="text-h3 text-sol-ink mb-3">⚡ Truy cập nhanh</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <Link to="/admin/users" className="sol-btn-secondary text-center">
                👥 Tất cả user
              </Link>
              <Link to="/admin/voice" className="sol-btn-secondary text-center">
                🎙️ Voice library
              </Link>
              <Link to="/admin/analytics" className="sol-btn-secondary text-center">
                📈 Funnel + revenue
              </Link>
              <Link to="/admin/wiki" className="sol-btn-secondary text-center">
                📰 WordPress wiki
              </Link>
            </div>
          </section>

          <div className="lg:col-span-3 text-meta text-sol-ink-3 text-right">
            Cập nhật: {new Date(data.timestamp).toLocaleString('vi-VN')}
          </div>
        </div>
      )}
    </div>
  );
}

function RiskDot({ score }: { score: number }) {
  const color = score >= 70 ? '#dc2626' : score >= 40 ? '#f97316' : '#94a3b8';
  return <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ background: color }} />;
}

function TierChip({ tier }: { tier: UserTier }) {
  const c = TIER_COLOR[tier];
  return (
    <span
      className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full inline-block"
      style={{ background: c.light, color: c.bg }}
    >
      {TIER_LABEL[tier]}
    </span>
  );
}

function Mini({ label, value, emphasize }: { label: string; value: number; emphasize?: boolean }) {
  return (
    <div className="text-center">
      <div className={`text-h3 font-bold tabular-nums ${emphasize ? 'text-sol-red-ink' : 'text-sol-ink'}`}>
        {value}
      </div>
      <div className="text-meta text-sol-ink-3 mt-0.5">{label}</div>
    </div>
  );
}
