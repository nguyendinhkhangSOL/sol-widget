// tests/setup.ts
//
// Setup chạy trước mỗi test file. Load env, reset state.
//
// LƯU Ý: Test DB phải tách riêng với prod/dev DB.
// Tạo .env.test:
//   DATABASE_URL="postgresql://sol:sol@localhost:5432/sol_test"
//   JWT_SECRET="test-secret-32-chars-minimum-yes"
//   NODE_ENV=test
//
// Trước khi chạy test lần đầu:
//   createdb sol_test
//   DATABASE_URL=... npx prisma migrate deploy

import { config as loadEnv } from 'dotenv';
import path from 'path';

// Load .env.test trước, fallback .env
loadEnv({ path: path.resolve(__dirname, '../.env.test') });
loadEnv({ path: path.resolve(__dirname, '../.env'), override: false });

// Sanity check: KHÔNG cho phép chạy test trên DB prod.
const dbUrl = process.env.DATABASE_URL ?? '';
if (
  dbUrl.includes('production') ||
  dbUrl.includes('prod-') ||
  (process.env.NODE_ENV !== 'test' && !dbUrl.includes('test'))
) {
  throw new Error(
    `[test setup] Refused to run tests — DATABASE_URL không trỏ về DB test.\n` +
    `Đặt DATABASE_URL trong .env.test có chữ "test", và NODE_ENV=test.\n` +
    `Current: ${dbUrl}`,
  );
}
