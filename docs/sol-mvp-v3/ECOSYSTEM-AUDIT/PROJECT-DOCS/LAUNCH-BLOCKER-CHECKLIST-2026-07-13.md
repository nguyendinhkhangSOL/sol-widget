# 🚦 LAUNCH-BLOCKER CHECKLIST — Trang chủ · P1 · P2

> Gom toàn bộ mâu thuẫn đối tác soi (đợt review P1 + P2) thành 1 nơi tick.
> Cập nhật: 2026-07-13 · ✅ đã sửa · 🟡 chờ deploy · 🔶 cần anh quyết

---

## 1. Mâu thuẫn xuyên trang (nhất quán số + tên)

| # | Hạng mục | Trạng thái | Ghi chú |
|---|---|---|---|
| 1.1 | Số câu Bước 1: "10 câu" → **20 câu · 5–7 phút** | ✅ | landing, how-it-works, kham-pha, ai-studio |
| 1.2 | Hoàn tiền: "14 ngày" → **7 ngày** | ✅ | landing, pricing (thẻ+FAQ), ket-qua, ai-studio, founder |
| 1.3 | Số mô hình: "37" → **64** | ✅ | pricing (×5), ai-studio, founder |
| 1.4 | ChatGPT "~500k" → **~6tr ($20×12)** | ✅ | bảng so sánh landing |
| 1.5 | **Sol Facts** (refund/số câu/số mô hình/giá) đưa vào DB `app_config` | ✅ | Đổi 1 nơi trong CMS → mọi trang tự đồng bộ (sol-facts.js) |
| 1.6 | Thời gian P2 "~10–15 phút" ghi lên đầu P2 | ✅ | Trước đây thiếu |

---

## 2. Tên Bước 2 — chốt 1 tên duy nhất

**Chốt: "Bước 2 · KHAI PHÁ — Bản đồ Vốn Ngầm"** (verb = *khai phá*, map = *Vốn Ngầm*). URL slug giữ `kiem-ke-nguon-luc`.

| Nơi | Cũ (loạn) | Mới | Trạng thái |
|---|---|---|---|
| Tiêu đề P2 | "Khai phá nguồn lực" | Khai phá — Bản đồ Vốn Ngầm | ✅ |
| Nút bắt đầu P2 | "Khai báo nguồn lực" | Vẽ Bản đồ Vốn Ngầm | ✅ |
| Nhãn kết quả P2 | "Bản đồ nguồn lực / Resource DNA" | Bản đồ Vốn Ngầm | ✅ |
| P1 handoff (kham-pha) | "Khai báo nguồn lực" | Khai phá Vốn Ngầm | ✅ |
| Landing (step + FAQ) | "Kiểm kê nguồn lực" | Khai phá / Bản đồ Vốn Ngầm | ✅ |
| Menu (sol-ui.js) | "Bước 2: Khai phá" | giữ (đã đúng verb) | ✅ |

---

## 3. 🔴 Lằn ranh paywall — bảo vệ doanh thu Bước 3

**Vấn đề:** P2 free từng hiện "Hướng đi trong tầm tay", "Hướng đi theo mức khả thi", Top mô hình + %, thu nhập, "cần thêm gì" — chính là giá trị Bước 3 Active (499k).

**Chốt (anh duyệt): Gỡ danh sách mô hình cụ thể — chỉ gợi mở NHÓM mờ + teaser khoá.**

| Item | Trạng thái |
|---|---|
| Canvas live (`#dirList`): bỏ list mô hình → chỉ "Bạn nghiêng về nhóm X" + 🔒 | ✅ |
| Kết quả (`#dirResults`): bỏ Top mô hình + %/thu nhập → nhóm mờ + "🔒 Top 5 mở ở Bước 3" | ✅ |
| Gom 8 hướng → 3 nhóm (Chuyên môn & Cố vấn / Nội dung & Kết nối số / Kinh doanh & Dịch vụ) | ✅ |
| Giữ CTA "Xem hướng đi phù hợp → Bước 3" (upsell hợp lệ) | ✅ |
| **Rà `/la-ban-huong-di/ket-qua/` (Bước 3): xác nhận Top mô hình bị khoá đúng cho Free** | 🔶 nên soi tiếp |

---

## 4. UX cho người 40-60

| Item | Trạng thái | Ghi chú |
|---|---|---|
| Trấn an quyền riêng tư ngay mục hỏi tiền | ✅ | "🔒 Chỉ mình bạn thấy · lưu tại VN" ở phần vốn |
| Trần thu nhập lý tưởng 200M → **100M** | ✅ | Hợp case study 25–48tr, bớt kỳ vọng ảo |
| Slider tiền/giờ/thu nhập → **chọn-khoảng (bracket)** | 🔶 chưa làm | Cần sửa logic sol-flow/scoring — làm đợt riêng, rủi ro cao hơn |

---

## 5. Khái niệm cần anh quyết 🔶

| # | Vấn đề | Đề xuất |
|---|---|---|
| 5.1 | **"8 loại vốn ngầm" (landing) vs radar P2 chỉ 7 chiều** (KN, thời gian, năng lượng, vốn, mạng lưới, công nghệ, rủi ro) | Chốt: 8 chiều (thêm 1 trục, vd "Uy tín/Thương hiệu cá nhân") HAY đổi landing về "7 loại"? |
| 5.2 | Mục 4 gộp **Rủi ro + Mục tiêu thu nhập** vào "nguồn lực" | Đổi tên ô lớn thành **"Nguồn lực & Ràng buộc"** (rủi ro/thu nhập là ràng buộc, không phải vốn) |
| 5.3 | Legend 8 trục ghi rõ tên ngay đầu P2 | Thêm sau khi chốt 5.1 |
| 5.4 | AI Studio: nhóm prompt "Bước 5 = An Toàn" vs quyết định "Bước 5 = Cá nhân hoá" | Giữ "An Toàn" cho nhóm prompt HAY đổi hết sang "Cá nhân hoá"? |

---

## 6. Việc deploy còn treo

- FE huongdi: `kiem-ke-nguon-luc`, `kham-pha-ban-than` (đợt P2 này) + batch Sol Facts trước đó.
- sol.vn (cPanel): re-upload `solvn-landing/index.html` (đã đổi FAQ + step + Sol Facts).
- Backend Sol Facts: ✅ đã LIVE.

---

*Nguồn: review đối tác P1 (đợt trước) + P2 (2026-07-13). File này là 1 nguồn tick launch-blocker — cập nhật khi tick xong từng mục.*
