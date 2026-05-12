# SOL.VN — SEO Action Plan

**Ngày:** 2026-05-08
**Audit:** 129 URL — 0 hoàn hảo, 129 có vấn đề (chủ yếu từ 1 nguyên nhân duy nhất)

---

## Chẩn đoán

| Vấn đề | Số trang | Nguyên nhân | Mức độ |
|---|---|---|---|
| TITLE_LONG | 126/129 (97.7%) | Yoast tự append tagline 60 chars vào mọi title | 🔴 P0 |
| Meta desc sai range | 71/129 (55%) | Yoast fallback raw excerpt | 🟡 P1 |
| MULTIPLE_H1 | 5/129 | Theme dùng H1 cho site logo | 🟡 P2 |
| NO_ARTICLE_SCHEMA | 3/129 | Chỉ category pages — bình thường | 🟢 OK |

**Tin tốt sẵn có:**
- ✅ 100% trang có internal link đến hub `/bo-thuoc-la` hoặc `bothuocla.sol.vn`
- ✅ 100% trang có canonical, OG tags, >300 từ, ảnh đủ alt
- ✅ Yoast/RankMath đang work (126/129 có Article schema)
- ✅ Sitemap chuẩn, 0 fetch fail

---

## Fix #1 (CRITICAL) — Sửa Rank Math Title Template — fix 126 trang bằng 1 click

**Bằng chứng:**
```
<title>: Sol: Sống lại – Làm lại – Tốt hơn - Đi Cùng Sol để tái sinh — Khang Sol đồng hành người Việt 45+
                                              └─────────────────── 60 chars suffix ───────────────────┘
```

Mọi title đều bị append `" - Đi Cùng Sol để tái sinh — Khang Sol đồng hành người Việt 45+"`.

→ Đây là **Rank Math title template** đang chứa `%sitename% - %sitedesc%` hoặc tagline.

### Cách fix (Rank Math SEO)

WordPress Admin → **Rank Math** → **Titles & Meta**

> Lưu ý variable Rank Math dùng dấu **`%variable%`** (1 dấu %), khác Yoast (dùng `%%variable%%`).

#### 1. Tab "Posts" (sidebar trái)

**Single Post Title** — đang có thể là:
```
%title% %sep% %sitename% - %sitedesc%
```

**Đổi thành:**
```
%title% %sep% %sitename%
```

Hoặc tối ưu hơn (chỉ giữ post title):
```
%title%
```

→ Save Changes (nút dưới cùng).

#### 2. Tab "Pages" (sidebar trái)

**Single Page Title** — đổi tương tự:
```
%title% %sep% %sitename%
```

#### 3. Tab "Homepage" (sidebar trái)

**Homepage Title** — kiểm tra setting đặc biệt cho trang chủ. Đổi:
```
%sitename% %sep% %sitedesc%
```
→
```
SOL — Bỏ thuốc lá cùng Sol
```
(hardcode 1 title chuẩn cho homepage)

#### 4. Tab "Categories" (sidebar trái — phần "Taxonomies")

**Category Archive Title** — đổi:
```
%term% %sep% %sitename%
```

#### 5. Tab "Tags" — tương tự `%term% %sep% %sitename%`.

#### 6. Tab "Misc Pages" → Author Archives, Date Archives

Toggle **"Robots Meta: noindex"** = ON nếu không dùng (giảm crawl waste).

### Title Separator (optional)

**Rank Math** → **Titles & Meta** → **Global Meta** → **Title Separator**:
- Mặc định là `-` (dấu gạch ngang)
- Em recommend đổi thành `·` (interpunct) hoặc `|` (pipe) — gọn hơn

### Xác nhận

Sau khi Save All, chạy lại:
```bash
cd D:\BOTHUOCLA\sol-widget\scripts\seo-audit
node diagnose.js
```

Title length kỳ vọng:
- Wiki post: 30-55 chars
- Homepage: 30-45 chars
- Category: 25-40 chars

Nếu vẫn dài → check **Settings → General → Tagline** (Fix #2 bên dưới).

---

## Fix #2 — Rút ngắn Site Tagline

WordPress Admin → **Settings** → **General** → **Tagline**

Hiện tại có thể là: `Đi Cùng Sol để tái sinh — Khang Sol đồng hành người Việt 45+`

**Đổi thành:** `Đồng hành người Việt 45+`

Hoặc để **trống**.

> Tagline xuất hiện ở `%sitedesc%` variable của Rank Math + og:site_name + footer theme. Ngắn = clean toàn site.

### Lưu ý: Rank Math có cache

Sau khi đổi tagline + title template, Rank Math có thể cache. Để force refresh:
1. **Rank Math** → **Status & Tools** → **Database Tools** → click **"Update Schema Validator"**
2. Hoặc đơn giản: clear browser cache + Ctrl+F5 trên trang test
3. Nếu site dùng cache plugin (WP Rocket, W3 Total Cache, LiteSpeed) → **Purge All Cache**

---

## Fix #3 — Multiple H1 (5 trang) — sửa theme

**Bằng chứng:** trang "Về Sol" có 2 H1:
- H1[0]: "Sol: Sống lại – Làm lại – Tốt hơn"  (← site logo / Yoast title bị inject)
- H1[1]: "Sống lại – Làm lại – Tốt hơn"  (← post content)

### Cách fix

**Option A — Sửa theme header.php (cần child theme):**
```php
<!-- Trước -->
<h1 class="site-title">...</h1>

<!-- Sau -->
<div class="site-title-wrap"><span class="site-title">...</span></div>
```

**Option B — CSS-only (nhanh nhưng không tối ưu SEO):**
Cài plugin **"Code Snippets"** → thêm:
```php
add_filter('document_title_parts', function($parts) {
    // không thay đổi gì, chỉ ví dụ
    return $parts;
});
```

**Option C — Khang gửi em screenshot/code header.php của theme** → em viết exact patch.

### 5 URL bị MULTIPLE_H1

1. `https://sol.vn/2025/05/31/ve-sol/`
2. `https://sol.vn/2026/04/10/dieu-thuoc-cuoi-cung-khong-phai-de-bo-ma-de-hieu/`
3. `https://sol.vn/2025/09/09/nguoi-lao-dong-viet-nam-can-chuan-bi-gi-de-vuon-minh-trong-ky-nguyen-moi/`
4. + 2 trang khác trong report.csv

> Chú ý: Nếu fix theme thành công, tất cả 5 trang fix cùng lúc — không cần sửa từng bài.

---

## Fix #4 — Meta description top 10 trang (em viết sẵn 140-150 chars)

Khang edit từng bài → cuộn xuống box **"Rank Math SEO"** (không phải Yoast) → tab **"General"** → field **"Description"** → paste meta desc đề xuất → Update.

> Rank Math hiển thị Google preview real-time + đếm ký tự — Khang dễ verify length.

| URL | Meta description đề xuất (140-150 chars) |
|---|---|
| `https://sol.vn/` | Bỏ thuốc lá cùng Sol — đồng hành người Việt 45+. 4 chặng từ 7 ngày Nhận Thức đến 88 ngày Tái Sinh. Khang Sol đã đi qua 30 năm. Bắt đầu hôm nay. |
| `/2025/05/31/ve-sol/` | Sol là không gian đồng hành người Việt 45+ tái sinh sau thất bại, đổ vỡ, bệnh tật. Không tô hồng, chỉ kể thật. Sống Lại – Làm Lại – Tốt Hơn. |
| `/2026/04/10/dieu-thuoc-cuoi-cung-...` | Day 0 hành trình bỏ thuốc lá — trải nghiệm điếu cuối cùng để hiểu, không phải để bỏ. Khang Sol đồng hành 88 ngày từ Q-Day đến tái sinh. |
| `/category/wiki-bo-thuoc-la/` | Wiki bỏ thuốc lá Sol — 100+ bài về cơn thèm nicotine, triệu chứng cai, tâm lý, dinh dưỡng, lộ trình 30-88 ngày. Hiểu đúng, đi đúng. |
| `/category/wiki-bo-thuoc-la/30-ngay-cai-thuoc-la/` | Hành trình 30 ngày bỏ thuốc lá — 4 tuần chia rõ giai đoạn cai cấp tính, phục hồi, tái cấu trúc, củng cố. Dữ liệu khoa học + thực tế Khang Sol. |
| `/category/ngam/` | Ngẫm — Khang Sol ghi chép về stress, giấc ngủ, cha-con, chuyển nghề, tái sinh trung niên. Không lý thuyết, chỉ chiêm nghiệm thật từ người đã đi qua. |
| `/2026/04/28/cai-cach-hanh-chinh-...` | Cải cách hành chính & lối sống — lộ trình 72 giờ số hoá sức khoẻ và bỏ thuốc lá cùng Sol. Bắt đầu tại bothuocla.sol.vn. |
| `/2026/04/28/rebranding-ban-than-...` | Rebranding bản thân — gỡ bỏ bẫy lậu dopamine, cài đặt lại hệ điều hành Sol. Hành trình tái sinh người Việt 45+ tại bothuocla.sol.vn. |
| `/2025/06/24/ky-nang-cu-thu-nhap-moi-trung-nien/` | Kỹ năng cũ – thu nhập mới cho người trung niên: chuyển hoá kinh nghiệm 20 năm thành dòng tiền side-income bền vững. Khang Sol đồng hành. |
| `/2025/06/24/lam-freelancer-tai-khoi-nghiep-trung-nien/` | Làm freelancer — tái khởi nghiệp ở tuổi 45+. Khang Sol chia sẻ lộ trình từ employee đến tự làm chủ thời gian, vẫn nuôi gia đình ổn định. |

### Còn 61 trang DESC sai range khác

Sau khi fix top 10, mở `report.csv` → filter cột `issues` chứa `DESC_` → sort theo:
- Lượt view Search Console (data)
- Hoặc theo độ ưu tiên kinh doanh (wiki cai thuốc > Ngẫm > tin về kỹ năng)

Khang fix top 20 trang traffic cao là đã cover ~80% ranking impact. Còn lại fix dần.

---

## Fix #5 — Homepage H1

**Hiện tại:** H1 = quote `"Tôi đi rồi.Anh không phải đi một mình."` — thiếu keyword.

### Đề xuất

**Option A — H1 visible cho user vẫn là quote (giữ emotional hook), thêm H1 ẩn ở screen-reader:**

Em đã build trong `05-sol-homepage.html` — trang chủ. Cần thay block hero:

```html
<h1 class="sr-only">Bỏ thuốc lá cùng Sol — đồng hành người Việt 45+</h1>
<p class="hero-quote" style="font-size: 32px; font-weight: 700;">
  "Tôi đi rồi. Anh không phải đi một mình."
</p>
```

Cùng với CSS:
```css
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }
```

**Option B — H1 visible với keyword, quote xuống H2:**

```html
<h1>Bỏ thuốc lá cùng Sol — đồng hành người Việt 45+</h1>
<h2 class="hero-quote">"Tôi đi rồi. Anh không phải đi một mình."</h2>
```

Trade-off: Option B SEO mạnh hơn nhưng làm loãng cảm xúc hero. Em recommend Option A.

> Khang quyết: Option A (giữ cảm xúc + SEO ẩn) hay Option B (visible keyword)?

---

## Thứ tự thực hiện

| Bước | Task | Thời gian | Impact |
|---|---|---|---|
| 1 | Fix **Rank Math** title template (#37) | 5 phút | 🔥 Fix 126 trang |
| 2 | Rút ngắn tagline (#38) | 2 phút | Cleaner all-site |
| 3 | Purge cache (Rank Math + WP cache plugin) | 1 phút | Force refresh |
| 4 | Verify lại — chạy `node audit.js` | 1 phút | Confirm |
| 5 | Fix homepage H1 (#41) | 10 phút | Top traffic page |
| 6 | Paste 10 meta desc top trang (#40) | 30 phút | Top 10 ranking |
| 7 | Fix theme MULTIPLE_H1 (#39) | 30 phút | 5 trang còn lại |
| 8 | Submit sitemap GSC (#35) | 5 phút | Crawl trigger |

**Tổng:** ~1h30 → expect issue count từ 129 → < 30.

---

## Sau khi fix — verify

```bash
cd D:\BOTHUOCLA\sol-widget\scripts\seo-audit
node audit.js
```

Mở `report.md` so sánh:
- TITLE_LONG: 126 → 0
- DESC: 71 → < 60
- MULTIPLE_H1: 5 → 0
- Hoàn hảo: 0 → 60+ trang

Sau đó chuyển sang task **#34** (verify schema), **#35** (GSC sitemap), **#36** (internal linking map).
