# 🎯 Sol — UX Flow End-to-End

> Tài liệu user journey full flow Sol / Đi Cùng Sol. Đọc file này để hiểu user touch những đâu, server làm gì, lúc nào hiện gì.
>
> Mỗi flow có ASCII diagram + bullet step + edge case.
>
> **Last updated**: 2026-05-23
> **Maintainer**: Khang Sol

---

## Tổng quan 6 flow chính

| # | Flow | Trigger | Goal |
|---|---|---|---|
| 1 | First-time visitor | Click link landing | Onboard FTND → cohort |
| 2 | Returning user | Mở dashboard có token | Hero Journey Simulator |
| 3 | Daily Check-in | 20:00 push notif | Layer 1+2 entry log |
| 4 | Q-Day Ceremony | Reach cohort.qDay | Confirm Tự Do |
| 5 | Payment VietQR | Click upgrade gói | Tier KHOI_DONG/DONG_HANH |
| 6 | Sổ Lưu Niệm | Reach cohort.total | Generate album shareable |

---

## 1. First-time visitor (anonymous)

### Diagram

```
[Landing https://bothuocla.sol.vn/]
            │
            ▼
   App.tsx detect localStorage
            │
            ▼  (KHÔNG có sol_token)
   ┌──────────────────────────┐
   │  Auto bootstrap:         │
   │  gen UUID v4 deviceUid   │
   │  save localStorage       │
   │  POST /auth/anonymous    │
   │  { deviceUid, origin }   │
   └──────────────┬───────────┘
                  ▼
       Backend response { token, user }
                  │
                  ▼
      localStorage.sol_token = token
                  │
                  ▼  (user.ftndScore == null → cần onboard)
            navigate('/test-ftnd')
                  │
                  ▼
   ┌──────────────────────────┐
   │ TestFtnd.tsx — 4 phase   │
   │ ├─ intro (hero CTA)      │
   │ ├─ questions (6 câu)     │
   │ ├─ submitting (2.8s)     │
   │ └─ result (8 section)    │
   └──────────────┬───────────┘
                  ▼
   POST /journey/onboarding/ftnd
   { answers: [...] }
                  │
                  ▼
   Backend compute score 0-10
   Backend computeCohort(score) → LIGHT/MODERATE/HEAVY
   Backend persist user.ftndScore + user.ftndCohort
                  │
                  ▼
   Response { score, cohort, label, cohortPlan }
                  │
                  ▼
   ┌──────────────────────────────────┐
   │ Result phase HOLD trên page     │
   │ render 8 marketing section       │
   │ (KHÔNG redirect — phễu lọc)     │
   └──────────────┬───────────────────┘
                  ▼
        User click "Bắt đầu hành trình"
                  │
                  ▼
        navigate('/') = Hành Trình
                  │
                  ▼
   Overview.tsx render JourneySimulator
   với cohort của anh
```

### Step chi tiết

1. **Landing**: User mở `https://bothuocla.sol.vn/` (qua organic search hoặc Khang share Facebook).
2. **App.tsx bootstrap**:
   - Kiểm tra `localStorage.sol_token`
   - Nếu có → fetch `GET /users/me` verify
   - Nếu không có → gen UUID v4 → `POST /api/auth/anonymous { deviceUid }`
3. **Backend `/auth/anonymous`**:
   - `prisma.user.upsert` theo deviceUid (atomic, race-safe)
   - Sign JWT 30 ngày
   - Response `{ token, user: { id, ftndScore: null, ftndCohort: null, quitDate: null } }`
4. **Redirect logic**:
   - `user.ftndScore == null` → `/test-ftnd`
   - `user.ftndScore != null && user.quitDate == null` → `/test-ftnd?result=...` (re-show result)
   - Else → `/` (Hành Trình)
5. **TestFtnd.tsx flow**:
   - Intro: hero "Test Mức Lệ Thuộc Nicotin" + bullets + CTA "Bắt đầu test (2 phút)"
   - Questions: 6 câu Fagerström radio buttons + progress bar
   - Submitting: 3-step dramatic animation 2.8s (em đã chốt UX 22/5)
   - Result: 8 section marketing (xem [09-DECISIONS.md](./09-DECISIONS.md) "Test FTND result page = trang marketing")
6. **POST `/journey/onboarding/ftnd`**:
   - Server compute Fagerström weighted score 0-10
   - `computeCohort(score)` → LIGHT (0-3) / MODERATE (4-6) / HEAVY (7-10)
   - Persist `user.ftndScore` + `user.ftndCohort`
   - Response label tiếng Việt: "NHẸ" / "VỪA" / "NẶNG"
7. **HOLD trên `/test-ftnd?result=...`**:
   - App.tsx SKIP redirect khi `pathname === '/test-ftnd' && searchParams.has('result')`
   - User scroll qua 8 section, có thể share Facebook screenshot
8. **CTA cuối** "Bắt đầu hành trình của anh" → `navigate('/')` → Overview.tsx render Hero Journey Simulator.

### Edge cases

- **Rate-limit hit**: nếu user reload nhiều → `429` → show "Đợi 1 phút rồi thử lại". Backend whitelist `/auth/anonymous` 5/min per IP (đủ cho legit user).
- **Cross-domain transfer**: nếu user từ `sol.vn` click → bothuocla qua URL `?sol_token=...`, App.tsx parse + save trước khi bootstrap anonymous.
- **Already onboarded**: nếu user clear localStorage nhưng backend còn user (cookie deviceUid match) → upsert match cũ → load lại cohort.

---

## 2. Returning user flow (đã có quitDate)

### Diagram

```
[User mở https://bothuocla.sol.vn/]
            │
            ▼
   App.tsx detect localStorage.sol_token có
            │
            ▼
   GET /users/me — verify token
            │
            ▼ (user.ftndCohort + user.quitDate có)
   Route auto → '/' (Hành Trình)
            │
            ▼
   ┌─────────────────────────────────────────┐
   │ Overview.tsx mount:                     │
   │ 1. GET /journey/dashboard               │
   │    → journeyV2 + qDayV2 + milestones   │
   │ 2. Render DailyJourneyAlert (pulse top) │
   │ 3. Render JourneySimulator (HERO)      │
   │ 4. Render Phase view (cohort-aware)    │
   │ 5. Render widgets (ControlScore,        │
   │    AnonymousStats, ...)                 │
   └─────────────┬───────────────────────────┘
                 ▼
   User tương tác:
   ─ Kéo slider Day 0→730 thấy body recovery curves
   ─ Click "Hôm nay" về vị trí thực
   ─ Click milestone xem nguồn CDC/NHS
   ─ Click sidebar "Trò chuyện" → /chat
   ─ Click "Nhật Ký & Check-in" → /journey grid 88-day
```

### Step chi tiết

1. **localStorage có token**: App.tsx skip bootstrap anonymous.
2. **GET `/users/me`**: verify JWT chưa hết hạn + lấy user info đầy đủ.
3. **Route `/`**: Overview.tsx mount.
4. **Fetch `/journey/dashboard`**:
   ```json
   {
     "journeyV2": {
       "cohort": "MODERATE",
       "dayInJourney": 12,
       "chapter": "Kiểm Soát",
       "chapterIndex": 2,
       "totalDays": 52,
       "qDayDay": 22
     },
     "qDayV2": {
       "qDayDate": "2026-06-14",
       "daysToQDay": 10,
       "needsConfirmation": false
     },
     "milestones": [...]
   }
   ```
5. **Render layout**:
   ```
   ┌─────────────────────────────────────────────────┐
   │ 🔔 DailyJourneyAlert (pulse banner)             │
   │   "Ngày 12 — Cơ thể anh đang...."               │
   ├─────────────────────────────────────────────────┤
   │ 🗺️ JourneySimulator                              │
   │ ┌─ slider Day 0 ─ ▼Hôm nay (12) ─── 730 ─┐    │
   │ │ [Hôm nay] [1 tuần] [1 tháng] [3 tháng]  │    │
   │ │                                            │    │
   │ │ Stats: 240 điếu  | 240k đ  | 44h tuổi thọ │   │
   │ │ Rings: ❤️ 25% 🫁 13% 🧠 47% 🛡️ 34%        │   │
   │ │                                            │    │
   │ │ Milestones đạt hôm nay:                   │    │
   │ │ ─ Day 7  Mạch máu giãn (J Am Coll Cardiol)│   │
   │ │ ─ Day 14 Lông mao tái tạo (Surgeon Gen)   │   │
   │ └────────────────────────────────────────────┘   │
   ├─────────────────────────────────────────────────┤
   │ 📊 PhaseBar (cohort widths)                     │
   │ 🛡️ Nhận Diện (7d) | 🎯 Kiểm Soát (14d) ◀ here  │
   ├─────────────────────────────────────────────────┤
   │ Phase view: PhaseAction (Kiểm Soát chapter)     │
   ├─────────────────────────────────────────────────┤
   │ ControlScoreWidget | AnonymousStatsWidget       │
   └─────────────────────────────────────────────────┘
   ```
6. **Sidebar layout**:
   ```
   ┌────────────────────────┐
   │  Sol (logo)            │
   ├────────────────────────┤
   │  🗺️ Hành Trình      ◀ │ (active default — /)
   │  💬 Trò chuyện         │ (/chat)
   │  📖 Đọc                │ (/read)
   │  🎧 Nghe Khang         │ (/voice)
   │  ✉️ Hỏi Khang          │ (/ask-khang)
   │  📔 Nhật Ký & Check-in │ (/journey)
   │  🎀 Sổ Lưu Niệm        │ (/workbook)
   │  📊 Phân tích          │ (/analytics)
   │  ⚙️ Cài đặt            │ (/settings)
   │                        │
   │  Tier: KHOI_DONG       │
   │  Day 12 / 52 (MODERATE)│
   └────────────────────────┘
   ```

### Edge cases

- **Token expired**: GET /users/me → 401 → App.tsx clear localStorage → re-bootstrap anonymous (mất state — TODO bind email/Zalo để rescue).
- **No cohort set** (legacy user trước migrate 23/5): journeyV2 = null → frontend fallback render `journey` (legacy 88-day rigid). User cần re-test FTND ở Settings để bind cohort.
- **Slider performance**: dùng `useMemo` + debounce 50ms trên onChange để rings không lag khi kéo.

---

## 3. Daily Check-in flow

### Diagram

```
   [20:00 push notif]
            │
            ▼
   Zalo OA + Web Push notification
   "🌙 Tối nay anh thế nào?"
            │
            ▼  user click
   Deep link → /journey?day=12
            │
            ▼
   Journey.tsx grid 88-day cohort-aware
   render CheckIn modal cho dayInJourney
            │
            ▼
   ┌────────────────────────────────────┐
   │  Layer 1 (5 nhanh, 3 nút):         │
   │   "Hôm nay anh thấy thế nào?"      │
   │   [😌 Ổn] [😐 Bình thường] [😟 Khó] │
   │                                    │
   │  Layer 2 (deep — nếu chọn Khó):    │
   │   "Lúc nào căng nhất?"             │
   │   "Anh đã làm gì để qua?"          │
   │   "Bài học hôm nay?"               │
   └────────────────┬───────────────────┘
                    ▼
   POST /checkins
   { dayInJourney, mood, triggers, journal }
                    │
                    ▼
   Backend save CheckIn row
   Backend update User.checkinStreak
   Backend recompute risk score (background)
   Backend trigger memoryBook entry if milestone day
                    │
                    ▼
   Response { ok, streak, riskScore, badges }
                    │
                    ▼
   UI confirmation "✅ Đã ghi nhận. Streak: 12 ngày 🔥"
```

### Step chi tiết

1. **20:00 cron job** (`evening_checkin_reminder`) — đẩy Notification row vào DB queue
2. **`* * * * *` cron** `deliverDueNotifications` — flush queue ra:
   - Zalo ZNS template (nếu user bind Zalo)
   - Web Push VAPID (nếu subscribed)
   - In-widget banner (next visit)
3. **User click**: deep link `https://bothuocla.sol.vn/journey?day=12&checkin=true`
4. **Journey.tsx**:
   - Grid 88-day cohort-aware: render Day 1 → cohort.total (35/52/65) + tái thiết extension Day 36+/53+/66+
   - Phase badges Nhận Diện / Kiểm Soát / Làm Chủ (dynamic widths)
   - Q-Day marker đỏ ở `cohort.qDay`
   - Auto-open CheckIn modal nếu `?checkin=true`
5. **CheckIn form Layer 1**: Mood 3 button (😌😐😟)
6. **CheckIn form Layer 2** (chỉ nếu mood=😟 hoặc user click "Viết thêm"): 3 textarea
7. **POST `/checkins`**:
   - Save CheckIn row với dayInJourney, mood, triggers[], journal, createdAt
   - Update `user.checkinStreak` (+1 nếu yesterday cũng checkin; reset nếu missed)
   - Schedule risk score recompute (hourly cron đọc CheckIn 7d gần nhất)
   - Trigger memoryBook entry nếu là milestone day (7/14/cohort.qDay/cohort.total)
8. **Response**: streak + riskScore (0-100) + badges (nếu có)
9. **UI confirmation**: toast "✅ Đã ghi nhận. Streak: X ngày 🔥"

### 19:00 missed-day reminder

```
   [19:00 cron]
            │
            ▼
   Find users NOT checkin today
            │
            ▼  per user
   POST Notification queue type="missed_day_reminder"
            │
            ▼  next minute cron deliverDue
   Zalo + Web Push "⏰ Anh quên ghi nhật ký..."
```

### Edge cases

- **Missed >3 ngày**: `risk score` tăng → frontend banner đỏ "Anh có cần Khang gọi?" → hiện CTA "Hỏi Khang" với deep concern message.
- **Streak break**: KHÔNG punish (Sol triết lý "Quay lại không phải thất bại — là dữ liệu"). Reset streak nhưng giữ history.
- **Layer 2 optional**: user có thể skip → vẫn save CheckIn với Layer 1 only.

---

## 4. Q-Day Ceremony flow

### Diagram

```
   [User Day = cohort.qDay]
   (Day 15 LIGHT / Day 22 MODERATE / Day 22-28 HEAVY)
            │
            ▼
   /journey/dashboard return:
   qDayV2.needsConfirmation = true
            │
            ▼
   Overview.tsx detect → render QDayCeremony overlay
            │
            ▼
   ┌─────────────────────────────────────────┐
   │ 🌅 Ngày Tự Do                           │
   │                                          │
   │ "Anh ơi, hôm nay là Ngày Tự Do.        │
   │  Từ giờ phút này, anh không còn        │
   │  điếu nào nữa — cam kết với chính       │
   │  bản thân.                              │
   │                                          │
   │  Anh có sẵn sàng?"                      │
   │                                          │
   │  [📝 Để mai đi]  [✊ Tôi cam kết]       │
   └──────────────────┬──────────────────────┘
                      ▼ click "Tôi cam kết"
   POST /journey/qday-confirm
                      │
                      ▼
   Backend set user.qDayConfirmedAt = now
   Backend trigger MemoryBook entry "Q-Day ceremony"
   Backend schedule Day 30 milestone notif
                      │
                      ▼
   Response { ok, qDayConfirmedAt }
                      │
                      ▼
   Overlay close + confetti animation
                      │
                      ▼
   JourneySimulator NOW shows:
   "🎉 Đồng hồ Tự Do: 0 giờ - 0 phút - 0 giây"
   (tăng dần real-time qua setInterval)
```

### Step chi tiết

1. **Detect trigger**: backend service `buildQDayV2(user)`:
   - `dayInJourney >= cohort.qDay`
   - `user.qDayConfirmedAt == null`
   - → `needsConfirmation = true`
2. **Overview.tsx mount**: read `qDayV2.needsConfirmation` → mount `<QDayCeremony />` overlay
3. **Modal**: tone trang trọng, không vội. Có 2 button:
   - "Để mai đi" → close overlay → lasted 24h then re-show
   - "Tôi cam kết" → POST /journey/qday-confirm
4. **POST `/journey/qday-confirm`**:
   - `user.qDayConfirmedAt = now()`
   - Insert MemoryBook entry type="qday_ceremony" với screenshot snapshot
   - Schedule Day 30/60/90 milestone notifications (relative to qDay)
   - Send Zalo OA "Khang chúc mừng anh"
5. **Đồng hồ Tự Do bắt đầu chạy**:
   - JourneySimulator hiện counter live "X ngày Y giờ" tính từ `qDayConfirmedAt`
   - Body recovery rings reset tính từ Q-Day (Day 0 = qDayConfirmedAt)
   - Sidebar badge "✊ Đã qua Q-Day" hiển thị

### Edge cases

- **User skip Q-Day** (đi quá Day 28 HEAVY mà chưa confirm): show banner ấm "Anh có muốn dời Q-Day?" với option chọn ngày khác (max +7 ngày).
- **Lapse trước Q-Day**: KHÔNG punish — Sol triết lý. Reset dayInJourney về Day 1 + bump cohort lên 1 bậc (LIGHT → MODERATE).
- **User undo Q-Day**: KHÔNG cho. Chỉ có thể "Quay lại" qua lapse log.

---

## 5. Payment flow (VietQR)

### Diagram

```
   [User click "Nâng cấp gói" (sidebar hoặc CTA)]
            │
            ▼
   /pricing page
            │
            ▼
   ┌─────────────────────────────────────────┐
   │ 3 cohort card (cohort-aware default):   │
   │                                          │
   │  🟢 LIGHT       🟡 MODERATE   🔴 HEAVY  │
   │  140k/35d       225k/52d      290k/65d  │
   │  [Chọn]         [Chọn ◀]       [Chọn]   │
   │                  (your cohort)            │
   │                                          │
   │  Alternative payment:                   │
   │  Per-week 35k/tuần                      │
   └──────────────────┬──────────────────────┘
                      ▼ click "Chọn MODERATE"
   POST /payments/vietqr/intent
   { tier: "DONG_HANH", amount: 225000 }
                      │
                      ▼
   Backend gen Payment row + addInfo "SOL <userId>"
   Backend response { qrUrl: "img.vietqr.io/...", amount, addInfo, accountInfo }
                      │
                      ▼
   ┌──────────────────────────────────────────┐
   │ VietQRModal:                             │
   │                                          │
   │  📱 Mở app banking quét QR              │
   │  [ QR code 280×280 ]                    │
   │                                          │
   │  Hoặc chuyển khoản:                     │
   │  Tên: NGUYEN DINH KHANG                │
   │  Ngân hàng: MB Bank / TCB / ...         │
   │  STK: 0123456789                        │
   │  Số tiền: 225.000đ                      │
   │  Nội dung: SOL abc12345                 │
   │                                          │
   │  [✓ Tôi đã chuyển]                      │
   └─────────────────┬───────────────────────┘
                     ▼
   User CK qua app banking
                     │
                     ▼
   Khang (admin) check banking → /admin/payments
                     │
                     ▼
   Admin click "Mark PAID" → POST /admin/payments/:id/confirm
                     │
                     ▼
   Backend update PaymentLog status=PAID
   Backend upsert UserTier (KHOI_DONG / DONG_HANH)
   Backend send Zalo OA "🎉 Anh đã upgrade thành công"
                     │
                     ▼  
   User next session refresh → tier features unlock
```

### Step chi tiết

1. **Click Nâng cấp**: từ sidebar "💎 Nâng cấp" hoặc CTA inline ("Anh đã đến lúc upgrade")
2. **Pricing page**: 3 cohort card với default highlight cohort của user. Per-week alternative show secondary.
3. **POST `/payments/vietqr/intent`**:
   - Tạo Payment row pending status
   - Gen addInfo unique = `SOL <userId>` 8 ký tự
   - Compute amount theo tier:
     - KHOI_DONG: 99k (alternative legacy)
     - DONG_HANH: theo cohort 140/225/290k
   - Response qrUrl từ format `https://img.vietqr.io/image/{BIN}-{ACC}-compact2.png?amount=X&addInfo=...`
4. **VietQRModal**: show QR + thông tin số TK + addInfo (để user nhập đúng)
5. **User CK**: app banking quét QR auto-fill, user xác nhận → tiền vào TK Khang
6. **Khang verify**: /admin/payments list pending → match nội dung CK `SOL abc12345` với userId → "Mark PAID"
7. **POST `/admin/payments/:id/confirm`**:
   - PaymentLog.status = PAID + paidAt = now
   - Upsert UserTier (KHOI_DONG/DONG_HANH) với startAt + endAt
   - Trigger Zalo OA "Cám ơn anh đã upgrade" + onboarding tier message
8. **User refresh**: GET /users/me trả tier mới → unlock workbook write, voice library, báo cáo Day 10, ...

### Edge cases

- **Webhook chưa wire**: TODO Phase 2 — MB Bank API webhook tự động match addInfo → trigger confirm. Phải register MB Bank dev account.
- **User CK sai số tiền**: refund queue → Khang manual confirm với note.
- **Duplicate payment**: backend check user đã có tier active → block POST intent.
- **Refund**: User có thể request refund pro-rated từ Day 15 (DONG_HANH spec). Queue → admin manual approve.

---

## 6. Sổ Lưu Niệm trigger

### Diagram

```
   [User dayInJourney == cohort.total]
   (Day 35 LIGHT / Day 52 MODERATE / Day 65 HEAVY)
            │
            ▼
   Daily cron job 7:30 (`recompute_journey_streak`):
   ─ For each user with dayInJourney == cohort.total
   ─ Check memoryBookGenerated == null
   ─ Trigger generateMemoryBook(userId)
            │
            ▼
   memoryBook.ts:
   ─ Aggregate CheckIn rows (full 35/52/65 days)
   ─ Stats: cigsAvoided, moneySaved, streak best, lapses recovered
   ─ Quotes: pick top 5 journal entries by sentiment
   ─ Photos: progress photos (nếu user upload)
   ─ Body recovery rings snapshot (final %)
   ─ Render HTML album template
   ─ Save to /var/www/sol-widget-old/memory-books/<userId>.html
   ─ Update user.memoryBookGenerated = now
            │
            ▼
   JourneySimulator banner pulse (next visit):
   "📖 Sổ Lưu Niệm của anh đã sẵn sàng"
            │
            ▼  user click
   /workbook/memory-book/<userId>
            │
            ▼
   ┌──────────────────────────────────────┐
   │ Memory Book album HTML:              │
   │                                      │
   │  🎉 Anh đã hoàn thành hành trình     │
   │                                      │
   │  [Photo collage 6 ảnh]               │
   │                                      │
   │  Stats:                              │
   │  ─ 1,560 điếu KHÔNG đốt              │
   │  ─ 1.56 triệu tiết kiệm              │
   │  ─ 286 giờ tuổi thọ thêm             │
   │                                      │
   │  Body recovery final:                │
   │  ❤️ 30% 🫁 16% 🧠 56% 🛡️ 42%         │
   │                                      │
   │  Best moments:                       │
   │  "Ngày 7 — Tôi không còn thèm        │
   │   sau bữa cơm. Khang đúng rồi."     │
   │   ...                                │
   │                                      │
   │  [📄 Tải PDF] [📲 Share Zalo/FB]    │
   └──────────────────────────────────────┘
```

### Step chi tiết

1. **Cron daily 7:30** scan users qualified
2. **Check trigger**: `user.dayInJourney == user.ftndCohort.total && user.memoryBookGenerated == null`
3. **Generate**:
   - Aggregate from CheckIn + Lapse + Stats tables
   - Pick top 5 quotes (sentiment positive)
   - Render Pug/EJS template → HTML
   - Save file `/var/www/sol-widget-old/memory-books/<userId>.html`
   - Update `user.memoryBookGenerated = now`
4. **Notify**: Zalo OA "📖 Sổ Lưu Niệm của anh đã sẵn sàng" + deep link
5. **JourneySimulator banner**: next visit → pulse "📖 Sổ Lưu Niệm sẵn sàng"
6. **User view**: `/workbook/memory-book/<userId>` render HTML
7. **Export PDF**: client-side print-to-PDF (browser API) — không cần backend
8. **Share Zalo/FB**: Web Share API → native share sheet → user post lên timeline cá nhân (viral!)

### Trigger boundaries

| Cohort | Trigger Day | Total days |
|---|---|---|
| LIGHT | Day 35 | 35 (7+7+21) |
| MODERATE | Day 52 | 52 (7+14+30+1 wrap) |
| HEAVY | Day 65 | 65 (7+21+30+7 wrap) |

**Bỏ trigger cũ** D30/60/90/180/365 (theo quyết định 23/5 — xem [09-DECISIONS.md](./09-DECISIONS.md) "Memory Book trigger align cohort").

### Edge cases

- **User dropout giữa chừng** (mất stage Liberation): vẫn sinh "Sổ Lưu Niệm rút lui văn minh" theo spec ProgressJournal — ghi nhận progress đã đi được.
- **User undo Q-Day** (KHÔNG cho per quyết định trên): không trigger memorybook duplicate.
- **Backend cron chưa wire trigger Day 35/52/65**: hiện code `memoryBook.ts` còn check D30/60/90 — TODO migrate (2-3h effort 23/5 chiều, đã planned trong [09-DECISIONS.md](./09-DECISIONS.md)).

---

## Tham khảo

- [05-ARCHITECTURE.md](./05-ARCHITECTURE.md) — kiến trúc đầy đủ
- [12-JOURNEY_SIMULATOR_DESIGN.md](./12-JOURNEY_SIMULATOR_DESIGN.md) — formula + citations
- [14-FUNCTIONAL_MAP.md](./14-FUNCTIONAL_MAP.md) — sơ đồ chức năng
- [09-DECISIONS.md](./09-DECISIONS.md) — technical decisions log

---

**Last updated**: 2026-05-23
**Maintainer**: Khang Sol
