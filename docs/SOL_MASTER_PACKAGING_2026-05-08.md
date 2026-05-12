# Sol — Master Packaging Document
## Đối tác + Sol hiện trạng → Đóng gói cuối cùng

**Ngày:** 2026-05-08
**Mục đích:** Document master để Khang + Sol đối chiếu triển khai. Mọi quyết định packaging đều quay về đây.
**Reference các tài liệu đã có:**
- `SOL_DELIVERY_SPEC_2026-05-08.md` — đặc tả 4 gói chi tiết
- `SOL_PRODUCT_PACKAGING_2026-05-08.md` — outcome cụ thể
- `POSITIONING_LAY_LAI_QUYEN_LAM_CHU_2026-05-08.md` — định vị
- `SOL_HUA_VA_GIUP.md` — sòng phẳng
- `MUC_TIEU_RO_RANG_KHONG_OVERPROMISE_2026-05-08.md` — outcome rule
- `SCIENCE_AUDIT_2026-05-08.md` — evidence backing
- `GIAI_PHAP_THI_TRUONG_VIET_2026-05-08.md` — pivot business model
- `STRATEGIC_USER_ANALYSIS_2026-05-08.md` — user journey phân tích

---

## Phần 1 — Tổng hợp insight đối tác (3 cuộc trao đổi)

Đối tác đã đưa ra **6 breakthrough insights** quan trọng nhất:

### Insight 1 — Sol KHÔNG bán "bỏ thuốc"
Sai: bán endpoint outcome ("bỏ 100%")
Đúng: bán **process outcome** ("lấy lại quyền làm chủ", "bớt hút vô thức")

### Insight 2 — Lapse là bình thường, không phải fail
Behavioral science: relapse là 1 bước trong tiến trình.
Sol = **relapse-safe environment** — đây là moat thật.

### Insight 3 — Slogan có MEANING nhưng chưa có MECHANISM
"Đi Cùng Sol — Bỏ thuốc lá khi nào anh quyết" tốt cho cảm xúc, **chưa đủ** để user hiểu họ mua gì.

### Insight 4 — Sol cần 3 LỚP định vị
- Lớp 1: BRAND MESSAGE (cảm xúc) — slogan
- Lớp 2: PRODUCT PROMISE (cụ thể) — "14 ngày giúp anh hiểu cơn thèm + giảm hút vô thức..."
- Lớp 3: MEASURABLE OUTCOME (lượng hóa) — checklist + score

### Insight 5 — Chỉ số Làm Chủ (Control Score 0-100) — BREAKTHROUGH METRIC
Đo agency của user, không đo abstinence. Đây là **metric system mới** Sol cần build.

### Insight 6 — Framework progression Sol Start → Control → Freedom
3 stage thay vì 4 chặng cũ. Đặt tên match định vị "làm chủ".

---

## Phần 2 — Hiện trạng Sol (anh em mình đang có)

### Đã có ✅
- **Tech stack đầy đủ**: dashboard / admin / widget / cross-domain JWT / AI / email / Prisma DB
- **5 landing pages**: hub `/bo-thuoc-la` + 4 chunked + homepage
- **Tier system 4 cấp**: Mở Đầu (free) / Khởi Động (70k) / Tự Do (140k) / Trọn Vẹn (210k)
- **Email funnel 14 templates** Day 0-88
- **Anonymous-first onboarding** (không cần SĐT)
- **Cross-domain widget** sol.vn → bothuocla.sol.vn
- **Wiki content** 41 bài + Ngẫm category
- **Khang's Story** đầy đủ 5 lần fail
- **Lapse-friendly UX concept** (chưa wire code)
- **Refund policy** (chưa formalize đủ)

### Chưa có ❌
- **Control Score system** (insight mới của đối tác)
- **Voice Khang record** (9-12 MP3)
- **Quick Win Day 3 báo cáo cá nhân**
- **Conscious vs Unconscious smoking tracking**
- **Q-Day flexible** (hiện tại Day 21 fixed)
- **Adaptive email funnel** (hiện tại fixed Day 0-88)
- **Membership recurring 99k/tháng**
- **Community Zalo group** (3 tầng)
- **Refund flow + admin tool**
- **Phase 2 Đời Sạch content**

### Đang lệch ⚠️
- **Naming tier**: Mở Đầu / Khởi Động / Tự Do / Trọn Vẹn — không match insight mới "làm chủ"
- **52 ngày (51d Sol-active + Day 52 lễ tốt nghiệp) fixed** — không match tagline "anh quyết khi nào"
- **Marketing claim** đang đi trước product (nói nhiều hơn deliver)

---

## Phần 3 — Đóng gói 3 lớp cho mỗi gói

Đối tác đề xuất 3 lớp. Em refine + apply cho 4 gói Sol:

### Cấu trúc 3 lớp

| Lớp | Mục đích | Ví dụ |
|---|---|---|
| **Lớp 1 — BRAND MESSAGE** | Mở lòng (cảm xúc) | "Đi Cùng Sol — Bỏ thuốc lá khi nào anh quyết" |
| **Lớp 2 — PRODUCT PROMISE** | Hiểu mua gì (cụ thể) | "14 ngày giúp anh hiểu cơn thèm, giảm hút vô thức..." |
| **Lớp 3 — MEASURABLE OUTCOME** | Đo tiến bộ (lượng hóa) | Control Score 0→40, checklist 5 mục đạt được |

→ Mỗi gói phải có đủ 3 lớp.

---

## Phần 4 — Chỉ số Làm Chủ (Control Score) — METRIC HỆ THỐNG MỚI

Đây là **breakthrough idea** của đối tác. Em refine thành system cụ thể wire trong app.

### Định nghĩa

**Control Score** = chỉ số 0-100 đo **agency của user trên thuốc lá**.
KHÔNG đo "đã bỏ chưa".
ĐO "anh đang làm chủ thế nào".

### 5 component (mỗi component 0-20 điểm = total 0-100)

| Component | Đo gì | Cách tính |
|---|---|---|
| **A. Awareness** (0-20) | Anh hiểu mình đến đâu | % ngày anh log + biết trigger top 3 + đã đọc wiki |
| **B. Conscious choice** (0-20) | % điếu hút có ý thức | (Conscious / Total) × 20 |
| **C. Delay capacity** (0-20) | Khả năng trì hoãn cơn thèm | Delay time trung bình × 2 (capped at 20) |
| **D. Reduction** (0-20) | Giảm so baseline | (1 - current/baseline) × 20 |
| **E. Resilience** (0-20) | Quay lại sau lapse | 20 - (avg lapse-recovery hours) |

→ Total: **0-100**.

### Phân ngưỡng — User feel "tiến bộ"

| Ngưỡng | Tên | Ý nghĩa |
|---|---|---|
| 0-19 | Chưa nhận ra | Mới start, chưa quan sát |
| 20-39 | Đang nhận ra | Hiểu mình hút lúc nào, vì sao |
| 40-59 | Đang làm chủ | Trì hoãn được, giảm rõ rệt |
| 60-79 | Làm chủ rõ | Sạch nhiều ngày, lapse-recovery nhanh |
| 80-100 | Tự do | Sạch dài, không tự trách khi lapse |

→ **User cảm thấy tiến bộ MỖI NGÀY** — không phải đợi 52 ngày (51d Sol-active + Day 52 lễ tốt nghiệp) để biết "thành công" hay "fail".

### Hiển thị trong app

Dashboard chính có 1 widget lớn:

```
┌─────────────────────────────────────┐
│  CHỈ SỐ LÀM CHỦ CỦA ANH             │
│                                      │
│  ████████████░░░░░░░░  47/100        │
│                                      │
│  Đang làm chủ — Anh đã đi được       │
│  47% chặng đường lấy lại.            │
│                                      │
│  Tuần này +8 điểm so tuần trước.     │
└─────────────────────────────────────┘
```

→ Đây là **dopamine progress** — match insight đối tác "user cần thấy thắng nhỏ".

### Marketing claim được phép với Control Score

Sol có thể nói:
- ✅ "Đa số anh em đi cùng Sol đạt Control Score 60+ trong 3 tháng"
- ✅ "Anh A đi cùng Sol đạt Control Score 80 — anh ấy nói lần đầu sau 25 năm thấy mình quyết được"
- ✅ "Sol 14 (99k) target Control Score +25 điểm trong 14 ngày"

**Không bao giờ nói:**
- ❌ "Sol giúp anh bỏ thuốc 100%"
- ❌ "Sau Sol anh sẽ không bao giờ hút lại"

→ Control Score là **ngôn ngữ chung** giữa Sol và user. Honest. Measurable. Lapse-safe.

---

## Phần 5 — 4 gói Sol packaged đầy đủ

### **GÓI 1 — Sol Khám Phá** (free, 7 ngày)

**Lớp 1 BRAND:** "Sol giúp anh hiểu mình — chưa cần quyết gì cả."

**Lớp 2 PROMISE:**
> 7 ngày đầu giúp anh:
> - hiểu vì sao mình hút
> - thấy 5 trigger lớn nhất của riêng mình
> - biết số điếu thật trung bình/ngày
> - lần đầu sau 25 năm anh nhìn rõ chính mình

**Lớp 3 OUTCOME (measurable):**
- ☐ Control Score: 0 → **20-30** sau 7 ngày
- ☐ Báo cáo nhanh Day 3 + báo cáo đầy đủ Day 7
- ☐ Biết 5 trigger top
- ☐ Đọc 3 bài wiki cơ bản
- ☐ Nghe 2 voice Khang

**Phù hợp:** Anh chưa quyết bỏ. Anh chỉ muốn nhìn lại mình một lần xem sao.

**Sol KHÔNG hứa:** giảm điếu, sẵn sàng Q-Day, bỏ thuốc.

**Refund:** N/A (free).

---

### **GÓI 2 — Sol Start** (99k, 14 ngày) — đổi tên từ "Khởi Động"

**Lớp 1 BRAND:** "Sol giúp anh bắt đầu làm chủ — không cần bỏ ngay."

**Lớp 2 PROMISE:**
> 14 ngày giúp anh:
> - hiểu cơn thèm và cơ chế nó
> - giảm hút vô thức
> - vượt qua trigger cà phê / sau bữa / stress
> - xử lý relapse không tự trách
> - bắt đầu thấy mình kiểm soát hơn

**Lớp 3 OUTCOME (measurable):**
- ☐ Control Score: 20-30 → **40-55** sau 14 ngày (đa số)
- ☐ Giảm 20-40% **hút vô thức** (Component B của Control Score)
- ☐ Delay được cơn thèm 5-15 phút (Component C)
- ☐ Bẻ 2-3 thói quen tự động
- ☐ Plan B viết tay cho 5 trigger lớn
- ☐ Có ít nhất 1 ngày trong 14 ngày hút < 50% baseline
- ☐ Khi lapse, quay lại trong 24h

**Phù hợp:** Anh muốn thử nhẹ. 14 ngày — không 52 ngày (51d Sol-active + Day 52 lễ tốt nghiệp) — không Q-Day.

**Sol KHÔNG hứa:** Q-Day, bỏ thuốc, giảm tổng điếu (chỉ giảm vô thức).

**Refund:** Sau 14 ngày, không thấy Control Score tăng → trả 99k. Không hỏi.

---

### **GÓI 3 — Sol Control** (99k/tháng, recurring) — đổi tên từ "Tự Do"

**Lớp 1 BRAND:** "Sol đi cùng — anh quyết Q-Day khi nào sẵn sàng."

**Lớp 2 PROMISE:**
> Anh nhận được tất cả Sol Start, cộng:
> - Q-Day chính thức — anh chọn ngày bất kỳ
> - 9 voice Khang ở các mốc quan trọng
> - 1 voice mới/tuần trong cohort
> - Lapse-recovery 24h với voice "Một điếu không phải fail"
> - Cộng đồng Zalo private 30-50 anh em
> - AI chat unlimited + crisis mode

**Lớp 3 OUTCOME (measurable):**
- ☐ Control Score: 40-55 → **60-80** trong 1-3 tháng
- ☐ Có Q-Day chính thức (anh chọn)
- ☐ Giảm 60-80% điếu so baseline (Component D)
- ☐ Lapse-recovery 24h (Component E)
- ☐ 30 ngày sạch liên tiếp (đa số đạt)
- ☐ Có 3+ anh em trong cohort biết tên anh

**Phù hợp:** Anh đã quyết. Cần đồng hành dài. Không bị áp lực timeline.

**Sol KHÔNG hứa:** bỏ 100% mãi mãi, không relapse, timeline cụ thể.

**Refund:** Tháng đầu nếu Control Score không tăng → trả 99k. Sau hủy bất kỳ tháng nào, không refund tháng đã dùng.

---

### **GÓI 4 — Sol Freedom** (1.890k lifetime) — đổi tên từ "Trọn Vẹn"

**Lớp 1 BRAND:** "Sol đi cùng anh đời người."

**Lớp 2 PROMISE:**
> Anh nhận được tất cả Sol Control **lifetime**, cộng:
> - Phase 2 "Đời Sạch" lifetime: Sleep, Stress, Cha-con, Tài chính
> - 1 voice Khang mới/tháng forever
> - Inner Circle 10-20 anh em alumni
> - Voice riêng mốc 100/365/1000 ngày
> - Workshop Q-Day live (1/quý) included
> - 30% commission khi giới thiệu

**Lớp 3 OUTCOME (measurable):**
- ☐ Control Score: maintain **80+** dài hạn
- ☐ Phase 2 Đời Sạch progress (mỗi mảng có score riêng)
- ☐ Inner Circle activity ≥1 lần/tháng
- ☐ Voice Khang nhận đều mỗi tháng
- ☐ (Optional) Affiliate commission đã nhận

**Phù hợp:** Anh muốn Sol đi cùng đời, không phải product transactional 52 ngày (51d Sol-active + Day 52 lễ tốt nghiệp).

**Sol KHÔNG hứa:** bỏ 100%, không relapse, Sol chạy mãi (refund pro-rata nếu Sol đóng).

**Refund:** 30 ngày đầu refund 100%. Sau không refund. Sol đóng cửa: pro-rata theo 5 năm.

---

## Phần 6 — Đổi naming tier — quyết định chiến lược

Đối tác đề xuất framework **Sol Start → Sol Control → Sol Freedom** match định vị "làm chủ".

### So sánh

| Cũ | Mới (đối tác) | Em recommend |
|---|---|---|
| Mở Đầu | Khám Phá | **Khám Phá** ✅ |
| Khởi Động | Sol Start | **Sol Start** ✅ |
| Tự Do | Sol Control | **Sol Control** ✅ |
| Trọn Vẹn | Sol Freedom | **Sol Freedom** ✅ |

### Tại sao đổi

1. **Mở Đầu / Khởi Động** đều nghĩa "bắt đầu" — overlap. **Khám Phá** rõ hơn intent (chưa quyết, chỉ explore).
2. **Tự Do** ở giai đoạn 52 ngày (51d Sol-active + Day 52 lễ tốt nghiệp) là sai timing — phải là Freedom (sau khi đã Control). **Sol Control** ở 52 ngày (51d Sol-active + Day 52 lễ tốt nghiệp) đúng hơn.
3. **Trọn Vẹn** là từ trừu tượng. **Sol Freedom** = ý nghĩa rõ + match brand.
4. Naming **Sol [X]** là pattern dễ scale (Sol Health, Sol Mind, Sol Family ở Phase 2).

### Trade-off em phải chỉ ra

- ❌ Khang đã invest **brand "Mở Đầu / Khởi Động / Tự Do / Trọn Vẹn"** vào landing pages, email, app UI, SVG OG images.
- ❌ Đổi naming = phải re-render toàn bộ tài sản brand.
- ✅ Nhưng Sol vẫn early stage — đổi giờ rẻ hơn đổi sau 1 năm.

→ Em recommend **đổi tên ngay tuần này** trước khi Khang build thêm tài sản brand mới.

---

## Phần 7 — Cross-check Marketing claim vs Product feature

Bảng này đảm bảo **mọi cam kết marketing đều có chân**:

| # | Marketing claim | Tier | Code task | Status |
|---|---|---|---|---|
| 1 | "Báo cáo cá nhân Day 7" | Khám Phá | 🆕 build | ❌ |
| 2 | "Voice Khang Day 0/7" | Khám Phá | #43 | ❌ |
| 3 | "Báo cáo nhanh Day 3" | Khám Phá | #66 | ❌ |
| 4 | "AI 5 msg/ngày" | Khám Phá | ✅ | ✅ |
| 5 | "Cộng đồng Zalo public" | Khám Phá | #60 | ❌ |
| 6 | **"Control Score 0-100"** | All | 🆕 build mới | ❌ |
| 7 | **"Conscious vs Unconscious tracking"** | Sol Start | #71 | ❌ |
| 8 | "Delay 5-15 phút" | Sol Start | 🆕 build | ❌ |
| 9 | "Bẻ 2-3 thói quen" | Sol Start | 🆕 build | ❌ |
| 10 | "Plan B viết tay" | Sol Start | 🟡 có cơ bản | 🟡 |
| 11 | "4 voice Khang trong 14 ngày" | Sol Start | #43 | ❌ |
| 12 | "Q-Day flexible anh chọn" | Sol Control | #64 | ❌ |
| 13 | "9 voice Khang milestones" | Sol Control | #43 | ❌ |
| 14 | "Voice mới hàng tuần" | Sol Control | #43 ext | ❌ |
| 15 | "Lapse 24h recovery" | Sol Control | #44 | ❌ |
| 16 | "Zalo private cohort 30-50" | Sol Control | #60 | ❌ |
| 17 | "AI crisis mode" | Sol Control | 🆕 build | ❌ |
| 18 | "Hủy bất kỳ tháng nào" | Sol Control | #59 | ❌ |
| 19 | "Phase 2 Đời Sạch lifetime" | Sol Freedom | 🆕 build lớn | ❌ |
| 20 | "Voice Khang monthly forever" | Sol Freedom | #43 ext | ❌ |
| 21 | "Inner Circle 10-20" | Sol Freedom | #60 ext | ❌ |
| 22 | "Workshop Q-Day quarterly" | Sol Freedom | 🆕 build | ❌ |
| 23 | "30% affiliate commission" | Sol Freedom | 🆕 build | ❌ |
| 24 | "Refund 100% no-questions" | All | #70 | ❌ |
| 25 | "Lapse-friendly UX" | All paid | #44 | ❌ |
| 26 | "Anonymous JWT" | All | ✅ | ✅ |
| 27 | "Cross-domain widget" | All | ✅ | ✅ |

→ **3/27 đã có** (AI quota + Anonymous + Widget).
→ **24/27 cần build** trước launch full.

→ **Không marketing claim nào trên không có chân.** Quy tắc đơn giản: nếu chưa build → không nói.

---

## Phần 8 — Roadmap 8 tuần

### Tuần 1-2 (P0 critical — block toàn bộ launch)
1. **Voice Khang record 12 MP3** (Task #43) — 4 giờ thu
2. **Lapse-friendly UX** (Task #44) — 1 tuần code
3. **Quick Win Day 3 báo cáo** (Task #66)
4. **Tạo tier Sol Start 99k** (Task #67, #68)
5. **Đổi naming tier** (🆕 task — re-render landing + app UI)

### Tuần 3-4 (P0 — Sol Control launch)
6. **Build Control Score system** (🆕 task LỚN — 1-2 tuần code)
7. **Track Conscious vs Unconscious** (Task #71)
8. **Q-Day flexible** (Task #64)
9. **Adaptive email funnel** (Task #63)
10. **Membership 99k/tháng cancel anytime** (Task #59)

### Tuần 5-6 (P1 retention)
11. **Tạo Zalo public + private cohort** (Task #60)
12. **Day 7 + Day 14 full report dashboard** (Task #69)
13. **Mindfulness urge surfing module** (Task #48)
14. **5 micro-win wire** (Task #61)

### Tuần 7-8 (P1 pilot prep)
15. **Refund flow + admin tool** (Task #70)
16. **AI crisis mode** (🆕 task)
17. **CBT framework AI prompt** (Task #46)
18. **Disclaimer + refund policy publish** (🆕 task)

### Tháng 3-4 (Pilot)
19. **Pilot 100 anh em đầu** (Task #50)
20. Đo Control Score progression theo tier
21. Phỏng vấn 5-10 user/tuần

### Tháng 6+ (Phase 2 + B2B)
22. Phase 2 Đời Sạch content (Sleep/Stress/Cha-con/Tài chính)
23. Workshop quarterly
24. B2B Sol Doanh Nghiệp

---

## Phần 9 — 5 quyết định Khang phải take

### 1. Đồng ý đổi naming tier?
Mở Đầu → **Khám Phá**
Khởi Động → **Sol Start**
Tự Do → **Sol Control**
Trọn Vẹn → **Sol Freedom**

→ Đổi: Sol đồng nhất với định vị "làm chủ" + scale Phase 2 dễ.
→ Giữ: Tiết kiệm re-render brand assets.

### 2. Đồng ý build Control Score system?
Đây là metric system **mới** Sol cần build (1-2 tuần code).
Lợi: ngôn ngữ chung, dopamine progress, marketing measurable.
Trade-off: thời gian dev, complexity quản lý.

### 3. Đồng ý đổi pricing model?
4 tier mới: **Khám Phá free / Sol Start 99k one-time / Sol Control 99k/tháng / Sol Freedom 1.890k lifetime**.
Khác hiện tại: thêm Sol Start entry, Sol Control là recurring (không one-time).

### 4. Đồng ý timeline 8 tuần?
Khang ổn với roadmap không? Có cần delay item nào?

### 5. Đồng ý nguyên tắc cứng "không có chân không nói"?
Mọi marketing claim phải có code feature + dashboard hiển thị + test pass.
→ Sẽ dẫn tới: marketing copy ngắn hơn, claim ít hơn nhưng đáng tin hơn.

---

## Phần 10 — Ý nghĩa cuối cùng

### Sol đang có gì độc nhất?

1. **Khang's Story thật** — n=1 nhưng n=1 không fake được
2. **Anonymous-first onboarding** — đã wire
3. **Cross-domain widget** — đã wire
4. **Cultural fit Việt 45+** — content Việt, voice Việt, peer Việt
5. **Định vị "Lấy lại quyền làm chủ"** — đã wire

### Sol cần thêm gì để bán được hoàn chỉnh?

1. **Control Score system** — ngôn ngữ chung Sol↔User
2. **3 lớp đóng gói mỗi gói** — Brand + Promise + Outcome
3. **Voice Khang record** — vũ khí mạnh nhất chưa lên đạn
4. **Lapse-safe UX wire** — moat thật
5. **Community Zalo 3 tầng** — retention
6. **Refund flow + admin** — trust

### Khi đủ 6 thứ trên → Sol có thể launch public

Trước đó: pilot 100 anh em đầu để confirm outcome thật.

→ **Đây là document Khang dùng đối chiếu mỗi quyết định**.

---

## Phụ lục — Câu Khang dùng trong sales (refined)

### Pitch ngắn 30 giây

> "Sol không bán app cai thuốc. Sol bán **đồng hành lấy lại quyền làm chủ**.
>
> Anh trả 99k/tháng — Sol đi cùng anh:
> - Hiểu vì sao anh hút (Control Score component A)
> - Giảm hút vô thức (Component B)
> - Trì hoãn cơn thèm (Component C)
> - Giảm tổng điếu (Component D)
> - Quay lại sau lapse (Component E)
>
> Anh tự đo tiến bộ qua Control Score 0-100. Sol KHÔNG hứa anh bỏ 100%. Sol hứa Score của anh tăng — và nếu không tăng tháng đầu, Sol trả lại tiền.
>
> Anh thử Sol Start 99k 14 ngày trước. Nếu thấy được — đi tiếp Sol Control. Anh quyết."

### Email subject lines (anti-pressure)

- "Anh ơi — bỏ thuốc lúc nào cũng được"
- "Báo cáo 3 ngày của anh đã sẵn"
- "Control Score của anh tuần này +8 điểm"
- "Một điếu không phải fail"

### CTA buttons (sòng phẳng)

- "Bắt đầu 7 ngày — chỉ quan sát"
- "Thử Sol Start 99k — hủy bất kỳ lúc nào"
- "Mở app — Khang đang đợi"
- "Anh quyết khi nào — Sol đợi"

---

## Quy tắc duy nhất Khang nhớ

> **Mọi cam kết marketing PHẢI có chân trong product.**
> **Mọi outcome hứa PHẢI đo được trong app.**
> **Mọi gói PHẢI có 3 lớp: Brand + Promise + Outcome.**
> **Mọi user lapse PHẢI không cảm thấy fail.**

→ 4 quy tắc này khớp → Sol thảnh thơi chốt đơn, không sợ kiện, không bị churn vì shame.

→ 1 trong 4 lệch → user kiện hoặc churn → trust mất → Sol chết.

---

## Việc Khang phải làm sau khi đọc document này

1. **Highlight chỗ em sai** — phản hồi để em sửa
2. **Trả lời 5 quyết định ở Phần 9** — tick từng cái
3. **Xác nhận roadmap 8 tuần** — ổn hay cần điều chỉnh
4. **Quyết bắt đầu việc nào tuần này** — em wire ngay

Khang đọc, sửa, chốt — em wire trong 8 tuần thành Sol có thể launch public với **integrity 100%**.
