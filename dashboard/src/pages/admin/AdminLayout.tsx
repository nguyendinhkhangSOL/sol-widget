// dashboard/src/pages/admin/AdminLayout.tsx
// Route guard + sub-navigation cho tất cả trang /admin.
// Refactor: dùng design tokens (text-h1, text-meta, sol-line) thay vì size-based utilities.

import { NavLink, Navigate, Outlet } from 'react-router-dom';
import clsx from 'clsx';
import { useStore } from '../../state/store';

export function AdminLayout() {
  const user = useStore((s) => s.user);

  if (!user) {
    return (
      <div className="p-8 text-center text-body text-sol-ink-3">
        Đang tải thông tin người dùng…
      </div>
    );
  }
  if (!user.isAdmin) {
    return <Navigate to="/" replace />;
  }

  const links = [
    { to: '/admin', label: 'Bảng điều khiển', icon: '📊', end: true },
    { to: '/admin/users', label: 'Người dùng', icon: '👥' },
    { to: '/admin/refunds', label: 'Hoàn tiền', icon: '💰' },
    { to: '/admin/voice', label: 'Voice Khang', icon: '🎙️' },
    { to: '/admin/cohorts', label: 'Đội Sol', icon: '🗓️' },
    { to: '/admin/analytics', label: 'Phân tích', icon: '📈' },
    { to: '/admin/wiki', label: 'Wiki', icon: '📰' },
    { to: '/admin/ai', label: 'Kết nối AI', icon: '🧠' },
    { to: '/admin/canned-replies', label: 'Câu trả lời sẵn', icon: '💬' },
    { to: '/admin/q-day-checklist', label: 'Checklist Q-Day', icon: '✅' },
    { to: '/admin/content', label: 'Biên tập tin nhắn', icon: '✍️' },
    { to: '/admin/content-audit', label: 'Content audit', icon: '🔍' },
  ];

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-12 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <header className="flex items-baseline justify-between flex-wrap gap-3">
        <div>
          <div className="text-meta uppercase tracking-wider text-sol-ink-3 font-semibold">
            Admin console
          </div>
          <h1 className="text-h1 text-sol-ink mt-1">Quản trị SOL</h1>
        </div>
        <div className="text-meta text-sol-ink-2">
          Đăng nhập:{' '}
          <span className="font-semibold text-sol-ink">{user.name ?? user.phone}</span>
        </div>
      </header>

      {/* Sub-nav tabs */}
      <nav className="flex gap-1 border-b border-sol-line overflow-x-auto -mx-1 px-1">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              clsx(
                'px-4 min-h-tap rounded-t-lg whitespace-nowrap flex items-center gap-2',
                'border-b-2 -mb-px text-body font-medium transition',
                isActive
                  ? 'border-sol-green text-sol-green-ink bg-sol-green-soft'
                  : 'border-transparent text-sol-ink-2 hover:text-sol-ink hover:bg-sol-soft'
              )
            }
          >
            <span>{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}
