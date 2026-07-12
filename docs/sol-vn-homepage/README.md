# Sol.vn Homepage — Draft Package

Bộ draft cho trang chủ chính của Đi Cùng Sol — alignment với business model V2 (Sách + Active = revenue).

---

## 📦 Files

| File | Vai trò |
|---|---|
| `01-STRATEGY.md` | Chiến lược + 11 sections rationale + tracking + Khang decisions |
| `02-WIREFRAME.md` | Text wireframe + content cụ thể cho từng section |
| `index.html` | Full production HTML (700+ lines) |
| `css/sol-homepage.css` | CSS design system (800+ lines) |
| `README.md` | Tóm tắt + deploy guide |

---

## 🎯 11 Sections

```
1.  HERO — H1 + 2 CTAs + trust signal
2.  TRUST BAR — 3/37/20+/50+
3.  PAIN POINT — 3 nỗi đau 45+
4.  3 TRỤ — Thân/Tâm/Trí cards (Trí featured)
5.  SÁCH FEATURED ⭐ — Book mock-up + 5 benefits + price + 2 CTAs
6.  WHY SOL — 4 differentiators
7.  FOUNDER KHANG — Photo + quote + creds
8.  TOPICS — 7 pillar cards + "Xem tất cả"
9.  NEWSLETTER MAGNET — Email form for Chương 1 free
10. FINAL CTA — Dark navy, repeat sách CTA + alt secondary
11. FOOTER — 5 columns + bottom legal
```

---

## 🎨 Design highlights

### Color palette
- **Primary:** Amber gradient (#fef3c7 → #d97706)
- **Dark accent:** Navy (#0f172a → #1e293b)
- **Pillar colors:** Thân = green tint, Tâm = purple tint, Trí = amber (featured)

### Typography
- **Headings:** Inter 800
- **Body:** Inter 400/500
- **Quotes:** Lora italic 500
- **Vietnamese diacritics:** Both fonts đầy đủ support

### Layout patterns
- 1200px max container
- Sticky header với backdrop blur
- Hero: radial gradient + grid overlay
- Cards: 18-24px rounded, subtle shadow on hover
- Mobile-first responsive (320px → 4K)

---

## ⭐ Key strategic decisions reflected

### 1. Sách là sản phẩm CHÍNH
- Primary CTA mọi nơi: "Đặt sách 249k →"
- Section 5 dedicated to book với mock-up cover
- Pillar Trí featured + highlighted với "Sản phẩm chính" badge

### 2. 3 trụ rõ vai trò
- Thân: 100% free, community (bothuocla)
- Tâm: 100% free, content (/ngam/)
- Trí: Sách + Active (revenue)

### 3. Free entry points vẫn nhiều
- Pillar blog đọc miễn phí (Section 8)
- Newsletter signup với chương 1 free (Section 9)
- FB Group miễn phí (Final CTA)
- bothuocla app miễn phí (Section 4)

### 4. Cohesion với các domain khác
- Header: link đến cả bothuocla, /ngam/, huongdi
- Footer: 5 cột bao gồm Hệ thống huongdi + Tài nguyên + Sol ecosystem
- Multiple paths to same destination (sách)

### 5. Voice "mình - anh" nhất quán
- KHÔNG dùng "tôi - bạn" anywhere
- Founder-led messaging
- Slogan "Đi cùng nhau, đường dài đỡ mỏi" ở Final CTA

---

## 🚀 Deploy strategy

### Option A: WordPress page (recommend)
- Vào WP admin → tạo Page mới
- Page Settings → Use as Homepage
- Copy nội dung từ `index.html` (split thành Gutenberg blocks)
- Add custom CSS từ `css/sol-homepage.css` vào Customize → Custom CSS
- Test responsive trên Customizer

### Option B: Static HTML override (advanced)
- Upload `index.html` + `css/sol-homepage.css` lên server
- WordPress `index.php` → redirect về static HTML
- Risk: lose WP plugins functionality

### Option C: Page builder block (Elementor / Bricks)
- Convert HTML structure → page builder elements
- Pros: editable từ WP admin
- Cons: 2-3 tuần build, performance overhead

**Recommend:** Option A — fastest deployment, vẫn editable.

---

## 📋 Pre-launch checklist

### Content
- [ ] Khang review + approve copy (especially Hero H1)
- [ ] Cập nhật số liệu thật (500+ anh em đã đi cùng — verify)
- [ ] Đảm bảo Khang's portrait photo URL accessible
- [ ] Verify Khang founder bio chính xác (20+ năm, 8 năm)

### Visual
- [ ] Tạo Book 3D mock-up thật (Canva/Photoshop)
  - 300×420 px PNG transparent
  - Phối màu amber gradient theo brand
- [ ] OG image 1200×630 cho social share
- [ ] Favicon 32×32

### Technical
- [ ] Test mobile responsive (iPhone, Android)
- [ ] Test desktop (1366px, 1920px, 4K)
- [ ] Lighthouse audit (target 95+ Performance, 100 SEO)
- [ ] Verify Schema.org markup with Google Rich Results Test
- [ ] Test all CTAs link đúng URL

### SEO
- [ ] GSC: submit URL `/` for indexing
- [ ] Sitemap.xml verify includes homepage
- [ ] Internal links from /huong-di/, /khang-sol/, /sol-la-gi/ → /
- [ ] Set up GA4 conversion events (book CTA clicks, newsletter signups)

### Legal / Compliance
- [ ] Privacy policy link working
- [ ] Disclaimer accessible from footer
- [ ] No false claims (chú ý "500+ anh em" — verify)

---

## 🎬 Mock-up các sections (text preview)

### Hero
```
🟢 Hệ sinh thái dành riêng cho đàn ông Việt 40-65

Đến 45, anh không thiếu năng lực.
Anh chỉ cần đúng HƯỚNG ĐI.

Sách + Hệ thống + Cộng đồng.
Mọi thứ anh cần để tìm lại con đường mới —
từ founder thật, kinh nghiệm thật.

[Đặt sách + 1 năm Active = 249k →]   [Khám phá 3 trụ ↓]

⭐⭐⭐⭐⭐ 500+ anh em đã đi cùng · 4.8/5 rating
```

### Sách Featured (Section 5)
```
📘 SẢN PHẨM TRUNG TÂM

         Tái Khởi Nghiệp Đúng Hướng

[Cover 3D Book]    Anh nhận được:
                   📘 Ebook PDF + ePub (280 trang)
                   🔑 1 năm Active hệ thống huongdi.sol.vn
                   🆙 All updates V1.5, V2 miễn phí
                   👥 FB Group members-only
                   🎁 Bonus: 7 templates + Pricing Matrix

                   Giá trị thật: 1.500.000đ
                   Chỉ: 249.000đ
                   ⚡ Early bird — 100 cuốn đầu tiên
                   ✅ Hoàn tiền 30 ngày

                   [Đặt sách ngay →]
                   [Đọc thử Chương 1 miễn phí]
```

---

## 💡 Next steps

### Sau khi Khang approve draft:

1. **Tạo Book 3D mock-up** — gửi Fiverr ~$30 hoặc tự Canva
2. **Tạo OG image** — 1200×630 cho social
3. **Deploy WP page** — copy HTML + CSS vào WordPress
4. **Submit GSC** — index ngay
5. **Test conversion** — A/B test sau 100 sessions

### Iterations sau launch (Year 1)

- **Tháng 1:** Add 3 testimonials thật (sau khi có 10 sales đầu)
- **Tháng 2:** Add YouTube video Khang giới thiệu 60s
- **Tháng 3:** A/B test pricing 199 vs 249 vs 299
- **Tháng 6:** Add "Featured in" press logos (nếu có PR)
- **Tháng 12:** Year 1 retrospective + V2 design

---

## 📊 Expected conversion metrics

| Metric | Target Y1 |
|---|---|
| Bounce rate | <55% |
| Avg session duration | 2-3 phút |
| Hero "Đặt sách" CTR | 8-12% |
| Section 5 sách CTA CTR | 15-20% |
| Newsletter signup rate | 3-5% |
| Bot/sketchy traffic filter | 90% real |

---

## ❓ Open questions cần Khang quyết định

| # | Câu hỏi | Đề xuất |
|---|---|---|
| 1 | Hero copy: "Anh không thiếu năng lực" hay "Đừng bắt đầu lại sự nghiệp"? | "Anh không thiếu năng lực" (empathy first) |
| 2 | Trust signal 500+ — confirm số thật hay placeholder? | Placeholder ban đầu, update khi có data thật |
| 3 | Featured pillar = Trí (Sách). Có nên feature Tâm hay Thân thay? | NO — Trí = revenue, đúng business priority |
| 4 | Có nên ẩn "Sắp có Q3/2026" trên Roadmap/AI Mentor? | KHÔNG — show roadmap signal long-term commitment |
| 5 | Mức 249k có quá thấp/quá cao? | 249k = sweet spot. Sau 100 sales → 299k |

---

*Đi Cùng Sol — Đi cùng nhau, đường dài đỡ mỏi.*
*Homepage Draft V1 — Tháng 6/2026*
