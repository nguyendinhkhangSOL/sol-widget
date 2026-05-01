// dashboard/src/lib/sentry.ts
//
// Sentry React integration cho dashboard. Init lazy — chỉ khi
// VITE_SENTRY_DSN được set. Production-only by default.
//
// Lưu ý: import được wrap trong try/catch để tránh fail nếu @sentry/react
// chưa cài (vd dev local lần đầu). Sau npm install, code hoạt động bình thường.

import { Component, type ReactNode } from 'react';

let Sentry: any = null;
let initialized = false;

async function loadSentry() {
  if (Sentry) return Sentry;
  try {
    // Tách path qua biến + @vite-ignore để Vite không phân tích static
    // (tránh fail dev/build khi @sentry/react chưa cài).
    const pkg = '@sentry/react';
    // @ts-ignore — package optional, chỉ cần khi có DSN
    Sentry = await import(/* @vite-ignore */ pkg);
    return Sentry;
  } catch {
    if (import.meta.env?.DEV) {
      console.log('[sentry] @sentry/react chưa cài — chạy npm install để bật.');
    }
    return null;
  }
}

export async function initSentry() {
  const dsn = import.meta.env?.VITE_SENTRY_DSN;
  if (!dsn) {
    if (import.meta.env?.DEV) {
      console.log('[sentry] DSN không có — bỏ qua. Set VITE_SENTRY_DSN để bật.');
    }
    return;
  }

  const S = await loadSentry();
  if (!S) return;

  S.init({
    dsn,
    environment: import.meta.env?.MODE ?? 'unknown',
    integrations: [
      S.browserTracingIntegration?.(),
      S.replayIntegration?.({
        maskAllText: false,
        maskAllInputs: true,
        blockAllMedia: false,
      }),
    ].filter(Boolean),
    tracesSampleRate: 0.5,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    initialScope: { tags: { service: 'sol-dashboard' } },
    beforeSend(event: any) {
      if (event.exception?.values?.[0]?.value?.includes('Network')) {
        return null;
      }
      return event;
    },
  });

  initialized = true;
}

export function setUser(userId: string | null) {
  if (!initialized || !Sentry) return;
  if (userId) Sentry.setUser({ id: userId });
  else Sentry.setUser(null);
}

/**
 * Error Boundary tự viết — fallback cho khi Sentry chưa load. Khi Sentry
 * có và đã init, Sentry.ErrorBoundary tự capture exception. Khi không,
 * boundary này vẫn show fallback UI cho user.
 */
interface BoundaryProps {
  children: ReactNode;
  fallback: (props: { resetError: () => void; error: Error | null }) => ReactNode;
}

interface BoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  constructor(props: BoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    if (initialized && Sentry) {
      Sentry.captureException(error, { contexts: { react: errorInfo } });
    } else {
      console.error('[ErrorBoundary] caught:', error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback({
        resetError: this.resetError,
        error: this.state.error,
      });
    }
    return this.props.children;
  }
}
