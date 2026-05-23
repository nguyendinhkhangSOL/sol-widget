# SOL — TƯ VẤN CẤU TRÚC SẢN PHẨM + ROADMAP ĐẠI SỨ

> **Phase 4 deliverable** — tư vấn lộ trình hoàn thiện dịch vụ Sol sau khi đã chốt Business Model Canonical.
> Source of truth pricing/business: `SOL_BUSINESS_MODEL_CANONICAL.md`

---

## METADATA

| Field | Value |
|---|---|
| **Version** | 1.1 (REVISED) |
| **Last Updated** | 2026-05-18 (session 2) |
| **Status** | REVISED — Khang đã chốt 5/5 câu hỏi |
| **Depends on** | `SOL_BUSINESS_MODEL_CANONICAL.md` v1.0 |

---

## 0. REVISION 1.1 — KHANG ĐÃ CHỐT (2026-05-18 SESSION 2)

> **Note**: Doc v1.0 (Section 5 Sprint Plan + Section 8 Next Actions) viết theo recommendation cũ.
> Section này là **truth mới** — khi mâu thuẫn → section này thắng.

### Quyết định chốt

| # | Câu hỏi | Khang chốt | Note |
|---|---|---|---|
| 1 | Sprint priority đầu tiên | **Payment trước Voice** | Thu tiền sớm hơn |
| 2 | Pilot 30 launch khi nào | **Sau Sprint 7** | Pilot có option upgrade trả phí ngay |
| 3 | Đại Sứ Sol code khi nào | No preference → em recommend Sprint 8 | Code sẵn sàng cho graduates đầu tiên |
| 4 | Budget 6 tháng đầu | **Min 2-3tr** | Tự edit Voice + tự thiết kế Charter |
| 5 | Re-publish 104 bài + GSC | **Đã chạy xong** (verified local clean) | Đóng Task #84 |

### Sprint order REVISED

| Sprint | Nội dung | Đổi gì |
|---|---|---|
| **S5** | Payment Flow + 4 cách trả + QR code + bank confirm | ⟵ Hoán đổi với S6 cũ |
| **S6** | Voice của Khang record 9 đoạn + upload + wire trigger | ⟵ Hoán đổi với S5 cũ |
| **S7** | Refund automation + Sổ Hành Trình PDF | Giữ nguyên |
| **S8** | Đại Sứ Sol system (schema + dashboard + Charter) | Code song song với S9 prep |
| **S9** | Pilot 30 launch + monitor + analytics | Giữ nguyên |
| **S10** | Optimize + Soft launch Q4/2026 + 3-5 Đại Sứ đầu tiên | Giữ nguyên |

### Budget chốt (Min 2-3tr cho 6 tháng đầu)

| Item | Cost | Note |
|---|:---:|---|
| Mic lavalier | 300k | Sprint 5-6 |
| VPS EZTech 2GB | 200-300k/tháng × 6 = 1.2-1.8tr | Block bothuocla.sol.vn deploy |
| Backup B2 | $0.30/tháng × 6 ≈ 50k | |
| **TỔNG** | **~1.5-2.2tr** | Khang tự edit Voice + tự thiết kế Charter |

Optional fallback (nếu phòng vọng âm): thuê studio 1 buổi ~1-2tr.

### Verify 2026-05-18 session 2 (em làm)

- ✅ Source local 3 bài flagship sạch: `PILLAR-cai-thuoc-la-vinh-vien.html` (14 hit từ chuẩn), `QDAY-01-ngay-1-24-gio-dau-tien.html` (1 hit), `PILLAR-vo-giup-chong-bo-thuoc-la.html`. 0 hit từ xấu (Skill, Giọng Khang, Social trigger, Stress event, trigger, withdrawal, craving, relapse, cold turkey, willpower).
- ⚠️ Production sol.vn chưa fetch được (allowlist chặn) — anh cần add `sol.vn` vào Settings → Capabilities → Network allowlist nếu muốn em verify trực tiếp.
- ⚠️ Slug đúng: `giam-dan-ngay-13-plan-b` (KHÔNG `giam-dan-13-plan-b` — thiếu chữ "ngay" → 404).

---

## 1. EXECUTIVE SUMMARY — 60 GIÂY

Sol đã có **nền tảng kỹ thuật vững**:
- ✅ 130+ bài SEO live trên sol.vn (đang ăn Google)
- ✅ Backend Phase 1-5 đầy đủ (Zalo journey, scheduled push, SOS, memory book, Q-Day checklist)
- ✅ Admin UI cho 9 module
- ✅ Pricing canonical V3 (3 Lộ trình × 4 Cách trả)
- ✅ Multi-channel: Web, Zalo OA, FB Fanpage, FB Group

Sol còn **3 gap lớn để launch thương mại**:
1. 🔴 **Voice Khang chưa record** (9 đoạn placeholder text-only) — đây là differentiator #1
2. 🔴 **Đại Sứ Sol system chưa có code** (schema chỉ là comment) — chưa scale được
3. 🟡 **Payment flow chưa hoàn thiện** (4 cách trả mới ở UI mockup) — chưa thu được tiền

Roadmap đề xuất: **6 sprint × 2 tuần = 12 tuần** từ giờ đến hết Q3/2026, kết thúc bằng Pilot 30 anh em đầu tiên thu phí thật + 5-10 Đại Sứ tốt nghiệp lần đầu.

---

## 2. STATE OF UNION — SẢN PHẨM HIỆN TẠI

### 2.1. Đã build (assets sẵn)

| Module | State | Note |
|---|:---:|---|
| Website sol.vn (WordPress) | ✅ LIVE | 130+ bài SEO, FAQ Schema, Rank Math |
| Sol Widget (bothuocla.sol.vn) | 🟡 Code có, chưa live | Cần deploy lên VPS eztech |
| Backend API + Prisma | ✅ Phase 1-5 done | 24 cron jobs running |
| Admin Dashboard | ✅ 9 modules | Journey, SOS, Voice, Cohort, Analytics, Wiki, AI, Canned replies, Users |
| Zalo OA integration | ✅ ZNS templates + webhook | Welcome flow + SOS handler |
| Test FTND | ✅ Code | Trong onboarding flow |
| 3 Lộ trình (Light/Mod/Heavy) | ✅ Schema + cohort code | LIGHT/MODERATE/HEAVY UTM |
| 4 Cách trả | 🟡 Pricing page | Chưa có flow thanh toán thật |
| Q-Day Checklist | ✅ Code + ZNS reminder | 8 mục checklist |
| Memory Book D30 | ✅ HTML generator | Phase 5 final |
| Telegram SOS alert | ✅ Code | Khang nhận realtime |
| FB Fanpage + Group | ✅ LIVE | fb.com/sol.bothuocla |

### 2.2. Đã plan nhưng CHƯA BUILD

| Module | Priority | Hoá Block |
|---|:---:|---|
| 9 Voice Khang recordings | 🔴 P0 | Differentiator #1 — block soft launch |
| 4 Cách trả flow (Trả Thử, Tuần, Một Lần, Sau Thành Công) | 🔴 P0 | Block thu tiền |
| QR code chuyển khoản + xác nhận thủ công 24h | 🔴 P0 | Block thu tiền |
| Refund automation (14 ngày 100%, pro-rated sau) | 🟡 P1 | Có code Refund mockup, cần wire |
| Đại Sứ Sol — referral system | 🟡 P1 | Schema, code, dashboard chưa có |
| Pilot 30 tracking dashboard | 🟢 P2 | Có thể manual Google Sheet |
| Sổ Hành Trình PDF generator | 🟡 P1 | Có HTML, cần convert → PDF |
| Combo Champix/NRT recommendation flow | 🟢 P2 | External, chỉ link gợi ý |

### 2.3. Đã có nhưng cần UPGRADE

| Module | Vấn đề | Cách upgrade |
|---|---|---|
| Tier descriptions trong pricing API | Wording cũ ("voice Khang") | Đã fix Phase 3 ✓ |
| Canned replies | "Voice Khang" | Đã fix Phase 3 ✓ |
| Email funnel (emailFunnelAdaptive) | Có thể chứa wording cũ | Audit thêm khi launch |
| ZNS templates | Wording phải align canonical doc | Audit + re-test |
| Onboarding test FTND | Mapping FTND score → Light/Mod/Heavy | Verify tương thích pricing V3 |

---

## 3. GAP ANALYSIS — 10 GAP CẦN ĐÓNG TRƯỚC SOFT LAUNCH

### 🔴 P0 — Blocker thu tiền + Differentiator

**GAP 1 — Voice Khang recording (9 đoạn)**

| Detail | Value |
|---|---|
| Đoạn cần record | Ngày 0 (chào mừng), Ngày 3 (đỉnh triệu chứng cai), Ngày 7 (kết Nhận Diện), Ngày 14 (mốc 2 tuần), Ngày 22 (Q-Day Ceremony), Ngày 30 (mốc 1 tháng), Lỡ điếu (lapse), Khẩn cấp (sóng cơn thèm), Milestone (D51/D60) |
| Setup cần | Mic lavalier ~300k, iPhone 12 (Khang đã có), phòng yên tĩnh |
| Thời gian record | 1 buổi 2-3h |
| Edit | Khang tự dùng iMovie / GarageBand (~1 ngày) |
| Upload | Pipeline `seedVoices.ts` có sẵn — chỉ replace MP3 |
| Block | Đây là differentiator #1. Không có voice = sản phẩm thiếu trái tim. |

**GAP 2 — 4 Cách trả flow (Trả Thử / Tuần / Một Lần / Sau Thành Công)**

| Cách trả | Implementation |
|---|---|
| Trả Thử (49k) | Trả 1 lần, kích hoạt 7 ngày Kiểm Soát. Hoàn 100% nếu < 7 ngày. |
| Trả Tuần (25-35k) | User chuyển khoản mỗi tuần. Sol nhắc qua email/Zalo. Không tự rút. |
| Trả Một Lần (149/249/349k) | Trả 1 lần full lộ trình. 14 ngày hoàn 100%. Sau pro-rated. |
| Trả Sau Thành Công (99/199/249k) | Trả khi sạch 21+ ngày sau Ngày Quyết Định. |

Cần build:
- UI chọn cách trả (modal trong onboarding)
- QR code generator (Vietcombank/Techcombank/MB)
- Webhook ngân hàng (hoặc upload bank slip + manual confirm)
- Email/Zalo nhắc trả tuần
- Cron job check "sạch 21 ngày" → tính tiền Trả Sau

**GAP 3 — Refund automation**

- 14 ngày: 100% refund nếu user check-in ≥5 ngày
- > 14 ngày: pro-rated `(totalDays - daysUsed) / totalDays × price`
- Có sẵn UI mockup `RefundView.tsx` — cần wire backend tính + chuyển khoản tay 7 ngày làm việc

---

### 🟡 P1 — Đại Sứ system + Sổ Hành Trình

**GAP 4 — Đại Sứ Sol schema + flow**

Schema cần add:
```prisma
model Ambassador {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id])
  referralCode    String   @unique   // VD: SOL-KHANG-A1
  graduatedAt     DateTime              // ngày tốt nghiệp 90 ngày Tự do
  status          AmbassadorStatus      // ACTIVE / PAUSED / RETIRED
  totalReferrals  Int      @default(0)
  totalEarnedVnd  Int      @default(0)
  totalPaidVnd    Int      @default(0)
  bankInfo        Json?                 // bank, account, owner
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  referrals       Referral[]
  payouts         Payout[]
}

model Referral {
  id              String   @id @default(cuid())
  ambassadorId    String
  ambassador      Ambassador @relation(fields: [ambassadorId], references: [id])
  referredUserId  String   @unique
  referredUser    User     @relation(fields: [referredUserId], references: [id])
  cohort          String                 // LIGHT / MODERATE / HEAVY
  payMethod       String                 // TRY / WEEK / ONESHOT / AFTER_SUCCESS
  amountPaidVnd   Int                    // user trả (đã trừ 25% discount)
  commissionVnd   Int                    // 25% gốc giá
  commissionState ReferralCommissionState  // PENDING / EARNED / PAID
  createdAt       DateTime @default(now())
  paidAt          DateTime?
}

model Payout {
  id              String   @id @default(cuid())
  ambassadorId    String
  ambassador      Ambassador @relation(fields: [ambassadorId], references: [id])
  amountVnd       Int
  referralCount   Int
  bankTxRef       String?
  paidAt          DateTime @default(now())
  note            String?
}

enum AmbassadorStatus { ACTIVE PAUSED RETIRED }
enum ReferralCommissionState { PENDING EARNED PAID }
```

Cần build:
- Auto-detect user qualified (90 ngày Tự do) → email mời Đại Sứ
- Charter ký online (1 trang T&C)
- Tạo `referralCode` unique
- Mã giảm giá flow (user nhập code → 25% off)
- Commission tracking dashboard
- Payout flow manual (Sol chuyển tay cuối mỗi tháng)

**GAP 5 — Sổ Hành Trình PDF generator**

- HTML template đã có (Phase 5 Memory Book)
- Cần: Puppeteer/Playwright server-side render → PDF
- Lưu vào storage + email link cho user
- Trigger: tốt nghiệp lộ trình (D35/D52/D65)

---

### 🟢 P2 — Quality of life

**GAP 6 — Pilot 30 management**

- Manual: Google Sheet tracker (Khang OK với manual)
- Auto: dashboard riêng cho Pilot users (badge, interview scheduling, lễ Tốt Nghiệp)

**GAP 7 — Onboarding test FTND → cohort assignment**

Verify code hiện tại có map đúng FTND score → LIGHT/MODERATE/HEAVY cohort không. Cần test với 3 user persona.

**GAP 8 — Combo Champix/NRT recommendation**

External — chỉ cần page tĩnh "Sol + NRT theo BS" + 1 bài hướng dẫn. Không tích hợp.

**GAP 9 — Communication audit recurring**

Quarterly: chạy `messaging-fix.js` audit lại toàn project. Có rule mới thì update script.

**GAP 10 — Analytics + conversion funnel**

- Track: visit /gia → click cohort → onboarding → test FTND → 7 ngày Nhận Diện → upgrade trả phí
- Tools: Cloudflare Analytics (free) + custom DB events + Google Search Console

---

## 4. ROADMAP ĐẠI SỨ SOL — 4 STAGES (12 THÁNG)

### Stage 0 — Pre-launch (Now — Q3/2026 đầu)

**Mục tiêu**: 0 Đại Sứ. Tập trung Pilot 30.

- Khang record 9 Voice
- Build 4 Cách trả + Refund
- Soft launch Pilot 30 anh em (FREE 100%)
- Theo dõi 30 anh em qua 3 lộ trình
- Thu thập case studies thật + testimonial

**Output**: 30 user trải nghiệm full sản phẩm + bug reports + testimonial real.

### Stage 1 — Soft Launch (Q3/2026 cuối — Q4/2026)

**Mục tiêu**: 3-5 Đại Sứ đầu tiên (từ Pilot 30 tốt nghiệp 90 ngày).

- Build Đại Sứ schema + onboarding charter
- 3-5 anh em tốt nghiệp → mời Đại Sứ chính thức
- Mã giới thiệu manual (Khang tự tạo)
- Commission tracking Google Sheet (Khang record tay)
- Payout manual mỗi tháng (Khang chuyển tay)

**Target Q4/2026**: 100 paid users (3 Đại Sứ × ~30 đơn mỗi = 90 referrals + 10 organic).

### Stage 2 — Scale (Q1/2027 — Q2/2027)

**Mục tiêu**: 20-50 Đại Sứ active.

- Build Đại Sứ dashboard riêng (xem đơn, hoa hồng, history)
- Auto-detect qualified user → email mời tự động
- Mã giới thiệu auto-generate
- Commission tracking automation (vẫn payout manual)
- Đại Sứ newsletter (Khang gửi monthly)

**Target Q2/2027**: 1,000 paid users / quý + 50 Đại Sứ active.

### Stage 3 — Mature (Q3/2027+)

**Mục tiêu**: 100+ Đại Sứ, semi-automated.

- Tích hợp payment gateway (Momo, VNPay, ZaloPay)
- Auto payout commission (cuối mỗi tháng tự chuyển khoản)
- Đại Sứ regional (theo tỉnh) hoặc theo niche (cho người mang thai, người tiểu đường, người 60+)
- Anniversary system — Đại Sứ làm 1 năm nhận badge + bonus

**Target 2028**: 10,000 paid users + 200 Đại Sứ.

---

## 5. SPRINT PLAN — 6 SPRINT × 2 TUẦN = 12 TUẦN

### Sprint 5 — Voice Khang Recording + Integration (2 tuần)

**Tuần 1**:
- D1-2: Khang mua mic lavalier + setup phòng record
- D3-4: Khang record 9 đoạn voice (theo script đã viết VIDEO_SCRIPTS_12_WEEKS hoặc viết script voice riêng)
- D5-7: Khang edit cơ bản trong iMovie

**Tuần 2**:
- D8-10: Upload 9 MP3 vào VoiceMessage table (script seedVoices.ts đã có)
- D11-12: Wire trigger auto-deliver (Phase 5 schema đã có)
- D13-14: QA test với user persona

**Output**: 9 Voice của Khang LIVE trong app. Differentiator #1 ON.

---

### Sprint 6 — 4 Cách Trả + Payment Flow (2 tuần)

**Tuần 1**:
- D1-3: UI 4 cách trả (modal trong onboarding)
- D4-5: QR code generator (3 bank: VCB/TCB/MB)
- D6-7: Bank slip upload + admin confirm flow

**Tuần 2**:
- D8-10: Cron job: nhắc Trả Tuần qua email/Zalo
- D11-12: Cron job: detect "sạch 21+ ngày" → enable Trả Sau Thành Công
- D13-14: QA test với 4 cách

**Output**: Sol thu được tiền thật. Pilot 30 chuyển dần sang paid.

---

### Sprint 7 — Refund Automation + Sổ Hành Trình PDF (2 tuần)

**Tuần 1**:
- D1-4: Refund flow (14 ngày 100% / > 14 pro-rated)
- D5-7: UI Refund admin queue (Khang approve)

**Tuần 2**:
- D8-10: Sổ Hành Trình PDF generator (Puppeteer + HTML template Phase 5)
- D11-13: Trigger D35/D52/D65 → auto-email user PDF
- D14: QA test

**Output**: User được protect (refund) + nhận PDF kỉ niệm cuối lộ trình.

---

### Sprint 8 — Đại Sứ Sol System (2 tuần)

**Tuần 1**:
- D1-2: Prisma schema (Ambassador, Referral, Payout)
- D3-4: Migration + seed test data
- D5-7: API endpoints (create ambassador, referral tracking, commission calc)

**Tuần 2**:
- D8-10: Đại Sứ dashboard (xem đơn, hoa hồng, history)
- D11-12: Charter ký online (T&C 1 trang)
- D13-14: QA + soft launch với 1 Đại Sứ test

**Output**: Đại Sứ Sol system v1 — manual payout nhưng tracking + UI đầy đủ.

---

### Sprint 9 — Pilot 30 Soft Launch + Analytics (2 tuần)

**Tuần 1**:
- D1-3: Mời 30 anh em qua Fanpage / Group / FB Profile
- D4-5: Onboarding 30 user — assign cohort qua FTND test
- D6-7: Setup tracking Google Sheet + admin Pilot dashboard

**Tuần 2**:
- D8-10: Daily check-in monitor (Khang theo dõi)
- D11-12: Setup conversion funnel analytics
- D13-14: Báo cáo tuần 1 Pilot

**Output**: 30 anh em đang đi lộ trình thực. Có real-time data về drop-off, friction.

---

### Sprint 10 — Optimize + Launch Q4 (2 tuần)

**Tuần 1**:
- D1-3: A/B test pricing (Trả Một Lần vs Trả Tuần)
- D4-5: Re-engagement campaign cho user drop-off Day 7
- D6-7: Bug fixes từ Pilot

**Tuần 2**:
- D8-10: Promotion Q4 — quảng bá ra ngoài Pilot
- D11-12: 3-5 Đại Sứ đầu tiên onboard (từ Pilot tốt nghiệp)
- D13-14: Soft launch Q4/2026

**Output**: Sol chính thức commercial. Target 100 paid user / Q4/2026.

---

## 6. SUCCESS METRICS — KPIs

### Stage 0 — Pilot 30 (Sprint 5-9)

| KPI | Target | Stretch |
|---|:---:|:---:|
| Pilot signups | 30 | 50 |
| Day 7 retention | 70% | 85% |
| Day 30 retention | 50% | 70% |
| Tốt nghiệp lộ trình | 15/30 | 25/30 |
| Bug reports actionable | 20+ | 50+ |
| Testimonial real | 10 | 25 |

### Stage 1 — Soft Launch Q4/2026 (Sprint 10+)

| KPI | Target | Stretch |
|---|:---:|:---:|
| Paid users | 100 | 250 |
| Đại Sứ active | 3 | 10 |
| Conversion 7-ngày → paid | 15% | 30% |
| Revenue Q4 | 15M VND | 50M VND |
| FB Fanpage followers | 5,000 | 10,000 |
| sol.vn organic traffic | 10K/tháng | 30K/tháng |

### Stage 2 — 2027

| KPI | Target |
|---|:---:|
| Paid users cumulative | 5,000 |
| Đại Sứ active | 50 |
| Revenue/tháng peak | 200M VND |
| Tốt nghiệp 90 ngày Tự do | 500 |

---

## 7. RISKS + MITIGATIONS

### R1 — Khang burnout (solo founder)

**Risk**: 1 người làm cả product + content + support + ambassador = mệt mỏi.

**Mitigation**:
- Auto càng nhiều càng tốt (cron jobs, scheduled push, canned replies)
- Đại Sứ làm phần "lan toả" thay Khang
- Định kỳ ngắt — 1 tuần off mỗi quarter
- Limit working hours: 6h/ngày, không weekend

### R2 — Pilot 30 không đủ user

**Risk**: 30 anh em đầu là Pilot FREE 100% — nếu không có 30 ứng viên qualified, soft launch trễ.

**Mitigation**:
- Có 2,500 friend FB của Khang — chỉ cần 1.2% convert → đủ 30
- FB Fanpage + Group có thể recruit
- Sol đã có brand awareness qua 130+ bài SEO

### R3 — Voice Khang record kém chất lượng

**Risk**: iPhone 12 + mic lavalier có thể chưa đủ pro nếu phòng vọng âm.

**Mitigation**:
- Test record 1 đoạn trước
- Nếu kém — thuê studio 1 buổi (~1-2tr)
- Hoặc fallback: dùng audio editing software (Audacity) noise reduction

### R4 — Pricing quá rẻ (149-349k) — không bù chi phí

**Risk**: Server + AI API + voice hosting + commission Đại Sứ = chi phí biên cao.

**Mitigation**:
- Calculate unit economics chính xác
- Cloudflare CDN cache nhiều (giảm origin cost)
- AI có quota limit theo tier (free 3-5 tin/ngày, paid 30 tin/ngày)
- Đàm phán enterprise plan với OpenAI/Anthropic khi có volume

### R5 — Đại Sứ Sol bị hiểu nhầm là MLM

**Risk**: Tâm lý Việt Nam dị ứng MLM. "Hoa hồng giới thiệu" có thể bị quy là đa cấp.

**Mitigation**:
- Trong tất cả communication: nhấn mạnh **TRỰC TIẾP, SINGLE-TIER, KHÔNG TUYẾN DƯỚI**
- Charter Đại Sứ ghi rõ: "Tôi giới thiệu Sol, không tuyển team"
- Khang public về policy này (FB post, video)
- Pricing transparent — user thấy giảm 25% rõ ràng

### R6 — Refund abuse

**Risk**: User lạm dụng "Hoàn tiền 100% trong 14 ngày" — đăng ký rồi refund liên tục.

**Mitigation**:
- Điều kiện: phải check-in ≥5 ngày để qualifying refund
- Track email/SĐT trùng — flag pattern
- Sau 3 lần refund cùng SĐT — ban future signups

---

## 8. NEXT ACTIONS — KHANG QUYẾT ĐỊNH

> **⚠️ SUPERSEDED**: 5 câu hỏi dưới đây đã được Khang trả lời 2026-05-18 session 2. Xem Section 0 (REVISION 1.1) để biết quyết định chốt.


### 🎯 Câu hỏi 1: Sprint priority?

Em đề xuất thứ tự **Sprint 5 → 6 → 7 → 8 → 9 → 10** vì:
- Voice Khang record TRƯỚC vì là differentiator + cần 1-2 tuần edit + upload
- Payment flow SAU vì chỉ cần khi có user paid

**Alternative**: Sprint 6 (Payment) → 5 (Voice) → ...  nếu muốn thu tiền sớm

→ **Em recommend giữ Sprint 5 đầu** (Voice). Anh chốt?

### 🎯 Câu hỏi 2: Pilot 30 launch khi nào?

- **(A)** Sau Sprint 5 (Voice ready, chưa có payment) — Pilot FREE 100%, không cần thu
- **(B)** Sau Sprint 7 (Voice + Payment + Refund ready) — Pilot có option upgrade trả phí
- **(C)** Em recommend **(A)** — Pilot FREE bù testimonial, payment build song song

→ Anh chốt?

### 🎯 Câu hỏi 3: Đại Sứ Sol code khi nào?

- **(A)** Sprint 8 (12 tuần nữa) — sau khi Pilot 30 có 5-10 anh em tốt nghiệp
- **(B)** Sớm hơn — Sprint 6 song song với Payment
- **(C)** Em recommend **(A)** — đợi có Đại Sứ thật rồi build, tránh build code không dùng

→ Anh chốt?

### 🎯 Câu hỏi 4: Budget bổ sung?

| Item | Cost | Optional? |
|---|:---:|:---:|
| Mic lavalier | 300k | NO |
| Studio voice (backup) | 1-2tr | YES (nếu phòng vọng âm) |
| Domain bothuocla.sol.vn SSL | 0đ (Let's Encrypt) | NO |
| VPS eztech 2GB | 200-300k/tháng × 6 tháng | NO |
| Backup B2 | $0.30/tháng × 6 | NO |
| Designer Đại Sứ Charter PDF | 500k (1 lần) | YES |
| Editor 9 voice + intro music | 1-2tr (1 lần, freelancer) | YES |

**TỔNG min**: ~2-3tr cho 6 tháng đầu.
**TỔNG có optional**: ~6-8tr.

→ Anh OK budget này không? Cần em đề xuất tối ưu thêm?

### 🎯 Câu hỏi 5: Sprint #84 (re-publish 104 bài) — khi nào chạy?

Hiện đang `in_progress`. Sau Phase 3 fix messaging + Voice Khang, 44 bài đã có fix mới. Cần re-publish.

- **(A)** Anh chạy NGAY (em đã có script) — 1-2 giờ + GSC re-index
- **(B)** Chạy sau Sprint 5 (cùng đợt với canonical doc + Voice Khang launch)
- **(C)** Em recommend **(A)** — fix messaging càng sớm càng tốt, Google đang index

→ Anh chốt?

---

**Anh review doc này — đặc biệt phần Roadmap Đại Sứ 4 stages + Sprint plan 6 sprints. Trả lời 5 câu hỏi → em sẽ refine + start Sprint 5 luôn.**

---

## REFERENCES

- `SOL_BUSINESS_MODEL_CANONICAL.md` v1.0 — Source of Truth pricing/business
- `GIA-pricing-page-v3.html` — Pricing page detail
- `SPRINT_1_FINAL_REPORT.md` — Tone rule "Người đã đi qua"
- Phase 1-5 backend code đã ship

---

**END OF PHASE 4 DELIVERABLE**

*Update version khi Khang feedback hoặc khi Sprint hoàn thành.*
