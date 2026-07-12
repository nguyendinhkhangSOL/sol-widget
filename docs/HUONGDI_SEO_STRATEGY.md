# HUONGDI.SOL.VN — SEO Strategy (Zero Marketing)

> Chiến lược SEO 6 tháng để huongdi.sol.vn thu hút organic traffic mà không tốn 1 đồng quảng cáo.
> Target: Đàn ông Việt 40-65 tuổi, đang muốn tái khởi nghiệp/làm thêm thu nhập.
>
> **Tác giả:** Sol AI · **Date:** 2026-06-22
> **Status:** App vừa launch, cần build SEO foundation

---

## 0. TL;DR — Roadmap 4 phase

| Phase | Thời gian | Việc | KPI |
|---|---|---|---|
| **P1: Foundation** | Tuần 1 | Meta tags + Schema + Sitemap + Robots + GSC | Index 100% page |
| **P2: Pillar pages** | Tuần 2-4 | Viết 7 pillar pages cho 7 category | Top 3 long-tail "X cho U45" |
| **P3: Spoke pages** | Tháng 2-3 | Viết 37 direction detail pages | 5+ keyword ranking top 10 |
| **P4: Authority + Cross-link** | Tháng 4-6 | Internal link cluster, EEAT, social proof | 500-1000 organic/tháng |

**Mục tiêu 6 tháng:** 1000 organic visits/tháng + 50-100 P1 test/tháng (5-10% conversion).

---

## 1. AUDIT HIỆN TRẠNG (Q3 2026)

### 1.1. Hiện tại có gì

✅ Domain HTTPS với SSL Let's Encrypt
✅ App deploy: P1 (20 câu) + P2 (8 trục) + P3 (matching) + 7 category pages
✅ Backend API + 37 directions seeded
✅ Brand sol.vn ecosystem (bothuocla cluster đã có authority)

❌ Meta tags chưa tối ưu (chỉ default)
❌ Chưa có Schema.org markup
❌ Chưa có sitemap.xml + robots.txt
❌ Chưa có content marketing (chỉ có app)
❌ Internal link chưa structured
❌ Author info (EEAT) chưa rõ trên page

### 1.2. SEO Opportunity matrix

| Keyword cluster | Volume Vietnam | Difficulty | Priority |
|---|---|---|---|
| "khởi nghiệp tuổi 40" | ~880/mo | 🟡 Medium | ⭐⭐⭐ |
| "tái khởi nghiệp U45" | ~110/mo | 🟢 Low | ⭐⭐⭐ |
| "kinh doanh tuổi trung niên" | ~590/mo | 🟡 Medium | ⭐⭐⭐ |
| "nên kinh doanh gì với 100 triệu" | ~1300/mo | 🟡 Medium | ⭐⭐ |
| "freelancer chuyên môn tuổi 40+" | ~70/mo | 🟢 Low | ⭐⭐⭐ |
| "làm thêm thu nhập tuổi 45" | ~210/mo | 🟢 Low | ⭐⭐⭐ |
| "khởi nghiệp ít vốn" | ~1900/mo | 🔴 High | ⭐⭐ |
| "thu nhập thụ động U45" | ~140/mo | 🟢 Low | ⭐⭐⭐ |
| "37 hướng đi tái khởi nghiệp" | (brand) | 🟢 Low | ⭐⭐⭐ (unique brand) |

**Chiến lược:** Tập trung **long-tail keywords + brand niche** (volume thấp, competition thấp, intent rõ) → tích lũy authority dần → đánh sang head terms.

---

## 2. PHASE 1 — TECHNICAL SEO FOUNDATION (Tuần 1)

### 2.1. Meta tags chuẩn cho 10 HTML files hiện có

Mỗi file `p1.html`, `p2.html`, `p3.html`, `p3-*.html` cần update `<head>` với:

```html
<title>{PAGE_SPECIFIC_TITLE} — Đi Cùng Sol</title>
<meta name="description" content="{160_CHAR_DESC}">
<meta name="keywords" content="...">

<!-- Canonical -->
<link rel="canonical" href="https://huongdi.sol.vn/{slug}">

<!-- Open Graph -->
<meta property="og:title" content="...">
<meta property="og:description" content="...">
<meta property="og:type" content="website">
<meta property="og:url" content="https://huongdi.sol.vn/...">
<meta property="og:image" content="https://huongdi.sol.vn/og/{slug}.jpg">
<meta property="og:locale" content="vi_VN">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="...">
<meta name="twitter:description" content="...">
<meta name="twitter:image" content="...">

<!-- Robots -->
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">

<!-- Author -->
<meta name="author" content="Khang Sol">
```

### 2.2. Meta cụ thể cho từng page

| File | Title (60 chars) | Description (160 chars) |
|---|---|---|
| `p1.html` | DNA Hướng Đi U45 — Trắc Nghiệm 20 Câu Khám Phá Bản Thân | Khám phá 4 trục DNA (Người-Chuyên gia-Nhà xây dựng-Tự lập). 20 câu hỏi, 5 phút, miễn phí. Founder Khang Sol — 20+ năm CNTT, tái khởi nghiệp tuổi 45. |
| `p2.html` | Bản Đồ Nguồn Lực U45 — 8 Trục Kinh Nghiệm, Vốn, Thời Gian | Đánh giá 8 nguồn lực anh đang có: kinh nghiệm, vốn, thời gian, công nghệ, network, sức khoẻ, gia đình, học hỏi. 5 phút. |
| `p3.html` | 37 Hướng Đi Khởi Nghiệp U45 — Xếp Theo % Phù Hợp | Hệ thống so khớp DNA + nguồn lực → 37 hướng đi xếp hạng % phù hợp. Roadmap 30/90/180 ngày. Sol — Khang Sol founder. |
| `p3-chuyenmon.html` | Freelancer Chuyên Môn Tuổi 45+ — 7 Hướng Đi Từ Kinh Nghiệm | 7 hướng freelance chuyên môn cho người 40-65: tư vấn IT, kế toán, pháp lý, marketing. Tận dụng 20-30 năm kinh nghiệm. |
| `p3-daotao.html` | Coaching & Đào Tạo Tuổi 45+ — Truyền Kinh Nghiệm Có Thu Nhập | 5 hướng đào tạo cho người trung niên: coach 1-1, training doanh nghiệp, viết course, mentor startup. |
| `p3-noidungso.html` | Content Creator U45 — Blog, YouTube, Podcast Tuổi Trung Niên | 6 hướng nội dung số cho U45: blog chuyên môn, YouTube kênh chia sẻ, podcast, viết sách. |
| `p3-kinhdoanh.html` | Khởi Nghiệp Kinh Doanh Tuổi 45+ — SME Tinh Gọn | 5 hướng kinh doanh: bán hàng online, SME tinh gọn, dropshipping, cửa hàng nhỏ, dịch vụ B2B. |
| `p3-daily.html` | Đại Lý Phân Phối Tuổi U45 — Vận Dụng Quan Hệ + Trust | 4 hướng đại lý: phân phối B2B, FMCG nhỏ, sản phẩm chuyên ngành, dropship lớn. |
| `p3-dichvu.html` | Dịch Vụ Tuổi 45+ — 5 Hướng Từ Kỹ Năng Đã Có | 5 hướng service: dịch vụ kỹ thuật, dịch vụ chăm sóc, dịch vụ tư vấn, dịch vụ outsource. |
| `p3-dauthu.html` | Đấu Thầu & Hợp Đồng Tuổi 45+ — Kiếm Tiền Từ Network | 5 hướng đấu thầu: government, B2B sales, freelance contract, RFP, vendor. |

### 2.3. Schema.org markup — JSON-LD inject vào MỖI page

**Tất cả pages** chèn 2 schema:

```html
<!-- Organization (sitewide) -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Đi Cùng Sol",
  "alternateName": "Sol",
  "url": "https://sol.vn/",
  "logo": "https://sol.vn/wp-content/uploads/2025/05/Icon_2.png",
  "founder": {
    "@type": "Person",
    "name": "Khang Sol",
    "alternateName": "Nguyễn Đình Khang",
    "url": "https://sol.vn/khang-sol/",
    "image": "https://sol.vn/wp-content/uploads/2026/05/khang-portrait-yulong-mountain.jpg",
    "jobTitle": "Founder, Đi Cùng Sol",
    "sameAs": [
      "https://www.linkedin.com/in/vietnaminternet/",
      "https://web.facebook.com/nguyendinhkhang"
    ],
    "knowsAbout": [
      "Mid-life career transition",
      "Lean startup",
      "IT project management",
      "Vietnamese SME entrepreneurship"
    ]
  },
  "sameAs": [
    "https://www.linkedin.com/in/vietnaminternet/",
    "https://web.facebook.com/nguyendinhkhang"
  ]
}
</script>

<!-- WebSite + SearchAction -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Huongdi — Tìm Hướng Đi U45",
  "url": "https://huongdi.sol.vn/",
  "publisher": { "@type": "Organization", "name": "Đi Cùng Sol" },
  "inLanguage": "vi-VN"
}
</script>
```

**Page p1.html** (trắc nghiệm) chèn thêm:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Quiz",
  "name": "Trắc Nghiệm DNA Hướng Đi U45",
  "description": "20 câu hỏi khám phá 4 trục DNA: Người, Chuyên gia, Nhà xây dựng, Tự lập",
  "educationalLevel": "Adult",
  "audience": {
    "@type": "Audience",
    "audienceType": "Đàn ông Việt 40-65 tuổi"
  },
  "timeRequired": "PT5M",
  "creator": {
    "@type": "Person",
    "name": "Khang Sol",
    "url": "https://sol.vn/khang-sol/"
  }
}
</script>
```

**Page p3.html** (37 directions) chèn `ItemList`:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "37 Hướng Đi Khởi Nghiệp Tuổi 45+",
  "numberOfItems": 37,
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Freelancer Chuyên Môn", "url": "https://huongdi.sol.vn/p3-chuyenmon" },
    { "@type": "ListItem", "position": 2, "name": "Coaching", "url": "..." },
    ...
  ]
}
</script>
```

### 2.4. Sitemap.xml

Tạo `/var/www/huongdi/public/sitemap.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://huongdi.sol.vn/p1.html</loc>
    <priority>1.0</priority>
    <changefreq>monthly</changefreq>
  </url>
  <url>
    <loc>https://huongdi.sol.vn/p2.html</loc>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://huongdi.sol.vn/p3.html</loc>
    <priority>1.0</priority>
  </url>
  <url><loc>https://huongdi.sol.vn/p3-chuyenmon.html</loc><priority>0.8</priority></url>
  <url><loc>https://huongdi.sol.vn/p3-daotao.html</loc><priority>0.8</priority></url>
  <url><loc>https://huongdi.sol.vn/p3-noidungso.html</loc><priority>0.8</priority></url>
  <url><loc>https://huongdi.sol.vn/p3-kinhdoanh.html</loc><priority>0.8</priority></url>
  <url><loc>https://huongdi.sol.vn/p3-daily.html</loc><priority>0.8</priority></url>
  <url><loc>https://huongdi.sol.vn/p3-dichvu.html</loc><priority>0.8</priority></url>
  <url><loc>https://huongdi.sol.vn/p3-dauthu.html</loc><priority>0.8</priority></url>
</urlset>
```

### 2.5. Robots.txt

Tạo `/var/www/huongdi/public/robots.txt`:

```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/

# Allow AI bots cho GEO (Gemini, ChatGPT, etc.) — quan trọng cho 2026
User-agent: GPTBot
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: PerplexityBot
Allow: /

Sitemap: https://huongdi.sol.vn/sitemap.xml
```

### 2.6. Google Search Console setup

```
1. Login https://search.google.com/search-console
2. Add property: huongdi.sol.vn (domain property)
3. Verify via DNS TXT record (Cloudflare)
4. Submit sitemap: https://huongdi.sol.vn/sitemap.xml
5. URL Inspection từng page → "Request Indexing"
```

→ 10-30 ngày Google sẽ index toàn bộ.

### 2.7. URL slug cleanup (nice-to-have)

Hiện tại URL có `.html` extension. SEO best practice: clean URL không `.html`.

Nginx rewrite trong vhost:

```nginx
# Trong server block huongdi.sol.vn
location / {
    try_files $uri $uri.html $uri/ =404;
}

# Redirect .html → clean
location ~ ^/(.+)\.html$ {
    return 301 /$1;
}
```

→ User truy cập `/p1.html` → redirect `/p1`. Google index URL clean.

---

## 3. PHASE 2 — CONTENT FOUNDATION (Tuần 2-4)

### 3.1. Pillar Page strategy — 7 trang lớn

Mỗi pillar page = "Hub" cho 1 category (chuyên môn, đào tạo, etc.). Tối thiểu 2000-2500 từ.

**Cấu trúc Pillar Page mẫu** (vd: chuyên môn):

```
URL: /freelancer-chuyen-mon-tuoi-45-cho-nguoi-tre-tuoi-trung-nien
Title: Freelancer Chuyên Môn Tuổi 45+ — 7 Hướng Đi Từ 20 Năm Kinh Nghiệm
Meta: 7 hướng freelancer cho người 40-65 từ kinh nghiệm thật. Tư vấn IT, kế toán, pháp lý, marketing — không cần tuyển dụng lại, làm chủ thời gian.

Cấu trúc bài:
1. Hero — "Tuổi 45+ tại sao freelance là hướng đi đúng?"
2. Section "Vì sao freelance phù hợp U45" (lợi thế: kinh nghiệm + uy tín, không sợ thất nghiệp, làm chủ thời gian)
3. Section "7 hướng cụ thể" — mỗi hướng 200-300 từ:
   - Tư vấn IT cho SME
   - Tư vấn kế toán cá nhân
   - Pháp lý cho startup
   - Marketing cho doanh nghiệp nhỏ
   - HR/Tuyển dụng senior
   - PM dự án
   - Coaching nghề
4. Section "5 bước bắt đầu hôm nay" (Setup LinkedIn, Pricing, Network, First client, Contract)
5. Section "Tránh 3 sai lầm phổ biến"
6. Section "Câu chuyện thật Khang Sol" (chia sẻ chuyển từ employed → freelance)
7. CTA → P1 trắc nghiệm xem mình hợp hướng nào nhất
```

### 3.2. Internal link strategy

```
sol.vn (WordPress Hub)
├── /khang-sol/ → link tới các pillar huongdi
├── Footer Master v3 → link 5 bài huongdi
└── Blog cluster "Trí":
    ├── /khoi-nghiep-tinh-gon-tuoi-trung-nien-it-von/ → link huongdi pillar chuyenmon
    ├── /stress-tuoi-trung-nien-va-cai-bay-khoi-thuoc/ → link huongdi
    └── /khoi-nghiep-tuoi-40-khang-dinh-ban-than/ → link p1 test

huongdi.sol.vn (App)
├── p1, p2, p3 ←→ 7 category pages
├── Footer → link sol.vn/khang-sol/, bothuocla.sol.vn (cross-product)
└── Author block → link sol.vn/khang-sol/ + LinkedIn
```

### 3.3. Cross-product SEO

Sol có 3 sản phẩm tạo lực kéo lẫn nhau:

```
sol.vn (DA 30+ sau 1 năm)
   ↓ link juice
bothuocla.sol.vn ←→ huongdi.sol.vn
        ↑                    ↑
   Sức khoẻ (Thân)      Sự nghiệp (Trí)
```

**Sol.vn footer** đã có link 3 trụ → mỗi page sol.vn (~100+ bài) đẩy authority đến huongdi.

---

## 4. PHASE 3 — SPOKE PAGES (37 DIRECTIONS) — Tháng 2-3

### 4.1. Mỗi direction = 1 page chi tiết

Tổng 37 trang spoke + 7 pillar = **44 trang content**.

URL pattern:
- `/huong-di/freelancer-chuyen-mon-it/`
- `/huong-di/coaching-1-1/`
- `/huong-di/blog-chuyen-mon/`
- ...

Cấu trúc mỗi spoke page (~1500-2000 từ):

```
1. Hero: tên hướng đi + tagline
2. "Hướng đi này hợp với ai?" (DNA + nguồn lực required)
3. "Mô hình kinh doanh" (revenue stream, customer, pricing)
4. "Roadmap 30/90/180 ngày" (từ DB huongdi_prod)
5. "Case study" (1 người thật đã làm — Khang's network)
6. "Tools + Resources" (cụ thể, có affiliate được)
7. "Tránh 3 sai lầm"
8. CTA → P1 test (xem mình có phù hợp không)
```

### 4.2. Backend tự sinh page từ data

Vì huongdi đã có 37 directions trong DB → có thể tạo route động:

```typescript
// backend/src/routes/seo.ts
router.get('/huong-di/:slug', async (req, res) => {
  const direction = await prisma.direction.findUnique({
    where: { slug: req.params.slug as string },
    include: { roadmaps: true, caseStudies: true }
  });
  // Render SSR HTML với meta tags + content
});
```

→ KHÔNG cần viết tay 37 page. Page tự sinh từ DB → maintainable + scalable.

### 4.3. EEAT cho YMYL Finance

Vì huongdi liên quan tài chính/kinh doanh (YMYL), Google đánh giá khắt khe:

**Mỗi page cần:**

✅ Author block rõ: "Tác giả Khang Sol, 20+ năm CNTT, không phải tư vấn tài chính có giấy phép"
✅ Disclaimer YMYL finance ở footer (đã có Master Footer v3)
✅ Schema Person với `knowsAbout` ["Lean startup", "Mid-life career", "Vietnamese SME"]
✅ Citation nguồn uy tín: Eric Ries, HBR, MPI Việt Nam, GEM Report
✅ Last updated date — show fresh content
✅ "Khang đã từng làm/chứng kiến" — first-hand experience

---

## 5. PHASE 4 — AUTHORITY + LINK BUILDING (Tháng 4-6)

### 5.1. Author authority

Khang Sol cần:

```
□ LinkedIn profile public + đầy đủ
□ Facebook page Sol công khai
□ Bài LinkedIn 1-2 lần/tháng về tái khởi nghiệp U45
□ Comment trên các nhóm Facebook "Khởi nghiệp Việt Nam"
□ Guest post 2-3 blogs Việt Nam (HRchannels, Brands Vietnam, etc.)
```

### 5.2. Backlink strategy

Free backlink methods:

| Source | Cách | Effort | Value |
|---|---|---|---|
| LinkedIn profile | Add huongdi.sol.vn vào website field | 1 phút | ⭐⭐⭐ |
| Facebook Page Sol | Link huongdi trong About | 5 phút | ⭐⭐ |
| Zalo OA | Profile link | 5 phút | ⭐⭐ |
| Medium.com Khang | Cross-post bài SEO + canonical sol.vn | 30 phút/bài | ⭐⭐⭐ |
| Diễn đàn Sốt | Trả lời câu hỏi U45 + link huongdi | 1h/tuần | ⭐⭐ |
| Vietnam Startup ecosystem | Đăng ký vào StartupCity, Startupland | 2h | ⭐⭐ |
| Báo/Tạp chí | Pitch story "U45 founder" → đăng | 2-5h/bài | ⭐⭐⭐⭐ |

### 5.3. Community building (cross-product với Sol ecosystem)

- Zalo group "Sol — U45 Tái Thiết" (đã có placeholder trong footer)
- Facebook group "Đi Cùng Sol" — đăng bài huongdi 2 lần/tuần
- Email newsletter Sol → cross-promote huongdi với bothuocla user list

---

## 6. MEASUREMENT — KPI tracking

### 6.1. Setup analytics

✅ Google Analytics 4 cross-domain (sol.vn + bothuocla + huongdi)
✅ Google Search Console — track impressions, clicks, CTR
✅ Plausible/Umami self-hosted (privacy-first analytics)

### 6.2. KPI 6 tháng

| Metric | Tháng 1 | Tháng 3 | Tháng 6 |
|---|---|---|---|
| Indexed pages | 10 | 30 | 50+ |
| Organic clicks/tháng | 50 | 300 | 1000 |
| Avg position top 20 keywords | 30+ | 15 | 8 |
| P1 test completed/tháng | 10 | 100 | 500 |
| P1 → P2 → P3 conversion | 30% | 50% | 65% |
| Cross-product (bothuocla → huongdi) | — | 5% | 15% |

### 6.3. Báo cáo monthly

```
Tháng X SEO Report — Huongdi
├── Organic traffic: X visits (+Y% MoM)
├── Top 5 keywords ranking
├── Top 5 landing pages
├── P1 completion rate
├── Issues + fixes
└── Next month plan
```

---

## 7. ACTION PLAN — 4 TUẦN ĐẦU

### Tuần 1: Foundation (Em hỗ trợ Khang)

```
□ Day 1: Em viết meta tags + Schema markup cho 10 HTML files hiện có
□ Day 2: Tạo sitemap.xml + robots.txt + OG images cơ bản
□ Day 3: Setup Google Search Console + submit sitemap
□ Day 4: Update nginx redirect .html → clean URL
□ Day 5: Add author block + footer EEAT vào mỗi page
□ Day 6-7: URL Inspection từng page → Request Indexing
```

### Tuần 2-4: Content Pillar Pages (mỗi tuần 2 trang)

```
Tuần 2:
□ Pillar #1: Freelancer Chuyên Môn U45+
□ Pillar #2: Coaching & Đào Tạo Tuổi 45+

Tuần 3:
□ Pillar #3: Content Creator U45
□ Pillar #4: Khởi Nghiệp Kinh Doanh

Tuần 4:
□ Pillar #5: Đại Lý Phân Phối
□ Pillar #6: Dịch Vụ U45
□ Pillar #7: Đấu Thầu & Hợp Đồng
```

→ Mỗi pillar 2000-2500 từ. Em hỗ trợ outline + draft 1 bài, Khang polish theo voice riêng.

### Tháng 2-3: 37 Spoke pages

Mỗi tuần 5-6 spoke pages. Em viết backend route SSR để render dynamic từ DB.

### Tháng 4-6: Authority + link building

Cross-promote + LinkedIn + guest posts + báo chí.

---

## 8. EM HỖ TRỢ NGAY HÔM NAY

Khang chốt em làm việc nào trong 4 việc dưới (theo thứ tự priority):

### (A) Inject SEO meta + Schema vào 10 HTML files
→ Em viết 1 script Node.js scan + inject. Effort: 30 phút.

### (B) Tạo sitemap.xml + robots.txt
→ 5 phút.

### (C) Viết pillar page #1 "Freelancer Chuyên Môn U45+" (2500 từ)
→ Em delegate subagent viết theo Sol voice. Effort: 1-2 giờ.

### (D) Plan & write 7 pillar pages outline
→ Em viết outline detailed 7 trang. Khang duyệt → em delegate viết. Effort: 2 giờ outline + 1 tuần subagents viết.

**Em recommend thứ tự:** **A → B → D → C** vì:
- A + B là technical (quick win)
- D xong rồi mới biết viết bài nào trước
- C là execution

---

**Phiên bản:** 1.0 — 2026-06-22
**Tác giả:** Sol AI · soạn cho launch huongdi.sol.vn
