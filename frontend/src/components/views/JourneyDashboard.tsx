// frontend/src/components/views/JourneyDashboard.tsx
// PHASE B ROUTER — phase-based dashboard. 1 file mount, sub-component theo stage.
//
// Flow:
//   1. Load /journey/dashboard
//   2. Nếu !user.onboardingCompletedAt → render OnboardingWizard (overlay)
//   3. Nếu qDay.needsConfirmation (Day 28+ chưa confirm) → render QDayCeremony (overlay)
//   4. Else: render PhaseX theo journey.stage
//
// Error handling: nếu API fail → hiển thị error message rõ thay vì stuck "đang tải".
// Hữu ích cho debug Phase B (migration chưa apply / backend chưa rebuild).

import { useEffect, useState } from 'react';
import { api, ApiError } from '../../services/api';
import { OnboardingWizard } from './phaseB/OnboardingWizard';
import { QDayCeremony } from './phaseB/QDayCeremony';
import { PhaseBar } from './phaseB/PhaseBar';
import { PhaseObserver } from './phaseB/PhaseObserver';
import { PhaseAction } from './phaseB/PhaseAction';
import { PhaseLiberation } from './phaseB/PhaseLiberation';
import { PhaseRebuild } from './phaseB/PhaseRebuild';
import { PhaseAmbassador } from './phaseB/PhaseAmbassador';
import { ExitModal } from './phaseB/_shared';
import { DashboardData } from './phaseB/types';

export function JourneyDashboard() {
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
      // ⚠️ Hiển thị error rõ — đặc biệt cho debug Phase B
      // (migration chưa apply / Prisma client chưa regen / backend chưa rebuild)
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

  // ─── Loading state — chỉ hiển thị lần đầu, không block sau khi đã có data ─
  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-full p-6 bg-sol-bg">
        <div className="text-center">
          <div className="text-2xl mb-2 animate-pulse">🌅</div>
          <div className="text-meta text-sol-ink-3">Sol đang khởi động hành trình…</div>
        </div>
      </div>
    );
  }

  // ─── Error state — hiển thị rõ thay vì stuck ─────────────────────────────
  if (error && !data) {
    return (
      <div className="flex items-center justify-center h-full p-6 bg-sol-bg">
        <div className="max-w-md text-center">
          <div className="text-3xl mb-3">⚠️</div>
          <h2 className="text-h2 text-sol-ink mb-2">Sol chưa kết nối được</h2>
          <p className="text-body text-sol-ink-2 mb-3 leading-relaxed">{error}</p>
          <p className="text-meta text-sol-ink-3 mb-4 italic">
            Có thể backend chưa apply migration Phase B hoặc chưa rebuild image. Kiểm tra terminal nơi chạy backend.
          </p>
          <button
            onClick={reload}
            className="min-h-tap px-5 py-2.5 rounded-lg bg-sol-green text-white font-semibold"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null; // never reached, satisfy TS

  // ─── Exited state ────────────────────────────────────────────────────────
  if (data.user.exitedAt) {
    return <ExitedState pronouns={data.user.pronouns} onResume={reload} />;
  }

  // ─── ONBOARDING OVERLAY — Day 1 chưa khai baseline ───────────────────────
  if (!data.user.onboardingCompletedAt) {
    return (
      <OnboardingWizard
        pronouns={data.user.pronouns}
        onCompleted={() => reload()}
      />
    );
  }

  // ─── Q-DAY CEREMONY OVERLAY — Day 28+ chưa confirm ───────────────────────
  if (data.qDay.needsConfirmation) {
    return (
      <QDayCeremony
        pronouns={data.user.pronouns}
        isPastQDay={data.qDay.isPostQDay}
        onConfirmed={() => reload()}
        onPostpone={data.qDay.isPostQDay ? () => {
          // Day 29+: cho skip, hiện banner persistent ở phase 3
          // Tạm để alert; sẽ thay bằng dismissed flag localStorage sau
          alert('Sol đợi ' + (data.user.pronouns ?? 'bạn') + '. Bấm "Tôi cam kết" khi sẵn sàng — đồng hồ chỉ chạy sau cam kết.');
          // Nhưng ở đây không có dismiss state → vẫn show ceremony.
          // Workaround: render PhaseLiberation luôn (clockEnabled=false)
          // Điều này hợp lý vì backend qDay.needsConfirmation = true vẫn cho phép
          // user navigate thấy phase 3 state với clock off.
        } : undefined}
      />
    );
  }

  // ─── PHASE ROUTER ────────────────────────────────────────────────────────
  const sharedProps = {
    data,
    onReload: reload,
    onShowExit: () => setShowExit(true),
  };

  let phaseView;
  switch (data.journey.stage) {
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

  return (
    <div className="h-full overflow-y-auto bg-sol-bg">
      {/* PhaseBar header — luôn hiện trừ DAI_SU (đã có hero riêng) */}
      <PhaseBar
        stage={data.journey.stage}
        progressInStage={data.journey.progressInStage}
        dayInStage={data.journey.dayInStage}
        totalInStage={data.journey.totalInStage}
      />

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

/* ─── EXITED STATE — sau khi user exit ─────────────────────────────────── */
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
    <div className="h-full flex flex-col items-center justify-center bg-sol-bg p-6 text-center">
      <div className="text-5xl mb-4">📔</div>
      <h2 className="text-h1 text-sol-ink mb-2">Hồ sơ của {pronouns} đã lưu</h2>
      <p className="text-body text-sol-ink-2 mb-6 max-w-sm">
        Cảm ơn {pronouns} đã đi cùng Sol. Bản nhật ký tiến bộ đã được tạo.
        Khi nào sẵn sàng quay lại, Sol vẫn nhớ tất cả.
      </p>

      {error && <div className="text-meta text-sol-red mb-3">{error}</div>}

      <button
        onClick={resume}
        disabled={resuming}
        className="min-h-tap px-6 py-3 rounded-xl bg-sol-green text-white font-semibold text-body shadow-card hover:brightness-110 disabled:opacity-50"
      >
        {resuming ? 'Đang khởi động lại…' : 'Tiếp tục hành trình'}
      </button>

      <button
        onClick={() => alert('Tính năng tải PDF đang phát triển')}
        className="mt-3 text-meta text-sol-ink-2 underline hover:text-sol-ink"
      >
        Tải hồ sơ PDF
      </button>
    </div>
  );
}
