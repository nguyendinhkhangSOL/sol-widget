# Unified Auth Architecture — Design cho anh review

**Vấn đề gốc:** 2 endpoints `/dang-ky/` + `/thanh-toan/` chạy độc lập → 2 tables (users + leads) không sync → duplicate/orphan data → không quản lý được.

**Đích:** 1 backend logic → mọi email đi 1 nguồn sự thật (`users`) → CRM đọc thống nhất.

---

## 🎯 Nguyên tắc chính (Single Source of Truth)

```
┌───────────────────────────────────────────────────────────┐
│                                                            │
│  users (MASTER IDENTITY — 1 email = 1 record)             │
│    ├─ id, email UNIQUE, phone, name, password_hash        │
│    ├─ tier (FREE / ACTIVE / FOUNDER / EXPIRED)            │
│    ├─ tier_expires_at                                     │
│    ├─ active_lead_id → leads.id (latest paid lead)        │
│    ├─ source (dangky | thanhtoan | quiz | import)         │
│    └─ status (active | pending_activation | suspended)    │
│                                                            │
│         ↕ 1:N                                              │
│                                                            │
│  leads (PAYMENT ORDERS — N leads per user)                 │
│    ├─ id, user_id → users.id (BẮT BUỘC, không NULL)       │
│    ├─ email (snapshot at time of payment)                 │
│    ├─ ten, sdt, zalo                                       │
│    ├─ goi, amount, payment_status                          │
│    ├─ magic_token (chỉ khi user chưa set password)         │
│    └─ activated_at, expires_at                             │
│                                                            │
└───────────────────────────────────────────────────────────┘
```

**Rules bất di bất dịch:**
1. **Mọi email vào hệ thống → LUÔN có record trong `users`** (identity master)
2. **leads.user_id NOT NULL** — mọi payment gắn với 1 user
3. **Email trùng → merge, KHÔNG tạo duplicate user**
4. **Password nullable** — user có thể pay-first, set password sau qua magic link

---

## 📖 UX Flow — 4 paths phổ biến

### Path 1: Đăng ký FREE trước, upgrade sau (Sequential)

```
User vào /dang-ky/
  → Điền email, phone, password, name
  → Backend: INSERT users (tier=FREE, source=dangky)
  → Login → Dashboard
  → Sau khi trải nghiệm → click "Nâng cấp Active"
  → Vào /thanh-toan/ (auto pre-fill email/phone từ session)
  → Điền zalo + xác nhận
  → Backend: INSERT leads (user_id = current_user.id)
  → Hiện VietQR
  → Sau khi webhook confirm PAID:
    ✅ UPDATE users.tier = ACTIVE
    ✅ UPDATE users.tier_expires_at = now + 12 months
    ✅ UPDATE users.active_lead_id = new_lead.id
  → Gửi email chúc mừng
```

### Path 2: Đăng ký FREE only (Content browsing)

```
User vào /dang-ky/
  → Register → user (FREE)
  → Browse content, quiz, saved directions
  → KHÔNG bao giờ upgrade → vẫn có value nurture
```

### Path 3: Thanh toán TRỰC TIẾP (chưa từng đăng ký)

```
User vào /thanh-toan/ (từ ad hoặc landing)
  → Điền email, phone, name, zalo, gói
  → Backend detect: email chưa có trong users
    → INSERT users (tier=FREE, source=thanhtoan, password=NULL, status=pending_activation)
    → INSERT leads (user_id = new_user.id, magic_token=uuid, status=PENDING)
  → Hiện VietQR + note "Sau khi thanh toán, chúng tôi gửi link kích hoạt qua email"
  → User thanh toán
  → Webhook PAID:
    ✅ UPDATE leads.payment_status = PAID
    ✅ UPDATE users.tier = ACTIVE
    ✅ Gửi email "Chúc mừng! Click để set password + kích hoạt tài khoản"
  → User click magic link
  → /kich-hoat?token=xxx → form set password
  → Backend: UPDATE users.password_hash + status=active + email_verified=true
  → Auto login → Dashboard
```

### Path 4: Thanh toán khi ĐÃ CÓ account (Repeat customer)

```
User đã login (từ session /dang-ky/ trước đó)
  → Vào /thanh-toan/
  → Form auto pre-fill email/phone/name (từ users record)
  → Điền zalo + gói
  → Backend: INSERT leads (user_id = current_user.id)
  → Same flow như Path 1
```

### Edge case: Email trùng nhưng CHƯA login

```
User submit /thanh-toan/ với email đã tồn tại trong users
  → Backend detect duplicate
  → 2 options:

  Option A (Recommend): Show modal
    "Email này đã có tài khoản Sol.
     [Đăng nhập trước để tiếp tục thanh toán]"
    (Redirect /dang-nhap/, sau khi login → back to /thanh-toan/)

  Option B (Fallback): Allow anonymous checkout
    → Send OTP to email (verify ownership)
    → After OTP verified: link lead to existing user
```

---

## 🔌 Backend Endpoints — Simplified

### Endpoint 1: `POST /api/auth/register` (dangky)

```javascript
// Input
{ email, phone, password, displayName }

// Logic
async function register(input) {
  // Validate
  if (await usersRepo.findByEmail(input.email)) {
    throw new Error("Email đã tồn tại. Vui lòng đăng nhập.");
  }
  if (await usersRepo.findByPhone(input.phone)) {
    throw new Error("SĐT đã tồn tại.");
  }

  // Check orphan leads (đã pay chưa activate)
  const orphanLead = await leadsRepo.findByEmail(input.email, {
    userId: null,
    paymentStatus: { in: ['PAID', 'ACTIVATED'] }
  });

  const user = await usersRepo.create({
    email: input.email,
    phone: input.phone,
    passwordHash: await bcrypt.hash(input.password, 12),
    displayName: input.displayName,
    tier: orphanLead ? 'ACTIVE' : 'FREE',
    tierStartedAt: orphanLead ? new Date() : null,
    tierExpiresAt: orphanLead ? addMonths(new Date(), 12) : null,
    source: 'dangky',
    status: 'active',
    emailVerified: false,
    passwordSetAt: new Date(),
  });

  // Link orphan lead if exists
  if (orphanLead) {
    await leadsRepo.update(orphanLead.id, {
      userId: user.id,
      activatedAt: new Date(),
    });
    await usersRepo.update(user.id, {
      activeLeadId: orphanLead.id,
    });
  }

  return { user, token: generateJwt(user) };
}
```

### Endpoint 2: `POST /api/payment/create-order` (thanhtoan)

```javascript
// Input
{ email, phone, ten, zalo, goi }
// Optional: user đã login → có JWT header

// Logic
async function createOrder(input, currentUser = null) {
  let user = currentUser;

  if (!user) {
    // Chưa login — check email
    const existing = await usersRepo.findByEmail(input.email);

    if (existing) {
      // Email đã có account → yêu cầu login
      throw new Error("ACCOUNT_EXISTS", {
        message: "Email đã có tài khoản. Vui lòng đăng nhập trước.",
        redirect: `/dang-nhap/?next=/thanh-toan/`
      });
    }

    // Tạo shell user (chưa có password)
    user = await usersRepo.create({
      email: input.email,
      phone: input.phone,
      displayName: input.ten,
      tier: 'FREE',
      source: 'thanhtoan',
      status: 'pending_activation',
      passwordHash: null,
      emailVerified: false,
    });
  }

  // Tạo lead gắn với user
  const magicToken = generateSecureToken(64);
  const lead = await leadsRepo.create({
    userId: user.id,          // ← LUÔN có
    ten: input.ten,
    email: input.email,
    sdt: input.phone,
    zalo: input.zalo,
    goi: input.goi,           // ACTIVE | FOUNDER
    amount: PRICING[input.goi],
    paymentStatus: 'PENDING',
    magicToken: user.passwordHash ? null : magicToken, // Chỉ gen nếu user chưa có password
    expiresAt: addDays(new Date(), 90),
  });

  // Return VietQR
  return {
    leadId: lead.id,
    userId: user.id,
    qrCode: generateVietQR(lead.amount, lead.id),
    amount: lead.amount,
    needsPasswordSetup: !user.passwordHash,
  };
}
```

### Endpoint 3: `POST /webhook/payment-confirmed` (từ ngân hàng)

```javascript
async function onPaymentConfirmed(leadId) {
  const lead = await leadsRepo.findById(leadId);
  if (!lead || lead.paymentStatus !== 'PENDING') return;

  await db.transaction(async (tx) => {
    // Update lead
    await tx.leads.update(leadId, {
      paymentStatus: 'PAID',
      activatedAt: new Date(),
    });

    // Upgrade user tier
    await tx.users.update(lead.userId, {
      tier: 'ACTIVE',
      tierStartedAt: new Date(),
      tierExpiresAt: addMonths(new Date(), 12),
      activeLeadId: lead.id,
    });

    // Send emails
    if (lead.magicToken) {
      // Pay-first user chưa có password
      await sendEmail(lead.email, 'ACTIVATION_LINK', {
        activationUrl: `https://huongdi.sol.vn/kich-hoat?token=${lead.magicToken}`
      });
    } else {
      // Existing user upgrade — just congrats
      await sendEmail(lead.email, 'UPGRADE_SUCCESS');
    }
  });
}
```

### Endpoint 4: `POST /api/auth/activate` (magic link)

```javascript
// Input: { token, password }

async function activate({ token, password }) {
  const lead = await leadsRepo.findByMagicToken(token);
  if (!lead) throw new Error("Token không hợp lệ hoặc đã hết hạn");

  const user = await usersRepo.findById(lead.userId);
  if (user.passwordHash) throw new Error("Tài khoản đã kích hoạt");

  // Set password + activate
  await usersRepo.update(user.id, {
    passwordHash: await bcrypt.hash(password, 12),
    emailVerified: true,
    passwordSetAt: new Date(),
    status: 'active',
  });

  // Invalidate token
  await leadsRepo.update(lead.id, { magicToken: null });

  return { token: generateJwt(user) };
}
```

---

## 🎨 UX Improvements — Frontend

### `/dang-ky/` page

Add hint dưới form:
> 💡 Bạn muốn dùng Sol La Bàn Active ngay?
> [Đăng ký + Thanh toán 499k →](/thanh-toan/)

### `/thanh-toan/` page

**Before submit form**, check email typing (debounce 500ms):
```javascript
onEmailBlur = async (email) => {
  const check = await api.checkEmailExists(email);
  if (check.exists) {
    showModal({
      title: "Email đã có tài khoản Sol",
      message: "Vui lòng đăng nhập trước để tiếp tục thanh toán.",
      actions: [
        { label: "Đăng nhập", action: () => redirect(`/dang-nhap/?next=/thanh-toan/`) },
        { label: "Dùng email khác", action: () => resetEmail() }
      ]
    });
  }
};
```

**After successful payment (pay-first flow):**
```
✅ Thanh toán thành công!

Chúng tôi vừa gửi email đến your@email.com
Click link trong email để kích hoạt tài khoản
và bắt đầu sử dụng Sol La Bàn Active.

Chưa thấy email? Check Spam hoặc [Gửi lại link]
```

### `/kich-hoat?token=xxx` page (magic link landing)

```
🎉 Kích hoạt tài khoản Sol La Bàn Active

Email: your@email.com (từ token, read-only)

Đặt mật khẩu:
  [ Password input ]
  [ Confirm password ]

[Kích hoạt và Đăng nhập →]
```

Sau khi set password → auto login → redirect dashboard.

---

## 🔄 Migration Data cũ

### Step 1: Link orphan leads → tạo users (2 leads đang orphan)

```sql
-- Tạo user shell cho 2 orphan leads (PAID nhưng chưa có user)
INSERT INTO users (id, email, phone, display_name, tier, source, status, created_at, updated_at)
SELECT
    gen_random_uuid()::text,
    email,
    sdt,
    ten,
    'ACTIVE'::"UserTier",
    'thanhtoan',
    'pending_activation',
    created_at,
    NOW()
FROM leads
WHERE user_id IS NULL
  AND payment_status IN ('PAID', 'ACTIVATED')
  AND email IS NOT NULL
ON CONFLICT (email) DO NOTHING;

-- Link back user_id vào leads
UPDATE leads l
SET user_id = u.id
FROM users u
WHERE l.email = u.email AND l.user_id IS NULL;

-- Gửi magic link email cho 2 user này (backend script)
```

### Step 2: Merge duplicate leads (test data)

`nguyendinhkhang@gmail.com` có 4 leads (id 1,2,3,4). Chỉ giữ lead #4 (latest ACTIVATED), archive #1,#2,#3:

```sql
UPDATE leads SET
    payment_status = 'CANCELLED',
    cancel_reason = 'Duplicate test data - superseded by lead #4'
WHERE id IN (1, 2, 3);
```

### Step 3: Set source field cho users hiện có

```sql
-- Add column 'source' vào users nếu chưa có
ALTER TABLE users ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'unknown';

-- Update source dựa vào history
UPDATE users u SET source =
  CASE
    WHEN EXISTS (SELECT 1 FROM leads l WHERE l.user_id = u.id) THEN 'thanhtoan'
    ELSE 'dangky'
  END
WHERE source = 'unknown';
```

---

## 📊 Tổng kết approach

| Aspect | Current (LỘN XỘN) | Proposed (UNIFIED) |
|--------|---------------------|-------------------|
| Sources of truth | users + leads (rời rạc) | users (master), leads (children) |
| Email trùng | Duplicate records | Auto-merge or reject |
| Pay-first flow | Tạo lead orphan | Tạo user shell + lead linked |
| Data quality | 2 orphan leads, 4 duplicate | 100% linked, no duplicates |
| Admin visibility | 2 tables riêng | 1 view unified |
| CRM analytics | Impossible | Native, per-user aggregation |

---

## 🚦 Roadmap implementation

| Phase | Việc | Effort | Priority |
|-------|------|--------|----------|
| **0** | Migration link data cũ (đã ship) | 5 phút | ✅ |
| **1** | Add `source` + `status` column vào users | 30 phút | HIGH |
| **2** | Refactor `/api/auth/register` (link orphan lead) | 1 giờ | HIGH |
| **3** | Refactor `/api/payment/create-order` (auto-create shell user) | 2 giờ | HIGH |
| **4** | Refactor `/webhook/payment-confirmed` (upgrade tier + send magic) | 1 giờ | HIGH |
| **5** | Add `/api/auth/activate` (set password from magic link) | 1 giờ | HIGH |
| **6** | Frontend `/thanh-toan/` check email exists | 30 phút | MEDIUM |
| **7** | Frontend `/kich-hoat` set password page | 1 giờ | HIGH |
| **8** | Data migration cleanup (duplicate leads) | 15 phút | MEDIUM |
| **9** | E2E test 4 UX paths | 1 giờ | HIGH |

**Total effort:** ~1-1.5 ngày dev.

Sau khi xong, CRM sẽ đọc từ 1 source đáng tin cậy.

---

## ❓ Câu hỏi cần anh quyết

1. **Path 3 (pay-first) — Magic link timeline:**
   - Token expires bao lâu? (Recommend: 7 ngày)
   - Nếu user không click magic link → làm gì? (Recommend: sau 24h gửi reminder, sau 7 ngày token expire nhưng user vẫn ACTIVE, có thể password reset qua email verify)

2. **Edge case — Email trùng ở /thanh-toan/:**
   - Force login trước (Recommend A) hay allow anonymous checkout với OTP (B)?

3. **Ordering flexibility:**
   - Cho user tạo NHIỀU order/leads (gia hạn, upgrade FOUNDER) — mỗi lead là 1 record mới
   - Chỉ `active_lead_id` trên users trỏ về LATEST paid lead

4. **Deprecation:**
   - Có nên bỏ `leads.password_hash` (duplicate với `users.password_hash`)?
   - Recommend: KEEP field trong DB (backward compat) nhưng KHÔNG WRITE nữa, migration sẽ NULL out

Anh review + trả lời 4 câu — em ship implementation Phase 1-9.
