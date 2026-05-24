// dashboard/src/components/views/phaseB/PhaseObserver.tsx
// PHASE 1 — NHAN_THUC (Day 1-7) — DASHBOARD desktop variant.
// 2-col layout: left main (Today + Story + Pattern), right side (Money + Cohort + Insight).

import { useState } from 'react';
import { PhaseProps } from './types';
import {
  TodayCard, StoryCard, NextInsightCard, PatternHeatmapCard,
  CohortCard, CigaretteLogger, MoneySavedCard,
} from './_shared';

const ACCENT = '#B25C2C';

export function PhaseObserver({ data, onReload, onShowExit }: PhaseProps) {
  const [showLogger, setShowLogger] = useState(false);

  return (
    <div className="space-y-6">
      {/* Mode banner row */}
      <div className="flex items-center justify-between">
        <div className="text-body">
          <span className="text-3xl mr-2" aria-hidden="true">🌱</span>
          <span className="text-sol-ink font-semibold">Đang quan sát chính mình</span>
        </div>
        <button onClick={onShowExit} className="text-body text-sol-ink-3 underline hover:text-sol-ink">
          Tạm dừng
        </button>
      </div>

      {/* Hero — KHÔNG đồng hồ, KHÔNG số ngày */}
      <div className="bg-sol-paper border border-sol-line rounded-2xl p-8 text-center shadow-card">
        <div className="text-6xl mb-3" aria-hidden="true">🌱</div>
        <h2 className="text-display text-sol-ink font-bold">Tuần Nhận Thức</h2>
        <p className="text-body-lg text-sol-ink-2 mt-3 leading-relaxed max-w-xl mx-auto">
          Sol chưa yêu cầu {data.user.pronouns} bỏ.
          <br />
          Chỉ cần ghi nhận từng điếu — Sol đang học quy luật của {data.user.pronouns}.
        </p>
      </div>

      {/* 2-col: main + side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
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
          <StoryCard story={data.story} accent={ACCENT} />
          <PatternHeatmapCard
            hourly={data.pattern.hourly}
            cigsAvg7d={data.pattern.cigsAvg7d}
            accent={ACCENT}
          />
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
        <CigaretteLogger
          onClose={() => setShowLogger(false)}
          onLogged={() => { onReload(); setShowLogger(false); }}
        />
      )}
    </div>
  );
}
