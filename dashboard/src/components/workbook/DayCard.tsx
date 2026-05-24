import { useEffect, useMemo } from 'react';
import { useWorkbook } from '../../state/workbookStore';
import { useStore } from '../../state/store';
import {
  colorForDay,
  phaseForDay,
  HABIT_KEYS,
  MOOD_OPTIONS,
  type HabitKey,
} from '../../lib/workbook';

interface Props {
  day: number;
}

export function DayCard({ day }: Props) {
  const data = useWorkbook((s) => s.data);
  const setDayField = useWorkbook((s) => s.setDayField);
  const toggleHabit = useWorkbook((s) => s.toggleHabit);
  const setMood = useWorkbook((s) => s.setDayMood);
  const setCraving = useWorkbook((s) => s.setDayCraving);

  // Pull matching check-in from outside widget
  const checkins = useStore((s) => s.checkins);
  const ci = useMemo(() => checkins.find((c) => c.dayNumber === day), [checkins, day]);

  // Auto-sync check-in → workbook day (first time only — user can override afterwards)
  useEffect(() => {
    if (!ci) return;
    const cur = data.days[day];
    const patches: Array<[keyof typeof cur, any]> = [];
    if (cur?.mood == null && ci.mood) patches.push(['mood', ci.mood]);
    if (cur?.craving == null && ci.cravingIntensity) patches.push(['craving', ci.cravingIntensity]);
    if (cur?.note == null && ci.note) patches.push(['note', ci.note]);
    // Nếu check-in nói "smoked = false" → auto tick "không hút thuốc"
    if (!ci.smoked && !cur?.habits?.['no-smoke']) {
      // Use toggleHabit once
      toggleHabit(day, 'no-smoke');
    }
    for (const [k, v] of patches) setDayField(day, k as any, v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ci?.id]);

  const dayLog = data.days[day] ?? { habits: {} };
  const color = colorForDay(day);
  const phase = phaseForDay(day);

  return (
    <div
      className="rounded-xl bg-white border border-black/5 shadow-card p-4 print:shadow-none print:border-black/15 print:break-inside-avoid"
      id={`wbx-day-${day}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <div
          className="h-10 w-10 rounded-xl text-white font-bold text-sm flex items-center justify-center shrink-0"
          style={{ background: color }}
        >
          N{day}
        </div>
        <div className="font-semibold text-sm">Ngày {day}</div>
        <span
          className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full"
          style={{ background: color, opacity: 0.9 }}
        >
          {phase.label}
        </span>
        <input
          type="date"
          value={dayLog.date ?? ''}
          onChange={(e) => setDayField(day, 'date', e.target.value)}
          className="ml-auto text-xs px-2 py-1 rounded-md border border-black/10 bg-white"
        />
        {ci && (
          <span
            title="Đã đồng bộ từ check-in"
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sol-green/10 text-sol-green border border-sol-green/30"
          >
            ✓ Có check-in
          </span>
        )}
      </div>

      {/* Habits */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {HABIT_KEYS.map((h) => {
          const checked = !!dayLog.habits?.[h.key as HabitKey];
          return (
            <button
              key={h.key}
              onClick={() => toggleHabit(day, h.key as HabitKey)}
              className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition ${
                checked
                  ? 'bg-sol-green/10 text-sol-green border-sol-green/40'
                  : 'bg-white text-sol-ink/60 border-black/10 hover:bg-sol-bg'
              }`}
            >
              {h.label}
            </button>
          );
        })}
      </div>

      {/* Mood */}
      <div className="text-[11px] font-semibold text-sol-ink/60 mb-1.5">Tâm trạng hôm nay:</div>
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {MOOD_OPTIONS.map((m) => {
          const active = dayLog.mood === m.value;
          return (
            <button
              key={m.key}
              onClick={() => setMood(day, m.value)}
              className={`text-xs py-1.5 rounded-lg border transition ${
                active
                  ? 'bg-sol-orange text-white border-sol-orange'
                  : 'bg-white border-black/10 hover:bg-sol-bg'
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Craving */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-[11px] font-semibold text-sol-ink/60 shrink-0">Cơn thèm:</span>
        <div className="flex gap-0.5 flex-1">
          {Array.from({ length: 10 }, (_, i) => {
            const v = i + 1;
            const active = (dayLog.craving ?? 0) >= v;
            return (
              <button
                key={v}
                onClick={() => setCraving(day, dayLog.craving === v ? 0 : v)}
                className="h-4 flex-1 rounded-sm transition"
                style={{
                  background: active
                    ? v <= 3
                      ? '#A5D6A7'
                      : v <= 6
                      ? '#FFB74D'
                      : '#EF5350'
                    : 'rgba(0,0,0,.08)',
                }}
                title={`${v}/10`}
              />
            );
          })}
        </div>
        <span className="text-[11px] text-sol-ink/50 tabular-nums shrink-0 w-8 text-right">
          {dayLog.craving ?? 0}/10
        </span>
      </div>

      {/* Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <NoteField label="🏆 Chiến thắng hôm nay" ph="Dù nhỏ — mỗi giờ không hút là chiến thắng" value={dayLog.win ?? ''} onChange={(v) => setDayField(day, 'win', v)} />
        <NoteField label="⚡ Khó khăn gặp phải" ph="Tình huống nào gây thèm hôm nay?" value={dayLog.hard ?? ''} onChange={(v) => setDayField(day, 'hard', v)} />
        <NoteField label="💪 Ngày mai tôi sẽ" ph="1 hành động cụ thể…" value={dayLog.tomorrow ?? ''} onChange={(v) => setDayField(day, 'tomorrow', v)} />
        <NoteField label="📝 Ghi chú thêm" ph="Cảm xúc, suy nghĩ, bất cứ điều gì…" value={dayLog.note ?? ''} onChange={(v) => setDayField(day, 'note', v)} />
      </div>
    </div>
  );
}

function NoteField({
  label,
  ph,
  value,
  onChange,
}: {
  label: string;
  ph: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-sol-ink/50 mb-0.5">
        {label}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={ph}
        className="w-full px-2.5 py-1.5 rounded-md border border-black/10 bg-sol-bg/60 text-sm focus:outline-none focus:bg-white focus:border-sol-orange/50"
      />
    </label>
  );
}
