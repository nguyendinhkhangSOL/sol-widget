# Bộ Lệnh Bash — Sol La Bàn VPS

**VPS:** `103.72.57.11` · **User:** `solop` · **Alias:** `sol-vps`

Toàn bộ command dạng Bash — copy-paste vào Git Bash / WSL / Terminal (không dùng PowerShell syntax).

---

## 🔐 Setup SSH Key (1 Lần Duy Nhất)

```bash
cd /c/BOTHUOCLA/sol-widget/docs/sol-mvp-v3/directions-integration-ts
bash setup-ssh-sol-vps.sh
```

Script sẽ tự động (cần nhập pass VPS 1 lần cuối):
1. Tạo SSH key ed25519
2. Copy public key lên VPS `103.72.57.11`
3. Setup `~/.ssh/config` với alias `sol-vps`
4. Test connection

**Xong! Từ giờ `ssh sol-vps` = vào VPS không cần pass.**

---

## 🚀 Deploy Batch 1 Directions Integration

```bash
# 1. Upload package lên VPS
scp -r /c/BOTHUOCLA/sol-widget/docs/sol-mvp-v3/directions-integration-ts sol-vps:/tmp/

# 2. Upload buoc3.html (source data 36 direction)
scp /c/BOTHUOCLA/sol-widget/docs/sol-mvp-v3/huongdi-phase2/buoc3.html sol-vps:/tmp/

# 3. SSH vào và chạy deploy script
ssh sol-vps
cd /tmp/directions-integration-ts
bash deploy-vps.sh /tmp/buoc3.html
```

---

## 🎨 Deploy Admin SPA (6 File React)

```bash
# Upload admin files
scp /c/BOTHUOCLA/sol-widget/docs/sol-mvp-v3/directions-integration-ts/admin/src/utils/api-directions.ts sol-vps:/var/www/huongdi/admin/src/utils/

scp /c/BOTHUOCLA/sol-widget/docs/sol-mvp-v3/directions-integration-ts/admin/src/pages/DirectionsPage.tsx sol-vps:/var/www/huongdi/admin/src/pages/
scp /c/BOTHUOCLA/sol-widget/docs/sol-mvp-v3/directions-integration-ts/admin/src/pages/DirectionEditPage.tsx sol-vps:/var/www/huongdi/admin/src/pages/
scp /c/BOTHUOCLA/sol-widget/docs/sol-mvp-v3/directions-integration-ts/admin/src/pages/DirectionRevisionsPage.tsx sol-vps:/var/www/huongdi/admin/src/pages/
scp /c/BOTHUOCLA/sol-widget/docs/sol-mvp-v3/directions-integration-ts/admin/src/pages/CaseStudiesPage.tsx sol-vps:/var/www/huongdi/admin/src/pages/
scp /c/BOTHUOCLA/sol-widget/docs/sol-mvp-v3/directions-integration-ts/admin/src/pages/CaseStudyEditPage.tsx sol-vps:/var/www/huongdi/admin/src/pages/

# Sau đó SSH vào edit App.tsx + Layout.tsx (xem ADMIN-SPA-INTEGRATION.md), rồi:
ssh sol-vps
cd /var/www/huongdi/admin
npm run build
```

---

## 📊 Verify Data Integrity

```bash
# Đếm direction + case study trong DB
ssh sol-vps "sudo -u postgres psql huongdi_prod -c '
  SELECT COUNT(*) AS directions FROM directions;
  SELECT COUNT(*) AS case_studies FROM case_studies;
  SELECT COUNT(*) AS leads FROM leads;
'"

# Xem phân loại theo category
ssh sol-vps "sudo -u postgres psql huongdi_prod -c '
  SELECT category, COUNT(*) FROM directions GROUP BY category ORDER BY category;
'"

# Xem 5 direction mới sửa gần nhất
ssh sol-vps "sudo -u postgres psql huongdi_prod -c '
  SELECT id, title, version, last_edited_by, updated_at
  FROM directions
  ORDER BY updated_at DESC LIMIT 5;
'"
```

---

## 🧪 Test Backend API

```bash
# Count directions
curl -s http://103.72.57.11:4001/api/directions | grep -o '"count":[0-9]*'
# Expected: "count":36

# Detail 1 direction
curl -s http://103.72.57.11:4001/api/directions/freelancer-ke-toan | python3 -m json.tool

# Server-side matching (P1+P2 → top 10)
curl -X POST http://103.72.57.11:4001/api/directions/matches \
  -H "Content-Type: application/json" \
  -d '{
    "p1_norm": {"people":80,"expert":90,"builder":30,"independent":85},
    "p2_scores": {"capital":40,"time":60,"tech":50,"network":70,"risk":30,"energy":60,"exp":85},
    "incomeGoal": 25
  }' | python3 -m json.tool

# Via HTTPS (qua nginx)
curl -s https://huongdi.sol.vn/api/directions/stats/summary | python3 -m json.tool
```

---

## 🔧 Admin & Ops Commands

```bash
# SSH quick vào server
ssh sol-vps

# Xem PM2 logs backend
ssh sol-vps "pm2 logs huongdi-api --lines 50 --nostream"

# Restart backend
ssh sol-vps "pm2 restart huongdi-api && sleep 2 && pm2 logs huongdi-api --lines 10 --nostream"

# Full system status
ssh sol-vps "pm2 status && df -h / && free -h && uptime"

# Xem nginx error log
ssh sol-vps "sudo tail -50 /var/log/nginx/error.log"

# Rebuild admin SPA
ssh sol-vps "cd /var/www/huongdi/admin && npm run build"

# Rebuild backend
ssh sol-vps "cd /var/www/huongdi/backend && npm run build && pm2 restart huongdi-api"
```

---

## 🔄 Rollback Commands (Nếu Sự Cố)

```bash
# 1. Xem backup dir mới nhất
ssh sol-vps "ls -la /tmp/directions-backup-*"

# 2. Restore schema (thay ngày cho đúng)
ssh sol-vps "
  BAK=/tmp/directions-backup-YYYYMMDD-HHMMSS
  cp \$BAK/schema.prisma /var/www/huongdi/backend/prisma/schema.prisma
  cd /var/www/huongdi/backend
  npx prisma migrate reset --force
"

# 3. Drop tables mới (KHÔNG động Lead)
ssh sol-vps "sudo -u postgres psql huongdi_prod -c '
  DROP TABLE IF EXISTS direction_revisions CASCADE;
  DROP TABLE IF EXISTS case_studies CASCADE;
  DROP TABLE IF EXISTS articles CASCADE;
  DROP TABLE IF EXISTS directions CASCADE;
  DROP TYPE IF EXISTS \"DirectionStatus\";
  DROP TYPE IF EXISTS \"CaseStudyTier\";
  DROP TYPE IF EXISTS \"ArticleCategory\";
  DROP TYPE IF EXISTS \"ContentStatus\";
'"

# 4. Rebuild + restart
ssh sol-vps "cd /var/www/huongdi/backend && npm run build && pm2 restart huongdi-api"
```

---

## 🎁 Bonus — Bash Alias Cho Sol

Thêm vào `~/.bashrc` hoặc `~/.zshrc`:

```bash
# Sol La Bàn shortcuts
alias sol-ssh='ssh sol-vps'
alias sol-logs='ssh sol-vps "pm2 logs huongdi-api --lines 50 --nostream"'
alias sol-restart='ssh sol-vps "pm2 restart huongdi-api && pm2 logs huongdi-api --lines 10 --nostream"'
alias sol-status='ssh sol-vps "pm2 status && df -h / && free -h && uptime"'
alias sol-db='ssh sol-vps "sudo -u postgres psql huongdi_prod"'
alias sol-count='ssh sol-vps "sudo -u postgres psql huongdi_prod -c \"SELECT COUNT(*) AS directions FROM directions; SELECT COUNT(*) AS case_studies FROM case_studies; SELECT COUNT(*) AS leads FROM leads;\""'

# Reload
source ~/.bashrc
```

Từ giờ gõ ngắn:
```bash
sol-ssh        # SSH vào VPS
sol-logs       # Xem log backend
sol-restart    # Restart backend
sol-status     # System overview
sol-db         # Vào psql
sol-count      # Đếm records DB
```

---

## 🛡️ Backup Private Key (QUAN TRỌNG)

```bash
# Copy private key ra USB / cloud private
cp ~/.ssh/id_ed25519 /path/to/backup/sol-vps-key-$(date +%Y%m%d)
cp ~/.ssh/id_ed25519.pub /path/to/backup/sol-vps-key-$(date +%Y%m%d).pub

# Encrypt bằng gpg trước khi upload cloud
gpg -c ~/.ssh/id_ed25519
# → tạo file id_ed25519.gpg — upload lên GDrive private
```

**Nếu mất private key → không SSH được vào VPS.** Backup ngay!

---

## 📞 Cheat Sheet — 1 Trang Print Ra Được

```
VPS Info:
  Host:  103.72.57.11
  User:  solop
  Alias: sol-vps
  Port:  22

Setup 1 lần:
  bash setup-ssh-sol-vps.sh

Deploy Batch 1:
  scp -r /c/BOTHUOCLA/sol-widget/docs/sol-mvp-v3/directions-integration-ts sol-vps:/tmp/
  scp /c/BOTHUOCLA/sol-widget/docs/sol-mvp-v3/huongdi-phase2/buoc3.html sol-vps:/tmp/
  ssh sol-vps
  cd /tmp/directions-integration-ts && bash deploy-vps.sh /tmp/buoc3.html

Ops:
  ssh sol-vps                                       # SSH
  ssh sol-vps 'pm2 logs huongdi-api --lines 30'    # Logs
  ssh sol-vps 'pm2 restart huongdi-api'            # Restart
```

---

**Version:** V1 — 2026-07-03
**VPS IP:** `103.72.57.11`
