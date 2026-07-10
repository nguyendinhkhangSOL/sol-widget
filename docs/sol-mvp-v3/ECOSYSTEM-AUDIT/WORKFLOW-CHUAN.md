# Sol Ecosystem — Workflow Chuẩn (Laptop = GitHub = Deploy)

**Version:** 1.0 — 2026-07-07
**Đích:** Quy trình rõ ràng cho anh Khang maintain business lâu dài.

---

## 🎯 Nguyên tắc vàng

**GitHub là Single Source of Truth. Laptop và Deploy phải đồng bộ với GitHub.**

Không được:
- ❌ Edit trực tiếp trên VPS (skip git)
- ❌ Edit trực tiếp trên cPanel (skip git)
- ❌ Có files trên Laptop mà không push GitHub
- ❌ Có files trên Deploy mà không có trong GitHub

---

## 📐 Kiến trúc 3 tầng

```
┌──────────────────────────────────────────────────────────┐
│  1. LAPTOP (C:\BOTHUOCLA\sol-ecosystem\)                 │
│     ├─ Anh edit code ở đây                                │
│     ├─ Test local (npm run dev / mở HTML file)           │
│     └─ git commit + push                                  │
└──────────────────────┬───────────────────────────────────┘
                       │ git push
                       ↓
┌──────────────────────────────────────────────────────────┐
│  2. GITHUB (github.com/khang-sol/sol-ecosystem)          │
│     ├─ Private repo                                       │
│     ├─ Toàn bộ history (không cần .bak files)            │
│     ├─ Có thể xem diff, revert, branch                    │
│     └─ Backup tự động (nếu GitHub down, có mirror)       │
└──────────────────────┬───────────────────────────────────┘
                       │ git pull
                       ↓
┌──────────────────────────────────────────────────────────┐
│  3. DEPLOY (VPS + cPanel — production live)              │
│     ├─ VPS: git pull → copy → PM2 restart                 │
│     ├─ cPanel: SFTP/FTP upload sol-vps mu-plugins        │
│     └─ Chỉ dùng git pull, KHÔNG edit trực tiếp           │
└──────────────────────────────────────────────────────────┘
```

---

## 🔄 Workflow update mỗi ngày

### Case 1: Sửa 1 dòng code (VD: text button)

```powershell
# Laptop:
cd C:\BOTHUOCLA\sol-ecosystem
# Edit file bằng VS Code / Notepad++
notepad huongdi-public\index.html

# Commit + push
git add huongdi-public/index.html
git commit -m "fix: update CTA button text"
git push

# Deploy (SSH VPS):
ssh sol-vps
cd /var/www/huongdi-git  # Git clone folder
git pull
sudo rsync -av public/ /var/www/huongdi/public/
# Xong! Chỉ 30 giây thay vì 5 phút scp
```

### Case 2: Sửa Backend Node.js (thêm endpoint mới)

```powershell
# Laptop:
cd C:\BOTHUOCLA\sol-ecosystem\huongdi-backend
# Edit
code src/routes/user-auth.ts

# Test local (optional):
npm install
npm run dev

# Commit
git add src/routes/user-auth.ts
git commit -m "feat: add /api/user/preferences endpoint"
git push

# Deploy VPS:
ssh sol-vps
cd /var/www/huongdi-git
git pull
sudo rsync -av huongdi-backend/src/ /var/www/huongdi/backend/src/
cd /var/www/huongdi/backend
sudo npm run build
pm2 restart huongdi-api
```

### Case 3: Sửa WordPress sol.vn (mu-plugin PHP)

```powershell
# Laptop:
cd C:\BOTHUOCLA\sol-ecosystem\solvn-wp\mu-plugins
notepad sol-default-template.php

git add solvn-wp/mu-plugins/sol-default-template.php
git commit -m "fix: WordPress footer link"
git push

# Deploy cPanel (shared host):
# Không có SSH → phải upload SFTP hoặc cPanel File Manager
# Cách 1: SFTP client (WinSCP, FileZilla)
#   Host: sol.vn
#   User: <cpanel-username>
#   Password: <cpanel-password>
#   Upload solvn-wp/mu-plugins/*.php → /public_html/wp-content/mu-plugins/
# 
# Cách 2: cPanel File Manager
#   Login cPanel → File Manager → Upload files
```

### Case 4: Rollback (VD deploy bug)

```bash
# SSH VPS:
cd /var/www/huongdi-git
git log --oneline | head -5  # Xem lịch sử commits
git checkout <commit-hash-cũ>  # Về commit trước
sudo rsync -av huongdi-public/ /var/www/huongdi/public/
# Xong! Không cần tìm .bak file
```

Hoặc revert commit:
```bash
git revert HEAD  # Undo commit cuối
git push
# Then deploy như case 1
```

---

## 📋 Ship Deploy Scripts (Phase 2)

Sau khi Phase 1 (setup git) xong, em sẽ ship 3 scripts:

### `scripts/deploy-huongdi-public.sh`
```bash
#!/bin/bash
# Deploy static assets huongdi.sol.vn từ GitHub
set -e
cd /var/www/huongdi-git
git pull origin main
sudo rsync -av --delete \
    --exclude='.git' \
    --exclude='node_modules' \
    huongdi-public/ /var/www/huongdi/public/
sudo chown -R www-data:www-data /var/www/huongdi/public/
echo "✅ Deployed huongdi.sol.vn static"
```

### `scripts/deploy-huongdi-backend.sh`
```bash
#!/bin/bash
# Deploy backend Node.js
set -e
cd /var/www/huongdi-git
git pull origin main
sudo rsync -av \
    --exclude='node_modules' \
    --exclude='.env' \
    huongdi-backend/ /var/www/huongdi/backend/
cd /var/www/huongdi/backend
sudo npm install --production
sudo npm run build
sudo npx prisma migrate deploy
pm2 restart huongdi-api --update-env
pm2 logs huongdi-api --lines 20 --nostream
echo "✅ Deployed huongdi backend"
```

### `scripts/deploy-solvn-wp.sh` (chạy trên laptop)
```powershell
# Deploy WordPress mu-plugins qua WinSCP scripting
# Cần cài WinSCP CLI

$FILES = Get-ChildItem -Path solvn-wp\mu-plugins\*.php
foreach ($file in $FILES) {
    & winscp.com /command `
        "open sftp://cpanel-user:pass@sol.vn/" `
        "put $($file.FullName) /public_html/wp-content/mu-plugins/" `
        "exit"
}
Write-Host "✅ Deployed sol.vn WordPress"
```

---

## ✅ Checklist trước mỗi update

- [ ] Đã pull latest từ GitHub? (`git pull` local)
- [ ] Edit + test local?
- [ ] Commit với message rõ ràng?
- [ ] Push lên GitHub?
- [ ] Deploy production?
- [ ] Test URL live sau deploy?

---

## 🚨 Rules không được vi phạm

**Rule 1: NEVER edit production directly.**
- Không SSH VPS → edit file → save
- Luôn qua git

**Rule 2: NEVER commit .env / secrets.**
- Files chứa password, API keys → .gitignore
- Trên VPS, .env riêng biệt, không sync git

**Rule 3: Commit message rõ ràng.**
- Không: "update", "fix", "aaa"
- Có: "fix: CTA button text on homepage"
- Format: `<type>: <description>` (feat/fix/chore/docs/style)

**Rule 4: Test local trước khi push.**
- Static HTML: mở file trong browser
- Node.js: `npm run dev` chạy port local

**Rule 5: Backup trước migration DB.**
- Luôn `pg_dump` trước khi `prisma migrate deploy`
- Script backup em đã ship ở PHASE-0

---

## 🎓 Command cheatsheet cho anh

### Git basics
```bash
git status              # Xem thay đổi
git add <file>          # Stage file
git add .               # Stage tất cả
git commit -m "msg"     # Commit
git push                # Push lên GitHub
git pull                # Pull từ GitHub
git log --oneline       # Xem history
git diff                # Xem thay đổi trước commit
git revert HEAD         # Undo commit cuối
```

### Deploy VPS
```bash
ssh sol-vps
cd /var/www/huongdi-git && git pull
bash scripts/deploy-huongdi-public.sh
# Or:
bash scripts/deploy-huongdi-backend.sh
```

### Xem logs
```bash
pm2 logs huongdi-api --lines 50
sudo tail -f /var/log/nginx/error.log
```

---

## 📊 So sánh Trước / Sau

| Aspect | Trước (Chaos) | Sau (Chuẩn) |
|--------|---------------|-------------|
| Update code | scp qua lại 5 phút | git push 30 giây |
| Rollback | Tìm .bak-timestamp | git revert 1 lệnh |
| Onboarding dev | 2-3 giờ giải thích | 15 phút đọc README |
| Backup | Manual mỗi lần | Tự động qua git |
| Track changes | Không có | `git log` rõ ràng |
| Collaboration | 1 mình anh | Multi-dev qua branches |

---

## 🎯 Session tiếp theo

Sau khi anh chạy Phase 0 (backup) và Phase 1 (setup git):

**Session tiếp:**
- Phase 2: Ship 3 deploy scripts + Setup VPS git clone
- Phase 3: Documentation đầy đủ (DEPLOY.md, ARCHITECTURE.md)
- Phase 4: Cleanup .bak-* files trên VPS

Total effort cho toàn bộ chuyển đổi: **~4-5 giờ chia 2-3 sessions**.

Sau đó: Sol Ecosystem chuẩn business, dễ maintain, dễ scale.
