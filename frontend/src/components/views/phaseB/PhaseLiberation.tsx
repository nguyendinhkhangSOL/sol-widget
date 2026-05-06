// frontend/src/components/views/phaseB/PhaseLiberation.tsx
// PHASE 3 — GIAI_PHONG (Day 29-58) — bỏ hẳn, đồng hồ countdown UP bật.
// Đồng hồ tính từ qDayConfirmedAt (KHÔNG phải quitDate).
//
// UI:
//  - FreedomClock: "Đã X ngày Y giờ Z phút không hút" (tick mỗi giây, css transitions)
//  - BodyTimeline: milestones unlock (rồi ô tới còn N ngày)
//  - TodayCard: + Ghi điếu (nếu trượt → SlipModal compassion)
//  - Money + Story + Cohort
//  - Slip handling: nếu cigsToday > 0 → modal "không sao, reset nhẹ"

import { useEffect, useState } from 'react';
import { PhaseProps } from './types';
import {
  TodayCard, StoryCard, NextInsightCard, MoneySavedCard,
  CohortCard, BodyTimelineCard, CigaretteLogger, SlipModal,
  getSeenSlipIds, markSlipSeen,
} from './_shared';

const ACCENT = '#3A7CA5'; // sol-blue (GIAI_PHONG)

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

  // Tick clock mỗi giây (chỉ khi clockEnabled)
  useEffect(() => {
    if (!data.qDay.clockEnabled || !data.qDay.qDayConfirmedAt) return;
    const t = setInterval(() => {
      setClock(computeClock(data.qDay.qDayConfirmedAt!));
    }, 1000);
    return () => clearInterval(t);
  }, [data.qDay.clockEnabled, data.qDay.qDayConfirmedAt]);

  // Auto-detect slip server-side. Khi backend trả recentSlip=true + lastSlipLogId
  // mới (chưa seen trong localStorage) → trigger SlipModal. Robust hơn client-side
  // setShowSlip vì không miss khi user đóng tab giữa logger submit và reload.
  useEffect(() => {
    const slipId = data.qDay.lastSlipLogId;
    if (!data.qDay.recentSlip || !slipId) return;
    const seen = getSeenSlipIds();
    if (seen.has(slipId)) return;
    setShowSlip(true);
  }, [data.qDay.recentSlip, data.qDay.lastSlipLogId]);

  function handleLogged() {
    onReload();
    setShowLogger(false);
    // Sau reload, useEffect trên sẽ detect recentSlip + lastSlipLogId mới và
    // trigger SlipModal tự động.
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
          <span className="text-2xl mr-2" aria-hidden="true">🚭</span>
          <span className="text-sol-ink font-semibold">Đang sống tự do</span>
        </div>
        <button onClick={onShowExit} className="text-meta text-sol-ink-3 underline hover:text-sol-ink">
          Tạm dừng
        </button>
      </div>

      {/* ─── FREEDOM CLOCK — Hero ──────────────────────────────────────── */}
      {data.qDay.clockEnabled ? (
        <div className="mx-4 mt-3 bg-gradient-to-br from-sol-blue to-sol-blue-ink rounded-2xl p-6 shadow-card text-white text-center">
          <div className="text-meta opacity-90 mb-2">🕒 Đồng hồ tự do</div>
          <div className="font-bold tracking-tight mb-1">
            <span className="text-display">{clock.days}</span>
            <span className="text-h2 ml-2 opacity-90">ngày</span>
          </div>
          <div className="text-h3 font-mono opacity-90">
            {String(clock.hours).padStart(2, '0')}:
            {String(clock.minutes).padStart(2, '0')}:
            {String(clock.seconds).padStart(2, '0')}
          </div>
          <p className="text-meta opacity-80 mt-3 italic">không hút thuốc</p>
        </div>
      ) : (
        // Edge case: Phase 3 nhưng chưa Q-Day confirm — banner nhắc
        <div className="mx-4 mt-3 bg-sol-wine text-white rounded-2xl p-4 shadow-card text-center">
          <div className="text-h2 font-bold mb-1">⏸️ Đồng hồ chưa bật</div>
          <p className="text-meta opacity-90 leading-relaxed">
            {data.user.pronouns} đã đến Phase Giải Phóng nhưng chưa cam kết Q-Day. Bấm cam kết để Sol bắt đầu đếm.
          </p>
        </div>
      )}

      {/* ─── Body recovery timeline ─────────────────────────────────────── */}
      <BodyTimelineCard
        unlocked={data.milestones.unlocked}
        next={data.milestones.next}
        qDayConfirmed={!!data.user.qDayConfirmedAt}
      />

      {/* ─── Today card — vẫn show + Ghi điếu (slip handling) ────────── */}
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

      {/* ─── Story narrative ────────────────────────────────────────────── */}
      <StoryCard story={data.story} accent={ACCENT} />

      {/* ─── Next insight ───────────────────────────────────────────────── */}
      <NextInsightCard insight={data.nextInsight} />

      {/* ─── Money saved ────────────────────────────────────────────────── */}
      <MoneySavedCard
        moneySaved={data.stats.moneySaved}
        cigsSkipped={data.stats.cigsSkipped}
        streak={data.stats.streak}
      />

      {/* ─── Cohort ─────────────────────────────────────────────────────── */}
      <CohortCard cohort={data.cohort} />

      {/* ─── Logger modal ───────────────────────────────────────────────── */}
      {showLogger && (
        <CigaretteLogger
          onClose={() => setShowLogger(false)}
          onLogged={handleLogged}
        />
      )}

      {/* ─── Slip modal ─────────────────────────────────────────────────── */}
      {showSlip && (
        <SlipModal
          pronouns={data.user.pronouns}
          onClose={handleSlipClose}
        />
      )}
    </div>
  );
}
