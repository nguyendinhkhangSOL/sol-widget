# EOD WRAP — 2026-07-24 (00:21 +07)

**Phiên:** Tập 8 (đăng + nhúng) → Sitemap Cloudflare → Deploy 2 trang huongdi (pricing + lam-viec-cung-khang)
**Người làm:** AI assistant + anh Khang (founder)
**Trạng thái tổng:** 3 khối xong, 1 khối ĐANG CHỜ anh chạy (deploy pricing mới + purge).

---

## 1. XONG TRONG PHIÊN

### 1.1 Podcast Tập 8 "Tìm khách hàng đầu tiên"
- Audio NotebookLM: `C:\BOTHUOCLA\sol-ecosystem\videos\tap-moi\Sol-Tap8-audio.m4a` (16:42).
- Video dài + 3 reel (template "Đi Cùng Sol", navy #0F172A + amber #F59E0B): đã render, frame đầu = card branded.
- Đã đăng: 3 reel lên **TikTok** + **FB Reel (Fanpage "Đi Cùng Sol")**. Video dài anh tự đăng YouTube (`youtu.be/Yd9PRn8t3rU`).
- Đã nhúng video dài vào **bài trụ WP post 3752** (slug `cach-tim-khach-hang-dau-tien-khi-moi-ra-lam-rieng`) qua wp:embed + savePost.

### 1.2 Sitemap — con bọ CLOUDFLARE CACHE (đã trị)
- **Nguyên nhân gốc:** sitemap không cập nhật KHÔNG phải do LiteSpeed / Rank Math / plugin — mà do **Cloudflare cache biên** (`server: cloudflare`). Request cookieless (Googlebot) ăn bản cache cũ; request đăng nhập được `cf-cache-status: DYNAMIC` → origin tươi.
- Rank Math sitemap tự cập nhật khi publish bài THẬT (editor savePost), KHÔNG cập nhật qua wp.apiFetch REST.
- **Đã sửa:** Purge Everything + tạo **Cloudflare Cache Rule "Bypass cache for sitemaps"** = ACTIVE. Điều kiện `(http.request.full_uri wildcard r"*sitemap*.xml*")` → action Bypass cache. Từ nay sitemap không bao giờ kẹt cache nữa.
- Đã Request Indexing bài trụ 3752 trên GSC.

### 1.3 Deploy 2 trang huongdi (pricing + lam-viec-cung-khang) — FILE SERVER ĐÃ MỚI
- Kiến trúc: `huongdi.sol.vn` = HTML tĩnh trong `huongdi-public/` trên VPS (KHÔNG phải WordPress). `sol.vn` mới là WordPress.
- Deploy đường tắt (vì AI không có SSH/GitHub từ sandbox — 403): **scp file → /tmp → sudo cp vào `/var/www/huongdi/public/`**. Chỉ đụng 2 file, không `--delete`.
- **Đã xác minh bằng SSH đọc file trực tiếp trên server (ground truth):**
  - `lam-viec-cung-khang/index.html` = 18281 bytes, timestamp **2026-07-23 23:46**, tiêu đề "Ngồi với tôi một buổi", grep "Còn 10 suất" = **0** (chuỗi cũ đã biến mất).
  - `pricing/index.html` = 29991 bytes (bản trung gian, CÒN Founder — sẽ đè bằng bản mới ở mục 3).

---

## 2. BÀI HỌC QUAN TRỌNG (đừng lặp lại)

> **Kiểm chứng "đã lên live" phải dùng URL THƯỜNG (không đuôi), không được dùng cache-buster.**
> Sai lầm trong phiên: dùng `?v=27431` để fetch → nó chui thẳng vào ORIGIN, bỏ qua Cloudflare → tưởng trang đã đổi, trong khi URL thường (khách thấy) vẫn là bản CŨ vì chưa purge.
> **Quy tắc chứng minh:** chỉ trích từ HTML tải về từ URL live (không đuôi); chứng minh bằng **chuỗi CŨ đã BIẾN MẤT** (vd "Gói 3 phiên", "42.000đ/tháng"). Không lấy từ file spec / file local / trí nhớ.
> **Ground truth tối thượng:** SSH đọc thẳng file trên server (`head` + `ls -l --time-style=full-iso` + `grep -c` chuỗi cũ).

> **Con bọ cache biên là chuỗi lặp:** deploy tới origin ≠ khách thấy. Sau MỌI deploy trang HTML huongdi → **BẮT BUỘC purge Cloudflare URL đó** (rule bypass sitemap KHÔNG cover trang HTML).

---

## 3. ĐANG CHỜ ANH CHẠY (chưa xong)

### A. Deploy bản pricing MỚI (đã viết lại xong ở local, chưa lên server)
Bản mới đã: bỏ giá cứng 690K ở title/meta (giá còn lại lấy từ config `data-fact`); **bỏ hẳn gói Founder** (thẻ + cột bảng + 2 FAQ + link `tier=founder`); free-tier khớp trang chủ (Bước 1-2-3 miễn phí hoàn toàn); **bỏ mọi câu "Sol không có coach 1-1"** → trỏ sang trang Hỏi Người Đi Trước (1-1 bổ trợ).

```
# Laptop, tại C:\BOTHUOCLA\sol-ecosystem\huongdi-public
scp pricing/index.html sol-vps:/tmp/pricing-new2.html
ssh sol-vps
sudo cp /var/www/huongdi/public/pricing/index.html ~/pricing-trunggian-$(date +%H%M).html
sudo cp /tmp/pricing-new2.html /var/www/huongdi/public/pricing/index.html && sudo chown www-data:www-data /var/www/huongdi/public/pricing/index.html && ls -l --time-style=full-iso /var/www/huongdi/public/pricing/index.html
exit
```

### B. PURGE Cloudflare (chỗ khách nhìn thấy)
Dashboard sol.vn → Caching → Configuration → Purge Cache → Custom Purge → dán:
```
https://huongdi.sol.vn/pricing/
https://huongdi.sol.vn/lam-viec-cung-khang/
```

### C. Sau A+B: AI fetch URL THƯỜNG, chứng minh chuỗi cũ ("Gói 3 phiên", "42.000đ/tháng", "1.999k") đã biến mất.

---

## 4. BACKUP / ĐƯỜNG LÙI đã tạo
- `C:\BOTHUOCLA\_backups\backup-2trang-2026-07-23-2343.tgz` — bản 2 trang trước khi đè lần 1.
- Trên VPS `~solop/`: `backup-2trang-*.tgz`, sẽ có thêm `pricing-trunggian-*.html` khi chạy mục 3A.
- Giải nén đè lại `/var/www/huongdi/public/` là rollback.

## 5. VIỆC NHỎ TỒN
- Anh tự xoá 3 reel Tập 8 đăng nhầm vào Tin/trang cá nhân (Tin tự hết sau 24h — có thể đã sạch).
- Sau khi pricing mới lên: rà lại đối chiếu tổng thể pricing ↔ trang chủ ↔ trang coaching cho khớp 100%.

---

## 6. HẰNG SỐ / THÔNG TIN HẠ TẦNG (để tra nhanh)
- VPS huongdi: user `solop`, host alias `sol-vps` (IP 103.72.57.11), web root `/var/www/huongdi/public/`.
- Máy laptop KHÔNG có `rsync` → dùng `scp` + `ssh`. GitHub bị chặn từ sandbox AI (403) → AI không tự push/deploy được, phải đưa lệnh anh chạy.
- Giá config: `gia_active_nam = 690000` (app_config, seed 23-price-active-690.sql). `sol-facts.js` bơm `data-fact` từ `/api/config/facts`.
- Zalo official: 3547084958635197535 · Email official: donghanh@sol.vn.
