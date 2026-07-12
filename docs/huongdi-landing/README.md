# Đi Cùng Sol — Landing Page huongdi.sol.vn

**Positioning:** SaaS Platform (NOT a book site). Sol.vn = Content Hub, huongdi.sol.vn = Product.

**Brand naming (2-layer):**

| Framework | Display name | TM brand mark |
|---|---|---|
| P1 | Khám phá bản thân | **Discover™** |
| P2 | Kiểm kê nguồn lực | **Resources™** |
| P3 | La bàn hướng đi | **Navigator™** + **DirectionDB™** |
| P4 | Lộ trình 90 ngày | **Roadmap™** (Q3/2026) |
| P5 | AI đồng hành | **Sol AI Mentor™** (Q4/2026) |

---

## 📁 Structure

```
huongdi-landing/
├── index.html               (full landing page ~600 lines)
├── css/
│   └── style.css           (design system + responsive ~700 lines)
├── js/
│   └── app.js              (smooth scroll + scroll animations ~120 lines)
├── deploy-landing.sh        (bash deploy on VPS)
├── upload-landing.ps1       (PowerShell wrapper)
├── huongdi.sol.vn.nginx.v2  (updated nginx config — no auto-redirect)
└── README.md               (this file)
```

---

## 🎨 Sections (10 sections)

1. **Header** — Sol 3 trụ navigation + huongdi sub-nav + CTA
2. **Hero** — "Đừng bắt đầu lại sự nghiệp trước khi biết..." + CTA chính
3. **Trust bar** — 37 mô hình / 20+ năm / 50+ founder / 5'
4. **Pain Point** — 3 nỗi đau U45 (Career loãng, Không biết hướng, Không có bản đồ)
5. **System / Steps** — 5 bước Discover/Resources/Navigator/Roadmap/AI Mentor (3 live + 2 coming)
6. **DirectionDB** — 7 categories + 37 hướng total
7. **How it works** — 5 step user flow
8. **Pricing** — Free vs Premium (Q3/2026)
9. **Success Stories** — 3 anonymized cases
10. **Founder** — Khang Sol bio + photo + creds
11. **FAQ** — 7 câu hỏi thường gặp
12. **Final CTA** — Repeat primary action
13. **Footer** — 5 columns (Brand, Hệ thống, Tài nguyên, Ecosystem, Liên hệ)

---

## 🚀 Deploy

### Bước 1: Chạy upload script (auto-detect và scp + deploy)

```powershell
cd C:\BOTHUOCLA\sol-widget\docs\huongdi-landing
.\upload-landing.ps1
```

Script tự động:
- Upload 5 files lên `/tmp/` (index, css, js, deploy.sh, nginx.conf)
- Chạy `deploy-landing.sh` (sudo cp + chown)
- Update nginx config V2 (xoá auto-redirect `/`)
- Reload nginx
- Smoke test 4 URLs

### Bước 2: Verify trên browser (Ctrl+Shift+R)

| URL | Hành vi mong đợi |
|---|---|
| `https://huongdi.sol.vn/` | **Landing Page mới** (không còn redirect) |
| `https://huongdi.sol.vn/p1.html` | 301 → `/kham-pha-ban-than/` |
| `https://huongdi.sol.vn/kham-pha-ban-than/` | Bài P1 (Discover) |
| `https://huongdi.sol.vn/css/style.css` | 200 OK |

---

## 📊 Performance

- Pure HTML/CSS/JS — không framework, không build step
- ~110 KB total (index + css + js, gzipped ~30 KB)
- Lighthouse target: 95+ Performance, 100 SEO, 100 Accessibility
- Mobile-first responsive (320px → 4K)
- Smooth scroll + IntersectionObserver fade-in animation
- Sticky header with backdrop blur

---

## 🎯 SEO Setup

**Meta tags:**
- ✅ Title: "Đi Cùng Sol — Hệ thống tìm hướng đi cho đàn ông Việt 40-65"
- ✅ Description: 160 chars
- ✅ Keywords: tái khởi nghiệp tuổi 45, đàn ông trung niên, DNA nghề nghiệp
- ✅ Canonical: https://huongdi.sol.vn/
- ✅ Open Graph: title, description, image
- ✅ Twitter Card: summary_large_image
- ✅ Schema.org: WebApplication + Person (Khang)

**GSC actions sau deploy:**
1. Vào Google Search Console
2. URL Inspection → `https://huongdi.sol.vn/`
3. Request Indexing
4. Re-submit sitemap

---

## 🎨 Design System

**Colors:**
- Primary: Amber (`#d97706` → `#f59e0b`)
- Dark: Navy (`#0f172a` → `#1e293b`)
- Background: White / `#fafaf9`
- Success: `#16a34a`

**Typography:**
- Sans: Inter (400/500/600/700/800/900)
- Serif (quotes only): Lora italic 500

**Spacing:** 4px-base scale (4, 8, 12, 16, 24, 32, 48, 64, 80px)
**Radius:** 6/10/14/20/28px
**Shadows:** sm/md/lg/xl/amber

---

## 🔧 Future Updates

Trong index.html, các chỗ cần update sau khi launch P4-P5:

```html
<!-- Step 4 — change status badge khi launch -->
<div class="hd-step__status hd-status-coming">Q3/2026</div>
→ <div class="hd-step__status hd-status-live">Live</div>

<!-- Update CTA link từ #newsletter sang URL thật -->
<a href="#newsletter">→ <a href="/lo-trinh-90-ngay/">
```

Pricing card khi Premium ra:
```html
<div class="hd-pricing__price">Q3/2026</div>
→ <div class="hd-pricing__price">XXXk/tháng</div>
```

---

## 🐛 Rollback nếu cần

```bash
ssh sol-vps "sudo cp /etc/nginx/sites-available/huongdi.sol.vn.bak.YYYYMMDD /etc/nginx/sites-available/huongdi.sol.vn && sudo systemctl reload nginx"
```

Hoặc rollback index.html:
```bash
ssh sol-vps "ls /var/backups/huongdi-landing-*"
ssh sol-vps "sudo cp /var/backups/huongdi-landing-YYYY.../index.html /var/www/huongdi/public/index.html"
```

---

*Author: Khang Sol — Đi Cùng Sol*
*Version: 1.0 — Tháng 6/2026*
*Based on partner advice: SaaS Platform positioning + 2-layer naming + 7-step roadmap*
