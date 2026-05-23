# Sol — Technical Decisions Log

> Tổng hợp các quyết định kỹ thuật quan trọng đã chốt. Có ngày + lý do.
> Khi session mới hỏi "tại sao Sol làm thế này không thế kia?" → đọc file này.
> Cập nhật: 2026-05-22.

---

## 2026-05-20 — VPS provisioning eztech.vn

**Quyết định**: Mua VPS Ubuntu 24.04 (2GB / 30GB / 2CPU) từ eztech.vn (799k/năm).

**Lý do**:
- Provider Việt — latency thấp cho user VN
- VMware vSAN — IOPS ổn định hơn shared hosting
- Renewal hợp lý (~67k/tháng)
- DC Singapore — không bị filter Việt Nam đối với content y tế

**Alternative đã cân nhắc**:
- Hostinger VPS: rẻ hơn nhưng support kém VN
- Render.com: deploy nhanh nhưng cron sleep ở free tier
- DigitalOcean: $6/mo $72/năm = đắt hơn

---

## 2026-05-21 — Deploy old codebase (Express+Prisma) thay vì Next.js mới

**Quyết định**: Deploy `backend/` (Express + Prisma) + `dashboard/` (Vite React) + `admin/` (Vite React) — **bỏ Next.js app/** em build trong 7 ngày trước đó.

**Lý do**:
- **Backend cũ**: 53 model, 30+ admin endpoint, 26 cron job, Zalo OA tích hợp đầy đủ — **production-grade**
- **Dashboard cũ**: 18 page polished UX cho 45+, mobile-first, 88-day Phase B journey
- **Admin cũ**: 18 page gồm Zalo OA suite, Content CMS, Voice library, Refunds, SOS triage
- Next.js mới chỉ 30% feature coverage — rebuild từ 0 mất 6-8 tuần

**Trade-off chấp nhận**:
- Code base cũ có 12 red flag (double-scheduler, AppSetting plaintext keys, .bak files…) — fix incremental
- Chỉ extract `lib/ftnd.ts` + `TestFtndForm.tsx` từ Next.js sang dashboard SPA

**Reference**: [DEPLOYMENT_PLAN_OLD_CODEBASE.md](./DEPLOYMENT_PLAN_OLD_CODEBASE.md) (v3 chốt 21/5 tối).

---

## 2026-05-21 — Single domain `bothuocla.sol.vn` cho dashboard + API

**Quyết định**: Dashboard SPA + Backend API cùng origin `bothuocla.sol.vn`. Nginx multi-location: `/api/*` proxy backend, `/` serve static SPA.

**Lý do**:
- 1 SSL cert thay vì 3 — setup nhanh
- `VITE_API_BASE=/api` relative URL → same-origin, KHÔNG CORS preflight
- Cookie 1st-party → tránh Safari ITP block 3rd-party cookie (Zalo OA login mobile Safari êm)
- SEO consolidation về 1 domain
- DNS gọn

**Alternative đã cân nhắc**:
- 4 subdomain (app + api + admin + bothuocla) — quá nhiều moving part
- 2 subdomain (bothuocla + api) — vẫn phải lo CORS + JWT cross-origin

**Tách riêng**:
- `admin.sol.vn` — subdomain duy nhất tách. Lý do: IP allowlist Khang + CORS chỉ whitelist 1 origin.

---

## 2026-05-22 — Brevo SMTP thay Zoho

**Quyết định**: Dùng Brevo (smtp-relay.brevo.com:587 STARTTLS) cho email magic link.

**Lý do**:
- Zoho Free **không có App Password** — phải nâng cấp paid (Mail Premium) mới SMTP được. Quá expensive cho pilot.
- Brevo Free 300 mail/ngày + SMTP key tự cấp ngay → đủ cho pilot 100 user
- DKIM Brevo auto-config khi verify domain

**Trade-off**:
- Inbox display: Brevo signature header (List-Unsubscribe) — accept
- Sau khi vượt 300/ngày phải upgrade ($25/mo for 20k/month)
- Reply-to vẫn về `khang@sol.vn` (Zoho inbox cá nhân) — KHÔNG mất Zoho

**DNS setup (2026-05-22)**:
- TXT `mail._domainkey.sol.vn` — DKIM RSA pubkey từ Brevo
- TXT `sol.vn` — SPF `v=spf1 include:spf.brevo.com include:zoho.com ~all`
- TXT `_dmarc.sol.vn` — DMARC `v=DMARC1; p=quarantine; rua=mailto:khang@sol.vn`

---

## 2026-05-22 — VietQR static thay MoMo SDK

**Quyết định**: Payment dùng VietQR static (img.vietqr.io) + admin (Khang) confirm tay qua `/admin/payments`.

**Lý do**:
- **MoMo SDK** yêu cầu KYC business + phí setup phức tạp (~$200-500 deposit)
- **VietQR**: format URL standard `https://img.vietqr.io/image/{BIN}-{ACC}-compact2.png?amount=X&addInfo=SOL+{userId}` — KHÔNG cần API key
- User chuyển khoản → ngân hàng cá nhân Khang → Khang confirm admin → backend update PaymentLog → user tier upgrade
- Pilot 10-100 user — manual confirm OK

**Trade-off**:
- Phải confirm tay → không scale 1000+ user
- KHÔNG có webhook tự động — pilot pain point #1

**Phase 2 (post-launch)**: Wire MB Bank webhook tự động sau (MB Bank cho dev có sandbox).

---

## 2026-05-22 — Bỏ FAQ schema cho bài MỚI (giữ 143 bài cũ)

**Quyết định**:
- 143 bài cũ có `FAQPage` schema → **GIỮ** không migrate
- Bài MỚI Sprint 31-5 dùng `HowTo` / `QAPage` / `Article` (KHÔNG FAQ)
- Disable script `inject-faq-schema.js` + `auto-faq-from-content.js` (require `--force-faq-deprecated` flag)

**Lý do**:
- Google deprecate FAQ rich result 7/5/2026
- Google CHỈ ignore, KHÔNG penalty → bài cũ vẫn safe
- AI crawlers (Bing Copilot, ChatGPT, Perplexity, Claude, Gemini) **vẫn parse** FAQ markup → giữ giá trị AI search
- Migrate 143 bài là effort tốn → ROI âm

**Reference**: [SEO_GOOGLE_FAQ_DEPRECATION_2026.md](./SEO_GOOGLE_FAQ_DEPRECATION_2026.md).

---

## 2026-05-22 — Single-part HTML email (bỏ text part)

**Quyết định**: `smtpClient.ts` chỉ gửi `html`, KHÔNG có `text` param trong `sendMail`.

**Lý do**:
- Bug 22/5: Gmail hiện raw base64 `PCFET0NUWVBFIGh0bWw+...` thay vì HTML render
- Root cause: nodemailer gửi cả `text` + `html` → multipart/alternative boundary
- Brevo (hoặc nodemailer side) strip Content-Type header trong multipart → Gmail không decode
- Single-part `text/html; charset=utf-8` = không boundary, không có chỗ strip header → Gmail OK

**Trade-off**:
- Mất accessibility với text-only mail client (rất hiếm 2026)
- Code đơn giản hơn

```typescript
// smtpClient.ts hiện tại:
await t.sendMail({
  from, to, replyTo, subject,
  html,                                  // CHỈ html
  textEncoding: 'quoted-printable',
  // KHÔNG có text: '...'
});
```

---

## 2026-05-22 — Personalization modal bỏ — đưa vào Settings

**Quyết định**: KHÔNG show personalization modal (pronouns, assistantName, reasons) ngay sau onboarding. Đưa toàn bộ vào `/settings` user tự setup khi muốn.

**Lý do**:
- User mới vào — cần trải nghiệm sản phẩm trong 30 giây đầu, KHÔNG chiếm time hỏi 5 câu
- 30% drop tại personalization step (data từ session trước)
- Default values acceptable: pronouns="bạn", assistantName="Sol Đồng hành"
- Power user sẽ tự vào Settings customize

**Trade-off**: AI message lúc đầu generic hơn (không có {topReason}, {topTrigger}). Acceptable trade — user vẫn dùng được.

---

## 2026-05-22 — Test FTND result page = trang marketing

**Quyết định**: Sau khi user submit FTND, HOLD trên trang result làm landing marketing 8 section (KHÔNG redirect về `/`).

**Lý do**:
- **Phễu lọc**: FTND chứng minh user serious (đã bỏ 2 phút làm test 6 câu)
- **Score-aware marketing**: gói LIGHT/MODERATE/HEAVY recommend trực tiếp dựa trên score
- **Viral**: 3-step dramatic animation 2.8s → screenshot share Facebook → tap vào friend
- **Conversion**: CTA "Bắt đầu hành trình của anh" → tạo anon user → bookmark Settings
- App.tsx redirect logic phải skip route `/test-ftnd?result=*`

**Sections result page**:
1. Score badge + cohort recommendation
2. 3-step dramatic animation
3. Cohort plan details (LIGHT/MODERATE/HEAVY)
4. "Khang đã đi qua" — founder story
5. "Sol đồng hành thế nào" — feature highlight
6. Pricing 3 gói
7. Testimonial (placeholder cho beta wave)
8. CTA + FAQ

---

## 2026-05-22 — 3 cohort plan: LIGHT 140k / MODERATE 225k / HEAVY 290k

**Quyết định**: Pricing cohort-based, 5k/ngày tri ân 500 anh em đầu.

| Cohort | FTND | Total | Free days | Paid days |
|---|---|---|---|---|
| LIGHT | 0-3 | 140k | 7 | 28 × 5k |
| MODERATE | 4-6 | 225k | 7 | 45 × 5k |
| HEAVY | 7-10 | 290k | 7 | 58 × 5k |

**Lý do**:
- 5k/ngày = 1/2 giá pack thuốc (~10k/ngày) → tự thuyết phục anh em "rẻ hơn hút"
- 7 ngày FREE Nhận Diện = aha moment, không cam kết
- Cohort theo FTND chuẩn quốc tế — KHÔNG arbitrary gói
- 35-65 ngày total ≈ medical literature timeline cho dopamine reset

**Alternative đã cân nhắc**:
- Subscription auto-charge — VN không quen, drop rate cao
- 1 giá fix 199k — không respect FTND severity
- Per-week 35k/tuần — kept as alternative payment mode

**Reference**: [SOL_BUSINESS_MODEL_CANONICAL.md](./SOL_BUSINESS_MODEL_CANONICAL.md).

---

## 2026-05-23 — Migrate Journey từ 88-day rigid sang 3-cohort FTND (canonical 2026-05-18)

**Quyết định**: Refactor Journey.tsx + backend journey service để render dynamic theo FTND cohort của user. Bỏ rigid 88-day 4-phase cũ (NHAN_THUC/HANH_DONG/GIAI_PHONG/TAI_THIET).

**Spec mới (anh confirm 22/5)**:

| Cohort | FTND | Lộ trình chính | Chặng 1 Nhận Diện | Chặng 2 Kiểm Soát | Chặng 3 Làm Chủ | Q-Day |
|---|---|---|---|---|---|---|
| 🟢 NHẸ (LIGHT) | 0-3 | **35 ngày** | 7 (FREE) | 7 | 21 | Day 15 |
| 🟡 VỪA (MODERATE) | 4-6 | **52 ngày** | 7 (FREE) | 14 | 30 | Day 22 |
| 🔴 NẶNG (HEAVY) | 7-10 | **65 ngày** | 7 (FREE) | 21 | 30 | Day 22-28 |

**Day 66 → Day 88+ = "Tái Thiết" extension MIỄN PHÍ** — marketing language. Tất cả cohort hoàn thành lộ trình chính sẽ vào maintenance period tự nguyện (anti-relapse, brain rewiring, long-term health).

**Lý do**:
- Canonical 2026-05-18 là source of truth (anh confirm 22/5)
- 88-day rigid không match science (FTND severity quyết định timeline)
- 3 cohort phù hợp pricing 140k/225k/290k
- Tái thiết extension = gift marketing không tăng giá

**Effort**: 2 ngày code (23-24/5)

**Reference**: [SOL_BUSINESS_MODEL_CANONICAL.md](./SOL_BUSINESS_MODEL_CANONICAL.md) Section 3.

---

## 2026-05-23 — "Sổ Lưu Niệm" (KHÔNG dùng "Sổ Hành Trình")

**Quyết định**: Tên gọi cuối cùng feature workbook + memory book = **"Sổ Lưu Niệm"**.

**Override**: Canonical 12.5 nói "Sổ Hành Trình" (KHÔNG dùng "Sổ lưu niệm — legacy"). Quyết định 23/5 OVERRIDE quy tắc wording cũ.

**Lý do** (anh giải thích 22/5):
> "Sổ Lưu Niệm vì là cái họ lưu lại khoe bạn bè nếu cần."

→ Tên "lưu niệm" có cảm xúc, share-able. "Hành trình" trừu tượng hơn.

**Action**:
- Toàn dashboard rename UI string
- Memory Book service giữ tên file `memoryBook.ts` (code internal OK)
- WordPress wiki articles update wording dần (không gấp)

---

## 2026-05-23 — Memory Book trigger align cohort boundaries

**Quyết định**: Auto-generate Sổ Lưu Niệm khi user **hoàn thành lộ trình chính**:

| Cohort | Trigger Day |
|---|---|
| LIGHT | Day 35 |
| MODERATE | Day 52 |
| HEAVY | Day 65 |

**Bỏ trigger cũ** D30/60/90/180/365 (code `memoryBook.ts` hiện tại).

**Lý do**:
- Sổ Lưu Niệm = phần thưởng hoàn thành lộ trình → trigger phải align với "graduation moment" của từng cohort
- D30/60/90 cũ vô nghĩa với cohort LIGHT (đã graduate Day 35)
- Trigger 1 lần duy nhất, không spam mỗi 30 ngày

**Edge case**: User dropout giữa chừng → vẫn sinh Sổ Lưu Niệm "rút lui văn minh" (theo spec ProgressJournal hiện có) khi exit, ghi nhận progress đã đi được.

**Effort**: 2-3h refactor `memoryBook.ts` + scheduler.

---

## 2026-05-23 — Body Recovery extend Day 66-88+ "Bảo trì thành công"

**Quyết định**: Mở rộng body recovery timeline từ Day 1-60 hiện tại sang **Day 1 → Day 88+** với 4-6 milestone mới cho giai đoạn "Tái Thiết / Bảo trì thành công".

**Milestones em sẽ biên soạn** (research NHS/CDC/Brody):
- Day 65-70: Não bộ stabilize (reward pathway reset)
- Day 75: Nguy cơ ho mãn tính giảm 70% (NHS)
- Day 80: Phổi function hồi phục 25% (Doll & Hill BMJ 2004)
- Day 88: "Người Tự Do" — không cảm thấy cần thuốc khi căng thẳng
- Day 90+: Long-term checkpoint — bonus extension không giới hạn

**Lý do**: Tái thiết extension cần content khoa học để user thấy giá trị "ở lại Sol thêm" sau khi hoàn thành lộ trình chính.

**Action**: Code milestones vào `backend/src/journey/service.ts` `BODY_MILESTONES` array.

---

## Decisions sớm hơn (snapshot)

### 2026-05-08 — Anonymous-first auth

**Quyết định**: User mở widget → tạo anon user (UUID v4 deviceUid) ngay, KHÔNG ép phone/email lúc đầu.

**Lý do**: 5% drop khi bắt SĐT từ đầu, có thể 30%+ với 45+. Anonymous → bind sau khi user thấy giá trị.

### 2026-05-08 — Zalo OAuth > SMS provider

**Quyết định**: Layer 2 auth ưu tiên Zalo OAuth, fallback phone OTP (Stringee/eSMS).

**Lý do**: 95% user 45+ Việt có Zalo, brand trust 10/10, free, có channel re-engage qua OA broadcast.

### 2026-05-08 — Recovery code 12-ký-tự

**Quyết định**: Layer 3 auth = recovery code `SOL-XXXX-XXXX-XXXX` thay vì email magic link.

**Lý do**: User 45+ Việt ít kiểm email — print mã giấy tin cẩn hơn.

### 2026-05-03 — Palette "Bình Minh" (olive + terracotta + kem)

**Quyết định**: Color tokens swap Forest Green → "Bình Minh".

**Lý do**:
- Mệnh Sa Trung Thổ (Bính Thìn 1976) — hợp Hoả (cam clay, đỏ, vàng) + Thổ (kem)
- 45+ Việt thấy ấm + chân thành (terracotta) thay vì clinical (forest green pure)
- Khác biệt Vinmec/BV K (xanh dương lạnh) — moat visual

### 2026-05-03 — Brand "Đi Cùng Sol" (KHÔNG "Sol Đi Cùng")

**Quyết định**: Tên thương hiệu canonical: "Đi Cùng Sol". Cấu trúc: động từ + danh từ → lời mời.

**Pattern tagline**: "Đi Cùng Sol để [verb]" — bỏ thuốc / bỏ rượu / ngủ ngon / chuyển nghề.

**Lý do**: Thuận mồm, universal cho multi-vertical roadmap (Thân/Tâm/Trí).

### 2026-05-04 — 3-stage Behavior Journey (7·21·7)

**Quyết định**: Sol KHÔNG fixed 30 ngày. Là **hệ điều hành hành vi 3 giai đoạn**:
- Stage 1 — Nhận Diện 7 ngày
- Stage 2 — Hành Động 14-21 ngày
- Stage 3 — Giải Phóng 7-21 ngày

**Lý do**:
- 70% người 45+ Việt KHÔNG cold turkey thành công
- Tapering + gating phù hợp văn hoá VN hơn Allen Carr
- Adaptive timeline, không fixed

### 2026-05-04 — 1-time payment, KHÔNG subscription

**Quyết định**: User trả 1 lần, không auto-charge, không lưu thẻ.

**Lý do**: VN không quen subscription. Trust với "Khang KHÔNG tự rút tiền lần 2" cao hơn.

---

## Anti-decisions — Cái KHÔNG làm + lý do

| KHÔNG làm | Lý do |
|---|---|
| KHÔNG hứa cai 100% | E-E-A-T + Google YMYL compliance. Marketing thật. |
| KHÔNG MLM / đa cấp | Đại Sứ Sol single-tier 25% trực tiếp. Không tuyến dưới. |
| KHÔNG khoá tài khoản hết 7 ngày | Sol freemium honest — vẫn dùng được hạn chế tài nguyên |
| KHÔNG track per-user GA4 | Privacy — chỉ track aggregate behavior |
| KHÔNG vendor lock cloud | Self-host VPS — dữ liệu user trên đất VN |
| KHÔNG dùng "withdrawal" / "trigger" / "relapse" trong UI | Việt hoá tối đa — Glossary Section 12 trong CANONICAL doc |

---

## Tham khảo

- [SOL_BUSINESS_MODEL_CANONICAL.md](./SOL_BUSINESS_MODEL_CANONICAL.md) — pricing + business model canonical
- [DEPLOYMENT_PLAN_OLD_CODEBASE.md](./DEPLOYMENT_PLAN_OLD_CODEBASE.md) — deploy plan v3
- [SEO_GOOGLE_FAQ_DEPRECATION_2026.md](./SEO_GOOGLE_FAQ_DEPRECATION_2026.md) — FAQ schema decision
- [CHANGELOG_2026-05.md](./CHANGELOG_2026-05.md) — detail log từng task

---

**Last updated**: 2026-05-22
**Maintainer**: Khang Sol
