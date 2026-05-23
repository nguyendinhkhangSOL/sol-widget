// dashboard/src/components/JourneySimulator.tsx
//
// HERO COMPONENT cho trang "Hành Trình" (mặc định khi user vào dashboard).
// Tích hợp:
//   1. Slider time-travel (Day 0 → 730) để user kéo xem cơ thể hồi phục
//   2. Hero stats nhảy số: Điếu không đốt, Tiền tiết kiệm, Chỉ số làm chủ
//   3. 4 progress rings (Tim/Phổi/Não/Miễn dịch) với curves từ CDC/NHS/AHA
//   4. Milestones list ✓ Đạt / ⏳ Sắp tới
//   5. Share button — tạo PNG để khoe FB/Zalo (sẽ wire ở Phase 2)
//
// Marker đỏ trên slider = ngày hiện tại của user.
// Kéo sang trái (quá khứ) → thấy mình đã đi qua đâu.
// Kéo sang phải (tương lai) → "preview" cơ thể sẽ ra sao.

import { useState, useMemo, useEffect, useRef } from 'react';
import { BODY_SYSTEMS, pct, getAllMilestones, type BodySystem } from '../lib/bodyRecovery';

export interface JourneySimulatorProps {
  /** Số ngày user đã đi trong journey (1+). 0 = chưa start (preview mode). */
  currentDay: number;
  /** Cohort của user (LIGHT/MODERATE/HEAVY) — dùng cho label */
  cohort?: 'LIGHT' | 'MODERATE' | 'HEAVY';
  /** Lộ trình chính của cohort (35/52/65) — để hiện "đã hoàn thành lộ trình chính" */
  cohortTotalDays?: number;
  /** Baseline cigarettes/day để compute stats */
  baselineCigsPerDay: number;
  /** Giá mỗi điếu (vd 1800đ) */
  pricePerCig: number;
  /** Chỉ số làm chủ (0-100) — Mastery Score */
  masteryScore?: number;
  /** User pronouns (anh/bạn) */
  pronouns?: string;
  /** Tên user để hiện trên share card */
  userName?: string;
  /** Callback khi user bấm "Tải ảnh chia sẻ" — sẽ wire sau */
  onShareClick?: () => void;
}

const COHORT_LABEL: Record<NonNullable<JourneySimulatorProps['cohort']>, string> = {
  LIGHT: 'NHẸ',
  MODERATE: 'VỪA',
  HEAVY: 'NẶNG',
};

const COHORT_EMOJI: Record<NonNullable<JourneySimulatorProps['cohort']>, string> = {
  LIGHT: '🟢',
  MODERATE: '🟡',
  HEAVY: '🔴',
};

const MAX_SIMULATION_DAYS = 365 * 2; // 2 năm — đủ để cover tất cả milestones quan trọng

// Format số tiền VND theo locale
function fmtVnd(n: number): string {
  return new Intl.NumberFormat('vi-VN').format(Math.round(n)) + 'đ';
}

// Format số điếu
function fmtCigs(n: number): string {
  return new Intl.NumberFormat('vi-VN').format(Math.round(n));
}

// Tuổi thọ thêm (cigsAvoided × 11 phút / 1440)
function fmtLifeAdded(cigsAvoided: number): string {
  const minutes = cigsAvoided * 11;
  if (minutes < 60) return `${Math.round(minutes)} phút`;
  if (minutes < 1440) return `${(minutes / 60).toFixed(1)} giờ`;
  if (minutes < 1440 * 30) return `${(minutes / 1440).toFixed(1)} ngày`;
  return `${(minutes / 1440 / 30).toFixed(1)} tháng`;
}

// Format day label trên slider
function fmtDayLabel(day: number): string {
  if (day === 0) return 'Hôm bắt đầu';
  if (day < 30) return `Ngày ${day}`;
  if (day < 365) return `Tháng ${(day / 30).toFixed(1)}`.replace('.0', '');
  return `Năm ${(day / 365).toFixed(1)}`.replace('.0', '');
}

// ─── Body Recovery Ring SVG ─────────────────────────────────────────────
function RecoveryRing({ system, day }: { system: BodySystem; day: number }) {
  const percentage = pct(system.curve, day);
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - percentage / 100);

  return (
    <div className="bg-sol-paper border border-sol-line rounded-2xl p-4 text-center">
      <svg width="84" height="84" viewBox="0 0 84 84" className="mx-auto block">
        <circle cx="42" cy="42" r={radius} fill="none" stroke="#F0EBE2" strokeWidth="7" />
        <circle
          cx="42"
          cy="42"
          r={radius}
          fill="none"
          stroke={system.color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 42 42)"
          style={{ transition: 'stroke-dashoffset 350ms ease-out' }}
        />
        <text
          x="42"
          y="47"
          textAnchor="middle"
          fontSize="18"
          fontWeight="700"
          fill="#2A2620"
        >
          {Math.round(percentage)}%
        </text>
      </svg>
      <div className="text-meta font-semibold mt-1 text-sol-ink">{system.label}</div>
    </div>
  );
}

// ─── Hero Stat Card ──────────────────────────────────────────────────────
function HeroStat({
  emoji,
  label,
  value,
  hint,
  highlight,
}: {
  emoji: string;
  label: string;
  value: string;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-4 ${
        highlight
          ? 'bg-sol-clay text-white shadow-card'
          : 'bg-sol-paper border border-sol-line'
      }`}
    >
      <div className={`text-meta ${highlight ? 'text-white/80' : 'text-sol-ink-3'} flex items-center gap-1`}>
        <span aria-hidden="true">{emoji}</span>
        <span>{label}</span>
      </div>
      <div
        className={`text-h1 font-bold mt-1 tabular-nums ${
          highlight ? 'text-white' : 'text-sol-ink'
        }`}
      >
        {value}
      </div>
      {hint && (
        <div className={`text-[11px] mt-1 ${highlight ? 'text-white/70' : 'text-sol-ink-3'}`}>
          {hint}
        </div>
      )}
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────
export function JourneySimulator({
  currentDay,
  cohort = 'MODERATE',
  cohortTotalDays = 52,
  baselineCigsPerDay,
  pricePerCig,
  masteryScore,
  pronouns = 'anh',
  userName,
  onShareClick,
}: JourneySimulatorProps) {
  // Slider position — mặc định = currentDay, cap MAX_SIMULATION_DAYS
  const [simDay, setSimDay] = useState<number>(Math.min(currentDay, MAX_SIMULATION_DAYS));
  const [isAnimating, setIsAnimating] = useState(false);
  const animRef = useRef<number | null>(null);

  // Reset slider khi currentDay thay đổi (sau check-in, midnight cron, etc.)
  useEffect(() => {
    setSimDay(Math.min(currentDay, MAX_SIMULATION_DAYS));
  }, [currentDay]);

  // ─── Stats compute theo simDay ──────────────────────────────────────
  const stats = useMemo(() => {
    const cigsAvoided = simDay * baselineCigsPerDay;
    const moneySaved = cigsAvoided * pricePerCig;
    const lifeMinutes = cigsAvoided * 11;
    return {
      cigsAvoided,
      moneySaved,
      lifeAdded: fmtLifeAdded(cigsAvoided),
    };
  }, [simDay, baselineCigsPerDay, pricePerCig]);

  // ─── Milestones sorted, filter để hiện ── 8 milestones gần simDay nhất ────
  const milestones = useMemo(() => getAllMilestones(), []);
  const visibleMilestones = useMemo(() => {
    // Show 4 đã đạt gần nhất + 4 chưa đạt gần nhất
    const passed = milestones.filter((m) => m.days <= simDay);
    const upcoming = milestones.filter((m) => m.days > simDay);
    return [
      ...passed.slice(-4),
      ...upcoming.slice(0, 4),
    ];
  }, [milestones, simDay]);

  // ─── "Reset to today" button ────────────────────────────────────────
  function resetToToday() {
    setIsAnimating(true);
    const start = simDay;
    const end = currentDay;
    const duration = 600;
    const t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setSimDay(Math.round(start + (end - start) * eased));
      if (t < 1) {
        animRef.current = requestAnimationFrame(step);
      } else {
        setIsAnimating(false);
      }
    };
    animRef.current = requestAnimationFrame(step);
  }
  useEffect(() => () => { if (animRef.current) cancelAnimationFrame(animRef.current); }, []);

  // ─── Quick jump buttons ─────────────────────────────────────────────
  const quickJumps = [
    { label: 'Hôm nay', day: currentDay },
    { label: '1 tuần', day: 7 },
    { label: '1 tháng', day: 30 },
    { label: '3 tháng', day: 90 },
    { label: '1 năm', day: 365 },
  ];

  const isPastNow = simDay < currentDay;
  const isFuture = simDay > currentDay;
  const cohortLabel = COHORT_LABEL[cohort];
  const cohortEmojiStr = COHORT_EMOJI[cohort];

  return (
    <div className="space-y-6">
      {/* ─── HEADER với cohort info ───────────────────────────────────── */}
      <header>
        <h1 className="text-display font-bold text-sol-ink mb-1">🗺️ Hành Trình Sol</h1>
        <p className="text-body text-sol-ink-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sol-paper border border-sol-ink/10 font-semibold text-meta mr-2">
            <span>{cohortEmojiStr}</span>
            <span>Lộ trình {cohortLabel} · {cohortTotalDays} ngày</span>
          </span>
          Kéo để xem cơ thể {pronouns} ở mọi mốc.
        </p>
      </header>

      {/* ─── SLIDER TIME-TRAVEL ─────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#2A2620] to-[#5C3A1E] rounded-2xl p-5 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <div className="text-white/80 text-meta uppercase tracking-wide font-semibold">
            ⏪ Mô phỏng · kéo để xem
          </div>
          {isPastNow && (
            <button
              onClick={resetToToday}
              disabled={isAnimating}
              className="text-white text-meta px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 transition"
            >
              ↩ Về hôm nay
            </button>
          )}
          {isFuture && (
            <button
              onClick={resetToToday}
              disabled={isAnimating}
              className="text-white text-meta px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 transition"
            >
              ↪ Về hôm nay
            </button>
          )}
        </div>

        {/* Slider with current-day marker */}
        <div className="relative pt-6 pb-2">
          {/* Current day marker label */}
          {currentDay > 0 && currentDay <= MAX_SIMULATION_DAYS && (
            <div
              className="absolute top-0 transform -translate-x-1/2 text-[10px] text-white/90 font-bold whitespace-nowrap"
              style={{ left: `${(currentDay / MAX_SIMULATION_DAYS) * 100}%` }}
            >
              ▼ Hôm nay
            </div>
          )}

          <input
            type="range"
            min={0}
            max={MAX_SIMULATION_DAYS}
            value={simDay}
            step={1}
            onChange={(e) => setSimDay(parseInt(e.target.value, 10))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-orange-500"
            style={{
              background: `linear-gradient(to right, #E8924A 0%, #E8924A ${
                (simDay / MAX_SIMULATION_DAYS) * 100
              }%, rgba(255,255,255,0.2) ${
                (simDay / MAX_SIMULATION_DAYS) * 100
              }%, rgba(255,255,255,0.2) 100%)`,
            }}
          />

          {/* Quick jumps */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {quickJumps.map((q) => (
              <button
                key={q.label}
                onClick={() => setSimDay(Math.min(q.day, MAX_SIMULATION_DAYS))}
                className={`text-[11px] px-2.5 py-1 rounded-full transition ${
                  Math.abs(simDay - q.day) < 1
                    ? 'bg-white text-sol-clay font-bold'
                    : 'bg-white/15 text-white hover:bg-white/25'
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 text-center">
          <div className="text-display font-bold text-white tabular-nums">
            {fmtDayLabel(simDay)}
          </div>
          {simDay > 0 && (
            <div className="text-white/70 text-meta mt-1">
              {isPastNow ? 'Đã đi qua' : isFuture ? `Còn ${simDay - currentDay} ngày nữa` : 'Hôm nay'}
            </div>
          )}
        </div>
      </div>

      {/* ─── HERO STATS (3 cards lớn) ────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <HeroStat
          emoji="🚭"
          label="Điếu KHÔNG đốt"
          value={fmtCigs(stats.cigsAvoided)}
          hint={`Baseline ${baselineCigsPerDay} điếu/ngày`}
          highlight
        />
        <HeroStat
          emoji="💰"
          label="Tiền tiết kiệm"
          value={fmtVnd(stats.moneySaved)}
          hint={`${fmtVnd(stats.moneySaved / Math.max(1, simDay))}/ngày`}
        />
        {typeof masteryScore === 'number' ? (
          <HeroStat
            emoji="🎯"
            label="Chỉ số làm chủ"
            value={`${masteryScore}/100`}
            hint={
              masteryScore >= 80 ? 'Tự do' :
              masteryScore >= 60 ? 'Làm chủ rõ' :
              masteryScore >= 40 ? 'Đang làm chủ' :
              masteryScore >= 20 ? 'Đang nhận ra' :
              'Chưa nhận ra'
            }
          />
        ) : (
          <HeroStat
            emoji="⏳"
            label="Tuổi thọ thêm"
            value={stats.lifeAdded}
            hint="11 phút/điếu (CDC)"
          />
        )}
      </div>

      {/* ─── 4 BODY RECOVERY RINGS ───────────────────────────────────── */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-h2 font-semibold text-sol-ink">🩺 Cơ thể đang sửa</h2>
          <span className="text-meta text-sol-ink-3 italic">
            Curves từ CDC, NHS, AHA, Surgeon General 2020
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {BODY_SYSTEMS.map((sys) => (
            <RecoveryRing key={sys.id} system={sys} day={simDay} />
          ))}
        </div>
      </div>

      {/* ─── MILESTONES LIST ──────────────────────────────────────────── */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-h2 font-semibold text-sol-ink">📜 Cột mốc hành trình</h2>
          <span className="text-meta text-sol-ink-3">
            {milestones.filter((m) => m.days <= simDay).length}/{milestones.length} đã đạt
          </span>
        </div>
        <div className="space-y-2">
          {visibleMilestones.map((m, idx) => {
            const isPassed = m.days <= simDay;
            return (
              <div
                key={`${m.systemId}-${m.days}-${idx}`}
                className={`flex items-center gap-3 p-3 rounded-xl border transition ${
                  isPassed
                    ? 'bg-sol-green-soft border-sol-green/30'
                    : 'bg-sol-paper border-sol-line opacity-70'
                }`}
              >
                <span className="text-2xl flex-shrink-0" aria-hidden="true">
                  {m.systemEmoji}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-semibold text-sol-ink">{m.title}</span>
                    <span className="text-meta text-sol-ink-3">
                      · {m.systemLabel} · {fmtDayLabel(m.days)}
                    </span>
                  </div>
                  <div className="text-meta text-sol-ink-2 mt-0.5 leading-snug">
                    {m.detail}
                  </div>
                  <a
                    href={m.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-sol-clay underline hover:text-sol-clay/80"
                  >
                    Nguồn: {m.source}
                  </a>
                </div>
                <span
                  className={`text-meta font-semibold whitespace-nowrap px-2 py-1 rounded-full ${
                    isPassed
                      ? 'bg-sol-green text-white'
                      : 'bg-sol-ink-3/10 text-sol-ink-3'
                  }`}
                >
                  {isPassed ? '✓ Đạt' : '⏳ Sắp tới'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── SHARE BUTTON ─────────────────────────────────────────────── */}
      {onShareClick && (
        <div className="flex justify-center pt-2">
          <button
            onClick={onShareClick}
            className="px-6 py-3 rounded-xl bg-sol-clay text-white font-semibold shadow-card hover:shadow-pop transition"
          >
            📸 Tải ảnh khoe hành trình
          </button>
        </div>
      )}
    </div>
  );
}
