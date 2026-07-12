# 🏛 Sol Ecosystem — Silo Architecture cho Topical Authority

## Mục Đích Silo

Google 2026 rank domain theo **topical authority** (chuyên môn 1 lĩnh vực) — không phải backlinks đơn thuần. Silo là kỹ thuật organize content thành nhóm chủ đề tập trung để Google hiểu:

> "sol.vn là chuyên gia về **chuyển đổi nghề nghiệp cho chuyên gia 40+ Việt Nam**"

Kết quả:
- Ranking boost tất cả bài trong silo
- Pillar page hưởng authority từ mọi cluster
- Crawl efficiency (Googlebot dễ hiểu structure)
- User journey rõ ràng

## Sol.vn Silo Architecture Toàn Cảnh

```
sol.vn/                              [BRAND HUB]
│
├── /sol-la-gi/                      → About Sol (foundational)
├── /khang-sol/                      → Author EEAT (authority signal)
├── /tuyen-bo-mien-tru/              → YMYL disclaimer (trust)
│
│
├── ═══════════════════════════════════════════════════
│   SILO #1: HƯỚNG ĐI NGHỀ NGHIỆP  ← MỚI (deploy này)
│   ═══════════════════════════════════════════════════
│
├── /huong-di/                       [Silo Hub — /huong-di/ index]
│   │
│   ├── /ai-2026-nghe-nao-bi-thay-the/       [PILLAR]
│   │       ↓ silo internal links
│   │
│   ├── /ke-toan-45-dung-ai/                  [Cluster — persona]
│   ├── /content-marketer-40-ai-2026/         [Cluster — persona]
│   ├── /ky-su-cntt-45-ai/                    [Cluster — persona]
│   ├── /luat-su-50-ai/                       [Cluster — persona]
│   ├── /bac-si-gia-dinh-ai/                  [Cluster — persona]
│   ├── /so-tay-30-ngay-ai-chuyen-gia/        [Cluster — how-to]
│   └── /3-cau-hoi-nghe-an-toan-ai/           [Cluster — checklist]
│
│
├── ═══════════════════════════════════════════════════
│   SILO #2: HỆ THỐNG 5 BƯỚC (đã có sẵn từ trước)
│   ═══════════════════════════════════════════════════
│
├── /pillar/                         [Existing silo — 7 pillars]
│   ├── /freelance-chuyen-mon-u45/
│   ├── /coach-tu-van-u45/
│   ├── /noi-dung-so-u45/
│   ├── /kinh-doanh-nho-u45/
│   ├── /dich-vu-hang-ngay-u45/
│   ├── /dich-vu-chuyen-biet-u45/
│   └── /dau-tu-tai-san-u45/
│
│
├── ═══════════════════════════════════════════════════
│   SILO #3: TRÍ (Kiến thức chuyên môn — tương lai)
│   ═══════════════════════════════════════════════════
│
├── /tri/                            [Silo hub — chưa build]
│   ├── /prompt-engineering-cho-40/           [Pillar tương lai]
│   ├── /ai-tools-cho-chuyen-gia-u45/         [Cluster]
│   └── ...
│
│
└── ═══════════════════════════════════════════════════
    SILO #4: TÂM & THẾ (Wellness + Health — tương lai)
    ═══════════════════════════════════════════════════

    /tam-the/                        [Silo hub — chưa build]
    ├── /suc-khoe-tinh-than-40/               [Pillar tương lai]
    ├── /tap-luyen-cho-40/                    [Cluster]
    └── ...
```

## Cross-Domain Ecosystem

```
                   ┌─────────────────────────┐
                   │       sol.vn            │
                   │  (SEO + Authority Hub)  │
                   │                          │
                   │  • Silo 1: /huong-di/    │
                   │  • Silo 2: /pillar/      │
                   │  • Silo 3: /tri/         │
                   │  • Author: /khang-sol/   │
                   └───────────┬─────────────┘
                               │
                    Funnel down (SEO → Product)
                               │
                               ▼
                   ┌─────────────────────────┐
                   │   huongdi.sol.vn         │
                   │  (Product + Lead capture)│
                   │                          │
                   │  • /kham-pha-ban-than/   │  ← P1 quiz
                   │  • /kiem-ke-nguon-luc/   │  ← P2 quiz
                   │  • /la-ban-huong-di/     │  ← P3 result
                   │  • /prompts/             │  ← Tool
                   │  • /thanh-toan/          │  ← Convert
                   └───────────┬─────────────┘
                               │
                     User account + tier
                               │
                               ▼
                   ┌─────────────────────────┐
                   │  adminhuongdi.sol.vn     │
                   │  (Admin dashboard)       │
                   └─────────────────────────┘
```

## Internal Link Rules — Silo Discipline

### ✅ ĐÚNG (silo integrity)

- **Pillar** → link tất cả **Clusters** trong cùng silo
- **Cluster** → link về **Pillar** (mở đầu bài)
- **Cluster** ↔ **Cluster** cùng silo (max 3-4 link related)
- **Silo hub** → link Pillar + top clusters
- **Silo** → **huongdi.sol.vn** (product funnel — cross-domain OK)

### ❌ SAI (dilute silo)

- **Cluster silo A** ↔ **Cluster silo B** (KHÔNG cross-silo link nhiều)
- Random cross-link không theo topic (kill topical signal)
- Link về sol.vn/random-page/ không related

### 🎯 Ngoại lệ (accepted cross-link)

- Author box → /khang-sol/ (EEAT)
- Disclaimer footer → /tuyen-bo-mien-tru/ (YMYL trust)
- Homepage → tất cả silos (natural)

## Tuyến /huong-di/ — Link Map Cụ Thể

```
        ┌───────────────────────────────────┐
        │  #1 Pillar: AI 2026               │
        │  /huong-di/ai-2026-nghe-nao-      │
        │           bi-thay-the/            │
        └────────────────┬──────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
    ┌────────┐      ┌────────┐      ┌────────┐
    │ #2 Kế  │◄────►│ #3 Cont│◄────►│ #4 CNTT│
    │ toán   │      │ Market │      │ 45+    │
    └────┬───┘      └────┬───┘      └────┬───┘
         │               │                │
         └───────────────┼────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
    ┌────────┐      ┌────────┐      ┌────────┐
    │ #5 Luật│◄────►│ #6 Bác │◄────►│ #7 Sổ  │
    │ sư 50+ │      │ sĩ GĐ  │      │ tay 30d│
    └────┬───┘      └────┬───┘      └────────┘
         │               │
         └───────┬───────┘
                 │
                 ▼
          ┌─────────────┐
          │ #8 Checklist│
          │ 3 câu hỏi   │
          └─────────────┘

All 8 bài → link về #1 Pillar (mở bài + closing)
All 8 bài → link ra huongdi.sol.vn/prompts/ (CTA giữa + cuối)
```

## Yêu Cầu Kỹ Thuật WordPress

**Permalink structure BẮT BUỘC:**

```
WP Admin → Settings → Permalinks
→ Custom Structure: /%category%/%postname%/
```

**Category setup:**

```
Posts → Categories → Add New:
  Name: Hướng Đi
  Slug: huong-di
  Parent: (none)
  Description: Tuyến bài về chuyển đổi hướng đi nghề nghiệp cho chuyên gia 40+
```

Script `wp-publish.py` **auto-tạo category** nếu chưa có, nhưng anh nên tạo trước để control name/description.

## Silo Hub Page — `/huong-di/`

WordPress mặc định render category archive tại `/category/huong-di/`. Với permalink `/%category%/%postname%/`, URL sẽ là `/huong-di/`.

**Đề xuất tạo custom template `category-huong-di.php`:**

```php
<?php
// wp-content/themes/{theme}/category-huong-di.php
// Hoặc dùng elementor/gutenberg block editor

get_header(); ?>

<section class="silo-hub">
  <h1>Hướng Đi Nghề Nghiệp cho Chuyên Gia 40+</h1>
  <p>Tuyến bài giúp anh chị 40-60 tuổi tại VN đánh giá nghề mình
  trong bối cảnh AI 2026, xác định hướng đi tối ưu và build moat dài hạn.</p>

  <!-- Pillar highlighted first -->
  <div class="silo-pillar">
    <!-- Featured pillar article card -->
  </div>

  <!-- Cluster grid -->
  <div class="silo-clusters">
    <?php while (have_posts()) : the_post(); ?>
      <!-- Cluster card -->
    <?php endwhile; ?>
  </div>

  <!-- CTA về huongdi.sol.vn -->
  <div class="silo-cta">
    <a href="https://huongdi.sol.vn/prompts/">Mở bộ công cụ Prompt AI →</a>
  </div>
</section>

<?php get_footer(); ?>
```

**Nếu chưa muốn code template**, dùng luôn WordPress default archive — vẫn work.

## Deploy Roadmap Silo /huong-di/

**Week 1 (nay):**
- [x] Pillar #1 (AI 2026) — ready deploy
- [ ] Setup permalink + category
- [ ] Deploy Pillar
- [ ] Submit sitemap tới Google Search Console

**Week 2:**
- [ ] Cluster #2 Kế toán 45+
- [ ] Cluster #3 Content marketer 40+
- [ ] Cluster #4 Kỹ sư CNTT 45+

**Week 3:**
- [ ] Cluster #5 Luật sư 50+
- [ ] Cluster #6 Bác sĩ gia đình
- [ ] Cluster #7 Sổ tay 30 ngày

**Week 4:**
- [ ] Cluster #8 Checklist 3 câu hỏi
- [ ] Custom template /huong-di/ silo hub page
- [ ] Internal link audit — verify all clusters link về pillar

**Month 2-3 (tương lai):**
- [ ] SILO #3 /tri/ — Kiến thức AI chuyên sâu
- [ ] SILO #4 /tam-the/ — Wellness cho 40+

## Đo Lường Silo Performance

**KPI theo tuần:**
- Organic impressions cho tuyến `/huong-di/*` (GSC)
- Average position keyword primary ("AI 2026 thay thế nghề")
- Click-through rate pillar page
- Bounce rate cluster → pillar (should ↓ theo thời gian)
- Traffic cross-domain sol.vn → huongdi.sol.vn (Analytics)

**Target 3 tháng:**
- Silo /huong-di/ có 8 bài published
- Pillar top 3 Google cho keyword primary
- 500-1000 organic sessions/tháng cho silo này
- 10-20% clickthrough → huongdi.sol.vn/prompts/
