# EOD Comprehensive Wrap · Sol Ecosystem · 2026-07-08
## Move-Laptop-Ready Session Package

**Owner:** Khang Sol (nguyendinhkhang@gmail.com)
**Model dùng phiên này:** Claude Opus 4.7 (Cowork mode)
**Thời lượng:** ~8+ giờ (sáng → tối)
**Trạng thái đóng gói:** ✅ Sẵn sàng resume ở phiên bất kỳ (laptop khác / model khác / thời điểm khác)

---

## 0. Cách dùng document này

**Tình huống 1 — Cùng laptop, phiên mới cùng model Opus:**
→ Đọc Section 1-3 để refresh context, jump ngay vào Section 5 (Deploy queue) hoặc Section 6 (Roadmap Tuần 1).

**Tình huống 2 — Laptop mới:**
→ Đọc Section 8 (File map + Git state), pull repo, đọc Section 1-6.

**Tình huống 3 — Claude model khác (fable5 / GPT / Gemini):**
→ Đọc TOÀN BỘ document + Section 10 (Continuation instructions for new AI).

**Tình huống 4 — Team member khác lên tiếp việc:**
→ Đọc Section 1-9, ping anh Khang cho Section 10 credentials.

---

## 1. Bức tranh tổng thể Sol Ecosystem — 60 giây

### 1.1. Sol là gì
Sol La Bàn — hệ thống định hướng nghề nghiệp cho người Việt Nam 40-60 tái khởi nghiệp. 5 Bước: Thấu hiểu → Khai phá → Chọn hướng → Hành động → An toàn.

### 1.2. Kiến trúc 3 tuyến website

| Tuyến | Domain | Vai trò | Stack |
|-------|--------|---------|-------|
| **Marketing/SEO** | `sol.vn` | 7 pillar SEO + Khang Sol profile + About + Whitepaper | WordPress + GeneratePress + 8 mu-plugins |
| **Product/App** | `huongdi.sol.vn` | 5 Bước quiz + 37 direction + AI Studio + Payment + Dashboard | Vanilla HTML + Node.js Express TS + Prisma + Postgres |
| **Quản trị** | `adminhuongdi.sol.vn` | Admin panel | Chung backend |

**2 domain "stable, không động":** `admin.sol.vn` + `bothuocla.sol.vn` (dự án cũ Bothuốc Lá).

### 1.3. Business model V4.1

- **Free** — 5/37 mô hình open, quiz miễn phí
- **Active** — 499k/năm, full 37 mô hình + AI Studio + Sol Đồng Hành AI + Sổ Hành Trình
- **Founder** — 1.999k lifetime, 100 slot (scarcity)

### 1.4. Persona anchor

Chị Nga 52 tuổi, trưởng phòng tài chính 25 năm, xài Zalo, sợ bị lừa online, không rành công nghệ, muốn chuyển hướng nghề nghiệp trong 5-10 năm nữa.

---

## 2. Deliverables phiên hôm nay (15+ items)

### 2.1. Code fixes (5 file — chờ deploy VPS)

| # | File | Nội dung |
|:-:|------|----------|
| 1 | `huongdi-public/ai-studio/index.html` | Mobile listbox filter + 3 nút AI (ChatGPT/Claude/Gemini) + collapse helper |
| 2 | `huongdi-public/tao-prompts-ca-nhan/index.html` | Add sol-ui.js header/footer + 3 nút AI |
| 3 | `huongdi-public/BingSiteAuth.xml` | Bing verification token `834F311674DEA5A3EF02DECE370458FD` |
| 4 | `huongdi-public/sitemap.xml` | V4.1 với 15 URL canonical (Trang chủ, 5 Bước, AI Studio, Pricing, 7 category) |
| 5 | `huongdi-backend/scripts/import-mh-108.ts` | POC import direction MH-108 Chấp bút SME với 21 vector chấm sẵn |

### 2.2. WordPress content (1 file — chờ publish qua WP editor)

| # | File | Nội dung | URL |
|:-:|------|----------|-----|
| 6 | `solvn-wp/pages/phuong-phap.html` | Landing whitepaper SAM V1.0 với font tiếng Việt đã fix | `sol.vn/phuong-phap-dinh-vi-huong-di-sol/` |

### 2.3. Documentation (8 file docs — reference lâu dài)

| # | File | Kích thước | Mục đích |
|:-:|------|:----------:|----------|
| 7 | `TECH-STACK-2026-07-08.md` | ~15KB | Audit tech stack toàn ecosystem |
| 8 | `UX-AUDIT-2026-07-08.md` | ~25KB | UX audit 8 giai đoạn journey + roadmap 3 tháng |
| 9 | `TEST-ENGINE-EXPLAINED.md` | ~20KB | Thuật toán match + Free/Active matrix + ví dụ chị Nga |
| 10 | `SAM-WHITEPAPER-V1.md` | **40KB** | Whitepaper SAM 40 trang · 40+ references APA · Phase 1-4 validation roadmap |
| 11 | `PARTNER-DB-INTEGRATION-2026-07-08.md` | ~18KB | Audit 8 mô hình đối tác + 21 vector em chấm sẵn |
| 12 | `UNIFIED-DB-SCHEMA-2026-07-08.md` | ~22KB | Merge schema đối tác + Sol → Unified V2 |
| 13 | `PARTNER-MVP-SPEC-COMPARE-2026-07-08.md` | ~18KB | So sánh 15 điểm Sol vs SPEC-MVP đối tác |
| 14 | `PARTNER-38-MODELS-SQL-2026-07-08.md` | ~16KB | Audit SQL 38 mô hình + migration path 6 tuần |

### 2.4. ADR log entries (3 quyết định mới)

- **ADR-010** — AI Studio dùng submenu thay iframe container (ship xong)
- **ADR-011** — Mobile listbox filter thay tabs wrap (ship xong)
- **ADR-012** — Adopt schema đối tác làm base (LOCK, chờ ship code Tuần 1)

---

## 3. Decisions LOCKED trong phiên này

### 3.1. Về đối tác (ADR-012)
1. ✅ **Phương án C:** Adopt schema đối tác làm base — Sol wraps thay vì merge
2. ✅ **Bỏ 2 nghề nhạy cảm** — Sol #17 dau-tu-tai-chinh + #22 cham-soc-suc-khoe-tai-nha (theo đối tác)
3. ✅ **Combo biên soạn 30 mô hình:**
   - Đợt 1 P1 (6 mô hình): đối tác biên soạn nếu có scope, hoặc Sol Claude API
   - Đợt 2-3 (24 mô hình): Sol Claude API + Master Prompt đối tác

### 3.2. Về SAM whitepaper
- ✅ **URL landing:** `sol.vn/phuong-phap-dinh-vi-huong-di-sol/` (tránh conflict `/phuong-phap-cai-thuoc-la/`)
- ✅ **Release strategy:** 3 tầng — Tầng 1 public landing (đang ship), Tầng 2 gated PDF (chờ), Tầng 3 academic (2027 sau validation)

### 3.3. Về AI Studio
- ✅ **3 nút AI provider:** ChatGPT (xanh) + Claude (cam) + Gemini (gradient) — không chỉ ChatGPT
- ✅ **Mobile filter:** `<select>` listbox thay tabs wrap

### 3.4. Về SEO
- ✅ **Sitemap 15 URL canonical** cho huongdi.sol.vn (bao gồm 7 category p3-*.html)
- ✅ **Bing verification** đang deploy

---

## 4. 2 file quà đối tác đã audit (đợi anh confirm để ship code)

| File | Nội dung | Đã audit trong |
|------|----------|----------------|
| `solvn-prototype-pheu-choedit.html` | 8 mô hình rich content (MH-101→108, 16-20KB body/mô hình) | File 11 |
| `SCHEMA-CSDL-solvn-v1.md` | Schema Postgres/Supabase professional 325 dòng | File 12 |
| `SPEC-MVP-solvn-v1.md` | SPEC MVP 403 dòng — 12 màn hình, 10 API, entitlement model | File 13 |
| `seed-catalog-38-mo-hinh-v0.sql` | SQL seed 38 mô hình (8 published + 30 draft) | File 14 |

**Extract data:** `/tmp/partner-models.json` — 8 mô hình dạng JSON parsed sẵn từ prototype (dùng cho script import).

---

## 5. DEPLOY QUEUE — Anh chạy khi rảnh

### 5.1. VPS deploy (5 files) — Lệnh 1

```powershell
scp C:\BOTHUOCLA\sol-ecosystem\huongdi-public\ai-studio\index.html sol-vps:/tmp/aistudio-3ai.html
scp C:\BOTHUOCLA\sol-ecosystem\huongdi-public\tao-prompts-ca-nhan\index.html sol-vps:/tmp/tao-3ai.html
scp C:\BOTHUOCLA\sol-ecosystem\huongdi-public\BingSiteAuth.xml sol-vps:/tmp/BingSiteAuth.xml
scp C:\BOTHUOCLA\sol-ecosystem\huongdi-public\sitemap.xml sol-vps:/tmp/sitemap.xml
scp C:\BOTHUOCLA\sol-ecosystem\huongdi-backend\scripts\import-mh-108.ts sol-vps:/tmp/import-mh-108.ts
```

### 5.2. VPS deploy — Lệnh 2 (backup + move + verify)

```powershell
$TS = Get-Date -Format "yyyyMMdd-HHmmss"
ssh sol-vps "sudo mkdir -p /var/backups/eod-$TS && sudo cp /var/www/huongdi/public/ai-studio/index.html /var/backups/eod-$TS/ && sudo cp /var/www/huongdi/public/tao-prompts-ca-nhan/index.html /var/backups/eod-$TS/ && sudo cp /var/www/huongdi/public/sitemap.xml /var/backups/eod-$TS/ && sudo mv /tmp/aistudio-3ai.html /var/www/huongdi/public/ai-studio/index.html && sudo mv /tmp/tao-3ai.html /var/www/huongdi/public/tao-prompts-ca-nhan/index.html && sudo mv /tmp/BingSiteAuth.xml /var/www/huongdi/public/BingSiteAuth.xml && sudo mv /tmp/sitemap.xml /var/www/huongdi/public/sitemap.xml && sudo mv /tmp/import-mh-108.ts /var/www/huongdi/backend/scripts/import-mh-108.ts && sudo chown -R www-data:www-data /var/www/huongdi/public/ai-studio /var/www/huongdi/public/tao-prompts-ca-nhan /var/www/huongdi/public/BingSiteAuth.xml /var/www/huongdi/public/sitemap.xml && sudo chown deploy:deploy /var/www/huongdi/backend/scripts/import-mh-108.ts && echo 'EOD Deploy OK'"
```

### 5.3. WordPress publish (1 page)

1. Vào `sol.vn/wp-admin/` → Pages → Add New
2. **Title:** `Phương pháp Sol La Bàn — Định vị hướng đi khoa học cho người Việt 40-60`
3. **Permalink slug:** `phuong-phap-dinh-vi-huong-di-sol`
4. **Custom HTML block:** paste toàn bộ nội dung từ `C:\BOTHUOCLA\sol-ecosystem\solvn-wp\pages\phuong-phap.html` (từ dòng `<link rel="preconnect">` xuống hết)
5. **Rank Math box:**
   - SEO Title: `Phương pháp Sol La Bàn — Định vị hướng đi khoa học cho người Việt 40-60`
   - Meta Description: `Sol Assessment Method (SAM) — phương pháp định vị hướng đi có nền tảng khoa học, dành riêng cho người Việt 40-60 tái khởi nghiệp. Whitepaper V1.0 minh bạch.`
   - Focus Keyword: `phương pháp định vị hướng đi`
6. **Publish** → verify URL `https://sol.vn/phuong-phap-dinh-vi-huong-di-sol/`

### 5.4. Chạy import MH-108 vào DB

```powershell
ssh sol-vps "cd /var/www/huongdi/backend && sudo -u deploy npx tsx scripts/import-mh-108.ts"
```

Sau đó publish nếu OK:
```powershell
ssh sol-vps "sudo -u postgres psql huongdi_prod -c \"UPDATE directions SET status='PUBLISHED', published_at=NOW() WHERE slug='chap-but-thuong-hieu-ca-nhan-chu-sme';\""
```

### 5.5. Submit search engines sau deploy

- **Google Search Console:** URL Inspection → Request Indexing cho `https://sol.vn/phuong-phap-dinh-vi-huong-di-sol/` + `https://huongdi.sol.vn/sitemap.xml` (Sitemaps tab)
- **Bing Webmaster Tools:** verify site (auto sau khi deploy BingSiteAuth.xml) → Submit sitemap `https://huongdi.sol.vn/sitemap.xml`

---

## 6. Roadmap Tuần 1-6 — Migration Phương án C

### Tuần 1 (starting 2026-07-09) — Foundation

**Task 1.1:** Backup DB full trước migration
```powershell
ssh sol-vps "sudo -u postgres pg_dump huongdi_prod > /var/backups/pre-migration-C-$(date +%Y%m%d).sql"
```

**Task 1.2:** Ship Prisma migration adopt schema đối tác
- Tạo bảng: `models`, `model_versions`, `model_sections`, `categories`, `tags`, `model_tags`, `journeys`, `journey_phases`, `journey_actions`, `journey_expenses`, `journey_gates`, `journey_events`, `template_update_notices`, `notebooks`
- Sol contribute layer: `model_scores` (21 vector) làm bảng riêng

**Task 1.3:** Chạy SQL seed 38 mô hình đối tác vào DB

**Task 1.4:** Import 8 rich content (MH-101→108) via script parse `.md` → `model_sections`

**Task 1.5:** Chấm 21 vector cho 8 mô hình (đã có sẵn trong `PARTNER-DB-INTEGRATION-2026-07-08.md` Section 4.3)

### Tuần 2 — Migrate 37 direction Sol → MH-2xx

**Task 2.1:** Migrate 37 direction hiện tại → schema đối tác dưới ID MH-201 → MH-223 (giữ FK cho SavedDirection, JourneyDay, UserOutcome)

**Task 2.2:** Archive 2 direction nhạy cảm (MH-217 dau-tu-tai-chinh + MH-222 cham-soc-suc-khoe-tai-nha)

**Task 2.3:** Chấm 21 vector default (50 all) cho 23 direction Sol chưa có scoring — refine sau

### Tuần 3 — Biên soạn Đợt 1 P1

6 mô hình priority 1: **MH-113, 115, 121, 125, 129, 133**

- **Nếu đối tác có scope:** ship 6 file Master Prompt cho đối tác (dùng format MH-108 làm reference)
- **Nếu không:** Sol chạy Claude API với Master Prompt (~15-20k VND API cost/mô hình = ~100k VND)

### Tuần 4 — Biên soạn Đợt 2 P2

10 mô hình: **MH-109, 110, 116, 117, 124, 126, 128, 134, 135, 136** — Sol Claude API

### Tuần 5-6 — Đợt 3 P3 + Refine 23 direction Sol

14 mô hình P3 + 23 direction Sol MH-2xx được refine dùng format đối tác.

### Deliverables cuối 6 tuần
- **~60 direction có content chuẩn** (30 mới biên soạn + 8 rich đối tác + 23 Sol refined - 2 archived)
- Thư viện lớn nhất VN cho persona 40-60
- Journey system professional với ân hạn rules
- Section-level gating Free vs Active
- Full-text search tiếng Việt
- Template versioning + update notices

---

## 7. PENDING ITEMS — 5 câu hỏi + 3 chờ đối tác

### 7.1. 5 câu hỏi cần anh quyết (không blocker cho Tuần 1)

1. **Scope đối tác Đợt 1:** Anh đã có hợp đồng để đối tác biên soạn 6 mô hình P1 chưa?
2. **23 direction Sol không overlap:** Migrate thành MH-201-223 (em nghiêng) hay bỏ tất cả?
3. **Pricing 3 tier hay 4 tier?** (đối tác đề xuất thêm Lifetime_early 499k trọn đời × 300 slot)
4. **Auto payment webhook:** ship tuần này hay để sau ổn định các việc khác?
5. **Auth Email OTP** thêm song song với password hay giữ nguyên?

### 7.2. 3 việc chờ đối tác/bên ngoài

- **Google OAuth credentials** — cần `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` để deploy Google login
- **Font tiếng Việt** — verify sau khi anh publish landing `/phuong-phap-.../` xem có còn cách chữ
- **Anh xác nhận tối hôm nay deploy 5 file VPS** — hoặc để mai

---

## 8. FILE MAP — Toàn bộ location

### 8.1. Code repository

```
C:\BOTHUOCLA\sol-ecosystem\        (Git repo — private GitHub nguyendinhkhangSOL/sol-ecosystem)
├── huongdi-public/                (Static frontend cho huongdi.sol.vn)
│   ├── ai-studio/index.html       ← 5 file cần deploy VPS
│   ├── tao-prompts-ca-nhan/index.html
│   ├── BingSiteAuth.xml
│   ├── sitemap.xml
│   └── sol-ui.js
├── huongdi-backend/               (Node.js Express TypeScript + Prisma)
│   ├── prisma/schema.prisma       (Direction schema hiện tại — sẽ migrate Tuần 1)
│   ├── src/routes/                (18 route files)
│   └── scripts/
│       ├── generate-roadmaps.js
│       └── import-mh-108.ts       ← MỚI hôm nay, chờ chạy VPS
├── content/prompts/               (37 file MD template Claude prompt cho 37 direction)
├── solvn-wp/                      (WordPress custom code cho sol.vn)
│   ├── mu-plugins/                (8 PHP plugins)
│   ├── themes/news-magazine-x-child/
│   └── pages/
│       └── phuong-phap.html       ← MỚI hôm nay, chờ publish WP editor
├── admin/                         (Admin SPA — folder trống, dùng static HTML)
├── docs/                          (Ecosystem docs)
└── scripts/                       (Deploy scripts)

C:\BOTHUOCLA\sol-widget\           (Git repo docs riêng — chưa lên GitHub)
└── docs/sol-mvp-v3/
    ├── ECOSYSTEM-AUDIT/PROJECT-DOCS/
    │   ├── 03-DESIGN-DECISIONS.md              (ADR log — có ADR-001 đến 012)
    │   ├── TECH-STACK-2026-07-08.md            ← MỚI
    │   ├── UX-AUDIT-2026-07-08.md              ← MỚI
    │   ├── TEST-ENGINE-EXPLAINED.md            ← MỚI
    │   ├── SAM-WHITEPAPER-V1.md                ← MỚI (whitepaper 40 trang)
    │   ├── PARTNER-DB-INTEGRATION-2026-07-08.md    ← MỚI
    │   ├── UNIFIED-DB-SCHEMA-2026-07-08.md         ← MỚI
    │   ├── PARTNER-MVP-SPEC-COMPARE-2026-07-08.md  ← MỚI
    │   └── PARTNER-38-MODELS-SQL-2026-07-08.md     ← MỚI
    └── SESSION-LOGS/
        ├── 2026-07-07-EOD-WRAP.md
        └── 2026-07-08-EOD-COMPREHENSIVE-WRAP.md    ← MỚI (chính file này)
```

### 8.2. Uploads đối tác

```
C:\Users\ADMIN\AppData\Roaming\Claude\local-agent-mode-sessions\...\uploads\
├── solvn-prototype-pheu-choedit.html    (263KB — 8 mô hình rich content)
├── SCHEMA-CSDL-solvn-v1.md              (17.7KB — schema Postgres/Supabase)
├── SPEC-MVP-solvn-v1.md                 (25.8KB — SPEC MVP 12 màn)
├── seed-catalog-38-mo-hinh-v0.sql       (41.8KB — 38 mô hình SQL)
├── MH-108-chap-but-thuong-hieu-ca-nhan-chu-sme.md   (23KB — mẫu rich content)
└── BingSiteAuth.xml                     (85 bytes — Bing verification)
```

### 8.3. Git state (chưa commit hôm nay)

**Chưa commit vào `sol-ecosystem`:**
- 5 file code fixes (Section 5.1)
- 1 file landing WP (`solvn-wp/pages/phuong-phap.html`)
- 1 file script (`huongdi-backend/scripts/import-mh-108.ts`)

**Chưa commit vào `sol-widget`:**
- 9 file docs mới (8 report + 1 EOD wrap)
- 1 file ADR update

**Lệnh commit anh chạy khi sẵn:**
```powershell
# Code repo
cd C:\BOTHUOCLA\sol-ecosystem
git add huongdi-public/ai-studio/index.html huongdi-public/tao-prompts-ca-nhan/index.html huongdi-public/BingSiteAuth.xml huongdi-public/sitemap.xml huongdi-backend/scripts/import-mh-108.ts solvn-wp/pages/phuong-phap.html
git commit -m "EOD 2026-07-08: AI Studio 3 buttons + mobile listbox + Bing + sitemap V4.1 + MH-108 import + SAM landing"
git push origin main

# Docs repo (chưa lên GitHub — em đề xuất push riêng)
cd C:\BOTHUOCLA\sol-widget
# TODO: init GitHub remote nếu chưa có
git add docs/
git commit -m "EOD 2026-07-08: SAM whitepaper + 7 audit reports + ADR-010/011/012 + EOD wrap"
```

---

## 9. CONTACT MATRIX — Credentials & external

### 9.1. Domain + Hosting

| Item | Detail | Ai giữ |
|------|--------|--------|
| Domain `sol.vn` | Cần renew hàng năm | Khang |
| VPS Ubuntu (huongdi + admin) | SSH `sol-vps` (~/.ssh/config) | Khang |
| cPanel shared host (sol.vn WP) | Login qua email | Khang |
| GitHub Private `nguyendinhkhangSOL/sol-ecosystem` | Push access | Khang |

### 9.2. External services

| Service | Purpose | Credentials location |
|---------|---------|---------------------|
| PostgreSQL `huongdi_prod` | Main DB | `.env` trên VPS |
| Zoho SMTP | Email transactional | PM2 env |
| Techcombank `11522026076011` | Payment VietQR (CTY CP VINET · MST 0104127836) | Landing pages |
| Zalo OA `zalo.me/3547084958635197535` | User support | Public link |
| Google Search Console | SEO tracking | Khang Google account |
| Bing Webmaster Tools | SEO Bing | Cần add site sau deploy |
| Anthropic API (Claude) | Sol Đồng Hành AI | PM2 env `ANTHROPIC_API_KEY` |

### 9.3. Cần lấy credential mới

| Item | Vì sao | Priority |
|------|--------|----------|
| `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` | Deploy Google OAuth (code ready) | Medium |
| PayOS/SePay account (nếu adopt SPEC đối tác Câu 4) | Auto webhook payment | Medium |

### 9.4. Đối tác biên tập content

| Item | Detail |
|------|--------|
| Đối tác đã bàn giao | 4 files (prototype + schema + SPEC + SQL) |
| Anh có toàn quyền IP | ✅ Confirmed |
| Scope biên soạn 30 mô hình còn lại | ❓ Chưa rõ, cần anh confirm |

---

## 10. CONTINUATION INSTRUCTIONS — Cho AI phiên tiếp theo

### 10.1. Nếu là Claude Opus (giống model hiện tại)

Đọc lần lượt: Section 1 (context) → Section 3 (decisions) → Section 6 (roadmap) → Section 7 (pending). Sau đó jump vào task Tuần 1 hoặc câu hỏi anh muốn.

### 10.2. Nếu là Claude model khác (fable5, Sonnet, Haiku)

Đọc **TOÀN BỘ** document này. Chú ý đặc biệt:

- **Persona anchor:** Chị Nga 52 tuổi VN tái khởi nghiệp. Mọi thiết kế UX phải trả lời 3 câu: "Có phải cho tôi?" (Relevance), "Tôi bị lừa không?" (Trust), "Tôi làm được không?" (Effort).
- **Progressive Depth 3 tầng:** Free thấy Tầng 1 (section 1,2,7,10) · Active thấy Tầng 2+3 (all 11 sections). Đối tác đã set sẵn `visibility: public/locked` trong `model_sections`.
- **SAM (Sol Assessment Method):** Bài test 21 câu → 4 điểm P + 7 điểm R → match với 21 vector mỗi mô hình → Top 3. Chi tiết thuật toán trong `TEST-ENGINE-EXPLAINED.md`.
- **Anh Khang KHÔNG đọc code** — chỉ nhìn URL web, screenshot, và text output. Luôn ship deploy commands sẵn để anh copy-paste, không giải thích code line-by-line.

### 10.3. Nếu là AI khác (GPT / Gemini / Grok)

Yêu cầu quan trọng để bảo tồn "giọng Sol":
- **Persona VN 40-60:** Tiếng Việt bình dân, không jargon Anh trừ khi cần thiết. Chữ ≥16px, câu ngắn.
- **Ecosystem V2 lock:** sol.vn = marketing (WP), huongdi.sol.vn = product (Node.js). Không trộn lẫn.
- **Không đề xuất "MBTI dịch"** — Sol là hybrid custom framework (đọc `SAM-WHITEPAPER-V1.md`)
- **YMYL topic:** Định hướng nghề nghiệp = Your Money Your Life → cần EEAT signals + Tuyên bố miễn trừ.

### 10.4. Cache lại các insight quan trọng

**Ecosystem V2 lock (ADR):**
- sol.vn = marketing/SEO/trust (7 pillar SEO đã ranking)
- huongdi.sol.vn = product/app (5 Bước + AI Studio + Payment)
- Không nhét product content vào sol.vn hoặc marketing vào huongdi.

**Immutable versioning (ADR-012):**
- Content update không bao giờ ghi đè `model_versions` cũ
- User hành trình cũ vẫn đọc được version đã chốt của mình
- Publish version mới → tạo `template_update_notices` cho user cũ (không auto merge)

**Ân hạn journey rule:**
- User mua Active tháng 11 → hết hạn tháng 10 năm sau
- Nếu bắt đầu hành trình tháng 9 (còn 60 ngày gói) → được ghi tick đến `min(gate90+30d, created+180d)` kể cả hết gói
- Nguyên tắc: **không cắt ngang user giữa 90 ngày**

**5 QUYẾT ĐỊNH sản phẩm sắp ship (SPEC đối tác Section 2):**
1. Không auto-charge — in đậm ở `/pricing/`
2. Data vĩnh viễn — hết hạn vẫn export
3. Hoàn tiền 7 ngày lần kích hoạt đầu
4. Live counter slot Founder/Lifetime
5. Button Export + Delete tài khoản

---

## 11. Chỉ số phiên hôm nay

| Metric | Số |
|--------|:--:|
| Task hoàn thành | 20+ |
| ADR mới | 3 (010, 011, 012) |
| File docs | 9 (~200KB tổng) |
| File code | 6 (chờ deploy) |
| Số dòng markdown | ~2500+ |
| File quà đối tác audit | 4 |
| Deploy commands ready | 5 (SCP + SSH) |

---

## 12. Chúc anh khoẻ + hẹn phiên tiếp

Phiên hôm nay là **phiên lớn nhất từ đầu dự án Sol** — không chỉ code mà cả foundation về schema, product philosophy, whitepaper khoa học.

**Message cuối phiên:**
- Anh nghỉ ngơi thoải mái
- Deploy commands có sẵn khi anh rảnh
- 3 file quà đối tác đã audit đầy đủ — quyết định lớn (Phương án C) đã LOCK trong ADR-012
- Phiên tiếp theo (dù cùng laptop hay khác, cùng model hay khác) đều pick up seamless được từ document này

**Anh vào phiên mới chỉ cần nói:**
> "Đọc `2026-07-08-EOD-COMPREHENSIVE-WRAP.md` và tiếp tục Tuần 1"

Em (hoặc AI phiên sau) sẽ hiểu ngay context + roadmap.

**Sol La Bàn đang ở giai đoạn quyết định** — 4-6 tuần tới sẽ build hạ tầng cuối để scale marketing. Cứ bình tĩnh làm chắc, phần dễ nhất đã qua.

---

_Sol Ecosystem · CTY CP VINET · Khang Sol · nguyendinhkhang@gmail.com · Zalo 3547084958635197535_

**Session sealed at:** 2026-07-08, ~evening
**Next session opens at:** Anytime, anywhere, any Claude model — document này là chìa khoá
