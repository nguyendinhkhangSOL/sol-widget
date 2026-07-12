# Sol.vn — Tái cấu trúc trang chủ + Footer EEAT/YMYL cho dual-product

> **Câu hỏi Khang:**
> **1.** Trang chủ sol.vn hiện tối đa thông tin bothuocla → cần đại diện cả 2 sản phẩm
> **2.** Chân trang bài viết chỉ hỗ trợ bỏ thuốc — huongdi cần phương án EEAT/YMYL về tài chính
>
> **Tác giả phân tích:** Sol AI · **Ngày:** 2026-06-16

---

## TỔNG QUAN: Vì sao 2 vấn đề này CRITICAL trước launch huongdi

Cả 2 sản phẩm Sol (bothuocla + huongdi) đều rơi vào **YMYL** (Your Money or Your Life) — danh mục Google đánh giá KHẮT KHE NHẤT:

- **Bothuocla** = sức khoẻ → YMYL health
- **Huongdi** = tài chính/sự nghiệp → YMYL finance

Mà Google E-E-A-T (Experience-Expertise-Authoritativeness-Trustworthiness) PHẢI ĐƯỢC THỂ HIỆN ngay trên footer + author box của TỪNG bài, không phải chỉ trên About page.

Nếu sol.vn không sửa 2 vấn đề này trước khi launch huongdi:
- Bài SEO khởi nghiệp sẽ bị Google **giảm rank** vì footer "không liên quan"
- Google Quality Rater **không thấy expertise** về tài chính → giảm trust toàn site
- Bothuocla bài có thể bị **kéo theo** vì site-wide signal mismatch

---

# PHẦN 1 — TÁI CẤU TRÚC TRANG CHỦ sol.vn

## 1.1. Vấn đề hiện tại

**Hiện trạng (em đọc qua /khang-sol/ + menu sol.vn):**

```
Menu: [Cai thuốc] [Wiki] [Tâm] [Bắt đầu]
       ─────┬────                   ──┬──
            └─ Toàn bộ về bothuocla    └─ Trỏ bothuocla.sol.vn
```

→ Trang chủ là **landing trang đơn sản phẩm**, không phải hub đa sản phẩm.

## 1.2. Đề xuất kiến trúc thông tin mới

### Mô hình "Hub + 2 trụ cột"

```
sol.vn (Hub Trung tâm)
├── /khang-sol/                ← Founder story (NẾU đa sản phẩm thì link 2 cluster)
│
├── 🌱 Trụ cột SỨC KHOẺ
│   ├── /bo-thuoc-la/          ← Pillar landing cluster
│   ├── /wiki/                 ← Wiki cai thuốc
│   ├── /lo-trinh-7-ngay/      ← Featured article
│   └── → bothuocla.sol.vn     ← App
│
├── 🚀 Trụ cột SỰ NGHIỆP
│   ├── /khoi-nghiep-trung-nien/  ← Pillar landing cluster (MỚI)
│   ├── /huong-di/             ← Wiki khởi nghiệp (MỚI)
│   ├── /tuong-kinh-doanh-it-von-nguoi-trung-nien/  ← Featured article
│   └── → huongdi.sol.vn       ← App
│
├── /ngam/                     ← Blog lifestyle/triết lý (chung 2 trụ)
└── /lien-he/, /ve-sol/, /chinh-sach/  ← Trust pages
```

### Menu mới (đề xuất)

```
Desktop:
┌────────────────────────────────────────────────────────────────────┐
│ 🌅 Đi Cùng Sol                                                     │
│                                                                    │
│ Sức khoẻ ▾ | Sự nghiệp ▾ | Tâm | Khang Sol | Bắt đầu ▾           │
│   │           │                              │                     │
│   │           │                              ├── 🌱 Bỏ thuốc lá    │
│   │           │                              └── 🚀 Tìm hướng đi  │
│   │           │
│   │           ├── Tổng quan
│   │           ├── 37 hướng đi (Wiki)
│   │           ├── Khởi nghiệp tinh gọn
│   │           └── Trắc nghiệm hướng đi
│   │
│   ├── Tổng quan
│   ├── Wiki cai thuốc
│   ├── Lộ trình 7 ngày
│   └── Test FTND
└────────────────────────────────────────────────────────────────────┘

Mobile: hamburger menu collapse tương tự
```

## 1.3. Mockup Hero Section (Above the Fold)

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│      Đi Cùng Sol                                            │
│      ──────────                                              │
│                                                              │
│      "20 năm CNTT. 30 năm hút thuốc. 5 năm tự do."         │
│                                                              │
│      Sol đi cùng đàn ông Việt 45+ trên 2 mặt trận           │
│      để TÁI THIẾT giai đoạn 2 của cuộc đời.                 │
│                                                              │
│   ┌─────────────────────┐  ┌─────────────────────┐         │
│   │  🌱  SỨC KHOẺ       │  │  🚀  SỰ NGHIỆP      │         │
│   │  ─────────          │  │  ─────────           │         │
│   │  Bỏ thuốc lá        │  │  Tìm hướng tái      │         │
│   │  cho U45            │  │  khởi nghiệp        │         │
│   │                     │  │                      │         │
│   │  Lộ trình 35-65     │  │  37 hướng đi —      │         │
│   │  ngày theo cohort   │  │  trắc nghiệm DNA    │         │
│   │  FTND. 5 năm tự     │  │  + nguồn lực 8 trục.│         │
│   │  do Vinataba.       │  │  20 năm trải nghiệm.│         │
│   │                     │  │                      │         │
│   │  [Bắt đầu →]        │  │  [Khám phá →]       │         │
│   │  bothuocla.sol.vn   │  │  huongdi.sol.vn     │         │
│   └─────────────────────┘  └─────────────────────┘         │
│                                                              │
│                                                              │
│      ❝ Sol không phải app cai thuốc. Cũng không phải        │
│        app hướng nghiệp.                                     │
│                                                              │
│        Sol là người đi trước — đã sống qua, đã làm được —    │
│        đi cùng anh em U45 trên hành trình tái thiết. ❞      │
│                                       — Khang Sol, sáng lập │
└──────────────────────────────────────────────────────────────┘
```

## 1.4. Cấu trúc nội dung dưới Hero

### Section 2 — "Vì sao 2 sản phẩm?"

Narrative nối 2 trụ thành 1 câu chuyện chung của Khang. Tránh user nghĩ "sao founder cai thuốc lại làm coaching khởi nghiệp":

> **"Mình không chia 2 con người ra. Mình chia 2 nỗi đau.**
>
> Trong 30 năm hút Vinataba, mình vừa lập trình vừa quản trị dự án IT. Hai
> thử thách lớn nhất đời mình: **làm chủ cơ thể** (cai thuốc) và **làm chủ
> sự nghiệp** (khởi nghiệp lại ở tuổi 45+).
>
> Mình đã đi qua cả hai. Giờ mình muốn đi cùng anh em.
>
> **Sol = 2 ứng dụng cho 2 mặt trận đó — cùng 1 người đi trước.**"

### Section 3 — "Bothuocla — Sức khoẻ" card lớn

- Hero: ảnh Khang đứng trước Yulong Snow Mountain (đã có)
- Stats: "X user đã hoàn thành lộ trình", "Y kg phổi sạch hơn"
- Featured posts: 3 bài SEO hot (Lộ trình 7 ngày · Ho có đờm · Hút thụ động)
- CTA: "Đo Mức Lệ Thuộc Nicotin (FTND) miễn phí 90 giây" → bothuocla.sol.vn/test-ftnd

### Section 4 — "Huongdi — Sự nghiệp" card lớn

- Hero: ảnh Khang trong văn phòng (vest xanh — đã có)
- Stats: "37 hướng đi đã lập bản đồ", "20+ năm trải nghiệm CNTT/quản trị"
- Featured posts: 3 bài cluster trung niên (Khởi nghiệp tinh gọn · Stress khói thuốc · Khẳng định 40+)
- CTA: "Khám phá hướng đi của anh — 20 câu hỏi DNA" → huongdi.sol.vn/p1

### Section 5 — Wiki Hub (2 cluster song song)

```
┌─────────────────────────────┬─────────────────────────────┐
│  📚 WIKI BỎ THUỐC          │  📚 WIKI KHỞI NGHIỆP       │
│  (~30 bài)                  │  (~37 hướng + bài bổ trợ)  │
│                             │                             │
│  • Lộ trình 7 ngày          │  • Khởi nghiệp tinh gọn    │
│  • Cơ chế nicotine          │  • Stress & khói thuốc     │
│  • 7 dấu hiệu nghiện nặng   │  • Khẳng định bản thân 40+ │
│  • Cách bỏ thuốc 88 ngày    │  • 37 hướng đi (coming)    │
│  • [Xem tất cả →]           │  • [Xem tất cả →]          │
└─────────────────────────────┴─────────────────────────────┘
```

### Section 6 — Khang Sol founder block (NEW)

Tóm tắt /khang-sol/ với 2 angle:
- **Health credential:** 30 năm hút Vinataba, 5 năm tự do (Experience)
- **Career credential:** 20+ năm CNTT + quản trị (Expertise)
- Photo Yulong (symbol "đã chinh phục")
- CTA: "Đọc câu chuyện đầy đủ →"

### Section 7 — Social proof / Trust signals

- "X user đang đi cùng Sol"
- 3 testimonial thật (sau khi có user)
- Logo media nếu được đưa lên (báo Sức khoẻ và Đời sống, VnExpress, etc.)
- Trust badges: SSL, "Đăng ký Bộ Thông tin & Truyền thông" (nếu đủ điều kiện)

### Section 8 — Footer chung (chi tiết trong Phần 2)

---

# PHẦN 2 — FOOTER SYSTEM EEAT/YMYL

## 2.1. Vấn đề hiện tại

Footer bài viết sol.vn hiện chỉ phù hợp YMYL health:

```
🚨 Khẩn cấp y tế (đau ngực, khó thở, ngất, ho ra máu)
gọi 115 NGAY

KHÔNG gọi tổng đài Sol cho cấp cứu

Tổng đài cai thuốc miễn phí BV Bạch Mai: 0888-008-866
```

Khi user đọc bài "Khởi nghiệp tinh gọn tuổi trung niên" mà thấy footer này → **mismatch tín hiệu** → Google penalize.

## 2.2. Đề xuất "Smart Footer" — phân loại theo category

Logic: WordPress có hệ thống category. Footer dùng PHP/JS render theo category bài.

```php
// theme functions.php (giả mã)
function sol_get_footer_type() {
    $cats = get_the_category();
    foreach ($cats as $c) {
        if (in_array($c->slug, ['wiki-bo-thuoc-la', 'cai-thuoc', 'suc-khoe']))
            return 'health';
        if (in_array($c->slug, ['khoi-nghiep', 'trung-nien', 'huong-di', 'tai-chinh']))
            return 'career';
    }
    return 'general';
}
```

### Footer chung (luôn render trên mọi bài)

```
┌──────────────────────────────────────────────────────────────┐
│  Đi Cùng Sol — Bỏ thuốc lá khi nào anh quyết               │
│                                                              │
│  📞 024 3993 1800 (giờ hành chính)                          │
│  ✉️ contact@sol.vn                                          │
│                                                              │
│  [Chính sách bảo mật] · [Điều khoản] · [Tuyên bố miễn trừ] │
│  [Về Sol] · [Liên hệ] · [Khang Sol]                         │
│                                                              │
│  © 2026 Sol — Khang Sol (Nguyễn Đình Khang) · sol.vn        │
│                                                              │
│  Sol là dự án cá nhân của Khang Sol. Sol KHÔNG kê đơn,      │
│  KHÔNG chẩn đoán, KHÔNG đảm bảo kết quả kinh doanh.         │
└──────────────────────────────────────────────────────────────┘
```

### Footer category "HEALTH" (cluster bothuocla)

```
┌──────────────────────────────────────────────────────────────┐
│  🚨 HỖ TRỢ Y TẾ KHẨN CẤP                                   │
│  ────────────────────────                                   │
│  Đau ngực, khó thở, ngất, ho ra máu → gọi 115 NGAY         │
│  Tổng đài Ngày Mai (sức khoẻ tâm thần): 1900 599958        │
│  Tổng đài cai thuốc BV Bạch Mai: 0888-008-866              │
│                                                              │
│  ───────────────────                                        │
│                                                              │
│  📚 NGUỒN THAM KHẢO Y KHOA                                  │
│  • CDC — Centers for Disease Control                        │
│  • NHS UK — Quit Smoking                                    │
│  • Surgeon General (Hoa Kỳ)                                 │
│  • Bộ Y tế Việt Nam (moh.gov.vn)                            │
│  • VINACOSH — Chương trình PCTH thuốc lá Việt Nam           │
│                                                              │
│  ⚠️ TUYÊN BỐ MIỄN TRỪ Y KHOA                                │
│  Số liệu khoa học là tham khảo, không thay thế tư vấn       │
│  bác sĩ. Khang Sol KHÔNG phải bác sĩ, không có bằng cấp     │
│  y khoa. Trước khi áp dụng bất kỳ phương pháp nào, hãy      │
│  tham vấn bác sĩ chuyên khoa hô hấp hoặc tâm thần.          │
└──────────────────────────────────────────────────────────────┘
```

### Footer category "CAREER" (cluster huongdi) — **MỚI**

```
┌──────────────────────────────────────────────────────────────┐
│  💼 KHỞI NGHIỆP TRUNG NIÊN — HỖ TRỢ THỰC TẾ                │
│  ──────────────────────────────────────                     │
│  Hiệp hội Doanh nhân trẻ Việt Nam: 024 3974 3030           │
│  Cổng thông tin Khởi nghiệp QG: startup.gov.vn              │
│  Bộ Kế hoạch & Đầu tư — Cục Phát triển DN: 024 3845 5298   │
│                                                              │
│  ───────────────────                                        │
│                                                              │
│  📚 NGUỒN THAM KHẢO KHỞI NGHIỆP                             │
│  • Eric Ries — The Lean Startup (2011)                      │
│  • Simon Sinek — Start with Why (2009)                      │
│  • Harvard Business Review (hbr.org)                        │
│  • Bộ Kế hoạch & Đầu tư (mpi.gov.vn)                        │
│  • Decision Lab — báo cáo hành vi tiêu dùng Việt Nam        │
│  • CB Insights — Startup ecosystem reports                  │
│                                                              │
│  ⚠️ TUYÊN BỐ MIỄN TRỪ TÀI CHÍNH/KINH DOANH                  │
│                                                              │
│  Bài viết phục vụ giáo dục, KHÔNG phải tư vấn tài chính     │
│  cá nhân. Khang Sol KHÔNG phải nhà tư vấn tài chính có      │
│  giấy phép, không kê khai trước Ủy ban Chứng khoán Nhà      │
│  nước. Sol KHÔNG cam kết thu nhập, KHÔNG đảm bảo thành      │
│  công kinh doanh.                                            │
│                                                              │
│  Mọi quyết định khởi nghiệp đều có rủi ro. Hãy tham vấn     │
│  với chuyên gia tài chính, luật sư doanh nghiệp, và kế      │
│  toán viên trước khi đầu tư.                                 │
└──────────────────────────────────────────────────────────────┘
```

### Footer category "GENERAL/NGẪM" (bài lifestyle/triết lý)

```
┌──────────────────────────────────────────────────────────────┐
│  💭 ĐI CÙNG SOL — 2 TRỤ CỘT                                │
│  ─────────────────                                          │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐                    │
│  │  🌱 Sức khoẻ   │  │  🚀 Sự nghiệp  │                    │
│  │  Bỏ thuốc lá   │  │  Tìm hướng đi   │                    │
│  │  [bothuocla →] │  │  [huongdi →]   │                    │
│  └────────────────┘  └────────────────┘                    │
│                                                              │
│  Sol đi cùng anh em U45 Việt Nam trong giai đoạn 2          │
│  của cuộc đời — không vội, không hô hào, đáng tin.          │
└──────────────────────────────────────────────────────────────┘
```

---

## 2.3. AUTHOR BOX — credentials theo cluster

Hiện sol.vn chưa có author box dưới mỗi bài (em check qua /khang-sol/). Thêm "Author Box" smart:

### Author box cho cluster "HEALTH"

```
┌──────────────────────────────────────────────────────────────┐
│  ┌─────┐  KHANG SOL                                          │
│  │ 📷  │  Người sáng lập Đi Cùng Sol                        │
│  └─────┘                                                     │
│                                                              │
│  🚬 Trải nghiệm: 30 năm hút Vinataba (1991-2021)           │
│  ✅ Đã cai: 5+ năm tự do nicotine từ 22/12/2020 âm lịch     │
│  📚 Cách tham khảo: CDC, NHS, Surgeon General, BV Bạch Mai  │
│                                                              │
│  ⚠️ Khang Sol KHÔNG phải bác sĩ. Bài này phục vụ giáo dục,  │
│     không thay thế tư vấn y tế cá nhân.                      │
│                                                              │
│  🔗 Đọc thêm về Khang →                                     │
│  🔗 LinkedIn: linkedin.com/in/vietnaminternet                │
└──────────────────────────────────────────────────────────────┘
```

### Author box cho cluster "CAREER"

```
┌──────────────────────────────────────────────────────────────┐
│  ┌─────┐  KHANG SOL                                          │
│  │ 📷  │  Người sáng lập Đi Cùng Sol                        │
│  └─────┘                                                     │
│                                                              │
│  💼 Trải nghiệm: 20+ năm dân CNTT, quản trị dự án từ 1995   │
│  🏗️ Khởi nghiệp: Sol (2026), dự án trước CTO/PM nhiều cty   │
│  📚 Cách tham khảo: Eric Ries, Simon Sinek, HBR, MPI Việt Nam│
│                                                              │
│  ⚠️ Khang Sol KHÔNG phải nhà tư vấn tài chính có giấy phép.  │
│     Bài này không phải tư vấn đầu tư cá nhân, không cam      │
│     kết thu nhập.                                             │
│                                                              │
│  🔗 Đọc thêm về Khang →                                     │
│  🔗 LinkedIn: linkedin.com/in/vietnaminternet                │
└──────────────────────────────────────────────────────────────┘
```

---

## 2.4. Schema.org markup — phải có cho EEAT

Mỗi bài (cả 2 cluster) chèn JSON-LD:

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "...",
  "author": {
    "@type": "Person",
    "name": "Khang Sol",
    "url": "https://sol.vn/khang-sol/",
    "image": "https://sol.vn/wp-content/uploads/2026/05/khang-portrait-yulong-mountain.jpg",
    "sameAs": [
      "https://www.linkedin.com/in/vietnaminternet/",
      "https://web.facebook.com/nguyendinhkhang",
      "https://sol.vn/khang-sol/"
    ],
    "jobTitle": "Founder, Đi Cùng Sol",

    // BỔ SUNG knowsAbout theo category:
    // - Cluster health:
    "knowsAbout": [
      "Smoking cessation",
      "Nicotine dependence",
      "FTND (Fagerström Test)",
      "Vietnamese smoking culture"
    ]
    // - Cluster career:
    // "knowsAbout": [
    //   "Lean Startup",
    //   "Vietnamese SME entrepreneurship",
    //   "Mid-life career transition",
    //   "IT project management"
    // ]
  },
  "publisher": {
    "@type": "Organization",
    "name": "Đi Cùng Sol",
    "url": "https://sol.vn/",
    "logo": {
      "@type": "ImageObject",
      "url": "https://sol.vn/wp-content/uploads/2025/05/Icon_2.png"
    },
    "sameAs": [
      "https://www.linkedin.com/company/sol-vn/",
      "https://www.facebook.com/solvn/"
    ]
  },
  "datePublished": "...",
  "dateModified": "...",
  "mainEntityOfPage": "https://sol.vn/..."
}
```

**Quan trọng cho YMYL:** Thêm field `reviewedBy` nếu có expert review:

```json
"reviewedBy": {
  "@type": "Person",
  "name": "BS Nguyễn Văn X (chuyên khoa Hô hấp, BV Bạch Mai)",
  "jobTitle": "Bác sĩ chuyên khoa I"
}
```

→ Đây là **medical review badge** — cực mạnh cho YMYL health. (Nếu Khang chưa có BS review, tạm để trống, đừng bịa).

---

## 2.5. Trust Pages — SOL CẦN CÓ ĐỦ TRƯỚC LAUNCH huongdi

Google E-E-A-T check site-wide các page:

| Page | Hiện trạng | Đề xuất |
|---|---|---|
| `/khang-sol/` | ✅ Có, mạnh | Update thêm career credentials |
| `/chinh-sach-bao-mat` | ❓ Cần verify | Update mention huongdi |
| `/dieu-khoan-su-dung` | ❓ Cần verify | Update mention huongdi |
| `/tuyen-bo-mien-tru` | ❓ Cần verify | Tách 2 phần: y khoa + tài chính |
| `/ve-sol/` (About) | ❓ Có thể chưa có | **PHẢI tạo** — narrative 2 trụ cột |
| `/lien-he/` | ❓ Cần verify | Email + phone real, NOT contact form chỉ |
| `/khang-sol/` author | ✅ Có | Verify schema.org Person có URL canonical |

---

# PHẦN 3 — IMPLEMENTATION PLAN

## 3.1. Roadmap 4 tuần (trước launch huongdi)

### Tuần 1: Trust pages + Footer system

```
□ Tạo /ve-sol/ — landing About 2 trụ cột
□ Update /chinh-sach-bao-mat — mention huongdi
□ Update /tuyen-bo-mien-tru — tách health vs finance disclaimer
□ Code WordPress footer.php smart (3 mode: health/career/general)
□ Test footer render đúng theo category bài
```

### Tuần 2: Author box + Schema

```
□ Code WP template author box smart (2 mode health/career)
□ Update Article JSON-LD all existing posts:
  - sameAs (LinkedIn, FB, /khang-sol/)
  - knowsAbout theo category
  - publisher Organization
□ Test rich result với Google Rich Results Test
□ Submit sitemap sau update
```

### Tuần 3: Homepage redesign

```
□ Mockup design 8 sections trong Figma
□ Khang duyệt mockup
□ Code WP custom homepage template
□ Update menu cấu trúc dropdown 2 trụ cột
□ Migrate content (giữ bothuocla + add huongdi placeholder)
```

### Tuần 4: QA + Launch huongdi cluster

```
□ Mobile test hero section + 2 product cards
□ Speed test (Lighthouse score > 90)
□ Verify cross-browser
□ Khang preview, approve
□ Go live trang chủ mới
□ Launch huongdi pillar landing /khoi-nghiep-trung-nien/
□ Submit GSC URL Inspection
```

## 3.2. WordPress code skeleton

### `theme-sol/inc/footer-helper.php`

```php
<?php
/**
 * Sol footer category detection
 * Return: 'health' | 'career' | 'general'
 */
function sol_get_footer_type() {
    if ( ! is_singular() ) return 'general';

    $cats = get_the_category();
    $health_slugs = ['wiki-bo-thuoc-la', 'cai-thuoc', 'suc-khoe', 'nicotine'];
    $career_slugs = ['khoi-nghiep', 'trung-nien', 'huong-di', 'tai-chinh',
                     'kinh-doanh', 'su-nghiep'];

    foreach ($cats as $c) {
        if (in_array($c->slug, $health_slugs)) return 'health';
        if (in_array($c->slug, $career_slugs)) return 'career';
    }
    return 'general';
}

/**
 * Render smart footer block
 */
function sol_render_footer_block() {
    $type = sol_get_footer_type();
    get_template_part('partials/footer', $type);  // footer-health.php, etc.
}
```

### `theme-sol/partials/footer-health.php`

```html
<div class="sol-footer-block sol-footer-health">
  <h3>🚨 Hỗ trợ y tế khẩn cấp</h3>
  <ul>
    <li>Đau ngực, khó thở → gọi <a href="tel:115">115</a> NGAY</li>
    <li>Tổng đài Ngày Mai (tâm lý): <a href="tel:1900599958">1900 599958</a></li>
    <li>Tổng đài cai thuốc BV Bạch Mai: <a href="tel:0888008866">0888-008-866</a></li>
  </ul>

  <h4>📚 Nguồn tham khảo y khoa</h4>
  <ul>
    <li><a href="https://www.cdc.gov/tobacco/" rel="noopener" target="_blank">CDC — Tobacco</a></li>
    <li><a href="https://www.nhs.uk/live-well/quit-smoking/" rel="noopener" target="_blank">NHS UK — Quit Smoking</a></li>
    <li><a href="https://www.surgeongeneral.gov/library/reports/" rel="noopener" target="_blank">Surgeon General Reports</a></li>
    <li><a href="https://moh.gov.vn/" rel="noopener" target="_blank">Bộ Y tế Việt Nam</a></li>
  </ul>

  <p class="disclaimer">
    ⚠️ <strong>Tuyên bố miễn trừ y khoa:</strong> Số liệu khoa học là tham
    khảo, không thay thế tư vấn bác sĩ. Khang Sol KHÔNG phải bác sĩ. Hãy
    tham vấn chuyên khoa hô hấp/tâm thần trước khi áp dụng.
  </p>
</div>
```

### `theme-sol/partials/footer-career.php`

```html
<div class="sol-footer-block sol-footer-career">
  <h3>💼 Khởi nghiệp trung niên — Hỗ trợ thực tế</h3>
  <ul>
    <li>Hiệp hội Doanh nhân trẻ VN: 024 3974 3030</li>
    <li>Cổng Khởi nghiệp QG: <a href="https://startup.gov.vn" rel="noopener" target="_blank">startup.gov.vn</a></li>
    <li>MPI — Cục Phát triển DN: 024 3845 5298</li>
  </ul>

  <h4>📚 Nguồn tham khảo khởi nghiệp</h4>
  <ul>
    <li>Eric Ries — <em>The Lean Startup</em> (2011)</li>
    <li>Simon Sinek — <em>Start with Why</em> (2009)</li>
    <li><a href="https://hbr.org/" rel="noopener" target="_blank">Harvard Business Review</a></li>
    <li><a href="https://www.mpi.gov.vn/" rel="noopener" target="_blank">Bộ Kế hoạch & Đầu tư</a></li>
  </ul>

  <p class="disclaimer">
    ⚠️ <strong>Tuyên bố miễn trừ tài chính/kinh doanh:</strong> Bài viết
    phục vụ giáo dục, KHÔNG phải tư vấn tài chính cá nhân. Khang Sol
    KHÔNG phải nhà tư vấn tài chính có giấy phép. Sol KHÔNG cam kết thu
    nhập. Hãy tham vấn chuyên gia tài chính/luật sư trước khi đầu tư.
  </p>
</div>
```

### `theme-sol/inc/author-box.php`

```php
<?php
/**
 * Render author box theo cluster
 */
function sol_render_author_box() {
    $type = sol_get_footer_type();
    $photo = 'https://sol.vn/wp-content/uploads/2026/05/khang-portrait-yulong-mountain.jpg';
    ?>
    <div class="sol-author-box sol-author-<?php echo esc_attr($type); ?>">
        <img src="<?php echo $photo; ?>" alt="Khang Sol" />
        <div class="sol-author-content">
            <h3>KHANG SOL</h3>
            <p class="sol-author-role">Người sáng lập Đi Cùng Sol</p>

            <?php if ($type === 'health'): ?>
                <ul class="sol-author-creds">
                    <li>🚬 Trải nghiệm: 30 năm hút Vinataba (1991-2021)</li>
                    <li>✅ Đã cai: 5+ năm tự do nicotine từ 22/12/2020 âm lịch</li>
                    <li>📚 Tham khảo: CDC, NHS, Surgeon General, BV Bạch Mai</li>
                </ul>
                <p class="sol-author-disclaimer">
                    ⚠️ Khang Sol KHÔNG phải bác sĩ. Bài này phục vụ giáo dục,
                    không thay thế tư vấn y tế cá nhân.
                </p>
            <?php elseif ($type === 'career'): ?>
                <ul class="sol-author-creds">
                    <li>💼 Trải nghiệm: 20+ năm CNTT + quản trị dự án từ 1995</li>
                    <li>🏗️ Khởi nghiệp: Sol (2026), dự án trước CTO/PM</li>
                    <li>📚 Tham khảo: Lean Startup, HBR, MPI Việt Nam</li>
                </ul>
                <p class="sol-author-disclaimer">
                    ⚠️ Khang Sol KHÔNG phải nhà tư vấn tài chính có giấy phép.
                    Bài này không cam kết thu nhập kinh doanh.
                </p>
            <?php endif; ?>

            <a href="/khang-sol/" class="sol-author-link">
                🔗 Đọc câu chuyện đầy đủ về Khang →
            </a>
            <p class="sol-author-social">
                LinkedIn: <a href="https://linkedin.com/in/vietnaminternet" target="_blank">vietnaminternet</a>
            </p>
        </div>
    </div>
    <?php
}
```

### Schema markup hook

```php
add_action('wp_head', 'sol_inject_article_schema');

function sol_inject_article_schema() {
    if (!is_single()) return;

    $type = sol_get_footer_type();

    $knows_about_health = [
        "Smoking cessation",
        "Nicotine dependence",
        "FTND (Fagerström Test)",
        "Vietnamese smoking culture"
    ];

    $knows_about_career = [
        "Lean Startup",
        "Vietnamese SME entrepreneurship",
        "Mid-life career transition",
        "IT project management"
    ];

    $knows_about = ($type === 'career') ? $knows_about_career : $knows_about_health;

    $schema = [
        "@context" => "https://schema.org",
        "@type" => "Article",
        "headline" => get_the_title(),
        "author" => [
            "@type" => "Person",
            "name" => "Khang Sol",
            "url" => "https://sol.vn/khang-sol/",
            "image" => "https://sol.vn/wp-content/uploads/2026/05/khang-portrait-yulong-mountain.jpg",
            "sameAs" => [
                "https://www.linkedin.com/in/vietnaminternet/",
                "https://web.facebook.com/nguyendinhkhang",
                "https://sol.vn/khang-sol/"
            ],
            "jobTitle" => "Founder, Đi Cùng Sol",
            "knowsAbout" => $knows_about
        ],
        "publisher" => [
            "@type" => "Organization",
            "name" => "Đi Cùng Sol",
            "url" => "https://sol.vn/",
            "logo" => [
                "@type" => "ImageObject",
                "url" => "https://sol.vn/wp-content/uploads/2025/05/Icon_2.png"
            ]
        ],
        "datePublished" => get_the_date('c'),
        "dateModified" => get_the_modified_date('c'),
        "mainEntityOfPage" => get_permalink()
    ];

    echo "\n<script type=\"application/ld+json\">\n";
    echo wp_json_encode($schema, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    echo "\n</script>\n";
}
```

---

## 3.3. Cách quản lý category mới cho huongdi

### Tạo category WordPress mới (trước khi publish bài huongdi):

```
WordPress Admin → Posts → Categories → Add New
├── khoi-nghiep            (Khởi nghiệp)
├── trung-nien             (Trung niên)
├── huong-di               (Hướng đi)
├── tai-chinh              (Tài chính cá nhân)
├── kinh-doanh             (Kinh doanh)
└── su-nghiep              (Sự nghiệp)
```

Sau khi tạo, smart footer + author box sẽ tự nhận category huongdi và render footer-career.php.

---

# PHẦN 4 — KPI ĐO LƯỜNG SAU KHI LAUNCH

| Metric | Baseline | Target (3 tháng sau) |
|---|---|---|
| Trang chủ sol.vn — Bounce rate | ? | < 60% |
| Cross-product click (bothuocla ↔ huongdi card) | 0 | > 5% homepage CTR |
| Average session (sol.vn) | ? | > 2 phút |
| Rich Result eligibility | 0% | > 90% bài |
| YMYL Google Quality Rater score (estimate) | 5/10 | 8/10 |
| huongdi cluster — organic traffic | 0 | > 500/tháng |
| Cross-cluster reading (user đọc cả health + career) | 0 | > 15% |

Tools đo:
- Google Search Console
- Google Analytics 4 (cross-domain tracking — em đã đề cập trong doc tích hợp)
- Lighthouse CI
- Schema.org Validator

---

# PHẦN 5 — CHECKLIST HÀNH ĐỘNG CHO KHANG

```
─── DECISION ───────────────────────────────────────
□  Duyệt mockup hero section 2-card design
□  Quyết menu mới (2 cluster dropdown)
□  Quyết tên cluster "huong-di" cho huongdi (slug)
□  Cung cấp ảnh Khang vest xanh cho author box career

─── CONTENT ───────────────────────────────────────
□  Viết bài /ve-sol/ — About 2 trụ cột
□  Update /khang-sol/ thêm credentials career
□  Update /tuyen-bo-mien-tru/ tách 2 phần
□  Update /chinh-sach-bao-mat/ + /dieu-khoan/ mention huongdi

─── TECHNICAL ──────────────────────────────────────
□  Giao team code WP implement smart footer + author box
□  Giao team code WP implement schema injection hook
□  Test mọi category render đúng footer
□  Submit GSC sau khi go live

─── SEO ────────────────────────────────────────────
□  Tạo 6 category huongdi mới trên WP
□  Plan 10-15 bài SEO cluster huongdi đầu tiên
□  Internal link giữa 2 cluster (sức khoẻ ↔ sự nghiệp)
□  External authority links (CDC, NHS, HBR, MPI...)
```

---

# TÓM TẮT

| Vấn đề | Giải pháp |
|---|---|
| Trang chủ chỉ đại diện bothuocla | Hero "2 trụ cột" + 2 product card + section "Vì sao 2 sản phẩm" |
| Footer chỉ y tế | Smart footer 3 mode (health/career/general) tự detect category |
| Thiếu EEAT cho YMYL finance | Author box smart + schema.org sameAs/knowsAbout + trust pages |
| Brand confusion 2 founder personas | Narrative thống nhất "2 nỗi đau, 2 sản phẩm, 1 người đi trước" |

**Thời gian:** 4 tuần (1 tuần trust pages + footer / 1 tuần author + schema / 1 tuần homepage / 1 tuần QA).

**Effort:** ~40-50 giờ WP dev + 10-15 giờ Khang content + 5 giờ Khang decision.

**Tác động:** Sau 3 tháng — huongdi cluster bắt đầu rank Google, cross-product navigation > 5%, sol.vn trở thành hub thật cho 2 trụ cột.

---

**Phiên bản:** 1.0 — 2026-06-16
**Tác giả:** Sol AI (em) · soạn dựa trên briefing huongdi + codebase sol.vn
