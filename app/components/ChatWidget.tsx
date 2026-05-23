'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface ChatMessage {
  id: number;
  sender_type: 'user' | 'admin' | 'ai' | 'system';
  sender_name?: string;
  content: string;
  content_type: string;
  created_at: string;
}

interface SuggestedChip {
  id: string;
  icon: string;
  label: string;
  category?: string;
}

const POLL_INTERVAL_MS = 8000;

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chips, setChips] = useState<SuggestedChip[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [needName, setNeedName] = useState(false);
  const [name, setName] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  const fetchMessages = useCallback(async (silent = false) => {
    try {
      const res = await fetch('/api/chat/messages', { credentials: 'include', cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      const newMessages = data.messages || [];

      // Detect new admin/ai messages (for unread badge)
      if (!isOpen && newMessages.length > messages.length) {
        const newAssistantMessages = newMessages.slice(messages.length).filter((m: ChatMessage) => m.sender_type !== 'user');
        if (newAssistantMessages.length > 0) setHasUnread(true);
      }

      setMessages(newMessages);
      if (data.suggested_chips) setChips(data.suggested_chips);
      if (!silent && isOpen) scrollToBottom();
    } catch (err) {
      console.warn('[chat] fetch failed:', err);
    }
  }, [isOpen, messages.length, scrollToBottom]);

  useEffect(() => {
    fetchMessages(true);
    const interval = setInterval(() => fetchMessages(true), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 200);
      fetch('/api/chat/messages', {
        method: 'PATCH',
        credentials: 'include',
        body: JSON.stringify({ action: 'mark_read' }),
        headers: { 'Content-Type': 'application/json' }
      }).catch(() => {});
    }
  }, [isOpen, scrollToBottom]);

  async function sendMessage(content: string, chipId?: string) {
    if (!content || sending) return;

    if (messages.length === 0 && !name.trim() && !needName) {
      setNeedName(true);
      return;
    }

    setSending(true);

    // Optimistic
    const tempMsg: ChatMessage = {
      id: -Date.now(),
      sender_type: 'user',
      content,
      content_type: 'text',
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);
    setInputValue('');
    scrollToBottom();

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, chip_id: chipId, visitor_name: name.trim() || undefined })
      });
      if (!res.ok) throw new Error('Send failed');
      const data = await res.json();

      // Replace temp with real + add reply
      setMessages(prev => {
        const withoutTemp = prev.filter(m => m.id !== tempMsg.id);
        return [
          ...withoutTemp,
          { ...tempMsg, id: data.user_message_id },
          data.reply
        ];
      });
      scrollToBottom();

      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', chipId ? 'chip_clicked' : 'chat_message_sent', {
          source: 'web',
          chip_id: chipId,
          reply_source: data.reply?.source
        });
      }

      // Refetch to update suggested chips
      setTimeout(() => fetchMessages(true), 500);
    } catch (err) {
      console.error('[chat] send failed:', err);
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      setInputValue(content);
    } finally {
      setSending(false);
    }
  }

  function handleSubmit() {
    sendMessage(inputValue.trim());
  }

  function handleChipClick(chip: SuggestedChip) {
    sendMessage(chip.label, chip.id);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length >= 2) {
      setNeedName(false);
      setTimeout(() => handleSubmit(), 100);
    }
  }

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Chat với Sol"
          className="fixed bottom-5 right-5 z-40 w-16 h-16 rounded-full bg-sol-orange text-white shadow-2xl hover:scale-110 transition-transform flex items-center justify-center"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          {hasUnread && (
            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
          )}
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-0 right-0 sm:bottom-5 sm:right-5 z-40 w-full sm:w-96 h-[80vh] sm:h-[600px] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col border border-sol-cream overflow-hidden">
          {/* Header */}
          <div className="bg-sol-brown text-sol-paper p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-sol-orange flex items-center justify-center font-bold font-serif">K</div>
              <div>
                <div className="font-bold">Sol Đồng hành</div>
                <div className="text-xs opacity-80 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-400"></span>
                  <span>Online · AI + Khang reply</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} aria-label="Đóng" className="text-sol-paper hover:bg-white/10 w-8 h-8 rounded-full flex items-center justify-center transition">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 bg-sol-cream/30">
            {messages.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-5xl mb-3">👋</div>
                <p className="text-sm text-sol-ink2 mb-2">
                  Xin chào! Mình là <strong className="text-sol-brown">Sol</strong> — đồng hành cai thuốc lá
                </p>
                <p className="text-xs text-sol-ink2 max-w-xs mx-auto mb-4">
                  Bấm 1 câu hỏi gợi ý bên dưới, hoặc gõ câu của anh.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => {
                  const isUser = msg.sender_type === 'user';
                  const isSystem = msg.sender_type === 'system';
                  if (isSystem) {
                    return <div key={msg.id} className="text-center text-xs text-sol-ink2 italic py-1">{msg.content}</div>;
                  }
                  return (
                    <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                        isUser
                          ? 'bg-sol-orange text-white rounded-br-sm'
                          : 'bg-white text-sol-ink shadow-sm rounded-bl-sm'
                      }`}>
                        {!isUser && msg.sender_name && (
                          <div className="text-xs font-semibold text-sol-orange mb-1">{msg.sender_name}</div>
                        )}
                        <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                        <div className={`text-xs mt-1 opacity-60 ${isUser ? 'text-white' : 'text-sol-ink2'}`}>
                          {new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested CHIPS (above input) */}
          {chips.length > 0 && !needName && !sending && (
            <div className="px-3 pt-2 pb-1 bg-white border-t border-sol-cream">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin" style={{ scrollbarWidth: 'thin' }}>
                {chips.map((chip) => (
                  <button
                    key={chip.id}
                    onClick={() => handleChipClick(chip)}
                    className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-sol-cream hover:bg-sol-orange hover:text-white text-xs text-sol-brown font-medium transition border border-sol-orange/20 whitespace-nowrap"
                  >
                    <span>{chip.icon}</span>
                    <span>{chip.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Name input (first message) */}
          {needName && (
            <form onSubmit={handleNameSubmit} className="p-3 bg-sol-paper border-t border-sol-cream">
              <label className="block text-xs font-semibold text-sol-brown mb-1">Anh tên gì? (chỉ cần lần đầu)</label>
              <div className="flex gap-2">
                <input
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="flex-1 px-3 py-2 rounded-lg border border-sol-cream text-sm focus:border-sol-orange focus:outline-none"
                  autoFocus
                />
                <button type="submit" className="bg-sol-orange text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-700 transition">OK</button>
              </div>
            </form>
          )}

          {/* Input */}
          {!needName && (
            <div className="p-3 bg-white border-t border-sol-cream">
              <div className="flex gap-2 items-end">
                <textarea
                  ref={inputRef} value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Gõ câu hỏi... (Enter để gửi)"
                  rows={1}
                  className="flex-1 px-3 py-2 rounded-xl border border-sol-cream text-sm focus:border-sol-orange focus:outline-none resize-none max-h-24"
                  disabled={sending}
                />
                <button
                  onClick={handleSubmit}
                  disabled={sending || !inputValue.trim()}
                  aria-label="Gửi" className="bg-sol-orange text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-orange-700 disabled:opacity-50 transition flex-shrink-0"
                >
                  {sending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-xs text-sol-ink2 text-center mt-2 italic">
                💬 Trả lời ngay từ Sol. Câu phức tạp sẽ chuyển tới Khang Sol (24h).
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
