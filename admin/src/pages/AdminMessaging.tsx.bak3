// admin/src/pages/AdminMessaging.tsx
//
// Sol v3 — Bộ Điều Khiển Tin Nhắn Linh Hoạt (Khang yêu cầu 12-05-2026).
// Port từ docs/admin-messaging-mockup.html sang React.
//
// 5 tabs:
//   1. Global Policy — cường độ default + per-template toggle
//   2. Cohort — Light/Moderate/Heavy theo FTND
//   3. Per-user — override cho 30 anh em pilot
//   4. A/B Test — chạy experiment
//   5. Reports — engagement + cost
//
// Phase 1: UI thuần — data hardcoded để Khang xem flow.
// Phase 2 (done): wire backend API /api/messaging/*

import { useState, useEffect } from 'react';
import { messagingApi, type MessagingIntensity, type MessagingStats } from '../services/api';

type TabKey = 'global' | 'cohort' | 'user' | 'ab' | 'reports';

export function AdminMessaging() {
  const [tab, setTab] = useState<TabKey>('global');

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-h1 font-bold text-sol-ink flex items-center gap-2">
          <span>💬</span> Bộ Điều Khiển Nhắn Tin
        </h1>
        <p className="text-meta text-sol-ink-2 mt-1">
          Điều chỉnh tần suất + cường độ tin push Zalo OA động — toàn cohort, mỗi nhóm, từng user.
        </p>
      </div>

      <div className="flex gap-1 border-b-2 border-sol-line">
        {[
          { key: 'global', icon: '⚙️', label: 'Global' },
          { key: 'cohort', icon: '👥', label: 'Cohort' },
          { key: 'user', icon: '👤', label: 'Per-user' },
          { key: 'ab', icon: '🧪', label: 'A/B Test' },
          { key: 'reports', icon: '📊', label: 'Reports' },
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

      {tab === 'global' && <TabGlobal />}
      {tab === 'cohort' && <TabCohort />}
      {tab === 'user' && <TabUser />}
      {tab === 'ab' && <TabAB />}
      {tab === 'reports' && <TabReports />}
    </div>
  );
}

/* ─── TAB GLOBAL ──────────────────────────────────────────────────────── */
function TabGlobal() {
  const [intensity, setIntensity] = useState<MessagingIntensity>('MEDIUM');
  const [stats, setStats] = useState<MessagingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [global, statsData] = await Promise.all([
        messagingApi.getGlobal(),
        messagingApi.getStats(),
      ]);
      setIntensity(global.intensity);
      setStats(statsData);
    } catch (err) {
      console.error('Load global policy failed', err);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function handleSave() {
    setSaving(true);
    setSaveMsg(null);
    try {
      await messagingApi.updateGlobal({ intensity, config: {}, enabled: true });
      setSaveMsg('Đã lưu Global policy. Backend sẽ apply runtime.');
      setTimeout(() => setSaveMsg(null), 3000);
    } catch (err: any) {
      setSaveMsg('Lỗi: ' + (err?.message ?? 'unknown'));
    } finally {
      setSaving(false);
    }
  }

  const statsDisplay = stats ? [
    { label: 'Tin gửi 24h', value: String(stats.sent24h), sub: `Tổng 7d: ${stats.sent7d}` },
    { label: 'User active', value: String((stats.cohorts.LIGHT + stats.cohorts.MODERATE + stats.cohorts.HEAVY) || 0), sub: `L ${stats.cohorts.LIGHT} · M ${stats.cohorts.MODERATE} · H ${stats.cohorts.HEAVY}` },
    { label: 'Open rate 7d', value: `${stats.openRate}%`, sub: 'Benchmark 75%' },
    { label: 'Chi phí 30d', value: `${(stats.cost30dVnd / 1000).toFixed(0)}k`, sub: `Block rate: ${stats.blockRate}%` },
  ] : [
    { label: 'Tin gửi 24h', value: '—', sub: 'Đang tải...' },
    { label: 'User active', value: '—', sub: '—' },
    { label: 'Open rate 7d', value: '—', sub: '—' },
    { label: 'Chi phí tháng', value: '—', sub: '—' },
  ];

  const intensityOptions = [
    { id: 'LIGHT', emoji: '🟢', name: 'Nhẹ', desc: 'Min push, chỉ critical', count: '~15 tin / user / 52 ngày' },
    { id: 'MEDIUM', emoji: '🟡', name: 'Vừa', desc: 'Default Sol v3', count: '~30 tin / user / 52 ngày' },
    { id: 'HEAVY', emoji: '🔴', name: 'Mạnh', desc: 'Daily + multi/day', count: '~50 tin / user / 52 ngày' },
    { id: 'CUSTOM', emoji: '⚙️', name: 'Tuỳ chỉnh', desc: 'Khang config tay', count: 'Variable' },
  ];

  const templates = [
    { code: 'SOL_WELCOME', desc: 'Day 1 chào mừng', tag: 'Tag 2', sent: 3, status: 'Approved', enabled: true },
    { code: 'SOL_DAILY_CHECKIN', desc: '20:00 nhắc check-in', tag: 'Tag 2', sent: 32, status: 'Approved', enabled: true },
    { code: 'SOL_VOICE_RELEASE', desc: 'Voice Khang cột mốc', tag: 'Tag 2', sent: 0, status: 'Voice 404', enabled: true, warning: true },
    { code: 'SOL_Q_DAY_MORNING', desc: 'Day 22 sáng 7h', tag: 'Tag 2', sent: 1, status: 'Approved', enabled: true },
    { code: 'SOL_T_MINUS_2', desc: 'Day 20 còn 2 ngày', tag: 'Tag 2', sent: 2, status: 'Approved', enabled: true },
    { code: 'SOL_CRISIS_DETECT', desc: 'Ad-hoc moment khó', tag: 'Tag 2', sent: 4, status: 'Approved', enabled: true },
    { code: 'SOL_LAPSE_RECOVERY', desc: 'User vắng 7+ ngày', tag: 'Tag 2', sent: 0, status: 'Draft', enabled: false },
  ];

  return (
    <div className="space-y-5">
      {/* Stat row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statsDisplay.map((s) => (
          <div key={s.label} className="sol-card p-4">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-sol-ink-3">{s.label}</div>
            <div className="text-2xl font-bold text-sol-orange-ink mt-1">{s.value}</div>
            <div className="text-meta text-sol-ink-2 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Intensity slider */}
      <div className="sol-card p-5">
        <h3 className="text-h3 mb-1">Cường độ tổng quát (Global default)</h3>
        <p className="text-meta text-sol-ink-2 mb-3">
          Mức nền — sẽ bị override theo Cohort + User policy. Chỉnh slider rồi bấm Save để apply runtime.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {intensityOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setIntensity(opt.id as any)}
              className={`text-left p-4 rounded-xl border-2 transition ${
                intensity === opt.id
                  ? 'border-sol-orange bg-sol-orange-soft'
                  : 'border-sol-line bg-white hover:bg-sol-paper'
              }`}
            >
              <div className="text-2xl">{opt.emoji}</div>
              <div className="font-bold text-body mt-1">{opt.name}</div>
              <div className="text-meta text-sol-ink-2 mt-1">{opt.desc}</div>
              <div className="text-[11px] text-sol-ink-3 mt-2">{opt.count}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Template list */}
      <div className="sol-card overflow-hidden">
        <div className="px-5 py-3 border-b border-sol-line bg-sol-soft">
          <h3 className="text-h3">Per-template Status</h3>
        </div>
        <div className="divide-y divide-sol-soft">
          <div className="grid grid-cols-[30px_1fr_90px_80px_100px_60px] items-center px-5 py-2 text-[11px] uppercase tracking-wider font-semibold text-sol-ink-2 bg-sol-soft">
            <span></span>
            <span>Template</span>
            <span>Tag</span>
            <span>Sent today</span>
            <span>Status Zalo</span>
            <span></span>
          </div>
          {templates.map((t) => (
            <div key={t.code} className="grid grid-cols-[30px_1fr_90px_80px_100px_60px] items-center px-5 py-3 hover:bg-sol-paper">
              <Toggle enabled={t.enabled} />
              <div>
                <div className="font-semibold text-body">{t.code}</div>
                <div className="text-[11px] text-sol-ink-3">{t.desc}</div>
              </div>
              <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sol-green-soft text-sol-green-ink">{t.tag}</span>
              <span className="text-meta">{t.sent}</span>
              <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                t.warning
                  ? 'bg-sol-red-soft text-sol-red-ink'
                  : t.status === 'Approved'
                    ? 'bg-sol-green-soft text-sol-green-ink'
                    : 'bg-sol-orange-soft text-sol-orange-ink'
              }`}>{t.status}</span>
              <button className="text-sol-ink-3 hover:text-sol-ink">⚙️</button>
            </div>
          ))}
        </div>
      </div>

      {saveMsg && (
        <div className={`rounded-xl p-3 text-meta ${
          saveMsg.startsWith('Lỗi')
            ? 'bg-sol-red-soft text-sol-red-ink border border-sol-red/30'
            : 'bg-sol-green-soft text-sol-green-ink border border-sol-green/30'
        }`}>
          {saveMsg}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button onClick={load} className="btn-secondary" disabled={loading || saving}>
          ↻ Reload
        </button>
        <button onClick={handleSave} className="btn-primary" disabled={saving || loading}>
          {saving ? 'Đang lưu…' : '💾 Save & Apply Runtime'}
        </button>
      </div>
    </div>
  );
}

/* ─── TAB COHORT ──────────────────────────────────────────────────────── */
function TabCohort() {
  const cohorts = [
    {
      key: 'light', name: '🟢 Light', count: 5, color: 'sol-green',
      criteria: 'FTND 0-3 · < 10 điếu/ngày',
      rules: [
        { k: 'SOL_DAILY_CHECKIN', v: 'Skip — weekly chỉ 1 lần' },
        { k: 'SOL_VOICE_RELEASE', v: 'Chỉ Day 1, 22, 52 (3 voice)' },
        { k: 'SOL_T_MINUS_2', v: 'Skip (đủ Day 22 push)' },
        { k: 'Crisis threshold', v: '8/10' },
        { k: 'Cường độ', v: '🟢 Nhẹ' },
      ],
    },
    {
      key: 'moderate', name: '🟡 Moderate', count: 22, color: 'sol-orange',
      criteria: 'FTND 4-6 · 10-20 điếu/ngày',
      rules: [
        { k: 'SOL_DAILY_CHECKIN', v: '1 tin/ngày tối 20:00' },
        { k: 'SOL_VOICE_RELEASE', v: 'Day 1, 3, 7, 14, 22, 30, 51' },
        { k: 'SOL_T_MINUS_2', v: 'Day 20 sáng 7h' },
        { k: 'Crisis threshold', v: '7/10' },
        { k: 'Cường độ', v: '🟡 Vừa (default)' },
      ],
    },
    {
      key: 'heavy', name: '🔴 Heavy', count: 12, color: 'sol-red',
      criteria: 'FTND 7-10 · > 20 điếu/ngày',
      rules: [
        { k: 'SOL_DAILY_CHECKIN', v: '2 tin/ngày (8h + 20h)' },
        { k: 'SOL_VOICE_RELEASE', v: '+ Day 5, 10, 17 (10 voice)' },
        { k: 'SOL_T_MINUS_2', v: 'Day 18 (sớm 2 ngày)' },
        { k: 'Crisis threshold', v: '6/10 — escalate Khang nhanh' },
        { k: 'Cường độ', v: '🔴 Mạnh' },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-h3 mb-1">Phân nhóm tự động theo FTND Score (Fagerström)</h3>
        <p className="text-meta text-sol-ink-2">
          User được auto-assign cohort khi onboarding. Mỗi cohort có rule push riêng — override Global.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {cohorts.map((c) => (
          <div key={c.key} className="sol-card p-5 border-t-4" style={{ borderTopColor: c.color === 'sol-green' ? '#2E7D32' : c.color === 'sol-orange' ? '#B8860B' : '#B25C2C' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-body font-bold">{c.name}</div>
              <span className="bg-sol-soft px-3 py-1 rounded-full text-meta font-semibold">{c.count} user</span>
            </div>
            <div className="bg-sol-soft p-2 rounded-lg text-meta text-sol-ink-2 mb-3">{c.criteria}</div>
            <div className="space-y-1.5">
              {c.rules.map((r) => (
                <div key={r.k} className="text-meta py-1 border-b border-sol-soft last:border-0">
                  <span className="text-sol-ink-3">{r.k}: </span>
                  <span className="text-sol-ink">{r.v}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <button className="btn-secondary">+ Tạo Cohort tuỳ chỉnh</button>
        <button className="btn-primary">💾 Save Cohort Rules</button>
      </div>
    </div>
  );
}

/* ─── TAB USER ────────────────────────────────────────────────────────── */
function TabUser() {
  const [selected, setSelected] = useState<string | null>('user-d');

  const users = [
    { id: 'user-a', name: 'Nguyễn Văn A', phone: '0901234567', ftnd: 8, cohort: 'Heavy', day: 18, engagement: '92%', override: '—', notes: 'Pilot batch 1' },
    { id: 'user-b', name: 'Trần Văn B', phone: '0912345678', ftnd: 5, cohort: 'Moderate', day: 22, engagement: '78%', override: 'Boost ON', notes: 'Vừa Q-Day, cần push thêm' },
    { id: 'user-c', name: 'Lê Văn C', phone: '0987654321', ftnd: 3, cohort: 'Light', day: 7, engagement: '45%', override: 'Mute 5d', notes: 'Đi công tác — xin tạm dừng' },
    { id: 'user-d', name: 'Phạm Văn D', phone: '0911111111', ftnd: 9, cohort: 'Heavy', day: 3, engagement: '—', override: 'Đã chọn', notes: 'Click để chỉnh' },
  ];

  const selectedUser = users.find(u => u.id === selected);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-h3 mb-1">Override per-user (cho pilot users)</h3>
        <p className="text-meta text-sol-ink-2">
          Tìm 1 user cụ thể, chỉnh rule push cho riêng người đó. Hữu ích cho pilot 30 anh em đầu.
        </p>
      </div>

      <input
        type="text"
        placeholder="🔍 Tìm user theo tên, SĐT, email..."
        className="w-full px-3 py-2.5 rounded-xl border border-sol-line text-body focus:outline-none focus:ring-2 focus:ring-sol-orange"
      />

      <div className="sol-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-sol-soft">
              {['User', 'FTND', 'Cohort', 'Day', 'Engagement', 'Override', 'Notes'].map((h) => (
                <th key={h} className="px-3 py-2 text-left text-[11px] uppercase tracking-wider font-semibold text-sol-ink-2">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                onClick={() => setSelected(u.id)}
                className={`cursor-pointer border-b border-sol-soft ${selected === u.id ? 'bg-sol-orange-soft' : 'hover:bg-sol-paper'}`}
              >
                <td className="px-3 py-2.5">
                  <div className="font-semibold">{u.name}</div>
                  <div className="text-[11px] text-sol-ink-3">{u.phone}</div>
                </td>
                <td className="px-3 py-2.5 text-meta">
                  <span className="inline-block w-14 h-1.5 bg-sol-line rounded-full overflow-hidden mr-2 align-middle">
                    <span className="block h-full bg-sol-red" style={{ width: `${u.ftnd * 10}%` }} />
                  </span>
                  {u.ftnd}
                </td>
                <td className="px-3 py-2.5">
                  <CohortPill cohort={u.cohort} />
                </td>
                <td className="px-3 py-2.5 text-meta">{u.day}</td>
                <td className="px-3 py-2.5 text-meta">{u.engagement}</td>
                <td className="px-3 py-2.5 text-meta">{u.override}</td>
                <td className="px-3 py-2.5 text-meta text-sol-ink-3">{u.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <div className="sol-card p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-sol-line">
            <div>
              <div className="text-body font-bold">{selectedUser.name}</div>
              <div className="text-meta text-sol-ink-2">
                SĐT {selectedUser.phone} · FTND {selectedUser.ftnd} · {selectedUser.cohort} · Day {selectedUser.day}
              </div>
            </div>
            <button className="btn-secondary text-meta">Xem lịch sử tin</button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <Field label="Cường độ user này">
              <select className="input-text">
                <option>🔴 Mạnh (theo Cohort Heavy)</option>
                <option>🟡 Vừa</option>
                <option>🟢 Nhẹ</option>
                <option>⚙️ Tuỳ chỉnh</option>
              </select>
            </Field>
            <Field label="Boost mode">
              <select className="input-text">
                <option>Off</option>
                <option>On — push extra 14 ngày</option>
              </select>
            </Field>
            <Field label="Mute until">
              <input type="date" className="input-text" />
            </Field>
            <Field label="Crisis threshold (1-10)">
              <input type="number" defaultValue={5} min={1} max={10} className="input-text" />
            </Field>
          </div>

          <Field label="Notes Khang">
            <input
              type="text"
              defaultValue="Anh D nghiện nặng, mới đăng ký, cần Khang theo dõi sát"
              className="input-text"
            />
          </Field>

          <div className="flex justify-end gap-2 mt-4">
            <button className="btn-secondary">Reset về Cohort default</button>
            <button className="btn-primary">💾 Save Override</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── TAB AB ──────────────────────────────────────────────────────────── */
function TabAB() {
  const experiments = [
    {
      id: 'exp-1', title: 'Q-Day Push Timing', meta: '08-05-2026 · 14 ngày · 30 user', status: 'running' as const,
      variants: [
        { name: 'Variant A (control)', config: 'SOL_Q_DAY_MORNING gửi 7:00', metric: '62%', sample: 'Commit rate · n=15', winner: false },
        { name: 'Variant B 🏆', config: 'SOL_Q_DAY_MORNING gửi 8:00', metric: '78%', sample: 'Commit rate · n=15 · +16%', winner: true },
      ],
    },
    {
      id: 'exp-2', title: 'Voice vs Text-only fallback', meta: '21 ngày · 50 user', status: 'concluded' as const,
      variants: [
        { name: 'Variant A 🏆', config: 'SOL_VOICE_RELEASE có nút Nghe Khang', metric: '82%', sample: 'Engagement · n=25 · +24%', winner: true },
        { name: 'Variant B', config: 'SOL_VOICE_RELEASE_TEXT only (no voice)', metric: '58%', sample: 'Engagement · n=25', winner: false },
      ],
      decision: 'Giữ voice as default, fallback text khi voice fail.',
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-h3 mb-1">A/B Testing — thử nghiệm chiến lược push</h3>
        <p className="text-meta text-sol-ink-2">
          Chạy experiment trên user thật để tìm chiến lược tối ưu. Sol auto-assign user vào variant + track metric.
        </p>
      </div>

      <div className="flex justify-end">
        <button className="btn-primary">+ Tạo Experiment mới</button>
      </div>

      {experiments.map((exp) => (
        <div key={exp.id} className="sol-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-body font-bold">{exp.title}</div>
              <div className="text-meta text-sol-ink-3">{exp.meta}</div>
            </div>
            <span className={`px-3 py-1 rounded-full text-meta font-semibold ${
              exp.status === 'running' ? 'bg-sol-green-soft text-sol-green-ink' : 'bg-sol-orange-soft text-sol-orange-ink'
            }`}>
              {exp.status === 'running' ? '🟢 Đang chạy' : '✓ Kết thúc'}
            </span>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {exp.variants.map((v) => (
              <div
                key={v.name}
                className={`p-3 rounded-lg border ${v.winner ? 'border-sol-green bg-sol-green-soft' : 'border-sol-line bg-white'}`}
              >
                <div className="font-bold text-body">{v.name}</div>
                <div className="text-meta text-sol-ink-2 mt-1">{v.config}</div>
                <div className="text-h2 font-bold text-sol-orange-ink mt-2">{v.metric}</div>
                <div className="text-[11px] text-sol-ink-3">{v.sample}</div>
              </div>
            ))}
          </div>
          {exp.decision && (
            <p className="mt-3 text-meta text-sol-ink-2">
              <strong>Quyết định:</strong> {exp.decision}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── TAB REPORTS ─────────────────────────────────────────────────────── */
function TabReports() {
  const stats = [
    { label: 'Total sent 7d', value: '1,560', sub: 'avg 222/day' },
    { label: 'Open rate', value: '78%', sub: '↑ 3% vs last week' },
    { label: 'Click rate (CTA)', value: '22%', sub: 'benchmark 15%' },
    { label: 'Block rate', value: '1.2%', sub: 'safe < 5%', good: true },
  ];

  const templatePerf = [
    { emoji: '🎙', code: 'SOL_VOICE_RELEASE', sent: 156, opened: '88%', clicked: '42%', cost: '39k', score: 'A+' },
    { emoji: '🌅', code: 'SOL_Q_DAY_MORNING', sent: 23, opened: '96%', clicked: '78%', cost: '6k', score: 'A+' },
    { emoji: '📝', code: 'SOL_DAILY_CHECKIN', sent: 820, opened: '72%', clicked: '34%', cost: '205k', score: 'A' },
    { emoji: '🆘', code: 'SOL_CRISIS_DETECT', sent: 34, opened: '98%', clicked: '65%', cost: '9k', score: 'A+' },
    { emoji: '🦁', code: 'SOL_LAPSE_RECOVERY', sent: 5, opened: '40%', clicked: '20%', cost: '1k', score: 'B' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-h3 mb-1">Báo cáo Hiệu quả Tin Nhắn</h3>
        <p className="text-meta text-sol-ink-2">Tổng quan engagement, chi phí, block rate — cập nhật mỗi giờ.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="sol-card p-4">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-sol-ink-3">{s.label}</div>
            <div className={`text-2xl font-bold mt-1 ${s.good ? 'text-sol-green-ink' : 'text-sol-orange-ink'}`}>{s.value}</div>
            <div className="text-meta text-sol-ink-2 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="sol-card overflow-hidden">
        <div className="px-5 py-3 border-b border-sol-line bg-sol-soft">
          <h3 className="text-h3">Per-template performance</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-sol-soft text-[11px] uppercase tracking-wider font-semibold text-sol-ink-2">
              <th className="px-3 py-2 text-left">Template</th>
              <th className="px-3 py-2 text-right">Sent</th>
              <th className="px-3 py-2 text-right">Opened</th>
              <th className="px-3 py-2 text-right">Clicked</th>
              <th className="px-3 py-2 text-right">Cost</th>
              <th className="px-3 py-2 text-center">Score</th>
            </tr>
          </thead>
          <tbody>
            {templatePerf.map((t) => (
              <tr key={t.code} className="border-b border-sol-soft">
                <td className="px-3 py-2.5">
                  <span className="mr-2">{t.emoji}</span>
                  <span className="font-semibold">{t.code}</span>
                </td>
                <td className="px-3 py-2.5 text-right text-meta">{t.sent}</td>
                <td className="px-3 py-2.5 text-right text-meta">{t.opened}</td>
                <td className="px-3 py-2.5 text-right text-meta">{t.clicked}</td>
                <td className="px-3 py-2.5 text-right text-meta">{t.cost}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={`font-bold ${t.score.startsWith('A') ? 'text-sol-green-ink' : 'text-sol-orange-ink'}`}>{t.score}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sol-card p-5">
        <h3 className="text-h3 mb-3">Chi phí ZNS 30 ngày qua</h3>
        <div className="space-y-2 text-meta">
          <div className="flex justify-between border-b border-sol-soft pb-2">
            <span>Tổng chi phí tháng này</span>
            <strong className="text-sol-orange-ink">260.000đ</strong>
          </div>
          <div className="flex justify-between border-b border-sol-soft pb-2">
            <span>Budget cap đang set</span>
            <span>500.000đ (52% used)</span>
          </div>
          <div className="flex justify-between border-b border-sol-soft pb-2">
            <span>Avg cost / paid user</span>
            <span>6.667đ / tháng</span>
          </div>
          <div className="flex justify-between">
            <span>Tổng paid user</span>
            <span>39</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Reusable components ─────────────────────────────────────────────── */
function Toggle({ enabled }: { enabled: boolean }) {
  return (
    <div className={`w-9 h-5 rounded-full relative cursor-pointer transition ${enabled ? 'bg-sol-green' : 'bg-sol-line'}`}>
      <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition ${enabled ? 'left-[18px]' : 'left-0.5'}`} />
    </div>
  );
}

function CohortPill({ cohort }: { cohort: string }) {
  const cls = cohort === 'Heavy'
    ? 'bg-sol-red-soft text-sol-red-ink'
    : cohort === 'Moderate'
      ? 'bg-sol-orange-soft text-sol-orange-ink'
      : 'bg-sol-green-soft text-sol-green-ink';
  return <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${cls}`}>{cohort}</span>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <label className="text-[11px] uppercase tracking-wider font-semibold text-sol-ink-3 mb-1">{label}</label>
      {children}
    </div>
  );
}
