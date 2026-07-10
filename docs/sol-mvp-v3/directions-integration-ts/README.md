# Sol La Bàn — Directions Integration V1 (Batch 1: Core)

**Mục tiêu:** Thống nhất toàn bộ data Sol La Bàn (P1, P2, P3, 37 direction, case study, roadmap, article) vào Prisma DB tại `/var/www/huongdi/backend/`. Admin quản trị tất cả tại `adminhuongdi.sol.vn`.

## 🎯 Batch 1 Scope

**Model mới:** 4 model core
- `Direction` — 37 hướng đi với ~60 fields (14 kế thừa + 46 mới)
- `DirectionRevision` — Version control cho editor
- `CaseStudy` — 3 case study hiện có (Anh Đức · Anh Thắng · Chị Lan) + 34 sẽ add
- `Article` — 7 pillar pages + SEO articles

**Admin routes mới:**
- `/directions` — List + filter 37 direction (sync với DB thật, bỏ inline JS)
- `/directions/:id/edit` — CMS editor 60 fields
- `/directions/:id/revisions` — Xem lịch sử
- `/case-studies` — CRUD 37 case study
- `/articles` — CMS bài viết + WP sync

**KHÔNG thuộc Batch 1** (ship Batch 2/3):
- `UserResult` + `Roadmap` + `Prompt` model (Batch 2)
- P1/P2/P3 save qua API (Batch 2)
- AI roadmap generation engine (Batch 3)
- Case study 4-37 (fill dần)

## ⚠️ NGUYÊN TẮC BẢO TOÀN DỮ LIỆU

**Data KHÔNG BAO GIỜ mất:**

1. **P1/P2 localStorage của user** — Batch 1 KHÔNG động vào. localStorage hoạt động y nguyên. Batch 2 mới add API save server (fallback localStorage vẫn giữ).

2. **37 direction inline JS trong `buoc3.html`** — Batch 1 KHÔNG remove. Frontend vẫn dùng inline DB làm fallback trong 1-2 tuần transition. Sau khi API stable → refactor removes inline.

3. **3 case study HTML files** — Batch 1 seed vào CaseStudy table nhưng KHÔNG delete file HTML. Fallback nếu DB down.

4. **7 pillar pages** — Batch 1 seed vào Article table với `wpPostId` link. WordPress source of truth vẫn giữ.

**Data đồng nhất — không conflict:**

Batch 1 chạy trong "shadow mode":
- DB có data → admin edit thấy ngay
- Frontend vẫn dùng inline data cho stability
- 1-2 tuần sau khi Batch 1 verified → Batch 2 switch frontend gọi API
- Rollback dễ: cứ backup + revert schema

## 📦 Files Package

```
directions-integration-ts/
├── README.md                              (file này)
├── INTEGRATION-GUIDE.md                   step-by-step deploy
├── prisma-additions.prisma                4 model + enum
├── backend/
│   ├── routes/
│   │   ├── directions.ts                  Public GET /api/directions
│   │   ├── case-studies.ts                Public GET /api/case-studies
│   │   ├── admin-directions-block.ts      APPEND vào admin.ts
│   │   └── admin-case-studies-block.ts    APPEND vào admin.ts
│   ├── services/
│   │   └── direction-matching.ts          Server-side P1+P2 scoring
│   └── seed/
│       ├── directions-data.json           37 direction extracted
│       ├── case-studies-seed.json         3 case study metadata
│       ├── seed-directions.ts             Populate script
│       └── run-seed.sh                    Run migration + seed
├── admin/src/
│   ├── pages/
│   │   ├── DirectionsPage.tsx             List + filter
│   │   ├── DirectionEditPage.tsx          60-field editor
│   │   ├── DirectionRevisionsPage.tsx     History viewer
│   │   ├── CaseStudiesPage.tsx            CRUD
│   │   └── CaseStudyEditPage.tsx          Editor
│   └── utils/
│       └── api-directions.ts              API client
└── deploy-vps.sh                          Auto deploy
```

## 🚀 Deploy Order

```
STEP 1: Backup toàn bộ (10 phút)
   → schema.prisma
   → src/routes/admin.ts, index.ts
   → admin/src/App.tsx, Layout.tsx, utils/api.ts
   → PostgreSQL dump

STEP 2: Prisma migrate (5 phút)
   → cp prisma-additions.prisma vào cuối schema
   → npx prisma migrate dev --name add_directions_core

STEP 3: Seed 37 direction (2 phút)
   → npx ts-node backend/seed/seed-directions.ts
   → Verify: SELECT COUNT(*) FROM directions; → 37

STEP 4: Backend API (10 phút)
   → Copy 4 route files
   → APPEND admin-directions-block.ts vào admin.ts
   → APPEND admin-case-studies-block.ts vào admin.ts
   → Register /api/directions + /api/case-studies vào index.ts
   → npm run build
   → pm2 restart huongdi-api

STEP 5: Admin React pages (10 phút)
   → Copy 5 TSX files
   → APPEND api-directions.ts vào utils/api.ts
   → Update App.tsx (5 routes mới)
   → Update Layout.tsx (2 menu mới)
   → npm run build

STEP 6: Test end-to-end (5 phút)
   → adminhuongdi.sol.vn/directions → 37 direction hiện lên
   → Click edit → 60 fields form
   → Save → check DB updated + version bump
   → adminhuongdi.sol.vn/case-studies → 3 case study
```

**Tổng thời gian deploy: ~45 phút** (nếu không có bug).

## 🧪 Verify Data Integrity

Sau deploy, verify data safety:

```bash
# 1. DB có đúng 37 direction
psql -U ... -d huongdi_prod -c "SELECT COUNT(*), COUNT(DISTINCT category) FROM directions;"
# Expected: 37 · 7

# 2. Từng field từ buoc3.html được preserve
psql -U ... -d huongdi_prod -c "SELECT id, title, income FROM directions WHERE id='freelancer-ke-toan';"
# Expected: title='Freelancer Kế Toán & Thuế', income={min:8, max:35}

# 3. 3 case study seed đúng
psql -U ... -d huongdi_prod -c "SELECT id, persona_name FROM case_studies;"
# Expected: 3 rows với Anh Đức, Anh Thắng, Chị Lan

# 4. Backup file HTML vẫn còn
ls -la /var/www/huongdi/public/*.html
# huongdi-phase2 HTML files still exist as fallback
```

## 🔄 Rollback

Nếu có sự cố:

```bash
# 1. Restore schema
cd /var/www/huongdi/backend
cp prisma/schema.prisma.bak prisma/schema.prisma
npx prisma migrate reset  # ⚠️ DROP tables mới, KHÔNG động Leads

# 2. Restore code
cp -r /tmp/directions-backup-YYYYMMDD/* /var/www/huongdi/
npm run build && pm2 restart huongdi-api

# 3. Rebuild admin
cd /var/www/huongdi/admin
npm run build

# 4. Frontend vẫn dùng inline DB (không bị ảnh hưởng)
```

## 📋 Post-Batch-1 Actions

Sau khi Batch 1 stable 3-5 ngày:

**Fill data:**
- Khang dành 1-2 giờ/ngày × 10 ngày → fill 46 fields mới cho 37 direction
- AI-assist auto-fill 30 fields dễ (tags, businessType, regionSuitability...)
- Khang review 16 fields khó (pháp lý VN, chi phí thật, framework Sol Active)

**Batch 2 (Tuần 2):**
- Add UserResult + Roadmap model
- Frontend buoc1/2/3.html save qua API
- Admin `/users` xem P1/P2/P3

**Batch 3 (Tuần 3):**
- Add Prompt model
- AI Roadmap Generation Engine
- Claude API integration

---

**Ownership:** Khang Sol + Em (Claude assistant)
**Deploy target:** `/var/www/huongdi/` (Sol La Bàn VPS)
**Version:** V1 — 2026-07-03
