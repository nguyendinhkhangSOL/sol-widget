// frontend/src/components/WidgetBubble.tsx
// Collapsed floating icon with unread badge. Click to expand.

import clsx from 'clsx';
import { useStore } from '../state/store';

export function WidgetBubble() {
  const unread = useStore((s) => s.unreadCount);
  const setExpanded = useStore((s) => s.setExpanded);
  const state = useStore((s) => s.state);

  const isCrisis = state === 'CRISIS_MODE';

  return (
    <button
      aria-label="Mở SOL Companion"
      onClick={() => setExpanded(true)}
      className={clsx(
        'relative h-14 w-14 rounded-full shadow-widget transition-transform',
        'flex items-center justify-center',
        'hover:scale-105 active:scale-95',
        isCrisis ? 'bg-sol-red animate-pulse' : 'bg-sol-green'
      )}
    >
      {/* No-smoking mark — biểu tượng cấm thuốc lá rõ nghĩa cho user 45+
          Việt. Trên nền xanh lá, icon trắng: vòng tròn ban + điếu thuốc
          + khói + gạch chéo. */}
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        {/* Outer ban ring */}
        <circle cx="12" cy="12" r="9.5" stroke="white" strokeWidth="1.8" opacity="0.95" />
        {/* Cigarette body */}
        <rect x="6" y="11" width="7.5" height="2" fill="white" rx="0.4" />
        {/* Filter (slightly transparent để phân biệt với body) */}
        <rect x="13.7" y="11" width="2.5" height="2" fill="white" opacity="0.6" rx="0.3" />
        {/* Smoke wisps */}
        <path d="M7.5 9.5 Q8 8 7 6.5" stroke="white" strokeWidth="0.95" strokeLinecap="round" fill="none" opacity="0.55" />
        <path d="M10 9.5 Q10.5 8 9.5 6.5" stroke="white" strokeWidth="0.95" strokeLinecap="round" fill="none" opacity="0.55" />
        {/* Diagonal slash — đủ dày để nổi trên cigarette */}
        <line x1="5.7" y1="5.7" x2="18.3" y2="18.3" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
      </svg>

      {unread > 0 && (
        <span
          className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-sol-orange text-white text-[11px] font-semibold flex items-center justify-center ring-2 ring-white"
          aria-label={`${unread} tin chưa đọc`}
        >
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  );
}
