// admin/src/pages/AdminZaloJourney.tsx
//
// Sol v4 (Sprint 3) — Admin Dashboard cho 51-Day Journey Scheduler.
//
// 4 sections:
//   1. Stats hero — users active, today sent, SOS open, cost dự kiến
//   2. Queue 24h — danh sách push sắp gửi (group by hour)
//   3. Users — list user đang journey (with filter status + journeyType)
//   4. Enroll manual — form admin tự enroll cho 1 user

import { useState, useEffect } from 'react';
import { journeyApi, type JourneyStats, type JourneyQueueResponse, type JourneyUser, type JourneyType, type JourneyStatus } from '../services/api';

type TabKey = 'overview' | 'queue' | 'users' | 'enroll';

export function AdminZaloJourney() {
  const [tab, setTab] = useState<TabKey>('overview');

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-h1 font-bold text-sol-ink flex items-center gap-2">
          <span>🛤️</span> 51-Day Journey Scheduler
        </h1>
        <p className="text-meta text-sol-ink-2 mt-1">
          Quản lý lộ trình cai thuốc 51 ngày qua Zalo OA push schedule + SOS handling.
        </p>
      </div>

      <div className="flex gap-1 border-b-2 border-sol-line">
        {[
          { key: 'overview', icon: '📊', label: 'Tổng quan' },
          { key: 'queue', icon: '⏰', label: 'Queue 24h' },
          { key: 'users', icon: '👥', label: 'Users' },
          { key: 'enroll', icon: '➕', label: 'Enroll' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as TabKey)}
            className={`px-5 py-3 text-meta font-semibold transition border-b-2 -mb-px ${
              tab === t.key
                ? 'text-sol-orange border-sol-orange'
                : 'text-sol-ink-2 border-transparent hover:text-sol-ink'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <TabOverview />}
      {tab === 'queue' && <TabQueue />}
      {tab === 'users' && <TabUsers />}
      {tab === 'enroll' && <TabEnroll />}
    </div>
  );
}

/* ─── TAB OVERVIEW ─────────────────────────────────────────────────────── */
function TabOverview() {
  const [stats, setStats] = useState<JourneyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const s = await journeyApi.stats();
      setStats(s);
    } catch (e: any) {
      setErr(e.message ?? 'Lỗi');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const i = setInterval(load, 30000); // refresh mỗi 30s
    return () => clearInterval(i);
  }, []);

  if (loading && !stats) return <Loading />;
  if (err) return <ErrorBox msg={err} />;
  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="User đang journey" value={stats.users.activeJourney} icon="🚀" color="orange" />
      <StatCard title="Đã tốt nghiệp" value={stats.users.graduated} icon="🎓" color="green" />
      <StatCard title="Gửi hôm nay" value={stats.today.sent} icon="📤" color="blue" />
      <StatCard title="Pending hôm nay" value={stats.today.pending} icon="⏳" color="yellow" />
      <StatCard title="🆘 SOS đang mở" value={stats.sos.open} icon="⚠️" color={stats.sos.open > 0 ? 'red' : 'gray'} />
      <StatCard title="Cost dự kiến hôm nay" value={`${(stats.today.estCostVnd / 1000).toFixed(1)}k đ`} icon="💰" color="gray" />
      <StatCard title="Gửi 7 ngày qua" value={stats.last7d.totalSent} icon="📊" color="blue" />
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: number | string; icon: string; color: string }) {
  const bg = {
    orange: 'bg-orange-50 border-orange-200',
    green: 'bg-green-50 border-green-200',
    blue: 'bg-blue-50 border-blue-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    red: 'bg-red-50 border-red-300',
    gray: 'bg-gray-50 border-gray-200',
  }[color] ?? 'bg-gray-50 border-gray-200';

  return (
    <div className={`rounded-lg border-2 p-4 ${bg}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="text-meta text-sol-ink-2">{title}</div>
        <div className="text-2xl">{icon}</div>
      </div>
      <div className="text-3xl font-bold text-sol-ink">{value}</div>
    </div>
  );
}

/* ─── TAB QUEUE ────────────────────────────────────────────────────────── */
function TabQueue() {
  const [hours, setHours] = useState(24);
  const [data, setData] = useState<JourneyQueueResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const q = await journeyApi.queue(hours);
      setData(q);
    } catch (e: any) {
      setErr(e.message ?? 'Lỗi');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [hours]);

  if (loading && !data) return <Loading />;
  if (err) return <ErrorBox msg={err} />;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-meta">Horizon:</label>
        <select
          value={hours}
          onChange={(e) => setHours(parseInt(e.target.value))}
          className="rounded border-sol-line px-3 py-1 text-meta"
        >
          <option value={6}>6 giờ</option>
          <option value={24}>24 giờ</option>
          <option value={72}>3 ngày</option>
          <option value={168}>7 ngày</option>
        </select>
        <button onClick={load} className="ml-auto text-meta text-sol-orange hover:underline">
          🔄 Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
        <div className="rounded-lg border border-sol-line p-3">
          <div className="text-meta text-sol-ink-2">Tổng push</div>
          <div className="text-2xl font-bold text-sol-ink">{data.total}</div>
        </div>
        <div className="rounded-lg border border-sol-line p-3">
          <div className="text-meta text-sol-ink-2">Cost dự kiến</div>
          <div className="text-2xl font-bold text-sol-orange">{(data.estCostVnd / 1000).toFixed(1)}k đ</div>
        </div>
        <div className="rounded-lg border border-sol-line p-3">
          <div className="text-meta text-sol-ink-2">Khung giờ peak</div>
          <div className="text-lg font-bold text-sol-ink">
            {Object.entries(data.byHour).sort(([, a], [, b]) => b - a)[0]?.[0]?.slice(11, 16) ?? '—'}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-meta">
          <thead className="bg-sol-line/40">
            <tr>
              <th className="text-left px-3 py-2">User</th>
              <th className="text-left px-3 py-2">Day</th>
              <th className="text-left px-3 py-2">Template</th>
              <th className="text-left px-3 py-2">Wiki slug</th>
              <th className="text-left px-3 py-2">Scheduled at</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((p) => (
              <tr key={p.id} className="border-b border-sol-line">
                <td className="px-3 py-2">{p.userName ?? '—'} <span className="text-sol-ink-2 text-xs">{p.phone ?? ''}</span></td>
                <td className="px-3 py-2 font-semibold">
                  {p.dayOffset > 0 ? `D${p.dayOffset}` : p.dayOffset === 0 ? 'Q-Day' : `T${p.dayOffset}`}
                </td>
                <td className="px-3 py-2"><code className="text-xs">{p.templateCode}</code></td>
                <td className="px-3 py-2 text-xs text-sol-ink-2">{p.wikiSlug ?? '—'}</td>
                <td className="px-3 py-2">{new Date(p.scheduledAt).toLocaleString('vi-VN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.items.length === 0 && <div className="text-center py-8 text-sol-ink-2">Không có push nào trong {hours} giờ tới.</div>}
      </div>
    </div>
  );
}

/* ─── TAB USERS ────────────────────────────────────────────────────────── */
function TabUsers() {
  const [status, setStatus] = useState<JourneyStatus>('active');
  const [journeyType, setJourneyType] = useState<JourneyType | ''>('');
  const [users, setUsers] = useState<JourneyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const r = await journeyApi.users(status, (journeyType as JourneyType) || undefined);
      setUsers(r.items);
    } catch (e: any) {
      setErr(e.message ?? 'Lỗi');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [status, journeyType]);

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <select value={status} onChange={(e) => setStatus(e.target.value as JourneyStatus)} className="rounded border-sol-line px-3 py-1 text-meta">
          <option value="active">Đang journey</option>
          <option value="paused">Tạm dừng</option>
          <option value="graduated">Tốt nghiệp</option>
          <option value="relapsed">Tái nghiện</option>
        </select>
        <select value={journeyType} onChange={(e) => setJourneyType(e.target.value as JourneyType | '')} className="rounded border-sol-line px-3 py-1 text-meta">
          <option value="">Tất cả lộ trình</option>
          <option value="full-51">Full 51 ngày</option>
          <option value="lam-quen">Làm Quen (7)</option>
          <option value="giam-dan">Giảm Dần (14)</option>
          <option value="q-day">Q-Day (30)</option>
          <option value="maintenance">Maintenance</option>
        </select>
        <button onClick={load} className="ml-auto text-meta text-sol-orange hover:underline">🔄 Refresh</button>
      </div>

      {loading && <Loading />}
      {err && <ErrorBox msg={err} />}
      {!loading && !err && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-meta">
            <thead className="bg-sol-line/40">
              <tr>
                <th className="text-left px-3 py-2">User</th>
                <th className="text-left px-3 py-2">Lộ trình</th>
                <th className="text-left px-3 py-2">Day</th>
                <th className="text-left px-3 py-2">Q-Day</th>
                <th className="text-left px-3 py-2">Sent / Opened / Clicked</th>
                <th className="text-left px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-sol-line">
                  <td className="px-3 py-2">{u.name ?? '—'} <span className="text-xs text-sol-ink-2">{u.phone ?? ''}</span></td>
                  <td className="px-3 py-2"><code className="text-xs">{u.journeyType}</code></td>
                  <td className="px-3 py-2 font-semibold">{u.currentDay ?? '—'}</td>
                  <td className="px-3 py-2 text-xs">{u.qDayDate ? new Date(u.qDayDate).toLocaleDateString('vi-VN') : '—'}</td>
                  <td className="px-3 py-2">{u.sent} / {u.opened} / {u.clicked}</td>
                  <td className="px-3 py-2">
                    <button
                      onClick={async () => {
                        if (!confirm(`Cancel journey của ${u.name}?`)) return;
                        await journeyApi.cancel(u.id, 'admin_cancel');
                        load();
                      }}
                      className="text-red-600 text-xs hover:underline"
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <div className="text-center py-8 text-sol-ink-2">Không có user nào.</div>}
        </div>
      )}
    </div>
  );
}

/* ─── TAB ENROLL ───────────────────────────────────────────────────────── */
function TabEnroll() {
  const [userId, setUserId] = useState('');
  const [journeyType, setJourneyType] = useState<JourneyType>('full-51');
  const [qDayDate, setQDayDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [preferredHour, setPreferredHour] = useState(7);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function submit() {
    if (!userId) { setResult('Vui lòng nhập userId'); return; }
    setSubmitting(true);
    setResult(null);
    try {
      const r = await journeyApi.enroll({
        userId,
        journeyType,
        qDayDate: new Date(qDayDate + 'T07:00:00').toISOString(),
        preferredHour,
      });
      setResult(`✓ Đã tạo ${r.created} ScheduledPush cho user ${r.userId}`);
      setUserId('');
    } catch (e: any) {
      setResult('✗ ' + (e.message ?? 'Lỗi'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="bg-blue-50 border border-blue-200 rounded p-3 text-meta text-sol-ink">
        ℹ Enroll thủ công 1 user (chỉ test). Production user sẽ tự enroll qua Zalo Welcome flow.
      </div>

      <div>
        <label className="block text-meta font-semibold mb-1">User ID</label>
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="cmpXXXXXXXXX..."
          className="w-full rounded border border-sol-line px-3 py-2 text-meta"
        />
      </div>

      <div>
        <label className="block text-meta font-semibold mb-1">Lộ trình</label>
        <select
          value={journeyType}
          onChange={(e) => setJourneyType(e.target.value as JourneyType)}
          className="w-full rounded border border-sol-line px-3 py-2 text-meta"
        >
          <option value="full-51">Full 51 ngày (7+14+30) — recommended</option>
          <option value="lam-quen">7 ngày Làm Quen only</option>
          <option value="giam-dan">14 ngày Giảm Dần</option>
          <option value="q-day">30 ngày Q-Day only</option>
          <option value="maintenance">Maintenance (post-D30)</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-meta font-semibold mb-1">Q-Day</label>
          <input
            type="date"
            value={qDayDate}
            onChange={(e) => setQDayDate(e.target.value)}
            className="w-full rounded border border-sol-line px-3 py-2 text-meta"
          />
        </div>
        <div>
          <label className="block text-meta font-semibold mb-1">Giờ push (0-23)</label>
          <input
            type="number"
            min={0}
            max={23}
            value={preferredHour}
            onChange={(e) => setPreferredHour(parseInt(e.target.value))}
            className="w-full rounded border border-sol-line px-3 py-2 text-meta"
          />
        </div>
      </div>

      <button
        onClick={submit}
        disabled={submitting || !userId}
        className="rounded bg-sol-orange text-white px-4 py-2 text-meta font-semibold disabled:opacity-50"
      >
        {submitting ? 'Đang enroll...' : 'Enroll User'}
      </button>

      {result && (
        <div className={`p-3 rounded ${result.startsWith('✓') ? 'bg-green-50 border-green-300 text-green-800' : 'bg-red-50 border-red-300 text-red-800'} border`}>
          {result}
        </div>
      )}
    </div>
  );
}

/* ─── helpers ──────────────────────────────────────────────────────────── */
function Loading() {
  return <div className="text-center py-8 text-sol-ink-2">⏳ Loading...</div>;
}
function ErrorBox({ msg }: { msg: string }) {
  return <div className="bg-red-50 border border-red-300 text-red-800 p-3 rounded">{msg}</div>;
}
