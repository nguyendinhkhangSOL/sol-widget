import { useEffect, useRef } from 'react';
import { Phase, pad2 } from '../../lib/recovery';

interface Props {
  days: number;
  h: number;
  m: number;
  s: number;
  hours: number;
  phase: Phase;
}

export function RealtimeClock({ days, h, m, s, hours, phase }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = 300;
    const H = 290;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const cx = W / 2;
    const cy = H / 2 + 6;
    const R = 120;

    // Background ring
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,.06)';
    ctx.lineWidth = 12;
    ctx.stroke();

    // 30-tick marks
    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * Math.PI * 2 - Math.PI / 2;
      const inner = R - 22;
      const outer = R - 12;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
      ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
      ctx.strokeStyle = i % 5 === 0 ? 'rgba(255,255,255,.28)' : 'rgba(255,255,255,.10)';
      ctx.lineWidth = i % 5 === 0 ? 1.6 : 1;
      ctx.stroke();
    }

    // Day labels at 4 quadrants (0, 7, 15, 22)
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    ctx.font = '600 9px ui-sans-serif, system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const quadrants = [
      { day: 0, angle: -Math.PI / 2 },
      { day: 7, angle: 0 },
      { day: 15, angle: Math.PI / 2 },
      { day: 22, angle: Math.PI },
    ];
    quadrants.forEach(({ day, angle }) => {
      const tx = cx + Math.cos(angle) * (R + 16);
      const ty = cy + Math.sin(angle) * (R + 16);
      ctx.fillText(day === 0 ? 'N0' : `N${day}`, tx, ty);
    });

    // Progress arc — wraps around if > 30 days (hours / 720)
    const progress = hours / 720; // one full loop every 30 days
    const frac = progress - Math.floor(progress);
    const loops = Math.floor(progress);

    // Faded background trace for loops > 0
    if (loops > 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = phase.color + '33';
      ctx.lineWidth = 12;
      ctx.stroke();
    }

    // Primary arc
    const start = -Math.PI / 2;
    const end = start + frac * Math.PI * 2;
    if (frac > 0.001) {
      ctx.beginPath();
      ctx.arc(cx, cy, R, start, end);
      ctx.strokeStyle = phase.color;
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // Glow head
    const headX = cx + Math.cos(end) * R;
    const headY = cy + Math.sin(end) * R;
    const grad = ctx.createRadialGradient(headX, headY, 0, headX, headY, 22);
    grad.addColorStop(0, phase.color + 'cc');
    grad.addColorStop(1, phase.color + '00');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(headX, headY, 22, 0, Math.PI * 2);
    ctx.fill();

    // White dot head
    ctx.beginPath();
    ctx.arc(headX, headY, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();

    // Inner subtle ring
    ctx.beginPath();
    ctx.arc(cx, cy, R - 30, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,.04)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }, [hours, phase.color]);

  return (
    <div className="relative w-full max-w-[300px] mx-auto mb-4">
      <canvas ref={canvasRef} style={{ width: 300, height: 290, display: 'block' }} />
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div
          className="font-serif font-light leading-none"
          style={{ fontSize: 54, color: '#F5E6C8', letterSpacing: -2 }}
        >
          {days}
        </div>
        <div
          className="mt-1 text-[15px] font-mono tabular-nums"
          style={{ color: 'rgba(255,255,255,.78)', letterSpacing: 0.8 }}
        >
          {pad2(h)}:{pad2(m)}:{pad2(s)}
        </div>
        <div
          className="text-[10px] uppercase mt-2"
          style={{ color: 'rgba(255,255,255,.65)', letterSpacing: '0.1em' }}
        >
          không hút thuốc
        </div>
        <div
          className="mt-2 text-[11px] font-medium rounded-full px-3 py-1"
          style={{ background: phase.bg, color: phase.color }}
        >
          {phase.emoji} {phase.label}
        </div>
      </div>
    </div>
  );
}
