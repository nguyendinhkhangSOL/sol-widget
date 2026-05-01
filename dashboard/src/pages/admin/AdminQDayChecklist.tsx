// dashboard/src/pages/admin/AdminQDayChecklist.tsx
// Founder/admin biên tập danh sách checklist + link wiki + required flag.
// Lưu trong AppSetting key='q_day_checklist'.

import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { QDayChecklistConfig, QDayChecklistItem } from '../../types';

type EditableItem = Omit<QDayChecklistItem, 'checkedAt'>;

const EMPTY_ITEM: EditableItem = {
  id: '',
  label: '',
  description: '',
  wikiUrl: '',
  required: true,
  icon: '📖',
};

export function AdminQDayChecklist() {
  const [cfg, setCfg] = useState<QDayChecklistConfig | null>(null);
  const [intro, setIntro] = useState('');
  const [outro, setOutro] = useState('');
  const [items, setItems] = useState<EditableItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    const c = await api.adminGetChecklist();
    setCfg(c);
    setIntro(c.intro ?? '');
    setOutro(c.outro ?? '');
    setItems(c.items.map((it) => ({ ...it })));
  }

  useEffect(() => { load(); }, []);

  function patchItem(idx: number, patch: Partial<EditableItem>) {
    setItems((arr) => arr.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }
  function move(idx: number, dir: -1 | 1) {
    setItems((arr) => {
      const next = [...arr];
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= next.length) return next;
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  }
  function remove(idx: number) {
    if (!confirm('Xoá mục này?')) return;
    setItems((arr) => arr.filter((_, i) => i !== idx));
  }
  function add() {
    setItems((arr) => [...arr, { ...EMPTY_ITEM, id: `item_${Date.now().toString(36)}` }]);
  }

  async function save() {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      // Validate id duplicates + non-empty
      const ids = items.map((it) => it.id.trim());
      if (ids.some((id) => !id)) throw new Error('Có mục bị trống id');
      if (new Set(ids).size !== ids.length) throw new Error('Có id trùng nhau');
      if (items.some((it) => !it.label.trim())) throw new Error('Có mục bị trống label');

      const next = await api.adminSaveChecklist({
        intro: intro || undefined,
        outro: outro || undefined,
        items: items.map((it) => ({
          ...it,
          id: it.id.trim(),
          label: it.label.trim(),
          description: it.description?.trim() || undefined,
          wikiUrl: it.wikiUrl?.trim() || undefined,
          icon: it.icon?.trim() || undefined,
        })),
      });
      setCfg(next);
      setMsg('Đã lưu. Thay đổi áp dụng ngay cho user mới.');
      setTimeout(() => setMsg(null), 4000);
    } catch (e: any) {
      setErr(e?.body?.error ?? e?.message ?? 'Lỗi');
    } finally {
      setBusy(false);
    }
  }

  if (!cfg) return <div className="text-sol-ink-2">Đang tải…</div>;

  return (
    <div className="space-y-4">
      <p className="text-meta text-sol-ink-2 max-w-2xl">
        Bảng "system requirements" trước khi user đặt Q-Day hoặc mua gói.
        Mục bắt buộc (Required) phải tick xong mới được tiếp tục. Mục
        <code className="bg-sol-paper px-1 rounded text-[11px]"> onlyForTier </code>
        chỉ hiện cho user đang chuẩn bị mua gói tương ứng.
      </p>

      {msg && <div className="bg-sol-green-soft border border-sol-green/30 text-sol-green-ink rounded-xl p-3 text-meta">{msg}</div>}
      {err && <div className="sol-alert-danger">{err}</div>}

      <div className="sol-card p-4 space-y-3">
        <Field label="Lời giới thiệu (intro)">
          <textarea
            rows={3}
            className="input-text"
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
            placeholder="Vd: Cai thuốc là một quyết định lớn — không phải một cú nhấn nút…"
          />
        </Field>
        <Field label="Lời kết (outro)">
          <textarea
            rows={2}
            className="input-text"
            value={outro}
            onChange={(e) => setOutro(e.target.value)}
            placeholder="Vd: Đây là lời hứa với chính bạn."
          />
        </Field>
      </div>

      <div className="space-y-2">
        {items.map((it, idx) => (
          <div key={idx} className="sol-card p-4">
            <div className="flex items-start gap-3">
              <div className="flex flex-col gap-1">
                <button onClick={() => move(idx, -1)} className="text-sol-ink-3 hover:text-sol-ink" disabled={idx === 0}>↑</button>
                <button onClick={() => move(idx, 1)} className="text-sol-ink-3 hover:text-sol-ink" disabled={idx === items.length - 1}>↓</button>
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                <Field label="ID (slug, không trùng)">
                  <input
                    className="input-text"
                    value={it.id}
                    onChange={(e) => patchItem(idx, { id: e.target.value })}
                    placeholder="vd: read_prep_guide"
                  />
                </Field>
                <Field label="Icon (emoji)">
                  <input
                    className="input-text"
                    value={it.icon ?? ''}
                    onChange={(e) => patchItem(idx, { icon: e.target.value })}
                    placeholder="📖"
                  />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Label (hiển thị)">
                    <input
                      className="input-text"
                      value={it.label}
                      onChange={(e) => patchItem(idx, { label: e.target.value })}
                    />
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <Field label="Description (mô tả ngắn)">
                    <textarea
                      rows={2}
                      className="input-text"
                      value={it.description ?? ''}
                      onChange={(e) => patchItem(idx, { description: e.target.value })}
                    />
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <Field label="Wiki URL (link bài đầy đủ)">
                    <input
                      className="input-text"
                      value={it.wikiUrl ?? ''}
                      onChange={(e) => patchItem(idx, { wikiUrl: e.target.value })}
                      placeholder="https://sol.vn/wiki/..."
                    />
                  </Field>
                </div>
                <Field label="Bắt buộc?">
                  <select
                    className="input-text"
                    value={it.required ? '1' : '0'}
                    onChange={(e) => patchItem(idx, { required: e.target.value === '1' })}
                  >
                    <option value="1">Required</option>
                    <option value="0">Optional</option>
                  </select>
                </Field>
                <Field label="Chỉ áp dụng cho gói">
                  <select
                    className="input-text"
                    value={it.onlyForTier ?? ''}
                    onChange={(e) => patchItem(idx, { onlyForTier: (e.target.value || undefined) as any })}
                  >
                    <option value="">Tất cả</option>
                    <option value="KHOI_DONG">Khởi động</option>
                    <option value="DONG_HANH">Đồng hành</option>
                  </select>
                </Field>
              </div>
              <button onClick={() => remove(idx)} className="text-sol-red-ink hover:underline text-meta">
                Xoá
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 sticky bottom-4 bg-sol-bg/90 backdrop-blur p-2 rounded-xl">
        <button onClick={add} className="sol-btn-secondary">+ Thêm mục</button>
        <button onClick={save} disabled={busy} className="sol-btn-primary flex-1 md:flex-none">
          {busy ? 'Đang lưu…' : 'Lưu thay đổi'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider font-semibold text-sol-ink-3">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
