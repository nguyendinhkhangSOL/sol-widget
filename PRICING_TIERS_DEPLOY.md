# Triển khai 3-tier pricing — Hướng dẫn deploy

Tài liệu này tóm tắt thay đổi vừa làm cho hệ thống SOL: thêm 3 gói (Free / Khởi động 99k / Đồng hành 199k) + hệ quản trị tương ứng + replace wiki editor bằng 2 widget WordPress.

## Bước cần chạy trước khi build

Mọi thay đổi backend phụ thuộc vào schema mới. Trên máy có network thường:

```bash
cd backend
npx prisma generate          # tạo lại @prisma/client với types mới
npx prisma migrate deploy    # apply migration mới (20260427120000_pricing_tiers)
```

Sau đó:

```bash
cd backend && npm run build
cd dashboard && npm run build
cd frontend && npm run build
```

> **Lưu ý sandbox:** môi trường Cowork sandbox chặn `binaries.prisma.sh` nên không tự generate được. Trên máy thật / CI sẽ chạy bình thường.

## Thay đổi schema (DB)

File: `backend/prisma/schema.prisma` + migration `20260427120000_pricing_tiers/migration.sql`.

**Enum mới:** `UserTier`, `PaymentStatus`, `PaymentProvider`, `RefundStatus`, `VoiceTriggerType`.

**User mở rộng:** `tier`, `tierStartedAt`, `tierExpiresAt`, `maintenanceUntil`, `dailyMessageCount`, `dailyMessageDate`, `riskScore`, `riskScoreUpdated`, `cohortKey`.

**Models mới:**
- `PaymentLog` — mọi giao dịch (mock + provider thật sau này)
- `RefundRequest` — user yêu cầu hoàn tiền + admin xét duyệt
- `VoiceMessage` — Khang upload mp3 + tag (DAY_MATCH / CRISIS / MILESTONE / MANUAL)
- `VoiceDelivery` — log idempotent gửi voice cho user nào
- `Cohort` — tháng X có bao nhiêu user, retention

## Kiến trúc backend

`backend/src/tiers/featureGates.ts` — single source of truth:
- `MATRIX[tier]` → set các `FeatureKey` được phép
- `computeTierState(user)` → daysIntoTier, daysRemaining, canRequestRefund, refundAmountVnd
- `effectiveTier(user)` → tự downgrade FREE khi KHOI_DONG hết hạn, ALUMNI khi maintenance hết
- `quotaFor(tier, inMaintenance)` → 5/ngày FREE, 10/ngày maintenance/alumni, unlimited otherwise

`backend/src/auth/middleware.ts`:
- `tierMiddleware` — load tier vào req
- `requireFeature(key)` — gate route, trả 402 khi miss
- `messageQuotaMiddleware` — đếm tin/ngày, reject 402 quota_exceeded

Routes mới:
- `/tiers/me`, `/tiers/catalog` — info gói + danh mục
- `/payments/checkout` (mock → tạo PaymentLog + apply upgrade), `/payments/me`, `/payments/:id`
- `/refunds/request`, `/refunds/me`, `/refunds/:id/cancel`
- `/voice/inbox`, `/voice/:id/played`

Admin routes mở rộng (`backend/src/admin/routes.ts`):
- `GET /admin/dashboard` — Khang nhìn 5 phút mỗi sáng (needsAttention, revenue today, tier breakdown…)
- `GET /admin/users`, `GET /admin/users/:id`, `PATCH /admin/users/:id` (comp tier, risk, isAdmin)
- `GET /admin/refunds`, `POST /admin/refunds/:id/decision`, `POST /admin/refunds/:id/processed`
- `GET/POST/PATCH/DELETE /admin/voice` + `POST /admin/voice/:id/send` (gửi manual)
- `GET /admin/cohorts`, `GET /admin/analytics/funnel`, `GET /admin/analytics/revenue`
- `GET /admin/wiki/stats` — link tắt + analytics (mock — tích hợp GSC/GA4 sau)

## Kiến trúc frontend

**Mirror feature gates** ở `dashboard/src/lib/featureGates.ts` và `frontend/src/lib/featureGates.ts` (UI-only — server vẫn là nguồn tin cậy).

**Widget (frontend/) — components mới:**
- `TierBadge.tsx` — chip nhỏ trong header
- `views/PaywallView.tsx` — 3-step paywall (Khang's story → bullets → pay)
- `views/RefundView.tsx` — 3-step refund (lý do → số tiền → confirm)
- `views/VoiceInboxView.tsx` — danh sách voice Khang

**Widget — gating:**
- `WidgetPanel` header có `TierBadge` click mở paywall
- `ChatView` hiện `X/N tin hôm nay` cho FREE, disable input + paywall CTA khi hết quota
- 402 từ backend → `setView('paywall')`

**Dashboard (dashboard/) — pages mới:**
- `/pricing` — 3 cột FREE/KHOI_DONG/DONG_HANH
- `/refund` — full-page refund flow
- `/reports` — báo cáo Ngày 10 + Album 30 ngày
- `/voice` — voice inbox

**Dashboard — sidebar gate by tier:** Layout.tsx tính `links` theo `effectiveTier`:
- FREE: Tổng quan, Sổ tay (mẫu), Phân tích, Mở khoá ✨, Cài đặt
- KHOI_DONG: + Hành trình, Sổ tay đầy đủ, Voice Khang, Báo cáo, Lên Đồng hành
- DONG_HANH: + Hoàn tiền

## Hệ quản trị (admin)

Các pages mới (`dashboard/src/pages/admin/`):
- `AdminHome.tsx` — bảng điều khiển 6 widget (needsAttention / refunds / revenue today / activity 24h / tier breakdown / quick links)
- `AdminUsers.tsx` — list + filter (q, tier, minRisk)
- `AdminUserDetail.tsx` — hồ sơ + check-in timeline + payments + refunds + recent messages + action panel (tặng gói, gửi voice manual, reset risk, cấp admin)
- `AdminRefunds.tsx` — queue REQUESTED → approve/deny → processed
- `AdminVoice.tsx` — CRUD voice library
- `AdminCohorts.tsx` — bảng cohort tháng + retention rate
- `AdminAnalytics.tsx` — funnel bar chart + revenue by tier
- `AdminWiki.tsx` — **2 widget WordPress** (link admin + top posts/conversion mock)

**AdminLayout** nav mở rộng với 9 mục: Bảng điều khiển / Người dùng / Hoàn tiền / Voice Khang / Cohort / Phân tích / Wiki / AI / Câu trả lời sẵn.

## Thay wiki editor → 2 widget WordPress

Đã bỏ ý tưởng tự build CRUD wiki + SEO meta editor. Theo phân tích đã chốt: **wiki = WordPress, app = code riêng**. AdminWiki.tsx chỉ có:

1. **Widget link tắt** — nút mở `WP_ADMIN_URL` trong tab mới + nút mở `WP_FRONT_URL` xem trang công khai. Cấu hình qua env vars `WP_ADMIN_URL` và `WP_FRONT_URL` ở backend.
2. **Widget top posts + conversion** — bảng top bài (mock data hiện tại). Khi tích hợp Google Search Console + GA4, sửa hàm `GET /admin/wiki/stats` để trả số thật. UTM tracking khi link wiki → app: `?utm_source=wiki&utm_campaign=<slug>`.

Tiết kiệm ~80-120 giờ dev. SEO mạnh hơn vì WordPress + Yoast/Rank Math là combo content marketing tốt nhất hiện có.

## Vẫn còn để dành cho sau

Các phần đã tạo skeleton nhưng cần đầu tư thêm:

- **Risk score computation** — hiện DB có cột `riskScore`, scheduler chưa tự update. Cần job mỗi giờ chạy: phân tích mood trend + missed days + crisis keywords trong chat → tính 0-100.
- **Voice tự động gửi theo trigger** — endpoint `/admin/voice/:id/send` đã có (admin manual), nhưng auto-delivery khi đến đúng dayMatch / khi crisis nổ ra phải thêm vào scheduler.
- **MoMo/VietQR tích hợp thật** — hiện `provider: 'mock'` apply tier ngay. Khi có merchant: thêm webhook handler ở `/payments/webhook/:provider`, status flow PENDING → PAID qua callback.
- **Day-10 / Day-30 PDF chuyên nghiệp** — `Reports.tsx` hiện dùng `window.print()`. Có thể đầu tư template PDF đẹp hơn (puppeteer / pdfkit) cho deliverable in được.
- **Cohort cron** — `applyTierUpgrade` đã đảm bảo cohort tồn tại. Cron hàng tháng để rollover cohort cũ + đếm churnedMembers.
