# EOD WRAP — 2026-08-06 · DC hồi phục → Vá Paywall + La Bàn Sol Cố vấn v2

## 0. Bối cảnh
DC (VN) sập rồi hồi phục trong ngày. Sau khi VPS `sol-vps` (huongdi_prod) sống lại: backup an toàn → vá theo runbook `RUNBOOK-VA-DC.md`.

## 1. ĐÃ SHIP (live)
| # | Việc | Trạng thái | Ghi chú |
|---|---|---|---|
| ✅ | Backup DB kéo về laptop | xong | `full-2026-08-06-1444.sql.gz` (757K) → `C:\BOTHUOCLA\_db-backups\` |
| ✅ | Vá paywall Bước 4+5 (ket-qua) | live | `patch-unlock-preview.py`, HD_BASE=`/var/www/huongdi/public`, backup `_backup-unlock-20260806-145601` |
| ✅ | Vá paywall (thanh-toan) + nhích vị trí | live | `fix-thanhtoan-position.py` → khối nằm sau header, trước form |
| ✅ | Đổi nhãn Bước 4→Kiểm thử · Bước 5→Làm thật | live | verify bản không-cache OK |
| ✅ | **La Bàn Sol Cố vấn v2** | **LIVE** | nạp `LABANSOL-ai_system_prompt-v2.txt` vào `app_config.ai_system_prompt` (zero-deploy, cache 30s tự ăn) |
| ✅ | Backup DB tự động đêm | live | cron `0 2 * * *` → `/home/solop/sol-nightly-backup.sh`, giữ 7 ngày |

## 2. Chốt thiết kế La Bàn Sol (từ bản tư vấn đối tác + 6 nắn)
- **Kiến trúc**: route `sol-dong-hanh.ts` đã có sẵn (multi-model AI, nạp viên nang + chat_summary). System prompt = **CMS `app_config.ai_system_prompt`** (DEFAULT là fallback).
- **Viên nang khách (3.1)**: ĐÃ CÓ — `memory.ts` dựng `summary_text` (0 token) từ p1/p2/hướng/kết quả, lưu `user_business_memory` (có sẵn cột summary_text/summary_tokens/chosen_model_num/profile/decisions/milestones/chat_summary).
- **Prompt v2** thêm phần ruột: An toàn không-chặn (cảnh báo ĐỎ, khách quyết) · Bước 4 kiểm thử · Bước 5 hồ sơ 6 mục · 4 Bẫy · Máy tài chính sinh tồn (runway/hoà vốn/chi phí-cố-định-0) · đầu ra bảng/checklist. Giữ Luật Chỗ Chết + placeholders `{{...}}`.
- **6 nắn** so với bản tư vấn: giọng ấm+dứt khoát (không "mất tiền ngu") · không chặn cứng · giá từ config (không hardcode 99k) · Postgres (không Firebase) · cấm bịa số · viên nang ~200 tok.
- **Nghiệm thu**: test "thuê mặt bằng 12tr mở quán" → AI bung đúng 4 Bẫy + runway + kiểm thử tinh gọn + BẢNG so sánh 2 phương án. ✔

## 3. ĐƯỜNG LÙI (rollback)
- Prompt cũ: `pg_read_file('/home/solop/ai_system_prompt_backup_2026-08-06-1521.txt')` (5005 byte).
- Paywall: backup file trong `/var/www/huongdi/public/_backup-unlock-20260806-145601` + `.bak-fixpos-*`.

## 4. CÒN LẠI — phiên sau (dựng 1 mạch, có thiết kế)
| # | Việc | Vì sao chưa làm |
|---|---|---|
| 3.2 | Schema Thẻ dữ liệu nghề 12 trường + điền mô hình lõi | nền dữ liệu, làm cùng 3.4 |
| 3.3 | Gate "Chọn hướng này" mới mở Bước 4/5 | cần dò luồng savedDirection + trang hub |
| 3.4 | **Bước 4 (Ma trận Kiểm thử) — DỰNG TRANG MỚI** | hiện chỉ có teaser che mờ, chưa có trang tương tác thật → cần thiết kế tử tế, không gấp |
| 3.5 | Bước 5 sinh lazy + cache journey_sections | trang ho-so-doanh-nghiep đã có, thêm sinh-1-lần-lưu-lại |
| — | Nút "Tham vấn La Bàn Sol" theo từng ô (FE) | polish, sau khi có trang Bước 4 |

## 5. File chốt phiên (trong `_content-fix-gia/`)
- `LABANSOL-SYSTEM-PROMPT-v1.md` (thiết kế) · `LABANSOL-ai_system_prompt-v2.txt` (bản đang chạy)
- `RUNBOOK-VA-DC.md` · `patch-unlock-preview.py` · `fix-thanhtoan-position.py` · `sol-nightly-backup.sh`

---

## 6. UPDATE (cùng phiên) — DỰNG ĐƯỜNG RAY LA BÀN SOL
Sau khi paywall + prompt v2 xong, tiếp tục build đường ray Bước 4/5 (anh Khang duyệt thiết kế `THIETKE-duongray-buoc4-5-BUILD.md`):

| # | Việc | Trạng thái |
|---|---|---|
| 3.1 | Viên nang khách (~200 tok) | ✅ đã có sẵn (memory.ts summary_text) |
| 3.2 | Thẻ dữ liệu nghề 12 trường | ✅ bảng `model_data_card` + mẫu vàng MH-104 (LBS-3.2-model_data_card.sql) |
| 3.3 | Gate login+Active | ✅ baked vào trang Bước 4 |
| 3.4 | **Trang Bước 4 Kiểm thử** (form 4 khối + nút Tham vấn) + lưu DB | ✅ LIVE `/la-ban-huong-di/kiem-thu/` · endpoint `GET/POST /api/journey/kiemthu` → cột `user_business_memory.kiemthu` (jsonb). Verify: dữ liệu lưu thật. |
| 3.6 | Áo Sol v2 (đã làm ở §1) | ✅ |
| 3.7 | Cron backup đêm (đã làm ở §1) | ✅ |
| 3.5 | Bước 5 đọc `kiemthu` vào mục "Kết quả kiểm thử" | 🔜 phiên sau (sửa dossier.ts nhỏ) |

**Kỹ thuật:** Bước 5 (`ho-so-doanh-nghiep`) + `/api/dossier` ĐÃ CÓ SẴN (6 khối, gợi ý Sol, lưu, xuất PDF) → 3.5 chỉ là điểm thêm. `decisions` mặc định là mảng nên KHÔNG dùng, thêm cột `kiemthu` riêng. Backend deploy: backup journey.ts → scp → `npm run build` (typecheck sạch) → `pm2 restart huongdi-api`. Rollback: `journey.ts.bak-*`.

## 7. ⚠️ GITHUB — CÓ DRIFT LỚN CHƯA COMMIT
`sol-ecosystem` là 1 repo. Nhiều file đã deploy live nhưng **chưa lên git** (tồn từ phiên trước): `dossier.ts`, `share.ts`, trang `ho-so-doanh-nghiep/`, `sol-ui.js`, nhiều HTML, mu-plugins, seed SQL… + của phiên nay: `journey.ts`, trang `kiem-thu/`. 
→ **Cần đẩy toàn bộ working tree lên GitHub** để git = live (nguồn chân lý). Lệnh trong chat phiên 2026-08-06. Lưu ý: thay đổi DB (bảng `model_data_card`, cột `kiemthu`, prompt v2 trong app_config) là DATA — không nằm git; file SQL/tài liệu lưu ở `_content-fix-gia/`.

---

*Kim chỉ nam giữ nguyên: bán THUÊ BAO La Bàn Sol · Bước 4/5 = đường ray · "Sol chỉ đường — anh chị cầm lái".*
