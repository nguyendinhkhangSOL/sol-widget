# Integrate `/thanh-toan/` với API mới

## Vị trí file cần sửa

```
C:\BOTHUOCLA\sol-widget\docs\sol-mvp-v3\v4.1-combo\payment-flow\thanh-toan.html
```

## Thay đổi cần làm

### 1. Trong JavaScript của form, khi user submit → POST tới API mới

Tìm hàm submit form (thường tên `handleFormSubmit()` hoặc `onFormSubmit()`), thay bằng:

```javascript
async function submitPaymentForm() {
  const form = document.getElementById('payment-form');
  const btnSubmit = form.querySelector('button[type="submit"]');

  const data = {
    ten:   form.ten.value.trim(),
    sdt:   form.sdt.value.trim(),
    email: form.email.value.trim(),
    zalo:  form.zalo.value.trim() || form.sdt.value.trim(),
    goi:   form.goi ? form.goi.value : 'active'   // hoặc 'founder' tuỳ user chọn
  };

  // Validate FE
  if (!data.ten || !data.sdt) {
    alert('Vui lòng điền đủ Tên và SĐT');
    return;
  }

  btnSubmit.disabled = true;
  btnSubmit.textContent = '⏳ Đang gửi...';

  try {
    const r = await fetch('https://huongdi.sol.vn/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await r.json();

    if (result.success) {
      // Hiển thị QR + thông tin CK từ result.payment_info
      showQRScreen(result.payment_info, result.lead_id);
    } else {
      alert('Lỗi: ' + (result.message || 'Không gửi được'));
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Xác nhận';
    }
  } catch (err) {
    console.error(err);
    alert('Không kết nối được server. Vui lòng kiểm tra mạng.');
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Xác nhận';
  }
}

// showQRScreen dùng thông tin từ API (không hardcode nữa)
function showQRScreen(paymentInfo, leadId) {
  // paymentInfo = { bank, account, account_name, amount, transfer_note }
  // Note quan trọng: transfer_note = "SOL {sdt}" — nội dung CK để Khang match
  document.getElementById('screen-form').style.display = 'none';
  document.getElementById('screen-qr').style.display = 'block';

  document.getElementById('qr-account').textContent = paymentInfo.account;
  document.getElementById('qr-amount').textContent = paymentInfo.amount.toLocaleString('vi-VN') + 'đ';
  document.getElementById('qr-note').textContent = paymentInfo.transfer_note;

  // QR code VietQR
  const qrUrl = `https://img.vietqr.io/image/tcb-${paymentInfo.account}-compact2.png` +
                `?amount=${paymentInfo.amount}` +
                `&addInfo=${encodeURIComponent(paymentInfo.transfer_note)}` +
                `&accountName=${encodeURIComponent(paymentInfo.account_name)}`;
  document.getElementById('qr-image').src = qrUrl;

  // Store lead_id để track (optional)
  localStorage.setItem('sol_pending_lead_id', leadId);
}
```

### 2. Trong màn hình QR, thêm hướng dẫn rõ về nội dung chuyển khoản

Text mẫu:

```html
<div class="qr-note-important">
  ⚠️ QUAN TRỌNG: Trong nội dung chuyển khoản, PHẢI ghi:
  <strong id="qr-note" style="background:#F59E0B; color:#fff; padding:4px 8px; border-radius:4px;">
    SOL 0912XXXXXX
  </strong>
  <br>
  <small>Để chúng tôi khớp thanh toán với anh/chị nhanh nhất.</small>
</div>
```

### 3. Sau khi hiển thị QR, thêm phần "Sau khi chuyển khoản"

```html
<div style="background:#FFFBEB; padding:16px; border-radius:8px; margin-top:20px;">
  <strong>Sau khi chuyển khoản:</strong>
  <ol style="margin:8px 0 0 20px;">
    <li>Chúng tôi sẽ kiểm tra biến động tài khoản trong 2-4 giờ.</li>
    <li>Anh/chị sẽ nhận Zalo/Email chứa <strong>link kích hoạt</strong>.</li>
    <li>Click link → tự động Active gói trong 3 giây.</li>
  </ol>
  <p style="margin-top:12px; font-size:13px; color:#B45309;">
    Có vấn đề? <a href="https://zalo.me/0912727381">Chat Zalo Khang</a>
  </p>
</div>
```

## Test scenarios

### Test 1 — Submit form đúng
- Điền form với SĐT thật
- Nhận response: `{ success: true, lead_id: X, payment_info: {...} }`
- QR screen hiển thị account 11522026076011, amount 499000, note "SOL 0912xxx"
- Trong DB xuất hiện row mới với payment_status='pending'
- Khang nhận email + Telegram notification

### Test 2 — Submit thiếu field
- Không điền tên → nhận `{ success: false, message: 'Vui lòng điền đủ...' }`

### Test 3 — Rate limit
- Submit 6 lần với cùng SĐT trong 24h → lần thứ 6 nhận 429 "Quá nhiều lần submit"

### Test 4 — SĐT sai format
- Nhập "abc" → nhận `{ success: false, message: 'SĐT không hợp lệ' }`
