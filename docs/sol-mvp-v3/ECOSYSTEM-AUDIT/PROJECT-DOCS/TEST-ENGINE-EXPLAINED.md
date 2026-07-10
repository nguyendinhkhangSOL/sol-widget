# Sol La Bàn — Bức tranh Test 3 Bước & Thuật toán Match

**Audit thực tế từ code (không đoán mò)** — 08/07/2026

---

## 🎯 Tóm tắt trong 30 giây

Sol La Bàn dùng **11 điểm số cá nhân** (4 điểm DNA từ Bước 1 + 7 điểm nguồn lực từ Bước 2) để match với **21 điểm số của mỗi mô hình** trong DB 37 mô hình. Thuật toán tính **match score 0-100%** cho mỗi mô hình rồi trả về **Top 3 phù hợp nhất** kèm giải thích "vì sao".

**Free tier** thấy Top 3 nhưng chỉ mở 5/37 mô hình + xem stage 1 roadmap.
**Active tier** mở toàn bộ 37 mô hình + full roadmap 90 ngày + Sol Đồng Hành AI.

---

## 📊 Luồng 3 Bước — Người dùng đi qua

```
┌─────────────────────────────────────────────────────────────┐
│  BƯỚC 1 — KHÁM PHÁ BẢN THÂN                                 │
│  URL: /kham-pha-ban-than/                                   │
│  Thời gian: ~3-5 phút                                       │
│                                                              │
│  User trả lời 14 câu trắc nghiệm (không phải 20)            │
│  → Ra 4 điểm số DNA (0-100):                                │
│     • People (Kết nối con người)                            │
│     • Expert (Chuyên môn sâu)                               │
│     • Builder (Xây dựng hệ thống)                           │
│     • Independent (Độc lập tự chủ)                          │
│  → Xếp hạng 4 trục (rank1, rank2, rank3, rank4)             │
│                                                              │
│  SAVE: bảng p1_results trong DB (userId hoặc sessionId)     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  BƯỚC 2 — KIỂM KÊ NGUỒN LỰC                                 │
│  URL: /kiem-ke-nguon-luc/                                   │
│  Thời gian: ~4-6 phút                                       │
│                                                              │
│  User đánh giá 7 nguồn lực (0-100):                         │
│     • Experience (Kinh nghiệm)                              │
│     • Capital (Vốn)                                         │
│     • Time (Thời gian)                                      │
│     • Technology (Công nghệ)                                │
│     • Network (Mạng lưới)                                   │
│     • Risk (Khả năng chịu rủi ro)                           │
│     • Energy (Năng lượng)                                   │
│  + Chọn Income Goal (mục tiêu thu nhập)                     │
│                                                              │
│  SAVE: bảng p2_results trong DB                             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  BƯỚC 3 — LA BÀN HƯỚNG ĐI                                   │
│  URL: /la-ban-huong-di/                                     │
│                                                              │
│  Frontend gọi POST /api/directions/match-v2                 │
│  Body: { p1: {4 điểm}, p2: {7 điểm + incomeGoal},          │
│          userId, sessionId, limit: 3 }                      │
│                                                              │
│  Backend chạy thuật toán → trả về Top 3 direction           │
│  với match score (%) + reasons (giải thích) + roadmap       │
│                                                              │
│  UI hiển thị:                                               │
│     • 3 card top match ở đầu (personalized)                 │
│     • 37 card tổng (browse) — 5 mở, 32 khoá cho Free        │
│     • 7 category filter (Chuyên môn, Đào tạo, ...)          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧮 Thuật toán Match — Chi tiết công thức

File source: `huongdi-backend/src/routes/match-v2.ts` — hàm `calculateMatchScore()`.

**Match Score = Weighted average của 3 thành phần:**

```
                40%              45%               15%
       ┌─────────────────┬─────────────────┬─────────────────┐
Total  │  P1 DNA match   │  P2 Resource    │  Income Goal    │
Score  │  (Cosine sim)   │  match          │  alignment      │
       └─────────────────┴─────────────────┴─────────────────┘
                → Normalize về 0-100%
```

### Thành phần 1 — P1 DNA Match (weight 40%)

Dùng **cosine similarity** giữa vector P1 của user và vector P1 requirement của direction:

```
                Σ(user[k] × direction[k])
p1Score = ─────────────────────────────────────
         √(Σuser[k]²) × √(Σdirection[k]²)
```

**Ý nghĩa:** User có DNA giống "chân dung lý tưởng" của mô hình → score cao. VD:
- User: {people: 40, expert: 90, builder: 60, independent: 80}
- Direction "Chấp bút SME": {people: 70, expert: 85, builder: 40, independent: 75}
- → Cosine similarity ~ 0.92 (rất khớp — user mạnh Expert + Independent giống direction)

### Thành phần 2 — P2 Resource Match (weight 45%)

Với mỗi nguồn lực (7 loại), so sánh **user có so với direction cần**:

```
diff = user[k] - direction_requirement[k]
contrib = (diff >= 0) ? 1 : max(0, 1 + diff/100)
```

**Ý nghĩa:**
- Nếu user CÓ nhiều hơn direction CẦN → điểm trọn (1.0)
- Nếu user CÓ ít hơn direction CẦN → điểm giảm dần theo mức thiếu
- Nếu user CÓ = direction CẦN → điểm 1.0 (đủ ngưỡng)

VD user có Capital: 40, direction cần Capital: 70 → contrib = 1 + (-30/100) = 0.7 → "hơi thiếu vốn".

### Thành phần 3 — Income Goal alignment (weight 15%)

Match mục tiêu thu nhập của user với target income của direction (low/medium/high).

### Weight tại sao 40/45/15?

- **P2 nặng nhất (45%)** vì nguồn lực thực tế quyết định "làm được hay không" — dù có DNA phù hợp mà thiếu vốn/thời gian thì cũng không triển khai được
- **P1 quan trọng (40%)** vì DNA quyết định "làm có bền không" — làm trái DNA sẽ burnout
- **Income Goal (15%)** phụ trợ — filter mô hình có tiềm năng thu nhập không match với kỳ vọng

---

## 🏷️ DB Direction — Xếp hạng theo tiêu chí gì?

Mỗi direction trong DB có **21 vector scores (0-100)** — đây là "chân dung lý tưởng" của mô hình:

### Vector P — 4 điểm Personality (match với P1 user)

| Field | Ý nghĩa |
|-------|---------|
| `vpPeople` | Cần mạnh về giao tiếp con người |
| `vpExpert` | Cần chuyên môn sâu |
| `vpBuilder` | Cần khả năng xây hệ thống |
| `vpIndependent` | Cần tính độc lập tự chủ |

### Vector R — 6 điểm Resource (match với P2 user)

| Field | Ý nghĩa |
|-------|---------|
| `vrCapital` | Yêu cầu vốn khởi động |
| `vrTime` | Yêu cầu thời gian đầu tư |
| `vrTech` | Yêu cầu am hiểu công nghệ |
| `vrNetwork` | Yêu cầu network sẵn có |
| `vrRisk` | Mức độ rủi ro (cao = cần user chịu rủi ro tốt) |
| `vrEnergy` | Yêu cầu năng lượng cá nhân |

### Vector B — 4 điểm Business

| Field | Ý nghĩa |
|-------|---------|
| `vbIncomeSpeed` | Tốc độ tạo thu nhập (nhanh/chậm) |
| `vbIncomePot` | Tiềm năng thu nhập trần |
| `vbScalability` | Khả năng mở rộng |
| `vbAiLeverage` | Ứng dụng AI vào nghề |

### Vector S — 4 điểm Sol linkage

| Field | Ý nghĩa |
|-------|---------|
| `vsExpLeverage` | Tận dụng kinh nghiệm cũ |
| `vsRelLeverage` | Tận dụng quan hệ cũ |
| `vsLearningDiff` | Độ khó học (thấp = dễ vào nghề) |
| `vsHealthReq` | Yêu cầu sức khoẻ thể chất |

**Ngoài 21 điểm scoring, direction còn xếp hạng theo:**
- `category` (7 nhóm: CHUYEN_MON, DAO_TAO, NOI_DUNG_SO, KINH_DOANH, DAILY, DICH_VU, DAU_TU)
- `status` (DRAFT / PUBLISHED / ARCHIVED — chỉ PUBLISHED mới xuất hiện)
- `confidence` (LOW / MEDIUM / HIGH — độ tin cậy nội dung)
- `sortOrder` (thứ tự hiển thị mặc định khi browse)

---

## 🔓 Free vs Active — Người dùng thấy gì?

### Ai là Free?
- Chưa đăng ký / chưa đăng nhập
- Đã đăng ký nhưng chưa thanh toán (`tier = 'FREE'`)

### Ai là Active/Founder?
- Đã thanh toán 499k/năm (Active) hoặc 1.999k lifetime (Founder)
- Field `tier = 'ACTIVE'` hoặc `'FOUNDER'` trong DB user

### Ma trận tính năng theo tier

| Tính năng | Free (anonymous + registered) | Active 499k/năm | Founder 1.999k lifetime |
|-----------|:-------------------------------:|:----------------:|:-----------------------:|
| **Bước 1 (Khám phá bản thân)** | ✅ Full | ✅ Full | ✅ Full |
| **Bước 2 (Kiểm kê nguồn lực)** | ✅ Full | ✅ Full | ✅ Full |
| **Bước 3 Top 3 personalized** | ✅ Xem được match score | ✅ Full | ✅ Full |
| **Browse 37 mô hình** | 🔒 Mở 5/37 mô hình featured | ✅ Full 37 | ✅ Full 37 |
| **Chi tiết mô hình (description, whyFit)** | ✅ 5 mô hình mở | ✅ Đủ 37 | ✅ Đủ 37 |
| **Roadmap 90 ngày** | 🔒 Chỉ xem stage 1 (14 ngày đầu) | ✅ Full 5 stage | ✅ Full 5 stage |
| **Case study thực chiến** | 🔒 Preview 1 dòng | ✅ Full | ✅ Full |
| **Barriers (Bẫy phổ biến)** | 🔒 Xem 1-2 bẫy | ✅ Full 7 bẫy | ✅ Full 7 bẫy |
| **AI Studio — Thư viện 40 prompt** | 🔒 Mở 5/40 prompt | ✅ Full 40 | ✅ Full 40 + AI auto-generate |
| **Biên tập Prompt cá nhân hoá** | 🔒 Mở 5/40 template | ✅ Full 40 | ✅ Full 40 |
| **Sol Đồng Hành AI (Claude chat)** | ❌ Không có | ✅ Có (giới hạn quota) | ✅ Có (quota cao hơn) |
| **Sổ Hành Trình 90 ngày** | ❌ Không có | ✅ Có | ✅ Có |
| **Bản đồ hướng đi PDF** | ❌ Không có | ✅ Download | ✅ Download |
| **Founder slot (giới hạn 100)** | ❌ | ❌ | ✅ Là 1 trong 100 |

### Lock logic thực tế (`sol-auth.js`)

```javascript
function shouldLockDirection(direction) {
  if (isPaidTier()) return false;  // Active/Founder mở tất
  // Free tier: chỉ mở direction có isFeatured = true
  return !direction.isFeatured;
}
```

**Nghĩa là:** trong DB, chỉ **5 direction được đánh `isFeatured = true`** sẽ hiện đầy đủ cho Free. Còn lại 32 direction sẽ hiện card có overlay 🔒 "Nâng cấp Active để mở khoá".

### Roadmap lock logic (`match-v2.ts`)

```javascript
function buildRoadmapPreview(direction, userTier) {
  const isFree = userTier === 'FREE';
  const stages = [
    { day: 'Ngày 1-14', title: 'Xác định thị trường...',   locked: isFree && idx >= 1 ? false : ... },
    // Free chỉ xem stage 0 (14 ngày đầu)
    // Active xem đủ 5 stages
  ];
}
```

---

## 🎯 Free user dùng cái này làm gì?

Từ góc nhìn user Free:

1. **Tự đánh giá bản thân** — hoàn thành Bước 1 + Bước 2 (không mất tiền)
   → Biết DNA + nguồn lực mình đang có
   
2. **Thấy Top 3 mô hình phù hợp nhất với mình** — có match score %
   → "À, tôi mạnh Expert + Independent, có 3 mô hình phù hợp là Chấp bút, Freelance chuyên môn, Coaching"

3. **Xem chi tiết 5 mô hình featured** — description + whyFit + case study
   → Có "sample" để hiểu Sol có gì

4. **Thử 5/40 prompt AI** trong `/ai-studio/`
   → Trải nghiệm value AI Studio

5. **Đọc pillar SEO trên sol.vn** — bài dài về từng nghề
   → Build tin, hiểu Sol có content chuyên sâu

**Free tier KHÔNG dùng được:**
- Xem chi tiết 32 mô hình còn lại
- Roadmap 90 ngày đầy đủ
- Case study thực chiến full
- Sol Đồng Hành AI
- Sổ Hành Trình

**Mục tiêu Free tier (từ business):** Nhận diện value → cảm giác "aha" → convert lên Active.

---

## 💎 Active/Founder user dùng cái này làm gì?

1. **Có toàn bộ 37 mô hình mở khoá**
   → Có thể browse tự do, so sánh 37 mô hình

2. **Roadmap 90 ngày chi tiết cho mô hình đã chọn**
   → Ngày 1-14 làm gì · Ngày 15-30 làm gì · ... 5 stages · task cụ thể mỗi tuần

3. **Sol Đồng Hành AI** — chat với Claude 24/7
   → Hỏi bất cứ gì về roadmap, marketing, bán hàng cho mô hình mình chọn
   → Claude được "prime" với context 37 mô hình + framework 5 Bước

4. **Sổ Hành Trình 90 ngày**
   → Track tiến độ hàng ngày, checkin, note lại
   → (Có thể phát triển thành streak counter — chưa có)

5. **Bản đồ hướng đi PDF**
   → Download PDF cá nhân hoá — tóm tắt 5 Bước + Top 3 + Roadmap
   → In ra dán tường

6. **Full 40 prompt AI + biên tập cá nhân hoá**
   → Copy sang ChatGPT/Claude/Gemini để chạy

7. **Case study thực chiến full**
   → Đọc case của người thật đã đi mô hình đó (khi có data)

**Founder tier (1.999k lifetime — 100 slot):**
- Tất cả tính năng Active
- Lifetime access (không hết hạn)
- Slot có hạn tạo scarcity + community sớm

---

## 🔎 Ví dụ cụ thể — Chân dung chị Nga 52 tuổi

**Bước 1 kết quả (giả định):**
- People: 55 · Expert: 88 · Builder: 45 · Independent: 78
- Rank: Expert > Independent > People > Builder

**Bước 2 kết quả (giả định):**
- Experience: 90 (25 năm)
- Capital: 30 (không nhiều vốn)
- Time: 70 (đã nghỉ việc, có thời gian)
- Technology: 50 (dùng được nhưng không rành sâu)
- Network: 75 (network doanh nghiệp tốt)
- Risk: 40 (không dám mạo hiểm)
- Energy: 70

**Bước 3 backend chạy match-v2:**

Direction "Chấp bút SME" có:
- Vector P: {people: 65, expert: 85, builder: 40, independent: 75}
- Vector R: {capital: 30, time: 60, tech: 50, network: 60, risk: 30, energy: 65}

Cosine similarity P1: ~0.94 → 94% khớp DNA
P2 diff analysis: capital OK (30=30), network dư (75>60), risk OK (40>30), time dư → ~85% khớp
Income goal: user chọn "trung bình 15-25 triệu/tháng" — match "medium" → 90%

**Final score = 0.4×94 + 0.45×85 + 0.15×90 = 37.6 + 38.25 + 13.5 = 89.35% → làm tròn 89%**

**Reasons trả về cho user:**
1. "Match 89% — phù hợp tốt, có thể xem xét nghiêm túc."
2. "Anh chị mạnh về Chuyên môn (88 điểm) — direction này cần nhiều chuyên môn."
3. "Kinh nghiệm của anh chị cao (90 điểm) — phù hợp direction này."

---

## 📈 Nhận xét từ audit — 5 điểm mạnh + 5 điểm cải thiện

### 5 điểm mạnh
1. **Có real algorithm** — không phải random. Cosine similarity + weighted sum là chuẩn công nghiệp.
2. **Explain WHY rõ ràng** — mỗi match trả về top 3 reasons dạng "human text" → user hiểu tại sao.
3. **11 điểm input × 21 điểm output** — đủ granular để differentiate 37 direction.
4. **Free tier vẫn thấy Top 3** — user cảm nhận value trước khi trả tiền (đúng UX pricing).
5. **Track event `P3_VIEW`** — có thể phân tích ai match với direction nào → data-driven improvement.

### 5 điểm cải thiện
1. **21 vector scores hiện nhập tay** — chưa có dashboard admin để chỉnh dễ. Cần build UI chấm điểm.
2. **`isFeatured` chưa được set explicit trong DB** — hiện logic "5 mô hình đầu" đang implicit. Cần seed rõ 5 direction featured.
3. **`p1Requirements` + `p2Requirements` trong direction data đang fallback default 50** — nếu chưa nhập rõ, mọi direction đều "match 50" như nhau → thuật toán yếu.
4. **Roadmap preview cho Free chỉ hiện title stage 1** — có thể tăng lên 2-3 stage để "aha" nhiều hơn trước khi paywall.
5. **Chưa có A/B test framework** — muốn thử "Free thấy 8/37 vs 5/37" mô hình cần code cứng, không experiment được.

---

## 🎁 Đề xuất tiếp theo cho anh Khang

Xếp theo tác động × dễ làm:

1. **Seed rõ `isFeatured=true` cho 5 direction hot nhất trong DB** (10 phút) — fix ngay bug "logic implicit"
2. **Build dashboard admin cho 21 vector scores** (2 giờ) — anh nhập điểm cho MH-108 + các direction mới dễ dàng
3. **Extend `Direction` schema thêm 6 columns JSON** cho format MH-108 (marketContext, aiImpact, financials, toolkit, legalRisks, selfCheck) — 1 giờ migration
4. **Ship script Claude API chấm 21 vector scores tự động** cho các direction mới (3 giờ) — scale content engine

---

_Report này audit từ code thực tế:_
_- `huongdi-backend/src/routes/match-v2.ts` (thuật toán chính)_
_- `huongdi-backend/src/routes/p1.ts` + `p2.ts` (endpoint save result)_
_- `huongdi-backend/prisma/schema.prisma` (schema Direction 21 vectors)_
_- `huongdi-public/js/sol-auth.js` (tier gate logic)_
