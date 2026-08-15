# 🚦 Kế hoạch vá lỗi trước Launch (theo review đối tác 14/07)

> Map từng mục checklist đối tác → trạng thái thật + ai làm + thứ tự.
> Ký hiệu: ✅ đã vá (repo) · 🔧 em sửa được (code) · 🖊 anh sửa WP editor · 🔶 cần anh quyết

---

## A. Quyết định (D1–D10) — trạng thái

| # | Vấn đề | Trạng thái |
|---|---|---|
| **D1** | Số mô hình thật | ✅ **CHỐT: 64** — bằng chứng: match-v3 LIVE trả `total=64` (ket-qua hiện "so khớp 64 hướng đi"). Các "37" là **số cũ sót lại** phải dọn |
| **D2** | Hoàn tiền 7/14 | ✅ **7 ngày** (đã vá huongdi + landing; còn quiz WP) |
| D3 | Có tư vấn 1-1? | 🔶 Đề xuất: **giữ "không 1-1"**, sửa lời quiz thành "hỏi nhanh qua Zalo cộng đồng" |
| D4 | Số người phỏng vấn | 🔶 Anh chốt **1 con số thật** (50 hay 10–15?) |
| D5 | Founder mở bán hay 2 tuần nữa? | 🔶 **P0** — anh chốt 1 trạng thái |
| D6 | 1 số Zalo | 🔶 `3547…` (hotline) vs `0912727381` (Khang cá nhân) — chốt/phân vai |
| D7 | 1 link FB Group | ✅ **taikhoinghiepdunghuong** (đã dùng) — còn quiz dùng dicungsol |
| **D8** | Tên Bước 5 | ✅ **Cá nhân hoá** (mình đã đổi app sang Cá nhân hoá — vượt khuyến nghị "An toàn" của đối tác). Cần đồng bộ mọi nơi = Cá nhân hoá |
| D9 | Domain checkout | 🔶 **P0** — chốt 1 (khuyến nghị `huongdi.sol.vn/thanh-toan`), 301 cái kia |
| D10 | Định dạng memo CK | 🔶 **P0** — chốt mã tự sinh `SOL-ACT-xxxx` mà bộ auto-match thật đọc |

---

## B. 🔴 P0 — Chặn/rơi thanh toán (vá ĐẦU TIÊN)

| ☐ | Mục | Trạng thái | Ai |
|---|---|---|---|
| 1 | **Checkout chặn khách MỚI** — `/thanh-toan/` bắt "đăng nhập trước" (dòng 605/743/947) → khách mới vào là ngõ cụt | 🔧 **chưa vá** — cần cho khách mới điền SĐT+email, không bắt login | Em (cần anh xác nhận luồng) |
| 2 | **Memo CK 3 kiểu** (`SOL-ACT-xxxx` / `SOL [email]` / `FOUNDER [email]`) | 🔶 D10 chốt rồi em đồng bộ | Anh quyết → Em |
| 3 | **Founder 3 trạng thái** (100/100 slot + "2 tuần nữa" + nút mua sống) | 🔶 D5 chốt rồi em dọn | Anh quyết → Em |
| 4 | **2 domain checkout** | 🔶 D9 chốt rồi em set redirect | Anh quyết → Em |

---

## C. 🟠 P1 — Số liệu mâu thuẫn

| ☐ | Mục | Trạng thái |
|---|---|---|
| 1 | Số mô hình → **64** | ✅ pricing/ai-studio/founder(huongdi) · 🔧 còn: hub `la-ban-huong-di/index`, `sol-auth.js`, legacy p1/p2/p3/activate/dashboard · 🖊 quiz WP |
| 2 | **Founder < Active** (Founder "37" < Active "64") | 🔧 sửa cột Founder trang giá = full 64 |
| 3 | Hoàn tiền → **7** | ✅ huongdi+landing · 🖊 quiz WP (2 chỗ "14 ngày") |
| 4 | Coach 1-1 (D3) | 🖊 quiz WP |
| 5 | Số phỏng vấn (D4) | 🔶 anh chốt → sửa landing + quiz |

---

## D. 🟡 P2 — Nhất quán & kỹ thuật

| ☐ | Mục | Trạng thái |
|---|---|---|
| 1 | Bước 5 = **Cá nhân hoá** | ✅ app · 🖊 landing/quiz kiểm lại đồng bộ |
| 2 | 1 số Zalo (D6) | 🔶 chốt → thay `0912727381` ở checkout/founder/ai-studio |
| 3 | 1 link FB (D7) | ✅ repo · 🖊 quiz WP (dicungsol) |
| 4 | Cửa miễn phí phân mảnh (thau-hieu/kham-pha) | ✅ redirect đã có |
| 5 | Link Bước 1→2 `p2.html` | ✅ đã sửa `/kiem-ke-nguon-luc/` |
| 6 | Kênh xác nhận CK (Zalo/email/auto-match) | 🔧 đồng bộ câu chữ + email `hello@`→`donghanh@` |
| 7 | Founders Wall hứa suông | 🔶 anh chọn: thêm mục Wall placeholder / hạ lời hứa |
| 8 | Trang JS trắng màn (`/tat-ca/`, `/ket-qua/`) | 🔧 thêm skeleton + nút thử lại |
| 9 | Free 3 hay 5 mô hình | 🔶 chốt → đồng bộ (Sol Facts đã có `free`) |
| 10 | Ẩn dụ giá (cà phê…) | 🔧 chọn 1 (nhỏ) |

---

## E. ⚪ UX — tông giọng phễu
- Ẩn Founder + khan hiếm ("823 người", "100 slot") khỏi khách lạnh; chỉ hiện sau Bước 1–2. 🔶 quyết sản phẩm.

---

## Thứ tự thực thi
1. **Anh chốt 6 quyết định P0/P1**: D4, D5, D6, D9, D10 + luồng checkout khách mới.
2. **Em vá P0** (checkout khách mới + memo + Founder + domain) — không có bước này mọi traffic rơi.
3. **Em dọn số liệu** (64, 7, Zalo, email, Founder<Active) toàn repo + deploy.
4. **Anh sửa quiz WP** (`/kham-pha-nhanh/`): 37→64, 14→7, bỏ "1-1 15'", dicungsol→taikhoinghiepdunghuong, số phỏng vấn — em soạn sẵn danh sách tìm-thay.
5. **P2 kỹ thuật** (skeleton trang JS, ẩn dụ giá).
6. **UX** tông giọng phễu.

---

*Nguồn: checklist đối tác 14/07. Cập nhật khi tick xong từng mục.*
