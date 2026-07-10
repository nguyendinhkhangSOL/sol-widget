# Payment Links & CTA Adjustment — Theo Unified Auth Flow

**Vấn đề:** Sau khi refactor auth, `/thanh-toan/` behavior khác nhau tùy user state. Các link/CTA trong ecosystem cần update để **user không confuse + conversion không rơi**.

**Version:** 1.0 — 2026-07-05

---

## 🗺 Map ALL entry points vào /thanh-toan/

Em rà soát ecosystem — có **10+ entry points** dẫn vào flow thanh toán:

### 🏠 Homepage huongdi.sol.vn

| Entry | Location | CTA text hiện tại |
|-------|----------|-------------------|
| Hero CTA chính | `/index.html` top | "Dùng Sol La Bàn Active →" |
| Founder banner | Founder Edition scarcity strip | "Đăng ký Founder ngay →" |
| Pricing section | 3-tier pricing table | "Đăng ký Active" / "Đăng ký Founder" |
| FAQ CTA | Bottom | "Bắt đầu ngay" |

### 🏠 Homepage sol.vn

| Entry | Location | CTA text |
|-------|----------|----------|
| Hero CTA | Top V3 homepage | "Đăng ký Sol Active" |
| Pricing table CTA | 3-tier | "Active ngay — 499.000đ/năm →" |
| Bottom CTA | Cuối trang | "Bắt đầu hành trình ngay hôm nay" |

### 📄 Content pages sol.vn

| Entry | Location |
|-------|----------|
| Blog posts | Sidebar/footer CTA "Nâng cấp Active" |
| Pillar pages | Bottom CTA "Đọc bài chi tiết" |
| /huong-di/ archive | Grid card CTA |

### 🔒 Paywall/Lock buttons

| Entry | Location |
|-------|----------|
| 32/37 hướng đi locked | `/direction/:id/` cho FREE user |
| Bản đồ hướng đi | `/toi/ban-do/` cho FREE |
| Sổ Hành Trình | `/toi/so-hanh-trinh/` cho FREE |
| Sol Đồng Hành AI | `/toi/sol-dong-hanh/` cho FREE |

### 📧 Email/Zalo (Phase 2 nurture)

| Entry | Location |
|-------|----------|
| Email FREE→Active nurture | Templates |
| Welcome email link | Post-signup |
| Reminder email khi hết trial | Templates |

### 🎯 Widget V3 (đã ship)

| Entry | Location |
|-------|----------|
| Widget CTA "Trải nghiệm miễn phí" | Trỏ về huongdi.sol.vn homepage (không phải /thanh-toan/) |

---

## 🎨 CTA Logic — Theo User State

Nguyên tắc: **CTA text + destination thay đổi theo tier + login state**.

```
┌──────────────────────────────────────────────────────────────┐
│  ANONYMOUS (chưa login)                                       │
├──────────────────────────────────────────────────────────────┤
│  CTA: "Đăng ký + Active 499k →"                              │
│  Link: /thanh-toan/ (full form: email, phone, name, zalo)   │
│                                                                │
│  Subtitle: "Chưa có tài khoản? Điền thông tin bên dưới."     │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  LOGGED IN + tier=FREE                                        │
├──────────────────────────────────────────────────────────────┤
│  CTA: "Nâng cấp Active 499k →"                               │
│  Link: /thanh-toan/ (compact form: chỉ zalo + gói, email/    │
│         phone/name pre-filled READ-ONLY từ session)           │
│                                                                │
│  Subtitle: "Chào [tên]! Nâng cấp lên Active để mở khóa 32/37 │
│             hướng đi."                                        │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  LOGGED IN + tier=ACTIVE (đang dùng)                         │
├──────────────────────────────────────────────────────────────┤
│  CTA: "Nâng cấp Founder Edition 1.999k lifetime →"           │
│  Link: /thanh-toan/?goi=founder                              │
│                                                                │
│  Hoặc HIDE CTA cho user đã Active                             │
│  → Show badge "Đang dùng Active (hết hạn: 2027-07-02)"       │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  LOGGED IN + tier=EXPIRED (hết hạn)                          │
├──────────────────────────────────────────────────────────────┤
│  CTA: "Gia hạn Active 499k/năm →"                            │
│  Link: /thanh-toan/?goi=active&type=renew                    │
│                                                                │
│  Subtitle: "Gói Active của bạn đã hết hạn ngày [X]. Gia hạn │
│             để tiếp tục dùng."                                │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  LOGGED IN + tier=FOUNDER (lifetime)                         │
├──────────────────────────────────────────────────────────────┤
│  KHÔNG show CTA nâng cấp                                      │
│  Show badge "Founder Edition (Lifetime)"                     │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔧 Implementation Approach — Same URL, Smart Page

**Recommend:** Giữ URL `/thanh-toan/` cho TẤT CẢ entry points. Page tự detect state.

**Lý do:**
- Không rewrite 10+ CTAs trong ecosystem
- Backward compat với external links (SEO, ads)
- Analytics tracking đơn giản

**Frontend logic `/thanh-toan/` page:**

```javascript
// On page load
async function initCheckoutPage() {
  const user = await sol.getCurrentUser();  // Check JWT + fetch /api/user/me

  const urlParams = new URLSearchParams(location.search);
  const goiParam = urlParams.get('goi') || 'active';
  const typeParam = urlParams.get('type');  // 'renew' | null

  if (!user) {
    // Anonymous — show full form
    renderAnonymousCheckout(goiParam);
    return;
  }

  if (user.tier === 'FOUNDER') {
    // Already lifetime — redirect
    showModal('Bạn đã là Founder Edition (Lifetime). Không cần thanh toán thêm.');
    setTimeout(() => location.href = '/toi/', 3000);
    return;
  }

  if (user.tier === 'ACTIVE' && goiParam === 'active' && typeParam !== 'renew') {
    // Đang Active + không phải gia hạn → suggest Founder upgrade
    showModal({
      title: 'Bạn đang dùng Active',
      message: `Hết hạn: ${formatDate(user.tier_expires_at)}. Muốn nâng cấp Founder Edition lifetime?`,
      actions: [
        { label: 'Nâng cấp Founder', href: '/thanh-toan/?goi=founder' },
        { label: 'Về Dashboard', href: '/toi/' }
      ]
    });
    return;
  }

  // Show LOGGED_IN checkout — compact form
  renderLoggedInCheckout(user, goiParam, typeParam);
}

function renderLoggedInCheckout(user, goi, type) {
  // Header: "Chào [tên]! [Nâng cấp / Gia hạn]"
  const isRenew = type === 'renew';
  const header = isRenew
    ? `Gia hạn ${goi.toUpperCase()} 499k/năm`
    : `Nâng cấp ${goi.toUpperCase()}`;

  // Form: email/phone/name PRE-FILLED READ-ONLY
  // User chỉ điền: zalo (optional) + confirm
  renderForm({
    email: user.email, // readonly
    phone: user.phone,  // readonly
    name: user.displayName, // readonly
    zalo: '',  // editable
    goi: goi,
    amount: PRICING[goi],
    isRenew,
  });
}

function renderAnonymousCheckout(goi) {
  // Full form với email exists check
  renderForm({
    email: '', phone: '', name: '', zalo: '',
    goi, amount: PRICING[goi],
    onEmailBlur: async (email) => {
      const check = await api.checkEmailExists(email);
      if (check.exists) {
        showModal({
          title: 'Email đã có tài khoản Sol',
          message: 'Vui lòng đăng nhập trước để tiếp tục thanh toán (form sẽ tự pre-fill).',
          actions: [
            {
              label: 'Đăng nhập',
              href: `/dang-nhap/?next=${encodeURIComponent('/thanh-toan/?goi=' + goi)}`
            },
            { label: 'Dùng email khác', action: 'reset' }
          ]
        });
      }
    }
  });
}
```

---

## 📋 Danh sách CTAs cần update

Sau đây là **12 CTAs cần adjust text/logic** tuỳ user state:

### 1. Homepage huongdi.sol.vn — Hero CTA

**File:** `/var/www/huongdi/public/index.html`

**Hiện tại:**
```html
<a href="/thanh-toan/" class="cta-primary">Dùng Sol La Bàn Active →</a>
```

**Đề xuất:** Thêm JavaScript render CTA dựa vào user state (server-side hoặc client-side):

```html
<div id="hero-cta"></div>
<script>
document.addEventListener('DOMContentLoaded', async () => {
  const user = await sol.getCurrentUser();
  const cta = document.getElementById('hero-cta');

  if (!user) {
    cta.innerHTML = `<a href="/thanh-toan/" class="cta-primary">Đăng ký + Active 499k →</a>`;
  } else if (user.tier === 'FREE') {
    cta.innerHTML = `<a href="/thanh-toan/" class="cta-primary">Nâng cấp Active 499k →</a>`;
  } else if (user.tier === 'ACTIVE') {
    cta.innerHTML = `<a href="/thanh-toan/?goi=founder" class="cta-primary">Nâng cấp Founder Lifetime →</a>`;
  } else if (user.tier === 'FOUNDER') {
    cta.innerHTML = `<a href="/toi/" class="cta-primary">Vào Dashboard →</a>`;
  } else if (user.tier === 'EXPIRED') {
    cta.innerHTML = `<a href="/thanh-toan/?goi=active&type=renew" class="cta-primary">Gia hạn Active 499k →</a>`;
  }
});
</script>
```

### 2. Homepage sol.vn — Hero CTA (WordPress)

**File:** `sol-landing-template-v3.php` (mu-plugin)

Same approach — inject JavaScript check user state via cookie/localStorage.

### 3. Paywall lock buttons

**Files:** `/toi/`, `/direction/:id/`, `/toi/ban-do/`, ...

Logic đã có sẵn (từ task #102 — Tier gating system). Update CTA text theo state.

### 4. Widget V3 CTA

**File:** `sol-user-nav.js` (đã ship)

Hiện tại: "Trải nghiệm miễn phí →" trỏ về `huongdi.sol.vn/` (homepage). **KHÔNG đổi** — vẫn low-commitment invite anonymous browse.

### 5. Menu header sol.vn

**File:** `sol-default-template.php` (nav menu)

CTA menu header đã xoá "Bắt đầu miễn phí →" từ session trước. Có thể để nguyên hoặc thêm lại conditional.

### 6-10. Blog posts + Pillar pages + Archives CTA

Similar approach — inline JavaScript render CTA theo state.

### 11. Email templates (Phase 2 nurture)

Templates gửi qua Nodemailer/Zalo — link `/thanh-toan/?goi=active&utm_source=email&utm_campaign=nurture-day7`.

### 12. Sidebar CTA nếu có

Same logic.

---

## 🚀 Roadmap implementation (theo priority)

| Task | File chính | Effort | Priority |
|------|-----------|--------|----------|
| **A** | Refactor `/thanh-toan/` frontend logic (smart page) | `/var/www/huongdi/public/thanh-toan/index.html` | 2-3 giờ | HIGH |
| **B** | Add API `/api/user/me` return đầy đủ tier + expires_at | `backend/src/routes/user.ts` | 30 phút | HIGH |
| **C** | Add API `/api/auth/check-email` (email exists check) | `backend/src/routes/auth.ts` | 20 phút | HIGH |
| **D** | Add helper `sol-cta.js` — Global CTA renderer | New file | 1 giờ | HIGH |
| **E** | Update homepage huongdi.sol.vn hero CTA | `public/index.html` | 15 phút | MEDIUM |
| **F** | Update homepage sol.vn hero CTA | `sol-landing-template-v3.php` | 30 phút | MEDIUM |
| **G** | Update paywall lock CTAs (4 pages) | Multiple files | 1 giờ | MEDIUM |
| **H** | Update pricing section CTAs | `public/index.html` | 15 phút | MEDIUM |
| **I** | Update blog post/pillar page CTAs | WP templates | 30 phút | LOW |

**Total effort:** ~6-8 giờ dev.

---

## 💡 Nguyên tắc "One CTA per Page"

Để tránh confuse:
- **Anonymous users:** 1 primary CTA "Đăng ký + Active"
- **FREE users:** 1 primary CTA "Nâng cấp Active"
- **ACTIVE users:** 1 secondary CTA "Nâng cấp Founder" (không nhấn mạnh)
- **FOUNDER users:** 0 upsell CTA — hoàn toàn ẩn

Nếu page có nhiều nơi CTA (hero, mid-section, footer) → tất cả cùng text/destination (không mix).

---

## 🎯 Câu hỏi anh cần quyết

1. **Có nên tạo `/toi/nang-cap/` (upgrade page riêng cho logged-in user)?**
   - Option A: Cùng URL `/thanh-toan/` — smart page (Recommended)
   - Option B: Riêng URL — /toi/nang-cap/ cho logged-in, /thanh-toan/ cho anonymous

2. **User FOUNDER click "Nâng cấp":**
   - Option A: Hide CTA (không thấy)
   - Option B: Show modal "Bạn đã Lifetime" khi click

3. **EXPIRED users:**
   - Có grace period? (VD: sau expire 30 ngày mới lock — trong đó UI vẫn hiện data + nhắc gia hạn)

4. **Founder Edition scope:**
   - Vẫn giữ 200 slots giới hạn?
   - Hiện tại bao nhiêu founder đã đăng ký? (Query: `SELECT COUNT(*) FROM users WHERE tier='FOUNDER'`)

Anh trả lời 4 câu → em ship implementation.
