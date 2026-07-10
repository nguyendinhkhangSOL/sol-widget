# SSH Deploy Steps — Sol User Management V1

## Prerequisites

- VPS đã có backend huongdi.sol.vn chạy (Node.js + PM2)
- SSH access vào VPS
- Nginx đã cấu hình cho `huongdi.sol.vn`, `adminhuongdi.sol.vn`, `sol.vn`

---

## STEP 1 — Setup Email SMTP (5 phút)

**PHASE 1 dùng Email + Zalo cá nhân của Khang (không Telegram, chưa dùng Zalo OA).**

Tạo Gmail App Password để backend gửi email:

1. Vào https://myaccount.google.com/apppasswords
2. (Nếu chưa bật 2FA cho Gmail: bật 2FA trước tại https://myaccount.google.com/security)
3. Chọn app: **Mail**, device: **Other** → gõ `Sol Backend`
4. Click **Generate** → nhận 16 ký tự dạng `abcd efgh ijkl mnop`
5. **COPY 16 ký tự** (kèm space) — dùng ở STEP 7 làm `SMTP_PASS`

⚠️ Note: dùng chính Gmail `nguyendinhkhang@gmail.com` để gửi hoặc dùng `hello@sol.vn` nếu đã setup Gmail Workspace.

**Optional — SMS notification cho Khang (real-time push):**

Nếu muốn nhận SMS real-time khi có payment (thay vì đợi email), setup 1 trong 3 gateway VN:
- **Speedsms.vn** — 400đ/SMS (rẻ nhất)
- **Esms.vn** — 500đ/SMS
- **VietGuys.biz** — 700đ/SMS (chất lượng cao nhất)

Nạp 100.000đ để test (200-250 SMS) → nhận API key.  
Nếu bỏ qua: chỉ dùng Email + Web Push khi Khang mở admin.

---

## STEP 2 — SSH vào VPS

```bash
ssh root@your-vps-ip
cd /var/www/huongdi/backend/
```

---

## STEP 3 — Cài dependencies

```bash
npm install better-sqlite3 nodemailer
```

---

## STEP 4 — Upload files từ máy local

Từ máy local (Windows/Mac), scp lên VPS:

```bash
# Từ C:\BOTHUOCLA\sol-widget\docs\sol-mvp-v3\user-management-v1\
scp -r backend/db backend/routes backend/services backend/migrate.js \
    root@your-vps-ip:/var/www/huongdi/backend/

# Upload frontend page kích hoạt
scp frontend/kich-hoat.html root@your-vps-ip:/tmp/

# Upload admin leads page
scp admin-spa/leads-page.html root@your-vps-ip:/tmp/
```

---

## STEP 5 — Chạy migration tạo DB

```bash
cd /var/www/huongdi/backend/
node migrate.js
```

Expected output:
```
[migrate] Created dir: /var/www/huongdi/db
[migrate] ✅ Schema applied at /var/www/huongdi/db/leads.db
[migrate] Tables: leads, notifications
[migrate] Current leads: (empty — OK for first run)
[migrate] Done.
```

---

## STEP 6 — Update server.js gắn routes

Mở `/var/www/huongdi/backend/server.js`, tìm chỗ có `app.use(express.json())` hoặc các `app.use(...)` khác.

Thêm 4 dòng dưới các middleware đó (xem file `register-routes.js` để biết chi tiết):

```javascript
const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(process.env.DB_DIR || '/var/www/huongdi/db', 'leads.db'));
db.pragma('journal_mode = WAL');

app.use('/api/leads',       require('./routes/leads')(db));
app.use('/api/admin/leads', require('./routes/admin-leads')(db));
app.use('/api/activate',    require('./routes/activate')(db));
```

Nếu cần allow CORS từ sol.vn, sửa cors config:
```javascript
app.use(cors({
  origin: ['https://sol.vn', 'https://huongdi.sol.vn', 'https://adminhuongdi.sol.vn'],
  credentials: true
}));
```

---

## STEP 7 — Set ENV variables cho notification

Sửa file `.env` hoặc PM2 ecosystem file:

```bash
cat >> /var/www/huongdi/backend/.env << 'ENVEOF'

# Sol User Management V1
DB_DIR=/var/www/huongdi/db
ADMIN_EMAIL=nguyendinhkhang@gmail.com
ADMIN_ZALO=0912727381

# SMTP (Gmail App Password từ STEP 1)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=nguyendinhkhang@gmail.com
SMTP_PASS=abcdefghijklmnop        # 16 ký tự App Password từ STEP 1

# SMS optional (Speedsms/Esms/VietGuys) — bỏ dòng dưới nếu không dùng
# SMS_API_KEY=your_sms_api_key
# ADMIN_SMS_PHONE=0912727381
ENVEOF
```

**Lấy Gmail App Password:**
- Vào https://myaccount.google.com/apppasswords
- Chọn "Mail" + "Other" → gõ "Sol Backend" → Generate
- Copy 16 ký tự vào `SMTP_PASS`

---

## STEP 8 — Restart PM2

```bash
pm2 restart huongdi-backend
pm2 logs huongdi-backend --lines 30
```

Kiểm tra không có error, endpoint mới đã load.

---

## STEP 9 — Deploy trang kích hoạt

```bash
# sol.vn document root
mkdir -p /var/www/sol.vn/kich-hoat/
cp /tmp/kich-hoat.html /var/www/sol.vn/kich-hoat/index.html
chown -R www-data:www-data /var/www/sol.vn/kich-hoat/
```

Nếu sol.vn dùng WordPress, alternatively:
- Tạo Page mới trong WP Admin
- Slug: `kich-hoat`
- Copy nội dung HTML vào Custom HTML block
- Publish

---

## STEP 10 — Deploy admin panel

Option A — Standalone HTML:
```bash
cp /tmp/leads-page.html /var/www/adminhuongdi/public/leads.html
```

Option B — Integrate vào SPA hiện có:
- Copy nội dung `leads-page.html` vào component/route mới của SPA
- Menu: thêm link "💰 Leads" trong sidebar

---

## STEP 11 — Test end-to-end

```bash
# 1. Test POST /api/leads (public)
curl -X POST https://huongdi.sol.vn/api/leads \
  -H "Content-Type: application/json" \
  -d '{"ten":"Test User","sdt":"0912345678","email":"test@sol.vn","goi":"active"}'

# Expected:
# { "success": true, "lead_id": 1, "message": "...", "payment_info": {...} }

# 2. Kiểm tra DB
sqlite3 /var/www/huongdi/db/leads.db "SELECT * FROM leads;"

# 3. Kiểm tra Khang đã nhận email chưa
# → Check Gmail (spam folder nếu không thấy)

# 4. Test admin approve
curl -X POST https://huongdi.sol.vn/api/admin/leads/1/approve \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes":"Test approve"}'

# Expected: { success: true, magic_link: "https://sol.vn/kich-hoat/?token=..." }

# 5. Copy magic_link → mở trong browser
# Expected: "Chào Test User! SOL ACTIVE đã được kích hoạt"

# 6. F12 → Application → Local Storage → có sol_tier=active
```

---

## STEP 12 — Integrate với /thanh-toan/ frontend

Xem file `frontend/thanh-toan-integration.md` — sửa form submit của thanh-toan.html để POST tới `https://huongdi.sol.vn/api/leads`.

Deploy sửa đổi lên WP:
- Copy nội dung thanh-toan.html mới → WP Admin → Edit Page /thanh-toan/
- Publish

---

## STEP 13 — Monitoring

### Xem logs
```bash
pm2 logs huongdi-backend --lines 100
```

### Xem leads mới
```bash
sqlite3 /var/www/huongdi/db/leads.db "SELECT id,ten,sdt,goi,payment_status,created_at FROM leads ORDER BY id DESC LIMIT 20;"
```

### Backup DB (daily cron)
```bash
crontab -e
# Thêm:
0 3 * * * cp /var/www/huongdi/db/leads.db /var/backups/leads-$(date +\%Y\%m\%d).db && find /var/backups/ -name "leads-*.db" -mtime +30 -delete
```

---

## Troubleshooting

### API 500 error
```bash
pm2 logs huongdi-backend --err
```

### DB locked
```bash
# Reset WAL
sqlite3 /var/www/huongdi/db/leads.db "PRAGMA wal_checkpoint(TRUNCATE);"
```

### Email không gửi được
- Check Gmail App Password đúng chưa
- Check `SMTP_PORT=587` và `secure=false` trong nodemailer config
- Try `SMTP_PORT=465` và `secure=true` nếu 587 fail

---

## ✅ Success checklist

- [ ] SQLite DB tạo thành công tại `/var/www/huongdi/db/leads.db`
- [ ] `curl POST /api/leads` return success
- [ ] Khang nhận Email trong 30s (kèm deep-link Zalo user + button Approve)
- [ ] (Optional) Khang nhận SMS nếu đã setup gateway
- [ ] Admin panel `/leads.html` load được, hiển thị lead vừa tạo
- [ ] Click "Approve" → nhận magic link
- [ ] Mở magic link → thấy "Chào [Tên]" + auto redirect huongdi.sol.vn
- [ ] localStorage có `sol_tier=active`
- [ ] Form `/thanh-toan/` POST được vào API mới (không còn "black hole")

---

Sau khi deploy xong, mỗi lần user chuyển khoản, workflow trở thành:

```
User submit form → Khang nhận Email (30 giây) → Khang mở TCB app kiểm tra CK →
Khớp SDT → Vào admin → click Approve → click "📱 Gửi Zalo" trong admin →
Modal hiện tin nhắn mẫu + button "💬 Mở Zalo chat" → Khang paste tin nhắn vào Zalo →
User nhận link → Click → Sol Active 365 ngày ✅
```

**Tổng thời gian:** 2-4 giờ từ CK đến activate. Có thể rút ngắn về 5 phút nếu Khang online lúc đó.

---

## 📱 PHASE 1 Workflow chi tiết cho Khang

Khi có email báo lead mới:

1. **Đọc email** → xem tên + SĐT + số tiền
2. **Mở app Techcombank** → xem biến động → tìm chuyển khoản có "SOL {sdt}" và đúng số tiền
3. Nếu đã có CK: mở admin → **click Approve**
4. Admin panel hiện lead ở status "Paid" với 3 nút mới:
   - **📱 Gửi Zalo** — Mở modal có sẵn tin nhắn + link magic
   - **📋 Copy link** — Chỉ copy magic link
   - **📤 Resend email** — Gửi lại email cho user
5. Click **"📱 Gửi Zalo"** → modal hiện ra:
   - Bước A: Click **"📋 Copy tin nhắn"** — copy toàn bộ text mẫu
   - Bước B: Click **"💬 Mở Zalo chat"** — tab mới mở `zalo.me/0912xxxx`
   - Bước C: Vào Zalo → paste (Ctrl+V) → Enter gửi
6. User nhận tin → click link → tự động activate

**Ưu điểm workflow này (không cần Zalo OA):**
- ✅ Không tốn phí Zalo OA (đắt)
- ✅ Không phải chờ approve OA (mất 3-5 ngày)
- ✅ Tin nhắn từ Zalo cá nhân → cảm giác thân thiết hơn OA
- ✅ Sẵn sàng migrate sang Zalo OA Phase 2 khi doanh số lên
