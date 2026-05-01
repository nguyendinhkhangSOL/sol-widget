# SOL — Hướng dẫn deploy lên `bothuocla.sol.vn`

Kiến trúc:

```
bothuocla.sol.vn          → Firebase Hosting
   /                        → widget    (frontend/dist)
   /app                     → dashboard (dashboard/dist)

sol-backend.onrender.com  → Render Web Service (backend Node.js)
                              ↓
Supabase (Singapore)       → PostgreSQL (free 500MB)
```

Tổng thời gian setup lần đầu: ~1 tiếng. Chi phí: $0 cho 6 tháng đầu.

---

## Bước 1 — Supabase (Postgres) · 5 phút

1. Vào https://supabase.com → đăng ký (dùng tài khoản Google).
2. **New project**:
   - Name: `sol-prod`
   - Database password: tạo mật khẩu mạnh, **lưu lại** (sẽ dùng ở bước sau)
   - Region: **Southeast Asia (Singapore)** ← quan trọng cho latency VN
   - Pricing plan: **Free**
3. Đợi ~2 phút Supabase provision database.
4. Vào **Project Settings → Database → Connection string → URI** → tab **Connection pooling** (Mode: Transaction, port 6543).
5. Copy connection string. Dạng:
   ```
   postgresql://postgres.abcxyz:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```
   Thay `[YOUR-PASSWORD]` bằng mật khẩu đã tạo. **Lưu chuỗi này** — sẽ paste vào Render ở bước 3.

---

## Bước 2 — GitHub · 5 phút

Push code lên GitHub (nếu chưa). Trong PowerShell, ở thư mục `sol-widget`:

```powershell
git init
git add .
git commit -m "Initial commit"
gh repo create bothuocla --private --source . --push
```

(Cần cài `gh` CLI hoặc dùng GitHub Desktop.)

---

## Bước 3 — Render (Backend) · 15 phút

1. Vào https://render.com → đăng ký bằng GitHub.
2. **New + → Blueprint** → chọn repo `bothuocla` → branch `main`.
3. Render đọc `render.yaml` ở root, tự nhận diện service `sol-backend`.
4. Render hỏi **Environment Variables sync=false** — anh cần điền:
   - `DATABASE_URL` → paste connection string từ Supabase (Bước 1.5)
   - `ANTHROPIC_API_KEY` → để trống cũng được, sau này nhập qua /admin/ai
5. Bấm **Apply** → Render bắt đầu build (~3–5 phút).
6. Xong → Render cấp URL kiểu `https://sol-backend-xxxx.onrender.com`. **Lưu URL này** — sẽ dùng ở bước 4.
7. Test: mở `https://sol-backend-xxxx.onrender.com/healthz` → thấy `{"ok":true,"now":"..."}` là OK.

> **Lưu ý**: Free tier sẽ "ngủ" sau 15 phút không có request. Lần đầu sau khi ngủ, response chậm 30s. Khi go-live thì upgrade Starter ($7/tháng) để không ngủ.

---

## Bước 4 — Frontend (Firebase Hosting) · 15 phút

### 4.1 Cài Firebase CLI (chỉ làm 1 lần)

```powershell
npm install -g firebase-tools
firebase login
```

### 4.2 Cập nhật API URL

Tạo file `frontend/.env.production` và `dashboard/.env.production`:

```
VITE_API_BASE=https://sol-backend-xxxx.onrender.com
```

(thay bằng URL Render thật từ bước 3.6)

### 4.3 Build & Deploy

Trong thư mục `sol-widget/`:

```powershell
npm run deploy:firebase
```

Lệnh này tự:
1. Build widget → `frontend/dist`
2. Build dashboard → `dashboard/dist`
3. Gộp vào `public/` (widget ở `/`, dashboard ở `/app/`)
4. Deploy lên Firebase project `claude-4b270`

Xong → mở `https://claude-4b270.web.app` để kiểm tra widget.
Mở `https://claude-4b270.web.app/app` để kiểm tra dashboard.

---

## Bước 5 — DNS Nhân Hòa · 10 phút (+ đợi propagate 1–24h)

1. Vào Firebase Console → project `claude-4b270` → **Hosting** → **Add custom domain** → nhập `bothuocla.sol.vn`.
2. Firebase yêu cầu xác minh sở hữu domain. Nó sẽ cho 1 record `TXT`. Vào quản trị DNS Nhân Hòa, thêm:
   ```
   Type: TXT   Name: @   Value: <giá trị Firebase cho>
   ```
3. Sau khi xác minh, Firebase cho 2 record `A` (IP). Thêm vào DNS Nhân Hòa:
   ```
   Type: A   Name: bothuocla   Value: 199.36.158.100
   Type: A   Name: bothuocla   Value: 199.36.158.101
   ```
   (IP có thể khác — dùng đúng IP Firebase cấp.)
4. Đợi 1–24h DNS propagate. Test: `nslookup bothuocla.sol.vn` từ CMD, thấy IP Firebase là OK.
5. Firebase tự cấp SSL miễn phí (mất thêm vài giờ sau khi DNS xong).

---

## Bước 6 — Cập nhật CORS sau khi DNS xong

Khi `bothuocla.sol.vn` đã trỏ về Firebase, vào Render dashboard → service `sol-backend` → Environment → cập nhật:

```
CORS_ORIGINS=https://bothuocla.sol.vn,https://claude-4b270.web.app,https://claude-4b270.firebaseapp.com
```

(Đã có sẵn trong `render.yaml` rồi, nhưng kiểm tra cho chắc.)

---

## Bước 7 — Bootstrap admin · 2 phút

Vào dashboard `https://bothuocla.sol.vn/app` → đăng nhập bằng số điện thoại của anh.

Sau đó local PC, cd vào `backend/`:

```powershell
# Phải set DATABASE_URL trỏ về Supabase trước
$env:DATABASE_URL = "postgresql://postgres.abcxyz:..."
npm run admin:grant -- 0912727381
```

Hoặc làm thẳng trên Supabase: **Table Editor → User → tìm row của anh → set `isAdmin = true`**.

Logout/login lại dashboard → 🔧 Admin xuất hiện ở footer sidebar → vào `/admin/ai` → chọn provider → nhập key → Test → Lưu. Xong.

---

## Lệnh hằng ngày sau khi đã setup xong

| Việc | Lệnh |
|---|---|
| Sửa frontend, deploy lại | `npm run deploy:firebase` |
| Sửa backend, deploy lại | `git push` (Render tự auto-deploy) |
| Đổi AI provider/key | Vào `/admin/ai` → Save |
| Xem log backend | Render dashboard → Logs |
| Xem dữ liệu DB | Supabase → Table Editor |
| Cấp/thu hồi admin | `npm run admin:grant -- <phone>` |

---

## Troubleshooting

**"CORS blocked"** → Render env `CORS_ORIGINS` thiếu domain. Thêm rồi restart service.

**"WebSocket failed"** → Render free tier có hỗ trợ WebSocket nhưng đôi khi bị ngắt. Khi go-live nâng lên Starter.

**Backend "ngủ" lần đầu chậm** → Free tier, đợi 30s là dậy. Hoặc gọi `/healthz` mỗi 10 phút từ cron-job.org để giữ thức.

**Database "paused"** → Supabase free tier sẽ không pause nếu có ít nhất 1 query/tuần. Backend của anh có scheduler chạy mỗi giờ → không bị pause.
