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
| `/ai-studio/` | 🤖 **AI STUDIO** (CANONICAL) — thư viện ~37 prompt mẫu (ChatGPT/Claude/Gemini) + nút Copy | tĩnh (prompt inline) |
| `/tao-prompts-ca-nhan/` | ✍️ **TẠO PROMPT CÁ NHÂN** (CANONICAL) — điền thông tin → sinh prompt cá nhân hoá + Copy | tĩnh |
| `/prompts/` | ⚠️ redirect → `/ai-studio/` | — |
| `/prompts-studio/` | ⚠️ redirect → `/tao-prompts-ca-nhan/` | — |

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

## 5B. 🤖 HỆ PHỤ PROMPT & AI (mảng riêng — trước đây thiếu trong hồ sơ)

Sol có **3 công cụ AI** phục vụ persona chị Nga tự dùng ChatGPT/Claude/Gemini mà không biết viết prompt:

| Công cụ | Trang | Loại | Nội dung/Nguồn | Gate |
|---------|-------|------|----------------|------|
| **AI Studio** | `/ai-studio/` | Tĩnh (không cần login) | ~37 prompt mẫu viết sẵn theo hướng đi, 3 phiên bản (ChatGPT/Claude/Gemini), nút Copy 1 chạm | Free (công khai) |
| **Tạo Prompt Cá Nhân** | `/tao-prompts-ca-nhan/` | Tĩnh | Điền tên/nghề/mục tiêu → ghép vào ~26 template → prompt cá nhân hoá + Copy | Free |
| **Sol Đồng Hành AI** | `/toi/sol-dong-hanh/` | Chat động (cần login) | Trợ lý hội thoại, có bộ nhớ hội thoại (`sol_chat_*`) | Theo tier, có quota |

### Sol Đồng Hành AI — chi tiết kỹ thuật
- **API:** `/api/sol-dong-hanh` (chat, state, conversations). Bảng: `sol_chat_conversations, sol_chat_messages, sol_chat_quota`.
- **Multi-provider (env `PROVIDER` chuyển được):** Gemini `gemini-2.5-flash` · OpenAI `gpt-4o-mini` · Anthropic `claude-3-5-haiku`. Đổi provider chỉ qua biến môi trường — không sửa code.
- **Quota tin nhắn/tháng:** ACTIVE **30** · FOUNDER **500** (Free: giới hạn thấp/không có — cần rà xác nhận con số Free).
- Chi phí token có bảng giá input/output từng model để theo dõi.

### Nguồn nội dung prompt — ⚠️ ĐÃ XÁC MINH: CÓ 2 NGUỒN SONG SONG, ĐÃ LỆCH
Điều tra 2026-07-11 (grep toàn repo):
- **Nguồn A — LIVE:** `/ai-studio/index.html` (5.669 dòng) chứa **~24 prompt INLINE hardcode**. KHÔNG fetch, KHÔNG API, KHÔNG đọc file ngoài. Đây là cái user THỰC SỰ thấy.
- **Nguồn B — KHO RỜI:** `content/prompts/*.md` = **37 file + INDEX.md** (commit gốc 2026-07-07). **Không trang nào, không backend nào nạp chúng.** (Các slug trùng chỉ xuất hiện ở trang legacy p1/p3/la-ban hub — không phải đọc file .md.)
- **Hệ quả:** 2 kho lệch nhau (37 file kho vs ~24 prompt inline). Sửa file .md → site KHÔNG đổi. Sửa AI Studio → kho .md KHÔNG đổi. Kho .md hiện là **"tồn kho chết"**.
- **Quyết định cần chốt (1 trong 2):**
  (a) Nối AI Studio đọc `content/prompts` (1 nguồn, sửa 1 nơi) — nhiều việc hơn; hoặc
  (b) Coi AI Studio inline là canonical, **archive/xoá** kho .md để hết nhầm — nhanh, gọn.
  → Khuyến nghị **(b)** trước mắt (MVP), làm (a) khi cần CMS hoá prompt.
- `tao-prompts-ca-nhan/`: template inline + 1 lệnh `fetch` (lưu lead/cá nhân hoá) — không liên quan kho .md.

### Canonical/deprecated mảng AI
| Chức năng | ✅ CANONICAL | ⚠️ DEPRECATED |
|-----------|-------------|---------------|
| Thư viện prompt | `/ai-studio/` | `/prompts/` (redirect) |
| Prompt cá nhân | `/tao-prompts-ca-nhan/` | `/prompts-studio/` (redirect) |
| Chat AI | `/toi/sol-dong-hanh/` + `/api/sol-dong-hanh` | — |

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

## 6B. ⚖️ ENTITLEMENT — QUYỀN FREE/ACTIVE & CẤU HÌNH ĐỘNG vs FIX CỨNG (rà 2026-07-11)

### Ai được gì (thực tế trong code hôm nay)
| Quyền | FREE | ACTIVE (499k) | FOUNDER (1.999k) | Module điều khiển |
|-------|:----:|:-------------:|:----------------:|-------------------|
| Quiz Bước 1+2, Bản đồ (match-v3) | ✅ | ✅ | ✅ | match-v3.ts |
| Duyệt catalog 64 hướng | ✅ | ✅ | ✅ | directions.ts |
| Đọc **section public** (6 mục: 1,2,3,3B,7,10) | ✅ | ✅ | ✅ | **sections.ts** |
| Đọc **section locked** (5 mục: 4,5,6,8,9) | ❌ | ✅ | ✅ | **sections.ts** (`canSeeLocked=ACTIVE\|\|FOUNDER`) |
| Bắt đầu hành trình + Sổ v2 bản thể | ❌ | ✅ | ✅ | journeys.ts (check tier) |
| Prompt AI Studio | 5 mẫu | 40 mẫu | 40 mẫu | ai-studio (JS client) |
| Sol Đồng Hành AI (chat) | ⚠️ 30? | 30 msg/tháng | 500 msg/tháng | sol-dong-hanh.ts |

### Cái gì ĐỘNG (đọc DB) ✅ vs FIX CỨNG (cần sửa) ⚠️
| Dữ liệu | Trạng thái | Ở đâu | Vấn đề |
|---------|-----------|-------|--------|
| Gate section public/locked | ✅ **ĐỘNG** | `model_sections.visibility` (DB) | Chuẩn — sửa gate = sửa DB/CMS |
| Số hướng đi + danh sách | ✅ **ĐỘNG** | `directions.ts` `count: directions.length` where PUBLISHED | Chuẩn |
| Nội dung 11 mục mỗi hướng | ✅ **ĐỘNG** | `model_sections` (DB) | Chuẩn |
| **Quota AI (30/500)** | ⚠️ **FIX CỨNG** | `sol-dong-hanh.ts:48` `TIER_QUOTA={ACTIVE:30,FOUNDER:500}` | Không có DB/config. **FREE không định nghĩa → fallback `\|\|30` = Free cũng được 30 msg?!** (rò rỉ, cần chốt Free=?) |
| **Paywall AI Studio (5 free/35 lock)** | ⚠️ **FIX CỨNG + client-side** | `ai-studio/index.html:5337` JS | **Chặn bằng JS client → bypass được (xem source là thấy 35 prompt khoá). Không enforce server.** Rủi ro business |
| **40 prompt** | ⚠️ **FIX CỨNG inline** | ~24–40 prompt inline trong HTML (6 trang ghi "40") | Số marketing rời rạc, dễ lệch |
| **"37 hướng đi"** | ⚠️ **FIX CỨNG (14 trang)** | index, pricing, founder, dashboard, p1/p2/p3, la-ban hub... ghi ">37<" | **ĐÃ SAI: thực tế 64 hướng published.** Số marketing cứng, lỗi thời |
| **5 file free** | ⚠️ **FIX CỨNG** | ai-studio JS + index.html:630 | Con số phpaywall rời |

### 🔴 3 vấn đề nghiêm trọng phát hiện
1. **Marketing đếm cứng đã lệch thực tế:** 14 trang vẫn ghi "37 hướng" trong khi DB có **64**. Người dùng thấy số sai. → phải đọc động từ `/api/directions` (đã có `count`).
2. **Paywall AI Studio chỉ chặn client-side** (5 free/35 lock nằm trong JS) → bypass dễ. Không có API enforce. → nếu prompt là giá trị Active, phải chuyển gate về server như `sections.ts`.
3. **Quota FREE không định nghĩa → fallback 30** → Free có thể chat ngang Active. Cần chốt Free = 0/5/10 và ghi vào config.

### ✅ Hướng chuẩn hoá (1 nguồn cấu hình) — khuyến nghị
- Lập **1 bảng/1 file config quyền & giới hạn** (vd bảng `plans` hoặc `config/entitlements.ts`): tier → {quota_ai, prompt_free, sections mở, quyền journey}. Mọi nơi đọc từ đây, không rải số.
- **Số đếm marketing** (hướng, prompt): trang gọi API đếm động (`/api/directions` count; thêm `/api/ai-studio/stats` cho prompt) thay vì hardcode. Hoặc build-time inject.
- **Enforce server-side** mọi gate có giá trị tiền (prompt Active, quota) — client chỉ hiển thị.

### 🎯 YÊU CẦU NGHIỆP VỤ: cấu hình quyền chỉnh được từ CMS (không deploy)
> **Nhu cầu founder:** "Thời điểm nào đó muốn Free lên 12 hoặc 20 prompt để hút khách trải nghiệm thì chỉ cần thay trong config là xong."

**Thiết kế đích — bảng `app_config` trong DB, sửa ngay trong CMS:**
| key | ví dụ | ý nghĩa |
|-----|------|---------|
| `free_prompt_limit` | 5 | Số prompt AI Studio cho Free (đổi 5→20 = chạy campaign) |
| `active_prompt_limit` | 40 | Prompt cho Active/Founder |
| `free_ai_quota` | 0 | Tin nhắn chat AI/tháng cho Free |
| `active_ai_quota` | 30 | — cho Active |
| `founder_ai_quota` | 500 | — cho Founder |
| `free_sections` | 1,2,3,3B,7,10 | Mục hướng đi mở cho Free |

**Luồng:** CMS sửa giá trị → lưu DB → `/api/config/entitlements` trả động → AI Studio + backend đọc theo → hiệu lực NGAY, không sửa code, không deploy. Backend luôn enforce (client chỉ hiển thị).
**Lợi ích:** chạy campaign "dùng thử 20 prompt" bật/tắt trong 10 giây từ admin; A/B test ngưỡng free; không lệ thuộc dev.

> ✅ **ĐÃ DỰNG 2026-07-11.** Thành phần: bảng `app_config` (`seeds/19-app-config.sql`); `services/config.ts` (cache 30s); `GET /api/config/entitlements`; `GET/PUT /api/admin/config`; tab **⚙️ Cấu hình** trong CMS; quota AI (`sol-dong-hanh.ts`) + AI Studio đọc động.
> Còn lại (hardening sau): chuyển đếm "37→64" động cho các trang marketing; enforce nội dung prompt server-side (hiện prompt nằm inline nên user kỹ thuật vẫn đọc được text mục khoá — số lượng free thì đã do server quyết).

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
- **AI Studio (ĐÃ XÁC MINH):** prompt LIVE nằm inline (~24), kho `content/prompts` (37 file) là tồn kho chết đã lệch → chốt: archive kho .md (khuyến nghị) HOẶC nối AI Studio đọc kho. KHÔNG để 2 nguồn.
- **Sol Đồng Hành:** chốt & hiển thị rõ quota Free (hiện chỉ thấy ACTIVE 30 / FOUNDER 500; Free fallback 30 = rò rỉ).
- **🔴 Entitlement config tập trung:** lập bảng `plans`/`config/entitlements.ts` (tier→quota/prompt/section/journey). Bỏ số rải rác.
- **🔴 Số đếm động:** 14 trang ghi "37 hướng" nhưng DB có 64 → cho trang gọi API count động.
- **🔴 Paywall AI Studio về server:** 5 free/35 lock đang client-side (bypass được) → enforce server nếu prompt là giá trị Active.

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
5. **Deploy (cơ chế THẬT — KHÔNG dùng git trên VPS):** VPS **không** có `/var/www/huongdi-git`; playbook git trong 06-DEPLOY.md đã LỖI THỜI. Cách đúng: đóng gói file đổi bằng `tar` → `scp` lên `/tmp` → bung → copy vào `/var/www/huongdi/{backend,public,admin}` → `cd backend && npm run build && pm2 restart huongdi-api`. Backend chạy `dist/index.js` (build bằng `tsc`), pm2 tên `huongdi-api`.
   - **DB:** chạy SQL qua psql, NHƯNG file phải ở `/tmp` + `chmod 644` (user `postgres` không đọc được thư mục solop). Cấm `prisma db push`.
   - **Admin docroot:** `/var/www/huongdi/admin/index.html`. **Public:** `/var/www/huongdi/public/`. Chown `www-data:www-data`.
   - Script sẵn: `scripts/deploy-cfg.sh` (mẫu tham chiếu).
6. **Việc >3 bước → TaskCreate; phiên lớn → EOD wrap.**

---

## 11. QUYẾT ĐỊNH LANDING & AUDIT (2026-07-12)

### Kiến trúc landing (chốt)
- **sol.vn/** = landing page **mặc định toàn hệ thống Sol** — dựng **trang tĩnh tự code, ĐỘC LẬP WordPress** (WP chỉ còn blog/sách). Nội dung: **lấy khung sol.vn hiện tại làm gốc** (bảng so sánh, FAQ 8 câu, pricing, case, founder) + sửa số đúng.
- **huongdi.sol.vn/** = landing **ngắn, thuần kỹ thuật** kiểu notion.com (vào việc ngay, `noindex`, canonical→sol.vn). Bỏ vai bán trùng.
- Menu thêm trang **"Sol làm việc thế nào" (How it works)** — top-level; nội dung lõi = 5 Bước.

### Giá trị canonical (dùng THỐNG NHẤT mọi nơi)
| Khoản | Giá trị chốt |
|-------|-------------|
| Hoàn tiền | **14 ngày** (đã sửa pricing 7→14; sol.vn/ai-studio/ket-qua đã 14) |
| Số mô hình | **64** (KHÔNG dùng "37"/"73"). Ưu tiên đếm động qua `/api/directions`. |
| Giá | Active **499k/năm** · Founder **1.999k** (nhất quán, OK) |

### Audit số/link 2026-07-12 (cần dọn)
- 🔴 **"37 mô hình" sai** ở 9 trang: index, pricing, ai-studio, founder, tai-khoan, activate, la-ban-huong-di, p3 + **sol.vn** → sửa về 64/đếm động. (Legacy p3/activate/tai-khoan sẽ retire.)
- 🔴 **Link CTA sol.vn chết**: `/thau-hieu/`→ đã tạo redirect `/kham-pha-ban-than/`; `/active/`→ redirect `/pricing/`. Nên sửa gốc trong WP sau.
- 🟡 **Hub cũ `/la-ban-huong-di/`** vẫn bị **11 trang** trỏ vào (đã deprecated) → dần đổi sang `/ket-qua/`.

### Việc còn lại (chia vai)
- **Em:** dựng landing tĩnh sol.vn (gốc sol.vn + số đúng) · huongdi/index → short landing noindex · trang How-it-works · thêm menu.
- **Anh (WP):** khi rảnh sửa link CTA gốc + số 37→64 trên sol.vn (hoặc thay hẳn bằng landing tĩnh mới).

### Logo hệ thống (canonical)
- **Logo = la bàn SVG**: `huongdi-public/assets/sol-compass.svg` (đĩa navy + viền amber + kim Bắc amber). Dùng chung header/footer toàn hệ thống. Landing sol.vn nhúng inline cùng hình. Thay cho `Icon_2.png` cũ.

### Redirect sol.vn → huongdi (cứu link/CTA cũ)
| Đường cũ (sol.vn trỏ) | → Đích đúng | Bước |
|---|---|---|
| huongdi/thau-hieu/ | /kham-pha-ban-than/ | 1 |
| huongdi/khai-pha/ | /kiem-ke-nguon-luc/ | 2 |
| huongdi/chon-huong/ | /la-ban-huong-di/ket-qua/ | 3 |
| huongdi/active/ | /pricing/ | mua |
Tất cả là trang redirect noindex trong huongdi-public/. FB group canonical toàn hệ thống: **web.facebook.com/groups/taikhoinghiepdunghuong** (sol.vn cần đổi theo trong WP).

_Cập nhật: 2026-07-12._

---

_Master map · Sol Ecosystem · 2026-07-11 · điểm khởi đầu cho mọi phiên._
