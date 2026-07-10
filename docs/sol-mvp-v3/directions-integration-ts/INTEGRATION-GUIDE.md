# Sol La Bàn — Directions Integration V1 (Batch 1)

Step-by-step deploy 4 model (Direction, DirectionRevision, CaseStudy, Article) vào backend Sol La Bàn tại `/var/www/huongdi/backend/`.

## 📋 Prerequisites

- SSH access `solop@sol-vps-01`
- Backend hiện tại đang chạy PM2 `huongdi-api` port 4001
- Admin SPA build tại `/var/www/huongdi/admin/`
- Đã có Lead + LeadNotification model (task #112 hôm qua)

## 🛡️ SAFETY FIRST — Backup

**TRƯỚC KHI DEPLOY, BACKUP TOÀN BỘ:**

```bash
ssh solop@sol-vps-01
BACKUP_DIR="/tmp/directions-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# 1. Backup schema
cp /var/www/huongdi/backend/prisma/schema.prisma "$BACKUP_DIR/"

# 2. Backup admin.ts + index.ts
cp /var/www/huongdi/backend/src/routes/admin.ts "$BACKUP_DIR/"
cp /var/www/huongdi/backend/src/index.ts "$BACKUP_DIR/" 2>/dev/null || \
cp /var/www/huongdi/backend/src/server.ts "$BACKUP_DIR/" 2>/dev/null || true

# 3. Backup admin SPA files
cp /var/www/huongdi/admin/src/App.tsx "$BACKUP_DIR/"
cp /var/www/huongdi/admin/src/utils/api.ts "$BACKUP_DIR/"
cp /var/www/huongdi/admin/src/components/Layout.tsx "$BACKUP_DIR/" 2>/dev/null || true

# 4. Backup PostgreSQL (chỉ tables Lead — DB khác tables chưa bị ảnh hưởng)
pg_dump -U postgres -d huongdi_prod --table=leads --table=lead_notifications > "$BACKUP_DIR/leads-tables.sql"

echo "✅ Backup at: $BACKUP_DIR"
```

## 🚀 STEP 1 — Prisma Schema (5 phút)

```bash
cd /var/www/huongdi/backend

# 1. Backup schema (nếu chưa)
cp prisma/schema.prisma prisma/schema.prisma.bak

# 2. Append content của prisma-additions.prisma vào cuối
# Từ máy local upload trước:
# scp directions-integration-ts/prisma-additions.prisma solop@sol-vps-01:/tmp/

cat /tmp/prisma-additions.prisma >> prisma/schema.prisma

# 3. Generate + migrate
npx prisma generate
npx prisma migrate dev --name add_directions_core
# → nhập tên: add_directions_core → Enter

# 4. Verify tables tạo thành công
psql -U postgres -d huongdi_prod -c "\dt"
# Expected: directions, direction_revisions, case_studies, articles + existing tables
```

## 🌱 STEP 2 — Extract + Seed 36 Direction (5 phút)

```bash
# Upload extraction script + seed script từ máy local:
scp directions-integration-ts/backend/seed/*.ts solop@sol-vps-01:/var/www/huongdi/backend/src/seed/
scp docs/sol-mvp-v3/huongdi-phase2/buoc3.html solop@sol-vps-01:/tmp/buoc3.html

# 1. Extract 36 direction từ buoc3.html → JSON
cd /var/www/huongdi/backend
npx ts-node src/seed/extract-from-buoc3.ts /tmp/buoc3.html
# Output: src/seed/directions-extracted.json (36 direction)

# 2. Seed vào DB
npx ts-node src/seed/seed-directions.ts

# Expected output:
#   ✅ Created: freelancer-ke-toan
#   ✅ Created: freelancer-marketing
#   ... 36 direction total
#   ✅ Case Study created: 01, 02, 03
#   ✅ FINAL: DB có 36 direction, 3 case study

# 3. Verify
psql -U postgres -d huongdi_prod -c "SELECT COUNT(*), COUNT(DISTINCT category) FROM directions;"
# Expected: count=36, distinct=7
```

## 🔌 STEP 3 — Backend API (10 phút)

```bash
# 1. Upload route files
scp directions-integration-ts/backend/routes/directions.ts \
    solop@sol-vps-01:/var/www/huongdi/backend/src/routes/directions.ts

scp directions-integration-ts/backend/routes/admin-directions-block.ts \
    solop@sol-vps-01:/tmp/admin-directions-block.ts
```

### 3a. Update `src/routes/admin.ts`

```bash
cd /var/www/huongdi/backend/src/routes
```

**Thêm imports ở ĐẦU file admin.ts** (nếu chưa có PrismaClient):

```typescript
// Nếu chưa có PrismaClient trong admin.ts:
import { PrismaClient } from '@prisma/client';
const prismaDirections = new PrismaClient();
```

**Paste content của `admin-directions-block.ts` vào CUỐI file, TRƯỚC `export default router;`:**

```bash
# Tách export
tail -1 admin.ts   # xem có phải "export default router;"

# Đưa block vào giữa
sed -i.bak '/export default router;/e cat /tmp/admin-directions-block.ts' admin.ts
```

### 3b. Update `src/index.ts` (hoặc `server.ts`)

Tìm chỗ mount routes:

```typescript
// Đã có sẵn (từ leads):
app.use('/api/leads', leadsRouter);
app.use('/api/activate', leadsRouter);

// THÊM MỚI:
import directionsRouter from './routes/directions';
app.use('/api/directions', directionsRouter);
```

### 3c. Build + Restart

```bash
cd /var/www/huongdi/backend
npm run build   # tsc compile
pm2 restart huongdi-api
pm2 logs huongdi-api --lines 30

# Test
curl http://localhost:4001/api/directions | jq '.count'
# Expected: 36

curl http://localhost:4001/api/directions/freelancer-ke-toan | jq '.data.title'
# Expected: "Freelancer Kế Toán & Thuế"
```

## 🎨 STEP 4 — Admin SPA React (10 phút)

*(Ship batch 2 — file TSX admin pages sẽ ship response tiếp theo)*

Tạm thời để verify API works, dùng `curl` hoặc `admin/directions` route sẵn có (nếu editor cũ vẫn còn) sync với DB thật.

## 🧪 STEP 5 — End-to-end Test

```bash
# 1. API public
curl -s https://huongdi.sol.vn/api/directions | jq '.count'
# Expected: 36

# 2. API filter category
curl -s "https://huongdi.sol.vn/api/directions?category=chuyenmon" | jq '.count'
# Expected: 9

# 3. API matches (server-side scoring)
curl -X POST https://huongdi.sol.vn/api/directions/matches \
  -H "Content-Type: application/json" \
  -d '{
    "p1_norm": {"people":80,"expert":90,"builder":30,"independent":85},
    "p2_scores": {"capital":40,"time":60,"tech":50,"network":70,"risk":30,"energy":60,"exp":85},
    "incomeGoal": 25
  }' | jq '.top10[0:3]'

# Expected: top 3 direction match với DNA "expert-independent" và incomeGoal=25

# 4. Case studies
curl -s https://huongdi.sol.vn/api/directions/freelancer-ke-toan | jq '.data.caseStudies | length'
# Expected: 1 (nếu direction có match case study id)
```

## 🎯 STEP 6 — Verify Data Integrity

```bash
# 1. Đủ 36 direction
psql -U postgres -d huongdi_prod -c "SELECT COUNT(*) FROM directions;"

# 2. Đủ 7 category
psql -U postgres -d huongdi_prod -c "SELECT category, COUNT(*) FROM directions GROUP BY category;"
# Expected:
#   chuyenmon | 9
#   daotao    | 5
#   noidungso | 5
#   kinhdoanh | 6
#   daily     | 4
#   dichvu    | 4
#   dauthu    | 3

# 3. 6 cluster distribution
psql -U postgres -d huongdi_prod -c "SELECT cluster, COUNT(*) FROM directions GROUP BY cluster ORDER BY cluster;"

# 4. Legacy 14 fields preserved
psql -U postgres -d huongdi_prod -c "
  SELECT id, title, income, timeline, roadmap_4_tuan IS NOT NULL AS has_roadmap 
  FROM directions WHERE id='freelancer-ke-toan';
"
# Expected: roadmap_4_tuan có data

# 5. 3 case study seed đúng direction
psql -U postgres -d huongdi_prod -c "
  SELECT cs.id, cs.persona_name, d.title AS matched_direction
  FROM case_studies cs
  LEFT JOIN directions d ON d.id = cs.direction_id
  ORDER BY cs.id;
"
# Expected: 3 rows, mỗi row có matched_direction

# 6. Frontend inline JS trong buoc3.html VẪN CÒN (không remove)
head -c 2000 /var/www/huongdi/public/huongdi-phase2/buoc3.html | grep -c "const DB"
# Expected: 1 (inline DB vẫn còn, safety fallback)
```

## 🔄 Rollback nếu Cần

```bash
# 1. Restore schema
cd /var/www/huongdi/backend
cp prisma/schema.prisma.bak prisma/schema.prisma

# 2. Drop tables mới (KHÔNG động Lead tables)
psql -U postgres -d huongdi_prod << 'SQL'
DROP TABLE IF EXISTS direction_revisions CASCADE;
DROP TABLE IF EXISTS case_studies CASCADE;
DROP TABLE IF EXISTS articles CASCADE;
DROP TABLE IF EXISTS directions CASCADE;
DROP TYPE IF EXISTS "DirectionStatus";
DROP TYPE IF EXISTS "CaseStudyTier";
DROP TYPE IF EXISTS "ArticleCategory";
DROP TYPE IF EXISTS "ContentStatus";
SQL

# 3. Restore route files
cp "$BACKUP_DIR/admin.ts" /var/www/huongdi/backend/src/routes/
cp "$BACKUP_DIR/index.ts" /var/www/huongdi/backend/src/ 2>/dev/null || \
cp "$BACKUP_DIR/server.ts" /var/www/huongdi/backend/src/

# 4. Rebuild
cd /var/www/huongdi/backend
npm run build
pm2 restart huongdi-api

# Frontend vẫn dùng inline DB trong buoc3.html → hoạt động y nguyên
```

## ✅ Success Checklist

- [ ] Prisma migrate thành công (4 table + 4 enum tạo)
- [ ] `SELECT COUNT(*) FROM directions` = 36
- [ ] `SELECT COUNT(*) FROM case_studies` = 3
- [ ] `curl /api/directions` return 36
- [ ] `curl /api/directions/matches` với P1+P2 test → top 10 sorted
- [ ] Data 14 fields legacy preserved (income, roadmap_4_tuan, reasons...)
- [ ] Frontend `buoc3.html` vẫn dùng inline DB (chưa switch qua API)
- [ ] `adminhuongdi.sol.vn/directions` (existing UI) vẫn hoạt động

## 📊 Post-Deploy: Fill 46 Fields Mới

Sau khi Batch 1 stable 3-5 ngày, Khang bắt đầu fill 46 fields mới cho 37 direction.

**Cách 1 — Edit qua Admin UI** (khi Batch 1 admin pages ship):
- `adminhuongdi.sol.vn/directions/:id/edit` → 60-field form
- Save → auto version bump

**Cách 2 — Bulk import CSV/JSON:**
```bash
# Chuẩn bị file JSON với 46 fields mới cho từng direction
# Chạy script bulk update
curl -X POST https://adminhuongdi.sol.vn/api/admin/directions/bulk-fill \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d @directions-new-fields.json
```

**Cách 3 — Edit trực tiếp SQL** (advanced):
```sql
UPDATE directions
SET
  tags = ARRAY['AI-friendly', 'no-code'],
  keywords = ARRAY['kế toán', 'freelance', 'SME'],
  business_type = 'B2B',
  phap_ly_ma_nganh = '6920',
  thue_khoan_percent = 1.5,
  buffer_thang = 12
WHERE id = 'freelancer-ke-toan';
```

## 🐛 Troubleshooting

**Prisma migrate lỗi "cannot find migration folder":**
```bash
npx prisma db push   # dev mode, không tạo migration file
```

**Type mismatch khi seed:**
- Check DirectionStatus enum: seed dùng "PUBLISHED", enum expect DirectionStatus.PUBLISHED
- Force cast: `status: 'PUBLISHED' as any`

**Case study contentHtml empty:**
- Check path `case-studies/01-*.html` exists
- Adjust `paths` array trong seed-directions.ts nếu file ở vị trí khác

**API 404 /api/directions:**
- Verify `import directionsRouter from './routes/directions'` trong index.ts
- Verify `app.use('/api/directions', directionsRouter)` mount đúng
- Check `pm2 logs huongdi-api` xem có compile error

**Admin UI /directions cũ break:**
- Batch 1 KHÔNG động vào existing UI
- Nếu UI cũ đọc từ JSON file → vẫn hoạt động independent
- Batch 2 sẽ ship admin pages mới đọc từ API

## 📞 Next Steps

Sau khi Batch 1 verified stable:

1. **Batch 1.5:** Ship admin React pages (DirectionsPage.tsx, DirectionEditPage.tsx, CaseStudiesPage.tsx)
2. **Batch 2:** Add UserResult + Roadmap model → save P1/P2/P3 server, xem `/users/:id/journey`
3. **Batch 3:** AI Roadmap Generation Engine + Claude API integration

---

**Version:** V1 — 2026-07-03
**Ownership:** Khang Sol + Em (Claude)
