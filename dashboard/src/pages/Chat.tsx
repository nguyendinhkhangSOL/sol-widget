// dashboard/src/pages/Chat.tsx
//
// Chat page riêng cho dashboard — render chat trong main area giống các
// page khác (Hành trình, Sổ tay).
//
// Phase 1 (2026-05-03):
//   1. SuggestedChips — 8-12 chip ranked theo day×hour×mood (chipRanking.ts)
//   2. Chip click → instant Q&A (NO AI call)
//   3. Wiki link CTA → marketing loop sang sol.vn
//   4. Composer autocomplete + Tab to accept
//   5. Fallback chip "Câu của tôi không có ở đây"
//
// Phase 2A (2026-05-03 cont.):
//   - Chip Q&A persist DB qua POST /messages với metadata.cannedReplyId
//   - Backend skip AI + quota cho path canned
//   - Optimistic UI giữ nguyên (instant), background POST đồng bộ DB

import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../state/store';
import { api, ApiError } from '../services/api';
import {
  refreshQuickReplies,
  getAllChips,
  markUsed,
  resolveAnswer,
  type QuickReply,
} from '../lib/quickReplies';
import { rankChips, type RankedChip } from '../lib/chipRanking';
import { matchUserMessage } from '../lib/intentMatcher';
import { SuggestedChips } from '../components/SuggestedChips';

interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  type: string;
  content: string;
  createdAt: string;
  /** Client-side enrichment cho chip vừa click (trước khi persist). */
  wikiUrl?: string;
  wikiLabel?: string;
  /** Metadata từ DB khi load history — chứa cannedReplyId, wikiUrl, wikiLabel. */
  metadata?: any;
}

/** Lấy wiki link từ msg, ưu tiên top-level (client) → metadata (DB history). */
function getWikiLink(msg: Message): { url: string; label: string } | null {
  const url = msg.wikiUrl ?? msg.metadata?.wikiUrl;
  if (!url) return null;
  const label = msg.wikiLabel ?? msg.metadata?.wikiLabel ?? 'Đọc chi tiết trên sol.vn';
  return { url, label };
}

export function Chat() {
  const user = useStore((s) => s.user);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chipsReady, setChipsReady] = useState(false);
  const [chipVersion, setChipVersion] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    api
      .request<{ messages: Message[] }>('/messages?limit=50')
      .then((r) => setMessages(r.messages ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));

    refreshQuickReplies().finally(() => setChipsReady(true));
  }, []);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length, sending]);

  // Empty state grid 10 chip — 'cap1' (1 critical fallback ở cuối, 9 chip thường)
  const rankedChips: RankedChip[] = useMemo(() => {
    if (!chipsReady) return [];
    return rankChips(getAllChips(), user, { maxN: 10, criticalMode: 'cap1' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chipsReady, user, chipVersion]);

  // Sticky compact bar 6 chip (sau message đầu) — 'exclude' critical hoàn toàn,
  // crisis accessible qua intent matcher khi user gõ tự do.
  const compactChips: RankedChip[] = useMemo(() => {
    if (!chipsReady) return [];
    return rankChips(getAllChips(), user, { maxN: 6, criticalMode: 'exclude' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chipsReady, user, chipVersion]);

  const autocompleteChip: QuickReply | null = useMemo(() => {
    if (!chipsReady || draft.trim().length < 2) return null;
    const result = matchUserMessage(draft, getAllChips());
    return result?.chip ?? null;
  }, [draft, chipsReady]);

  /**
   * Phase 2A — Chip click flow:
   *   1. Optimistic render Q&A (instant, không chờ network)
   *   2. Background POST /messages với metadata.cannedReplyId/cannedAnswer
   *   3. Backend skip AI + quota → persist Q&A vào DB
   *   4. Replace optimistic với persisted (giữ id ổn định cho future ops)
   */
  function handleChipClick(chip: QuickReply) {
    if (!chip.reusable) markUsed(chip.id);
    const now = new Date().toISOString();
    const tmpUserId = `chip-u-${Date.now()}`;
    const tmpBotId = `chip-b-${Date.now() + 1}`;
    const answer = resolveAnswer(chip, user);

    const optimisticUser: Message = {
      id: tmpUserId,
      role: 'USER',
      type: 'CHIP_REPLY',
      content: chip.label,
      createdAt: now,
    };
    const optimisticBot: Message = {
      id: tmpBotId,
      role: 'ASSISTANT',
      type: 'CHIP_REPLY',
      content: answer,
      createdAt: now,
      wikiUrl: chip.wikiUrl ?? undefined,
      wikiLabel: chip.wikiLabel ?? undefined,
    };
    setMessages((prev) => [...prev, optimisticUser, optimisticBot]);
    setChipVersion((v) => v + 1);
    setDraft('');

    // Background persist — không await, không block UI
    api
      .request<{ userMessage: Message; outbound: Message[] }>('/messages', {
        method: 'POST',
        body: JSON.stringify({
          content: chip.label,
          metadata: {
            cannedReplyId: chip.id,
            cannedAnswer: answer,
            wikiUrl: chip.wikiUrl ?? null,
            wikiLabel: chip.wikiLabel ?? null,
          },
        }),
      })
      .then((res) => {
        // Replace optimistic với persisted (id ổn định từ DB)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tmpUserId
              ? res.userMessage
              : m.id === tmpBotId
              ? res.outbound[0] ?? m
              : m,
          ),
        );
      })
      .catch(() => {
        // Silent fail — user vẫn thấy Q&A optimistic. Sau reload có thể mất
        // tin này nhưng UX không bị break.
      });
  }

  function handleFallbackClick() {
    textareaRef.current?.focus();
  }

  function handleTabAutocomplete() {
    if (autocompleteChip) handleChipClick(autocompleteChip);
  }

  async function send() {
    const text = draft.trim();
    if (!text || sending) return;

    const optimistic: Message = {
      id: `tmp-${Date.now()}`,
      role: 'USER',
      type: 'CHAT',
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft('');
    setSending(true);

    try {
      const res = await api.request<{
        userMessage: Message;
        outbound: Message[];
      }>('/messages', {
        method: 'POST',
        body: JSON.stringify({ content: text }),
      });
      setMessages((prev) => {
        const withoutOptimistic = prev.filter((m) => m.id !== optimistic.id);
        return [...withoutOptimistic, res.userMessage, ...res.outbound];
      });
    } catch (e: any) {
      const errMsg =
        e instanceof ApiError && e.status === 402
          ? 'Bạn đã hết tin AI hôm nay. Quay lại sáng mai hoặc xem các gói trả phí ở Cài đặt.'
          : 'Không gửi được. Kiểm tra kết nối rồi thử lại.';
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'SYSTEM',
          type: 'SYSTEM_NOTE',
          content: errMsg,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-w-3xl mx-auto p-4 lg:p-6">
      <header className="mb-3">
        <h1 className="text-h1 text-sol-ink">Trò chuyện với Sol</h1>
        <p className="text-meta text-sol-ink-3 mt-1">
          {user?.assistantName ?? 'Sol Đồng hành'} đang ở đây — kể cho Sol nghe bạn thế nào.
        </p>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto space-y-3 bg-sol-paper rounded-2xl border border-sol-line p-4"
      >
        {loading ? (
          <div className="text-center text-sol-ink-3 py-8">Đang tải lịch sử…</div>
        ) : messages.length === 0 ? (
          rankedChips.length > 0 ? (
            <SuggestedChips
              chips={rankedChips}
              onChipClick={handleChipClick}
              onFallbackClick={handleFallbackClick}
              title="Bạn muốn hỏi Sol về…"
            />
          ) : (
            <div className="text-center text-sol-ink-3 py-8">
              Chưa có tin nhắn nào. Hãy chia sẻ với Sol điều bạn đang nghĩ.
            </div>
          )
        ) : (
          messages.map((m) => <Bubble key={m.id} msg={m} />)
        )}
        {sending && (
          <div className="flex items-center gap-2 text-sol-ink-3 text-meta">
            <span className="animate-pulse">●</span>
            <span>Sol đang gõ…</span>
          </div>
        )}
      </div>

      {messages.length > 0 && compactChips.length > 0 && (
        <div className="mt-3">
          <SuggestedChips
            chips={compactChips}
            onChipClick={handleChipClick}
            onFallbackClick={handleFallbackClick}
            compact
          />
        </div>
      )}

      {autocompleteChip && draft.trim().length >= 2 && (
        <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-sol-paper border border-sol-line rounded-xl text-meta">
          <span aria-hidden>💡</span>
          <span className="text-sol-ink-3">Sol gợi ý:</span>
          <button
            onClick={() => handleChipClick(autocompleteChip)}
            className="flex items-center gap-1.5 text-sol-ink hover:text-sol-green transition font-medium"
          >
            <span aria-hidden>{autocompleteChip.icon || '💬'}</span>
            <span>{autocompleteChip.label}</span>
          </button>
          <span className="ml-auto text-sol-ink-3 text-xs">
            <kbd className="px-1.5 py-0.5 bg-white border border-sol-line rounded text-[10px]">Tab</kbd>
            <span className="ml-1">để chọn</span>
          </span>
        </div>
      )}

      <div className="mt-3 flex items-end gap-2 rounded-2xl border border-sol-line bg-white p-2 focus-within:border-sol-green focus-within:ring-2 focus-within:ring-sol-green/20 transition">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            const el = e.currentTarget;
            el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 200) + 'px';
          }}
          onKeyDown={(e) => {
            if (e.key === 'Tab' && autocompleteChip) {
              e.preventDefault();
              handleTabAutocomplete();
              return;
            }
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          placeholder="Kể Sol nghe bạn đang thế nào…"
          className="flex-1 resize-none bg-transparent px-3 py-2 text-body leading-relaxed focus:outline-none placeholder:text-sol-ink-3 max-h-[200px]"
        />
        <button
          onClick={send}
          disabled={!draft.trim() || sending}
          className="h-10 w-10 rounded-full bg-sol-green text-white flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition flex-shrink-0"
          aria-label="Gửi"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <p className="text-meta text-sol-ink-3 text-center mt-1.5">
        Enter để gửi · Shift+Enter xuống dòng · Tab để chọn gợi ý
      </p>
    </div>
  );
}

function Bubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'USER';
  const isSystem = msg.role === 'SYSTEM';
  const wiki = !isUser ? getWikiLink(msg) : null;

  if (isSystem) {
    return (
      <div className="text-center text-meta text-sol-ink-3 italic">
        {msg.content}
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={
          'max-w-[75%] px-4 py-2.5 rounded-2xl text-body leading-relaxed whitespace-pre-wrap ' +
          (isUser
            ? 'bg-sol-green text-white rounded-tr-sm'
            : 'bg-white border border-sol-line text-sol-ink rounded-tl-sm')
        }
      >
        {msg.content}
        {wiki && (
          <a
            href={wiki.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 text-meta text-sol-green font-medium hover:underline"
          >
            <span aria-hidden>📖</span>
            <span>{wiki.label}</span>
            <span aria-hidden>→</span>
          </a>
        )}
      </div>
    </div>
  );
}
