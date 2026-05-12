// dashboard/src/components/QuitlineButton.tsx
// Mirror frontend/src/components/QuitlineButton.tsx — đồng bộ khi đổi.

interface QuitlineButtonProps {
  size?: 'large' | 'compact';
  tone?: 'urgent' | 'calm';
  className?: string;
}

const QUITLINE_NUMBER = '18006606';
const QUITLINE_DISPLAY = '1800 6606';
const QUITLINE_LABEL = 'Tổng đài tư vấn cai thuốc miễn phí — BV Bạch Mai';

export function QuitlineButton({
  size = 'compact',
  tone = 'calm',
  className = '',
}: QuitlineButtonProps) {
  const isLarge = size === 'large';
  const isUrgent = tone === 'urgent';

  const bgClass = isUrgent
    ? 'bg-sol-red text-white hover:brightness-110'
    : 'bg-sol-green text-white hover:brightness-110';

  const padClass = isLarge ? 'py-4 px-5 text-body-lg' : 'py-2.5 px-4 text-body';

  return (
    <a
      href={`tel:${QUITLINE_NUMBER}`}
      className={`
        ${className}
        ${bgClass} ${padClass}
        min-h-tap rounded-xl font-semibold shadow-card
        flex items-center justify-center gap-2 transition active:scale-[.98]
      `.trim()}
      aria-label={`Gọi ${QUITLINE_DISPLAY} — ${QUITLINE_LABEL}`}
    >
      <span className="text-2xl shrink-0" aria-hidden="true">📞</span>
      <div className="flex flex-col items-start leading-tight text-left">
        <span>{isUrgent ? '🆘 Gọi cấp cứu' : 'Gọi tổng đài cai thuốc miễn phí'}</span>
        <span className={`${isLarge ? 'text-body' : 'text-meta'} opacity-90 font-mono tracking-wide`}>
          {QUITLINE_DISPLAY}
        </span>
        <span className="text-[11px] opacity-80 italic">{QUITLINE_LABEL}</span>
      </div>
    </a>
  );
}
