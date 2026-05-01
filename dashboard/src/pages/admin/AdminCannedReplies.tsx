// dashboard/src/pages/admin/AdminCannedReplies.tsx
// Biên tập câu trả lời sẵn (chip) cho widget chat.
//
// Mỗi entry gồm: icon, tiêu đề (chữ trên chip + làm user message khi bấm),
// nội dung trả lời, link wiki (Xem thêm), reusable (cho phép hỏi lại),
// thứ tự hiển thị, bật/tắt.
//
// Slug = khoá ổn định cho localStorage 'sol-qr-used' của widget. Khi đã
// tạo, slug không được sửa (sửa = tạo bản ghi mới với slug khác → chip
// trở nên "mới" với mọi user, kể cả người đã từng bấm).

import { useEffect, useMemo, useState } from 'react';
import { api, type CannedReply, type CannedReplyInput } from '../../services/api';

type FormMode = { kind: 'create' } | { kind: 'edit'; row: CannedReply } | null;

interface DraftFields {
  slug: string;
  label: string;
  icon: string;
  answer: string;
  wikiUrl: string;
  wikiLabel: string;
  reusable: boolean;
  sortOrder: string;
  enabled: boolean;
  // Trigger filter — newline-separated string trong form, parse ra array khi save
  triggersText: string;
  priority: string;
  minScore: string;
}

function emptyDraft(): DraftFields {
  return {
    slug: '',
    label: '',
    icon: '💬',
    answer: '',
    wikiUrl: '',
    wikiLabel: '',
    reusable: false,
    sortOrder: '100',
    enabled: true,
    triggersText: '',
    priority: '100',
    minScore: '0.5',
  };
}

function rowToDraft(r: CannedReply): DraftFields {
  return {
    slug: r.slug,
    label: r.label,
    icon: r.icon,
    answer: r.answer,
    wikiUrl: r.wikiUrl ?? '',
    wikiLabel: r.wikiLabel ?? '',
    reusable: r.reusable,
    sortOrder: String(r.sortOrder),
    enabled: r.enabled,
    triggersText: ((r as any).triggers ?? []).join('\n'),
    priority: String((r as any).priority ?? 100),
    minScore: String((r as any).minScore ?? 0.5),
  };
}

// Phải khớp với backend regex: ^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$, min 2.
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

// Bảng emoji được duyệt — chọn từ đây để tránh tình trạng copy emoji "lạ"
// từ nguồn khác (ZWJ, biến thể skin tone, font Apple vs Windows render khác).
// Nhóm theo ngữ cảnh app cai thuốc.
const ICON_PRESETS: { group: string; items: string[] }[] = [
  {
    group: 'Cảm xúc / tình huống',
    items: ['💬', '🆘', '🤔', '😟', '😤', '😔', '🥺', '😣'],
  },
  {
    group: 'Cơ thể & sức khoẻ',
    items: ['🫁', '🧠', '❤️', '💪', '🦷', '🩺', '🏥', '💊'],
  },
  {
    group: 'Thèm thuốc & thói quen',
    items: ['🚬', '☕', '🍵', '🥤', '🍬', '🔥', '🍺', '🍴'],
  },
  {
    group: 'Hỗ trợ & công cụ',
    items: ['🌬️', '🧘', '🏃', '🛌', '📞', '👨‍👩‍👧', '🤝', '🙏'],
  },
  {
    group: 'Thời gian & chu kỳ',
    items: ['☀️', '🌙', '⏰', '📅', '🌅', '🌃', '⏳', '🔔'],
  },
  {
    group: 'Tích cực & động viên',
    items: ['✨', '🌱', '🎯', '🌈', '🏆', '💚', '⭐', '🎉'],
  },
];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/**
 * Slug-fy lúc gõ — chỉ giữ a-z, 0-9, "-"; nén dấu gạch ngang liên tiếp,
 * cho phép tail "-" tạm thời (user đang gõ giữa chừng).
 */
function slugifyTyping(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .slice(0, 60);
}

export function AdminCannedReplies() {
  const [items, setItems] = useState<CannedReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<FormMode>(null);
  const [draft, setDraft] = useState<DraftFields>(emptyDraft());
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const isEditing = mode?.kind === 'edit';
  const editingId = isEditing ? mode.row.id : null;

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const r = await api.adminListCannedReplies();
      setItems(r.items);
    } catch (e: any) {
      setError(e?.message ?? 'Không tải được danh sách');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  }

  function openCreate() {
    setDraft(emptyDraft());
    setMode({ kind: 'create' });
  }

  function openEdit(row: CannedReply) {
    setDraft(rowToDraft(row));
    setMode({ kind: 'edit', row });
  }

  function close() {
    setMode(null);
    setDraft(emptyDraft());
  }

  // Tự suy slug từ label nếu slug đang rỗng (chỉ ở mode create)
  function onLabelChange(label: string) {
    setDraft((d) => {
      if (mode?.kind === 'create' && (!d.slug || d.slug === slugify(d.label))) {
        return { ...d, label, slug: slugify(label) };
      }
      return { ...d, label };
    });
  }

  async function save() {
    if (!draft.label.trim()) return setError('Tiêu đề (chip) không được để trống');
    if (!draft.answer.trim()) return setError('Nội dung trả lời không được để trống');
    if (mode?.kind === 'create') {
      // Chuẩn hoá thêm 1 lần trước khi gửi: bỏ "-" đầu/cuối, đảm bảo
      // khớp regex backend.
      const cleanSlug = slugify(draft.slug || draft.label);
      if (!cleanSlug || cleanSlug.length < 2) {
        return setError(
          'Slug phải có ít nhất 2 ký tự a-z / 0-9 (vd: "them-thuoc"). Hãy gõ lại tiêu đề hoặc slug.',
        );
      }
      if (!SLUG_RE.test(cleanSlug)) {
        return setError(
          'Slug chỉ được chứa a-z, 0-9, dấu gạch ngang ở giữa. Hãy chỉnh lại.',
        );
      }
      // Nếu khác bản gõ, ghi đè lại để user thấy giá trị thật sự gửi đi
      if (cleanSlug !== draft.slug) {
        setDraft((d) => ({ ...d, slug: cleanSlug }));
      }
      // Override draft locally for the request below
      draft.slug = cleanSlug;
    }
    setSaving(true);
    setError(null);
    try {
      const sortOrderNum = Number(draft.sortOrder);
      const priorityNum = Number(draft.priority);
      const minScoreNum = Number(draft.minScore);
      const triggers = draft.triggersText
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const body: CannedReplyInput = {
        label: draft.label.trim(),
        icon: draft.icon.trim() || '💬',
        answer: draft.answer.trim(),
        wikiUrl: draft.wikiUrl.trim() || undefined,
        wikiLabel: draft.wikiLabel.trim() || undefined,
        reusable: draft.reusable,
        sortOrder: Number.isFinite(sortOrderNum) ? sortOrderNum : 100,
        enabled: draft.enabled,
        triggers,
        priority: Number.isFinite(priorityNum) ? priorityNum : 100,
        minScore: Number.isFinite(minScoreNum) && minScoreNum >= 0 && minScoreNum <= 1 ? minScoreNum : 0.5,
      };

      if (mode?.kind === 'create') {
        await api.adminCreateCannedReply({ ...body, slug: draft.slug });
        flash('✓ Đã tạo chip mới');
      } else if (mode?.kind === 'edit') {
        await api.adminUpdateCannedReply(mode.row.id, body);
        flash('✓ Đã lưu thay đổi');
      }
      close();
      await reload();
    } catch (e: any) {
      const msg = e?.message ?? '';
      if (msg.includes('slug_taken')) {
        setError('Slug này đã có rồi — chọn slug khác.');
      } else {
        setError(msg || 'Không lưu được');
      }
    } finally {
      setSaving(false);
    }
  }

  async function removeRow(row: CannedReply) {
    if (!confirm(`Xoá chip "${row.label}"? Lựa chọn này không hoàn tác được.`)) return;
    try {
      await api.adminDeleteCannedReply(row.id);
      flash('✓ Đã xoá');
      await reload();
    } catch (e: any) {
      setError(e?.message ?? 'Không xoá được');
    }
  }

  async function toggleEnabled(row: CannedReply) {
    try {
      await api.adminUpdateCannedReply(row.id, { enabled: !row.enabled });
      await reload();
    } catch (e: any) {
      setError(e?.message ?? 'Không cập nhật được');
    }
  }

  const sorted = useMemo(
    () => [...items].sort((a, b) => a.sortOrder - b.sortOrder),
    [items]
  );

  return (
    <section className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-h2 text-sol-ink">Câu trả lời sẵn (chip chat)</h2>
          <p className="text-meta text-sol-ink-2 mt-1 max-w-2xl">
            Chip hiển thị trong cửa sổ chat khi user chưa hỏi gì. Bấm chip → hiện ngay
            câu trả lời biên tập sẵn (không qua AI). Mỗi user chỉ thấy mỗi chip 1 lần
            (trừ chip <strong>"Hỏi lại được"</strong>).
          </p>
        </div>
        <button onClick={openCreate} className="sol-btn sol-btn-primary">
          + Thêm chip mới
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="sol-alert-success animate-slide-up shadow-pop">{toast}</div>
      )}

      {/* Error */}
      {error && (
        <div className="sol-alert-danger flex items-start justify-between gap-3">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-meta underline">
            đóng
          </button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="sol-card-padded text-center text-sol-ink-3 text-meta">
          Đang tải…
        </div>
      ) : sorted.length === 0 ? (
        <div className="sol-card-padded text-center">
          <div className="text-body text-sol-ink-2">Chưa có chip nào.</div>
          <button onClick={openCreate} className="sol-btn sol-btn-primary mt-3">
            Tạo chip đầu tiên
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((r) => (
            <div
              key={r.id}
              className="sol-card p-3 flex items-start gap-3 hover:border-sol-line-strong transition"
            >
              <div className="text-2xl flex-shrink-0 leading-none pt-0.5" aria-hidden>
                {r.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-body font-semibold text-sol-ink truncate">
                    {r.label}
                  </h3>
                  {!r.enabled && (
                    <span className="sol-badge bg-sol-soft text-sol-ink-3">Tắt</span>
                  )}
                  {r.reusable && (
                    <span className="sol-badge bg-sol-green-soft text-sol-green-ink">
                      Hỏi lại được
                    </span>
                  )}
                  <span className="sol-badge bg-sol-soft text-sol-ink-3 tabular-nums">
                    #{r.sortOrder}
                  </span>
                </div>
                <p className="text-meta text-sol-ink-2 mt-1 line-clamp-2 break-words">
                  {r.answer}
                </p>
                {r.wikiUrl && (
                  <a
                    href={r.wikiUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-meta text-sol-green-ink underline mt-1 inline-block break-all"
                  >
                    🔗 {r.wikiLabel || r.wikiUrl}
                  </a>
                )}
                <div className="text-[12px] text-sol-ink-3 mt-1.5 font-mono">
                  slug: {r.slug}
                </div>
              </div>
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                <button
                  onClick={() => openEdit(r)}
                  className="sol-btn sol-btn-secondary sol-btn-sm"
                >
                  Sửa
                </button>
                <button
                  onClick={() => toggleEnabled(r)}
                  className="sol-btn sol-btn-secondary sol-btn-sm"
                >
                  {r.enabled ? 'Tắt' : 'Bật'}
                </button>
                <button
                  onClick={() => removeRow(r)}
                  className="sol-btn sol-btn-sm text-sol-red border border-sol-red/30 hover:bg-sol-red/5"
                >
                  Xoá
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / create modal */}
      {mode && (
        <div
          role="dialog"
          aria-label={isEditing ? 'Sửa chip' : 'Thêm chip'}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={close}
        >
          <div
            className="sol-card-padded w-full max-w-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-h3 text-sol-ink">
                {isEditing ? 'Sửa chip' : 'Thêm chip mới'}
              </h3>
              <button
                onClick={close}
                aria-label="Đóng"
                className="text-sol-ink-3 hover:text-sol-ink text-h2 leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              {/* Slug */}
              <div>
                <label className="sol-field-label">
                  Slug (id ổn định){' '}
                  <span className="text-sol-ink-3 font-normal">a-z, 0-9, dấu gạch ngang</span>
                </label>
                <input
                  type="text"
                  value={draft.slug}
                  disabled={isEditing}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      slug: isEditing ? draft.slug : slugifyTyping(e.target.value),
                    })
                  }
                  placeholder="vd: them-thuoc"
                  className="sol-input font-mono text-meta"
                />
                {isEditing ? (
                  <p className="text-meta text-sol-ink-3 mt-1">
                    Slug không thể sửa khi đã tạo (để giữ trạng thái "đã bấm" của user).
                  </p>
                ) : (
                  <p className="text-meta text-sol-ink-3 mt-1">
                    {draft.slug ? (
                      <>
                        Sẽ gửi đi:{' '}
                        <span className="font-mono text-sol-ink-2">
                          {slugify(draft.slug) || '(trống)'}
                        </span>
                        {slugify(draft.slug).length > 0 &&
                          slugify(draft.slug).length < 2 && (
                            <span className="text-sol-red ml-1">— quá ngắn (≥ 2 ký tự)</span>
                          )}
                      </>
                    ) : (
                      'Để trống → tự suy từ tiêu đề.'
                    )}
                  </p>
                )}
              </div>

              {/* Icon picker */}
              <div>
                <label className="sol-field-label">
                  Icon{' '}
                  <span className="text-sol-ink-3 font-normal">
                    chọn từ bảng để giữ đồng bộ
                  </span>
                </label>
                <div className="rounded-lg border border-sol-line bg-sol-soft/40 p-2 space-y-2">
                  {ICON_PRESETS.map((row) => (
                    <div key={row.group}>
                      <div className="text-[11px] uppercase tracking-wide text-sol-ink-3 mb-1 px-1">
                        {row.group}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {row.items.map((emo) => {
                          const selected = draft.icon === emo;
                          return (
                            <button
                              key={emo}
                              type="button"
                              onClick={() => setDraft({ ...draft, icon: emo })}
                              aria-label={`Chọn ${emo}`}
                              aria-pressed={selected}
                              className={
                                'h-10 w-10 rounded-md text-xl flex items-center justify-center transition ' +
                                (selected
                                  ? 'bg-sol-green-soft ring-2 ring-sol-green'
                                  : 'bg-white hover:bg-sol-paper border border-sol-line')
                              }
                            >
                              {emo}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-meta text-sol-ink-3">Đã chọn:</span>
                    <span
                      className="inline-flex items-center justify-center h-9 w-9 rounded-md bg-sol-paper border border-sol-line text-2xl leading-none"
                      aria-hidden
                    >
                      {draft.icon || '💬'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-meta text-sol-ink-3">Hoặc gõ tay:</span>
                    <input
                      type="text"
                      value={draft.icon}
                      onChange={(e) => setDraft({ ...draft, icon: e.target.value })}
                      placeholder="💬"
                      maxLength={4}
                      className="sol-input w-20 text-h3 text-center px-2"
                      aria-label="Nhập icon thủ công"
                    />
                  </div>
                </div>
              </div>

              {/* Label */}
              <div>
                <label className="sol-field-label">Tiêu đề (chữ trên chip)</label>
                <input
                  type="text"
                  value={draft.label}
                  onChange={(e) => onLabelChange(e.target.value)}
                  placeholder="vd: Tôi đang thèm thuốc"
                  maxLength={80}
                  className="sol-input"
                />
              </div>

              {/* Answer */}
              <div>
                <label className="sol-field-label">Nội dung trả lời</label>
                <textarea
                  value={draft.answer}
                  onChange={(e) => setDraft({ ...draft, answer: e.target.value })}
                  rows={6}
                  maxLength={2000}
                  placeholder="Câu trả lời 3-5 câu, đủ thực dụng — sẽ hiện như tin nhắn từ Sol khi user bấm chip."
                  className="sol-input resize-y"
                />
                <p className="text-meta text-sol-ink-3 mt-1">
                  {draft.answer.length}/2000 — Khẳng định, không "có lẽ"; mỗi câu kết bằng 1
                  hành động cụ thể hoặc 1 câu trấn an.
                </p>
              </div>

              {/* Wiki */}
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-2">
                <div>
                  <label className="sol-field-label">
                    Link "Xem thêm" (tuỳ chọn)
                  </label>
                  <input
                    type="url"
                    value={draft.wikiUrl}
                    onChange={(e) => setDraft({ ...draft, wikiUrl: e.target.value })}
                    placeholder="https://sol.vn/wiki/…"
                    className="sol-input"
                  />
                </div>
                <div>
                  <label className="sol-field-label">Nhãn link</label>
                  <input
                    type="text"
                    value={draft.wikiLabel}
                    onChange={(e) => setDraft({ ...draft, wikiLabel: e.target.value })}
                    placeholder="Xem giải thích chi tiết"
                    maxLength={80}
                    className="sol-input"
                  />
                </div>
              </div>

              {/* ── Trigger filter — intent matching cho chat tự do ───── */}
              <div className="bg-sol-blue-soft border border-sol-blue/30 rounded-xl p-3 mt-2">
                <label className="sol-field-label text-sol-blue-ink">
                  🎯 Trigger phrases (mỗi dòng 1 cụm từ)
                </label>
                <p className="text-meta text-sol-ink-3 mt-0.5 mb-2 leading-relaxed">
                  Khi user gõ chat tự do có chứa cụm từ này → tự động render câu
                  trả lời sẵn (không qua AI). Bỏ trống = chip chỉ active qua nút.
                </p>
                <textarea
                  value={draft.triggersText}
                  onChange={(e) => setDraft({ ...draft, triggersText: e.target.value })}
                  rows={5}
                  placeholder={'thèm thuốc\nmuốn hút\nthèm hút\nđang thèm'}
                  className="sol-input font-mono text-meta"
                />
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <label className="sol-field-label text-meta">Priority</label>
                    <input
                      type="number"
                      min={0}
                      max={10000}
                      value={draft.priority}
                      onChange={(e) => setDraft({ ...draft, priority: e.target.value })}
                      className="sol-input tabular-nums"
                    />
                    <div className="text-[10px] text-sol-ink-3 mt-0.5">
                      100 thường · 200 quan trọng · 1000 KHẨN CẤP Y TẾ
                    </div>
                  </div>
                  <div>
                    <label className="sol-field-label text-meta">Min score (0-1)</label>
                    <input
                      type="number"
                      min={0}
                      max={1}
                      step={0.1}
                      value={draft.minScore}
                      onChange={(e) => setDraft({ ...draft, minScore: e.target.value })}
                      className="sol-input tabular-nums"
                    />
                    <div className="text-[10px] text-sol-ink-3 mt-0.5">
                      0.5 default · 0.3 cho khẩn cấp (dễ match hơn)
                    </div>
                  </div>
                </div>
              </div>

              {/* Settings row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="sol-field-label">Thứ tự</label>
                  <input
                    type="number"
                    min={0}
                    max={10000}
                    value={draft.sortOrder}
                    onChange={(e) => setDraft({ ...draft, sortOrder: e.target.value })}
                    className="sol-input tabular-nums"
                  />
                </div>
                <label className="flex items-center gap-2 pt-6 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.reusable}
                    onChange={(e) => setDraft({ ...draft, reusable: e.target.checked })}
                    className="h-5 w-5 accent-sol-green"
                  />
                  <span className="text-body text-sol-ink-2">Hỏi lại được</span>
                </label>
                <label className="flex items-center gap-2 pt-6 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.enabled}
                    onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })}
                    className="h-5 w-5 accent-sol-green"
                  />
                  <span className="text-body text-sol-ink-2">Bật hiển thị</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-sol-line">
              <button
                onClick={close}
                className="sol-btn sol-btn-secondary"
                disabled={saving}
              >
                Huỷ
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="sol-btn sol-btn-primary"
              >
                {saving ? 'Đang lưu…' : isEditing ? 'Lưu thay đổi' : 'Tạo chip'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
