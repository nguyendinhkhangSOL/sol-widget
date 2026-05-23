# Sol — Database (Postgres 16 + Prisma)

> Chi tiết Postgres setup + Prisma schema + migration workflow + backup.
> Cập nhật: 2026-05-22.

---

## 1. Tổng quan

| Field | Value |
|---|---|
| Engine | PostgreSQL 16 (Ubuntu repo) |
| Host | `127.0.0.1:5432` (localhost only) |
| DB name (prod) | `sol_prod` |
| DB user | `sol_app` |
| ORM | Prisma 5.22 |
| Schema file | `backend/prisma/schema.prisma` |
| Model count | 38 (xem section 3) |
| Migration count | 9+ (Prisma) + 17 raw SQL file (manual) |
| Binary targets | `["native", "linux-musl-openssl-3.0.x"]` (dev Windows + Alpine container) |

**Connection string** (trong `backend/.env`):
```
DATABASE_URL="postgresql://sol_app:<PASS>@127.0.0.1:5432/sol_prod?schema=public&connection_limit=20"
```

⚠️ Password lưu trong `01-CREDENTIALS.md`. KHÔNG commit file `.env` thật.

---

## 2. Create DB từ scratch

```bash
# Trên VPS, từ user root hoặc qua sudo
sudo -u postgres psql

CREATE USER sol_app WITH PASSWORD 'KhangSol2006';   -- KHÔNG hardcode trong doc, đổi nếu lộ
CREATE DATABASE sol_prod OWNER sol_app;
GRANT ALL PRIVILEGES ON DATABASE sol_prod TO sol_app;
\q
```

Sau khi tạo:
```bash
cd /var/www/sol-widget-old/backend
npx prisma migrate deploy        # apply 9 Prisma migration
# Sau đó chạy 17 file SQL raw (xem section 5)
npm run seed                     # seed contentItems + cohort
npm run seed:triggers
npm run seed:qday
```

---

## 3. Prisma Models — 38 tổng

Chia theo cụm domain:

### 3.1. Users / Auth (5)

| Model | Mục đích |
|---|---|
| `User` | Mega-model ~250 field — identity (phone/email/zaloUserId/deviceUid/recoveryCodeHash), pronouns, FTND score, quitDate, tier, cohort, settings, riskScore, isAdmin, ... |
| `UserState` | State machine của user (NHAN_THUC / HANH_DONG / GIAI_PHONG / TAI_THIET) |
| `OtpCode` | OTP phone verify (TTL 5-10 phút) |
| `EmailVerificationToken` | Magic link email token (TTL 5 phút) |
| `PushSubscription` | VAPID web push subscription |

### 3.2. Journey (4)

| Model | Mục đích |
|---|---|
| `CheckIn` | Daily check-in (smoked toggle / craving slider / mood emoji / note) |
| `ExerciseEntry` | Workbook exercise log |
| `CigaretteLog` | User log mỗi điếu hút (timestamp, trigger, context) |
| `ProgressJournal` | Nhật ký tiến trình tự viết |

### 3.3. Content (3)

| Model | Mục đích |
|---|---|
| `ContentItem` | Per dayNumber × module × voice. ~127 row seed |
| `ContentItemRevision` | Audit log mỗi lần edit (auto-create v1, v2, …) |
| `CannedReply` | CHIP — slug + emoji + triggers + priority + minScore (intent matcher) |

### 3.4. Messaging (1)

| Model | Mục đích |
|---|---|
| `Message` | Chat history user-AI / user-Khang. role: USER / ASSISTANT / SYSTEM_NOTICE |

### 3.5. Notifications (2)

| Model | Mục đích |
|---|---|
| `Notification` | Queue notification chờ deliver (in-widget / push / Zalo / email) |
| `PushSubscription` | Đã list trên |

### 3.6. Crisis (2)

| Model | Mục đích |
|---|---|
| `CrisisEvent` | SOS event từ user |
| `CrisisTimerLog` | 90-second craving timer session log |

### 3.7. Payments + Refunds (2)

| Model | Mục đích |
|---|---|
| `PaymentLog` | VietQR static — status: PENDING / PAID / FAILED. Admin Khang mark PAID tay. |
| `RefundRequest` | Refund queue lifecycle: REQUESTED → APPROVED/DENIED → PROCESSED |

### 3.8. Voice library (4)

| Model | Mục đích |
|---|---|
| `VoiceMessage` | Voice clip + transcript |
| `VoiceDelivery` | Track delivery per user |
| `KhangVoice` | Voice của Khang Sol (trigger types: DAY_MATCH / CRISIS / MILESTONE / MANUAL) |
| `KhangVoiceListen` + `KhangVoiceReaction` | User listen tracking + reaction emoji |

### 3.9. Silent Companionship (3) — pivot 2026-05-08

| Model | Mục đích |
|---|---|
| `Confession` | Khoảng Lặng — chia sẻ ẩn danh |
| `ConfessionReaction` | Reaction emoji |
| `ConfessionRead` | Track ai đã đọc |

### 3.10. HoiKhang (3)

| Model | Mục đích |
|---|---|
| `KhangQuestion` | User hỏi Khang qua mailbox |
| `KhangQuestionUpvote` | Upvote câu hỏi |

### 3.11. Lapse + Stats (3)

| Model | Mục đích |
|---|---|
| `LapseEvent` | Log vấp/lỡ điếu (lapse-friendly approach) |
| `AnonymousStatsCache` | Cache stats public (homepage) |
| `Cohort` | Monthly Q-Day cohort (vd "2026-05") |

### 3.12. App settings (1)

| Model | Mục đích |
|---|---|
| `AppSetting` | Key/JSON — AI provider config, AI key, checklist config, … (manage qua `/admin/ai`) |

### 3.13. Zalo OA (5)

| Model | Mục đích |
|---|---|
| `ZaloOAUser` | OA follower mapping User ↔ zaloUserId |
| `ZNSLog` | Zalo Notification Service send log |
| `ZaloTemplate` | ZNS template CRUD (400-char counter + banned-word linter) |
| `MessagingPolicy` | Policy rules (frequency, quiet hours) |
| `UserMessagingProfile` | Per-user messaging profile |

### 3.14. Phase 5 — Smart push (2)

| Model | Mục đích |
|---|---|
| `ScheduledPush` | 51-day ZNS queue scheduler |
| `SOSAlert` | Real-time SOS triage (critical/high/medium/low) |

---

## 4. Migration workflow

### 4.1. Edit schema local (dev)

```bash
# Trên Windows local
cd C:\BOTHUOCLA\sol-widget\backend
# Edit prisma/schema.prisma
npx prisma migrate dev --name <descriptive_name>
# → tạo prisma/migrations/<timestamp>_<name>/migration.sql
# → apply local DB + regen client
```

Commit cả `schema.prisma` + folder migration mới.

### 4.2. Apply prod (VPS)

```bash
ssh sol-vps
sudo -i
cd /var/www/sol-widget-old/backend

# Backup TRƯỚC khi migrate
sudo -u postgres pg_dump sol_prod > /var/backups/sol_prod_pre_migrate_$(date +%F).sql

git pull
npx prisma migrate deploy        # chỉ apply pending, không gen client
npx prisma generate              # gen client cho dist/

cd ..
pm2 restart sol-api              # restart để code mới + client mới load
pm2 logs sol-api --lines 50      # verify không có error
```

### 4.3. Raw SQL files (manual)

Trong `backend/prisma/` ngoài `migrations/` còn 17 file `.sql` rời (Zalo tables, manual phase A/B, encoding fixes…). `prisma migrate deploy` **KHÔNG** chạy chúng.

Lần fresh deploy đầu tiên phải `psql -f` từng file đúng thứ tự:

```bash
cd /var/www/sol-widget-old/backend
export PGPASSWORD="<sol_app pass>"

psql -U sol_app -d sol_prod -f prisma/create_zalo_tables.sql
psql -U sol_app -d sol_prod -f prisma/seed_zalo_templates.sql
psql -U sol_app -d sol_prod -f prisma/manual_migration_phase_a.sql
psql -U sol_app -d sol_prod -f prisma/manual_migration_phase_b.sql
# ... các file encoding/seed khác (ls *.sql để xem)
```

**Verify**: `psql -U sol_app -d sol_prod -c "\dt"` → ~38 bảng.

### 4.4. DB drift (Prisma báo "constraint already exists")

```bash
# Đừng force-reset → mất data. Dùng raw SQL ALTER:
psql -U sol_app -d sol_prod -c "ALTER TYPE \"NotificationType\" ADD VALUE 'NIGHT_STORY';"

# Hoặc nếu chỉ là baseline drift (Prisma metadata chưa khớp DB):
npx prisma migrate resolve --applied <migration_name>
```

---

## 5. Backup procedure

### 5.1. Daily auto-backup (TODO setup cron)

Đề xuất crontab cho user `postgres`:
```cron
0 3 * * * pg_dump -U postgres sol_prod | gzip > /var/backups/sol-db-$(date +\%Y\%m\%d).sql.gz
0 4 * * * find /var/backups -name "sol-db-*.sql.gz" -mtime +14 -delete
```

(Hiện chưa setup — task post-launch.)

### 5.2. Manual backup trước thay đổi lớn

```bash
ssh sol-vps
sudo -u postgres pg_dump sol_prod | gzip > /var/backups/sol-db-$(date +%F-%H%M).sql.gz

# Download về Windows
scp sol-vps:/var/backups/sol-db-*.sql.gz D:\Backup\
```

### 5.3. Restore

```bash
# Trên VPS
sudo -u postgres psql -c "DROP DATABASE sol_prod;"
sudo -u postgres psql -c "CREATE DATABASE sol_prod OWNER sol_app;"
gunzip < /var/backups/sol-db-2026-05-22.sql.gz | sudo -u postgres psql sol_prod

# Sau đó regen Prisma client
cd /var/www/sol-widget-old/backend
npx prisma generate
pm2 restart sol-api
```

---

## 6. Lệnh thường dùng

```bash
# Mở psql interactive (qua user postgres)
ssh sol-vps
sudo -u postgres psql sol_prod

# Hoặc dùng user app
PGPASSWORD='<pass>' psql -h 127.0.0.1 -U sol_app -d sol_prod

# Đếm user
SELECT 
  COUNT(*) FILTER (WHERE "isAnonymous" = false) AS real_users,
  COUNT(*) FILTER (WHERE "onboardingCompletedAt" IS NOT NULL) AS onboarded,
  COUNT(*) FILTER (WHERE "ftndScore" IS NOT NULL) AS ftnd_done,
  COUNT(*) FILTER (WHERE "tier" != 'FREE') AS paid_users
FROM "User";

# Grant admin
UPDATE "User" SET "isAdmin" = true WHERE email = 'nguyendinhkhang@gmail.com';

# Reset daily AI quota
UPDATE "User" SET "dailyMessageCount" = 0, "dailyMessageDate" = NULL;

# Prisma Studio (GUI local — KHÔNG chạy trên VPS prod)
cd C:\BOTHUOCLA\sol-widget\backend
npx prisma studio    # mở http://localhost:5555
```

---

## 7. Note quan trọng

- **AppSetting plaintext AI keys**: enum `AppSetting` lưu Claude/Gemini API key plaintext. Disk encryption ở VPS level. TODO: encrypt-at-rest at DB level (post-launch).
- **JWT secret fallback**: nếu `JWT_SECRET` chưa set, backend dùng `'dev-secret-change-me'` — KHÔNG được chấp nhận ở prod. Verify `.env` trên VPS.
- **Connection pool**: hiện set `connection_limit=20`. Pilot 10-100 user OK. Scale 1000+ → cân nhắc PgBouncer.
- **Postgres listen localhost only**: KHÔNG expose 5432 ra ngoài. Connect qua SSH tunnel nếu cần GUI từ Windows.

---

## 8. Tham khảo

- `backend/prisma/schema.prisma` — source of truth schema
- `backend/prisma/migrations/` — Prisma migration history
- `backend/prisma/*.sql` — 17 raw SQL file manual
- [05-ARCHITECTURE.md](./05-ARCHITECTURE.md) — backend stack
- [07-DEPLOY_WORKFLOW.md](./07-DEPLOY_WORKFLOW.md) — deploy flow
- [08-OPERATIONS.md](./08-OPERATIONS.md) — runbook

---

**Last updated**: 2026-05-22
**Maintainer**: Khang Sol
