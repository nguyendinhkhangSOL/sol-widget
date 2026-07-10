# Sol Prompt Database — Architecture V1

**Version:** 1.0 · 2026-07-01
**Purpose:** Living library of curated prompts giúp:
1. Enrich 37 mô hình database liên tục (Editor layer)
2. Cung cấp AI tool cho members (Member layer)
3. Community contribute (Growth layer)

**Strategic value:** Compound moat — mỗi prompt add tăng giá trị cho toàn database.

---

## 🏗️ 3-Layer Architecture

### Layer 1 — EDITOR PROMPTS (Khang Sol only)

**Mục đích:** Bootstrap 37 mô hình database + maintain quality.

**Ai dùng:** Chỉ Khang Sol + editorial team.

**Ví dụ prompts:**

- `EDITOR-001` — Generate mô hình mới (mô tả, DNA fit, vốn ngầm, income projection)
- `EDITOR-002` — Enrich case study cho mô hình có sẵn
- `EDITOR-003` — Generate roadmap 90 ngày cho 1 mô hình
- `EDITOR-004` — Fact-check pricing + market data
- `EDITOR-005` — Draft 4 pitfalls + 4 success indicators

### Layer 2 — MEMBER PROMPTS (Active users)

**Mục đích:** Đưa AI tool cụ thể vào tay member đã trả tiền.

**Ai dùng:** Sol Active (499k+) users.

**Ví dụ prompts:**

- `MEMBER-001` — Design landing page cho niche của tôi
- `MEMBER-002` — Viết bài LinkedIn positioning chuyên môn
- `MEMBER-003` — Draft email lạnh cho khách hàng B2B
- `MEMBER-004` — Design 3 gói pricing cho service
- `MEMBER-005` — Tạo FAQ cho website
- `MEMBER-006` — Interview questions cho khách hàng
- `MEMBER-007` — Case study template từ khách hàng cũ
- `MEMBER-008` — Newsletter template chuyên ngành
- `MEMBER-009` — SOP cho onboarding client mới
- `MEMBER-010` — Weekly review template cho 90 ngày

### Layer 3 — COMMUNITY PROMPTS (Contribution)

**Mục đích:** Members contribute → grow database.

**Ai dùng:** Ai cũng contribute được, editors review.

**Workflow:**
1. Member submit prompt via form
2. Editorial review (Khang Sol / Sol Trợ Lực AI check quality)
3. Approve/edit/reject
4. Publish với credit attribution
5. Community vote up/down

---

## 📋 Prompt Schema

```yaml
# ═══ METADATA ═══
id: MEMBER-001
name: "Landing Page cho Consulting SME"
category: "marketing"
subcategory: "landing_page"
tier: "member"                    # editor | member | free
tags: ["landing-page", "B2B", "consulting", "SME"]
version: 1.2
language: "vi"
verified_by: khang_sol
last_updated: "2026-07-01"

# ═══ APPLICABILITY ═══
suitable_for_models:              # Liên kết với 37 mô hình
  - MH-001                        # Coaching CEO SME
  - MH-002                        # Fractional CFO
  - MH-011                        # Business Advisor

usable_with:                      # AI tools tương thích
  - "ChatGPT (GPT-4)"
  - "Claude (Sonnet)"
  - "Sol Đồng Hành"

# ═══ FORM DESIGN ═══
description: |
  Prompt này giúp bạn tạo nội dung landing page cho dịch vụ tư vấn/coaching B2B.
  Tối ưu cho ngách hẹp, target CEO SME Việt Nam 5-50 tỷ.

form_questions:
  - id: niche
    label: "Ngách chuyên môn của bạn"
    type: text
    required: true
    placeholder: "VD: Cố vấn tài chính cho F&B chuỗi 5-15 chi nhánh"
    hint: "Càng cụ thể càng dễ bán"
  
  - id: target_role
    label: "Ai là quyết định mua?"
    type: select
    options: ["CEO", "CFO", "COO", "Founder", "GĐ Marketing", "GĐ Nhân sự", "Khác"]
    required: true
  
  - id: pain_point
    label: "Pain point chính của khách"
    type: textarea
    required: true
    placeholder: "3-5 dòng mô tả vấn đề khách đang stuck"
  
  - id: outcome
    label: "Outcome bạn cam kết"
    type: text
    required: true
    placeholder: "VD: Giảm 20% chi phí F&B trong 3 tháng"
  
  - id: proof
    label: "Chứng cứ (case study, số liệu, credentials)"
    type: textarea
    required: false
    placeholder: "Optional — nhưng nên có ít nhất 1 case"
  
  - id: pricing_model
    label: "Model pricing"
    type: select
    options: ["Retainer tháng", "Project-based", "Success fee", "Chưa quyết"]
    required: true
  
  - id: pricing_range
    label: "Range giá"
    type: text
    required: false
    placeholder: "VD: 12-20tr/tháng"
  
  - id: tone
    label: "Tone văn"
    type: select
    options: ["Chuyên nghiệp trang trọng", "Thân thiện cân bằng", "Bold/Contrarian"]
    default: "Chuyên nghiệp trang trọng"

# ═══ PROMPT TEMPLATE ═══
prompt_template: |
  Bạn là copywriter senior chuyên viết landing page B2B cho consulting/coaching services tại Việt Nam.
  
  Viết nội dung landing page hoàn chỉnh cho dịch vụ sau:
  
  ═══════════════════════════════════════════
  DỊCH VỤ
  ═══════════════════════════════════════════
  Ngách chuyên môn: {{niche}}
  Target khách hàng: {{target_role}}
  
  Pain point khách:
  {{pain_point}}
  
  Outcome cam kết: {{outcome}}
  
  Chứng cứ có sẵn:
  {{proof}}
  
  Pricing model: {{pricing_model}}
  Range giá: {{pricing_range}}
  
  ═══════════════════════════════════════════
  YÊU CẦU
  ═══════════════════════════════════════════
  
  Viết landing page 800-1200 từ với cấu trúc:
  
  1. HERO (100 từ)
     - Headline: pain point + outcome
     - Sub-headline: WHO + WHAT + HOW
     - CTA button text
  
  2. VẤN ĐỀ (150 từ)
     - 3 khủng hoảng {{target_role}} đang gặp
     - Không hype, mô tả thực tế
  
  3. GIẢI PHÁP (150 từ)
     - 3-4 điểm khác biệt của bạn
     - Kết nối với outcome
  
  4. QUY TRÌNH (200 từ)
     - 3-4 bước cụ thể khách sẽ trải qua
     - Timeline realistic
  
  5. CASE STUDY (150 từ)
     - Dùng chứng cứ có sẵn
     - Format: bối cảnh → hành động → kết quả
  
  6. PRICING (100 từ)
     - Present pricing model minh bạch
     - 1-2 tier lựa chọn
  
  7. FAQ (200 từ)
     - 5 câu hỏi thường gặp
     - Address objections
  
  8. CTA CUỐI (50 từ)
     - Repeat outcome
     - Urgency nhẹ (không hype)
  
  ═══════════════════════════════════════════
  TONE
  ═══════════════════════════════════════════
  {{tone}}
  
  ═══════════════════════════════════════════
  QUY TẮC
  ═══════════════════════════════════════════
  - Tiếng Việt tự nhiên, không dịch máy
  - Không dùng "10x", "growth hack", "disruption"
  - Số liệu cụ thể (VNĐ, không USD)
  - Target Việt Nam SME market
  - Không hứa hẹn quá (compliance)
  
  Output: Markdown với heading structure rõ ràng.

# ═══ QUALITY CONTROL ═══
quality_checklist:
  - "Có specific numbers/data không?"
  - "Case study có thể verify không?"
  - "Tone phù hợp target không?"
  - "Compliance YMYL đúng chưa?"
  - "SEO keywords tự nhiên chưa?"

expected_output_length: "800-1200 từ"
review_needed: false              # Khang Sol đã verify template này

# ═══ ATTRIBUTION ═══
created_by: "Khang Sol"
credit_line: "Prompt template từ Sol La Bàn Prompt Database"
```

---

## 🎨 Form UX Mockup (Text description)

```
┌────────────────────────────────────────────────────┐
│  🧭 Sol La Bàn — Prompt Builder                    │
│  ─────────────────────────────────────────         │
│                                                    │
│  ← Back    LANDING PAGE FOR CONSULTING SME        │
│                                                    │
│  Prompt này giúp bạn tạo landing page cho          │
│  dịch vụ tư vấn/coaching B2B ngách Việt Nam.       │
│                                                    │
│  📖 Suitable for: MH-001, MH-002, MH-011           │
│  ⏱ ~10 phút fill · ChatGPT/Claude compatible       │
│  ─────────────────────────────────────────         │
│                                                    │
│  📝 Fill 6 câu để generate prompt:                 │
│                                                    │
│  1. Ngách chuyên môn của bạn                       │
│  ┌────────────────────────────────────────────┐    │
│  │ Cố vấn tài chính cho F&B chuỗi 5-15 CN    │    │
│  └────────────────────────────────────────────┘    │
│    Càng cụ thể càng dễ bán                         │
│                                                    │
│  2. Ai là quyết định mua?                          │
│  [ CEO ] [ CFO ] [ COO ] [ Founder ] [ Khác ]      │
│                                                    │
│  3. Pain point chính của khách                     │
│  ┌────────────────────────────────────────────┐    │
│  │ CEO F&B chuỗi stuck ở scale operations,    │    │
│  │ không biết margin từng chi nhánh...        │    │
│  │                                            │    │
│  └────────────────────────────────────────────┘    │
│                                                    │
│  4. Outcome bạn cam kết                            │
│  ┌────────────────────────────────────────────┐    │
│  │ Giảm 20% chi phí vận hành trong 90 ngày   │    │
│  └────────────────────────────────────────────┘    │
│                                                    │
│  5. Chứng cứ có sẵn (optional)                     │
│  ┌────────────────────────────────────────────┐    │
│  │                                            │    │
│  └────────────────────────────────────────────┘    │
│                                                    │
│  6. Pricing model                                  │
│  ● Retainer tháng                                  │
│  ○ Project-based                                   │
│  ○ Success fee                                     │
│                                                    │
│  ─────────────────────────────────────────         │
│                                                    │
│  [ 🎯 Generate Prompt ]  [ 💾 Save Draft ]         │
│                                                    │
└────────────────────────────────────────────────────┘
```

Sau khi click "Generate Prompt":

```
┌────────────────────────────────────────────────────┐
│  ✅ Prompt sẵn sàng!                               │
│  ─────────────────────────────────────────         │
│                                                    │
│  📋 Copy vào ChatGPT/Claude:                       │
│                                                    │
│  ┌────────────────────────────────────────────┐    │
│  │ Bạn là copywriter senior chuyên viết       │    │
│  │ landing page B2B cho consulting/coaching   │    │
│  │ tại Việt Nam.                              │    │
│  │                                            │    │
│  │ Viết nội dung landing page hoàn chỉnh...   │    │
│  │                                            │    │
│  │ [full prompt filled]                       │    │
│  └────────────────────────────────────────────┘    │
│                                                    │
│  [ 📋 Copy to Clipboard ]                          │
│  [ 💾 Save vào Sổ Hành Trình ]                     │
│  [ 🚀 Open ChatGPT với prompt ]                    │
│                                                    │
│  ─────────────────────────────────────────         │
│                                                    │
│  📚 Prompts liên quan:                             │
│  → SEO cho landing page                            │
│  → Email follow-up sau khi lead fill form          │
│  → A/B test headline variations                    │
│                                                    │
│  ─────────────────────────────────────────         │
│                                                    │
│  💬 Feedback:                                      │
│  Prompt này giúp bạn?                              │
│  [👍 Helpful ]  [🙋 Suggest improve ]              │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## 🚀 MVP Roadmap (3 phases)

### Phase 1 — MVP (2 tuần)
- ✅ Schema definition (this doc)
- ✅ 10 starter prompts cho MEMBER layer (top 10 use cases)
- ⏭️ Static HTML form (client-side only)
- ⏭️ Deploy tại `huongdi.sol.vn/prompts/`
- ⏭️ Save to LocalStorage (Sổ Hành Trình basic)

### Phase 2 — Contribution (1 tháng sau)
- User submit new prompts via form
- Editorial review workflow (Khang Sol approve)
- Vote up/down
- Attribution + community credit

### Phase 3 — AI-Enhanced (2-3 tháng sau)
- Sol Trợ Lực AI recommend prompts theo user context
- Auto-fill fields from Sổ Hành Trình data (DNA + Vốn ngầm)
- Track prompt performance (which generate best results)
- ML-based prompt improvement

---

## 💰 Business impact

**Cho Sol:**
- Active 499k value tăng gấp 3x (từ Database → +Prompt tool)
- Retention tăng (user quay lại dùng prompts hằng ngày)
- Word-of-mouth (user share prompts hay)
- Editor cost giảm (community contribute)

**Cho user:**
- ROI ngay lập tức (dùng prompt → tạo landing page/email/proposal ngay)
- Save 2-5 giờ/lần dùng
- Chất lượng cao hơn tự viết prompt

**Compound value:**
- 500 Active × 1 prompt/tuần × 52 tuần = 26,000 prompt executions/năm
- Nếu 5% contribute back → 1,300 new prompts/năm
- Database gấp 100 lần sau 2 năm

---

## 📦 Starter Prompts để deliver (10 prompts)

### Tier 1 — MEMBER-001 đến MEMBER-010

1. **MEMBER-001** — Landing page cho Consulting SME ⭐
2. **MEMBER-002** — LinkedIn positioning post ⭐
3. **MEMBER-003** — Cold email B2B (senior expertise)
4. **MEMBER-004** — Pricing tiers cho service business
5. **MEMBER-005** — FAQ website builder
6. **MEMBER-006** — Interview questions cho khách hàng (research niche)
7. **MEMBER-007** — Case study từ khách hàng cũ (extract format)
8. **MEMBER-008** — Newsletter chuyên ngành (Substack template)
9. **MEMBER-009** — SOP onboarding client mới
10. **MEMBER-010** — Weekly review template (Sổ Hành Trình)

### Tier 2 — EDITOR-001 đến EDITOR-005

11. **EDITOR-001** — Generate mô hình mới cho database
12. **EDITOR-002** — Enrich case study cho mô hình có sẵn
13. **EDITOR-003** — Generate roadmap 90 ngày cho mô hình
14. **EDITOR-004** — Fact-check pricing + market data
15. **EDITOR-005** — Draft 4 pitfalls + 4 success indicators

---

## 🎯 Deliverable ngay

Nếu anh confirm approach, mình sẽ build:

1. ✅ **Architecture doc** (file này) — done
2. ⏭️ **10 starter prompts** (Tier 1 Member) — file YAML với template đầy đủ
3. ⏭️ **Static HTML form** (`prompts-builder.html`) — MVP form với 5 prompts đầu
4. ⏭️ **Deploy guide** — Upload cho huongdi.sol.vn/prompts/

**Estimate:** 3-5 giờ mình viết. Anh review + deploy 30 phút.

---

*Đúng hướng. Đúng bước. Đúng tương lai.*
