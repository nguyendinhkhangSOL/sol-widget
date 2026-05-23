'use client';

/**
 * Standalone Sol Chat for iframe embed (sol.vn)
 * Render full-screen chat (no floating button, no drawer).
 * Posts message to parent to close.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface ChatMessage {
  id: number;
  sender_type: 'user' | 'admin' | 'ai' | 'system';
  sender_name?: string;
  content: string;
  created_at: string;
}

interface SuggestedChip {
  id: string;
  icon: string;
  label: string;
  category?: string;
}

export function ChatWidgetEmbed() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chips, setChips] = useState<SuggestedChip[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [needName, setNeedName] = useState(false);
  const [name, setName] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/messages', { credentials: 'include', cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages || []);
      if (data.suggested_chips) setChips(data.suggested_chips);
    } catch {}
  }, []);

  useEffect(() => {
    fetchMessages();
    const i = setInterval(fetchMessages, 8000);
    return () => clearInterval(i);
  }, [fetchMessages]);

  useEffect(() => {
    scrollToBottom();
    setTimeout(() => inputRef.current?.focus(), 200);
  }, [messages, scrollToBottom]);

  async function sendMessage(content: string, chipId?: string) {
    if (!content || sending) return;
    if (messages.length === 0 && !name.trim() && !needName) {
      setNeedName(true);
      return;
    }
    setSending(true);
    const temp: ChatMessage = { id: -Date.now(), sender_type: 'user', content, created_at: new Date().toISOString() };
    setMessages(p => [...p, temp]);
    setInputValue('');
    scrollToBottom();
    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, chip_id: chipId, visitor_name: name.trim() || undefined })
      });
      const data = await res.json();
      setMessages(p => [...p.filter(m => m.id !== temp.id), { ...temp, id: data.user_message_id }, data.reply]);
      scrollToBottom();
      setTimeout(fetchMessages, 500);
    } catch {
      setMessages(p => p.filter(m => m.id !== temp.id));
      setInputValue(content);
    } finally {
      setSending(false);
    }
  }

  function closeWidget() {
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'sol-widget-close' }, '*');
    }
  }

  function openExternal(url: string) {
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'sol-widget-redirect', url }, '*');
    } else {
      window.open(url, '_blank');
    }
  }

  return (
    <>
      {/* Header */}
      <div className="bg-sol-brown text-sol-paper p-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sol-orange flex items-center justify-center font-bold font-serif">K</div>
          <div>
            <div className="font-bold">Sol Đồng hành</div>
            <div className="text-xs opacity-80">AI + Khang Sol · cai thuốc lá Việt 45+</div>
          </div>
        </div>
        <button onClick={closeWidget} aria-label="Đóng" className="text-sol-paper hover:bg-white/10 w-8 h-8 rounded-full flex items-center justify-center transition">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-sol-cream/30">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-3">👋</div>
            <p className="text-sm text-sol-ink2 mb-3">
              Xin chào! Mình là <strong className="text-sol-brown">Sol</strong>
            </p>
            <p className="text-xs text-sol-ink2 max-w-xs mx-auto mb-4">
              Bấm 1 gợi ý dưới hoặc gõ câu hỏi.
            </p>
            <button
              onClick={() => openExternal('https://bothuocla.sol.vn/test-ftnd')}
              className="text-xs text-sol-orange underline"
            >
              → Làm Test FTND 2 phút
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const isUser = msg.sender_type === 'user';
              const isSystem = msg.sender_type === 'system';
              if (isSystem) return <div key={msg.id} className="text-center text-xs text-sol-ink2 italic">{msg.content}</div>;
              return (
                <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                    isUser ? 'bg-sol-orange text-white rounded-br-sm' : 'bg-white text-sol-ink shadow-sm rounded-bl-sm'
                  }`}>
                    {!isUser && msg.sender_name && <div className="text-xs font-semibold text-sol-orange mb-1">{msg.sender_name}</div>}
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

      {/* Suggested chips */}
      {chips.length > 0 && !needName && !sending && (
        <div className="px-3 pt-2 pb-1 bg-white border-t border-sol-cream flex-shrink-0">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {chips.map((chip) => (
              <button
                key={chip.id} onClick={() => sendMessage(chip.label, chip.id)}
                className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-sol-cream hover:bg-sol-orange hover:text-white text-xs text-sol-brown font-medium transition border border-sol-orange/20 whitespace-nowrap"
              >
                <span>{chip.icon}</span><span>{chip.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Name input */}
      {needName && (
        <form onSubmit={(e) => { e.preventDefault(); if (name.trim().length >= 2) { setNeedName(false); setTimeout(() => sendMessage(inputValue), 100); } }}
          className="p-3 bg-sol-paper border-t border-sol-cream flex-shrink-0">
          <label className="block text-xs font-semibold text-sol-brown mb-1">Anh tên gì?</label>
          <div className="flex gap-2">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="flex-1 px-3 py-2 rounded-lg border border-sol-cream text-sm focus:border-sol-orange focus:outline-none"
              autoFocus
            />
            <button type="submit" className="bg-sol-orange text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-700">OK</button>
          </div>
        </form>
      )}

      {/* Input */}
      {!needName && (
        <div className="p-3 bg-white border-t border-sol-cream flex-shrink-0">
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef} value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(inputValue.trim()); } }}
              placeholder="Gõ câu hỏi..."
              rows={1}
              className="flex-1 px-3 py-2 rounded-xl border border-sol-cream text-sm focus:border-sol-orange focus:outline-none resize-none max-h-24"
              disabled={sending}
            />
            <button
              onClick={() => sendMessage(inputValue.trim())}
              disabled={sending || !inputValue.trim()}
              className="bg-sol-orange text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-orange-700 disabled:opacity-50 transition"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              )}
            </button>
          </div>
          <p className="text-xs text-sol-ink2 text-center mt-2 italic">
            💬 Sol AI trả ngay · Câu khó → Khang Sol reply 24h
          </p>
        </div>
      )}
    </>
  );
}
