import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useStore } from '../state/store';
import { TIER_COLOR, TIER_LABEL, hasFeature } from '../lib/featureGates';
import { CohortBadge, getSeverityCohort } from './CohortBadge';
import type { UserTier } from '../types';

/**
 * Hook detect viewport mobile vs desktop. Dùng matchMedia — listen resize
 * + initial state đồng bộ với SSR-friendly fallback.
 *
 * Tại sao dùng JS thay vì pure CSS `md:hidden`:
 *   - Nếu Tailwind cache không refresh (Vite JIT bug edge case), CSS rule
 *     không generate → nav vẫn render. Cách JS đảm bảo nav KHÔNG render
 *     trong DOM khi desktop → 100% không có chuyện đè content.
 */
function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < breakpoint;
  });
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = (e: MediaQueryListEvent | MediaQueryList) =>
      setIsMobile('matches' in e ? e.matches : false);
    handler(mq);
    if (mq.addEventListener) {
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
    // Safari < 14 fallback
    mq.addListener(handler as any);
    return () => mq.removeListener(handler as any);
  }, [breakpoint]);
  return isMobile;
}

//
// Layout — sidebar + content + mobile bottom nav.
// Refactor v2: BỎ ProfileSetupWizard hoàn toàn. Hồ sơ cai (age, yearsSmoked,
// quitReasons, triggers) edit inline từng field trong /settings — wizard 3
// bước popup là friction không cần thiết.
//
export function Layout() {
  const user = useStore((s) => s.user);
  const logout = useStore((s) => s.logout);
  const nav = useNavigate();
  const isMobile = useIsMobile(); // < 768px → mobile (bottom nav), >= 768px → desktop (sidebar)

  // Sidebar gate theo tier. FREE chỉ thấy Tổng quan + Phân tích cơ bản +
  // Cài đặt + Pricing. Càng nâng tier, càng mở thêm.
  const eff: UserTier = (user?.effectiveTier ?? user?.tier ?? 'FREE') as UserTier;
  const links = useMemo(() => {
    const base: { to: string; label: string; icon: string }[] = [
      { to: '/', label: 'Tổng quan', icon: '🏠' },
      { to: '/chat', label: 'Trò chuyện', icon: '💬' },
      // Silent Companionship 3 tab chính — pivot 2026-05-08
      { to: '/doc', label: 'Đọc', icon: '📖' },
      { to: '/nghe', label: 'Nghe Khang', icon: '🎧' },
      { to: '/hoi', label: 'Hỏi Khang', icon: '💭' },
      // Hành trình luôn hiện — FREE user thấy demo + calendar 30 ngày,
      // paid user thấy data thật. UI consistency > tier gating.
      { to: '/journey', label: 'Hành trình', icon: '🗺️' },
    ];
    if (hasFeature(eff, 'workbook.write') || hasFeature(eff, 'workbook.read.full') || hasFeature(eff, 'workbook.read.week1_2')) {
      base.push({ to: '/workbook', label: 'Sổ Lưu Niệm', icon: '📖' });
    } else {
      // FREE: label "Sổ Lưu Niệm (mẫu)" để rõ là demo
      base.push({ to: '/workbook', label: 'Sổ Lưu Niệm (mẫu)', icon: '📖' });
    }
    base.push({ to: '/analytics', label: 'Phân tích', icon: '📊' });
    if (hasFeature(eff, 'voice.day_1_3_7') || hasFeature(eff, 'voice.day_1_3_7_14_21_30_letter')) {
      base.push({ to: '/voice', label: 'Voice của Khang', icon: '🎙️' });
    }
    if (hasFeature(eff, 'report.day10') || hasFeature(eff, 'report.day30_album')) {
      base.push({ to: '/reports', label: 'Báo cáo', icon: '📄' });
    }
    // Bỏ nav link "Mở khoá ✨" / "Lên Đồng hành" — gây nag liên tục cho FREE.
    // Tier badge ở footer đã có entry vào /pricing (click → /pricing) → đủ rồi.
    // (Trước đây cả nav link + badge → 2 chỗ trùng nhau, vô tình tạo cảm giác bị quảng cáo nhiều.)
    if (hasFeature(eff, 'refund.eligible')) {
      base.push({ to: '/refund', label: 'Hoàn tiền', icon: '💰' });
    }
    base.push({ to: '/settings', label: 'Cài đặt', icon: '⚙️' });
    return base;
  }, [eff]);

  // Mobile bottom nav: chỉ 4 mục core (UX best practice — 3-5 mục max).
  // Sidebar desktop có space → giữ full menu. Mobile rút gọn để user 45+
  // không bị rối với 7 icon nhỏ. Các mục advanced (Voice, Báo cáo, Phân tích,
  // Hoàn tiền) truy cập qua /settings hoặc link trong page Tổng quan.
  const mobileLinks = useMemo(() => {
    // Mobile bottom nav 4 mục core. Hành trình luôn hiện (FREE thấy demo).
    return [
      { to: '/', label: 'Tổng quan', icon: '🏠' },
      { to: '/chat', label: 'Trò chuyện', icon: '💬' },
      { to: '/journey', label: 'Hành trình', icon: '🗺️' },
      { to: '/settings', label: 'Cài đặt', icon: '⚙️' },
    ];
  }, []);

  const tierColor = TIER_COLOR[eff];
  const tierState = user?.tierState;
  const tierSubLine = tierState?.inMaintenance && tierState.maintenanceDaysRemaining !== null
    ? `Bảo trì · còn ${tierState.maintenanceDaysRemaining} ngày`
    : tierState?.daysIntoTier && tierState?.daysRemaining !== null
      ? `Ngày ${tierState.daysIntoTier}${eff === 'KHOI_DONG' ? '/10' : eff === 'DONG_HANH' ? '/30' : ''}`
      : eff === 'FREE'
        ? 'Quan sát SOL'
        : '';

  return (
    <div className="min-h-screen flex print:block bg-sol-bg">
      {/* ── Sidebar (desktop) ──────────────────────────────────────────── */}
      <aside className="hidden md:flex md:w-56 lg:w-64 flex-col border-r border-sol-line bg-sol-paper print:hidden">
        {/* Brand — Day 6 (2026-05-21): "Dashboard / bothuocla.sol.vn" →
            "Đi Cùng Sol / Khang Sol đi cùng" */}
        <div className="p-5 flex items-center gap-3 border-b border-sol-line">
          <div className="h-10 w-10 rounded-full bg-sol-green text-white flex items-center justify-center font-bold text-body">
            🌅
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-body text-sol-ink">Đi Cùng Sol</div>
            <div className="text-meta text-sol-ink-3 truncate">Khang đi cùng anh</div>
          </div>
        </div>

        {/* Main nav — chỉ menu user.
            Check-in giờ là entry trong nav (link sang /chat hoặc /journey). */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 min-h-tap rounded-lg text-body transition',
                  isActive
                    ? 'bg-sol-green-soft text-sol-green-ink font-semibold'
                    : 'text-sol-ink-2 hover:bg-sol-soft hover:text-sol-ink'
                )
              }
            >
              <span className="text-lg">{l.icon}</span>
              <span>{l.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer — user info + cohort + tier + admin shortcut + logout */}
        <div className="p-4 border-t border-sol-line space-y-3">
          <div className="text-meta">
            <div className="font-semibold text-sol-ink truncate">{user?.name}</div>
            <div className="text-sol-ink-3 truncate">{user?.phone}</div>
          </div>

          {/* Day 6 (2026-05-21): Cohort severity badge từ FTND result */}
          {(() => {
            const cohort = getSeverityCohort(user);
            return cohort ? (
              <CohortBadge cohort={cohort} score={user?.ftndScore ?? null} withSubtitle />
            ) : null;
          })()}

          {/* Tier badge */}
          <NavLink
            to={eff === 'FREE' || eff === 'KHOI_DONG' ? '/pricing' : '/settings'}
            className="block rounded-lg p-2.5 transition"
            style={{ background: tierColor.light, borderLeft: `3px solid ${tierColor.bg}` }}
          >
            <div className="flex items-center justify-between">
              <span className="text-meta font-bold" style={{ color: tierColor.bg }}>
                {TIER_LABEL[eff]}
              </span>
              {(eff === 'FREE' || eff === 'KHOI_DONG') && (
                <span className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: tierColor.bg }}>
                  Nâng cấp ›
                </span>
              )}
            </div>
            {tierSubLine && (
              <div className="text-meta text-sol-ink-2 mt-0.5">{tierSubLine}</div>
            )}
          </NavLink>

          {user?.isAdmin && (
            <a
              href={
                typeof window !== 'undefined' && window.location.hostname === 'localhost'
                  ? 'http://localhost:5176'
                  : 'https://admin.sol.vn'
              }
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-meta font-medium transition bg-sol-soft text-sol-ink-2 hover:bg-sol-line"
            >
              <span>🔧</span>
              <span>Admin console</span>
              <span className="ml-auto text-sol-ink-3 text-[11px] uppercase tracking-wide">↗ admin.sol.vn</span>
            </a>
          )}

          <button
            onClick={() => {
              logout();
              nav('/login');
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-meta font-medium text-sol-red-ink hover:bg-sol-red-soft transition"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* ── Main ───────────────────────────────────────────────────────── */}
      {/* Mobile: pb-24 (~96px) = đủ cover bottom nav (~70px) + buffer 26px.
          Desktop: pb-0 (không có nav). JS-based để chắc Tailwind không cache. */}
      <main className={clsx('flex-1 min-w-0', isMobile ? 'pb-24' : 'pb-0')}>
        <Outlet />
      </main>


      {/* ── Mobile bottom nav — JS conditional render (KHÔNG render trong DOM
          khi desktop). Tablet+ (>=768px) dùng sidebar, nav không tồn tại để
          đè. pb safe-area-inset-bottom để tránh notch iPhone đè. */}
      {isMobile && (
      <nav
        className="fixed bottom-0 inset-x-0 bg-sol-paper/95 backdrop-blur border-t border-sol-line flex z-20 print:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
      >
        {mobileLinks.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex-1 py-2 flex flex-col items-center gap-0.5 min-h-tap text-[11px] font-medium',
                isActive ? 'text-sol-green-ink' : 'text-sol-ink-2'
              )
            }
          >
            <span className="text-xl">{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>
      )}

      {/* ROLLBACK 2026-05-02: bỏ widget embed khỏi dashboard.
          Architecture mới: dashboard có /chat page riêng (page-level chat
          render trong main area, giống Hành trình/Sổ tay).
          Widget chỉ dùng cho partner sites + sol.vn. */}
    </div>
  );
}
