# 🧭 EOD WRAP — 2026-07-13
## Landing sol.vn mới (LIVE) · Config động · Menu/Logo · Dọn fragmentation · Redirect
**Phiên nối tiếp 2026-07-11/12. Đọc kèm:** `ECOSYSTEM-AUDIT/PROJECT-DOCS/00-MASTER-SYSTEM-MAP-2026-07-11.md` (bản đồ chủ, đã cập nhật trong phiên).

---

## 1. THÀNH QUẢ LỚN NHẤT: Landing sol.vn mới — ĐÃ LÊN TRANG CHỦ (LIVE)

- File: `sol-ecosystem/solvn-landing/index.html` (~590 dòng, **tự chứa** — logo SVG nhúng, favicon nhúng, ảnh minh hoạ bằng HTML/CSS; chỉ phụ thuộc Google Fonts + ảnh Khang/og trên wp-content).
- **Đã deploy lên sol.vn**: upload `index.html` vào `public_html/` + thêm `DirectoryIndex index.html index.php` vào `.htaccess`. WP vẫn chạy cho blog/sách/khang-sol. Hoàn tác = xoá dòng DirectoryIndex.
- Home dir hosting: `/home/qbsigblp/public_html`. cPanel `sol.vn:2083`.

**Định vị đã chốt (rất quan trọng — giữ nhất quán mọi nơi):**
- Sol = **người ĐỒNG HÀNH, không dạy, không bán khoá học, không đa cấp/thuê bao**.
- **KHÔNG hứa hẹn thu nhập/thời gian** ("90 ngày → thu nhập" đã bỏ). Tiêu đề: *"Ở tuổi 40–60, tìm lại hướng đi phù hợp với chính mình — và đi từng bước, không đơn độc."*
- Gọi **"Phí đồng hành"** (không phải "học phí"). *"Mỗi tháng mời Sol một ly cà phê ☕ (~42k)."*
- Người Việt ngại thẻ online → nói **chuyển khoản/VietQR + hỗ trợ Zalo**, không nhắc "thẻ tín dụng".
- Dải trust đầu trang = **lời hứa chăm sóc** (👣 đi cùng · 🛠️ kinh nghiệm thực chiến · 🌱 miễn phí thong thả), KHÔNG phải cam kết chống-bị-lừa. Cam kết tiền (hoàn tiền 14 ngày, không thuê bao) dời xuống mục phí.
- Ngôn ngữ **thuần Việt** (bỏ roadmap→lộ trình, newsletter→bản tin, coach→cố vấn, case study→câu chuyện thực tế, Ex-CFO/SME/B2B... Việt hoá).

**E-E-A-T / YMYL (đạt):** thêm **khối Founder** (ảnh Khang thật + Thạc sĩ QLDA + 20 năm SME + câu chuyện tuổi 45) · **byline + ngày cập nhật** · **schema.org JSON-LD** (Organization + founder Person + VINET + MST + liên hệ) · tuyên bố miễn trừ trách nhiệm.

**Cấu trúc trang:** Header(logo la bàn) → Hero + **slideshow 3 màn** (Thư viện 64 / Bản đồ %match / Sổ Hành Trình) → dải trust → 3 con số → 3 trăn trở → **Sol làm việc thế nào (5 Bước)** → Bên trong Sol có gì (3 tài sản mock HTML) → so sánh → câu chuyện thực tế → **Founder** → Phí đồng hành → FAQ → CTA → **chân trang pháp lý đầy đủ** (VINET·MST·miễn trừ·hotline·Zalo·email).

---

## 2. CONFIG ĐỘNG (app_config) — ĐÃ DEPLOY huongdi

Founder tự chỉnh ngưỡng Free/quota trong **CMS ⚙️ Cấu hình**, hiệu lực ngay, không deploy.
- Bảng `app_config` (`seeds/19-app-config.sql`) · `services/config.ts` (cache 30s) · `GET /api/config/entitlements` · `GET/PUT /api/admin/config` · tab CMS.
- Quota AI (`sol-dong-hanh.ts`) + AI Studio đọc `free_prompt_limit` động (bỏ số cứng, vá rò rỉ quota Free).
- Giá trị: free_prompt_limit=5, active=40, free_ai_quota=0, active=30, founder=500.

---

## 3. MENU · LOGO · UX huongdi

- Menu gom **3 nhóm dropdown**: 🧭 Chọn hướng đi (Bước 1/2/3 + Thư viện hướng đi) · 🎨 AI Studio · 📖 Kiến thức (Bài viết + Sách hay). "Bước 3" trỏ `/la-ban-huong-di/ket-qua/` (bỏ hub cũ khỏi luồng).
- **Logo la bàn SVG** dùng chung: `huongdi-public/assets/sol-compass.svg` (thay Icon_2.png).
- ket-qua (Bản đồ): tiến độ 5 Bước · empty state ấm · dải trust · chữ 17px · **hoàn tiền 14 ngày** (đồng bộ, bỏ 7).
- Trang mới: `/sach-hay/` (placeholder).

---

## 4. REDIRECT sol.vn → huongdi (cứu link/CTA cũ)

| Cũ (chết) | → Đúng | Trạng thái |
|---|---|---|
| /thau-hieu/ | /kham-pha-ban-than/ | ✅ file tạo |
| /khai-pha/ | /kiem-ke-nguon-luc/ | ✅ file tạo |
| /chon-huong/ | /la-ban-huong-di/ket-qua/ | ✅ file tạo |
| /active/ | /pricing/ | ✅ file tạo |

⚠️ **Cần deploy huongdi** để 2 redirect mới (khai-pha, chon-huong) + logo + ket-qua UX lên (xem lệnh mục 7).

---

## 5. AUDIT SỐ/LINK (đã sửa trong landing)

- Số mô hình: **64** (bỏ 37/73). Hoàn tiền: **14 ngày**.
- Link pháp lý đúng: `sol.vn/dieu-khoan-su-dung/`, `sol.vn/tuyen-bo-mien-tru/`, `sol.vn/chinh-sach-bao-mat/`, `sol.vn/khang-sol/` (đã kiểm chứng tồn tại).
- FB group canonical: **web.facebook.com/groups/taikhoinghiepdunghuong** (sol.vn WP cần đổi theo).

---

## 6. VIỆC CÒN LẠI (hậu kỳ — phiên sau)

- [ ] **Deploy huongdi FE** (2 redirect + logo + ket-qua + sach-hay + pricing 14 ngày) — lệnh mục 7.
- [ ] WP sol.vn: đặt **trang chủ cũ noindex**; đổi link chết + nhóm FB (plugin *Better Search Replace* theo bản đồ Master Map §11).
- [ ] Tạo hộp thư **donghanh@sol.vn**.
- [ ] Soạn **Điều khoản riêng cho La Bàn** (điều khoản hiện tại là của sản phẩm cai thuốc lá).
- [ ] LP-3: huongdi/index rút gọn (notion-style) + noindex. LP-4: trang How-it-works.
- [ ] Config entitlement: chuyển số đếm marketing động + enforce prompt server-side (hardening).
- [ ] Dài hạn: 1-2 câu chuyện thật kiểm chứng (thay ẩn danh) cho E-E-A-T.

---

## 7. LỆNH DEPLOY huongdi FE (nếu chưa chạy)

**Máy anh (PowerShell):**
```powershell
cd C:\BOTHUOCLA\sol-ecosystem
tar -czf sol-fe2.tgz huongdi-public/sol-ui.js huongdi-public/assets/sol-compass.svg huongdi-public/la-ban-huong-di/ket-qua/index.html huongdi-public/sach-hay/index.html huongdi-public/thau-hieu/index.html huongdi-public/active/index.html huongdi-public/khai-pha/index.html huongdi-public/chon-huong/index.html huongdi-public/pricing/index.html; scp sol-fe2.tgz sol-vps:/tmp/
```
**VPS:**
```bash
cd /tmp && rm -rf solfe2 && mkdir solfe2 && tar -xzf sol-fe2.tgz -C solfe2 && sudo cp -r solfe2/huongdi-public/* /var/www/huongdi/public/ && sudo chown -R www-data:www-data /var/www/huongdi/public && echo OK
```

---

## 8. QUY TẮC DEPLOY (nhắc lại — đã vào Master Map §10)
- **KHÔNG** `prisma db push`. DB qua psql (file để `/tmp` + chmod 644 cho postgres đọc).
- huongdi: scp→build `tsc`→`pm2 restart huongdi-api`. Admin docroot = `/var/www/huongdi/admin/**dist**`.
- sol.vn: cPanel, KHÔNG đụng `index.php`, dùng DirectoryIndex.

_EOD 2026-07-13 · Sol Ecosystem · cột mốc: landing sol.vn mới LIVE._
