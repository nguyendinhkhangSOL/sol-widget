// dashboard/src/pages/Analytics.tsx
// PHASE B — Phân tích phase-aware. Tabs khác nhau theo stage user đang ở.
//
// Phase 1 NHAN_THUC  — Pattern observation (heatmap 24h, peak hours, trigger breakdown)
// Phase 2 HANH_DONG  — Reduction trend (daily cigs vs baseline, Plan B success rate)
// Phase 3 GIAI_PHONG — Body recovery (milestones unlocked, money cumulative chart)
// Phase 4 TAI_THIET  — Streak + identity (30-day check-in heatmap, cohort comparison)

import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../state/store';
import { api, ApiError } from '../services/api';
import { PhaseBar } from '../components/views/phaseB/PhaseBar';
import { PatternHeatmapCard, MoneySavedCard, BodyTimelineCard, fmt } from '../components/views/phaseB/_shared';
import type { Stage, DashboardData } from '../components/views/phaseB/types';

type Tab = 'phase-1' | 'phase-2' | 'phase-3' | 'phase-4';

const TABS: { id: Tab; emoji: string; label: string; color: string }[] = [
  { id: 'phase-1', emoji: '🌱', label: 'Nhận Thức',  color: '#B25C2C' },
  { id: 'phase-2', emoji: '🔥', label: 'Hành Động',  color: '#B8860B' },
  { id: 'phase-3', emoji: '🚭', label: 'Giải Phóng', color: '#3A7CA5' },
  { id: 'phase-4', emoji: '🌟', label: 'Tái Thiết',  color: '#5C3A1E' },
];

function tabFromStage(stage: Stage | null | undefined): Tab {
  if (stage === 'NHAN_THUC') return 'phase-1';
  if (stage === 'HANH_DONG') return 'phase-2';
  if (stage === 'GIAI_PHONG') return 'phase-3';
  if (stage === 'TAI_THIET' || stage === 'DAI_SU') return 'phase-4';
  return 'phase-1';
}

export function Analytics() {
  const checkins = useStore((s) => s.checkins);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab | null>(null);

  useEffect(() => {
    api.getJourneyDashboard()
      .then((r: any) => setData(r))
      .catch((e) => setError(e instanceof ApiError ? `API ${e.status}` : 'Không tải được'));
  }, []);

  // Auto-set tab theo stage khi data arrive lần đầu
  useEffect(() => {
    if (data && activeTab === null) {
      setActiveTab(tabFromStage(data.journey.stage));
    }
  }, [data, activeTab]);

  if (error && !data) {
    return (
      <div className="w-full max-w-[1100px] mx-auto p-8 text-center">
        <div className="text-4xl mb-2">⚠️</div>
        <p className="text-body text-sol-ink-2">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full max-w-[1100px] mx-auto p-8 text-center">
        <div className="text-3xl mb-2 animate-pulse">📊</div>
        <p className="text-body text-sol-ink-3">Đang tải phân tích…</p>
      </div>
    );
  }

  const activeIndex = activeTab ?? tabFromStage(data.journey.stage);
  const currentStageTab = tabFromStage(data.journey.stage);

  return (
    <div className="w-full max-w-[1100px] mx-auto p-4 lg:p-6 pb-24 lg:pb-8 space-y-6">
      <header className="px-1">
        <h1 className="text-display text-sol-ink font-bold">📊 Phân Tích</h1>
        <p className="text-body text-sol-ink-2 mt-1">
          Nhìn lại pattern để hiểu mình hơn — không phải để tự trách.
        </p>
      </header>

      <PhaseBar
        stage={data.journey.stage}
        progressInStage={data.journey.progressInStage}
        dayInStage={data.journey.dayInStage}
        totalInStage={data.journey.totalInStage}
      />

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => {
          const isActive = t.id === activeIndex;
          const isCurrent = t.id === currentStageTab;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={
                'shrink-0 min-h-tap px-4 py-3 rounded-xl text-body font-semibold transition flex items-center gap-2 ' +
                (isActive
                  ? 'text-white shadow-card'
                  : 'bg-sol-paper border border-sol-line text-sol-ink-2 hover:bg-sol-soft')
              }
              style={isActive ? { backgroundColor: t.color } : undefined}
            >
              <span aria-hidden="true">{t.emoji}</span>
              <span>{t.label}</span>
              {isCurrent && (
                <span className={
                  'text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ' +
                  (isActive ? 'bg-white/25' : 'bg-sol-orange text-white')
                }>
                  Hiện tại
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeIndex === 'phase-1' && <Phase1Analytics data={data} />}
      {activeIndex === 'phase-2' && <Phase2Analytics data={data} />}
      {activeIndex === 'phase-3' && <Phase3Analytics data={data} />}
      {activeIndex === 'phase-4' && <Phase4Analytics data={data} checkins={checkins} />}
    </div>
  );
}

/* ─── PHASE 1 — Pattern Observation ─────────────────────────────────────── */
function Phase1Analytics({ data }: { data: DashboardData }) {
  const triggers = data.stats.triggerCounts;
  const totalTriggers = Object.values(triggers).reduce((a, b) => a + b, 0);
  const sortedTriggers = Object.entries(triggers).sort((a, b) => b[1] - a[1]);
  const TRIGGER_VN: Record<string, string> = {
    STRESS: 'Stress', EATING: 'Sau cơm', IDLE: 'Rảnh', SOCIAL: 'Tụ tập', OTHER: 'Khác',
  };

  return (
    <div className="space-y-6">
      <PatternHeatmapCard
        hourly={data.pattern.hourly}
        cigsAvg7d={data.pattern.cigsAvg7d}
        accent="#B25C2C"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="🎯 Trigger phổ biến" accent="#B25C2C">
          {sortedTriggers.length === 0 ? (
            <p className="text-body text-sol-ink-3 italic">Chưa có dữ liệu trigger. Bấm "+ Ghi điếu" và chọn trigger để Sol bắt đầu học.</p>
          ) : (
            <div className="space-y-3">
              {sortedTriggers.map(([key, count]) => {
                const pct = totalTriggers > 0 ? (count / totalTriggers) * 100 : 0;
                return (
                  <div key={key}>
                    <div className="flex justify-between text-meta mb-1">
                      <span className="font-medium text-sol-ink">{TRIGGER_VN[key] ?? key}</span>
                      <span className="text-sol-ink-3">{count} lần ({Math.round(pct)}%)</span>
                    </div>
                    <div className="h-2 bg-sol-bg rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: '#B25C2C' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card title="📈 Số liệu tuần" accent="#B25C2C">
          <Stat2 label="Trung bình" value={`${data.pattern.cigsAvg7d}`} unit="điếu/ngày" />
          <Stat2 label="Tổng đã ghi" value={`${data.stats.cigsLogged}`} unit="điếu" />
          <Stat2 label="Đã bỏ qua" value={`${data.stats.cigsSkipped}`} unit="lần" tone="green" />
          <Stat2 label="Peak hour hôm nay" value={data.today.peakHour !== null ? `${data.today.peakHour}h` : '—'} />
        </Card>
      </div>

      <div className="bg-sol-blue-soft/40 border border-sol-blue/20 rounded-2xl p-6">
        <div className="text-meta font-semibold text-sol-blue-ink mb-2 uppercase tracking-wide">💡 Sol nhận xét</div>
        <p className="text-body-lg text-sol-ink leading-relaxed">
          Phase 1 là tuần Sol đo nhịp của {data.user.pronouns}. Mục tiêu KHÔNG phải giảm —
          chỉ là quan sát để Sol thấy pattern. Mỗi điếu ghi nhận = 1 dữ liệu Sol học cùng {data.user.pronouns}.
        </p>
      </div>
    </div>
  );
}

/* ─── PHASE 2 — Reduction Trend ─────────────────────────────────────────── */
function Phase2Analytics({ data }: { data: DashboardData }) {
  const baseline = data.stats.baseline;
  const cigsAvg7d = data.pattern.cigsAvg7d;
  const reduction = baseline > 0 ? ((baseline - cigsAvg7d) / baseline) * 100 : 0;
  const isReducing = reduction > 5;
  const isIncreasing = reduction < -5;

  return (
    <div className="space-y-6">
      <Card title="📉 Đường đi giảm dần" accent="#B8860B">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Stat2 label="Baseline (Phase 1)" value={`${baseline}`} unit="điếu/ngày" />
          <Stat2
            label="Trung bình tuần"
            value={cigsAvg7d.toFixed(1)}
            unit="điếu/ngày"
            tone={isReducing ? 'green' : isIncreasing ? 'red' : undefined}
          />
          <Stat2
            label="% Thay đổi"
            value={(reduction >= 0 ? '−' : '+') + Math.abs(Math.round(reduction)) + '%'}
            unit={isReducing ? 'giảm' : isIncreasing ? 'tăng' : 'ổn định'}
            tone={isReducing ? 'green' : isIncreasing ? 'red' : undefined}
          />
        </div>
      </Card>

      <Card title="🎯 Ngày bỏ countdown" accent="#B8860B">
        {data.qDay.daysUntilQDay > 0 ? (
          <div>
            <div className="text-display font-bold text-sol-orange-ink">
              {data.qDay.daysUntilQDay} ngày
            </div>
            <p className="text-body text-sol-ink-2 mt-2 leading-relaxed">
              Còn {data.qDay.daysUntilQDay} ngày là Ngày bỏ — ngày {data.user.pronouns} cam kết bỏ hẳn.
              Tuần sau sẽ là tuần chuẩn bị tâm lý.
            </p>
          </div>
        ) : data.qDay.isQDay ? (
          <p className="text-h2 text-sol-orange-ink font-bold">🌅 Hôm nay là Ngày bỏ!</p>
        ) : (
          <p className="text-body text-sol-ink-3 italic">Ngày bỏ đã qua.</p>
        )}
      </Card>

      <Card title="✓ Plan B success rate" accent="#B8860B">
        <div className="flex items-baseline gap-3">
          <div className="text-display font-bold text-sol-blue-ink">
            {data.stats.cigsSkipped}
          </div>
          <div className="text-body text-sol-ink-2">lần bỏ qua thành công</div>
        </div>
        <p className="text-meta text-sol-ink-3 mt-3 italic">
          Mỗi lần bỏ qua = 1 chiến thắng. Sol đếm cả những lần "thắng nhỏ" — vì chúng tạo nên thói quen mới.
        </p>
      </Card>

      <MoneySavedCard
        moneySaved={data.stats.moneySaved}
        cigsSkipped={data.stats.cigsSkipped}
        streak={data.stats.streak}
      />
    </div>
  );
}

/* ─── PHASE 3 — Body Recovery + Money Cumulative ─────────────────────────── */
function Phase3Analytics({ data }: { data: DashboardData }) {
  const [breakdown, setBreakdown] = useState<{
    days: Array<{ day: number; cigs: number; avoided: number; moneyDelta: number; cumulative: number }>;
    baseline: number;
    pricePerCig: number;
  } | null>(null);

  useEffect(() => {
    api.getMoneyBreakdown().then(setBreakdown).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <BodyTimelineCard
        unlocked={data.milestones.unlocked}
        next={data.milestones.next}
        qDayConfirmed={!!data.user.qDayConfirmedAt}
      />

      <Card title="💰 Tiết kiệm theo ngày" accent="#3A7CA5">
        {!breakdown || breakdown.days.length === 0 ? (
          <p className="text-body text-sol-ink-3 italic">Chưa có dữ liệu chi tiết.</p>
        ) : (
          <>
            <div className="text-meta text-sol-ink-2 mb-3">
              Baseline: <strong>{breakdown.baseline} điếu/ngày × {fmt(breakdown.pricePerCig)}đ/điếu</strong>
            </div>
            <MoneyChart days={breakdown.days} />
            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-sol-line">
              <Stat2
                label="Tổng tiết kiệm"
                value={(data.stats.moneySaved >= 0 ? '+' : '−') + fmt(Math.abs(data.stats.moneySaved)) + 'đ'}
                tone={data.stats.moneySaved >= 0 ? 'green' : 'red'}
              />
              <Stat2 label="Số ngày tracking" value={`${breakdown.days.length}`} unit="ngày" />
            </div>
          </>
        )}
      </Card>

      <MoneySavedCard
        moneySaved={data.stats.moneySaved}
        cigsSkipped={data.stats.cigsSkipped}
        streak={data.stats.streak}
      />
    </div>
  );
}

/* ─── PHASE 4 — Streak + Cohort ─────────────────────────────────────────── */
function Phase4Analytics({ data, checkins }: { data: DashboardData; checkins: any[] }) {
  // 30-day streak heatmap (last 30 days)
  const streakDays = useMemo(() => {
    const days: Array<{ date: Date; checkin: any | null }> = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const ci = checkins.find((c) => {
        const cd = new Date(c.date);
        cd.setHours(0, 0, 0, 0);
        return cd.getTime() === d.getTime();
      });
      days.push({ date: d, checkin: ci ?? null });
    }
    return days;
  }, [checkins]);

  return (
    <div className="space-y-6">
      <Card title="🔥 Chuỗi ngày sạch 30 ngày" accent="#5C3A1E">
        <div className="grid grid-cols-10 gap-1.5">
          {streakDays.map((d, i) => {
            const status = !d.checkin
              ? 'missed'
              : d.checkin.smoked
              ? 'slip'
              : 'clean';
            return (
              <div
                key={i}
                className={
                  'aspect-square rounded text-[10px] flex items-center justify-center font-semibold ' +
                  (status === 'clean'
                    ? 'bg-sol-green text-white'
                    : status === 'slip'
                    ? 'bg-sol-orange text-white'
                    : 'bg-sol-bg text-sol-ink-3 border border-sol-line')
                }
                title={d.date.toLocaleDateString('vi-VN')}
              >
                {d.date.getDate()}
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 mt-3 text-meta text-sol-ink-3">
          <LegendDot color="bg-sol-green" label="Sạch" />
          <LegendDot color="bg-sol-orange" label="Trượt" />
          <LegendDot color="bg-sol-bg border border-sol-line" label="Chưa check-in" />
        </div>
      </Card>

      <BodyTimelineCard
        unlocked={data.milestones.unlocked}
        next={data.milestones.next}
        qDayConfirmed={!!data.user.qDayConfirmedAt}
      />

      <Card title="🤝 So với Đội Sol" accent="#5C3A1E">
        {data.cohort.length === 0 ? (
          <p className="text-body text-sol-ink-3 italic">
            Chưa có đồng đội cùng cohort. Sol mong sớm có thêm người đi cùng {data.user.pronouns}.
          </p>
        ) : (
          <>
            <div className="text-body text-sol-ink mb-3">
              {data.cohort.length} đồng đội cùng tháng đặt Ngày bỏ với {data.user.pronouns}.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {data.cohort.map((c) => (
                <div key={c.pseudonym} className="flex items-center justify-between bg-sol-bg rounded-lg p-3 text-meta">
                  <span className="text-sol-ink font-medium">{c.pseudonym}</span>
                  <span className="text-sol-ink-3">{c.stageLabel}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      <MoneySavedCard
        moneySaved={data.stats.moneySaved}
        cigsSkipped={data.stats.cigsSkipped}
        streak={data.stats.streak}
      />
    </div>
  );
}

/* ─── HELPER COMPONENTS ──────────────────────────────────────────────────── */

function Card({ title, children, accent }: { title: string; children: React.ReactNode; accent?: string }) {
  return (
    <div
      className="bg-sol-paper rounded-2xl p-6 border shadow-card"
      style={{ borderColor: (accent ?? '#D4C7A8') + '40' }}
    >
      <h3 className="text-h3 font-semibold text-sol-ink mb-4">{title}</h3>
      {children}
    </div>
  );
}

function Stat2({
  label, value, unit, tone,
}: {
  label: string;
  value: string;
  unit?: string;
  tone?: 'green' | 'red';
}) {
  const colorClass = tone === 'green' ? 'text-sol-green-ink' : tone === 'red' ? 'text-sol-red' : 'text-sol-ink';
  return (
    <div className="bg-sol-bg rounded-xl p-4">
      <div className="text-[11px] text-sol-ink-3 uppercase tracking-wide font-semibold">{label}</div>
      <div className={`text-h1 font-bold mt-1 ${colorClass}`}>
        {value}
        {unit && <span className="text-meta text-sol-ink-3 font-normal ml-1.5">{unit}</span>}
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`inline-block w-3 h-3 rounded-sm ${color}`} />
      <span>{label}</span>
    </div>
  );
}

/* ─── MONEY CHART — simple bar viz ───────────────────────────────────────── */
function MoneyChart({
  days,
}: {
  days: Array<{ day: number; cigs: number; avoided: number; moneyDelta: number; cumulative: number }>;
}) {
  const max = Math.max(1, ...days.map((d) => Math.abs(d.cumulative)));
  const lastCumulative = days[days.length - 1]?.cumulative ?? 0;

  return (
    <div>
      <div className="flex items-end gap-0.5 h-32 bg-sol-bg rounded-lg p-2">
        {days.map((d) => {
          const ratio = Math.abs(d.cumulative) / max;
          const height = Math.max(2, ratio * 110);
          const isPositive = d.cumulative >= 0;
          return (
            <div
              key={d.day}
              className="flex-1 rounded-sm transition-all"
              style={{
                height: `${height}px`,
                backgroundColor: isPositive ? '#3A7CA5' : '#C62828',
                opacity: 0.4 + ratio * 0.6,
              }}
              title={`Day ${d.day}: ${isPositive ? '+' : '−'}${fmt(Math.abs(d.cumulative))}đ`}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-[11px] text-sol-ink-3 mt-1">
        <span>Day 1</span>
        <span>Day {Math.ceil(days.length / 2)}</span>
        <span>Day {days.length}</span>
      </div>
      <div className="text-meta text-sol-ink-2 mt-2 text-center">
        Cuối kỳ: <strong className={lastCumulative >= 0 ? 'text-sol-green-ink' : 'text-sol-red'}>
          {lastCumulative >= 0 ? '+' : '−'}{fmt(Math.abs(lastCumulative))}đ
        </strong>
      </div>
    </div>
  );
}
