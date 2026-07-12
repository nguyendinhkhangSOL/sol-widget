# HỒ SƠ NAVIGATION & KHU VỰC USER — huongdi.sol.vn
## Nguồn sự thật duy nhất cho header / menu / login-logout / cá nhân hoá
**Ngày:** 2026-07-11 · Lập vì: vá lẻ nhiều nơi → header lộn xộn, trùng menu user.
**Quy tắc số 1:** Trước khi thêm/sửa BẤT KỲ nav/header/user element nào → đọc file này + `sol-ui.js`. KHÔNG tự dựng header/menu user trong từng trang.

---

## 1. NGUYÊN TẮC VÀNG (single source of truth) — ĐÃ CHỐT

> **Header/nav = `sol-ui.js`.** Nó render logo + nav (Bước 1/2/3, AI Studio, Bài viết) + CTA "Bắt đầu miễn phí", và **tự nạp `js/sol-user-nav.js`**.
>
> **Menu user (avatar + dropdown) = `js/sol-user-nav.js`** — widget CHÍNH THỨC DUY NHẤT. Nó lo login/logout/tier/avatar. Có dropdown: Dashboard · Bản đồ hướng đi · Sổ Hành Trình · Prompt Studio · Sol Đồng Hành AI · Đăng xuất.
>
> **Các trang TUYỆT ĐỐI KHÔNG tự dựng top-bar / avatar / user menu riêng.** sol-ui.js KHÔNG render menu user (đã gỡ — trước đây thêm nhầm gây trùng).

Lý do lập hồ sơ: từng có 3 nơi cùng dựng menu user (sol-ui.js thêm nhầm + top-bar /toi/ + sol-user-nav.js) → chồng chéo. Đã hợp nhất về **sol-user-nav.js**.

---

## 2. INVENTORY — thực trạng đang có

### 2.1. Header chuẩn: `sol-ui.js`
- 26 trang load nó (index, ai-studio, founder, kham-pha-ban-than, kiem-ke-nguon-luc, la-ban-huong-di/* , lien-he, p3-*, pricing, tai-khoan, tao-prompts-ca-nhan, toi/*, so-hanh-trinh...).
- Render: logo "Đi Cùng Sol" + nav (Bước 1/2/3, AI Studio▾, Bài viết) + **user menu "👤 Tên ▾"** (Trang của tôi · Sổ Hành Trình · Đăng xuất) HOẶC "Đăng nhập + Bắt đầu miễn phí" nếu chưa login.
- Auth: đọc `sol_jwt` (đăng nhập), `sol_user` (tên).

### 2.2. Auth & khoá localStorage
| Key | Ý nghĩa | Ai set |
|---|---|---|
| `sol_jwt` | JWT (CHUẨN) | login /dang-nhap/ + sol-auth.js |
| `sol_user` | {displayName,email,...} | login |
| `sol_active` / `sol_tier` | tier | login |
| `sol_token` | **THỪA** — login cũng set nhưng không ai đọc | login |
- Login page: `/dang-nhap/` → sau login redirect `/toi/` (KHÔNG xử lý `?next=`).
- Đăng ký: `/dang-ky/` · Quên MK: `/quen-mat-khau/` · Đặt lại: `/dat-lai-mat-khau/`. (Đã có, KHÔNG làm lại.)

### 2.3. Khu vực cá nhân hoá `/toi/`
| Trang | Vai trò |
|---|---|
| `/toi/` | Dashboard user (tiến độ 5 Bước, tier) |
| `/toi/so-hanh-trinh/` | **Sổ Hành Trình** (checklist lộ trình + nhật ký) — đã hợp nhất |
| `/toi/ban-do/` | ⚠️ CŨ (match-v2) — đã REDIRECT sang `/la-ban-huong-di/ket-qua/` |
| `/toi/sol-dong-hanh/` | Sol Đồng Hành AI |

**🗺️ Bản đồ hướng đi = `/la-ban-huong-di/ket-qua/`** (match-v3, 73 mô hình) — DUY NHẤT. Menu user "Bản đồ hướng đi" trỏ về đây. `/toi/ban-do/` chỉ còn là redirect. match-v2 = DEPRECATED (không dùng ở FE nữa).

**Luồng lõi (chuẩn):** Bước 1 → Bước 2 → **🗺️ Bản đồ hướng đi** (/ket-qua/, chọn hướng) → chi tiết → **🚀 Bắt đầu hành trình** → **📓 Sổ Hành Trình** (/toi/so-hanh-trinh/, đi 90 ngày).
- Bản đồ = CHỌN hướng (nhiều, %match). Sổ = ĐI 1 hướng đã chọn (checklist + nhật ký). KHÁC nhau, bổ trợ.

---

## 3. CÁC ĐIỂM TRÙNG / LỘN XỘN ĐANG CÓ (root cause)

| # | Vấn đề | Nơi |
|---|--------|-----|
| N1 | `/toi/index.html` **tự render user menu riêng** (top-bar #userMenu: tier + tên + đăng xuất, JS dòng 213/241) → trùng user menu sol-ui.js | toi/index.html |
| N2 | `/toi/ban-do/index.html` cũng có top-bar/avatar riêng | toi/ban-do/ |
| N3 | CSS cũ `body>.top-bar{display:none}` KHÔNG ăn (sol-ui.js inject style sau) → chip vẫn hiện | toi/index.html:126 |
| N4 | `sol-avatar-icon.js` (10KB) tồn tại nhưng **KHÔNG trang nào load** → file chết | — |
| N5 | User menu sol-ui.js **chưa hiện tier**; /toi/ chip có tier → thông tin phân tán | sol-ui.js |
| N6 | Trang root `/so-hanh-trinh/` (tạo nhầm) song song `/toi/so-hanh-trinh/` — đã bỏ, KHÔNG deploy root | — |
| N7 | Key `sol_token` thừa (không ai đọc) | login |

---

## 4. THIẾT KẾ ĐÍCH (target — làm theo cái này)

**Header (mọi trang, do sol-ui.js):**
- Chưa login: `[logo] … Bước 1/2/3 · AI Studio▾ · Bài viết · Đăng nhập · [Bắt đầu miễn phí →]`
- Đã login: `[logo] … Bước 1/2/3 · AI Studio▾ · Bài viết · 👤 Tên [badge tier] ▾` → { Trang của tôi · 📓 Sổ Hành Trình · (Nâng cấp nếu Free) · Đăng xuất }

**Các trang /toi/*:** KHÔNG top-bar/chip riêng. Chỉ dùng header sol-ui.js. Nội dung trang bắt đầu ngay (welcome, dashboard...).

---

## 5. CHECKLIST DỌN DẸP (thực thi dần, tick khi xong)

- [ ] **sol-ui.js**: thêm badge tier vào user menu (đọc sol_active/sol_tier). *(N5)*
- [ ] **toi/index.html**: gỡ `<div class="top-bar">` + guard JS ghi #userMenu (khỏi null) + bỏ style override thừa. *(N1,N3)*
- [ ] **toi/ban-do/index.html**: gỡ top-bar/chip riêng. *(N2)*
- [ ] **toi/sol-dong-hanh/**, các trang /toi/ khác: rà, gỡ chip riêng nếu có.
- [ ] Xoá file `sol-avatar-icon.js` (chết). *(N4)*
- [ ] Xoá key `sol_token` khỏi login (chuẩn hoá về sol_jwt). *(N7)*
- [ ] (Tùy) `/dang-nhap/` xử lý `?next=` để quay lại đúng chỗ.
- [ ] Xoá trang root `/so-hanh-trinh/` nếu đã lỡ deploy. *(N6)*

---

## 6. QUY TẮC CHO CÁC PHIÊN SAU
1. **Chỉ sửa header/user ở `sol-ui.js`.** Không đụng header trong từng trang.
2. Trước khi thêm 1 trang mới: kiểm tra đã có trang tương tự chưa (tránh trùng như /so-hanh-trinh vs /toi/so-hanh-trinh).
3. Auth: luôn dùng `sol_jwt` + `sol_user`. Không tạo key mới.
4. Cập nhật file này mỗi khi đổi cấu trúc nav/user.

_Hồ sơ tham chiếu · Sol Ecosystem · 2026-07-11 · đọc trước mọi lần sửa nav/header/user._
