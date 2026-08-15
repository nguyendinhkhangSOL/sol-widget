# 🌅 EOD WRAP — 2026-07-14
## Paywall 2 lớp · Việt hoá · Giãn điểm match · Hệ nhắc nhở tự động

> Phiên lớn khép các lỗ hổng launch-blocker đối tác nêu + hoàn tất EXP-1→4.
> Trạng thái cuối phiên: **hệ thống cơ bản đã ổn, sẵn sàng vận hành.**

---

## 1. Tóm tắt 1 dòng

Đóng chặt lằn ranh trả phí (Bước 3), thống nhất số liệu/thuật ngữ toàn hệ, việt hoá tối đa cho người 40–60, làm kết quả match "biết nói", và dựng xong **hệ nhắc nhở email tự động** (Brevo → inbox đã kiểm chứng).

---

## 2. Đã hoàn thành (theo nhóm)

### 🔴 A. Paywall Bước 3 — khoá 2 lớp (quan trọng nhất)
| Lớp | Nội dung |
|---|---|
| Frontend | `ket-qua` kiểm hạng: Guest/Free thấy **khối khoá + CTA Active**, không lộ Top 5 |
| **Backend** | `match-v3` chặn server: Free/guest nhận `matches:[]` — **không xem được qua network** |
| Đã kiểm | Guest (incognito) → khối khoá ✅ · Active → full Top 5 ✅ · hồ sơ chi tiết khoá mục 4-6 ✅ |

### 🟠 B. Thống nhất số liệu + thuật ngữ (đối tác audit)
- Số mô hình **37 → 64** (pricing×5, ai-studio, founder)
- Hoàn tiền **14 → 7 ngày** (mọi trang)
- Số câu Bước 1 **10 → 20 câu · 5–7 phút**
- ChatGPT **~500k → ~6tr ($20×12)**
- Tên Bước 2 chốt **"KHAI PHÁ — Bản đồ Vốn Ngầm"** (5 nơi)
- Câu lưu dữ liệu chuẩn **có "mã hoá"** (3 nơi)
- AI Studio Bước 5 **An Toàn → Cá nhân hoá**

### 🧭 C. Sol Facts — 1 nguồn sự thật
Đưa các con số vào DB `app_config` + endpoint `/api/config/facts` + injector `sol-facts.js`.
→ **Đổi 1 nơi trong CMS, mọi trang tự đồng bộ** (refund_days, so_cau_buoc1, so_mo_hinh, gia_active).

### 🟡 D. P2 (Khai phá) — vá theo review đối tác
- Gỡ rò rỉ hướng đi → chỉ **gợi mở nhóm mờ + khoá Top 5**
- Thêm trục thứ 8 **⭐ Uy tín cá nhân** (radar đủ 8) + legend
- Đổi tên bản đồ **"Nguồn lực & Ràng buộc"**
- Trần thu nhập 200M → **100M / 50tr+**; thêm **"🔒 chỉ mình bạn thấy"** ở mục tiền
- **Slider → chọn-khoảng (pill)** cho vốn/giờ/thu nhập (dễ bấm cho người lớn tuổi)
- Thêm **"~10–15 phút"** + đổi "quan trọng hơn Bước 1" → "quyết định tính khả thi"

### 🗣️ E. Việt hoá Bước 1 (chất riêng)
- **DNA → chất riêng / chất riêng nghề nghiệp** (13 chỗ)
- mentor/coach → **người dẫn dắt / cố vấn** · Entrepreneur → **Doanh Nhân** · People+Expert → **kết nối + chuyên môn**
- Big Five / SDT / Person-Env Fit → **giữ tên + thêm giải nghĩa tiếng Việt**

### 📊 F. EXP-3 — Sắc hoá kết quả match
- **Giãn điểm**: thêm `cosineR` (hình dạng nguồn lực) + luật **không trùng điểm** → hết dồn 97-98%
- **Lý do "biết nói"** riêng từng hướng: khớp/lệch thế mạnh, điểm cần bù / lợi thế, tốc độ ra tiền

### 🔔 G. EXP-4 — Hệ nhắc nhở tự động (mới hoàn toàn)
- Bảng `reminder_scenarios` (7 kịch bản K1–K7) + `reminder_log` (chống trùng)
- Engine `reminders.ts`: chấm điều kiện từng kịch bản từ DB (P1/P2/events/tier/last_seen/expires)
- Scheduler cron 30 phút + khung giờ 8–20h
- Admin API + **tab CMS "🔔 Nhắc nhở"**: bật/tắt, sửa nội dung, **Chạy thử (dry-run)**, **Gửi thật**, **Gửi thử/riêng 1 email**, **Nhật ký gửi**
- Email qua **Brevo SMTP** (tái dùng `notification.ts`) — **đã kiểm chứng gửi vào Inbox** ✅

---

## 3. Quyết định đã chốt trong phiên
1. Tên Bước 2 = **KHAI PHÁ — Bản đồ Vốn Ngầm**
2. P2 free chỉ **gợi mở nhóm mờ**, không lộ Top mô hình
3. Refund = **7 ngày** · Bước 5 = **Cá nhân hoá** (bỏ "An Toàn")
4. 8 trục Vốn Ngầm = thêm **Uy tín cá nhân**
5. Mục 4 → **Nguồn lực & Ràng buộc**
6. Active = xem **toàn bộ 64 hồ sơ** đầy đủ (đúng định vị)
7. Email service = **Brevo** (tái dùng OA sẵn có, sol.vn đã xác thực)

---

## 4. Trạng thái vận hành (anh cần biết)

**CMS (adminhuongdi.sol.vn) — các tab:**
- ⚙️ Cấu hình → đổi số Sol Facts (refund, số câu, số mô hình…)
- 🔔 Nhắc nhở → bật/tắt K1–K7, sửa nội dung, Chạy thử, Gửi thật, Nhật ký

**Email (Brevo):**
- SMTP key đã cắm trong `/var/www/huongdi/backend/.env`
- sol.vn đã xác thực (khỏi làm DNS) → email vào inbox
- Mọi lượt gửi ghi vào **Nhật ký gửi**

**Nhắc nhở — cách dùng an toàn:** Chạy thử (xem trước) → Gửi thử vào email mình (soi mẫu) → Bật kịch bản → cron tự chạy / Gửi thật.

---

## 5. Còn treo / polish (không gấp)
- Tinh chỉnh nội dung 7 kịch bản K1–K7 theo ý anh
- Lớp 3 nhắc qua **Zalo ZNS** (anh đã có OA — làm sau)
- Rà legacy pages cũ còn "37" (activate/dashboard/p1-p2-p3 — đang retire)
- WordPress homepage cũ → noindex khi bỏ hẳn
- git push 2 repo (code + docs)

---

## 6. Tài liệu tạo trong phiên
- `LAUNCH-BLOCKER-CHECKLIST-v2-2026-07-13.md` — 22 mục đối tác, có trạng thái
- `SOL-GLOSSARY-tu-vung-chuan.md` — bảng từ vựng ép dùng
- File này (EOD wrap)

---

*Kết phiên: hệ thống đã đóng các lỗ hổng launch-blocker, EXP-1→4 hoàn tất, email tự động chạy thật. Sẵn sàng vận hành + tinh chỉnh nội dung.*
