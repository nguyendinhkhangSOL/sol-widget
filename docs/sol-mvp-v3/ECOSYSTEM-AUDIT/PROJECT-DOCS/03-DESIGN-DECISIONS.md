# Sol Ecosystem — Design Decisions (ADR log)

**Version:** 1.0
**Last updated:** 2026-07-07

Architecture Decision Records — mỗi quyết định lớn về design/architecture ghi ở đây với: context, decision, consequences.

Format: mỗi ADR có 1 heading `## ADR-NNN: Title`.

---

## ADR-001: Auth pages KHÔNG include header/footer sol-ui.js

**Date:** 2026-07-07
**Decision by:** Khang Sol
**Status:** ✅ Locked

### Context
Các trang auth flow (login, dang-ky, kich-hoat, quen-mat-khau, reset-password, tai-khoan preview trước login) — user cần focus 100% vào action auth. Header/footer sol-ui.js với menu + branding + Zalo widget → distraction, giảm conversion, và làm trang nặng.

### Decision
**Từ giờ, tất cả trang auth flow — KHÔNG include:**
- `<script src="/sol-ui.js"></script>` (header + footer nav)
- `<script src="/js/sol-user-nav.js"></script>` (login pill widget)
- `<script src="/sol-avatar-icon.js"></script>` (legacy V1.2)

**Chỉ giữ:**
- `<script src="/js/sol-auth.js"></script>` (auth logic — cần cho form submit)
- `<script src="/js/sol-api-sync.js"></script>` (API wrapper)
- Custom CSS inline minimal

### Trang áp dụng
- `/dang-nhap/` (login)
- `/dang-ky/` (register)
- `/kich-hoat/` (magic link activation)
- `/quen-mat-khau/` (forgot password)
- `/reset-password/` (reset with token)

### Trang KHÔNG áp dụng (có header + footer)
- `/toi/` (dashboard sau login)
- `/tai-khoan/` (account settings sau login)
- `/thanh-toan/` (payment page — cần header cho navigation về)
- Landing + content pages

### Consequences
- Auth pages nhẹ hơn ~40KB (không load sol-ui.js + font Google)
- LCP tăng ~30%
- User không thoát flow giữa chừng do menu distraction
- Nếu cần "Back to home" — dùng logo link đơn giản top-left, không cần full nav

### Implementation
Update `docs/ecosystem-audit/AUTH-PAGES-CANONICAL.md` với template HTML chuẩn cho auth page.

---

## ADR-002: Single Source of Truth = GitHub

**Date:** 2026-07-07
**Decision by:** Khang Sol
**Status:** ✅ Locked

### Context
Trước 2026-07-07, code scattered ở 3 nơi:
- Laptop `C:\BOTHUOCLA\sol-widget\`
- VPS `/var/www/huongdi/`
- cPanel `/public_html/`

Cùng 1 file có 3 versions khác nhau. Update là scp qua lại 5 phút. Rollback tìm `.bak-timestamp`. Bug do vá lại bản cũ.

### Decision
**GitHub `nguyendinhkhangSOL/sol-ecosystem` (Private) = single source of truth.**

- Laptop clone repo, edit local
- git commit + push → GitHub
- Deploy: git pull trên VPS + SFTP upload cho cPanel
- CẤM edit trực tiếp production

### Consequences
- Rollback dùng `git revert` (1 lệnh) thay tìm .bak
- Diff qua `git diff` — biết chính xác thay đổi
- Multi-dev collaboration khả thi qua branches
- Push 30 giây thay scp 5 phút

### Enforcement
- Rule 1 trong `WORKFLOW.md`
- Anh Khang call out nếu Claude vi phạm

---

## ADR-003: Payment page ở huongdi.sol.vn (KHÔNG sol.vn)

**Date:** 2026-07-06
**Decision by:** Khang Sol
**Status:** ✅ Deployed

### Context
Ban đầu `/thanh-toan/` ở `sol.vn/thanh-toan/index.html` (WordPress). Nhưng payment cần:
- Register-first enforcement (check email tồn tại)
- Backend API call (Node.js, không WordPress)
- Same-origin để tránh CORS

### Decision
Move `/thanh-toan/` từ sol.vn → `huongdi.sol.vn/thanh-toan/`.

### Consequences
- Same-origin với API `huongdi.sol.vn/api/*` — không CORS
- Register-first enforcement dễ implement
- User flow: SEO sol.vn → huongdi.sol.vn (main product) → payment same domain
- Legacy URL `sol.vn/thanh-toan/` → 301 redirect

---

## ADR-004: Unified Auth architecture — 2 flows (register + payment) chia sẻ backend

**Date:** 2026-07-05
**Decision by:** Khang Sol
**Status:** ✅ Deployed backend, ⏳ Sub-D pending

### Context
Trước: `/dang-ky/` và `/thanh-toan/` có 2 backend logic riêng, dẫn tới:
- Duplicate code
- User đăng ký 2 lần (email 1 lần từ leads, 1 lần từ register)
- Orphan leads không link vào users

### Decision
**Unified backend logic:**
- POST `/api/user/register` — Tạo user + auto-link orphan lead + auto-upgrade tier
- POST `/api/leads` — Chỉ dành cho quiz Bước 1 (chưa có user)
- POST `/api/activate` — 4 cases (logged in, conflict, shell user, new)
- POST `/api/activate/set-password` — Sau magic link activate

### Consequences
- 2 flows dùng chung logic → giảm bug
- Email = unique key across leads + users
- Auto-link giảm ma sát UX

### Sub-tasks
- Sub-A: DB schema (source, status, source_lead_id, magic_token_expires_at) — ✅
- Sub-B: Backend TypeScript refactor — ✅
- Sub-C: Frontend /thanh-toan/ email check + /kich-hoat — ✅
- Sub-D: Data cleanup + E2E test — ⏳ Pending

---

## ADR-005: AI Studio dùng iframe lazy load

**Date:** 2026-07-06
**Decision by:** Khang Sol
**Status:** ⚠️ Deprecated (2026-07-08) — Replaced by ADR-010 (submenu pattern)

### Context
Merge 3 features vào 1 menu item:
- Prompt Library (40 templates)
- Prompt Studio (biên tập cá nhân hoá)
- Sol Đồng Hành AI (Claude chat)

Options: (a) rewrite 3 pages thành 1 SPA, hoặc (b) iframe lazy load.

### Decision
Chọn (b) — iframe lazy load:
- Tab 1 (Library) — iframe load ngay
- Tab 2 (Editor), Tab 3 (Chat) — lazy load khi click tab
- Mỗi iframe truyền `?embed=1` — 3 widgets (sol-ui, sol-user-nav, sol-avatar-icon) SKIP inject để tránh duplicate

### Consequences
- Không cần rewrite 3 pages
- Đảm bảo backward compat (URL /prompts/, /prompts-studio/, /toi/sol-dong-hanh/ vẫn work standalone)
- Downside: 3 iframes = 3 auth checks. Chấp nhận vì token trong cookie, share domain.

### Implementation
- `huongdi-public/ai-studio/index.html` — Container
- Mỗi tab file có check: `if (URLSearchParams.get('embed') === '1') return;` skip widget

---

## ADR-006: Kiểm tra 3 phút CTA — Footer link + Homepage box, KHÔNG menu

**Date:** 2026-07-06
**Decision by:** Khang Sol
**Status:** ✅ Deployed

### Context
"Kiểm tra 3 phút" (quiz Bước 1) từng ở menu chính. Nhưng:
- Quá đơn giản để nằm menu top level
- Menu chính nên focus core value (5 Bước framework)

### Decision
- Xoá "Kiểm tra 3 phút" khỏi menu chính
- Thêm CTA box trong homepage V4.1 (hero + section riêng)
- Thêm link trong footer section "Tài nguyên" với badge `[QUIZ]`

### Consequences
- Menu chính gọn hơn (5 items → 5 items nhưng focus hơn: 5 Bước + AI Studio + Blog)
- Discovery vẫn cao qua homepage + footer

---

## ADR-007: 3-tier pricing (Free / Active / Founder), zero coach 1-1

**Date:** 2026-07-04
**Decision by:** Khang Sol
**Status:** ✅ Locked (V4.1)

### Context
Nhiều options considered: 3-tier với coach 1-1, subscription monthly vs annual, single tier vs tiered.

### Decision
**SOLO-FRIENDLY combo:**
- Free — 5/37 hướng đi, no AI, no journey
- Active — 499k/năm, full 37 + Sổ Hành Trình + Sol Đồng Hành AI
- Founder Edition — 1.999k lifetime, limited 100 slots (scarcity)

**KHÔNG có coach 1-1** — Khang không có bandwidth 1-1 cho scale.

### Consequences
- Zero recurring service delivery ngoài AI + email
- Founder tier tạo urgency + monetize early adopters
- Nếu 100 Founder × 1.999k = ~200 triệu upfront runway

---

## ADR-008: cPanel WordPress backup qua JetBackup, KHÔNG File Manager Compress

**Date:** 2026-07-07
**Decision by:** Khang Sol
**Status:** ✅ Learned from experience

### Context
File Manager Compress hit "Disk quota exceeded" khi compress `public_html/` — mặc dù disk còn 34% free. Root cause: inode quota / PHP memory limit / temp storage.

### Decision
Backup cPanel dùng **JetBackup 5** — tool chuyên backup, chạy backend không qua PHP.
- Auto-backup daily lên FPT NAS (external storage)
- Restore & Download tab → chọn snapshot → Add to Download Queue

### Consequences
- Backup file luôn có sẵn (giữ 7 daily + monthly snapshots)
- Không cần compress thủ công
- Restore point mỗi ngày

### Alternative fallback
Backup Wizard — nếu JetBackup không có sẵn trên hosting provider.

---

## ADR template (dùng cho ADR mới)

```markdown
## ADR-NNN: Title ngắn gọn

**Date:** YYYY-MM-DD
**Decision by:** Người quyết định
**Status:** Proposed | Locked | Deployed | Deprecated

### Context
Bối cảnh dẫn tới quyết định.

### Decision
Quyết định cụ thể.

### Consequences
Kết quả tích cực + tiêu cực.

### Implementation (optional)
Chi tiết implementation nếu cần.
```


---

## ADR-009: Mobile Header — Preserve "Đi Cùng Sol" text, move CTA to hamburger dropdown

**Date:** 2026-07-07
**Decision by:** Khang Sol
**Status:** ✅ Locked

### Context
Trên mobile (<900px), header ban đầu có 4 elements: Logo + CTA "Bắt đầu miễn phí" + Hamburger + Avatar. Quá chật, CTA chiếm nhiều space không cần thiết. Cần đơn giản hoá nhưng vẫn giữ brand recognition.

### Decision
**Mobile header (max-width: 900px):**
- ✅ **GIỮ** logo icon + text "Đi Cùng **Sol**" (font-size 15px, `.hd-logo img` 26x26px)
- ✅ Hamburger ☰ toggle menu
- ✅ Avatar user (từ sol-user-nav.js) + tier badge
- ❌ **HIDE** CTA "Bắt đầu miễn phí" trên top bar
- ✅ Move CTA vào dropdown menu cuối cùng (class `.hd-cta-mobile`, nút cam nổi bật)

**Không hide text "Đi Cùng Sol" kể cả breakpoint 480px** vì brand recognition quan trọng hơn 20px space.

### Consequences
- Mobile header clean (3 elements: logo+text, hamburger, avatar)
- User đã login không thấy CTA "Bắt đầu miễn phí" redundant → thay bằng "Dashboard →" trong dropdown
- Brand "Đi Cùng Sol" luôn hiển thị → không có confusion về context
- CTA vẫn accessible qua hamburger dropdown (không mất conversion opportunity)

### Implementation
- File: `huongdi-public/sol-ui.js`
- CSS media queries: `@media (max-width: 900px)` + `@media (max-width: 480px)`
- Hamburger toggle logic với 3 cl

---

## ADR-010: AI Studio dùng submenu 3 URL riêng thay iframe container

**Date:** 2026-07-08
**Decision by:** Khang Sol
**Status:** ✅ Deployed (thay ADR-005)

### Context
ADR-005 iframe pattern có 2 issue nặng trên mobile:
1. Nested scroll — iframe cuộn riêng ngoài body cuộn, gây ma sát UX
2. Hero + tabs bar ai-studio container chiếm ~30% viewport → content view nhỏ

Feedback trực tiếp anh Khang: "trang rất khó dùng trong mobile" + "hệ thống của mình đã public nên cần sửa ngay tránh mất khách".

### Decision
Tách 3 tính năng thành 3 URL riêng, dùng dropdown submenu trong nav chính.

URL structure (LOCKED):
- `/ai-studio/` = Thư viện Prompt (40 mẫu)
- `/tao-prompts-ca-nhan/` = Biên tập Prompt cá nhân hoá
- `/toi/sol-dong-hanh/` = Sol AI Đồng Hành (Claude chat)

Menu: "🎨 AI Studio" → dropdown 3 items (desktop hover, mobile accordion nested).

### Redirect landscape (backward compat)
- `/prompts/` → `/ai-studio/` (JS replace)
- `/prompts-studio/` → `/tao-prompts-ca-nhan/`
- `/ai-studio/?tab=library` → `/ai-studio/` (strip query)
- `/ai-studio/?tab=editor` → `/tao-prompts-ca-nhan/`
- `/ai-studio/?tab=chat` → `/toi/sol-dong-hanh/`

### Consequences
- Mobile UX chuẩn (no nested scroll)
- SEO friendly (URL riêng cho mỗi feature)
- Natural browser back/forward
- Trade-off: mất context giữa 3 tabs (chấp nhận, vì workflow người dùng đi tuần tự)

### Implementation
- `huongdi-public/ai-studio/index.html` — nội dung Thư viện Prompt (không còn iframe)
- `huongdi-public/tao-prompts-ca-nhan/index.html` — NEW folder cho biên tập
- `huongdi-public/prompts/index.html` — clean redirect (window.location.replace)
- `huongdi-public/prompts-studio/index.html` — clean redirect
- `huongdi-public/sol-ui.js` — NAV_ITEMS với children + CSS `.hd-nav-submenu`
- Legacy `?tab=` handler ở đầu `/ai-studio/index.html`

---

## ADR-011: Filter listbox trên mobile — thay tabs wrap

**Date:** 2026-07-08
**Decision by:** Khang Sol
**Status:** ✅ Locked

### Context
Sau khi deploy ADR-010, trang `/ai-studio/` có 6 tab filter (Tất cả + 5 Bước Sol La Bàn) dùng `flex-wrap: wrap`. Trên mobile 385px, 6 tabs xếp 6 dòng, cộng với `.tabs-wrapper` `position: sticky; top: 0` → **chiếm hết viewport, đẩy content prompt ra ngoài màn hình**.

Anh Khang phản hồi: "5 bước chọn nhóm chiếm hết màn hình làm việc. Nên xử lý vào listbox hoặc kiểu nào đó để không bị chiếm màn hình".

### Decision
Trên mobile (`max-width: 900px`), thay tabs button bằng native `<select>` listbox.

- Desktop giữ nguyên tabs UI (đẹp + fast switch)
- Mobile: hide `.tabs`, show `<select class="tabs-mobile">` viền cam nổi bật
- JS sync giữa 2 UI: `switchTab()` update `<select>`, `switchTabMobile()` update tab buttons
- Bonus: helper-box collapse thành `<details>` trên mobile (h3 hide, summary hiển thị)
- Bonus: `.tabs-wrapper` un-sticky trên mobile

### Consequences
- Mobile: filter chỉ chiếm 1 dòng — content prompt visible ngay
- Native select UX quen thuộc với user 40-60 (không cần swipe/scroll)
- Không breaking desktop UX
- Trade-off: filter theo "Bước" đòi 2 tap trên mobile (tap select + tap option) — chấp nhận

### Implementation
File: `huongdi-public/ai-studio/index.html`
- CSS `.tabs-mobile { display:none }` desktop
- `@media (max-width:900px)` show select, hide tabs, un-sticky
- HTML `<select id="tabs-mobile" onchange="switchTabMobile(this.value)">`
- JS `switchTabMobile(val)` + sync trong `switchTab()` + `clearFilters()`



---

## ADR-012: Adopt schema đối tác làm base — Sol wraps thay vì refactor lại

**Date:** 2026-07-08
**Decision by:** Khang Sol
**Status:** ✅ Locked — chờ ship code

### Context
Đối tác đã bàn giao 3 file quan trọng:
1. 8 mô hình rich content 16-20KB/bộ (chất lượng cao)
2. Schema DB Postgres/Supabase production-ready (versioning, immutable, section gating, journey system chuyên nghiệp)
3. SQL seed 38 mô hình + lộ trình biên soạn 3 đợt (P1-P3)

Có 3 phương án tích hợp: (A) Adopt hoàn toàn 38 đối tác bỏ 37 Sol, (B) Merge chọn lọc giữ cả 2, (C) Đối tác làm base — migrate Sol vào.

### Decision
**Chọn phương án C — Đối tác làm schema base.**

Lý do chiến lược: cần đối tác cho các bản cập nhật sau này. Nếu Sol tự chế schema riêng → mỗi lần đối tác biên soạn thêm nghề mới, Sol phải refactor. Nếu Sol adopt schema đối tác → mỗi lần cập nhật = chạy 1 SQL seed.

### Consequences
- ✅ Long-term partnership benefit — đối tác dễ push update
- ✅ Kiến trúc thuần 1 nguồn (models + model_versions + model_sections + journeys...)
- ✅ Không có "Sol format" vs "đối tác format" — chỉ 1 format
- ✅ Đối tác đã suy nghĩ đầy đủ về versioning, immutable, RLS, journey system
- ⚠️ Effort refactor 37 direction Sol (~1 tuần) — migrate vào MH-201 → MH-223
- ⚠️ Archive 2 direction Sol trùng nghề đối tác đã LOẠI (#17 dau-tu-tai-chinh + #22 cham-soc-suc-khoe-tai-nha)

### Implementation
- Prisma migration adopt full schema đối tác
- SQL seed 38 mô hình đối tác chạy trực tiếp
- Migrate 37 direction Sol → MH-201-223 giữ user FK (SavedDirection, JourneyDay)
- Sol contribute layer: `model_scores` (21 vector) làm bảng riêng — không nằm trong `model_versions` immutable

### 2 nghề nhạy cảm archive
- Sol #17 dau-tu-tai-chinh — trùng "đầu tư CK" mà đối tác đã loại vì tư vấn tài chính không phép
- Sol #22 cham-soc-suc-khoe-tai-nha — trùng "đồng hành người cao tuổi" mà đối tác đã loại vì trách nhiệm sức khoẻ

Đây là YMYL topic — tôn trọng phán đoán chuyên môn đối tác.

### Combo biên soạn 30 mô hình mới
- Đợt 1 P1 (6 mô hình): MH-113/115/121/125/129/133 — đối tác biên soạn nếu có scope, hoặc Sol Claude API
- Đợt 2 P2 (10 mô hình): Sol Claude API + Master Prompt đối tác
- Đợt 3 P3 (14 mô hình): Sol Claude API

