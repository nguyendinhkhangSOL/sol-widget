# Phase 1 Setup — Git Monorepo cho Sol Ecosystem

**Effort:** ~1 giờ (chia thành 4 bước, mỗi bước ~15 phút)
**Đích:** Có 1 GitHub private repo chứa toàn bộ code, deploy từ đây về VPS + cPanel.

---

## 📋 Prerequisites

- Anh đã có tài khoản GitHub (nếu chưa: `https://github.com/signup`)
- Git installed trên máy Windows (`https://git-scm.com/download/win`)

Verify:
```powershell
git --version
```

---

## 🚀 BƯỚC 1: Tạo GitHub Private Repo (5 phút)

### 1.1 Tạo repo trên GitHub

1. Login `https://github.com/`
2. Click "+" góc trên phải → **New repository**
3. Fill:
   - **Repository name:** `sol-ecosystem`
   - **Description:** "Sol La Bàn ecosystem — huongdi.sol.vn + sol.vn"
   - **Visibility:** ⚫ **Private** (quan trọng!)
   - ✅ Add README file
   - ❌ Không add .gitignore, license (em ship sau)
4. Click **Create repository**

### 1.2 Note URL repo

Sau khi tạo, anh sẽ có URL dạng:
```
https://github.com/khang-sol/sol-ecosystem.git
```

**Copy URL này** — cần cho bước sau.

---

## 🔑 BƯỚC 2: Setup SSH key GitHub (10 phút)

Để `git push` không cần login mỗi lần.

### 2.1 Generate SSH key

**Trong PowerShell (máy anh):**
```powershell
ssh-keygen -t ed25519 -C "khang-sol@github" -f $env:USERPROFILE\.ssh\github_ed25519
```

Nhấn Enter 3 lần (không đặt passphrase). Kết quả: 2 files ở `C:\Users\ADMIN\.ssh\`:
- `github_ed25519` (private key — giữ bí mật)
- `github_ed25519.pub` (public key — gửi GitHub)

### 2.2 Copy public key + add vào GitHub

```powershell
Get-Content $env:USERPROFILE\.ssh\github_ed25519.pub | Set-Clipboard
```

(Copy key vào clipboard)

Trên GitHub:
1. Right-click avatar → **Settings**
2. Sidebar → **SSH and GPG keys**
3. Click **New SSH key**
4. Title: "Windows laptop"
5. Key type: Authentication Key
6. Paste (Ctrl+V) key → Save

### 2.3 Configure SSH client

```powershell
# Create/edit ~/.ssh/config
notepad $env:USERPROFILE\.ssh\config
```

Paste nội dung này:
```
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/github_ed25519
```

Save + close.

### 2.4 Test connection

```powershell
ssh -T git@github.com
```

Expected: `Hi khang-sol! You've successfully authenticated...`

---

## 📦 BƯỚC 3: Consolidate + Init local repo (20 phút)

### 3.1 Tạo folder repo mới (clean)

```powershell
cd C:\BOTHUOCLA\
mkdir sol-ecosystem
cd sol-ecosystem
```

### 3.2 Init git

```powershell
git init
git branch -M main
```

### 3.3 Tạo structure folders

```powershell
mkdir huongdi-public
mkdir huongdi-backend
mkdir solvn-wp
mkdir admin
mkdir content
mkdir docs
mkdir scripts
```

### 3.4 Copy assets từ local hiện tại

**a) huongdi-public (từ sync gần nhất):**
```powershell
Copy-Item -Path C:\BOTHUOCLA\sol-widget\huongdi-public\* -Destination C:\BOTHUOCLA\sol-ecosystem\huongdi-public\ -Recurse -Force -Exclude "*.bak-*", "*.bak.*"
```

(Excludes .bak files — không copy legacy backups)

**b) huongdi-backend:**
```powershell
Copy-Item -Path C:\BOTHUOCLA\sol-widget\huongdi-backend-latest\* -Destination C:\BOTHUOCLA\sol-ecosystem\huongdi-backend\ -Recurse -Force -Exclude "node_modules", ".env", "*.bak-*"
```

**c) content (37 prompts + directions):**
```powershell
Copy-Item -Path C:\BOTHUOCLA\sol-widget\docs\sol-mvp-v3\BUOC-4-ROADMAP\prompts -Destination C:\BOTHUOCLA\sol-ecosystem\content\prompts -Recurse
```

### 3.5 Tạo `.gitignore`

```powershell
@"
# Dependencies
node_modules/
package-lock.json

# Env
.env
.env.local
*.env

# Backups
*.bak-*
*.bak.*
*.bak

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp

# Logs
*.log
logs/

# Build
dist/
build/

# Secrets
secrets/
"@ | Set-Content .gitignore
```

### 3.6 Tạo README.md cơ bản

```powershell
@"
# Sol Ecosystem

Sol La Bàn — Hệ sinh thái tái khởi nghiệp cho người Việt 40-60.

## Structure

- ``huongdi-public/`` — Static assets cho huongdi.sol.vn (VPS Node.js)
- ``huongdi-backend/`` — Node.js API + Prisma DB
- ``solvn-wp/`` — WordPress custom code cho sol.vn (cPanel shared host)
- ``admin/`` — Admin panel (adminhuongdi.sol.vn)
- ``content/`` — Content assets (37 mô hình, 40 prompts, case studies)
- ``docs/`` — Documentation
- ``scripts/`` — Deploy scripts

## Deploy

Xem \`docs/DEPLOY.md\`

## Contact

Khang Sol — hello@sol.vn
"@ | Set-Content README.md
```

### 3.7 First commit

```powershell
git add .
git commit -m "chore: initial commit — consolidate from VPS + local"
```

### 3.8 Connect remote + push

```powershell
git remote add origin git@github.com:khang-sol/sol-ecosystem.git
git push -u origin main
```

*(Thay `khang-sol` bằng GitHub username thực của anh)*

---

## 🌐 BƯỚC 4: Sync tất cả assets từ VPS (15 phút)

Bây giờ anh có repo local có files từ workspace. Còn thiếu:
- Backend .env (secrets — không push git)
- Files trên VPS chưa sync

### 4.1 Sync VPS assets về local

**PowerShell:**
```powershell
cd C:\BOTHUOCLA\sol-ecosystem

# Sync huongdi public (bỏ backups)
scp -r sol-vps:/var/www/huongdi/public/* huongdi-public/
Get-ChildItem huongdi-public -Recurse -Include "*.bak-*", "*.bak.*" | Remove-Item -Force

# Sync backend (bỏ node_modules)
scp -r sol-vps:/var/www/huongdi/backend/src huongdi-backend/src
scp -r sol-vps:/var/www/huongdi/backend/prisma huongdi-backend/prisma
scp sol-vps:/var/www/huongdi/backend/package.json huongdi-backend/
```

### 4.2 Sync sol.vn WordPress mu-plugins

Tạm thời anh download qua cPanel File Manager:
1. cPanel → File Manager → `/public_html/wp-content/mu-plugins/`
2. Select All → Compress → download `.zip`
3. Extract vào `C:\BOTHUOCLA\sol-ecosystem\solvn-wp\mu-plugins\`

### 4.3 Commit + push

```powershell
git add .
git commit -m "chore: sync all VPS + cPanel assets"
git push
```

---

## ✅ Verify Phase 1 xong

Sau 4 bước trên, anh có:
- ✅ GitHub repo `sol-ecosystem` với toàn bộ code
- ✅ 7 folders structure rõ ràng
- ✅ README.md + .gitignore
- ✅ Toàn bộ VPS + cPanel assets consolidated

Test:
```powershell
cd C:\BOTHUOCLA\sol-ecosystem
git log --oneline
```

Kỳ vọng: 2-3 commits, latest = "chore: sync all VPS + cPanel assets"

---

## 🎯 Sau Phase 1 — Ngày mai (or later)

**Phase 2 — Deploy scripts:**
- `scripts/deploy-huongdi.sh` — SSH VPS + git pull + rsync public/
- `scripts/deploy-backend.sh` — SSH VPS + git pull + npm install + pm2 restart
- `scripts/deploy-solvn.sh` — SFTP đến cPanel + upload mu-plugins/

**Phase 3 — Documentation:**
- `docs/DEPLOY.md` — chi tiết cách deploy
- `docs/ARCHITECTURE.md` — diagram + explain
- `docs/CHANGELOG.md` — track versions

**Phase 4 — Cleanup:**
- Xóa `.bak-*` trên VPS (sau khi confirm git repo có)
- Archive `C:\BOTHUOCLA\sol-widget\docs\sol-mvp-v3\` (readonly reference)

---

## 🚨 Nếu gặp lỗi

**Error: `Permission denied (publickey)` khi git push:**
- SSH key chưa add đúng GitHub. Redo Bước 2.

**Error: `Repository not found`:**
- URL sai. Check `git remote -v` xem URL.
- Update: `git remote set-url origin git@github.com:USERNAME/sol-ecosystem.git`

**Error: `Updates were rejected`:**
- Repo GitHub có commit README nhưng local chưa pull.
- Fix: `git pull origin main --allow-unrelated-histories` → resolve merge → push lại.

Anh chạy Phase 1 rồi report em kết quả. Sau đó em ship Phase 2 deploy scripts.
