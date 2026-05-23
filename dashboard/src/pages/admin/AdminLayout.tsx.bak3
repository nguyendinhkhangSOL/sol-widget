// dashboard/src/pages/admin/AdminLayout.tsx
// Sol v4 (13-05-2026, Khang) — Sidebar 5 nhóm thay top bar flat.
// Đồng bộ với admin/src/pages/AdminLayout.tsx
//
// Lý do refactor: Khang làm solo, 14 mục ngang choáng. Gom theo tần suất dùng:
//   HÀNG NGÀY → NHẮN TIN → NỘI DUNG → PHÂN TÍCH → HỆ THỐNG

import { useState } from 'react';
import { NavLink, Navigate, Outlet } from 'react-router-dom';
import clsx from 'clsx';
import { useStore } from '../../state/store';

type MenuItem = { to: string; label: string; icon: string; end?: boolean };
type MenuGroup = { title: string; subtitle: string; items: MenuItem[] };

const MENU_GROUPS: MenuGroup[] = [
  {
    title: 'HÀNG NGÀY',
    subtitle: '5 phút mỗi sáng',
    items: [
      { to: '/admin', label: 'Bảng điều khiển', icon: '📊', end: true },
      { to: '/admin/users', label: 'Người dùng', icon: '👥' },
      { to: '/admin/refunds', label: 'Hoàn tiền', icon: '💰' },
    ],
  },
  {
    title: 'NHẮN TIN',
    subtitle: 'Zalo OA · Tin nhắn',
    items: [
      { to: '/admin/canned-replies', label: 'Câu trả lời sẵn', icon: '💬' },
    ],
  },
  {
    title: 'NỘI DUNG',
    subtitle: 'Content + Voice + Wiki',
    items: [
      { to: '/admin/content', label: 'Biên tập tin', icon: '✍️' },
      { to: '/admin/voice', label: 'Voice Khang', icon: '🎙️' },
      { to: '/admin/wiki', label: 'Wiki', icon: '📰' },
      { to: '/admin/q-day-checklist', label: 'Checklist Q-Day', icon: '✅' },
    ],
  },
  {
    title: 'PHÂN TÍCH',
    subtitle: 'Số liệu · Audit',
    items: [
      { to: '/admin/analytics', label: 'Số liệu', icon: '📈' },
      { to: '/admin/content-audit', label: 'Kiểm tra nội dung', icon: '🔍' },
      { to: '/admin/cohorts', label: 'Đội Sol', icon: '🗓️' },
    ],
  },
  {
    title: 'HỆ THỐNG',
    subtitle: 'Cài đặt',
    items: [
      { to: '/admin/ai', label: 'Kết nối AI', icon: '🧠' },
    ],
  },
];

export function AdminLayout() {
  const user = useStore((s) => s.user);
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  return (
    <div className="min-h-screen flex bg-sol-bg">
      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ═══════════ SIDEBAR ═══════════ */}
      <aside
        className={clsx(
          'fixed lg:sticky top-0 left-0 h-screen w-[260px] z-40 transition-transform',
          'bg-white border-r border-sol-line flex flex-col',
          'lg:translate-x-0',
          drawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Logo / Brand */}
        <div className="px-5 py-4 border-b border-sol-line">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-sol-earth text-white flex items-center justify-center font-bold text-sm">
              S
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-meta uppercase tracking-wider text-sol-ink-3 font-semibold">
                Admin
              </div>
              <div className="text-body font-bold text-sol-ink leading-tight">
                Sol Quản trị
              </div>
            </div>
            <button
              onClick={() => setDrawerOpen(false)}
              className="lg:hidden text-sol-ink-3 text-xl px-2"
              aria-label="Đóng menu"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Menu groups */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          {MENU_GROUPS.map((group) => (
            <div key={group.title} className="mb-4">
              <div className="px-3 py-1.5">
                <div className="text-[11px] uppercase tracking-wider font-bold text-sol-ink-3">
                  {group.title}
                </div>
                <div className="text-[11px] text-sol-ink-3/70 mt-0.5">
                  {group.subtitle}
                </div>
              </div>
              <div className="space-y-0.5 mt-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setDrawerOpen(false)}
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center gap-2.5 px-3 py-2 rounded-lg text-meta transition',
                        isActive
                          ? 'bg-sol-green-soft text-sol-green-ink font-semibold'
                          : 'text-sol-ink-2 hover:bg-sol-paper hover:text-sol-ink',
                      )
                    }
                  >
                    <span aria-hidden="true" className="text-base w-5 text-center">
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User info */}
        <div className="px-3 py-3 border-t border-sol-line">
          <div className="px-3 py-2">
            <div className="text-[11px] uppercase tracking-wider text-sol-ink-3 font-semibold">
              Đang đăng nhập
            </div>
            <div className="text-meta font-medium text-sol-ink truncate">
              {user.name ?? user.phone}
            </div>
          </div>
        </div>
      </aside>

      {/* ═══════════ MAIN CONTENT ═══════════ */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <header className="lg:hidden bg-white border-b border-sol-line px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <button
            onClick={() => setDrawerOpen(true)}
            className="text-2xl text-sol-ink"
            aria-label="Mở menu"
          >
            ☰
          </button>
          <div className="text-body font-bold text-sol-ink">Sol Quản trị</div>
          <div className="w-7" />
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 pb-24 lg:pb-12 max-w-6xl mx-auto w-full space-y-6">
          <header className="flex items-baseline justify-between flex-wrap gap-3 hidden lg:flex">
            <div>
              <div className="text-meta uppercase tracking-wider text-sol-ink-3 font-semibold">
                Admin console
              </div>
              <h1 className="text-h1 text-sol-ink mt-1">Quản trị SOL</h1>
            </div>
          </header>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
