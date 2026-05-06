# SESSION CHECKPOINT — 2026-05-05

> **Mục đích file này:** load 1 file duy nhất ở session Claude mới = có toàn bộ context Phase B.
> Đọc + dán nội dung này vào prompt đầu của session mới.

---

## 1. TÓM TẮT 1 PHÚT

Hôm nay làm gì: Pivot từ **60 ngày** sang **88 ngày** (4 phase tiến hoá hành vi). Code 4/6 bước Phase B xong. **Frontend chưa update** — đang vướng lỗi "đang tải hành trình" cần debug Bước 5.

**Tiến độ Phase B:**
- ✅ B.1 Design doc (`docs/STAGE_88_DAYS_DESIGN.md` ~600 dòng)
- ✅ B.2 Schema migration (`backend/prisma/manual_migration_phase_b.sql`)
- ✅ B.3 Backend service refactor (`backend/src/journey/service.ts` rewrite)
- ✅ B.4 Backend routes (`backend/src/journey/routes.ts` rewrite + 2 endpoints mới)
- ⏳ B.5 Frontend phase router + 5 dashboard variants — **CHƯA START**
- ⏳ B.6 Viết 38 bài content Phase 1+2+4 — **CHƯA START**

**Vấn đề đang vướng:**
- F5 trang `/journey` → "Đang tải hành trình..." không return
- Nguyên nhân CHƯA xác định (có thể migration chưa apply / Prisma client chưa regenerate / runtime error)
- User cần chạy: `docker compose logs backend --tail=80` để xác định lỗi

---

## 2. ARCHITECTURE PHASE B — 88 NGÀY, 4 PHASE

| # | Tên (UX) | Code | Day | Số ngày | Visual color |
|---|---|---|---|---|---|
| 1 | 🌱 NHẬN THỨC | `NHAN_THUC` | 1-7 | 7 | sol-clay #B25C2C |
| 2 | 🔥 HÀNH ĐỘNG | `HANH_DONG` | 8-28 | 21 | sol-gold #B8860B |
| 3 | 🚭 GIẢI PHÓNG | `GIAI_PHONG` | 29-58 | 30 | sol-blue #3A7CA5 |
| 4 | 🌟 TÁI THIẾT | `TAI_THIET` | 59-88 | 30 | sol-earth #5C3A1E |
| ∞ | 🦁 ĐẠI SỨ SOL | `DAI_SU` | 89+ | lifetime | sol-deep #2C1810 |

**Q-Day = Day 28** — user PHẢI bấm xác nhận để bật đồng hồ countdown từ Day 29.

**Triết lý:** không phải 4 gói thời gian, mà 1 hành trình tiến hoá hành vi. Awareness → Rewiring → Stabilization → Maintenance. **UX KHÔNG hiển thị "Ngày X / 88"**.

---

## 3. 6 QUYẾT ĐỊNH ĐÃ CHỐT (KHANG SOL CONFIRM)

1. **Money saved cumulative cho phép âm** — `Σ(baseline - actualToday) × pricePerCig` per day. Hiển thị `−1.250đ` đỏ nếu âm.
2. **Q-Day Day 28 ceremony bắt buộc xác nhận** — push notif T-2 (Day 26), T-1 (Day 27), full screen banner Day 28.
3. **Giá DỊCH VỤ SOL self-fill** default 10.000đ/ngày × số ngày. Promo Khởi Chạy 70/140/210k cho 100 user đầu.
4. **Content 38 bài mới** (Phase 1: 7, Phase 2: 21, Phase 4: 10). Phase 3 = 30 ngày rigid CŨ giữ nguyên (`dayInJourney 29 → contentDay 1`).
5. **Day breakdown** Option A: 7+21+30+30=88. Lịch UX = 60 ngày chính + 30 ngày bonus maintenance.
6. **Pronouns `bạn` default cho user mới** — anh/chị/em set sau onboarding.

---

## 4. FILE EDIT HÔM NAY

### Backend
- `backend/prisma/schema.prisma` — Thêm `User.qDayConfirmedAt`, `cigsBaseline`, `pricePerCig`, `onboardingCompletedAt`
- `backend/prisma/manual_migration_phase_b.sql` — Migration idempotent
- `backend/src/journey/service.ts` — REWRITE: 5 stages, Q-Day helpers, money cumulative, story per phase
- `backend/src/journey/routes.ts` — REWRITE: GET /dashboard payload mới, POST /qday-confirm, POST /onboarding/baseline, GET /money-breakdown

### Docs
- `docs/STAGE_88_DAYS_DESIGN.md` — NEW, 600 dòng, single source of truth Phase B
- `SESSION_CHECKPOINT_2026-05-05.md` — file này

### Backup scripts (tạo mới)
- `D:\BOTHUOCLA\backups\backup-full.ps1` — DB + code + docs (ASCII safe)
- `D:\BOTHUOCLA\backups\backup-claude-app.ps1` — Claude transcripts
- `D:\BOTHUOCLA\backups\restore-guide.md`
- `D:\BOTHUOCLA\backups\MIGRATION_GUIDE.md` — chuyển máy

---

## 5. NEXT STEP — SESSION SAU LÀM GÌ

### Việc đầu tiên (5 phút): debug Phase B backend

```powershell
cd D:\BOTHUOCLA\sol-widget

# 1. Đảm bảo migration đã apply
docker compose exec db psql -U sol -d sol_widget -c "\d \"User\"" | Select-String -Pattern "qDay|cigsBaseline|pricePerCig"
# Phải thấy 3 dòng (qDayConfirmedAt, cigsBaseline, pricePerCig). Nếu không:
Get-Content backend\prisma\manual_migration_phase_b.sql | docker compose exec -T db psql -U sol -d sol_widget

# 2. Regenerate Prisma client
docker compose exec backend npx prisma generate

# 3. Rebuild backend image (KHÔNG chỉ restart)
docker compose stop backend
docker compose build backend
docker compose up -d backend
docker compose logs -f backend --tail=30

# 4. F5 trang /journey trên browser
# 5. Nếu vẫn lỗi → docker compose logs backend --tail=80
```

### Việc thứ 2 (3-4 giờ): Bước 5 — Frontend phase router

Build các component:

```
frontend/src/components/views/JourneyDashboard.tsx — refactor thành phase router:
  switch (stage) {
    case 'NHAN_THUC':   return <PhaseObserver />;       // mới
    case 'HANH_DONG':   return <PhaseAction />;          // mới
    case 'GIAI_PHONG':  return <PhaseLiberation />;     // refactor RealtimeQuit
    case 'TAI_THIET':   return <PhaseRebuild />;         // mới
    case 'DAI_SU':      return <PhaseAmbassador />;      // mới
  }

  if (qDay.needsConfirmation) return <QDayCeremony />;  // OVERLAY khi Day 28+ chưa confirm
  if (!user.onboardingCompletedAt) return <OnboardingWizard />; // OVERLAY khi Day 1 chưa khai
```

Components cần build:
1. `OnboardingWizard.tsx` — 1 step, hỏi cigsBaseline + pricePerCig, POST /journey/onboarding/baseline
2. `PhaseBar.tsx` — header 4 ô ngang visualization
3. `QDayCeremony.tsx` — full screen Day 28, nút "Tôi cam kết — bật đồng hồ tự do"
4. `PhaseObserver.tsx` (Day 1-7) — pattern observer, KHÔNG đồng hồ
5. `PhaseAction.tsx` (Day 8-28) — reduction tracker + Plan B trigger + Q-Day countdown từ Day 26
6. `PhaseLiberation.tsx` (Day 29-58) — đồng hồ countdown UP + body recovery
7. `PhaseRebuild.tsx` (Day 59-88) — maintenance + cohort mentor
8. `PhaseAmbassador.tsx` (Day 89+) — graduate state

Money saved component cần hỗ trợ negative:
```tsx
<div className={moneySaved < 0 ? 'text-sol-red' : moneySaved > 0 ? 'text-sol-green-ink' : 'text-sol-ink-3'}>
  {moneySaved < 0 ? '−' : moneySaved > 0 ? '+' : ''}{Math.abs(moneySaved).toLocaleString('vi-VN')}đ
</div>
{moneySaved < 0 && <p className="text-meta italic">Đây là số thật — Sol không che.</p>}
```

### Việc thứ 3 (4-6 giờ): Bước 6 — Content 38 bài

Theo voice MESSAGING_PLAYBOOK.md. Outline đã có trong `docs/STAGE_88_DAYS_DESIGN.md` section 2-5.

---

## 6. STACK STATUS

- Node 20 + Express + Socket.IO + Prisma + PostgreSQL 16
- Vite + React 18 + Zustand + Tailwind
- Docker compose 4 services: db, backend, frontend, dashboard
- WordPress: sol.vn (umbrella), bothuocla.sol.vn (vertical 1) — managed by hosting

**24 user trong DB**, đa phần test. User Khang (admin) có quitDate được set.

**Phase A (60-day) JourneyDashboard** đã LIVE và work cho 2 state (Day 1 Awareness, Day 12 Control). Phase B BACKEND đang trong process verify, FRONTEND chưa update.

---

## 7. COMMANDS QUICK REFERENCE

```powershell
# Stack control
cd D:\BOTHUOCLA\sol-widget
docker compose ps                          # status
docker compose logs -f backend --tail=30   # follow logs
docker compose restart backend             # restart
docker compose stop backend                # stop
docker compose build backend               # rebuild image
docker compose up -d backend               # start

# DB
docker compose exec db psql -U sol -d sol_widget                   # interactive
docker compose exec db psql -U sol -d sol_widget -c "SELECT ..."   # 1-shot

# Apply migration
Get-Content backend\prisma\manual_migration_phase_b.sql | docker compose exec -T db psql -U sol -d sol_widget

# Prisma
docker compose exec backend npx prisma generate

# Backup
.\backups\backup-full.ps1
.\backups\backup-claude-app.ps1

# URLs
# Widget:    http://localhost:5173
# Dashboard: http://localhost:5174
# Backend:   http://localhost:4000
```

---

## 8. PROMPT MỞ ĐẦU SESSION SAU

Copy đoạn này vào session Claude mới:

```
Em là AI dev pair của Khang Sol. Đọc file
D:\BOTHUOCLA\sol-widget\SESSION_CHECKPOINT_2026-05-05.md
để load context Phase B (88-day journey).

Tiếp tục từ Bước 5 — debug Phase B backend trước (lỗi "đang tải hành trình"),
sau đó build frontend phase router + Q-Day ceremony + 5 dashboard variants.

Em luôn đọc CLAUDE_CONTEXT.md + STAGE_88_DAYS_DESIGN.md để hiểu architecture.
Edit tool truncate ~6KB files — dùng heredoc trong bash cho file lớn.
Pronouns mặc định 'bạn' — Khang dùng 'anh' tự gọi mình.
```

---

**Trạng thái:** Phase B 4/6 — backend code done, debug pending, frontend pending.
**Risk:** Context window session này dày ~2/3 — có thể compaction. Save checkpoint TRƯỚC khi tiếp tục.
**Khuyến nghị:** End session này, run backup, mở session mới với prompt trên.
