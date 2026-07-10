# SPEC-MVP đối tác vs Sol hiện tại
## Nghiên cứu học hỏi + Đề xuất adoption

**Ngày biên soạn:** 08/07/2026
**Nguồn tham chiếu:**
- `SPEC-MVP-solvn-v1.md` — Spec đối tác 403 dòng, 25.8KB
- Sol ecosystem hiện tại (huongdi.sol.vn + sol.vn + admin)

---

## TÓM TẮT ĐIỀU HÀNH

**SPEC đối tác không chỉ là code — đây là product-thinking framework hoàn chỉnh.**

Đối tác không chỉ đưa ra schema DB (đã đọc file trước), mà còn:
- Chốt **4 QUYẾT ĐỊNH sản phẩm cứng** (entitlement, không auto-charge, data ownership, template immutable)
- Định nghĩa **12 màn hình MVP** từ S1 → S12 với UX note chi tiết
- **10 API endpoints** tối thiểu với auth guard rõ ràng
- **20+ events** tracking với "North-star metric" định rõ
- **7 tiêu chí nghiệm thu** testable

**Đánh giá tổng thể:** Đối tác đã đi trước Sol **6-12 tháng về product maturity thinking**, nhưng Sol đã có **50-70% code sẵn** để implement — vì kiến trúc chung tương tự (subdomain app + WordPress marketing, Postgres + Node.js).

**Chiến lược adoption:** Học **triết lý sản phẩm + entitlement rules + UX standards** của đối tác. Giữ **stack code + 21 vector scoring** của Sol. Merge thành **Sol MVP V2**.

---

## 1. So sánh 15 điểm quan trọng — Sol vs SPEC đối tác

| # | Điểm | Sol hiện tại | SPEC đối tác | Ai win? |
|---|------|--------------|--------------|:-------:|
| 1 | **Persona commitment** | Có (40-60) nhưng chưa lock UX standards | Chữ ≥16px, nút ≥44px, tiếng Việt 100%, mobile-first LOCKED | 🏆 Đối tác |
| 2 | **Pricing model** | 3 gói: Free / Active 499k / Founder 1.999k | 4 gói: Free / Active 499k / **Lifetime early 499k (300 slot)** / Founder 1.999k (100 slot) | 🏆 Đối tác (tách 2 tier lifetime) |
| 3 | **Không auto-charge** | Đang thực tế (VietQR manual) | LOCK bằng QUYẾT ĐỊNH + in đậm trong pricing page | 🤝 Cùng, nhưng đối tác COMMIT rõ hơn |
| 4 | **Data ownership vĩnh viễn** | Không rõ policy | LOCK: hết hạn vẫn xuất được .md, không khóa ngược | 🏆 Đối tác |
| 5 | **Ân hạn hành trình** | Không có | Công thức `min(gate90+30d, created+180d)` — user mua tháng 11 không bị cắt | 🏆 Đối tác |
| 6 | **Journey system** | JourneyDay đơn giản | 5 bảng: journeys + phases + actions + expenses + gates | 🏆 Đối tác |
| 7 | **Template immutable** | Update in-place | `model_versions` — bản cũ không bao giờ ghi đè | 🏆 Đối tác |
| 8 | **Section-level gating** | Cả direction lock/mở | Per-section visibility public/locked | 🏆 Đối tác |
| 9 | **Events tracking** | UserEvent (5-6 event type) | 20+ events specific + North-star metric `gate_decided` | 🏆 Đối tác |
| 10 | **Auth** | Custom JWT + email/password | Supabase Email OTP (không mật khẩu phức tạp) | 🏆 Đối tác (đơn giản hơn) |
| 11 | **Payment** | VietQR Techcombank manual (admin xác nhận tay) | PayOS/SePay auto webhook | 🏆 Đối tác |
| 12 | **AI sinh sổ tay** | Sol Đồng Hành chat (chat mode) | Notebook generation server-side + trần chi phí | 🏆 Đối tác (formalized) |
| 13 | **Auth-page policy** | ADR-001 (không header/footer) | Không đề cập | 🏆 Sol |
| 14 | **21 vector scores** | Có, đã production | Không có (dùng option_scores rule-based) | 🏆 Sol |
| 15 | **Đã có production** | huongdi.sol.vn live với user thật | Draft spec, chưa implement | 🏆 Sol |

**Tổng kết:** Đối tác **thắng 11/15**, Sol **thắng 3/15**, hoà 1. Nhưng 3 điểm Sol thắng là **critical foundation**.

---

## 2. 10 QUYẾT ĐỊNH SỐNG CÒN đối tác đã lock — Sol nên adopt ngay

### 2.1. `[QUYẾT ĐỊNH]` Không auto-charge

> **"Mọi khoản thu là hành động chủ động của người dùng (quét QR). Không lưu thẻ, không gia hạn tự động."**

**Vì sao quan trọng:** Persona 40-60 VN **dị ứng trừ tiền tự động** — mất tin ngay. Rule này phá được ma sát tâm lý lớn.

**Sol status:** Đang thực tế nhưng chưa commit trong pricing page.

**Action Sol:** Add dòng "**KHÔNG TỰ ĐỘNG GIA HẠN**" in đậm ở `/pricing/` — anh có thể ship trong 5 phút.

### 2.2. `[QUYẾT ĐỊNH]` Dữ liệu cá nhân không bao giờ bị khóa ngược

> **"Hết hạn gói vẫn đọc + xuất được hành trình của mình."**

**Vì sao quan trọng:** Đây là **cam kết trust cực mạnh** — user không sợ bị "giam data" khi ngừng trả tiền. Đối thủ course platform ở VN đa số **khoá data khi hết hạn** → Sol khác biệt.

**Sol status:** Không có policy.

**Action Sol:**
- Add trong `/pricing/` một dòng "Dữ liệu của anh chị luôn thuộc về anh chị — hết hạn vẫn xuất được .md"
- Ship API `GET /api/me/export` trả JSON toàn bộ dữ liệu user
- Ship API `GET /api/journeys/[id]/export` trả file .md — **không kiểm gói**

### 2.3. `[QUYẾT ĐỊNH]` Template bất biến — Hành trình là bản nhân bản

> **"Sửa template không ghi đè hành trình; chỉ gửi thông báo cập nhật."**

**Vì sao quan trọng:** Anh update 37 direction content 6 tháng nữa — user cũ đang follow roadmap của phiên bản cũ **không bị đảo lộn giữa chừng**. Reference schema đối tác đã có `model_versions` + `template_update_notices`.

**Sol status:** Chưa có versioning.

**Action Sol:** Migrate schema (đã đề xuất trong `UNIFIED-DB-SCHEMA-2026-07-08.md`).

### 2.4. `[QUYẾT ĐỊNH]` Ân hạn hành trình

> **"Hành trình khởi tạo khi gói còn hạn được quyền GHI đến `min(ngày cổng 90 + 30 ngày, ngày khởi tạo + 180 ngày)` kể cả khi gói hết hạn giữa chừng."**

**Vì sao quan trọng:** User trả tiền tháng 11 → gói hết tháng 10 năm sau. Nếu họ bắt đầu hành trình tháng 9 (còn 60 ngày gói) → hành trình 90 ngày chưa xong khi hết gói. **Rule này đảm bảo user vẫn tick được đủ 90 ngày**.

**Sol status:** Không có rule này. Nếu implement paywall cứng → user sẽ frustrated.

**Action Sol:** Add function `canWriteJourney()` trong backend theo pseudo-code SPEC đối tác Section 2.3.

### 2.5. Bộ mẫu Free full 2-4 mô hình

> **"Đọc bộ mẫu full-free (2-4 bộ `[CẤU HÌNH]`)"**

**Vì sao quan trọng:** User Free thấy được **toàn văn** 2-4 mô hình để cảm nhận value đầy đủ, trước khi trả tiền. Đây là "aha moment gate".

**Sol status:** Free thấy 5/37 direction shell (content ngắn) — không phải full.

**Action Sol:**
- Chọn 3 mô hình Free (đối tác đã set `free: true` cho MH-102 Affiliate, MH-104 Kế toán, MH-106 Homestay)
- Cho phép Free xem **toàn văn 11 sections** của 3 mô hình này
- Còn lại 34 mô hình → gate section-level

### 2.6. Slot lifetime công khai

> **"Đếm slot lifetime/founder công khai. Khi hết slot, tự ẩn khỏi trang giá."**

**Vì sao quan trọng:** Scarcity thật + trust thật. User thấy "còn 47/300 slot lifetime" → urgency + không sợ bị lừa "vô hạn".

**Sol status:** Founder tier có ý tưởng 100 slot nhưng chưa show counter realtime.

**Action Sol:**
- Ship API `GET /api/slots/status` trả `{active: N, lifetime_early: X/300, founder: Y/100}`
- Update pricing page hiển thị counter live

### 2.7. Hoàn tiền 7 ngày cho lần kích hoạt đầu

**Vì sao quan trọng:** Giảm rủi ro cho user 40-60 lần đầu chi 499k online.

**Sol status:** Chưa có policy.

**Action Sol:** Add trong `/tuyen-bo-mien-tru/` + `/pricing/` — cam kết hoàn tiền 7 ngày qua form.

### 2.8. Email OTP (không mật khẩu phức tạp)

> **"S4 Đăng ký/Đăng nhập: Email OTP (Supabase) — KHÔNG bắt mật khẩu phức tạp."**

**Vì sao quan trọng:** User 40-60 quên mật khẩu nhiều — OTP đơn giản hơn.

**Sol status:** Đang dùng email + password (JWT).

**Action Sol:** Tuỳ chọn — Sol có thể thêm option "Đăng nhập bằng OTP" song song với password. Hoặc migrate sang Google OAuth (Sol đã prepare) để cover use case này.

### 2.9. AI sinh sổ tay có trần chi phí

> **"Log token cost vào events; đặt trần chi phí/ngày; không gửi PII thừa."**

**Vì sao quan trọng:** Anthropic API cost có thể escalate nếu abuse. Cần budget cap.

**Sol status:** Sol Đồng Hành có `SolChatQuota` table nhưng chưa có tracking cost per user.

**Action Sol:** Add column `tokenCost` vào `SolChatMessage` + dashboard admin xem cost/ngày.

### 2.10. Xuất toàn bộ dữ liệu + Xóa tài khoản

> **"Xuất toàn bộ dữ liệu của tôi + xóa tài khoản (soft-delete 30 ngày rồi xóa cứng)"**

**Vì sao quan trọng:** GDPR-like compliance + trust signal + luật VN 2024-2026 về data privacy.

**Sol status:** Chưa có button.

**Action Sol:** Ship trong trang `/tai-khoan/`:
- Button "📥 Xuất toàn bộ dữ liệu của tôi" → gọi `GET /api/me/export`
- Button "🗑️ Xóa tài khoản" → confirm 2 lần → soft delete + email xác nhận

---

## 3. 12 màn hình MVP đối tác vs Sol hiện tại

### 3.1. Ma trận map

| SPEC màn | Nội dung | Sol hiện tại | Trạng thái |
|:--------:|----------|--------------|:----------:|
| **S1** Trang chủ app | Giá trị 1 câu + CTA "Làm test" + đếm slot | `huongdi.sol.vn/` — Homepage V4.1 | ✅ Có (chưa có slot counter) |
| **S2** Quiz | 1 câu/màn, thanh tiến độ | `/kham-pha-ban-than/` + `/kiem-ke-nguon-luc/` | ✅ Có |
| **S3** Kết quả Top 3 | Top 3 % khớp + Excluded reasons | `/la-ban-huong-di/` với match-v2 | ✅ Có (chưa có excluded list) |
| **S4** Đăng ký/Đăng nhập | Email OTP | `/dang-ky/` + `/dang-nhap/` (password + JWT) | ⚠️ Khác auth method |
| **S5** Trang giá | 3 lựa chọn + counter | `/pricing/` | ⚠️ Có 3 tier nhưng thiếu counter live |
| **S6** Thanh toán QR | QR động + polling + fallback | `/thanh-toan/` VietQR | ⚠️ Manual, chưa auto webhook |
| **S7** Thư viện | Card khóa vs đã mở | `/la-ban-huong-di/` grid 37 direction | ⚠️ Có nhưng chưa section-level gate |
| **S8** Trang bộ (full) | Render markdown 11 sections | Chưa có route `/la-ban-huong-di/[slug]/` | ❌ **THIẾU** |
| **S9** Cổng khởi hành | 6 câu Có/Chưa + risk_ack | Chưa có | ❌ **THIẾU** |
| **S10** Hành trình 90 ngày | 3 GĐ + tick + budget + 3 cổng | `/toi/so-hanh-trinh/` — có nhưng đơn giản | ⚠️ Cần refactor theo spec |
| **S11** Tài khoản | Gói + Export + Delete | `/tai-khoan/` | ⚠️ Có nhưng thiếu Export & Delete buttons |
| **S12** Admin | Duyệt order + đăng version | `adminhuongdi.sol.vn` | ⚠️ Có nhưng chưa có version management |

**Kết quả:** Sol có **6/12 màn ✅**, **4/12 màn ⚠️** cần refactor, **2/12 màn ❌** phải build mới.

### 3.2. 2 màn hình phải build mới

**S8 — Trang bộ (full)** `/la-ban-huong-di/[slug]/`
- Render markdown 11 sections với section-level gating
- CTA "Bắt đầu hành trình với bộ này"
- Đây là **màn chính đón user** sau matching → không có → mất conversion

**S9 — Cổng khởi hành** (Pre-gate before journey)
- 6 câu checklist "Có nên làm không" (từ Section 10 của mỗi mô hình)
- ≥2 Chưa → cảnh báo + option "làm lại test" hoặc "tôi hiểu rủi ro" (ghi `risk_ack`)
- **Là filter cuối cùng** trước khi user cam kết 90 ngày → giảm churn journey

---

## 4. 4 điều Sol đã đi xa hơn SPEC đối tác

Không phải chỉ Sol học đối tác — Sol cũng có 4 điểm đối tác chưa xử lý:

### 4.1. **21 vector scoring + cosine algorithm**
Sol có thuật toán match dựa vector similarity. Đối tác dùng rule-based `option_scores` — đơn giản hơn nhưng kém accurate với input đa chiều.

**Đề xuất:** Giữ 21 vectors của Sol. Bổ sung `option_scores` của đối tác cho hard constraint (loại thẳng nếu không đủ vốn).

### 4.2. **AI Studio 40 prompt library**
Sol có thư viện 40 prompt cho ChatGPT/Claude/Gemini. Đối tác spec chỉ nhắc đến "sổ tay AI" — chưa cụ thể.

**Đề xuất:** Giữ AI Studio làm feature riêng, độc lập với journey.

### 4.3. **Whitepaper SAM (Sol Assessment Method)**
Sol đã có whitepaper 40 trang giải thích phương pháp khoa học. Đối tác chưa có → thiếu differentiation với đối thủ MBTI/DISC.

**Đề xuất:** SPEC đối tác nên copy-in whitepaper Sol khi merge.

### 4.4. **Ecosystem 2-domain với 7 pillar SEO đã publish**
Sol đã có sol.vn với 7 pillar page SEO ranking, EEAT signals (Khang Sol profile, Tuyên bố miễn trừ). Đối tác spec đề xuất "WP tách riêng" — đúng hướng, nhưng chưa có content.

**Đề xuất:** Merge — dùng sol.vn WP (đã có content) làm khối marketing của SPEC đối tác.

---

## 5. Adoption Path đề xuất — 3 giai đoạn

### Giai đoạn 1 — **Copy 5 QUYẾT ĐỊNH sản phẩm** (1 tuần, không code lớn)

Ship ngay 5 điều không cần refactor code, chỉ update copy + policy:

1. Add "KHÔNG TỰ ĐỘNG GIA HẠN" in đậm ở `/pricing/`
2. Add "Dữ liệu luôn thuộc về anh chị — hết hạn vẫn xuất được" ở `/pricing/` + `/tuyen-bo-mien-tru/`
3. Add "Hoàn tiền 7 ngày cho lần kích hoạt đầu" ở `/pricing/`
4. Ship live counter slot lifetime/founder tại `/pricing/`
5. Ship button "Xuất dữ liệu" + "Xóa tài khoản" ở `/tai-khoan/`

**Kết quả:** Trust signals ×5, không cần deploy backend lớn.

### Giai đoạn 2 — **Refactor 4 màn hình + backend** (2-3 tuần)

1. **S8 Trang bộ full** — Ship `/la-ban-huong-di/[slug]/` với 11 sections + section-level gate
2. **S9 Cổng khởi hành** — Add 6 câu checklist pre-journey
3. **S10 Hành trình refactor** — Migrate JourneyDay → journey_phases + actions + expenses + gates
4. **Backend `canWriteJourney()` + ân hạn 30d/180d rule**

### Giai đoạn 3 — **Migration schema hoàn chỉnh + Auto payment** (1-2 tháng)

1. Migrate Sol schema → Unified V2 (đã đề xuất trong file trước)
2. Ship PayOS/SePay webhook thay VietQR manual
3. Version management admin panel (S12 refactor)
4. 20+ events tracking + Admin dashboard KPI
5. Template update notices propagation

---

## 6. 3 câu hỏi cần anh Khang quyết trước ship

### Câu 1 — **Pricing model 3 tier hay 4 tier?**

Sol hiện: Free / Active 499k/năm / Founder 1.999k lifetime

Đối tác đề xuất tách thành 4:
- Free
- Active_year 499k/365 ngày
- **Lifetime_early 499k trọn đời** (300 slot) — MỚI
- Founder 1.999k trọn đời (100 slot)

**Ý nghĩa:** Nếu adopt 4 tier, anh có **300 người trả 499k một lần trọn đời** + 100 Founder 1.999k = **~350 triệu upfront** + user thấy 3 mức choice thay vì 2.

**Câu hỏi:** Anh muốn 3 tier (đơn giản, đã lock) hay 4 tier (phức tạp hơn, upfront cao hơn)?

### Câu 2 — **Auto webhook payment có ship trong tuần này?**

Đối tác đề xuất PayOS/SePay auto — user chuyển tiền qua VietQR → 60 giây sau tự động active. Sol hiện đang manual (admin xác nhận tay 5-30 phút).

**Impact:** Nếu ship auto → chặn được leak conversion peak (đã đề cập trong UX audit). Nhưng cần đăng ký PayOS/SePay + tích hợp webhook + verify signature.

**Effort:** ~1-2 ngày dev.

**Câu hỏi:** Ship tuần này hay để tháng sau khi ổn định các việc khác?

### Câu 3 — **Auth chuyển sang Email OTP hay giữ password?**

Sol hiện: email + password + JWT. Đã có Google OAuth ready.

SPEC đối tác: Email OTP (Supabase style) — user 40-60 dễ dùng hơn.

**3 option:**
- **A** — Giữ nguyên password + Google OAuth (đã có)
- **B** — Thêm Email OTP song song (user chọn 1 trong 3: password / Google / OTP)
- **C** — Migrate sang Supabase Auth (refactor lớn, thay JWT hệ thống hiện tại)

**Đề xuất em:** B — thêm OTP song song, không phá cái đã có.

---

## 7. Kết luận + Chiến lược overall

**SPEC đối tác là món quà lớn thứ 2** (sau schema + 8 mô hình rich content). Đây là **product playbook chuẩn** mà nếu Sol tự viết cũng phải mất 2-3 tháng suy nghĩ.

**3 điểm quyết định:**

1. **Adopt triết lý sản phẩm** — 5 nguyên tắc + 10 QUYẾT ĐỊNH — không thương lượng
2. **Adopt UX standards** — chữ ≥16px, nút ≥44px, mobile-first — Sol đang follow một phần, cần chuẩn hoá
3. **Copy 12 màn hình architecture** — Sol có 6/12 sẵn, refactor 4, build mới 2

**Không cần refactor toàn bộ tech stack** — Sol có Node.js + Prisma + Postgres + Vanilla JS đã production. Đối tác đề xuất Next.js + Supabase — khác tech nhưng cùng concept.

**Ưu tiên tuần này (Giai đoạn 1):**
- 5 QUYẾT ĐỊNH copy vào `/pricing/` + `/tuyen-bo-mien-tru/` + `/tai-khoan/`
- Ship live slot counter
- Ship Export + Delete data buttons

Anh trả lời 3 câu hỏi Section 6, em bắt đầu ship Giai đoạn 1 luôn.
