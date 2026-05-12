// dashboard/src/components/views/phaseB/PhaseAction.tsx
// PHASE 2 — HANH_DONG (Day 8-28) — DASHBOARD desktop variant.

import { useState } from 'react';
import { PhaseProps } from './types';
import {
  TodayCard, StoryCard, NextInsightCard, PatternHeatmapCard,
  MoneySavedCard, CohortCard, CigaretteLogger,
} from './_shared';

const ACCENT = '#B8860B';

const PLAN_B: Record<string, { emoji: string; suggestion: string }> = {
  STRESS:  { emoji: '💧', suggestion: 'Cốc nước lạnh + 5 phút đi bộ — não cần 90 giây để chuyển trạng thái.' },
  EATING:  { emoji: '🪥', suggestion: 'Đánh răng ngay sau cơm — vị giác mới làm cơn thèm giảm 70%.' },
  IDLE:    { emoji: '📱', suggestion: 'Mở Sol chat hỏi 1 câu — não cần input mới thay nicotin.' },
  SOCIAL:  { emoji: '🥤', suggestion: 'Gọi 1 chai nước trước khi nhậu. Plan B sẵn — không cần "cắt máu".' },
  OTHER:   { emoji: '⏱️', suggestion: 'Trì hoãn 10 phút — phần lớn cơn thèm tự tắt sau 8 phút.' },
};

export function PhaseAction({ data, onReload, onShowExit }: PhaseProps) {
  const [showLogger, setShowLogger] = useState(false);
  const baseline = data.stats.baseline;
  const cigsToday = data.today.cigsCount;
  const cigsAvg7d = data.pattern.cigsAvg7d;
  const dayInJourney = data.journey.dayInJourney;
  const daysUntilQDay = data.qDay.daysUntilQDay;

  const dayInPhase = Math.max(1, dayInJourney - 7);
  const softTarget = Math.max(0, baseline - Math.floor(dayInPhase / 3));

  const triggerKey = data.today.topTrigger || 'OTHER';
  const planB = PLAN_B[triggerKey] || PLAN_B.OTHER;

  const reduction = cigsAvg7d > 0 ? ((baseline - cigsAvg7d) / baseline) * 100 : 0;
  const isReducing = reduction > 5;
  const isStable = Math.abs(reduction) <= 5;
  const isIncreasing = reduction < -5;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-body">
          <span className="text-3xl mr-2" aria-hidden="true">🔥</span>
          <span className="text-sol-ink font-semibold">Đang phá vòng lặp</span>
        </div>
        <button onClick={onShowExit} className="text-body text-sol-ink-3 underline hover:text-sol-ink">
          Tạm dừng
        </button>
      </div>

      {/* Q-DAY COUNTDOWN (Day 26-27) — full width banner */}
      {data.qDay.isPreQDay && daysUntilQDay > 0 && (
        <div className="bg-gradient-to-r from-sol-wine to-sol-wine-ink text-white rounded-2xl p-6 shadow-card">
          <div className="flex items-baseline justify-between flex-wrap gap-3">
            <div>
              <div className="text-h1 font-bold">🎯 Còn {daysUntilQDay} ngày là Ngày bỏ</div>
              <p className="text-body opacity-90 mt-1 leading-relaxed">
                Ngày bỏ = ngày {data.user.pronouns} cam kết bỏ hẳn. Tối nay viết 3 lý do {data.user.pronouns} muốn bỏ — để mai đọc lại.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Reduction Tracker — full width hero */}
      <div className="bg-sol-paper border border-sol-line rounded-2xl p-7 shadow-card">
        <h2 className="text-h1 text-sol-ink mb-5">📉 Đường đi giảm dần</h2>

        <div className="grid grid-cols-2 gap-5 mb-5">
          <div className="bg-sol-bg rounded-xl p-5">
            <div className="text-meta text-sol-ink-3 uppercase font-semibold">Hôm nay</div>
            <div className="text-display font-bold mt-2" style={{ color: ACCENT }}>
              {cigsToday}
            </div>
            <div className="text-body text-sol-ink-3">điếu</div>
          </div>
          <div className="bg-sol-bg rounded-xl p-5">
            <div className="text-meta text-sol-ink-3 uppercase font-semibold">Mục tiêu mềm</div>
            <div className="text-display font-bold mt-2 text-sol-blue-ink">
              ≤{softTarget}
            </div>
            <div className="text-body text-sol-ink-3">điếu/ngày</div>
          </div>
        </div>

        <div className="border-t border-sol-line pt-4 space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-body text-sol-ink-2">Trung bình tuần</span>
            <strong className={
              `text-h3 ${isReducing ? 'text-sol-green-ink' : isIncreasing ? 'text-sol-red' : 'text-sol-ink'}`
            }>
              {cigsAvg7d.toFixed(1)} điếu/ngày
            </strong>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-body text-sol-ink-3">vs Baseline {baseline}</span>
            <span className={
              `text-body font-semibold ${
                isReducing ? 'text-sol-green-ink' : isIncreasing ? 'text-sol-red' : 'text-sol-ink-3'
              }`
            }>
              {isReducing && `↓ ${Math.round(reduction)}% — Sol thấy giảm`}
              {isStable && '→ ổn định'}
              {isIncreasing && `↑ ${Math.round(-reduction)}% — bình thường, mai khác`}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-sol-line text-body text-sol-ink-3 italic">
          Sol đã thấy {data.today.cigsSkipped} lần {data.user.pronouns} bỏ qua thành công hôm nay.
        </div>

        <button
          onClick={() => setShowLogger(true)}
          className="w-full min-h-tap mt-5 py-3 rounded-xl bg-sol-orange text-white font-semibold text-body hover:brightness-110"
        >
          + Ghi điếu / Bỏ qua
        </button>
      </div>

      {/* 2-col main + side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {data.today.topTrigger && (
            <div className="bg-sol-orange-soft/40 border border-sol-orange/30 rounded-2xl p-6">
              <div className="text-h3 font-semibold text-sol-orange-ink mb-3">
                🎯 Plan B cho trigger {data.today.topTrigger}
              </div>
              <div className="flex items-start gap-4 text-body-lg">
                <span className="text-4xl shrink-0" aria-hidden="true">{planB.emoji}</span>
                <p className="text-sol-ink leading-relaxed">{planB.suggestion}</p>
              </div>
            </div>
          )}

          <TodayCard
            cigsCount={data.today.cigsCount}
            cigsSkipped={data.today.cigsSkipped}
            peakHour={data.today.peakHour}
            topTrigger={data.today.topTrigger}
            accent={ACCENT}
            showLogger={false}
            title="Chi tiết hôm nay"
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
