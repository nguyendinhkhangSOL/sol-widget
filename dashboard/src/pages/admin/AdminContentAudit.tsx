// dashboard/src/pages/admin/AdminContentAudit.tsx
//
// Trang chạy content audit + hiển thị findings theo severity/type.
// Khang dùng mỗi tuần để quét typo, broken wiki, duplicate.

import { useState } from 'react';
import { api } from '../../services/api';

type Report = Awaited<ReturnType<typeof api.adminContentAudit>>;

const SEVERITY_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  high: { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' },
  medium: { bg: '#fff7ed', text: '#9a3412', border: '#fed7aa' },
  low: { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' },
};

const TYPE_LABEL: Record<string, string> = {
  typo: '✏️ Typo / chính tả',
  broken_wiki: '🔗 Wiki link gãy',
  inconsistent_number: '🔢 Số liệu không nhất quán',
  empty: '⬜ Rỗng',
  too_short: '✂️ Quá ngắn',
  duplicate: '👯 Trùng lặp',
};

export function AdminContentAudit() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  async function runAudit() {
    setLoading(true);
    try {
      const r = await api.adminContentAudit();
      setReport(r);
    } finally {
      setLoading(false);
    }
  }

  const findings = report?.findings ?? [];
  const filtered = findings.filter((f) => {
    if (filter !== 'all' && f.severity !== filter) return false;
    if (typeFilter !== 'all' && f.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-meta text-sol-ink-2 max-w-2xl">
          Quét toàn bộ content động (canned replies, voice, content items, Q-Day checklist)
          tìm typo, broken wiki link, duplicate, và các pattern bất thường. Chạy mỗi tuần.
        </p>
        <button
          onClick={runAudit}
          disabled={loading}
          className="sol-btn-primary"
        >
          {loading ? 'Đang quét…' : '🔍 Chạy audit'}
        </button>
      </div>

      {!report && !loading && (
        <div className="sol-card p-6 text-center text-sol-ink-3">
          Chưa có report. Bấm "Chạy audit" để quét.
        </div>
      )}

      {report && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Box label="Đã quét" value={`${report.totalSources} nguồn`} tone="neutral" />
            <Box label="Cao" value={`${report.summary.high}`} tone="high" />
            <Box label="Trung bình" value={`${report.summary.medium}`} tone="medium" />
            <Box label="Thấp" value={`${report.summary.low}`} tone="low" />
          </div>

          {/* By type */}
          <div className="sol-card p-4">
            <h3 className="text-meta uppercase tracking-wider text-sol-ink-3 font-semibold mb-2">
              Theo loại lỗi
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(report.byType).map(([type, count]) => (
                <span
                  key={type}
                  className="px-2.5 py-1 rounded-full bg-sol-paper border border-sol-line text-meta"
                >
                  <strong>{TYPE_LABEL[type] ?? type}</strong>: {count}
                </span>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-meta text-sol-ink-3">Lọc:</span>
            {(['all', 'high', 'medium', 'low'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={
                  'px-3 py-1.5 rounded-full text-meta font-medium ' +
                  (filter === s
                    ? 'bg-sol-ink text-white'
                    : 'border border-sol-line text-sol-ink-2 hover:bg-sol-paper')
                }
              >
                {s === 'all' ? 'Tất cả mức' : s === 'high' ? 'Cao' : s === 'medium' ? 'TB' : 'Thấp'}
              </button>
            ))}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-full border border-sol-line text-meta"
            >
              <option value="all">Mọi loại</option>
              {Object.keys(TYPE_LABEL).map((t) => (
                <option key={t} value={t}>{TYPE_LABEL[t]}</option>
              ))}
            </select>
            <span className="text-meta text-sol-ink-3 ml-auto">
              Hiển thị {filtered.length}/{findings.length}
            </span>
          </div>

          {/* Findings */}
          {filtered.length === 0 ? (
            <div className="sol-card p-6 text-center text-sol-green-ink">
              ✓ Không có lỗi nào trong filter này. Chúc mừng!
            </div>
          ) : (
            <ul className="space-y-2">
              {filtered.map((f, i) => {
                const c = SEVERITY_COLOR[f.severity];
                return (
                  <li
                    key={i}
                    className="rounded-xl border p-3"
                    style={{ background: c.bg, borderColor: c.border }}
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full"
                            style={{ background: c.text, color: '#fff' }}
                          >
                            {f.severity}
                          </span>
                          <span className="text-meta font-semibold" style={{ color: c.text }}>
                            {TYPE_LABEL[f.type] ?? f.type}
                          </span>
                        </div>
                        <code className="block text-[11px] text-sol-ink-3 mt-1 break-all">
                          {f.location}
                        </code>
                        <div className="text-meta text-sol-ink mt-2 break-words">
                          <span className="bg-white/50 px-1 rounded font-mono">
                            {f.snippet}
                          </span>
                        </div>
                        {f.suggestion && (
                          <div className="text-meta text-sol-ink-2 mt-1">
                            💡 Gợi ý: <strong>{f.suggestion}</strong>
                          </div>
                        )}
                        {f.note && (
                          <div className="text-[11px] text-sol-ink-3 mt-1 italic">{f.note}</div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="text-meta text-sol-ink-3 text-right">
            Quét lúc: {new Date(report.scannedAt).toLocaleString('vi-VN')}
          </div>
        </>
      )}
    </div>
  );
}

function Box({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'neutral' | 'high' | 'medium' | 'low';
}) {
  const c =
    tone === 'high'
      ? { bg: '#fef2f2', text: '#991b1b' }
      : tone === 'medium'
        ? { bg: '#fff7ed', text: '#9a3412' }
        : tone === 'low'
          ? { bg: '#f0fdf4', text: '#166534' }
          : { bg: '#f8fafc', text: '#334155' };
  return (
    <div className="rounded-xl p-3 border border-sol-line" style={{ background: c.bg }}>
      <div className="text-[11px] uppercase tracking-wider font-semibold text-sol-ink-3">{label}</div>
      <div className="text-h3 font-bold tabular-nums mt-1" style={{ color: c.text }}>
        {value}
      </div>
    </div>
  );
}
