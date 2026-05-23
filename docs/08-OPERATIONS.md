# Sol — Operations Runbook

> Quick reference cho ops hằng ngày + troubleshooting thường gặp.
> Print + dán cạnh máy = cứu khi đêm khuya.
> Cập nhật: 2026-05-22.

---

## 1. Health check 30 giây

```bash
ssh sol-vps "
  systemctl is-active nginx postgresql && \
  pm2 list | grep sol-api && \
  curl -sf http://127.0.0.1:4000/healthz && \
  df -h / | tail -1 && \
  free -h | head -2
"
```

Expect:
- `active active` (nginx + postgresql)
- `sol-api online` PM2
- `{"ok":true,...}` healthz
- Disk Used < 80%
- RAM available > 500MB

---

## 2. Backend (sol-api) commands

### Restart / status / stop

```bash
pm2 restart sol-api
pm2 stop sol-api
pm2 start sol-api
pm2 list                     # tất cả process
pm2 monit                    # interactive monitor
pm2 describe sol-api         # detail config
```

### Logs

```bash
pm2 logs sol-api --lines 100              # last 100 lines (out + err)
pm2 logs sol-api --err --lines 50         # chỉ stderr
pm2 logs sol-api --out --lines 50         # chỉ stdout
pm2 logs sol-api --nostream --lines 200   # snapshot, không follow

# Search lỗi
pm2 logs sol-api --lines 1000 --nostream | grep -i "error\|fail\|exception"

# Search cron
pm2 logs sol-api --lines 500 --nostream | grep -i "cron\|scheduler"
```

### Process management

```bash
pm2 save                     # save current process list
pm2 startup                  # tạo systemd service tự start on boot
pm2 resurrect                # restore từ save
pm2 reload sol-api           # zero-downtime reload (cluster mode)
```

---

## 3. Nginx

```bash
sudo nginx -t                                       # test config syntax
sudo systemctl reload nginx                         # reload (no downtime)
sudo systemctl restart nginx                        # full restart
sudo systemctl status nginx --no-pager

# Logs
sudo tail -f /var/log/nginx/bothuocla-access.log
sudo tail -50 /var/log/nginx/bothuocla-error.log
sudo grep " 500 " /var/log/nginx/bothuocla-access.log | tail -20
sudo grep " 502 " /var/log/nginx/bothuocla-access.log | tail -20
```

### Edit site config

```bash
sudo nano /etc/nginx/sites-enabled/bothuocla.sol.vn
sudo nginx -t
sudo systemctl reload nginx
```

Source local: `app/scripts/nginx-bothuocla-sol-vn-v3.conf`.

---

## 4. Postgres

### Quick queries

```bash
# Mở psql
sudo -u postgres psql sol_prod

# Hoặc dùng user app (cần password)
PGPASSWORD='<pass>' psql -h 127.0.0.1 -U sol_app -d sol_prod
```

### Stats hàng ngày

```sql
-- User count breakdown
SELECT 
  COUNT(*) FILTER (WHERE "isAnonymous" = false) AS real_users,
  COUNT(*) FILTER (WHERE "onboardingCompletedAt" IS NOT NULL) AS onboarded,
  COUNT(*) FILTER (WHERE "ftndScore" IS NOT NULL) AS ftnd_done,
  COUNT(*) FILTER (WHERE "tier" != 'FREE') AS paid_users,
  COUNT(*) AS total
FROM "User";

-- Message volume 24h
SELECT role, COUNT(*) FROM "Message" 
WHERE "createdAt" > NOW() - INTERVAL '24 hours' 
GROUP BY role;

-- Check-in 24h
SELECT COUNT(*) FROM "CheckIn" WHERE "createdAt" > NOW() - INTERVAL '24 hours';

-- Payment requests
SELECT status, COUNT(*) FROM "PaymentLog" GROUP BY status;

-- Refund queue
SELECT status, COUNT(*) FROM "RefundRequest" GROUP BY status;

-- Cohort distribution
SELECT "cohortKey", COUNT(*) FROM "User" 
WHERE "cohortKey" IS NOT NULL 
GROUP BY "cohortKey" 
ORDER BY "cohortKey" DESC;
```

### Backup manual

```bash
# Full backup
sudo -u postgres pg_dump sol_prod > /var/backups/sol_prod_$(date +%F-%H%M).sql

# Gzip backup
sudo -u postgres pg_dump sol_prod | gzip > /var/backups/sol_prod_$(date +%F).sql.gz

# Schema only
sudo -u postgres pg_dump --schema-only sol_prod > /tmp/schema.sql

# Data only
sudo -u postgres pg_dump --data-only sol_prod > /tmp/data.sql

# Single table
sudo -u postgres pg_dump -t '"User"' sol_prod > /tmp/users.sql
```

### Restore

```bash
gunzip < /var/backups/sol_prod_2026-05-22.sql.gz | sudo -u postgres psql sol_prod
```

---

## 5. SSL / Certbot

```bash
sudo certbot certificates              # list active certs + expiry
sudo certbot renew --dry-run           # test auto-renew
sudo certbot renew                     # real renew (auto qua systemd timer)
sudo systemctl reload nginx            # apply renewed certs

# Force renew (nếu cert sắp hết)
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

Auto-renew: systemd timer `certbot.timer` chạy 2x/day. Verify:
```bash
sudo systemctl status certbot.timer
```

---

## 6. SMTP / Email test

### Quick test gửi magic link

```bash
curl -X POST https://bothuocla.sol.vn/api/auth/email/send-magic \
  -H "Content-Type: application/json" \
  -d '{"email":"nguyendinhkhang@gmail.com"}'
# Expect: {"ok":true}
# Kiểm tra hộp mail Gmail trong 30s.
```

### Backend SMTP verify on startup

`backend/src/auth/email/smtpClient.ts` có `verifySmtpConnection()`. Nếu fail → grep log:
```bash
pm2 logs sol-api --nostream --lines 200 | grep -i "smtp\|email"
```

### Brevo dashboard

```
https://app.brevo.com/ → Senders & IP → Domain → sol.vn
- Verify DKIM record vẫn green
- Sent count hôm nay < 300 (free quota)
```

### Test DNS DKIM/SPF/DMARC

```bash
dig TXT mail._domainkey.sol.vn +short
dig TXT sol.vn +short              # SPF
dig TXT _dmarc.sol.vn +short

# Hoặc dùng mxtoolbox.com:
# https://mxtoolbox.com/SuperTool.aspx?action=spf%3asol.vn
# https://mxtoolbox.com/SuperTool.aspx?action=dmarc%3asol.vn
```

---

## 7. Zalo OA

### Test webhook

```bash
curl -X POST https://bothuocla.sol.vn/api/zalo/webhook \
  -H "Content-Type: application/json" \
  -H "X-ZEvent-Signature: <sig>" \
  -d '{"event_name":"follow",...}'
```

Signature verify trong `backend/src/zalo/webhookHandler.ts`.

### OA access token expiry

Token Zalo OA hết hạn ~90 ngày. Lịch nhắc: **~25/8/2026**.

Refresh manual:
1. Vào Zalo dev portal: https://developers.zalo.me/app/3779171417159107862
2. Tab Official Account → Access Token → Generate new
3. Copy → paste vào `backend/.env` `ZALO_OA_ACCESS_TOKEN=...`
4. `pm2 restart sol-api`

TODO post-launch: implement auto-refresh trong `oaClient.ts`.

---

## 8. Disk / RAM / CPU

```bash
df -h                              # disk
free -h                            # RAM
top -bn1 | head -20                # CPU + top processes
uptime                             # load average
du -sh /var/log/* | sort -h        # log size breakdown
du -sh /var/www/* | sort -h

# Clean logs cũ
sudo journalctl --vacuum-time=30d  # systemd logs older than 30d
sudo find /var/log -name "*.gz" -mtime +30 -delete
pm2 flush sol-api                  # clear PM2 logs
```

---

## 9. Common troubleshoots

### 9.1. Nginx 502 Bad Gateway

```bash
# Triage:
pm2 list | grep sol-api            # online?
curl -sf http://127.0.0.1:4000/healthz   # backend respond?

# Fix:
pm2 restart sol-api
pm2 logs sol-api --err --lines 50  # tìm root cause
```

Common root causes:
- DB connection fail → check Postgres `systemctl status postgresql`
- ENV var sai (DATABASE_URL, JWT_SECRET) → check `cat /var/www/sol-widget-old/backend/.env`
- Out of memory → `free -h`, restart hoặc bump VPS RAM
- Port conflict → `sudo lsof -i :4000`

### 9.2. Nginx 403 Forbidden

```bash
ls -la /var/www/bothuocla-sol-vn/
# Expect owner: www-data:www-data
sudo chown -R www-data:www-data /var/www/bothuocla-sol-vn/
sudo chmod -R 755 /var/www/bothuocla-sol-vn/
```

### 9.3. Email base64 raw trong Gmail

**Triệu chứng**: Gmail hiện chuỗi `PCFET0NUWVBFIGh0bWw+...` thay vì HTML render.

**Nguyên nhân**: nodemailer gửi cả `text` + `html` → multipart/alternative → Brevo/relay strip Content-Type header → Gmail không decode.

**Fix** (đã áp dụng 22/5): `smtpClient.ts` chỉ gửi `html`, BỎ `text` param trong sendMail. Single-part `text/html; charset=utf-8`.

```typescript
const info = await t.sendMail({
  from, to, replyTo, subject,
  html,                                  // CHỈ html
  textEncoding: 'quoted-printable',
  // KHÔNG có text: '...'
});
```

### 9.4. Stats endpoints console spam 400/403

Dashboard fetch `/api/stats/...` cho anon user → backend trả 400 (missing user) → console đầy lỗi.

**Fix** (đã áp dụng): backend trả 200 với `{available: false}` thay vì 400/403 cho endpoint public-ish.

### 9.5. Phase B card crash `Cannot read properties of undefined (reading 'length')`

Dashboard `phaseB/PhaseAction.tsx` crash khi `user.cigaretteLogs` chưa fetch.

**Fix** (đã áp dụng): guard `(logs ?? []).length` thay vì `logs.length`.

### 9.6. Test FTND result hijack

User submit FTND → backend tạo user + redirect `/` → App.tsx detect đã onboarded → render Overview thay vì Result.

**Fix** (đã áp dụng 22/5): App.tsx KHÔNG redirect khi đang ở `/test-ftnd?result=...`. Hold user trên trang result làm trang marketing.

### 9.7. Cron không chạy

```bash
pm2 logs sol-api --nostream --lines 200 | grep -i "starting scheduler\|cron"
# Expect: "Scheduler started — 26 jobs registered"
```

Nếu KHÔNG thấy log → check `.env`:
```
ENABLE_SCHEDULER=true
```

Restart:
```bash
pm2 restart sol-api
```

⚠️ Đảm bảo CHỈ 1 PM2 instance có `ENABLE_SCHEDULER=true`. Nhiều instance → cron chạy nhiều lần → double ZNS spend.

---

## 10. Security & fail2ban

```bash
sudo fail2ban-client status                 # all jails
sudo fail2ban-client status sshd            # ssh jail detail
sudo fail2ban-client unban --all            # unban all
sudo fail2ban-client set sshd unbanip <IP>  # unban 1 IP

sudo tail -50 /var/log/auth.log             # recent auth
sudo ufw status verbose                     # firewall
```

---

## 11. Daily ops checklist (sau launch)

Mỗi sáng 9h (5 phút):
```bash
ssh sol-vps "
  pm2 list | grep sol-api && \
  pm2 logs sol-api --lines 100 --nostream --err | grep -ic 'error\\|fail' && \
  df -h / | tail -1 && \
  PGPASSWORD='<pass>' psql -h 127.0.0.1 -U sol_app -d sol_prod -c '
    SELECT COUNT(*) FILTER (WHERE \"isAnonymous\"=false) AS real_users,
           COUNT(*) FILTER (WHERE \"tier\"!=\"FREE\") AS paid
    FROM \"User\";
  '
"
```

Tuần (15 phút):
- `sudo apt update && sudo apt upgrade -y`
- `sudo fail2ban-client status sshd`
- Check disk + clean logs
- Backup DB manual

Tháng (30 phút):
- Full upgrade + reboot
- Cert renew dry-run
- Review Cloudflare bot analytics
- Audit `/admin/refunds` queue

---

## 12. Emergency contacts

| Issue | Action |
|---|---|
| Site down | Check Cloudflare status + eztech.vn + VNC console |
| SSH fail | Login VNC qua eztech.vn portal (root / drUv*P4K?Kr8SCC) |
| DB corrupted | Restore từ `/var/backups/sol-db-*.sql.gz` |
| SMTP fail | Brevo dashboard → regenerate SMTP key |
| Zalo webhook fail | Check token expiry + signature verify trong webhookHandler |
| eztech.vn support | support@eztech.vn / portal my.eztech.vn |

---

## 13. Tham khảo

- [01-CREDENTIALS.md](./01-CREDENTIALS.md) — passwords, keys
- [02-CHEATSHEET.md](./02-CHEATSHEET.md) — lệnh SSH/scp/CF
- [04-VPS_CONFIG.md](./04-VPS_CONFIG.md) — VPS Ubuntu layout
- [06-DATABASE.md](./06-DATABASE.md) — Postgres details
- [07-DEPLOY_WORKFLOW.md](./07-DEPLOY_WORKFLOW.md) — deploy edge cases

---

**Last updated**: 2026-05-22
**Maintainer**: Khang Sol
