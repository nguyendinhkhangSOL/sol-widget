// frontend/src/components/views/InboxView.tsx
// Collected notifications (unread + read history). Tap → mark read + deep link.

import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useStore } from '../../state/store';

interface NotifItem {
  id: string;
  type: string;
  title: string;
  body?: string;
  deepLink?: string;
  metadata?: Record<string, any>;
  readAt?: string | null;
  createdAt: string;
}

export function InboxView() {
  const [items, setItems] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);
  const setView = useStore((s) => s.setView);

  useEffect(() => {
    api
      .getInbox()
      .then((r) => setItems(r.inbox ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function open(n: NotifItem) {
    if (!n.readAt) {
      await api.markNotificationRead(n.id).catch(() => {});
      setItems((xs) => xs.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)));
    }
    if (n.deepLink?.startsWith('view:')) {
      const v = n.deepLink.slice(5);
      setView(v as any);
    } else if (n.deepLink?.startsWith('http')) {
      window.open(n.deepLink, '_blank');
    }
  }

  if (loading) return <Center>Đang tải hộp thư…</Center>;
  if (items.length === 0)
    return (
      <Center>
        <div className="text-center">
          <div className="text-3xl mb-2">📭</div>
          <div className="font-semibold">Chưa có thông báo.</div>
          <div className="text-sm text-sol-ink/60 mt-1">SOL sẽ nhắc bạn vào sáng và tối.</div>
        </div>
      </Center>
    );

  return (
    <div className="h-full overflow-y-auto p-3 space-y-2">
      {items.map((n) => (
        <button
          key={n.id}
          onClick={() => open(n)}
          className={`w-full text-left rounded-xl p-3 border ${
            n.readAt ? 'bg-white border-black/5' : 'bg-sol-green/5 border-sol-green/20'
          }`}
        >
          <div className="flex items-start gap-2">
            <div className="text-lg">{iconFor(n.type)}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-sol-ink truncate">{n.title}</div>
              {n.body && <div className="text-xs text-sol-ink/70 mt-0.5 line-clamp-2">{n.body}</div>}
              <div className="text-[10px] text-sol-ink/40 mt-1">{formatTime(n.createdAt)}</div>
            </div>
            {!n.readAt && <div className="w-2 h-2 rounded-full bg-sol-green mt-1" />}
          </div>
        </button>
      ))}
    </div>
  );
}

function iconFor(type: string) {
  switch (type) {
    case 'MORNING_GOAL':
      return '☀️';
    case 'SCIENCE_TIP':
      return '💡';
    case 'PHENOMENA_ALERT':
      return '⚠️';
    case 'EXERCISE':
      return '📒';
    case 'CHECKIN_REMINDER':
      return '🌙';
    case 'CRISIS_PREP':
      return '🫁';
    case 'NIGHT_STORY':
      return '🌌';
    default:
      return '🔔';
  }
}
function formatTime(iso: string) {
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  if (diff < 60_000) return 'vừa xong';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}p trước`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}g trước`;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}
function Center({ children }: { children: React.ReactNode }) {
  return <div className="h-full flex items-center justify-center p-5">{children}</div>;
}
