# Unified Schema Sol V2 — Hybrid Đối tác + Sol
## Kiến trúc DB hoàn chỉnh + Mapping SAM Test + UI Free/Active

**Ngày biên soạn:** 08/07/2026
**Nguồn tham chiếu:**
- `SCHEMA-CSDL-solvn-v1.md` (đối tác, 325 dòng, 17.7KB)
- `huongdi-backend/prisma/schema.prisma` (Sol hiện tại)
- 8 mô hình MH-101 → MH-108 (đối tác biên tập)
- Whitepaper SAM V1.0 (Sol Assessment Method)

---

## TÓM TẮT ĐIỀU HÀNH

**Kết luận sau khi đọc kỹ schema đối tác:**

Schema đối tác **vượt trội Sol hiện tại về data architecture** ở 6 điểm:
1. **Immutable versioning** — content không bao giờ bị ghi đè, user hành trình cũ luôn an toàn
2. **Tách catalog / content / sections** — 3 tầng clean, gate được từng section
3. **Visibility per section (public/locked)** — chuẩn cho Free/Active tier
4. **Quiz scoring qua DB** — tuning trọng số không cần deploy code
5. **Journey system chuyên nghiệp** — event-sourced, audit trail đầy đủ
6. **Full-text search tiếng Việt** — unaccent + trigram

Sol hiện tại **vượt trội đối tác về 1 điểm quan trọng**:
- **21 vector scores + cosine matching algorithm** — Sol đã có, đối tác chưa có (đối tác dùng rule-based scoring qua option_scores khác cách tiếp cận)

**Đề xuất chiến lược:** **"Đối tác wins về data model — Sol wins về algorithm"**. Adopt schema đối tác làm base, giữ nguyên 21 vector scores + thuật toán cosine của Sol → hybrid tối ưu.

---

## 1. So sánh 2 schema chi tiết

### 1.1. Điểm mạnh schema đối tác

| Tính năng | Đối tác | Sol hiện tại |
|-----------|:-------:|:------------:|
| **Immutable versioning** (content mới không phá hành trình cũ) | ✅ Có `model_versions` | ❌ Update in-place |
| **Section-level gating** (Free thấy section 1,2,7,10; Active thấy full 11) | ✅ Có `model_sections.visibility` | ❌ Cả direction lock/mở |
| **Full-text search VN** (unaccent + trigram, tìm "ke toan" ra "kế toán") | ✅ Có `search_vec` + pg_trgm | ❌ Không có |
| **Categories tách bảng** (linh hoạt, không enum cứng) | ✅ Có `categories + tags` | ⚠️ Chỉ enum 7 loại |
| **Quiz trong DB** (tuning trọng số không cần deploy) | ✅ Có `quiz_options + option_scores` | ❌ Hardcode frontend |
| **Journey system professional** (phases + actions + expenses + gates + events) | ✅ 7 bảng riêng | ⚠️ Chỉ có `JourneyDay` đơn giản |
| **Template update propagation** (user nhận notice khi có version mới) | ✅ Có `template_update_notices` | ❌ Không có |
| **RLS security** (Postgres row-level policy) | ✅ Explicit RLS | ⚠️ App-level check |
| **Cột denormalize số** (capital_min/max, ttr, risk_score, ai_impact) | ✅ Có sẵn | ⚠️ Chỉ có vector 0-100 |

### 1.2. Điểm mạnh Sol hiện tại

| Tính năng | Sol | Đối tác |
|-----------|:---:|:-------:|
| **21 vector scores** (P/R/B/S — chân dung mô hình 4 chiều) | ✅ | ❌ |
| **Cosine similarity matching** (thuật toán chuẩn ML) | ✅ | ❌ |
| **Explainable AI reasons** (giải thích "vì sao match") | ✅ | ❌ |
| **Prisma ORM type-safe** | ✅ | ❌ (raw SQL) |
| **Đã production** (37 direction shell + user thực) | ✅ | ❌ (draft) |
| **Whitepaper SAM khoa học** (validation roadmap) | ✅ | ⚠️ (không có) |

---

## 2. Unified Schema V2 — Hybrid đề xuất

### Chiến lược tổng: **"Đối tác base + Sol scores layer"**

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 1 — CATALOG (từ đối tác)                                  │
│  models (num, mh_id, slug, status, is_free_sample, sort,         │
│          current_version_id, category_code)                       │
│  + categories + tags + model_tags                                 │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 2 — CONTENT (từ đối tác — immutable versioning)           │
│  model_versions (id, model_num, version, status, yaml, body_md,  │
│                  capital_min/max, income_min/max, ttr_min/max,   │
│                  risk_score, ai_impact_score, search_vec)         │
│  + model_sections (visibility public/locked, section_no 1-10)     │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 3 — SCORING (từ Sol — 21 vectors)                         │
│  model_scores (model_num FK, vp_*, vr_*, vb_*, vs_*, scored_at)  │
│  → NEW bảng riêng, không nằm trong model_versions                │
│  → Version-aware: có thể re-score khi content update             │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 4 — QUIZ (từ đối tác — DB-driven)                         │
│  quiz_questions + quiz_options + option_scores + quiz_responses  │
│  Sol SAM 21 câu chuyển sang schema này → tune không cần deploy   │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 5 — USER JOURNEY (từ đối tác — event-sourced)             │
│  journeys + journey_phases + journey_actions + journey_expenses  │
│  + journey_gates + notebooks + journey_events (append-only)      │
│  + template_update_notices                                        │
└─────────────────────────────────────────────────────────────────┘
```

### 2.1. Bảng model_scores mới (Sol contribution)

```sql
-- Kết hợp Sol vectors vào schema đối tác
create table model_scores (
  model_num       text primary key references models(num) on delete cascade,
  version_id      uuid references model_versions(id),   -- score gắn với version nào

  -- Vector P — Personality match (4 điểm)
  vp_people       smallint check (vp_people between 0 and 100),
  vp_expert       smallint check (vp_expert between 0 and 100),
  vp_builder      smallint check (vp_builder between 0 and 100),
  vp_independent  smallint check (vp_independent between 0 and 100),

  -- Vector R — Resource match (6 điểm)
  vr_capital      smallint check (vr_capital between 0 and 100),
  vr_time         smallint check (vr_time between 0 and 100),
  vr_tech         smallint check (vr_tech between 0 and 100),
  vr_network      smallint check (vr_network between 0 and 100),
  vr_risk         smallint check (vr_risk between 0 and 100),
  vr_energy       smallint check (vr_energy between 0 and 100),

  -- Vector B — Business characteristics (4 điểm)
  vb_income_speed  smallint,
  vb_income_pot    smallint,
  vb_scalability   smallint,
  vb_ai_leverage   smallint,

  -- Vector S — Sol linkage (4 điểm)
  vs_exp_leverage  smallint,
  vs_rel_leverage  smallint,
  vs_learning_diff smallint,
  vs_health_req    smallint,

  scored_by       text,                  -- 'sol-team' | 'ai-claude' | 'partner'
  scored_at       timestamptz default now(),
  notes           text                   -- ghi chú lý do chấm điểm
);

create index idx_scores_version on model_scores(version_id);
```

**Ưu điểm bảng riêng:**
- Score không nằm trong `model_versions` immutable → có thể tune lại scoring mà không tạo version mới
- Track lịch sử ai chấm điểm (`scored_by`)
- Có thể re-score bulk khi thay thuật toán

### 2.2. Section visibility mapping — Free vs Active

Đối tác đã set sẵn trong Section 7 file schema:
> `visibility: mục 1,2,3,3B,7,10='public'; 4,5,6,8,9='locked'`

**Match với Progressive Depth 3 tầng em đề xuất:**

| Section | Nội dung | Visibility đối tác | Progressive Depth |
|:-------:|----------|:-----------------:|:-----------------:|
| 1 | Mô hình này là gì | public | Tầng 1 (Free) |
| 2 | Vì sao hợp 40-60 | public | Tầng 1 (Free) |
| 3 | Thị trường VN 2024-2026 | public | Tầng 2 (Rich preview) |
| 3B | AI impact 2026-2030 | public | Tầng 2 (Rich preview) |
| **4** | **Con số thực tế (VND)** | **locked** | **Tầng 3 (Active)** |
| **5** | **Bộ công cụ chi phí thấp** | **locked** | **Tầng 3 (Active)** |
| **6** | **Pháp lý VN 2024-2026** | **locked** | **Tầng 3 (Active)** |
| 7 | Bẫy phổ biến | public | Tầng 2 (Rich preview) |
| **8** | **Case study thực tế** | **locked** | **Tầng 3 (Active)** |
| **9** | **Lộ trình 90 ngày** | **locked** | **Tầng 3 (Active)** |
| 10 | Checklist "có nên làm không" | public | Tầng 2 (Rich preview) |

**Kết quả cho user:**
- **Free tier** thấy **6/11 sections** (1, 2, 3, 3B, 7, 10) → đủ để "aha moment" + nhận diện value
- **Active tier** thấy **11/11 sections** — full roadmap 90 ngày + con số + tools + pháp lý + case study

Đây là **chuyên nghiệp hơn** Sol hiện tại nhiều (Sol hiện đang gate cả direction).

---

## 3. Mapping SAM Test (11 điểm) → DB

### 3.1. Flow tổng quan

```
User làm 21 câu SAM test:
  Bước 1 (14 câu) → 4 điểm P (0-100)
  Bước 2 (7 câu) → 7 điểm R (0-100) + Income Goal
                    ↓
POST /api/directions/match-v2
                    ↓
Backend đọc từ 3 nguồn:
  (a) model_scores — 21 vector cho MỖI mô hình
  (b) model_versions — cột denormalize số (capital_min/max, ttr, risk)
  (c) models — trạng thái published + is_free_sample
                    ↓
Tính matchScore = 40% × P_cosine + 45% × R_diff + 15% × Income_align
                    ↓
Filter hard constraint:
  - user.capital < model.capital_min → excluded (không đủ vốn)
  - user.time < model.ttr_min_months × 4 giờ/tuần → warning
                    ↓
Sort giảm dần → Top 3
                    ↓
Trả về client:
  {
    matches: [
      { id, slug, mh_id, title, category, matchScore, reasons,
        sections: {
          '1': { visibility: 'public', content_md: '...' },
          '2': { visibility: 'public', content_md: '...' },
          '3': { visibility: 'public', content_md: '...' },
          '3B': { visibility: 'public', content_md: '...' },
          '4': { visibility: 'locked', preview: 'Upgrade Active để xem' },
          ...
        }
      }
    ]
  }
```

### 3.2. Alternative — Dùng luôn quiz system đối tác

Đối tác có sẵn `quiz_options → option_scores → model_num` — **rule-based scoring**. Có thể chạy song song:

- **Path A (Sol algorithm):** Cosine similarity với 21 vectors — good cho matching general
- **Path B (Đối tác algorithm):** Direct rule-based scoring cho từng câu quiz — good cho hard constraint (vốn, thời gian)

**Đề xuất:** Chạy cả 2, dùng **ensemble score**:
```
finalScore = 0.6 × cosine_score + 0.4 × rule_score
```

Trong 3-6 tháng đầu, A/B test xem path nào cho recommendation tốt hơn (đo qua UserOutcome — user match direction có đạt "first client trong 90 ngày" hay không).

### 3.3. Chấm 21 vectors cho 8 mô hình đối tác (em đã chấm sẵn)

Xem bảng scores 8 mô hình trong file `PARTNER-DB-INTEGRATION-2026-07-08.md` Section 4.3.

---

## 4. UI Free vs Active — Design mockup

### 4.1. Trang detail direction `/la-ban-huong-di/[slug]/`

**Layout chung:**

```
┌────────────────────────────────────────────────────────┐
│  [BREADCRUMB] La bàn > Chấp bút SME                    │
│                                                          │
│  🎯 Match với anh chị: 89% [gauge visual]               │
│                                                          │
│  📝 Chấp bút & xây thương hiệu cá nhân cho chủ SME     │
│  Category: Dịch vụ nội dung B2B                         │
│  Vốn: 5-20 triệu · Thu nhập 8-35 triệu · TTR 30-60 ngày│
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ SECTION 1 · Mô hình này là gì [PUBLIC]         │    │
│  │ [Full content]                                  │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ SECTION 2 · Vì sao hợp 40-60 [PUBLIC]          │    │
│  │ [Full content]                                  │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ SECTION 3 · Thị trường VN 2024-2026 [PUBLIC]   │    │
│  │ [Full content]                                  │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ SECTION 3B · AI impact 2026-2030 [PUBLIC]      │    │
│  │ [Full content]                                  │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ 🔒 SECTION 4 · Con số thực tế VND [ACTIVE]     │    │
│  │ Preview 3 dòng đầu + [Nâng cấp Active để xem]  │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ 🔒 SECTION 5 · Bộ công cụ [ACTIVE]             │    │
│  │ [Locked overlay + CTA]                          │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ 🔒 SECTION 6 · Pháp lý VN [ACTIVE]             │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ SECTION 7 · Bẫy phổ biến [PUBLIC]              │    │
│  │ [Full content — 3 traps]                        │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ 🔒 SECTION 8 · Case study thực tế [ACTIVE]     │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ 🔒 SECTION 9 · Lộ trình 90 ngày [ACTIVE]       │    │
│  │ [Preview 2 stage đầu + CTA]                     │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ SECTION 10 · Checklist "có nên làm" [PUBLIC]   │    │
│  │ [Full 6 câu checklist tick được]               │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ═════════════════════════════════════════════════════  │
│  [FREE tier CTA]                                        │
│  ✨ Muốn xem hết roadmap 90 ngày + con số VND + pháp lý│
│     → Nâng cấp Active 499k/năm                         │
│                                                          │
│  [ACTIVE tier action]                                   │
│  🚀 Bắt đầu hành trình 90 ngày với mô hình này         │
│  → Nút "Nhân bản roadmap này về Sổ Hành Trình của tôi" │
│                                                          │
└────────────────────────────────────────────────────────┘
```

### 4.2. Chi tiết render cho Free tier

**Section locked có 3 kiểu render:**

**Kiểu A — Full curtain (section 5, 6, 8):**
```html
<div class="section-locked">
  <div class="locked-header">
    🔒 SECTION 5 · Bộ công cụ chi phí thấp
  </div>
  <div class="locked-blur">
    <!-- Blur toàn bộ content, chỉ thấy shape -->
  </div>
  <div class="locked-cta">
    <p>Nâng cấp Active để mở khoá đầy đủ danh sách công cụ + link mua + review anh chị 40-60 đã dùng</p>
    <a href="/pricing/">Nâng cấp Active 499k/năm →</a>
  </div>
</div>
```

**Kiểu B — Preview 3 dòng đầu (section 4):**
```html
<div class="section-preview">
  <div class="preview-header">🔒 SECTION 4 · Con số thực tế VND</div>
  <div class="preview-content">
    <p>Chi phí khởi động: 5.000.000 - 20.000.000 VND</p>
    <p>Thu nhập kỳ vọng: 8-35 triệu/tháng (sau 6-12 tháng)</p>
    <p><em>... còn 2 bảng chi tiết + biểu đồ lộ trình ẩn</em></p>
  </div>
  <a href="/pricing/">Xem đầy đủ →</a>
</div>
```

**Kiểu C — Preview 2 stage đầu (section 9 — roadmap):**
```html
<div class="section-preview">
  <div class="preview-header">🔒 SECTION 9 · Lộ trình 90 ngày</div>
  <div class="stages-preview">
    <div class="stage">
      <b>Ngày 1-30</b> — Portfolio "bắt giọng" + Danh sách 25 khách
      [3 task đầu hiển thị]
    </div>
    <div class="stage">
      <b>Ngày 31-60</b> — 2 khách gói tháng đầu
      [Blur 5 task còn lại]
    </div>
    <div class="stage stage--locked">
      <b>Ngày 61-90</b> 🔒 [Toàn bộ locked]
    </div>
  </div>
  <a href="/pricing/">Xem full 90 ngày →</a>
</div>
```

### 4.3. Chi tiết render cho Active tier

- Tất cả 11 sections **full content**
- Section 9 (Roadmap) có **nút "Nhân bản về Sổ Hành Trình"** → gọi API `POST /api/journeys` → copy `model_versions.body_md` mục 9 → sinh `journey_phases + journey_actions` → user có bản riêng để tick

### 4.4. Trang hub `/la-ban-huong-di/`

Đối tác cũng đã có prototype (file HTML anh gửi). Có sẵn:
- Quiz phễu → nhập điều kiện → lọc mô hình
- Bảng match % với gauge visual
- 8 mô hình hiển thị dạng card

Sol có sẵn Bước 1 + Bước 2 → user vào `/la-ban-huong-di/` sẽ có 2 mode:
- **Mode A:** Chưa làm test → hiện quiz phễu (đối tác style)
- **Mode B:** Đã làm P1 + P2 → hiện Top 3 personalized (Sol style)

---

## 5. Migration Path — 4 tuần

### Tuần 1 — **Schema migration + import 8 mô hình**

**Task 1.1:** Ship Prisma migration adopt schema đối tác
- Tạo 5 bảng mới: `models`, `model_versions`, `model_sections`, `categories`, `tags`, `model_tags`
- Migrate 37 direction Sol hiện tại → `models` + `model_versions` (giữ nguyên data, tạo version '2026-07')
- Set `is_free_sample` cho 5 direction Sol featured

**Task 1.2:** Ship `model_scores` bảng riêng
- Migrate 21 vector scores hiện tại (trong `directions` table) → `model_scores`
- Prisma schema có 2 relation: `Direction ← 1:1 → ModelScore`

**Task 1.3:** Ship script import 8 mô hình đối tác
- Parse `partner-models.json` → insert vào `models` + `model_versions`
- Copy body → `model_sections` (parse `## N.` để tách section)
- Set visibility đúng theo Section 7 file schema đối tác (public 1,2,3,3B,7,10)
- Insert `model_scores` với 21 vector em đã chấm sẵn

### Tuần 2 — **Quiz system + Matching engine v3**

**Task 2.1:** Migrate SAM test 21 câu vào bảng `quiz_questions + quiz_options`
- Tune trọng số qua admin panel thay vì hardcode

**Task 2.2:** Refactor `match-v2` → `match-v3`
- Đọc scores từ `model_scores`
- Đọc constraint từ `model_versions.capital_min/max`
- Return `sections` array kèm `visibility` để frontend render đúng gating

**Task 2.3:** Ship API `GET /api/directions/[slug]/sections` với entitlement check
- Server-side check user tier
- Chỉ trả `content_md` cho section `visibility='public'` hoặc user tier Active/Founder

### Tuần 3 — **UI redesign trang detail direction**

**Task 3.1:** Ship template `/la-ban-huong-di/[slug]/index.html` mới với 11 sections layout
- Free tier: 6 public + 5 locked (3 kiểu render A/B/C)
- Active tier: 11 full

**Task 3.2:** Ship section 9 → nút "Nhân bản về Sổ Hành Trình"
- API `POST /api/journeys/from-template`
- Copy `model_versions.body_md` mục 9 → `journey_phases + journey_actions`

**Task 3.3:** Update trang hub `/la-ban-huong-di/` 
- Hiển thị 8 mô hình đối tác (+ 29 direction Sol còn lại) đồng nhất UI

### Tuần 4 — **Journey system + Template update propagation**

**Task 4.1:** Ship `journey_events` append-only + audit trail

**Task 4.2:** Ship `template_update_notices`
- Khi publish version mới → job tạo notice cho user cũ
- User bấm xem → diff → tự quyết apply/dismiss

**Task 4.3:** Full-text search VN
- Bật extension `unaccent + pg_trgm`
- Ship endpoint `GET /api/directions/search?q=ke+toan+ho+kinh+doanh` → tìm được MH-104

---

## 6. Rủi ro và Mitigation

### Rủi ro 1 — Migration lớn phá vỡ production

**Mitigation:**
- Backup DB full trước migration (đã có `pg_dump` script)
- Migrate trên VPS staging trước (cần request VPS thứ 2 tạm thời)
- Rollback script sẵn (Prisma migrate has down migration)

### Rủi ro 2 — Sol đã có 37 direction, đối tác 8 → conflict slug

**Mitigation:**
- 3 slug trùng thẳng (MH-102/104/106) → UPDATE existing, giữ ID Sol
- Data cũ (SavedDirection, UserOutcome) không bị xoá vì FK không đổi

### Rủi ro 3 — User đang có journey với direction cũ khi migrate

**Mitigation:**
- `template_update_notices` handle case này — user hiện tại nhận notice, có thể tiếp tục dùng version cũ

### Rủi ro 4 — Rào cản technical khi implement quiz DB-driven

**Mitigation:**
- Có thể **skip Layer 4 (quiz system đối tác)** trong tuần 1-2, giữ SAM test hardcode Frontend
- Migrate quiz system về sau khi đã stable

---

## 7. So sánh 2 phương án triển khai

### Phương án A — **Big Bang Migration** (4 tuần đầy đủ)

Adopt toàn bộ schema đối tác trong 4 tuần. Refactor lớn nhưng có end-state chuẩn production.

**Ưu:** Kiến trúc chuẩn, không nợ kỹ thuật lâu dài.
**Nhược:** Rủi ro cao, khách hàng đang dùng có thể bị ảnh hưởng.

### Phương án B — **Progressive Migration** (2-3 tháng, phần lớn không phá)

- **Tháng 1:** Ship model_scores riêng (không phá gì), import 8 mô hình đối tác vào Direction schema cũ + chấm 21 vectors
- **Tháng 2:** Refactor Section-level gating trong frontend (visibility per section)
- **Tháng 3:** Full migration sang schema đối tác + journey system

**Ưu:** An toàn, giảm risk, có thời gian test từng bước.
**Nhược:** Duy trì 2 schema song song trong 2-3 tháng.

**Đề xuất em:** Phương án B — an toàn hơn cho production đang có user.

---

## 8. Câu hỏi kết cho anh Khang

Trước khi ship code, cần anh confirm 3 điểm:

**Câu 1 — Về schema hybrid:**
- Adopt full schema đối tác + chèn `model_scores` từ Sol (như em đề xuất) — OK không?
- Hoặc giữ Sol Direction làm base + chỉ thêm `model_sections` + `visibility` (nhẹ hơn)?

**Câu 2 — Về migration path:**
- Phương án **A Big Bang** (4 tuần, kiến trúc chuẩn) — hay
- Phương án **B Progressive** (2-3 tháng, an toàn hơn)?

**Câu 3 — Về ecosystem V2 lock:**
- 8 mô hình đối tác chạy trên `huongdi.sol.vn` (product) hay `sol.vn` (marketing)?
- Em nghiêng về `huongdi.sol.vn/la-ban-huong-di/[slug]/` — đúng vai trò product data

---

## 9. Kết luận

Schema đối tác **là món quà lớn** — không chỉ 8 mô hình rich content, mà cả một **kiến trúc DB professional** đã suy nghĩ đầy đủ về versioning, gating, journey, search.

**3 điểm quyết định thành công:**

1. **Adopt schema đối tác làm base** — đừng cưỡng đối tác vào schema Sol cũ (Sol schema thiết kế cho MVP, chưa production-scale)
2. **Giữ 21 vector scores + cosine algorithm của Sol** — đây là moat Sol đã đầu tư, không bỏ
3. **Section-level visibility** là **key insight quan trọng nhất** — giải quyết Progressive Depth 3 tầng đã đề xuất bằng cách rất chuyên nghiệp

**Em có thể ship ngay hôm nay:**
- **A** — Prisma migration adopt schema đối tác (skeleton, không data) — 1-2 giờ
- **B** — Script import 8 mô hình + chấm 21 vector em đã có — 2 giờ
- **C** — UI mockup HTML section-level gating (Free vs Active render) — 3 giờ

Anh trả lời 3 câu hỏi Section 8, em bắt đầu ship theo Phương án A hoặc B.
