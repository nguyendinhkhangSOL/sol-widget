# SOL — STAGE 88 DAYS DESIGN

**Trạng thái:** Final · Single source of truth
**Ngày chốt:** 2026-05-05
**Tác giả:** Khang Sol + AI design pair
**Thay thế:** `STAGE_JOURNEY_DESIGN.md` (60-day pivot, deprecated)

---

## TL;DR

> *"Sol không bán 7, 21, 30 ngày — Sol dẫn người dùng đi qua 3 giai đoạn thay đổi hành vi và 1 giai đoạn duy trì để đảm bảo sự chuyển đổi bền vững."*

**Cấu trúc:** `7 + 21 + 30 + 30 = 52 ngày (51d Sol-active + Day 52 lễ tốt nghiệp)`

| # | Tên (UX) | Code | Day | Số ngày | Ý nghĩa |
|---|---|---|---|---|---|
| 1 | 🌱 NHẬN THỨC | `NHAN_THUC` | 1-7 | 7 | Quan sát — không thay đổi |
| 2 | 🔥 HÀNH ĐỘNG | `HANH_DONG` | 8-28 | 21 | Phá bỏ thói quen, delay craving, giảm dần |
| 3 | 🚭 GIẢI PHÓNG | `GIAI_PHONG` | 29-58 | 30 | Bỏ hẳn — đồng hồ countdown bật |
| 4 | 🌟 TÁI THIẾT | `TAI_THIET` | 59-88 | 30 | Maintenance — anti-relapse, identity rebuild |
| ∞ | 🦁 ĐẠI SỨ SOL | `DAI_SU` | 89+ | lifetime | Mentor, archive |

**Q-Day = Day 28** (ngày user cam kết bỏ hẳn). Đồng hồ countdown chạy từ Day 29.

---

## 1. TRIẾT LÝ — KHÔNG PHẢI 4 GÓI THỜI GIAN

❌ **Sai:** "Gói 7 ngày + Gói 21 ngày + Gói 30 ngày + Bonus 30 ngày"
✅ **Đúng:** "1 hành trình tiến hoá hành vi — 4 lớp"

> **Awareness → Rewiring → Stabilization → Maintenance**

**Lý do triết lý này quan trọng:**

1. User 45+ Việt KHÔNG mua "khoá học". Họ mua **người đồng hành**.
2. Nếu UI hiển thị quá rõ "Ngày X / 88" — biến thành course feel, mất sense of journey.
3. Nếu gọi "gói ngày" — user nghĩ subscription chia nhỏ, giảm cảm giác hành trình.

**Áp dụng cho UX:**

| Tình huống | KHÔNG nói | NÊN nói |
|---|---|---|
| Header dashboard | "Ngày 12 / 88" | "Anh đang ở giai đoạn **Hành Động** — Sol đang giúp anh delay craving" |
| Pricing | "Gói 28 ngày 280k" | "Khởi Động cùng Sol qua giai đoạn Nhận Thức + Hành Động" |
| Progress bar | 88 cells linear | 4 viên ngọc (4 phase) — viên hiện tại pulse |
| Notification | "Ngày 28 — bắt đầu Phase 3" | "Hôm nay là Q-Day. Anh sẵn sàng bỏ hẳn?" |

---

## 2. STAGE 1 — NHẬN THỨC (Day 1-7)

### Mục tiêu

> *"Người dùng thấy rõ chính mình đang hút như thế nào — không bị phán xét, không bị ép."*

### Hệ thống làm

- Ghi nhận hành vi (CigaretteLog từng điếu)
- Map trigger (STRESS / EATING / IDLE / SOCIAL / OTHER)
- Tạo baseline: cigsPerDay, peakHour, top trigger
- Sinh story 2-4 câu phản chiếu

### User làm

- Day 1: Onboarding wizard 1 step (cigsBaseline + pricePerCig)
- Hằng ngày: Check-in nhẹ ("hôm nay anh thấy thế nào?")
- Khi thèm: Bấm "+ Ghi điếu" (đã hút / bỏ qua) — optional, không ép

### UI render

- **Big card:** PatternObserver
  - Heatmap 24h × 7 ngày
  - Cigs/day trung bình
  - Top trigger
  - **KHÔNG đồng hồ, KHÔNG mục tiêu, KHÔNG judge**
- **Story:** *"Sol thấy anh thường hút sau cơm trưa. Mai anh quan sát kỹ hơn — Sol đang học cùng anh."*
- **CTA:** "+ Ghi điếu"

### Content (7 bài mới)

| Day | Tiêu đề | Voice |
|---|---|---|
| 1 | "Bắt đầu — không cần hoàn hảo" | Đón |
| 2 | "Quan sát mà không phán xét" | Mở |
| 3 | "Sol thấy gì ở anh hôm qua" | Phản chiếu |
| 4 | "Thèm thuốc không phải kẻ thù" | Hiểu |
| 5 | "Trigger là tín hiệu, không phải lệnh" | Khoa học nhẹ |
| 6 | "Anh đã có 5 ngày dữ liệu" | Tổng kết tuần |
| 7 | "Tuần sau bắt đầu Hành Động" | Chuyển |

---

## 3. STAGE 2 — HÀNH ĐỘNG (Day 8-28)

### Mục tiêu

> *"Bẻ vòng lặp hút thuốc tự động — phá thói quen, không ép nicotin."*

### Hệ thống làm

- Delay craving suggestions (10 phút → 30 phút → 1h)
- Plan B trigger gợi ý (theo top trigger từ Phase 1)
- Giảm dần số điếu — không ép cứng, target mềm
- Track delay success rate

### User làm

- Phản hồi nhẹ khi bị trigger (chip click)
- Thử delay / thay hành vi
- Check-in tối: "hôm nay anh delay được mấy lần?"

### UI render

- **Big card:** ReductionTracker
  - Hôm nay: X điếu / Mục tiêu mềm Y điếu
  - Tuần này: avg cigs/day vs Phase 1 baseline
  - "Anh đã delay thành công Z lần" (counter)
- **Plan B card:** Gợi ý dựa trên top trigger
  - STRESS → "Cốc nước lạnh + 5 phút đi bộ"
  - EATING → "Đánh răng sau cơm"
  - SOCIAL → "Gọi 1 chai nước trước khi nhậu"
- **Q-Day countdown** từ Day 26: "Còn 2 ngày là Q-Day"

### Content (21 bài mới)

| Day | Tiêu đề | Voice |
|---|---|---|
| 8 | "Bắt đầu Hành Động — không cần dữ dội" | Mở phase |
| 9 | "Delay 10 phút — phá vòng lặp" | Kỹ thuật |
| 10 | "Plan B cho trigger mạnh nhất của anh" | Chiến thuật |
| 11 | "Anh giảm được 1 điếu = Sol đo được" | Phản hồi |
| 12 | "Stress không cần thuốc lá" | Lifestyle |
| 13 | "Sau cơm — đánh răng thay châm thuốc" | Habit swap |
| 14 | "1 tuần Hành Động — Sol thấy gì" | Tổng kết |
| 15 | "Identity prep — anh là ai khi không hút?" | Allen Carr lite |
| 16 | "Cảnh báo: Day 16-21 thường khó" | Khoa học |
| 17 | "Reach out — bạn không cô đơn" | Đội Sol |
| 18 | "Khi cravings tấn công 21h tối" | Crisis tip |
| 19 | "Tiền tiết kiệm — anh dùng gì?" | Money mindset |
| 20 | "1 điếu lúc nhậu — bình thường, mai khác" | Compassion |
| 21 | "Chuẩn bị Q-Day — viết ra lý do" | Pre-ceremony |
| 22 | "Hỏi vợ/người thân: tôi nên cam kết gì?" | Social anchor |
| 23 | "Identity Day 23 — anh đã thay đổi?" | Reflection |
| 24 | "5 ngày nữa Q-Day. Hôm nay quan sát mình" | Countdown 5 |
| 25 | "Còn 3 ngày — chuẩn bị nhà cửa" | Practical |
| 26 | "Nhắc Q-Day — T-2" | Notification |
| 27 | "Đêm trước Q-Day — viết thư cho ngày mai" | Ritual |
| 28 | "Hôm nay là Q-Day. Anh quyết tâm chứ?" | Ceremony day |

---

## 4. STAGE 3 — GIẢI PHÓNG (Day 29-58)

### Mục tiêu

> *"Hành vi mới trở thành trạng thái mặc định — không hút là default."*

### Hệ thống làm

- Đồng hồ countdown UP "Đã X ngày không hút"
- Body recovery milestones (CDC/NHS)
- Giảm dần can thiệp — chỉ cảnh báo khi cần
- Củng cố pattern mới qua daily ritual

### User làm

- Ít tương tác hơn — chỉ check-in
- Chủ yếu duy trì
- Có thể bị **slip** — không penalize, reset đồng hồ nhẹ nhàng

### UI render

- **Big card:** RealtimeQuitDashboard (đồng hồ cũ + Body recovery rings)
  - Đồng hồ: "🕒 Đã 5 ngày 12 giờ không hút"
  - Recovery rings: lung function, taste, smell, circulation
  - Money saved: tăng đều
- **Slip handling:** Nếu user log "đã hút" trong Phase 3 → modal nhẹ "Không sao. Sol reset đồng hồ — tiếp tục đi."

### Content (30 bài cũ — TÁI DÙNG)

ContentItem cũ với `dayNumber 1-30` → render khi `dayInJourney 29-58`.

**Mapping logic:**
```
contentDay = dayInJourney - 28
```

| dayInJourney | contentDay | Ghi chú |
|---|---|---|
| 29 | 1 | Day 1 lộ trình rigid cũ |
| 30 | 2 | ... |
| 58 | 30 | Day 30 cũ |

**Lý do:** 30 bài cũ đã được rewrite theo MESSAGING_PLAYBOOK. Phù hợp tinh thần "bỏ hẳn".

---

## 5. STAGE 4 — TÁI THIẾT (Day 59-88)

### Mục tiêu

> *"Không quay lại hành vi cũ. Identity đã đổi — anh là người không hút."*

### Hệ thống làm

- Nhắc nhẹ khi có nguy cơ relapse (detect via low check-in frequency)
- Insight tuần (1 message / 3 ngày)
- Không can thiệp mạnh — autonomy mode

### User làm

- Gần như không cần thao tác
- Có thể skip nhiều ngày — Sol vẫn nhớ

### UI render

- **Big card:** MaintenanceDashboard
  - Đồng hồ: "🛡️ Giữ vững X ngày"
  - Streak chart 30 ngày
  - "Đại Sứ Sol — chỉ còn Y ngày nữa"
  - Recovery rings full filled (tất cả milestones unlocked)
- **CTA nhẹ:** "Chia sẻ với 1 người mới đang muốn cai" → entry point cohort mentor mode

### Content (10 bài mới — 1 bài / 3 ngày)

| Day | Tiêu đề | Theme |
|---|---|---|
| 59 | "Hôm nay là Day 59 — anh không còn hút 30 ngày" | Milestone |
| 62 | "Identity — anh là gì bây giờ?" | Allen Carr |
| 65 | "Khi thấy ai khác hút — phản ứng của anh?" | Self-check |
| 68 | "Cảnh báo: tuần tới có lẽ khó (Day 75 trap)" | Science |
| 71 | "Đại Sứ Sol — chia sẻ là cách giữ vững" | Cohort |
| 74 | "Day 74 — body đã hồi 80% (CDC)" | Recovery |
| 77 | "1 năm sau anh sẽ là ai?" | Long-term |
| 80 | "Lập gia đình / con cái — vì điều gì anh không hút?" | Anchor |
| 83 | "Day 83 — Sol giảm dần message — autonomy" | Transition |
| 86 | "Còn 2 ngày — chuẩn bị tốt nghiệp" | Pre-graduation |

---

## 6. Q-DAY CEREMONY (Day 28)

### Notification sequence

| Time | Channel | Content |
|---|---|---|
| Day 26, 7:00 sáng | Push + Inbox | "🎯 Còn 2 ngày là Q-Day. Anh đang chuẩn bị thế nào?" |
| Day 27, 7:00 sáng | Push + Inbox | "🌅 Đêm nay là đêm cuối Phase Hành Động. Mai anh quyết." |
| Day 27, 21:00 tối | Push + Chat message từ Sol | *"Khang gửi anh một câu: 'Anh đã chuẩn bị 4 tuần. Sol bên cạnh. Mai anh chỉ cần xác nhận.'"* |
| Day 28, 7:00 sáng | Push + Banner full-screen | "Hôm nay là Q-Day. Bấm vào để bắt đầu." |

### Ceremony screen UI

```
┌─────────────────────────────────────────────────┐
│  🌅                                              │
│  Hôm nay là Q-Day                                │
│  Ngày anh quyết tâm bỏ hẳn                       │
│                                                  │
│  Anh đã chuẩn bị 4 tuần.                         │
│  Sol đã đo nhịp của anh.                         │
│  Đội Sol đã sẵn sàng.                            │
│                                                  │
│  Bây giờ chỉ còn 1 việc:                         │
│  Cam kết với chính anh.                          │
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │  ✓ Tôi cam kết — bật đồng hồ tự do      │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│  (chưa sẵn sàng? Sol đợi anh — bấm Để mai)       │
└─────────────────────────────────────────────────┘
```

### Backend action khi bấm "Tôi cam kết"

1. `User.qDayConfirmedAt = Date.now()`
2. Tạo `ProgressJournal` snapshot Phase 1+2 (baseline, top trigger, story)
3. Push voice Khang đặc biệt: *"Anh ơi, từ giây này, đồng hồ anh chạy. Sol bên anh."*
4. Cohort notify: "Anh X vừa Q-Day. Chúc mừng đồng đội."
5. Redirect dashboard → `RealtimeQuitDashboard` (đồng hồ start từ 0:00:00)

### Nếu Day 28 chưa bấm

- Day 29-32: Banner persistent (nhẹ nhàng, không full-screen)
- Day 33+: Banner ẩn dần, content vẫn theo Phase 3 timeline (đồng hồ chỉ start khi xác nhận)
- Nếu Day 35 vẫn chưa bấm → push **1 lần cuối**: "Sol vẫn đợi anh. Khi nào sẵn sàng, bấm Tự do."

---

## 7. MONEY SAVED — CUMULATIVE FORMULA

### Logic cũ (deprecated)

```typescript
// Always positive, hardcoded
expectedCigs = day × 20
avoided = Math.max(0, expectedCigs - cigsLogged)
moneySaved = avoided × 1250
```

### Logic mới — Per-day delta, cho phép âm

```typescript
// Day-by-day, cumulative, ALLOW NEGATIVE
function computeMoneySavedDaily(userId, day) {
  const baseline = user.cigsBaseline;       // user khai báo
  const price = user.pricePerCig;            // user khai báo
  const actualToday = countCigsLogged(userId, day);
  const avoidedToday = baseline - actualToday;  // có thể âm
  return avoidedToday * price;
}

function computeMoneySavedTotal(userId) {
  let total = 0;
  for (let d = 1; d <= currentDay; d++) {
    total += computeMoneySavedDaily(userId, d);
  }
  return total;  // có thể âm nếu user hút nhiều hơn baseline
}
```

### UI hiển thị

| Tình huống | Display | Color | Subtitle |
|---|---|---|---|
| Total > 0 | `+25.000đ` | sol-green | "Sol thấy anh đang giảm" |
| Total = 0 | `0đ` | sol-ink-3 | "Quan sát đang ổn định" |
| Total < 0 | `−1.250đ` | sol-red | "Đây là số thật — Sol không che" |

**Triết lý:** Honesty > gamification. User trưởng thành xứng đáng số thật.

---

## 8. SCHEMA CHANGES (Migration phase_b)

```sql
-- User onboarding fields
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "qDayConfirmedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "cigsBaseline" INTEGER NOT NULL DEFAULT 20;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "pricePerCig" INTEGER NOT NULL DEFAULT 1250;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "onboardingCompletedAt" TIMESTAMP(3);

-- Tier price editable (nếu chưa)
ALTER TABLE "Tier" ADD COLUMN IF NOT EXISTS "priceVndOverride" INTEGER;
-- priceVnd remains default, priceVndOverride for admin custom

-- Index for Q-Day queries
CREATE INDEX IF NOT EXISTS "User_qDayConfirmedAt_idx" ON "User"("qDayConfirmedAt");
```

---

## 9. PRICING TIER MAP (Final)

| Tier | Phase cover | Số ngày | Default price | Promo Khởi Chạy |
|---|---|---|---|---|
| FREE | Phase 1 (Day 1-7) | 7 | 0đ | 0đ |
| KHOI_DONG | Phase 1+2 (Day 1-28) | 28 | **280.000đ** | 70.000đ |
| DONG_HANH | Phase 1+2+3 (Day 1-58) | 58 | **580.000đ** | 140.000đ |
| TRON_GOI | Phase 1+2+3+4 (Day 1-88) | 88 | **880.000đ** | 210.000đ |
| ALUMNI | Day 89+ | lifetime | Bonus cho TRON_GOI | Bonus |

**Logic:** Default = `10.000đ × số ngày`. Promo Khởi Chạy = giảm 75% cho 100 user đầu pre-sell.

Admin toggle promo on/off trong `/admin/pricing` (chưa có UI, tạm hardcode).

---

## 10. UX RULES — GIẤU SỐ NGÀY

### ❌ Cấm

- Hiển thị "Ngày X / 88" trên header chính
- Pricing nói "gói 28 ngày", "gói 58 ngày"
- Progress bar 88 cells linear
- Onboarding nói "anh cam kết 52 ngày (51d Sol-active + Day 52 lễ tốt nghiệp)"

### ✅ Khuyến khích

- "Anh đang ở giai đoạn **Hành Động**" + sub-progress trong phase
- Pricing nói "Khởi Động cùng Sol — đi qua Nhận Thức + Hành Động"
- 4 viên ngọc / 4 ô flow visualization
- Onboarding nói "anh đi cùng Sol qua 4 lớp tiến hoá"

### Số ngày được phép hiển thị

- Đồng hồ Phase 3-4: "Đã X ngày không hút" (đây là **identity number**, không phải timer course)
- Body recovery: "Day 14 — receptor giảm 40%" (đây là **science fact**, không phải progress)
- Q-Day countdown: "Còn 2 ngày là Q-Day" (đây là **anticipation**, không phải deadline)

---

## 11. DEV CHECKLIST

### Backend

- [ ] B.2 Schema migration phase_b
- [ ] B.3 service.ts refactor (5 stages, money cumulative, Q-Day helpers)
- [ ] B.4 routes Q-Day confirm + onboarding baseline
- [ ] B.4 Update /journey/dashboard payload (qDayState, onboardingComplete)
- [ ] Worker: Schedule Q-Day notif Day 26/27/28

### Frontend

- [ ] B.5 OnboardingWizard 1-step (cigsBaseline + pricePerCig)
- [ ] B.5 PhaseBar header (4 ô ngang)
- [ ] B.5 PhaseObserver component (Day 1-7)
- [ ] B.5 PhaseAction component (Day 8-28)
- [ ] B.5 QDayCeremony component (Day 28+ until confirmed)
- [ ] B.5 RealtimeQuitDashboard refactor (Day 29-58)
- [ ] B.5 PhaseRebuild component (Day 59-88)
- [ ] B.5 PhaseAmbassador component (Day 89+)
- [ ] B.5 Money saved: handle negative + color
- [ ] B.5 Slip handling modal (Phase 3-4)

### Content

- [ ] B.6 Phase 1: 7 bài NHAN_THUC
- [ ] B.6 Phase 2: 21 bài HANH_DONG
- [ ] B.6 Phase 4: 10 bài TAI_THIET
- [ ] B.6 Update ContentItem mapping (Phase 3 = dayNumber 1-30 cũ)

### Dashboard (4 tab)

- [ ] Overview.tsx → router theo phase
- [ ] Journey.tsx → 4 viên ngọc, không lịch 30 cells
- [ ] Workbook.tsx → unlock theo phase
- [ ] Analytics.tsx → tabs khác nhau theo phase

---

## 12. RỦI RO + MITIGATION

| Rủi ro | Khả năng | Mitigation |
|---|---|---|
| User thấy "52 ngày (51d Sol-active + Day 52 lễ tốt nghiệp)" sợ → bỏ ngay | Cao | UX rules giấu số ngày, marketing nói "4 lớp tiến hoá" |
| Q-Day Day 28 user chưa sẵn → friction | Trung | Cho phép skip, nag nhẹ Day 29-35, không ép |
| Money saved âm → user nản | Trung | Subtitle "đây là số thật", Sol message phản chiếu compassionate |
| Phase 3 slip (relapse) → user xấu hổ | Cao | Slip modal compassion, không reset hoàn toàn, story update gentle |
| Content 38 bài viết chưa kịp | Trung | Ưu tiên Phase 1+2 trước (28 bài), Phase 4 viết sau |
| Pricing 880k cao → ít người mua | Cao | Promo Khởi Chạy 210k cho 100 user đầu, sau đó tăng dần |

---

## 13. APPENDIX — SO SÁNH VỚI 4 PHƯƠNG PHÁP

| Chiều | SOL | Allen Carr | Smoke Free | QuitNow |
|---|---|---|---|---|
| Cấu trúc | 4 phase 7+21+30+30 | 1 cuốn sách → quit overnight | Open-ended | Open-ended |
| Q-Day | Day 28 ceremony | Last cigarette ritual | Quit date user chọn | Quit date user chọn |
| Tracking | CigaretteLog cumulative | Không track | Cigs/day chart | Cigs/day chart |
| Identity | Phase 4 TÁI THIẾT | Identity shift Day 1 | Không emphasize | Light |
| Cohort | Đội Sol pseudonym | Không có | Forum | Forum |
| Voice | AI + Khang Sol thật | Sách | None | None |
| Money | Cumulative cho phép âm | Không track | Positive only | Positive only |
| Maintenance | 30 ngày Phase 4 | Không có | Lifetime free | Premium |

**Differentiator của SOL:**
1. **Q-Day ceremony** — duy nhất có ritual chính thức Day 28
2. **Money cumulative cho phép âm** — duy nhất honest về relapse
3. **Voice Khang Sol thật** — duy nhất có nội lực truyền thống VN
4. **Đội Sol cohort** — duy nhất có VN pseudonym + đồng đội language

---

## 14. NEXT STEPS SAU KHI MIGRATE

1. **Tuần này:** Code B.2-B.5 (~6h dev)
2. **Tuần sau:** Viết content B.6 (~6h)
3. **Tuần 3:** Pre-sell 5-10 user theo MARKETING_ZERO_BUDGET
4. **Tuần 4:** Onboard user thật, observe Phase 1
5. **Tháng 2:** Thu thập data 7 ngày Phase 1 → tune content
6. **Tháng 3:** User đầu tiên đến Q-Day (Day 28)
7. **Tháng 4:** User đầu tiên đến Day 52 — TÁI THIẾT graduation

---

**Designed by:** Khang Sol + AI pair, 2026-05-05
**Status:** Final, ready for implementation
**Owner:** Khang Sol — sol.vn / bothuocla.sol.vn
