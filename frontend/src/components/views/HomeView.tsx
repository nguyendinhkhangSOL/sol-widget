// frontend/src/components/views/HomeView.tsx
// Màn hình đầu tiên của widget — thiết kế theo nguyên tắc "Personalized User GUI":
//   1. Trên cùng: Status / Identity — gương soi thành công (body clock + streak + money)
//   2. Giữa: Actionable cards — bài tập hôm nay / chuẩn bị / SOS hot links
//   3. Dưới cùng: Chat composer tối giản + prompt chips (mồi nhử)
//
// Khi người dùng gõ hoặc chạm chip, tin nhắn được gửi và view tự chuyển sang ChatView
// (nơi full thread sống). Home là nơi quyết định — Chat là nơi đối thoại.
//
// Luồng cá nhân hoá:
//   - Có quitDate  → In-journey: hero body-clock, day-N card, milestone chip
//   - Chưa quitDate → Pre-journey: setup card, FTND, 3 lý do, wiki tìm hiểu

import { useMemo, useState } from 'react';
import { useStore } from '../../state/store';
import { api } from '../../services/api';
import type { Message } from '../../types';
import {
  currentMilestone,
  nextMilestone,
  progressToNext,
  hoursSober,
  daysSober,
  moneySaved,
  formatVnd,
  greetingFor,
} from '../../lib/bodyClock';
import {
  pickContextPrompts,
  PRE_JOURNEY_PROMPTS,
  SOS_PROMPTS,
  FAQ_PROMPTS,
  type Prompt,
} from '../../lib/promptBank';

export function HomeView() {
  const user = useStore((s) => s.user);
  const setView = useStore((s) => s.setView);
  const addMessage = useStore((s) => s.addMessage);
  const setTyping = useStore((s) => s.setTyping);
  const hasJourney = !!user?.quitDate;

  /* Hero computations ------------------------------------------- */
  const hero = useMemo(() => {
    const cur = currentMilestone(user?.quitDate);
    const nxt = nextMilestone(user?.quitDate);
    const pct = progressToNext(user?.quitDate);
    const h = hoursSober(user?.quitDate);
    const d = daysSober(user?.quitDate);
    return { cur, nxt, pct, hours: h, days: d };
  }, [user?.quitDate]);

  const money = useMemo(
    () =>
      moneySaved({
        quitDate: user?.quitDate,
        cigsPerDay: user?.settings?.cigsPerDay,
        pricePerCig: user?.settings?.pricePerCig,
      }),
    [user?.quitDate, user?.settings?.cigsPerDay, user?.settings?.pricePerCig],
  );

  const contextChips = useMemo(() => pickContextPrompts(user), [user]);

  /* Composer ---------------------------------------------------- */
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  async function sendText(text: string) {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);

    // Chuyển view vào chat trước để thread hiển thị
    setView('chat');

    // Optimistic render
    const optimistic: Message = {
      id: `tmp-${Date.now()}`,
      role: 'USER',
      type: 'CHAT',
      content,
      createdAt: new Date().toISOString(),
    };
    addMessage(optimistic);
    setTyping(true);
    try {
      await api.sendMessage(content);
    } catch (err) {
      addMessage({
        id: `err-${Date.now()}`,
        role: 'SYSTEM',
        type: 'SYSTEM_NOTE' as any,
        content: 'Không gửi được. Kiểm tra kết nối rồi thử lại.',
        createdAt: new Date().toISOString(),
      });
    } finally {
      setSending(false);
      setTyping(false);
      setDraft('');
    }
  }

  function onChipClick(p: Prompt) {
    if (p.kind === 'chat' && p.send) {
      sendText(p.send);
    } else if (p.kind === 'view' && p.view) {
      setView(p.view);
    } else if (p.kind === 'wiki' && p.url) {
      window.open(p.url, '_blank', 'noopener,noreferrer');
    } else if (p.kind === 'sos') {
      setView('crisis');
    }
  }

  return (
    <div className="h-full flex flex-col bg-sol-bg">
      {/* ══════════════ TẦNG TRÊN — Gương soi thành công ══════════════ */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-4 pb-2 space-y-3">
        <HeroStrip user={user} hero={hero} money={money} />

        {/* ══════════════ TẦNG GIỮA — Actionable Cards ══════════════ */}
        {hasJourney ? (
          <InJourneyCards user={user!} onOpenView={setView} onChip={onChipClick} />
        ) : (
          <PreJourneyCards onOpenView={setView} onChip={onChipClick} />
        )}

        {/* Hàng SOS luôn hiển thị */}
        <SosRow onChip={onChipClick} />

        {/* FAQ / "Câu hỏi hay gặp" — khi cuộn xuống */}
        <FaqStrip onChip={onChipClick} />

        <FootnoteLine />
      </div>

      {/* ══════════════ TẦNG DƯỚI — Chat composer ══════════════ */}
      <Composer
        draft={draft}
        setDraft={setDraft}
        sending={sending}
        chips={contextChips}
        onChip={onChipClick}
        onSend={() => sendText(draft)}
        hasJourney={hasJourney}
      />
    </div>
  );
}

/* ─── HERO STRIP ────────────────────────────────────────────── */

function HeroStrip({
  user,
  hero,
  money,
}: {
  user: ReturnType<typeof useStore.getState>['user'];
  hero: {
    cur: ReturnType<typeof currentMilestone>;
    nxt: ReturnType<typeof nextMilestone>;
    pct: number;
    hours: number;
    days: number;
  };
  money: number;
}) {
  const { cur, nxt, pct, hours, days } = hero;
  const name = user?.name;
  const pronoun = user?.pronouns ?? 'bạn';
  const greeting = greetingFor(name, pronoun);
  const hasJourney = !!user?.quitDate;

  return (
    <section
      className="rounded-2xl overflow-hidden shadow-sm border border-black/5"
      style={{
        background: `linear-gradient(135deg, ${cur.color}, ${cur.color}dd)`,
      }}
    >
      <div className="p-4 text-white">
        <div className="text-[11px] opacity-80">{greeting}</div>
        <div className="flex items-start gap-3 mt-1">
          <div className="h-11 w-11 rounded-xl bg-white/20 border border-white/25 flex items-center justify-center text-xl shrink-0">
            {cur.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-bold leading-tight">
              {hasJourney ? cur.headline : 'Sẵn sàng bắt đầu — Sol đi cùng bạn.'}
            </div>
            <div className="text-[11px] opacity-85 mt-0.5 leading-relaxed">
              {hasJourney
                ? cur.science
                : 'Khi bạn đặt ngày bắt đầu, đồng hồ cơ thể sẽ đếm cùng bạn từng giờ.'}
            </div>
            {cur.wiki && hasJourney && (
              <a
                href={cur.wiki}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] opacity-80 underline hover:opacity-100 inline-block mt-1"
              >
                Đọc thêm →
              </a>
            )}
          </div>
        </div>

        {/* Progress tới mốc tiếp theo */}
        {hasJourney && nxt && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-[10px] opacity-85 mb-1">
              <span>
                Đã vượt: <strong>{cur.label}</strong>
              </span>
              <span>
                Tới <strong>{nxt.label}</strong> · {pct}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full bg-white/90 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Hàng số liệu: ngày · tiền · streak */}
      {hasJourney && (
        <div className="grid grid-cols-3 bg-white/10 border-t border-white/15 text-white">
          <Stat label="Ngày" value={`${days}`} sub="không thuốc" />
          <StatDivider />
          <Stat label="Streak" value={`${user?.checkinStreak ?? 0}`} sub="🔥 check-in" />
          <StatDivider />
          <Stat label="Tiết kiệm" value={formatVnd(money)} sub={`~${Math.round(hours)} giờ`} />
        </div>
      )}
    </section>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="py-2 px-2 text-center">
      <div className="text-[10px] uppercase opacity-75 tracking-wide">{label}</div>
      <div className="text-sm font-bold tabular-nums leading-tight">{value}</div>
      <div className="text-[9px] opacity-75 leading-tight">{sub}</div>
    </div>
  );
}
function StatDivider() {
  return <div className="w-px bg-white/15 my-1" />;
}

/* ─── IN-JOURNEY CARDS ──────────────────────────────────────── */

function InJourneyCards({
  user,
  onOpenView,
  onChip,
}: {
  user: NonNullable<ReturnType<typeof useStore.getState>['user']>;
  onOpenView: (v: any) => void;
  onChip: (p: Prompt) => void;
}) {
  const d = user.dayNumber ?? Math.max(1, daysSober(user.quitDate) + 1);
  const capped = Math.min(30, d);

  return (
    <section className="space-y-3">
      {/* Bài tập hôm nay */}
      <button
        onClick={() => onOpenView('exercise')}
        className="w-full rounded-2xl bg-white border border-black/5 shadow-sm p-4 flex items-start gap-3 text-left hover:border-sol-green/30 active:scale-[0.99] transition"
      >
        <div className="h-10 w-10 rounded-xl bg-sol-green/10 text-sol-green flex items-center justify-center text-lg shrink-0">
          🎯
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase text-sol-green font-bold tracking-wide">
            Ngày {capped} / 30 · Bài tập hôm nay
          </div>
          <div className="text-sm font-semibold text-sol-ink mt-0.5 leading-tight">
            5 phút để vượt qua hôm nay
          </div>
          <div className="text-[11px] text-sol-ink/60 mt-1">
            Sol chọn sẵn bài phù hợp ngày {capped}. Mở để bắt đầu.
          </div>
        </div>
        <div className="text-sol-ink/30 text-xl shrink-0">→</div>
      </button>

      {/* Check-in + Sổ tay: 2 cột */}
      <div className="grid grid-cols-2 gap-3">
        <ActionMini
          icon="✅"
          color="#43A047"
          label="Check-in 30s"
          sub="Điểm lại hôm nay"
          onClick={() => onOpenView('checkin')}
        />
        <ActionMini
          icon="📖"
          color="#3A7CA5"
          label="Sổ tay 30 ngày"
          sub="Xem / in ra sách"
          onClick={() => onChip({
            id: 'open-workbook',
            kind: 'wiki',
            icon: '📖',
            label: '',
            url: '/dashboard/workbook',
          })}
        />
      </div>

      {/* Hành trình tổng thể */}
      <button
        onClick={() => onOpenView('journey')}
        className="w-full rounded-xl bg-white border border-black/5 p-3 flex items-center gap-3 text-left hover:bg-sol-bg active:scale-[0.99] transition"
      >
        <div className="h-8 w-8 rounded-lg bg-sol-orange/10 text-sol-orange flex items-center justify-center">
          🗺️
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-sol-ink">
            Hành trình 30 ngày
          </div>
          <div className="text-[11px] text-sol-ink/55">
            Xem toàn bộ lộ trình · mốc đã qua · mốc sắp tới
          </div>
        </div>
        <div className="text-sol-ink/30 shrink-0">›</div>
      </button>
    </section>
  );
}

/* ─── PRE-JOURNEY CARDS ─────────────────────────────────────── */

function PreJourneyCards({
  onOpenView: _onOpenView,
  onChip,
}: {
  onOpenView: (v: any) => void;
  onChip: (p: Prompt) => void;
}) {
  return (
    <section className="space-y-3">
      {/* Đặt ngày bắt đầu — CTA chính */}
      <button
        onClick={() => onChip(PRE_JOURNEY_PROMPTS.find((p) => p.id === 'pre-set-date')!)}
        className="w-full rounded-2xl p-4 flex items-start gap-3 text-left shadow-sm active:scale-[0.99] transition text-white"
        style={{ background: 'linear-gradient(135deg, #E8812E, #F57C00)' }}
      >
        <div className="h-10 w-10 rounded-xl bg-white/20 border border-white/25 flex items-center justify-center text-lg shrink-0">
          📅
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase opacity-85 font-bold tracking-wide">
            Bước 1 · Chuẩn bị
          </div>
          <div className="text-sm font-bold mt-0.5 leading-tight">
            Đặt ngày bắt đầu bỏ thuốc
          </div>
          <div className="text-[11px] opacity-85 mt-1">
            Khi bạn chọn ngày, Sol sẽ dẫn bạn qua 3 ngày chuẩn bị trước đó.
          </div>
        </div>
        <div className="opacity-70 text-xl shrink-0">→</div>
      </button>

      {/* Tìm lý do */}
      <button
        onClick={() => onChip(PRE_JOURNEY_PROMPTS.find((p) => p.id === 'pre-reasons')!)}
        className="w-full rounded-xl bg-white border border-black/5 p-3 flex items-start gap-3 text-left hover:border-sol-orange/30 active:scale-[0.99] transition"
      >
        <div className="h-8 w-8 rounded-lg bg-sol-orange/10 text-sol-orange flex items-center justify-center text-sm shrink-0">
          💡
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-sol-ink">Tìm 3 lý do đủ mạnh</div>
          <div className="text-[11px] text-sol-ink/55 mt-0.5">
            Sol sẽ hỏi bạn vài câu để tìm ra lý do thật — không chỉ là lý do trên mặt.
          </div>
        </div>
        <div className="text-sol-ink/30 shrink-0">›</div>
      </button>

      {/* FTND */}
      <button
        onClick={() => onChip(PRE_JOURNEY_PROMPTS.find((p) => p.id === 'pre-addiction-level')!)}
        className="w-full rounded-xl bg-white border border-black/5 p-3 flex items-start gap-3 text-left hover:border-sol-blue/30 active:scale-[0.99] transition"
      >
        <div className="h-8 w-8 rounded-lg bg-sol-blue/10 text-sol-blue flex items-center justify-center text-sm shrink-0">
          🧬
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-sol-ink">Đánh giá mức phụ thuộc</div>
          <div className="text-[11px] text-sol-ink/55 mt-0.5">
            6 câu hỏi nhanh (FTND) để biết cơ thể nghiện ở mức nào — kế hoạch sẽ phù hợp hơn.
          </div>
        </div>
        <div className="text-sol-ink/30 shrink-0">›</div>
      </button>

      {/* Tuần đầu sẽ thế nào */}
      <button
        onClick={() => onChip(PRE_JOURNEY_PROMPTS.find((p) => p.id === 'pre-what-expect')!)}
        className="w-full rounded-xl bg-white border border-black/5 p-3 flex items-start gap-3 text-left hover:border-sol-green/30 active:scale-[0.99] transition"
      >
        <div className="h-8 w-8 rounded-lg bg-sol-green/10 text-sol-green flex items-center justify-center text-sm shrink-0">
          🗺️
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-sol-ink">Tuần đầu sẽ như thế nào?</div>
          <div className="text-[11px] text-sol-ink/55 mt-0.5">
            Biết trước để không bị bất ngờ — cơn thèm đỉnh ở giờ nào, ngày nào khó nhất.
          </div>
        </div>
        <div className="text-sol-ink/30 shrink-0">›</div>
      </button>
    </section>
  );
}

/* ─── SOS ROW ──────────────────────────────────────────────── */

function SosRow({ onChip }: { onChip: (p: Prompt) => void }) {
  const sos = SOS_PROMPTS.slice(0, 3);
  return (
    <section>
      <div className="flex items-center justify-between mb-1.5 px-1">
        <div className="text-[10px] uppercase tracking-wider text-sol-red font-bold">
          🆘 Cần giúp ngay
        </div>
        <div className="text-[10px] text-sol-ink/40">Chạm là bắt đầu</div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {sos.map((p) => (
          <button
            key={p.id}
            onClick={() => onChip(p)}
            className="rounded-xl p-2.5 text-white text-left flex flex-col items-start active:scale-[0.97] transition"
            style={{ background: p.accent ?? '#C04331' }}
          >
            <div className="text-lg leading-none">{p.icon}</div>
            <div className="text-[11px] font-semibold leading-tight mt-1">
              {p.label}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ─── FAQ STRIP ─────────────────────────────────────────────── */

function FaqStrip({ onChip }: { onChip: (p: Prompt) => void }) {
  const faq = FAQ_PROMPTS.slice(0, 4);
  return (
    <section>
      <div className="text-[10px] uppercase tracking-wider text-sol-ink/55 font-bold mb-1.5 px-1">
        📚 Câu hỏi hay gặp
      </div>
      <div className="space-y-1.5">
        {faq.map((p) => (
          <button
            key={p.id}
            onClick={() => onChip(p)}
            className="w-full rounded-lg bg-white border border-black/5 px-3 py-2 text-left flex items-center gap-2 hover:bg-sol-bg active:scale-[0.99] transition"
          >
            <span className="text-base shrink-0">{p.icon}</span>
            <span className="text-[12px] text-sol-ink/80 flex-1 leading-tight">
              {p.label}
            </span>
            <span className="text-sol-ink/25 text-xs shrink-0">→</span>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ─── ACTION MINI ────────────────────────────────────────────── */

function ActionMini({
  icon,
  color,
  label,
  sub,
  onClick,
}: {
  icon: string;
  color: string;
  label: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl bg-white border border-black/5 p-3 text-left hover:shadow-sm active:scale-[0.98] transition"
    >
      <div
        className="h-7 w-7 rounded-lg flex items-center justify-center text-sm mb-1.5"
        style={{ background: color + '18', color }}
      >
        {icon}
      </div>
      <div className="text-[12px] font-semibold text-sol-ink leading-tight">{label}</div>
      <div className="text-[10px] text-sol-ink/55 mt-0.5">{sub}</div>
    </button>
  );
}

/* ─── FOOTNOTE ───────────────────────────────────────────────── */

function FootnoteLine() {
  return (
    <div className="text-center text-[10px] text-sol-ink/35 pt-1 pb-2">
      Sol không thay thế bác sĩ · Khẩn cấp gọi 115
    </div>
  );
}

/* ─── COMPOSER + CHIPS ──────────────────────────────────────── */

function Composer({
  draft,
  setDraft,
  sending,
  chips,
  onChip,
  onSend,
  hasJourney,
}: {
  draft: string;
  setDraft: (s: string) => void;
  sending: boolean;
  chips: Prompt[];
  onChip: (p: Prompt) => void;
  onSend: () => void;
  hasJourney: boolean;
}) {
  return (
    <div className="border-t border-black/5 bg-white/90 backdrop-blur">
      {/* Hàng chip mồi nhử — cuộn ngang */}
      {chips.length > 0 && (
        <div
          className="px-3 pt-2 pb-1 flex gap-1.5 overflow-x-auto scrollbar-thin"
          style={{ scrollbarWidth: 'thin' }}
        >
          {chips.map((p) => (
            <button
              key={p.id}
              onClick={() => onChip(p)}
              className="shrink-0 rounded-full border border-black/10 bg-sol-bg hover:bg-white text-[11px] px-2.5 py-1 flex items-center gap-1 text-sol-ink/80 active:scale-[0.97] transition"
            >
              <span>{p.icon}</span>
              <span className="whitespace-nowrap">{p.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Ô nhập kiểu Claude/ChatGPT — pill bo tròn */}
      <div className="px-3 pb-3 pt-1">
        <div className="flex items-end gap-1.5 rounded-2xl border border-black/10 bg-white focus-within:border-sol-green focus-within:ring-2 focus-within:ring-sol-green/20 transition px-3 py-2">
          <textarea
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 120) + 'px';
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            rows={1}
            placeholder={
              hasJourney
                ? 'Kể Sol nghe bạn đang thế nào…'
                : 'Hỏi Sol về hành trình bỏ thuốc…'
            }
            className="flex-1 resize-none bg-transparent text-[13px] leading-relaxed focus:outline-none placeholder:text-sol-ink/40 max-h-[120px]"
          />
          <button
            onClick={onSend}
            disabled={!draft.trim() || sending}
            aria-label="Gửi"
            className="h-8 w-8 rounded-full bg-sol-green text-white flex items-center justify-center shrink-0 disabled:opacity-40 active:scale-95 transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 5v14M5 12l7-7 7 7"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <div className="text-[10px] text-sol-ink/35 text-center mt-1">
          Enter để gửi · Shift+Enter xuống dòng
        </div>
      </div>
    </div>
  );
}
