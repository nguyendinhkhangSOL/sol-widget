import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { initSentry, ErrorBoundary } from './lib/sentry';
import './styles.css';

// Init Sentry sớm nhất — phải trước React render.
initSentry();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary
      fallback={({ resetError }) => (
        <div className="min-h-screen flex items-center justify-center p-6 bg-sol-bg">
          <div className="max-w-md text-center">
            <div className="text-4xl mb-3">😟</div>
            <h1 className="text-h2 text-sol-ink mb-2">Có lỗi xảy ra</h1>
            <p className="text-body text-sol-ink-2 mb-4">
              Trang gặp sự cố không mong đợi. Khang đã được thông báo và sẽ
              kiểm tra. Bạn có thể thử lại hoặc về trang chính.
            </p>
            <div className="flex gap-2 justify-center">
              <button onClick={resetError} className="btn-secondary">
                Thử lại
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className="btn-primary"
              >
                Về trang chính
              </button>
            </div>
          </div>
        </div>
      )}
    >
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
