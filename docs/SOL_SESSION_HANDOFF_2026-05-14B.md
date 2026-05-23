# SOL — Session Handoff 14-05-2026 (Phiên B)

**Phiên trước:** [SOL_SESSION_HANDOFF_14_05_2026.md](./SOL_SESSION_HANDOFF_14_05_2026.md) (Q-Day series 30/30 LIVE + Phase 4 chip seed)
**Phiên B (này):** Built 10/21 bài Pre-Q-Day + extract pipeline + plan đầy đủ
**Phiên kế tiếp:** Publish 10 bài LIVE lên sol.vn + viết tiếp 11 bài còn lại

---

## ✅ Đã làm phiên B (14-05-2026)

### Plan + Tracker docs
- `docs/SOL_PLAN_14_DAYS_REDUCTION.md` (423 lines) — Master plan 7+14 ngày + decisions log
- `docs/SOL_PRODUCTION_TRACKER_21_ARTICLES.md` (313 lines) — Status tracker + outline 11 bài còn lại

### 10 bài HTML full (21.788 từ body + 741 từ chip)

| # | File | Day | SEO target | Words |
|---|---|---|---|---|
| 1 | LAMQUEN-01-tai-sao-bo-thuoc-la.html | L-1 | tại sao nên bỏ thuốc lá (320/m) | 1910 |
| 2 | LAMQUEN-02-nghien-nicotine-la-gi.html | L-2 | nghiện nicotine là gì (180/m) | 2197 |
| 3 | LAMQUEN-03-chi-phi-thuc-su.html | L-3 | chi phí hút thuốc + **JS calculator** (110/m) | 2387 |
| 4 | LAMQUEN-04-bo-thuoc-that-bai-nhieu-lan.html | L-4 | bỏ thuốc thất bại (95/m) | 2460 |
| 5 | LAMQUEN-05-3-phuong-phap-khoa-hoc.html | L-5 | phương pháp cai thuốc nào hiệu quả (**240/m**) | 2385 |
| 6 | GIAMDAN-01-co-hieu-qua-khong.html | T-14 | giảm dần thuốc lá có hiệu quả (210/m) | 1845 |
| 7 | GIAMDAN-02-ban-do-trigger.html | T-13 | trigger thèm thuốc (140/m) | 2253 |
| 8 | GIAMDAN-05-cach-cai-thuoc-dan-dan.html | T-10 | cách cai thuốc dần dần (**480/m**) | 2057 |
| 9 | GIAMDAN-06-tri-hoan-dieu-sang.html | T-9 | trì hoãn điếu sáng (110/m) | 2308 |
| 10 | GIAMDAN-14-dem-truoc-q-day.html | T-1 | bridge → Q-Day series | 1986 |

### Extract pipeline mới
- `scripts/wp-publisher/extract-pre-qday-chips.js` — parser file pattern LAMQUEN-* / GIAMDAN-*
- `scripts/wp-publisher/pre-qday-chips.json` — JSON output (10/10 chips OK, words 62-90 avg 74)

---

## 🚀 Phiên kế tiếp — Đẩy nhanh SEO (theo thứ tự ưu tiên)

### BLOCK 1: Publish 10 bài LIVE lên sol.vn (~3 giờ)

SEO traffic = bài LIVE trên sol.vn, không phải HTML trên disk. Đây là việc ƯU TIÊN nhất.

#### B1.1 — Generate 10 OG images (~30 phút)
```powershell
cd C:\BOTHUOCLA\sol-widget\scripts\wp-publisher
# Tạo og-batch-pre-qday-wave1.txt với 10 entries (xem format từ og-batch-qday.txt)
# Mỗi entry: <output.png>|<title>|<subtitle>|<emoji>|<color-theme>
# Vd:
#   og-lam-quen-1.png|Ngày 1 Làm quen|Tại sao bỏ thuốc lá|🎯|orange
#   og-giam-dan-7.png|T-10 Giảm dần Ngày 5|Cách cai thuốc dần dần|✂|brown
python og-gen.py og-batch-pre-qday-wave1.txt
```

#### B1.2 — Clone publisher script (~30 phút)
```powershell
cd C:\BOTHUOCLA\sol-widget\scripts\wp-publisher
# Copy publish-qday-series.js → publish-pre-qday.js
# Sửa: file pattern LAMQUEN-* | GIAMDAN-*
# Sửa: slug build từ filename (giam-dan-ngay-N-tail vs ngay-N-tail)
# Sửa: category — tạo mới "Bỏ Thuốc Lộ Trình" trên sol.vn (2 sub-cats: Làm Quen + Giảm Dần)
# Test với --dry trước
node publish-pre-qday.js --dry
node publish-pre-qday.js --only=1,2,3   # batch 3 bài đầu
node publish-pre-qday.js                # all 10
```

#### B1.3 — Set SEO meta (~30 phút)
```powershell
# Mỗi bài cần Rank Math meta:
#   - Focus keyword (từ SEO target column)
#   - SEO title (60 chars max)
#   - Meta description (155 chars max)
#   - OG title + image
# Script bulk-fix-seo-auto.js đã có pattern — extend cho pre-qday
node bulk-fix-seo-auto.js --pattern=pre-qday
```

#### B1.4 — Internal linking pass (~30 phút)
Mỗi bài đã có related-links + next/prev nội bộ. Khi LIVE, verify links hoạt động:
```powershell
node audit-internal-links.js --pattern=lam-quen,giam-dan
```

#### B1.5 — Submit sitemap + GSC indexing (~30 phút)
- sitemap.xml WP auto-update (Rank Math)
- GSC → URL Inspection → Request indexing cho 10 URL mới (manual 1-by-1, Google ưu tiên indexing nhanh hơn vs chờ crawl)

### BLOCK 2: Seed Zalo push DB (~30 phút)

```powershell
cd C:\BOTHUOCLA\sol-widget\backend
# Copy pre-qday-chips.json → backend/src/seed/preQdayChips.json
cp ..\scripts\wp-publisher\pre-qday-chips.json src\seed\preQdayChips.json
# Tạo backend/src/seed/preQdayChips.ts (wrapper, giống qdayChips.ts)
# Tạo backend/src/scripts/seedPreQdayChips.ts (runner, giống seedQdayChips.ts)
# Slug DB: 'lam-quen-N' (N=1..7) + 'giam-dan-N' (N=1..14)
# sortOrder: 2000 + N cho lam-quen, 3000 + N cho giam-dan
npm run seed:pre-qday -- --dry  # preview
npm run seed:pre-qday           # LIVE
```

### BLOCK 3: Viết 11 bài còn lại (~3-4 phiên Claude)

Outline đầy đủ trong `SOL_PRODUCTION_TRACKER_21_ARTICLES.md` mục "OUTLINE 17 bài còn lại". Order viết theo SEO + dependency:

**Wave 3a (3 bài, có embed cần extra time):**
- LAMQUEN-06 — Stages of Change (75/m) + JS quiz embed
- LAMQUEN-07 — Cam kết (45/m) + JS form embed
- GIAMDAN-04 — Test Fagerström (50/m) + JS FTND calculator embed

**Wave 3b (4 bài high-mid SEO, no embed):**
- GIAMDAN-13 — Plan B if-then (90/m)
- GIAMDAN-12 — Stimulus control dọn cue (40/m)
- GIAMDAN-09 — Kit thay thế (niche)
- GIAMDAN-07 — Compensatory smoking (niche)

**Wave 3c (4 bài detail, no embed):**
- GIAMDAN-03 — Phân loại điếu (niche)
- GIAMDAN-08 — Mốc 1 tuần giảm (niche)
- GIAMDAN-10 — NRT decision (niche)
- GIAMDAN-11 — Chọn Q-Day (niche)

### BLOCK 4: Phase 5 Zalo Push Scheduler (~4-6 giờ)

Sau khi DB có đủ chip:
1. Schema: add `User.lamQuenStartDate` + `User.taperingStartDate` + table `QdayPushLog`
2. Extend `backend/src/scheduler/worker.ts` thêm slot 08:00 ICT
3. Logic 3-tier: Lam Quen → Tapering → Q-Day theo state user
4. Click tracking qua frontend ping `/api/qday/track`
5. Admin analytics endpoint

Chi tiết trong [SOL_PLAN_14_DAYS_REDUCTION.md §7](./SOL_PLAN_14_DAYS_REDUCTION.md).

---

## 🔑 Context quan trọng

### Quy ước slug + day mapping

```
LAM QUEN (orientation, contemplation stage):
  lam-quen-ngay-1 → ngay-7 (7 ngày)
  Slug DB: 'lam-quen-1' .. 'lam-quen-7'

GIAM DAN (tapering, reduction phase):
  giam-dan-ngay-N where N=1..14
  N=1 = T-14 (xa Q-Day nhất, awareness)
  N=14 = T-1 (đêm cuối, bridge Q-Day)
  Slug DB: 'giam-dan-1' .. 'giam-dan-14'

Q-DAY (already LIVE, post-Q-Day):
  ngay-1-... → ngay-30-... (đã có 30 bài LIVE)
  Slug DB: 'qday-1' .. 'qday-30'
```

### Voice convention
- Khang Sol cá nhân (signed): milestone days (L-1, L-7, T-14, T-7, T-1 + Q-Day 1, 7, 14, 30)
- Sol Đồng hành (neutral): science detail days

### CSS template
Tất cả bài dùng cùng inline `<style>` block — copy từ bất kỳ bài đã viết. Đừng tách CSS riêng (WP nuốt CSS bên ngoài <head>).

### Citations chuẩn lặp lại
Reference master list trong `SOL_PRODUCTION_TRACKER_21_ARTICLES.md` mục cuối — copy paste vào mỗi bài tùy theme.

### NUL byte issue
Write tool đôi khi append NUL bytes vào cuối file Windows. **Sau mỗi Write, chạy:**
```powershell
# In bash sandbox:
tr -d '\000' < $F > $F.tmp && mv $F.tmp $F
```

---

## 📋 Pending tasks toàn cục

| ID | Task | Priority |
|---|---|---|
| #131 | Publish 10 bài Pre-Q-Day LIVE lên sol.vn | 🔴 HIGH (SEO) |
| #132 | Generate 10 OG images batch | 🔴 HIGH |
| #133 | Set Rank Math SEO meta cho 10 bài | 🔴 HIGH |
| #134 | Seed `lam-quen-N` + `giam-dan-N` chip vào DB | 🟡 MED |
| #135 | Viết 11 bài Pre-Q-Day còn lại (Wave 3a-c) | 🟡 MED |
| #136 | Phase 5 — Zalo Push Scheduler | 🟢 LOW (chờ content đủ) |

---

**Lệnh đầu phiên kế tiếp:**

> "Đọc `docs/SOL_SESSION_HANDOFF_2026-05-14B.md` để hiểu context. Bắt đầu BLOCK 1 — publish 10 bài Pre-Q-Day LIVE lên sol.vn (OG images → publisher script → SEO meta → GSC indexing). Đẩy nhanh SEO."
