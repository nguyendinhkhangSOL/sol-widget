# SEO Content Template v2 — AI-First, Featured Snippet Friendly

**Mục đích:** Template cho bài mới sol.vn (Sprint 31-5 và sau) — KHÔNG dùng FAQPage schema, focus AI Overviews + Featured Snippet.

**Áp dụng từ:** 22/5/2026

---

## 📋 Cấu trúc bài chuẩn (mọi loại)

```html
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">

  <!-- SEO basic -->
  <title>[Tiêu đề ≤ 60 chars + brand "| sol.vn"]</title>
  <meta name="description" content="[120-160 chars, có TL;DR + CTA]">
  <link rel="canonical" href="https://sol.vn/[slug]/">

  <!-- OG image cho social share -->
  <meta property="og:title" content="[Như title]">
  <meta property="og:description" content="[Như meta desc]">
  <meta property="og:image" content="https://sol.vn/og-images/[slug].png">
  <meta property="og:type" content="article">

  <!-- Schema JSON-LD — chọn theo loại bài (xem dưới) -->
  <script type="application/ld+json">{ ... }</script>
</head>
<body>

  <!-- ─── TL;DR (30-50 từ) — Featured Snippet candidate ─── -->
  <div class="tldr" style="background: #FBF7F0; padding: 16px; border-left: 4px solid #B25C2C; margin: 24px 0;">
    <strong>Tóm tắt:</strong> [30-50 từ trả lời câu hỏi chính bài viết.
    Phải đứng-một-mình được — không cần đọc cả bài vẫn hiểu.]
  </div>

  <!-- ─── Author block — E-E-A-T signal ─── -->
  <div class="author-meta" style="font-size: 14px; color: #5A5650; margin-bottom: 24px;">
    👤 <a href="https://sol.vn/khang-sol">Khang Sol</a> ·
    Sạch thuốc từ 22/12/2020 ·
    Cập nhật <time datetime="2026-05-31">31/5/2026</time>
  </div>

  <!-- ─── H1 + intro ─── -->
  <h1>[Tiêu đề SEO]</h1>
  <p>[Intro 50-100 từ — vào thẳng vấn đề, không lan man]</p>

  <!-- ─── H2 dạng CÂU HỎI (AI Overviews prefer) ─── -->
  <h2>[Câu hỏi 1?]</h2>
  <p>[Trả lời 100-200 từ, có số liệu cụ thể + source]</p>

  <h2>[Câu hỏi 2?]</h2>
  <p>[...]</p>

  <!-- ─── Số liệu cụ thể với source — AI cite được ─── -->
  <blockquote>
    Theo <a href="https://www.who.int/news-room/fact-sheets/detail/tobacco">WHO 2024</a>,
    hút 1 điếu giảm 11 phút tuổi thọ.
  </blockquote>

  <!-- ─── Internal links sang sol.vn wiki ─── -->
  <p>Đọc thêm:
    <a href="https://sol.vn/cai-thuoc-la-tai-nha/">Cai thuốc tại nhà</a>,
    <a href="https://sol.vn/test-muc-le-thuoc-nicotine-mien-phi/">Test FTND miễn phí</a>.
  </p>

  <!-- ─── CTA bothuocla.sol.vn (phễu lead) ─── -->
  <div class="cta-box">
    <a href="https://bothuocla.sol.vn/test-ftnd?utm_source=sol-vn&utm_campaign=[slug]">
      🚀 Bắt đầu hành trình cai thuốc với Sol →
    </a>
  </div>

</body>
</html>
```

---

## 🎯 Schema chọn theo loại bài

### 1. **HowTo** — Bài "Cách làm X" (tutorial step-by-step)

✅ Vẫn được Google render rich result 2026
✅ Phù hợp: "Cách bỏ thuốc 7 ngày", "Cách giảm điếu hút mỗi ngày"

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "Cách bỏ thuốc lá trong 7 ngày — Lộ trình Sol",
  "description": "Hướng dẫn 7 bước bỏ thuốc thành công bằng phương pháp Hybrid 5 của Sol",
  "totalTime": "P7D",
  "estimatedCost": {
    "@type": "MonetaryAmount",
    "currency": "VND",
    "value": "0"
  },
  "tool": [
    { "@type": "HowToTool", "name": "Test FTND online (90s)" },
    { "@type": "HowToTool", "name": "Sol Mentor AI" }
  ],
  "step": [
    {
      "@type": "HowToStep",
      "name": "Ngày 1 — Test mức lệ thuộc nicotine",
      "text": "Làm Test FTND 6 câu để biết mức nghiện của anh: NHẸ / TRUNG BÌNH / NẶNG",
      "url": "https://sol.vn/test-muc-le-thuoc-nicotine-mien-phi/",
      "image": "https://sol.vn/og-images/day-1-test.png"
    },
    {
      "@type": "HowToStep",
      "name": "Ngày 2 — Quan sát thói quen",
      "text": "Ghi lại mỗi điếu hút: lúc nào, vì sao, cảm xúc gì."
    }
    // ... thêm 5 steps nữa
  ],
  "author": {
    "@type": "Person",
    "name": "Khang Sol",
    "url": "https://sol.vn/khang-sol/"
  },
  "datePublished": "2026-05-31",
  "dateModified": "2026-05-31"
}
</script>
```

---

### 2. **QAPage** — Bài Q&A đơn (1 câu hỏi chính + nhiều câu phụ)

✅ Vẫn được Google support (khác `FAQPage` đã ngừng!)
✅ Phù hợp: "Bỏ thuốc bao lâu thì phổi sạch?", "7 dấu hiệu nghiện nicotine nặng"

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "QAPage",
  "mainEntity": {
    "@type": "Question",
    "name": "Bỏ thuốc bao lâu thì phổi sạch?",
    "text": "Tôi đã hút 15 năm, mỗi ngày 1 bao. Nếu bỏ hôm nay thì bao lâu phổi sẽ sạch lại?",
    "answerCount": 1,
    "upvoteCount": 0,
    "datePublished": "2026-05-31",
    "author": {
      "@type": "Person",
      "name": "Anh em hỏi"
    },
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "Theo CDC 2023: sau 20 phút huyết áp ổn, 12 giờ CO máu giảm 50%, 2 tuần tuần hoàn tốt hơn, 1-9 tháng ho giảm hẳn, 1 năm nguy cơ tim mạch giảm 50%, 10 năm nguy cơ ung thư phổi giảm 50%.",
      "url": "https://sol.vn/cai-thuoc-bao-lau-phoi-sach/#acceptedAnswer",
      "upvoteCount": 0,
      "datePublished": "2026-05-31",
      "author": {
        "@type": "Person",
        "name": "Khang Sol",
        "url": "https://sol.vn/khang-sol/"
      }
    }
  }
}
</script>
```

---

### 3. **Article** — Bài thông tin/story (default cho most)

✅ Đã có sẵn ở 125 bài (task #26)
✅ Phù hợp: "Khang sạch thuốc 5 năm", "5 lý do người Việt thất bại"

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "[Tiêu đề ≤ 110 chars]",
  "description": "[120-160 chars]",
  "image": "https://sol.vn/og-images/[slug].png",
  "datePublished": "2026-05-31T07:00:00+07:00",
  "dateModified": "2026-05-31T07:00:00+07:00",
  "author": {
    "@type": "Person",
    "name": "Khang Sol",
    "url": "https://sol.vn/khang-sol/",
    "sameAs": [
      "https://www.facebook.com/khangsol",
      "https://www.linkedin.com/in/khangsol"
    ]
  },
  "publisher": {
    "@type": "Organization",
    "name": "Đi Cùng Sol",
    "url": "https://sol.vn/",
    "logo": {
      "@type": "ImageObject",
      "url": "https://sol.vn/logo.png"
    }
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://sol.vn/[slug]/"
  }
}
</script>
```

---

## 📐 Featured Snippet checklist

Bài MUỐN xuất hiện ở vị trí 0 Google:

- [ ] **TL;DR 30-50 từ** ở đầu bài (có thể quote nguyên)
- [ ] **H2 dạng câu hỏi** (vd "Cách bỏ thuốc bao lâu thì phổi sạch?")
- [ ] **Câu trả lời ngay sau H2** trong 1 paragraph 40-60 từ
- [ ] **Bullet list / numbered list** cho step hoặc reason
- [ ] **Comparison table** nếu bài "X vs Y"
- [ ] **Số liệu cụ thể** (vd "11 phút" không phải "vài phút")
- [ ] **Source cite link** (WHO/CDC/Bộ Y tế VN)

---

## 🤖 AI Overviews checklist

Bài MUỐN được AI (ChatGPT, Claude, Perplexity, Gemini) cite:

- [ ] Schema sạch (HowTo/QAPage/Article — không FAQ)
- [ ] Author block visible với credentials ("Sạch thuốc từ 2021")
- [ ] Citation hooks ("Theo WHO 2024, ...")
- [ ] Internal links dày 5+ → topical authority
- [ ] Update date visible
- [ ] H2/H3 hierarchy logic
- [ ] Definition box ("Test FTND là gì? Là bộ test 6 câu đo mức nghiện nicotine chuẩn quốc tế từ 1991...")
- [ ] llms.txt entry (đã có sẵn cho cả site)

---

## ✅ Khang viết bài Sprint 31-5

1. Copy template HTML phù hợp (HowTo / QAPage / Article)
2. Fill content theo outline em sẽ propose
3. SEO title ≤ 60 chars + brand "| sol.vn"
4. Meta desc 120-160 chars có TL;DR + CTA
5. OG image generate qua `scripts/wp-publisher/og-gen.py`
6. Publish qua `scripts/wp-publisher/_lib.js` API call
7. Submit URL vào GSC sitemap manual

Sau publish:
- [ ] Kiểm tra Google Rich Results Test
- [ ] Submit URL vào GSC URL Inspection → Request Indexing
- [ ] Add internal link từ bài khác trỏ về
- [ ] Monitor GSC sau 2-7 ngày

---

## 📚 Tham khảo nhanh

- **Schema validator**: https://validator.schema.org/
- **Rich Results Test**: https://search.google.com/test/rich-results
- **GSC URL Inspection**: https://search.google.com/search-console
- **AI Overviews docs**: https://developers.google.com/search/docs/appearance/ai-overviews
- **Sol decision doc**: `docs/SEO_GOOGLE_FAQ_DEPRECATION_2026.md`
