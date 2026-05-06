// dashboard/src/pages/Workbook.tsx
// PHASE B — Sổ tay theo 4 phase tiến hoá hành vi.
//
// Tab structure mới:
//   prep      — Chuẩn bị (Pre-Q-Day, giữ nguyên section cũ)
//   phase-1   — 🌱 Nhận Thức (Day 1-7) — placeholder, content đang biên soạn
//   phase-2   — 🔥 Hành Động (Day 8-28) — placeholder
//   phase-3   — 🚭 Giải Phóng (Day 29-58) — render 4 tuần workbook cũ liền mạch
//   phase-4   — 🌟 Tái Thiết (Day 59-88) — render Post30Section
//
// Auto-detect tab theo stage (từ /journey/dashboard payload).
// Print mode `?print=1` render TOÀN BỘ giữ trải nghiệm "cuốn sách 88 ngày".

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../state/store';
import { useWorkbook } from '../state/workbookStore';
import { api } from '../services/api';
import { WorkbookHero } from '../components/workbook/WorkbookHero';
import { WorkbookNav } from '../components/workbook/WorkbookNav';
import { PreQuitSection } from '../components/workbook/PreQuitSection';
import {
  WhySection,
  PledgeSection,
  NetworkSection,
  MoneySection,
  CravingLogSection,
  RelapsePlanSection,
  ResourcesSection,
} from '../components/workbook/PrepSections';
import { WeekSection } from '../components/workbook/WeekSection';
import { Post30Section } from '../components/workbook/Post30Section';
import type { Stage, DashboardData } from '../components/views/phaseB/types';

type WorkbookTab = 'prep' | 'phase-1' | 'phase-2' | 'phase-3' | 'phase-4';

const TABS: { id: WorkbookTab; label: string; emoji: string; range: string; color: string }[] = [
  { id: 'prep',     label: 'Chuẩn bị',    emoji: '📋', range: 'Trước Q-Day',  color: '#5C5650' },
  { id: 'phase-1',  label: 'Nhận Thức',  emoji: '🌱', range: 'Ngày 1–7',     color: '#B25C2C' },
  { id: 'phase-2',  label: 'Hành Động',  emoji: '🔥', range: 'Ngày 8–28',    color: '#B8860B' },
  { id: 'phase-3',  label: 'Giải Phóng', emoji: '🚭', range: 'Ngày 29–58',   color: '#3A7CA5' },
  { id: 'phase-4',  label: 'Tái Thiết',  emoji: '🌟', range: 'Ngày 59–88',   color: '#5C3A1E' },
];

function tabFromStage(stage: Stage | null, dayInJourney: number): WorkbookTab {
  if (!stage || dayInJourney <= 0) return 'prep';
  if (stage === 'NHAN_THUC') return 'phase-1';
  if (stage === 'HANH_DONG') return 'phase-2';
  if (stage === 'GIAI_PHONG') return 'phase-3';
  if (stage === 'TAI_THIET') return 'phase-4';
  return 'phase-4'; // DAI_SU vẫn xem Phase 4 maintenance
}

export function Workbook() {
  const user = useStore((s) => s.user);
  const setUser = useStore((s) => s.setUser);
  const data = useWorkbook((s) => s.data);
  const importJSON = useWorkbook((s) => s.importJSON);
  const [params, setParams] = useSearchParams();

  const [phaseData, setPhaseData] = useState<DashboardData | null>(null);
  useEffect(() => {
    api.getJourneyDashboard().then(setPhaseData).catch(() => setPhaseData(null));
  }, [user?.quitDate, user?.qDayConfirmedAt]);

  // Bootstrap workbook from backend
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current || !user) return;
    const currentData = useWorkbook.getState().data;
    const patch: Partial<typeof currentData> = {};
    if (!currentData.userName && user.name) patch.userName = user.name;
    if (!currentData.quitDate && user.quitDate) {
      patch.quitDate = user.quitDate.slice(0, 10);
    }
    if (!currentData.cigsDay && user.settings?.cigsPerDay) {
      patch.cigsDay = user.settings.cigsPerDay;
    }
    const saved = (user.settings as any)?.workbook;
    if (saved && typeof saved === 'object') {
      importJSON(JSON.stringify({ ...currentData, ...saved, ...patch }));
    } else if (Object.keys(patch).length) {
      useWorkbook.setState({ data: { ...currentData, ...patch, updatedAt: Date.now() } });
    }
    hydratedRef.current = true;
  }, [user, importJSON]);

  // Debounced upload
  const uploadTimer = useRef<number | null>(null);
  useEffect(() => {
    if (!hydratedRef.current || !user) return;
    if (uploadTimer.current) window.clearTimeout(uploadTimer.current);
    uploadTimer.current = window.setTimeout(() => {
      api
        .patchMe({ settings: { ...(user.settings ?? {}), workbook: data } as any } as any)
        .then(() => {
          setUser({ ...user, settings: { ...(user.settings ?? {}), workbook: data } as any });
        })
        .catch(() => {});
    }, 2500);
    return () => {
      if (uploadTimer.current) window.clearTimeout(uploadTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.updatedAt]);

  // Tab logic
  const auto = useMemo<WorkbookTab>(
    () => tabFromStage(phaseData?.journey?.stage ?? null, phaseData?.journey?.dayInJourney ?? 0),
    [phaseData?.journey?.stage, phaseData?.journey?.dayInJourney],
  );
  const tabParam = params.get('tab') as WorkbookTab | null;
  const printMode = params.get('print') === '1';
  const activeTab: WorkbookTab =
    tabParam && TABS.some((t) => t.id === tabParam) ? tabParam : auto;

  function setTab(t: WorkbookTab) {
    const next = new URLSearchParams(params);
    next.set('tab', t);
    next.delete('print');
    setParams(next, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // WorkbookNav (anchor links T1-T4 + Sau 30N) chỉ phù hợp tab prep + phase-3
  // (= 30 ngày Workbook cũ). Tab Phase 1/2/4 placeholder không có anchor sections.
  const showLegacyNav = activeTab === 'prep' || activeTab === 'phase-3';
  const showLegacyHero = activeTab === 'prep' || activeTab === 'phase-3';

  return (
    <div className="wb-root bg-sol-bg min-h-screen">
      {showLegacyNav && <WorkbookNav />}

      {/* Tab bar */}
      {!printMode && (
        <div className="sticky top-0 z-10 bg-sol-bg/95 backdrop-blur border-b border-sol-line print:hidden">
          <div className="max-w-5xl mx-auto px-2 py-2 flex gap-1 overflow-x-auto scrollbar-thin">
            {TABS.map((t) => {
              const isActive = t.id === activeTab;
              const isCurrent = t.id === auto;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={
                    'shrink-0 min-h-tap px-3 py-2 rounded-lg text-meta font-medium transition flex flex-col items-start ' +
                    (isActive
                      ? 'text-white shadow-card'
                      : 'bg-sol-paper text-sol-ink-2 hover:bg-sol-soft border border-sol-line')
                  }
                  style={isActive ? { backgroundColor: t.color } : undefined}
                >
                  <span className="flex items-center gap-1.5">
                    <span aria-hidden="true">{t.emoji}</span>
                    <span>{t.label}</span>
                    {isCurrent && (
                      <span
                        className={
                          'text-[9px] uppercase font-bold px-1 rounded ' +
                          (isActive ? 'bg-white/25 text-white' : 'bg-sol-orange text-white')
                        }
                      >
                        Hiện tại
                      </span>
                    )}
                  </span>
                  <span className={'text-[10px] ' + (isActive ? 'text-white/80' : 'text-sol-ink-3')}>
                    {t.range}
                  </span>
                </button>
              );
            })}
            <button
              onClick={() => {
                const next = new URLSearchParams(params);
                next.set('print', '1');
                next.delete('tab');
                setParams(next, { replace: true });
                setTimeout(() => window.print(), 100);
              }}
              className="shrink-0 min-h-tap px-3 py-2 rounded-lg text-meta font-medium bg-sol-paper border border-sol-line text-sol-ink-2 hover:bg-sol-soft flex flex-col items-start"
              title="In toàn bộ sổ tay 88 ngày"
            >
              <span>🖨️ In sách</span>
              <span className="text-[10px] text-sol-ink-3">Toàn bộ</span>
            </button>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto p-4 lg:p-6 pb-24 lg:pb-10 space-y-6 print:p-0 print:space-y-4">
        {printMode ? (
          // PRINT MODE — render TOÀN BỘ 88 ngày
          <>
            <WorkbookHero />
            <PreQuitSection />
            <WhySection />
            <PledgeSection />
            <NetworkSection />
            <MoneySection />
            <CravingLogSection />
            <RelapsePlanSection />
            <ResourcesSection />
            <PhasePlaceholder phase="phase-1" stage="NHAN_THUC" />
            <PhasePlaceholder phase="phase-2" stage="HANH_DONG" />
            <WeekSection week={1} />
            <WeekSection week={2} />
            <WeekSection week={3} />
            <WeekSection week={4} />
            <Post30Section />
          </>
        ) : (
          <>
            <WorkbookHero />

            {activeTab === 'prep' && (
              <>
                <PreQuitSection />
                <WhySection />
                <PledgeSection />
                <NetworkSection />
                <MoneySection />
                <CravingLogSection />
                <RelapsePlanSection />
                <ResourcesSection />
              </>
            )}
            {activeTab === 'phase-1' && <PhasePlaceholder phase="phase-1" stage="NHAN_THUC" />}
            {activeTab === 'phase-2' && <PhasePlaceholder phase="phase-2" stage="HANH_DONG" />}
            {activeTab === 'phase-3' && (
              <>
                <Phase3Hero />
                <WeekSection week={1} />
                <WeekSection week={2} />
                <WeekSection week={3} />
                <WeekSection week={4} />
              </>
            )}
            {activeTab === 'phase-4' && (
              <>
                <PhasePlaceholder phase="phase-4" stage="TAI_THIET" />
                <Post30Section />
              </>
            )}

            <TabNavFooter activeTab={activeTab} setTab={setTab} />
          </>
        )}

        <footer className="text-center text-xs text-sol-ink/50 pt-6 print:pt-10">
          <div className="font-bold text-sol-orange text-sm">
            SOL · Sống Lại · Làm Lại Tốt Hơn
          </div>
          bothuocla.sol.vn · sol.vn
          <div className="mt-1 text-[11px]">
            Sổ tay 88 ngày này thuộc về bạn — hành trình này cũng vậy.
          </div>
        </footer>
      </div>
    </div>
  );
}

/* ─── Phase 3 Hero — intro 30 ngày ───────────────────────────────────────── */
function Phase3Hero() {
  return (
    <div className="bg-sol-blue-soft/40 border border-sol-blue/20 rounded-2xl p-6 mb-2">
      <div className="flex items-baseline gap-3 mb-2">
        <span className="text-3xl" aria-hidden="true">🚭</span>
        <h2 className="text-h1 text-sol-blue-ink font-bold">Giai đoạn Giải Phóng</h2>
      </div>
      <p className="text-body text-sol-ink leading-relaxed">
        Đây là 30 ngày sau Q-Day — đồng hồ tự do của bạn đang chạy.
        Sổ tay được biên soạn theo từng tuần (T1–T4) để bạn ghi lại hành trình bỏ hẳn.
      </p>
    </div>
  );
}

/* ─── Placeholder cho Phase 1, 2, 4 (content đang biên soạn) ─────────────── */
function PhasePlaceholder({ phase, stage }: { phase: WorkbookTab; stage: Stage }) {
  const meta = TABS.find((t) => t.id === phase)!;
  const description: Record<Stage, string> = {
    NHAN_THUC: 'Tuần đầu — Sol gợi ý 7 prompt quan sát hành vi: ghi từng điếu, map trigger, viết phản chiếu mỗi tối. Không có mục tiêu, chỉ quan sát.',
    HANH_DONG: '21 ngày phá vòng lặp — prompt mỗi ngày về delay craving, swap habit, viết Plan B cho từng trigger. Tuần 3 chuẩn bị Q-Day.',
    GIAI_PHONG: '',
    TAI_THIET: '10 prompt maintenance — identity rebuild, anti-relapse cảnh báo, lập gia đình/con cái như anchor dài hạn.',
    DAI_SU: '',
  };

  return (
    <div
      className="rounded-2xl p-8 border-2 border-dashed"
      style={{
        backgroundColor: meta.color + '0F',
        borderColor: meta.color + '60',
      }}
    >
      <div className="flex items-baseline gap-3 mb-3">
        <span className="text-4xl" aria-hidden="true">{meta.emoji}</span>
        <h2 className="text-h1 font-bold" style={{ color: meta.color }}>
          {meta.label}
        </h2>
        <span className="text-meta text-sol-ink-3">{meta.range}</span>
      </div>
      <p className="text-body text-sol-ink leading-relaxed mb-4">
        {description[stage]}
      </p>
      <div className="bg-sol-paper border border-sol-line rounded-xl p-5">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-xl">📝</span>
          <strong className="text-sol-ink">Sol đang biên soạn</strong>
        </div>
        <p className="text-meta text-sol-ink-2 leading-relaxed">
          Khang đang viết <strong>38 bài content Phase B</strong> (Phase 1: 7 bài, Phase 2: 21 bài, Phase 4: 10 bài).
          Khi sẵn sàng, prompt từng ngày sẽ xuất hiện ở đây — auto-fill từ check-in,
          sync lên backend để AI Mentor cá nhân hoá phản chiếu.
        </p>
      </div>
    </div>
  );
}

function TabNavFooter({
  activeTab,
  setTab,
}: {
  activeTab: WorkbookTab;
  setTab: (t: WorkbookTab) => void;
}) {
  const idx = TABS.findIndex((t) => t.id === activeTab);
  const prev = idx > 0 ? TABS[idx - 1] : null;
  const next = idx < TABS.length - 1 ? TABS[idx + 1] : null;

  if (!prev && !next) return null;

  return (
    <div className="flex items-center justify-between gap-3 pt-4 border-t border-sol-line">
      {prev ? (
        <button
          onClick={() => setTab(prev.id)}
          className="flex-1 min-h-tap rounded-xl border border-sol-line bg-sol-paper px-4 py-2.5 text-left hover:border-sol-green/40 transition"
        >
          <div className="text-[10px] uppercase text-sol-ink-3 font-semibold">← Trước</div>
          <div className="text-meta font-semibold text-sol-ink">{prev.emoji} {prev.label}</div>
        </button>
      ) : (
        <div className="flex-1" />
      )}
      {next ? (
        <button
          onClick={() => setTab(next.id)}
          className="flex-1 min-h-tap rounded-xl border border-sol-green/30 bg-sol-green-soft px-4 py-2.5 text-right hover:border-sol-green/60 transition"
        >
          <div className="text-[10px] uppercase text-sol-green-ink font-semibold">Tiếp →</div>
          <div className="text-meta font-semibold text-sol-ink">{next.emoji} {next.label}</div>
        </button>
      ) : (
        <div className="flex-1" />
      )}
    </div>
  );
}
