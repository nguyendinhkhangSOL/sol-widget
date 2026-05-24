# 🗺️ Sol — Functional Map

> Sơ đồ chức năng đầy đủ Sol / Đi Cùng Sol — pages, components, API endpoints, cron jobs, tier gating matrix, cohort features matrix.
>
> Dùng khi anh cần tra cứu nhanh "feature X nằm ở file nào, endpoint gì, cron nào trigger?".
>
> **Last updated**: 2026-05-23
> **Maintainer**: Khang Sol

---

## 1. Frontend Pages Map (sidebar items)

### Dashboard pages (`bothuocla.sol.vn`)

| Sidebar label | URL | Component | Mục đích |
|---|---|---|---|
| 🗺️ **Hành Trình** | `/` | `Overview.tsx` | HERO Tổng Quan — JourneySimulator + DailyAlert + Phase view |
| 💬 Trò chuyện | `/chat` | `Chat.tsx` | AI Sol mentor — Claude Haiku/Sonnet |
| 📖 Đọc | `/read` | `Read.tsx` | SEO articles inline + wiki link out |
| 🎧 Nghe Khang | `/voice` | `Voice.tsx` | Voice MP3 library (tier-gated) |
| ✉️ Hỏi Khang | `/ask-khang` | `AskKhang.tsx` | Khang Q&A mailbox + AI escalate |
| 📔 **Nhật Ký & Check-in** | `/journey` | `Journey.tsx` | Grid 88-day cohort-aware + CheckIn form |
| 🎀 **Sổ Lưu Niệm** | `/workbook` | `Workbook.tsx` | 5-tab phase + Memory Book album |
| 📊 Phân tích | `/analytics` | `Analytics.tsx` | Stats personal — moods, triggers, money saved |
| ⚙️ Cài đặt | `/settings` | `Settings.tsx` | Profile, pronouns, notif prefs, recovery code |

### Outside Layout (anonymous flows)

| URL | Component | Mục đích |
|---|---|---|
| `/test-ftnd` | `TestFtnd.tsx` | Onboarding FTND 4-phase + result marketing |
| `/login` | `Login.tsx` | Email magic link entry |
| `/auth/email` | `AuthEmail.tsx` | Magic link send + verify |
| `/auth/email/verify` | (route handler) | Verify token → save JWT → redirect / |
| `/pricing` | `Pricing.tsx` | 3 cohort card + VietQR modal |
| `/refund` | `Refund.tsx` | Refund request form |
| `/recovery` | `Recovery.tsx` | Recovery code rescue path |
| `/q-day-checklist` | `QDayChecklist.tsx` | Q-Day prep checklist preview |
| `/science` | `Science.tsx` | Science references public |
| `/doc` (Khoảng Lặng) | `SilentDoc.tsx` | Anonymous confession pre-login |

### Other secondary pages (linked from sidebar contextual)

| URL | Component | Mục đích |
|---|---|---|
| `/history` | `History.tsx` | Old check-in history (legacy view) |
| `/reports` | `Reports.tsx` | Báo cáo Day 10/30 (KHOI_DONG+) |
| `/nghe` | `Nghe.tsx` | Voice index trong wiki style |
| `/hoi` | `Hoi.tsx` | Hỏi index trong wiki style |
| `/journey/:day` | `Journey.tsx` | Deep link cụ thể 1 ngày |
| `/workbook/memory-book/:userId` | `MemoryBook.tsx` | Memory Book album viewer |

---

## 2. Component Tree (key components)

### Overview (Hành Trình HERO)

```
Overview.tsx
├── <DailyJourneyAlert />              banner pulse 1 alert/day
│   ├── alert from dailyJourneyAlerts.ts (27 curated)
│   ├── animate-pulse-slow 2s loop
│   └── localStorage dismiss/day
│
├── <JourneySimulator />               HERO time-travel
│   ├── <SliderTimeTravel />           Day 0 → 730
│   │   ├── quick jumps × 5
│   │   └── marker ▼ Hôm nay
│   │
│   ├── <HeroStats />                  × 3 number live
│   │   ├── Điếu KHÔNG đốt
│   │   ├── Tiền tiết kiệm
│   │   └── Tuổi thọ thêm (phút)
│   │
│   ├── <RecoveryRingGrid />           × 4 SVG circles
│   │   ├── 🫀 Tim mạch (red)
│   │   ├── 🫁 Phổi (blue)
│   │   ├── 🧠 Não bộ (purple)
│   │   └── 🛡️ Miễn dịch (green)
│   │
│   └── <MilestoneList />              28 milestones filter by day
│       └── ─ link to CDC/NHS/AHA source
│
├── <PhaseBar />                       4-chapter visualization
│   ├── widths dynamic theo cohort
│   ├── Q-Day marker đỏ
│   └── current chapter highlight
│
├── <PhaseView />                      conditional render
│   ├── <PhaseObserver />              Chapter 1 (Nhận Diện)
│   ├── <PhaseAction />                Chapter 2 (Kiểm Soát)
│   ├── <PhaseLiberation />            Chapter 3 (Làm Chủ)
│   └── <PhaseRebuild />               Chapter 4 (Tái Thiết — bonus)
│
├── <ControlScoreWidget />             mastery score 0-100
└── <AnonymousStatsWidget />           "X anh em cùng anh đang Day Y"
```

### Other key shared components

```
components/
├── Sidebar.tsx                        Nav 9 items + tier badge + day badge
├── Layout.tsx                         Container 1200px + Sidebar + main
├── CohortBadge.tsx                    🟢 NHẸ / 🟡 VỪA / 🔴 NẶNG pill
├── QDayCeremony.tsx                   Overlay Q-Day confirmation modal
├── VietQRModal.tsx                    QR display + bank info + confirm CK
├── CheckInForm.tsx                    Layer 1 mood + Layer 2 deep
├── CrisisTimer.tsx                    90s craving timer (floating button)
├── LapseLog.tsx                       "Quay lại" entry form
└── views/
    ├── phaseB/ PhaseObserver.tsx     Observe → log triggers (Chap 1)
    ├── phaseC/ PhaseAction.tsx       Reduce + crisis timer (Chap 2)
    ├── phaseD/ PhaseLiberation.tsx   Q-Day + rebuild (Chap 3)
    └── phaseE/ PhaseRebuild.tsx      Tái Thiết extension (post-cohort.total)
```

### lib/ helpers

```
lib/
├── api.ts                             fetch wrapper + JWT header
├── bodyRecovery.ts                    🆕 4 curves + 28 milestones + 14 citations
├── dailyJourneyAlerts.ts              🆕 27 curated alerts per dayInJourney
├── ftnd.ts                            Fagerström weighted score
├── featureGates.ts                    tier × feature matrix
├── cohort.ts                          client-side cohort utils
└── format.ts                          number/currency/duration format VN
```

---

## 3. Tier Gating Matrix

### Tiers

| Tier | Price | Duration | Description |
|---|---|---|---|
| **FREE** (anonymous default) | 0đ | unlimited | 30 tin AI/ngày, 7 ngày Nhận Diện FREE, no workbook write |
| **KHOI_DONG** | 99k | 14 ngày | Workbook write tuần 1-2, voice D1/D3/D7, báo cáo Day 10 |
| **DONG_HANH** | 140k/225k/290k | 35/52/65 ngày | Full workbook, full voice library, refund pro-rated từ Day 15, full Memory Book |
| **ALUMNI** | FREE forever | post-graduation | Identity "Đại Sứ Sol", commission 25%, voice library access |

### Feature × Tier matrix (qua `featureGates.ts`)

| Feature | FREE | KHOI_DONG | DONG_HANH | ALUMNI |
|---|:---:|:---:|:---:|:---:|
| Chat AI | 30 tin/ngày | unlimited | unlimited | unlimited |
| **workbook.read** | ✓ | ✓ | ✓ | ✓ |
| **workbook.write** | ✗ | tuần 1-2 only | ✓ all 4 tuần | ✓ |
| **voice.day_1_3_7** | ✗ | ✓ | ✓ | ✓ |
| **voice.full_library** | ✗ | ✗ | ✓ | ✓ |
| **report.day10** | ✗ | ✓ | ✓ | ✓ |
| **report.day30** | ✗ | ✗ | ✓ | ✓ |
| **memory_book.generate** | ✗ | partial | ✓ | ✓ (regen) |
| **askKhang** | preview only | ✓ | ✓ | ✓ |
| **crisis_timer** | ✓ (limit 3/day) | unlimited | unlimited | unlimited |
| **refund** | n/a | n/a | pro-rated Day 15+ | n/a |
| **commission** | ✗ | ✗ | ✗ | 25% |
| **silent_companionship** | ✓ anonymous post | ✓ | ✓ | ✓ |

### Gate enforcement

- Frontend: `useFeatureGate('workbook.write')` hook → return `{ allowed, reason }`
- Backend: middleware `requireTier(['DONG_HANH'])` on routes (`/workbook/write`, `/voice/full`, ...)
- Errors render banner "🔒 Nâng cấp DONG_HANH để mở tính năng này" + CTA pricing

---

## 4. Cohort Features Matrix (LIGHT / MODERATE / HEAVY)

### Timeline breakdown

| Chapter | LIGHT 35d | MODERATE 52d | HEAVY 65d |
|---|---|---|---|
| 🛡️ Nhận Diện (FREE) | Day 1-7 (7d) | Day 1-7 (7d) | Day 1-7 (7d) |
| 🎯 Kiểm Soát | Day 8-14 (7d) | Day 8-21 (14d) | Day 8-28 (21d) |
| ✊ Làm Chủ | Day 15-35 (21d) | Day 22-51 (30d) | Day 29-58 (30d) |
| 🎁 Tái Thiết (FREE bonus) | Day 36+ | Day 53+ | Day 66+ |
| **Q-Day** | Day 15 | Day 22 | Day 22-28 (range) |
| **Memory Book trigger** | Day 35 | Day 52 | Day 65 |

### Pricing

| Cohort | FTND | Price | Per-day | Per-week alt |
|---|---|---|---|---|
| 🟢 LIGHT | 0-3 | 140k | 5k/ngày × 28 paid | 35k/tuần |
| 🟡 MODERATE | 4-6 | 225k | 5k/ngày × 45 paid | 35k/tuần |
| 🔴 HEAVY | 7-10 | 290k | 5k/ngày × 58 paid | 35k/tuần |

### Cohort-specific features

| Feature | LIGHT | MODERATE | HEAVY |
|---|---|---|---|
| Chat AI tone | "kiên định nhẹ" | "bền bỉ trung gian" | "ấm dày kiên trì" |
| Voice D1 message | 90s | 120s | 150s |
| Crisis Timer default | 60s | 90s | 120s |
| Number of milestones | 28 (chung) | 28 + 4 bonus | 28 + 6 bonus |
| Sổ Lưu Niệm sections | 6 | 8 | 10 |
| Phase rebuilding required | optional | recommended | mandatory |

### Code references

- `backend/src/journey/cohortConfig.ts` — source of truth
- `dashboard/src/lib/cohort.ts` — client utils
- `dashboard/src/components/CohortBadge.tsx` — UI pill

---

## 5. Backend API Endpoints Map

### Authentication

```
POST   /auth/anonymous              { deviceUid, originDomain }       → JWT
POST   /auth/bind-phone/request     { phone }                          → OTP send
POST   /auth/bind-phone/verify      { phone, otp }                     → merge anon
GET    /auth/zalo/init                                                  → redirect Zalo
GET    /auth/zalo/callback          ?code & state                       → merge anon
POST   /auth/recover                { recoveryCode }                    → restore user
POST   /auth/email/send-magic       { email }                           → Brevo send
GET    /auth/email/verify           ?token                              → JWT
POST   /auth/logout                                                     → clear (frontend)
```

### Users

```
GET    /users/me                                                        → user full
PATCH  /users/me                    { pronouns?, assistantName?, ... } → update
PATCH  /users/me/notification-prefs { channels[], times[] }            → update
POST   /users/me/recovery-code                                          → gen 1x
DELETE /users/me                                                        → soft delete
```

### Journey (cohort-aware V2 — 23/5)

```
GET    /journey/dashboard                                               → journeyV2 + qDayV2
POST   /journey/onboarding/baseline { cigsBaseline, pricePerCig }      → save
POST   /journey/onboarding/ftnd     { answers[6] }                     → score + cohort
POST   /journey/qday-confirm                                            → qDayConfirmedAt
POST   /journey/end                 { reason }                          → drop out
POST   /journey/resume                                                  → resume after lapse
GET    /journey/money-breakdown                                         → stats $ saved
```

### Checkins + Workbook

```
POST   /checkins                    { dayInJourney, mood, ... }        → save + streak
GET    /checkins                    ?from & to                          → list
POST   /exercises                   { exerciseId, response }            → log
GET    /exercises                                                       → list
```

### Content + Voice

```
GET    /content                     ?dayNumber & module & voice         → items
GET    /voices                                                          → library
GET    /voices/:id                                                      → mp3 url (signed)
```

### Chat + Notifications

```
POST   /messages                    { content, conversationId? }       → AI response
GET    /messages                    ?conversationId                     → history
GET    /notifications                                                   → list user
PATCH  /notifications/:id/read                                          → mark read
POST   /notifications/subscribe     { endpoint, keys }                  → web-push
```

### Tiers + Payments

```
GET    /tiers                                                           → list tiers
GET    /tiers/me                                                        → current tier
POST   /payments/vietqr/intent      { tier, amount }                   → qrUrl + addInfo
GET    /payments                                                        → user history
POST   /refunds/request             { reason, amount }                  → queue
GET    /refunds/me                                                      → my refund status
```

### Misc

```
POST   /confessions                 { content, mood }                  → Silent Companion
GET    /confessions                                                     → list (paginated, anon)
POST   /khang-questions             { content }                        → mailbox
GET    /khang-questions/answered    ?lim                               → list answered
POST   /lapse                       { day, context }                   → log lapse
GET    /lapse                                                          → list user
POST   /crisis-timer/start          { context }                        → row + start
POST   /crisis-timer/:id/complete   { outcome }                        → finalize
GET    /stats/control-score                                            → mastery 0-100
GET    /stats/anonymous-stats                                          → cohort stats public
GET    /healthz                                                        → { ok, now }
```

### Zalo OA

```
POST   /api/zalo/webhook            (Zalo callback)                    → event handler
GET    /api/zalo/oa-info                                               → debug
POST   /api/zalo/zns/send           { templateId, userId }            → send template
```

### Admin (`isAdmin` gate)

```
GET    /admin/users                                                    → list paginated
GET    /admin/users/:id                                                → detail
PATCH  /admin/users/:id             { isAdmin?, tier?, ... }          → update
GET    /admin/payments              ?status                            → list
POST   /admin/payments/:id/confirm                                     → mark PAID
POST   /admin/payments/:id/reject                                      → mark FAILED
GET    /admin/refunds               ?status                            → queue
POST   /admin/refunds/:id/approve                                      → mark APPROVED
POST   /admin/refunds/:id/process                                      → mark PROCESSED
GET    /admin/messaging                                                → broadcast UI
POST   /admin/messaging/broadcast   { to[], template }                → bulk send
GET    /admin/content                                                  → CMS list
POST   /admin/content               { ... }                            → create item
PATCH  /admin/content/:id                                              → update
GET    /admin/zalo-templates                                           → list ZNS
POST   /admin/zalo-templates/sync                                      → fetch from Zalo
GET    /admin/zalo-journey                                             → 51d journey config
PATCH  /admin/zalo-journey/:day                                        → update step
GET    /admin/zalo-sos                                                 → SOS triage queue
PATCH  /admin/zalo-sos/:id          { status, note }                  → resolve
GET    /admin/canned-replies                                           → list
POST   /admin/canned-replies        { trigger, response }              → create
GET    /admin/voice                                                    → library mgmt
POST   /admin/voice                 (multipart)                        → upload MP3
GET    /admin/q-day-checklist                                          → list
POST   /admin/q-day-checklist       { ... }                            → create item
GET    /admin/analytics                                                → dashboard stats
GET    /admin/cohorts                                                  → cohort summary
GET    /admin/wiki                                                     → wiki sync status
GET    /admin/ai                                                       → AI provider config
PATCH  /admin/ai                    { provider, key }                 → switch
```

**Total endpoints**: ~85 routes.

---

## 6. Cron Jobs Map (26 jobs)

File: `backend/src/scheduler/worker.ts` (1057 dòng). TZ: `Asia/Ho_Chi_Minh`.

### Always-on (every minute / 5 / 15)

| Cron | Job | Mục đích |
|---|---|---|
| `* * * * *` | `deliverDueNotifications` | Flush Notification queue → Zalo + Web Push + in-widget |
| `*/5 * * * *` | `fireDuePushes` | Zalo ZNS 51-day journey queue |
| `*/15 * * * *` | `smartSchedulerSweep` | Match content theo moment user (mood, day, trigger) |

### Daily (1× / ngày)

| Cron (HH MM) | Job | Mục đích |
|---|---|---|
| `0 7 * * *` | `morning_goal_push` | Mục tiêu hôm nay (7:00 sáng) |
| `5 7 * * *` | `qday_morning_reminder` | Sáng Q-Day countdown |
| `30 7 * * *` | `recompute_journey_streak` | dayInJourney + streak + Memory Book trigger |
| `0 8 * * *` | `email_funnel_send` | Email funnel Day 14+ chưa upgrade |
| `0 14 * * *` | `phenomena_alert` | "Anh đang Day X, cơ thể bắt đầu..." |
| `0 19 * * *` | `missed_day_reminder` | User chưa checkin → nhắc 19:00 |
| `0 20 * * *` | `evening_checkin_reminder` | 20:00 push "Tối nay anh thế nào?" |
| `30 21 * * *` | `night_story_push` | NIGHT_STORY content (audio bedtime) |

### Hourly

| Cron | Job | Mục đích |
|---|---|---|
| `0 * * * *` | `risk_score_recompute` | Recompute risk score user dựa trên CheckIn 7d |
| `15 * * * *` | `random_tips_phase` | Random tips theo phase user đang ở |
| `30 * * * *` | `qday_countdown_alerts` | T-7/T-3/T-1/T-0 Q-Day push |

### Weekly + Monthly

| Cron | Job | Mục đích |
|---|---|---|
| `0 9 * * 1` | `weekly_report` | Báo cáo tuần thứ 2 (Monday 9am) |
| `0 8 1 * *` | `monthly_alumni_digest` | Newsletter ALUMNI |

### Phase 5 — Zalo OA scheduled pushes (đang wire)

| Cron | Job | Mục đích |
|---|---|---|
| `0 10 * * *` | `zalo_oa_daily_broadcast` | Broadcast Zalo OA content theo segment cohort |
| `0 16 * * *` | `zalo_oa_funnel_step` | Funnel 51-day Zalo OA |

### Misc

| Cron | Job | Mục đích |
|---|---|---|
| `0 3 * * *` | `db_cleanup_old_notifications` | Xóa Notification > 30d |
| `30 3 * * *` | `db_cleanup_old_messages` | Xóa Message anon > 90d |
| `0 4 * * *` | `db_backup_nightly` | pg_dump → /var/backups/ |
| `*/30 * * * *` | `analytics_aggregate` | Aggregate stats cho admin dashboard |
| `0 1 * * 0` | `weekly_db_optimize` | VACUUM ANALYZE Postgres Sunday 1am |
| `0 2 * * *` | `zalo_token_refresh` | Refresh Zalo OA access token (expiry 25/8) |
| `0 5 * * *` | `prometheus_metric_export` | Export metric JSON cho admin chart |
| `0 6 * * *` | `lapse_followup_email` | Email follow-up user lapse > 3 ngày trước |
| `0 12 * * *` | `noon_motivation_push` | 12:00 push motivation (giữa ngày) |

**Rule**: chỉ 1 instance scheduler chạy. `ENABLE_SCHEDULER=true` set 1 PM2 process duy nhất.

---

## 7. Data flow diagrams

### Onboard FTND → Cohort

```
User → TestFtnd.tsx (FE)
  ↓ submit 6 answers
POST /api/journey/onboarding/ftnd
  ↓ Express route
journey/service.ts: computeFtndScore(answers) → 0-10
  ↓
journey/cohortConfig.ts: computeCohort(score) → LIGHT/MOD/HEAVY
  ↓
Prisma: user.update({ ftndScore, ftndCohort })
  ↓
Response { score, cohort, label, cohortPlan }
  ↓
FE: render Result 8 section + HOLD
```

### Journey dashboard render

```
User → Overview.tsx mount
  ↓ useEffect
GET /api/journey/dashboard
  ↓
journey/service.ts:
  - buildJourneyV2(user) — read cohortConfig + computed day
  - buildQDayV2(user) — check needsConfirmation
  - getCohortMilestones(cohort, day) — slice from bodyRecovery
  ↓
Response { journeyV2, qDayV2, milestones, journey (legacy) }
  ↓
FE render:
  - <DailyJourneyAlert /> from dailyJourneyAlerts[day]
  - <JourneySimulator /> with cohort + day
    └── <RecoveryRing /> × 4 (compute pct(curve, simDay))
  - <PhaseBar /> dynamic widths
  - <PhaseView /> conditional chapterIndex
```

---

## 8. Storage paths reference

```
VPS /var/www/sol-widget-old/
├── backend/dist/index.js           PM2 sol-api entry
├── backend/.env                    SMTP, JWT, DB, Anthropic
├── backend/uploads/                voice MP3 + user photo
└── memory-books/<userId>.html      Sổ Lưu Niệm generated

VPS /var/www/bothuocla-sol-vn/     Dashboard static
VPS /var/www/admin-sol-vn/         Admin static
VPS /var/backups/                  pg_dump nightly

Local C:\BOTHUOCLA\sol-widget\
├── backend/                        source
├── dashboard/                      source
├── admin/                          source
├── docs/                           toàn bộ docs (file này nằm trong đây)
└── CLAUDE_CONTEXT.md               master memory snapshot cũ
```

---

## 9. Cross-references

- [05-ARCHITECTURE.md](./05-ARCHITECTURE.md) — kiến trúc đầy đủ
- [06-DATABASE.md](./06-DATABASE.md) — schema Prisma 38 model
- [09-DECISIONS.md](./09-DECISIONS.md) — technical decisions log
- [12-JOURNEY_SIMULATOR_DESIGN.md](./12-JOURNEY_SIMULATOR_DESIGN.md) — Journey Simulator spec
- [13-UX_FLOW.md](./13-UX_FLOW.md) — user journey end-to-end
- [CHANGELOG_2026-05.md](./CHANGELOG_2026-05.md) — task log tháng 5

---

**Last updated**: 2026-05-23
**Maintainer**: Khang Sol
