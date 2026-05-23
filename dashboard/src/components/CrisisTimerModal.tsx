/**
 * Modal "Đợi 90 giây" — "Tôi đang thèm" — vượt cơn thèm 90 giây với Khang chia sẻ qua Voice.
 * Khoa học: cơn thèm trong não kéo dài 90-180 giây — đợi qua được, mạng dopamine yếu đi.
 *
 * Flow:
 *   1. User bấm trigger button → modal mở
 *   2. Auto-play voice Khang "Anh đợi tôi 90 giây"
 *   3. Countdown 90s → 0
 *   4. Sau timer: 3 nút outcome:
 *      - "Tôi đợi được" (delayed_no_smoke)
 *      - "Tôi vẫn hút" (smoked_after)
 *      - Đóng modal (abandoned)
 */

import { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';

interface Props {
  open: boolean;
  onClose: () => void;
  triggerContext?: 'stress' | 'social' | 'habit' | 'boredom' | 'after_meal' | 'unknown';
}

export function CrisisTimerModal({ open, onClose, triggerContext = 'unknown' }: Props) {
  const [phase, setPhase] = useState<'starting' | 'counting' | 'finished'>('starting');
  const [secondsLeft, setSecondsLeft] = useState(90);
  const [timerId, setTimerId] = useState<string | null>(null);
  const [voice, setVoice] = useState<{ audioUrl: string; title: string } | null>(null);
  const [outcomeMsg, setOutcomeMsg] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!open) return;
    void start();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function cleanup() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  async function start() {
    setPhase('starting');
    setSecondsLeft(90);
    setOutcomeMsg(null);
    try {
      const res = await api.crisisStart(triggerContext);
      setTimerId(res.timerId);
      if (res.voice) {
        setVoice({ audioUrl: res.voice.audioUrl, title: res.voice.title });
        const audio = new Audio(res.voice.audioUrl);
        audio.play().catch(() => {});
        audioRef.current = audio;
      }
      // Start countdown
      startTimeRef.current = Date.now();
      setPhase('counting');
      intervalRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const left = Math.max(0, 90 - elapsed);
        setSecondsLeft(left);
        if (left === 0) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setPhase('finished');
        }
      }, 250);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleOutcome(outcome: 'delayed_no_smoke' | 'smoked_after' | 'abandoned') {
    if (!timerId) {
      onClose();
      return;
    }
    const delaySec = Math.floor((Date.now() - startTimeRef.current) / 1000);
    try {
      const res = await api.crisisEnd(timerId, { outcome, delayDurationSec: delaySec });
      setOutcomeMsg(res.message);
      // Show message 2s then close
      setTimeout(() => {
        cleanup();
        onClose();
      }, 2500);
    } catch (err) {
      console.error(err);
      cleanup();
      onClose();
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
          padding: 32,
          maxWidth: 420,
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}
      >
        {outcomeMsg ? (
          <div>
            <p
              style={{
                fontSize: 18,
                color: '#5C3A1E',
                lineHeight: 1.7,
                margin: '20px 0',
              }}
            >
              {outcomeMsg}
            </p>
          </div>
        ) : (
          <>
            <p
              style={{
                fontSize: 14,
                color: '#8A857C',
                margin: '0 0 8px',
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              {phase === 'finished' ? 'Đã đủ 90 giây' : 'Anh đợi tôi 90 giây'}
            </p>

            <div
              style={{
                fontSize: 64,
                fontWeight: 700,
                color: phase === 'finished' ? '#2E7D32' : '#B25C2C',
                margin: '20px 0',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {secondsLeft}s
            </div>

            {voice && (
              <p
                style={{
                  fontSize: 13,
                  color: '#5A5650',
                  fontStyle: 'italic',
                  margin: '0 0 24px',
                }}
              >
                🎙 Khang: "{voice.title}"
              </p>
            )}

            {phase === 'finished' ? (
              <div>
                <p
                  style={{
                    fontSize: 15.5,
                    color: '#5C3A1E',
                    lineHeight: 1.6,
                    margin: '0 0 20px',
                  }}
                >
                  Anh đã đợi 90 giây. Bây giờ?
                </p>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <button
                    onClick={() => handleOutcome('delayed_no_smoke')}
                    style={{
                      background: '#2E7D32',
                      color: 'white',
                      border: 'none',
                      padding: '12px 20px',
                      borderRadius: 10,
                      cursor: 'pointer',
                      fontSize: 15,
                      fontWeight: 600,
                    }}
                  >
                    Tôi đợi được — không hút
                  </button>
                  <button
                    onClick={() => handleOutcome('smoked_after')}
                    style={{
                      background: 'transparent',
                      color: '#5C3A1E',
                      border: '1px solid #C9BFA8',
                      padding: '12px 20px',
                      borderRadius: 10,
                      cursor: 'pointer',
                      fontSize: 15,
                    }}
                  >
                    Tôi vẫn hút
                  </button>
                  <button
                    onClick={() => handleOutcome('abandoned')}
                    style={{
                      background: 'transparent',
                      color: '#8A857C',
                      border: 'none',
                      padding: '8px 20px',
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                  >
                    Đóng (không trả lời)
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => handleOutcome('abandoned')}
                style={{
                  background: 'transparent',
                  color: '#8A857C',
                  border: 'none',
                  padding: '8px 20px',
                  cursor: 'pointer',
                  fontSize: 13,
                  marginTop: 12,
                }}
              >
                Hủy
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
