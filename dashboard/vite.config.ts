import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dashboard được serve ở path /app/ trên Firebase Hosting
// (https://bothuocla.sol.vn/app). Khi local dev (port 5174) thì serve ở /.
//
// Vite tự đọc env variable BASE_URL — anh có thể override bằng:
//   $env:VITE_BASE = "/app/"; npm run build
// Mặc định cho production build là /app/, dev là /.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: process.env.VITE_BASE ?? (command === 'build' ? '/app/' : '/'),
  server: { port: 5174 },
}));
