import { IDENTITY, type PhaseLanguage } from '../../lib/recovery';

export function IdentityFlow({
  hours,
  phaseLanguage = 'dramatic',
}: {
  hours: number;
  phaseLanguage?: PhaseLanguage;
}) {
  // current = highest identity already earned; next = after current
  let currentIdx = 0;
  for (let i = 0; i < IDENTITY.length; i++) {
    if (hours >= IDENTITY[i].atHours) currentIdx = i;
  }

  // Helper: lấy title/sub theo language
  const titleOf = (id: typeof IDENTITY[number]) =>
    phaseLanguage === 'clinical' && id.clinicalTitle ? id.clinicalTitle : id.title;
  const subOf = (id: typeof IDENTITY[number]) =>
    phaseLanguage === 'clinical' && id.clinicalSub ? id.clinicalSub : id.sub;

  return (
    <>
      <div className="text-[11px] uppercase tracking-wider mb-2.5" style={{ color: 'rgba(255,255,255,.55)' }}>
        {phaseLanguage === 'clinical' ? 'Cessation stage' : 'Danh tính Sol của bạn'}
      </div>
      <div className="flex flex-col mb-4">
        {IDENTITY.map((id, i) => {
          const isDone = i < currentIdx;
          const isCurrent = i === currentIdx;
          const remaining = id.atHours - hours;

          const state = isCurrent ? 'current' : isDone ? 'done' : 'locked';
          const bg =
            state === 'current'
              ? 'rgba(193,126,42,.14)'
              : state === 'done'
                ? 'rgba(255,255,255,.05)'
                : 'transparent';
          const border =
            state === 'current'
              ? '1px solid #C17E2A'
              : state === 'done'
                ? '1px solid rgba(255,255,255,.08)'
                : '1px solid rgba(255,255,255,.04)';
          const opacity = state === 'locked' ? 0.45 : 1;

          return (
            <div key={id.key}>
              <div
                className="flex items-center gap-3 px-3 py-3 rounded-xl"
                style={{ background: bg, border, opacity }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[17px] flex-shrink-0"
                  style={{
                    background:
                      state === 'current'
                        ? 'rgba(193,126,42,.25)'
                        : state === 'done'
                          ? 'rgba(255,255,255,.08)'
                          : 'rgba(255,255,255,.04)',
                    border:
                      state === 'current'
                        ? '1.5px solid #C17E2A'
                        : '1px solid transparent',
                  }}
                >
                  {id.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="text-[13px] font-medium truncate"
                    style={{ color: state === 'current' ? '#FAD99A' : 'rgba(255,255,255,.92)' }}
                  >
                    {titleOf(id)}
                  </div>
                  <div className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,.65)' }}>
                    {subOf(id)}
                  </div>
                </div>
                <div
                  className="text-[10px] font-medium px-2 py-0.5 rounded-md flex-shrink-0"
                  style={{
                    background:
                      state === 'current'
                        ? '#C17E2A'
                        : state === 'done'
                          ? 'rgba(255,255,255,.08)'
                          : 'rgba(255,255,255,.04)',
                    color:
                      state === 'current'
                        ? '#fff'
                        : state === 'done'
                          ? 'rgba(255,255,255,.72)'
                          : 'rgba(255,255,255,.55)',
                  }}
                >
                  {state === 'current'
                    ? 'Hiện tại'
                    : state === 'done'
                      ? 'Đã đạt'
                      : remainLabel(remaining)}
                </div>
              </div>
              {i < IDENTITY.length - 1 && (
                <div
                  className="w-px h-4 ml-[26px] my-0.5"
                  style={{
                    background:
                      state === 'done' || (i === currentIdx && !isCurrent)
                        ? 'rgba(193,126,42,.35)'
                        : 'rgba(255,255,255,.08)',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function remainLabel(h: number): string {
  if (h < 24) return `còn ${Math.ceil(h)}h`;
  if (h < 24 * 60) return `còn ${Math.ceil(h / 24)}n`;
  return `còn ${Math.ceil(h / 24 / 30)}tháng`;
}
