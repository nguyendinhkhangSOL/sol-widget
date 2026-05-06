// frontend/src/components/views/phaseB/PhaseRebuild.tsx
// PHASE 4 — TAI_THIET (Day 59-88) — Maintenance, anti-relapse, identity rebuild.
// Sol giảm tần suất nhắc — autonomy mode.
//
// UI:
//  - MaintenanceClock: "🛡️ Giữ vững X ngày" (lớn nhưng less prominent)
//  - StreakChart 30 ngày (đơn giản: bars heatmap streak)
//  - Cohort card: mentor mode (gợi chia sẻ với newbie)
//  - "Đại Sứ Sol — chỉ còn Y ngày nữa"
//  - Body recovery rings full filled
//  - Story (ít hơn — 1 message / 3 ngày)

import { useEffect, useState } from 'react';
import { PhaseProps } from './types';
import {
  StoryCard, NextInsightCard, MoneySavedCard, CohortCard,
  BodyTimelineCard, CigaretteLogger, SlipModal,
  getSeenSlipIds, markSlipSeen,
} from './_shared';

const ACCENT = '#5C3A1E'; // sol-earth (TAI_THIET)
const TOTAL_DAYS = 88;

interface ClockState {
  days: number;
  hours: number;
  minutes: number;
}

function computeClock(qDayConfirmedAt: string): ClockState {
  const ms = Date.now() - new Date(qDayConfirmedAt).getTime();
  if (ms < 0) return { days: 0, hours: 0, minutes: 0 };
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return { days, hours, minutes };
}

export function PhaseRebuild({ data, onReload, onShowExit }: PhaseProps) {
  const [showLogger, setShowLogger] = useState(false);
  const [showSlip, setShowSlip] = useState(false);
  const [clock, setClock] = useState<ClockState>(() =>
    data.qDay.qDayConfirmedAt ? computeClock(data.qDay.qDayConfirmedAt) : { days: 0, hours: 0, minutes: 0 },
  );

  useEffect(() => {
    if (!data.qDay.clockEnabled || !data.qDay.qDayConfirmedAt) return;
    const t = setInterval(() => {
      setClock(computeClock(data.qDay.qDayConfirmedAt!));
    }, 60000); // tick mỗi phút (autonomy mode — không cần realtime giây)
    return () => clearInterval(t);
  }, [data.qDay.clockEnabled, data.qDay.qDayConfirmedAt]);

  // Auto-detect slip server-side (giống PhaseLiberation)
  useEffect(() => {
    const slipId = data.qDay.lastSlipLogId;
    if (!data.qDay.recentSlip || !slipId) return;
    if (getSeenSlipIds().has(slipId)) return;
    setShowSlip(true);
  }, [data.qDay.recentSlip, data.qDay.lastSlipLogId]);

  const dayInJourney = data.journey.dayInJourney;
  const daysToAmbassador = Math.max(0, TOTAL_DAYS + 1 - dayInJourney);

  function handleLogged() {
    onReload();
    setShowLogger(false);
    // Sau reload, useEffect sẽ detect recentSlip mới và auto-show SlipModal.
  }

  function handleSlipClose() {
    if (data.qDay.lastSlipLogId) markSlipSeen(data.qDay.lastSlipLogId);
    setShowSlip(false);
  }

  return (
    <div className="bg-sol-bg pb-20">
      {/* ─── Mode banner ────────────────────────────────────────────────── */}
      <div className="px-4 pt-3 flex items-center justify-between">
        <div className="text-meta">
          <span className="text-2xl mr-2" aria-hidden="true">🌟</span>
          <span className="text-sol-ink font-semibold">Đang giữ vững</span>
        </div>
        <button onClick={onShowExit} className="text-meta text-sol-ink-3 underline hover:text-sol-ink">
          Tạm dừng
        </button>
      </div>

      {/* ─── Identity hero ──────────────────────────────────────────────── */}
      <div className="mx-4 mt-3 bg-sol-paper border border-sol-line rounded-2xl p-5 text-center shadow-card">
        <div className="text-4xl mb-2" aria-hidden="true">🛡️</div>
        <h2 className="text-h1 text-sol-ink">
          Giữ vững <span style={{ color: ACCENT }}>{clock.days}</span> ngày
        </h2>
        <p className="text-meta text-sol-ink-2 mt-2 italic">
          {data.user.pronouns === 'bạn' ? 'Bạn' : data.user.pronouns.charAt(0).toUpperCase() + data.user.pronouns.slice(1)} là người không hút.
        </p>

        {/* Đại Sứ countdown */}
        {daysToAmbassador > 0 && daysToAmbassador <= 30 && (
          <div className="mt-4 pt-4 border-t border-sol-line">
            <div className="text-meta text-sol-ink-3">
              🦁 Đại Sứ Sol — còn <strong className="text-sol-ink">{daysToAmbassador} ngày</strong>
            </div>
            <div className="h-2 mt-2 bg-sol-line rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, ((30 - daysToAmbassador) / 30) * 100)}%`,
                  backgroundColor: ACCENT,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ─── Body timeline (full unlocked) ──────────────────────────────── */}
      <BodyTimelineCard
        unlocked={data.milestones.unlocked}
        next={data.milestones.next}
        qDayConfirmed={!!data.user.qDayConfirmedAt}
      />

      {/* ─── Story narrative (less frequent) ────────────────────────────── */}
      <StoryCard story={data.story} accent={ACCENT} />

      {/* ─── Money saved ────────────────────────────────────────────────── */}
      <MoneySavedCard
        moneySaved={data.stats.moneySaved}
        cigsSkipped={data.stats.cigsSkipped}
        streak={data.stats.streak}
      />

      {/* ─── Cohort — MENTOR MODE ───────────────────────────────────────── */}
      <CohortCard cohort={data.cohort} mentorMode={true} />

      {/* ─── Mentor CTA ─────────────────────────────────────────────────── */}
      <div className="mx-4 mt-3 bg-sol-orange-soft/40 border border-sol-orange/30 rounded-2xl p-4">
        <div className="text-meta font-semibold text-sol-orange-ink mb-1">🦁 Đại Sứ Mode</div>
        <p className="text-body text-sol-ink leading-relaxed mb-3">
          {data.user.pronouns === 'bạn' ? 'Bạn' : data.user.pronouns.charAt(0).toUpperCase() + data.user.pronouns.slice(1)} đã giữ vững. Hôm nay thử chia sẻ 1 câu với 1 đồng đội mới đang muốn cai?
        </p>
        <button
          onClick={() => alert('Tính năng chia sẻ với đồng đội sắp ra mắt — Sol đang xây.')}
          className="w-full min-h-tap py-2.5 rounded-lg bg-sol-orange text-white font-semibold"
        >
          🤝 Tìm đồng đội mới
        </button>
      </div>

      {/* ─── Next insight ───────────────────────────────────────────────── */}
      <NextInsightCard insight={data.nextInsight} />

      {/* ─── Subtle logger (slip protection) ────────────────────────────── */}
      <div className="mx-4 mt-3 text-center">
        <button
          onClick={() => setShowLogger(true)}
          className="text-meta text-sol-ink-3 underline hover:text-sol-ink"
        >
          Lỡ trượt? Sol vẫn ở đây — ghi nhận
        </button>
      </div>

      {showLogger && (
        <CigaretteLogger
          onClose={() => setShowLogger(false)}
          onLogged={handleLogged}
        />
      )}

      {showSlip && (
        <SlipModal
          pronouns={data.user.pronouns}
          onClose={handleSlipClose}
        />
      )}
    </div>
  );
}
