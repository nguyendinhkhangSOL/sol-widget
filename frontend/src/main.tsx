// frontend/src/main.tsx
//
// App entry cho bothuocla.sol.vn — render <AppEntry /> (trang tối giản
// để đăng nhập / vào dashboard) + <SolWidget /> (bubble + panel góc phải).
//
// Đây KHÔNG phải dev harness và KHÔNG phải marketing landing.
// Marketing landing thật ở sol.vn (WordPress) theo kiến trúc đã chốt.

import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppEntry } from './components/AppEntry';
import { SolWidget } from './SolWidget';
import { initSentry, ErrorBoundary } from './lib/sentry';
import './styles.css';

// Init Sentry sớm nhất.
initSentry();

const root =
  document.getElementById('sol-app-root') ??
  document.getElementById('sol-widget-root') ??
  document.getElementById('root') ??
  (() => {
    const el = document.createElement('div');
    el.id = 'sol-app-root';
    document.body.appendChild(el);
    return el;
  })();

const apiBase = import.meta.env?.VITE_API_BASE ?? 'http://localhost:4000';

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ErrorBoundary
      fallback={({ resetError }) => (
        <div className="min-h-screen flex items-center justify-center p-6 bg-sol-bg">
          <div className="max-w-md text-center">
            <div className="text-4xl mb-3">😟</div>
            <h1 className="text-xl font-bold text-sol-ink mb-2">Có lỗi xảy ra</h1>
            <p className="text-sol-ink-2 mb-4">
              Khang đã được thông báo. Bạn thử lại nhé.
            </p>
            <button onClick={resetError} className="btn-primary">
              Thử lại
            </button>
          </div>
        </div>
      )}
    >
      <AppEntry />
      <SolWidget apiBase={apiBase} />
    </ErrorBoundary>
  </React.StrictMode>
);
