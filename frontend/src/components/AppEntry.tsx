// frontend/src/components/AppEntry.tsx
//
// App entry cho bothuocla.sol.vn — KHÔNG phải marketing landing page.
// Marketing landing thật ở sol.vn (WordPress + Yoast/Rank Math) theo
// kiến trúc đã chốt. Trang này tối giản, dài < 1 màn hình, mục tiêu duy
// nhất là "đưa user đã quan tâm vào app nhanh nhất".
//
// Pre-auth: hero ngắn + nút "Đăng nhập / Tạo tài khoản" → mở widget AuthGate
// Post-auth: hiện tên user + tier + nút "Vào dashboard →" + widget góc

import { useStore } from '../state/store';
import { TIER_COLOR, TIER_LABEL } from '../lib/featureGates';
import type { UserTier } from '../types';

interface AppEntryProps {
  /** URL dashboard, default lấy từ env VITE_DASHBOARD_URL hoặc localhost:5175 (Vite local) */
  dashboardUrl?: string;
  /** URL marketing site, default sol.vn */
  marketingUrl?: string;
}

export function AppEntry({
  dashboardUrl = import.meta.env?.VITE_DASHBOARD_URL ?? 'http://localhost:5175',
  marketingUrl = import.meta.env?.VITE_MARKETING_URL ?? 'https://sol.vn',
}: AppEntryProps) {
  const token = useStore((s) => s.token);
  const user = useStore((s) => s.user);
  const setExpanded = useStore((s) => s.setExpanded);
  const isAuthed = !!token && !!user;

  return (
    <div className="min-h-screen flex flex-col bg-sol-bg text-sol-ink">
      {/* Header — minimal */}
      <header className="px-5 py-4 flex items-center justify-between border-b border-sol-line bg-sol-paper/60 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-full bg-sol-green text-white flex items-center justify-center font-bold text-meta">
            SOL
          </div>
          <div className="leading-tight">
            <div className="font-bold text-body">bothuocla.sol.vn</div>
            <div className="text-meta text-sol-ink-3">App đồng hành cai thuốc lá</div>
          </div>
        </div>
        <a
          href={marketingUrl}
          className="text-meta text-sol-ink-2 hover:text-sol-ink underline"
        >
          ← Về sol.vn
        </a>
      </header>

      {/* Hero + CTA */}
      <main className="flex-1 flex items-center justify-center px-5 py-10">
        <div className="max-w-lg w-full text-center">
          {!isAuthed ? (
            <>
              <div className="text-meta uppercase tracking-wider text-sol-ink-3 font-semibold">
                Phòng làm việc của bạn
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-sol-ink mt-2 leading-tight">
                Khang sẽ ở bên bạn 30 ngày
              </h1>
              <p className="text-body text-sol-ink-2 mt-3 leading-relaxed">
                Đăng nhập để bắt đầu — hoặc tiếp tục hành trình đang dở.
                Sổ tay, check-in, và Sol Trợ Lý đang chờ.
              </p>

              <div className="mt-6 space-y-2">
                <button
                  onClick={() => setExpanded(true)}
                  className="w-full py-3 rounded-xl bg-sol-green text-white font-semibold text-body shadow-md hover:shadow-lg transition"
                >
                  Đăng nhập / Tạo tài khoản
                </button>
                <a
                  href={marketingUrl}
                  className="block w-full py-2.5 rounded-xl border border-sol-line text-sol-ink-2 font-medium text-body hover:bg-sol-paper transition"
                >
                  Lần đầu tới đây? Xem giới thiệu →
                </a>
              </div>

              <p className="text-meta text-sol-ink-3 mt-4 leading-relaxed">
                Đăng nhập bằng số điện thoại + OTP. Không cần mật khẩu.
              </p>
            </>
          ) : (
            <AuthedHero
              user={user!}
              dashboardUrl={dashboardUrl}
              onOpenWidget={() => setExpanded(true)}
            />
          )}
        </div>
      </main>

      {/* Footer — minimal */}
      <footer className="px-5 py-4 border-t border-sol-line text-meta text-sol-ink-3 flex items-center justify-between flex-wrap gap-2">
        <div>
          © Sol.vn — tái sinh thân, tâm, trí
        </div>
        <div className="flex gap-3">
          <a href={`${marketingUrl}/wiki`} className="hover:text-sol-ink">Wiki</a>
          <a href={`${marketingUrl}/privacy`} className="hover:text-sol-ink">Bảo mật</a>
          <a href={`${marketingUrl}/terms`} className="hover:text-sol-ink">Điều khoản</a>
        </div>
      </footer>
    </div>
  );
}

function AuthedHero({
  user,
  dashboardUrl,
  onOpenWidget,
}: {
  user: { name: string; effectiveTier?: UserTier; tier?: UserTier; tierState?: { daysIntoTier: number | null; daysRemaining: number | null; inMaintenance: boolean; maintenanceDaysRemaining: number | null } };
  dashboardUrl: string;
  onOpenWidget: () => void;
}) {
  const eff: UserTier = (user.effectiveTier ?? user.tier ?? 'FREE') as UserTier;
  const c = TIER_COLOR[eff];
  const ts = user.tierState;

  let dayLine = '';
  if (eff === 'FREE') dayLine = 'Bạn đang quan sát SOL';
  else if (ts?.inMaintenance && ts.maintenanceDaysRemaining !== null)
    dayLine = `Đang bảo trì · còn ${ts.maintenanceDaysRemaining} ngày`;
  else if (ts?.daysIntoTier && ts?.daysRemaining !== null) {
    const total = eff === 'KHOI_DONG' ? 10 : eff === 'DONG_HANH' ? 30 : 0;
    dayLine = total > 0 ? `Ngày ${ts.daysIntoTier}/${total}` : '';
  }

  return (
    <>
      <div className="text-meta uppercase tracking-wider text-sol-ink-3 font-semibold">
        Chào mừng quay lại
      </div>
      <h1 className="text-2xl md:text-3xl font-bold text-sol-ink mt-2 leading-tight">
        {user.name} 👋
      </h1>
      <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
           style={{ background: c.light, color: c.bg }}>
        <span className="h-2 w-2 rounded-full" style={{ background: c.bg }} />
        <span className="font-bold text-meta">{TIER_LABEL[eff]}</span>
        {dayLine && <span className="text-meta opacity-80">· {dayLine}</span>}
      </div>

      <div className="mt-6 space-y-2">
        <a
          href={dashboardUrl}
          className="block w-full py-3 rounded-xl bg-sol-green text-white font-semibold text-body shadow-md hover:shadow-lg transition"
        >
          Vào dashboard →
        </a>
        <button
          onClick={onOpenWidget}
          className="w-full py-2.5 rounded-xl border border-sol-line text-sol-ink-2 font-medium text-body hover:bg-sol-paper transition"
        >
          Mở chat nhanh với Sol
        </button>
      </div>
    </>
  );
}
