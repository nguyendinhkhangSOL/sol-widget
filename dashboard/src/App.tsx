import { useEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from './state/store';
import { api, isAuthed, setToken } from './services/api';
import { getOrCreateDeviceUid, getOriginDomain } from './lib/deviceUid';
import { RecoveryCodeModal } from './components/RecoveryCodeModal';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Overview } from './pages/Overview';
import { Journey } from './pages/Journey';
import { History } from './pages/History';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { Workbook } from './pages/Workbook';
import { Pricing } from './pages/Pricing';
import { Refund } from './pages/Refund';
import { Reports } from './pages/Reports';
import { VoiceInbox } from './pages/VoiceInbox';
import { Science } from './pages/Science';
import { QDayChecklist } from './pages/QDayChecklist';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminHome } from './pages/admin/AdminHome';
import { AdminAI } from './pages/admin/AdminAI';
import { AdminCannedReplies } from './pages/admin/AdminCannedReplies';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminUserDetail } from './pages/admin/AdminUserDetail';
import { AdminRefunds } from './pages/admin/AdminRefunds';
import { AdminVoice } from './pages/admin/AdminVoice';
import { AdminCohorts } from './pages/admin/AdminCohorts';
import { AdminAnalytics } from './pages/admin/AdminAnalytics';
import { AdminWiki } from './pages/admin/AdminWiki';
import { AdminQDayChecklist } from './pages/admin/AdminQDayChecklist';
import { AdminContentAudit } from './pages/admin/AdminContentAudit';

export function App() {
  const user = useStore((s) => s.user);
  const bootstrap = useStore((s) => s.bootstrap);
  const location = useLocation();
  const navigate = useNavigate();

  // Tránh chạy anonymous bootstrap nhiều lần (race condition StrictMode dev)
  const anonInFlight = useRef(false);

  // Layer 3: nếu Zalo callback redirect kèm `?recovery=...` → hiện modal force save
  const [postBindRecoveryCode, setPostBindRecoveryCode] = useState<string | null>(null);

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
      <Route element={<Layout />}>
        <Route path="/" element={<Overview />} />
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
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminHome />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="users/:id" element={<AdminUserDetail />} />
          <Route path="refunds" element={<AdminRefunds />} />
          <Route path="voice" element={<AdminVoice />} />
          <Route path="cohorts" element={<AdminCohorts />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="wiki" element={<AdminWiki />} />
          <Route path="ai" element={<AdminAI />} />
          <Route path="canned-replies" element={<AdminCannedReplies />} />
          <Route path="q-day-checklist" element={<AdminQDayChecklist />} />
          <Route path="content-audit" element={<AdminContentAudit />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
    </>
  );
}
