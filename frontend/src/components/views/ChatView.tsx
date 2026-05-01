// frontend/src/components/views/ChatView.tsx
// Scrollable chat log + composer + quick-reply chips.
//
// Quick replies (chips) hiển thị ngay trên ô soạn tin khi user chưa gửi
// tin nào — cho người 45+ chỉ cần bấm là có câu trả lời ngay (không qua AI).
//   • Mỗi chip có nội dung trả lời biên tập sẵn → nhanh & chính xác hơn AI
//   • Bấm xong sẽ markUsed → lần sau câu đó không hiện nữa
//     (trừ vài câu reusable như "tôi đang thèm thuốc")
//   • Khi user đã gõ/gửi tin riêng, chip biến mất hoàn toàn

import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../../state/store';
import { api, ApiError } from '../../services/api';
import { MessageBubble } from './MessageBubble';
import type { Message, TierMe } from '../../types';
import {
  pickQuickReplies,
  resolveAnswer,
  markUsed,
  refreshQuickReplies,
  getAllChips,
  type QuickReply,
} from '../../lib/quickReplies';
import { matchUserMessage } from '../../lib/intentMatcher';

export function ChatView() {
  const messages = useStore((s) => s.messages);
  const typing = useStore((s) => s.typing);
  const user = useStore((s) => s.user);
  const setView = useStore((s) => s.setView);
  const addMessage = useStore((s) => s.addMessage);
  const setTyping = useStore((s) => s.setTyping);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [tier, setTier] = useState<TierMe | null>(null);
  // Tăng counter mỗi khi user bấm chip → re-render để pickQuickReplies()
  // đọc lại localStorage và loại bỏ chip vừa dùng.
  const [chipTick, setChipTick] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Tải tier state để hiện quota
  useEffect(() => {
    api.getTierMe().then(setTier).catch(() => {});
  }, []);

  function refreshTier() {
    api.getTierMe().then(setTier).catch(() => {});
  }

  const quotaExceeded =
    tier && !tier.daily.unlimited && tier.daily.limit !== null && tier.daily.used >= tier.daily.limit;

  // Sắp hết — chỉ hiện CTA "Mở khoá" khi user còn ≤ 2 tin → đỡ nag liên tục.
  const quotaNearLimit =
    tier && !tier.daily.unlimited && tier.daily.limit !== null &&
    tier.daily.limit - tier.daily.used <= 2 && !quotaExceeded;

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length, typing]);

  // Tải canned replies từ backend lần đầu mở chat (best-effort, có cache).
  useEffect(() => {
    refreshQuickReplies()
      .then(() => setChipTick((t) => t + 1))
      .catch(() => {});
  }, []);

  async function send() {
    const content = draft.trim();
    if (!content || sending) return;
    if (quotaExceeded) {
      setView('paywall');
      return;
    }

    // ─── Intent matcher: thử match canned reply trước ───────
    // Nếu user gõ câu match trigger nào đó, render NGAY không qua AI.
    // Tiết kiệm token + nhanh hơn 10x. Fallback AI nếu không match.
    const matched = matchUserMessage(content, getAllChips());
    if (matched) {
      setDraft('');
      const now = Date.now();
      // 1. User bubble — câu user vừa gõ
      addMessage({
        id: `user-${matched.chip.id}-${now}`,
        role: 'USER',
        type: 'CHAT',
        content,
        createdAt: new Date().toISOString(),
      });
      // 2. Bot bubble — canned answer (delay 300-600ms cho tự nhiên)
      const delay = 300 + Math.random() * 300;
      setTyping(true);
      setTimeout(() => {
        let answerText = resolveAnswer(matched.chip, user);
        if (matched.chip.wikiUrl) {
          const linkLabel = matched.chip.wikiLabel || 'Đọc bài đầy đủ';
          answerText += `\n\n📖 ${linkLabel}: ${matched.chip.wikiUrl}`;
        }
        addMessage({
          id: `bot-${matched.chip.id}-${now}`,
          role: 'ASSISTANT',
          type: 'CHAT',
          content: answerText,
          metadata: matched.chip.wikiUrl
            ? { wikiUrl: matched.chip.wikiUrl, wikiLabel: matched.chip.wikiLabel ?? null, source: 'canned', score: matched.score }
            : { source: 'canned', score: matched.score },
          createdAt: new Date(now + 1).toISOString(),
        });
        setTyping(false);
      }, delay);
      return;
    }
    // ─── End intent matcher ─────────────────────────────────

    setSending(true);
    setDraft('');
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
      // Outbound arrives via socket; nothing else to do
      refreshTier();
    } catch (err) {
      // 402 = paywall / quota exceeded → KHÔNG auto-redirect (cảm giác bị ép).
      // Chỉ render system notice mềm, để user tự bấm CTA "Mở khoá" bên dưới
      // ô input nếu thật sự muốn nâng cấp.
      if (err instanceof ApiError && err.status === 402) {
        addMessage({
          id: `quota-${Date.now()}`,
          role: 'SYSTEM',
          type: 'SYSTEM_NOTICE',
          content:
            err.body?.error === 'quota_exceeded'
              ? 'Bạn đã dùng hết tin AI hôm nay. Quay lại sáng mai, hoặc tham khảo các gói trả phí ở Cài đặt.'
              : 'Tính năng này có trong gói trả phí. Xem chi tiết ở Cài đặt nếu bạn quan tâm.',
          createdAt: new Date().toISOString(),
        });
        refreshTier();
        return;
      }
      addMessage({
        id: `err-${Date.now()}`,
        role: 'SYSTEM',
        type: 'SYSTEM_NOTICE',
        content: 'Không gửi được. Kiểm tra kết nối rồi thử lại.',
        createdAt: new Date().toISOString(),
      });
    } finally {
      setSending(false);
      setTyping(false);
    }
  }

  /** Bấm chip → render NGAY user message + bot answer (không gọi AI) */
  function handleChip(chip: QuickReply) {
    if (sending) return;
    const now = Date.now();
    // 1. User bubble — dùng label làm content
    addMessage({
      id: `qr-u-${chip.id}-${now}`,
      role: 'USER',
      type: 'CHAT',
      content: chip.label,
      createdAt: new Date().toISOString(),
    });
    // 2. Assistant bubble — answer biên tập sẵn + (optional) link wiki
    let answerText = resolveAnswer(chip, user);
    if (chip.wikiUrl) {
      const linkLabel = chip.wikiLabel || 'Xem thêm chi tiết';
      // Markdown-style link để MessageBubble render — dù bubble không hỗ
      // trợ markdown, chuỗi vẫn đọc được thẳng. Nếu có renderer nâng cấp
      // sau, link tự động "live" được.
      answerText += `\n\n🔗 ${linkLabel}: ${chip.wikiUrl}`;
    }
    addMessage({
      id: `qr-a-${chip.id}-${now}`,
      role: 'ASSISTANT',
      type: 'CHAT',
      content: answerText,
      metadata: chip.wikiUrl
        ? { wikiUrl: chip.wikiUrl, wikiLabel: chip.wikiLabel ?? null }
        : undefined,
      createdAt: new Date(now + 1).toISOString(),
    });
    // 3. Đánh dấu chip đã dùng → biến mất ở các lần render sau
    markUsed(chip.id);
    setChipTick((t) => t + 1);
  }

  /* ─── Quick-reply chips ─────────────────────────────────────── */
  // Chỉ hiện khi user CHƯA gửi/bấm gì — sau lần đầu thì biến mất gọn
  // để không che view chat.
  const userMsgCount = useMemo(
    () => messages.filter((m) => m.role === 'USER').length,
    [messages]
  );
  const showChips = userMsgCount === 0 && !sending;
  const chips = useMemo(
    () => (showChips ? pickQuickReplies(user, 8) : []),
    [showChips, user, chipTick]
  );

  const empty = messages.length === 0;

  return (
    <div className="h-full flex flex-col">
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-2">
        {empty && (
          <div className="px-2 pt-4 pb-2 text-center text-sol-ink-3 text-meta">
            Kể SOL nghe bạn đang thế nào — hoặc bấm 1 câu hỏi quen thuộc bên dưới.
          </div>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {typing && (
          <div className="flex items-center gap-1 pl-3 text-sol-ink-3 text-meta">
            <Dot /> <Dot delay="100ms" /> <Dot delay="200ms" />
          </div>
        )}
      </div>

      {/* Quick-reply chips — 2 hàng × 4 cột, tự xuống dòng nếu thiếu */}
      {showChips && chips.length > 0 && (
        <div className="px-3 pt-2 pb-1 border-t border-sol-line bg-sol-paper/70 backdrop-blur">
          <div className="text-meta text-sol-ink-3 mb-1.5 px-0.5">
            Câu hỏi quen thuộc — bấm để xem ngay:
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {chips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => handleChip(chip)}
                className="
                  flex items-center gap-1.5 min-h-[38px] px-2.5 py-1.5
                  rounded-full border border-sol-line bg-white
                  text-left text-sol-ink text-meta leading-snug
                  hover:bg-sol-green-soft hover:border-sol-green active:scale-[.98]
                  transition
                "
              >
                <span className="text-base leading-none flex-shrink-0">{chip.icon}</span>
                <span className="truncate">{chip.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="px-3 py-2 border-t border-sol-line bg-sol-paper/80 backdrop-blur">
        {tier && !tier.daily.unlimited && (
          <div className="flex items-center justify-between mb-1.5 px-1 text-meta text-sol-ink-3">
            <span className="flex items-center gap-1.5">
              <span>
                💬 {tier.daily.used}/{tier.daily.limit} tin hôm nay
              </span>
              {tier.daily.firstWeekBoost && (
                <span
                  className="text-[10px] uppercase font-bold tracking-wide px-1.5 py-0.5 rounded bg-sol-orange-soft text-sol-orange-ink"
                  title={`Tuần đầu: ${tier.daily.firstWeekBoost.boostedLimit} tin/ngày — còn ${tier.daily.firstWeekBoost.daysRemaining} ngày`}
                >
                  ✨ Tuần đầu
                </span>
              )}
            </span>
            {/* Chỉ hiện link "Mở khoá" khi gần hết hoặc đã hết — không nag liên tục. */}
            {(quotaExceeded || quotaNearLimit) && (
              <button
                onClick={() => setView('paywall')}
                className="text-sol-orange font-semibold underline"
              >
                {quotaExceeded ? 'Xem gói trả phí' : 'Sắp hết — xem gói'} ›
              </button>
            )}
          </div>
        )}
        {quotaExceeded ? (
          <div className="space-y-2">
            <div className="w-full py-3 rounded-xl bg-sol-paper border border-sol-line text-center text-meta text-sol-ink-2">
              Bạn đã dùng hết tin AI hôm nay. Quay lại sáng mai
              {tier?.daily.firstWeekBoost && tier.daily.firstWeekBoost.daysRemaining > 0 ? (
                <> — tuần đầu còn {tier.daily.firstWeekBoost.daysRemaining} ngày boost.</>
              ) : (
                <> hoặc xem gói trả phí.</>
              )}
            </div>
            <button
              onClick={() => setView('paywall')}
              className="w-full py-2.5 rounded-xl border border-sol-orange/40 text-sol-orange font-semibold text-meta min-h-tap hover:bg-sol-orange/5 transition"
            >
              Xem các gói trả phí
            </button>
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Nhập gì đó…"
              rows={1}
              className="flex-1 resize-none px-3 py-2 rounded-xl border border-sol-line bg-white text-body max-h-24 focus:outline-none focus:ring-2 focus:ring-sol-green"
            />
            <button
              onClick={send}
              disabled={!draft.trim() || sending}
              className="h-10 px-4 rounded-xl bg-sol-green text-white text-body font-semibold disabled:opacity-50 min-h-tap"
              aria-label="Gửi"
            >
              Gửi
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Dot({ delay = '0ms' }: { delay?: string }) {
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full bg-sol-ink-3 animate-bounce"
      style={{ animationDelay: delay }}
    />
  );
}
