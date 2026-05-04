// dashboard/src/pages/admin/AdminContent.tsx
// 3-zone admin content management theo ADMIN_CONTENT_DESIGN.md.
//   LEFT  — Filter sidebar (module, day, voice, search)
//   MID   — List 127 ContentItem (filterable + searchable)
//   RIGHT — Edit panel (form) + Preview (lint warnings) + Revision history

import { useEffect, useMemo, useState } from 'react';
import { api, type ContentItem, type ContentItemUpdate, type ContentItemRevision, type LintWarning } from '../../services/api';

const MODULES: ContentItem['module'][] = ['MORNING_GOAL', 'SCIENCE_TIP', 'PHENOMENA_ALERT', 'EXERCISE', 'NIGHT_STORY'];
const MODULE_LABEL: Record<ContentItem['module'], string> = {
  MORNING_GOAL: '☀️ Sáng',
  SCIENCE_TIP: '🧪 Khoa học',
  PHENOMENA_ALERT: '⚠️ Phenomena',
  EXERCISE: '✍️ Bài tập',
  NIGHT_STORY: '🌙 Đêm',
};
const MODULE_TIME: Record<ContentItem['module'], string> = {
  MORNING_GOAL: '07:00',
  SCIENCE_TIP: '10:00',
  PHENOMENA_ALERT: '14:00',
  EXERCISE: '16:30',
  NIGHT_STORY: '21:30',
};

export function AdminContent() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<{
    module?: string;
    dayNumber?: number;
    voice?: 'KHANG_SOL' | 'SOL_DONG_HANH';
    search?: string;
  }>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Load list
  async function reload() {
    setLoading(true);
    try {
      const r = await api.adminContentList(filter);
      setItems(r.items);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { reload(); }, [filter.module, filter.dayNumber, filter.voice, filter.search]);

  const selected = useMemo(() => items.find((i) => i.id === selectedId) ?? null, [items, selectedId]);

  return (
    <div className="flex h-[calc(100vh-100px)] gap-3 -mx-4">
      {/* LEFT — FILTER SIDEBAR */}
      <FilterSidebar filter={filter} setFilter={setFilter} totalCount={items.length} />

      {/* MID — LIST */}
      <ContentListPanel
        items={items}
        loading={loading}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCreateClick={() => setShowCreate(true)}
      />

      {/* RIGHT — EDITOR */}
      <div className="flex-1 min-w-0 overflow-y-auto pr-2">
        {selected ? (
          <ContentEditor
            key={selected.id}
            item={selected}
            onSaved={() => { reload(); }}
            onDeleted={() => { setSelectedId(null); reload(); }}
          />
        ) : (
          <EmptyState />
        )}
      </div>

      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={(newItem) => {
            setShowCreate(false);
            setSelectedId(newItem.id);
            reload();
          }}
        />
      )}
    </div>
  );
}

/* ─── FILTER SIDEBAR ─────────────────────────────────────────────── */

function FilterSidebar({
  filter, setFilter, totalCount,
}: {
  filter: any;
  setFilter: (f: any) => void;
  totalCount: number;
}) {
  return (
    <div className="w-56 shrink-0 border-r border-sol-line pr-3 py-2 overflow-y-auto">
      <div className="text-meta text-sol-ink-2 mb-2">Bộ lọc · {totalCount} item</div>

      <div className="mb-4">
        <div className="text-meta font-semibold text-sol-ink mb-1">Module</div>
        <button
          onClick={() => setFilter({ ...filter, module: undefined })}
          className={`block w-full text-left px-2 py-1 rounded text-meta ${!filter.module ? 'bg-sol-green-soft text-sol-green-ink' : 'hover:bg-sol-soft'}`}
        >
          Tất cả
        </button>
        {MODULES.map((m) => (
          <button
            key={m}
            onClick={() => setFilter({ ...filter, module: m })}
            className={`block w-full text-left px-2 py-1 rounded text-meta ${filter.module === m ? 'bg-sol-green-soft text-sol-green-ink' : 'hover:bg-sol-soft'}`}
          >
            {MODULE_LABEL[m]} <span className="text-sol-ink-3">{MODULE_TIME[m]}</span>
          </button>
        ))}
      </div>

      <div className="mb-4">
        <div className="text-meta font-semibold text-sol-ink mb-1">Day</div>
        <input
          type="number"
          min={1}
          max={30}
          value={filter.dayNumber ?? ''}
          onChange={(e) => setFilter({ ...filter, dayNumber: e.target.value ? parseInt(e.target.value, 10) : undefined })}
          placeholder="1-30"
          className="w-full border border-sol-line rounded px-2 py-1 text-meta"
        />
      </div>

      <div className="mb-4">
        <div className="text-meta font-semibold text-sol-ink mb-1">Voice</div>
        <select
          value={filter.voice ?? ''}
          onChange={(e) => setFilter({ ...filter, voice: e.target.value || undefined })}
          className="w-full border border-sol-line rounded px-2 py-1 text-meta"
        >
          <option value="">Tất cả</option>
          <option value="KHANG_SOL">Khang Sol</option>
          <option value="SOL_DONG_HANH">Sol Đồng hành</option>
        </select>
      </div>

      <div className="mb-4">
        <div className="text-meta font-semibold text-sol-ink mb-1">Tìm kiếm</div>
        <input
          type="text"
          value={filter.search ?? ''}
          onChange={(e) => setFilter({ ...filter, search: e.target.value || undefined })}
          placeholder="title hoặc body"
          className="w-full border border-sol-line rounded px-2 py-1 text-meta"
        />
      </div>

      <button
        onClick={() => setFilter({})}
        className="w-full text-meta text-sol-ink-2 hover:text-sol-ink py-1"
      >
        Reset bộ lọc
      </button>
    </div>
  );
}

/* ─── LIST PANEL ─────────────────────────────────────────────── */

function ContentListPanel({
  items, loading, selectedId, onSelect, onCreateClick,
}: {
  items: ContentItem[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreateClick: () => void;
}) {
  return (
    <div className="w-[28rem] shrink-0 border-r border-sol-line overflow-y-auto py-2">
      <div className="px-3 pb-2 sticky top-0 bg-sol-bg z-10">
        <button
          onClick={onCreateClick}
          className="w-full py-2 rounded-lg bg-sol-green text-white text-meta font-semibold hover:brightness-105"
        >
          + Tạo tin nhắn mới
        </button>
      </div>
      {loading && <div className="text-meta text-sol-ink-3 px-3">Đang tải…</div>}
      {!loading && items.length === 0 && (
        <div className="text-meta text-sol-ink-3 px-3">Không có item nào.</div>
      )}
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          className={`block w-full text-left px-3 py-2 border-b border-sol-line hover:bg-sol-soft ${selectedId === item.id ? 'bg-sol-orange-soft border-l-4 border-l-sol-green' : ''}`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-meta font-bold text-sol-green-ink">Day {item.dayNumber}</span>
            <span className="text-meta text-sol-ink-3">{MODULE_LABEL[item.module]}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${item.voice === 'KHANG_SOL' ? 'bg-sol-wine-soft text-sol-wine-ink' : 'bg-sol-blue-soft text-sol-blue-ink'}`}>
              {item.voice === 'KHANG_SOL' ? 'Khang' : 'Sol DH'}
            </span>
            {!item.published && <span className="text-[10px] text-sol-ink-3">draft</span>}
            {item.targetRules && <span className="text-[10px] text-sol-orange-ink">🎯</span>}
          </div>
          <div className="text-meta text-sol-ink line-clamp-2">{item.title}</div>
          <div className="text-[11px] text-sol-ink-3 line-clamp-1 mt-0.5">{item.body}</div>
          {item.revisionCount && item.revisionCount > 0 && (
            <div className="text-[10px] text-sol-ink-3 mt-1">v{item.revisionCount + 1} · {item.priority !== 100 ? `pri ${item.priority}` : ''}</div>
          )}
        </button>
      ))}
    </div>
  );
}

/* ─── EMPTY STATE ─────────────────────────────────────────────── */

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-sol-ink-3 px-8 text-center">
      <div className="text-4xl mb-3">📝</div>
      <div className="text-h3 text-sol-ink mb-1">Chọn 1 item để biên tập</div>
      <div className="text-meta">
        Click vào item ở danh sách giữa. Edit title, body, voice, priority. Mỗi save tự động tạo revision snapshot.
      </div>
    </div>
  );
}

/* ─── EDITOR PANEL ─────────────────────────────────────────────── */

function ContentEditor({
  item, onSaved, onDeleted,
}: {
  item: ContentItem;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const [title, setTitle] = useState(item.title);
  const [body, setBody] = useState(item.body);
  const [voice, setVoice] = useState(item.voice);
  const [priority, setPriority] = useState(item.priority);
  const [published, setPublished] = useState(item.published);
  const [moment, setMoment] = useState<ContentItem['moment']>(item.moment ?? null);
  const [changeNote, setChangeNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const dirty = title !== item.title || body !== item.body || voice !== item.voice || priority !== item.priority || published !== item.published || moment !== (item.moment ?? null);

  async function save() {
    setSaving(true);
    setSaveStatus(null);
    try {
      const patch: ContentItemUpdate = {
        title, body, voice, priority, published, moment, changeNote: changeNote || undefined,
      };
      await api.adminContentUpdate(item.id, patch);
      setSaveStatus('Đã lưu ✓');
      setChangeNote('');
      onSaved();
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (e: any) {
      setSaveStatus('Lỗi: ' + (e.message ?? 'unknown'));
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setTitle(item.title);
    setBody(item.body);
    setVoice(item.voice);
    setPriority(item.priority);
    setPublished(item.published);
    setMoment(item.moment ?? null);
    setChangeNote('');
  }

  return (
    <div className="space-y-4 py-2 px-2">
      <div className="flex items-baseline justify-between gap-3 sticky top-0 bg-sol-bg z-10 pb-2 border-b border-sol-line">
        <h2 className="text-h2 text-sol-ink">
          Day {item.dayNumber} · {MODULE_LABEL[item.module]}
        </h2>
        <div className="flex items-center gap-2">
          {saveStatus && <span className="text-meta text-sol-green-ink">{saveStatus}</span>}
          <button
            onClick={async () => {
              if (!confirm(`Xoá tin Day ${item.dayNumber} ${item.module}? Không khôi phục được.`)) return;
              await api.adminContentDelete(item.id);
              onDeleted();
            }}
            disabled={saving}
            className="px-3 py-1.5 text-meta text-sol-red-ink hover:bg-sol-red-soft rounded disabled:opacity-40"
          >
            Xoá
          </button>
          <button
            onClick={reset}
            disabled={!dirty || saving}
            className="px-3 py-1.5 text-meta text-sol-ink-2 hover:bg-sol-soft rounded disabled:opacity-40"
          >
            Reset
          </button>
          <button
            onClick={save}
            disabled={!dirty || saving}
            className="px-4 py-1.5 text-meta font-semibold bg-sol-green text-white rounded hover:brightness-105 disabled:opacity-40"
          >
            {saving ? 'Đang lưu…' : 'Lưu'}
          </button>
        </div>
      </div>

      {/* Voice + Priority + Published row */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-meta font-semibold text-sol-ink block mb-1">Voice</label>
          <div className="flex gap-2">
            {(['KHANG_SOL', 'SOL_DONG_HANH'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVoice(v)}
                className={`flex-1 text-meta px-2 py-1.5 rounded border ${voice === v ? 'bg-sol-orange-soft border-sol-orange text-sol-earth-ink font-semibold' : 'border-sol-line text-sol-ink-2 hover:bg-sol-soft'}`}
              >
                {v === 'KHANG_SOL' ? 'Khang Sol' : 'Sol Đồng hành'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-meta font-semibold text-sol-ink block mb-1">Priority</label>
          <input
            type="number"
            min={0}
            max={1000}
            value={priority}
            onChange={(e) => setPriority(parseInt(e.target.value, 10) || 0)}
            className="w-full border border-sol-line rounded px-2 py-1.5 text-meta"
          />
          <div className="text-[10px] text-sol-ink-3 mt-0.5">100=default · 500=ưu tiên · 1000=critical</div>
        </div>
        <div>
          <label className="text-meta font-semibold text-sol-ink block mb-1">Trạng thái</label>
          <label className="flex items-center gap-2 text-meta py-1.5">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
            Đang publish (worker dùng)
          </label>
        </div>
      </div>

      {/* Moment (Phase 5) — gắn tin với khoảnh khắc trong ngày của user */}
      <div>
        <label className="text-meta font-semibold text-sol-ink block mb-1">
          Khoảnh khắc <span className="text-sol-ink-3">(Smart scheduler match user moment ±15 phút)</span>
        </label>
        <select
          value={moment ?? ''}
          onChange={(e) => setMoment(e.target.value ? (e.target.value as ContentItem['moment']) : null)}
          className="w-full border border-sol-line rounded px-3 py-2 text-meta bg-sol-paper"
        >
          <option value="">— Không gắn (GENERIC fallback) —</option>
          <option value="COFFEE_MORNING">☕ Cà phê sáng</option>
          <option value="TEA_AFTERNOON">🫖 Trà đá trưa</option>
          <option value="POST_LUNCH">🍚 Sau bữa cơm trưa</option>
          <option value="POST_DINNER">🍲 Sau bữa cơm tối</option>
          <option value="PRE_SOCIAL_DRINK">🍺 Trước khi nhậu</option>
          <option value="PRE_BEDTIME">🌙 Trước khi ngủ</option>
          <option value="GENERIC">⏰ Generic (chỉ match khi user chưa khai moment)</option>
        </select>
      </div>

      {/* Title */}
      <div>
        <label className="text-meta font-semibold text-sol-ink block mb-1">
          Title <span className="text-sol-ink-3">({title.length}/200)</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          className="w-full border border-sol-line rounded px-3 py-2 text-body"
        />
      </div>

      {/* Body */}
      <div>
        <label className="text-meta font-semibold text-sol-ink block mb-1">
          Body <span className="text-sol-ink-3">({body.length}/2000 · {body.split(/\s+/).filter(Boolean).length} từ)</span>
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
          rows={5}
          className="w-full border border-sol-line rounded px-3 py-2 text-body font-mono"
        />
        <div className="text-[10px] text-sol-ink-3 mt-1">
          Variables: <code>{'{pronoun}'} {'{name}'} {'{greet}'} {'{topReason}'} {'{topTrigger}'} {'{assistantName}'} {'{selfRef}'}</code>
        </div>
      </div>

      {/* Change note */}
      <div>
        <label className="text-meta font-semibold text-sol-ink block mb-1">Ghi chú thay đổi (tùy chọn)</label>
        <input
          type="text"
          value={changeNote}
          onChange={(e) => setChangeNote(e.target.value)}
          placeholder="Đổi voice cho mềm hơn / sửa typo / thêm {topReason}…"
          maxLength={500}
          className="w-full border border-sol-line rounded px-2 py-1 text-meta"
        />
      </div>

      {/* PREVIEW + LINT */}
      <PreviewSection title={title} body={body} dayNumber={item.dayNumber} />

      {/* REVISION HISTORY */}
      <RevisionList contentItemId={item.id} onRestored={onSaved} />
    </div>
  );
}

/* ─── PREVIEW + LINT ─────────────────────────────────────────────── */

function PreviewSection({ title, body, dayNumber }: { title: string; body: string; dayNumber: number }) {
  const [data, setData] = useState<{ renderedTitle: string; renderedBody: string; titleWarnings: LintWarning[]; bodyWarnings: LintWarning[] } | null>(null);
  const [mockUser, setMockUser] = useState({
    name: 'Khang',
    pronouns: 'anh',
    assistantName: 'Sol Phó tướng',
    quitReasons: ['vì cu Tí', 'ho buổi sáng', 'vợ nhăn'],
    topTriggers: ['nhậu', 'cà phê sáng'],
    age: 50,
  });

  // Debounce preview API call
  useEffect(() => {
    const t = setTimeout(() => {
      api.adminContentPreview({ title, body, dayNumber, mockUser })
        .then(setData)
        .catch(() => setData(null));
    }, 400);
    return () => clearTimeout(t);
  }, [title, body, dayNumber, JSON.stringify(mockUser)]);

  if (!data) return <div className="text-meta text-sol-ink-3">Đang preview…</div>;

  return (
    <div className="border border-sol-line rounded-lg p-3 bg-sol-paper">
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-meta font-semibold text-sol-ink">📱 Preview với mock user</div>
        <details className="text-meta">
          <summary className="cursor-pointer text-sol-ink-3 hover:text-sol-ink">Đổi mock user</summary>
          <div className="grid grid-cols-2 gap-2 mt-2 p-2 bg-sol-soft rounded">
            <input
              type="text"
              value={mockUser.name}
              onChange={(e) => setMockUser({ ...mockUser, name: e.target.value })}
              placeholder="name"
              className="border border-sol-line rounded px-2 py-1 text-meta"
            />
            <input
              type="text"
              value={mockUser.pronouns}
              onChange={(e) => setMockUser({ ...mockUser, pronouns: e.target.value })}
              placeholder="pronouns (anh/chị/em)"
              className="border border-sol-line rounded px-2 py-1 text-meta"
            />
            <input
              type="text"
              value={mockUser.assistantName}
              onChange={(e) => setMockUser({ ...mockUser, assistantName: e.target.value })}
              placeholder="assistantName"
              className="border border-sol-line rounded px-2 py-1 text-meta"
            />
            <input
              type="text"
              value={mockUser.quitReasons.join(', ')}
              onChange={(e) => setMockUser({ ...mockUser, quitReasons: e.target.value.split(',').map((s) => s.trim()) })}
              placeholder="reasons (comma-sep)"
              className="border border-sol-line rounded px-2 py-1 text-meta"
            />
          </div>
        </details>
      </div>

      <div className="bg-white rounded-lg border border-sol-line p-3 mb-2">
        <div className="text-h3 text-sol-ink mb-1">{data.renderedTitle}</div>
        <div className="text-body text-sol-ink-2 whitespace-pre-wrap">{data.renderedBody}</div>
      </div>

      {/* Lint warnings */}
      {(data.titleWarnings.length > 0 || data.bodyWarnings.length > 0) && (
        <div className="space-y-1">
          {data.titleWarnings.map((w, i) => <WarningItem key={`t${i}`} prefix="Title" warning={w} />)}
          {data.bodyWarnings.map((w, i) => <WarningItem key={`b${i}`} prefix="Body" warning={w} />)}
        </div>
      )}
      {data.titleWarnings.length === 0 && data.bodyWarnings.length === 0 && (
        <div className="text-meta text-sol-green-ink">✓ Không có cảnh báo lint</div>
      )}
    </div>
  );
}

function WarningItem({ prefix, warning }: { prefix: string; warning: LintWarning }) {
  const COLOR = {
    high: 'text-sol-red-ink bg-sol-red-soft',
    medium: 'text-sol-orange-ink bg-sol-orange-soft',
    low: 'text-sol-blue-ink bg-sol-blue-soft',
  };
  return (
    <div className={`text-meta px-2 py-1 rounded ${COLOR[warning.severity]}`}>
      <strong>{prefix}:</strong> {warning.message}
      {warning.excerpt && <span className="text-sol-ink-3 italic"> · "{warning.excerpt}"</span>}
    </div>
  );
}

/* ─── REVISION HISTORY ─────────────────────────────────────────────── */

function RevisionList({ contentItemId, onRestored }: { contentItemId: string; onRestored: () => void }) {
  const [revisions, setRevisions] = useState<ContentItemRevision[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await api.adminContentRevisions(contentItemId);
      setRevisions(r.revisions);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { if (expanded) load(); }, [expanded, contentItemId]);

  async function restore(versionNum: number) {
    if (!confirm(`Restore về v${versionNum}? Phiên bản hiện tại sẽ thành revision mới.`)) return;
    await api.adminContentRestore(contentItemId, versionNum);
    onRestored();
    load();
  }

  return (
    <div className="border border-sol-line rounded-lg">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-3 py-2 text-meta font-semibold text-sol-ink hover:bg-sol-soft flex items-center justify-between"
      >
        <span>📜 Revision history {revisions.length > 0 && `(${revisions.length})`}</span>
        <span>{expanded ? '▴' : '▾'}</span>
      </button>
      {expanded && (
        <div className="p-3 border-t border-sol-line space-y-2">
          {loading && <div className="text-meta text-sol-ink-3">Đang tải…</div>}
          {!loading && revisions.length === 0 && (
            <div className="text-meta text-sol-ink-3">Chưa có revision. Lưu lần đầu sẽ tạo v1.</div>
          )}
          {revisions.map((r) => (
            <div key={r.id} className="border border-sol-line rounded p-2 text-meta">
              <div className="flex items-baseline justify-between mb-1">
                <div className="font-semibold text-sol-ink">v{r.versionNum} · {new Date(r.editedAt).toLocaleString('vi-VN')}</div>
                <button
                  onClick={() => restore(r.versionNum)}
                  className="text-meta text-sol-blue-ink hover:underline"
                >
                  Restore
                </button>
              </div>
              <div className="text-sol-ink-2 line-clamp-1">{r.title}</div>
              <div className="text-[11px] text-sol-ink-3 line-clamp-1">{r.body}</div>
              {r.changeNote && (
                <div className="text-[10px] text-sol-ink-3 mt-1 italic">"{r.changeNote}"</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── CREATE MODAL ─────────────────────────────────────────────── */

function CreateModal({
  onClose, onCreated,
}: {
  onClose: () => void;
  onCreated: (item: ContentItem) => void;
}) {
  const [dayNumber, setDayNumber] = useState(1);
  const [module, setModule] = useState<ContentItem['module']>('MORNING_GOAL');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [voice, setVoice] = useState<ContentItem['voice']>('SOL_DONG_HANH');
  const [priority, setPriority] = useState(100);
  const [moment, setMoment] = useState<ContentItem['moment']>(null);
  const [wikiUrl, setWikiUrl] = useState('');
  const [pushTime, setPushTime] = useState('07:00');
  const [exerciseKey, setExerciseKey] = useState('');
  const [published, setPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const moduleDefaults: Record<ContentItem['module'], string> = {
    MORNING_GOAL: '07:00',
    SCIENCE_TIP: '10:00',
    PHENOMENA_ALERT: '14:00',
    EXERCISE: '16:30',
    NIGHT_STORY: '21:30',
  };

  function handleModuleChange(newModule: ContentItem['module']) {
    setModule(newModule);
    setPushTime(moduleDefaults[newModule]);
  }

  async function create() {
    if (!title.trim() || !body.trim()) {
      setError('Title và Body bắt buộc');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await api.adminContentCreate({
        dayNumber,
        module,
        title: title.trim(),
        body: body.trim(),
        voice,
        priority,
        wikiUrl: wikiUrl.trim() || undefined,
        pushTime: pushTime || undefined,
        exerciseKey: module === 'EXERCISE' ? (exerciseKey.trim() || undefined) : undefined,
        published,
      });
      // Set moment qua PATCH separately (POST schema chưa có moment field)
      if (moment) {
        await api.adminContentUpdate(created.id, { moment, changeNote: 'Initial create' });
      }
      onCreated(created);
    } catch (e: any) {
      setError(e?.body?.detail?.fieldErrors
        ? JSON.stringify(e.body.detail.fieldErrors)
        : (e?.message ?? 'Lỗi tạo'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-sol-bg border border-sol-line rounded-2xl shadow-pop max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-5 py-3 border-b border-sol-line flex items-center justify-between sticky top-0 bg-sol-bg z-10">
          <h2 className="text-h2 text-sol-ink">+ Tạo tin nhắn mới</h2>
          <button
            onClick={onClose}
            className="text-sol-ink-2 hover:text-sol-ink text-h2"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="text-meta text-sol-red-ink bg-sol-red-soft px-3 py-2 rounded">
              {error}
            </div>
          )}

          {/* Day + Module + Voice */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-meta font-semibold text-sol-ink block mb-1">Ngày</label>
              <input
                type="number"
                min={1}
                max={365}
                value={dayNumber}
                onChange={(e) => setDayNumber(parseInt(e.target.value, 10) || 1)}
                className="w-full border border-sol-line rounded px-2 py-1.5 text-meta"
              />
            </div>
            <div>
              <label className="text-meta font-semibold text-sol-ink block mb-1">Module</label>
              <select
                value={module}
                onChange={(e) => handleModuleChange(e.target.value as ContentItem['module'])}
                className="w-full border border-sol-line rounded px-2 py-1.5 text-meta bg-sol-paper"
              >
                <option value="MORNING_GOAL">☀️ Sáng</option>
                <option value="SCIENCE_TIP">🧪 Khoa học</option>
                <option value="PHENOMENA_ALERT">⚠️ Phenomena</option>
                <option value="EXERCISE">✍️ Bài tập</option>
                <option value="NIGHT_STORY">🌙 Đêm</option>
              </select>
            </div>
            <div>
              <label className="text-meta font-semibold text-sol-ink block mb-1">Voice</label>
              <select
                value={voice}
                onChange={(e) => setVoice(e.target.value as any)}
                className="w-full border border-sol-line rounded px-2 py-1.5 text-meta bg-sol-paper"
              >
                <option value="SOL_DONG_HANH">Sol Đồng hành</option>
                <option value="KHANG_SOL">Khang Sol</option>
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-meta font-semibold text-sol-ink block mb-1">
              Title <span className="text-sol-ink-3">({title.length}/200)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              placeholder="Vd: Day 14: 2 TUẦN — receptor giảm 40%."
              className="w-full border border-sol-line rounded px-3 py-2 text-body"
            />
          </div>

          {/* Body */}
          <div>
            <label className="text-meta font-semibold text-sol-ink block mb-1">
              Body <span className="text-sol-ink-3">({body.length}/2000 · {body.split(/\s+/).filter(Boolean).length} từ)</span>
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={2000}
              rows={5}
              placeholder="Nội dung tin nhắn. Có thể dùng {pronoun} {topReason} {greet}…"
              className="w-full border border-sol-line rounded px-3 py-2 text-body font-mono"
            />
            <div className="text-[10px] text-sol-ink-3 mt-1">
              Variables: <code>{'{pronoun}'} {'{name}'} {'{greet}'} {'{topReason}'} {'{topTrigger}'} {'{assistantName}'} {'{selfRef}'}</code>
            </div>
          </div>

          {/* Priority + Moment + PushTime */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-meta font-semibold text-sol-ink block mb-1">Priority</label>
              <input
                type="number"
                min={0}
                max={1000}
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value, 10) || 0)}
                className="w-full border border-sol-line rounded px-2 py-1.5 text-meta"
              />
            </div>
            <div>
              <label className="text-meta font-semibold text-sol-ink block mb-1">Moment</label>
              <select
                value={moment ?? ''}
                onChange={(e) => setMoment(e.target.value ? (e.target.value as ContentItem['moment']) : null)}
                className="w-full border border-sol-line rounded px-2 py-1.5 text-meta bg-sol-paper"
              >
                <option value="">— Generic —</option>
                <option value="COFFEE_MORNING">☕ Cà phê sáng</option>
                <option value="TEA_AFTERNOON">🫖 Trà đá trưa</option>
                <option value="POST_LUNCH">🍚 Sau cơm trưa</option>
                <option value="POST_DINNER">🍲 Sau cơm tối</option>
                <option value="PRE_SOCIAL_DRINK">🍺 Trước nhậu</option>
                <option value="PRE_BEDTIME">🌙 Trước ngủ</option>
              </select>
            </div>
            <div>
              <label className="text-meta font-semibold text-sol-ink block mb-1">Push time</label>
              <input
                type="time"
                value={pushTime}
                onChange={(e) => setPushTime(e.target.value)}
                className="w-full border border-sol-line rounded px-2 py-1.5 text-meta"
              />
            </div>
          </div>

          {/* Wiki URL + Exercise Key (chỉ EXERCISE) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-meta font-semibold text-sol-ink block mb-1">Wiki URL (tùy chọn)</label>
              <input
                type="url"
                value={wikiUrl}
                onChange={(e) => setWikiUrl(e.target.value)}
                placeholder="https://sol.vn/slug"
                className="w-full border border-sol-line rounded px-2 py-1.5 text-meta"
              />
            </div>
            {module === 'EXERCISE' && (
              <div>
                <label className="text-meta font-semibold text-sol-ink block mb-1">Exercise key</label>
                <input
                  type="text"
                  value={exerciseKey}
                  onChange={(e) => setExerciseKey(e.target.value)}
                  placeholder="vd breathing_4_7_8"
                  className="w-full border border-sol-line rounded px-2 py-1.5 text-meta"
                />
              </div>
            )}
          </div>

          {/* Published */}
          <label className="flex items-center gap-2 text-meta">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
            />
            Publish ngay (worker dùng từ tin tiếp theo)
          </label>
        </div>

        <div className="px-5 py-3 border-t border-sol-line bg-sol-soft flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-1.5 text-meta text-sol-ink-2 hover:bg-sol-paper rounded"
          >
            Huỷ
          </button>
          <button
            onClick={create}
            disabled={saving || !title.trim() || !body.trim()}
            className="px-5 py-1.5 text-meta font-semibold bg-sol-green text-white rounded hover:brightness-105 disabled:opacity-40"
          >
            {saving ? 'Đang tạo…' : 'Tạo tin nhắn'}
          </button>
        </div>
      </div>
    </div>
  );
}
