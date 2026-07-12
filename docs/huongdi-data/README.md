# Huongdi Data — Direction Update Package

3 files để hoàn thiện flow user xem Direction → đọc article SEO → engage Sol ecosystem.

## Files

| File | Mục đích |
|---|---|
| `01-update-solArticleUrl.sql` | Bulk update DB: 37 Directions → 7 Pillar URLs |
| `02-frontend-p3-audit-and-fix.md` | Audit + add UI button "Đọc bài chi tiết" |
| `03-ebook-strategy.md` | Plan 7 ebooks (Phase 2 — sau 1000 pageview) |

## Quick deploy — Phase 1 (Hôm nay)

### Bước 1: Upload SQL lên VPS

```bash
# Trên máy local (cùng folder docs/huongdi-data/)
scp 01-update-solArticleUrl.sql solop@103.72.57.11:/tmp/

# HOẶC trên VPS — copy paste SQL content
nano /tmp/update-solArticleUrl.sql
# (paste content rồi Ctrl+O, Enter, Ctrl+X)
```

### Bước 2: Chạy SQL

```bash
sudo -u postgres psql huongdi_prod < /tmp/update-solArticleUrl.sql
```

→ Output sẽ in 3 bảng: TRƯỚC + SAU + SAMPLE.

### Bước 3: Verify trên admin UI

```
Vào: https://adminhuongdi.sol.vn/directions
→ Mở 1 direction bất kỳ
→ Kiểm tra field "Sol Article URL" đã được điền tự động
→ Click Update để confirm không còn bug 500
```

### Bước 4: Frontend audit

Theo guide `02-frontend-p3-audit-and-fix.md` — section I và II.

## Phase 2 — Sau khi có 1000+ pageview/tháng

Theo `03-ebook-strategy.md` — lần lượt làm 7 ebooks trong 6 tháng.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  USER FLOW (Phase 1)                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  huongdi.sol.vn         sol.vn/huong-di/         FB     │
│  ─────────────          ───────────────         Group   │
│  P1 (DNA)               Pillar Page              │      │
│   ↓                      (4000 từ)               │      │
│  P2 (Resources)            ↑                     │      │
│   ↓                        │                     │      │
│  P3 (Match) ─────────────► │                     │      │
│   │  solArticleUrl         │                     │      │
│   │                        ↓                     │      │
│   │                  Read 5-10 phút              │      │
│   │                        ↓                     │      │
│   │                   CTA footer ────────────────┤      │
│   │                                              │      │
│   └──────────────────────────────────────────────┘      │
│                                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  USER FLOW (Phase 2 + Ebook)            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  P3 Result Card                                          │
│   ↓                                                      │
│   ├─ 📖 Đọc bài → Pillar Page                           │
│   ↓                                                      │
│   └─ 📥 Tải ebook → Landing /ebook/[slug]               │
│        ↓                                                 │
│      Email capture → MailerLite                          │
│        ↓                                                 │
│      7-email nurture sequence                            │
│        ↓                                                 │
│      Day 10: Mời FB Group                                │
│      Day 14: Soft pitch coaching                         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Verification SQL queries

```sql
-- Đếm direction theo category
SELECT category, COUNT(*), COUNT("solArticleUrl") AS has_url
FROM "Direction"
GROUP BY category;

-- Xem sample 5 direction mỗi category
SELECT name, category, "solArticleUrl"
FROM "Direction"
WHERE "solArticleUrl" <> ''
ORDER BY category, "sortOrder"
LIMIT 35;

-- Direction chưa có URL (cần manual map)
SELECT id, name, category
FROM "Direction"
WHERE "solArticleUrl" IS NULL OR "solArticleUrl" = '';
```

## Rollback (nếu cần)

```sql
-- Khôi phục tất cả về empty
UPDATE "Direction" SET "solArticleUrl" = '';
```

---

*Author: Khang Sol*
*Version: 1.0 — Tháng 6/2026*
