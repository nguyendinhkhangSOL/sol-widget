// dashboard/src/pages/admin/AdminVoice.tsx
// Voice library — Khang upload mp3 + tag (DAY_MATCH, CRISIS, MILESTONE, MANUAL)
// + URL audio. Hệ thống tự gửi theo trigger.

import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { VoiceMessage, VoiceTriggerType, UserTier } from '../../types';
import { TIER_LABEL } from '../../lib/featureGates';

const EMPTY: Partial<VoiceMessage> = {
  title: '',
  audioUrl: '',
  durationSec: 0,
  transcript: '',
  triggerType: 'DAY_MATCH',
  dayMatch: 1,
  tag: '',
  minTier: 'KHOI_DONG',
  enabled: true,
  sortOrder: 100,
};

export function AdminVoice() {
  const [items, setItems] = useState<VoiceMessage[]>([]);
  const [editing, setEditing] = useState<Partial<VoiceMessage> | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    const r = await api.adminListVoice();
    setItems(r.items);
  }

  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing) return;
    setBusy(true); setErr(null);
    try {
      const body = { ...editing };
      if (body.triggerType !== 'DAY_MATCH') body.dayMatch = null;
      if (editing.id) {
        await api.adminUpdateVoice(editing.id, body);
      } else {
        await api.adminCreateVoice(body);
      }
      setEditing(null);
      await load();
    } catch (e: any) {
      setErr(e?.body?.error ?? e?.message ?? 'unknown');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('Xoá voice này?')) return;
    await api.adminDeleteVoice(id);
    await load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-meta text-sol-ink-2 max-w-xl">
          Khang upload file mp3 (Supabase/S3 đều được), điền URL ở đây + tag.
          Hệ thống tự gửi cho user khi đến đúng ngày / khi có crisis / khi
          admin bấm "Gửi" ở User Detail.
        </p>
        <button onClick={() => setEditing(EMPTY)} className="sol-btn-primary">
          + Thêm voice mới
        </button>
      </div>

      {err && <div className="sol-alert-danger">{err}</div>}

      {editing && (
        <div className="sol-card p-5 space-y-3">
          <h3 className="text-h3">{editing.id ? 'Sửa voice' : 'Voice mới'}</h3>
          <Field label="Tiêu đề">
            <input
              className="input-text"
              value={editing.title ?? ''}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              placeholder="VD: Chào mừng ngày 1, Khủng hoảng nhậu…"
            />
          </Field>
          <Field label="URL audio (mp3)">
            <input
              className="input-text"
              value={editing.audioUrl ?? ''}
              onChange={(e) => setEditing({ ...editing, audioUrl: e.target.value })}
              placeholder="https://…"
            />
          </Field>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Field label="Trigger type">
              <select
                className="input-text"
                value={editing.triggerType}
                onChange={(e) =>
                  setEditing({ ...editing, triggerType: e.target.value as VoiceTriggerType })
                }
              >
                <option value="DAY_MATCH">DAY_MATCH (đúng ngày)</option>
                <option value="CRISIS">CRISIS (khi khủng hoảng)</option>
                <option value="MILESTONE">MILESTONE (đạt mốc)</option>
                <option value="MANUAL">MANUAL (admin gửi tay)</option>
              </select>
            </Field>
            {editing.triggerType === 'DAY_MATCH' && (
              <Field label="Day (1..60)">
                <input
                  type="number"
                  className="input-text"
                  value={editing.dayMatch ?? ''}
                  onChange={(e) =>
                    setEditing({ ...editing, dayMatch: e.target.value ? Number(e.target.value) : null })
                  }
                />
              </Field>
            )}
            <Field label="Tag (tuỳ chọn)">
              <input
                className="input-text"
                value={editing.tag ?? ''}
                onChange={(e) => setEditing({ ...editing, tag: e.target.value })}
                placeholder='VD: "nhau", "10_days"'
              />
            </Field>
            <Field label="Min tier">
              <select
                className="input-text"
                value={editing.minTier ?? 'FREE'}
                onChange={(e) => setEditing({ ...editing, minTier: e.target.value as UserTier })}
              >
                {(['FREE', 'KHOI_DONG', 'DONG_HANH', 'ALUMNI'] as UserTier[]).map((t) => (
                  <option key={t} value={t}>{TIER_LABEL[t]}</option>
                ))}
              </select>
            </Field>
            <Field label="Duration (s)">
              <input
                type="number"
                className="input-text"
                value={editing.durationSec ?? ''}
                onChange={(e) => setEditing({ ...editing, durationSec: e.target.value ? Number(e.target.value) : null })}
              />
            </Field>
            <Field label="Sort order">
              <input
                type="number"
                className="input-text"
                value={editing.sortOrder ?? 100}
                onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })}
              />
            </Field>
            <Field label="Enabled">
              <select
                className="input-text"
                value={editing.enabled ? '1' : '0'}
                onChange={(e) => setEditing({ ...editing, enabled: e.target.value === '1' })}
              >
                <option value="1">Bật</option>
                <option value="0">Tắt</option>
              </select>
            </Field>
          </div>
          <Field label="Transcript (cho user 45+ điếc)">
            <textarea
              className="input-text"
              rows={3}
              value={editing.transcript ?? ''}
              onChange={(e) => setEditing({ ...editing, transcript: e.target.value })}
            />
          </Field>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setEditing(null)} className="sol-btn-secondary">
              Huỷ
            </button>
            <button onClick={save} disabled={busy} className="sol-btn-primary">
              {busy ? 'Đang lưu…' : 'Lưu'}
            </button>
          </div>
        </div>
      )}

      <div className="sol-card overflow-x-auto">
        <table className="min-w-full text-meta">
          <thead className="bg-sol-paper text-[11px] uppercase text-sol-ink-3 tracking-wider">
            <tr>
              <th className="text-left px-4 py-3">Tiêu đề</th>
              <th className="text-left px-4 py-3">Trigger</th>
              <th className="text-left px-4 py-3">Tier ≥</th>
              <th className="text-left px-4 py-3">Audio</th>
              <th className="text-center">Bật</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((v) => (
              <tr key={v.id} className="border-t border-sol-line">
                <td className="px-4 py-2.5 font-semibold text-sol-ink">{v.title}</td>
                <td className="px-4 py-2.5 text-sol-ink-2">
                  {v.triggerType}
                  {v.dayMatch ? ` · D${v.dayMatch}` : ''}
                  {v.tag ? ` · ${v.tag}` : ''}
                </td>
                <td className="px-4 py-2.5">{TIER_LABEL[v.minTier]}</td>
                <td className="px-4 py-2.5">
                  <a href={v.audioUrl} target="_blank" rel="noreferrer" className="text-sol-blue underline truncate inline-block max-w-[180px]">
                    {v.audioUrl.split('/').slice(-1)[0]}
                  </a>
                </td>
                <td className="px-4 py-2.5 text-center">{v.enabled ? '🟢' : '🔘'}</td>
                <td className="px-4 py-2.5 text-right whitespace-nowrap">
                  <button
                    onClick={() => setEditing(v)}
                    className="sol-btn-secondary sol-btn-sm mr-1"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => remove(v.id)}
                    className="sol-btn-secondary sol-btn-sm text-sol-red-ink"
                  >
                    Xoá
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <div className="p-6 text-center text-sol-ink-3">Chưa có voice nào.</div>}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider font-semibold text-sol-ink-3">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
