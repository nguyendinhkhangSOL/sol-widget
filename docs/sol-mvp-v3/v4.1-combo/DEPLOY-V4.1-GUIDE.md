# Sol V4.1 Combo — Deploy Guide

## 📦 Deliverables

| # | File | Deploy target |
|---|---|---|
| 1 | `pricing.html` | `https://huongdi.sol.vn/pricing/` |
| 2 | `founder.html` | `https://huongdi.sol.vn/founder/` |
| 3 | `prompts-builder.html` | `https://huongdi.sol.vn/prompts/` (đã có, update paywall) |
| 4 | sol-ui.js patch | VPS `/var/www/huongdi/public/sol-ui.js` |

---

## 🚀 STEP 1 — Deploy pricing.html + founder.html

### Trên máy local (Windows), upload 2 file:

```bash
scp C:\BOTHUOCLA\sol-widget\docs\sol-mvp-v3\v4.1-combo\pricing.html sol-vps:/tmp/
scp C:\BOTHUOCLA\sol-widget\docs\sol-mvp-v3\v4.1-combo\founder.html sol-vps:/tmp/
```

### SSH vào VPS, chạy 1 lệnh combo:

```bash
sudo mkdir -p /var/www/huongdi/public/pricing /var/www/huongdi/public/founder && \
sudo mv /tmp/pricing.html /var/www/huongdi/public/pricing/index.html && \
sudo mv /tmp/founder.html /var/www/huongdi/public/founder/index.html && \
sudo chown -R www-data:www-data /var/www/huongdi/public/pricing /var/www/huongdi/public/founder && \
echo "✅ PRICING + FOUNDER DEPLOYED"
```

**Test:**
- https://huongdi.sol.vn/pricing/
- https://huongdi.sol.vn/founder/

---

## 🚀 STEP 2 — Redeploy prompts-builder.html (đã có paywall)

### Upload:
```bash
scp C:\BOTHUOCLA\sol-widget\docs\sol-mvp-v3\prompt-database\prompts-builder.html sol-vps:/tmp/
```

### SSH VPS:
```bash
sudo cp /var/www/huongdi/public/prompts/index.html /var/www/huongdi/public/prompts/index.html.bak-$(date +%Y%m%d-%H%M) && \
sudo mv /tmp/prompts-builder.html /var/www/huongdi/public/prompts/index.html && \
sudo chown www-data:www-data /var/www/huongdi/public/prompts/index.html && \
echo "✅ PROMPTS PAYWALL DEPLOYED"
```

**Test:**
- https://huongdi.sol.vn/prompts/
- Click AI-001 → mở form bình thường (FREE)
- Click AI-011 → **paywall modal xuất hiện** (LOCKED)
- Nhấn "Kích hoạt truy cập" → nhập `SOL-ACTIVE-TESTABC123` → unlock

---

## 🚀 STEP 3 — Patch sol-ui.js (menu update)

### Trên VPS, backup + edit:

```bash
cd /var/www/huongdi/public
sudo cp sol-ui.js sol-ui.js.bak-$(date +%Y%m%d-%H%M)
sudo nano sol-ui.js
```

### Tìm phần `NAV_ITEMS` và cập nhật thành:

```javascript
const NAV_ITEMS = [
  { label: '🧭 5 Bước', url: '/' },
  { label: '🤖 Kho AI', url: '/prompts/', badge: '40' },
  { label: '📚 Mô hình', url: 'https://sol.vn/huong-di/' },
  { label: '💎 Active', url: '/pricing/' },
  { label: '👤 Khang Sol', url: 'https://sol.vn/khang-sol/' }
];
```

### Nếu render function chưa hỗ trợ `badge`, tìm phần render nav item và cập nhật:

```javascript
// Cũ:
navHTML += `<a href="${item.url}">${item.label}</a>`;

// Mới:
navHTML += `<a href="${item.url}">${item.label}${item.badge ? ` <span class="nav-badge">${item.badge}</span>` : ''}</a>`;
```

### Thêm CSS cho badge (trong style block sol-ui.js):

```css
.nav-badge {
  display:inline-block;
  background:#F59E0B; color:#fff;
  font-size:10px; font-weight:800;
  padding:2px 7px; border-radius:10px;
  margin-left:4px; vertical-align:middle;
}
```

### Save + verify:
```bash
# Ctrl+O, Enter, Ctrl+X

# Verify JS syntax
node -c /var/www/huongdi/public/sol-ui.js && echo "✅ Syntax OK"
```

---

## 🧪 STEP 4 — Test end-to-end flow

### Test scenarios:

**Scenario 1: Free user thử prompt**
1. Truy cập https://huongdi.sol.vn/prompts/ (Incognito)
2. Click AI-001 (badge "MIỄN PHÍ") → form mở bình thường
3. Click AI-011 (badge "🔒 ACTIVE") → **paywall modal** xuất hiện
4. Modal có 3 CTA: Active / Founder / Dùng 5 mẫu

**Scenario 2: Active user kích hoạt**
1. Ở modal paywall, click "Kích hoạt truy cập"
2. Nhập `SOL-ACTIVE-TESTABC123` → alert "✅ Kích hoạt thành công"
3. Refresh trang → tất cả 40 badge chuyển thành "✓ ACTIVE"
4. Click bất kỳ prompt nào → form mở

**Scenario 3: Founder user kích hoạt**
1. Truy cập `https://huongdi.sol.vn/prompts/?activate=SOL-FOUNDER-TEST001`
2. URL auto-clean → localStorage `sol_founder = true`
3. Test unlock

**Scenario 4: Full pricing journey**
1. https://huongdi.sol.vn/pricing/
2. FAQ mở đóng đúng
3. Click "Giữ chỗ Founder" → scroll đến section pricing card Founder
4. Click "Đăng ký Sol Active" → scroll đến section thanh toán
5. Check trang mobile responsive

**Scenario 5: Founder scarcity**
1. https://huongdi.sol.vn/founder/
2. Kiểm tra countdown "100 / 100 slot"
3. Test "Đã chuyển khoản" button → mở mailto:hello@sol.vn với subject pre-filled
4. Test "Đăng ký waitlist" button → mở mailto tương tự

---

## 🎯 STEP 5 — Update thông tin thanh toán thật

### Sau khi anh gửi mình bank info, thay 2 file:

**File 1: `/var/www/huongdi/public/pricing/index.html`**

Tìm và replace:
```
[SẼ CẬP NHẬT]
```

Thành:
```
Ngân hàng: <TÊN NGÂN HÀNG>
Số tài khoản: <SỐ TK>
```

**File 2: `/var/www/huongdi/public/founder/index.html`**

Tương tự.

**Lệnh sed nhanh (thay thế all):**
```bash
sudo sed -i 's|\[SẼ CẬP NHẬT\]|Techcombank 1234567890|g' /var/www/huongdi/public/pricing/index.html
sudo sed -i 's|\[SẼ CẬP NHẬT\]|Techcombank 1234567890|g' /var/www/huongdi/public/founder/index.html
```

---

## 🎯 STEP 6 — Test payment flow (manual verify)

### Trước khi launch, test:

1. **Tự chuyển khoản test 1.000đ** với nội dung `SOL test@sol.vn`
2. Check email hello@sol.vn có nhận biên lai không
3. Tự reply email + gửi magic link: `https://huongdi.sol.vn/prompts/?activate=SOL-ACTIVE-XYZ123`
4. Click link → unlock thành công

### Sau khi test OK, viết email template:

**Email template kích hoạt Sol Active:**

```
Chào [tên],

Cảm ơn anh chị đã đăng ký Sol Active! Sol đã xác nhận thanh toán 499.000đ.

🎉 Click link dưới để kích hoạt truy cập ngay:
https://huongdi.sol.vn/prompts/?activate=SOL-ACTIVE-ABCD1234

Link kích hoạt là 1 lần — sau khi click, Sol Active sẽ mở khoá trên trình duyệt của anh chị.

Anh chị nhận được:
✓ 40 câu hỏi AI đủ 5 Bước Sol La Bàn
✓ 37 mô hình hướng đi
✓ Sổ Hành Trình lưu tiến độ
✓ Zalo Group Active (link sẽ gửi khi có 10 members)
✓ Sol Weekly newsletter hàng tuần

Bắt đầu ngay tại: https://huongdi.sol.vn/prompts/

Nếu cần hỗ trợ, reply email này. Sol phản hồi trong 48h.

Trân trọng,
Khang Sol
Founder Sol.vn
```

---

## 🛡️ ROLLBACK nếu có lỗi

```bash
# Rollback prompts-builder
sudo ls /var/www/huongdi/public/prompts/index.html.bak-*
sudo cp /var/www/huongdi/public/prompts/index.html.bak-<TIMESTAMP> /var/www/huongdi/public/prompts/index.html

# Rollback sol-ui.js
sudo cp /var/www/huongdi/public/sol-ui.js.bak-<TIMESTAMP> /var/www/huongdi/public/sol-ui.js

# Remove new pages nếu chưa muốn public
sudo rm -rf /var/www/huongdi/public/pricing /var/www/huongdi/public/founder
```

---

## ⚠️ CẦN HỎI ANH SAU KHI DEPLOY

1. **Bank info** — số TK Techcombank/VCB/... để mình update 2 file
2. **Zalo link Khang** — để hiển thị trong founder page "ping Khang nếu cấp bách"
3. **hello@sol.vn** — email này đã setup forward tới email cá nhân chưa?

Anh trả lời trong chat, mình sed replace + redeploy 5 phút.
