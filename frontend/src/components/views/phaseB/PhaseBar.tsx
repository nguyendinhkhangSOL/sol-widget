// frontend/src/components/views/phaseB/PhaseBar.tsx
// Header 4 viên ngọc — visualize hành trình tiến hoá hành vi.
// KHÔNG hiển thị "Ngày X / 88" — UX rule giấu số ngày (xem STAGE_88_DAYS_DESIGN section 10).
//
// Phase hiện tại: pulse + viền dày + label đầy đủ.
// Phase đã qua: filled mờ.
// Phase sắp tới: outline mảnh, opacity thấp.
//
// 5 lớp: NHAN_THUC → HANH_DONG → GIAI_PHONG → TAI_THIET → DAI_SU
// 4 viên ngọc chính (Phase 1-4) hiển thị, DAI_SU hiện ngầm phía cuối khi reach.

import type { Stage } from './types';

interface PhaseInfo {
  key: Stage;
  emoji: string;
  label: string;
  color: string;
  ink: string;     // contrast text trên color
  soft: string;    // background mờ khi inactive
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
  /** Tiến độ trong phase hiện tại (0..1). Hiển thị thanh nhỏ dưới viên đang active. */
  progressInStage: number;
  /** Optional: ô subtle để skip — ví dụ hiển thị dayInStage nội bộ phase (Day 5/7 trong NHAN_THUC). */
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
    <div className="bg-sol-paper border-b border-sol-line">
      {/* ─── 4 viên ngọc ngang ──────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-stretch gap-1.5">
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
                  className={`w-full rounded-xl flex flex-col items-center justify-center py-2 transition-all ${
                    isCurrent ? 'animate-pulse-soft shadow-card' : ''
                  }`}
                  style={{
                    backgroundColor: isPast
                      ? p.color + '88'
                      : isCurrent
                      ? p.color
                      : p.soft,
                    border: isCurrent ? `2px solid ${p.ink}` : `1px solid ${p.color}33`,
                    opacity: isFuture ? 0.5 : 1,
                  }}
                >
                  <span className="text-xl leading-none" aria-hidden="true">{p.emoji}</span>
                  <span
                    className="text-[10px] font-semibold mt-1 leading-tight text-center px-1"
                    style={{
                      color: isCurrent ? '#FFFFFF' : isPast ? '#FFFFFF' : p.ink,
                    }}
                  >
                    {p.label}
                  </span>
                </div>

                {/* Progress thin bar — chỉ dưới phase hiện tại */}
                {isCurrent && (
                  <div className="w-full h-1 mt-1 bg-sol-line rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.round(progressInStage * 100)}%`,
                        backgroundColor: p.color,
                      }}
                    />
                  </div>
                )}
                {!isCurrent && <div className="h-1 mt-1" />}
              </div>
            );
          })}

          {/* DAI_SU — chỉ hiện khi đã reach (ngoài 4 ngọc) */}
          {isAmbassador && (
            <div className="flex-1 flex flex-col items-center">
              <div
                className="w-full rounded-xl flex flex-col items-center justify-center py-2 animate-pulse-soft shadow-card"
                style={{
                  backgroundColor: currentPhase.color,
                  border: '2px solid #FFFFFF',
                }}
              >
                <span className="text-xl leading-none" aria-hidden="true">{currentPhase.emoji}</span>
                <span className="text-[10px] font-semibold mt-1 leading-tight text-center px-1 text-white">
                  Đại Sứ Sol
                </span>
              </div>
              <div className="h-1 mt-1" />
            </div>
          )}
        </div>
      </div>

      {/* ─── Tagline phase hiện tại ─────────────────────────────────────── */}
      <div className="px-4 pb-3 flex items-baseline justify-between">
        <div className="text-meta">
          <span className="text-sol-ink-3">Bạn đang ở</span>{' '}
          <span className="font-semibold" style={{ color: currentPhase.color }}>
            {currentPhase.emoji} {currentPhase.label}
          </span>
        </div>
        <div className="text-[11px] text-sol-ink-3 italic hidden sm:block">
          {PHASE_TAGLINES[stage]}
        </div>
      </div>

      {/* ─── Sub-progress (chỉ khi có dayInStage và không phải DAI_SU) ──── */}
      {!isAmbassador && dayInStage && totalInStage && (
        <div className="px-4 pb-3">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-[11px] text-sol-ink-3">
              Tuần này: ngày {dayInStage}/{totalInStage}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
