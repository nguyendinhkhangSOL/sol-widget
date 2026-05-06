// frontend/src/components/views/phaseB/_shared.tsx
// Subcomponents tái dùng cho 5 phase variants (Phase B 88-day).
// TodayCard, StoryCard, MoneySavedCard, NextInsightCard, BodyTimelineCard,
// PatternHeatmapCard, CohortCard, PhaseLogger.
//
// Money saved: hiển thị dấu +/− và 3 màu (green/red/ink-3).

import { useState } from 'react';
import { api, ApiError } from '../../../services/api';
import { QuitlineButton } from '../../QuitlineButton';

export const TRIGGER_LABELS: Record<string, { label: string; emoji: string }> = {
  STRESS: { label: 'Stress', emoji: '😤' },
  EATING: { label: 'Sau cơm', emoji: '🍚' },
  IDLE: { label: 'Rảnh', emoji: '😶' },
  SOCIAL: { label: 'Tụ tập', emoji: '🍺' },
  OTHER: { label: 'Khác', emoji: '·' },
};

export const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

/* ─── SLIP DEDUPE LOCAL STORAGE ─────────────────────────────────────────── */
// Dedupe SlipModal: nếu user đã xem slip với logId này → KHÔNG show lại lúc reload.
// Robust hơn client-only setShowSlip — không miss khi user đóng tab giữa
// logger submit và reload, không show lại khi user F5.

const SLIP_SEEN_KEY = 'sol_slip_seen_log_ids';

export function getSeenSlipIds(): Set<string> {
  try {
    const raw = localStorage.getItem(SLIP_SEEN_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch { return new Set(); }
}

export function markSlipSeen(logId: string) {
  try {
    const seen = getSeenSlipIds();
    seen.add(logId);
    const arr = Array.from(seen).slice(-50); // giới hạn 50 IDs
    localStorage.setItem(SLIP_SEEN_KEY, JSON.stringify(arr));
  } catch { /* ignore */ }
}

/* ─── STAT CELL ──────────────────────────────────────────────────────────── */
export function Stat({
  label, value, accent, sub,
}: {
  label: string;
  value: string;
  accent?: string;
  sub?: string;
}) {
  return (
    <div className="text-center bg-sol-bg rounded-xl py-2.5 px-2">
      <div className="text-[10px] text-sol-ink-3 uppercase tracking-wide">{label}</div>
      <div className="text-h2 font-bold mt-0.5" style={{ color: accent ?? 'inherit' }}>
        {value}
      </div>
      {sub && <div className="text-[10px] text-sol-ink-3">{sub}</div>}
    </div>
  );
}

/* ─── TODAY CARD ─────────────────────────────────────────────────────────── */
export interface TodayCardProps {
  cigsCount: number;
  cigsSkipped: number;
  peakHour: number | null;
  topTrigger: string | null;
  /** Phase-specific accent color cho số điếu chính */
  accent?: string;
  /** Cho phép hide nút "+ Ghi điếu" ở phase 3 (đã bỏ hẳn) */
  showLogger?: boolean;
  onOpenLogger?: () => void;
  /** Phase-specific label thay "Hôm nay" — vd "Hôm nay quan sát" cho Phase 1 */
  title?: string;
}

export function TodayCard({
  cigsCount, cigsSkipped, peakHour, topTrigger,
  accent = '#B25C2C', showLogger = true, onOpenLogger, title = 'Hôm nay',
}: TodayCardProps) {
  return (
    <div className="mx-4 mt-4 bg-sol-paper border border-sol-line rounded-2xl p-4 shadow-card">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-h2 text-sol-ink">{title}</h2>
        {showLogger && onOpenLogger && (
          <button
            onClick={onOpenLogger}
            className="text-meta px-3 py-1.5 rounded-lg bg-sol-green text-white font-semibold hover:brightness-110 active:scale-95 transition"
          >
            + Ghi điếu
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <Stat label="Số điếu" value={String(cigsCount)} accent={accent} />
        <Stat label="Bỏ qua" value={String(cigsSkipped)} accent="#3A7CA5" sub="🎉" />
        <Stat
          label="Peak"
          value={peakHour !== null ? `${peakHour}h` : '—'}
          sub={peakHour !== null ? 'giờ thèm nhất' : ''}
        />
      </div>
      {topTrigger && (
        <div className="flex items-center gap-2 text-meta text-sol-ink-2">
          <span>Trigger chính:</span>
          <span className="px-2 py-0.5 rounded-full bg-sol-orange-soft text-sol-orange-ink font-semibold">
            {TRIGGER_LABELS[topTrigger]?.emoji} {TRIGGER_LABELS[topTrigger]?.label ?? topTrigger}
          </span>
        </div>
      )}
    </div>
  );
}

/* ─── STORY CARD ─────────────────────────────────────────────────────────── */
export function StoryCard({ story, accent = '#B25C2C' }: { story: string[]; accent?: string }) {
  if (!story || story.length === 0) return null;
  return (
    <div
      className="mx-4 mt-3 rounded-2xl p-4 border"
      style={{ backgroundColor: accent + '15', borderColor: accent + '40' }}
    >
      <div className="text-meta font-semibold mb-2" style={{ color: accent }}>
        📖 Sol thấy gì hôm nay
      </div>
      <div className="space-y-1.5">
        {story.map((s, i) => (
          <p key={i} className="text-body text-sol-ink leading-relaxed">{s}</p>
        ))}
      </div>
    </div>
  );
}

/* ─── NEXT INSIGHT CARD ──────────────────────────────────────────────────── */
export function NextInsightCard({ insight }: { insight: string }) {
  return (
    <div className="mx-4 mt-3 bg-sol-blue-soft/40 border border-sol-blue/20 rounded-2xl p-4">
      <div className="text-meta font-semibold text-sol-blue-ink mb-1">💡 Sol gợi ý</div>
      <p className="text-body text-sol-ink leading-relaxed">{insight}</p>
    </div>
  );
}

/* ─── PATTERN HEATMAP ────────────────────────────────────────────────────── */
export function PatternHeatmapCard({
  hourly, cigsAvg7d, accent = '#B25C2C',
}: {
  hourly: number[];
  cigsAvg7d: number;
  accent?: string;
}) {
  const maxValue = Math.max(1, ...hourly);
  return (
    <div className="mx-4 mt-3 bg-sol-paper border border-sol-line rounded-2xl p-4">
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-meta font-semibold text-sol-ink">📊 Bản đồ hành vi 7 ngày</div>
        <div className="text-meta text-sol-ink-3">TB: {cigsAvg7d}/ngày</div>
      </div>
      <div className="flex items-end gap-0.5 h-12">
        {hourly.map((count, hour) => {
          const ratio = count / maxValue;
          const height = Math.max(2, ratio * 48);
          const opacity = count === 0 ? 0.15 : 0.4 + ratio * 0.6;
          return (
            <div
              key={hour}
              className="flex-1 rounded-sm transition-all"
              style={{ height: `${height}px`, backgroundColor: accent, opacity }}
              title={`${hour}h: ${count} điếu`}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-sol-ink-3 mt-1">
        <span>0h</span><span>6h</span><span>12h</span><span>18h</span><span>23h</span>
      </div>
    </div>
  );
}

/* ─── MONEY SAVED CARD — HANDLE NEGATIVE ─────────────────────────────────── */
export interface MoneySavedCardProps {
  moneySaved: number;
  cigsSkipped: number;
  streak: number;
}

export function MoneySavedCard({ moneySaved, cigsSkipped, streak }: MoneySavedCardProps) {
  const isNeg = moneySaved < 0;
  const isZero = moneySaved === 0;
  const sign = isNeg ? '−' : moneySaved > 0 ? '+' : '';
  const colorClass = isNeg ? 'text-sol-red' : isZero ? 'text-sol-ink-3' : 'text-sol-green-ink';
  const bgClass = isNeg
    ? 'bg-sol-red-soft border-sol-red/30'
    : isZero
    ? 'bg-sol-paper border-sol-line'
    : 'bg-sol-green-soft border-sol-green/30';
  const subtitle = isNeg
    ? 'Đây là số thật — Sol không che.'
    : isZero
    ? 'Quan sát đang ổn định.'
    : `${cigsSkipped} lần bỏ qua thành công`;

  return (
    <div className={`mx-4 mt-3 ${bgClass} border rounded-2xl p-4 flex items-center justify-between`}>
      <div>
        <div className="text-meta text-sol-ink-2">💰 Tiết kiệm</div>
        <div className={`text-h1 font-bold mt-1 ${colorClass}`}>
          {sign}{fmt(Math.abs(moneySaved))}đ
        </div>
        <div className="text-[11px] text-sol-ink-3 mt-1 italic">{subtitle}</div>
      </div>
      <div className="text-right">
        <div className="text-meta text-sol-ink-2">🔥 Streak</div>
        <div className="text-h1 font-bold text-sol-orange-ink mt-1">{streak}</div>
        <div className="text-[11px] text-sol-ink-3 mt-1">ngày check-in</div>
      </div>
    </div>
  );
}

/* ─── BODY TIMELINE CARD ─────────────────────────────────────────────────── */
export interface BodyMilestone {
  daysAfterQDay: number;
  emoji: string;
  title: string;
  detail: string;
}

export function BodyTimelineCard({
  unlocked, next, qDayConfirmed,
}: {
  unlocked: BodyMilestone[];
  next: BodyMilestone | null;
  qDayConfirmed: boolean;
}) {
  // Pre-Q-Day: show preview "sẽ unlock sau Q-Day"
  if (!qDayConfirmed) {
    return (
      <div className="mx-4 mt-3 bg-sol-paper border border-sol-line rounded-2xl p-4">
        <div className="text-meta font-semibold text-sol-ink mb-2">🩺 Cơ thể sẽ sửa</div>
        <p className="text-meta text-sol-ink-3 italic mb-3">
          Sau Q-Day (cam kết bỏ hẳn), cơ thể bạn bắt đầu hồi phục theo timeline khoa học CDC/NHS:
        </p>
        <div className="space-y-1.5 opacity-60">
          {next && (
            <div className="flex items-start gap-2 text-meta">
              <span className="text-xl shrink-0" aria-hidden="true">{next.emoji}</span>
              <div>
                <div className="text-sol-ink font-semibold">{next.title}</div>
                <div className="text-[11px] text-sol-ink-3">{next.detail}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4 mt-3 bg-sol-paper border border-sol-line rounded-2xl p-4">
      <div className="text-meta font-semibold text-sol-ink mb-3">🩺 Cơ thể đang sửa</div>
      <div className="space-y-2">
        {unlocked.map((m) => (
          <div key={m.daysAfterQDay} className="flex items-start gap-2 text-meta">
            <span className="text-sol-green-ink">✓</span>
            <span className="text-xl shrink-0" aria-hidden="true">{m.emoji}</span>
            <div className="flex-1">
              <div className="text-sol-ink font-semibold">
                Sau {m.daysAfterQDay} ngày — {m.title}
              </div>
              <div className="text-[11px] text-sol-ink-3">{m.detail}</div>
            </div>
          </div>
        ))}
        {next && (
          <div className="flex items-start gap-2 text-meta opacity-60 mt-3 pt-3 border-t border-sol-line">
            <span className="text-sol-ink-3">○</span>
            <span className="text-xl shrink-0">{next.emoji}</span>
            <div className="flex-1">
              <div className="text-sol-ink-2 font-semibold">{next.title}</div>
              <div className="text-[11px] text-sol-ink-3">Mở khoá sau {next.daysAfterQDay} ngày</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── COHORT CARD ────────────────────────────────────────────────────────── */
export function CohortCard({
  cohort, mentorMode = false,
}: {
  cohort: Array<{ pseudonym: string; dayInJourney: number; stageLabel: string }>;
  mentorMode?: boolean;
}) {
  if (cohort.length === 0) return null;
  return (
    <div className="mx-4 mt-3 bg-sol-paper border border-sol-line rounded-2xl p-4">
      <div className="text-meta font-semibold text-sol-ink mb-2">
        🤝 Đội Sol — {cohort.length} đồng đội
      </div>
      <div className="space-y-1.5">
        {cohort.slice(0, 5).map((c) => (
          <div key={c.pseudonym} className="flex items-center justify-between text-meta">
            <span className="text-sol-ink">{c.pseudonym}</span>
            <span className="text-sol-ink-3">
              {c.stageLabel}
            </span>
          </div>
        ))}
        {cohort.length > 5 && (
          <div className="text-[11px] text-sol-ink-3">+ {cohort.length - 5} đồng đội khác</div>
        )}
      </div>
      <p className="text-[11px] text-sol-ink-3 mt-2 italic">
        {mentorMode
          ? 'Bạn là người vững — Sol gợi bạn chia sẻ với đồng đội mới.'
          : 'Bạn không cô đơn.'}
      </p>
    </div>
  );
}

/* ─── CIGARETTE LOGGER MODAL ─────────────────────────────────────────────── */
export interface CigaretteLoggerProps {
  onClose: () => void;
  onLogged: () => void;
  /** Phase 3-4: gắn slip context — vẫn cho phép log nhưng cảnh báo "đã hút" sẽ
   * hiển thị slip modal compassion thay vì bình thường. Quản lý ở component cha. */
}

export function CigaretteLogger({ onClose, onLogged }: CigaretteLoggerProps) {
  const [trigger, setTrigger] = useState<string | null>(null);
  const [skipped, setSkipped] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await api.logCigarette({
        trigger: (trigger as any) ?? undefined,
        skipped,
      });
      onLogged();
    } catch (e) {
      setError(e instanceof ApiError ? `Lỗi ${e.status}` : 'Không lưu được. Mạng?');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-sol-bg rounded-t-2xl w-full max-w-md p-5 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-h2 text-sol-ink mb-3">
          {skipped ? '🎉 Bỏ qua điếu này' : '🚬 Vừa hút 1 điếu'}
        </h3>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setSkipped(false)}
            className={`flex-1 min-h-tap py-2 rounded-lg text-meta font-semibold ${
              !skipped ? 'bg-sol-orange text-white' : 'bg-sol-paper border border-sol-line text-sol-ink-2'
            }`}
          >
            Đã hút
          </button>
          <button
            onClick={() => setSkipped(true)}
            className={`flex-1 min-h-tap py-2 rounded-lg text-meta font-semibold ${
              skipped ? 'bg-sol-green text-white' : 'bg-sol-paper border border-sol-line text-sol-ink-2'
            }`}
          >
            Bỏ qua được
          </button>
        </div>

        <div className="text-meta font-semibold text-sol-ink mb-2">Lúc đó:</div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {Object.entries(TRIGGER_LABELS).map(([key, info]) => (
            <button
              key={key}
              onClick={() => setTrigger(trigger === key ? null : key)}
              className={`min-h-tap py-2.5 px-3 rounded-lg text-meta border transition ${
                trigger === key
                  ? 'bg-sol-orange-soft border-sol-orange text-sol-earth-ink font-semibold'
                  : 'bg-sol-paper border-sol-line text-sol-ink-2 hover:bg-sol-soft'
              }`}
            >
              {info.emoji} {info.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="text-meta text-sol-red mb-3">{error}</div>
        )}

        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 min-h-tap py-2.5 rounded-lg bg-sol-paper border border-sol-line text-sol-ink-2"
          >
            Huỷ
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 min-h-tap py-2.5 rounded-lg bg-sol-green text-white font-semibold disabled:opacity-50"
          >
            {saving ? 'Đang lưu…' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── SLIP MODAL — Phase 3-4 khi user log "đã hút" ───────────────────────── */
export function SlipModal({
  pronouns = 'bạn',
  onClose,
}: {
  pronouns?: string;
  onClose: () => void;
}) {
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-sol-bg rounded-2xl w-full max-w-md p-6 shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-5xl text-center mb-3" aria-hidden="true">🌱</div>
        <h3 className="text-h2 text-sol-ink text-center mb-3">Không sao {pronouns}</h3>
        <p className="text-body text-sol-ink-2 leading-relaxed mb-4">
          Sol thấy {pronouns} vừa hút. Đây không phải thất bại — chỉ là 1 lần trượt.
          Đồng hồ tự do sẽ reset nhẹ nhàng.
        </p>
        <p className="text-body text-sol-ink-2 leading-relaxed mb-5">
          {cap(pronouns)} đã đi rất xa. Mai bắt đầu lại — Sol vẫn bên cạnh.
        </p>
        <button
          onClick={onClose}
          className="w-full min-h-tap py-3 rounded-xl bg-sol-green text-white font-semibold"
        >
          Tiếp tục đi
        </button>

        {/* Quitline escape hatch — nếu user vấp nhiều, cần human support */}
        <div className="mt-3 pt-3 border-t border-sol-line">
          <div className="text-meta text-sol-ink-3 text-center mb-2 italic">
            Cần nói chuyện với chuyên gia?
          </div>
          <QuitlineButton size="compact" tone="calm" />
        </div>
      </div>
    </div>
  );
}

/* ─── EXIT MODAL ─────────────────────────────────────────────────────────── */
export function ExitModal({
  pronouns = 'bạn', dayInJourney,
  onClose, onExited,
}: {
  pronouns?: string;
  dayInJourney: number;
  onClose: () => void;
  onExited: () => void;
}) {
  const [reason, setReason] = useState('');
  const [exiting, setExiting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function exit() {
    if (!confirm('Sol sẽ tạo hồ sơ tiến bộ và lưu lại. Bạn có thể quay lại bất kỳ lúc nào — Sol vẫn nhớ. Tiếp tục?')) return;
    setExiting(true);
    setError(null);
    try {
      await api.exitJourney(reason || undefined);
      onExited();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? `Lỗi ${e.status}` : 'Không lưu được.');
    } finally {
      setExiting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-sol-bg rounded-2xl w-full max-w-md p-5 shadow-pop" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-h2 text-sol-ink mb-2">Tạm dừng hành trình</h3>
        <p className="text-meta text-sol-ink-2 mb-4">
          {pronouns === 'bạn' ? 'Bạn' : pronouns.charAt(0).toUpperCase() + pronouns.slice(1)} đã đi cùng Sol{' '}
          <strong>{dayInJourney} ngày</strong>. Sol sẽ tạo bản nhật ký tiến bộ và tặng {pronouns}.
        </p>

        <label className="text-meta font-semibold text-sol-ink block mb-1">Lý do (tuỳ chọn)</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Vd: Cần nghỉ vài tuần... Sẽ quay lại sau..."
          rows={3}
          maxLength={500}
          className="w-full border border-sol-line rounded-lg px-3 py-2 text-body bg-sol-paper mb-4"
        />

        {error && <div className="text-meta text-sol-red mb-3">{error}</div>}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={exiting}
            className="flex-1 min-h-tap py-2.5 rounded-lg bg-sol-paper border border-sol-line text-sol-ink"
          >
            Tiếp tục đi
          </button>
          <button
            onClick={exit}
            disabled={exiting}
            className="flex-1 min-h-tap py-2.5 rounded-lg bg-sol-wine text-white font-semibold disabled:opacity-50"
          >
            {exiting ? 'Đang lưu…' : 'Tạm dừng & nhận hồ sơ'}
          </button>
        </div>
      </div>
    </div>
  );
}
