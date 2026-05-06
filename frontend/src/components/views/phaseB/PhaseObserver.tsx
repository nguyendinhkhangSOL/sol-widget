// frontend/src/components/views/phaseB/PhaseObserver.tsx
// PHASE 1 — NHAN_THUC (Day 1-7) — Awareness mode.
// Mục tiêu: User thấy rõ chính mình đang hút thế nào — KHÔNG ĐỒNG HỒ, KHÔNG MỤC TIÊU, KHÔNG JUDGE.
//
// UI:
//  - Header phase đã ở PhaseBar (cha render)
//  - PatternObserver: heatmap 24h × 7 ngày (trống ban đầu, fill dần)
//  - TodayCard: số điếu, peak, trigger
//  - StoryCard: AI narrative phản chiếu
//  - NextInsight: gợi ý nhẹ "ngày mai quan sát kỹ hơn"
//  - + Ghi điếu CTA luôn nổi bật
//  - KHÔNG money saved (chưa quit)
//  - KHÔNG body milestones (chưa Q-Day)

import { useState } from 'react';
import { PhaseProps } from './types';
import {
  TodayCard, StoryCard, NextInsightCard, PatternHeatmapCard,
  CohortCard, CigaretteLogger, MoneySavedCard,
} from './_shared';

const ACCENT = '#B25C2C'; // sol-clay (NHAN_THUC)

export function PhaseObserver({ data, onReload, onShowExit }: PhaseProps) {
  const [showLogger, setShowLogger] = useState(false);

  return (
    <div className="bg-sol-bg pb-20">
      {/* ─── Mode banner (subtle) ───────────────────────────────────────── */}
      <div className="px-4 pt-3 flex items-center justify-between">
        <div className="text-meta">
          <span className="text-2xl mr-2" aria-hidden="true">🌱</span>
          <span className="text-sol-ink font-semibold">Đang quan sát chính mình</span>
        </div>
        <button onClick={onShowExit} className="text-meta text-sol-ink-3 underline hover:text-sol-ink">
          Tạm dừng
        </button>
      </div>

      {/* ─── Hero — không đồng hồ, không số ngày ───────────────────────── */}
      <div className="mx-4 mt-3 bg-sol-paper border border-sol-line rounded-2xl p-5 text-center">
        <div className="text-4xl mb-2" aria-hidden="true">🌱</div>
        <h2 className="text-h1 text-sol-ink">Tuần Nhận Thức</h2>
        <p className="text-meta text-sol-ink-2 mt-2 leading-relaxed">
          Sol chưa yêu cầu {data.user.pronouns} bỏ.
          <br />
          Chỉ cần ghi nhận từng điếu — Sol đang học pattern của {data.user.pronouns}.
        </p>
      </div>

      {/* ─── Today card ─────────────────────────────────────────────────── */}
      <TodayCard
        cigsCount={data.today.cigsCount}
        cigsSkipped={data.today.cigsSkipped}
        peakHour={data.today.peakHour}
        topTrigger={data.today.topTrigger}
        accent={ACCENT}
        showLogger={true}
        onOpenLogger={() => setShowLogger(true)}
        title="Hôm nay quan sát"
      />

      {/* ─── Story narrative ────────────────────────────────────────────── */}
      <StoryCard story={data.story} accent={ACCENT} />

      {/* ─── Pattern map ────────────────────────────────────────────────── */}
      <PatternHeatmapCard
        hourly={data.pattern.hourly}
        cigsAvg7d={data.pattern.cigsAvg7d}
        accent={ACCENT}
      />

      {/* ─── Next insight ───────────────────────────────────────────────── */}
      <NextInsightCard insight={data.nextInsight} />

      {/* ─── Money saved (vẫn show nhưng compassionate) ─────────────────── */}
      <MoneySavedCard
        moneySaved={data.stats.moneySaved}
        cigsSkipped={data.stats.cigsSkipped}
        streak={data.stats.streak}
      />

      {/* ─── Cohort ────────────────────────────────────────────────────── */}
      <CohortCard cohort={data.cohort} />

      {/* ─── Logger modal ───────────────────────────────────────────────── */}
      {showLogger && (
        <CigaretteLogger
          onClose={() => setShowLogger(false)}
          onLogged={() => { onReload(); setShowLogger(false); }}
        />
      )}
    </div>
  );
}
