# Sol V4.1 Session Backup — 2026-07-02

**Session type:** Major sprint (~15+ giờ)
**Result:** Sol V4.1 ecosystem LIVE 100% với Vinet backend

## 🎯 Kết quả cuối

Sol.vn hệ sinh thái đã online với đầy đủ tính năng payment + backend Vinet chuyên nghiệp.

**Live URLs (đã deploy production):**
- https://huongdi.sol.vn/ — Homepage V4.1
- https://huongdi.sol.vn/kham-pha-ban-than/ — Bước 1 (Free)
- https://huongdi.sol.vn/kiem-ke-nguon-luc/ — Bước 2 (Free)
- https://huongdi.sol.vn/la-ban-huong-di/ — Bước 3 (5 free / 32 lock)
- https://huongdi.sol.vn/prompts/ — 40 câu hỏi AI (paywall)
- https://huongdi.sol.vn/pricing/ — Bảng giá 3 tier
- https://huongdi.sol.vn/founder/ — Founder scarcity
- https://huongdi.sol.vn/thanh-toan/ — Payment flow VietQR
- https://huongdi.sol.vn/lien-he/ — 3 channels contact

---

## 📦 Danh mục file backup (18 files)

### 1. Prompt Library V2 (40 mẫu)
- `prompt-database/prompts-builder.html` (~218KB)
  - 40 câu hỏi AI đầy đủ 5 Bước Sol La Bàn
  - Tab UI + Search + Filter
  - Paywall 5 free / 35 lock
  - Magic link activation flow
  - Status bar + logout button

### 2. V4.1 Combo Pages
- `v4.1-combo/pricing.html` — Bảng giá 3 tier + Vinet bank
- `v4.1-combo/founder.html` — Scarcity landing 100 slot + Vinet bank
- `v4.1-combo/huongdi-homepage.html` — Homepage V4.1 (40/37/5 stats)
- `v4.1-combo/payment-flow/thanh-toan.html` — Payment flow VietQR 3 states với Vinet
- `v4.1-combo/contact/lien-he.html` — Contact page với Vinet legal footer
- `v4.1-combo/contact/FOOTER-PATCH.md` — Guide patch sol-ui.js

### 3. Bước 1/2/3 restyled (V4.1 palette + gating)
- `v4.1-combo/buoc-restyled/buoc-1.html` — Thấu Hiểu (restyled amber)
- `v4.1-combo/buoc-restyled/buoc-2.html` — Khai Phá (restyled amber)
- `v4.1-combo/buoc-restyled/buoc-3.html` — Chọn Hướng (restyled + gating 5/32)
- `v4.1-combo/buoc-restyled/gating-patch.js` — Free tier gating override

### 4. Shared libraries (V4.1 update)
- `v4.1-combo/sol-flow-fix/sol-flow.js` — Breadcrumb navy/amber (bỏ green)
- `v4.1-combo/sol-auth/sol-auth.js` — Tier gating library global

### 5. SEO Content
- `seo-articles/01-ai-prompt-cho-chuyen-gia-40-60.html` — Bài SEO 2200 từ
- `seo-articles/01-featured-*.svg` — 3 phương án featured image

---

## 🏢 Vinet Backend Info (đã hardcode vào file)

**Bank:**
- Ngân hàng: Techcombank
- Số TK: `11522026076011`
- Chủ TK: `CÔNG TY CỔ PHẦN VINET`

**Legal:**
- Tên đầy đủ: CÔNG TY CỔ PHẦN VINET
- MST: `0104127836`
- VAT: 5% dịch vụ phần mềm (miễn TNDN <2 tỷ doanh thu)
- Positioning: "Vận hành và thương mại độc quyền giải pháp Sol"

**Contact:**
- Hotline: 024.3993.1800 (T2-T6, 9h-18h)
- Zalo Khang: 0912727381 (24/7 personal, hiển thị dưới dạng "Chat Zalo")
- Email: hello@sol.vn

---

## 🎫 Magic Link Format

**Sol Active kích hoạt:**
```
https://huongdi.sol.vn/prompts/?activate=SOL-ACTIVE-XXXXXXXX
```

**Sol Founder kích hoạt:**
```
https://huongdi.sol.vn/prompts/?activate=SOL-FOUNDER-XXXXXXXX
```

**Đăng xuất:**
```
https://huongdi.sol.vn/prompts/?deactivate=1
```

---

## 💰 Payment Flow Memo Format

- Sol Active: `SOL-ACT-{SDT}` — ví dụ `SOL-ACT-0912345678`
- Sol Founder: `SOL-FDR-{SDT}` — ví dụ `SOL-FDR-0912345678`

Khi khách chuyển khoản với đúng memo, admin (Khang) parse:
1. Nhận notification email/SMS Techcombank
2. Parse tier + SDT từ memo
3. Generate magic link random code
4. Gửi qua Zalo + Email
5. User click → auto unlock

Time cost: 2-3 phút/khách. Scale được 100-200 khách/tháng.

---

## 🎨 V4.1 Design System

**Palette:**
- Primary: Amber `#F59E0B` (từ green `#1a6b4a` cũ)
- Dark: Navy `#0F172A`
- Text: Navy 700 `#334155`
- Success: Emerald `#10B981`
- Founder: Purple `#8B5CF6`

**Typography:**
- Body: Inter (400-800)
- Headings: Lora serif (600-800)

**Positioning:**
- Cũ: "Đàn ông Việt 40-65"
- Mới: "Người Việt 40-60"

**Framework rename:**
- Cũ: P1 Discover / P2 Resources / P3 Navigator
- Mới: THẤU HIỂU / KHAI PHÁ / CHỌN HƯỚNG / HÀNH ĐỘNG / AN TOÀN BỀN VỮNG

---

## 🚀 Deploy Commands cheatsheet

**Upload file:**
```powershell
scp <local-path> sol-vps:/tmp/
```

**Deploy trên VPS:**
```bash
sudo mv /tmp/<file> /var/www/huongdi/public/<path>
sudo chown www-data:www-data /var/www/huongdi/public/<path>
```

**Reload Nginx (nếu cần):**
```bash
sudo nginx -t && sudo systemctl reload nginx
```

**Check status:**
```bash
sudo grep -c "<keyword>" /var/www/huongdi/public/<file>
```

---

## 📋 Tier Gating Rules

| Trang | Free | Active | Founder |
|---|---|---|---|
| `/` Homepage | ✓ Marketing | ✓ + status bar | ✓ + status bar |
| `/kham-pha-ban-than/` Bước 1 | ✓ Full 20 câu | ✓ Full | ✓ Full |
| `/kiem-ke-nguon-luc/` Bước 2 | ✓ Full 8 trục | ✓ Full | ✓ Full |
| `/la-ban-huong-di/` Bước 3 | 🔓 Top 5 match | ✓ Full 37 | ✓ Full 37 |
| `/prompts/` | 5 free | 40 full | 40 full |
| `/pricing/`, `/founder/` | Public | Public | Public |

---

## 🎯 Kế hoạch tuần tới

1. **Test payment thật** — chuyển 1.000đ với memo test
2. **Waitlist Founder** — collect email trước launch
3. **LinkedIn Khang** — 3 bài countdown Founder (D-14, D-7, D-3)
4. **FB Group announce** — Founder Edition mở đăng ký
5. **VINET V1 Blueprint** — 10 trang HTML5 + Bootstrap 5

### VINET Strategy đã lock:
- Tái định vị: AI + Chuyển đổi số + Business Growth + Sol Services
- Timeline: 25 năm Khang cá nhân + 17 năm VINET (2008-2026)
- Case study cũ (GoCom/Midimori/Portal) reframe thành "Track Record + Learning"
- Trung thực: badge "Đã chuyển giao / Kết thúc" cho legacy
- Sol Services = 1 trang giới thiệu + link sang sol.vn

---

## 🛡️ VPS Backup History

Trên VPS `/var/www/huongdi/public/` có các file `.bak-*`:
- `sol-ui.js.bak-*` (từ multiple sessions)
- `sol-flow.js.bak-*` (session này)
- `kham-pha-ban-than/index.html.bak-*`
- `kiem-ke-nguon-luc/index.html.bak-*`
- `la-ban-huong-di/index.html.bak-*`
- `prompts/index.html.bak-*`
- `pricing/index.html.bak-*` (nếu deploy nhiều lần)

**Rollback nếu cần:**
```bash
sudo ls /var/www/huongdi/public/<path>/index.html.bak-*
sudo cp <backup> <original>
```

---

## 🎊 Achievement summary session hôm nay

**Tasks completed:** 30+ tasks (từ #90 đến #107)

**Milestone lớn:**
1. ✅ Prompt Library V1 → V2 (10 → 40 câu hỏi)
2. ✅ Homepage V4.1 với positioning mới
3. ✅ Pricing 3-tier + Payment VietQR
4. ✅ Founder scarcity page
5. ✅ Tier gating system (sol-auth.js)
6. ✅ Bước 3 gating 5 free / 32 lock
7. ✅ Contact system 3 channels
8. ✅ Bước 1/2/3 restyled V4.1 palette
9. ✅ sol-flow.js breadcrumb navy/amber
10. ✅ Vinet backend integration (bank + legal)
11. ✅ Footer strip Vinet copyright toàn ecosystem

**Chiến lược lớn đã lock:**
- Solo-friendly business model (no 1-1 coach)
- Vinet vận hành + thương mại độc quyền Sol
- VINET tái định vị 2026 (AI + CTS + Growth)
- Founder Edition 100 slot lifetime 1.999k
- Sol Active 499k/năm

---

**Backup created:** 2026-07-02
**Location:** `C:\BOTHUOCLA\sol-widget\docs\sol-mvp-v3\SESSION-BACKUP-2026-07-02\`
