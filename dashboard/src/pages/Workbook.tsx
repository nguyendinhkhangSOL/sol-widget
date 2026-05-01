// Sổ Tay 30 Ngày Bỏ Thuốc — modular theo tuần.
//
// UX v2 (cắt scroll fatigue cho user 45+ Việt):
//   - Default chỉ hiển thị tuần hiện tại (auto-detect từ quitDate)
//   - Tabs: Chuẩn bị · Tuần 1 · Tuần 2 · Tuần 3 · Tuần 4 · Sau 30 ngày
//   - In/print → render TOÀN BỘ (giữ trải nghiệm "cuốn sách 30 ngày")
//   - URL ?tab=week-2 — sharable + back/forward router work
//
// Tích hợp dữ liệu từ check-in widget ngoài (auto-fill DayCard) + sync lên backend
// để AI Mentor có thể đọc & cá nhân hóa từ các trường "Lý do", "Trigger", reflections…

import { useEffect, useMemo, useRef } from 'react';
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

type WorkbookTab = 'prep' | 'week-1' | 'week-2' | 'week-3' | 'week-4' | 'post';

const TABS: { id: WorkbookTab; label: string; short: string; range?: string }[] = [
  { id: 'prep', label: 'Chuẩn bị', short: 'Chuẩn bị', range: 'Trước Q-Day' },
  { id: 'week-1', label: 'Tuần 1', short: 'T1', range: 'Ngày 1–7' },
  { id: 'week-2', label: 'Tuần 2', short: 'T2', range: 'Ngày 8–14' },
  { id: 'week-3', label: 'Tuần 3', short: 'T3', range: 'Ngày 15–21' },
  { id: 'week-4', label: 'Tuần 4', short: 'T4', range: 'Ngày 22–30' },
  { id: 'post', label: 'Sau 30 ngày', short: '30+', range: 'Đại sứ' },
];

/** Auto-detect tab nào nên mở mặc định dựa trên quitDate. */
function autoDetectTab(quitDate: string | null | undefined): WorkbookTab {
  if (!quitDate) return 'prep';
  const start = new Date(quitDate).getTime();
  if (isNaN(start)) return 'prep';
  const diffDays = Math.floor((Date.now() - start) / 86400000);
  if (diffDays < 0) return 'prep';
  if (diffDays < 7) return 'week-1';
  if (diffDays < 14) return 'week-2';
  if (diffDays < 21) return 'week-3';
  if (diffDays < 30) return 'week-4';
  return 'post';
}

export function Workbook() {
  const user = useStore((s) => s.user);
  const setUser = useStore((s) => s.setUser);
  const data = useWorkbook((s) => s.data);
  const importJSON = useWorkbook((s) => s.importJSON);
  const [params, setParams] = useSearchParams();

  // ─── Bootstrap from backend (settings.workbook) on first load ────
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

  // ─── Debounced upload to backend ────────────────────────────────
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

  // ─── Tab logic ───────────────────────────────────────────────────
  const auto = useMemo(() => autoDetectTab(user?.quitDate), [user?.quitDate]);
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

  return (
    <div className="wb-root bg-sol-bg min-h-screen">
      <WorkbookNav />

      {/* Tab bar — KHÔNG hiện khi print mode để giữ "cuốn sách" liền mạch */}
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
                      ? 'bg-sol-green text-white'
                      : 'bg-sol-paper text-sol-ink-2 hover:bg-sol-soft border border-sol-line')
                  }
                >
                  <span className="flex items-center gap-1.5">
                    {t.label}
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
            {/* In/print full book */}
            <button
              onClick={() => {
                const next = new URLSearchParams(params);
                next.set('print', '1');
                next.delete('tab');
                setParams(next, { replace: true });
                setTimeout(() => window.print(), 100);
              }}
              className="shrink-0 min-h-tap px-3 py-2 rounded-lg text-meta font-medium bg-sol-paper border border-sol-line text-sol-ink-2 hover:bg-sol-soft flex flex-col items-start"
              title="In toàn bộ sổ tay 30 ngày"
            >
              <span>🖨️ In sách</span>
              <span className="text-[10px] text-sol-ink-3">Toàn bộ</span>
            </button>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto p-4 lg:p-6 pb-24 lg:pb-10 space-y-6 print:p-0 print:space-y-4">
        {/* PRINT MODE — render TOÀN BỘ */}
        {printMode ? (
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
            <WeekSection week={1} />
            <WeekSection week={2} />
            <WeekSection week={3} />
            <WeekSection week={4} />
            <Post30Section />
          </>
        ) : (
          <>
            {/* Hero luôn hiện ở mọi tab — context cho user */}
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
            {activeTab === 'week-1' && <WeekSection week={1} />}
            {activeTab === 'week-2' && <WeekSection week={2} />}
            {activeTab === 'week-3' && <WeekSection week={3} />}
            {activeTab === 'week-4' && <WeekSection week={4} />}
            {activeTab === 'post' && <Post30Section />}

            {/* Nav xuống/lên giữa các tuần */}
            <TabNavFooter activeTab={activeTab} setTab={setTab} />
          </>
        )}

        {/* Print footer */}
        <footer className="text-center text-xs text-sol-ink/50 pt-6 print:pt-10">
          <div className="font-bold text-sol-orange text-sm">
            SOL · Sống Lại · Làm Lại Tốt Hơn
          </div>
          bothuocla.sol.vn · sol.vn
          <div className="mt-1 text-[11px]">
            Sổ tay này thuộc về bạn — hành trình này cũng vậy.
          </div>
        </footer>
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
          <div className="text-meta font-semibold text-sol-ink">{prev.label}</div>
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
          <div className="text-meta font-semibold text-sol-ink">{next.label}</div>
        </button>
      ) : (
        <div className="flex-1" />
      )}
    </div>
  );
}
