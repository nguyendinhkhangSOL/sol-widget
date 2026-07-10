# Google OAuth Integration — Plan

**Version:** 1.0
**Date:** 2026-07-07
**Owner:** Khang Sol
**Status:** Draft — chờ approve

## Vì sao ship Google OAuth?

Gmail là email phổ biến nhất Việt Nam (theo StatCounter ~72% market share).
User 40-60 chủ yếu dùng Gmail cá nhân — OAuth 1-click giảm ma sát đăng ký từ 4 fields (tên/SDT/email/pass) → 1 click Google.

**Expected impact:**
- Conversion signup tăng 30-50% (industry standard)
- User không phải nhớ thêm password
- Data từ Google: verified email + display name + avatar

## Approach: Hybrid Auth (không thay password auth)

Giữ nguyên đăng ký/đăng nhập bằng SDT+password (đã ship). Thêm OAuth Google song song.

Reason: SDT là identifier chính cho VN market (nhiều user không có Gmail, chỉ có Zalo). OAuth Google là option nhanh hơn cho user có Gmail.

## User flow

### Register mới
```
/dang-ky/
├── Nút chính "Đăng ký với Gmail" (Google button)
│   ↓
│   Google OAuth popup
│   ↓
│   Backend verify Google JWT
│   ↓
│   Auto-create user với email + name từ Google
│   ↓
│   Yêu cầu nhập SDT (VN market cần) — 1 field only
│   ↓
│   Return sol_jwt → /toi/
│
└── Hoặc "Đăng ký với SDT + Email" (existing form)
```

### Login existing
```
/dang-nhap/
├── Nút chính "Đăng nhập với Gmail"
│   ↓
│   Google OAuth popup
│   ↓
│   Backend match email → find user
│   ↓
│   Return sol_jwt → /toi/
│
└── Hoặc SDT/Email + Password (existing)
```

## Prerequisites — Anh setup Google Cloud (15 phút)

### Bước 1: Tạo Google Cloud project
1. Login `https://console.cloud.google.com/`
2. Click "New Project" → Name: "Sol La Bàn"
3. Region: keep default

### Bước 2: Enable Google Identity API
1. APIs & Services → Library
2. Search "Google Identity" → Enable
3. Search "Google+ API" (fallback) → Enable

### Bước 3: OAuth Consent Screen
1. APIs & Services → OAuth consent screen
2. User type: **External**
3. App info:
   - App name: `Đi Cùng Sol`
   - Support email: `hello@sol.vn`
   - Logo: upload `Icon_2.png` từ sol.vn
   - App domain: `sol.vn`
   - Privacy policy: `https://sol.vn/bao-mat/`
   - Terms of service: `https://sol.vn/dieu-khoan/`
4. Scopes: chọn `email`, `profile`, `openid`
5. Test users: add email anh Khang để test trước khi publish

### Bước 4: Tạo OAuth Client ID
1. APIs & Services → Credentials → Create Credentials → OAuth Client ID
2. Application type: **Web application**
3. Name: `Sol La Bàn Web`
4. Authorized JavaScript origins:
   - `https://huongdi.sol.vn`
   - `https://sol.vn`
   - `http://localhost:3000` (dev)
5. Authorized redirect URIs:
   - `https://huongdi.sol.vn/api/auth/google/callback`
   - `http://localhost:3001/api/auth/google/callback` (dev)
6. Save → download JSON hoặc copy Client ID + Client Secret

### Bước 5: Provide credentials cho em

Ship em qua Zalo (không paste vào chat):
- `GOOGLE_CLIENT_ID`: bắt đầu bằng `xxx.apps.googleusercontent.com`
- `GOOGLE_CLIENT_SECRET`: chuỗi ngẫu nhiên

## Backend — em ship (2-3 giờ)

### DB Schema (Prisma migration)

Add fields to `users` table:
```prisma
model User {
  // ... existing fields
  google_id           String?   @unique  // Google user ID (sub claim)
  google_email        String?           // Google email (verified)
  google_avatar_url   String?           // Optional
  google_linked_at    DateTime?         // When user linked Google
  auth_provider       String    @default("password")  // "password" | "google" | "both"
}
```

### Environment variables (VPS `.env`)

```
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_CALLBACK_URL=https://huongdi.sol.vn/api/auth/google/callback
```

### Endpoints (Node.js Express)

**1. GET `/api/auth/google`** — Initiate OAuth
- Redirect user tới Google OAuth consent screen
- Include state token cho CSRF protection

**2. GET `/api/auth/google/callback`** — Handle callback
- Receive `code` from Google
- Exchange code → access_token → user profile
- Match by `google_id` first → fallback match by email
- 4 cases:
  - **Case A**: User exists with `google_id` → login → return sol_jwt
  - **Case B**: User exists with same email but no google_id → link Google → return sol_jwt
  - **Case C**: New user → create user with Google info, need SDT → redirect to `/dang-ky/step-2?token=temp_jwt`
  - **Case D**: Error → redirect to `/dang-nhap/?error=google_failed`

**3. POST `/api/auth/google/complete-signup`** — Step 2 after Google
- Body: `{ phone }`
- Verify `temp_jwt` from step 1
- Update user with phone
- Auto-link orphan lead nếu email tồn tại trong `leads`
- Return full `sol_jwt`

### Dependencies

```bash
npm install google-auth-library
```

Use `OAuth2Client.verifyIdToken()` — official Google SDK.

## Frontend — em ship (1-2 giờ)

### `/dang-ky/` — Add Google button

Layout mới (top of card):
```
┌──────────────────────────────────┐
│         🧭 Đăng ký miễn phí       │
│         (subtitle)                │
│                                   │
│  [🔵 Đăng ký với Gmail]           │  ← Nút chính
│                                   │
│  ────  hoặc  ────                 │
│                                   │
│  [SDT ...]                        │
│  [Email ...]                      │
│  [Password ...]                   │
│  [Tạo tài khoản Free]             │
└──────────────────────────────────┘
```

**Google button:**
```html
<button class="btn-google" onclick="location.href='/api/auth/google?next=/toi/'">
  <img src="google-logo.svg" alt="G" width="20" height="20">
  Đăng ký với Gmail
</button>
```

Style: Google's brand guidelines (white bg, black text, subtle border, Google logo).

### `/dang-ky/step-2/` — New page (Google flow only)

Sau OAuth Google, user chưa có SDT → hiện form 1 field:
```
┌──────────────────────────────────┐
│      ✅ Xin chào Nguyễn Văn A     │
│      (avatar) nguyenvana@gmail   │
│                                   │
│      Còn 1 bước nữa:              │
│                                   │
│      [Số điện thoại: 0912...]     │
│      [Hoàn tất đăng ký]           │
│                                   │
│      * SĐT dùng liên hệ + Zalo    │
└──────────────────────────────────┘
```

### `/dang-nhap/` — Add Google button (same design)

Nếu user đã link Google trước đây → 1 click login. Nếu chưa link + email trùng → auto-link.

## Test plan

### E2E scenarios

1. **New user via Google** — Never signed up
   - Click Google button → Google popup → grant permission
   - Redirect step-2 với avatar + name pre-filled
   - Nhập SDT → hoàn tất → land ở `/toi/`

2. **Existing user with email match** — Signed up with password before
   - Click Google button → Google popup
   - Backend detect email tồn tại → auto-link → return sol_jwt
   - Land ở `/toi/` không cần step-2

3. **Returning Google user** — Already linked
   - Click Google button → Google popup (no consent screen if remembered)
   - Instant login → `/toi/`

4. **Error handling**
   - User denies Google permission → redirect `/dang-nhap/?error=cancelled`
   - Google API down → graceful error message
   - Network error → retry mechanism

### Security checks

- CSRF token verification on callback
- State parameter validation
- HTTPS only
- Verify Google JWT signature
- Rate limit callback endpoint (10 req/min per IP)

## Deploy plan

**Phase 1: Backend + DB (day 1)**
- Ship Prisma migration
- Ship backend endpoints
- Deploy VPS + test with anh's test Google account
- Verify OAuth flow works end-to-end via curl/browser

**Phase 2: Frontend integration (day 2)**
- Update `/dang-ky/` + `/dang-nhap/` với Google button
- Ship `/dang-ky/step-2/` page
- Deploy VPS
- Test full flow

**Phase 3: Publish OAuth consent (day 3)**
- Anh submit OAuth consent screen for verification (Google review 3-7 days)
- Sau khi approved, mọi user Gmail có thể signup
- Monitor conversion rate change

## Estimated effort breakdown

| Task | Time | Owner |
|------|------|-------|
| Google Cloud Console setup | 15 min | Anh Khang |
| Prisma migration | 15 min | Em |
| Backend `/api/auth/google` + callback | 2 giờ | Em |
| Backend `/complete-signup` | 30 min | Em |
| Frontend `/dang-ky/` update | 45 min | Em |
| Frontend `/dang-nhap/` update | 30 min | Em |
| Frontend `/dang-ky/step-2/` new page | 45 min | Em |
| E2E test | 45 min | Em + Anh |
| Deploy + verify | 30 min | Em + Anh |
| **Total** | **~5.5 giờ** | Team |

## Risks

**R1:** Google OAuth consent review có thể take 3-7 ngày. Feature deployed nhưng chỉ test users dùng được cho tới khi approved.

**R2:** User đã có tài khoản với email khác Gmail (vd @yahoo.com) → không dùng được Google login. Vẫn có SDT+password backup.

**R3:** DB có 2 users cùng email (1 password + 1 Google) → conflict. Fix: unique constraint + auto-link logic (ADR-004 unified auth).

## Approval

Anh confirm bằng cách reply "OK Phase 1" hoặc note thay đổi trước khi em execute.

- [ ] Approach Hybrid Auth (giữ SDT+password, thêm Google song song)
- [ ] User flow: Google → step-2 nhập SDT → land dashboard
- [ ] Timeline: session sau (khi anh sẵn sàng)
- [ ] Anh làm Google Cloud setup trước → cung cấp credentials
