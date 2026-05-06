// frontend/src/components/views/phaseB/PhaseAmbassador.tsx
// PHASE 5 — DAI_SU (Day 89+) — graduate, lifetime alumni mentor.
// Sol gần như không can thiệp. Hiển thị identity + asset + cohort mentor.
//
// UI:
//  - Hero: "🦁 Đại Sứ Sol — Đã giữ vững X ngày"
//  - Body recovery rings full unlocked
//  - Cohort: mentor mode emphasis
//  - Optional asset: archive, hồ sơ PDF tải về

import { useEffect, useState } from 'react';
import { PhaseProps } from './types';
import {
  StoryCard, MoneySavedCard, CohortCard,
  BodyTimelineCard,
} from './_shared';

const ACCENT = '#2C1810'; // sol-deep (DAI_SU)

function computeDaysSince(qDayConfirmedAt: string): number {
  const ms = Date.now() - new Date(qDayConfirmedAt).getTime();
  return Math.max(0, Math.floor(ms / 86400000));
}

export function PhaseAmbassador({ data, onReload, onShowExit }: PhaseProps) {
  const [days, setDays] = useState<number>(() =>
    data.qDay.qDayConfirmedAt ? computeDaysSince(data.qDay.qDayConfirmedAt) : 0,
  );

  useEffect(() => {
    if (!data.qDay.qDayConfirmedAt) return;
    // Update mỗi giờ — đủ rồi vì user đã graduate
    const t = setInterval(() => {
      setDays(computeDaysSince(data.qDay.qDayConfirmedAt!));
    }, 3600000);
    return () => clearInterval(t);
  }, [data.qDay.qDayConfirmedAt]);

  return (
    <div className="bg-sol-bg pb-20">
      {/* ─── Mode banner ────────────────────────────────────────────────── */}
      <div className="px-4 pt-3 flex items-center justify-between">
        <div className="text-meta">
          <span className="text-2xl mr-2" aria-hidden="true">🦁</span>
          <span className="text-sol-ink font-semibold">Đại Sứ Sol</span>
        </div>
        <button onClick={onShowExit} className="text-meta text-sol-ink-3 underline hover:text-sol-ink">
          Tạm dừng
        </button>
      </div>

      {/* ─── Hero — Đại Sứ identity ─────────────────────────────────────── */}
      <div
        className="mx-4 mt-3 rounded-2xl p-6 text-white shadow-card text-center"
        style={{
          background: `linear-gradient(135deg, ${ACCENT} 0%, #5C3A1E 100%)`,
        }}
      >
        <div className="text-6xl mb-3" aria-hidden="true">🦁</div>
        <h2 className="text-h1 font-bold">Đại Sứ Sol</h2>
        <p className="text-body opacity-90 mt-2">
          {data.user.pronouns === 'bạn' ? 'Bạn' : data.user.pronouns.charAt(0).toUpperCase() + data.user.pronouns.slice(1)} đã đi qua 88 ngày.
        </p>
        <div className="mt-4 pt-4 border-t border-white/20">
          <div className="text-display font-bold">{days}</div>
          <div className="text-meta opacity-80 italic">ngày không hút</div>
        </div>
      </div>

      {/* ─── Body recovery — all unlocked ───────────────────────────────── */}
      <BodyTimelineCard
        unlocked={data.milestones.unlocked}
        next={null}
        qDayConfirmed={true}
      />

      {/* ─── Money saved ────────────────────────────────────────────────── */}
      <MoneySavedCard
        moneySaved={data.stats.moneySaved}
        cigsSkipped={data.stats.cigsSkipped}
        streak={data.stats.streak}
      />

      {/* ─── Story (graduation message) ─────────────────────────────────── */}
      <StoryCard story={data.story} accent={ACCENT} />

      {/* ─── Cohort mentor mode ─────────────────────────────────────────── */}
      <CohortCard cohort={data.cohort} mentorMode={true} />

      {/* ─── Mentor CTA primary ─────────────────────────────────────────── */}
      <div className="mx-4 mt-3 bg-sol-paper border-2 border-sol-earth rounded-2xl p-5 shadow-card">
        <div className="text-h3 font-semibold text-sol-ink mb-2">
          🤝 Sứ mệnh Đại Sứ
        </div>
        <p className="text-body text-sol-ink leading-relaxed mb-4">
          Sol mong {data.user.pronouns} chia sẻ với 1 người mới mỗi tuần. Cách giữ vững nhất — là giúp người khác bắt đầu.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => alert('Mời bạn — sắp ra mắt')}
            className="min-h-tap py-2.5 rounded-lg bg-sol-earth text-white font-semibold"
          >
            🎁 Mời bạn vào Sol
          </button>
          <button
            onClick={() => alert('Tải hồ sơ — sắp ra mắt')}
            className="min-h-tap py-2.5 rounded-lg bg-sol-paper border border-sol-line text-sol-ink"
          >
            📔 Tải hồ sơ PDF
          </button>
        </div>
      </div>

      <p className="text-[12px] text-sol-ink-3 text-center mt-4 mx-6 italic">
        Sol đã hoàn thành nhiệm vụ với {data.user.pronouns}. Từ đây, Sol chỉ là gương phản chiếu —
        khi nào cần, Sol vẫn ở đây.
      </p>
    </div>
  );
}
