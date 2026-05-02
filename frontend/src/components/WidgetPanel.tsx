// frontend/src/components/WidgetPanel.tsx
// Expanded panel shell: header + view router + footer nav.

import { useEffect, useMemo } from 'react';
import clsx from 'clsx';
import { useStore } from '../state/store';
import { api } from '../services/api';
import { ChatView } from './views/ChatView';
import { CheckinFlow } from './views/CheckinFlow';
import { ExerciseCard } from './views/ExerciseCard';
import { CrisisMode } from './views/CrisisMode';
import { InboxView } from './views/InboxView';
import { HomeView } from './views/HomeView';
import { SettingsView } from './views/SettingsView';
import { JourneyView } from './views/JourneyView';
import { PaywallView } from './views/PaywallView';
import { RefundView } from './views/RefundView';
import { VoiceInboxView } from './views/VoiceInboxView';
import { TierBadge } from './TierBadge';
import type { WidgetView } from '../state/store';

// UX v2: BỎ ProfileSetupWizard hoàn toàn. Hồ sơ cai (age, yearsSmoked,
// quitReasons, triggers) edit inline trong SettingsView. Wizard 3 bước
// popup là friction không cần thiết.

export function WidgetPanel() {
  const user = useStore((s) => s.user);
  const view = useStore((s) => s.view);
  const state = useStore((s) => s.state);
  const setExpanded = useStore((s) => s.setExpanded);
  const setView = useStore((s) => s.setView);
  const markAllRead = useStore((s) => s.markAllRead);
  const unreadCount = useStore((s) => s.unreadCount);

  const dayNumber = useMemo(() => {
    if (!user?.quitDate) return 0;
    const start = new Date(user.quitDate);
    const diff = Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, Math.min(30, diff + 1));
  }, [user?.quitDate]);

  // Mark all read when opened
  useEffect(() => {
    markAllRead();
    // best-effort server call
    api.getMessages(50).then((r) => {
      const unreadIds = r.messages.filter((m) => m.role === 'ASSISTANT' && !m.readAt).map((m) => m.id);
      if (unreadIds.length) api.markRead(unreadIds).catch(() => {});
    }).catch(() => {});
  }, [markAllRead]);

  // Auto-route to crisis view when state flips
  useEffect(() => {
    if (state === 'CRISIS_MODE' && view !== 'crisis') setView('crisis');
  }, [state, view, setView]);

  const isCrisis = state === 'CRISIS_MODE';

  return (
    <div
      role="dialog"
      aria-label="SOL Companion"
      className={clsx(
        'w-[380px] h-[620px] max-w-[96vw] max-h-[92vh] relative',
        'bg-sol-bg rounded-2xl shadow-widget overflow-hidden flex flex-col',
        'animate-slide-up border border-sol-line',
        isCrisis && 'ring-2 ring-sol-red'
      )}
    >
      <Header dayNumber={dayNumber} onClose={() => setExpanded(false)} />
      <div className="flex-1 min-h-0 overflow-hidden">
        <ViewRouter view={view} />
      </div>
      {!isCrisis && <FooterNav current={view} onChange={setView} unreadCount={unreadCount} />}
    </div>
  );
}

function Header({ dayNumber, onClose }: { dayNumber: number; onClose: () => void }) {
  const user = useStore((s) => s.user);
  const streak = user?.checkinStreak ?? 0;
  const state = useStore((s) => s.state);
  const isCrisis = state === 'CRISIS_MODE';

  return (
    <div
      className={clsx(
        'px-4 py-3 flex items-center justify-between',
        isCrisis ? 'bg-sol-red text-white' : 'bg-sol-green text-white'
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
          <span className="text-meta font-bold">SOL</span>
        </div>
        <div className="min-w-0">
          <div className="text-body font-semibold truncate leading-tight">
            {isCrisis ? 'Đang ở bên bạn' : `Ngày ${dayNumber}/30`}
          </div>
          <div className="text-meta opacity-90 truncate flex items-center gap-1.5">
            <span>Chuỗi {streak} ngày</span>
            {!isCrisis && <TierBadge />}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {/* Check-in — button có label text rõ ràng, nổi bật trên header xanh.
            Luôn hiện ở mọi tab (Trang chính / Trò chuyện / Hành trình). */}
        <button
          onClick={() => useStore.getState().setView('checkin')}
          className="px-2.5 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white text-[11px] font-semibold flex items-center gap-1 transition"
          aria-label="Check-in 30 giây"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M5 12.5l4.5 4.5L19 7"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Check-in</span>
        </button>
        {/* Voice Khang — moved from footer tab to header (UX v2) */}
        <HeaderIconButton label="Voice Khang" onClick={() => useStore.getState().setView('voice')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="9" y="3" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.6" />
            <path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </HeaderIconButton>
        <HeaderIconButton label="Cài đặt" onClick={() => useStore.getState().setView('settings')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
            <path
              d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.5-2.3.9a7 7 0 0 0-2-1.2L14 3h-4l-.6 2.4a7 7 0 0 0-2 1.2l-2.3-.9-2 3.5 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.5 2.3-.9c.6.5 1.3.9 2 1.2L10 21h4l.6-2.4c.7-.3 1.4-.7 2-1.2l2.3.9 2-3.5-2-1.5c.1-.4.1-.8.1-1.2Z"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          </svg>
        </HeaderIconButton>
        <HeaderIconButton label="Đóng" onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </HeaderIconButton>
      </div>
    </div>
  );
}

function ViewRouter({ view }: { view: WidgetView }) {
  switch (view) {
    case 'greeting':
      return <HomeView />;
    case 'chat':
      return <ChatView />;
    case 'checkin':
      return <CheckinFlow />;
    case 'exercise':
      return <ExerciseCard />;
    case 'crisis':
      return <CrisisMode />;
    case 'inbox':
      return <InboxView />;
    case 'journey':
      return <JourneyView />;
    case 'settings':
      return <SettingsView />;
    case 'paywall':
      return <PaywallView />;
    case 'refund':
      return <RefundView />;
    case 'voice':
      return <VoiceInboxView />;
    default:
      return <HomeView />;
  }
}

/**
 * 3-tab footer nav (UX v2 — cắt từ 5 tabs xuống 3).
 *
 * Trước đây: Trang chính / Trò chuyện / Hành trình / Bài tập / Hộp thư.
 *            User 45+ Việt confused (Hộp thư vs Trò chuyện overlap message).
 *
 * Bây giờ:   3 tab chính + tab "Trò chuyện" có dot báo unread (gộp inbox).
 *            "Bài tập" gộp vào Hành trình (cùng là content theo ngày).
 *            Voice/Settings access via header icon (vẫn còn).
 *
 * Mapping current → tab highlighted:
 *   - greeting → Trang chính
 *   - chat / inbox / voice → Trò chuyện (chung group)
 *   - journey / exercise → Hành trình (chung group)
 *   - paywall / refund / settings / crisis → không highlight tab nào
 */
function FooterNav({
  current,
  onChange,
  unreadCount,
}: {
  current: WidgetView;
  onChange: (v: WidgetView) => void;
  unreadCount: number;
}) {
  const tabs: {
    key: WidgetView;
    label: string;
    icon: React.ReactNode;
    matches: WidgetView[];
    hasDot?: boolean;
  }[] = [
    {
      key: 'greeting',
      label: 'Trang chính',
      icon: <IconHome />,
      matches: ['greeting'],
    },
    {
      key: 'chat',
      label: 'Trò chuyện',
      icon: <IconChat />,
      matches: ['chat', 'inbox', 'voice'],
      hasDot: unreadCount > 0,
    },
    {
      // Cùng tên "Hành trình" với dashboard tab — UX nhất quán.
      // Phân biệt qua context: widget = quick view trong panel chat,
      // dashboard /journey = full page với chart + workbook + print.
      key: 'journey',
      label: 'Hành trình',
      icon: <IconMap />,
      matches: ['journey', 'exercise'],
    },
  ];

  return (
    <div className="flex border-t border-sol-line bg-sol-paper/80 backdrop-blur">
      {tabs.map((t) => {
        const isActive = t.matches.includes(current);
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={clsx(
              'flex-1 py-2.5 flex flex-col items-center gap-0.5 text-xs font-medium transition-colors min-h-[56px] relative',
              isActive ? 'text-sol-green-ink' : 'text-sol-ink-2 hover:text-sol-ink'
            )}
          >
            <span className="h-6 w-6 flex items-center justify-center relative">
              {t.icon}
              {t.hasDot && (
                <span
                  className="absolute -top-0.5 -right-1 h-2 w-2 rounded-full bg-sol-orange ring-2 ring-sol-paper"
                  aria-label="Có tin chưa đọc"
                />
              )}
            </span>
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function HeaderIconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className="h-8 w-8 rounded-full hover:bg-white/10 flex items-center justify-center"
    >
      {children}
    </button>
  );
}

// Minimal inline icons
const IconHome = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M4 11 12 4l8 7v9a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);
const IconChat = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M4 5h16v11H8l-4 4V5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);
const IconPulse = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M3 12h4l2-6 4 12 2-6h6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
  </svg>
);
const IconBook = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M4 5a2 2 0 0 1 2-2h10v18H6a2 2 0 0 1-2-2V5Z" stroke="currentColor" strokeWidth="1.6" />
    <path d="M16 3h4v18h-4" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);
const IconBell = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M6 16V10a6 6 0 0 1 12 0v6l1.5 2h-15L6 16Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M10 20a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);
const IconMap = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M9 3 3 5v16l6-2 6 2 6-2V3l-6 2-6-2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M9 3v16M15 5v16" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);
const IconGear = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
    <path
      d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.5-2.3.9a7 7 0 0 0-2-1.2L14 3h-4l-.6 2.4a7 7 0 0 0-2 1.2l-2.3-.9-2 3.5 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.5 2.3-.9c.6.5 1.3.9 2 1.2L10 21h4l.6-2.4c.7-.3 1.4-.7 2-1.2l2.3.9 2-3.5-2-1.5c.1-.4.1-.8.1-1.2Z"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
  </svg>
);
