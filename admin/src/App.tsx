// admin/src/App.tsx
//
// Admin app routes — chỉ admin pages.
// Auth flow: email magic link (cùng backend với user dashboard).
// JWT trả về có claim `isAdmin`. AdminLayout gate user.isAdmin === true.
//
// KHÔNG có anonymous bootstrap như dashboard — admin luôn bắt login.

import { useEffect, useRef } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useStore } from './state/store';
import { api, isAuthed, setToken } from './services/api';
import { getOrCreateDeviceUid, getOriginDomain } from './lib/deviceUid';
import { AdminLogin } from './pages/AdminLogin';
import { AuthEmailCallback } from './pages/AuthEmailCallback';
import { AdminLayout } from './pages/AdminLayout';
import { AdminHome } from './pages/AdminHome';
import { AdminAI } from './pages/AdminAI';
import { AdminCannedReplies } from './pages/AdminCannedReplies';
import { AdminUsers } from './pages/AdminUsers';
import { AdminUserDetail } from './pages/AdminUserDetail';
import { AdminRefunds } from './pages/AdminRefunds';
import { AdminVoice } from './pages/AdminVoice';
import { AdminCohorts } from './pages/AdminCohorts';
import { AdminAnalytics } from './pages/AdminAnalytics';
import { AdminWiki } from './pages/AdminWiki';
import { AdminQDayChecklist } from './pages/AdminQDayChecklist';
import { AdminContentAudit } from './pages/AdminContentAudit';
import { AdminContent } from './pages/AdminContent';
import { AdminMessaging } from './pages/AdminMessaging';
import { AdminZaloTemplates } from './pages/AdminZaloTemplates';
import { AdminZaloJourney } from './pages/AdminZaloJourney';
import { AdminZaloSos } from './pages/AdminZaloSos';

export function App() {
  const user = useStore((s) => s.user);
  const bootstrap = useStore((s) => s.bootstrap);
  const navigate = useNavigate();
  const bootstrapInFlight = useRef(false);

  // Bootstrap auth — admin cần JWT để gọi /auth/email/request.
  //   1. Nếu đã có JWT → bootstrap user
  //   2. Nếu chưa có JWT → tạo anonymous user (sau đó AdminLogin gọi
  //      requestEmailLink với anon JWT làm Authorization header)
  // Lưu ý: anonymous user KHÔNG có isAdmin. Chỉ sau khi click magic link
  // verify → backend MERGE anon vào user existing có email + isAdmin → JWT
  // mới có claim isAdmin → AdminLayout cho phép vào.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (user) return;
    if (bootstrapInFlight.current) return;

    bootstrapInFlight.current = true;
    (async () => {
      try {
        if (isAuthed()) {
          // 1. Có JWT — bootstrap user
          await bootstrap();
        } else {
          // 2. Chưa có JWT — tạo anon để có Authorization header cho /auth/email/request
          const deviceUid = getOrCreateDeviceUid();
          const originDomain = getOriginDomain();
          const { token } = await api.anonymous(deviceUid, originDomain);
          setToken(token);
          await bootstrap();
        }
      } catch (err) {
        console.warn('[Admin] bootstrap failed', err);
        localStorage.removeItem('sol_token');
        navigate('/login', { replace: true });
      } finally {
        bootstrapInFlight.current = false;
      }
    })();
  }, [user, bootstrap, navigate]);

  return (
    <Routes>
      {/* Auth pages — không wrap AdminLayout */}
      <Route path="/login" element={<AdminLogin />} />
      <Route path="/auth/email" element={<AuthEmailCallback />} />

      {/* Admin pages — wrap AdminLayout (gate isAdmin) */}
      <Route path="/" element={<AdminLayout />}>
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
        <Route path="content" element={<AdminContent />} />
        <Route path="content-audit" element={<AdminContentAudit />} />
        {/* Zalo OA — Sol v3 12-05-2026 */}
        <Route path="messaging" element={<AdminMessaging />} />
        <Route path="zalo-templates" element={<AdminZaloTemplates />} />
        {/* Phase 5 — Sprint 3 — 51-Day Journey Scheduler */}
        <Route path="zalo-journey" element={<AdminZaloJourney />} />
        <Route path="zalo-sos" element={<AdminZaloSos />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
