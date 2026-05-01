// frontend/src/components/views/CrisisMode.tsx
// 90-second breathing + urge-surf loop. Minimal chrome, calm pace.

import { useEffect, useRef, useState } from 'react';
import { useStore } from '../../state/store';
import { api } from '../../services/api';

type Phase = 'intro' | 'breathe' | 'body' | 'choose' | 'resolved';

const BREATH_CYCLES = 6; // ~90 seconds at 4s in / 2s hold / 6s out / 2s hold = 14s — 6 cycles ≈ 84s
const IN_MS = 4000;
const HOLD_MS = 2000;
const OUT_MS = 6000;

export function CrisisMode() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [cycle, setCycle] = useState(0);
  const [stage, setStage] = useState<'in' | 'holdIn' | 'out' | 'holdOut'>('in');
  const [intensity, setIntensity] = useState(8);
  const [endIntensity, setEndIntensity] = useState<number | null>(null);
  const setView = useStore((s) => s.setView);
  const timerRef = useRef<number | null>(null);

  // Breathing loop
  useEffect(() => {
    if (phase !== 'breathe') return;
    const steps: Array<{ s: typeof stage; ms: number }> = [
      { s: 'in', ms: IN_MS },
      { s: 'holdIn', ms: HOLD_MS },
      { s: 'out', ms: OUT_MS },
      { s: 'holdOut', ms: HOLD_MS },
    ];
    let idx = steps.findIndex((x) => x.s === stage);
    if (idx < 0) idx = 0;
    timerRef.current = window.setTimeout(() => {
      const nextIdx = (idx + 1) % steps.length;
      if (nextIdx === 0) {
        const nextCycle = cycle + 1;
        if (nextCycle >= BREATH_CYCLES) {
          setPhase('body');
          return;
        }
        setCycle(nextCycle);
      }
      setStage(steps[nextIdx].s);
    }, steps[idx].ms);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [phase, stage, cycle]);

  async function start() {
    setPhase('breathe');
    setCycle(0);
    setStage('in');
    try {
      await api.sendMessage('SOS', { intent: 'crisis_start', intensity });
    } catch {
      /* noop */
    }
  }

  async function resolve(finalIntensity: number) {
    setEndIntensity(finalIntensity);
    setPhase('resolved');
    try {
      await api.sendMessage('Đã qua cơn', {
        intent: 'sos_resolve',
        intensityStart: intensity,
        intensityEnd: finalIntensity,
      });
    } catch {
      /* noop */
    }
  }

  if (phase === 'intro') {
    return (
      <div className="h-full flex flex-col p-5 bg-sol-red/5">
        <h2 className="text-xl font-semibold text-sol-red">Cơn thèm đang tới</h2>
        <p className="mt-1 text-sm text-sol-ink/80">
          Nó sẽ đi — trung bình trong 3–5 phút. Mình cùng nhau thở qua 90 giây.
        </p>
        <div className="mt-6 bg-white rounded-2xl p-4 border border-black/5">
          <div className="text-sm text-sol-ink/70 mb-2">Lúc này bạn thèm bao nhiêu?</div>
          <input
            type="range"
            min={1}
            max={10}
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            className="w-full accent-sol-red"
          />
          <div className="text-center text-3xl font-bold text-sol-red">{intensity}</div>
        </div>
        <button
          onClick={start}
          className="mt-auto w-full py-3 rounded-xl bg-sol-red text-white font-semibold text-base"
        >
          Bắt đầu hít thở
        </button>
        <button
          onClick={() => setView('chat')}
          className="mt-2 w-full py-2 rounded-xl border border-black/10 text-sm"
        >
          Tôi chỉ muốn nhắn SOL
        </button>
      </div>
    );
  }

  if (phase === 'breathe') {
    const label =
      stage === 'in'
        ? 'Hít vào…'
        : stage === 'holdIn'
        ? 'Giữ…'
        : stage === 'out'
        ? 'Thở ra…'
        : 'Giữ…';
    const scale = stage === 'in' || stage === 'holdIn' ? 1 : 0.55;
    const duration = stage === 'in' ? IN_MS : stage === 'out' ? OUT_MS : HOLD_MS;
    return (
      <div className="h-full flex flex-col items-center justify-center p-5 bg-sol-red/5">
        <div className="text-xs text-sol-ink/60 mb-2">
          Vòng {cycle + 1}/{BREATH_CYCLES}
        </div>
        <div className="text-3xl font-semibold text-sol-red mb-8">{label}</div>
        <div
          className="w-40 h-40 rounded-full bg-sol-red/20 border border-sol-red/40 transition-transform"
          style={{
            transform: `scale(${scale})`,
            transitionDuration: `${duration}ms`,
            transitionTimingFunction: 'ease-in-out',
          }}
        />
        <button
          onClick={() => setPhase('body')}
          className="mt-10 text-xs text-sol-ink/60 underline"
        >
          Bỏ qua hít thở
        </button>
      </div>
    );
  }

  if (phase === 'body') {
    return (
      <div className="h-full flex flex-col p-5 bg-sol-red/5">
        <h2 className="text-xl font-semibold text-sol-red">Quét cơ thể 30 giây</h2>
        <p className="mt-1 text-sm text-sol-ink/80">
          Cơn thèm giống một ngọn sóng. Hãy quan sát nó ở đâu trên cơ thể — ngực, cổ, tay?
          Không cần đẩy nó đi. Chỉ xem nó.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-sol-ink/80 bg-white rounded-2xl p-4 border border-black/5">
          <li>• Hàm có căng không?</li>
          <li>• Vai có nhô lên?</li>
          <li>• Hơi thở có ngắn hơn bình thường?</li>
          <li>• Bụng có siết?</li>
        </ul>
        <p className="mt-4 text-xs text-sol-ink/60">
          Khi bạn sẵn sàng, cho SOL biết cơn thèm lúc này ở mức nào.
        </p>
        <div className="mt-auto">
          <Scale onSubmit={resolve} startAt={Math.max(1, intensity - 2)} />
        </div>
      </div>
    );
  }

  // resolved
  return (
    <div className="h-full flex flex-col items-center justify-center p-5 bg-sol-green/5 text-center">
      <div className="text-5xl mb-3">🌿</div>
      <h2 className="text-xl font-semibold text-sol-green">Bạn vừa vượt qua một cơn.</h2>
      <p className="mt-2 text-sm text-sol-ink/80">
        Từ {intensity} xuống {endIntensity ?? '?'}. Lần sau sẽ dễ hơn một chút.
      </p>
      <div className="mt-6 flex flex-col gap-2 w-full">
        <button
          onClick={() => setView('chat')}
          className="px-4 py-2 rounded-xl bg-sol-green text-white text-sm font-semibold"
        >
          Kể SOL nghe vì sao cơn này đến
        </button>
        <button
          onClick={() => setView('greeting')}
          className="px-4 py-2 rounded-xl border border-black/10 text-sm"
        >
          Về trang chính
        </button>
      </div>
    </div>
  );
}

function Scale({ onSubmit, startAt }: { onSubmit: (v: number) => void; startAt: number }) {
  const [v, setV] = useState(startAt);
  return (
    <div className="bg-white rounded-2xl p-4 border border-black/5">
      <input
        type="range"
        min={0}
        max={10}
        value={v}
        onChange={(e) => setV(Number(e.target.value))}
        className="w-full accent-sol-green"
      />
      <div className="text-center text-3xl font-bold text-sol-green mb-2">{v}</div>
      <button
        onClick={() => onSubmit(v)}
        className="w-full py-2 rounded-xl bg-sol-green text-white font-semibold"
      >
        Đã qua cơn
      </button>
    </div>
  );
}
