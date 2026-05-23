// dashboard/src/pages/Overview.tsx
// PHASE B ROUTER — landing page Tổng Quan của dashboard.
// Pattern giống widget JourneyDashboard.tsx: load /journey/dashboard,
// switch theo stage, overlay onboarding + Q-Day ceremony.

import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api, ApiError } from '../services/api';
// Day 4 (2026-05-21): OnboardingWizard cũ (cigsBaseline form) đã được thay
// bằng Test FTND ở route /test-ftnd. Giữ import phòng fallback nếu cần.
// import { OnboardingWizard } from '../components/views/phaseB/OnboardingWizard';
import { QDayCeremony } from '../components/views/phaseB/QDayCeremony';
import { PhaseBar } from '../components/views/phaseB/PhaseBar';
import { PhaseObserver } from '../components/views/phaseB/PhaseObserver';
import { PhaseAction } from '../components/views/phaseB/PhaseAction';
import { PhaseLiberation } from '../components/views/phaseB/PhaseLiberation';
import { PhaseRebuild } from '../components/views/phaseB/PhaseRebuild';
import { PhaseAmbassador } from '../components/views/phaseB/PhaseAmbassador';
import { ExitModal } from '../components/views/phaseB/_shared';
import { DashboardData } from '../components/views/phaseB/types';
// Silent Companionship widgets (pivot 2026-05-08)
import {
  ControlScoreWidget,
  AnonymousStatsWidget,
  QuickWinDay3Widget,
  Day7ReportWidget,
  Day14ReportWidget,
  CrisisTriggerButton,
} from '../components/SilentCompanionshipWidgets';

export function Overview() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExit, setShowExit] = useState(false);

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const r = await api.getJourneyDashboard() as DashboardData;
      setData(r);
    } catch (e) {
      console.error('Failed to load journey dashboard', e);
      if (e instanceof ApiError) {
        const detail = e.body?.message || e.body?.error || JSON.stringify(e.body).slice(0, 200);
        setError(`API ${e.status}: ${detail}`);
      } else if (e instanceof Error) {
        setError(`Lỗi mạng: ${e.message}`);
      } else {
        setError('Lỗi không xác định khi tải hành trình.');
      }
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { reload(); }, []);

  // Loading state
  if (loading && !data) {
    return (
      <div className="w-full max-w-[1100px] mx-auto p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">🌅</div>
          <div className="text-body text-sol-ink-3">Sol đang khởi động hành trình…</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <div className="w-full max-w-[1100px] mx-auto p-8 flex items-center justify-center min-h-[60vh]">
        <div className="max-w-lg text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-h1 text-sol-ink mb-3">Sol chưa kết nối được</h2>
          <p className="text-body text-sol-ink-2 mb-3 leading-relaxed">{error}</p>
          <p className="text-meta text-sol-ink-3 mb-5 italic">
            Có thể backend chưa apply migration Phase B hoặc chưa rebuild image.
            Kiểm tra terminal nơi chạy backend.
          </p>
          <button
            onClick={reload}
            className="min-h-tap px-6 py-3 rounded-xl bg-sol-green text-white font-semibold text-body"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // ─── ONBOARDING REDIRECT — fallback (Day 9 update) ──────────────────────
  // App.tsx đã route /test-ftnd ngay từ entry nếu user chưa onboarding,
  // nên về lý thuyết không vào tới đây. Giữ làm safety net cho edge case
  // (user navigate trực tiếp / sau khi clear localStorage chẳng hạn).
  if (!data.user.onboardingCompletedAt) {
    return <Navigate to="/test-ftnd" replace />;
  }

  // ─── Q-DAY CEREMONY OVERLAY ─────────────────────────────────────────────
  if (data.qDay.needsConfirmation) {
    return (
      <QDayCeremony
        pronouns={data.user.pronouns}
        isPastQDay={data.qDay.isPostQDay}
        onConfirmed={() => reload()}
      />
    );
  }

  // ─── EXITED STATE ───────────────────────────────────────────────────────
  if (data.user.exitedAt) {
    return <ExitedState pronouns={data.user.pronouns} onResume={reload} />;
  }

  // ─── PHASE ROUTER (V2 cohort-aware) ─────────────────────────────────────
  // Ưu tiên journeyV2.chapter (cohort-aware, canonical 2026-05-18). Fallback
  // journey.stage legacy nếu backend chưa migrate.
  //
  // Mapping: NHAN_DIEN → Observer (Nhận Thức cũ)
  //          KIEM_SOAT → Action (Hành Động cũ)
  //          LAM_CHU   → Liberation (Giải Phóng cũ)
  //          TAI_THIET → Rebuild (Tái Thiết cũ)
  const sharedProps = {
    data,
    onReload: reload,
    onShowExit: () => setShowExit(true),
  };

  const v2 = data.journeyV2;
  // Effective stage = V2 chapter mapped to legacy stage cho phase view router
  const effectiveStage = v2
    ? (v2.chapter === 'NHAN_DIEN' ? 'NHAN_THUC'
      : v2.chapter === 'KIEM_SOAT' ? 'HANH_DONG'
      : v2.chapter === 'LAM_CHU'   ? 'GIAI_PHONG'
      : 'TAI_THIET')
    : data.journey.stage;

  let phaseView;
  switch (effectiveStage) {
    case 'NHAN_THUC':
      phaseView = <PhaseObserver {...sharedProps} />;
      break;
    case 'HANH_DONG':
      phaseView = <PhaseAction {...sharedProps} />;
      break;
    case 'GIAI_PHONG':
      phaseView = <PhaseLiberation {...sharedProps} />;
      break;
    case 'TAI_THIET':
      phaseView = <PhaseRebuild {...sharedProps} />;
      break;
    case 'DAI_SU':
      phaseView = <PhaseAmbassador {...sharedProps} />;
      break;
    default:
      phaseView = <PhaseObserver {...sharedProps} />;
  }

  // PhaseBar values: ưu tiên V2 chapter info, fallback legacy stage info
  const barStage = effectiveStage;
  const barDayInStage = v2?.dayInChapter ?? data.journey.dayInStage;
  const barTotalInStage = (v2?.totalInChapter ?? data.journey.totalInStage) || data.journey.totalInStage;
  const barProgressInStage = v2?.progressInChapter ?? data.journey.progressInStage;

  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <div className="w-full max-w-[1100px] mx-auto p-4 lg:p-6 pb-24 lg:pb-8 space-y-6">
      {/* Greeting header */}
      <header className="px-1">
        <div className="text-meta text-sol-ink-3 uppercase tracking-wide font-semibold">Xin chào</div>
        <h1 className="text-h1 text-sol-ink mt-1">
          {cap(data.user.pronouns)} {data.user.name}
        </h1>
      </header>

      {/* Crisis trigger button — luôn ở top, accessibility cao nhất */}
      <CrisisTriggerButton />

      {/* Quick Win Day 3 báo cáo (chỉ hiện Day 3+) */}
      <QuickWinDay3Widget />

      {/* Day 7 full report (chỉ hiện Day 7+) */}
      <Day7ReportWidget />

      {/* Day 14 báo cáo Sol Start (chỉ hiện Sol Start tier + Day 14+) */}
      <Day14ReportWidget />

      {/* Control Score — chỉ số làm chủ */}
      <ControlScoreWidget />

      {/* Anonymous Stats — "Tuần này trong Sol" */}
      <AnonymousStatsWidget />

      {/* PhaseBar 4 viên ngọc — V2 cohort-aware */}
      <PhaseBar
        stage={barStage}
        progressInStage={barProgressInStage}
        dayInStage={barDayInStage}
        totalInStage={barTotalInStage}
      />

      {/* Phase view */}
      {phaseView}

      {showExit && (
        <ExitModal
          pronouns={data.user.pronouns}
          dayInJourney={data.journey.dayInJourney}
          onClose={() => setShowExit(false)}
          onExited={reload}
        />
      )}
    </div>
  );
}

/* ─── EXITED STATE ─────────────────────────────────────────────────────── */
function ExitedState({ pronouns, onResume }: { pronouns: string; onResume: () => void }) {
  const [resuming, setResuming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function resume() {
    setResuming(true);
    setError(null);
    try {
      await api.resumeJourney();
      onResume();
    } catch (e) {
      setError(e instanceof ApiError ? `Lỗi ${e.status}` : 'Không kết nối được Sol.');
    } finally {
      setResuming(false);
    }
  }

  return (
    <div className="w-full max-w-[800px] mx-auto p-8 text-center min-h-[60vh] flex flex-col items-center justify-center">
      <div className="text-7xl mb-5">📔</div>
      <h2 className="text-display text-sol-ink font-bold mb-3">Hồ sơ của {pronouns} đã lưu</h2>
      <p className="text-body-lg text-sol-ink-2 mb-8 max-w-lg leading-relaxed">
        Cảm ơn {pronouns} đã đi cùng Sol. Bản nhật ký tiến bộ đã được tạo.
        Khi nào sẵn sàng quay lại, Sol vẫn nhớ tất cả.
      </p>

      {error && <div className="text-meta text-sol-red mb-3">{error}</div>}

      <button
        onClick={resume}
        disabled={resuming}
        className="min-h-tap px-8 py-4 rounded-xl bg-sol-green text-white font-semibold text-body-lg shadow-card hover:brightness-110 disabled:opacity-50"
      >
        {resuming ? 'Đang khởi động lại…' : 'Tiếp tục hành trình'}
      </button>

      <button
        onClick={() => alert('Tính năng tải PDF đang phát triển')}
        className="mt-4 text-body text-sol-ink-2 underline hover:text-sol-ink"
      >
        Tải hồ sơ PDF
      </button>
    </div>
  );
}
