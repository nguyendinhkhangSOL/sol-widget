// dashboard/src/components/views/phaseB/PhaseBar.tsx
// Header 4 viên ngọc — DASHBOARD desktop variant.
// Lớn hơn, có sub-progress + phase tagline rõ ràng.

import type { Stage } from './types';

interface PhaseInfo {
  key: Stage;
  emoji: string;
  label: string;
  color: string;
  ink: string;
  soft: string;
}

const PHASES: PhaseInfo[] = [
  { key: 'NHAN_THUC',   emoji: '🌱', label: 'Nhận Thức',  color: '#B25C2C', ink: '#6B3318', soft: '#F4DDC8' },
  { key: 'HANH_DONG',   emoji: '🔥', label: 'Hành Động',  color: '#B8860B', ink: '#6B5008', soft: '#F0E2B8' },
  { key: 'GIAI_PHONG',  emoji: '🚭', label: 'Giải Phóng', color: '#3A7CA5', ink: '#225573', soft: '#E2EDF4' },
  { key: 'TAI_THIET',   emoji: '🌟', label: 'Tái Thiết',  color: '#5C3A1E', ink: '#3A2410', soft: '#E8DCCA' },
];

const PHASE_TAGLINES: Record<Stage, string> = {
  NHAN_THUC:  'Quan sát chính mình',
  HANH_DONG:  'Phá bỏ thói quen',
  GIAI_PHONG: 'Bỏ hẳn — sống tự do',
  TAI_THIET:  'Giữ vững — tái thiết',
  DAI_SU:     'Mentor cohort mới',
};

export interface PhaseBarProps {
  stage: Stage;
  progressInStage: number;
  dayInStage?: number;
  totalInStage?: number;
}

export function PhaseBar({ stage, progressInStage, dayInStage, totalInStage }: PhaseBarProps) {
  const isAmbassador = stage === 'DAI_SU';
  const currentIndex = isAmbassador ? PHASES.length : PHASES.findIndex((p) => p.key === stage);
  const currentPhase = isAmbassador
    ? { key: 'DAI_SU' as const, emoji: '🦁', label: 'Đại Sứ Sol', color: '#2C1810', ink: '#FFFFFF', soft: '#5C3A1E' }
    : PHASES[currentIndex];

  return (
    <div className="bg-sol-paper border border-sol-line rounded-2xl p-6 shadow-card">
      {/* 4 viên ngọc ngang */}
      <div className="flex items-stretch gap-3">
        {PHASES.map((p, i) => {
          const isPast = i < currentIndex;
          const isCurrent = i === currentIndex && !isAmbassador;
          const isFuture = i > currentIndex;

          return (
            <div
              key={p.key}
              className="flex-1 flex flex-col items-center"
              aria-current={isCurrent ? 'step' : undefined}
            >
              <div
                className={`w-full rounded-2xl flex flex-col items-center justify-center py-4 transition-all ${
                  isCurrent ? 'animate-pulse-soft shadow-pop' : ''
                }`}
                style={{
                  backgroundColor: isPast
                    ? p.color + '88'
                    : isCurrent
                    ? p.color
                    : p.soft,
                  border: isCurrent ? `2px solid ${p.ink}` : `1px solid ${p.color}33`,
                  opacity: isFuture ? 0.5 : 1,
                  minHeight: '90px',
                }}
              >
                <span className="text-3xl leading-none" aria-hidden="true">{p.emoji}</span>
                <span
                  className="text-body font-semibold mt-2 leading-tight text-center px-2"
                  style={{
                    color: isCurrent || isPast ? '#FFFFFF' : p.ink,
                  }}
                >
                  {p.label}
                </span>
              </div>

              {isCurrent && (
                <div className="w-full h-1.5 mt-2 bg-sol-line rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.round(progressInStage * 100)}%`,
                      backgroundColor: p.color,
                    }}
                  />
                </div>
              )}
              {!isCurrent && <div className="h-1.5 mt-2" />}
            </div>
          );
        })}

        {isAmbassador && (
          <div className="flex-1 flex flex-col items-center">
            <div
              className="w-full rounded-2xl flex flex-col items-center justify-center py-4 animate-pulse-soft shadow-pop"
              style={{
                backgroundColor: currentPhase.color,
                border: '2px solid #FFFFFF',
                minHeight: '90px',
              }}
            >
              <span className="text-3xl leading-none" aria-hidden="true">{currentPhase.emoji}</span>
              <span className="text-body font-semibold mt-2 leading-tight text-center px-2 text-white">
                Đại Sứ Sol
              </span>
            </div>
            <div className="h-1.5 mt-2" />
          </div>
        )}
      </div>

      {/* Tagline phase hiện tại */}
      <div className="flex items-baseline justify-between mt-5 pt-5 border-t border-sol-line">
        <div className="text-body">
          <span className="text-sol-ink-3">Bạn đang ở</span>{' '}
          <span className="font-semibold text-h3" style={{ color: currentPhase.color }}>
            {currentPhase.emoji} {currentPhase.label}
          </span>
        </div>
        <div className="text-body text-sol-ink-3 italic">
          {PHASE_TAGLINES[stage]}
        </div>
      </div>

      {!isAmbassador && dayInStage && totalInStage && (
        <div className="text-meta text-sol-ink-3 mt-2">
          Tuần này: ngày <strong className="text-sol-ink">{dayInStage}</strong>/{totalInStage}
        </div>
      )}
    </div>
  );
}
