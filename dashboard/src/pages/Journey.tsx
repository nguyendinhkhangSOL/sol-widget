// dashboard/src/pages/Journey.tsx
// COHORT-AWARE journey (canonical 2026-05-18, anh Khang confirm 22/5/2026).
//
// 4 chặng theo cohort FTND của user:
//   🟢 LIGHT    (35 ngày): Nhận Diện 1-7  + Kiểm Soát 8-14 + Làm Chủ 15-35 + Tái Thiết 36+
//   🟡 MODERATE (52 ngày): Nhận Diện 1-7  + Kiểm Soát 8-21 + Làm Chủ 22-52 + Tái Thiết 53+
//   🔴 HEAVY    (65 ngày): Nhận Diện 1-7  + Kiểm Soát 8-28 + Làm Chủ 29-65 + Tái Thiết 66+
//
// Tái Thiết = extension MIỄN PHÍ Day (totalDays+1) → 88+ (bảo trì thành công,
// anti-relapse). Không giới hạn thời gian, không tăng giá.

import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useStore } from '../state/store';
import { api, ApiError } from '../services/api';
import { PhaseBar } from '../components/views/phaseB/PhaseBar';
import type { DashboardData, Stage, Cohort, JourneyChapter } from '../components/views/phaseB/types';

interface ChapterSection {
  key: JourneyChapter;
  legacyKey: Stage;          // mapping ngược cho PhaseBar
  label: string;
  tagline: string;
  emoji: string;
  color: string;
  startDay: number;
  endDay: number;            // Infinity cho Tái Thiết
  total: number;             // Infinity cho Tái Thiết
}

// Chapter colors & labels (mirror cohortConfig.ts backend)
const CHAPTER_META: Record<JourneyChapter, { label: string; tagline: string; emoji: string; color: string; legacy: Stage }> = {
  NHAN_DIEN: { label: 'Nhận Diện', tagline: 'Quan sát — chưa thay đổi gì',     emoji: '🌱', color: '#B25C2C', legacy: 'NHAN_THUC' },
  KIEM_SOAT: { label: 'Kiểm Soát', tagline: 'Giảm dần — xây thói quen mới',    emoji: '🔥', color: '#B8860B', legacy: 'HANH_DONG' },
  LAM_CHU:   { label: 'Làm Chủ',   tagline: 'Bỏ hẳn — đồng hồ tự do',          emoji: '🚭', color: '#3A7CA5', legacy: 'GIAI_PHONG' },
  TAI_THIET: { label: 'Tái Thiết', tagline: 'Bảo trì thành công — miễn phí ∞', emoji: '🌟', color: '#5C3A1E', legacy: 'TAI_THIET' },
};

/** Tạo 4 chapter sections theo cohort. Tái Thiết kéo dài đến Day 88+ (cap UI 88). */
function getChapterSections(
  journeyV2: NonNullable<DashboardData['journeyV2']>,
): ChapterSection[] {
  const chapters = journeyV2.chapters;
  const taiThietEnd = 88; // UI cap — backend extension không giới hạn
  return [
    {
      key: 'NHAN_DIEN',
      ...CHAPTER_META.NHAN_DIEN,
      legacyKey: CHAPTER_META.NHAN_DIEN.legacy,
      startDay: chapters.NHAN_DIEN.start,
      endDay: chapters.NHAN_DIEN.end,
      total: chapters.NHAN_DIEN.total,
    },
    {
      key: 'KIEM_SOAT',
      ...CHAPTER_META.KIEM_SOAT,
      legacyKey: CHAPTER_META.KIEM_SOAT.legacy,
      startDay: chapters.KIEM_SOAT.start,
      endDay: chapters.KIEM_SOAT.end,
      total: chapters.KIEM_SOAT.total,
    },
    {
      key: 'LAM_CHU',
      ...CHAPTER_META.LAM_CHU,
      legacyKey: CHAPTER_META.LAM_CHU.legacy,
      startDay: chapters.LAM_CHU.start,
      endDay: chapters.LAM_CHU.end,
      total: chapters.LAM_CHU.total,
    },
    {
      key: 'TAI_THIET',
      ...CHAPTER_META.TAI_THIET,
      legacyKey: CHAPTER_META.TAI_THIET.legacy,
      startDay: journeyV2.taiThietStart,
      endDay: taiThietEnd,
      total: Math.max(0, taiThietEnd - journeyV2.taiThietStart + 1),
    },
  ];
}

// LEGACY fallback — chỉ dùng khi backend trả journey cũ (chưa migrate xong)
const PHASE_SECTIONS_LEGACY: ChapterSection[] = [
  { key: 'NHAN_DIEN', legacyKey: 'NHAN_THUC',  label: 'Nhận Diện', tagline: '', emoji: '🌱', color: '#B25C2C', startDay: 1,  endDay: 7,  total: 7 },
  { key: 'KIEM_SOAT', legacyKey: 'HANH_DONG',  label: 'Kiểm Soát', tagline: '', emoji: '🔥', color: '#B8860B', startDay: 8,  endDay: 28, total: 21 },
  { key: 'LAM_CHU',   legacyKey: 'GIAI_PHONG', label: 'Làm Chủ',   tagline: '', emoji: '🚭', color: '#3A7CA5', startDay: 29, endDay: 58, total: 30 },
  { key: 'TAI_THIET', legacyKey: 'TAI_THIET',  label: 'Tái Thiết', tagline: '', emoji: '🌟', color: '#5C3A1E', startDay: 59, endDay: 88, total: 30 },
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
      setError(e instanceof ApiError ? `Lỗi kết nối (${e.status}): ${e.body?.message ?? ''}` : 'Sol chưa tải được hành trình. Thử lại sau nhé.');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  // V2 cohort-aware sections (fallback legacy 88-day nếu API chưa trả journeyV2)
  const sections = useMemo(() => {
    if (data?.journeyV2) return getChapterSections(data.journeyV2);
    return PHASE_SECTIONS_LEGACY;
  }, [data?.journeyV2]);

  const maxDay = useMemo(() => {
    if (!sections.length) return 88;
    return sections[sections.length - 1].endDay;
  }, [sections]);

  const cohortCode: Cohort | null = data?.journeyV2?.cohort ?? null;

  const selectedDay = dayParam ? parseInt(dayParam, 10) : null;
  const selected = selectedDay && selectedDay >= 1 && selectedDay <= maxDay ? selectedDay : null;

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
  const qDayConfirmed = !!data.user.qDayConfirmedAt;

  // V2 cohort info nếu có. Fallback legacy stage cho PhaseBar.
  const v2 = data.journeyV2;
  const cohortLabel = v2?.cohortLabel ?? '';
  const cohortEmoji = v2?.cohortEmoji ?? '';
  const cohortTagline = v2?.cohortTagline ?? '';
  const totalDays = v2?.totalDays ?? 88;
  const currentStageForBar: Stage = (v2 ? CHAPTER_META[v2.chapter].legacy : data.journey.stage);
  const dayInChapterForBar = v2?.dayInChapter ?? data.journey.dayInStage;
  const totalInChapterForBar = (v2?.totalInChapter ?? data.journey.totalInStage) || data.journey.totalInStage;
  const progressInChapterForBar = v2?.progressInChapter ?? data.journey.progressInStage;

  return (
    <div className="w-full max-w-[1100px] mx-auto p-4 lg:p-6 pb-24 lg:pb-8 space-y-6">
      <header className="px-1">
        <h1 className="text-display text-sol-ink font-bold">🗺️ Hành Trình Sol</h1>
        {v2 ? (
          <p className="text-body text-sol-ink-2 mt-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sol-paper border border-sol-ink/10 font-semibold mr-2">
              <span>{cohortEmoji}</span>
              <span>Lộ trình {cohortLabel}</span>
              <span className="text-sol-ink-3 font-normal">· {totalDays} ngày</span>
            </span>
            {cohortTagline}. Bấm vào mỗi ngày để xem chi tiết.
          </p>
        ) : (
          <p className="text-body text-sol-ink-2 mt-1">
            4 chặng hành trình — Nhận Diện · Kiểm Soát · Làm Chủ · Tái Thiết. Bấm vào mỗi ngày để xem chi tiết.
          </p>
        )}
      </header>

      <PhaseBar
        stage={currentStageForBar}
        progressInStage={progressInChapterForBar}
        dayInStage={dayInChapterForBar}
        totalInStage={totalInChapterForBar}
      />

      {/* Memory Book ready banner — khi user hoàn thành lộ trình chính */}
      {v2?.memoryBookReady && (
        <div className="bg-gradient-to-r from-sol-clay/10 to-sol-gold/10 border-2 border-sol-clay rounded-2xl p-5 flex items-center gap-4">
          <div className="text-5xl">📖</div>
          <div className="flex-1">
            <h2 className="text-h2 font-bold text-sol-clay">Sổ Lưu Niệm sẵn sàng</h2>
            <p className="text-body text-sol-ink-2 mt-1">
              Anh vừa hoàn thành lộ trình {cohortLabel} {totalDays} ngày. Sổ Lưu Niệm của hành trình anh đã được tổng hợp — sẵn sàng xem + chia sẻ.
            </p>
          </div>
          <button
            onClick={() => nav('/workbook?print=1')}
            className="px-5 py-3 rounded-xl bg-sol-clay text-white font-semibold whitespace-nowrap"
          >
            Mở Sổ Lưu Niệm
          </button>
        </div>
      )}

      {/* 4 chapter sections — render dynamic theo cohort */}
      {sections.map((phase) => {
        // Tái Thiết = open-ended → user vẫn ở đó nếu day >= startDay, không có "đã qua"
        const isTaiThiet = phase.key === 'TAI_THIET';
        const isPastPhase = !isTaiThiet && currentDay > phase.endDay;
        const isCurrentPhase = isTaiThiet
          ? currentDay >= phase.startDay
          : currentDay >= phase.startDay && currentDay <= phase.endDay;
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
                  {isTaiThiet
                    ? `Ngày ${phase.startDay}+ · Tặng miễn phí`
                    : `Ngày ${phase.startDay}–${phase.endDay} · ${phase.total} ngày`}
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

            {/* Tagline chặng */}
            {phase.tagline && (
              <p className="text-meta text-sol-ink-3 -mt-3 mb-3 italic">{phase.tagline}</p>
            )}

            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: phase.total }).map((_, i) => {
                const day = phase.startDay + i;
                const isToday = day === currentDay;
                const isLocked = day > currentDay;

                // Check-in lookup: dùng day trực tiếp (mỗi day có 1 check-in unique).
                // Legacy fallback: GIAI_PHONG cũ map day 29-58 → contentDay 1-30,
                // chỉ apply khi phase.key === 'LAM_CHU' VÀ KHÔNG có journeyV2
                // (tức backend chưa migrate). V2 → dùng day thẳng.
                let checkinKey = day;
                if (!v2 && phase.key === 'LAM_CHU') {
                  checkinKey = day - 28; // legacy mapping
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
                  Ngày 28 = <strong>Ngày Quyết Định</strong> — ngày {data.user.pronouns} cam kết bỏ hẳn.
                  {qDayConfirmed && currentDay >= 28
                    ? ' ✓ Đã cam kết.'
                    : currentDay >= 28
                    ? ' Chưa cam kết — bấm vào Hành Trình để xác nhận.'
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
            {data.user.pronouns} đã tốt nghiệp. Hành trình 52 ngày hoàn tất — giờ là lúc chia sẻ với người mới.
          </p>
        </section>
      )}

      {selected && <DayDetail day={selected} stage={currentStageForBar} />}
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
              📝 Chặng {stage === 'NHAN_THUC' ? 'Nhận Diện' : stage === 'HANH_DONG' ? 'Kiểm Soát' : 'Tái Thiết'} — Khang đang biên soạn nội dung cho ngày này. Sẽ có sớm.
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
