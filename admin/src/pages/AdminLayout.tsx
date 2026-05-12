// admin/src/pages/AdminLayout.tsx
//
// Route guard + sub-navigation cho admin console.
// Phiên bản admin riêng: route paths không còn prefix /admin/ vì admin.sol.vn
// đã ở root. /admin/users → /users.

import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useStore } from '../state/store';

export function AdminLayout() {
  const user = useStore((s) => s.user);
  const logout = useStore((s) => s.logout);
  const navigate = useNavigate();

  // Đang load user info
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-center">
        <div>
          <div className="text-4xl mb-3">🔐</div>
          <p className="text-body text-sol-ink-2 mb-3">Đang xác thực…</p>
          <a href="/login" className="text-meta text-sol-green underline">
            Hoặc đăng nhập lại
          </a>
        </div>
      </div>
    );
  }

  // KHÔNG phải admin → redirect login
  if (!user.isAdmin) {
    return <Navigate to="/login" replace />;
  }

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  const links = [
    { to: '/', label: 'Bảng điều khiển', icon: '📊', end: true },
    { to: '/users', label: 'Người dùng', icon: '👥' },
    { to: '/refunds', label: 'Hoàn tiền', icon: '💰' },
    { to: '/voice', label: 'Voice Khang', icon: '🎙️' },
    { to: '/cohorts', label: 'Đội Sol', icon: '🗓️' },
    { to: '/analytics', label: 'Phân tích', icon: '📈' },
    { to: '/wiki', label: 'Wiki', icon: '📰' },
    { to: '/ai', label: 'Kết nối AI', icon: '🧠' },
    { to: '/canned-replies', label: 'Câu trả lời sẵn', icon: '💬' },
    { to: '/q-day-checklist', label: 'Checklist Q-Day', icon: '✅' },
    { to: '/content', label: 'Biên tập tin nhắn', icon: '✍️' },
    { to: '/content-audit', label: 'Content audit', icon: '🔍' },
    // Zalo OA — Sol v3 (12-05-2026)
    { to: '/messaging', label: 'Bộ ĐK Nhắn tin', icon: '💬' },
    { to: '/zalo-templates', label: 'Zalo Templates', icon: '📨' },
  ];

  return (
    <div className="min-h-screen">
      {/* Top bar — admin branding + logout */}
      <header className="bg-sol-earth text-white">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-white/15 flex items-center justify-center font-bold">
              S
            </div>
            <div>
              <div className="text-meta uppercase tracking-widest opacity-75">
                Admin Console
              </div>
              <div className="text-body font-bold leading-tight">SOL — Quản trị</div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-meta">
            <span className="opacity-90">
              {user.name ?? user.email ?? user.phone ?? 'admin'}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition text-meta font-semibold"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* Sub-nav tabs */}
      <nav className="bg-sol-paper border-b border-sol-line sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 flex gap-1 overflow-x-auto">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                clsx(
                  'px-4 min-h-tap rounded-t-lg whitespace-nowrap flex items-center gap-2',
                  'border-b-2 -mb-px text-meta font-medium transition',
                  isActive
                    ? 'border-sol-green text-sol-green-ink bg-sol-green-soft'
                    : 'border-transparent text-sol-ink-2 hover:text-sol-ink hover:bg-sol-soft'
                )
              }
            >
              <span aria-hidden="true">{l.icon}</span>
              {l.label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Page content */}
      <main className="max-w-6xl mx-auto p-4 lg:p-8 pb-24 lg:pb-12">
        <Outlet />
      </main>
    </div>
  );
}
