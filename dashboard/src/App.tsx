import { useEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from './state/store';
import { api, isAuthed, setToken } from './services/api';
import { getOrCreateDeviceUid, getOriginDomain } from './lib/deviceUid';
import { RecoveryCodeModal } from './components/RecoveryCodeModal';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { AuthEmailCallback } from './pages/AuthEmailCallback';
import { Overview } from './pages/Overview';
import { Journey } from './pages/Journey';
import { History } from './pages/History';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { Workbook } from './pages/Workbook';
import { Chat } from './pages/Chat';
import { Pricing } from './pages/Pricing';
import { Refund } from './pages/Refund';
import { Reports } from './pages/Reports';
import { VoiceInbox } from './pages/VoiceInbox';
import { Science } from './pages/Science';
import { QDayChecklist } from './pages/QDayChecklist';
// Silent Companionship channels (pivot 2026-05-08)
import { KhoangLang } from './pages/KhoangLang';
import { NgheKhang } from './pages/NgheKhang';
import { HoiKhang } from './pages/HoiKhang';

// Admin đã tách sang admin.sol.vn (admin/ project riêng) — 2026-05-06
// Bundle dashboard giảm ~35% sau khi remove admin imports.

export function App() {
  const user = useStore((s) => s.user);
  const bootstrap = useStore((s) => s.bootstrap);
  const location = useLocation();
  const navigate = useNavigate();

  // Tránh chạy anonymous bootstrap nhiều lần (race condition StrictMode dev)
  const anonInFlight = useRef(false);

  // Layer 3: nếu Zalo callback redirect kèm `?recovery=...` → hiện modal force save
  const [postBindRecoveryCode, setPostBindRecoveryCode] = useState<string | null>(null);

  // ROLLBACK 2026-05-02: bỏ widget embed khỏi dashboard. Architecture mới
  // sẽ có Chat page riêng (`/chat`) trong dashboard, không cần sync events.
  // Widget chỉ dùng cho partner sites + sol.vn (bên ngoài).

  // ─── Bootstrap auth — UX v2 anonymous-first ───────────────────────
  // 3 đường:
  //   1. Zalo OAuth callback → query có ?zalo=success&token=...
  //   2. Existing JWT trong localStorage → bootstrap user
  //   3. Else → tạo anonymous user → save JWT → bootstrap
  //
  // Login page chỉ hiện khi user CHỦ ĐỘNG bấm "Đăng nhập" (vd cần phone OTP)
  // — không còn là gate bắt buộc.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Zalo callback?
    const url = new URL(window.location.href);
    const zaloStatus = url.searchParams.get('zalo');
    if (zaloStatus === 'success') {
      const newToken = url.searchParams.get('token');
      const recovery = url.searchParams.get('recovery');
      if (newToken) {
        setToken(newToken);
        if (recovery) setPostBindRecoveryCode(recovery);
        url.searchParams.delete('zalo');
        url.searchParams.delete('token');
        url.searchParams.delete('recovery');
        window.history.replaceState({}, '', url.toString());
        bootstrap().catch(() => {});
        return;
      }
    }

    // 1.5. Cross-domain JWT transfer từ sol.vn (widget chat marketing)
    // User chat với Sol Widget trên sol.vn → có anon JWT origin sol.vn.
    // Click CTA sang bothuocla.sol.vn → page template forward
    // ?sol_token=...&sol_device_uid=... qua URL.
    // Bothuocla ingest JWT → giữ chat history cross-domain.
    const transferToken = url.searchParams.get('sol_token');
    const transferUid = url.searchParams.get('sol_device_uid');
    if (transferToken && !isAuthed()) {
      setToken(transferToken);
      if (transferUid) {
        try {
          localStorage.setItem('sol_device_uid', transferUid);
        } catch {}
      }
      url.searchParams.delete('sol_token');
      url.searchParams.delete('sol_device_uid');
      window.history.replaceState({}, '', url.toString());
      if (!user) bootstrap().catch(() => {});
      return;
    }

    // 2. Existing token?
    if (isAuthed()) {
      if (!user) bootstrap().catch(() => {});
      return;
    }

    // 3. Anonymous bootstrap — tự tạo user ẩn danh
    if (anonInFlight.current) return;
    anonInFlight.current = true;
    (async () => {
      try {
        const deviceUid = getOrCreateDeviceUid();
        const originDomain = getOriginDomain();
        const { token } = await api.anonymous(deviceUid, originDomain);
        setToken(token);
        await bootstrap();
      } catch (err) {
        console.warn('[Dashboard] anonymous bootstrap failed', err);
        // Fallback: redirect /login để user dùng OTP
        if (location.pathname !== '/login') {
          navigate('/login', { replace: true });
        }
      } finally {
        anonInFlight.current = false;
      }
    })();
  }, [bootstrap, user, location.pathname, navigate]);

  return (
    <>
      {postBindRecoveryCode && (
        <RecoveryCodeModal
          code={postBindRecoveryCode}
          onClose={() => setPostBindRecoveryCode(null)}
        />
      )}
    <Routes>
      <Route path="/login" element={<Login />} />
      {/* Auth callback page — KHÔNG wrap Layout (full-screen verifying view) */}
      <Route path="/auth/email" element={<AuthEmailCallback />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Overview />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/journey" element={<Journey />} />
        <Route path="/journey/:day" element={<Journey />} />
        <Route path="/workbook" element={<Workbook />} />
        <Route path="/history" element={<History />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/refund" element={<Refund />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/voice" element={<VoiceInbox />} />
        <Route path="/science" element={<Science />} />
        <Route path="/q-day-checklist" element={<QDayChecklist />} />
        {/* Silent Companionship — 3 tab chính */}
        <Route path="/doc" element={<KhoangLang />} />
        <Route path="/nghe" element={<NgheKhang />} />
        <Route path="/hoi" element={<HoiKhang />} />
        {/* /admin/* đã tách sang admin.sol.vn — redirect external */}
        <Route path="/admin/*" element={<AdminRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
    </>
  );
}

/**
 * /admin/* legacy URL → redirect sang admin.sol.vn
 * (admin code đã tách sang project riêng từ 2026-05-06)
 */
function AdminRedirect() {
  useEffect(() => {
    const target = 'https://admin.sol.vn';
    // Dev: localhost không reachable, redirect localhost:5176
    const dev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    window.location.href = dev ? 'http://localhost:5176' : target;
  }, []);
  return (
    <div className="min-h-screen flex items-center justify-center p-8 text-center">
      <div>
        <div className="text-3xl mb-3">🔐</div>
        <p className="text-body text-sol-ink-2">Đang chuyển hướng tới admin console…</p>
        <p className="text-meta text-sol-ink-3 mt-2">
          Admin đã tách sang <code>admin.sol.vn</code>
        </p>
      </div>
    </div>
  );
}
