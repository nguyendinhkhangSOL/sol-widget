import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dashboard được serve ở path /app/ trên Firebase Hosting
// (https://bothuocla.sol.vn/app). Khi local dev (port 5175) thì serve ở /.
//
// Port convention:
//   5173 = frontend widget (Vite local)
//   5174 = dashboard Docker container (compose mapping)
//   5175 = dashboard Vite local dev (file này)
//   4000 = backend
//
// Vite tự đọc env variable BASE_URL — anh có thể override bằng:
//   $env:VITE_BASE = "/app/"; npm run build
//
// 2026-05-23: Production base = '/' (nginx serve root /var/www/bothuocla-sol-vn).
// Trước đây '/app/' nhưng nginx không có /app/ location → asset 404.
// Dev vẫn '/'. Custom prefix qua env VITE_BASE nếu cần.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: process.env.VITE_BASE ?? '/',
  server: { port: 5175 },
}));
