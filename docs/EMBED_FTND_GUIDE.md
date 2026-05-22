# Embed Test FTND vào sol.vn — Guide cho Khang

**Mục đích:** Đặt Test FTND vào bài WordPress trên sol.vn để:
1. **SEO** — capture keyword "test fagerstrom tiếng việt", "đo mức nghiện nicotine", "test cai thuốc lá"
2. **Phễu lead** — user test xong → CTA về `bothuocla.sol.vn` tự nhiên (cùng cohort)
3. **Authority** — content có công cụ chuyên môn = trang chất lượng cao theo Google E-E-A-T

---

## 🎯 Cách 1: Iframe embed (đơn giản nhất, deploy ngay)

### Snippet copy vào WordPress (HTML block)

```html
<!-- Sol Test FTND embed — chiếm full width container -->
<div style="position: relative; overflow: hidden; width: 100%; max-width: 720px; margin: 0 auto;">
  <iframe
    src="https://bothuocla.sol.vn/test-ftnd?embed=1"
    title="Test Mức Lệ Thuộc Nicotine — Fagerström (FTND)"
    style="width: 100%; min-height: 900px; border: 0; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);"
    allow="clipboard-write"
    loading="lazy"
  ></iframe>
</div>
```

### Lưu ý quan trọng

- **`?embed=1`** trong URL → backend render minimal mode (no fixed inset, no force redirect, hiện link Khang sol.vn ở cuối)
- **`min-height: 900px`** — đủ chỗ cho intro screen. Sau khi user vào câu hỏi, scroll trong iframe vẫn OK.
- **`target="_top"`** trên các link trong iframe → khi user click CTA "Tiếp tục" sẽ thoát iframe + nhảy sang `bothuocla.sol.vn`
- **`loading="lazy"`** → không block render bài viết, iframe chỉ load khi user scroll tới

---

## 🎯 Cách 2: WordPress Custom HTML widget

Nếu Khang muốn đặt vào **sidebar** hoặc **post footer**:

1. WordPress admin → **Appearance → Widgets**
2. Add **Custom HTML widget** vào Sidebar
3. Paste snippet trên (giảm `min-height: 700px` cho sidebar gọn hơn)

---

## 🎯 Cách 3: Button CTA đơn giản (nếu không muốn iframe)

Nếu page đã dài, không muốn embed iframe nặng:

```html
<div style="text-align: center; padding: 32px; background: linear-gradient(135deg, #FBF7F0 0%, #F0E5D0 100%); border-radius: 16px; margin: 24px 0;">
  <div style="font-size: 48px;">🌅</div>
  <h3 style="color: #B25C2C; margin: 8px 0;">Anh đang nghiện nicotine ở mức nào?</h3>
  <p style="color: #5A5650; margin-bottom: 20px;">
    Làm Test FTND 6 câu (~90 giây) để biết mức lệ thuộc + lộ trình cai cá nhân hoá miễn phí.
  </p>
  <a
    href="https://bothuocla.sol.vn/test-ftnd"
    target="_blank"
    rel="noopener noreferrer"
    style="display: inline-block; background: #B25C2C; color: white; padding: 14px 32px; border-radius: 12px; font-weight: 600; text-decoration: none; font-size: 16px;"
  >
    🚀 Bắt đầu Test FTND →
  </a>
  <p style="color: #8A857C; font-size: 13px; margin-top: 12px;">
    Hoàn toàn miễn phí · KHÔNG cần SĐT · Khoa học Fagerström 1991
  </p>
</div>
```

---

## 📝 Bài WordPress đề xuất

### Tiêu đề SEO
- **Bài chính:** `Test Mức Lệ Thuộc Nicotine (FTND) — Miễn Phí Tiếng Việt`
- **Slug:** `/test-muc-le-thuoc-nicotine-mien-phi/`
- **Meta description:** `Test Fagerström 6 câu chuẩn quốc tế 1991 — đo chính xác mức nghiện nicotine của anh. Hoàn toàn miễn phí, không cần SĐT. Sol cá nhân hoá lộ trình cai theo kết quả.`

### Outline content xung quanh iframe

```markdown
# Test Mức Lệ Thuộc Nicotine (FTND) — Miễn Phí Tiếng Việt

## Anh có thực sự nghiện thuốc lá?

Hầu hết người hút thuốc lá đều biết mình "ghiền" — nhưng ít ai biết
mình ghiền ở mức nào. Mức độ nghiện quyết định lộ trình cai
hợp lý: hút 5 điếu/ngày khác với hút 1 bao, và cách bỏ cũng phải khác.

## Test FTND là gì?

Test Fagerström (FTND) do bác sĩ Karl Fagerström phát triển năm 1991,
là công cụ chuẩn quốc tế đo mức "đói nicotine" sinh học. Chỉ 6 câu hỏi,
khoảng 90 giây.

[EMBED IFRAME HERE — sử dụng snippet ở Cách 1]

## Sau khi có kết quả thì làm gì?

- **NHẸ (0-3)**: tâm lý là chính, có thể cai trong 35 ngày
- **TRUNG BÌNH (4-6)**: cần combo công cụ + thời gian — 52 ngày
- **NẶNG (7-10)**: cần Q-Day muộn hơn + voice nhiều hơn — 65 ngày

Sol Widget cung cấp lộ trình cá nhân hoá cho từng mức.
[Đọc thêm về phương pháp Sol →](https://sol.vn/phuong-phap)
```

---

## 🔍 SEO keywords nên target

Đặt trong title, h2, alt image:

- `test fagerstrom tiếng việt`
- `test mức lệ thuộc nicotine`
- `test cai thuốc lá`
- `đo mức nghiện thuốc lá`
- `câu hỏi cai thuốc lá`
- `test fagerstrom miễn phí`

---

## ⚙️ Tracking conversion từ sol.vn → bothuocla.sol.vn

Thêm UTM param vào CTA để Khang biết user nào đến từ bài nào:

```html
<a href="https://bothuocla.sol.vn/test-ftnd?utm_source=sol-vn&utm_medium=embed&utm_campaign=ftnd-test-page&embed=1">
  Bắt đầu test →
</a>
```

Sau đó GA4 / Microsoft Clarity sẽ track được:
- Source: sol.vn
- Medium: embed
- Campaign: ftnd-test-page

---

## 🚨 Lưu ý kỹ thuật

1. **CORS**: iframe sol.vn (WordPress) embed bothuocla.sol.vn — cùng root domain `.sol.vn` → OK
2. **CSP**: nếu Cloudflare có CSP headers, cần đảm bảo `frame-ancestors 'self' https://sol.vn https://*.sol.vn`
3. **HTTPS**: bothuocla.sol.vn đã có SSL, iframe sol.vn → bothuocla.sol.vn không mixed content
4. **Performance**: iframe lazy load + min-height đủ → không gây CLS (Cumulative Layout Shift)

---

## ✅ Test sau khi embed

1. Mở bài WordPress trên sol.vn (preview hoặc published)
2. Iframe FTND load → thấy intro screen "Sol cần hiểu anh trước"
3. Click "Bắt đầu test 6 câu" → câu 1 hiện
4. Trả lời 6 câu → 2.8s animation → Result page
5. Click "Tiếp tục hành trình" → thoát iframe + redirect `bothuocla.sol.vn/` (vì target="_top")

Nếu CTA cuối không thoát iframe (vẫn loop trong iframe), em cần fix code thêm `window.parent.top.location` thay vì `navigate()`.
