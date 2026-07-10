# Google Cloud Setup — Step by Step

**Effort:** 15-20 phút
**Output:** GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET để ship cho em

Anh dùng Gmail đăng ký cá nhân của anh (không cần tạo account mới) để login vào Google Cloud Console.

---

## Bước 1: Vào Google Cloud Console (2 phút)

Mở link: **https://console.cloud.google.com/**

Login bằng Gmail chính của anh (gmail nào có role owner cho project sau này).

Lần đầu vào sẽ có popup:
- "Welcome to Google Cloud Platform" → click **"Agree and continue"**
- Country: **Vietnam**
- Terms of service: tick agree → **Agree**

---

## Bước 2: Tạo Project mới (3 phút)

**2.1 Ở top bar:**
- Bên trái logo Google Cloud có dropdown **"Select a project"** → click

**2.2 Popup Project selector:**
- Góc trên phải popup → click **"NEW PROJECT"** (nút màu xanh)

**2.3 Form New Project:**
- Project name: `Sol La Bàn`
- Organization: **No organization** (nếu anh không có Google Workspace)
- Location: **No organization**
- Click **"CREATE"** (nút xanh)

**2.4 Chờ ~30 giây:**
- Notification góc trên phải: "Creating project Sol La Bàn..."
- Xong sẽ có notification "Project ready"

**2.5 Verify:**
- Top bar giờ hiện project name **"Sol La Bàn"**
- Nếu không thấy → click dropdown top bar → chọn "Sol La Bàn"

---

## Bước 3: Enable Google Identity API (2 phút)

Direct URL: **https://console.cloud.google.com/apis/library**

**3.1 Trong API Library:**
- Search bar → gõ: `Google Identity`
- Kết quả sẽ có **"Google Identity Services"** hoặc **"Google Identity Toolkit API"**
- Click **"Google Identity Services"**
- Click nút xanh **"ENABLE"**

Chờ ~10 giây → sẽ tự chuyển sang trang management.

---

## Bước 4: OAuth Consent Screen (5 phút — QUAN TRỌNG)

Direct URL: **https://console.cloud.google.com/apis/credentials/consent**

**4.1 User Type:**
- Chọn **"External"** (không phải Internal)
- Click **"CREATE"** (nút xanh)

**4.2 App information (Step 1/4):**

| Field | Value |
|-------|-------|
| App name | `Đi Cùng Sol` |
| User support email | Chọn Gmail của anh từ dropdown |
| App logo | Upload logo — download từ [https://sol.vn/wp-content/uploads/2025/05/Icon_2.png](https://sol.vn/wp-content/uploads/2025/05/Icon_2.png) trước rồi upload |

**App domain section:**

| Field | Value |
|-------|-------|
| Application home page | `https://sol.vn` |
| Application privacy policy link | `https://sol.vn/bao-mat/` |
| Application terms of service link | `https://sol.vn/dieu-khoan/` |

**Authorized domains:**
- Click **"ADD DOMAIN"** → nhập: `sol.vn`
- Click **"ADD DOMAIN"** lần 2 → nhập: `huongdi.sol.vn`

**Developer contact info:**
- Email addresses: gõ Gmail của anh (dùng cho Google notifications về app)

Click **"SAVE AND CONTINUE"** (bottom).

**4.3 Scopes (Step 2/4):**
- Click **"ADD OR REMOVE SCOPES"**
- Popup hiện, scroll xuống hoặc dùng search
- Tick 3 scope:
  - ✅ `.../auth/userinfo.email`
  - ✅ `.../auth/userinfo.profile`  
  - ✅ `openid`
- Click **"UPDATE"** popup
- Click **"SAVE AND CONTINUE"**

**4.4 Test users (Step 3/4):**
- Click **"+ ADD USERS"**
- Nhập Gmail của anh (`nguyendinhkhang@gmail.com`)
- Optional: add thêm 1-2 email khác của anh/team để test
- Click **"ADD"**
- Click **"SAVE AND CONTINUE"**

**4.5 Summary (Step 4/4):**
- Review lại info
- Click **"BACK TO DASHBOARD"** (không cần submit for verification lúc này)

**Note:** App đang ở "Testing" mode → chỉ test users mới login được. Sau khi test OK, anh có thể "Publish App" để tất cả Gmail dùng được. Google sẽ review 3-7 ngày.

---

## Bước 5: Tạo OAuth Client ID (3 phút — output cuối)

Direct URL: **https://console.cloud.google.com/apis/credentials**

**5.1 Ở trang Credentials:**
- Top có **"+ CREATE CREDENTIALS"** dropdown → click
- Chọn **"OAuth client ID"**

**5.2 Form Create OAuth client ID:**

| Field | Value |
|-------|-------|
| Application type | **Web application** |
| Name | `Sol La Bàn Web` |

**Authorized JavaScript origins:**
Click "+ ADD URI" cho mỗi cái:
- `https://huongdi.sol.vn`
- `https://sol.vn`
- `http://localhost:3000` (optional, cho dev)

**Authorized redirect URIs** (QUAN TRỌNG — sai là fail):
Click "+ ADD URI" cho mỗi cái:
- `https://huongdi.sol.vn/api/auth/google/callback`
- `http://localhost:3001/api/auth/google/callback` (optional, cho dev)

Click **"CREATE"** (nút xanh).

**5.3 Popup "OAuth client created":**

Popup sẽ hiện:
- **Client ID**: dạng `xxxxxxxx-yyyyyyyy.apps.googleusercontent.com`
- **Client secret**: dạng `GOCSPX-xxxxxxxxxxxxx`

**⚠️ COPY CẢ 2 VALUES vào Notepad — sẽ mất khi đóng popup.**

Hoặc click **"DOWNLOAD JSON"** để lưu file (an toàn hơn).

Click **"OK"** để đóng popup.

---

## Bước 6: Ship credentials cho em (1 phút)

**Cách 1 — Ship qua Zalo (khuyến nghị):**

Copy 2 values ship Zalo Sol:
```
GOOGLE_CLIENT_ID=xxxxxxxx-yyyyyyyy.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxx
```

**Cách 2 — Save vào file local (backup):**

Tạo file `C:\BOTHUOCLA\backups\google-oauth-credentials.txt`:
```
Project: Sol La Bàn
Created: 2026-07-07
GOOGLE_CLIENT_ID=xxxxxxxx-yyyyyyyy.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxx
GOOGLE_CALLBACK_URL=https://huongdi.sol.vn/api/auth/google/callback
```

**⚠️ File này KHÔNG được commit lên GitHub** (secrets). Đã có `.gitignore` chặn `*credentials*`.

---

## Bước 7: Sau khi test OK → Publish App (optional, làm sau)

Trong Test mode, chỉ Gmail trong "Test users" login được. Để mọi Gmail dùng:

**Direct URL:** https://console.cloud.google.com/apis/credentials/consent

- Ở section "Publishing status": click **"PUBLISH APP"**
- Popup confirm → **"CONFIRM"**

App status → "In production" → mọi Gmail dùng được ngay.

**Google review:** Nếu app có sensitive scopes (như Drive/Gmail access), Google review 3-7 ngày. Nhưng scopes của em (email + profile + openid) là **non-sensitive** → không cần review, active ngay.

---

## Troubleshooting

**"Access blocked: This app's request is invalid"**
- Sai redirect URI. Check lại chính xác: `https://huongdi.sol.vn/api/auth/google/callback`
- Không có trailing slash, không sai domain

**"redirect_uri_mismatch"**
- Chưa add redirect URI trong Bước 5.2
- Anh add rồi Save lại

**"This app hasn't been verified"**
- App ở Test mode, Gmail login không phải test user
- Add Gmail vào Test users (Bước 4.4)

**"invalid_client"**
- Sai Client ID hoặc Secret
- Check lại credentials — có thể có space thừa khi copy

---

## Checklist trước khi ship credentials cho em

- [ ] Project "Sol La Bàn" đã tạo
- [ ] Google Identity Services đã enable
- [ ] OAuth Consent Screen: type External, đã fill info
- [ ] Test users có Gmail của anh
- [ ] OAuth Client ID type Web application đã tạo
- [ ] Authorized redirect URI có `https://huongdi.sol.vn/api/auth/google/callback`
- [ ] Đã copy Client ID + Client Secret vào notepad

Ship em 2 values qua Zalo → em ship deploy commands step-by-step.
