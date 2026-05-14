# SOL — Session Handoff 14-05-2026

**Mục đích:** Tóm tắt mọi việc đã làm trong phiên hôm nay để Claude phiên mới có thể tiếp tục mượt mà.

---

## 🏆 Thành quả phiên hôm nay (14-05-2026)

### Q-Day Series — 30/30 bài đã viết chuẩn Sol v4

**28/30 đã LIVE trên sol.vn**, 2 bài cuối (D28, D29) chờ publish 1 lệnh duy nhất:

```powershell
cd C:\BOTHUOCLA\sol-widget\scripts\wp-publisher
node publish-qday-series.js --only=28,29
```

### Files Q-Day local (30 bài HTML)

Path: `C:\BOTHUOCLA\sol-widget\wiki-skeletons\wiki-articles\`

- QDAY-01 → QDAY-30 (file naming `QDAY-NN-<topic>.html`)
- OG images: `og-images/qday-NN.png` (1-30)

### Scripts wp-publisher đã build

Path: `C:\BOTHUOCLA\sol-widget\scripts\wp-publisher\`

| Script | Purpose |
|---|---|
| `_lib.js` | HTTP client + auth |
| `og-gen.py` | Generate OG image 1200x630 |
| `audit-category.js` | Audit category posts |
| `audit-qday-all.js` | Audit Q-Day series toàn site |
| `audit-internal-links.js` | Tìm link gãy |
| `audit-old-pricing.js` | Tìm pricing cũ 99/199 |
| `cleanup-qday-duplicates.js` | Move 6 duplicate → draft + redirect |
| `dump-qday-slugs.js` | Print full slug 30 bài Q-Day |
| `fix-internal-links.js` | Auto-replace /YYYY/MM/DD/ → /slug/ |
| `bulk-fix-seo-auto.js` | Auto-fill Rank Math meta |
| `bulk-create-new-wikis.js` | Tạo bài mới (6 Wave 2 chip wikis) |
| `bulk-publish-chips.js` | Publish 22 chip wikis |
| `publish-qday-series.js` | Publish 30 bài Q-Day ⭐ |
| `publish-week1.js` | Publish 5 bài Tuần 1 Cluster B |
| `verify-live-urls.js` | Check 17 URLs LIVE + redirect |
| `rename-d14-slug.js` | Rename slug D14 |
| `rename-slugs.js` | Generic rename slug script |
| `delete-post.js` | Trash post via REST |
| `mu-plugin/sol-redirects.php` | MU-plugin với 19 redirect 301 |
| `mu-plugin/rank-math-rest.php` | MU-plugin Rank Math REST meta |

### MU-plugin sol-redirects.php — đã LIVE trên VPS

19 redirect 301 đang hoạt động:
- 9 redirect legacy pages (sol-home, 88-ngay, etc.)
- 2 redirect emoji URL-encoded slugs (D4, D14)
- 6 redirect Q-Day duplicates → Day 1-30 series
- 1 redirect D14 rename (slug cũ → mới)
- 1 redirect tam-nhin-sol → sol-gioi-thieu

---

## ⏳ Còn lại — PHASE 4 + 5 (Em sẽ làm phiên mới)

### PHASE 4 — 30 Chip Summary cho Zalo Push (chưa làm)

Mỗi bài Q-Day HTML đã có sẵn `<div class="chip-summary">` 60-80 từ. Phiên mới cần:

1. Build script `extract-chip-summaries.js` — đọc 30 HTML files, extract chip-summary div, output JSON
2. Build script `seed-qday-chips.ts` (backend) — import JSON vào table `canned_replies` với prefix `qday-N`
3. Wire `wikiUrl` đến sol.vn URL chuẩn

**Slug WP đầy đủ 30 bài (từ dump-qday-slugs.js):**

```
D1:  ngay-1-24-gio-dau-tien-bo-thuoc-la                           (#560)
D2:  ngay-2-dinh-con-them-nicotine                                (#562)
D3:  ngay-3-buc-tuong-trieu-chung-cai-dat-dinh-va-bat-dau-giam   (#570)
D4:  ngay-4-mat-ngu-va-roi-loan-giac-ngu-giai-thich-khoa-hoc     (#572)
D5:  ngay-5-them-an-va-noi-so-tang-can-su-that-khoa-hoc          (#574)
D6:  ngay-6-cau-gat-voi-nguoi-than-day-khong-phai-tinh-cach-ban  (#581)
D7:  ngay-7-moc-1-tuan-nhung-gi-da-thay-doi-trong-co-the-ban     (#583)
D8:  ngay-8-suong-mu-nao-va-kho-tap-trung-nao-bo-dang-tai-cau-truc (#585)
D9:  ngay-9-ho-va-dom-phoi-dang-tu-lam-sach                      (#587)
D10: ngay-10-con-them-doi-hinh-dang-tu-sinh-ly-sang-tam-ly       (#589)
D11: ngay-11-vi-giac-va-khuu-giac-tro-lai-ca-phe-ngon-hon-hoa-thom-hon (#592)
D12: ngay-12-dao-dong-nang-luong-luc-khoe-luc-met                (#594)
D13: ngay-13-cam-xuc-that-thuong-khi-nao-can-kham-tam-ly         (#596)
D14: ngay-14-moc-2-tuan-bo-thuoc                                 (#605)
D15: ngay-15-tinh-huong-kho-khan-can-doi-mat-ca-phe-tra-da-via-he-coc-bia-hoi-nhau-bua-an-stress (#607)
D16: ngay-16-nhau-bia-hoi-via-he-khong-hut-thuoc-song-sot-qua-buoi-dau-tien (#610)
D17: ngay-17-nham-chan-ke-thu-it-duoc-nhac-den                   (#614)
D18: ngay-18-stress-cong-viec-dieu-thuoc-gio-nghi-khong-con      (#616)
D19: ngay-19-khi-ban-be-con-hut-giu-ban-giu-cam-ket-nen-ung-xu-the-nao (#609)
D20: ngay-20-giac-mo-hut-thuoc-vi-sao-va-no-co-nguy-hiem-khong   (#629)
D21: ngay-21-moc-3-tuan-bo-thuoc-vong-lap-thoi-quen-da-yeu-di    (#686)
D22: ngay-22-con-them-sau-bua-an-tai-sao-van-dai-dang            (#688)
D23: ngay-23-cuoi-tuan-khi-nghi-thuc-cu-khong-con                (#691)
D24: ngay-24-toi-la-nguoi-khong-hut-chuyen-dich-danh-tinh        (#693)
D25: ngay-25-can-tai-nghien-lapse-neu-ban-hut-1-dieu-dieu-gi-xay-ra (#695)
D26: ngay-26-tien-tiet-kiem-dong-tien-ban-dang-doi-lay-suc-khoe  (#699)
D27: ngay-27-gia-dinh-va-cac-moi-quan-he-dieu-ban-chua-thay      (#701)
D28: ngay-28-tu-hao-va-gia-tri-ban-than-day-khong-phai-phu-phiem (#703)
D29: ngay-29-nhin-ve-phia-truoc-thang-2-va-thang-3-se-nhu-the-nao (#705)
D30: ngay-30-moc-1-thang-sau-bo-thuoc-ban-da-tro-thanh-ai        (#707)
```

### PHASE 5 — Zalo OA Push Scheduler (chưa làm)

Backend cần:
1. Cron job daily 08:00 (giờ VN)
2. Query users có `quitDate` ≥ N ngày
3. Send Zalo message với chip-summary tương ứng Day N
4. Track open/click

Sol đã có Zalo OA Phase 1 backend (Webhook + Crisis Chat Reply). Cần extend:
- Table `qday_push_log` (userId, day, sentAt, openedAt, clickedAt)
- Cron worker mới `backend/src/scheduler/qdayPush.ts`
- Admin UI để xem analytics push

---

## 📋 Pending tasks toàn cục (từ TaskList)

| ID | Task |
|---|---|
| #81 | Verify Zalo OA Phase 1 build — TypeScript compile + Khang test |
| #115 | Build landing /dang-ky/ + /so-sanh-app/ |
| #117 | Sweep pricing cũ 99k/199k toàn site (6 landing pages) |
| #120 | PHASE 3 — Đã xong (30 bài) — đóng task này phiên mới |
| #121 | PHASE 4 — 30 chip summary cho Zalo push |
| #122 | PHASE 5 — Schedule Zalo push 30 ngày |
| #128 | Batch 6 — D28, D29 hoàn thành 30/30 ✅ (vừa xong) |

---

## 🔑 Context quan trọng cho Claude phiên mới

### 1. Sol pricing đã đổi
- **Free → 25k/tuần** (1 mức base) + có gói cao hơn
- 3 lộ trình: Nhẹ 35 ngày / Vừa 52 ngày / Nặng 65 ngày
- KHÔNG còn 99k/199k cũ (cần sweep landing pages)

### 2. Quy tắc Khang voice (anh đã set hôm nay)
- ❌ KHÔNG dùng tên thương hiệu cụ thể (Vinataba OK, không ô long)
- ❌ KHÔNG khai thác hình tượng cá nhân/gia đình (bố Khang 88t, etc.)
- ✅ Được dùng: con, vợ, đồng nghiệp, bạn nhậu (không tuổi cụ thể)
- ✅ Story Khang lần 5 cai 2020: vợ rót trà, quát con 7t, vấp 1998 sinh nhật bạn, suýt vấp 2020 sinh nhật bạn

### 3. Hotline đã sạch
- 🚨 1800-1567 = SAI (là số trẻ em) — đã sweep khỏi 8 file
- ✅ Cấp cứu y tế: 115
- ✅ BV Bạch Mai HN (khoa Tâm thần): 024 3869 3731
- ✅ BV Tâm thần TPHCM: 1900 599 920

### 4. Sol Wiki LIVE state
- ~70 bài Wiki + 30 bài Q-Day = **100+ bài LIVE**
- Sitemap healthy (129 posts + 15 pages + 5 categories)
- 19 redirect 301 LIVE qua MU-plugin
- Rank Math + GA4 + GSC đã setup
- All meta đã đầy đủ (focus keyword, title, desc)

### 5. Khang Sol info
- Tên đầy đủ: Nguyễn Đình Khang
- Tuổi: ~50 (mạng xã hội đã set)
- Lần cai: 5 lần (1995, 2010, 2015, 2018, 2020). Lần 5 thành công, 5 năm sau (2025) vẫn cai
- 30 năm hút Vinataba, 5 năm Tự do
- Dùng Bupropion 12 tuần ở lần thứ 5
- Có vợ + con (7-10 tuổi)
- Founder Sol — sản phẩm xây từ tiền tiết kiệm cai thuốc

---

## 🚀 Lệnh đầu phiên mới

Khi anh mở phiên mới, gửi Claude:

> "Đọc file `C:\BOTHUOCLA\sol-widget\docs\SOL_SESSION_HANDOFF_14_05_2026.md` để hiểu context. Sau đó:
> 1. Chạy `node publish-qday-series.js --only=28,29` để LIVE 2 bài cuối
> 2. Build PHASE 4 — extract 30 chip summary + seed DB
> 3. Build PHASE 5 — Zalo push scheduler"

---

## 📊 Số liệu cuối phiên

**Files đã tạo/sửa hôm nay:**
- 30 bài Q-Day HTML (~50,000+ từ)
- 30 OG images PNG
- 20+ scripts wp-publisher
- 3 doc framework + handoff
- MU-plugin sol-redirects.php với 19 redirects

**LIVE state:**
- 28/30 bài Q-Day LIVE
- 17 redirect 301 hoạt động chuẩn
- 1800-1567 đã sạch toàn site

**Tasks completed: 124+ items**

---

**Kết phiên 14-05-2026 — Sol Q-Day Series chuẩn Sol v4 đã hoàn thành. Bắt đầu phiên mới với PHASE 4 + 5.**
