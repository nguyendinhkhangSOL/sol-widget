# Sol Ecosystem — Master Registry & Kiến trúc dọn dẹp

**Ngày audit:** 2026-07-07
**Đích:** Xác định single source of truth cho toàn bộ assets. Dọn dẹp chaos hiện tại.

---

## 🚨 Vấn đề hiện tại (Thẳng thắn)

### 3 environments không có single source of truth

```
┌─────────────────────────────────────────────────────────┐
│  1. VPS (huongdi.sol.vn + adminhuongdi.sol.vn)          │
│     /var/www/huongdi/public/    ← files live            │
│     /var/www/huongdi/backend/   ← Node.js API           │
│     Backups: sol-ui.js.bak-1783xxxx (rác backup 10+)    │
├─────────────────────────────────────────────────────────┤
│  2. Shared Host (sol.vn WordPress)                       │
│     /public_html/               ← WordPress             │
│     /wp-content/mu-plugins/     ← Custom PHP templates  │
│     Backups: index.html.bak-2026xxx (nhiều versions)    │
├─────────────────────────────────────────────────────────┤
│  3. Local (C:\BOTHUOCLA\sol-widget\)                    │
│     docs/sol-mvp-v3/            ← Design docs + drafts  │
│     huongdi-public/             ← Copy từ VPS (partial) │
│     huongdi-backend-latest/     ← Copy backend          │
│     Nhiều files legacy scattered                        │
└─────────────────────────────────────────────────────────┘
```

### Hệ quả

- ❌ Update = scp qua lại giữa 3 environments
- ❌ Backup files .bak-xxx đầy khắp mọi nơi (10+ versions per file)
- ❌ Không biết version nào là "current"
- ❌ Không có changelog / git history
- ❌ Rollback phải guess timestamp
- ❌ Không thể deploy tự động (CI/CD)

**Chuẩn business KHÔNG chấp nhận cách này.**

---

## 📊 Audit hiện trạng — 3 tầng

### Tầng 1: VPS huongdi.sol.vn

**Location:** `/var/www/huongdi/`

**Files quan trọng:**

| Path | Vai trò | Nguồn gốc | Trạng thái |
|------|---------|-----------|-----------|
| `public/index.html` | Homepage | Edit trực tiếp VPS | ⚠️ Nhiều `.bak-*` |
| `public/sol-ui.js` | Global header/footer | Edit trực tiếp VPS + local patches | ⚠️ 8+ backups |
| `public/sol-avatar-icon.js` | Widget legacy | Edit trực tiếp VPS | Live |
| `public/js/sol-user-nav.js` | Widget V3 login pill | Edit trực tiếp VPS | Live |
| `public/js/sol-auth.js` | Auth client | Edit trực tiếp VPS | Live |
| `public/js/sol-api-sync.js` | API client | Edit trực tiếp VPS | Live |
| `public/js/sol-flow.js` | 5 Bước flow | Edit trực tiếp VPS | Live |
| `public/kham-pha-ban-than/` | Bước 1 page | Edit trực tiếp VPS | Live |
| `public/kiem-ke-nguon-luc/` | Bước 2 page | Edit trực tiếp VPS | Live |
| `public/la-ban-huong-di/` | Bước 3 page | Edit trực tiếp VPS | Live |
| `public/prompts/` | Prompt library | Edit trực tiếp VPS | Live |
| `public/prompts-studio/` | Editor | Edit trực tiếp VPS | Live |
| `public/toi/sol-dong-hanh/` | Chat AI | Edit trực tiếp VPS | Live |
| `public/thanh-toan/` | Payment (mới migrate) | Edit trực tiếp VPS | Live |
| `public/kich-hoat/` | Activation (mới) | Edit trực tiếp VPS | Live |
| `public/ai-studio/` | AI Studio hub (mới) | Edit trực tiếp VPS | Live |
| `public/dang-nhap/`, `dang-ky/`, `quen-mat-khau/`, `dat-lai-mat-khau/`, `dang-xuat/` | Auth pages | Edit trực tiếp VPS | Live |
| `public/toi/` (dashboard) | Product dashboard | Edit trực tiếp VPS | Live |
| `public/founder/`, `pricing/`, `lien-he/` | Marketing pages | Edit trực tiếp VPS | Live |
| `public/dashboard.html`, `login.html` | Legacy | Edit trực tiếp VPS | ⚠️ Duplicate? |
| `public/p1.html`, `p2.html`, `p3*.html` | Legacy? | Edit trực tiếp VPS | ⚠️ Nhiều .bak duplicate |

**Backend Node.js:** `/var/www/huongdi/backend/`

| Path | Vai trò |
|------|---------|
| `src/routes/` | Express routes (auth, leads, directions, etc.) |
| `src/middleware/` | Auth middleware |
| `src/services/` | Business logic |
| `prisma/schema.prisma` | DB schema |
| `.env` | Secrets (SMTP, JWT, DB URL, Anthropic) |
| PM2 process: `huongdi-api` port 4001 |

### Tầng 2: Shared Host sol.vn (WordPress)

**Location:** `/public_html/` (cPanel LiteSpeed)

**Files quan trọng:**

| Path | Vai trò | Trạng thái |
|------|---------|-----------|
| `wp-content/mu-plugins/sol-default-template.php` | Template default WP pages | Live |
| `wp-content/mu-plugins/sol-post-template.php` | Template blog posts | Live |
| `wp-content/mu-plugins/sol-archive-template.php` | Template /huong-di/ archive | Live |
| `wp-content/mu-plugins/sol-landing-template.php` | Homepage template | Live |
| `wp-content/mu-plugins/sol-redirects.php` | 301 redirects | Live |
| `wp-content/mu-plugins/sol-user-nav.php` | Widget V3 loader | Live |
| `wp-content/uploads/sol/sol-user-nav.js` | Widget V3 JS | Live |
| `wp-content/plugins/rank-math-*` | SEO | Live |
| `wp-content/plugins/wpcode-lite` | Snippets injector | Live |
| `wp-content/plugins/litespeed-cache` | Page cache | Live |
| Blog posts + Pages (in DB, WP editor) | Content | Live |

### Tầng 3: Local Development

**Location:** `C:\BOTHUOCLA\sol-widget\`

**Cấu trúc:**

| Path | Vai trò |
|------|---------|
| `docs/sol-mvp-v3/` | Design docs, drafts, plans (400+ files) |
| `docs/sol-mvp-v3/BUOC-4-ROADMAP/prompts/` | 37 prompt files chưa run |
| `docs/sol-mvp-v3/EMAIL-UNIFICATION/` | Auth refactor design + code |
| `docs/sol-mvp-v3/AI-STUDIO/` | AI Studio mockup + design |
| `docs/sol-mvp-v3/CRM-MASTER/` | CRM architecture design |
| `huongdi-public/` | Sync từ VPS (partial, latest 2026-07-07) |
| `huongdi-backend-latest/` | Sync backend Node.js |
| `wiki-skeletons/` | Legacy content |
| Nhiều folders legacy scattered |

---

## ✅ Kiến trúc chuẩn đề xuất — Git Monorepo

```
┌────────────────────────────────────────────────────────────┐
│  GitHub (private repo) — SINGLE SOURCE OF TRUTH             │
│  Ví dụ: github.com/khang-sol/sol-ecosystem                  │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  sol-ecosystem/                                              │
│    ├── huongdi-public/          ← Static assets huongdi.sol.vn│
│    │   ├── *.html                                            │
│    │   ├── js/*.js                                           │
│    │   ├── kham-pha-ban-than/                                │
│    │   ├── ...                                               │
│    │   └── sol-ui.js                                         │
│    │                                                          │
│    ├── huongdi-backend/         ← Node.js API                │
│    │   ├── src/                                              │
│    │   ├── prisma/                                           │
│    │   ├── package.json                                      │
│    │   └── ecosystem.config.js (PM2)                         │
│    │                                                          │
│    ├── solvn-wp/                ← WordPress custom code      │
│    │   ├── mu-plugins/                                       │
│    │   │   ├── sol-default-template.php                      │
│    │   │   ├── sol-post-template.php                         │
│    │   │   └── sol-user-nav.php                              │
│    │   └── theme-customizations/                             │
│    │                                                          │
│    ├── admin/                   ← Admin panel                 │
│    │                                                          │
│    ├── content/                 ← Content assets              │
│    │   ├── prompts/ (37 files)                               │
│    │   ├── directions/ (37 mô hình data)                     │
│    │   └── case-studies/                                     │
│    │                                                          │
│    ├── docs/                    ← Documentation               │
│    │   ├── ARCHITECTURE.md                                   │
│    │   ├── DEPLOY.md                                         │
│    │   ├── CHANGELOG.md                                      │
│    │   └── SECRETS.md (.gitignored)                          │
│    │                                                          │
│    ├── scripts/                 ← Deploy scripts              │
│    │   ├── deploy-huongdi.sh                                 │
│    │   ├── deploy-backend.sh                                 │
│    │   └── deploy-solvn.sh (WordPress via SFTP/cPanel)       │
│    │                                                          │
│    ├── .env.example                                          │
│    ├── .gitignore                                            │
│    └── README.md                                             │
│                                                              │
└────────────────────────────────────────────────────────────┘
                          ↓ git pull
        ┌─────────────────┼─────────────────┐
        ↓                 ↓                 ↓
   VPS huongdi       VPS backend       cPanel sol.vn
   (git pull         (git pull +       (git pull /
    static assets)    npm install +     manual sync via
                      pm2 restart)      GitHub Actions)
```

---

## 🎯 Workflow chuẩn từ nay

### Trước (Chaos)
```
Edit trực tiếp VPS → File.bak-timestamp
Scp qua lại giữa local/VPS/cPanel
Không có changelog
Rollback = guess
```

### Sau (Chuẩn)
```
1. Local: git clone sol-ecosystem
2. Edit code
3. git commit -m "Fix: ..."
4. git push origin main
5. Deploy:
   - Auto (GitHub Actions webhook)
   - Or manual: ssh sol-vps + git pull
6. Rollback = git revert or checkout previous tag
```

---

## 🚦 Roadmap dọn dẹp (4 phases)

### Phase 1 — Consolidate (1-2 giờ)

- [ ] Setup GitHub private repo `sol-ecosystem`
- [ ] Sync toàn bộ VPS `/var/www/huongdi/` về repo
- [ ] Sync sol.vn mu-plugins về repo (từ cPanel download)
- [ ] Xoá tất cả `.bak-*` files trên VPS (đã có git history thay thế)
- [ ] Push initial commit

### Phase 2 — Setup Deploy (1 giờ)

- [ ] Setup SSH deploy key GitHub → VPS
- [ ] Ship deploy scripts:
  - `deploy-huongdi.sh` — pull assets → rsync public/
  - `deploy-backend.sh` — pull + npm install + prisma migrate + pm2 restart
  - `deploy-solvn.sh` — pull → sftp/ftp to shared host
- [ ] Test deploy end-to-end

### Phase 3 — Documentation (30 phút)

- [ ] `README.md` — cách chạy local dev
- [ ] `DEPLOY.md` — cách deploy production
- [ ] `ARCHITECTURE.md` — diagram + explain
- [ ] `CHANGELOG.md` — track versions
- [ ] `.env.example` — required env vars

### Phase 4 — Cleanup Legacy (30 phút)

- [ ] Xóa files legacy trên VPS không dùng
- [ ] Xóa folders duplicate trong local (`huongdi-public`, `huongdi-backend-latest` sau khi đã trong git)
- [ ] Archive `docs/sol-mvp-v3/` (giữ readonly)

**Total effort:** ~3-4 giờ cho toàn bộ dọn dẹp.

---

## 💰 ROI (Return on Investment)

Đầu tư: 3-4 giờ setup 1 lần.

Tiết kiệm:
- ✅ Update code: 30 giây (git push) thay 5 phút (scp + copy + verify)
- ✅ Rollback: 1 lệnh (git revert) thay 10 phút (tìm .bak file)
- ✅ Onboarding developer mới: 15 phút (git clone + đọc README)
- ✅ Backup: tự động qua git (không cần backup manual)
- ✅ Changelog: rõ ràng, ai làm gì khi nào

**Break-even sau ~10 lần update.** Sau đó chỉ có thoi giạn tiết kiệm.

---

## ❓ Câu hỏi anh quyết trước khi ship

1. **GitHub hay GitLab?**
   - GitHub (Recommended): Popular, free private repos, tốt cho anh recruit dev later
   - GitLab: Có sẵn CI/CD tốt hơn nhưng UI phức tạp hơn

2. **Public hay Private repo?**
   - Private (Recommended cho MVP): Bảo mật content Sol
   - Public: Sau khi launch → OSS parts

3. **Deploy strategy:**
   - Manual git pull trên VPS (đơn giản, Recommended)
   - GitHub Actions auto-deploy (advanced, cần setup 30 phút thêm)

4. **Sync WordPress sol.vn?**
   - Chỉ track mu-plugins/*.php (Recommended)
   - Full wp-content (bao gồm uploads media → nặng)

Anh trả lời 4 câu → em ship implementation Phase 1 (setup repo + push initial).

---

## 🚨 Nhìn thẳng thắn — Vấn đề em gây ra

- ❌ Suốt sessions, em edit trực tiếp VPS thay guide anh dùng git
- ❌ Ship files scattered trong `docs/sol-mvp-v3/` không consolidate
- ❌ Nhiều versions .bak khắp nơi (widget v1, v2, v3, v3.2, v3.3, v3.4)
- ❌ Không có 1 doc "how deploy" từ trước

**Em xin lỗi.** Từ giờ, mỗi khi ship code em sẽ:
1. Ship qua git commit (nếu đã setup)
2. Hoặc tạm ship files với path CLEAR (không scattered)
3. Update MASTER-REGISTRY này khi thêm asset mới

Anh review + trả lời 4 câu hỏi trên → em bắt đầu Phase 1 dọn dẹp.
