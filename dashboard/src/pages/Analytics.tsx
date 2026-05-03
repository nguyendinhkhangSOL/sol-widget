import { useMemo } from 'react';
import { useStore } from '../state/store';

export function Analytics() {
  const user = useStore((s) => s.user);
  const checkins = useStore((s) => s.checkins);

  const byDay = useMemo(() => {
    const m = new Map<number, any>();
    for (const c of checkins) m.set(c.dayNumber, c);
    return m;
  }, [checkins]);

  const currentDay = useMemo(() => {
    if (!user?.quitDate) return 30;
    const diff = Math.floor((Date.now() - new Date(user.quitDate).getTime()) / 86400000);
    return Math.max(1, Math.min(30, diff + 1));
  }, [user?.quitDate]);

  // Weekly breakdown
  const weeks = [1, 2, 3, 4].map((w) => {
    const startDay = (w - 1) * 7 + 1;
    const endDay = Math.min(w * 7, 30);
    const items = Array.from({ length: endDay - startDay + 1 })
      .map((_, i) => byDay.get(startDay + i))
      .filter(Boolean) as any[];
    const done = items.length;
    const clean = items.filter((c) => !c.smoked).length;
    const avgMood = done ? items.reduce((s, c) => s + c.mood, 0) / done : 0;
    const avgCraving = done ? items.reduce((s, c) => s + c.cravingIntensity, 0) / done : 0;
    return { week: w, startDay, endDay, done, clean, avgMood, avgCraving };
  });

  // Risky hour distribution (top 3)
  const riskyHours = user?.riskyHours ?? [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 pb-24 lg:pb-6">
      <header>
        <h1 className="text-2xl font-bold">Phân tích hành trình</h1>
        <p className="text-sm text-sol-ink/60">Nhìn lại pattern để hiểu mình hơn — không phải để tự trách.</p>
      </header>

      {/* Mood + craving chart */}
      <Card title="Tâm trạng & Cơn thèm qua 30 ngày">
        <TrendChart checkins={checkins} days={Math.max(currentDay, 1)} />
        <div className="mt-2 flex gap-4 text-xs text-sol-ink/60">
          <LegendDot color="bg-sol-blue" label="Tâm trạng (1–5)" />
          <LegendDot color="bg-sol-red" label="Cơn thèm (1–10)" />
        </div>
      </Card>

      {/* Weekly breakdown */}
      <Card title="Theo tuần">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {weeks.map((w) => (
            <div key={w.week} className="bg-sol-bg rounded-xl p-3">
              <div className="text-xs text-sol-ink/60">
                Tuần {w.week} · ngày {w.startDay}–{w.endDay}
              </div>
              <div className="text-sm mt-1">
                <div>
                  Check-in: <span className="font-semibold">{w.done}/{w.endDay - w.startDay + 1}</span>
                </div>
                <div>
                  Sạch: <span className="font-semibold text-sol-green">{w.clean}/{w.done || 1}</span>
                </div>
                <div>
                  Mood TB:{' '}
                  <span className="font-semibold">{w.avgMood ? w.avgMood.toFixed(1) : '—'}</span>
                </div>
                <div>
                  Thèm TB:{' '}
                  <span className="font-semibold">{w.avgCraving ? w.avgCraving.toFixed(1) : '—'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Triggers + risky hours */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Khung giờ rủi ro cao">
          {riskyHours.length === 0 ? (
            <div className="text-sol-ink/50 italic text-sm">
              Chưa đủ dữ liệu. Check-in thêm để SOL học pattern.
            </div>
          ) : (
            <HourHeatmap hours={riskyHours} />
          )}
        </Card>
        <Card title="Trigger thường gặp">
          {(user?.topTriggers ?? []).length === 0 ? (
            <div className="text-sol-ink/50 italic text-sm">Chưa có trigger nào được ghi nhận.</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {user!.topTriggers!.map((t) => (
                <span
                  key={t}
                  className="px-3 py-1.5 rounded-full bg-sol-orange/10 text-sol-orange text-sm font-medium"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Craving distribution */}
      <Card title="Phân bố cơn thèm">
        <CravingHistogram checkins={checkins} />
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-card">
      <div className="text-xs uppercase tracking-wider text-sol-ink/50 mb-3">{title}</div>
      {children}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`w-2 h-2 rounded-full ${color}`} /> {label}
    </span>
  );
}

function TrendChart({ checkins, days }: { checkins: any[]; days: number }) {
  const width = 800;
  const height = 180;
  const pad = 16;
  const byDay = new Map<number, any>();
  for (const c of checkins) byDay.set(c.dayNumber, c);

  const moodPts: [number, number][] = [];
  const cravPts: [number, number][] = [];
  for (let d = 1; d <= days; d++) {
    const c = byDay.get(d);
    if (!c) continue;
    const x = pad + ((d - 1) / 29) * (width - pad * 2);
    const moodY = pad + (1 - (c.mood - 1) / 4) * (height - pad * 2);
    const cravY = pad + (1 - (c.cravingIntensity - 1) / 9) * (height - pad * 2);
    moodPts.push([x, moodY]);
    cravPts.push([x, cravY]);
  }
  const toPath = (pts: [number, number][]) =>
    pts.length === 0 ? '' : 'M' + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40">
      <line x1={pad} x2={width - pad} y1={height / 2} y2={height / 2} stroke="#00000010" strokeDasharray="2 3" />
      {[0, 1, 2, 3].map((i) => (
        <line
          key={i}
          x1={pad + ((i + 1) * 7.5 * (width - pad * 2)) / 30}
          x2={pad + ((i + 1) * 7.5 * (width - pad * 2)) / 30}
          y1={pad}
          y2={height - pad}
          stroke="#00000008"
          strokeDasharray="2 2"
        />
      ))}
      <path d={toPath(moodPts)} fill="none" stroke="#3A7CA5" strokeWidth="2" strokeLinejoin="round" />
      <path d={toPath(cravPts)} fill="none" stroke="#C62828" strokeWidth="2" strokeLinejoin="round" />
      {moodPts.map(([x, y], i) => (
        <circle key={`m${i}`} cx={x} cy={y} r="2.5" fill="#3A7CA5" />
      ))}
      {cravPts.map(([x, y], i) => (
        <circle key={`c${i}`} cx={x} cy={y} r="2.5" fill="#C62828" />
      ))}
    </svg>
  );
}

function HourHeatmap({ hours }: { hours: number[] }) {
  const set = new Set(hours);
  return (
    <div className="grid grid-cols-12 gap-1">
      {Array.from({ length: 24 }).map((_, h) => (
        <div
          key={h}
          className={`aspect-square rounded flex items-center justify-center text-[10px] ${
            set.has(h) ? 'bg-sol-red text-white' : 'bg-sol-bg text-sol-ink/40'
          }`}
        >
          {h}
        </div>
      ))}
    </div>
  );
}

function CravingHistogram({ checkins }: { checkins: any[] }) {
  const buckets = Array.from({ length: 10 }).map((_, i) => ({
    level: i + 1,
    count: checkins.filter((c) => c.cravingIntensity === i + 1).length,
  }));
  const max = Math.max(1, ...buckets.map((b) => b.count));
  return (
    <div className="flex items-end gap-2 h-32">
      {buckets.map((b) => (
        <div key={b.level} className="flex-1 flex flex-col items-center justify-end">
          <div className="text-[10px] text-sol-ink/50">{b.count || ''}</div>
          <div
            className="w-full bg-sol-red/70 rounded-t"
            style={{ height: `${(b.count / max) * 100}%`, minHeight: b.count ? 4 : 0 }}
          />
          <div className="text-[10px] text-sol-ink/60 mt-1">{b.level}</div>
        </div>
      ))}
    </div>
  );
}
