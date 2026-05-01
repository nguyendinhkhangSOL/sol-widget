// frontend/src/lib/sentry.ts
//
// Sentry init cho widget. Tách biệt với dashboard's Sentry — sẽ là
// project Sentry riêng "sol-widget" để filter dễ.
//
// Lazy import — không fail nếu @sentry/react chưa cài.

import { Component, type ReactNode } from 'react';

let Sentry: any = null;
let initialized = false;

async function loadSentry() {
  if (Sentry) return Sentry;
  try {
    // Tách path qua biến + @vite-ignore để Vite không phân tích static
    // (tránh fail build/dev khi @sentry/react chưa cài).
    const pkg = '@sentry/react';
    // @ts-ignore — package optional
    Sentry = await import(/* @vite-ignore */ pkg);
    return Sentry;
  } catch {
    return null;
  }
}

export async function initSentry() {
  const dsn = import.meta.env?.VITE_SENTRY_DSN;
  if (!dsn) return;

  const S = await loadSentry();
  if (!S) return;

  S.init({
    dsn,
    environment: import.meta.env?.MODE ?? 'unknown',
    tracesSampleRate: 0.3,
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      S.browserTracingIntegration?.(),
      S.replayIntegration?.({ maskAllInputs: true }),
    ].filter(Boolean),
    initialScope: { tags: { service: 'sol-widget' } },
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
