// admin/src/pages/AdminZaloSos.tsx
//
// Sol v4 (Sprint 3) — Admin SOS Alerts dashboard.
//
// Hiển thị real-time alerts từ user:
//   - 🚨 critical (đau ngực, ho ra máu) — highlighted đỏ
//   - ⚠ high (sắp hút, không kiềm)
//   - ⚡ medium (tự hại, không muốn sống)
//   - low (no-reply 3 days)
//
// Khang có thể:
//   - Xem severity + content user gửi
//   - Reply nhanh (Free OA message trong 48h window)
//   - Resolve khi xong
//   - Click vào user để xem journey progress

import { useEffect, useState, useRef } from 'react';
import { journeyApi, type SOSAlertItem, type SosSeverity } from '../services/api';

const SEVERITY_META: Record<SosSeverity, { icon: string; label: string; bg: string; border: string; text: string }> = {
  critical: { icon: '🚨', label: 'CRITICAL', bg: 'bg-red-100', border: 'border-red-500', text: 'text-red-900' },
  high:     { icon: '⚠️', label: 'HIGH',     bg: 'bg-orange-100', border: 'border-orange-500', text: 'text-orange-900' },
  medium:   { icon: '⚡', label: 'MEDIUM',   bg: 'bg-yellow-100', border: 'border-yellow-500', text: 'text-yellow-900' },
  low:      { icon: 'ℹ️', label: 'LOW',      bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-900' },
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chưa xử lý',
  auto_responded: 'Đã auto-reply',
  admin_responding: 'Khang đang trả lời',
  resolved: 'Đã giải quyết',
  no_response_72h: 'Quá hạn 72h',
};

export function AdminZaloSos() {
  const [statusFilter, setStatusFilter] = useState<string>('pending,auto_responded,admin_responding');
  const [alerts, setAlerts] = useState<SOSAlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const previousCount = useRef<number>(0);
  const [audioEnabled, setAudioEnabled] = useState(false);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const r = await journeyApi.sosList(statusFilter);

      // Play sound nếu có alert critical mới (chỉ khi audio enabled)
      if (audioEnabled && r.items.length > previousCount.current) {
        const newCritical = r.items.find((a) => a.severity === 'critical' && a.status === 'pending');
        if (newCritical) playAlarm();
      }
      previousCount.current = r.items.length;

      setAlerts(r.items);
    } catch (e: any) {
      setErr(e.message ?? 'Lỗi');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const i = setInterval(load, 15000); // poll mỗi 15s
    return () => clearInterval(i);
  }, [statusFilter]);

  function playAlarm() {
    try {
      // Beep ngắn 3 lần
      const ctx = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
      [0, 0.3, 0.6].forEach((delay) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.frequency.value = 800;
        g.gain.setValueAtTime(0.3, ctx.currentTime + delay);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.2);
        o.start(ctx.currentTime + delay);
        o.stop(ctx.currentTime + delay + 0.2);
      });
    } catch {}
  }

  async function respondAlert(id: string) {
    if (!responseText.trim()) return;
    try {
      await journeyApi.sosRespond(id, responseText);
      setRespondingId(null);
      setResponseText('');
      load();
    } catch (e: any) {
      alert('Lỗi: ' + e.message);
    }
  }

  async function resolveAlert(id: string) {
    try {
      await journeyApi.sosResolve(id, resolveNotes);
      setResolvingId(null);
      setResolveNotes('');
      load();
    } catch (e: any) {
      alert('Lỗi: ' + e.message);
    }
  }

  // Group by severity
  const grouped = {
    critical: alerts.filter((a) => a.severity === 'critical'),
    high: alerts.filter((a) => a.severity === 'high'),
    medium: alerts.filter((a) => a.severity === 'medium'),
    low: alerts.filter((a) => a.severity === 'low'),
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-h1 font-bold text-sol-ink flex items-center gap-2">
            <span>🆘</span> SOS Alerts
          </h1>
          <p className="text-meta text-sol-ink-2 mt-1">
            User báo khủng hoảng — Khang trả lời + giải quyết. Auto refresh mỗi 15s.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-meta cursor-pointer">
            <input
              type="checkbox"
              checked={audioEnabled}
              onChange={(e) => setAudioEnabled(e.target.checked)}
            />
            🔔 Bật âm cảnh báo
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded border-sol-line px-3 py-1 text-meta"
          >
            <option value="pending,auto_responded,admin_responding">Đang mở</option>
            <option value="resolved">Đã giải quyết</option>
            <option value="pending,auto_responded,admin_responding,resolved,no_response_72h">Tất cả</option>
          </select>
        </div>
      </div>

      {loading && alerts.length === 0 && <Loading />}
      {err && <ErrorBox msg={err} />}

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        {(['critical', 'high', 'medium', 'low'] as SosSeverity[]).map((s) => (
          <div key={s} className={`rounded-lg border-2 p-3 ${SEVERITY_META[s].bg} ${SEVERITY_META[s].border}`}>
            <div className="flex items-center justify-between">
              <span className="text-xl">{SEVERITY_META[s].icon}</span>
              <span className={`text-3xl font-bold ${SEVERITY_META[s].text}`}>{grouped[s].length}</span>
            </div>
            <div className={`text-meta font-semibold ${SEVERITY_META[s].text}`}>{SEVERITY_META[s].label}</div>
          </div>
        ))}
      </div>

      {/* Alerts list — grouped by severity */}
      <div className="space-y-3">
        {(['critical', 'high', 'medium', 'low'] as SosSeverity[]).map((sev) =>
          grouped[sev].map((a) => (
            <AlertCard
              key={a.id}
              alert={a}
              isResponding={respondingId === a.id}
              isResolving={resolvingId === a.id}
              responseText={responseText}
              resolveNotes={resolveNotes}
              onRespond={() => setRespondingId(a.id)}
              onCancelRespond={() => { setRespondingId(null); setResponseText(''); }}
              onSendResponse={() => respondAlert(a.id)}
              onResolve={() => setResolvingId(a.id)}
              onCancelResolve={() => { setResolvingId(null); setResolveNotes(''); }}
              onConfirmResolve={() => resolveAlert(a.id)}
              setResponseText={setResponseText}
              setResolveNotes={setResolveNotes}
            />
          )),
        )}
        {alerts.length === 0 && !loading && (
          <div className="text-center py-12 text-sol-ink-2 bg-green-50 rounded-lg border-2 border-green-200">
            ✅ Không có SOS nào đang mở. User đang ổn!
          </div>
        )}
      </div>
    </div>
  );
}

function AlertCard({
  alert: a,
  isResponding,
  isResolving,
  responseText,
  resolveNotes,
  onRespond,
  onCancelRespond,
  onSendResponse,
  onResolve,
  onCancelResolve,
  onConfirmResolve,
  setResponseText,
  setResolveNotes,
}: any) {
  const meta = SEVERITY_META[a.severity as SosSeverity];
  const since = Math.floor((Date.now() - new Date(a.triggeredAt).getTime()) / 60000);

  return (
    <div className={`rounded-lg border-2 ${meta.bg} ${meta.border} p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{meta.icon}</span>
            <span className={`text-meta font-bold ${meta.text}`}>{meta.label}</span>
            <span className="text-meta text-sol-ink-2">|</span>
            <span className="text-meta font-semibold">{a.userName ?? a.userId.slice(0, 8)}</span>
            {a.currentDay !== null && (
              <span className="text-xs bg-white rounded px-2 py-0.5 border border-sol-line">
                Day {a.currentDay}
              </span>
            )}
          </div>
          <div className="text-meta text-sol-ink mb-1">
            <strong>Trigger:</strong> <code className="text-xs">{a.triggerType}</code>
            {a.matchedKeyword && <span className="ml-2 text-xs italic">match: "{a.matchedKeyword}"</span>}
          </div>
          {a.userMessage && (
            <blockquote className="text-meta italic border-l-4 border-sol-line pl-3 my-2 bg-white/50">
              "{a.userMessage}"
            </blockquote>
          )}
          <div className="text-xs text-sol-ink-2 flex gap-3">
            <span>⏱ {since} phút trước ({new Date(a.triggeredAt).toLocaleTimeString('vi-VN')})</span>
            <span>📌 {STATUS_LABELS[a.status] ?? a.status}</span>
            {a.respondedAt && <span>✉ Đã trả lời lúc {new Date(a.respondedAt).toLocaleTimeString('vi-VN')}</span>}
          </div>
        </div>

        {a.status !== 'resolved' && (
          <div className="flex flex-col gap-2 shrink-0">
            <button
              onClick={onRespond}
              className="px-3 py-1.5 text-xs rounded bg-sol-orange text-white font-semibold hover:bg-orange-600"
            >
              💬 Trả lời
            </button>
            <button
              onClick={onResolve}
              className="px-3 py-1.5 text-xs rounded bg-green-600 text-white font-semibold hover:bg-green-700"
            >
              ✓ Resolve
            </button>
          </div>
        )}
      </div>

      {isResponding && (
        <div className="mt-3 pt-3 border-t border-sol-line bg-white rounded p-3">
          <label className="block text-xs font-semibold mb-1">Tin trả lời (Free OA, trong 48h window)</label>
          <textarea
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            rows={3}
            placeholder={`Khang đây ${a.userName ?? 'anh'}. Em ổn không?...`}
            className="w-full rounded border border-sol-line px-3 py-2 text-meta"
          />
          <div className="mt-2 flex gap-2">
            <button onClick={onSendResponse} className="px-3 py-1 text-xs rounded bg-sol-orange text-white">Gửi</button>
            <button onClick={onCancelRespond} className="px-3 py-1 text-xs rounded bg-gray-300">Huỷ</button>
          </div>
        </div>
      )}

      {isResolving && (
        <div className="mt-3 pt-3 border-t border-sol-line bg-white rounded p-3">
          <label className="block text-xs font-semibold mb-1">Ghi chú resolve (optional)</label>
          <textarea
            value={resolveNotes}
            onChange={(e) => setResolveNotes(e.target.value)}
            rows={2}
            placeholder="User OK, không hút lại..."
            className="w-full rounded border border-sol-line px-3 py-2 text-meta"
          />
          <div className="mt-2 flex gap-2">
            <button onClick={onConfirmResolve} className="px-3 py-1 text-xs rounded bg-green-600 text-white">Resolve</button>
            <button onClick={onCancelResolve} className="px-3 py-1 text-xs rounded bg-gray-300">Huỷ</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Loading() {
  return <div className="text-center py-8 text-sol-ink-2">⏳ Loading...</div>;
}
function ErrorBox({ msg }: { msg: string }) {
  return <div className="bg-red-50 border border-red-300 text-red-800 p-3 rounded">{msg}</div>;
}
