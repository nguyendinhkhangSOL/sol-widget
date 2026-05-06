// frontend/src/components/QuitlineButton.tsx
// Nút gọi tổng đài cai thuốc lá miễn phí — Bệnh viện Bạch Mai 0888-008-866.
//
// Reuse trong: CrisisMode SOS, SlipModal Phase 3-4, SettingsView "Cần giúp đỡ".
// Tự dùng tel: protocol → mở dialer trên mobile, prompt "Allow tel" trên desktop.

interface QuitlineButtonProps {
  /** Variant kích thước: lớn (CrisisMode) hoặc gọn (Settings, SlipModal) */
  size?: 'large' | 'compact';
  /** Tone: red urgent (Crisis), green calm (Settings) */
  tone?: 'urgent' | 'calm';
  /** Override className nếu cần custom layout */
  className?: string;
}

const QUITLINE_NUMBER = '0888008866';
const QUITLINE_DISPLAY = '0888 008 866';
const QUITLINE_LABEL = 'Trung tâm cai thuốc — Bệnh viện Bạch Mai';

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
