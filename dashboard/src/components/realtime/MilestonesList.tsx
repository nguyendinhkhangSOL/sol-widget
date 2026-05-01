import { MILESTONES, Milestone } from '../../lib/recovery';

export function MilestonesList({ hours }: { hours: number }) {
  // Find the next unlock
  const nextIdx = MILESTONES.findIndex((m) => m.atHours > hours);

  return (
    <>
      <div className="text-[11px] uppercase tracking-wider mb-2.5" style={{ color: 'rgba(255,255,255,.55)' }}>
        Cột mốc hành trình
      </div>
      <div className="flex flex-col gap-1.5 mb-4">
        {MILESTONES.map((m, i) => {
          const done = hours >= m.atHours;
          const isNext = i === nextIdx;
          return <MilestoneRow key={m.key} m={m} done={done} isNext={isNext} hours={hours} />;
        })}
      </div>
    </>
  );
}

function MilestoneRow({
  m,
  done,
  isNext,
  hours,
}: {
  m: Milestone;
  done: boolean;
  isNext: boolean;
  hours: number;
}) {
  const remaining = m.atHours - hours;
  const stateClass = done ? 'rt-done' : isNext ? 'rt-next' : 'rt-locked';

  const bg =
    stateClass === 'rt-done'
      ? 'rgba(255,255,255,.05)'
      : stateClass === 'rt-next'
        ? 'rgba(193,126,42,.1)'
        : 'transparent';
  const border =
    stateClass === 'rt-done'
      ? '1px solid rgba(255,255,255,.07)'
      : stateClass === 'rt-next'
        ? '1px solid #C17E2A'
        : '1px solid transparent';
  const opacity = stateClass === 'rt-locked' ? 0.35 : 1;

  const iconBg =
    stateClass === 'rt-done'
      ? 'rgba(255,255,255,.08)'
      : stateClass === 'rt-next'
        ? 'rgba(193,126,42,.2)'
        : 'rgba(255,255,255,.05)';

  return (
    <div
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition"
      style={{ background: bg, border, opacity }}
    >
      <div
        className="w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0 text-[13px]"
        style={{ background: iconBg }}
      >
        {m.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,.92)' }}>
          {m.name}
        </div>
        <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,.55)' }}>
          {m.desc}
        </div>
      </div>
      <div
        className="text-[10px] font-medium px-2 py-0.5 rounded-md flex-shrink-0"
        style={{
          background:
            stateClass === 'rt-done'
              ? 'rgba(255,255,255,.07)'
              : stateClass === 'rt-next'
                ? '#C17E2A'
                : 'rgba(255,255,255,.04)',
          color:
            stateClass === 'rt-done'
              ? 'rgba(255,255,255,.72)'
              : stateClass === 'rt-next'
                ? '#fff'
                : 'rgba(255,255,255,.6)',
        }}
      >
        {stateClass === 'rt-done' ? '✓ Đạt' : stateClass === 'rt-next' ? formatRemain(remaining) : '🔒'}
      </div>
    </div>
  );
}

function formatRemain(h: number) {
  if (h < 1) return `còn ${Math.round(h * 60)}ph`;
  if (h < 24) return `còn ${h.toFixed(1)}h`;
  return `còn ${Math.ceil(h / 24)}n`;
}
