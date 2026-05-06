// dashboard/src/components/views/phaseB/PhaseRebuild.tsx
// PHASE 4 — TAI_THIET (Day 59-88) — DASHBOARD desktop variant.

import { useEffect, useState } from 'react';
import { PhaseProps } from './types';
import {
  StoryCard, NextInsightCard, MoneySavedCard, CohortCard,
  BodyTimelineCard, CigaretteLogger, SlipModal,
  getSeenSlipIds, markSlipSeen,
} from './_shared';

const ACCENT = '#5C3A1E';
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
    }, 60000);
    return () => clearInterval(t);
  }, [data.qDay.clockEnabled, data.qDay.qDayConfirmedAt]);

  // Auto-detect slip server-side
  useEffect(() => {
    const slipId = data.qDay.lastSlipLogId;
    if (!data.qDay.recentSlip || !slipId) return;
    if (getSeenSlipIds().has(slipId)) return;
    setShowSlip(true);
  }, [data.qDay.recentSlip, data.qDay.lastSlipLogId]);

  const dayInJourney = data.journey.dayInJourney;
  const daysToAmbassador = Math.max(0, TOTAL_DAYS + 1 - dayInJourney);
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  function handleLogged() {
    onReload();
    setShowLogger(false);
  }

  function handleSlipClose() {
    if (data.qDay.lastSlipLogId) markSlipSeen(data.qDay.lastSlipLogId);
    setShowSlip(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-body">
          <span className="text-3xl mr-2" aria-hidden="true">🌟</span>
          <span className="text-sol-ink font-semibold">Đang giữ vững</span>
        </div>
        <button onClick={onShowExit} className="text-body text-sol-ink-3 underline hover:text-sol-ink">
          Tạm dừng
        </button>
      </div>

      {/* Identity hero */}
      <div className="bg-sol-paper border border-sol-line rounded-2xl p-8 text-center shadow-card">
        <div className="text-6xl mb-3" aria-hidden="true">🛡️</div>
        <h2 className="text-display text-sol-ink font-bold">
          Giữ vững <span style={{ color: ACCENT }}>{clock.days}</span> ngày
        </h2>
        <p className="text-body-lg text-sol-ink-2 mt-3 italic">
          {cap(data.user.pronouns)} là người không hút.
        </p>

        {daysToAmbassador > 0 && daysToAmbassador <= 30 && (
          <div className="mt-6 pt-6 border-t border-sol-line max-w-md mx-auto">
            <div className="text-body text-sol-ink-3">
              🦁 Đại Sứ Sol — còn <strong className="text-sol-ink text-h3">{daysToAmbassador} ngày</strong>
            </div>
            <div className="h-2 mt-3 bg-sol-line rounded-full overflow-hidden">
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

      {/* 2-col layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <BodyTimelineCard
            unlocked={data.milestones.unlocked}
            next={data.milestones.next}
            qDayConfirmed={!!data.user.qDayConfirmedAt}
          />
          <StoryCard story={data.story} accent={ACCENT} />

          {/* Mentor CTA */}
          <div className="bg-sol-orange-soft/40 border border-sol-orange/30 rounded-2xl p-6">
            <div className="text-h3 font-semibold text-sol-orange-ink mb-2">🦁 Đại Sứ Mode</div>
            <p className="text-body-lg text-sol-ink leading-relaxed mb-4">
              {cap(data.user.pronouns)} đã giữ vững. Hôm nay thử chia sẻ 1 câu với 1 đồng đội mới đang muốn cai?
            </p>
            <button
              onClick={() => alert('Tính năng chia sẻ với đồng đội sắp ra mắt — Sol đang xây.')}
              className="min-h-tap px-6 py-3 rounded-xl bg-sol-orange text-white font-semibold"
            >
              🤝 Tìm đồng đội mới
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <MoneySavedCard
            moneySaved={data.stats.moneySaved}
            cigsSkipped={data.stats.cigsSkipped}
            streak={data.stats.streak}
          />
          <NextInsightCard insight={data.nextInsight} />
          <CohortCard cohort={data.cohort} mentorMode={true} />

          {/* Subtle slip protection */}
          <div className="text-center pt-2">
            <button
              onClick={() => setShowLogger(true)}
              className="text-body text-sol-ink-3 underline hover:text-sol-ink"
            >
              Lỡ trượt? Sol vẫn ở đây — ghi nhận
            </button>
          </div>
        </div>
      </div>

      {showLogger && (
        <CigaretteLogger onClose={() => setShowLogger(false)} onLogged={handleLogged} />
      )}
      {showSlip && (
        <SlipModal pronouns={data.user.pronouns} onClose={handleSlipClose} />
      )}
    </div>
  );
}
