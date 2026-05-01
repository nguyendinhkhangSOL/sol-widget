import { useEffect, useRef } from 'react';
import { OrganRing } from '../../lib/recovery';

export function RecoveryRings({ rings }: { rings: OrganRing[] }) {
  return (
    <>
      <div className="text-[11px] uppercase tracking-wider mb-2.5" style={{ color: 'rgba(255,255,255,.55)' }}>
        Đồng hồ hồi phục cơ thể
      </div>
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        {rings.map((r) => (
          <RingCard key={r.key} ring={r} />
        ))}
      </div>
    </>
  );
}

function RingCard({ ring }: { ring: OrganRing }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const S = 48;
    canvas.width = S * dpr;
    canvas.height = S * dpr;
    canvas.style.width = S + 'px';
    canvas.style.height = S + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, S, S);

    const cx = S / 2;
    const cy = S / 2;
    const R = 20;

    // Background
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,.08)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Progress
    if (ring.pct > 0.002) {
      ctx.beginPath();
      ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + ring.pct * Math.PI * 2);
      ctx.strokeStyle = ring.color;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }, [ring.pct, ring.color]);

  return (
    <div
      className="flex items-center gap-2.5 rounded-xl p-3"
      style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.07)' }}
    >
      <div className="relative w-12 h-12 flex-shrink-0">
        <canvas ref={ref} />
        <div
          className="absolute inset-0 flex items-center justify-center text-[11px] font-medium"
          style={{ color: 'rgba(255,255,255,.92)' }}
        >
          {Math.round(ring.pct * 100)}%
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-[13px] font-medium truncate" style={{ color: 'rgba(255,255,255,.95)' }}>
          {ring.label}
        </h4>
        <p className="text-[11px] leading-[1.4] truncate" style={{ color: 'rgba(255,255,255,.72)' }}>
          {ring.status}
        </p>
        <span
          className="text-[10px] font-medium px-1.5 py-0.5 rounded-md inline-block mt-1"
          style={{ background: ring.badgeBg, color: ring.color }}
        >
          {ring.badge}
        </span>
      </div>
    </div>
  );
}
