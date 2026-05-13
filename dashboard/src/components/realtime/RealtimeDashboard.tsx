import { useEffect, useMemo, useRef, useState } from 'react';
import {
  elapsedMs,
  hmsFromMs,
  phaseAt,
  ringsAt,
  calcSavings,
  formatVnd,
  formatVndFull,
  formatLifeAdded,
} from '../../lib/recovery';
import { RealtimeClock } from './RealtimeClock';
import { RecoveryRings } from './RecoveryRings';
import { MilestonesList } from './MilestonesList';
import { IdentityFlow } from './IdentityFlow';
import { GloryCard } from './GloryCard';
import { SosCard } from './SosCard';
import { ContextAlerts } from './ContextAlerts';
import { ShareModal } from './ShareModal';

interface Props {
  quitDate?: string;
  userName: string;
  cigsPerDay?: number;
  pricePerCig?: number;
  /**
   * Số năm đã hút (deep profile). Khi có, τ của 4 vòng cơ quan sẽ được nhân
   * với hệ số (1 + yearsSmoked × factor) — phổi/não nhạy nhất, tim/miễn dịch
   * scale nhẹ. Người hút 30 năm phục hồi chậm hơn người hút 5 năm.
   */
  yearsSmoked?: number | null;
  /**
   * Ngôn ngữ giai đoạn: 'dramatic' (default Việt hoá) hoặc 'clinical' (y khoa).
   * Lấy từ user.settings.phaseLanguage.
   */
  phaseLanguage?: 'dramatic' | 'clinical';
  refundEligible?: boolean;
  dayNumber?: number;
  hasTodayCheckin?: boolean;
  todayCraving?: number;
  todayMood?: number;
  checkinStreak?: number;
  longestStreak?: number;
  onCheckin?: () => void;
  /**
   * Layout chế độ:
   * - "compact" (mặc định): single-column, max-w-440 — dùng cho widget bubble.
   * - "wide": responsive — desktop chia 2 cột (hero + detail), mobile vẫn stacked.
   *   Dùng cho dashboard /Tổng quan để khỏi phí khoảng trống màn hình.
   */
  layout?: 'compact' | 'wide';
}

export function RealtimeDashboard({
  quitDate,
  userName,
  cigsPerDay = 15,
  pricePerCig = 1000, // Sol v4 — 20k/bao phổ thông VN
  yearsSmoked,
  phaseLanguage = 'dramatic',
  refundEligible,
  dayNumber,
  hasTodayCheckin,
  todayCraving,
  todayMood,
  checkinStreak,
  longestStreak,
  onCheckin,
  layout = 'compact',
}: Props) {
  // Tick every second — real time. The "demo" slider overrides ms when set.
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [demoHours, setDemoHours] = useState<number | null>(null);
  const [showShare, setShowShare] = useState(false);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  useEffect(() => {
    const tick = (t: number) => {
      if (t - lastTickRef.current >= 1000) {
        lastTickRef.current = t;
        setNowMs(Date.now());
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const ms = useMemo(() => {
    if (demoHours != null) return demoHours * 3600 * 1000;
    return elapsedMs(quitDate, nowMs);
  }, [demoHours, quitDate, nowMs]);

  const { days, h, m, s, hours } = hmsFromMs(ms);
  const phase = phaseAt(hours, phaseLanguage);
  const rings = ringsAt(hours, yearsSmoked);
  const { cigsNotSmoked, amount, daily, lifeMinutes } = calcSavings(hours, {
    cigsPerDay,
    pricePerCig,
  });
  const donate10 = Math.round(amount * 0.1);

  const copyText = () => {
    const text = `🌟 SOL — ${userName}\n${days} ngày không hút thuốc · ${phase.label}\n— ${cigsNotSmoked} điếu không đốt\n— ${formatVndFull(amount)} tiết kiệm\n— ${formatLifeAdded(lifeMinutes)} tuổi thọ thêm\nhttps://bothuocla.sol.vn`;
    navigator.clipboard?.writeText(text).then(() => {
      const toast = document.createElement('div');
      toast.textContent = '✓ Đã sao chép';
      toast.style.cssText =
        'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#C17E2A;color:#fff;padding:10px 16px;border-radius:20px;font-size:13px;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,.25)';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 1800);
    });
  };

  // ─── Wide layout: dùng cho dashboard desktop, chia 2 cột lg+ ────────────
  // Hero (clock + today + minis + savings) ở cột trái sticky,
  // Detail (rings, milestones, identity, glory, SOS, alerts) ở cột phải dài.
  const isWide = layout === 'wide';

  const heroBlock = (
    <>
      {/* Demo slider */}
      <div
        className="mb-4 px-3.5 py-3 rounded-lg"
        style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.07)' }}
      >
        <label className="block text-[10px] uppercase mb-1.5" style={{ color: 'rgba(255,255,255,.68)', letterSpacing: '.06em' }}>
          Mô phỏng — kéo để xem ở các mốc khác nhau {demoHours != null && <span style={{ color: '#C17E2A' }}>(demo mode)</span>}
        </label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={8760}
            step={1}
            value={demoHours ?? hours}
            onChange={(e) => setDemoHours(Number(e.target.value))}
            className="flex-1"
            style={{ accentColor: '#C17E2A' }}
          />
          {demoHours != null && (
            <button
              onClick={() => setDemoHours(null)}
              className="text-[10px] px-2 py-1 rounded-md"
              style={{ background: 'rgba(255,255,255,.1)', color: '#fff' }}
            >
              Real-time
            </button>
          )}
        </div>
      </div>

      {/* Clock */}
      <RealtimeClock days={days} h={h} m={m} s={s} hours={hours} phase={phase} />

      {/* Today status strip — refund + check-in + streak */}
      {(refundEligible !== undefined || hasTodayCheckin !== undefined || checkinStreak !== undefined) && (
        <div className="grid grid-cols-2 gap-2.5 mb-3.5">
          {/* Check-in today */}
          {hasTodayCheckin !== undefined && (
            hasTodayCheckin ? (
              <div
                className="rounded-xl p-3 flex items-center gap-2.5"
                style={{ background: 'rgba(58,160,107,.12)', border: '1px solid rgba(58,160,107,.35)' }}
              >
                <div className="text-xl leading-none">✅</div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-semibold" style={{ color: '#7BD4A0' }}>
                    Đã check-in hôm nay
                  </div>
                  {(todayCraving !== undefined || todayMood !== undefined) && (
                    <div className="text-[10px] tabular-nums" style={{ color: 'rgba(255,255,255,.6)' }}>
                      {todayCraving !== undefined && <>Thèm {todayCraving}/10</>}
                      {todayCraving !== undefined && todayMood !== undefined && ' · '}
                      {todayMood !== undefined && <>Mood {todayMood}/5</>}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={onCheckin}
                className="rounded-xl p-3 flex items-center gap-2.5 text-left transition"
                style={{ background: 'rgba(232,129,46,.15)', border: '1px solid rgba(232,129,46,.4)' }}
              >
                <div className="text-xl leading-none">🌙</div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-semibold" style={{ color: '#F5B97B' }}>
                    Check-in 30 giây →
                  </div>
                  <div className="text-[10px]" style={{ color: 'rgba(255,255,255,.6)' }}>
                    Giữ chuỗi & giữ refund
                  </div>
                </div>
              </button>
            )
          )}

          {/* Streak */}
          {checkinStreak !== undefined && (
            <div
              className="rounded-xl p-3 flex items-center gap-2.5"
              style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.07)' }}
            >
              <div className="text-xl leading-none">🔥</div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold tabular-nums" style={{ color: '#F5E6C8' }}>
                  {checkinStreak} ngày liên tiếp
                </div>
                <div className="text-[10px]" style={{ color: 'rgba(255,255,255,.6)' }}>
                  Kỷ lục {longestStreak ?? 0} ngày
                </div>
              </div>
            </div>
          )}

          {/* Refund status — spans 2 cols for emphasis */}
          {refundEligible !== undefined && dayNumber !== undefined && (
            <div
              className="col-span-2 rounded-xl p-3 flex items-center gap-2.5"
              style={{
                background: refundEligible ? 'rgba(58,160,107,.08)' : 'rgba(192,67,49,.1)',
                border: `1px solid ${refundEligible ? 'rgba(58,160,107,.3)' : 'rgba(192,67,49,.35)'}`,
              }}
            >
              <div className="text-lg leading-none">{refundEligible ? '💎' : '⚠️'}</div>
              <div className="min-w-0 flex-1">
                <div
                  className="text-[10px] uppercase mb-0.5"
                  style={{ color: 'rgba(255,255,255,.55)', letterSpacing: '.06em' }}
                >
                  Trạng thái hoàn phí
                </div>
                <div
                  className="text-[12px] font-medium"
                  style={{ color: refundEligible ? '#7BD4A0' : '#E89580' }}
                >
                  {refundEligible
                    ? dayNumber < 7
                      ? `Giai đoạn cooling — mở từ ngày 8`
                      : `Đủ điều kiện · còn ${((30 - dayNumber) * Math.round(299000 / 30)).toLocaleString('vi-VN')}đ pro-rated`
                    : 'Bỏ check-in quá 1 ngày — đã mất quyền refund'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-2.5 mb-3.5">
        <MiniBox val={cigsNotSmoked.toString()} label="điếu không đốt" />
        <MiniBox val={formatVnd(amount)} label="đồng tiết kiệm" />
        <MiniBox val={formatLifeAdded(lifeMinutes)} label="tuổi thọ thêm" />
      </div>

      {/* Savings ticker */}
      <div
        className="flex items-center gap-3 p-3.5 rounded-xl mb-3.5"
        style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.07)' }}
      >
        <div className="flex-1 min-w-0">
          <div
            className="text-[10px] uppercase mb-0.5"
            style={{ color: 'rgba(255,255,255,.65)', letterSpacing: '.06em' }}
          >
            Tiền thuốc lá đã tiết kiệm
          </div>
          <div
            className="text-[20px] font-medium tabular-nums"
            style={{ color: '#F5E6C8' }}
          >
            {formatVndFull(amount)}
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,.65)' }}>
            → Donate Sol 10%: {formatVndFull(donate10)}
          </div>
        </div>
        <div className="text-right">
          <small className="text-[11px] block" style={{ color: 'rgba(255,255,255,.7)' }}>
            Mỗi ngày tiết kiệm
          </small>
          <strong className="text-[14px] font-medium block" style={{ color: 'rgba(255,255,255,.88)' }}>
            {formatVndFull(daily)}
          </strong>
        </div>
      </div>

      {/* Body rings */}
      <RecoveryRings rings={rings} />

      {/* Milestones */}
      <MilestonesList hours={hours} />

      {/* Identity */}
      <IdentityFlow hours={hours} phaseLanguage={phaseLanguage} />

      {/* Glory */}
      <GloryCard hours={hours} phase={phase} phaseLanguage={phaseLanguage} onShare={() => setShowShare(true)} onCopy={copyText} />

      {/* SOS */}
      <SosCard />

      {/* Context alerts */}
      <ContextAlerts hours={hours} />

      {/* Share modal */}
      <ShareModal
        open={showShare}
        onClose={() => setShowShare(false)}
        hours={hours}
        phase={phase}
        userName={userName}
      />
    </>
  );

  // Compact = widget bubble (single column, max 440).
  // Wide = dashboard /Tổng quan (full-width container, có thể grow trên desktop).
  return (
    <div
      className={
        isWide
          ? 'w-full max-w-[1100px] mx-auto rounded-2xl p-4 sm:p-5 lg:p-6'
          : 'w-full max-w-[440px] mx-auto rounded-2xl p-4'
      }
      style={{ background: '#0F2E2C', color: '#fff' }}
    >
      {heroBlock}
    </div>
  );
}

function MiniBox({ val, label }: { val: string; label: string }) {
  return (
    <div
      className="rounded-xl py-3 px-2.5 text-center"
      style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.07)' }}
    >
      <div
        className="text-[17px] font-medium tabular-nums"
        style={{ color: '#F5E6C8' }}
      >
        {val}
      </div>
      <div className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,.68)' }}>
        {label}
      </div>
    </div>
  );
}
