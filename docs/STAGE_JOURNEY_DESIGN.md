# SOL — Stage Journey Design (3 Giai đoạn 7·21·7)

> **Status**: APPROVED bởi R&D 2026-05-04. Sẵn sàng execute.
> **Pivot**: Từ "30 ngày rigid" sang "behavior-based journey" theo Prochaska Stages of Change.
> **Author**: Em (Claude) tổng hợp R&D spec + ADMIN_CONTENT_DESIGN dependency.

---

## 1. Triết lý — Tại sao 3 giai đoạn

Mô hình cũ "30 ngày Day 1-30" giả định ai cũng cold turkey ngay Day 1. Thực tế VN 45+:

- 70% user thử bỏ 5-8 lần trước khi thành công (Hughes 2007)
- Cold turkey relapse rate ~80% trong 30 ngày
- Allen Carr work cho ~30% user (motivated, ready)
- 70% còn lại cần TAPERING + GATING

→ Sol là **hệ điều hành hành vi 3 giai đoạn**, không phải chương trình.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│  STAGE 1                STAGE 2                STAGE 3            │
│  Nhận thức              Hành động              Giải phóng         │
│  7 ngày                 21 ngày                7 ngày             │
│                                                                   │
│  Observe                Reduce                 Stabilize          │
│  (vẫn hút)              (giảm dần)             (ổn định ≤2/ngày)  │
│                                                                   │
│  ─────────►            ─────────►              ─────────►         │
│                                                                   │
│  GATE                   GATE                                      │
│  Stage 1→2:             Stage 2→3:                                │
│  • 7/7 check-in         • avg ≤ 2 điếu/ngày                       │
│  • ≥80% baseline        • OR 18/21 check-in                       │
│                                                                   │
│  SKIP path: Quiz behavior history → vào thẳng Stage 3             │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘

Total adaptive — KHÔNG fixed timeline.
```

---

## 2. STAGE 1 — Nhận thức (7 ngày)

### 2.1 Bản chất

User VẪN HÚT BÌNH THƯỜNG. Sol không yêu cầu giảm — chỉ giúp user **quan sát hành vi thật** của chính mình. Đây là khác biệt lớn nhất với app cessation khác.

### 2.2 Daily content

**Core (bắt buộc, Day 1-7)**:
- Hiểu tác hại — số liệu khoa học cụ thể
- Quan sát hành vi: user log mỗi điếu hút (timestamp)
- Trigger tagging: stress / ăn / rảnh / xã hội (4 category)
- Pattern reflection: "Hôm nay anh hút 8 điếu, 3 điếu lúc nhậu, 2 sau cơm, 1 stress, 2 rảnh"

**Soft intervention (Day 4-7, KHÔNG gọi là "bài tập bỏ thuốc")**:
- "Thử delay 5-10 phút trước khi châm điếu tiếp theo"
- "Bỏ qua 1 điếu không bắt buộc — quan sát cảm giác thèm"
- "Thử ngồi 5 phút sau cơm KHÔNG hút — cảm giác thế nào?"

→ User tự khám phá, không bị áp đặt.

### 2.3 Baseline — bắt buộc capture

```typescript
interface Baseline {
  avgCigarettesPerDay: number;        // tính từ log Day 1-7
  timeOfDayPattern: number[];          // distribution 24h
  triggerFrequency: {
    stress: number;
    eating: number;
    idle: number;
    social: number;
  };
  daysCompleted: number;               // 0-7
  baselineCompleteness: number;        // 0-100%
}
```

Baseline này là **input** cho Stage 2 tapering target.

### 2.4 Mục tiêu Stage 1

> "User hiểu họ đang hút như thế nào — không phán xét, không ép buộc."

Đo bằng:
- 7 ngày check-in liên tiếp
- Log ≥80% điếu thực tế (heuristic: vs khai báo trước onboarding)
- Tag trigger ≥80% điếu

---

## 3. STAGE 2 — Hành động (21 ngày Tapering)

### 3.1 Mục tiêu cuối

**Target: 0-2 điếu/ngày** — Zero là ideal, không phải bắt buộc.

### 3.2 Tapering model (FIXED + ADAPTIVE)

```typescript
function computeWeeklyTarget(week: 1|2|3, baseline: Baseline): number {
  const reduction = { 1: 0.30, 2: 0.60, 3: 1.0 }[week]; // 1.0 = max
  const target = baseline.avgCigarettesPerDay * (1 - reduction);
  // Week 3 cap tại 2
  if (week === 3) return Math.min(2, Math.max(0, target));
  return Math.round(target);
}
```

| Week | Target reduction | Vd baseline 10 điếu/ngày |
|------|------------------|---------------------------|
| 1 | -30% | 7 điếu/ngày |
| 2 | -60% | 4 điếu/ngày |
| 3 | ≤ 2 điếu | 1-2 điếu/ngày |

### 3.3 Adaptive ±20%

System đề xuất target. User có thể chỉnh trong range:

```
allowed_min = system_target * 0.8
allowed_max = system_target * 1.2
```

Vd Week 1 target 7 → user chọn 6-9 (range 5.6-8.4 round).

### 3.4 Fail policy — KHÔNG restart

Nếu user vượt limit ngày X:
- Flag `relapse_event` vào DB (KHÔNG block)
- Tăng support intensity:
  - Ngày tiếp theo: morning_goal có voice Khang Sol cá nhân ("hôm qua anh vượt — bình thường")
  - Crisis prep tăng tần suất
  - AI chat priority cao hơn
- KHÔNG reset progress, KHÔNG xoá streak

### 3.5 Daily content Stage 2

| Module | Mục đích trong Stage 2 |
|--------|-------------------------|
| MORNING_GOAL | Set target hôm nay (system default + user override) |
| SCIENCE_TIP | Cơ thể đang hồi phục dù vẫn hút giảm |
| EXERCISE | Coping strategy khi craving (delay, breath, water) |
| EVENING_CHECKIN | Đếm điếu thật + so target + cảm xúc |
| NIGHT_STORY | Tự hào với tiến bộ tuần |

Phenomena alert chuyển sang **adaptive** — chỉ trigger khi pattern cụ thể (vd 3 ngày liên tiếp vượt 50% target → "đêm nay khó ngủ?").

---

## 4. STAGE 3 — Giải phóng (7 ngày)

### 4.1 Bản chất — KHÔNG phải cold turkey

Là **7 ngày ổn định hành vi gần 0 hoặc 0**. User vào Stage 3 đã ở mức ≤2 điếu/ngày — Stage 3 chỉ stabilize + identity shift.

### 4.2 Điều kiện vào

```
condition_enter_stage_3 = (
  avg_last_3_days <= 2  AND
  current_stage = 'STAGE_2'
) OR (
  bypass_via_quiz = true  // user nhảy thẳng
)
```

### 4.3 Daily content Stage 3

4 trục content:
1. **Craving control** — kỹ thuật khi cơn thèm còn quay lại (rare, but real)
2. **Relapse prevention** — tình huống risky (nhậu, stress lớn, mất ngủ)
3. **Identity shift** — từ "tôi đang cai" → "tôi không hút thuốc"
4. **Maintenance routine** — thói quen mới thay thế thuốc

### 4.4 Khác biệt với content Day 22-30 hiện tại

| Hiện tại (Day 22-30) | Stage 3 mới |
|-----------------------|--------------|
| Nội hóa (identity nhẹ) | Ổn định hành vi |
| Cột mốc 30 ngày | Duy trì daily |
| Insight chiêm nghiệm | Chống tái nghiện |
| Khang Sol thư cuối | Đại Sứ unlock |

→ 30 daily content cũ Day 22-30 phần lớn KHÔNG dùng được — phải re-write.

---

## 5. GATING CRITERIA

### 5.1 Stage 1 → Stage 2

```typescript
function canAdvanceToStage2(progress: Stage1Progress): boolean {
  return (
    progress.checkInsCompleted >= 7 &&
    progress.baselineCompleteness >= 0.8 &&
    progress.insightCompleted === true   // auto: đọc 7/7 daily content
  );
}
```

Quiz: **OPTIONAL** (gợi ý sau Day 5, không block).

### 5.2 Stage 2 → Stage 3

```typescript
function canAdvanceToStage3(progress: Stage2Progress): boolean {
  return (
    progress.avgCigsLast3Days <= 2 ||
    progress.checkInsCompleted >= 18  // 18/21
  );
}
```

KHÔNG quiz. KHÔNG block.

### 5.3 UI — Khi đạt gate

User nhận notification "🎉 Anh đã hoàn thành Stage 1 — sẵn sàng chuyển Stage 2 (giảm thuốc)?"

- Có button "Chuyển ngay" → unlock + paywall (nếu Free tier)
- Có button "Ở lại Stage 1 thêm" — extend Stage 1 1 tuần (max 2 lần)

---

## 6. USER NHẢY THẲNG — Bypass flow

### 6.1 Use case

- User đã bỏ tự lực 1 tháng → vào Stage 3 maintenance
- User đang giảm dần tự lực → vào Stage 2

### 6.2 Quiz validation (CHÍNH THỨC)

Onboarding bonus screen sau câu pronouns:

```
"Anh đang ở giai đoạn nào của hành trình bỏ thuốc?"
○ Đang hút bình thường, chưa nghĩ đến bỏ
   → Stage 1
○ Đang hút nhưng muốn giảm
   → Stage 1 (1-2 ngày diagnostic) → Stage 2
○ Đã giảm đáng kể, hút <5 điếu/ngày
   → Quiz Stage 2 → nếu pass: Stage 3
○ Đã ngừng hoàn toàn ≥ 1 tháng
   → Quiz Stage 3 → nếu pass: Maintenance
```

### 6.3 Quiz design

5-7 câu validation, vd Stage 3:
- "Lần cuối anh hút điếu là khi nào?" (datetime input)
- "Trong 30 ngày qua, có ngày nào vượt 3 điếu không?" (yes/no)
- "Cơn thèm có còn xuất hiện hàng ngày không?" (1-5 scale)
- "Anh có Plan B khi gặp tình huống risky không?" (text)

Auto-grade: pass nếu lastSmoke ≥ 30 ngày + 0 vượt + scale ≤ 2.

Pass → **Stage 3 unlock** (vẫn cần subscription tier).

### 6.4 Diagnostic mode (1-2 ngày)

Cho user "Đã giảm" → 1-2 ngày capture baseline current → so với target Stage 2 → assign vào Week 1/2/3 phù hợp.

---

## 7. PRICING

### 7.1 4 tier

| Tier | Giá | Bao gồm | Mục đích |
|------|-----|---------|---------|
| **Mở Đầu** | Free | Stage 1 full 7 ngày · limited insight · NO Stage 2 unlock | Acquisition |
| **Khởi Động** | 89.000đ 1-time | Stage 1 + Stage 2 (28 ngày) · full content · check-in tracking | Conversion entry |
| **Trọn Vẹn** | 149.000đ/tháng | All 3 stages · AI chat unlimited · cohort Đội Sol · Khang Zalo support · multi-vertical (alcohol, sleep) | Retention |
| **Đại Sứ** | Free sau success | Mentor mode · community role · referral · bonus content | Loyalty |

### 7.2 Free preview policy

❌ KHÔNG cho preview full Stage 2-3 nội dung.

✅ CHỈ:
- 1 locked screen demo (vd "Day 8 — Tapering Week 1: anh sẽ giảm xuống 7 điếu/ngày") — nội dung mờ + nút "Mở khoá 89k"
- 1 insight sample (vd Stage 2 phenomena trailer "tuần đầu giảm 30% — anh sẽ cảm thấy gì")

→ Demo đủ tease, không spoil.

### 7.3 Conversion flow

```
Stage 1 Day 7 evening → notification:
   "✓ Hoàn thành Stage 1. Sẵn sàng giảm thuốc?"
   [Vào Stage 2 — 89k] [Ở lại 1 tuần thêm — Free]
```

→ Time-bound urgency. User đã có baseline → biết rõ pattern → moment chuyển đổi cao nhất.

### 7.4 Upgrade Khởi Động → Trọn Vẹn

Trigger: Stage 2 Day 14+ hoặc Stage 3 Day 1+
- Banner: "Upgrade Trọn Vẹn để giữ momentum sang vertical 2 (rượu, giấc ngủ)"
- Hoặc khi cohort cụ thể mở: "Đội Sol Tháng 6 đang mở — gia nhập với 149k/tháng"

---

## 8. BRAND

### 8.1 Tagline chính

> **"Đi Cùng Sol — 3 Giai đoạn thay đổi hành vi (7 · 21 · 7)"**

### 8.2 Subtitle / mô tả

> "Nhận thức · Hành động · Giải phóng"

### 8.3 KHÔNG dùng

- ❌ "30 ngày" (rigid)
- ❌ "Trong 30 ngày, bạn sẽ..."
- ❌ "Day 1-30"

### 8.4 DÙNG

- ✅ "Hành trình 3 giai đoạn — tốc độ tuỳ anh"
- ✅ "Stage 1: Quan sát 7 ngày" (không "Day 1-7")
- ✅ "Stage 2 Week 1" thay "Day 8-14"

---

## 9. SCHEMA MIGRATION

### 9.1 New enums

```prisma
enum JourneyStage {
  STAGE_1_AWARENESS    // Nhận thức 7 ngày
  STAGE_2_ACTION        // Hành động 21 ngày
  STAGE_3_RELEASE       // Giải phóng 7 ngày
  GRADUATED             // Sau 35 ngày — Đại Sứ
  DIAGNOSTIC            // 1-2 ngày khi user skip
}

enum TriggerCategory {
  STRESS
  EATING
  IDLE
  SOCIAL
  OTHER
}

enum RelapseFlag {
  NONE
  MILD       // vượt 1-2 điếu over target
  MODERATE   // vượt 50% target
  SEVERE     // vượt 100% target
}
```

### 9.2 User extend

```prisma
model User {
  // ... existing
  
  currentStage          JourneyStage @default(STAGE_1_AWARENESS)
  stageStartedAt        DateTime?
  stageProgress         Json?         // shape per stage (xem 9.5)
  
  baselineCigsPerDay    Float?        // computed cuối Stage 1
  baselinePattern       Json?          // time-of-day distribution
  baselineTriggers      Json?          // trigger frequency
}
```

### 9.3 ContentItem re-tag

```prisma
model ContentItem {
  // ... existing fields
  
  // REPLACE dayNumber semantics — giữ field nhưng nghĩa thay đổi:
  //   Stage 1: dayNumber 1-7
  //   Stage 2: dayNumber 1-21 (within stage)
  //   Stage 3: dayNumber 1-7 (within stage)
  
  stage           JourneyStage     @default(STAGE_1_AWARENESS)  // NEW required
  
  // Optional — week within stage (Stage 2 only): 1, 2, 3
  weekInStage     Int?
}
```

### 9.4 Models mới

```prisma
// Track mỗi điếu user log
model CigaretteLog {
  id            String           @id @default(cuid())
  userId        String
  user          User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  smokedAt      DateTime         @default(now())
  trigger       TriggerCategory?
  context       String?           // optional free text "đi nhậu với A"
  delayedMin    Int?              // user delay X phút trước khi hút
  skipped       Boolean           @default(false)  // log "định hút nhưng skip"
  
  stage         JourneyStage     // capture lúc log
  
  @@index([userId, smokedAt])
}

// Daily summary — đếm điếu, target, relapse flag per ngày
model DailyProgress {
  id              String       @id @default(cuid())
  userId          String
  user            User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  date            DateTime     @db.Date
  stage           JourneyStage
  
  cigsCount       Int          @default(0)
  targetCount     Int?          // Stage 2/3
  relapseFlag     RelapseFlag  @default(NONE)
  
  checkInDone     Boolean      @default(false)
  insightRead     Boolean      @default(false)  // Stage 1 — đã đọc daily content
  
  @@unique([userId, date])
  @@index([userId, stage])
}

// Gating event — log mỗi lần user pass gate
model StageTransition {
  id              String       @id @default(cuid())
  userId          String
  user            User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  fromStage       JourneyStage
  toStage         JourneyStage
  trigger         String        // "auto_gate_passed" | "user_choice" | "quiz_bypass" | "admin_override"
  metadata        Json?         // gate criteria snapshot
  
  occurredAt      DateTime     @default(now())
}

// Quiz cho bypass
model BypassQuiz {
  id              String       @id @default(cuid())
  userId          String
  user            User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  targetStage     JourneyStage  // STAGE_2_ACTION | STAGE_3_RELEASE
  answers         Json          // {q1: ..., q2: ...}
  passed          Boolean
  computedReason  String?       // "lastSmoke<30days_fail" hoặc "all_criteria_met"
  
  takenAt         DateTime     @default(now())
}
```

### 9.5 stageProgress JSON shape

```typescript
// Stage 1
type Stage1Progress = {
  daysCompleted: number;        // 0-7
  checkInsCompleted: number;
  insightsRead: number;
  baselineCompleteness: number; // 0-1
  cigsLogged: number;
};

// Stage 2
type Stage2Progress = {
  weekNumber: 1 | 2 | 3;
  daysInWeek: number;            // 0-7
  totalDaysInStage: number;       // 0-21
  weeklyTarget: number;
  cigsLast3DaysAvg: number;
  relapseEvents: number;
  checkInsCompleted: number;     // 0-21
};

// Stage 3
type Stage3Progress = {
  daysCompleted: number;        // 0-7
  cigsLast7DaysAvg: number;
  relapseEvents: number;
  identityShiftDeclared: boolean; // user "tôi không hút thuốc" exercise
};
```


---

## 10. API CONTRACT (Phase 7 build)

### 10.1 Stage management

```
GET  /users/me/journey
  → { currentStage, stageStartedAt, stageProgress, gateStatus, canAdvance: boolean }

POST /users/me/journey/advance
  body: { targetStage }
  → check gate criteria → transition + create StageTransition row

POST /users/me/journey/bypass-quiz
  body: { targetStage: 'STAGE_2_ACTION' | 'STAGE_3_RELEASE', answers: {} }
  → grade quiz → if pass: transition + return new stage
```

### 10.2 Cigarette tracking

```
POST /cigarettes
  body: { smokedAt?, trigger, context?, delayedMin? }
  → create CigaretteLog + update DailyProgress

POST /cigarettes/skip
  body: { trigger, plannedAt }
  → log "skipped" event (positive! tăng skipped count)

GET  /cigarettes/today
  → { count, target?, byHour, byTrigger, relapseFlag }

GET  /cigarettes/stats
  query: { stage?, weekInStage? }
  → aggregate stats cho dashboard
```

### 10.3 Daily progress

```
GET  /progress/today
  → DailyProgress + stage info + recommendations

GET  /progress/week
  → 7 ngày gần nhất + chart data

GET  /progress/stage
  → toàn bộ progress hiện tại trong stage
```

### 10.4 Tapering target

```
GET  /tapering/today
  → { systemTarget, userTarget, allowedRange: [min, max], weekInStage }

POST /tapering/adjust
  body: { newTarget }  // phải trong allowedRange
  → save user override
```

### 10.5 Admin endpoints (extend Phase 1)

```
GET  /admin/journey/stats
  → { stage1Users, stage2Users, stage3Users, gradUsers, transitionsToday, relapseEventsToday }

GET  /admin/users/:id/journey
  → full journey log của user

POST /admin/users/:id/override-stage
  body: { newStage, reason }  // emergency override
```

---

## 11. EVENT TRACKING (analytics)

Events cần log để analyze later:

```typescript
type SolEvent =
  | 'stage_entered'       // {stage, source: 'auto'|'manual'|'bypass'}
  | 'stage_completed'     // {stage, daysSpent, gateMet}
  | 'cigarette_logged'    // {trigger, hourOfDay, stage}
  | 'cigarette_skipped'   // {trigger, plannedAt, stage}
  | 'target_set'          // {systemTarget, userTarget, week}
  | 'target_exceeded'     // {target, actual, severity}
  | 'relapse_flagged'     // {severity, daysIntoStage}
  | 'bypass_quiz_taken'   // {targetStage, passed, reason}
  | 'paywall_shown'       // {tier, sourceStage}
  | 'paywall_converted'   // {tier, fromStage, daysToConvert}
  | 'graduation'          // {totalDays, finalAvg}
  | 'reactivation'        // {daysAway, returnedToStage}
```

Lưu vào model `Event`:

```prisma
model Event {
  id        String   @id @default(cuid())
  userId    String?
  type      String
  payload   Json
  occurredAt DateTime @default(now())
  
  @@index([userId, type, occurredAt])
  @@index([type, occurredAt])
}
```

---

## 12. CONTENT MIGRATION từ 30-day cũ → 3-stage

### 12.1 Mapping plan

| Cũ (Day 1-30) | Mới (Stage / Week) | Action |
|----------------|---------------------|--------|
| Day 1-2 | Stage 1 Day 1-2 | Re-write — voice "vẫn hút bình thường", không yêu cầu bỏ |
| Day 3-5 | Stage 1 Day 3-5 | Re-write — soft intervention |
| Day 6-7 | Stage 1 Day 6-7 | Re-write — pattern reflection + transition |
| Day 8-14 | Stage 2 Week 1 (-30%) | Re-write — tapering Week 1 |
| Day 15-21 | Stage 2 Week 2 (-60%) | Re-write — tapering Week 2 |
| Day 22-28 | Stage 2 Week 3 (≤2/ngày) | Re-write — tapering Week 3 |
| Day 29-30 | Stage 3 Day 1 | Re-purpose — bắt đầu giải phóng |

### 12.2 Items mới cần viết

- 6 items Stage 3 Day 2-7 (5 module × 6 = 30 items mới)
- ~20 items rewrite Stage 2 cho tapering context
- ~10 items rewrite Stage 1 voice "không ép bỏ"

→ Total mới + rewrite: ~70-80 items.

### 12.3 Khang task

Sau khi schema migrate xong, em sẽ provide AdminContent UI có filter `stage` + button "Migrate from old". Khang manually re-categorize qua UI hoặc em batch-script auto-migrate + Khang verify.

---

## 13. ADMIN DASHBOARD MỚI

### 13.1 /admin/journey

3 zone:

**Top — Funnel stats**:
```
Stage 1 (Free):     124 users
↓ 67 advanced (54% conversion)
Stage 2 (Paid 89k): 84 users (+17 bypass)
↓ 41 advanced
Stage 3 (Trọn Vẹn): 41 users
↓ 28 graduated
Đại Sứ:             28 users
```

**Middle — Cohort analysis**:
- Trung bình days spent per stage
- Drop-off chart (Day X user opt-out)
- Relapse rate per Week trong Stage 2

**Bottom — User table**:
- Filter theo stage
- Click user → drill-down journey

### 13.2 /admin/content (mới — replace 30-day filter)

Filter:
- Stage (radio: 1, 2, 3, ALL)
- Week (chỉ Stage 2: W1, W2, W3)
- Day in stage

List 127+ items theo stage.

### 13.3 /admin/cohorts (extend)

Mỗi cohort track stage progression collective. Vd "Đội Sol Tháng 6":
- 23 đồng đội — 18 Stage 1, 4 Stage 2, 1 Stage 3

---

## 14. ROADMAP EXECUTION

### Phase 7 — Schema migration + core API (4-5h)

**Schema**:
- Add JourneyStage enum
- Add User.currentStage, stageStartedAt, stageProgress, baseline*
- Add models CigaretteLog, DailyProgress, StageTransition, BypassQuiz, Event
- ContentItem add stage, weekInStage

**Backend API**:
- /users/me/journey GET + advance + bypass-quiz
- /cigarettes POST + skip + today + stats
- /tapering today + adjust
- /progress today + week + stage

**Migration script**:
- Map 127 existing ContentItem → stage
- Set all existing users currentStage = STAGE_1_AWARENESS, day 1

### Phase 8 — Worker logic update (3-4h)

- `smartSchedulerSweep` + `enqueueDailyContent` query theo stage thay dayNumber 1-30
- Tapering target generation cron daily 06:00
- Relapse flag detection cron evening
- Stage transition automation cron daily 06:00 (check gate → bắn notification)

### Phase 9 — Frontend widget (4-5h)

- New view `JourneyMap` thay `Journey 30-day` cũ
- `CigaretteLogger` button widget tap to log nhanh
- `TaperingTarget` card hiển thị target hôm nay
- Onboarding flow mới có quiz "Anh đang ở giai đoạn nào"
- Paywall modal khi user pass gate Stage 1→2

### Phase 10 — Admin dashboard (3-4h)

- /admin/journey funnel + cohort chart
- /admin/content filter theo stage thay 30-day
- /admin/users/:id journey drill-down

### Phase 11 — Content rewrite (Khang time, 8-12h)

- Stage 1 (35 items) — voice không ép bỏ
- Stage 2 (90 items, 3 weeks × 6 module × 5) — tapering
- Stage 3 (35 items) — giải phóng + identity shift

### Phase 12 — Pricing migration (2-3h)

- Tier system update: Free chỉ Stage 1, Khởi Động Stage 1+2, Trọn Vẹn all
- Paywall flow redesign per stage
- Existing Trọn Vẹn user → grandfather (full access)

### Phase 13 — Event tracking + analytics (3-4h)

- Event model + emitEvent helper
- 12 event types
- /admin/journey/analytics dashboard

---

## 15. BREAKING CHANGES + MIGRATION RISK

### 15.1 Dữ liệu cũ

User hiện có `quitDate` (Day 1-30 model) → migration:

```sql
-- Tất cả existing user → STAGE_1_AWARENESS hoặc STAGE_2_ACTION tuỳ ngày
-- Logic: nếu daysSinceQuit < 7 → Stage 1 day N
--        nếu 7 ≤ daysSinceQuit ≤ 28 → Stage 2 week (daysSinceQuit-7)/7+1
--        nếu daysSinceQuit > 28 → Stage 3
```

### 15.2 Worker.ts

Hiện tại worker query `dayNumber` trực tiếp từ `quitDate`. Phải chuyển sang query `currentStage` + `stageProgress.daysCompleted`.

### 15.3 Brand assets

- Landing page sol.vn/bo-thuoc-la cần update tagline
- 27 chip wiki articles dùng "30 ngày" cần audit

### 15.4 Pricing migration cho user hiện có

Test user `test@sol.vn` đang Day 14 → migrate Stage 2 Week 2.

User Trọn Vẹn từ chiến dịch Pre-sell (sau khi launch) → grandfather full access.

---

## 16. APPROVAL CHECKLIST

Anh check để em execute Phase 7+:

- [ ] Schema design (Section 9) — JourneyStage enum + 4 models mới + User extend
- [ ] API contract (Section 10) — 5 nhóm endpoint
- [ ] Event tracking (Section 11) — 12 event types
- [ ] Content migration plan (Section 12) — re-tag 127 items + viết mới ~30
- [ ] Pricing tier (Section 7) — 4 tier (Free/89k/149k/Đại Sứ) + locked preview policy
- [ ] Brand "3 Giai đoạn 7·21·7" (Section 8)
- [ ] Roadmap Phase 7-13 (Section 14) — ~25-30h em build chia 5-7 phiên

Anh feedback / approve em bắt đầu Phase 7 phiên sau.

---

## 17. NEXT STEPS NGAY

### Tonight (cuối phiên 2026-05-04):
1. ✅ Soạn doc này (DONE)
2. ⏳ Anh chạy lệnh backup DB + git commit (em đã hướng dẫn ở message trước)
3. ⏳ Em append delta 13 + 14 vào CLAUDE_CONTEXT
4. ⏳ Đóng phiên — nghỉ

### Tomorrow:
1. Anh review approval checklist trên
2. Anh chốt feedback từng section
3. Em execute Phase 7 (schema migration + core API) — ~4-5h

### Trong 7 ngày tới:
- Phase 7 + Phase 8 (~9h)
- Phase 9 (~5h)
- Khang viết Stage 1 content (10-15 items, 2-3h)

→ Có MVP launch-able cho 5 user pre-sell trong 1 tuần.

---

**Lần update cuối**: 2026-05-04
**Status**: APPROVED bởi R&D, chờ Khang execute approval
**Reference**: ADMIN_CONTENT_DESIGN.md, MESSAGING_PLAYBOOK.md

---

## 18. WIDGET ARCHITECTURE — State-based Dynamic Dashboard

> **Triết lý chốt từ R&D 2026-05-04**: "Sol không phải web/app có nhiều màn hình. Sol là một màn hình thay đổi theo hành vi người dùng."

### 18.1 Vấn đề kiến trúc hiện tại

Widget Sol hiện tại có 7+ view riêng (HomeView, ChatView, CheckinFlow, ExerciseCard, CrisisMode, InboxView, SettingsView, JourneyView, PaywallView, RefundView, VoiceInboxView). User chuyển view qua bottom nav.

→ Nhiều màn hình = nhiều quyết định = friction. User 45+ KHÔNG biết Home khác Journey ở đâu.

### 18.2 Architecture mới — UI = function(level, behavior, time)

```
┌─────────────────────────────────────────────────────────────────┐
│                          AppShell                                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Dashboard (single root)                         │ │
│  │                                                              │ │
│  │   ╔═══════════════════════════════════════════════════════╗  │ │
│  │   ║  resolver(userLevel) → render đúng dashboard          ║  │ │
│  │   ╚═══════════════════════════════════════════════════════╝  │ │
│  │                                                              │ │
│  │   FreeDashboard  · AwarenessDashboard · ActionDashboard      │ │
│  │   · FreedomDashboard                                         │ │
│  │                                                              │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  UnifiedComposer (always-on chat input — bottom)            │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  ContextualSheet (modal slide-up — exercise, crisis...)     │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 18.3 4 Dashboard variants

```typescript
type UserLevel = 'FREE' | 'SOL_7' | 'SOL_21' | 'SOL_35';

function useDashboardResolver(level: UserLevel) {
  switch (level) {
    case 'FREE':    return FreeDashboard;       // chưa onboard | chưa upgrade
    case 'SOL_7':   return AwarenessDashboard;   // Stage 1 active
    case 'SOL_21':  return ActionDashboard;      // Stage 2 active
    case 'SOL_35':  return FreedomDashboard;     // Stage 3 + Đại Sứ
  }
}
```

### 18.4 Mapping currentStage (DB) → UserLevel (UI)

```typescript
function deriveUserLevel(user: User): UserLevel {
  // FREE: chưa khai quitDate hoặc chưa upgrade tier
  if (!user.currentStage || user.tier === 'FREE_LOCKED') return 'FREE';

  switch (user.currentStage) {
    case 'STAGE_1_AWARENESS':
    case 'DIAGNOSTIC':
      return 'SOL_7';
    case 'STAGE_2_ACTION':
      return 'SOL_21';
    case 'STAGE_3_RELEASE':
    case 'GRADUATED':
      return 'SOL_35';
    default:
      return 'FREE';
  }
}
```

### 18.5 Behavior score (input cho auto-level adjustment)

```typescript
function computeBehaviorScore(user: User, dailyProgress: DailyProgress[]): number {
  // 0-100
  let score = 50; // baseline
  
  // Streak bonus (last 7 days)
  const recentCheckins = dailyProgress.filter(d => d.checkInDone).length;
  score += recentCheckins * 3; // max +21
  
  // Tapering progress
  if (user.currentStage === 'STAGE_2_ACTION') {
    const onTarget = dailyProgress.filter(d => 
      d.cigsCount <= (d.targetCount ?? 999)
    ).length;
    score += onTarget * 2; // max +14
  }
  
  // Relapse penalty
  const relapses = dailyProgress.filter(d => d.relapseFlag !== 'NONE').length;
  score -= relapses * 5;
  
  return Math.max(0, Math.min(100, score));
}
```

### 18.6 Auto re-evaluate (real-time level update — KHÔNG reload)

```typescript
// Trong UserContext provider
useEffect(() => {
  const newLevel = deriveUserLevel(user);
  if (newLevel !== currentLevel) {
    // Smooth transition — fade out cũ, fade in mới
    setCurrentLevel(newLevel);
    emitEvent('level_changed', { from: currentLevel, to: newLevel });
  }
}, [user.currentStage, user.tier, user.behaviorScore]);
```

### 18.7 Design dashboard cụ thể

#### 18.7.1 FreeDashboard

```
┌──────────────────────────────────────┐
│  ☀️ Chào anh!                        │
│                                       │
│  HÔM NAY ANH HÚT BAO NHIÊU ĐIẾU?     │
│                                       │
│  [───●───────] 8 điếu                 │
│   0          20                       │
│                                       │
│  [✓ Ghi nhận]                         │
│                                       │
│  Chỉ cần bắt đầu quan sát.            │
│                                       │
│  ─────────────────────────            │
│                                       │
│  🔓 Mở khoá Stage 1 — Free            │
│  → Tag trigger · Thấy pattern 7 ngày  │
│  [Bắt đầu hành trình]                 │
└──────────────────────────────────────┘
```

#### 18.7.2 AwarenessDashboard (SOL_7 — Stage 1)

```
┌──────────────────────────────────────┐
│  Day 3/7 · Quan sát                   │
│                                       │
│  📊 INSIGHT 3 NGÀY QUA                │
│                                       │
│  ┌────────────────────────────────┐  │
│  │ Trung bình: 9 điếu/ngày         │  │
│  │ Đỉnh: 21h (4 điếu)              │  │
│  │ Trigger top: Stress (38%)       │  │
│  └────────────────────────────────┘  │
│                                       │
│  [PatternChart]                       │
│  ▁▂▆█▇▃▁ ← giờ trong ngày            │
│                                       │
│  [TriggerList]                        │
│  • Stress     ████████ 38%           │
│  • Sau cơm    █████ 27%              │
│  • Rảnh       ████ 22%               │
│  • Xã hội     ██ 13%                 │
│                                       │
│  💡 Hôm nay thử delay 10 phút         │
│     trước điếu sáng đầu tiên          │
│                                       │
│  [Log điếu hôm nay] [Check-in]        │
└──────────────────────────────────────┘
```

#### 18.7.3 ActionDashboard (SOL_21 — Stage 2)

```
┌──────────────────────────────────────┐
│  Week 1 · Day 4/21 · Hành động       │
│                                       │
│  🎯 TARGET HÔM NAY: 7 ĐIẾU            │
│  Đã hút: 5 / 7  ████████░░  71%      │
│                                       │
│  [ProgressBar]                        │
│  Baseline 10 → Today target 7         │
│  Reduction: -30% Week 1               │
│                                       │
│  [DelayTracker]                       │
│  Đã delay thành công: 3 lần           │
│  Đã skip: 1 lần                       │
│                                       │
│  [ComparisonChart]                    │
│  Ngày 1   ████████ 10                │
│  Ngày 2   ██████ 8                   │
│  Ngày 3   ██████ 7                   │
│  Hôm nay  █████ 5                    │
│                                       │
│  💡 Thử thách: bỏ qua 2 điếu cuối     │
│     trong ngày                        │
│                                       │
│  [+ Log điếu] [Check-in tối]          │
└──────────────────────────────────────┘
```

#### 18.7.4 FreedomDashboard (SOL_35 — Stage 3)

```
┌──────────────────────────────────────┐
│  Day 3/7 Stage 3 · Giải phóng         │
│                                       │
│  🌟 32 NGÀY KHÔNG BỊ THUỐC ĐIỀU KHIỂN│
│                                       │
│  [StreakCard]                         │
│  ╔═════════════════════════════════╗  │
│  ║      32                          ║  │
│  ║   ngày liên tiếp ≤ 2 điếu        ║  │
│  ║                                  ║  │
│  ║   🔥                              ║  │
│  ╚═════════════════════════════════╝  │
│                                       │
│  [CravingMeter]                       │
│  Cơn thèm hôm nay: ░░░░░░ 12% (low)  │
│                                       │
│  [StabilityScore]                     │
│  ●────●────●────●────●  82/100        │
│                                       │
│  [BeforeAfter]                        │
│  Trước: 10 điếu/ngày, ho sáng         │
│  Giờ:   0-1 điếu, hơi thở dài         │
│                                       │
│  💡 Maintenance: tránh nhậu Day 7     │
│                                       │
│  [Log] [Identity declaration]         │
└──────────────────────────────────────┘
```

### 18.8 Shared component library

Tất cả dashboard dùng chung 6-8 component cơ bản:

```typescript
// components/widget/
ProgressBar         // Stage 2 target progress
StreakCard           // Stage 3 streak display
TriggerList          // Stage 1 trigger breakdown
InsightCard          // Stage 1 pattern insight
DelayTracker         // Stage 2 delay/skip count
CravingMeter         // Stage 3 craving level
StabilityScore       // Stage 3 composite score
BeforeAfter          // Stage 3 transformation showcase
PatternChart         // Stage 1+2 hourly distribution
ComparisonChart      // Stage 2+3 day-by-day comparison
CigaretteLogger      // Universal — present mọi stage
```

### 18.9 Composer + ContextualSheet (always-on)

**Bottom — UnifiedComposer**: chat input luôn hiển thị, mọi stage. Đây là cửa "talking to Sol". Không bao giờ ẩn.

**ContextualSheet**: modal slide-up từ dưới khi cần action sâu (exercise, crisis breathing, payment) — không phải tab mới, không phải route mới.

→ User không bao giờ "lạc". Chỉ có 1 màn hình + 1 input + occasional sheet.

### 18.10 Phase 9 (frontend widget) update — scope tăng

Original Phase 9: 4-5h.

**New Phase 9 với state-based architecture: 8-10h**

Breakdown:
- AppShell + UserContext + Dashboard resolver (2h)
- 4 Dashboard variants (3-4h, ~600 dòng/variant)
- 11 shared component library (3h)
- UnifiedComposer + ContextualSheet (1h)
- Migrate existing views (HomeView, JourneyView…) → deprecate hoặc convert thành section trong dashboard (2h)
- Auto-level evaluate logic (30 phút)

→ Total Phase 9: ~10h, chia 2 phiên build.

### 18.11 Backward compat

User hiện tại đang ở "30-day model" có HomeView/ChatView. Migration:

1. **Soft launch**: chạy parallel — feature flag `USE_NEW_DASHBOARD` per user
2. **Test 5 user pre-sell** → feedback
3. **Swap**: tất cả user → new dashboard
4. **Cleanup**: xoá HomeView, JourneyView khỏi router (Settings, Inbox vẫn giữ — sheet)

### 18.12 Risk

- **Refactor lớn** — ảnh hưởng 7+ existing view
- **State management complex** — cần Zustand extend hoặc migrate sang Jotai
- **Animation polish** — fade transition giữa level cần work mới
- **Test coverage** — mỗi dashboard variant cần test riêng

### 18.13 Câu chốt

> **"Sol = 1 màn hình thay đổi theo hành vi user."**

Không sidebar, không tab, không bottom nav phức tạp. User mở widget mỗi sáng → thấy đúng nơi họ đang ở. Đây là khác biệt 5 năm với mọi cessation app khác.


---

## 19. PRICING FINAL — 10k/ngày + Bundle + Refund Pro-rata (chốt 2026-05-04)

### 19.1 Triết lý chốt

Khang: "Việt Nam chỉ thanh toán 1 lần thôi, không có thói quen sub hàng tháng. Mức giá đều 10.000/ngày cho toàn bộ lộ trình 7+21+7 và free trải nghiệm sau khi hoàn thành thêm 18 ngày bảo trì."

### 19.2 Pricing structure FINAL

| Option | Giá | Mô tả | Khi nào dùng |
|--------|-----|-------|--------------|
| **Free Trial** | 0đ | 3 ngày Stage 1 đầu — đủ aha moment | Acquisition |
| **Stage 1 Pay** | 70.000đ | Day 4-7 Stage 1 (4 ngày × 10k) | Free trial → conversion |
| **Stage 2 Pay** | 210.000đ | 21 ngày Stage 2 × 10k | Sau gate 1→2 |
| **Stage 3 Pay** | 70.000đ | 7 ngày Stage 3 × 10k | Sau gate 2→3 |
| **Trọn Gói** | **299.000đ** | All 3 stages + maintenance 25 ngày BONUS — tiết kiệm 51k (15%) | Upsell sau Day 3 |
| **Maintenance** | FREE | 25 ngày sau Stage 3 | Auto unlock |
| **Đại Sứ** | FREE forever | Sau Day 60 | Loyalty |

**Total Trọn Gói**: 299k → 60 ngày = **4.983đ/ngày effective rate** (đã cộng bonus 25 ngày).

### 19.3 Refund policy — Pro-rata bất kỳ lúc nào

```typescript
function computeRefund(payment: Payment, daysUsed: number): number {
  // Per-stage payment refund
  const dailyRate = payment.amount / payment.totalDaysInStage;
  return Math.max(0, payment.amount - (daysUsed * dailyRate));
}

// Vd:
// Trọn Gói 299k Day 1, hủy Day 15
//   → refund = 299k - (15 × (299k/60)) = 224.3k

// Stage 2 210k Day 8, hủy Day 14
//   → refund = 210k - (7 × 10k) = 140k

// Stage 1 70k Day 4, hủy Day 6
//   → refund = 70k - (3 × 10k) = 40k
```

**Trigger**: button "Tạm dừng & hoàn tiền" hiển thị mọi nơi trong widget.

**Backend automation**: auto-compute refund + tạo RefundRequest → Khang approve qua admin → MoMo/VietQR transfer (manual phase 1, auto phase 2).

**Edge case maintenance**: Maintenance Day 36-60 không tính vào refund (đó là bonus free).

### 19.4 Schema Payment update

```prisma
model PaymentLog {
  // ... existing fields
  
  // PHASE 7 — Stage-aware payment
  paidStage         JourneyStage?  // STAGE_1 / STAGE_2 / STAGE_3 / TRỌN_GÓI
  totalDaysInStage  Int?            // 4 (S1 pay) / 21 (S2) / 7 (S3) / 60 (Trọn Gói)
  amount            Int             // VND
  
  // Refund computation
  refundedAmount    Int    @default(0)  // partial refund possible
  refundedAt        DateTime?
  refundReason      String?
}
```

### 19.5 UX flow theo từng tier

#### Free Trial 3 ngày
- Day 1: Onboarding + baseline question + first cigarette log
- Day 2: Insight teaser ("Anh đã hút X điếu — pattern đang hình thành")
- Day 3 evening: paywall soft "Tiếp tục 4 ngày Stage 1 — 70k" + insight bonus preview

#### Stage 1 Paid (Day 4-7)
- Lock-in: "Anh đã đi 3 ngày, tiếp tục để hoàn thành insight 7 ngày"
- Soft intervention từ Day 5
- Day 7 evening: full insight report (PDF) + paywall Stage 2 + Trọn Gói upsell

#### Stage 2 Paid (Day 8-28, 21 ngày tapering)
- Day target hiển thị TO trên dashboard
- Adjust target nếu user struggling
- Week 1/2/3 voice arc khác nhau
- Day 28 evening: gate Stage 3

#### Stage 3 Paid (Day 29-35, 7 ngày stabilize)
- Streak counter big
- Identity exercise Day 30, 32, 34
- Day 35: celebration screen + maintenance unlock + Đại Sứ teaser

#### Maintenance FREE (Day 36-60, 18 ngày bonus)
- Dashboard giảm intensity: 1 tin/ngày
- Weekly check-in (Sunday only)
- Day 60: "Đại Sứ unlocked vĩnh viễn"

#### Đại Sứ FREE forever (Day 61+)
- Mentor mode: trả lời user mới qua chat
- Bonus content per quý
- Referral 89k cashback per successful referral
- Bonus vertical (rượu, sleep) — defer 6 tháng

### 19.6 Conversion math với pricing mới

**Funnel ước tính** (giả định 100 user signup):

```
100 Free Trial signup
  ↓ 30% chuyển Day 4 (cần aha moment đủ mạnh)
30 Stage 1 Paid (70k)  → 2.1tr revenue
  ↓ 50% pass gate + pay Stage 2
15 Stage 2 Paid (210k) → 3.15tr revenue
  ↓ 70% pass gate + pay Stage 3 (đã invest, hoàn tất)
10 Stage 3 Paid (70k) → 700k revenue

Hoặc bundle:
30 user pass Day 3 → 40% chọn Trọn Gói 299k (skip per-stage hassle)
12 Trọn Gói (299k) → 3.6tr revenue
```

**Total revenue per 100 signup**: ~6-7tr (per-stage) hoặc ~6-7tr (mix bundle).

→ **Need ~150 Free Trial signup/tháng để MRR 10tr**. Marketing zero-budget với content + WOM khả thi sau 3-4 tháng.

### 19.7 Risk + mitigation

**Risk 1**: User pay Stage 1 70k → refund 70k Day 4 (chưa qua) = 70k loss + processing cost. → Mitigation: refund "trừ daysUsed × 10k" — Day 4 refund chỉ 60k (đã dùng 1 ngày).

**Risk 2**: Stage 2 210k jump quá lớn từ 70k Stage 1. → Mitigation: Trọn Gói 299k sau Stage 1 = chỉ thêm 229k cho 28 ngày tiếp. Hoặc split Stage 2 thành 3 × 70k mỗi tuần (giảm friction).

**Risk 3**: Refund abuse — user pay 299k → refund Day 5 = 274k. → Mitigation: refund > 50% original chỉ allowed nếu lý do hợp lý (input field bắt buộc, Khang review).

**Risk 4**: Bundle 299k giảm 51k = mất margin. → Mitigation: Bundle pricing bonus = 25 ngày maintenance + community access = perceived value cao.


---

## 20. PRICING + STAGE STRUCTURE FINAL (chốt 2026-05-04 lần cuối)

### 20.1 Triết lý chốt cuối

Khang: "Đã có free rồi và tất cả các gói nhẹ nhàng không ép. Có thể trì hoãn lên chặng nên không cần discount khẩn cấp. Thiết kế đúng là gói 7, 14, 21 tổng 42 ngày."

→ **Đơn giản hoá**: 3 gói rõ ràng + 3 combo + free trial + maintenance bonus.

### 20.2 Stage structure RESTRUCTURED (7-14-21)

| Stage | Số ngày | Period (Day) | Mục tiêu |
|-------|---------|---------------|----------|
| 1 — Nhận thức | **7** | Day 1-7 | Quan sát + baseline + soft intervention từ Day 5 |
| 2 — Hành động | **14** | Day 8-21 | Tapering -50% Week 1, ≤2 điếu Week 2 |
| 3 — Ổn định | **21** | Day 22-42 | Giải phóng (7d) + Identity shift (7d) + Relapse prevention (7d) |

**Total paid experience**: 42 ngày.

### 20.3 Pricing structure FINAL

#### Per-stage:
- **Gói 1** (7 ngày Nhận thức): **70.000đ** (10k/ngày)
- **Gói 2** (14 ngày Hành động): **140.000đ** (10k/ngày)
- **Gói 3** (21 ngày Ổn định): **210.000đ** (10k/ngày)
- Sum riêng lẻ: 420k

#### Combo discounts:
- **Combo 1+2** (21 ngày): 189k (-10%, save 21k → 9.000đ/ngày)
- **Combo 2+3** (35 ngày): 280k (-20%, save 70k → 8.000đ/ngày)
- **Combo Trọn Gói 1+2+3** (42 ngày): **294k** (-30%, save 126k → **7.000đ/ngày**)

#### Free + Bonus:
- **Free Trial 3 ngày** (Day 1-3 Stage 1) — trải nghiệm trước pay
- **Maintenance bonus 18 ngày** (Day 43-60) — free sau Stage 3
- **Đại Sứ FREE forever** (Day 61+)

#### Total experience nếu Trọn Gói:
```
42 (paid) + 18 (maintenance) = 60 ngày tròn 2 tháng
Effective rate: 294k / 60 = 4.900đ/ngày
```

### 20.4 Tapering plan Stage 2 mới (14 ngày, 2 weeks)

```typescript
function computeWeeklyTarget(week: 1|2, baseline: Baseline): number {
  const reduction = { 1: 0.5, 2: 1.0 }[week]; // -50% → ≤2
  if (week === 2) return Math.min(2, Math.max(0, baseline.avgCigarettesPerDay * (1 - reduction)));
  return Math.round(baseline.avgCigarettesPerDay * (1 - reduction));
}
```

Vd baseline 10 điếu/ngày:
- Week 1 (Day 8-14): target 5 điếu/ngày
- Week 2 (Day 15-21): target ≤ 2 điếu/ngày

### 20.5 Stage 3 mới (21 ngày, 3 weeks)

| Week | Period | Mục tiêu |
|------|--------|----------|
| 1 — Giải phóng | Day 22-28 | 7 ngày ≤ 1 điếu/ngày, build streak |
| 2 — Identity shift | Day 29-35 | 7 ngày "tôi đang sống không cần thuốc", group cohort |
| 3 — Relapse prevention | Day 36-42 | 7 ngày scenario coping, plan B test, graduation |

### 20.6 Schema PaymentLog refined

```prisma
enum PaymentTier {
  GOI_1_AWARENESS         // 7d × 10k = 70k
  GOI_2_ACTION             // 14d × 10k = 140k
  GOI_3_STABILIZE          // 21d × 10k = 210k
  COMBO_1_2                 // 189k (10% off)
  COMBO_2_3                 // 280k (20% off)
  COMBO_TRON_GOI            // 294k (30% off)
}

model PaymentLog {
  // ... existing
  
  tier              PaymentTier
  baseAmount        Int          // pre-discount: 70/140/210/420
  finalAmount       Int          // post-discount: same | 189 | 280 | 294
  discountPercent   Int          // 0 | 10 | 20 | 30
  totalDaysCovered  Int          // 7 | 14 | 21 | 21 | 35 | 42
  refundedAmount    Int          @default(0)
}
```

### 20.7 Refund pro-rata mới

```typescript
function computeRefund(payment: PaymentLog, daysUsedInPaid: number): number {
  const dailyRate = payment.finalAmount / payment.totalDaysCovered;
  return Math.max(0, payment.finalAmount - (daysUsedInPaid * dailyRate));
}

// Vd 1: Trọn Gói 294k Day 1, hủy Day 21 (đã dùng 21 paid days)
//   → refund = 294k - (21 × (294k/42)) = 294k - 147k = 147k

// Vd 2: Combo 2+3 280k Day 8 (Stage 2 Day 1), hủy Day 22 (đã dùng 14)
//   → refund = 280k - (14 × (280k/35)) = 280k - 112k = 168k

// Vd 3: Gói 1 70k Day 4, hủy Day 6
//   → refund = 70k - (3 × 10k) = 40k
```

### 20.8 UX flow per gói

#### Free Trial 3 ngày
- Onboarding + log điếu Day 1
- Insight teaser Day 2-3
- Day 3 evening: paywall menu chọn Gói 1 / Combo 1+2 / Trọn Gói

#### Gói 1 (Day 4-7, sau Day 3 trial)
- Continue Stage 1 với insight đầy đủ
- Day 7: gate + offer Gói 2 / Combo 2+3 / continue free Day 8 với basic content?

**Câu hỏi UX**: Day 8+ user chưa pay Gói 2, nhưng đã pay Gói 1 → app ở trạng thái nào?
- A. Lock toàn bộ, force pay Gói 2 hoặc bỏ
- B. Allow stay in Stage 1 mode (continued logging) — không có Stage 2 content
- C. Show upgrade reminder mỗi ngày, app vẫn dùng được nhưng giảm intensity

→ Em đề xuất **B** (anh nói "có thể trì hoãn lên chặng") — app KHÔNG ép, user tự quyết khi nào pay tiếp.

#### Gói 2 (14 ngày)
- Daily target dashboard
- Tapering 2 weeks
- Day 21 evening: gate + offer Gói 3

#### Gói 3 (21 ngày)
- Streak counter
- Identity exercises
- Day 42 evening: graduation + maintenance unlock

#### Maintenance 18 ngày (Day 43-60) — FREE
- Weekly check-in
- Đại Sứ teaser

#### Đại Sứ FREE forever (Day 61+)

### 20.9 Conversion funnel với pricing mới

**Giả định 100 Free Trial signup**:

```
100 Free Trial (3 ngày)
  ↓ 30% pay Gói 1 hoặc upper combo
    ↓ 18 pay Gói 1 (70k) = 1.26tr
    ↓ 8 pay Combo 1+2 (189k) = 1.51tr
    ↓ 4 pay Trọn Gói 294k = 1.18tr
  
30 user paying total: ~3.95tr revenue/100 signup

Of these:
  - 18 Gói 1 → 50% upgrade Gói 2 hoặc Combo 2+3 = 9 user
    - 6 pay Gói 2 (140k) = 840k
    - 3 pay Combo 2+3 (280k) = 840k
  - All in Stage 2 (8+4+9 = 21) → 70% pass + Stage 3 = 15 user
    - Of which 11 already paid (Combo 1+2 hoặc Trọn Gói)
    - 4 pay Gói 3 (210k) = 840k
  
Total revenue per 100 signup: ~6.5tr (mix per-stage + combos)
Average revenue per paying user: ~217k
Conversion rate: 30% (Free → Paid Gói 1)
Bundle attach rate: 12/30 = 40% (chọn combo thay per-stage)
```

→ Cần 150-200 Free Trial signup/tháng để MRR 10tr.

### 20.10 Risk + mitigation FINAL

| Risk | Mitigation |
|------|------------|
| User pay Gói 1 70k → không upgrade Gói 2 → cash flow thấp | Combo 1+2 189k giảm 10% incentive — convert lúc Day 7 |
| User trì hoãn lâu giữa stages (vd 2 tuần Stage 1) | App allow trì hoãn, không expire — trust building |
| Refund abuse | Max 80% refund first 7 ngày, sau đó pro-rata 100% |
| Combo Trọn Gói 30% off mất margin | Bonus 25 ngày maintenance + lifetime Đại Sứ → perceived value cao |
| Stage 2 14 ngày aggressive tapering (-50% Week 1) | Adaptive — user có thể adjust target ±20%, fail policy không restart |

