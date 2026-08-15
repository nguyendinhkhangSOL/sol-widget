# EOD WRAP — 2026-07-25
## Zalo footer · Quiz-lead email · ĐỒNG NHẤT DANH TÍNH (một người, một hồ sơ)

> Phiên dài, xoay quanh việc biến trang kết quả Bước 3 thành cửa thu khách + hợp nhất danh tính người dùng. Nối tiếp EOD 2026-07-24 (config động, cắm cờ 64).

---

## 1. TÓM TẮT 1 DÒNG
Vá link Zalo Group footer WP; dựng thu-lead qua email ở trang kết quả; rồi **nâng cấp thành cơ chế đăng nhập/đăng ký hợp nhất danh tính** — mọi kết quả quiz gắn thẳng vào 1 tài khoản duy nhất, khách vãng lai thấy teaser, đã nghiệm thu end-to-end với 2 tài khoản test.

---

## 2. VIỆC ĐÃ XONG

| Nhóm | Chi tiết | Trạng thái |
|------|----------|-----------|
| 🔗 Zalo footer WP | Link nhóm `zalo.me/g/iutty6omizdrpogdgdop` gắn vào 3 mu-plugin (post/archive/default-template) — trước để `href="#"` | Code xong, **chờ anh up cPanel** |
| 🩺 Rà footer huongdi | Không dính lỗi; 2 file `p1/p2.html` legacy (link `zalo.me/sol` chết) nhưng đã 301 redirect → vô hại | Kết luận: sạch |
| 📩 Quiz-lead email | Bảng `quiz_leads`, `POST /api/leads/quiz`, gửi "bản đồ" cho khách + báo Khang, tab admin "Lead test" | Deploy + nghiệm thu (2 mail về đẹp) |
| 🧬 **Đồng nhất danh tính** | Bảng `user_quiz_result`, popup đăng nhập/đăng ký ngay trang KQ, teaser 3 tầng, ghi đè/khôi phục, cột "Chuyển đổi" admin | **Deploy + nghiệm thu trọn vẹn** |

---

## 3. QUYẾT ĐỊNH CHỐT (anh Khang)

1. **Người dùng phải đồng nhất, duy nhất xuyên suốt hành trình.** Tới đoạn cần email ở trang KQ → hỏi **đăng nhập / đăng ký** (không xin email trơ trọi nữa).
2. **3 tầng xem** (đã nới `free_map_open=1` sẵn nên map mở cho mọi người; teaser làm phía FE):
   - 👤 Khách vãng lai: thấy #1 đầy đủ, #2–#5 khoá lý do + "xem chi tiết" → popup đăng ký.
   - 🆓 Free (đăng ký): full bản đồ + lưu vào tài khoản.
   - ⭐ Active: phần sâu như cũ (giữ nguyên lằn ranh tiền).
3. **Người mới** → tạo tài khoản mặc định **FREE** → ghi kết quả. **Người cũ** → hỏi **Ghi đè / Khôi phục**.
4. **Free tuỳ thời gian = đổi tay** (không scheduler) — chốt từ đầu phiên.

---

## 4. KIẾN TRÚC DANH TÍNH (ghi nhớ — quan trọng)

**Nguồn sự thật = tài khoản `User`** (email @unique, tier FREE/ACTIVE/FOUNDER).

- Kết quả quiz "chính thức" → bảng **`user_quiz_result`** (PK = `user_id`, upsert 1 dòng/người): p1, p2, matches, top_title, match_score.
- `quiz_leads` (nhật ký marketing cũ) đã thêm cột `user_id` để nối/đo chuyển đổi. Từ nay **lead = User thật** (đăng ký), nên theo dõi khách mới ở **tab Người dùng** + email báo, không phải tab Lead test.
- Cơ chế sẵn có `mergeSessionToUser(sessionId→userId)` vẫn dùng cho P1Result/P2Result; FE đăng ký gửi kèm `sessionId`.

**API mới (trong `leads.ts`):**
- `POST /api/me/quiz-result` (auth) — upsert kết quả vào tài khoản + nối quiz_leads theo email.
- `GET /api/me/quiz-result` (auth) — đọc `user_quiz_result` trước, fallback `quiz_leads` theo email.

**Auth tái dùng (không dựng mới):**
- Đăng nhập: `POST /api/auth/login-v2 {identifier, password}`.
- Đăng ký: `POST /api/user/register {displayName, phone, email?, password, sessionId?}` (mặc định FREE, đã tự báo admin).

**FE trang kết quả** (`/la-ban-huong-di/ket-qua/`): biến `IS_GUEST` gate teaser; `savecard` + popup `authModal` (2 tab login/reg); `afterRender()` tự lưu / hỏi xung đột; `resolveConflict('overwrite'|'restore')`; cờ `quiz_synced_sig` chống hỏi lại vô hạn.

---

## 5. FILE / DB ĐÃ CHẠM

| Chỗ | Thay đổi |
|-----|----------|
| DB `quiz_leads` | tạo bảng + cột `user_id` (owner huongdi_user) |
| DB `user_quiz_result` | tạo bảng mới (owner huongdi_user) |
| `huongdi-backend/src/routes/leads.ts` | `/leads/quiz`, `GET/POST /me/quiz-result` |
| `huongdi-backend/src/routes/admin-content.ts` | `GET /quiz-leads` + join tier (cột chuyển đổi) |
| `huongdi-backend/src/services/notification.ts` | `sendQuizMapEmail`, `notifyKhangQuizLead` |
| `huongdi-public/la-ban-huong-di/ket-qua/index.html` | teaser + popup auth + lưu/ghi đè/khôi phục |
| `admin/dist/index.html` | tab 📩 Lead test + cột Chuyển đổi + 5 nhãn AI |
| `solvn-wp/mu-plugins/sol-{post,archive,default}-template.php` | link Zalo Group |
| DB `app_config` | `free_prompt_limit=20` + nhãn 5 key AI |

**Backup phiên:** `/var/backups/sol/20260725-121244` (+ bản 11:05) — đã kéo về `C:\BOTHUOCLA\_backups\`.

---

## 6. NGHIỆM THU (đã test thật)

- Quy trình 1 (FREE cũ `ngayhomnayonline`): đăng nhập → tự lưu `source:account` (Cho thuê tài sản 96%) ✓ · làm quiz khác → hiện **Ghi đè/Khôi phục** ✓ · Khôi phục không đụng dữ liệu ✓.
- Quy trình 2 (mới `donghanhtest@sol.vn`): đăng ký → user id mới, **FREE**, kết quả gắn đúng tài khoản ✓.
- Khách vãng lai: 5 thẻ, 4 dòng khoá, nút đăng ký hiện, popup mặc định tab Đăng ký ✓.

---

## 7. CÒN TREO / NHẮC

- 🌩️ **Purge Cloudflare**: `sol.vn/`, `huongdi.sol.vn/la-ban-huong-di/tat-ca/`, `.../ket-qua/`.
- 🗂️ **Up 3 file footer WP** (link Zalo Group) qua cPanel → `wp-content/mu-plugins/`.
- 🧹 Dọn test: 2 tài khoản `ngayhomnayonline`, `donghanhtest` (anh tự xoá trong admin nếu muốn).
- 🔮 Sau này: thêm `user_id` linking chặt hơn (đổi email vẫn giữ) — cần migration; dọn quiz_leads legacy.

---

## 8. LƯU Ý KỸ THUẬT / RANH GIỚI

- **Bảng tạo bằng `postgres` phải `ALTER OWNER TO huongdi_user`** — nếu không app báo `permission denied` (đã dính 1 lần, đã fix).
- `RETURNING id` trên bigserial trả **BigInt** → phải `Number(id)` trước khi `res.json` (tránh lỗi serialize).
- Dán lệnh nhiều dòng vào VPS hay bị rối → **gộp 1 dòng nối `&&`**.
- **Ranh giới trợ lý:** em KHÔNG đăng nhập bằng mật khẩu, KHÔNG tạo tài khoản, KHÔNG xoá dữ liệu vĩnh viễn — các bước này anh tự bấm; em lo phần còn lại + kiểm chứng. (Đã áp dụng khi test.)
- Verify cache: chỉ dùng URL sạch làm bằng chứng; `?v=` chỉ soi origin. Trang KQ render bằng JS → nghiệm thu bằng cách mở tab đọc DOM/API.
