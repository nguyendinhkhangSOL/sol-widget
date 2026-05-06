# SESSION CHECKPOINT — 2026-05-06 — PHASE B COMPLETE 6/6

> Tiếp nối checkpoint 2026-05-05. Phase B 88-day journey: BACKEND + WIDGET + DASHBOARD + CONTENT đã DONE.

---

## TÓM TẮT 1 PHÚT

Phase B bắt đầu 2026-05-05 với pivot 60-day → 88-day (4 phase tiến hoá hành vi). Hôm nay (2026-05-06) hoàn tất 6/6 bước.

| Bước | Status | Highlight |
|---|---|---|
| B.1 Design doc | ✅ | `docs/STAGE_88_DAYS_DESIGN.md` ~600 dòng — single source of truth |
| B.2 Schema migration | ✅ | `manual_migration_phase_b.sql` — 4 fields mới (qDayConfirmedAt, cigsBaseline, pricePerCig, onboardingCompletedAt) |
| B.3 Backend service | ✅ | `journey/service.ts` rewrite — 5 stages, Q-Day helpers, money cumulative cho phép âm |
| B.4 Backend routes | ✅ | 4 endpoints Phase B (/dashboard, /qday-confirm, /onboarding/baseline, /money-breakdown) + try/catch wrap chống Express 4 async hang |
| B.5 Frontend widget | ✅ | 12 file phaseB/* — phase router, OnboardingWizard, QDayCeremony, 5 phase variants |
| B.5 Frontend dashboard | ✅ | 4 page refactor (Overview/Journey/Workbook/Analytics) — 2-col layout desktop, phase-aware tabs |
| B.6 Content 38 bài | ✅ | seed/contentItemsPhaseB.ts + runner — Phase 1: 7, Phase 2: 21, Phase 4: 10 |

---

## ARCHITECTURE PHASE B — 88 NGÀY, 4 PHASE

| # | Tên (UX) | Code | Day | Số ngày | Visual color | dayNumber DB |
|---|---|---|---|---|---|---|
| 1 | 🌱 NHẬN THỨC | NHAN_THUC | 1-7 | 7 | sol-clay #B25C2C | 101-107 |
| 2 | 🔥 HÀNH ĐỘNG | HANH_DONG | 8-28 | 21 | sol-gold #B8860B | 108-128 |
| 3 | 🚭 GIẢI PHÓNG | GIAI_PHONG | 29-58 | 30 | sol-blue #3A7CA5 | 1-30 (Phase A cũ) |
| 4 | 🌟 TÁI THIẾT | TAI_THIET | 59-88 | 30 | sol-earth #5C3A1E | 159-188 (sparse) |
| ∞ | 🦁 ĐẠI SỨ SOL | DAI_SU | 89+ | lifetime | sol-deep #2C1810 | (no daily content) |

**Q-Day = Day 28** — user PHẢI bấm "Tôi cam kết" để bật đồng hồ countdown từ Day 29.

**Frontend mapping content (Journey DayDetail):**
- Phase 1: `contentDay = dayInJourney + 100` (101..107)
- Phase 2: `contentDay = dayInJourney + 100` (108..128)
- Phase 3: `contentDay = dayInJourney - 28` (1..30, content cũ)
- Phase 4: `contentDay = dayInJourney + 100` (159..188)

---

## FILES TỔNG (Phase B 2 sessions)

### Backend (5 files)

- `backend/prisma/schema.prisma` — Phase B fields ở User model
- `backend/prisma/manual_migration_phase_b.sql` — idempotent migration
- `backend/src/journey/service.ts` — 5 stages + Q-Day + money cumulative
- `backend/src/journey/routes.ts` — 4 endpoints + try/catch wrap
- `backend/src/content/routes.ts` — fix range day 1-200
- `backend/src/seed/contentItemsPhaseB.ts` — NEW, 38 bài
- `backend/src/seed/runContentItemsPhaseB.ts` — NEW, runner idempotent

### Frontend widget (12 files)

- `frontend/src/services/api.ts` — +44 dòng (qdayConfirm, submitOnboardingBaseline, getMoneyBreakdown)
- `frontend/src/components/views/JourneyDashboard.tsx` — phase router rewrite + error display
- `frontend/src/components/views/phaseB/types.ts` — DashboardData type
- `frontend/src/components/views/phaseB/_shared.tsx` — shared subcomponents (TodayCard, StoryCard, MoneySaved handle negative, BodyTimeline, CohortCard, SlipModal, ExitModal)
- `frontend/src/components/views/phaseB/OnboardingWizard.tsx` — Day 1 wizard
- `frontend/src/components/views/phaseB/PhaseBar.tsx` — 4 viên ngọc header
- `frontend/src/components/views/phaseB/QDayCeremony.tsx` — full screen ceremony
- `frontend/src/components/views/phaseB/PhaseObserver.tsx` — Phase 1
- `frontend/src/components/views/phaseB/PhaseAction.tsx` — Phase 2 (reduction tracker + Plan B)
- `frontend/src/components/views/phaseB/PhaseLiberation.tsx` — Phase 3 (FreedomClock tick mỗi giây)
- `frontend/src/components/views/phaseB/PhaseRebuild.tsx` — Phase 4 (mentor + Đại Sứ countdown)
- `frontend/src/components/views/phaseB/PhaseAmbassador.tsx` — Phase 5

### Frontend dashboard (15 files)

- `dashboard/src/services/api.ts` — +60 dòng (6 endpoint Phase B)
- `dashboard/src/components/views/phaseB/*` — 8 file (mirror widget, adapt CSS desktop 2-col, padding p-5/p-6, font lớn)
- `dashboard/src/pages/Overview.tsx` — phase router rewrite (landing page chính)
- `dashboard/src/pages/Journey.tsx` — 4 phase grouped grids + DayDetail mapping content
- `dashboard/src/pages/Workbook.tsx` — 5 tabs (prep + 4 phase) + WorkbookNav conditional
- `dashboard/src/pages/Analytics.tsx` — 4 tabs phase-aware (pattern/reduction/recovery/streak)

### Docs

- `docs/STAGE_88_DAYS_DESIGN.md` — final design (sessions cũ)
- `SESSION_CHECKPOINT_2026-05-05.md` — checkpoint trước
- `SESSION_CHECKPOINT_2026-05-05_PartB.md` — checkpoint giữa
- `SESSION_CHECKPOINT_2026-05-06_PhaseB_DONE.md` — file này

---

## VOICE ARC 38 BÀI CONTENT

**Phase 1 NHAN_THUC (Day 1-7):**
- Day 1-6: Sol Đồng hành (gentle observer, "mình thấy")
- Day 7: Khang Sol (chuyển tiếp Phase 2)

**Phase 2 HANH_DONG (Day 8-28):**
- Day 8, 14, 21, 27, 28: Khang Sol (milestones quan trọng — start, mid-point, prep Q-Day, đêm trước Q-Day, Q-Day)
- Day 9-13, 15-20, 22-26: Sol Đồng hành (delay, swap, Plan B, identity prep, prep Q-Day)

**Phase 4 TAI_THIET (Day 59-88, sparse 1 bài/3 ngày):**
- Day 59, 62, 68, 77, 80, 86: Khang Sol (return mentor)
- Day 65, 71, 74, 83: Sol Đồng hành (gentle reminders)

---

## DECISION LOG (mới + tinh chỉnh)

1. **Money saved cumulative cho phép âm** — `Σ(baseline - actualToday) × pricePerCig`. UI 3 màu (green/ink-3/red) + subtitle "Đây là số thật — Sol không che" khi âm.

2. **Q-Day Day 28 ceremony bắt buộc xác nhận** — full-screen overlay với CTA "Tôi cam kết — bật đồng hồ tự do". POST `/journey/qday-confirm` set qDayConfirmedAt = NOW.

3. **Express 4 async hang fix** — wrap try/catch tất cả route Phase B + return 500 với Prisma error code (P2022 unknown column, P2025 record not found). Phát hiện bug runtime mà ko phải Express 5 auto-handle.

4. **Content namespace dayNumber** — Phase 1/2/4 dùng dayNumber 100+ để tránh conflict với Phase A 1-30 (dùng cho Phase 3 GIAI_PHONG). Frontend mapping `contentDay = day + 100` cho Phase 1/2/4, `day - 28` cho Phase 3.

5. **WorkbookNav legacy hide** — anchor links T1-T4 + 30N chỉ render khi tab = `prep` hoặc `phase-3` (đó là context Phase A 30 ngày phù hợp). Phase 1/2/4 placeholder không có anchor.

6. **Backend route `/content/day/:day` range** — mở rộng từ hardcode 1-30 → 1-200 để cover cả Phase A + Phase B + dư cho future content.

7. **Layout dashboard 2-col** — content area max-w-1100px, grid `lg:grid-cols-3` với main `lg:col-span-2` (Today/Story/Pattern) + side (Money/Insight/Cohort). Mobile fallback stack 1-col.

---

## COMMANDS QUICK REFERENCE

```powershell
# Stack control
cd D:\BOTHUOCLA\sol-widget
docker compose ps
docker compose logs -f backend --tail=30
docker compose stop backend; docker compose build backend; docker compose up -d backend

# DB - dùng pipe stdin để tránh PowerShell escape \"
'YOUR SQL HERE;' | docker compose exec -T db psql -U sol -d sol

# Apply migration Phase B
Get-Content backend\prisma\manual_migration_phase_b.sql | docker compose exec -T db psql -U sol -d sol

# Seed content (chạy compiled JS, KHÔNG tsx vì runtime ko có src)
docker compose exec backend node dist/seed/runContentItems.js          # Phase A 30 bài
docker compose exec backend node dist/seed/runContentItemsPhaseB.js    # Phase B 38 bài

# Test phase variants — đổi user state qua SQL
'UPDATE "User" SET "quitDate" = NOW() - INTERVAL ''3 days'', "qDayConfirmedAt" = NULL, "onboardingCompletedAt" = NOW() WHERE id = ''cmok94a880006ag1n25g8vbqb'';' | docker compose exec -T db psql -U sol -d sol
# Day 4 NHAN_THUC. Đổi 3 → 27 cho Q-Day, 34 + qDayConfirmedAt 7d cho Day 35 GIAI_PHONG, 74 + qDayConfirmedAt 47d cho Day 75 TAI_THIET.

# URLs
# Widget:    http://localhost:5173
# Dashboard: http://localhost:5174
# Backend:   http://localhost:4000
```

---

## NEXT STEPS

### Ưu tiên cao (block beta launch)

- **Test full flow real user** — 1 người ngoài Khang đăng ký → onboarding → 7 ngày Phase 1 → Plan B Phase 2 → Q-Day → 7 ngày sau Phase 3. Theo dõi conversion.

- **Voice Khang Sol thật** — record 28 voice cho Day 1, 7, 14, 21, 28 + 10 bài Phase 4 milestones. Hiện text-only.

- **SCIENCE_TIP + NIGHT_STORY cho Phase 1+2+4** — em mới viết MORNING_GOAL. Tổng cần ~100 bài thêm nếu muốn full Phase A parity. Có thể skip để launch beta minimal.

- **Q-Day push notification scheduler** — Day 26 T-2, Day 27 T-1 21h, Day 28 7h sáng. Hiện chưa wire vào worker.

### Ưu tiên trung

- **Slip detection auto-trigger SlipModal** — hiện FE phải bấm logger với "Đã hút" để trigger. Có thể auto-detect khi cigsToday > 0 trong response Phase 3.

- **PhaseAction reduction chart real data** — hiện chỉ text "↓ 20% — Sol thấy giảm". Chart bar 21 ngày tracking sẽ trực quan hơn.

- **Đại Sứ Mode mentor flow** — hiện "🤝 Tìm đồng đội mới" alert "sắp ra mắt". Cần thật: cohort matching + chat 1-on-1 với newbie Phase 1.

### Ưu tiên thấp

- **Hồ sơ PDF tải về Day 88** — tổng kết hành trình + body recovery + tiền tiết kiệm. Hiện alert "sắp ra mắt".

- **Q-Day reminder Day 33+** — nếu user chưa confirm Q-Day sau 5 ngày → push 1 lần cuối "Sol vẫn đợi". Hiện chưa wire.

---

## RỦI RO + MITIGATION

| Rủi ro | Status |
|---|---|
| User thấy "88 ngày" sợ → bỏ ngay | Mitigated — UX rules giấu số ngày, marketing dùng "4 lớp tiến hoá" |
| Q-Day Day 28 user chưa sẵn → friction | Mitigated — onPostpone callback, Phase 3 vẫn render với clock off |
| Money saved âm → user nản | Mitigated — subtitle "đây là số thật", color sol-red |
| Phase 3 slip → user xấu hổ | Mitigated — SlipModal compassion, không reset hard streak |
| Content 38 bài thiếu sâu | Open — chỉ MORNING_GOAL, chưa có SCIENCE_TIP/NIGHT_STORY |
| Pricing 880k cao → ít mua | Open — chưa wire promo Khởi Chạy 75% off |

---

## PROMPT MỞ ĐẦU SESSION SAU

```
Em là AI dev pair của Khang Sol. Đọc file
D:\BOTHUOCLA\sol-widget\SESSION_CHECKPOINT_2026-05-06_PhaseB_DONE.md
để load context Phase B (88-day journey, 6/6 bước hoàn tất).

Tiếp tục từ Next Steps — ưu tiên cao gồm: test real user, record voice
Khang Sol, SCIENCE_TIP/NIGHT_STORY content cho Phase 1+2+4, Q-Day push
scheduler.

Em luôn đọc CLAUDE_CONTEXT.md + STAGE_88_DAYS_DESIGN.md để hiểu architecture.
Edit tool truncate ~6KB files — dùng heredoc trong bash cho file lớn.
Pronouns mặc định 'bạn' — Khang dùng 'anh' tự gọi mình.
Backend container production-mode → seed script chạy `node dist/...`, không phải tsx src/.
PowerShell escape \" lỗi → dùng pipe stdin 'SQL;' | docker compose exec -T db psql ...
```

---

**Trạng thái:** Phase B 6/6 ✓ — backend code + frontend widget + frontend dashboard + 76 bài content + Q-Day push scheduler + slip auto-detect. Sẵn sàng test real user beta.

**Lines of code added:** ~3700 dòng TypeScript/React + 76 bài content tiếng Việt (38 MORNING_GOAL + 38 SCIENCE_TIP) voice arc Sol.

---

## SESSION 2026-05-06 (post-Phase B polish)

3 task thêm sau khi Phase B 6/6 done:

### Task 18 — Q-Day push scheduler
Wire 3 cron jobs Phase B vào `worker.ts`:
- `0 7 * * *` — Day 26 T-2 reminder ("Còn 2 ngày là Q-Day")
- `0 21 * * *` — Day 27 T-1 evening Khang Sol message ("Đêm nay là đêm cuối Phase Hành Động")
- `5 7 * * *` — Day 28 Q-Day morning ("Hôm nay là Q-Day")

Hàm `enqueueQDayPushes(phase)` query users `dayInJourney = 26/27/28 AND qDayConfirmedAt IS NULL AND exitedAt IS NULL`. Idempotent qua `metadata.qDayPhase`. Channels IN_WIDGET + WEB_PUSH. Total: 12 → **15 cron jobs active**.

### Task 19 — Slip auto-detect server-side
Backend `/journey/dashboard` thêm 2 field trong `qDay`:
- `recentSlip: boolean` — Phase 3-4 + có log smoking trong 24h
- `lastSlipLogId: string | null` — ID log gần nhất

Frontend `PhaseLiberation` + `PhaseRebuild` (cả widget + dashboard, 4 file): useEffect detect `recentSlip + lastSlipLogId chưa seen` → auto show SlipModal compassion. Dedupe qua `localStorage['sol_slip_seen_log_ids']` (max 50 IDs). Robust: không miss khi user đóng tab giữa logger submit và reload, không show lại khi F5.

Helpers `getSeenSlipIds` + `markSlipSeen` export từ `_shared.tsx` cho cả widget + dashboard.

### Task 20 — SCIENCE_TIP content Phase 1+2+4
Append 38 bài SCIENCE_TIP vào `contentItemsPhaseB.ts`:
- Phase 1 (Day 1-7): receptor neuroscience, trigger basal ganglia, dopamine myth, craving 90-180s, VN trigger stats, cortisol awakening, baseline importance
- Phase 2 (Day 8-28): delay mechanism (limbic vs prefrontal), habit loop Cue→Routine→Reward, stress-cortisol cycle, identity neural narrative, extinction burst, oxytocin cohort, environment 50% predictor
- Phase 4 (Day 59-88): NHS phổi recovery, Lally 66 days, mirror neuron, Hughes 2004 relapse 2-peak, mentor effect, body 80% CDC, Doll & Hill 50-year BMJ, autonomy SDT, Brody 11-week receptor baseline

Voice mix: 4 bài Khang Sol (Day 14, 21, 28, 168, 177, 180, 186) + 34 bài Sol Đồng hành.

Updated runner log để count theo module + phase.

**Total Phase B content:** 76 bài (38 MORNING_GOAL + 38 SCIENCE_TIP) ÷ 3 phase × 2 module mỗi ngày.

---

## NEXT SESSION PRIORITY

### A. Polish content (~1.5h em làm)

- **NIGHT_STORY** Phase 1+2+4 (38 bài) — card "🌙 Khép ngày" cho parity Phase A
- **PHENOMENA_ALERT** Day 16-21 (5-7 bài) — cảnh báo "tuần 3 thường khó"
- **EXERCISE prompts** Phase 1+2+4 (Workbook tab content thay placeholder)

### B. Test real user (Khang lead)

- Invite 1-2 người 45+ ngoài Khang vào widget bothuocla.sol.vn
- Theo dõi onboarding → Day 1-7 → Plan B → Q-Day → Day 35
- Em đứng cạnh fix bug từ feedback

### C. Beta launch infrastructure

- **Marketing landing sol.vn** — homepage giới thiệu 4 phase, pricing 70/140/210k Khởi Chạy
- **Voice Khang record pipeline** — upload mp3 vào VoiceMessage table với tag DAY_MATCH, gửi auto qua VoiceDelivery
- **Đại Sứ mentor flow Day 89+** — cohort matching + chat 1-on-1 newbie Phase 1
- **Hồ sơ PDF Day 88** — tổng kết hành trình + body recovery + tiền tiết kiệm
