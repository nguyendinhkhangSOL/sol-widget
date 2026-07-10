# Audit CSDL Direction đối tác biên tập
## Phương án khai thác, tích hợp, hiệu chỉnh

**Ngày audit:** 08/07/2026
**Nguồn:** `solvn-prototype-pheu-choedit.html` (263KB, prototype phễu)
**Người audit:** Sol Product Team (Khang + AI cộng tác)

---

## 1. Đối tác đã bàn giao cái gì?

**8 mô hình rich content (MH-101 → MH-108)** với chất lượng biên tập cao — mỗi mô hình ~16-20KB markdown, 165 dòng, 11 sections chuẩn.

### Danh sách 8 mô hình

| Mã | Tên ngắn | Category | Vốn (triệu) | Thu nhập (triệu) | TTR | Free tier |
|:--:|----------|----------|:-----------:|:-----------------:|:---:|:---------:|
| MH-101 | Cho thuê tài sản nhỏ | Dịch vụ cho thuê & chia sẻ tài sản | 20-150 | 4-25 | 14-45 ngày | ❌ |
| MH-102 | Affiliate theo ngách | Kinh doanh số & nội dung | 5-30 | 2-20 | 30-90 ngày | ✅ |
| MH-103 | Thiết kế nội thất freelancer | Dịch vụ chuyên môn freelance | 15-60 | 8-40 | 30-60 ngày | ❌ |
| MH-104 | Kế toán - thuế hộ KD | Dịch vụ chuyên môn B2B | 10-40 | 8-45 | 15-45 ngày | ✅ |
| MH-105 | Số hóa + AI hóa cho SME | Dịch vụ chuyên môn B2B | 10-35 | 8-35 | 20-45 ngày | ❌ |
| MH-106 | Quản lý homestay/căn hộ | Dịch vụ quản lý & vận hành | 15-60 | 6-40 | 30-60 ngày | ✅ |
| MH-107 | Fractional Manager | Dịch vụ chuyên môn B2B | 5-25 | 15-60 | 30-90 ngày | ❌ |
| MH-108 | Chấp bút cho chủ SME | Dịch vụ nội dung & truyền thông B2B | 5-20 | 8-35 | 30-60 ngày | ❌ |

### 15 fields mỗi mô hình

`num · id · short · title · category · capital · income · ttr · risk · ai · notsuit · traps · toc · free · body`

**Chất lượng nổi bật:**
- Content chuyên sâu, có bối cảnh VN 2024-2026 rõ ràng
- Section "AI impact 2026-2030" cực valuable (moat thị trường)
- 3 traps + notsuit rất thực tế, có "(đặc thù 40-60)"
- 11 sections chuẩn hoá (đồng nhất giữa 8 mô hình)
- Body ~16-20KB — depth ngang MH-108 (đã import Sol)

---

## 2. So sánh CSDL đối tác vs Sol hiện tại

### 2.1. Ma trận overlap giữa 8 đối tác và 37 Sol

| MH đối tác | Sol direction gần nhất | Trạng thái | Ghi chú |
|-----------|-----------------------|------------|---------|
| MH-101 Cho thuê tài sản nhỏ | (không match) | 🆕 **MỚI** | Nghề unique — expand tuyến "cho thuê" |
| MH-102 Affiliate theo ngách | **Sol #34** `affiliate-marketing` | 🔁 **TRÙNG** | Content đối tác chất lượng hơn → merge |
| MH-103 Thiết kế nội thất freelancer | Sol #31 `thiet-ke-doc-lap` (generic) | 🔀 **GẦN TRÙNG** | Sol generic, đối tác cụ thể "nội thất" — refactor Sol thành sub-niche |
| MH-104 Kế toán - thuế hộ KD | **Sol #23** `ke-toan-thue-sme` | 🔁 **TRÙNG** | Merge content |
| MH-105 Số hóa + AI hóa cho SME | (không match) | 🆕 **MỚI** | Rất giá trị — độc nhất trong VN market |
| MH-106 Homestay/căn hộ | **Sol #08** `cho-thue-phong-tro-airbnb` | 🔁 **TRÙNG** | Merge content |
| MH-107 Fractional Manager | Sol #12 `tu-van-doanh-nghiep` (gần) | 🔀 **BỔ TRỢ** | Sol tổng quát, đối tác cụ thể — giữ cả 2 |
| MH-108 Chấp bút cho chủ SME | (đã import vào DB Sol) | ✅ **ĐÃ IMPORT** | Session trước em đã ship script |

**Tổng kết overlap:**
- **3 trùng thẳng** (MH-102, MH-104, MH-106) → merge content, giữ ID Sol
- **2 gần trùng** (MH-103, MH-107) → refactor sub-niche
- **2 mới hoàn toàn** (MH-101, MH-105) → thêm vào DB
- **1 đã import** (MH-108) → chỉ update rich fields nếu có

### 2.2. So sánh cấu trúc dữ liệu

| Field đối tác | Field DB Sol | Trạng thái | Action |
|--------------|-------------|-----------|--------|
| `num` (101-108) | `sortOrder` | ✅ Match | Copy trực tiếp |
| `id` (MH-101...) | (không có) | 🆕 Thêm | Add column `partner_id` hoặc chỉ dùng slug |
| `short` (Tên ngắn 30 ký tự) | `name` | 🔀 Format khác | Sol dùng title full, đối tác có `short` + `title` — Sol lưu cả 2 |
| `title` (Tên đầy đủ) | `name` (Sol) | ✅ Copy vào `name` | |
| `category` (text tự do) | `category` (enum 7 loại) | ⚠️ Cần map | Map "Dịch vụ chuyên môn B2B" → `CHUYEN_MON`, "Kinh doanh số & nội dung" → `NOI_DUNG_SO`... |
| `capital` (VD "20.000.000 - 150.000.000") | (không có) | 🆕 Cần schema mới | Add `capitalMin/capitalMax INT` |
| `income` (VD "4-25 triệu sau 9-18 tháng...") | (không có) | 🆕 Cần schema mới | Add `incomeRangeText TEXT` hoặc parse |
| `ttr` (VD "14-45 ngày") | (không có) | 🆕 Cần schema mới | Add `timeToRevenueText TEXT` |
| `risk` (text mô tả) | `vrRisk` (0-100) | 🔀 Overlap | Parse text để chấm `vrRisk` |
| `ai` (text mô tả AI impact) | `vbAiLeverage` (0-100) | 🔀 Overlap | Parse text để chấm `vbAiLeverage` |
| `notsuit` (không phù hợp cho ai) | (không có) | 🆕 Cần schema mới | Add `notSuitableFor TEXT` |
| `traps[]` (3 traps) | `barriers` (JSON array) | ✅ Match | Copy trực tiếp |
| `toc[]` (Table of Contents) | (derived) | 🔀 | Không cần lưu, derive từ body |
| `free` (bool) | `isFeatured` (bool implicit) | ✅ Match | Copy trực tiếp — đối tác có 3 free tier |
| `body` (markdown 16-20KB) | `description` + rich content | ⚠️ Cần schema mới | Add 6 columns JSON theo Progressive Depth Tầng 2/3 |

### 2.3. 21 vector scores — Gap lớn

Đối tác **KHÔNG có 21 vector scores** — Sol cần chấm bằng tay hoặc dùng Claude API.

**Đề xuất:** Em chấm sẵn 8 mô hình dựa nội dung `body` — thời gian ~15 phút/mô hình × 8 = 2 giờ. Anh review 15 phút.

---

## 3. Đánh giá chất lượng content đối tác

### 3.1. Điểm mạnh xuất sắc

1. **11 sections chuẩn hoá** cho tất cả 8 mô hình — đồng nhất, dễ so sánh chéo
2. **AI impact 2026-2030** — mục 3B trong mỗi mô hình. **Rất hiếm** trên thị trường VN.
3. **Traps "đặc thù 40-60"** — flag rõ 1-2 bẫy chỉ có ở persona này (VD "Bẫy làm miễn phí cho người quen")
4. **Con số VND cụ thể** — bảng chi phí + giá dịch vụ + lộ trình thu nhập chi tiết
5. **Case study nháp** — có sẵn placeholder cho user story thật, không copy-paste tổng quát
6. **Pháp lý VN 2024-2026** — cập nhật thuế hộ KD, luật sở hữu trí tuệ, quy định phát ngôn — cực value
7. **Checklist "có nên làm không"** — chuẩn UX cho persona 40-60 cần "self-assess before commit"

### 3.2. Điểm cần bổ sung

1. **Chưa có 21 vector scores** — thuật toán match Sol không dùng được
2. **Category text tự do** — không map thẳng vào enum Sol
3. **8 mô hình vs 37 Sol** — chỉ cover 22% khối lượng (nhưng chất lượng cao)
4. **Format HTML prototype** — chưa phải format database (cần script parse)
5. **Không có `solArticleUrl`** — link tới bài SEO trên sol.vn

---

## 4. Phương án tích hợp đề xuất

### Chiến lược tổng: **"Hybrid Adoption — Content-first, Score-second"**

Không thay thế toàn bộ Sol. Không refuse content đối tác. **Merge chọn lọc, quality-first**.

### Bước 1 — **Extend schema Direction** (1 giờ)

Add 6 columns mới vào bảng `directions`:

```prisma
// Rich content Tầng 2/3 (từ đối tác)
capitalMin        Int?      @map("capital_min")        // VNĐ
capitalMax        Int?      @map("capital_max")
incomeRangeText   String?   @map("income_range_text")  // Full text
timeToRevenue     String?   @map("time_to_revenue")    // "14-45 ngày"
riskProfile       String?   @map("risk_profile")       // Text mô tả 3 chiều
aiImpactText      String?   @map("ai_impact_text")     // Text mô tả AI 2026-2030
notSuitableFor    String?   @map("not_suitable_for")   // Ai không nên làm
richBody          String?   @map("rich_body")          // Markdown 16-20KB
```

Plus 1 optional (cho future):
```prisma
partnerId         String?   @map("partner_id")         // "MH-101" (giữ ID đối tác nếu cần track)
```

**Migration Prisma command:** `npx prisma migrate dev --name add_partner_rich_fields`.

### Bước 2 — **Ship script parse + import 8 mô hình** (2 giờ)

Script `import-partner-8.ts`:

1. Đọc JSON đã parse từ `solvn-prototype-pheu-choedit.html`
2. Với mỗi mô hình:
   - Map `category` text → Sol enum (fallback `DICH_VU`)
   - Parse `capital` "20.000.000 - 150.000.000" → `capitalMin: 20000000, capitalMax: 150000000`
   - Copy `body` → `richBody`
   - Copy `traps[]` → `barriers`
   - Set `isFeatured: partner.free === true`
   - Chấm 21 vector scores (em chấm sẵn — hardcode)
3. **Xử lý overlap:**
   - Nếu slug đã tồn tại (VD `affiliate-marketing`) → UPDATE thay vì INSERT, giữ id Sol cũ
   - Nếu không tồn tại → INSERT mới

**Deploy:** scp script + chạy `npx tsx scripts/import-partner-8.ts` trên VPS.

### Bước 3 — **Chấm 21 vector scores cho 8 mô hình** (em làm sẵn, anh review)

Em chấm ngay hôm nay dựa vào `body` content:

**MH-101 Cho thuê tài sản nhỏ (đề xuất scores):**
- P: people=50, expert=55, builder=70, independent=65
- R: capital=60, time=55, tech=45, network=40, risk=50, energy=55
- B: incomeSpeed=70, incomePot=50, scalability=45, aiLeverage=40
- S: expLeverage=45, relLeverage=45, learningDiff=40, healthReq=55

**MH-102 Affiliate theo ngách:**
- P: people=45, expert=80, builder=50, independent=85
- R: capital=15, time=70, tech=65, network=60, risk=70, energy=60
- B: incomeSpeed=35, incomePot=70, scalability=80, aiLeverage=90
- S: expLeverage=80, relLeverage=55, learningDiff=55, healthReq=25

**MH-103 Thiết kế nội thất freelancer:**
- P: people=60, expert=85, builder=55, independent=75
- R: capital=25, time=65, tech=60, network=65, risk=45, energy=65
- B: incomeSpeed=65, incomePot=70, scalability=40, aiLeverage=85
- S: expLeverage=85, relLeverage=65, learningDiff=50, healthReq=45

**MH-104 Kế toán - thuế hộ KD:**
- P: people=55, expert=90, builder=65, independent=70
- R: capital=15, time=60, tech=55, network=65, risk=25, energy=55
- B: incomeSpeed=85, incomePot=75, scalability=55, aiLeverage=70
- S: expLeverage=90, relLeverage=70, learningDiff=25 (yêu cầu chứng chỉ), healthReq=25

**MH-105 Số hóa + AI cho SME:**
- P: people=65, expert=80, builder=75, independent=75
- R: capital=15, time=65, tech=85, network=60, risk=40, energy=60
- B: incomeSpeed=75, incomePot=75, scalability=60, aiLeverage=95
- S: expLeverage=70, relLeverage=60, learningDiff=55, healthReq=25

**MH-106 Quản lý homestay/căn hộ:**
- P: people=70, expert=60, builder=75, independent=60
- R: capital=30, time=75, tech=55, network=55, risk=50, energy=75
- B: incomeSpeed=70, incomePot=70, scalability=65, aiLeverage=75
- S: expLeverage=55, relLeverage=55, learningDiff=50, healthReq=70

**MH-107 Fractional Manager:**
- P: people=75, expert=90, builder=70, independent=80
- R: capital=10, time=65, tech=50, network=85, risk=35, energy=65
- B: incomeSpeed=65, incomePot=90, scalability=50, aiLeverage=65
- S: expLeverage=95, relLeverage=85, learningDiff=45, healthReq=30

**MH-108 Chấp bút cho chủ SME** (đã import — giữ scores cũ):
- P: 65, 85, 40, 80
- R: 15, 60, 45, 75, 35, 60
- B: 60, 65, 30, 85
- S: 85, 75, 45, 25

### Bước 4 — **Update sol-ui frontend hiển thị Tầng 2/3 content** (2-3 giờ)

Trang `/la-ban-huong-di/[slug]/` cần hiển thị:
- Section "Con số thực tế (VND)" — từ `capitalMin/Max` + `incomeRangeText`
- Section "AI impact 2026-2030" — từ `aiImpactText`
- Section "Ai không nên làm" — từ `notSuitableFor`
- Section "Bẫy phổ biến" — từ `barriers` (đã có)
- Full body — render markdown từ `richBody`

**Free tier**: chỉ hiển thị 2-3 sections đầu, gate roadmap + AI impact.
**Active tier**: full 11 sections.

### Bước 5 — **Cross-link 8 mô hình → pillar SEO** (1 giờ)

Đối tác chưa có `solArticleUrl`. Sol có 7 pillar SEO sẵn. Map:
- MH-102 Affiliate → sol.vn/huong-di/affiliate-marketing-40-60/
- MH-104 Kế toán → sol.vn/huong-di/ke-toan-thue-sme-40-60/
- MH-107 Fractional → sol.vn/huong-di/fractional-manager-u45/

Nếu 5 mô hình còn lại chưa có pillar → **kế hoạch ship 5 pillar mới** trong tháng tới (task #91 UGC-Powered pSEO Architecture).

---

## 5. Timeline ship — 3 tuần

### Tuần 1 (tuần này) — **Foundation**
- ✅ Extend schema Direction (+6 columns) — 1 giờ
- ✅ Ship script `import-partner-8.ts` — 2 giờ
- ✅ Chấm 21 vector cho 8 mô hình — em làm sẵn
- ✅ Deploy + verify 8 mô hình xuất hiện trong `/la-ban-huong-di/`

### Tuần 2 — **Frontend rendering**
- Update trang detail direction để render 11 sections
- Free tier gating rõ ràng (2-3 sections vs 11 full)
- Test UX mobile

### Tuần 3 — **SEO linkage**
- Publish 5 pillar SEO cho 5 mô hình mới (MH-101, MH-105, MH-107, ...)
- Update `solArticleUrl` cho 8 mô hình
- Submit sitemap update GSC + Bing

---

## 6. Rủi ro & Đạo đức

### Rủi ro pháp lý — IP ownership

- **Ai sở hữu 8 mô hình?** Nếu đối tác là freelancer thuê thì Sol phải mua đứt IP (hợp đồng chuyển giao quyền tác giả)
- **Nếu là đối tác chiến lược** thì cần thoả thuận credit + revenue share
- **Đề xuất em:** hỏi đối tác về IP terms trước khi tích hợp production. Ship 1 draft hợp đồng NDA + IP transfer nếu cần.

### Rủi ro chất lượng — Consistency check

- Đối tác đã biên tập chuẩn 11 sections, nhưng **cần review sự đồng nhất với 37 direction Sol có sẵn**
- 5 mô hình mới (MH-101, MH-105, MH-107) chưa có SEO pillar → tạm thời rank kém

### Rủi ro schema — Migration risk

- Extend 6 columns mới cần **backup DB trước migration**
- Nếu production đã có user data → cẩn thận về default value NULL vs empty string

---

## 7. Câu hỏi cần anh quyết trước khi ship

**Câu 1 — Về đối tác:**
- Đối tác này có bàn giao IP hay là partner share revenue?
- Có kế hoạch mở rộng lên 30-50 mô hình không, hay chỉ dừng ở 8?

**Câu 2 — Về 37 direction Sol hiện tại:**
- Giữ nguyên 34/37 direction shell còn lại, hay dần merge với format 15-field của đối tác?
- Có muốn em ship rubric chấm 21 vector chuẩn hoá + apply cho 37 Sol để consistent?

**Câu 3 — Về category system:**
- Category đối tác text tự do (VD "Dịch vụ cho thuê & chia sẻ tài sản") không match enum Sol 7 loại (CHUYEN_MON, DAO_TAO, ...). Anh muốn:
  - **A** — Ép map vào 7 enum Sol (loss thông tin)
  - **B** — Đổi Sol sang text tự do như đối tác (linh hoạt nhưng khó filter)
  - **C** — Giữ enum 7 loại + add `subCategory` text tự do (best of both)

**Câu 4 — Về Free tier:**
- 3 mô hình đối tác đánh `free: true` (MH-102, MH-104, MH-106) → có nên set `isFeatured` để mở khoá cho Free user Sol không?
- Kết hợp với các direction Free tier hiện có → tổng bao nhiêu mở khoá?

---

## 8. Kết luận + đề xuất ngay

### Kết luận
1. **8 mô hình đối tác chất lượng rất cao** — vượt trội format Sol hiện tại
2. **3 trùng thẳng + 5 mới + 1 đã import** = **7 direction sắp lên DB nếu anh OK**
3. Cần **extend schema** + **map category** + **chấm 21 vector** — em có thể ship trong tuần này
4. **IP ownership** là câu hỏi quan trọng nhất — trước khi commit production

### 3 việc em đề xuất ship NGAY (không cần chờ trả lời câu 1-4)

- **A** — Extend schema Prisma +6 columns (không phá gì, chỉ add) — 30 phút
- **B** — Ship script parse `partner-models.json` sang format Sol — 1 giờ
- **C** — Chấm 21 vector sẵn cho 8 mô hình (em đã đề xuất ở Section 4.3) — done

Anh chỉ cần trả lời 4 câu ở Section 7, em bắt đầu ship 3 việc A-B-C.
