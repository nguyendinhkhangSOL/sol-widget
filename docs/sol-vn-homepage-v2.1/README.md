# Sol.vn Homepage V2.1 — 3 Highlights Layout

**Approved direction:** Option A — 3 highlights (Bài viết + Sách + Hệ thống)

---

## 📦 Files

| File | Vai trò |
|---|---|
| `index-v2.1-body-only.html` | HTML refactored — paste vào WP Custom HTML block |
| `css-v2.1-additions.css` | CSS bổ sung — paste vào Customize → Additional CSS (sau V1) |
| `README.md` | Quick reference + deploy guide |

---

## 🎨 Layout V2.1

### Section structure (11 sections)

```
1.  HERO              — Sách + Blog CTAs
2.  TRUST BAR         — 37 / 20+ / 50+ / 4.8
3.  PAIN POINT        — 3 nỗi đau U45
4.  ⭐ 3 HIGHLIGHTS   — Bài viết · Sách FEATURED · Hệ thống
5.  SÁCH DEEP DIVE    — 5-part book structure
6.  HỆ THỐNG 3 BƯỚC   — P1 P2 P3
7.  WHY SOL           — 4 differentiators
8.  FOUNDER           — Khang bio
9.  NEWSLETTER        — Chương 1 miễn phí
10. FINAL CTA         — Đặt sách + 3 secondary
11. FOOTER            — 5 cột + bothuocla ở "Dự án liên quan"
```

### Section 4 — 3 Highlights chi tiết

```
┌──────────────────┐  ┌──────────────────────────┐  ┌──────────────────┐
│ Bước 1 · Miễn phí│  │  ⭐ Sản phẩm chính       │  │ Bước 3 · Áp dụng │
│                  │  │ Bước 2 · Sâu + Mở khoá   │  │                  │
│       📝         │  │           📘             │  │       🎯         │
│                  │  │                          │  │                  │
│   Bài viết       │  │   Tái Khởi Nghiệp        │  │   Hệ thống       │
│   Hướng Đi       │  │   Đúng Hướng             │  │   La Bàn         │
│                  │  │                          │  │                  │
│ Đọc tự do,       │  │ Sách + 1 năm Active      │  │ huongdi.sol.vn — │
│ không cần đăng ký│  │ hệ thống                 │  │ 3 bước cá nhân   │
│                  │  │                          │  │ hoá              │
│ ✓ 7 chuyên mục   │  │ ✓ Ebook PDF + ePub       │  │ ✓ P1 Discover™   │
│ ✓ 37 hướng       │  │ ✓ 1 năm Active huongdi   │  │ ✓ P2 Resources™  │
│ ✓ Case study     │  │ ✓ Updates miễn phí       │  │ ✓ P3 Navigator™  │
│ ✓ SEO updates    │  │ ✓ FB Group members       │  │ ✓ DirectionDB™   │
│                  │  │ ✓ 7 templates bonus      │  │ ✓ Roadmap (sắp)  │
│                  │  │                          │  │                  │
│ ┌──────────────┐ │  │ Giá trị 1.500.000đ       │  │ ┌──────────────┐ │
│ │100% MIỄN PHÍ │ │  │     249.000đ             │  │ │INCLUDED khi  │ │
│ └──────────────┘ │  │ ⚡ Early bird            │  │ │mua sách      │ │
│                  │  │ Hoàn tiền 30 ngày        │  │ └──────────────┘ │
│                  │  │                          │  │                  │
│  [Đọc bài →]    │  │  [ĐẶT SÁCH NGAY →]      │  │  [Thử demo →]   │
│                  │  │                          │  │                  │
│                  │  │  Đọc thử Chương 1 (gạch  │  │                  │
│                  │  │  dotted underline)       │  │                  │
└──────────────────┘  └──────────────────────────┘  └──────────────────┘
   Width 1fr            Width 1.6fr (50%+)            Width 1fr
   Green tint           Amber gradient + badge         Purple tint
   scale 1              scale 1.03 + shadow XL         scale 1
```

### Visual hierarchy
- **Card giữa (Sách)** lớn hơn ~ 30% so với side cards
- Card giữa có **badge "⭐ Sản phẩm chính"** float top
- Card giữa **scale(1.03)** — slightly raised
- Card giữa **border 2px amber** — thicker
- Card giữa **shadow-XL** — float effect

### Color coding 3 cards
- 📝 **Blog**: Green tint (free, low commitment)
- 📘 **Sách**: Amber gradient (warm, premium)
- 🎯 **Hệ thống**: Purple tint (technical, paid product)

---

## 🚀 Deploy V2.1

### Bước 1: Add CSS V2.1

WP Admin → **Appearance → Customize → Additional CSS**

→ Sau CSS V1 hiện tại, paste **toàn bộ** `css-v2.1-additions.css`.
→ Save & Publish.

**Tip:** Nếu anh đã deploy V2 trước đó, V2.1 CSS đã include V2 styles → có thể replace toàn bộ V2 CSS bằng V2.1.

### Bước 2: Tạo Page mới

WP Admin → **Pages → Add New**:
- Title: "Sol Homepage V2.1"
- Template: Full Width
- Paste **toàn bộ** `index-v2.1-body-only.html` vào Custom HTML block
- Publish

### Bước 3: Set làm Homepage

**Settings → Reading** → Static page → chọn "Sol Homepage V2.1".

### Bước 4: Test Incognito

**Ctrl + Shift + N** → vào https://sol.vn/

**Checklist:**
- ✓ Hero với Sách CTA + "Đọc miễn phí trên blog" secondary
- ✓ Section 4: 3 cards side-by-side
- ✓ Card giữa (Sách) lớn hơn, có badge "⭐ Sản phẩm chính"
- ✓ Card trái (Blog) green tint
- ✓ Card phải (Hệ thống) purple tint
- ✓ Mobile: 3 cards stack vertically với Sách card hiện ĐẦU TIÊN

---

## 📱 Mobile behavior

```
Desktop (>880px):           Mobile (<880px):

┌──────┬──────────┬──────┐  ┌──────────────────┐
│ Blog │  SÁCH ⭐  │System│  │   ⭐ SÁCH (1st)  │
└──────┴──────────┴──────┘  └──────────────────┘
                              ┌──────────────────┐
                              │     Blog (2nd)   │
                              └──────────────────┘
                              ┌──────────────────┐
                              │   Hệ thống (3rd) │
                              └──────────────────┘
```

→ Mobile: Sách card đầu tiên (CSS `order: -1`) — vẫn priority for conversion.

---

## 📊 Expected metrics V2.1 vs V2

| Metric | V2 expected | V2.1 expected | Δ |
|---|---|---|---|
| Hero "Đặt sách" CTR | 12-18% | 10-15% | -2pp (some traffic goes to blog) |
| **Section 4 sách CTA CTR** | N/A | **20-28%** | NEW |
| Section 4 blog CTA CTR | N/A | **15-25%** | NEW |
| Section 4 system CTA CTR | N/A | **5-10%** | NEW |
| Total CTA engagement | 25-35% | **45-60%** | +20pp |
| Newsletter signups | 3-5% | **4-7%** | +2pp |
| Bounce rate | 48% | **40-44%** | -4pp |
| **Total conversion (sách)** | 3-6% | **4-7%** | +1pp |

→ V2.1 win at **engagement breadth** (more users explore) → **higher LTV** dù conversion immediate có thể thấp hơn slightly.

---

## 🎯 Strategic logic

### Why V2.1 > V2 cho Sol Year 1

**1. 60% cold traffic Year 1**
- V2: cold visitor không có entry rõ → bounce
- V2.1: blog là entry free → engage → maybe convert later

**2. Long-tail conversion**
- V2: immediate sách or bounce
- V2.1: blog → newsletter → email nurture → eventual sách (3-5x LTV)

**3. SEO compound effect**
- 7 Pillars là moat lớn nhất của Sol
- V2 bury pillars ở Section 8
- V2.1 feature pillars ở Section 4 → tăng pageviews per session

**4. Multi-persona serving**
- Cold (60%): đi blog
- Warm (30%): đi sách
- Hot (10%): đi sách hero CTA
- Active (renewal): đi hệ thống huongdi

---

## ❓ Quyết định nhỏ trong V2.1

| # | Câu hỏi | Đã quyết định |
|---|---|---|
| 1 | Order cards trên desktop | Blog · Sách · Hệ thống (left → center → right) |
| 2 | Card size ratio | 1 : 1.6 : 1 (sách lớn hơn 30%) |
| 3 | Sách card badge | "⭐ Sản phẩm chính" |
| 4 | Step indicators | "Bước 1 · Khám phá miễn phí", "Bước 2 · Đọc sâu", "Bước 3 · Áp dụng" |
| 5 | Mobile order | Sách card hiện đầu tiên (`order: -1`) |
| 6 | Color coding | Green (blog) · Amber (sách) · Purple (system) |
| 7 | CTA buttons | Outline (blog/system) · Solid amber gradient (sách) |

---

## 🛡️ Rollback nếu cần

Nếu V2.1 underperform (30 ngày):

1. Settings → Reading → đổi homepage về V1 hoặc V2 cũ
2. Hoặc remove Section 4 (chỉ giữ V2 layout) — keep V2.1 CSS for compatibility

---

## 📋 Pre-launch checklist V2.1

### Content
- [ ] Verify 7 Pillar URLs trong card Blog
- [ ] Verify sách price 249k đúng
- [ ] Verify huongdi.sol.vn link works
- [ ] All 3 step indicators copy đúng tone

### Technical
- [ ] CSS V2.1 additions paste OK
- [ ] HTML V2.1 paste vào Custom HTML block
- [ ] Template Full Width selected
- [ ] Desktop test (1366px)
- [ ] Mobile test (320px, 414px)
- [ ] Tablet test (768px)

### SEO
- [ ] Schema.org WebApplication unchanged
- [ ] Title + meta description vẫn đúng
- [ ] GSC re-submit URL `/`

### Tracking
- [ ] GA4 events cho 3 cards CTA:
  - `home_highlight_blog_click`
  - `home_highlight_book_click` (most important)
  - `home_highlight_system_click`

---

## 🎁 Bonus — Card animation idea (Phase 2)

Nếu sau khi launch V2.1 muốn polish thêm:

```css
.sol-highlight {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s, transform 0.6s;
}

.sol-highlight.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.sol-highlight--blog.is-visible { transition-delay: 0ms; }
.sol-highlight--featured.is-visible { transition-delay: 100ms; }
.sol-highlight--system.is-visible { transition-delay: 200ms; }
```

Add JS (IntersectionObserver) để add `.is-visible` khi scroll vào view → cards fade-in stagger.

---

*V2.1 = Focus + Trust ladder. Sol Year 1 optimal layout.*
*Đi cùng nhau, đường dài đỡ mỏi.*
