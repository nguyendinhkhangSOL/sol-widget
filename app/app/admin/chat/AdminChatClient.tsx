'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Thread {
  id: number;
  display_name: string;
  phone: string | null;
  cohort: string | null;
  unread_admin: number;
  message_count: number;
  last_message_at: string;
  minutes_since_last: number;
  last_message_preview: string | null;
}

interface Message {
  id: number;
  sender_type: 'user' | 'admin' | 'ai' | 'system';
  sender_name: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface Props {
  threads: Thread[];
  selectedThread: Thread | null;
  messages: Message[];
}

export function AdminChatClient({ threads, selectedThread, messages: initialMessages }: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(initialMessages);
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [initialMessages]);

  function selectThread(id: number) {
    router.push(`/chat?thread=${id}`);
  }

  async function sendReply() {
    if (!selectedThread || !reply.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch('/api/admin/chat/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thread_id: selectedThread.id, content: reply.trim() })
      });
      if (!res.ok) throw new Error('Send failed');
      const data = await res.json();
      setMessages(prev => [...prev, {
        id: data.message_id,
        sender_type: 'admin',
        sender_name: 'Khang Sol',
        content: reply.trim(),
        is_read: false,
        created_at: new Date().toISOString()
      }]);
      setReply('');
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, height: 'calc(100vh - 180px)', minHeight: 500 }}>
      {/* Threads list */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid #E5E7EB', background: '#F9FAFB', fontSize: 12, fontWeight: 600, color: '#374151', textTransform: 'uppercase' }}>
          Open Threads
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {threads.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#6B7280', fontSize: 13 }}>
              📭 Chưa có tin nhắn
            </div>
          ) : threads.map(t => (
            <button
              key={t.id}
              onClick={() => selectThread(t.id)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '10px 14px',
                border: 'none',
                borderBottom: '1px solid #F3F4F6',
                background: selectedThread?.id === t.id ? '#EFF6FF' : 'transparent',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 13
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <strong style={{ color: '#111827' }}>
                  {t.display_name}
                  {t.cohort && (
                    <span className={`admin-badge ${t.cohort === 'LIGHT' ? 'green' : t.cohort === 'MODERATE' ? 'amber' : 'red'}`} style={{ marginLeft: 6, fontSize: 10 }}>
                      {t.cohort}
                    </span>
                  )}
                </strong>
                {t.unread_admin > 0 && (
                  <span className="admin-badge red" style={{ fontSize: 10 }}>{t.unread_admin}</span>
                )}
              </div>
              {t.phone && <div style={{ fontSize: 11, color: '#6B7280' }}>📱 {t.phone}</div>}
              {t.last_message_preview && (
                <div style={{ fontSize: 12, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                  {t.last_message_preview}
                </div>
              )}
              <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>
                {Math.round(t.minutes_since_last)} phút · {t.message_count} tin
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Conversation */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {selectedThread ? (
          <>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #E5E7EB', background: '#F9FAFB' }}>
              <strong style={{ fontSize: 14 }}>{selectedThread.display_name}</strong>
              {selectedThread.cohort && (
                <span className={`admin-badge ${selectedThread.cohort === 'LIGHT' ? 'green' : selectedThread.cohort === 'MODERATE' ? 'amber' : 'red'}`} style={{ marginLeft: 8 }}>
                  {selectedThread.cohort}
                </span>
              )}
              {selectedThread.phone && (
                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>
                  📱 {selectedThread.phone} · <a href={`https://zalo.me/${selectedThread.phone}`} target="_blank" rel="noopener noreferrer" style={{ color: '#2563EB' }}>Mở Zalo →</a>
                </div>
              )}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 16, background: '#F9FAFB' }}>
              {messages.map(m => {
                const isAdmin = m.sender_type === 'admin';
                const isAi = m.sender_type === 'ai';
                const isSystem = m.sender_type === 'system';

                if (isSystem) {
                  return (
                    <div key={m.id} style={{ textAlign: 'center', padding: 6, fontSize: 11, color: '#9CA3AF', fontStyle: 'italic' }}>
                      {m.content}
                    </div>
                  );
                }

                const bgColor = isAdmin ? '#2563EB' : isAi ? '#7C3AED' : '#fff';
                const textColor = (isAdmin || isAi) ? '#fff' : '#1F2937';

                return (
                  <div key={m.id} style={{ display: 'flex', justifyContent: (isAdmin || isAi) ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
                    <div style={{
                      maxWidth: '70%',
                      padding: '8px 12px',
                      borderRadius: 12,
                      background: bgColor,
                      color: textColor,
                      fontSize: 13,
                      boxShadow: (isAdmin || isAi) ? 'none' : '0 1px 2px rgba(0,0,0,0.05)'
                    }}>
                      {isAi && <div style={{ fontSize: 10, opacity: 0.8, marginBottom: 2 }}>🤖 AI</div>}
                      <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
                      <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4 }}>
                        {new Date(m.created_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>

            <div style={{ padding: 12, borderTop: '1px solid #E5E7EB', background: '#fff' }}>
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                placeholder="Trả lời với tư cách Khang Sol... (Enter để gửi, Shift+Enter xuống dòng)"
                rows={3}
                className="admin-textarea"
                disabled={sending}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <span style={{ fontSize: 11, color: '#6B7280' }}>Gửi với tên: <strong>Khang Sol</strong></span>
                <button onClick={sendReply} disabled={sending || !reply.trim()} className="admin-btn admin-btn-primary">
                  {sending ? 'Gửi...' : 'Gửi reply →'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 14 }}>
            ← Chọn 1 thread bên trái
          </div>
        )}
      </div>
    </div>
  );
}
