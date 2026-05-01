/// <reference types="vite/client" />

// Custom env vars used by SOL widget.
// Đảm bảo TypeScript hiểu import.meta.env.* mà Vite inject.
interface ImportMetaEnv {
  readonly VITE_API_BASE?: string;
  readonly VITE_WS_BASE?: string;
  readonly VITE_VAPID_PUBLIC_KEY?: string;
  /** URL dashboard sau khi user đăng nhập, vd "https://app.sol.vn" */
  readonly VITE_DASHBOARD_URL?: string;
  /** URL marketing site (sol.vn root + WordPress wiki) */
  readonly VITE_MARKETING_URL?: string;
  /** Sentry DSN cho widget (để rỗng = tắt Sentry) */
  readonly VITE_SENTRY_DSN?: string;
  readonly BASE_URL: string;
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
