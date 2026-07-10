# Sol MVP V3 — Deployment & SEO Go-Live Guide

*Hướng dẫn deploy 3 deliverable đã build → live trên sol.vn + huongdi.sol.vn*

**Status:** 3/3 files ready · Ngày: 2026-06-30

---

## 📦 Deliverables overview

| File | Purpose | Deploy target |
|---|---|---|
| `01-canonical-copy.md` | Internal reference doc | (Internal only) |
| `02-book-v2.html` | Sách 25 slide V2 | sol.vn/sach/tai-khoi-nghiep-dung-huong/ |
| `03-homepage-v3.html` | Homepage SEO + Sales | sol.vn/ (replace current) |

---

## 🚀 PHASE 1: Deploy Homepage V3 (Priority #1)

### Bước 1.1 — Backup current homepage

cPanel File Manager → `/wp-content/mu-plugins/`
- Download `sol-landing-template-v3.php` → save local `sol-landing-template-v3-BACKUP-2026-06-30.php`

WP Admin → Pages → Trang Chủ (homepage) → Edit
- Click "Code editor" mode (top-right menu)
- Select all → Copy → Save vào file local `homepage-v2-BACKUP-2026-06-30.html`

### Bước 1.2 — Deploy V3 content

1. Mở `03-homepage-v3.html` local — copy **toàn bộ body content** (từ `<section class="hero">` đến cuối `</section>` cuối cùng)
2. WP Admin → Pages → Trang Chủ → Edit
3. Code editor mode → Delete all → Paste content mới
4. Update → Publish

**Lưu ý:** Page template phải set là `Sol Landing — Full HTML` để render đúng (template hiện không inject header/footer extra).

### Bước 1.3 — Verify CSS loaded

Vì homepage V3 dùng CSS inline trong `<style>` block, không cần dependency theme.

Test trên Incognito:
- https://sol.vn/ → load full page, không có CSS thiếu
- Mobile: < 768px → responsive đúng
- 3 con số hero (37/90/5) hiển thị
- Pricing card 499k hiển thị đúng

### Bước 1.4 — SEO post-deploy

1. **Google Search Console:**
   - URL Inspection → https://sol.vn/ → Request indexing
   - Submit sitemap (nếu chưa): https://sol.vn/sitemap.xml

2. **Schema.org validate:**
   - Test: https://search.google.com/test/rich-results
   - Paste https://sol.vn/ → Check FAQ + Organization + Product schemas
   - Phải pass cả 3

3. **Open Graph preview:**
   - Test: https://www.opengraph.xyz/
   - Paste URL → Check image, title, description hiển thị đúng

4. **Speed test:**
   - PageSpeed Insights → https://pagespeed.web.dev/
   - Target: Mobile 70+, Desktop 90+

### Bước 1.5 — Submit to AI/Search engines

- Bing Webmaster Tools → submit homepage
- Cốc Cốc → Submit URL (search engine VN)
- Update sitemap.xml include homepage update

---

## 📖 PHASE 2: Deploy Book V2 (Priority #2)

### Bước 2.1 — Tạo trang sách trên sol.vn

WP Admin → Pages → Add New
- **Title:** Tái Khởi Nghiệp Đúng Hướng — Sách 25 slide miễn phí
- **Slug:** `tai-khoi-nghiep-dung-huong` (dưới parent `/sach/`)
- **Template:** Sol Landing — Full HTML
- **Featured image:** Upload bìa sách (có sẵn)

### Bước 2.2 — Paste body content

1. Mở `02-book-v2.html` → copy toàn bộ `<body>` content (từ `<aside class="sidebar">` đến cuối)
2. Paste vào WP page Code Editor
3. **Quan trọng:** CSS phải copy vào `<head>` của template hoặc inject vào page content.
4. **Cách dễ nhất:** Copy TOÀN BỘ file `02-book-v2.html` (cả `<head>` lẫn `<body>`) → paste như HTML page độc lập (không qua WP).

### Bước 2.3 — Option B: Standalone HTML hosting

Nếu WP page editor cản trở `<style>` tag:

1. cPanel File Manager → `/public_html/`
2. Tạo folder `/sach/`
3. Upload `02-book-v2.html` → rename thành `index.html`
4. URL: https://sol.vn/sach/

→ Trang sách sẽ load nhanh hơn WP page (không qua PHP).

### Bước 2.4 — Internal linking

Update các pages khác link tới sách:
- Homepage V3 đã có link `/sach/tai-khoi-nghiep-dung-huong/`
- Footer global (sol-default-template-v3.php) — thêm link sách
- Trang Khang Sol — thêm "Sách của tôi: ..."
- 7 pillar pages — thêm box "Đọc thêm trong sách miễn phí"

---

## 🔗 PHASE 3: Cross-linking + 301 Redirects

### URL changes (P1/P2/P3 → Việt hóa)

Update redirects trong `sol-redirects.php` (đã có file):

```php
// Việt hóa Bước 1-5 (URL changes)
add_action('template_redirect', function() {
  $redirects = [
    '/khanh-pha-ban-than/' => '/thau-hieu/',
    '/kham-pha-nguon-luc/' => '/khai-pha/',
    '/la-ban-huong-di/' => '/chon-huong/',
    '/p1/' => '/thau-hieu/',
    '/p2/' => '/khai-pha/',
    '/p3/' => '/chon-huong/',
  ];
  $path = $_SERVER['REQUEST_URI'];
  foreach ($redirects as $from => $to) {
    if (strpos($path, $from) === 0) {
      wp_redirect(home_url($to), 301);
      exit;
    }
  }
});
```

### Internal link audit

Sau khi deploy, tìm + thay TẤT CẢ:
- "P1" / "P2" / "P3" → tên Việt hóa (THẤU HIỂU/KHAI PHÁ/CHỌN HƯỚNG)
- "Huongdi.sol.vn" → "Sol La Bàn"
- "Hướng Nghiệp" (cũ) → "Sol La Bàn"
- "Workbook" → "Sổ Hành Trình"

Search trong WP DB:
```sql
SELECT * FROM wp_posts WHERE post_content LIKE '%huongdi.sol.vn%' AND post_status='publish';
SELECT * FROM wp_posts WHERE post_content LIKE '%P1 (%' OR post_content LIKE '%P2 (%' OR post_content LIKE '%P3 (%';
```

→ Update từng post manually (hoặc dùng plugin Better Search Replace).

---

## 📊 PHASE 4: Analytics & Tracking

### GA4 Events tracking

Thêm vào homepage V3 (insert trước `</body>`):

```html
<script>
// Event: CTA click
document.querySelectorAll('a[href*="huongdi.sol.vn"]').forEach(link => {
  link.addEventListener('click', () => {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'cta_click', {
        'cta_type': link.textContent.trim(),
        'cta_destination': link.href
      });
    }
  });
});

// Event: Scroll depth (track engagement)
let maxScroll = 0;
window.addEventListener('scroll', () => {
  const percent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
  if (percent > maxScroll && percent % 25 === 0) {
    maxScroll = percent;
    if (typeof gtag !== 'undefined') {
      gtag('event', 'scroll_depth', { 'depth': percent });
    }
  }
});
</script>
```

### Conversion goals (GA4)

Setup goals:
1. **Bước 1 start** — User clicks "Làm Bước 1 miễn phí"
2. **Bước 1 complete** — User reaches huongdi.sol.vn/thau-hieu/thank-you
3. **Active purchase** — Payment success
4. **Sách view** — User on /sach/ > 2 minutes
5. **FB Group join** — Outbound click facebook.com/groups/dicungsol

### Heatmap (recommended)

Microsoft Clarity (free):
- https://clarity.microsoft.com/
- Add tracking script
- Track: scroll, click, rage clicks → optimize sau 100 sessions

---

## 🎯 PHASE 5: Content & Sales push (Week 1 post-launch)

### Week 1 daily tasks

**Ngày 1 (Monday):** Announce launch
- FB Group "Đi Cùng Sol" → post launch announcement
- Personal FB Khang Sol → status với link homepage
- Email list (nếu có) → blast first email

**Ngày 2-3:** Content amplification
- Viết 1 bài LinkedIn về journey từ idea → launch
- 1 bài medium hoặc Spiderum: "Tôi đã xây Sol La Bàn cho người 40-60 — đây là 5 Bước"
- Share lên Tinhte, Webtretho (groups phù hợp)

**Ngày 4-5:** Outreach trực tiếp
- DM 20 bạn bè trong network 40-60 → "Mình ra mắt cái này, anh thử Bước 1 free?"
- Mục tiêu: 10 người làm Bước 1 trong tuần đầu

**Ngày 6-7:** Iterate based on feedback
- Collect feedback: cái gì confusing? CTA nào không click?
- A/B test: title hero — variant A "90 ngày..." vs variant B "37 mô hình..."

### SEO Week 1 actions

- Submit GSC sitemap update
- Build 5 backlinks: comment quality trong các blog/group VN (Nick MinhDX, Hoàng IDM, Quân ITSS, etc.)
- Internal link audit: mọi pillar page → link tới homepage V3
- Schema.org structured data validate lại tất cả pages

### Sales Week 1 metrics target

| Metric | Target Week 1 |
|---|---|
| Homepage visits | 200 |
| Bước 1 starts | 30 |
| Bước 1 completes | 18 |
| Bước 2 completes | 10 |
| Active purchases | 2-3 (first conversions) |
| FB Group joins | 15 |

---

## 🛡️ PHASE 6: Risk Management

### Nếu Homepage V3 lỗi:
1. Backup file → restore trang chủ V2 (đã backup)
2. WP page → revert revision (WP keeps history)

### Nếu Book V2 lỗi:
1. Đổi tên page → /sach/v2-test/ (out of nav)
2. Keep V1 ở /sach/v1/ làm fallback

### Nếu traffic spike crash server:
- Enable Cloudflare cache mode "Aggressive"
- WP Rocket (nếu có) → Purge + Pre-load cache

### Nếu DDoS / bot attack:
- Cloudflare Bot Fight Mode → On
- Block suspicious IPs trong cPanel

---

## 📋 Pre-launch Checklist

### Trước khi deploy
- [ ] Backup homepage V2 + sol-landing-template-v3.php
- [ ] Backup current /sach/ page (nếu có)
- [ ] Test homepage V3 trên local browser (mở file://03-homepage-v3.html)
- [ ] Test book V2 mobile (Chrome DevTools → Responsive mode)
- [ ] Verify GA4 tracking ID đúng trong template

### Sau khi deploy
- [ ] Homepage V3 load đúng (no broken images, CSS load)
- [ ] CTA "Làm Bước 1" link đúng huongdi.sol.vn/thau-hieu/
- [ ] FAQ accordion mở/đóng OK
- [ ] Pricing card hiển thị 499k với promise box
- [ ] Mobile responsive < 768px
- [ ] Book V2 — sidebar nav active state sync khi scroll
- [ ] Book V2 — Mobile sidebar collapse to top
- [ ] Schema.org rich results test PASS (FAQ + Product + Organization)
- [ ] PageSpeed mobile > 70
- [ ] Open Graph image + title hiển thị đúng (FB debugger)

### Post-deploy day 1
- [ ] Submit GSC homepage + sách
- [ ] Submit Bing Webmaster
- [ ] Update FB Group profile link
- [ ] Email list announce
- [ ] Personal FB status
- [ ] DM 5-10 bạn bè test feedback
- [ ] Setup GA4 conversion goals
- [ ] Setup Microsoft Clarity heatmap

---

## 🎯 Next Steps (Week 2+)

### Build deferred from MVP Week 1

1. **Bước 1+2 forms** trên huongdi.sol.vn — Đánh giá DNA + Audit vốn ngầm
2. **Database 37 mô hình** — Fill content (Khang Sol R&D)
3. **10 Case studies** — Viết với consent từ network
4. **Roadmap 90 ngày templates** — 10 templates cho 10 mô hình hot
5. **Sổ Hành Trình** — Basic cloud save (WP custom post type hoặc Postgres)
6. **Payment integration** — Sepay/VNPay (chọn 1 cổng đầu)
7. **Email nurture** — 7 emails Mailchimp/Brevo setup

### Phase 2 (Month 2-3)

1. **Bước 4 — Roadmap engine** full launch
2. **Database mở rộng** 37 → 50 mô hình
3. **Active+ tier** plan (defer launch đến Phase 3)

### Phase 3 (Month 4-6)

1. **Bước 5 — An Toàn Bền Vững** module
2. **Sol Đồng Hành AI** — RAG architecture build
3. **Active+ 1.499k/năm** launch với AI unlimited

---

## 🎁 Bonus: Quick SEO Wins (Week 1)

### Title tag optimization
Current homepage title trong file:
```
Sol — Tái khởi nghiệp đúng hướng cho người 40-60 | Sol La Bàn
```
57 chars ✓ (Google cuts at ~60)

### Meta description
Current:
```
Trong 90 ngày, anh sẽ biết MÌNH HỢP MÔ HÌNH NÀO trong 37 lựa chọn — và CÁCH ĐI từng bước cụ thể đến thu nhập đầu tiên. 5 Bước Sol La Bàn cho người 40-60.
```
153 chars ✓ (Google cuts at ~155)

### Primary keyword targets
1. "tái khởi nghiệp tuổi 40" — primary
2. "tái khởi nghiệp tuổi 50" — secondary
3. "mô hình thu nhập tuổi trung niên" — long-tail
4. "khởi nghiệp tinh gọn Việt Nam" — long-tail
5. "Sol La Bàn" — brand

→ Build backlinks + content cluster xoay quanh 5 keywords này trong 90 ngày tiếp theo.

---

*Đúng hướng. Đúng bước. Đúng tương lai.*
