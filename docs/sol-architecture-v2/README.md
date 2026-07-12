# Sol Ecosystem V2 — Architecture Documentation

**Quyết định chiến lược:** Sol chuyển từ "test tool free" → **"Sách + Active subscription model"**.

## 📚 4 files trong bộ docs này

| File | Nội dung | Đọc khi nào |
|---|---|---|
| `01-BUSINESS-MODEL.md` | Revenue streams, persona, pricing, competitive positioning | **ĐỌC TRƯỚC** — Trả lời "Sol kiếm tiền thế nào?" |
| `02-DOMAIN-SITEMAP.md` | 4 domains, sitemap chi tiết, URL convention, SSO architecture | Đọc khi cần biết "Page X nằm ở đâu?" |
| `03-FUNNEL.md` | 5-stage conversion funnel, channels, email sequences, tracking | Đọc khi optimize conversion |
| `04-ROADMAP.md` | Quý 1-4 implementation, resource allocation, budget, decisions | Đọc khi plan sprint |

---

## 🎯 TL;DR — 5 quyết định chiến lược

### 1. Sol bán gì?
**Sách Ebook + Active Subscription** = revenue chính
(Blog free SEO + bothuocla free community = marketing/funnel)

### 2. 4 domains role rõ ràng
| Domain | Role |
|---|---|
| **sol.vn** | Content Hub + Store (WordPress) |
| **huongdi.sol.vn** | SaaS Platform (Demo free + Full paid) |
| **bothuocla.sol.vn** | Community App (100% free) |
| **adminhuongdi.sol.vn** | Internal admin |

### 3. Funnel 5 stages
```
ATTRACT (SEO + bothuocla) → ENGAGE (Newsletter + demo) →
NURTURE (Email seq) → CONVERT (Sách) → RETAIN (Active renew)
```

### 4. Pricing (recommend)
| Item | Price |
|---|---|
| Ebook + 1 năm Active | 199-299k VND (one-time) |
| Active renew (sau Y1) | 99k/năm |
| Cohort 90 ngày | 5-10tr (Year 2) |
| Coaching 1-1 Khang | 3-5tr/buổi (Year 2) |

### 5. Year 1 target
- 430 sách bán
- 500 Active subscribers
- ~236tr revenue, ~88tr profit (conservative)
- Y2 compound: 500tr+ revenue

---

## 🚀 Next 7 days action items

1. ✅ **Verify Landing Page live** (browser test https://huongdi.sol.vn/)
2. 🔲 **Patch 7 spoke pages** với header Việt hoá mới
3. 🔲 **Tạo sol.vn/sach/ placeholder** (coming soon page)
4. 🔲 **Submit GSC sitemap** mới (huongdi với URL Việt)
5. 🔲 **Soạn newsletter announce** rebrand
6. 🔲 **Outline sách V1** (12-15 chương)
7. 🔲 **Start writing chương 1**

---

## 📊 Key Performance Indicators (Y1)

```
                  T7  T8  T9  T10 T11 T12 T1  T2  T3  T4  T5  T6
Sách bán          5   10  15  20  25  30  40  50  60  70  80  90
                  ▁▁▁▁▂▂▂▂▃▃▃▃▄▄▄▄▅▅▅▅▆▆▆▆▇▇▇▇█████
                  Q1 Foundation │ Q2 SEO │ Q3 Cohort │ Q4 AI Mentor

Newsletter        50  100 200 400 700 1k  1.5k 2k 2.5k 3k 3.5k 4k
Active members    0   5   30  60  100 150 200 250 300 350 400 500
Pageviews/tháng   0   500 2k  5k  10k 15k 20k 25k 30k 35k 40k 50k
```

---

## ⚠️ Risk monitoring

| Top 3 risks Year 1 | Status | Mitigation |
|---|---|---|
| 1. Khang không đủ time viết sách | Yellow | Voice-record + transcribe |
| 2. SEO traction chậm | Yellow | Tận dụng bothuocla + FB Group |
| 3. Conversion < 5% | Green | A/B test pricing + CTAs Q3+ |

---

## 🔗 Quick reference

**Live URLs:**
- https://sol.vn (Content + future Store)
- https://huongdi.sol.vn (SaaS Landing)
- https://bothuocla.sol.vn (Community App)
- https://adminhuongdi.sol.vn (Admin)

**Live Pillars (SEO):**
- /huong-di/freelancer-chuyen-mon-tuoi-45/
- /huong-di/huan-luyen-dao-tao-tuoi-45/
- /huong-di/content-creator-tuoi-45/
- /huong-di/khoi-nghiep-kinh-doanh-tinh-gon-tuoi-45/
- /huong-di/dai-ly-phan-phoi-tuoi-45/
- /huong-di/dich-vu-service-business-tuoi-45/
- /huong-di/dau-thau-hop-dong-tuoi-45/

**Auth domain:** `.sol.vn` (shared cookie cho SSO)

---

*Đi Cùng Sol — Đi cùng nhau, đường dài đỡ mỏi.*
*Version 2.0 — Tháng 6/2026*
*Author: Khang Sol*
