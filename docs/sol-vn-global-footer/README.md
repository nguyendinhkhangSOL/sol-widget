# Sol V2.2 Global Footer Deployment

**Mục đích:** Thay theme footer CŨ bằng Sol V2.2 footer trên **TẤT CẢ** pages của sol.vn.

---

## 📦 3 Files

| File | Vai trò |
|---|---|
| `01-DEPLOY-GUIDE.md` | Hướng dẫn 3 cách deploy (theme editor / child theme / plugin) |
| `footer-replacement.html` | HTML thay vào theme footer.php |
| `css-footer-global.css` | CSS scope global cho footer (no body.home) |

---

## ⭐ Quick Deploy — Cách đơn giản nhất (10 phút)

### Bước 1: Backup theme footer.php

WP Admin → **Appearance → Theme File Editor** → chọn `footer.php` từ panel bên phải.

Copy TOÀN BỘ nội dung → paste vào Notepad → save thành `footer-backup-2026-06-27.php` trên máy local.

### Bước 2: Replace footer content

Trong WP Theme File Editor:

1. Tìm `<footer class="sol-footer">` ... `</footer>` (block lớn nhất)
2. **Xoá** toàn bộ block đó
3. **Paste** TOÀN BỘ nội dung từ `footer-replacement.html`
4. **KHÔNG XOÁ:** `<?php wp_footer(); ?>` và `</body></html>` cuối file

### Bước 3: Add CSS Global

WP Admin → **Customize → Additional CSS** → SCROLL XUỐNG CUỐI → paste TOÀN BỘ nội dung từ `css-footer-global.css`.

→ Click **Publish**.

### Bước 4: Test 3 page

Mở Incognito (**Ctrl + Shift + N**) test:
- `https://sol.vn/` (homepage)
- `https://sol.vn/khang-sol/` (page)
- `https://sol.vn/huong-di/freelancer-chuyen-mon-tuoi-45/` (blog post)

**Tất cả phải có Sol V2.2 footer giống nhau:**
- 5 cột: Brand + Sản phẩm + Tài nguyên + Về Sol + Dự án liên quan
- Emergency bar đỏ với 4 hotlines (115, 0888-008-866, 1900 599958, startup.gov.vn)
- 4 YMYL warnings (Thân/Tâm/Trí + tổng quan)
- Bottom: trust links + copyright + regulatory

---

## 🎯 Highlights của footer mới

### Giữ từ theme cũ (compliance critical)
- ✓ **4 Emergency hotlines** (115, BV Bạch Mai 0888-008-866, Ngày Mai 1900 599958, startup.gov.vn)
- ✓ **4 YMYL warnings** (Y khoa / Tâm thần / Tài chính + tổng quan)
- ✓ Trust links (Privacy, Terms, Disclaimer, Cookie, Liên hệ)

### Mới theo V2.2 (focus Sách + Huongdi)
- ✓ **Brand pitch:** "Sách + Hệ thống huongdi.sol.vn" (focus revenue products)
- ✓ **Cột Sản phẩm:** Sách + huongdi P1/P2/P3 (rev focus)
- ✓ **Cột Tài nguyên miễn phí:** Blog + Newsletter
- ✓ **Cột Về Sol:** Khang + 21 FAQs + Cộng đồng
- ✓ **Cột Dự án liên quan:** bothuocla (de-emphasized)
- ✓ Tone "mình - anh" + Slogan "Đi cùng nhau, đường dài đỡ mỏi"

### Đã bỏ (theo Khang's strategy)
- ✗ "5-col Nav TRỤ THÂN/TÂM/TRÍ" (đã đồng ý bỏ)
- ✗ Pitch dài 3 trụ Thân-Tâm-Trí trong brand col
- ✗ **Regulatory compliance text** (Luật An ninh mạng + NĐ 13) — đã có trong các page riêng + Tuyên bố miễn trừ

---

## 🛡️ Rollback (10 giây)

Nếu sau deploy thấy lỗi:

1. WP Admin → Theme File Editor → footer.php
2. Paste lại content từ `footer-backup-2026-06-27.php`
3. Update File

→ Footer cũ trở lại ngay.

---

## ⚠️ Risk: Theme update có thể overwrite

Nếu theme có update version → footer.php bị reset về default.

**Mitigation:**
- Lưu backup `footer-backup-2026-06-27.php` cẩn thận
- Hoặc làm **Cách 2 Child Theme** (xem `01-DEPLOY-GUIDE.md`)

---

## 📋 Pre-deploy Checklist

### Trước
- [ ] Backup theme footer.php → save local file
- [ ] Đảm bảo Customize → Additional CSS có Sol V2.2 all-in-one CSS
- [ ] Note theme name (Appearance → Themes → tên Active)
- [ ] Tạo 3 URL test trước

### Sau
- [ ] Homepage footer = Sol V2.2 ✓
- [ ] Blog post footer = Sol V2.2 ✓
- [ ] Founder page footer = Sol V2.2 ✓
- [ ] Mobile responsive OK
- [ ] Emergency hotlines hoạt động (clickable tel:)
- [ ] All footer links hoạt động (no 404)
- [ ] KHÔNG còn footer cũ "TRỤ THÂN/TÂM/TRÍ" anywhere

---

## 🎁 Bonus — Cải thiện thêm sau deploy

### 1. Footer scroll-to-top
Thêm button "↑ Lên đầu trang" ở góc dưới phải footer.

### 2. Footer newsletter signup inline
Thêm 1 input email trong cột "Tài nguyên miễn phí" → quick subscribe.

### 3. Social proof bar (Year 2+)
Add row "500+ anh em đã đi cùng" trên emergency bar.

### 4. Multi-language ready
Wrap text bằng WP function `__()` để future i18n.

---

*Footer = nơi cuối cùng user thấy. Đầu tư đúng — trust compound.*
