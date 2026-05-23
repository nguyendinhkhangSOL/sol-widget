// dashboard/src/pages/admin/AdminUserDetail.tsx
// Trang chi tiết 1 user — hồ sơ, timeline, action panel.

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { TIER_COLOR, TIER_LABEL, formatVnd } from '../lib/featureGates';
import type { UserTier } from '../types';

type Detail = Awaited<ReturnType<typeof api.adminGetUser>>;

export function AdminUserDetail() {
  const { id } = useParams();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [voiceList, setVoiceList] = useState<Awaited<ReturnType<typeof api.adminListVoice>>['items']>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    if (!id) return;
    const d = await api.adminGetUser(id);
    setDetail(d);
    api.adminListVoice().then((r) => setVoiceList(r.items)).catch(() => {});
  }

  useEffect(() => {
    load();
    /* eslint-disable-next-line */
  }, [id]);

  if (!detail) return <div className="p-6 text-sol-ink-2">Đang tải…</div>;
  const u = detail.user;
  const tier = u.tier as UserTier;
  const c = TIER_COLOR[tier];

  async function patch(body: any, label: string) {
    if (!id) return;
    setBusy(label);
    setMsg(null);
    try {
      await api.adminPatchUser(id, body);
      setMsg('Đã cập nhật.');
      await load();
    } catch (e: any) {
      setMsg('Lỗi: ' + (e?.message ?? 'unknown'));
    } finally {
      setBusy(null);
      setTimeout(() => setMsg(null), 3000);
    }
  }

  async function sendVoice(voiceId: string) {
    if (!id) return;
    setBusy('voice-' + voiceId);
    try {
      await api.adminSendVoiceToUser(voiceId, id);
      setMsg('Đã gửi voice cho user.');
      await load();
    } catch (e: any) {
      setMsg('Lỗi: ' + (e?.message ?? 'unknown'));
    } finally {
      setBusy(null);
      setTimeout(() => setMsg(null), 3000);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link to="/users" className="text-meta text-sol-ink-3 underline">
            ← Tất cả user
          </Link>
          <h2 className="text-h2 text-sol-ink mt-1">{u.name}</h2>
          <div className="text-meta text-sol-ink-2">
            {u.phone} {u.email && `· ${u.email}`}
          </div>
        </div>
        <div className="text-right">
          <span
            className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-full"
            style={{ background: c.light, color: c.bg }}
          >
            {TIER_LABEL[tier]}
          </span>
          <div className="text-meta text-sol-ink-3 mt-1">
            Risk {u.riskScore}/100
            {u.cohortKey && ` · Đội ${u.cohortKey}`}
          </div>
        </div>
      </div>

      {msg && (
        <div className="bg-sol-green-soft border border-sol-green/30 text-sol-green-ink rounded-xl p-3 text-meta">
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Profile */}
        <section className="sol-card p-5 lg:col-span-2">
          <h3 className="text-h3 mb-3">Hồ sơ</h3>
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-3 text-meta">
            <Row label="Tuổi" value={u.age ?? '—'} />
            <Row label="Năm hút" value={u.yearsSmoked ?? '—'} />
            <Row label="Q-Day" value={u.quitDate ? new Date(u.quitDate).toLocaleDateString('vi-VN') : '—'} />
            <Row label="Streak" value={`${u.checkinStreak} ngày`} />
            <Row label="Streak dài nhất" value={`${u.longestStreak} ngày`} />
            <Row label="Bỏ check-in" value={`${u.missedDaysInRow} ngày`} />
            <Row label="Tier bắt đầu" value={u.tierStartedAt ? new Date(u.tierStartedAt).toLocaleDateString('vi-VN') : '—'} />
            <Row label="Hết hạn gói" value={u.tierExpiresAt ? new Date(u.tierExpiresAt).toLocaleDateString('vi-VN') : '—'} />
            <Row label="Bảo trì đến" value={u.maintenanceUntil ? new Date(u.maintenanceUntil).toLocaleDateString('vi-VN') : '—'} />
          </dl>
          {u.quitReasons?.length > 0 && (
            <div className="mt-4">
              <div className="text-meta uppercase text-sol-ink-3 font-semibold">Lý do cai</div>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {u.quitReasons.map((r: string, i: number) => (
                  <span key={i} className="px-2 py-1 rounded-lg bg-sol-green-soft text-sol-green-ink text-meta">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}
          {u.topTriggers?.length > 0 && (
            <div className="mt-3">
              <div className="text-meta uppercase text-sol-ink-3 font-semibold">Trigger</div>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {u.topTriggers.map((t: string, i: number) => (
                  <span key={i} className="px-2 py-1 rounded-lg bg-sol-orange-soft text-sol-orange-ink text-meta">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Action panel */}
        <section className="sol-card p-5">
          <h3 className="text-h3 mb-3">Hành động</h3>
          <div className="space-y-2">
            <ActionBtn
              label="🟡 Tặng gói Kiểm Soát (14d/99k)"
              onClick={() => patch({ comp: 'KHOI_DONG' }, 'comp_kd')}
              busy={busy === 'comp_kd'}
            />
            <ActionBtn
              label="🔴 Tặng gói Làm Chủ (30d/199k)"
              onClick={() => patch({ comp: 'DONG_HANH' }, 'comp_dh')}
              busy={busy === 'comp_dh'}
            />
            <ActionBtn
              label={u.isAdmin ? 'Bỏ quyền admin' : 'Cấp quyền admin'}
              onClick={() => patch({ isAdmin: !u.isAdmin }, 'admin')}
              busy={busy === 'admin'}
            />
            <ActionBtn
              label="Reset risk score (= 0)"
              onClick={() => patch({ riskScore: 0 }, 'risk')}
              busy={busy === 'risk'}
            />
          </div>

          <h4 className="font-semibold text-meta uppercase tracking-wider text-sol-ink-3 mt-5 mb-2">
            Gửi voice manual
          </h4>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {voiceList.filter((v) => v.triggerType === 'MANUAL' || v.triggerType === 'CRISIS').map((v) => (
              <button
                key={v.id}
                onClick={() => sendVoice(v.id)}
                disabled={busy === 'voice-' + v.id}
                className="block w-full text-left px-2 py-1.5 rounded text-meta hover:bg-sol-paper border border-sol-line"
              >
                🎙️ {v.title}
              </button>
            ))}
            {voiceList.filter((v) => v.triggerType === 'MANUAL' || v.triggerType === 'CRISIS').length === 0 && (
              <div className="text-meta text-sol-ink-3">Chưa có voice MANUAL/CRISIS. Thêm ở trang Voice của Khang.</div>
            )}
          </div>
        </section>

        {/* Timeline check-ins */}
        <section className="sol-card p-5 lg:col-span-2">
          <h3 className="text-h3 mb-3">Check-in gần đây</h3>
          {detail.checkins.length === 0 ? (
            <div className="text-sol-ink-3">Chưa có check-in.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-meta">
                <thead className="text-sol-ink-3 uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="text-left py-2">Ngày</th>
                    <th className="text-center">Hút?</th>
                    <th className="text-center">Thèm</th>
                    <th className="text-center">Mood</th>
                    <th className="text-left">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.checkins.slice(0, 14).map((c: any) => (
                    <tr key={c.id} className="border-t border-sol-line">
                      <td className="py-2">{new Date(c.date).toLocaleDateString('vi-VN')}</td>
                      <td className="text-center">{c.smoked ? '🔴' : '🟢'}</td>
                      <td className="text-center">{c.cravingIntensity}/10</td>
                      <td className="text-center">{c.mood}/5</td>
                      <td className="truncate max-w-xs">{c.note ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Payments + refunds */}
        <section className="sol-card p-5">
          <h3 className="text-h3 mb-3">Thanh toán</h3>
          {detail.payments.length === 0 && (
            <div className="text-meta text-sol-ink-3">Chưa có giao dịch.</div>
          )}
          <ul className="space-y-2">
            {detail.payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between text-meta border-b border-sol-line pb-2">
                <div>
                  <div className="font-semibold text-sol-ink">{TIER_LABEL[p.targetTier]}</div>
                  <div className="text-sol-ink-3">{new Date(p.createdAt).toLocaleDateString('vi-VN')}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold tabular-nums">{formatVnd(p.amountVnd)}</div>
                  <div className="text-sol-ink-3 uppercase text-[10px]">{p.status}</div>
                </div>
              </li>
            ))}
          </ul>

          {detail.refunds.length > 0 && (
            <>
              <h4 className="font-semibold text-meta uppercase tracking-wider text-sol-ink-3 mt-5 mb-2">
                Yêu cầu hoàn tiền
              </h4>
              <ul className="space-y-2">
                {detail.refunds.map((r) => (
                  <li key={r.id} className="text-meta">
                    <span className="font-bold">{formatVnd(r.amountVnd)}</span>{' '}
                    <span className="text-sol-ink-3">· {r.status}</span>
                    {r.reason && <div className="text-sol-ink-2">"{r.reason}"</div>}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        {/* Recent messages */}
        <section className="sol-card p-5 lg:col-span-3">
          <h3 className="text-h3 mb-3">Tin nhắn gần đây (30)</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {detail.recentMessages.map((m: any) => (
              <div
                key={m.id}
                className={
                  'p-2 rounded-lg text-meta ' +
                  (m.role === 'USER'
                    ? 'bg-sol-paper'
                    : m.role === 'ASSISTANT'
                      ? 'bg-sol-green-soft'
                      : 'bg-sol-orange-soft')
                }
              >
                <div className="text-[11px] uppercase tracking-wider text-sol-ink-3">
                  {m.role} · {new Date(m.createdAt).toLocaleString('vi-VN')}
                </div>
                <div className="whitespace-pre-line">{m.content}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-sol-ink-3 font-semibold">{label}</div>
      <div className="font-semibold text-sol-ink mt-0.5">{value}</div>
    </div>
  );
}

function ActionBtn({ label, onClick, busy }: { label: string; onClick: () => void; busy: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="w-full text-left px-3 py-2 rounded-lg border border-sol-line text-meta font-medium hover:bg-sol-paper disabled:opacity-50"
    >
      {busy ? 'Đang xử lý…' : label}
    </button>
  );
}
