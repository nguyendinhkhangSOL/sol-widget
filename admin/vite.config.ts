import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Admin dashboard — admin.sol.vn
//
// Port convention:
//   5173 = frontend widget (Vite)
//   5174 = dashboard Docker
//   5175 = dashboard Vite local
//   5176 = admin Vite local (file này)
//   4000 = backend
//
// Production build serve qua Firebase Hosting site `admin-sol-vn`,
// CNAME admin.sol.vn → admin-sol-vn.web.app.
export default defineConfig({
  plugins: [react()],
  server: { port: 5176 },
});
