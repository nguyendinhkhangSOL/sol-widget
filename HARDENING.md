# Hardening — Content Audit + Sentry + Integration Tests

Tài liệu này hướng dẫn setup 3 lớp hardening đã build cho SOL.

## 1. Content Audit Tool

**Mục đích:** Quét toàn bộ content động (canned replies, voice library, content items, Q-Day checklist) tìm typo, broken wiki link, duplicate, empty fields. Chạy mỗi tuần để giữ chất lượng nội dung.

**Cách dùng:**
1. Login admin → `/admin/content-audit`
2. Bấm "🔍 Chạy audit"
3. Review findings — sort theo severity high/medium/low
4. Sửa tại nguồn (admin/canned-replies, /admin/voice, /admin/q-day-checklist…)
5. Re-run để verify

**Mở rộng dictionary typo:** Sửa `backend/src/admin/audit/typoDictionary.ts` — thêm pattern mới khi gặp lỗi mới.

**Mở rộng wiki slug list:** Sửa `KNOWN_WIKI_SLUGS` trong `backend/src/admin/audit/contentAudit.ts` — thêm slug khi viết bài mới trên WordPress.

**TODO sau:** tích hợp Google Search Console / WP REST API để auto-sync slug list.

## 2. Sentry — Error Monitoring

**Setup ban đầu (5 phút):**

1. Tạo account miễn phí tại https://sentry.io (free tier 5k events/month)
2. Tạo 3 project:
   - **sol-backend** (Node.js)
   - **sol-dashboard** (React)
   - **sol-widget** (React)
3. Mỗi project có 1 DSN — copy
4. Cấu hình env vars:

`backend/.env` (production):
```
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/project-backend
```

`dashboard/.env.production`:
```
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/project-dashboard
```

`frontend/.env.production`:
```
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/project-widget
```

5. Trên Sentry dashboard, cấu hình alerts:
   - Email Khang khi có error mới
   - Slack/Telegram webhook nếu có channel team

**Lưu ý:** Khi DSN không có, Sentry sẽ silent — không crash app. Dev local không cần Sentry (đã default tắt).

**Test Sentry hoạt động:** Trên backend, gọi `captureError(new Error('test'))` từ một route. Trên frontend, throw error trong component. Sau ~30s vào Sentry dashboard sẽ thấy event.

**Privacy:** Replay integration đã set `maskAllInputs: true` — input form (phone, OTP, payment) tự động bị mask trong recording.

## 3. Integration Tests

**Setup ban đầu (10 phút):**

1. Cài dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Tạo PostgreSQL database test riêng (KHÔNG dùng prod/dev DB):
   ```bash
   createdb sol_test
   ```

3. Tạo `backend/.env.test`:
   ```
   DATABASE_URL="postgresql://sol:sol@localhost:5432/sol_test"
   JWT_SECRET="test-secret-32-chars-minimum-yes-yes"
   NODE_ENV=test
   ```

4. Migrate test DB:
   ```bash
   DATABASE_URL="postgresql://sol:sol@localhost:5432/sol_test" \
     npx prisma migrate deploy
   ```

5. Chạy test:
   ```bash
   npm test          # chạy 1 lần
   npm run test:watch  # watch mode
   ```

**5 test suites:**

| File | Cover gì |
|---|---|
| `tests/payments.test.ts` | Mock checkout, tier upgrade, downgrade block, checklist gate |
| `tests/refunds.test.ts` | Refund eligibility (tier, day window), tính tiền theo công thức |
| `tests/messages.test.ts` | Daily quota FREE/maintenance/paid, reset cross-day |
| `tests/quitDate.test.ts` | Q-Day checklist gate cho PATCH /users/me |
| `tests/checklist.test.ts` | Tick/uncheck idempotency, filter onlyForTier |

**Khi nào chạy:**
- Trước mỗi git push lên branch `main`
- Trong CI (GitHub Actions) tự động — đề xuất setup file `.github/workflows/test.yml`
- Sau khi sửa code liên quan tier/payment/refund/checklist (5 area critical)

**GitHub Actions sample (`backend/.github/workflows/test.yml`):**
```yaml
name: Backend tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: sol
          POSTGRES_PASSWORD: sol
          POSTGRES_DB: sol_test
        ports: ['5432:5432']
        options: --health-cmd pg_isready --health-interval 10s
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm', cache-dependency-path: 'backend/package-lock.json' }
      - run: cd backend && npm ci
      - run: cd backend && npx prisma generate
      - run: cd backend && npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://sol:sol@localhost:5432/sol_test
      - run: cd backend && npm test
        env:
          DATABASE_URL: postgresql://sol:sol@localhost:5432/sol_test
          JWT_SECRET: test-secret-32-chars-minimum-yes-yes
          NODE_ENV: test
```

## Workflow đề xuất hằng tuần

1. **Thứ 2 sáng** — Chạy content audit, sửa typo + broken link.
2. **Thứ 4** — Check Sentry inbox tuần qua, fix error rate cao nhất.
3. **Trước mỗi deploy** — Chạy `npm test` (yêu cầu pass 5/5 suite).
4. **Mỗi tháng** — Review Sentry quotas, tinh chỉnh `tracesSampleRate` nếu vượt free tier.

## Troubleshooting

**Test fail "DATABASE_URL không trỏ về DB test":**
→ Setup `.env.test` đúng + chạy `NODE_ENV=test npm test`.

**Test fail vì Prisma types thiếu (UserTier, PaymentLog…):**
→ Chạy `npx prisma generate` trước.

**Sentry không nhận event:**
→ Check DSN đúng + tài khoản Sentry chưa hết quota free tier. Console log `[sentry] Initialized` xuất hiện khi backend start.

**Content audit báo nhiều typo false positive:**
→ Refine `TYPO_RULES` trong `typoDictionary.ts` — giảm severity từ 'high' xuống 'medium' cho rule không chắc chắn.
