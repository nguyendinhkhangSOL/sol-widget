// frontend/src/SolWidget.tsx
//
// Main orchestrator — anonymous-first auth flow (UX v2):
//
//   1. Mount → check URL `?zalo=success&token=...` (Zalo callback) — nếu có,
//      save token, clear URL → bypass anon
//   2. Else → check localStorage `sol_token` — nếu có, init store
//   3. Else → tự động tạo user ẩn danh qua POST /auth/anonymous (deviceUid +
//      originDomain) → user vào widget được ngay, không cần phone/OTP
//
// Khi user muốn liên kết Zalo (recovery + cross-device), bấm nút trong
// Settings hoặc soft prompt sau 3 ngày → redirect Zalo OAuth.

import { useEffect, useRef, useState } from 'react';
import { useStore } from './state/store';
import { api, setApiConfig } from './services/api';
import { useSocket } from './hooks/useSocket';
import { WidgetBubble } from './components/WidgetBubble';
import { WidgetPanel } from './components/WidgetPanel';
import { RecoveryCodeModal } from './components/RecoveryCodeModal';
import { getOrCreateDeviceUid, getOriginDomain } from './lib/deviceUid';

interface SolWidgetProps {
  apiBase?: string;
  socketBase?: string;
  initialOpen?: boolean;
}

export function SolWidget({ apiBase, socketBase, initialOpen }: SolWidgetProps) {
  const token = useStore((s) => s.token);
  const user = useStore((s) => s.user);
  const expanded = useStore((s) => s.expanded);
  const init = useStore((s) => s.init);
  const setUser = useStore((s) => s.setUser);
  const setMessages = useStore((s) => s.setMessages);
  const setExpanded = useStore((s) => s.setExpanded);

  const [authError, setAuthError] = useState<string | null>(null);
  // Layer 3: nếu Zalo callback redirect kèm `?recovery=SOL-...` → hiện modal force save
  const [postBindRecoveryCode, setPostBindRecoveryCode] = useState<string | null>(null);
  // Tránh double-fire anon-create do React StrictMode dev mount-unmount-mount
  const anonInFlight = useRef(false);

  // Configure API base once
  useEffect(() => {
    if (apiBase) setApiConfig({ baseUrl: apiBase });
  }, [apiBase]);

  // Bootstrap auth — 3 đường: Zalo callback / existing token / anonymous
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Zalo OAuth callback?
    const url = new URL(window.location.href);
    const zaloStatus = url.searchParams.get('zalo');
    if (zaloStatus === 'success') {
      const newToken = url.searchParams.get('token');
      const recovery = url.searchParams.get('recovery');
      if (newToken) {
        localStorage.setItem('sol_token', newToken);
        init(newToken);
        // Auto-expand widget — user vừa liên kết Zalo, hiện UI để confirm
        setExpanded(true);
        // Layer 3: nếu backend cấp mã khôi phục mới → hiện modal force save
        if (recovery) setPostBindRecoveryCode(recovery);
        // Clear query params (đỡ rò rỉ token nếu user share URL)
        url.searchParams.delete('zalo');
        url.searchParams.delete('token');
        url.searchParams.delete('recovery');
        window.history.replaceState({}, '', url.toString());
        return;
      }
    }
    if (zaloStatus === 'error') {
      const reason = url.searchParams.get('reason') ?? 'unknown';
      setAuthError(`Liên kết Zalo không thành công: ${reason}`);
      url.searchParams.delete('zalo');
      url.searchParams.delete('reason');
      window.history.replaceState({}, '', url.toString());
      // KHÔNG return — vẫn fall qua anonymous flow để user dùng được
    }

    // 2. Existing token in localStorage?
    const saved = localStorage.getItem('sol_token');
    if (saved) {
      init(saved);
      if (initialOpen) setExpanded(true);
      return;
    }

    // 3. Tạo anonymous user (chống double-fire StrictMode dev)
    if (anonInFlight.current) return;
    anonInFlight.current = true;
    (async () => {
      try {
        const deviceUid = getOrCreateDeviceUid();
        const originDomain = getOriginDomain();
        const { token: t } = await api.anonymous(deviceUid, originDomain);
        localStorage.setItem('sol_token', t);
        init(t);
        if (initialOpen) setExpanded(true);
      } catch (err: any) {
        console.warn('[SOL] anonymous bootstrap failed', err);
        setAuthError('Không kết nối được máy chủ. Thử lại sau.');
      } finally {
        anonInFlight.current = false;
      }
    })();
  }, [init, initialOpen, setExpanded]);

  // Load user + recent messages when token is present
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const [me, msgs] = await Promise.all([api.getMe(), api.getMessages(50)]);
        if (cancelled) return;
        setUser(me);
        setMessages(msgs.messages);
      } catch (err) {
        console.warn('[SOL] bootstrap failed', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, setUser, setMessages]);

  // Socket connection (only when authed)
  useSocket(socketBase ?? apiBase ?? 'http://localhost:4000');

  // Loading state — đang chờ anon-create hoặc bootstrap user
  const isLoading = !token || !user;

  return (
    <div className="sol-widget-root">
      {authError && expanded && (
        <div className="absolute bottom-20 right-4 max-w-[300px] p-3 rounded-xl bg-sol-red text-white text-meta shadow-lg">
          {authError}
        </div>
      )}
      {isLoading ? (
        <WidgetBubble />
      ) : expanded ? (
        <WidgetPanel />
      ) : (
        <WidgetBubble />
      )}
      {/* Layer 3: Recovery code modal — hiện sau khi user vừa bind Zalo lần đầu */}
      {postBindRecoveryCode && (
        <RecoveryCodeModal
          code={postBindRecoveryCode}
          onClose={() => setPostBindRecoveryCode(null)}
        />
      )}
    </div>
  );
}
