// Vitest config — chạy integration tests với DB thật.
// Yêu cầu: DATABASE_URL trong .env.test trỏ về DB test riêng (KHÔNG dùng prod).

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    // Chạy tuần tự — tests dùng DB shared, parallel sẽ race.
    fileParallelism: false,
    // Test DB cần migrate sạch trước run; setup ở tests/setup.ts.
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 15000,
    hookTimeout: 15000,
    env: {
      NODE_ENV: 'test',
    },
  },
});
