# Phase 5 Sprint 1 — Deploy Handoff

**Ngày:** 2026-05-15
**Tác giả:** Sol Engineering (em) + Khang Sol (anh)
**Trạng thái:** Code complete — chờ Khang deploy

---

## Tóm tắt Sprint 1

Em đã code xong **5 file mới + 2 file extend** cho 51-Day Journey Push Scheduler. Sau khi anh deploy, hệ thống sẽ:

- Nhận user enroll vào lộ trình qua Zalo OA (sẽ build Welcome flow ở Sprint 2)
- Tự động tạo 51 record ScheduledPush mỗi user
- Cron mỗi 5 phút fire ZNS push cho user đang journey, tôn trọng `preferredPushHour` user chọn
- Track SOS alert riêng với severity (critical/high/medium/low)
- Hotline `02439931800` xuất hiện trong tin SOS

---

## Files đã build

### Mới (5 files)

| File | Mục đích |
|------|----------|
| `backend/prisma/manual_migration_phase5_journey.sql` | SQL migration: thêm 9 cột User + 2 bảng (ScheduledPush, SOSAlert) |
| `backend/prisma/seed_phase5_journey_templates.sql` | Seed 3 ZNS template: SOL_DAILY_CHIP, SOL_SOS_CRISIS, SOL_MILESTONE_GENERIC |
| `backend/src/zalo/journeyEngine.ts` | `enrollUser`, `resolveTemplateForDay`, `cancelJourney`, `recomputeCurrentDay` + CHIP_LIBRARY 51 entry |
| `backend/src/zalo/scheduledPushFirer.ts` | `fireDuePushes` + `expireStaleScheduledPushes` (cron logic) |
| `backend/src/zalo/journeyAdminRoutes.ts` | 8 admin API endpoints (/queue, /users, /sos, /enroll, /stats...) |

### Extend (2 files)

| File | Thay đổi |
|------|----------|
| `backend/prisma/schema.prisma` | Add ScheduledPush + SOSAlert model, extend User với 9 field journey |
| `backend/src/scheduler/worker.ts` | Add 3 cron job: fireDuePushes (mỗi 5 phút), recompute (7:30 AM), expire (3 AM) |
| `backend/src/zalo/routes.ts` | Mount journeyAdminRouter tại `/api/zalo/journey/*` |

---

## Deploy steps trên Windows

### Bước 1: Backup DB hiện tại

```powershell
cd C:\BOTHUOCLA\sol-widget\backend
node backup-db.cjs
```

### Bước 2: Apply schema migration

```powershell
# Option A: Manual SQL (an toàn, idempotent)
psql "$env:DATABASE_URL" -f prisma/manual_migration_phase5_journey.sql

# Option B: Prisma migrate (auto-generate migration file)
npx prisma migrate dev --name phase5_journey_scheduler
```

### Bước 3: Seed 3 ZNS template

```powershell
psql "$env:DATABASE_URL" -f prisma/seed_phase5_journey_templates.sql
```

Verify:
```sql
SELECT code, status, "zaloTemplateId" FROM "ZaloTemplate"
WHERE code IN ('SOL_DAILY_CHIP','SOL_SOS_CRISIS','SOL_MILESTONE_GENERIC');
-- Expect 3 rows, status='DRAFT', zaloTemplateId=NULL
```

### Bước 4: Regenerate Prisma client

```powershell
npx prisma generate
```

### Bước 5: Build + test compile

```powershell
npm run build
# Hoặc nếu chỉ muốn type-check
npx tsc --noEmit
```

### Bước 6: Start worker (cron)

```powershell
# Dev: chạy song song với backend
npm run dev    # terminal 1 — API
npm run worker # terminal 2 — cron

# Production: chạy worker dạng service riêng (systemd / pm2)
pm2 start "npm run worker" --name sol-worker
```

---

## Submit 3 template lên Zalo Manager (Khang làm thủ công)

3 template SQL seed ở `status='DRAFT'`. Anh phải:

1. Đăng nhập [https://oa.zalo.me](https://oa.zalo.me)
2. Vào Quản lý ZNS → Tạo template mới
3. Copy content từ DB (3 template):
   - **SOL_DAILY_CHIP** — Title 40c, Body 200c, 2 button
   - **SOL_SOS_CRISIS** — Title 50c, Body 235c, 3 button (gồm hotline)
   - **SOL_MILESTONE_GENERIC** — Title 50c, Body 245c, 2 button
4. Tag: chọn **"Customer Care" (Tag 2)** — phù hợp lộ trình cai thuốc
5. Submit duyệt → đợi 3-5 ngày làm việc
6. Khi approved, copy `zaloTemplateId` (chuỗi 18 số) → cập nhật vào DB:

```sql
UPDATE "ZaloTemplate"
SET "zaloTemplateId" = '1234567890123456789',
    status = 'APPROVED',
    "approvedAt" = NOW()
WHERE code = 'SOL_DAILY_CHIP';
```

Lặp cho 3 template.

---

## Test Sprint 1 (sau khi deploy)

### Test 1: Enroll 1 user mẫu

```powershell
# Lấy 1 admin token
$TOKEN = "YOUR_ADMIN_JWT"
$BODY = @{
  userId       = "<test_user_id>"
  journeyType  = "full-51"
  qDayDate     = "2026-05-20T00:00:00.000Z"
  preferredHour = 7
} | ConvertTo-Json

Invoke-RestMethod -Method POST `
  -Uri "http://localhost:3000/api/zalo/journey/enroll" `
  -Headers @{ Authorization = "Bearer $TOKEN" } `
  -ContentType "application/json" `
  -Body $BODY
```

Expected: `{ ok: true, created: 51, userId: "..." }`

### Test 2: Kiểm tra schedule

```powershell
Invoke-RestMethod -Method GET `
  -Uri "http://localhost:3000/api/zalo/journey/users/<test_user_id>" `
  -Headers @{ Authorization = "Bearer $TOKEN" }
```

Expected: 51 entries trong `scheduledPushes`, mỗi entry có `templateCode` + `scheduledAt` đúng.

### Test 3: Queue 24h tới

```powershell
Invoke-RestMethod -Method GET `
  -Uri "http://localhost:3000/api/zalo/journey/queue?hours=24" `
  -Headers @{ Authorization = "Bearer $TOKEN" }
```

Expected: 1 record (nếu Q-Day rơi trong 24h tới) hoặc 0 (nếu xa hơn).

### Test 4: Cron worker chạy

Xem log:
```
INFO Scheduler started — 19 cron jobs active (Phase 5 enabled)
... mỗi 5 phút ...
INFO fireDuePushes: scanning batch { batch: 0 }
```

Khi có push due:
```
INFO fireDuePushes: batch done { scanned: 1, sent: 1, failed: 0, ... }
```

⚠ Nếu template chưa APPROVED, sẽ fail với `TEMPLATE_NOT_APPROVED`. Đây là EXPECTED — chờ Zalo duyệt template.

---

## Sprint 2 (kế tiếp — sau khi Zalo duyệt template)

| Item | Thời lượng |
|------|-----------|
| Zalo OA Welcome flow (button "Chọn lộ trình") | 4-6 giờ |
| Webhook handle button click → auto enrollUser | 2 giờ |
| SOS button trigger + auto reply | 3 giờ |
| Reply chain canned_replies (đã có 42 reply — wire vào webhook) | 1 giờ |
| Random tip high-craving hours (10h/13h30/16h30/21h) | 2 giờ |
| Open/Click tracking via UTM | 2 giờ |
| Admin SOS page socket push notification real-time | 3 giờ |

**Total Sprint 2: ~17 giờ code.**

---

## Sprint 3 (Polish + Launch 50 user pilot)

- Milestone celebration UI
- Graduation flow (D30 → certificate + community invite)
- Maintenance mode (1 tin/tuần after D30)
- Cohort retention analytics
- Cost monitoring dashboard
- Privacy policy + opt-out UI

---

## Câu hỏi pending — Khang quyết định

1. **Migration approach:** Manual SQL hay Prisma migrate? Em đề xuất Prisma migrate cho prod (auto-generate migration file).

2. **Worker deployment:** Chạy bằng `pm2` hay `systemd`? Hay tạm thời dùng `npm run worker` trong tmux/screen?

3. **Template approval:** Anh có thể submit 3 template hôm nay không? Để 3-5 ngày sau bắt đầu enroll user pilot.

4. **50 user pilot — recruit thế nào?** Em đề xuất:
   - Tuần 1: 10 user (Khang gửi link mời cá nhân — bạn bè + alumni Sol)
   - Tuần 2: +20 user (post Facebook group cai thuốc)
   - Tuần 3: +20 user (organic từ sol.vn — opt-in pop-up)

Anh review xong cho em biết hướng tiếp.

— Sol Engineering Team
