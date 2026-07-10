# Admin SPA Integration — Directions + Case Studies

Extension của INTEGRATION-GUIDE.md — hướng dẫn integrate 5 React pages vào admin SPA hiện tại `/var/www/huongdi/admin/`.

## 📦 Files ship

```
admin/src/
├── utils/
│   └── api-directions.ts           APPEND vào existing api.ts
├── pages/
│   ├── DirectionsPage.tsx          List 36 direction
│   ├── DirectionEditPage.tsx       60-field editor
│   ├── DirectionRevisionsPage.tsx  History + revert
│   ├── CaseStudiesPage.tsx         List case studies
│   └── CaseStudyEditPage.tsx       Editor + HTML preview
```

## 🚀 Deploy 3 STEP

### STEP 1 — Upload files từ máy local

```powershell
# Windows PowerShell
$LOCAL="C:\BOTHUOCLA\sol-widget\docs\sol-mvp-v3\directions-integration-ts"

scp "$LOCAL\admin\src\utils\api-directions.ts" solop@sol-vps-01:/var/www/huongdi/admin/src/utils/
scp "$LOCAL\admin\src\pages\DirectionsPage.tsx" solop@sol-vps-01:/var/www/huongdi/admin/src/pages/
scp "$LOCAL\admin\src\pages\DirectionEditPage.tsx" solop@sol-vps-01:/var/www/huongdi/admin/src/pages/
scp "$LOCAL\admin\src\pages\DirectionRevisionsPage.tsx" solop@sol-vps-01:/var/www/huongdi/admin/src/pages/
scp "$LOCAL\admin\src\pages\CaseStudiesPage.tsx" solop@sol-vps-01:/var/www/huongdi/admin/src/pages/
scp "$LOCAL\admin\src\pages\CaseStudyEditPage.tsx" solop@sol-vps-01:/var/www/huongdi/admin/src/pages/
```

### STEP 2 — Manual edits

**A. `admin/src/App.tsx`** — Add 5 routes:

```tsx
import DirectionsPage from './pages/DirectionsPage';
import DirectionEditPage from './pages/DirectionEditPage';
import DirectionRevisionsPage from './pages/DirectionRevisionsPage';
import CaseStudiesPage from './pages/CaseStudiesPage';
import CaseStudyEditPage from './pages/CaseStudyEditPage';

// Trong <Routes>:
<Route path="directions" element={<DirectionsPage />} />
<Route path="directions/new" element={<DirectionEditPage />} />
<Route path="directions/:id/edit" element={<DirectionEditPage />} />
<Route path="directions/:id/revisions" element={<DirectionRevisionsPage />} />
<Route path="case-studies" element={<CaseStudiesPage />} />
<Route path="case-studies/new" element={<CaseStudyEditPage />} />
<Route path="case-studies/:id/edit" element={<CaseStudyEditPage />} />
```

**⚠️ Lưu ý:** Nếu route `/directions` đã tồn tại (từ existing UI cũ chưa dùng DB), **cân nhắc:**
- Option A: **Overwrite** — comment out route cũ, dùng route mới sync với DB
- Option B: **Coexist** — đổi route mới sang `/directions-v2` để test không phá UI cũ

Em recommend **Option A** vì mục tiêu Batch 1 là thống nhất data source. UI cũ hardcode data sẽ vô dụng khi Batch 2 refactor buoc3.html gọi API.

**B. `admin/src/components/Layout.tsx`** — Update menu sidebar:

```tsx
// Section "Sol La Bàn Content"
<NavLink to="/directions">🗺️ Hướng đi (36)</NavLink>
<NavLink to="/case-studies">📖 Case Studies</NavLink>

// Existing (giữ):
<NavLink to="/leads">💰 Leads</NavLink>
```

**C. `admin/src/utils/api.ts`** — APPEND content của `api-directions.ts` vào cuối file. Hoặc:

```tsx
// Nếu muốn giữ file separate, chỉ cần import trong pages:
export * from './api-directions';
```

### STEP 3 — Build + verify

```bash
cd /var/www/huongdi/admin
npm run build

# Verify
ls -la dist/  # có index.html + assets/*.js

# Nginx sẽ serve /var/www/huongdi/admin/dist/ tự động
# Hard refresh browser (Ctrl+Shift+R)
```

## 🧪 Smoke Test Admin UI

Mở `https://adminhuongdi.sol.vn/directions`:

**✅ Phải thấy:**
1. Header với "🗺️ Directions Manager"
2. 4 summary chips (Tổng · Đã đăng · Chờ duyệt · Nháp)
3. Filter bar (Tìm kiếm · Nhóm ngành · Cluster · Trạng thái)
4. Grid 36 direction group by category
5. Mỗi card show emoji + title + status badge + income + timeline

**Test flow:**
1. Click card **"Freelancer Kế Toán & Thuế"** → mở editor 60 fields
2. Editor có 10-11 sections accordion (Basic · Legacy · Filter · Matching · Business · Time · VN Reality · Roadmap · AI · Audit)
3. Section 1 (Basic) và Section 2 (Legacy) EXPAND mặc định
4. Sửa Title thành "Freelancer Kế Toán & Thuế (updated)"
5. Nhập change note: "Test edit"
6. Click 💾 Lưu (v2)
7. → Alert "✅ Đã lưu thành công! (Version bump + auto-revision)"
8. Click "📜 Lịch sử" → thấy v1 snapshot với editedBy + changeNote

**Test Case Studies:**
1. Click menu "📖 Case Studies" → thấy 3 case (Anh Đức · Anh Thắng · Chị Lan)
2. Click case study #01 → editor với metadata (left) + HTML editor (right)
3. Click "👁️ Preview" toggle giữa editor và preview render
4. Sửa persona name → 💾 Lưu → verify updated

## 🎨 Styling Notes

**Tailwind classes** — code dùng Tailwind utility classes chuẩn. Nếu admin SPA hiện tại dùng CSS module hoặc styled-components → cần adapt.

**Kiểm tra tailwind config:**
```bash
cat /var/www/huongdi/admin/tailwind.config.js
# Nếu không tồn tại: dùng CDN Tailwind trong index.html tạm thời
# Hoặc install: cd admin && npm i -D tailwindcss postcss autoprefixer
# npx tailwindcss init -p
```

**Icons emoji** — không dùng thư viện icon riêng, dùng native emoji. Đơn giản, không dependency.

**Prose class** — `<div className="prose">` cần plugin `@tailwindcss/typography`. Nếu chưa có → thay bằng plain HTML container.

## 🐛 Common issues

**"Cannot find module './pages/DirectionsPage'"** — Verify file path đúng `admin/src/pages/`.

**"axios not installed"** — Admin SPA hiện tại đã có axios (từ leads integration). Verify: `cat admin/package.json | grep axios`.

**API 401 Unauthorized** — JWT expired. Login lại `adminhuongdi.sol.vn/login`.

**API 404 /api/admin/directions** — Verify Batch 1 backend đã deploy (STEP 3 trong INTEGRATION-GUIDE.md).

**Editor không load direction** — Check console F12. Nếu API return `{success:true, data:null}` → direction ID không tồn tại trong DB (verify seed).

**JSON input reject valid JSON** — JsonInput component parse JSON on blur. Trailing comma hay single quote sẽ fail. Dùng JSON format chuẩn.

**Save button disable mãi** — State `saving` không reset. Check network tab F12 xem request có complete không.

## 📋 Post-Deploy Checklist

- [ ] `adminhuongdi.sol.vn/directions` load 36 card
- [ ] Filter Category (chuyenmon) → chỉ show 9 card
- [ ] Filter Status (PUBLISHED) → 36 card
- [ ] Search "kế toán" → highlight matching
- [ ] Click card → editor 10-11 sections
- [ ] Edit + save → version bump v1 → v2
- [ ] Revisions page → v1 snapshot visible
- [ ] Revert v1 → data khôi phục
- [ ] `/case-studies` → 3 case study
- [ ] Case study editor có Preview toggle work

## 🔗 Related

- Backend deploy: [INTEGRATION-GUIDE.md](./INTEGRATION-GUIDE.md)
- Schema reference: [prisma-additions.prisma](./prisma-additions.prisma)
- Seed data: [backend/seed/seed-directions.ts](./backend/seed/seed-directions.ts)

---

**Version:** V1 — 2026-07-03
**Deploy target:** `/var/www/huongdi/admin/`
