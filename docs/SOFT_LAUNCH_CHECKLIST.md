# Sol Soft Launch Checklist — 10 Beta đầu tiên

**Date**: 22-29/5/2026 · **D-Day**: 31/5/2026 (World No Tobacco Day)

---

## 🔧 PRE-LAUNCH (làm trước khi mời beta)

### Backend health
- [ ] `pm2 list` → sol-api online, restart count = 0 trong 1h gần nhất
- [ ] `curl https://bothuocla.sol.vn/api/healthz` → 200 ok
- [ ] `bash /var/www/sol-widget-old/app/scripts/e2e-test.sh` → 0 fail
- [ ] DB backup tự động hàng ngày: `crontab -l | grep pg_dump` (chưa setup? thêm cron)
- [ ] Free disk > 5GB: `df -h /` → Available column

### Frontend
- [ ] `https://bothuocla.sol.vn/` → Dashboard load OK
- [ ] `/test-ftnd` 6 câu submit OK → redirect /
- [ ] `/chat` AI trả lời thật (không fallback)
- [ ] `/pricing` 3 gói + click → QR hiện
- [ ] `/journey` hành trình 88 ngày load OK
- [ ] Mobile responsive (test trên iPhone + Android)

### Admin
- [ ] `https://admin.sol.vn/` login OK (qua email magic link HOẶC DB token)
- [ ] `/canned-replies` edit 1 CHIP → save → refresh thấy thay đổi
- [ ] `/users` thấy user mới sau khi có signup
- [ ] `/payments` thấy PaymentLog PENDING khi user click QR
- [ ] `/zalo-sos` test webhook (mock SOS từ Zalo dev console)

### Content gaps (Khang viết tay nếu kịp)
- [ ] Phase 1 content (Day 1-7 Nhận Thức) — 7 bài
- [ ] Phase 2 content (Day 8-28 Hành Động) — 21 bài
- [ ] Phase 4 content (Day 59-88 Tái Thiết) — 30 bài
- Hoặc tạm map từ Phase 3 (30 bài đã có)

### Cấu hình prod
- [ ] `OTP_DEV_MODE=false` (sau khi có SMS gateway)
- [ ] `JWT_SECRET` đã regenerate (key trong chat session 21/5 expose)
- [ ] `GEMINI_API_KEY` đã regenerate (expose 2 lần)
- [ ] Cloudflare proxy bothuocla.sol.vn + admin.sol.vn = CAM
- [ ] SSL/TLS mode = Full (strict)
- [ ] Zalo OA token còn hạn (90 ngày từ lúc tạo)

### Monitor setup
- [ ] Sentry DSN trong .env (optional nhưng nên có)
- [ ] PM2 web monitor: `pm2 monit` (chạy trong tmux session)
- [ ] Alert email khi pm2 crash: `pm2 install pm2-server-monit`

---

## 👥 BETA 10 USER (mời theo wave)

### Wave 1 — 3 user thân nhất (22-23/5)
Mời người tin cẩn nhất, dễ feedback, sẵn sàng báo bug:
- [ ] Khang (test internal — admin grant rồi)
- [ ] User 2: _______ (SĐT _______ )
- [ ] User 3: _______ (SĐT _______ )

### Wave 2 — 4 user (24-26/5)
Sau khi Wave 1 chạy ổn ≥ 24h, không có critical bug:
- [ ] User 4: _______
- [ ] User 5: _______
- [ ] User 6: _______
- [ ] User 7: _______

### Wave 3 — 3 user còn lại (27-29/5)
- [ ] User 8: _______
- [ ] User 9: _______
- [ ] User 10: _______

---

## 📧 TEMPLATE MỜI BETA (paste vào Zalo cá nhân)

```
Chào anh [Tên],

Khang vừa hoàn thiện app Sol — đồng hành cai thuốc 88 ngày + AI mentor Gemini.
Sol đang trong giai đoạn pilot 10 anh em đầu tiên, em mời anh dùng thử FREE 7 ngày
trước khi launch chính thức 31/5.

3 việc anh cần làm (~5 phút):
1. Mở https://bothuocla.sol.vn/ trên điện thoại
2. Làm Test FTND 6 câu (Sol cần hiểu mức lệ thuộc)
3. Hành trình tự bắt đầu — Sol nhắc anh check-in mỗi sáng

Em cần feedback 3 điểm:
- Có chỗ nào khó hiểu / khó dùng không?
- Trợ lý AI trả lời có đúng giọng anh em mình không?
- Trang giá rõ ràng / có gì cần hỏi không?

Anh chat trực tiếp trong app (Trò chuyện → gõ tin) hoặc Zalo này nhé.
Cảm ơn anh đi cùng Sol 🌅

— Khang
```

---

## 🚨 NẾU CÓ BUG QUAN TRỌNG TRONG BETA

### Critical (block flow)
- User không signup được → check pm2 logs sol-api
- AI không trả lời → check AppSetting `ai` row, Gemini quota
- QR không hiện → check `/api/payments/vietqr/intent` log

### Medium (annoying nhưng vẫn dùng được)
- Toast UI sai vị trí mobile
- Layout overflow trên màn nhỏ
- Font load chậm

### Triage trong admin
- `/admin/zalo-sos` xem có SOS alert nào không
- `/admin/users` xem checkinStreak có tăng không (verify cron 7h sáng chạy)
- `/admin/analytics` xem funnel tăng không

---

## 📊 MONITOR HÀNG NGÀY (22-31/5)

Mỗi sáng 9h kiểm tra (~5 phút):
```bash
ssh sol-vps

# 1. PM2 status
pm2 list | grep sol-api

# 2. Error count 24h
pm2 logs sol-api --lines 1000 --nostream --err | grep -c "level\":50"

# 3. User count tăng?
PGPASSWORD='KhangSol2006' psql -h 127.0.0.1 -U sol_app -d sol_prod -c "
SELECT 
  COUNT(*) FILTER (WHERE \"isAnonymous\" = false) AS real_users,
  COUNT(*) FILTER (WHERE \"onboardingCompletedAt\" IS NOT NULL) AS onboarded,
  COUNT(*) FILTER (WHERE \"ftndScore\" IS NOT NULL) AS ftnd_done,
  COUNT(*) FILTER (WHERE \"tier\" != 'FREE') AS paid_users
FROM \"User\";
"

# 4. Message count 24h
PGPASSWORD='KhangSol2006' psql -h 127.0.0.1 -U sol_app -d sol_prod -c "
SELECT role, COUNT(*) FROM \"Message\" 
WHERE \"createdAt\" > NOW() - INTERVAL '24 hours' 
GROUP BY role;
"

# 5. Payment requests
PGPASSWORD='KhangSol2006' psql -h 127.0.0.1 -U sol_app -d sol_prod -c "
SELECT status, COUNT(*) FROM \"PaymentLog\" GROUP BY status;
"
```

---

## 🎯 D-DAY 31/5 LAUNCH PLAN

### Sáng 6:30 — Pre-launch
- [ ] Verify backend healthy
- [ ] DB backup pre-launch (`pg_dump > /var/backups/pre_launch_2026-05-31.sql`)
- [ ] Test E2E script lần cuối

### Sáng 7:00 — Push promo
- [ ] Zalo OA broadcast (cần ZNS template approve trước)
- [ ] FB Group posts (Sprint 31-5 tasks #49-53)
- [ ] Email funnel start (Khang send manual cho list email)

### Sáng 8:00-12:00 — Soft monitor
- [ ] Tail `pm2 logs sol-api`
- [ ] Refresh admin `/home` mỗi 30 phút
- [ ] Reply chat user trong vòng < 30 phút

### Chiều 14:00 — Mid-day review
- [ ] User count tăng so với hôm trước?
- [ ] Bug critical nào không?
- [ ] AI quota Gemini còn?

### Tối 20:00 — Day 1 report
- [ ] Đăng SETUP_LOG_2026-05-31.md vào docs/
- [ ] Update Khang's morning routine cho 1-7/6
- [ ] Plan content/marketing tuần đầu tháng 6
