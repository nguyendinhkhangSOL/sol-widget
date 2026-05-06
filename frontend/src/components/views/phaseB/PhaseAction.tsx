// frontend/src/components/views/phaseB/PhaseAction.tsx
// PHASE 2 — HANH_DONG (Day 8-28) — Control mode.
// Mục tiêu: Bẻ vòng lặp hút thuốc tự động.
//
// UI:
//  - ReductionTracker: hôm nay X điếu / mục tiêu mềm Y, tuần này avg vs Phase 1 baseline
//  - Plan B card: gợi ý dựa trên top trigger (hardcoded mapping)
//  - Q-Day countdown từ Day 26: "Còn 2 ngày là Q-Day"
//  - Story + NextInsight + Pattern + Money + Cohort

import { useState } from 'react';
import { PhaseProps } from './types';
import {
  TodayCard, StoryCard, NextInsightCard, PatternHeatmapCard,
  MoneySavedCard, CohortCard, CigaretteLogger, fmt,
} from './_shared';

const ACCENT = '#B8860B'; // sol-gold (HANH_DONG)

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

  // Mục tiêu mềm: giảm 1 điếu mỗi 3 ngày từ baseline.
  // Day 8: baseline. Day 11: baseline-1. Day 28: baseline-7 (cứng nhưng mềm — chỉ là gợi ý).
  const dayInPhase = Math.max(1, dayInJourney - 7);
  const softTarget = Math.max(0, baseline - Math.floor(dayInPhase / 3));

  const triggerKey = data.today.topTrigger || 'OTHER';
  const planB = PLAN_B[triggerKey] || PLAN_B.OTHER;

  const reduction = cigsAvg7d > 0 ? ((baseline - cigsAvg7d) / baseline) * 100 : 0;
  const isReducing = reduction > 5;
  const isStable = Math.abs(reduction) <= 5;
  const isIncreasing = reduction < -5;

  return (
    <div className="bg-sol-bg pb-20">
      {/* ─── Mode banner ───────────────────────────────────────────────── */}
      <div className="px-4 pt-3 flex items-center justify-between">
        <div className="text-meta">
          <span className="text-2xl mr-2" aria-hidden="true">🔥</span>
          <span className="text-sol-ink font-semibold">Đang phá vòng lặp</span>
        </div>
        <button onClick={onShowExit} className="text-meta text-sol-ink-3 underline hover:text-sol-ink">
          Tạm dừng
        </button>
      </div>

      {/* ─── Q-DAY COUNTDOWN (Day 26-27) ────────────────────────────────── */}
      {data.qDay.isPreQDay && daysUntilQDay > 0 && (
        <div className="mx-4 mt-3 bg-sol-wine text-white rounded-2xl p-4 shadow-card">
          <div className="text-h2 font-bold mb-1">🎯 Còn {daysUntilQDay} ngày là Q-Day</div>
          <p className="text-meta opacity-90 leading-relaxed">
            Q-Day = ngày {data.user.pronouns} cam kết bỏ hẳn. Tối nay viết 3 lý do {data.user.pronouns} muốn bỏ — để mai đọc lại.
          </p>
        </div>
      )}

      {/* ─── REDUCTION TRACKER ──────────────────────────────────────────── */}
      <div className="mx-4 mt-3 bg-sol-paper border border-sol-line rounded-2xl p-5 shadow-card">
        <h2 className="text-h2 text-sol-ink mb-3">📉 Đường đi giảm dần</h2>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-sol-bg rounded-xl p-3">
            <div className="text-[10px] text-sol-ink-3 uppercase">Hôm nay</div>
            <div className="text-h1 font-bold mt-0.5" style={{ color: ACCENT }}>
              {cigsToday}
            </div>
            <div className="text-[11px] text-sol-ink-3">điếu</div>
          </div>
          <div className="bg-sol-bg rounded-xl p-3">
            <div className="text-[10px] text-sol-ink-3 uppercase">Mục tiêu mềm</div>
            <div className="text-h1 font-bold mt-0.5 text-sol-blue-ink">
              ≤{softTarget}
            </div>
            <div className="text-[11px] text-sol-ink-3">điếu/ngày</div>
          </div>
        </div>

        <div className="text-meta border-t border-sol-line pt-3">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-sol-ink-2">Trung bình tuần</span>
            <strong className={
              isReducing ? 'text-sol-green-ink' :
              isIncreasing ? 'text-sol-red' : 'text-sol-ink'
            }>
              {cigsAvg7d.toFixed(1)} điếu/ngày
            </strong>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-sol-ink-3">vs Baseline {baseline}</span>
            <span className={
              isReducing ? 'text-sol-green-ink font-semibold' :
              isIncreasing ? 'text-sol-red font-semibold' : 'text-sol-ink-3'
            }>
              {isReducing && `↓ ${Math.round(reduction)}% — Sol thấy giảm`}
              {isStable && '→ ổn định'}
              {isIncreasing && `↑ ${Math.round(-reduction)}% — bình thường, mai khác`}
            </span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-sol-line text-meta text-sol-ink-3 italic">
          Sol đã thấy {data.today.cigsSkipped} lần {data.user.pronouns} bỏ qua thành công hôm nay.
        </div>

        <button
          onClick={() => setShowLogger(true)}
          className="w-full min-h-tap mt-4 py-2.5 rounded-lg bg-sol-orange text-white font-semibold hover:brightness-110"
        >
          + Ghi điếu / Bỏ qua
        </button>
      </div>

      {/* ─── PLAN B CARD ─────────────────────────────────────────────────── */}
      {data.today.topTrigger && (
        <div className="mx-4 mt-3 bg-sol-orange-soft/40 border border-sol-orange/30 rounded-2xl p-4">
          <div className="text-meta font-semibold text-sol-orange-ink mb-2">
            🎯 Plan B cho trigger {data.today.topTrigger}
          </div>
          <div className="flex items-start gap-3 text-body">
            <span className="text-2xl shrink-0" aria-hidden="true">{planB.emoji}</span>
            <p className="text-sol-ink leading-relaxed">{planB.suggestion}</p>
          </div>
        </div>
      )}

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
          onLogged={() => { onReload(); setShowLogger(false); }}
        />
      )}
    </div>
  );
}
