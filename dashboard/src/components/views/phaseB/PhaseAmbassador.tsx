// dashboard/src/components/views/phaseB/PhaseAmbassador.tsx
// PHASE 5 — DAI_SU (Day 89+) — DASHBOARD desktop variant.

import { useEffect, useState } from 'react';
import { PhaseProps } from './types';
import {
  StoryCard, MoneySavedCard, CohortCard, BodyTimelineCard,
} from './_shared';
import { useToast } from '../../../lib/toast';

const ACCENT = '#2C1810';

function computeDaysSince(qDayConfirmedAt: string): number {
  const ms = Date.now() - new Date(qDayConfirmedAt).getTime();
  return Math.max(0, Math.floor(ms / 86400000));
}

export function PhaseAmbassador({ data, onShowExit }: PhaseProps) {
  const toast = useToast();
  const [days, setDays] = useState<number>(() =>
    data.qDay.qDayConfirmedAt ? computeDaysSince(data.qDay.qDayConfirmedAt) : 0,
  );

  useEffect(() => {
    if (!data.qDay.qDayConfirmedAt) return;
    const t = setInterval(() => {
      setDays(computeDaysSince(data.qDay.qDayConfirmedAt!));
    }, 3600000);
    return () => clearInterval(t);
  }, [data.qDay.qDayConfirmedAt]);

  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-body">
          <span className="text-3xl mr-2" aria-hidden="true">🦁</span>
          <span className="text-sol-ink font-semibold">Đại Sứ Sol</span>
        </div>
        <button onClick={onShowExit} className="text-body text-sol-ink-3 underline hover:text-sol-ink">
          Tạm dừng
        </button>
      </div>

      {/* Hero — Đại Sứ identity */}
      <div
        className="rounded-2xl p-10 text-white shadow-pop text-center"
        style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, #5C3A1E 100%)` }}
      >
        <div className="text-8xl mb-4" aria-hidden="true">🦁</div>
        <h2 className="text-display font-bold">Đại Sứ Sol</h2>
        <p className="text-body-lg opacity-90 mt-3">
          {cap(data.user.pronouns)} đã đi qua 88 ngày.
        </p>
        <div className="mt-6 pt-6 border-t border-white/20">
          <div className="font-bold" style={{ fontSize: '88px', lineHeight: '1' }}>{days}</div>
          <div className="text-body opacity-80 italic mt-2">ngày không hút</div>
        </div>
      </div>

      {/* 2-col layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <BodyTimelineCard
            unlocked={data.milestones.unlocked}
            next={null}
            qDayConfirmed={true}
          />
          <StoryCard story={data.story} accent={ACCENT} />

          {/* Mentor mission */}
          <div className="bg-sol-paper border-2 border-sol-earth rounded-2xl p-7 shadow-card">
            <div className="text-h2 font-semibold text-sol-ink mb-3">
              🤝 Sứ mệnh Đại Sứ
            </div>
            <p className="text-body-lg text-sol-ink leading-relaxed mb-5">
              Sol mong {data.user.pronouns} chia sẻ với 1 người mới mỗi tuần. Cách giữ vững nhất — là giúp người khác bắt đầu.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => toast.info('Tính năng đang phát triển — Sol sẽ thông báo khi sẵn sàng.', '🎁 Mời bạn vào Sol')}
                className="min-h-tap py-3 rounded-xl bg-sol-earth text-white font-semibold"
              >
                🎁 Mời bạn vào Sol
              </button>
              <button
                onClick={() => toast.info('Tải hồ sơ PDF — sắp ra mắt.', '📔')}
                className="min-h-tap py-3 rounded-xl bg-sol-paper border border-sol-line text-sol-ink"
              >
                📔 Tải hồ sơ PDF
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <MoneySavedCard
            moneySaved={data.stats.moneySaved}
            cigsSkipped={data.stats.cigsSkipped}
            streak={data.stats.streak}
          />
          <CohortCard cohort={data.cohort} mentorMode={true} />
        </div>
      </div>

      <p className="text-meta text-sol-ink-3 text-center mt-2 italic max-w-2xl mx-auto">
        Sol đã hoàn thành nhiệm vụ với {data.user.pronouns}. Từ đây, Sol chỉ là gương phản chiếu —
        khi nào cần, Sol vẫn ở đây.
      </p>
    </div>
  );
}
