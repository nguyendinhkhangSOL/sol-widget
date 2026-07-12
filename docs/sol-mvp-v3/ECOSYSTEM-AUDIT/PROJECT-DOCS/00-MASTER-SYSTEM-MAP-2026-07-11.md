# 🗺️ MASTER SYSTEM MAP — huongdi.sol.vn (Sol La Bàn)
## Bản đồ kiểm soát chủ: Kiến trúc · Sitemap · API · DB · Luồng business · Yêu cầu · Canonical/Deprecated
**Ngày:** 2026-07-11 · **Vai trò:** ĐỌC TRƯỚC MỌI PHIÊN. Cập nhật sau MỌI thay đổi cấu trúc.
**Lý do lập:** tránh vá lẻ mất kiểm soát tài nguyên/yêu cầu. Đây là "một sự thật" của hệ thống.

> ⚠️ QUY TẮC SỐ 0: Trước khi thêm/sửa trang, API, bảng, hay luồng → **đọc file này + kiểm tra đã có cái tương tự chưa**. Không tạo trùng. Sau khi đổi → cập nhật file này + các hồ sơ liên quan.

---

## 1. KIẾN TRÚC TỔNG THỂ

| Tuyến | Domain | Vai trò | Stack | Docroot |
|-------|--------|---------|-------|---------|
| Marketing/SEO | `sol.vn` | 7 pillar SEO, whitepaper, brand | WordPress | (cPanel) |
| **Product/App** | `huongdi.sol.vn` | 5 Bước + Bản đồ + Chi tiết + Sổ Hành Trình + Payment | HTML tĩnh + Node/Express/TS + Postgres 16 | `/var/www/huongdi/public` + backend `/var/www/huongdi/backend` (port 4001, pm2) |
| **Admin/CMS** | `adminhuongdi.sol.vn` | Biên tập nội dung + quản trị user/lead | HTML tĩnh + chung backend | `/var/www/huongdi/admin/dist` |

- DB: `huongdi_prod` (owner `huongdi_user`, superuser `postgres`). **Tạo bằng `prisma db push` — KHÔNG dùng migrate history. CẤM chạy `prisma db push` lại** (19 bảng partner + generated column không trong schema.prisma → sẽ đòi xoá). Sửa schema = psql/migration file.
- Deploy: SSH `sol-vps` (103.72.57.11), user `solop`. Backend build tại VPS (`tsc`); FE scp thẳng.
- GitHub SSOT: `nguyendinhkhangSOL/sol-ecosystem`.

---

## 2. SITEMAP — 40 trang (phân loại + trạng thái)

### 2.1. Luồng công khai (marketing → sản phẩm)
| Trang | Vai trò | API dùng |
|-------|---------|----------|
| `/` (index.html) | Landing sản phẩm | — |
| `/kham-pha-ban-than/` | **Bước 1** — quiz P1 (14 câu) | /api/p1 |
| `/kiem-ke-nguon-luc/` | **Bước 2** — quiz P2 (7 câu) → nút sang Bản đồ | /api/p2 |
| `/la-ban-huong-di/ket-qua/` | 🗺️ **BẢN ĐỒ HƯỚNG ĐI** (CANONICAL) — Top match | **match-v3** |
| `/la-ban-huong-di/chi-tiet/?slug=` | Chi tiết 1 hướng (11 mục, gate Free/Active) + nút "Bắt đầu hành trình" | /directions/:slug/sections |
| `/la-ban-huong-di/tat-ca/` | Duyệt toàn bộ 64 hướng | /directions/catalog-v2 |
| `/pricing/` | 3 gói (Free/Active 499k/Founder 1.999k) | — |
| `/thanh-toan/` | Form mua → VietQR + Zalo (thủ công) | /api/leads |
| `/founder/` | Landing gói Founder | — |
| `/lien-he/` | Liên hệ | — |
| `/ai-studio/`, `/tao-prompts-ca-nhan/`, `/prompts/`, `/prompts-studio/` | AI Studio + Prompt tools | — |

### 2.2. Khu vực user `/toi/*` (đăng nhập)
| Trang | Vai trò | API |
|-------|---------|-----|
| `/toi/` | Dashboard user (tiến độ 5 Bước, tier) | /user/dashboard, /user/me |
| `/toi/so-hanh-trinh/` | 📓 **SỔ HÀNH TRÌNH v2** (CANONICAL) — checklist + **11 mục bản thể sửa được** + nhật ký | /journeys/* + /journey/* |
| `/toi/sol-dong-hanh/` | Sol Đồng Hành AI | /sol-dong-hanh |
| `/toi/ban-do/` | ⚠️ DEPRECATED (match-v2) → **redirect** `/la-ban-huong-di/ket-qua/` |

### 2.3. Auth
`/dang-nhap/` · `/dang-ky/` (+`/step-2/`) · `/quen-mat-khau/` · `/dat-lai-mat-khau/` · `/dang-xuat/` · `/kich-hoat/` (magic link) · `/activate.html`

### 2.4. ⚠️ LEGACY / TRÙNG — cần dọn (KHÔNG dùng, KHÔNG phát triển)
| Trang | Vấn đề | Xử lý |
|-------|--------|-------|
| `/la-ban-huong-di/` (hub) | DB hardcode 37 direction (slug khác backend), match client-side cũ | Đã tự redirect `/ket-qua/` nếu đã quiz. Nên retire |
| `/p1.html /p2.html /p3.html /p3-*.html` | Bản quiz/direction CŨ (trước /kham-pha, /kiem-ke, /la-ban) | Legacy — rà xoá |
| `/dashboard.html` | Dashboard cũ (mới = `/toi/`) | Legacy |
| `/login.html` | Login cũ (mới = `/dang-nhap/`) | Legacy |
| `/so-hanh-trinh/` (root) | Bản Sổ tạo nhầm phiên này (đã thay bằng `/toi/so-hanh-trinh/`) | XOÁ |
| `/tai-khoan/` | Trùng vai `/toi/`? | Rà |

---

## 3. API MAP — 17 mount (đánh dấu canonical/deprecated)

| Base | Router | Endpoint chính | Ghi chú |
|------|--------|----------------|---------|
| `/api/auth` | auth + passwordReset | login-v2, register, admin/login, forgot/reset | |
| `/api/auth/google` | google-auth | callback, complete-signup | cột google_id đã thêm 07-11 |
| `/api/user` | userAuth + dashboard | me, dashboard, register, link-session | |
| `/api/p1` `/api/p2` | p1, p2 | result, result/latest | quiz |
| `/api/directions` | matchV2 · **matchV3** · sections · directions | match-v2 ⚠️DEPRECATED · **match-v3 CANONICAL** · :slug/sections · catalog-v2 · :slug | |
| `/api/journey` (số ít) | journey (CŨ) | state, day, days, roadmap-template | Nhật ký JourneyDay — DÙNG cho nhật ký trong Sổ v2 |
| `/api/journeys` (số nhiều) | journeys (MỚI) | from-template, current, actions/:id, **sections/:no (+/original,/restore)** | **Sổ v2 bản thể** |
| `/api/sol-dong-hanh` | solDongHanh | chat, state, conversations | AI |
| `/api/events` `/api/saved` | events, saved | | |
| `/api/admin/content` | adminContent (MỚI) | models, models/:num (facts/sections/scores/status) | **CMS nội dung** |
| `/api/admin` | admin | users(+tier/role), leads(+approve/reject/resend), sessions, directions(CŨ) | admin/directions thao tác bảng `directions` cũ |

**Engine match:** `match-v3` (cosine P + resource R, đọc `model_scores` 21 vector) = CHÍNH THỨC. `match-v2` = deprecated, chỉ còn tồn tại vì trang legacy — không phát triển.

---

## 4. DB — 35 bảng (huongdi_prod)

**Nhóm CŨ (Sol gốc, Prisma):** `users, directions, case_studies, saved_directions, user_outcomes, user_events, admin_users, refresh_tokens, leads, lead_notifications, journey_days, sol_chat_conversations, sol_chat_messages, sol_chat_quota, password_reset_tokens`

**Nhóm PARTNER V2 (raw SQL, KHÔNG trong schema.prisma):** `categories, models, model_versions, model_sections, tags, model_tags, model_scores, quiz_questions, quiz_options, option_scores, quiz_responses`

**Nhóm JOURNEY (bản thể user):** `journeys, journey_phases, journey_actions, journey_expenses, journey_gates, journey_events, template_update_notices, journey_sections` (`notebooks` bị thay bởi journey_sections)

⚠️ **2 nguồn dữ liệu hướng đi song song:** bảng `directions` CŨ (37, FK: saved_directions/user_outcomes/journey_days trỏ vào) vs `models` MỚI (64 published). Cần hợp nhất dần (nợ kỹ thuật P6).

---

## 5. LUỒNG BUSINESS ĐẦU-CUỐI (chuẩn)

```
Landing (sol.vn / huongdi.sol.vn)
  → Bước 1 Khám phá (14 câu, /kham-pha-ban-than)
  → Bước 2 Kiểm kê nguồn lực (7 câu, /kiem-ke-nguon-luc)
  → 🗺️ BẢN ĐỒ HƯỚNG ĐI (/ket-qua, match-v3) — Top N hướng hợp + %match
  → Chi tiết 1 hướng (/chi-tiet, 11 mục)
       · Free: 6 mục công khai + 5 mục khoá (preview + CTA nâng cấp)
       · Active/Founder: full 11 mục + nút "🚀 Bắt đầu hành trình"
  → Mua (/pricing → /thanh-toan): VietQR thủ công → admin duyệt → magic link Zalo
  → 📓 SỔ HÀNH TRÌNH v2 (/toi/so-hanh-trinh): nhân bản bản thể → checklist 90 ngày + 11 mục SỬA ĐƯỢC + nhật ký
```

**Bản đồ = CHỌN hướng · Sổ = ĐI 1 hướng đã chọn.** (Khác nhau, bổ trợ.)

---

## 6. YÊU CẦU NGHIỆP VỤ ĐÓNG GÓI (nguyên tắc bất khả xâm phạm)

1. **Ecosystem lock:** sol.vn = marketing (WP), huongdi = product (Node), admin = adminhuongdi. Không trộn.
2. **Immutable versioning:** `model_versions` published không bao giờ ghi đè; sửa = version mới; hành trình cũ đọc version đã chốt.
3. **Bản thể là của user:** kích hoạt = COPY thật (10 mục → journey_sections + phases/actions). User sửa tự do, sở hữu vĩnh viễn (kể cả hết hạn), xuất file được. Template chỉ để lưu + đối chiếu (chỉ đọc, không ghi ngược).
4. **2 chốt an toàn Sổ v2:** mục đã sửa mang nhãn "bạn đã sửa · xem bản gốc"; mỗi lần sửa ghi `section_edited` kèm nội dung cũ (khôi phục được). Mục pháp lý/cảnh báo gốc KHÔNG bao giờ mất khỏi tầm với.
5. **Gate Free/Active per-section:** public {1,2,3,3B,7,10} · locked {4,5,6,8,9}. Kiểm entitlement SERVER-SIDE (không gửi full body rồi che CSS).
6. **Tier:** Free · Active 499k/năm · Founder 1.999k trọn đời (100 slot). Không auto-charge. Data vĩnh viễn. Hoàn tiền 7 ngày.
7. **Persona neo:** chị Nga 52t — bình dân, chữ ≥16px, sợ bị lừa (cần trust), xài Zalo.
8. **Header/user 1 nguồn:** header=sol-ui.js (tự nạp sol-user-nav.js); menu user=sol-user-nav.js DUY NHẤT. Trang KHÔNG tự dựng nav/user. (xem NAV-USER-AREA-REFERENCE)
9. **Menu user chuẩn:** Dashboard · Bản đồ hướng đi (→/ket-qua) · Sổ Hành Trình · Prompt Studio · Sol Đồng Hành AI · Đăng xuất.

---

## 7. CANONICAL vs DEPRECATED (danh sách kiểm soát)

| Chức năng | ✅ CANONICAL (dùng) | ⚠️ DEPRECATED (không dùng/dọn) |
|-----------|--------------------|-------------------------------|
| Match engine | `match-v3` (/ket-qua) | `match-v2` (/toi/ban-do cũ) |
| Bản đồ hướng đi | `/la-ban-huong-di/ket-qua/` | `/toi/ban-do/` (redirect), `/la-ban-huong-di/` hub, `/p3*.html` |
| Sổ Hành Trình | `/toi/so-hanh-trinh/` (v2) | `/so-hanh-trinh/` root (xoá) |
| Dashboard | `/toi/` | `/dashboard.html` |
| Login | `/dang-nhap/` | `/login.html` |
| Quiz | `/kham-pha-ban-than/` `/kiem-ke-nguon-luc/` | `/p1.html /p2.html` |
| Data hướng đi | `models` (64) | `directions` (37) — hợp nhất dần |
| Header/user | sol-ui.js + sol-user-nav.js | top-bar tự chế /toi, sol-avatar-icon.js (chết) |

---

## 8. NỢ KỸ THUẬT / CẦN DỌN (tổng hợp — chi tiết ở PRODUCT-AUDIT + NAV-USER-AREA)
- Hợp nhất `directions` cũ → `models` (FK saved/outcomes/journey_days).
- Dọn trang legacy (p1/p2/p3*, dashboard.html, login.html, /so-hanh-trinh root, /la-ban-huong-di hub, /toi/ban-do).
- Đưa 19 bảng partner vào schema.prisma (hoặc chuẩn hoá quy trình raw SQL).
- Xoá file chết `sol-avatar-icon.js`; bỏ key `sol_token` thừa.
- Tự động hoá thanh toán (thay VietQR thủ công) — P0 business.
- Trust layer + case study thật (thay placeholder) — P0.
- SEO: sitemap + meta cho trang mới.

---

## 9. BỘ TÀI LIỆU LIÊN QUAN (đọc kèm)
- `PRODUCT-AUDIT-2026-07-11.md` — audit business/UX/vận hành + backlog P0/P1/P2.
- `ACTIVE-VALUE-DESIGN-2026-07-11.md` — thiết kế Sổ Hành Trình v2 (bản thể).
- `NAV-USER-AREA-REFERENCE-2026-07-11.md` — quy tắc header/menu user.
- `UNIFIED-DB-SCHEMA / PARTNER-* / SAM-WHITEPAPER / TEST-ENGINE-EXPLAINED` — nền schema + thuật toán.
- `02-ARCHITECTURE / 03-DESIGN-DECISIONS (ADR) / 06-DEPLOY / 07-RUNBOOK` — kiến trúc + ADR + vận hành (⚠️ cập nhật lại theo map này).
- SESSION-LOGS/`2026-07-11-EOD-*` — nhật ký các phiên hôm nay.

---

## 10. QUY TẮC LÀM VIỆC (cho phiên sau — bắt buộc)
1. **Đọc file này TRƯỚC.** Kiểm tra sitemap + canonical/deprecated trước khi làm.
2. **Không tạo trùng.** Trước khi thêm trang/API/bảng → tìm cái tương tự đã có.
3. **1 nguồn sự thật.** Header/user/match/bản đồ/sổ — mỗi thứ đúng 1 bản canonical.
4. **Cập nhật hồ sơ** ngay sau khi đổi cấu trúc (map này + doc liên quan).
5. **Deploy:** backend scp→tsc --noEmit→build→pm2 reload; DB qua psql (cấm db push); FE scp→chown www-data.
6. **Việc >3 bước → TaskCreate; phiên lớn → EOD wrap.**

_Master map · Sol Ecosystem · 2026-07-11 · điểm khởi đầu cho mọi phiên._
