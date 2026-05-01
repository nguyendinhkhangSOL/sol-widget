// frontend/src/components/views/ExerciseCard.tsx
// Renders the day's exercise(s). Schema-driven (free text / multi-question / checklist).

import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../../state/store';
import { api } from '../../services/api';

interface ExerciseSchemaField {
  key: string;
  label: string;
  type: 'text' | 'longtext' | 'multi' | 'checklist' | 'scale';
  placeholder?: string;
  options?: string[];
  min?: number;
  max?: number;
}

interface ExerciseItem {
  exerciseKey: string;
  title: string;
  description?: string;
  estMinutes?: number;
  schema?: ExerciseSchemaField[];
  existingEntry?: { content: Record<string, any>; completedAt?: string | null };
}

export function ExerciseCard() {
  const user = useStore((s) => s.user);
  const dayNumber = useMemo(() => {
    if (!user?.quitDate) return 1;
    const diff = Math.floor((Date.now() - new Date(user.quitDate).getTime()) / 86400000);
    return Math.max(1, Math.min(30, diff + 1));
  }, [user?.quitDate]);

  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const [values, setValues] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const setView = useStore((s) => s.setView);

  useEffect(() => {
    api
      .getExercisesForDay(dayNumber)
      .then((r) => {
        setExercises(r.exercises ?? []);
        if (r.exercises?.[0]?.existingEntry?.content) {
          setValues(r.exercises[0].existingEntry.content);
        }
      })
      .finally(() => setLoading(false));
  }, [dayNumber]);

  const active = exercises[activeIdx];

  async function save(markComplete: boolean) {
    if (!active) return;
    setSaving(true);
    try {
      await api.saveExercise(active.exerciseKey, values, markComplete);
      setSavedAt(Date.now());
      if (markComplete && activeIdx < exercises.length - 1) {
        setActiveIdx(activeIdx + 1);
        setValues(exercises[activeIdx + 1]?.existingEntry?.content ?? {});
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Center>Đang tải bài tập…</Center>;

  if (!active)
    return (
      <Center>
        <div className="text-center">
          <div className="text-3xl mb-2">📒</div>
          <div className="font-semibold">Hôm nay chưa có bài tập riêng.</div>
          <div className="text-sm text-sol-ink/60 mt-1">Quay lại sau 16h30 hoặc trò chuyện với SOL.</div>
          <button
            onClick={() => setView('chat')}
            className="mt-4 px-4 py-2 rounded-full bg-sol-green text-white text-sm"
          >
            Mở chat
          </button>
        </div>
      </Center>
    );

  return (
    <div className="h-full flex flex-col overflow-y-auto p-4 gap-3">
      {exercises.length > 1 && (
        <div className="flex gap-1">
          {exercises.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded ${i <= activeIdx ? 'bg-sol-blue' : 'bg-black/10'}`}
            />
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm">
        <div className="text-[11px] uppercase tracking-wider text-sol-blue">
          Ngày {dayNumber} · Bài tập {activeIdx + 1}/{exercises.length}
        </div>
        <h3 className="text-lg font-semibold mt-1">{active.title}</h3>
        {active.description && (
          <p className="text-sm text-sol-ink/70 mt-1 whitespace-pre-wrap">{active.description}</p>
        )}
        {active.estMinutes && (
          <p className="text-[11px] text-sol-ink/50 mt-1">~{active.estMinutes} phút</p>
        )}

        <div className="mt-4 space-y-3">
          {(active.schema ?? []).map((f) => (
            <FieldRenderer
              key={f.key}
              field={f}
              value={values[f.key]}
              onChange={(v) => setValues((prev) => ({ ...prev, [f.key]: v }))}
            />
          ))}
          {(!active.schema || active.schema.length === 0) && (
            <textarea
              rows={6}
              value={values.free ?? ''}
              onChange={(e) => setValues({ free: e.target.value })}
              placeholder="Viết tự do vào đây…"
              className="w-full px-3 py-2 rounded-xl border border-black/10 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sol-blue"
            />
          )}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={() => save(false)}
            disabled={saving}
            className="px-3 py-2 rounded-xl border border-black/10 text-sm"
          >
            Lưu nháp
          </button>
          <button
            onClick={() => save(true)}
            disabled={saving}
            className="flex-1 px-3 py-2 rounded-xl bg-sol-blue text-white text-sm font-semibold disabled:opacity-50"
          >
            {saving ? 'Đang lưu…' : 'Hoàn thành'}
          </button>
        </div>
        {savedAt && <div className="mt-2 text-xs text-sol-green">Đã lưu.</div>}
      </div>
    </div>
  );
}

function FieldRenderer({
  field,
  value,
  onChange,
}: {
  field: ExerciseSchemaField;
  value: any;
  onChange: (v: any) => void;
}) {
  if (field.type === 'text')
    return (
      <LabelWrap label={field.label}>
        <input
          value={value ?? ''}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-black/10 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sol-blue"
        />
      </LabelWrap>
    );
  if (field.type === 'longtext')
    return (
      <LabelWrap label={field.label}>
        <textarea
          rows={4}
          value={value ?? ''}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-black/10 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sol-blue"
        />
      </LabelWrap>
    );
  if (field.type === 'multi')
    return (
      <LabelWrap label={field.label}>
        <div className="flex flex-wrap gap-2">
          {(field.options ?? []).map((o) => {
            const set = new Set<string>(Array.isArray(value) ? value : []);
            const active = set.has(o);
            return (
              <button
                key={o}
                type="button"
                onClick={() => {
                  if (active) set.delete(o);
                  else set.add(o);
                  onChange(Array.from(set));
                }}
                className={`px-3 py-1.5 rounded-full text-xs border ${
                  active ? 'bg-sol-blue text-white border-sol-blue' : 'bg-white border-black/10'
                }`}
              >
                {o}
              </button>
            );
          })}
        </div>
      </LabelWrap>
    );
  if (field.type === 'checklist')
    return (
      <LabelWrap label={field.label}>
        <div className="space-y-1.5">
          {(field.options ?? []).map((o) => {
            const set = new Set<string>(Array.isArray(value) ? value : []);
            const active = set.has(o);
            return (
              <label key={o} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => {
                    if (active) set.delete(o);
                    else set.add(o);
                    onChange(Array.from(set));
                  }}
                />
                {o}
              </label>
            );
          })}
        </div>
      </LabelWrap>
    );
  if (field.type === 'scale') {
    const min = field.min ?? 1;
    const max = field.max ?? 10;
    return (
      <LabelWrap label={field.label}>
        <input
          type="range"
          min={min}
          max={max}
          value={value ?? Math.floor((min + max) / 2)}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-sol-blue"
        />
        <div className="text-center text-base font-semibold text-sol-blue">{value ?? '-'}</div>
      </LabelWrap>
    );
  }
  return null;
}

function LabelWrap({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-sol-ink/70 mb-1">{label}</div>
      {children}
    </div>
  );
}
function Center({ children }: { children: React.ReactNode }) {
  return <div className="h-full flex items-center justify-center p-5">{children}</div>;
}
