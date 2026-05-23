/**
 * HỎI KHANG — Anonymous Mailbox + Voice Reply Broadcast
 * Tab "Hỏi" — user submit câu hỏi anonymous, nghe Khang trả lời qua Voice public.
 */

import { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';

type VoiceReply = {
  id: string;
  title: string;
  description: string | null;
  audioUrl: string;
  durationSec: number;
  topic: string;
  listenCount: number;
  reactCount: number;
  createdAt: string;
  questionReplies: { id: string; content: string }[];
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  if (days < 1) return 'hôm nay';
  if (days < 7) return `${days} ngày trước`;
  return `${Math.floor(days / 7)} tuần trước`;
}

function fmtDuration(sec: number): string {
  const min = Math.floor(sec / 60);
  return `${min} phút`;
}

export function HoiKhang() {
  const [tab, setTab] = useState<'ask' | 'replies' | 'mine'>('ask');
  const [voiceReplies, setVoiceReplies] = useState<VoiceReply[]>([]);
  const [myQuestions, setMyQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Submit form
  const [question, setQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    if (tab === 'replies') {
      void loadReplies();
    } else if (tab === 'mine') {
      void loadMine();
    }
  }, [tab]);

  async function loadReplies() {
    setLoading(true);
    try {
      const res = await api.khangVoiceReplies();
      setVoiceReplies(res.items);
    } finally {
      setLoading(false);
    }
  }

  async function loadMine() {
    setLoading(true);
    try {
      const res = await api.khangQuestionsMine();
      setMyQuestions(res.items);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    setSubmitMsg(null);
    if (question.trim().length < 20) {
      setSubmitMsg({ type: 'error', text: 'Anh viết ít nhất 20 ký tự.' });
      return;
    }
    setSubmitting(true);
    try {
      await api.khangQuestionSubmit(question);
      setQuestion('');
      setSubmitMsg({
        type: 'success',
        text: 'Đã nhận. Khang đọc inbox 1-2 lần/tuần. Câu của anh có thể được pick → voice reply Chủ Nhật.',
      });
    } catch (err: any) {
      setSubmitMsg({
        type: 'error',
        text: err.body?.error || 'Có lỗi xảy ra. Anh thử lại sau.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  function handlePlay(voice: VoiceReply) {
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(voice.audioUrl);
    audio.play().catch(() => {});
    audioRef.current = audio;
    setPlayingId(voice.id);
    audio.addEventListener('ended', () => setPlayingId(null));
  }

  function handleStop() {
    if (audioRef.current) audioRef.current.pause();
    audioRef.current = null;
    setPlayingId(null);
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, color: '#5C3A1E', margin: '0 0 4px' }}>Hỏi Khang</h1>
        <p style={{ color: '#8A857C', fontSize: 14, margin: 0 }}>
          Anh hỏi anonymous. Khang trả lời voice public 1-2 lần/tuần.
        </p>
      </header>

      <nav
        style={{
          display: 'flex',
          gap: 4,
          borderBottom: '1px solid #E8DFC8',
          marginBottom: 20,
        }}
      >
        {[
          { key: 'ask', label: 'Gửi câu hỏi' },
          { key: 'replies', label: 'Khang trả lời qua Voice' },
          { key: 'mine', label: 'Câu của tôi' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: tab === t.key ? '2px solid #B25C2C' : '2px solid transparent',
              padding: '10px 16px',
              cursor: 'pointer',
              fontSize: 14,
              color: tab === t.key ? '#B25C2C' : '#5A5650',
              fontWeight: tab === t.key ? 600 : 400,
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'ask' && (
        <section>
          <div
            style={{
              background: '#FFF4EA',
              border: '1px solid #E8DFC8',
              borderRadius: 12,
              padding: 18,
              marginBottom: 16,
            }}
          >
            <p style={{ fontSize: 13.5, color: '#5C3A1E', margin: '0 0 8px', lineHeight: 1.6 }}>
              <strong>Cách Hỏi Khang hoạt động:</strong>
            </p>
            <ol style={{ fontSize: 13.5, color: '#5A5650', lineHeight: 1.7, margin: 0, paddingLeft: 20 }}>
              <li>Anh viết câu hỏi anonymous (Khang không biết anh là ai).</li>
              <li>1-2 lần/tuần Khang đọc inbox, pick 3-5 câu đáng quan tâm chung.</li>
              <li>Khang trả lời qua Voice 5-10 phút broadcast cho tất cả nghe.</li>
              <li>Câu của anh có thể không được chọn — nhưng câu Khang trả lời cho người khác có thể giúp anh.</li>
            </ol>
          </div>

          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder='Vd: "Anh ơi, vợ em tuần sau giỗ bố em — toàn anh em nhậu hút. Em đang Day 12 sạch. Em có nên đi không?"'
            rows={6}
            maxLength={1000}
            style={{
              width: '100%',
              padding: 14,
              borderRadius: 12,
              border: '1px solid #E8DFC8',
              fontFamily: 'inherit',
              fontSize: 14.5,
              resize: 'vertical',
              boxSizing: 'border-box',
              lineHeight: 1.6,
            }}
          />
          <div style={{ fontSize: 12, color: '#8A857C', marginTop: 4 }}>
            {question.length}/1000 ký tự · 1 câu/tuần
          </div>

          {submitMsg && (
            <div
              style={{
                marginTop: 12,
                padding: '10px 14px',
                background: submitMsg.type === 'success' ? '#E8F5E9' : '#FFEBEE',
                color: submitMsg.type === 'success' ? '#2E7D32' : '#8B2D2D',
                borderRadius: 8,
                fontSize: 13.5,
                lineHeight: 1.6,
              }}
            >
              {submitMsg.text}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              marginTop: 16,
              background: '#B25C2C',
              color: 'white',
              border: 'none',
              padding: '12px 28px',
              borderRadius: 8,
              cursor: submitting ? 'wait' : 'pointer',
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            {submitting ? 'Đang gửi…' : 'Gửi câu hỏi'}
          </button>
        </section>
      )}

      {tab === 'replies' && (
        <section>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#8A857C', padding: 40 }}>Đang tải…</div>
          ) : voiceReplies.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#8A857C', padding: 40 }}>
              Khang chưa post voice reply tuần này. Anh quay lại sau nhé.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {voiceReplies.map((v) => {
                const isPlaying = playingId === v.id;
                return (
                  <article
                    key={v.id}
                    style={{
                      background: 'white',
                      border: '1px solid #E8DFC8',
                      borderRadius: 12,
                      padding: 18,
                    }}
                  >
                    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <button
                        onClick={() => (isPlaying ? handleStop() : handlePlay(v))}
                        style={{
                          background: isPlaying ? '#8B2D2D' : '#B25C2C',
                          color: 'white',
                          border: 'none',
                          width: 56,
                          height: 56,
                          borderRadius: '50%',
                          cursor: 'pointer',
                          fontSize: 22,
                          flexShrink: 0,
                        }}
                      >
                        {isPlaying ? '◼' : '▶'}
                      </button>
                      <div style={{ flex: 1 }}>
                        <h3
                          style={{
                            fontSize: 17,
                            color: '#5C3A1E',
                            margin: '0 0 4px',
                          }}
                        >
                          {v.title}
                        </h3>
                        <div
                          style={{
                            fontSize: 12,
                            color: '#8A857C',
                            marginBottom: 10,
                          }}
                        >
                          {fmtDuration(v.durationSec)} · {v.listenCount} anh em đã nghe ·{' '}
                          {timeAgo(v.createdAt)}
                        </div>
                        {v.questionReplies.length > 0 && (
                          <div
                            style={{
                              background: '#FFF4EA',
                              padding: '10px 14px',
                              borderRadius: 8,
                              fontSize: 13,
                              color: '#5A5650',
                              lineHeight: 1.6,
                            }}
                          >
                            <div
                              style={{
                                fontSize: 11,
                                color: '#B25C2C',
                                fontWeight: 600,
                                marginBottom: 6,
                                textTransform: 'uppercase',
                                letterSpacing: 0.5,
                              }}
                            >
                              Câu hỏi Khang trả lời:
                            </div>
                            {v.questionReplies.slice(0, 3).map((q) => (
                              <p
                                key={q.id}
                                style={{
                                  margin: '0 0 4px',
                                  fontStyle: 'italic',
                                }}
                              >
                                "{q.content}"
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {tab === 'mine' && (
        <section>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#8A857C', padding: 40 }}>Đang tải…</div>
          ) : myQuestions.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#8A857C', padding: 40 }}>
              Anh chưa gửi câu hỏi nào. Mở tab "Gửi câu hỏi" nhé.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {myQuestions.map((q) => (
                <article
                  key={q.id}
                  style={{
                    background: 'white',
                    border: '1px solid #E8DFC8',
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <p
                    style={{
                      fontSize: 14.5,
                      color: '#2C2A27',
                      margin: '0 0 10px',
                      lineHeight: 1.6,
                    }}
                  >
                    {q.content}
                  </p>
                  <div style={{ fontSize: 12, color: '#8A857C' }}>
                    Trạng thái:{' '}
                    <span style={{ fontWeight: 600 }}>
                      {q.status === 'PENDING' && 'Đang chờ Khang đọc'}
                      {q.status === 'SELECTED' && 'Khang đã pick — đang chuẩn bị voice'}
                      {q.status === 'ANSWERED' && 'Khang đã voice reply (xem tab Voice)'}
                      {q.status === 'ARCHIVED' && 'Đã lưu (có thể tương đương câu khác)'}
                    </span>
                    · {timeAgo(q.createdAt)}
                  </div>
                  {q.voiceReply && (
                    <div
                      style={{
                        marginTop: 10,
                        padding: '8px 12px',
                        background: '#FFF4EA',
                        borderRadius: 6,
                        fontSize: 13,
                        color: '#5C3A1E',
                      }}
                    >
                      🎙 {q.voiceReply.title}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
