/// <reference types="vite/client" />

// Custom env vars used by SOL dashboard.
// Đảm bảo TypeScript hiểu import.meta.env.* mà Vite inject.
interface ImportMetaEnv {
  readonly VITE_API_BASE?: string;
  readonly VITE_WS_BASE?: string;
  readonly VITE_BASE?: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly BASE_URL: string;
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
