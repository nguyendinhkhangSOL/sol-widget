/**
 * Lapse Log Modal — "Tôi vừa hút" — log lapse + auto-play voice "không phải fail".
 *
 * Lapse-friendly UX core principle (Marlatt 1985 abstinence violation effect):
 *   - KHÔNG reset streak
 *   - KHÔNG hiện đỏ
 *   - Auto-play voice Khang ngay
 *   - Hỏi nhẹ nhàng "anh đang làm gì lúc đó"
 */

import { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';

interface Props {
  open: boolean;
  onClose: () => void;
}

const CONTEXT_OPTIONS: { value: string; label: string }[] = [
  { value: 'social_drinking', label: 'Đi nhậu' },
  { value: 'stress', label: 'Stress công việc' },
  { value: 'after_meal', label: 'Sau bữa ăn' },
  { value: 'alone_late_night', label: 'Đêm khuya một mình' },
  { value: 'family_conflict', label: 'Mâu thuẫn gia đình' },
  { value: 'funeral', label: 'Đám tang' },
  { value: 'wedding', label: 'Đám cưới' },
  { value: 'other', label: 'Khác' },
];

export function LapseLogModal({ open, onClose }: Props) {
  const [phase, setPhase] = useState<'log' | 'voice' | 'reflect' | 'done'>('log');
  const [count, setCount] = useState(1);
  const [context, setContext] = useState<string>('');
  const [reflection, setReflection] = useState('');
  const [lapseId, setLapseId] = useState<string | null>(null);
  const [voiceData, setVoiceData] = useState<{ audioUrl: string; title: string } | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!open) {
      setPhase('log');
      setCount(1);
      setContext('');
      setReflection('');
      setLapseId(null);
      setVoiceData(null);
      setSubmitMessage(null);
      if (audioRef.current) audioRef.current.pause();
    }
  }, [open]);

  async function handleSubmitLapse() {
    setSubmitting(true);
    try {
      const res = await api.lapseLog({
        cigaretteCount: count,
        context: context as any,
      });
      setLapseId(res.lapse.id);
      setSubmitMessage(res.message);
      if (res.voice) {
        setVoiceData({ audioUrl: res.voice.audioUrl, title: res.voice.title });
        const audio = new Audio(res.voice.audioUrl);
        audio.play().catch(() => {});
        audioRef.current = audio;
      }
      setPhase('voice');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitReflection() {
    if (!lapseId || !reflection.trim()) {
      setPhase('done');
      // Mark recovered
      if (lapseId) await api.lapseRecover(lapseId).catch(() => {});
      setTimeout(onClose, 1500);
      return;
    }
    setSubmitting(true);
    try {
      await api.lapseReflect(lapseId, reflection);
      await api.lapseRecover(lapseId);
      setPhase('done');
      setTimeout(onClose, 2000);
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(44, 42, 39, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#FFF4EA',
          borderRadius: 16,
          padding: 28,
          maxWidth: 480,
          width: '100%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}
      >
        {phase === 'log' && (
          <>
            <h2 style={{ fontSize: 20, color: '#5C3A1E', margin: '0 0 8px' }}>Anh vừa hút lại?</h2>
            <p
              style={{
                fontSize: 14,
                color: '#5A5650',
                lineHeight: 1.6,
                margin: '0 0 18px',
              }}
            >
              Sol KHÔNG reset gì. Anh chỉ ghi để Sol hiểu anh hơn.
            </p>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  fontSize: 13,
                  color: '#5C3A1E',
                  fontWeight: 600,
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                Bao nhiêu điếu?
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                style={{
                  width: 80,
                  padding: 8,
                  borderRadius: 8,
                  border: '1px solid #E8DFC8',
                  fontSize: 16,
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  fontSize: 13,
                  color: '#5C3A1E',
                  fontWeight: 600,
                  display: 'block',
                  marginBottom: 8,
                }}
              >
                Lúc đó anh đang làm gì? (optional)
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {CONTEXT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setContext(opt.value === context ? '' : opt.value)}
                    style={{
                      background: context === opt.value ? '#B25C2C' : 'transparent',
                      color: context === opt.value ? 'white' : '#5C3A1E',
                      border: '1px solid #E8DFC8',
                      padding: '6px 12px',
                      borderRadius: 999,
                      cursor: 'pointer',
                      fontSize: 12.5,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={onClose}
                style={{
                  background: 'transparent',
                  color: '#5A5650',
                  border: '1px solid #C9BFA8',
                  padding: '10px 18px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                Để sau
              </button>
              <button
                onClick={handleSubmitLapse}
                disabled={submitting}
                style={{
                  background: '#B25C2C',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: 10,
                  cursor: submitting ? 'wait' : 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {submitting ? 'Đang ghi…' : 'Ghi nhận'}
              </button>
            </div>
          </>
        )}

        {phase === 'voice' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🎙</div>
              <h2 style={{ fontSize: 18, color: '#5C3A1E', margin: '0 0 8px' }}>{submitMessage}</h2>
              {voiceData && (
                <p style={{ fontSize: 13.5, color: '#8A857C', margin: '0 0 14px' }}>
                  Khang đang nói với anh — "{voiceData.title}"
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={() => setPhase('reflect')}
                style={{
                  background: '#B25C2C',
                  color: 'white',
                  border: 'none',
                  padding: '10px 22px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Nói tiếp
              </button>
            </div>
          </>
        )}

        {phase === 'reflect' && (
          <>
            <h2 style={{ fontSize: 18, color: '#5C3A1E', margin: '0 0 8px' }}>
              Khi anh hút điếu đó, anh đang nghĩ gì?
            </h2>
            <p style={{ fontSize: 13, color: '#5A5650', margin: '0 0 14px' }}>
              Optional. Anh viết hay không cũng được.
            </p>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="Vd: 'Mình stress công việc, đi xuống lấy gói thuốc cũ trong tủ...'"
              rows={4}
              maxLength={2000}
              style={{
                width: '100%',
                padding: 10,
                borderRadius: 8,
                border: '1px solid #E8DFC8',
                fontFamily: 'inherit',
                fontSize: 14,
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14 }}>
              <button
                onClick={handleSubmitReflection}
                disabled={submitting}
                style={{
                  background: 'transparent',
                  color: '#5A5650',
                  border: '1px solid #C9BFA8',
                  padding: '10px 18px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                Bỏ qua
              </button>
              <button
                onClick={handleSubmitReflection}
                disabled={submitting}
                style={{
                  background: '#B25C2C',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: 10,
                  cursor: submitting ? 'wait' : 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {submitting ? 'Đang lưu…' : 'Xong'}
              </button>
            </div>
          </>
        )}

        {phase === 'done' && (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🌱</div>
            <p style={{ fontSize: 16, color: '#5C3A1E', lineHeight: 1.7, margin: 0 }}>
              Anh đã ở lại với Sol. Mai sáng mở lại nhé.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
