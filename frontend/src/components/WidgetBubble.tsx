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
      {/* No-smoking mark — biểu tượng cấm thuốc lá rõ nghĩa cho user 45+ Việt:
          - Bubble: nền xanh lá (sol-green)
          - Vòng tròn ban: nền TRẮNG, viền ĐỎ
          - Điếu thuốc: ĐEN
          - Gạch chéo cấm: ĐỎ */}
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        {/* Vòng tròn nền trắng + viền đỏ — to hơn (r 9.5) cho dễ nhìn */}
        <circle cx="12" cy="12" r="9.5" fill="white" stroke="#E53935" strokeWidth="2" />
        {/* Filter — bên TRÁI (đầu hút), to hơn */}
        <rect x="6.5" y="10.5" width="3" height="3" fill="#1A1A1A" opacity="0.55" rx="0.4" />
        {/* Body điếu thuốc — bên PHẢI, đen đậm, to hơn */}
        <rect x="9.5" y="10.5" width="8" height="3" fill="#1A1A1A" rx="0.5" />
        {/* Khói thuốc — bốc từ đầu CHÁY (phải), uốn S-shape lên cao.
            Vẽ TRƯỚC slash để slash đè lên trên. */}
        <path
          d="M15.5 10 Q16 8.5 15 7 Q14.5 5.5 15.5 4"
          stroke="#666"
          strokeWidth="1"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />
        <path
          d="M17.5 10 Q18 8.5 17 7 Q16.5 5.5 17.5 4"
          stroke="#666"
          strokeWidth="1"
          strokeLinecap="round"
          fill="none"
          opacity="0.55"
        />
        {/* Gạch chéo đỏ — kéo dài thêm để cover toàn bộ ban circle */}
        <line x1="5.5" y1="5.5" x2="18.5" y2="18.5" stroke="#E53935" strokeWidth="2.6" strokeLinecap="round" />
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
