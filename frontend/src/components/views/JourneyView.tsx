// frontend/src/components/views/JourneyView.tsx
// 30-day journey view: grid + mood chart + streak + day detail modal.

import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { useStore } from '../../state/store';
import { api } from '../../services/api';
import type { RoadmapDay } from '../../types';

interface CheckinRow {
  date: string;
  dayNumber: number;
  smoked: boolean;
  cravingIntensity: number;
  mood: number;
  note?: string | null;
  isSickDay?: boolean;
}

export function JourneyView() {
  const user = useStore((s) => s.user);
  const [roadmap, setRoadmap] = useState<RoadmapDay[]>([]);
  const [checkins, setCheckins] = useState<CheckinRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDay, setOpenDay] = useState<number | null>(null);

  // Re-fetch khi user.lastCheckinDate đổi (sau khi user submit check-in từ
  // tab khác → JourneyView tự refresh, không stale data).
  useEffect(() => {
    Promise.all([api.getRoadmap(), api.getMessages(1).catch(() => null)])
      .then(async ([rm]) => {
        setRoadmap(rm.days ?? []);
        // Fetch song song: history + today (today riêng để source-of-truth
        // cho hôm nay — tránh trường hợp /checkins history sót do timezone).
        try {
          const baseUrl = (api as any).baseUrl ?? '';
          const headers = {
            Authorization: `Bearer ${localStorage.getItem('sol_token')}`,
          };
          const [historyRes, todayRes] = await Promise.all([
            fetch(`${baseUrl}/checkins`, { headers }),
            fetch(`${baseUrl}/checkins/today`, { headers }),
          ]);
          const history = await historyRes.json();
          const today = await todayRes.json();

          let merged: CheckinRow[] = history.checkins ?? [];
          // Nếu today có checkin nhưng không có trong history → add vào
          if (today.checkin) {
            const existsInHistory = merged.some(
              (c) => c.dayNumber === today.checkin.dayNumber,
            );
            if (!existsInHistory) merged = [...merged, today.checkin];
          }
          setCheckins(merged);
        } catch {}
      })
      .finally(() => setLoading(false));
  }, [user?.lastCheckinDate]);

  const byDay = useMemo(() => {
    const m = new Map<number, CheckinRow>();
    for (const c of checkins) m.set(c.dayNumber, c);
    return m;
  }, [checkins]);

  const stats = useMemo(() => {
    const done = checkins.length;
    const clean = checkins.filter((c) => !c.smoked).length;
    const avgMood = done ? checkins.reduce((s, c) => s + c.mood, 0) / done : 0;
    const avgCraving = done ? checkins.reduce((s, c) => s + c.cravingIntensity, 0) / done : 0;
    return { done, clean, avgMood, avgCraving };
  }, [checkins]);

  const dayNumber = user?.quitDate
    ? Math.max(1, Math.min(30, Math.floor((Date.now() - new Date(user.quitDate).getTime()) / 86400000) + 1))
    : 1;

  if (loading) return <Center>Đang tải hành trình…</Center>;

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Header summary */}
      <div className="bg-white rounded-2xl p-4 border border-black/5">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-sol-ink/50">Ngày thứ</div>
            <div className="text-3xl font-bold text-sol-green">{dayNumber}<span className="text-base text-sol-ink/50">/30</span></div>
          </div>
          <div className="text-right">
            <div className="text-xs text-sol-ink/50">Chuỗi</div>
            <div className="text-2xl font-semibold text-sol-orange">{user?.checkinStreak ?? 0}🔥</div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <Stat label="Check-in" value={`${stats.done}/${dayNumber}`} />
          <Stat label="Ngày sạch" value={`${stats.clean}/${stats.done || 1}`} />
          <Stat
            label="Thèm TB"
            value={stats.avgCraving ? stats.avgCraving.toFixed(1) : '—'}
          />
        </div>
        {user?.refundEligible === false && (
          <div className="mt-3 text-[11px] p-2 rounded-lg bg-sol-red/10 text-sol-red">
            ⚠️ Đã bỏ check-in quá 1 ngày — hiện không còn đủ điều kiện refund.
          </div>
        )}
      </div>

      {/* 30-day grid */}
      <div className="bg-white rounded-2xl p-4 border border-black/5">
        <div className="text-xs uppercase tracking-wider text-sol-ink/50 mb-2">30 ngày</div>
        <div className="grid grid-cols-6 gap-1.5">
          {Array.from({ length: 30 }).map((_, i) => {
            const day = i + 1;
            const rm = roadmap.find((r) => r.day === day);
            const ci = byDay.get(day);
            const isToday = day === dayNumber;
            const isLocked = day > dayNumber;
            const status: 'done' | 'clean' | 'slip' | 'missed' | 'today' | 'locked' = isLocked
              ? 'locked'
              : isToday && !ci
              ? 'today'
              : !ci
              ? 'missed'
              : ci.smoked
              ? 'slip'
              : 'clean';
            return (
              <button
                key={day}
                onClick={() => setOpenDay(day)}
                className={clsx(
                  'aspect-square rounded-lg text-xs font-semibold flex items-center justify-center border transition',
                  status === 'clean' && 'bg-sol-green text-white border-sol-green',
                  status === 'slip' && 'bg-sol-orange/80 text-white border-sol-orange',
                  status === 'missed' && 'bg-sol-red/10 text-sol-red/60 border-sol-red/20 line-through',
                  status === 'today' && 'bg-white border-sol-green border-2 text-sol-green animate-pulse',
                  status === 'locked' && 'bg-sol-ink/5 text-sol-ink/30 border-transparent'
                )}
                aria-label={`Ngày ${day}`}
              >
                {day}
              </button>
            );
          })}
        </div>
        <LegendRow />
      </div>

      {/* Mood + Craving trend chart */}
      <div className="bg-white rounded-2xl p-4 border border-black/5">
        <div className="text-xs uppercase tracking-wider text-sol-ink/50 mb-2">Tâm trạng & Cơn thèm</div>
        <TrendChart checkins={checkins} days={dayNumber} />
        <div className="mt-2 flex items-center gap-3 text-[11px] text-sol-ink/60">
          <LegendDot color="bg-sol-blue" label="Tâm trạng (1–5)" />
          <LegendDot color="bg-sol-red" label="Thèm (1–10)" />
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-white rounded-2xl p-4 border border-black/5">
        <div className="text-xs uppercase tracking-wider text-sol-ink/50 mb-2">Cột mốc</div>
        <MilestoneList dayNumber={dayNumber} />
      </div>

      {openDay !== null && (
        <DayDetail
          day={openDay}
          checkin={byDay.get(openDay)}
          isToday={openDay === dayNumber}
          onCheckinClick={() => {
            setOpenDay(null);
            useStore.getState().setView('checkin');
          }}
          onClose={() => setOpenDay(null)}
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-sol-bg rounded-lg p-2">
      <div className="text-[10px] uppercase text-sol-ink/50">{label}</div>
      <div className="text-sm font-semibold text-sol-ink">{value}</div>
    </div>
  );
}

function LegendRow() {
  const items = [
    { cls: 'bg-sol-green', label: 'Sạch' },
    { cls: 'bg-sol-orange/80', label: 'Có hút' },
    { cls: 'bg-sol-red/10 border border-sol-red/30', label: 'Bỏ' },
    { cls: 'bg-white border-2 border-sol-green', label: 'Hôm nay' },
    { cls: 'bg-sol-ink/10', label: 'Sắp tới' },
  ];
  return (
    <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-sol-ink/60">
      {items.map((x, i) => (
        <div key={i} className="flex items-center gap-1">
          <span className={`w-3 h-3 rounded ${x.cls}`} /> {x.label}
        </div>
      ))}
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

function TrendChart({ checkins, days }: { checkins: CheckinRow[]; days: number }) {
  const width = 300;
  const height = 100;
  const pad = 4;
  const n = Math.max(1, days);

  const byDay = new Map<number, CheckinRow>();
  for (const c of checkins) byDay.set(c.dayNumber, c);

  const moodPts: [number, number][] = [];
  const cravPts: [number, number][] = [];
  for (let d = 1; d <= n; d++) {
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
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24">
      {/* baseline */}
      <line x1={pad} x2={width - pad} y1={height / 2} y2={height / 2} stroke="#00000010" strokeDasharray="2 3" />
      <path d={toPath(moodPts)} fill="none" stroke="#3A7CA5" strokeWidth="1.8" strokeLinejoin="round" />
      <path d={toPath(cravPts)} fill="none" stroke="#C62828" strokeWidth="1.8" strokeLinejoin="round" />
      {moodPts.map(([x, y], i) => (
        <circle key={`m${i}`} cx={x} cy={y} r="1.8" fill="#3A7CA5" />
      ))}
      {cravPts.map(([x, y], i) => (
        <circle key={`c${i}`} cx={x} cy={y} r="1.8" fill="#C62828" />
      ))}
    </svg>
  );
}

function MilestoneList({ dayNumber }: { dayNumber: number }) {
  const milestones = [
    { day: 1, label: 'Quyết định cai — ngày khởi đầu' },
    { day: 3, label: '72 giờ — nicotine đã rời cơ thể' },
    { day: 7, label: 'Hết giai đoạn cooling, refund gate mở' },
    { day: 14, label: 'Vị giác & khứu giác rõ nét lại' },
    { day: 21, label: 'Thói quen mới ổn định' },
    { day: 30, label: 'Hoàn thành liệu trình — nhận bonus hoàn thành' },
  ];
  return (
    <ul className="space-y-2">
      {milestones.map((m) => {
        const passed = dayNumber >= m.day;
        const isNext = !passed && milestones.findIndex((x) => dayNumber < x.day) === milestones.indexOf(m);
        return (
          <li key={m.day} className="flex items-start gap-2 text-sm">
            <span
              className={clsx(
                'mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0',
                passed ? 'bg-sol-green text-white' : isNext ? 'bg-sol-orange text-white' : 'bg-sol-ink/10 text-sol-ink/40'
              )}
            >
              {passed ? '✓' : m.day}
            </span>
            <div className="flex-1">
              <div className={clsx(passed ? 'text-sol-ink' : 'text-sol-ink/60')}>{m.label}</div>
              <div className="text-[10px] text-sol-ink/40">Ngày {m.day}</div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function DayDetail({
  day,
  checkin,
  isToday,
  onCheckinClick,
  onClose,
}: {
  day: number;
  checkin?: CheckinRow;
  isToday: boolean;
  onCheckinClick: () => void;
  onClose: () => void;
}) {
  const [dayContent, setDayContent] = useState<any>(null);
  useEffect(() => {
    api.getDailyContent(day).then(setDayContent).catch(() => {});
  }, [day]);

  return (
    <div
      className="absolute inset-0 bg-black/40 flex items-end justify-center z-10"
      onClick={onClose}
    >
      <div
        className="w-full max-h-[85%] bg-white rounded-t-2xl overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white px-4 py-3 border-b border-black/5 flex items-center justify-between">
          <div className="font-semibold text-sol-ink">
            Ngày {day}
            {isToday && (
              <span className="ml-2 text-[10px] uppercase font-bold text-sol-green bg-sol-green/10 px-1.5 py-0.5 rounded">
                Hôm nay
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-sol-ink/50 hover:text-sol-ink">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="p-4 space-y-3 text-sm">
          {/* CTA Check-in — chỉ hiện khi là ngày hôm nay + chưa check-in.
              Tiết kiệm cho user 2 step (đóng modal → HomeView → Check-in). */}
          {isToday && !checkin && (
            <div className="bg-sol-orange/10 rounded-xl p-3 border border-sol-orange/30">
              <div className="text-sol-orange-ink font-semibold text-sm mb-1">
                ⚠️ Bạn chưa check-in hôm nay
              </div>
              <p className="text-xs text-sol-ink/70 mb-2.5 leading-relaxed">
                30 giây để giữ chuỗi và Sol biết bạn ổn.
              </p>
              <button
                onClick={onCheckinClick}
                className="w-full py-2.5 rounded-lg bg-sol-orange text-white font-semibold text-sm hover:opacity-90 transition"
              >
                ✅ Check-in 30 giây →
              </button>
            </div>
          )}

          {checkin ? (
            <>
              <Row label="Có hút?" val={checkin.smoked ? 'Có' : 'Không'} tone={checkin.smoked ? 'red' : 'green'} />
              <Row label="Cơn thèm cao nhất" val={`${checkin.cravingIntensity}/10`} />
              <Row label="Tâm trạng" val={`${['😣','🙁','😐','🙂','😄'][checkin.mood - 1]} (${checkin.mood}/5)`} />
              {checkin.isSickDay && <Row label="Ngày ốm" val="Được miễn chuỗi" tone="orange" />}
              {checkin.note && (
                <div>
                  <div className="text-[11px] text-sol-ink/50">Ghi chú</div>
                  <div className="bg-sol-bg p-2 rounded text-sol-ink/80 whitespace-pre-wrap">{checkin.note}</div>
                </div>
              )}
            </>
          ) : (
            <div className="text-sol-ink/50 italic">Không có check-in cho ngày này.</div>
          )}

          {dayContent?.content && (
            <div className="pt-3 border-t border-black/5">
              <div className="text-[11px] uppercase tracking-wider text-sol-ink/50 mb-2">Nội dung ngày này</div>
              {Object.entries(dayContent.content).map(([mod, items]: any) =>
                items.length ? (
                  <div key={mod} className="mb-2">
                    <div className="text-[11px] font-semibold text-sol-ink/70">{labelFor(mod)}</div>
                    {items.map((it: any) => (
                      <div key={it.id} className="text-xs text-sol-ink/70 mt-1">
                        • {it.title}
                      </div>
                    ))}
                  </div>
                ) : null
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, val, tone }: { label: string; val: string; tone?: 'green' | 'red' | 'orange' }) {
  const toneClass =
    tone === 'green' ? 'text-sol-green' : tone === 'red' ? 'text-sol-red' : tone === 'orange' ? 'text-sol-orange' : 'text-sol-ink';
  return (
    <div className="flex items-center justify-between">
      <span className="text-sol-ink/60">{label}</span>
      <span className={`font-medium ${toneClass}`}>{val}</span>
    </div>
  );
}

function labelFor(mod: string) {
  const map: Record<string, string> = {
    MORNING_GOAL: '☀️ Mục tiêu sáng',
    SCIENCE_TIP: '💡 Góc khoa học',
    PHENOMENA_ALERT: '⚠️ Có thể xảy ra',
    EXERCISE: '📒 Bài tập',
    NIGHT_STORY: '🌙 Khép ngày',
  };
  return map[mod] ?? mod;
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="h-full flex items-center justify-center p-5">{children}</div>;
}
