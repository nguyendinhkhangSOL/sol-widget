# EOD WRAP — 2026-07-24 (phiên chiều)
## Config động · Cắm cờ 64 mô hình · Định vị founder · Deploy thư viện + trang chủ

> Nối tiếp phiên sáng (T8-SITEMAP-HUONGDI-DEPLOY). Phiên này tập trung: mở free full prompt, chuẩn hoá "mọi tham số tuỳ biến trong admin", cắm cờ biên tập 64 mô hình vào DB, và dứt điểm 2 deploy tồn (thư viện + trang chủ).

---

## 1. TÓM TẮT 1 DÒNG
Mở full prompt free (5→20), xác nhận toàn bộ tham số đã nằm trong `app_config` + sửa được trong admin, cắm cờ audit 64 mô hình vào DB (badge màu), và deploy nốt thư viện (banner gọn) + trang chủ (định vị founder rộng hơn). **0 lỗi, đã nghiệm thu live.**

---

## 2. VIỆC ĐÃ XONG

| # | Việc | Kết quả | Cách nghiệm thu |
|---|------|---------|-----------------|
| 1 | Mở full prompt free | `free_prompt_limit` 5→20 (bằng Active) | API `/config/entitlements` trả `freePromptLimit:20` |
| 2 | Dọn tab ⚙️ Cấu hình | Đặt nhãn tiếng Việt cho 5 key AI còn trống | SQL `UPDATE 1` ×5 |
| 3 | 🚩 Cắm cờ 64 mô hình | 64/64 ghi cờ + ghi chú biên tập vào DB | Đếm lại: khớp phân bố xlsx |
| 4 | 📚 Deploy Thư viện | Banner gọn thay 38 thẻ trùng, đếm động | DOM live: `featuredCards:0`, banner "38 hồ sơ", count "64" |
| 5 | 🏠 Deploy Trang chủ | Bỏ "doanh nghiệp CNTT & TMĐT" | web_fetch: khối founder = "…thương mại, sản xuất, xuất nhập khẩu, dự án, công nghệ" |

### Phân bố 64 cờ (khớp file `Bien-tap-64-mo-hinh.xlsx`)
| Cờ | SL | Ý nghĩa |
|----|----|---------|
| 🟩 GIU (GIỮ) | 40 | Rõ, để yên |
| 🟨 LAMRO (LÀM RÕ) | 14 | Sửa one-liner (gồm 2 bài "làm rõ + viết lại") |
| 🟥 GOP (GỘP) | 6 | Trùng mạnh → gộp 1 |
| 🟧 TAICAUTRUC | 2 | Nghề trụ + gói mở rộng |
| 🟨 VIETLAI (VIẾT LẠI) | 1 | One-liner nhạt |
| 🟥 BO (CÂN NHẮC BỎ) | 1 | Ô mẹ "Freelancer" chung chung |

---

## 3. QUYẾT ĐỊNH CHỐT (anh Khang)

1. **Free tuỳ theo thời gian = ĐỔI TAY** (không build scheduler). Chạy campaign thì vào admin gõ số, hết thì gõ về. Đơn giản, không đẻ hệ thống.
2. **Nguyên tắc: mọi tham số nằm backend, tuỳ biến trong admin** — đã đúng sẵn. Kiến trúc `app_config` + config service + tab admin render động đáp ứng 100%. Mai mốt nâng "số bộ" chỉ gõ số mới.
3. **Mở full prompt free** giữ nhất quán: Free xem được 20 prompt nhưng `free_ai_quota=0` nên **bấm chạy AI mới cần nâng cấp** → chốt ở chỗ tốn tài nguyên, không chốt ở việc xem.

---

## 4. KIẾN TRÚC CONFIG ĐỘNG (ghi nhớ)

- **Nguồn sự thật:** bảng `app_config(key, value, label, updated_at)` trên `huongdi_prod`.
- **Đọc:** `src/services/config.ts` — cache 30s, `getEntitlements()` / `getFacts()` / `getAiQuotaForTier()`.
- **Sửa:** admin tab ⚙️ → `PUT /api/admin/config {updates:[{key,value}]}` → `invalidateConfigCache()` → hiệu lực ~tức thì.
- **Admin render động:** hiện MỌI key trong `app_config` (nhãn `label` ưu tiên, fallback `key`). Thêm key mới ở DB là tự hiện.
- **33 key đang có:** prompt limit, AI quota, số mô hình, giá gói/coaching/founder, suất/hoàn tiền, model AI, provider…
- **Chỉ update `value`** qua API (an toàn); đổi `label` phải qua SQL.

---

## 5. FILE / DB ĐỘNG CHẠM

| Chỗ | Thay đổi | Trạng thái |
|-----|----------|-----------|
| DB `app_config` | `free_prompt_limit`=20 | ✅ live (qua API) |
| DB `app_config` | 5 nhãn AI key | ✅ live (SQL) |
| DB `models.audit_flag/audit_note` | 64 dòng cờ + note | ✅ live (PATCH ×64) |
| `huongdi-public/la-ban-huong-di/tat-ca/index.html` | banner gọn (feat-slim) | ✅ deploy VPS `/var/www/huongdi/public/...` |
| `solvn-landing/index.html` (trang chủ) | khối founder dòng 2 | ✅ deploy cPanel `public_html/index.html` |

---

## 6. VIỆC CÒN TREO / NHẮC

- ⚠️ **Purge Cloudflare** cho 2 URL (khách qua CDN thấy bản mới): `https://huongdi.sol.vn/la-ban-huong-di/tat-ca/` và `https://sol.vn/`.
- 🔜 **Thực thi biên tập 64 cờ**: mới CẮM cờ (đánh dấu). Việc SỬA thật (gộp 6 cụm, làm rõ 14 one-liner, tái cấu trúc 2, viết lại 1, xử lý "Freelancer" ô mẹ) — làm đợt sau qua CMS.
- 🔜 Deploy homepage: đã xong; nếu sau này sửa tiếp nhớ up qua cPanel (không phải VPS).

---

## 7. LƯU Ý KỸ THUẬT (đừng quên)

- **adminhuongdi.sol.vn** giữ JWT ở `localStorage.admin_jwt`; gọi admin API phải ở đúng origin đó (CORS chặn fetch chéo sang huongdi.sol.vn).
- Trang thư viện **render bằng JS** → web_fetch chỉ thấy khung "Đang tải…"; nghiệm thu phải mở tab thật đọc DOM.
- Khớp xlsx↔DB: tên DB dài hơn (`<tên> — <đuôi>`), num ≠ STT → match theo phần trước "—" (bỏ dấu). 63/64 auto, "Life Coaching" (num 207) gán tay.
- Verify cache: chỉ dùng URL sạch làm bằng chứng; `?v=` chỉ để soi origin.
