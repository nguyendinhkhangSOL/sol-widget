// dashboard/src/pages/Chat.tsx
//
// Chat page riêng cho dashboard — render chat trong main area giống các
// page khác (Hành trình, Sổ tay). KHÔNG dùng widget embed, không bị sync
// issues với store độc lập.
//
// Logic chat tối giản: list messages + composer + send. AI reply qua socket
// (cùng backend với widget). Quick chips dùng intent matcher (canned replies)
// nếu match thì hiện instant không qua AI.

import { useEffect, useRef, useState } from 'react';
import { useStore } from '../state/store';
import { api, ApiError } from '../services/api';

interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  type: string;
  content: string;
  createdAt: string;
}

export function Chat() {
  const user = useStore((s) => s.user);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load message history
  useEffect(() => {
    api
      .request<{ messages: Message[] }>('/messages?limit=50')
      .then((r) => setMessages(r.messages ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length, sending]);

  async function send() {
    const text = draft.trim();
    if (!text || sending) return;

    // Optimistic render
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
      // Replace optimistic + add bot replies
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

      {/* Messages list */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto space-y-3 bg-sol-paper rounded-2xl border border-sol-line p-4"
      >
        {loading ? (
          <div className="text-center text-sol-ink-3 py-8">Đang tải lịch sử…</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-sol-ink-3 py-8">
            Chưa có tin nhắn nào. Hãy chia sẻ với Sol điều bạn đang nghĩ.
          </div>
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

      {/* Composer */}
      <div className="mt-3 flex items-end gap-2 rounded-2xl border border-sol-line bg-white p-2 focus-within:border-sol-green focus-within:ring-2 focus-within:ring-sol-green/20 transition">
        <textarea
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            const el = e.currentTarget;
            el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 200) + 'px';
          }}
          onKeyDown={(e) => {
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
        Enter để gửi · Shift+Enter xuống dòng
      </p>
    </div>
  );
}

function Bubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'USER';
  const isSystem = msg.role === 'SYSTEM';

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
      </div>
    </div>
  );
}
