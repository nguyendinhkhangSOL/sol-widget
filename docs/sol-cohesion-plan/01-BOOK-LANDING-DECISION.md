# Quyết định: Book landing nên ở đâu?

## TL;DR

> **Recommend: `sol.vn/sach/tai-khoi-nghiep-dung-huong/`**
> **KHÔNG nên: `ebook.sol.vn`**

---

## I. Decision matrix

| Yếu tố | `sol.vn/sach/...` (subpath) | `ebook.sol.vn` (subdomain) |
|---|---|---|
| **SEO authority** | ★★★★★ Compound vào root domain | ★★ Build authority từ 0 |
| **Internal linking** | ★★★★★ Pillar → /sach/ là internal link (high juice) | ★★ Cross-subdomain (Google coi như external) |
| **Setup complexity** | ★★★★★ WP có sẵn — chỉ thêm 1 page | ★★ Deploy thêm 1 subdomain, SSL, DNS, hosting |
| **Brand cohesion** | ★★★★★ 1 brand, 1 domain | ★★★ Fragment thêm (đã có 3 subdomain rồi) |
| **Auth + SSO** | ★★★★★ Cùng cookie domain | ★★★★ Phải share `.sol.vn` cookie |
| **User memorability** | ★★★★ Search Google đến | ★★★ Hơi rối ("ebook? sol?") |
| **Scale catalog** | ★★★★ /sach/book-1, /sach/book-2 | ★★★★ Cũng scale được |
| **Tech freedom** | ★★★ WP có constraint | ★★★★★ Tự do React/Next/whatever |
| **Tracking + GA4** | ★★★★★ 1 property | ★★ Cross-domain tracking phức tạp |
| **Maintenance** | ★★★★★ 1 codebase | ★★ Thêm 1 codebase phải maintain |

→ **9/10 yếu tố ủng hộ subpath**. Subdomain CHỈ thắng nếu cần tech stack riêng — mà ebook landing thì WordPress đủ.

---

## II. 3 lý do quan trọng nhất

### 1. SEO authority đang build — KHÔNG được phân tán

Sol.vn còn DA thấp (mới publish 7 pillars). **Mọi link, mọi page** đều nên dồn vào ROOT domain để compound authority.

**Ví dụ cụ thể:**
- 7 Pillar pages link đến `/sach/tai-khoi-nghiep-dung-huong/` → **internal link** (Google đếm full juice)
- 7 Pillar pages link đến `ebook.sol.vn` → **external link** (Google đếm 50% juice, có thể coi như subdomain riêng)

Sau 6 tháng, sol.vn có thể đạt DA 25-30. Subdomain ebook.sol.vn vẫn DA 5-10 (build độc lập).

### 2. Trải nghiệm user mạch lạc

User journey hiện tại:
```
1. Google search "tái khởi nghiệp tuổi 45"
2. Click vào pillar sol.vn/huong-di/freelancer-chuyen-mon-tuoi-45/
3. Đọc bài → cuối bài có CTA "Mua sách"
4. Click → đến /sach/tai-khoi-nghiep-dung-huong/
   ↓ User vẫn nhìn header "Đi Cùng Sol" — quen thuộc
5. Mua sách → /thanh-vien/dashboard/
   ↓ User vẫn ở sol.vn — không bị "lạc" sang domain khác
```

Vs subdomain:
```
1. Google → Pillar sol.vn/huong-di/...
2. Click CTA → JUMP sang ebook.sol.vn
   ↓ "Ủa? sao đổi domain? Có phải Sol thật không?"
3. Header khác, layout khác → confusion
4. Trust dropt → conversion drop
```

### 3. Hệ sinh thái đã đủ phức tạp với 3 subdomain

Hiện tại Sol có:
- sol.vn
- huongdi.sol.vn
- bothuocla.sol.vn
- adminhuongdi.sol.vn (internal)

Thêm `ebook.sol.vn` = **4 subdomain user-facing** → quá phức tạp. Nguyên tắc: **càng ít domain user phải biết, càng tốt**.

---

## III. URL cuối cùng — Recommend

### Structure
```
sol.vn/sach/                                    Catalog hub (1-2 sách hiện tại)
sol.vn/sach/tai-khoi-nghiep-dung-huong/         Landing page sách chính
  ├── /muc-luc/                                 Table of Contents (SEO bait)
  ├── /chuong-1-mau/                            Free sample chapter (lead magnet)
  ├── /reviews/                                 Testimonials
  ├── /cap-nhat/                                Version history (V1, V1.5, V2)
  └── /mua/                                     Checkout
sol.vn/sach/<future-book-2>/                    Khi có sách 2 (Year 2+)
```

### Slug quyết định

Tên file đầy đủ: **"Tái Khởi Nghiệp Đúng Hướng"** (như user nói)

URL slug: **`tai-khoi-nghiep-dung-huong`**

Lý do:
- ✓ Ngắn (3 từ kebab-case)
- ✓ Intent rõ ràng — Google đọc được mục đích
- ✓ Không redundant "sach-" vì đã có `/sach/` folder
- ✓ Không thừa "tuoi-45" vì target persona đã rõ trong tiêu đề bài

### Title tag mẫu

```html
<title>Sách "Tái Khởi Nghiệp Đúng Hướng" — Cẩm Nang Cho Đàn Ông Việt 40-65 | Đi Cùng Sol</title>
<meta name="description" content="Sách 280 trang + 1 năm Active huongdi.sol.vn. Khang Sol, founder 20+ năm CNTT, chia sẻ framework tìm hướng tái khởi nghiệp cho U45. Mua 1 lần, dùng cả năm.">
```

---

## IV. Khi nào subdomain HỢP LÝ?

Mình recommend subpath cho Sol Year 1. Nhưng nếu sau này Sol scale tới mức cần subdomain, có 3 trường hợp hợp lý:

### TH1: Multi-product với target audience hoàn toàn khác nhau
- Ví dụ: `enterprise.sol.vn` (B2B Sol) — nếu Year 3+ Sol mở rộng B2B
- Audience B2B != B2C → tách subdomain hợp lý

### TH2: Tech stack quá khác biệt
- Ví dụ: `community.sol.vn` (Discord-style forum) — nếu future build platform riêng
- WP không đáp ứng được → subdomain với stack riêng

### TH3: International expansion
- Ví dụ: `en.sol.vn` (English version) — nếu Y4+ launch quốc tế
- Multilingual SEO → subdomain language tốt hơn

→ **Hiện tại: KHÔNG có trường hợp nào áp dụng.** Stay với subpath.

---

## V. Tham khảo các brand pro làm thế nào

| Brand | Strategy |
|---|---|
| **Stripe** | stripe.com/atlas (sách product) — KHÔNG dùng atlas.stripe.com |
| **HubSpot** | hubspot.com/products/marketing — KHÔNG dùng marketing.hubspot.com |
| **Tim Ferriss** | tim.blog/podcast, tim.blog/books — KHÔNG tách subdomain |
| **Cal Newport** | calnewport.com/books/deep-work — KHÔNG dùng books.calnewport.com |
| **Sahil Lavingia** | sahillavingia.com/book — subpath |

Brand chuyên nghiệp đều ưu tiên **subpath** cho marketing pages, **subdomain** chỉ dùng cho app/tool riêng biệt (như stripe.com vs dashboard.stripe.com).

→ **Sol nên follow pattern này:**
- `sol.vn/sach/` = marketing
- `huongdi.sol.vn` = app/tool (đã đúng)
- `bothuocla.sol.vn` = app/tool (đã đúng)

---

## VI. Action items — implement /sach/

### Phase 1: Reserve URL ngay (15 phút)
1. Vào WP admin → tạo page mới
2. Slug: `sach`
3. Title: "Sách Sol — Cẩm nang tái khởi nghiệp cho đàn ông Việt 40-65"
4. Status: Published (page hub "coming soon" có 1-2 paragraph)
5. Thêm placeholder block: "Sách V1 ra mắt T9/2026 — đăng ký nhận thông báo"

### Phase 2: Tạo product page (3-5 giờ khi gần ngày launch)
1. WP page: `sach/tai-khoi-nghiep-dung-huong/`
2. Custom design (gradient amber + serif body)
3. 10 sections: Hero, Why, Mục lục, Sample, Reviews, Author, What you get, Pricing, FAQ, Final CTA
4. WooCommerce integration cho checkout (hoặc custom Stripe link)

### Phase 3: Link từ tất cả nơi
- 7 Pillar pages: cuối bài "Mua sách" CTA → /sach/tai-khoi-nghiep-dung-huong/
- huongdi.sol.vn landing: "Tài nguyên" footer → /sach/
- bothuocla day 30: "Tiếp theo: tìm hướng đi" → /sach/
- Newsletter signup: lead magnet "1 chương miễn phí" → /sach/chuong-1-mau/

---

## VII. Test SEO health sau launch

Sau khi launch /sach/, 30 ngày sau check:
- [ ] GSC: /sach/ được index? Bị crawl errors?
- [ ] Ahrefs/SEMrush: Internal link từ 7 pillar đến /sach/ đếm OK?
- [ ] GA4: Conversion rate Pillar → /sach/ click bao nhiêu %?
- [ ] User feedback: "Có cảm thấy lạ không khi từ blog → /sach/?"

→ Nếu mọi metric green sau 30 ngày → confirm subpath đúng.

---

## VIII. Câu hỏi anh nên hỏi tiếp

Sau khi đồng ý subpath, mình tiếp tục:

1. **Cohesion map**: Pillar → bothuocla → huongdi → sách connect thế nào?
2. **Marketing system blueprint**: 1 sơ đồ duy nhất mô tả flow user end-to-end
3. **Book landing page mockup**: Layout + copy cụ thể cho /sach/tai-khoi-nghiep-dung-huong/

→ Đọc tiếp `02-COHESION-MAP.md` và `03-BOOK-LANDING-BRIEF.md`.

---

*Quyết định 30 phút, làm 30 năm. Chọn architecture đúng từ đầu.*
