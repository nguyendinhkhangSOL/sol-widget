# Sol.vn Homepage V2 — Focus Sách + Trí

**Pivot:** Bỏ messaging "3 trụ" khỏi homepage + header. Focus 100% revenue product.

---

## 📦 Files

| File | Vai trò |
|---|---|
| `01-PIVOT-DECISION.md` | Strategic rationale + before/after + risk analysis |
| `index-v2-body-only.html` | Refactored body content (paste vào WP Custom HTML block) |
| `css-additions.css` | Bổ sung CSS cho section "Hệ thống" mới |
| `README.md` | Quick reference (this file) |

---

## ⭐ Thay đổi chính so với V1

### Header
| V1 | V2 |
|---|---|
| Thân · Tâm · TRÍ pills + 📘 Sách + Bài viết + Khang Sol + Cộng đồng | 📘 Sách + Hệ thống + Bài viết + Khang Sol |

→ **Bỏ pills 3 trụ. Featured link "📘 Sách" với màu amber.**

### Hero
| V1 | V2 |
|---|---|
| "Sách + Hệ thống + Cộng đồng. Mọi thứ anh cần..." | "Sách + 1 năm Active hệ thống huongdi.sol.vn. Đủ framework, đủ công cụ..." |
| Badge "Hệ sinh thái 3 trụ" | Badge "Sách + Hệ thống" |

### Sections
| V1 | V2 |
|---|---|
| Section 4: 3 Trụ Thân-Tâm-Trí (3 cards) | **REMOVED** |
| Section 5: Sách Featured | **MOVED UP to Section 4** (immediate after pain) |
| (none) | **NEW Section 5: Hệ thống** — 3 bước Discover/Resources/Navigator |
| Section 8: 7 Topics | Same |

### Footer
| V1 | V2 |
|---|---|
| 5 cột (Brand, Hệ thống, Tài nguyên, Sol Ecosystem, Liên hệ) | 5 cột (Brand, **Sản phẩm**, Tài nguyên miễn phí, Về Sol, **Dự án liên quan**) |
| Highlight 3 trụ symmetric | bothuocla = "Dự án cộng đồng bỏ thuốc miễn phí" (de-emphasized) |

---

## 🚀 Deploy V2

### Bước 1: Backup V1 page hiện tại

WP Admin → Pages → tìm "Sol Homepage" (page anh đã tạo) → Save Draft / Trash
Hoặc tạo Page mới hoàn toàn → "Sol Homepage V2".

### Bước 2: Update CSS

WP Admin → Customize → Additional CSS → thêm content từ `css-additions.css` vào CUỐI CSS hiện tại.

→ Save & Publish.

### Bước 3: Paste HTML V2

Tạo Page mới hoặc edit page cũ:
- Title: "Sol Homepage V2"
- Custom HTML block → paste **toàn bộ** `index-v2-body-only.html`
- Template: Full Width (giống V1)
- Publish

### Bước 4: Set làm homepage

Settings → Reading → Static page → chọn "Sol Homepage V2".

### Bước 5: Test Incognito

Mở browser **Ctrl + Shift + N** → vào https://sol.vn/

**Cần thấy (khác với V1):**
- ✓ Header KHÔNG có pills "Thân · Tâm · TRÍ"
- ✓ "📘 Sách" làm link đầu tiên (màu amber)
- ✓ Hero text mention "Sách" + "Hệ thống huongdi" rõ ràng
- ✓ KHÔNG còn section "3 Trụ Thân-Tâm-Trí"
- ✓ Section 4 là Sách Featured (ngay sau pain point)
- ✓ Section 5 là "Hệ thống" với 3 bước Discover-Resources-Navigator
- ✓ Footer "Dự án liên quan" có bothuocla là tiêu đề riêng (de-emphasized)

---

## 📊 Expected impact

### Conversion (theo lý thuyết)

| Metric | V1 expected | V2 expected | Δ |
|---|---|---|---|
| Hero "Đặt sách" CTR | 8-12% | **12-18%** | +50% |
| Section "Sách" CTA CTR | 15-20% | **20-25%** | +25% |
| Bounce rate | 55% | **48%** | -7pp |
| Time to first CTA click | 45s | **30s** | -33% |
| Conversion to sách buy | 2-4% | **3-6%** | +50% |

### Brand clarity

| Question | V1 answer | V2 answer |
|---|---|---|
| "Sol là gì?" | "Ecosystem 3 trụ" (chung chung) | "Sách + Hệ thống tái khởi nghiệp" (clear) |
| "Tôi mua gì?" | "?" (3 options) | "Sách 249k = 1 năm Active" |
| "Bothuocla có liên quan?" | "Có, 1 trong 3 trụ" | "Có nhưng là dự án riêng miễn phí" |

---

## 🔄 What's preserved vs removed

### KEPT in homepage
- ✓ Sách "Tái Khởi Nghiệp Đúng Hướng" (Section 4 — star)
- ✓ Hệ thống huongdi.sol.vn (Section 5 — supporting)
- ✓ Founder Khang Sol story (Section 7)
- ✓ 7 Topics pillar grid (Section 8)
- ✓ Newsletter signup (Section 9)
- ✓ Footer link đến bothuocla + ngam (de-emphasized)

### REMOVED from homepage
- ❌ "3 trụ Thân-Tâm-Trí" messaging trong hero
- ❌ Section dedicated 3 Trụ cards
- ❌ Header pills "Thân · Tâm · TRÍ"
- ❌ Featured promote bothuocla/Tâm

### MOVED elsewhere
- 3 trụ vision/story → vẫn ở `/sol-la-gi/` (about page)
- bothuocla → footer link, in-app modal day-30 thay vì sol.vn promote
- Tâm articles → vẫn live ở `/ngam/`, link footer

---

## 🎯 Key narrative shift

### TRƯỚC (V1):
> "Sol là hệ sinh thái 3 trụ cho đàn ông Việt 40-65."

### SAU (V2):
> "Sol là sách + hệ thống giúp anh tái khởi nghiệp đúng hướng."

→ Surface narrative: focused.
→ Deep narrative (in About page): 3 trụ vision still there.
→ Future Year 2-3: có thể re-elevate Tâm/Thân khi đủ content.

---

## ⚠️ Rollback nếu cần

Nếu V2 chạy 30 ngày mà conversion KHÔNG cải thiện:

1. Settings → Reading → đổi homepage về "Sol Homepage V1" (cũ)
2. Trash V2 page
3. Customize → remove `css-additions.css` content
4. → Back to V1

→ **Risk-free decision.** Có thể test V1 vs V2 trong 1 tháng rồi quyết định.

---

## 📋 Pre-launch V2 checklist

### Content
- [ ] Khang approve copy V2 (đặc biệt hero new framing)
- [ ] Verify Sách price 249k đúng
- [ ] Verify Khang bio không có "3 trụ" trong hero (đã remove)
- [ ] Verify bothuocla mention là "Dự án cộng đồng miễn phí" (đúng tone)

### Technical
- [ ] CSS additions paste vào Customize
- [ ] HTML V2 paste vào Custom HTML block
- [ ] Template "Full Width" selected
- [ ] All CTAs link đến URL đúng
- [ ] Mobile responsive test
- [ ] Lighthouse audit (target 95+ Performance)

### SEO
- [ ] Update meta description (mention "Sách" + "Hệ thống" thay vì "3 trụ")
- [ ] GSC re-submit URL `/`
- [ ] Internal links từ /huong-di/, /khang-sol/ → trỏ về / (homepage)

### Tracking
- [ ] GA4 events updated cho V2 (đặc biệt Section 4 sách CTA click)
- [ ] Add UTM tracking cho bothuocla footer link

---

## 🤔 Câu hỏi anh cần quyết định

### Q1: Có muốn A/B test V1 vs V2 không?
**Recommend:** Skip A/B test, deploy V2 trực tiếp.
- Tốn 2-4 tuần để có statistical significance
- Sol traffic chưa đủ lớn để A/B test có ý nghĩa
- Khang's gut feeling + business strategy đã clear → deploy thẳng

### Q2: Header có cần "Sách" làm tab riêng không?
**Recommend:** YES — "Sách" là first nav link với màu amber.
- Visually distinct → user notice ngay
- Vẫn để user dễ navigate khi không phải lần đầu vào

### Q3: Section "Hệ thống huongdi" có nên có CTA "Demo" không?
**Recommend:** YES — link đến huongdi.sol.vn/ landing (Demo P1 sẽ Phase 2)
- Free entry point
- Build trust trước khi mua sách

### Q4: Bothuocla link trong footer có cần icon nổi bật?
**Recommend:** Subtle — 🌿 emoji + small text "Dự án cộng đồng miễn phí"
- KHÔNG đặt prominently
- KHÔNG section riêng

---

## 🎁 Bonus — Update meta description

### Title V1:
"Đi Cùng Sol — Hệ Sinh Thái Tái Khởi Nghiệp Cho Đàn Ông Việt 40-65"

### Title V2 (recommend):
"Đi Cùng Sol — Sách + Hệ Thống Tái Khởi Nghiệp Cho Đàn Ông Việt 40-65"

### Description V2:
"Sách 'Tái Khởi Nghiệp Đúng Hướng' + 1 năm Active hệ thống huongdi.sol.vn dành riêng cho đàn ông Việt 40-65. Founder Khang Sol — 20+ năm CNTT, 8 năm TMĐT. Mua 1 lần, dùng cả năm."

---

*Focus + Sách = Sol Year 1 success formula.*
*Đi cùng nhau, đường dài đỡ mỏi.*
