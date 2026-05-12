/**
 * NGHE KHANG — Voice Library
 * Tab "Nghe" trong app — voice clip Khang theo chủ đề.
 */

import { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';

type Voice = {
  id: string;
  title: string;
  description: string | null;
  audioUrl: string;
  durationSec: number;
  topic: string;
  pinnedAt: string | null;
  listenCount: number;
  reactCount: number;
  createdAt: string;
  myCompletionPct: number;
};

const TOPICS: { value: string; label: string }[] = [
  { value: '', label: 'Tất cả' },
  { value: 'psychoeducation', label: 'Hiểu mình' },
  { value: 'lapse', label: 'Khi hút lại' },
  { value: 'milestone', label: 'Mốc' },
  { value: 'general', label: 'Đồng hành' },
  { value: 'family', label: 'Vợ con' },
  { value: 'social', label: 'Đi nhậu' },
  { value: 'late_night', label: 'Đêm khuya' },
];

function fmtDuration(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  return `${min} phút`;
}

export function NgheKhang() {
  const [items, setItems] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    void load();
  }, [topic]);

  async function load() {
    setLoading(true);
    try {
      const res = await api.voicesList({ topic: topic || undefined });
      setItems(res.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handlePlay(voice: Voice) {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(voice.audioUrl);
    audio.play().catch((err) => {
      console.warn('Audio play failed:', err);
    });
    audioRef.current = audio;
    setPlayingId(voice.id);

    audio.addEventListener('ended', () => {
      setPlayingId(null);
      // Track listen 100%
      api.voiceListen(voice.id, 100, 'manual').catch(() => {});
    });

    // Track partial listen on pause (50%)
    audio.addEventListener('pause', () => {
      const pct = Math.round((audio.currentTime / voice.durationSec) * 100);
      if (pct > 0 && pct < 100) {
        api.voiceListen(voice.id, pct, 'manual').catch(() => {});
      }
    });
  }

  function handleStop() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingId(null);
  }

  async function handleReact(id: string, type: 1 | 2) {
    try {
      const res = await api.voiceReact(id, type);
      setItems((prev) =>
        prev.map((v) =>
          v.id === id
            ? {
                ...v,
                reactCount: v.reactCount + (res.toggled === 'on' ? 1 : -1),
              }
            : v,
        ),
      );
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, color: '#5C3A1E', margin: '0 0 4px' }}>Nghe Khang</h1>
        <p style={{ color: '#8A857C', fontSize: 14, margin: 0 }}>
          Khang nói. Anh nghe. Không ai bắt anh nói gì.
        </p>
      </header>

      <div
        style={{
          marginBottom: 20,
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        {TOPICS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTopic(t.value)}
            style={{
              background: topic === t.value ? '#B25C2C' : 'transparent',
              color: topic === t.value ? 'white' : '#5C3A1E',
              border: '1px solid #E8DFC8',
              padding: '6px 14px',
              borderRadius: 999,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: '#8A857C', padding: 40 }}>Đang tải…</div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#8A857C', padding: 40 }}>
          Chưa có voice cho chủ đề này. Khang sắp record.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {items.map((v) => {
            const isPlaying = playingId === v.id;
            return (
              <article
                key={v.id}
                style={{
                  background: 'white',
                  border: '1px solid #E8DFC8',
                  borderRadius: 12,
                  padding: 16,
                  ...(v.pinnedAt ? { borderLeft: '4px solid #B8860B' } : {}),
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        fontSize: 16,
                        color: '#5C3A1E',
                        margin: '0 0 4px',
                      }}
                    >
                      {v.title}
                    </h3>
                    {v.description && (
                      <p
                        style={{
                          fontSize: 13.5,
                          color: '#5A5650',
                          lineHeight: 1.6,
                          margin: '0 0 8px',
                        }}
                      >
                        {v.description}
                      </p>
                    )}
                    <div
                      style={{
                        fontSize: 12,
                        color: '#8A857C',
                        display: 'flex',
                        gap: 10,
                        flexWrap: 'wrap',
                      }}
                    >
                      <span>{fmtDuration(v.durationSec)}</span>
                      <span>· {v.listenCount} anh em đã nghe</span>
                      {v.myCompletionPct > 0 && (
                        <span style={{ color: '#B25C2C' }}>
                          · Anh đã nghe {v.myCompletionPct}%
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => (isPlaying ? handleStop() : handlePlay(v))}
                    style={{
                      background: isPlaying ? '#8B2D2D' : '#B25C2C',
                      color: 'white',
                      border: 'none',
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      cursor: 'pointer',
                      fontSize: 18,
                      flexShrink: 0,
                    }}
                  >
                    {isPlaying ? '◼' : '▶'}
                  </button>
                </div>

                <div
                  style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: '1px solid #F5EFE3',
                    display: 'flex',
                    gap: 6,
                  }}
                >
                  <button
                    onClick={() => handleReact(v.id, 1)}
                    style={{
                      background: 'transparent',
                      border: '1px solid #E8DFC8',
                      padding: '4px 10px',
                      borderRadius: 999,
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                  >
                    👍
                  </button>
                  <button
                    onClick={() => handleReact(v.id, 2)}
                    style={{
                      background: 'transparent',
                      border: '1px solid #E8DFC8',
                      padding: '4px 10px',
                      borderRadius: 999,
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                  >
                    🙏
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
