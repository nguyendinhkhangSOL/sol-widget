import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useStore } from '../state/store';
import { api } from '../services/api';

export function Journey() {
  const { day: dayParam } = useParams();
  const nav = useNavigate();
  const user = useStore((s) => s.user);
  const roadmap = useStore((s) => s.roadmap);
  const checkins = useStore((s) => s.checkins);

  const currentDay = useMemo(() => {
    if (!user?.quitDate) return 1;
    const diff = Math.floor((Date.now() - new Date(user.quitDate).getTime()) / 86400000);
    return Math.max(1, Math.min(30, diff + 1));
  }, [user?.quitDate]);

  const selectedDay = dayParam ? parseInt(dayParam, 10) : null;
  const selected = selectedDay && selectedDay >= 1 && selectedDay <= 30 ? selectedDay : null;

  const checkinByDay = useMemo(() => {
    const m = new Map();
    for (const c of checkins) m.set(c.dayNumber, c);
    return m;
  }, [checkins]);

  return (
    <div className="p-6 max-w-5xl mx-auto pb-24 lg:pb-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Hành trình 30 ngày</h1>
        <p className="text-sm text-sol-ink/60">Nhấp vào từng ngày để xem chi tiết.</p>
      </header>

      {/* 30-day grid */}
      <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-card">
        <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
          {Array.from({ length: 30 }).map((_, i) => {
            const day = i + 1;
            const ci = checkinByDay.get(day);
            const isToday = day === currentDay;
            const isLocked = day > currentDay;
            const status = isLocked
              ? 'locked'
              : isToday && !ci
              ? 'today'
              : !ci
              ? 'missed'
              : ci.smoked
              ? 'slip'
              : 'clean';

            return (
              <button
                key={day}
                onClick={() => nav(`/journey/${day}`)}
                className={clsx(
                  'aspect-square rounded-xl text-sm font-bold flex flex-col items-center justify-center border-2 transition',
                  selected === day && 'ring-2 ring-sol-ink ring-offset-2',
                  status === 'clean' && 'bg-sol-green text-white border-sol-green hover:scale-105',
                  status === 'slip' && 'bg-sol-orange text-white border-sol-orange hover:scale-105',
                  status === 'missed' && 'bg-sol-red/10 text-sol-red/60 border-sol-red/20 line-through',
                  status === 'today' && 'bg-white border-sol-green text-sol-green animate-pulse',
                  status === 'locked' && 'bg-sol-ink/5 text-sol-ink/30 border-transparent cursor-not-allowed'
                )}
                disabled={status === 'locked'}
              >
                <span>{day}</span>
                {ci && !ci.smoked && <span className="text-[10px] opacity-80">sạch</span>}
              </button>
            );
          })}
        </div>
      </div>

      {selected && <DayDetail day={selected} />}
    </div>
  );
}

function DayDetail({ day }: { day: number }) {
  const checkins = useStore((s) => s.checkins);
  const checkin = checkins.find((c) => c.dayNumber === day);
  const [content, setContent] = useState<any>(null);
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getDailyContent(day).catch(() => null),
      api.getExercisesForDay(day).catch(() => ({ exercises: [] })),
    ])
      .then(([c, e]) => {
        setContent(c);
        setExercises(e?.exercises ?? []);
      })
      .finally(() => setLoading(false));
  }, [day]);

  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Check-in column */}
      <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-card">
        <h2 className="text-lg font-semibold mb-3">Check-in ngày {day}</h2>
        {checkin ? (
          <div className="space-y-2 text-sm">
            <Row label="Có hút?" val={checkin.smoked ? 'Có' : 'Không'} tone={checkin.smoked ? 'red' : 'green'} />
            <Row label="Cơn thèm cao nhất" val={`${checkin.cravingIntensity}/10`} />
            <Row
              label="Tâm trạng"
              val={`${['😣', '🙁', '😐', '🙂', '😄'][checkin.mood - 1]} (${checkin.mood}/5)`}
            />
            {checkin.isSickDay && <Row label="Ngày ốm" val="Miễn chuỗi" tone="orange" />}
            {checkin.note && (
              <div className="pt-3 border-t border-black/5">
                <div className="text-xs text-sol-ink/50 mb-1">Ghi chú</div>
                <div className="bg-sol-bg p-3 rounded text-sol-ink/80 whitespace-pre-wrap">{checkin.note}</div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sol-ink/50 italic">Không có check-in cho ngày này.</div>
        )}
      </div>

      {/* Content + Exercise column */}
      <div className="space-y-4">
        <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-card">
          <h2 className="text-lg font-semibold mb-3">Nội dung ngày {day}</h2>
          {loading ? (
            <div className="text-sol-ink/50 italic">Đang tải…</div>
          ) : !content?.content ? (
            <div className="text-sol-ink/50 italic">Chưa có nội dung.</div>
          ) : (
            Object.entries(content.content).map(([mod, items]: any) =>
              items.length ? (
                <div key={mod} className="mb-3">
                  <div className="text-xs font-semibold text-sol-ink/70">{labelFor(mod)}</div>
                  {items.map((it: any) => (
                    <div key={it.id} className="text-sm text-sol-ink/80 mt-1 ml-3">
                      • <span className="font-medium">{it.title}</span>
                      {it.body && <div className="text-xs text-sol-ink/60 mt-0.5">{it.body}</div>}
                    </div>
                  ))}
                </div>
              ) : null
            )
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-card">
          <h2 className="text-lg font-semibold mb-3">Bài tập ngày {day}</h2>
          {exercises.length === 0 ? (
            <div className="text-sol-ink/50 italic">Không có bài tập riêng.</div>
          ) : (
            exercises.map((e: any) => (
              <div key={e.exerciseKey} className="mb-2 text-sm">
                <div className="font-medium">{e.title ?? e.exerciseKey}</div>
                {e.existingEntry?.completedAt && (
                  <div className="text-xs text-sol-green">✓ Hoàn thành</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, val, tone }: { label: string; val: string; tone?: 'green' | 'red' | 'orange' }) {
  const toneClass =
    tone === 'green'
      ? 'text-sol-green'
      : tone === 'red'
      ? 'text-sol-red'
      : tone === 'orange'
      ? 'text-sol-orange'
      : 'text-sol-ink';
  return (
    <div className="flex items-center justify-between">
      <span className="text-sol-ink/60">{label}</span>
      <span className={`font-medium ${toneClass}`}>{val}</span>
    </div>
  );
}

function labelFor(mod: string) {
  const map: Record<string, string> = {
    MORNING_GOAL: '☀️ Mục tiêu sáng',
    SCIENCE_TIP: '💡 Góc khoa học',
    PHENOMENA_ALERT: '⚠️ Có thể xảy ra',
    EXERCISE: '📒 Bài tập',
    NIGHT_STORY: '🌙 Khép ngày',
  };
  return map[mod] ?? mod;
}
