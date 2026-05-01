// dashboard/src/components/EmbeddedWidget.tsx
//
// Inject Sol widget bubble vào dashboard. Cùng cơ chế Khang dùng để cắm widget
// vào partner site — load IIFE bundle từ script tag, widget tự render bubble
// vào body (qua React Portal-like approach trong embed.ts).
//
// Widget chia sẻ:
//   - localStorage `sol_token` → cùng JWT, auto-authed
//   - localStorage `sol_device_uid` → cùng anon identity
//   - Backend API → cùng user account
//
// → User vào dashboard → bubble góc dưới phải → click → ChatView mở đè lên
// dashboard. Không tab-switch, không phải đăng nhập lại.

import { useEffect } from 'react';

const WIDGET_SCRIPT_ID = 'sol-widget-embed';

interface Props {
  /**
   * URL của script embed. Default `/sol-widget.js` (serve từ dashboard public).
   * Production có thể trỏ về CDN: `https://bothuocla.sol.vn/sol-widget.js`.
   */
  scriptUrl?: string;
  /** Backend API base URL — widget cần để gọi /messages, /auth, etc. */
  apiBase?: string;
}

export function EmbeddedWidget({
  scriptUrl = '/sol-widget.js',
  apiBase,
}: Props = {}) {
  useEffect(() => {
    // Idempotent: nếu đã inject script rồi, skip
    if (document.getElementById(WIDGET_SCRIPT_ID)) return;
    // Nếu API global đã tồn tại (vd HMR re-mount), không inject lại
    if ((window as any).SOLWidget) {
      try {
        (window as any).SOLWidget.init({ apiBase });
      } catch {}
      return;
    }

    const script = document.createElement('script');
    script.id = WIDGET_SCRIPT_ID;
    script.src = scriptUrl;
    script.async = true;
    script.onload = () => {
      // Widget IIFE đã load → init với apiBase của dashboard
      try {
        (window as any).SOLWidget?.init({ apiBase });
      } catch (err) {
        console.warn('[Dashboard] Widget init failed', err);
      }
    };
    script.onerror = () => {
      console.warn('[Dashboard] Failed to load widget bundle:', scriptUrl);
    };
    document.body.appendChild(script);

    // KHÔNG cleanup script trên unmount — widget global, share giữa các page
    // navigation. Cleanup chỉ khi user đóng tab.
  }, [scriptUrl, apiBase]);

  return null; // Widget tự inject vào body, không render gì trong React tree
}
