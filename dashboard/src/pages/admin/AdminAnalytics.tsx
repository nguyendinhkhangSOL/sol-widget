// dashboard/src/pages/admin/AdminAnalytics.tsx
// Funnel + Revenue.

import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { TIER_LABEL, formatVnd } from '../../lib/featureGates';

type Funnel = Awaited<ReturnType<typeof api.adminFunnel>>;
type Revenue = Awaited<ReturnType<typeof api.adminRevenue>>;

export function AdminAnalytics() {
  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [revenue, setRevenue] = useState<Revenue | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    api.adminFunnel().then(setFunnel).catch(() => {});
  }, []);

  useEffect(() => {
    api.adminRevenue(days).then(setRevenue).catch(() => {});
  }, [days]);

  return (
    <div className="space-y-6">
      <section className="sol-card p-5">
        <h2 className="text-h3 mb-3">📊 Funnel</h2>
        {funnel ? (
          <ul className="space-y-2">
            {funnel.steps.map((s, i) => {
              const max = funnel.steps[0]?.count ?? 1;
              const pct = max > 0 ? (s.count / max) * 100 : 0;
              const prev = i > 0 ? funnel.steps[i - 1].count : null;
              const dropoff = prev && prev > 0 ? ((prev - s.count) / prev) * 100 : null;
              return (
                <li key={s.key}>
                  <div className="flex items-center justify-between text-meta mb-1">
                    <span className="font-semibold text-sol-ink">{s.label}</span>
                    <span className="tabular-nums text-sol-ink-2">
                      {s.count}
                      {dropoff !== null && dropoff > 0 && (
                        <span className="text-sol-red-ink ml-2 text-[11px]">
                          -{dropoff.toFixed(1)}%
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="h-2 bg-sol-paper rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sol-green"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="text-sol-ink-3">Đang tải…</div>
        )}
      </section>

      <section className="sol-card p-5">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <h2 className="text-h3">💵 Doanh thu</h2>
          <div className="flex gap-1">
            {[7, 30, 90, 365].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={
                  'px-3 py-1.5 rounded-full text-meta font-medium ' +
                  (days === d ? 'bg-sol-ink text-white' : 'border border-sol-line')
                }
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
        {revenue && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <Box label="Doanh thu (gross)" value={formatVnd(revenue.paid.totalVnd)} sub={`${revenue.paid.count} đơn`} />
              <Box label="Hoàn tiền" value={formatVnd(revenue.refunded.totalVnd)} sub={`${revenue.refunded.count} đơn`} tone="red" />
              <Box label="Net" value={formatVnd(revenue.netVnd)} sub={`${days} ngày`} tone="green" />
            </div>
            <h3 className="font-semibold text-meta uppercase tracking-wider text-sol-ink-3 mb-2">
              Theo gói
            </h3>
            <ul className="space-y-1">
              {revenue.byTier.map((t) => (
                <li key={t.tier} className="flex items-center justify-between text-meta">
                  <span>{TIER_LABEL[t.tier]}</span>
                  <span className="tabular-nums">
                    {formatVnd(t.totalVnd)} <span className="text-sol-ink-3">· {t.count} đơn</span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}

function Box({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'red' | 'green';
}) {
  const color = tone === 'red' ? 'text-sol-red-ink' : tone === 'green' ? 'text-sol-green-ink' : 'text-sol-ink';
  return (
    <div className="bg-sol-paper rounded-xl p-3 border border-sol-line">
      <div className="text-[11px] uppercase tracking-wider text-sol-ink-3 font-semibold">{label}</div>
      <div className={`text-h3 font-bold tabular-nums mt-1 ${color}`}>{value}</div>
      {sub && <div className="text-meta text-sol-ink-3 mt-0.5">{sub}</div>}
    </div>
  );
}
