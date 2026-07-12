# P1/P2/P3 Rename — Deploy Guide

**Strategy doc:** `RENAME-STRATEGY.md`
**Branding decision:** 2-layer naming (Display + Framework)

| Framework | Display | URL Slug |
|---|---|---|
| **P1** | Khám phá bản thân | `/kham-pha-ban-than/` |
| **P2** | Kiểm kê nguồn lực | `/kiem-ke-nguon-luc/` |
| **P3** | La bàn hướng đi | `/la-ban-huong-di/` |

---

## Files trong package

| # | File | Vai trò |
|---|---|---|
| 0 | `RENAME-STRATEGY.md` | Tài liệu chiến lược, lý do, risk, communication plan |
| 1 | `01-nginx-301-redirects.conf` | Nginx config thêm 301 redirects |
| 2 | `02-rename-files-on-vps.sh` | Bash script copy files + update meta tags |
| 3 | `03-update-pillar-cta-urls.js` | Node script update CTA trong 7 pillars sol.vn |

**Đã update sẵn (cùng phiên này):**
- `../huongdi-layout/header.html` — nav 3 nút Việt hoá
- `../huongdi-layout/footer.html` — footer links Việt hoá
- `../pillar-cta-reverse/cta-block.html` — CTA link đến URL mới

---

## Deploy order — Tuân thủ nghiêm ngặt

### STEP 1: Upload script lên VPS

Trên máy local:
```powershell
# Copy bash script lên VPS
scp C:\BOTHUOCLA\sol-widget\docs\url-rename-p1-p2-p3\02-rename-files-on-vps.sh `
    sol-vps:/tmp/rename-p1-p2-p3.sh

# Copy nginx config
scp C:\BOTHUOCLA\sol-widget\docs\url-rename-p1-p2-p3\01-nginx-301-redirects.conf `
    sol-vps:/tmp/nginx-redirects.conf
```

### STEP 2: Chạy rename script trên VPS

```bash
sudo bash /tmp/rename-p1-p2-p3.sh
```

**Expected:** Tạo 3 thư mục mới + copy file + update meta tags + set ownership. Backup tự động vào `/var/backups/huongdi-YYYYMMDD/`.

### STEP 3: Verify file tạo OK

```bash
ls -la /var/www/huongdi/{kham-pha-ban-than,kiem-ke-nguon-luc,la-ban-huong-di}/

# Test trực tiếp (chưa qua nginx)
curl -I http://localhost/kham-pha-ban-than/
```

### STEP 4: Update Nginx config thêm 301 redirects

```bash
# Backup nginx config
sudo cp /etc/nginx/sites-available/huongdi.sol.vn /etc/nginx/sites-available/huongdi.sol.vn.bak.$(date +%Y%m%d)

# Edit nginx config — chèn content từ /tmp/nginx-redirects.conf vào BÊN TRONG block server { ... }
sudo nano /etc/nginx/sites-available/huongdi.sol.vn

# Tip: chèn vào sau dòng "server_name huongdi.sol.vn;"
```

Test config + reload:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### STEP 5: Smoke test redirects

```bash
# Test 301 redirect (old → new)
curl -I https://huongdi.sol.vn/p1.html
# Expected: HTTP/1.1 301 Moved Permanently
#           Location: https://huongdi.sol.vn/kham-pha-ban-than/

# Test query string preserve
curl -I "https://huongdi.sol.vn/p1.html?token=ABC"
# Expected: Location: https://huongdi.sol.vn/kham-pha-ban-than/?token=ABC

# Test URL mới trả 200
for url in kham-pha-ban-than kiem-ke-nguon-luc la-ban-huong-di; do
  status=$(curl -s -o /dev/null -w "%{http_code}" -L "https://huongdi.sol.vn/$url/")
  echo "[$status] /$url/"
done
```

### STEP 6: Redeploy huongdi-layout (header + footer Việt hoá)

```bash
# Trên máy local — push header.html + footer.html updated
scp C:\BOTHUOCLA\sol-widget\docs\huongdi-layout\header.html `
    sol-vps:/tmp/
scp C:\BOTHUOCLA\sol-widget\docs\huongdi-layout\footer.html `
    sol-vps:/tmp/

# Trên VPS — overlay vào huongdi
sudo cp /tmp/header.html /var/www/huongdi/_layout/header.html
sudo cp /tmp/footer.html /var/www/huongdi/_layout/footer.html
sudo chown www-data:www-data /var/www/huongdi/_layout/{header,footer}.html
```

**Nếu huongdi inject header/footer qua build:**
```bash
cd /var/www/huongdi
sudo -u solop node /var/www/huongdi/build-inject-layout.js  # adjust theo script thực tế
```

### STEP 7: Update CTA trong 7 pillar pages sol.vn

```powershell
# Trên máy local
cd C:\BOTHUOCLA\sol-widget\docs\url-rename-p1-p2-p3

# Dry-run preview
node 03-update-pillar-cta-urls.js --dry-run

# Live update
node 03-update-pillar-cta-urls.js
```

### STEP 8: Backend API — Audit hard-coded /p1.html

```bash
# Trên VPS
sudo grep -rn "/p1\.html\|/p2\.html\|/p3\.html\|/p1\b\|/p2\b\|/p3\b" /var/www/huongdi/backend/src 2>/dev/null

# Nếu có code generate URL → cần update + rebuild
```

Common locations cần check:
- Email template (welcome, P3 result link share)
- Response JSON từ backend (vd. `/api/p3/share-link`)
- Zalo template notifications

### STEP 9: Resubmit sitemap + GSC

1. Vào Google Search Console
2. **Sitemaps** → resubmit `https://huongdi.sol.vn/sitemap.xml`
3. **URL Inspection** cho 3 URL mới:
   - `https://huongdi.sol.vn/kham-pha-ban-than/`
   - `https://huongdi.sol.vn/kiem-ke-nguon-luc/`
   - `https://huongdi.sol.vn/la-ban-huong-di/`
4. Click "Request Indexing" cho mỗi URL

### STEP 10: Monitor 7 ngày

```bash
# Check log nginx tìm 404 do link cũ bên ngoài
sudo grep "p1.html\|p2.html\|p3.html" /var/log/nginx/access.log | tail -20

# Should show all `301` responses, NOT `404`
```

---

## Rollback (nếu cần)

### Rollback file changes
```bash
# Files cũ vẫn nguyên trong $WWW_ROOT/{p1,p2,p3}.html
# Chỉ cần xoá thư mục mới
sudo rm -rf /var/www/huongdi/kham-pha-ban-than
sudo rm -rf /var/www/huongdi/kiem-ke-nguon-luc
sudo rm -rf /var/www/huongdi/la-ban-huong-di
```

### Rollback nginx config
```bash
sudo cp /etc/nginx/sites-available/huongdi.sol.vn.bak.YYYYMMDD /etc/nginx/sites-available/huongdi.sol.vn
sudo nginx -t && sudo systemctl reload nginx
```

### Rollback pillar CTA
```bash
# Chạy lại script update với URL cũ (manual edit cta-block.html trước)
node 03-update-pillar-cta-urls.js
```

---

## Final verification checklist

- [ ] `curl -I /p1.html` → 301
- [ ] `curl -I /kham-pha-ban-than/` → 200
- [ ] Query string preserved
- [ ] Header navigation hiển thị "Khám phá bản thân / Kiểm kê nguồn lực / La bàn hướng đi"
- [ ] Footer link mới
- [ ] CTA trong 7 pillar pages dẫn về URL mới
- [ ] Sitemap chứa URL mới
- [ ] GSC submitted

---

## Future Phase 2 (Q3/2026)

Khi launch P4-P7, uncomment thêm vào nginx-redirects.conf:

```nginx
location = /p4.html { return 301 https://$host/lo-trinh-90-ngay/$is_args$args; }
location = /p5.html { return 301 https://$host/hanh-dong/$is_args$args; }
location = /p6.html { return 301 https://$host/ai-coach/$is_args$args; }
location = /p7.html { return 301 https://$host/cong-dong/$is_args$args; }
```

---

*Author: Khang Sol — Đi Cùng Sol*
*Version: 1.0 — Tháng 6/2026*
*Based on partner advice — Brand-as-asset philosophy*
