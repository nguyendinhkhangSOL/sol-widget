# Sol Cohesion Plan

**Trả lời câu hỏi của anh:**
> "Sol có các module rời rạc — sách, huongdi, bothuocla, bài viết — nhưng chưa gắn kết.
> Sách landing nên ở subdomain hay subpath?"

---

## 📁 3 files trong bộ này

| File | Câu hỏi trả lời |
|---|---|
| `01-BOOK-LANDING-DECISION.md` | **Nên dùng `/sach/` hay `ebook.sol.vn`?** → **`/sach/`** ✓ |
| `02-COHESION-MAP.md` | **Cách các module kết nối tạo marketing system xuyên suốt** |
| `03-BOOK-LANDING-BRIEF.md` | **Blueprint chi tiết trang sách — 11 sections + copy** |

---

## ⭐ Quyết định #1 — URL sách

**`sol.vn/sach/tai-khoi-nghiep-dung-huong/`**

**KHÔNG dùng:**
- ❌ `ebook.sol.vn` (phân tán SEO authority + thêm subdomain)
- ❌ `sol.vn/store/...` (path tiếng Anh không phù hợp brand)
- ❌ `sol.vn/sach/sach-tai-khoi-nghiep-...` (redundant "sach")

**3 lý do chính:**
1. SEO authority compound vào root sol.vn (đang DA thấp, cần dồn)
2. Internal link Pillar → /sach/ = full link juice (vs cross-subdomain = 50%)
3. Đã có 3 subdomain rồi — đủ phức tạp, đừng thêm

---

## ⭐ Quyết định #2 — Cohesion system

Mỗi module có **vai trò rõ + connection rõ tới các module khác**:

```
ATTRACT          ENGAGE           CONVERT       RETAIN
──────────       ──────────       ──────────    ──────────
SEO Pillars  →   Sol.vn       →   Sách        →  Active
bothuocla    →   /huong-di/   →   /sach/      →  /thanh-vien/
FB Group     →   /ngam/       →   Checkout    →  huongdi FULL
huongdi/demo →   /khang-sol/                  →  Updates V1.5
```

**Cohesion test:** Mỗi page trong ecosystem phải có **at least 1 link** đến page khác trong ecosystem.

---

## ⭐ Quyết định #3 — 5 actions ngay tuần này

| # | Task | Effort |
|---|---|---|
| 1 | Tạo `sol.vn/sach/` placeholder page | 15 phút |
| 2 | Tạo `sol.vn/sach/tai-khoi-nghiep-dung-huong/` placeholder | 30 phút |
| 3 | Add block CTA "Mua sách" vào 7 Pillar (script automate) | 1 giờ |
| 4 | Setup MailerLite + email capture form chương 1 | 1 giờ |
| 5 | Outline 15 chương sách (200-300 từ/chương) | 4 giờ |

→ **Total ~7 giờ cho cả tuần** — manageable cho Khang vừa làm vừa các business khác.

---

## 🗺️ Visualization của hệ sinh thái

```
                          ┌─────────────────────┐
                          │      sol.vn         │
                          │  (Content + Store)  │
                          │                     │
                          │  /huong-di/  📝     │ ← SEO marketing
                          │  /sach/  📘         │ ← Revenue
                          │  /ngam/  🧘         │ ← Brand depth
                          │  /than/  🌿         │ ← Bridge to bothuocla
                          │  /khang-sol/  👤    │ ← Trust
                          │  /thanh-vien/  🔑   │ ← Member area
                          └──────────┬──────────┘
                                     │
                          ┌──────────┼──────────┐
                          ▼          ▼          ▼
                  ┌──────────┐ ┌──────────┐ ┌──────────┐
                  │huongdi   │ │bothuocla │ │Newsletter│
                  │.sol.vn   │ │.sol.vn   │ │ + FB Grp │
                  │          │ │          │ │          │
                  │SaaS Tool │ │Free App  │ │Email pool│
                  │(Active$) │ │(Funnel)  │ │(Nurture) │
                  └──────────┘ └──────────┘ └──────────┘
```

**Mỗi cạnh có 2 chiều flow:**
- Sol.vn → tool/community: "Thử công cụ này"
- Tool/community → Sol.vn: "Đọc bài + Mua sách"

---

## 🎯 What this solves

### Vấn đề trước (lộn xộn):
- ❌ Pillar không link tới sách (vì sách chưa có URL)
- ❌ huongdi tự chạy không bán gì
- ❌ bothuocla không funnel vào Sol
- ❌ User vào 1 chỗ → không biết các chỗ khác

### Sau cohesion plan:
- ✅ Pillar có CTA "Mua sách" → `/sach/`
- ✅ huongdi demo có CTA "Mua sách để full" → `/sach/`
- ✅ bothuocla day-30 → in-app modal → `/sach/`
- ✅ User thấy "Đi Cùng Sol" là 1 hệ sinh thái thống nhất, không phải 4 trang lẻ tẻ

---

## 📊 Expected cohesion KPI 30 days post-implementation

| Metric | Before | After |
|---|---|---|
| Avg pageviews per session | 1.2 | 2.5+ |
| % users visit >1 domain | 5% | 25-30% |
| Pillar → /sach/ click rate | 0% (no link) | 3-5% |
| Newsletter signup from Pillar | 0.5% | 3-5% |
| bothuocla → Sol click | 1% | 8-12% |

---

## 🚦 Status implementation

| Module | Status | Connection needed |
|---|---|---|
| sol.vn/huong-di/ (7 Pillars) | ✅ Live | Add "Mua sách" CTA cuối bài |
| huongdi.sol.vn (Landing) | ✅ Live | Update footer link "Ebook" → /sach/ |
| bothuocla.sol.vn | ✅ Live | Add day-30 in-app modal |
| sol.vn/sach/ | 🔲 **PHẢI TẠO NGAY** (placeholder) | — |
| sol.vn/sach/tai-khoi-nghiep-dung-huong/ | 🔲 **PHẢI TẠO** (full landing T9) | — |
| sol.vn/thanh-vien/ | 🔲 Phase 2 (sau khi có Stripe checkout) | — |
| Newsletter | 🔲 **Phải setup MailerLite** | Lead magnet chương 1 |

---

## 🔗 Đọc tiếp

- **Cần biết WHERE** → `01-BOOK-LANDING-DECISION.md` ✅
- **Cần biết HOW connect** → `02-COHESION-MAP.md` ✅
- **Cần biết WHAT to build** → `03-BOOK-LANDING-BRIEF.md` ✅

Sau 3 file này, anh có:
1. Quyết định URL rõ ràng
2. Cohesion map cho marketing
3. Blueprint cụ thể trang sách

→ **Bắt đầu execute action #1: Tạo `/sach/` placeholder hôm nay.**

---

*Đi Cùng Sol — Đi cùng nhau, đường dài đỡ mỏi.*
*Version 1.0 — Tháng 6/2026*
