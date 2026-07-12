# Sol Ecosystem V2 — Domain Map & Sitemap

**Strategic principle:** Mỗi domain có 1 vai trò duy nhất. Không trùng lặp content.

---

## I. Domain Map (4 domains/subdomains)

```
                          ╔═══════════════════╗
                          ║    sol.vn (root)  ║
                          ║                   ║
                          ║   CONTENT HUB +   ║
                          ║     STORE         ║
                          ╚═════════╤═════════╝
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
   ╔═════════════════╗   ╔═════════════════╗   ╔═════════════════╗
   ║ huongdi.sol.vn  ║   ║ bothuocla.sol.vn║   ║ sol.vn/ngam/    ║
   ║                 ║   ║                 ║   ║                 ║
   ║  SaaS Platform  ║   ║  Free Community ║   ║  Tâm content    ║
   ║  (Paid Active)  ║   ║   App (free)    ║   ║  (path on sol)  ║
   ╚═════════════════╝   ╚═════════════════╝   ╚═════════════════╝

                          ╔═══════════════════╗
                          ║adminhuongdi.sol.vn║
                          ║                   ║
                          ║  Internal Admin   ║
                          ║   (staff only)    ║
                          ╚═══════════════════╝
```

### Domain roles — table chi tiết

| Domain | Role | Tech | Access | Revenue? |
|---|---|---|---|---|
| **sol.vn** | Content Hub + E-commerce Store | WordPress | Public + Members | ✅ Direct (sách) |
| **huongdi.sol.vn** | SaaS Platform — DirectionDB + Tools | Vanilla HTML + Node | Demo free, Full = active | ✅ Recurring (active) |
| **bothuocla.sol.vn** | Community App (smoking cessation) | Vanilla HTML + Node | 100% free | ❌ Loss leader |
| **sol.vn/ngam/** | Tâm content (philosophy, mindfulness) | WordPress sub-path | Public | ❌ Brand trust |
| **adminhuongdi.sol.vn** | Internal admin panel | React SPA | Staff only | N/A |

---

## II. sol.vn (Content Hub + Store) — Sitemap chi tiết

```
sol.vn/
│
├── /                                  Homepage — Sol 3 trụ overview
├── /sol-la-gi/                        About Sol (đã có)
├── /khang-sol/                        Founder profile (đã có)
├── /tuyen-bo-mien-tru/                YMYL disclaimer (đã có)
├── /chinh-sach-rieng-tu/              Privacy policy
├── /dieu-khoan/                       Terms of service
├── /lien-he/                          Contact
│
├── /sach/  ⭐ NEW — STORE
│   ├── /sach/                         Book catalog (1 main book hiện tại)
│   ├── /sach/tai-khoi-nghiep-tuoi-45/ Main book detail + buy
│   │   ├── /muc-luc/                  Table of contents (SEO bait)
│   │   ├── /chuong-1-sample/          Free sample chapter (SEO + trust)
│   │   ├── /reviews/                  Reader testimonials
│   │   └── /cap-nhat/                 Version history (V1, V2, ...)
│   └── /sach/<future-book-2>/         (Year 2+)
│
├── /thanh-vien/  ⭐ NEW — MEMBER AREA (login required)
│   ├── /dang-nhap/                    Login (magic link)
│   ├── /dang-ky/                      Sign up
│   ├── /thanh-vien/dashboard/         Personal home
│   ├── /thanh-vien/sach/              Owned books download
│   ├── /thanh-vien/cap-nhat/          New chapters/updates
│   ├── /thanh-vien/hoa-don/           Invoices
│   ├── /thanh-vien/active/            Active status + renew
│   └── /thanh-vien/account/           Profile edit
│
├── /huong-di/  📝 BLOG (SEO — already live)
│   ├── /huong-di/                     Pillar hub
│   ├── /huong-di/freelancer-chuyen-mon-tuoi-45/    Pillar #1
│   ├── /huong-di/huan-luyen-dao-tao-tuoi-45/       Pillar #2
│   ├── /huong-di/content-creator-tuoi-45/          Pillar #3
│   ├── /huong-di/khoi-nghiep-kinh-doanh-tinh-gon-tuoi-45/  Pillar #4
│   ├── /huong-di/dai-ly-phan-phoi-tuoi-45/         Pillar #5
│   ├── /huong-di/dich-vu-service-business-tuoi-45/ Pillar #6
│   ├── /huong-di/dau-thau-hop-dong-tuoi-45/        Pillar #7
│   └── /huong-di/<37 spoke articles>/              Spoke pages (Q3/2026)
│
├── /ngam/  🧘 TÂM CONTENT (Free, philosophy)
│   ├── /ngam/                         Hub
│   ├── /ngam/khung-hoang-tuoi-trung-nien/
│   ├── /ngam/co-don-cua-dan-ong-45/
│   ├── /ngam/thien-cho-nguoi-moi-bat-dau/
│   └── /ngam/<articles>/
│
├── /than/  🌿 PHẦN THÂN (Bridge to bothuocla)
│   ├── /than/                         Hub bridging to bothuocla.sol.vn
│   └── /than/<articles bỏ thuốc>/    Articles SEO redirect/embed
│
├── /podcast/  🎙 AUDIO (Phase 2)
│   ├── /podcast/                      List episodes
│   └── /podcast/episode-0-sol-la-ai/  Each episode page
│
├── /video/  📹 VIDEO LIBRARY (Phase 2)
│   ├── /video/                        List
│   └── /video/<slug>/
│
├── /ebook/  📥 LEAD MAGNET LIBRARY (Phase 2 — free PDFs)
│   ├── /ebook/freelancer-handbook/
│   ├── /ebook/coaching-blueprint/
│   └── /ebook/<7 ebooks tương ứng 7 pillars>/
│
├── /newsletter/                       Subscribe form
├── /cong-dong/                        FB Group + Zalo OA + email
│
└── /sitemap.xml                       Auto-generated
```

### Important: URL conventions

- **Tiếng Việt thuần, dấu nối -**: `/sach/tai-khoi-nghiep-tuoi-45/`
- **KHÔNG dùng English path**: `/store/`, `/books/`, `/checkout/`
- **Trailing slash**: tất cả URL `/path/` (consistent)
- **Lowercase only**: `/Sach/` → `/sach/`

---

## III. huongdi.sol.vn (SaaS Platform) — Sitemap chi tiết

```
huongdi.sol.vn/
│
├── /                                  Landing Page (public PR-able)
├── /demo/  ⭐ NEW                     Demo P1 5-7 câu (lure)
│   └── (Hết demo → "Đăng ký để làm đầy đủ" CTA)
│
├── /kham-pha-ban-than/                P1 Discover™ FULL (login required)
├── /kiem-ke-nguon-luc/                P2 Resources™ FULL (login required)
├── /la-ban-huong-di/                  P3 Navigator™ FULL (login required)
├── /lo-trinh-90-ngay/  ⭐ Q3/2026     P4 Roadmap™ (active required)
├── /ai-mentor/  ⭐ Q4/2026            P5 Sol AI Mentor™ (active required)
│
├── /dashboard/                        User home — tổng quan progress
├── /ho-so-cua-toi/                    Profile + DNA + Resources data
│
├── /dang-nhap/                        Magic link login
├── /dang-ky/                          Sign up (redirect from sol.vn/sach buy)
├── /quen-mat-khau/                    Reset (Phase 2 if needed)
├── /dang-xuat/                        Logout
│
├── /faq/                              Frequently Asked Questions
├── /lien-he/                          Contact form
│
├── /api/                              Backend REST API (proxied to :4001)
│   ├── /api/auth/login
│   ├── /api/auth/verify
│   ├── /api/p1/submit
│   ├── /api/p2/submit
│   ├── /api/p3/get
│   ├── /api/directions
│   └── /api/dashboard
│
└── /sitemap.xml                       Static
```

### URL redirects (preserve old)

| Old URL | New URL | Type |
|---|---|---|
| `/p1.html` | `/kham-pha-ban-than/` | 301 |
| `/p2.html` | `/kiem-ke-nguon-luc/` | 301 |
| `/p3.html` | `/la-ban-huong-di/` | 301 |

---

## IV. bothuocla.sol.vn (Free Community App) — Sitemap

```
bothuocla.sol.vn/
│
├── /                                  App home (login or anon device)
├── /quit-journey/                     88-day journey
├── /ftnd-test/                        Fagerstrom test
├── /tracker/                          Daily cigarette tracker
├── /money-saved/                      Money saved breakdown
├── /community/                        Anonymous peer support
│
├── /promote-sol/  💡 INTERNAL CTA
│   └── (Inline CTAs only — NO separate page)
│   "Đã bỏ thuốc 30 ngày? Sắp tới sẽ là tìm hướng mới —
│    đọc 'Tái khởi nghiệp đúng hướng' của Khang Sol [Mua sách]"
│
└── /api/                              Backend
```

→ **Vai trò chính:** Free service xây trust + lead capture.

---

## V. sol.vn/ngam/ — Tâm content path (within sol.vn)

```
sol.vn/ngam/
│
├── /ngam/                              Hub Tâm
├── /ngam/khung-hoang-tuoi-trung-nien/  Article
├── /ngam/co-don-cua-dan-ong-45/        Article
├── /ngam/thien-chanh-niem-cho-beginner/
├── /ngam/journaling-cho-nguoi-bat-dau/
└── ... (~10-20 articles Year 1)
```

→ **Vai trò:** SEO + trust + lead magnet (subscribe newsletter). Cross-link sang sách Sol.

---

## VI. adminhuongdi.sol.vn — Internal admin

```
adminhuongdi.sol.vn/
│
├── /                                  Admin login
├── /directions/                       Manage 37 directions
├── /users/                             Manage users
├── /orders/  ⭐ NEW                    Manage book + active orders
├── /analytics/                        Funnel + revenue
└── /api/admin/                        Admin API
```

---

## VII. Cross-domain user flow — Critical for UX

### User journey #1: Anonymous → Sách buyer
```
1. Google search "tái khởi nghiệp tuổi 45"
2. Land trên sol.vn/huong-di/freelancer-chuyen-mon-tuoi-45/  (Pillar SEO)
3. Đọc 4000 từ → click "Mua sách" CTA
4. Đến sol.vn/sach/tai-khoi-nghiep-tuoi-45/  (Store)
5. Click "Mua ngay" → checkout (Stripe/bank transfer)
6. Auto-tạo account → email magic link
7. Click link → đăng nhập sol.vn/thanh-vien/dashboard/
8. Download ebook PDF
9. Email follow-up "Active 1 năm — vào huongdi.sol.vn"
10. Click → SSO redirect → huongdi.sol.vn/dashboard/ (logged in)
11. Làm Discover™ → Resources™ → Navigator™ → kết quả 37 hướng
```

### User journey #2: bothuocla → Sol
```
1. Google "cách bỏ thuốc lá hiệu quả"
2. Land bothuocla.sol.vn
3. Làm FTND Test → start 88-day journey
4. Day 30: app pop-up "Đã 30 ngày không hút! Bước tiếp theo: nghĩ về hướng đi mới"
5. Click → sol.vn/sach/tai-khoi-nghiep-tuoi-45/
6. (Tiếp Journey #1 từ bước 5)
```

### User journey #3: huongdi demo → Sách
```
1. Facebook ad/post → huongdi.sol.vn/ (Landing)
2. Click "Khám phá ngay" → /demo/
3. Làm 5 câu demo → kết quả "Khám phá 5 câu hiển thị 1 hint"
4. CTA: "Để làm đầy đủ 20 câu + 8 trục + 37 hướng → Mua sách + Active"
5. → sol.vn/sach/...
6. (Tiếp Journey #1)
```

---

## VIII. SSO Architecture (cross-domain auth)

```
┌─────────────────────────────────────────────────────────────────┐
│                  Shared cookie domain: .sol.vn                   │
│  (cookie name: sol_token, accessible by all *.sol.vn subdomains) │
└─────────────────────────────────────────────────────────────────┘

User logs in via sol.vn/thanh-vien/dang-nhap/
    │
    ├─→ Backend issues JWT (signed with shared secret)
    │   Set-Cookie: sol_token=...; Domain=.sol.vn; Secure; HttpOnly
    │
    ├─→ Browser includes cookie when visiting:
    │   ✓ sol.vn (WordPress)
    │   ✓ huongdi.sol.vn (Node API verify JWT)
    │   ✓ bothuocla.sol.vn (Node API verify JWT)
    │
    └─→ Each backend verifies JWT independently with shared secret
```

### Implementation tasks
1. WordPress plugin để verify JWT khi log in member area
2. huongdi.sol.vn backend đọc cookie `sol_token`, verify, gate routes
3. bothuocla.sol.vn backend same

---

## IX. Sitemap.xml — SEO submission

**3 sitemaps riêng:**

| File | URL |
|---|---|
| sol.vn sitemap | `https://sol.vn/sitemap_index.xml` (WP auto) |
| huongdi.sol.vn sitemap | `https://huongdi.sol.vn/sitemap.xml` (static) |
| bothuocla.sol.vn sitemap | `https://bothuocla.sol.vn/sitemap.xml` (static) |

**Submit cả 3 lên Google Search Console riêng (1 property/domain).**

---

## X. URL Decisions — keep / change / future

### ✅ KEEP (đã đúng)
- `sol.vn/khang-sol/`
- `sol.vn/sol-la-gi/`
- `sol.vn/tuyen-bo-mien-tru/`
- `sol.vn/huong-di/` (Blog pillar hub)
- `sol.vn/ngam/`
- `huongdi.sol.vn/kham-pha-ban-than/`
- `huongdi.sol.vn/kiem-ke-nguon-luc/`
- `huongdi.sol.vn/la-ban-huong-di/`

### ⭐ NEW (xây sắp tới)
- `sol.vn/sach/` (Store)
- `sol.vn/thanh-vien/` (Member area)
- `huongdi.sol.vn/demo/` (Demo P1)
- `huongdi.sol.vn/dashboard/` (User home)
- `huongdi.sol.vn/dang-nhap/` (Login)

### 🔮 FUTURE (Year 2+)
- `sol.vn/podcast/`
- `sol.vn/video/`
- `sol.vn/ebook/` (free lead magnets)
- `huongdi.sol.vn/lo-trinh-90-ngay/`
- `huongdi.sol.vn/ai-mentor/`

### ❌ AVOID
- Không dùng `/store/`, `/shop/`, `/books/` (English paths)
- Không dùng subdomain `store.sol.vn` (chia traffic)
- Không dùng subdomain `members.sol.vn` (chia auth complexity)

---

*Đọc tiếp `03-FUNNEL.md` để biết conversion strategy.*
