// dashboard/src/components/views/phaseB/PhaseLiberation.tsx
// PHASE 3 — GIAI_PHONG (Day 29-58) — DASHBOARD desktop variant.
// Hero clock LỚN — đồng hồ tự do là điểm chính.

import { useEffect, useState } from 'react';
import { PhaseProps } from './types';
import {
  TodayCard, StoryCard, NextInsightCard, MoneySavedCard,
  CohortCard, BodyTimelineCard, CigaretteLogger, SlipModal,
  getSeenSlipIds, markSlipSeen,
} from './_shared';

const ACCENT = '#3A7CA5';

interface ClockState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function computeClock(qDayConfirmedAt: string): ClockState {
  const ms = Date.now() - new Date(qDayConfirmedAt).getTime();
  if (ms < 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return { days, hours, minutes, seconds };
}

export function PhaseLiberation({ data, onReload, onShowExit }: PhaseProps) {
  const [showLogger, setShowLogger] = useState(false);
  const [showSlip, setShowSlip] = useState(false);
  const [clock, setClock] = useState<ClockState>(() =>
    data.qDay.qDayConfirmedAt ? computeClock(data.qDay.qDayConfirmedAt) : { days: 0, hours: 0, minutes: 0, seconds: 0 },
  );

  useEffect(() => {
    if (!data.qDay.clockEnabled || !data.qDay.qDayConfirmedAt) return;
    const t = setInterval(() => {
      setClock(computeClock(data.qDay.qDayConfirmedAt!));
    }, 1000);
    return () => clearInterval(t);
  }, [data.qDay.clockEnabled, data.qDay.qDayConfirmedAt]);

  // Auto-detect slip server-side
  useEffect(() => {
    const slipId = data.qDay.lastSlipLogId;
    if (!data.qDay.recentSlip || !slipId) return;
    if (getSeenSlipIds().has(slipId)) return;
    setShowSlip(true);
  }, [data.qDay.recentSlip, data.qDay.lastSlipLogId]);

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
          <span className="text-3xl mr-2" aria-hidden="true">🚭</span>
          <span className="text-sol-ink font-semibold">Đang sống tự do</span>
        </div>
        <button onClick={onShowExit} className="text-body text-sol-ink-3 underline hover:text-sol-ink">
          Tạm dừng
        </button>
      </div>

      {/* FREEDOM CLOCK — full-width hero */}
      {data.qDay.clockEnabled ? (
        <div
          className="rounded-2xl p-10 shadow-card text-white text-center"
          style={{
            background: 'linear-gradient(135deg, #3A7CA5 0%, #225573 100%)',
          }}
        >
          <div className="text-body uppercase opacity-90 tracking-wide font-semibold mb-3">🕒 Đồng hồ tự do</div>
          <div className="font-bold tracking-tight mb-2">
            <span className="font-mono" style={{ fontSize: '88px', lineHeight: '1' }}>{clock.days}</span>
            <span className="text-h1 ml-3 opacity-90">ngày</span>
          </div>
          <div className="text-display font-mono opacity-95">
            {String(clock.hours).padStart(2, '0')}:
            {String(clock.minutes).padStart(2, '0')}:
            {String(clock.seconds).padStart(2, '0')}
          </div>
          <p className="text-body opacity-80 mt-4 italic">không hút thuốc</p>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-sol-wine to-sol-wine-ink text-white rounded-2xl p-7 shadow-card text-center">
          <div className="text-h1 font-bold mb-2">⏸️ Đồng hồ chưa bật</div>
          <p className="text-body opacity-90 leading-relaxed">
            {data.user.pronouns} đã đến Phase Giải Phóng nhưng chưa cam kết Q-Day. Bấm cam kết để Sol bắt đầu đếm.
          </p>
        </div>
      )}

      {/* 2-col layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <BodyTimelineCard
            unlocked={data.milestones.unlocked}
            next={data.milestones.next}
            qDayConfirmed={!!data.user.qDayConfirmedAt}
          />
          <TodayCard
            cigsCount={data.today.cigsCount}
            cigsSkipped={data.today.cigsSkipped}
            peakHour={data.today.peakHour}
            topTrigger={data.today.topTrigger}
            accent={ACCENT}
            showLogger={true}
            onOpenLogger={() => setShowLogger(true)}
            title="Hôm nay"
          />
          <StoryCard story={data.story} accent={ACCENT} />
        </div>

        <div className="space-y-6">
          <MoneySavedCard
            moneySaved={data.stats.moneySaved}
            cigsSkipped={data.stats.cigsSkipped}
            streak={data.stats.streak}
          />
          <NextInsightCard insight={data.nextInsight} />
          <CohortCard cohort={data.cohort} />
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
