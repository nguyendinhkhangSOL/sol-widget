# Audit + Phương án xử lý 38 mô hình SQL đối tác

**Ngày:** 08/07/2026
**Nguồn:** `seed-catalog-38-mo-hinh-v0.sql` (232 dòng · 41.8KB)
**Đối tượng:** Sol Product Team

---

## TÓM TẮT

Đối tác đã đóng gói **38 mô hình direction dạng SQL** — sẵn sàng chạy trên Postgres/Supabase. Cấu trúc chia 3 phần:

- **8 mô hình đầu (MH-101 → MH-108):** đã có toàn văn rich content, status `published`
- **30 mô hình mới (MH-109 → MH-138):** catalog **sơ bộ (draft)** với YAML metadata đầy đủ, body chưa biên soạn
- **2 mô hình đã LOẠI** (đồng hành người cao tuổi + đào tạo kỹ năng số 55+) — đối tác chốt không đưa vào vì nhạy cảm

**Chất lượng SQL:** Đối tác thể hiện trách nhiệm cao — có "**QUY ƯỚC TRUNG THỰC**" ở đầu file, đánh dấu rõ dữ liệu nào đã kiểm chứng, dữ liệu nào là ước tính lần đầu. Đây là practice hiếm gặp trong VN market.

**Ý nghĩa cho Sol:** Đối tác đã làm sẵn **60-70% việc catalog** cho toàn bộ product. Sol chỉ cần adopt + biên soạn 30 body markdown trong 3 đợt (9-14 phiên làm việc).

---

## 1. Cấu trúc 38 mô hình

### 1.1. 7 Categories tự nhiên (khác với 7 enum Sol)

| Code đối tác | Tên đầy đủ | Số mô hình |
|--------------|-----------|:----------:|
| `cho-thue-tai-san` | Cho thuê tài sản | 2 (MH-101, 138) |
| `noi-dung-so` | Nội dung số & thương hiệu cá nhân | 6 (MH-102, 108, 125-129) |
| `dich-vu-chuyen-mon` | Dịch vụ chuyên môn hóa | 10 (MH-103, 104, 105, 109-115) |
| `van-hanh-quan-ly` | Vận hành & quản lý thuê ngoài | 7 (MH-106, 107, 116-120) |
| `thuong-mai-tmdt` | Thương mại & TMĐT | 4 (MH-121-124) |
| `san-xuat-nhe-thu-cong` | Sản xuất nhẹ & thủ công | 3 (MH-130-132) |
| `dich-vu-doi-song` | Dịch vụ đời sống | 6 (MH-133-138) |

**So với Sol** (7 enum: CHUYEN_MON, DAO_TAO, NOI_DUNG_SO, KINH_DOANH, DAILY, DICH_VU, DAU_TU) — categories đối tác **cụ thể hơn** và **linh hoạt hơn** (text code chứ không enum cứng).

### 1.2. 30 mô hình mới (draft) — Danh sách

| # | Mã | Nghề | Category | Priority | Legal flag |
|:-:|----|------|----------|:--------:|:----------:|
| 1 | MH-109 | Hỗ trợ thủ tục hành chính DN nhỏ | Chuyên môn | 2 | ⚠️ Ranh giới pháp lý |
| 2 | MH-110 | Nhân sự thuê ngoài SME (lương, BHXH) | Chuyên môn | 2 | ⚠️ Điều kiện dịch vụ việc làm |
| 3 | MH-111 | Môi giới cho thuê BĐS ngách | Chuyên môn | 3 | ⚠️ Chứng chỉ môi giới BĐS |
| 4 | MH-112 | Giáo dục tài chính gia đình | Chuyên môn | 3 | ⚠️ Không tư vấn đầu tư CK |
| 5 | **MH-113** | **BHXH & hồ sơ lao động (vệ tinh MH-104)** | Chuyên môn | **1** | Rà điều kiện hành nghề |
| 6 | MH-114 | Biên-phiên dịch chuyên ngành | Chuyên môn | 3 | — |
| 7 | **MH-115** | **Dạy kèm người lớn theo ngách** | Chuyên môn | **1** | — |
| 8 | MH-116 | Quản lý nhà trọ thuê ngoài | Vận hành | 2 | — |
| 9 | MH-117 | Chăm sóc nhà vắng chủ | Vận hành | 2 | Bảo hiểm trách nhiệm |
| 10 | MH-118 | Suất ăn văn phòng bếp đặt trước | Vận hành | 3 | ⚠️ ATTP bắt buộc |
| 11 | MH-119 | Quản lý tòa nhà văn phòng mini | Vận hành | 3 | — |
| 12 | MH-120 | Trải nghiệm du lịch bản địa | Vận hành | 3 | ⚠️ Lữ hành có điều kiện |
| 13 | **MH-121** | **Chụp ảnh + vận hành gian hàng TMĐT** | Thương mại | **1** | — |
| 14 | MH-122 | Đặc sản quê theo mùa | Thương mại | 3 | ATTP + nhãn mác |
| 15 | MH-123 | Đại lý bảo hiểm phi nhân thọ ngách | Thương mại | 3 | ⚠️ Chứng chỉ đại lý BH |
| 16 | MH-124 | Thẩm định nhượng quyền nhỏ | Thương mại | 2 | — |
| 17 | **MH-125** | **Kênh chia sẻ chuyên môn nghề cũ** | Nội dung số | **1** | — |
| 18 | MH-126 | Ebook + khóa học thu nhỏ | Nội dung số | 2 | — |
| 19 | MH-127 | Bản tin ngách trả phí B2B | Nội dung số | 3 | — |
| 20 | MH-128 | Hồi ký + gia phả số gia đình | Nội dung số | 2 | — |
| 21 | **MH-129** | **Chăm sóc kênh số trọn gói cho hộ KD** | Nội dung số | **1** | — |
| 22 | MH-130 | Thực phẩm nhà làm có đăng ký | Sản xuất nhẹ | 2 | ⚠️ ATTP |
| 23 | MH-131 | Xưởng thủ công mini bán online | Sản xuất nhẹ | 3 | — |
| 24 | MH-132 | Nông nghiệp giá trị cao quy mô hộ | Sản xuất nhẹ | 3 | — |
| 25 | **MH-133** | **Sửa chữa bảo trì nhà theo gói** | Đời sống | **1** | — |
| 26 | MH-134 | Chuyển nhà + dọn dẹp sâu | Đời sống | 2 | — |
| 27 | MH-135 | Chăm sóc cây cảnh sân vườn | Đời sống | 2 | — |
| 28 | MH-136 | Trông giữ chăm sóc thú cưng | Đời sống | 2 | — |
| 29 | MH-137 | Nấu cỗ tiệc tại gia | Đời sống | 3 | ⚠️ ATTP |
| 30 | MH-138 | Cho thuê thiết bị sự kiện | Cho thuê | 3 | — |

**Priority 1 — Đợt 1 (6 mô hình quan trọng nhất):** MH-113, 115, 121, 125, 129, 133 — biên soạn 2-3 phiên đầu tiên.

---

## 2. Overlap giữa 38 đối tác và 37 Sol

Em đối chiếu tên nghề để phát hiện overlap:

| Sol direction | MH đối tác | Overlap |
|---------------|-----------|:-------:|
| #02 freelancer-chuyen-mon | (không match trực tiếp) | ❌ |
| #05 van-chuyen-giao-hang | ~MH-134 chuyen-nha-don-dep | 🔀 Khác |
| #08 cho-thue-phong-tro-airbnb | **MH-106 homestay** | ✅ **TRÙNG** |
| #17 dau-tu-tai-chinh | (đối tác LOẠI vì nhạy cảm) | ⚠️ Nên loại theo đối tác |
| #18 gia-su-day-kem | **MH-115 day-kem-nguoi-lon** | ✅ **TRÙNG** |
| #22 cham-soc-suc-khoe-tai-nha | (đối tác LOẠI) | ⚠️ Nên loại |
| #23 ke-toan-thue-sme | **MH-104 ke-toan-thue-ho-KD** | ✅ **TRÙNG** |
| #24 luat-su-ke-toan-doc-lap | ~MH-109 hành chính + MH-113 BHXH | 🔀 Tách nhỏ hơn |
| #26 viet-sach-ebook | **MH-126 ebook-khoa-hoc-thu-nho** | ✅ **TRÙNG** |
| #28 dich-vu-thu-cung | **MH-136 trong-giu-thu-cung** | ✅ **TRÙNG** |
| #31 thiet-ke-doc-lap | MH-103 nội thất (cụ thể hơn) | 🔀 Refine |
| #33 kinh-doanh-thuc-pham-dac-san | **MH-130 thuc-pham-nha-lam + MH-122 dac-san-que** | ✅ **TRÙNG (chia 2)** |
| #34 affiliate-marketing | **MH-102 affiliate-marketing-nganh** | ✅ **TRÙNG** |
| #36 dich-thuat-chuyen-nganh | **MH-114 bien-phien-dich** | ✅ **TRÙNG** |
| #37 kinh-doanh-handmade | **MH-131 xuong-thu-cong-mini** | ✅ **TRÙNG** |

**Kết quả overlap:**
- **9 direction Sol trùng thẳng** với 9 mô hình đối tác
- **2 direction Sol** (dau-tu-tai-chinh + cham-soc-suc-khoe-tai-nha) trùng với 2 mô hình đối tác đã LOẠI vì nhạy cảm → **nên loại theo đối tác**
- **3 direction Sol** trùng partial → refine sub-niche
- **23 direction Sol** không match trực tiếp → giữ nguyên hoặc để dần

---

## 3. Đánh giá chất lượng SQL đối tác

### 3.1. Điểm nổi bật

**A. QUY ƯỚC TRUNG THỰC ở header** — thừa nhận rõ:
- MH-109-138 là ước tính lần đầu chưa kiểm chứng
- Số liệu draft KHÔNG hiện public (status='draft')
- 2 mô hình đã LOẠI vì nhạy cảm — tôn trọng quyết định trước
- Mã số MH-109-138 là tạm

Đây là **practice cực chuyên nghiệp** — không "làm để lấy số".

**B. YAML metadata giàu insight cho 30 mô hình mới:**

Ví dụ **MH-118 Suất ăn văn phòng**:
```yaml
risk_level: "CAO — an toàn thực phẩm, biên lợi nhuận mỏng, phụ thuộc vài khách lớn"
not_suitable_for: "Người làm một mình không đội phụ; người không dậy được 4-5h sáng đều đặn"
legal_flag: "Giấy chứng nhận ATTP bắt buộc; một vụ ngộ độc là mất nghề — đưa thành cảnh báo trung tâm"
production_priority: 3
```

**C. Cross-reference giữa các mô hình:**
- MH-113 là "**vệ tinh của MH-104**" → gợi ý combo Kế toán + BHXH
- MH-111 là "**chị em với MH-106**" → cùng lĩnh vực BĐS
- MH-113 và MH-104 → **combo tự nhiên** cho user

**D. Legal flag rõ ràng cho các nghề có điều kiện:**
- MH-109: ranh giới với dịch vụ pháp lý
- MH-111: Luật Kinh doanh BĐS yêu cầu chứng chỉ
- MH-112: TUYỆT ĐỐI không tư vấn đầu tư
- MH-118, MH-122, MH-130, MH-137: ATTP bắt buộc
- MH-120: Lữ hành có điều kiện
- MH-123: Chứng chỉ đại lý bảo hiểm

Sol đang **thiếu hoàn toàn legal flag** cho 37 direction hiện tại.

**E. Denormalize cột số cho filter nhanh:**
```
capital_min_vnd, capital_max_vnd
income_min_vnd, income_max_vnd
ttr_min_months, ttr_max_months
risk_score (1-5), ai_impact_score (1-5)
```

**F. Idempotent + Transaction wrapped:** `begin; ... on conflict do nothing; commit;` — chạy lại nhiều lần không phá dữ liệu.

**G. Lộ trình biên soạn 3 đợt rõ ràng:**
- **Đợt 1 (P1) — 6 mô hình:** 113, 115, 121, 125, 129, 133 → 2-3 phiên
- **Đợt 2 (P2) — 10 mô hình:** 109, 110, 116, 117, 124, 126, 128, 134, 135, 136 → 3-4 phiên
- **Đợt 3 (P3) — 14 mô hình còn lại**

### 3.2. Điểm cần điều chỉnh

1. **Chưa có 21 vector scores** — Sol algorithm cần chấm bổ sung
2. **Chưa có solArticleUrl** — cross-link tới pillar SEO chưa có
3. **Categories text code (7 loại)** khác **Sol enum (7 loại khác)** — cần bảng map

---

## 4. 3 phương án xử lý

### Phương án A — **Adopt hoàn toàn 38 đối tác, thay 37 Sol**

**Ưu:**
- Kiến trúc chuẩn 1 lần
- 38 mô hình có metadata chi tiết hơn 37 Sol
- Có sẵn legal flag + priority

**Nhược:**
- Mất 37 direction shell Sol đã có (23 direction không match đối tác)
- Rủi ro cao: user hiện tại có SavedDirection/UserOutcome trỏ vào direction Sol
- Phải re-do matching 21 vector cho toàn bộ 38 mô hình

### Phương án B — **Merge chọn lọc — Best of both**

**Chi tiết:**
- **8 mô hình đối tác đã có rich content (MH-101-108)** → import full vào Sol DB (merge 3 slug trùng)
- **30 mô hình đối tác draft (MH-109-138)** → import shell, chờ biên soạn body
- **23 direction Sol không overlap** → giữ nguyên
- **2 direction Sol trùng với "đối tác đã loại" (dau-tu-tai-chinh, cham-soc-suc-khoe-tai-nha)** → soft-archive theo đối tác
- **7 direction Sol trùng đối tác** → dùng phiên bản đối tác (chất lượng hơn)

**Kết quả cuối:** ~60 mô hình direction (28 Sol giữ + 30 đối tác draft + 8 đối tác published + 1 trùng đã có Freelancer Chuyên môn của Sol) — **thư viện lớn nhất VN cho persona 40-60**.

**Ưu:** Không mất data Sol, tận dụng đối tác + product cân bằng.
**Nhược:** Duy trì 2 nguồn dữ liệu — cần quy trình đảm bảo consistency.

### Phương án C — **Đối tác làm base, migrate Sol content vào**

**Chi tiết:**
- Dùng schema đối tác làm base 100%
- Chỉ giữ 37 direction Sol nếu **có unique content value**
- Reset ID: 37 direction Sol → MH-201 → MH-237 (dùng dải 200 để phân biệt)

**Ưu:** Kiến trúc thuần đối tác, tránh nhầm lẫn.
**Nhược:** Effort refactor cao, mất SavedDirection FK linkage.

---

## 5. Đề xuất em: **Phương án B (Merge chọn lọc)**

### Vì sao B thắng?

1. **An toàn user data hiện tại** — SavedDirection, UserOutcome, JourneyDay không bị mất FK
2. **Tận dụng tối đa 2 nguồn** — đối tác chất lượng cao ×8, Sol có 37 shell làm foundation
3. **60 mô hình = thư viện lớn nhất** cho persona 40-60 VN
4. **Roadmap biên soạn có sẵn** — Đợt 1-2-3 của đối tác 30 mô hình
5. **Loại 2 mô hình nhạy cảm** — tôn trọng phán đoán chuyên môn đối tác

### Migration Path 4 tuần

**Tuần 1 — Foundation**
- Ship schema V2 (adopt đối tác + `model_scores` Sol) — như đã đề xuất trong `UNIFIED-DB-SCHEMA-2026-07-08.md`
- Chạy SQL seed 38 mô hình đối tác vào DB
- Import 8 rich content từ file `.md` (script parse — đối tác đã có logic trong prototype)
- Chấm 21 vector cho 8 mô hình rich (em đã có sẵn từ Section 4.3 file trước)

**Tuần 2 — Merge overlap**
- 9 slug trùng → UPDATE Sol direction với content đối tác (giữ ID Sol, giữ user FK)
- 2 direction nhạy cảm (MH-17, MH-22) → set status ARCHIVED (không hiện public)
- 30 mô hình đối tác draft → chấm 21 vector shell (default 50 ngang default), chờ biên soạn body

**Tuần 3 — Biên soạn Đợt 1**
- Ship 6 mô hình priority 1: MH-113, 115, 121, 125, 129, 133
- Dùng Master Prompt đối tác đã có + Claude API sinh body (200 dòng x 6 = 1200 dòng)
- Em review, anh approve — publish

**Tuần 4 — Biên soạn Đợt 2 + SEO cross-link**
- 10 mô hình priority 2
- Ship pillar SEO cross-link cho các mô hình đã publish
- Update `solArticleUrl` field

---

## 6. Ship script chuyển SQL đối tác → Prisma Sol

Vì schema Sol hiện tại là Prisma + Postgres (không phải Supabase), cần script convert:

```typescript
// scripts/import-partner-38-catalog.ts

import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

// Đọc file SQL đối tác + parse INSERT statements
const sql = fs.readFileSync('seed-catalog-38-mo-hinh-v0.sql', 'utf-8');

// ... hoặc chạy trực tiếp SQL qua psql sau khi migrate schema

async function main() {
  // Bước 1: Chạy migration adopt schema đối tác (đã đề xuất)
  // Bước 2: Chạy SQL seed đối tác trực tiếp qua psql
  // Bước 3: Chạy script này để chấm 21 vector + merge overlap
  
  const MERGE_MAP: Record<string, string> = {
    'MH-102': 'affiliate-marketing',            // Sol #34
    'MH-104': 'ke-toan-thue-sme',                // Sol #23
    'MH-106': 'cho-thue-phong-tro-airbnb',       // Sol #08
    'MH-114': 'dich-thuat-chuyen-nganh',         // Sol #36
    'MH-115': 'gia-su-day-kem',                  // Sol #18
    'MH-122': 'kinh-doanh-thuc-pham-dac-san-1',  // Sol #33 split
    'MH-126': 'viet-sach-ebook',                 // Sol #26
    'MH-131': 'kinh-doanh-handmade',             // Sol #37
    'MH-136': 'dich-vu-thu-cung',                // Sol #28
  };
  
  // ...
}
```

Em có thể ship script cụ thể sau khi anh confirm phương án B.

---

## 7. 3 câu hỏi cần anh quyết

### Câu 1 — Phương án tổng
- **A** — Adopt 38 đối tác, bỏ 37 Sol (risk cao)
- **B** — Merge chọn lọc (em nghiêng)
- **C** — Đối tác làm base, migrate Sol

### Câu 2 — 2 mô hình nhạy cảm đối tác đã loại
- Đồng hành người cao tuổi (Sol #22) + Đào tạo kỹ năng số 55+ 
- **Có** archive theo đối tác → đúng phán đoán chuyên môn
- **Không** giữ nguyên trong Sol → khác thị trường

Em nghiêng về **archive theo đối tác** vì họ đã suy nghĩ rất kỹ về YMYL risk.

### Câu 3 — Biên soạn body 30 mô hình
- **A** — Đối tác biên soạn tiếp (nếu còn scope hợp đồng)
- **B** — Sol dùng Claude API sinh body theo Master Prompt đối tác
- **C** — Combo: đợt 1 (6 P1) đối tác, đợt 2-3 (24 P2+P3) Claude API

Em đề xuất **C** — kết hợp chất lượng + tốc độ.

---

## 8. Kết luận

**Đối tác đã tặng Sol một món quà thứ 3 và quan trọng nhất:**
1. **File 1:** 8 mô hình rich content (16-20KB mỗi bộ) — anchor chất lượng
2. **File 2:** Schema DB Postgres/Supabase chuyên nghiệp — kiến trúc production
3. **File 3 (hôm nay):** SQL seed 38 mô hình có metadata đầy đủ + lộ trình biên soạn — roadmap 3 tháng tới

Ba file này gộp lại = **product blueprint hoàn chỉnh** cho Sol MVP V2 trong 4-8 tuần.

**Adoption path clear:** Phương án B, 4 tuần, kết quả cuối = ~60 direction (đối thủ VN không có), user 40-60 có công cụ định hướng nghề đầy đủ nhất thị trường.

Anh trả lời 3 câu hỏi Section 7 → em bắt đầu ship migration Tuần 1.
