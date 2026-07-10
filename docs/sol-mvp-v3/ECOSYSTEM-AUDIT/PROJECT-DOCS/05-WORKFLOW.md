# Sol Ecosystem — Development Workflow

**Version:** 1.0
**Last updated:** 2026-07-07

## Golden rule

**GitHub = Single Source of Truth. Laptop và Deploy phải đồng bộ với GitHub.**

Không được:
- Edit trực tiếp trên VPS
- Edit trực tiếp cPanel
- Có files trên Laptop mà không push GitHub
- Có files trên Deploy mà không có trong GitHub

## 3-tier architecture

```
┌──────────────────────────────────────────────────────────┐
│  1. LAPTOP (C:\BOTHUOCLA\sol-ecosystem\)                 │
│     - Edit code                                           │
│     - Test local                                          │
│     - git commit + push                                   │
└──────────────────────┬───────────────────────────────────┘
                       │ git push
                       ▼
┌──────────────────────────────────────────────────────────┐
│  2. GITHUB (github.com/nguyendinhkhangSOL/sol-ecosystem) │
│     - Private repo                                        │
│     - Full history                                        │
│     - Diff, revert, branches                              │
└──────────────────────┬───────────────────────────────────┘
                       │ git pull
                       ▼
┌──────────────────────────────────────────────────────────┐
│  3. DEPLOY (VPS + cPanel production)                     │
│     - VPS: git pull → rsync → PM2 restart                │
│     - cPanel: SFTP upload mu-plugins                     │
└──────────────────────────────────────────────────────────┘
```

## Workflow examples

### Case 1: Sửa 1 dòng CSS/JS (VD: text button)

```powershell
# Laptop
cd C:\BOTHUOCLA\sol-ecosystem
git pull                                    # Sync latest

code huongdi-public\index.html              # Edit
# ... make changes ...

git add huongdi-public\index.html
git commit -m "fix: update CTA button text on homepage"
git push
```

Deploy VPS (SSH):
```bash
ssh sol-vps
cd /var/www/huongdi-git
git pull
sudo rsync -av --exclude='.git' huongdi-public/ /var/www/huongdi/public/
```

Total time: 30 giây (vs 5 phút scp cách cũ).

### Case 2: Sửa Backend Node.js (thêm endpoint mới)

```powershell
# Laptop
cd C:\BOTHUOCLA\sol-ecosystem\huongdi-backend
code src\routes\user-auth.ts

# Test local (optional)
npm install
npm run dev                                 # Chạy port local

# Commit
git add src/routes/user-auth.ts
git commit -m "feat: add /api/user/preferences endpoint"
git push
```

Deploy VPS:
```bash
ssh sol-vps
cd /var/www/huongdi-git
git pull
sudo rsync -av --exclude='node_modules' --exclude='.env' huongdi-backend/ /var/www/huongdi/backend/
cd /var/www/huongdi/backend
sudo npm run build
pm2 restart huongdi-api
pm2 logs huongdi-api --lines 20 --nostream
```

### Case 3: Sửa WordPress sol.vn (mu-plugin PHP)

```powershell
# Laptop
cd C:\BOTHUOCLA\sol-ecosystem
code solvn-wp\mu-plugins\sol-default-template.php

git add solvn-wp/mu-plugins/sol-default-template.php
git commit -m "fix: WordPress footer copyright year"
git push
```

Deploy cPanel (không có SSH — dùng SFTP):

**Option A: WinSCP client**
- Host: `sol.vn`
- User: `<cpanel-username>`
- Password: `<cpanel-password>`
- Upload `solvn-wp/mu-plugins/sol-default-template.php` → `/public_html/wp-content/mu-plugins/`

**Option B: cPanel File Manager**
- Login cPanel → File Manager
- Điều hướng `/public_html/wp-content/mu-plugins/`
- Upload file overwrite

### Case 4: Rollback (VD deploy bug)

```bash
# SSH VPS — xem history
cd /var/www/huongdi-git
git log --oneline | head -5

# Rollback về commit trước
git revert HEAD                             # Undo commit cuối
git push origin main

# Deploy revert
bash scripts/deploy-huongdi-public.sh
```

Hoặc reset hard (nếu chưa push):
```bash
git reset --hard HEAD~1
```

## Checklist trước mỗi push

- [ ] Đã `git pull` latest chưa? (`git pull`)
- [ ] Edit + test local?
- [ ] Commit message rõ ràng?
- [ ] `git status` sạch (no uncommitted)?
- [ ] Push lên GitHub?
- [ ] Deploy production?
- [ ] Test URL live sau deploy?

## Commit message convention

Format: `<type>: <description>`

**Types:**
- `feat:` — Feature mới
- `fix:` — Bug fix
- `chore:` — Housekeeping (không thay đổi behavior)
- `docs:` — Update documentation
- `refactor:` — Cải thiện code, không đổi behavior
- `style:` — Format / whitespace / typo
- `test:` — Thêm hoặc sửa test
- `perf:` — Performance improvement

**Examples:**
- ✅ `feat: add /api/user/preferences endpoint`
- ✅ `fix: sol-ui.js AI Studio menu missing`
- ✅ `chore: cleanup .bak leftover files`
- ✅ `refactor: consolidate sol-auth.js single canonical path`
- ❌ `update` (không rõ)
- ❌ `fix` (không rõ fix gì)
- ❌ `aaa` (vô nghĩa)

## Rules không được vi phạm

### Rule 1: NEVER edit production directly
- Không SSH VPS → nano/vim file → save
- Luôn qua git

### Rule 2: NEVER commit `.env` hoặc secrets
- Files chứa password, API keys, JWT secret → `.gitignore`
- Trên VPS, `.env` riêng biệt, không sync git

### Rule 3: Commit message rõ ràng
- Format `<type>: <description>`
- Không "update", "fix", "aaa"

### Rule 4: Test local trước khi push
- Static HTML: mở file browser
- Node.js: `npm run dev`
- CSS: verify visual local

### Rule 5: Backup trước migration DB
- Luôn `pg_dump` trước `prisma migrate deploy`
- Xem `06-DEPLOY.md` cho migration workflow

## Branching strategy (Future)

Hiện tại: single `main` branch, ship directly.

Khi có multi-dev hoặc feature lớn:

```
main                    ← Production
  ├── feature/xxx       ← Feature branch (dev)
  └── hotfix/xxx        ← Emergency fix
```

Flow:
1. `git checkout -b feature/ai-studio-tab-2`
2. Edit, commit
3. Push branch: `git push -u origin feature/ai-studio-tab-2`
4. Create PR trên GitHub → review → merge
5. `git checkout main && git pull`

## Git basics cheatsheet

```bash
git status                    # Xem thay đổi
git add <file>                # Stage file
git add .                     # Stage tất cả
git commit -m "msg"           # Commit
git push                      # Push lên GitHub
git pull                      # Pull từ GitHub
git log --oneline             # Xem history
git diff                      # Xem thay đổi trước commit
git diff --cached             # Xem thay đổi đã stage
git revert HEAD               # Undo commit cuối
git reset --soft HEAD~1       # Undo commit, giữ changes
git stash                     # Tạm giấu changes
git stash pop                 # Lấy lại stashed changes
```

## Development environment setup (New machine)

```powershell
# 1. Install prerequisites
# - Git for Windows: https://git-scm.com/download/win
# - Node.js 20 LTS: https://nodejs.org/
# - VS Code: https://code.visualstudio.com/

# 2. Clone repo
cd C:\BOTHUOCLA
git clone https://github.com/nguyendinhkhangSOL/sol-ecosystem.git
cd sol-ecosystem

# 3. Setup Git credential (lần đầu push sẽ popup login browser)
git config user.name "Khang Sol"
git config user.email "nguyendinhkhang@gmail.com"

# 4. Backend setup
cd huongdi-backend
npm install
cp .env.example .env                        # Fill in secrets
npx prisma generate
npm run dev                                  # Chạy port 3001

# 5. Frontend: open HTML files trong browser
```

## Comparison — Before vs After

| Aspect | Before (chaos) | After (chuẩn) |
|--------|---------------|---------------|
| Update code | scp 5 phút | git push 30 giây |
| Rollback | Tìm .bak-timestamp | git revert 1 lệnh |
| Onboarding dev | 2-3 giờ giải thích | 15 phút đọc README |
| Backup | Manual mỗi lần | Tự động qua git |
| Track changes | Không có | git log rõ ràng |
| Collaboration | 1 mình | Multi-dev qua branches |
| Version conflict | Có (vá bản cũ) | Không (single truth) |
