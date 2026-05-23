# 📋 Sol — Cheatsheet (lệnh thường dùng)

> Quick reference cho các công việc hàng ngày. Print ra dán cạnh máy tính cũng được.

---

## 🔐 SSH & VPS Access

### Login VPS

```powershell
# Login bằng alias (đã setup ~/.ssh/config)
ssh sol-vps

# Hoặc full command
ssh -i $env:USERPROFILE\.ssh\sol_vps solop@103.72.57.11
```

### Chạy 1 lệnh trên VPS không cần login

```powershell
# Một lệnh
ssh sol-vps "sudo systemctl status nginx --no-pager"

# Nhiều lệnh
ssh sol-vps "df -h && free -h && uptime"
```

### Khẩn cấp — login khi SSH fail

```
Vào dashboard eztech.vn → VPS → VNC Console
Login: root / drUv*P4K?Kr8SCC
```

---

## 📤 Upload / Download files

### Upload file từ Windows lên VPS

```powershell
# Upload 1 file
scp C:\path\to\file.txt sol-vps:/tmp/file.txt

# Upload nhiều file
scp C:\BOTHUOCLA\sol-widget\landing\*.html sol-vps:/tmp/

# Upload folder
scp -r C:\BOTHUOCLA\sol-widget\landing\ sol-vps:/tmp/landing/
```

### Download file từ VPS về Windows

```powershell
# 1 file
scp sol-vps:/var/log/nginx/access.log D:\Logs\

# Folder
scp -r sol-vps:/var/log/ D:\Logs\
```

---

## 🌐 Deploy landing page bothuocla.sol.vn

### Quick deploy (đã có file local edit)

```powershell
# Upload + move + chown trong 1 chain
scp C:\BOTHUOCLA\sol-widget\landing\index.html sol-vps:/tmp/index.html
ssh sol-vps "sudo mv /tmp/index.html /var/www/html/index.html && sudo chown www-data:www-data /var/www/html/index.html && sudo nginx -t && sudo systemctl reload nginx && echo DEPLOY_OK"

# Verify
curl.exe -I https://bothuocla.sol.vn
```

### Update Nginx config

```powershell
scp C:\BOTHUOCLA\sol-widget\landing\nginx-bothuocla.conf sol-vps:/tmp/
ssh sol-vps "sudo mv /tmp/nginx-bothuocla.conf /etc/nginx/sites-enabled/bothuocla.sol.vn && sudo nginx -t && sudo systemctl reload nginx"
```

---

## ⚡ Cloudflare Worker

### Deploy code mới

```
1. dash.cloudflare.com → Workers & Pages → sol-robots-override
2. Click "Edit code"
3. Ctrl+A → Delete
4. Mở C:\BOTHUOCLA\sol-widget\workers\robots-override.js
5. Ctrl+A → Ctrl+C → Ctrl+V vào editor
6. Click "Deploy"
```

### Verify Worker đang serve

```powershell
# Test robots.txt
curl.exe -I https://sol.vn/robots.txt
# Expect: x-served-by: sol-worker

# Test API Catalog
curl.exe https://sol.vn/.well-known/api-catalog

# Test Agent Skills
curl.exe https://sol.vn/.well-known/agent-skills/index.json

# Test Markdown for Agents
curl.exe -H "Accept: text/markdown" https://sol.vn/ -o test.md
(Get-Item test.md).Length
```

### Purge cache khi deploy mới

```
dash.cloudflare.com → sol.vn → Caching → Configuration
→ Custom Purge → URL: https://sol.vn/robots.txt → Purge
```

Hoặc purge all (chậm):
```
Purge Everything
```

---

## 🔧 VPS Management

### Kiểm tra status services

```bash
ssh sol-vps
sudo systemctl status nginx
sudo systemctl status postgresql
sudo systemctl status fail2ban
sudo systemctl status certbot.timer
```

Hoặc 1 dòng:
```powershell
ssh sol-vps "systemctl is-active nginx postgresql fail2ban certbot.timer"
```

### Check disk + RAM + CPU

```powershell
ssh sol-vps "df -h && echo '---' && free -h && echo '---' && top -bn1 | head -20"
```

### Update OS (làm hàng tháng)

```bash
ssh sol-vps
sudo apt update && sudo apt upgrade -y
sudo apt autoremove -y
# Reboot nếu kernel update:
sudo reboot
```

### Restart Nginx (sau khi sửa config)

```bash
sudo nginx -t                    # test config
sudo systemctl reload nginx      # reload (không downtime)
# Hoặc full restart:
sudo systemctl restart nginx
```

### Renew SSL manually (Certbot)

```bash
sudo certbot renew --dry-run     # test
sudo certbot renew                # thật
sudo systemctl reload nginx
```

---

## 🛡️ Security

### Check fail2ban (xem IP nào bị ban)

```bash
sudo fail2ban-client status sshd
sudo fail2ban-client status              # tất cả jails
```

### Unban IP của mình (nếu vô tình bị ban)

```bash
sudo fail2ban-client unban --all
# Hoặc 1 IP cụ thể:
sudo fail2ban-client set sshd unbanip <IP>
```

### Xem auth log

```bash
sudo tail -50 /var/log/auth.log
```

### Check UFW firewall

```bash
sudo ufw status verbose
```

---

## 📊 Logs

### Nginx logs

```bash
# Access log realtime
sudo tail -f /var/log/nginx/access.log

# Error log
sudo tail -50 /var/log/nginx/error.log

# Search lỗi 500
sudo grep " 500 " /var/log/nginx/access.log | tail -20
```

### Cloudflare Worker logs

```
dash.cloudflare.com → Workers & Pages → sol-robots-override
→ Tab "Logs" → Stream realtime
```

### GA4 / Clarity / GSC

```
GA4 Realtime:      https://analytics.google.com → Reports → Realtime
Clarity:           https://clarity.microsoft.com → Đi Cùng Sol
GSC Performance:   https://search.google.com/search-console
```

---

## 🌍 DNS / Cloudflare

### Verify DNS

```powershell
nslookup sol.vn 8.8.8.8
nslookup bothuocla.sol.vn 1.1.1.1
```

### Bật/tắt Cloudflare Proxy (đám mây)

```
dash.cloudflare.com → sol.vn → DNS → click đám mây cam (Proxied) / xám (DNS only)
```

⚠️ **Khi chạy Certbot manually**: tạm chuyển sang DNS only (xám), xong bật lại Proxied.

---

## 📝 WordPress sol.vn

### Login WordPress

```
URL: https://sol.vn/wp-admin/
```

### Edit robots.txt

```
Rank Math SEO → General Settings → Edit robots.txt
⚠️ Hiện đã bị Cloudflare Worker override — file vật lý không có hiệu lực.
```

### Publish bài via script (Node.js)

```powershell
cd C:\BOTHUOCLA\sol-widget\scripts\wp-publisher
node publish-method-cluster.js
node publish-decision-articles.js
# ... các script khác
```

### Regenerate OG images

```bash
cd C:\BOTHUOCLA\sol-widget\scripts\wp-publisher
python3 og-gen.py --batch og-method-cluster-batch.txt
```

---

## 🤖 AI Bot Testing

### Test bot crawl access

```powershell
# Test GPTBot
curl.exe -A "GPTBot" https://sol.vn/

# Test ClaudeBot
curl.exe -A "ClaudeBot" https://sol.vn/

# Test PerplexityBot
curl.exe -A "PerplexityBot/1.0 (+https://perplexity.ai/perplexitybot)" https://sol.vn/
```

### Verify Content Signals

```powershell
curl.exe https://sol.vn/robots.txt | Select-String "Content-Signal"
```

### Test Markdown for Agents

```powershell
curl.exe -H "Accept: text/markdown" https://sol.vn/ -o test.md
notepad test.md
```

### Test WebMCP (browser console)

```
Mở Chrome → https://sol.vn → F12 → Console:
window.__sol_webmcp_tools_count
window.__sol_webmcp_tools
```

### Re-scan Agent Readiness

```
https://isitagentready.com/?url=https://sol.vn
→ Click "Re-scan" hoặc "Customize scan"
```

---

## 💰 Subscription monitoring

### Renewal dates

```
eztech.vn VPS:       20/05/2027 (799,000đ/năm)
sol.vn domain:       (check Namecheap/Gandi)
Cloudflare Free:     forever free
GA4 Free:            forever free
Clarity Free:        forever free
Let's Encrypt:       free, auto-renew 90 ngày
```

### Set reminder

```
30 ngày trước renewal eztech.vn:
  20/04/2027 — Tự reminder qua Google Calendar
```

---

## 🚨 Khẩn cấp — Quick fixes

### Site sol.vn down

```
1. Check Cloudflare status: https://www.cloudflarestatus.com/
2. Check hosting WordPress (eztech.vn)
3. Test direct IP: curl -H "Host: sol.vn" https://103.221.221.79/
```

### bothuocla.sol.vn 502 Bad Gateway

```bash
ssh sol-vps
sudo systemctl status nginx
sudo systemctl restart nginx
sudo tail -50 /var/log/nginx/error.log
```

### SSH không vào được

```
1. Verify IP còn đúng: ping 103.72.57.11
2. Check Cloudflare DNS không bị change
3. Login VNC console qua eztech.vn portal
4. Check sshd: systemctl status ssh
5. Reset fail2ban: fail2ban-client unban --all
```

### SSL cert hết hạn

```bash
ssh sol-vps
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

### Worker không update sau Deploy

```
1. Hard refresh: Ctrl+F5
2. Purge Cloudflare cache: dash → Caching → Purge Everything
3. Wait 30 seconds → test lại
```

---

## 📚 Tài liệu liên quan

```
01-CREDENTIALS.md     ← passwords, keys
02-CHEATSHEET.md      ← FILE NÀY (lệnh thường dùng)
SETUP_LOG_2026-05-20.md ← chi tiết setup ban đầu
```

---

**Print + dán cạnh máy tính = work nhanh gấp 3 lần!**

**Last updated**: 2026-05-20
