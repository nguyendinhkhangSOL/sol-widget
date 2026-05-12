// dashboard/src/pages/Journey.tsx
// PHASE B — 88-day journey với 4 viên ngọc + lịch phase-grouped + DayDetail.
// Bỏ 30-cell grid Phase A. Thay bằng 4 nhóm: Nhận Thức (7) / Hành Động (21) /
// Giải Phóng (30) / Tái Thiết (30). Tổng = 88. Phase tương lai dim, phase đã
// qua filled mờ, phase hiện tại pulse + ô ngày hôm nay highlight.

import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useStore } from '../state/store';
import { api, ApiError } from '../services/api';
import { PhaseBar } from '../components/views/phaseB/PhaseBar';
import type { DashboardData, Stage } from '../components/views/phaseB/types';

interface PhaseSection {
  key: Stage;
  label: string;
  emoji: string;
  color: string;
  startDay: number;   // dayInJourney (1-based)
  endDay: number;
  total: number;
}

const PHASE_SECTIONS: PhaseSection[] = [
  { key: 'NHAN_THUC',  label: 'Nhận Thức',  emoji: '🌱', color: '#B25C2C', startDay: 1,  endDay: 7,  total: 7 },
  { key: 'HANH_DONG',  label: 'Hành Động',  emoji: '🔥', color: '#B8860B', startDay: 8,  endDay: 28, total: 21 },
  { key: 'GIAI_PHONG', label: 'Giải Phóng', emoji: '🚭', color: '#3A7CA5', startDay: 29, endDay: 58, total: 30 },
  { key: 'TAI_THIET',  label: 'Tái Thiết',  emoji: '🌟', color: '#5C3A1E', startDay: 59, endDay: 88, total: 30 },
];

export function Journey() {
  const { day: dayParam } = useParams();
  const nav = useNavigate();
  const checkins = useStore((s) => s.checkins);

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const r = await api.getJourneyDashboard() as DashboardData;
      setData(r);
    } catch (e) {
      console.error('Failed to load journey', e);
      setError(e instanceof ApiError ? `API ${e.status}: ${e.body?.message ?? ''}` : 'Lỗi tải hành trình.');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  const selectedDay = dayParam ? parseInt(dayParam, 10) : null;
  const selected = selectedDay && selectedDay >= 1 && selectedDay <= 88 ? selectedDay : null;

  // Map check-ins theo dayInJourney. Check-in cũ dùng dayNumber 1-30 (Phase A).
  // Phase B: contentDay = dayInJourney - 28 cho Phase 3 (29 → 1, 58 → 30).
  // Tạm thời em hiển thị check-in nếu dayNumber khớp với dayInJourney (Phase A
  // user) HOẶC khớp với (dayInJourney - 28) (Phase B Phase 3 user).
  const checkinByDay = useMemo(() => {
    const m = new Map<number, any>();
    for (const c of checkins) {
      m.set(c.dayNumber, c);
    }
    return m;
  }, [checkins]);

  if (loading && !data) {
    return (
      <div className="w-full max-w-[1100px] mx-auto p-8 text-center">
        <div className="text-3xl mb-2 animate-pulse">🌅</div>
        <div className="text-body text-sol-ink-3">Đang tải hành trình…</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="w-full max-w-[1100px] mx-auto p-8 text-center">
        <div className="text-4xl mb-3">⚠️</div>
        <h2 className="text-h1 text-sol-ink mb-2">Sol chưa kết nối được</h2>
        <p className="text-body text-sol-ink-2 mb-4">{error}</p>
        <button onClick={load} className="px-5 py-2.5 rounded-xl bg-sol-green text-white font-semibold">
          Thử lại
        </button>
      </div>
    );
  }

  if (!data) return null;

  const currentDay = data.journey.dayInJourney;
  const currentStage = data.journey.stage;
  const qDayConfirmed = !!data.user.qDayConfirmedAt;

  return (
    <div className="w-full max-w-[1100px] mx-auto p-4 lg:p-6 pb-24 lg:pb-8 space-y-6">
      <header className="px-1">
        <h1 className="text-display text-sol-ink font-bold">🗺️ Hành Trình Sol</h1>
        <p className="text-body text-sol-ink-2 mt-1">
          4 chặng tiến hoá hành vi — Nhận Thức · Hành Động · Giải Phóng · Tái Thiết. Click vào mỗi ngày để xem chi tiết.
        </p>
      </header>

      <PhaseBar
        stage={currentStage}
        progressInStage={data.journey.progressInStage}
        dayInStage={data.journey.dayInStage}
        totalInStage={data.journey.totalInStage}
      />

      {/* 4 phase sections — mỗi section 1 grid cells riêng */}
      {PHASE_SECTIONS.map((phase) => {
        const isPastPhase = currentDay > phase.endDay;
        const isCurrentPhase = currentDay >= phase.startDay && currentDay <= phase.endDay;
        const isFuturePhase = currentDay < phase.startDay;
        const cols = phase.total <= 7 ? 7 : 10;

        return (
          <section
            key={phase.key}
            className={clsx(
              'bg-sol-paper rounded-2xl p-6 border shadow-card',
              isCurrentPhase && 'ring-2 ring-offset-2',
              isFuturePhase && 'opacity-60',
            )}
            style={{
              borderColor: phase.color + '60',
              ...(isCurrentPhase ? ({ ['--tw-ring-color' as any]: phase.color } as any) : {}),
            }}
          >
            <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl" aria-hidden="true">{phase.emoji}</span>
                <h2 className="text-h2 font-semibold" style={{ color: phase.color }}>
                  {phase.label}
                </h2>
                <span className="text-meta text-sol-ink-3">
                  Ngày {phase.startDay}–{phase.endDay} · {phase.total} ngày
                </span>
              </div>
              {isCurrentPhase && (
                <span className="px-3 py-1 rounded-full text-meta font-semibold text-white animate-pulse-soft" style={{ backgroundColor: phase.color }}>
                  Đang ở đây
                </span>
              )}
              {isPastPhase && (
                <span className="px-3 py-1 rounded-full text-meta font-medium bg-sol-green-soft text-sol-green-ink">
                  ✓ Đã qua
                </span>
              )}
              {isFuturePhase && (
                <span className="px-3 py-1 rounded-full text-meta font-medium bg-sol-bg text-sol-ink-3">
                  🔒 Sắp tới
                </span>
              )}
            </div>

            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: phase.total }).map((_, i) => {
                const day = phase.startDay + i;
                const isToday = day === currentDay;
                const isLocked = day > currentDay;

                // Check-in lookup: Phase A dùng dayNumber 1-30, Phase B Phase 3 map
                // dayInJourney 29-58 → contentDay 1-30 cũ.
                let checkinKey = day;
                if (phase.key === 'GIAI_PHONG') {
                  checkinKey = day - 28; // 29→1, 58→30
                }
                const ci = checkinByDay.get(checkinKey);

                const status = isLocked
                  ? 'locked'
                  : isToday && !ci
                  ? 'today'
                  : !ci
                  ? day < currentDay ? 'missed' : 'today'
                  : ci.smoked
                  ? 'slip'
                  : 'clean';

                return (
                  <button
                    key={day}
                    onClick={() => !isLocked && nav(`/journey/${day}`)}
                    disabled={isLocked}
                    className={clsx(
                      'aspect-square rounded-xl text-meta font-bold flex flex-col items-center justify-center border-2 transition min-h-tap',
                      selected === day && 'ring-2 ring-sol-ink ring-offset-2',
                      status === 'clean' && 'bg-sol-green-soft border-sol-green text-sol-green-ink hover:scale-105',
                      status === 'slip' && 'bg-sol-orange-soft border-sol-orange text-sol-orange-ink hover:scale-105',
                      status === 'missed' && 'bg-sol-red-soft border-sol-red/30 text-sol-red/60 line-through',
                      status === 'today' && 'border-2 animate-pulse text-white',
                      status === 'locked' && 'bg-sol-bg text-sol-ink-3 border-transparent cursor-not-allowed',
                    )}
                    style={
                      status === 'today'
                        ? { backgroundColor: phase.color, borderColor: phase.color }
                        : undefined
                    }
                  >
                    <span>{day}</span>
                    {ci && !ci.smoked && <span className="text-[10px] opacity-80">sạch</span>}
                  </button>
                );
              })}
            </div>

            {/* Ngày bỏ marker cuối Phase 2 */}
            {phase.key === 'HANH_DONG' && (
              <div className="mt-4 pt-4 border-t border-sol-line text-meta text-sol-ink-2 italic flex items-center gap-2">
                <span className="text-xl">🌅</span>
                <span>
                  Day 28 = <strong>Ngày bỏ</strong> — ngày {data.user.pronouns} cam kết bỏ hẳn.
                  {qDayConfirmed && currentDay >= 28
                    ? ' ✓ Đã cam kết.'
                    : currentDay >= 28
                    ? ' Chưa cam kết — bấm vào Tổng quan để xác nhận.'
                    : ' Sẽ tới sau.'}
                </span>
              </div>
            )}
          </section>
        );
      })}

      {/* Phase 5 Đại Sứ — chỉ hiện khi reach */}
      {currentDay >= 89 && (
        <section className="bg-gradient-to-br from-sol-earth-ink to-sol-earth rounded-2xl p-6 text-white shadow-pop">
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-4xl" aria-hidden="true">🦁</span>
            <h2 className="text-h2 font-semibold">Đại Sứ Sol</h2>
            <span className="text-meta opacity-90">Ngày 52+ · vĩnh viễn (Người Tự Do)</span>
          </div>
          <p className="text-body opacity-90">
            {data.user.pronouns} đã graduate. Hành trình 52 ngày hoàn tất — giờ là lúc chia sẻ với người mới.
          </p>
        </section>
      )}

      {selected && <DayDetail day={selected} stage={currentStage} />}
    </div>
  );
}

/* ─── DAY DETAIL — content + exercise + check-in ─────────────────────────── */
function DayDetail({ day, stage }: { day: number; stage: Stage }) {
  const checkins = useStore((s) => s.checkins);

  // Map dayInJourney → contentDay (xem backend/src/seed/contentItemsPhaseB.ts):
  //   Phase 1 NHAN_THUC  (1-7):   contentDay = day + 100 (101..107)
  //   Phase 2 HANH_DONG  (8-28):  contentDay = day + 100 (108..128)
  //   Phase 3 GIAI_PHONG (29-58): contentDay = day - 28  (1..30, content cũ)
  //   Phase 4 TAI_THIET  (59-88): contentDay = day + 100 (159..188, sparse)
  let contentDay: number;
  if (stage === 'GIAI_PHONG') {
    contentDay = day - 28;
  } else {
    contentDay = day + 100;
  }
  // Check-in key giữ Phase A logic: Phase 3 dùng dayNumber 1-30 cũ, các phase
  // khác dùng dayInJourney trực tiếp (check-in mới có dayNumber match dayInJourney).
  const checkinKey = stage === 'GIAI_PHONG' ? day - 28 : day;
  const checkin = checkins.find((c) => c.dayNumber === checkinKey);

  const [content, setContent] = useState<any>(null);
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getDailyContent(contentDay).catch(() => null),
      api.getExercisesForDay(contentDay).catch(() => ({ exercises: [] })),
    ])
      .then(([c, e]: [any, any]) => {
        setContent(c);
        setExercises(e?.exercises ?? []);
      })
      .finally(() => setLoading(false));
  }, [contentDay]);

  const isPhase3 = stage === 'GIAI_PHONG';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* Check-in column */}
      <div className="bg-sol-paper rounded-2xl p-6 border border-sol-line shadow-card">
        <h2 className="text-h2 font-semibold mb-4">Check-in ngày {day}</h2>
        {checkin ? (
          <div className="space-y-3 text-body">
            <Row label="Có hút?" val={checkin.smoked ? 'Có' : 'Không'} tone={checkin.smoked ? 'red' : 'green'} />
            <Row label="Cơn thèm cao nhất" val={`${checkin.cravingIntensity}/10`} />
            <Row
              label="Tâm trạng"
              val={`${['😣', '🙁', '😐', '🙂', '😄'][checkin.mood - 1]} (${checkin.mood}/5)`}
            />
            {checkin.isSickDay && <Row label="Ngày ốm" val="Miễn chuỗi" tone="orange" />}
            {checkin.note && (
              <div className="pt-3 border-t border-sol-line">
                <div className="text-meta text-sol-ink-3 mb-1">Ghi chú</div>
                <div className="bg-sol-bg p-3 rounded-lg text-body text-sol-ink-2 whitespace-pre-wrap">{checkin.note}</div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-body text-sol-ink-3 italic">Không có check-in cho ngày này.</div>
        )}
      </div>

      {/* Content + Exercise column */}
      <div className="space-y-5">
        <div className="bg-sol-paper rounded-2xl p-6 border border-sol-line shadow-card">
          <h2 className="text-h2 font-semibold mb-4">Nội dung ngày {day}</h2>
          {loading ? (
            <div className="text-body text-sol-ink-3 italic">Đang tải…</div>
          ) : !isPhase3 && (!content || !content.content) ? (
            <div className="bg-sol-blue-soft/40 border border-sol-blue/20 rounded-lg p-4 text-meta text-sol-blue-ink">
              📝 Phase {stage === 'NHAN_THUC' ? '1 Nhận Thức' : stage === 'HANH_DONG' ? '2 Hành Động' : '4 Tái Thiết'} — content đang được Khang biên soạn (38 bài Phase B). Tạm thời chưa có nội dung cho ngày này.
            </div>
          ) : !content?.content ? (
            <div className="text-body text-sol-ink-3 italic">Chưa có nội dung.</div>
          ) : (
            Object.entries(content.content).map(([mod, items]: any) =>
              items.length ? (
                <div key={mod} className="mb-4">
                  <div className="text-meta font-semibold text-sol-ink-2 uppercase tracking-wide mb-1">
                    {labelFor(mod)}
                  </div>
                  {items.map((it: any) => (
                    <div key={it.id} className="text-body text-sol-ink-2 mt-2 pl-3 border-l-2 border-sol-line">
                      <div className="font-semibold text-sol-ink">{it.title}</div>
                      {it.body && <div className="text-meta text-sol-ink-3 mt-1">{it.body}</div>}
                    </div>
                  ))}
                </div>
              ) : null
            )
          )}
        </div>

        <div className="bg-sol-paper rounded-2xl p-6 border border-sol-line shadow-card">
          <h2 className="text-h2 font-semibold mb-4">Bài tập ngày {day}</h2>
          {exercises.length === 0 ? (
            <div className="text-body text-sol-ink-3 italic">Không có bài tập riêng.</div>
          ) : (
            exercises.map((e: any) => (
              <div key={e.exerciseKey} className="mb-3 text-body">
                <div className="font-semibold text-sol-ink">{e.title ?? e.exerciseKey}</div>
                {e.existingEntry?.completedAt && (
                  <div className="text-meta text-sol-green-ink">✓ Hoàn thành</div>
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
    tone === 'green' ? 'text-sol-green-ink'
    : tone === 'red' ? 'text-sol-red'
    : tone === 'orange' ? 'text-sol-orange-ink'
    : 'text-sol-ink';
  return (
    <div className="flex items-center justify-between">
      <span className="text-sol-ink-2">{label}</span>
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
