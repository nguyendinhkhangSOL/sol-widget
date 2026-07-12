# P1/P2/P3 Rename Strategy — 2-Layer Naming

**Decision date:** Tháng 6/2026
**Decision maker:** Khang Sol + partner feedback
**Status:** Approved — ready for execution

---

## I. Vấn đề

Hiện tại huongdi.sol.vn dùng `/p1.html`, `/p2.html`, `/p3.html` — **tốt cho dev nhưng tệ cho user + SEO**:

- Người đọc sách không nhớ "P1 là gì"
- Google không hiểu nội dung trang qua URL
- Không có brand asset có thể quote ("Làm P2 rồi P3" — vô nghĩa)

---

## II. Quyết định: 2-Layer Architecture

### Layer 1 — Display (Marketing/User-facing)

URL + Heading dùng tiếng Việt thuần.

### Layer 2 — Framework (Internal/Brand mark)

P1/P2/P3 giữ làm "tên phiên bản kỹ thuật" giống SWOT, OKR, GTD.

→ Trên UI thể hiện kiểu: **"Khám phá bản thân (P1)"** — text lớn + subtitle nhỏ.

---

## III. Naming Table — Official

| Framework | Display Name | URL Slug | Tagline ngắn |
|---|---|---|---|
| **P1** | **Khám phá bản thân** | `/kham-pha-ban-than/` | 20 câu trắc nghiệm DNA nghề nghiệp |
| **P2** | **Kiểm kê nguồn lực** | `/kiem-ke-nguon-luc/` | Bản đồ vốn, thời gian, network, năng lượng |
| **P3** | **La bàn hướng đi** | `/la-ban-huong-di/` | Match top 5 trong 37 hướng đi |

### Tiêu đề kép trên page

```
┌──────────────────────────────────┐
│                                  │
│  Khám phá bản thân               │  ← H1 lớn (display)
│  (P1)                            │  ← Subtitle nhỏ (framework)
│                                  │
│  20 câu trắc nghiệm DNA nghề     │  ← Tagline
│  nghiệp tuổi 45+                 │
│                                  │
└──────────────────────────────────┘
```

---

## IV. Long-term Vision — 7-Step Journey (Phase 2)

Khi platform mở rộng, theo hành trình:

| Step | Display Name | URL | Status |
|---|---|---|---|
| **01** | Khám phá bản thân (P1) | `/kham-pha-ban-than/` | ✅ Có sẵn |
| **02** | Kiểm kê nguồn lực (P2) | `/kiem-ke-nguon-luc/` | ✅ Có sẵn |
| **03** | La bàn hướng đi (P3) | `/la-ban-huong-di/` | ✅ Có sẵn |
| **04** | Lộ trình 90 ngày (P4) | `/lo-trinh-90-ngay/` | 🔮 Phase 2 (Q3/2026) |
| **05** | Hành động (P5) | `/hanh-dong/` | 🔮 Phase 2 |
| **06** | AI Coach (P6) | `/ai-coach/` | 🔮 Phase 3 |
| **07** | Cộng đồng (P7) | `/cong-dong/` | 🔮 Phase 3 |

→ Roadmap visible giúp user biết mình đang ở bước nào trong hành trình tổng.

---

## V. Implementation Scope

### Phải đổi (HIGH priority)

1. **Nginx 301 redirects** — `/p1.html` → `/kham-pha-ban-than/` (preserve query strings)
2. **File rename hoặc symlink** trên VPS — `/var/www/huongdi/p1.html` → `/var/www/huongdi/kham-pha-ban-than/index.html`
3. **Heading H1 + meta title + description** trong mỗi page HTML
4. **Header navigation** (huongdi-layout/header.html)
5. **Footer links** (huongdi-layout/footer.html)
6. **CTA reverse trong 7 pillars** (vừa deploy — URL CTA dẫn về /p1.html cần đổi)
7. **Backend API redirect logic** (nếu có hard-coded /p1.html trong response)
8. **Internal links trong các pillar pages** (nếu có)
9. **Sitemap** — auto-update sau khi đổi
10. **GSC** — resubmit + URL Inspection

### Giữ nguyên (LOW priority — không đổi)

- **Database tables** `p1_results`, `p2_results` — internal naming, không user-facing
- **Backend API endpoints** `/api/p1`, `/api/p2`, `/api/p3` (nếu có) — chỉ internal
- **Code variable names** trong frontend/backend code
- **Markdown/internal docs** dùng "P1/P2/P3" để gọn

→ **Nguyên tắc:** Đổi mọi thứ user thấy (URL, heading, label), giữ nguyên mọi thứ dev/system (DB tables, API paths, code).

---

## VI. SEO Impact Analysis

### Trước (URLs vô nghĩa)
- `huongdi.sol.vn/p1.html` → Google không biết bài về gì
- Anchor text "P1" không match keyword Việt nào
- Search "khám phá bản thân" → KHÔNG ranking

### Sau (URLs có ý nghĩa)
- `huongdi.sol.vn/kham-pha-ban-than/` → Google đọc được keyword trong URL
- Anchor text match exact với search intent người Việt
- Bonus: URL có chữ Việt → có thể appear trong featured snippet

### Tránh SEO disaster

✅ **PHẢI có 301 redirect 1-to-1** từ URL cũ → URL mới (giữ link juice từ backlinks cũ)
✅ **Submit changeof address** trong GSC sau rename
✅ **Update sitemap.xml** trỏ về URL mới
✅ **Internal links update đồng loạt** — không để dangling /p1.html link

❌ **KHÔNG xoá URL cũ** ngay — giữ 301 redirect ít nhất 12 tháng

---

## VII. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| **Backlinks bị break** | 301 redirects vĩnh viễn |
| **Bookmark user cũ bị break** | 301 redirects + thông báo trong CTA email |
| **Google reindex chậm** | Force crawl qua GSC URL Inspection ngay sau deploy |
| **Internal links dangling** | Grep + replace toàn bộ codebase trước go-live |
| **CTA emails đã gửi với /p1.html** | 301 redirects xử lý hết — không action thêm |
| **Backend tự generate URL** (vd P3 result link) | Audit code backend tìm hard-coded URL |
| **Social media posts cũ** | Để 301 xử lý — không sửa post cũ |

---

## VIII. Execution Order (zero-downtime)

```
┌───────────────────────────────────────────────────┐
│ ORDER (quan trọng — sai thứ tự sẽ break links)   │
├───────────────────────────────────────────────────┤
│                                                   │
│ STEP 1: Backup mọi thứ trước deploy               │
│   └─ Backup files + nginx config + DB             │
│                                                   │
│ STEP 2: Tạo files mới (chưa rename file cũ)       │
│   ├─ Copy /p1.html → /kham-pha-ban-than/index.html│
│   ├─ Copy /p2.html → /kiem-ke-nguon-luc/index.html│
│   ├─ Copy /p3.html → /la-ban-huong-di/index.html  │
│   └─ Update heading H1 + meta tags trong file mới │
│                                                   │
│ STEP 3: Setup Nginx 301 redirects                 │
│   ├─ /p1.html → /kham-pha-ban-than/               │
│   ├─ /p2.html → /kiem-ke-nguon-luc/               │
│   └─ /p3.html → /la-ban-huong-di/                 │
│   (preserve query strings)                        │
│                                                   │
│ STEP 4: Reload nginx + smoke test                 │
│   ├─ Old URLs 301 → New URLs 200                  │
│   └─ Query strings preserved                      │
│                                                   │
│ STEP 5: Update header.html + footer.html          │
│   └─ Redeploy huongdi-layout to /var/www/huongdi  │
│                                                   │
│ STEP 6: Update CTA trong 7 pillars (sol.vn WP)    │
│   └─ Run script update-pillar-cta-urls.js         │
│                                                   │
│ STEP 7: Update Backend API responses              │
│   └─ Grep /p1.html /p2.html /p3.html trong code   │
│                                                   │
│ STEP 8: Update Direction sol_article_url? NO      │
│   └─ DB chứa URL pillar sol.vn (đúng), NOT touch  │
│                                                   │
│ STEP 9: Resubmit sitemap + GSC                    │
│   ├─ Submit sitemap.xml refresh                   │
│   ├─ URL Inspection cho 3 URLs mới                │
│   └─ Request Indexing                             │
│                                                   │
│ STEP 10: Monitor 7 days                           │
│   ├─ GSC Coverage report                          │
│   ├─ GA4 traffic shift                            │
│   └─ 404 errors                                   │
│                                                   │
└───────────────────────────────────────────────────┘
```

---

## IX. Verification Checklist (sau deploy)

- [ ] `curl -I https://huongdi.sol.vn/p1.html` trả về `301` redirect to `/kham-pha-ban-than/`
- [ ] `curl -I https://huongdi.sol.vn/kham-pha-ban-than/` trả về `200`
- [ ] `https://huongdi.sol.vn/p1.html?token=ABC` redirect giữ nguyên `?token=ABC`
- [ ] Header navigation 3 nút "Khám phá bản thân / Kiểm kê nguồn lực / La bàn hướng đi"
- [ ] H1 mỗi page hiển thị "Khám phá bản thân (P1)"
- [ ] Meta title trong `<head>` đã update
- [ ] CTA cuối 7 pillar pages link đến URL mới
- [ ] Sitemap.xml chứa URL mới
- [ ] GSC URL Inspection cho 3 URL mới → "Submitted and indexed"

---

## X. Communication Plan

### Newsletter announcement (subject: "Sol có tên mới cho 3 bước Hướng Đi")

Brief 200 từ:
- Cảm ơn anh em đã đồng hành
- Giải thích đổi tên = trải nghiệm tốt hơn
- 3 tên mới rõ ràng hơn: Khám phá bản thân, Kiểm kê nguồn lực, La bàn hướng đi
- Link cũ vẫn hoạt động (301)
- Mời feedback

### Facebook Group post (pinned 1 tuần)

```
🌅 Sol vừa đổi tên 3 bước Hướng Đi cho dễ nhớ hơn:

📍 P1 → "Khám phá bản thân" — 20 câu DNA nghề nghiệp
📍 P2 → "Kiểm kê nguồn lực" — Bản đồ vốn/network/sức
📍 P3 → "La bàn hướng đi" — Match top 5 / 37 hướng

Link cũ vẫn tự redirect. Anh em vào link nào cũng OK.

Cảm ơn anh đã đồng hành.
```

---

*Author: Khang Sol*
*Version: 1.0 — Tháng 6/2026*
*Based on partner advice — Brand-as-asset philosophy*
