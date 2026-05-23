# SOL — Phase 5: Zalo OA Push Scheduler

**Status:** READY TO BUILD — Content + DB chip đầy đủ 93/93
**Estimated time:** 4-6 giờ (1-2 phiên)
**Prerequisites:** ✅ Phase 1-4 đã hoàn thành (xem cuối doc)

---

## Mục tiêu

Push tự động 1 chip/ngày qua Zalo OA cho user theo lộ trình họ chọn:

```
User chọn lộ trình:
  ┌─ Cold Turkey ───────────────► 30 ngày Q-Day (qday-1 → qday-30)
  │
  ├─ 14 ngày Giảm Dần + Q-Day ─► 14 giam-dan + 30 qday = 44 chip
  │
  └─ 7 Làm Quen + 14 Giảm Dần + 30 Q-Day ─► 51 chip (full)
```

Hệ thống tự xác định user đang ở giai đoạn nào dựa trên 3 field DateTime:
- `lamQuenStartDate` (T-21)
- `taperingStartDate` (T-14)
- `quitDate` (D0 = Q-Day)

---

## Schema migration

### Bổ sung User fields

```prisma
model User {
  // ... existing fields

  // Pre-Q-Day phases
  lamQuenStartDate    DateTime?  // ngày bắt đầu 7 ngày Làm quen
  taperingStartDate   DateTime?  // ngày bắt đầu 14 ngày Giảm dần (T-14)
  quitDate            DateTime?  // EXISTING — Q-Day (D0)

  // Push preferences
  zaloPushEnabled     Boolean    @default(true)
  pushTimeHour        Int        @default(8)  // 0-23, giờ ICT push hàng ngày

  // Backref
  pushLogs            QdayPushLog[]
}
```

### Table mới: QdayPushLog

```prisma
model QdayPushLog {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Identification
  phase           PushPhase  // 'LAM_QUEN' | 'TAPERING' | 'Q_DAY'
  dayNumber       Int        // 1..7 (Làm quen) | 1..14 (Tapering) | 1..30 (Q-Day)
  slug            String     // 'lam-quen-N' | 'giam-dan-N' | 'qday-N'

  // Push lifecycle
  scheduledAt     DateTime   // thời điểm cron đã định push
  sentAt          DateTime?  // thực sự gửi (sau khi Zalo API trả OK)
  zaloMessageId   String?    // ID Zalo trả về để track
  error           String?    // nếu fail thì lưu lý do

  // Engagement tracking
  openedAt        DateTime?  // user mở chat OA (qua webhook event)
  clickedAt       DateTime?  // user bấm wikiUrl (qua /api/qday/track ping)

  createdAt       DateTime   @default(now())

  @@unique([userId, phase, dayNumber], name: "unique_user_push_per_day")
  @@index([scheduledAt])
  @@index([userId, sentAt])
}

enum PushPhase {
  LAM_QUEN
  TAPERING
  Q_DAY
}
```

**Constraint:** `unique(userId, phase, dayNumber)` đảm bảo idempotent — cron re-run không push trùng.

### Migration command

```powershell
cd C:\BOTHUOCLA\sol-widget\backend
# Backup trước
.\backup.bat
# Run migration
npx prisma migrate dev --name add_zalo_push_scheduler
```

---

## Cron worker logic

### File: `backend/src/scheduler/zaloPush.ts`

```typescript
import cron from 'node-cron';
import { prisma } from '../db';
import { sendOAText, sendOAButtons } from '../zalo/oaClient';
import { logger } from '../utils/logger';

// Mỗi sáng 08:00 ICT (UTC+7) - cron expression UTC: '0 1 * * *'
// Hoặc tôn trọng từng user pushTimeHour: chạy mỗi giờ, lọc user theo giờ riêng

cron.schedule('0 * * * *', async () => {
  // Mỗi giờ chạy. Lấy user có pushTimeHour = current ICT hour
  const nowICT = getICTHour(); // helper

  const users = await prisma.user.findMany({
    where: {
      zaloPushEnabled: true,
      zaloUserId: { not: null },
      pushTimeHour: nowICT,
      OR: [
        { lamQuenStartDate: { not: null } },
        { taperingStartDate: { not: null } },
        { quitDate: { not: null } },
      ],
    },
  });

  for (const user of users) {
    try {
      const pushInfo = computePushForUser(user);
      if (!pushInfo) continue;  // không có chip để push hôm nay

      // Idempotent check
      const existing = await prisma.qdayPushLog.findUnique({
        where: {
          unique_user_push_per_day: {
            userId: user.id,
            phase: pushInfo.phase,
            dayNumber: pushInfo.dayNumber,
          },
        },
      });
      if (existing) continue;  // đã push rồi

      // Get chip from DB
      const chip = await prisma.cannedReply.findUnique({ where: { slug: pushInfo.slug } });
      if (!chip) {
        logger.warn(`Missing chip: ${pushInfo.slug}`);
        continue;
      }

      // Send via Zalo OA
      const text = `${chip.icon} ${chip.label}\n\n${chip.answer}`;
      const result = await sendOAButtons({
        recipientId: user.zaloUserId!,
        text,
        buttons: [{ title: 'Đọc đầy đủ', url: chip.wikiUrl }],
      });

      // Log success
      await prisma.qdayPushLog.create({
        data: {
          userId: user.id,
          phase: pushInfo.phase,
          dayNumber: pushInfo.dayNumber,
          slug: pushInfo.slug,
          scheduledAt: new Date(),
          sentAt: new Date(),
          zaloMessageId: result.message_id,
        },
      });
    } catch (err: any) {
      // Log failure (vẫn create log row với error)
      await prisma.qdayPushLog.create({
        data: {
          userId: user.id,
          phase: 'UNKNOWN',  // fallback
          dayNumber: 0,
          slug: 'unknown',
          scheduledAt: new Date(),
          error: err.message,
        },
      });
    }
  }
});
```

### Helper: `computePushForUser(user)`

```typescript
function computePushForUser(user: User): { phase, dayNumber, slug } | null {
  const today = startOfDay(new Date());

  // 1. Nếu có quitDate và today >= quitDate → push Q-Day
  if (user.quitDate) {
    const dayN = daysBetween(user.quitDate, today) + 1; // D0 = day 1
    if (dayN >= 1 && dayN <= 30) {
      return { phase: 'Q_DAY', dayNumber: dayN, slug: `qday-${dayN}` };
    }
    if (dayN > 30) return null;  // qua maintenance phase
  }

  // 2. Nếu có taperingStartDate → push Tapering (T-14 → T-1)
  if (user.taperingStartDate) {
    const dayN = daysBetween(user.taperingStartDate, today) + 1;
    if (dayN >= 1 && dayN <= 14) {
      return { phase: 'TAPERING', dayNumber: dayN, slug: `giam-dan-${dayN}` };
    }
  }

  // 3. Nếu có lamQuenStartDate → push Làm quen
  if (user.lamQuenStartDate) {
    const dayN = daysBetween(user.lamQuenStartDate, today) + 1;
    if (dayN >= 1 && dayN <= 7) {
      return { phase: 'LAM_QUEN', dayNumber: dayN, slug: `lam-quen-${dayN}` };
    }
  }

  return null;
}
```

---

## Click tracking

### Endpoint: `POST /api/qday/track`

User bấm "Đọc đầy đủ" trong chip Zalo → mở wikiUrl với UTM `?utm_source=zalo&utm_campaign=qday-N`. Frontend wiki (sol.vn) cần fire pixel ping về backend Sol:

```javascript
// Trên sol.vn (qua MU-plugin track-qday-click.js)
if (window.location.search.includes('utm_source=zalo')) {
  const params = new URLSearchParams(window.location.search);
  const campaign = params.get('utm_campaign'); // 'qday-5' | 'lamquen-3' | 'giamdan-7'
  // Lấy user ID từ cookie cross-domain hoặc qua zalo_user_id query param
  fetch('https://api.sol.vn/api/qday/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ campaign, zaloUserId: params.get('zid') }),
  });
}
```

### Backend handler

```typescript
// backend/src/messages/trackRoutes.ts
router.post('/qday/track', async (req, res) => {
  const { campaign, zaloUserId } = req.body;
  if (!campaign || !zaloUserId) return res.status(400).end();

  // Parse campaign: 'lamquen-3' → phase=LAM_QUEN, dayNumber=3
  const m = campaign.match(/^(lamquen|giamdan|qday)-(\d+)$/);
  if (!m) return res.status(400).end();

  const phaseMap = { lamquen: 'LAM_QUEN', giamdan: 'TAPERING', qday: 'Q_DAY' };
  const phase = phaseMap[m[1]];
  const dayNumber = parseInt(m[2]);

  const user = await prisma.user.findUnique({ where: { zaloUserId } });
  if (!user) return res.status(404).end();

  await prisma.qdayPushLog.updateMany({
    where: { userId: user.id, phase, dayNumber },
    data: { clickedAt: new Date() },
  });

  res.status(204).end();
});
```

### Open tracking (optional)

Zalo OA không cho delivery receipt cho free tier. Có thể bỏ qua, hoặc dùng webhook `user_send_text` event — nếu user reply trong vòng 24h sau push, coi như "opened".

---

## Admin analytics

### Endpoint: `GET /api/admin/qday-analytics`

```typescript
router.get('/admin/qday-analytics', requireAdmin, async (req, res) => {
  const { from, to } = req.query;  // ISO date strings

  // Aggregate by (phase, dayNumber)
  const stats = await prisma.$queryRaw`
    SELECT
      phase,
      "dayNumber",
      COUNT(*) as sent,
      COUNT("clickedAt") as clicked,
      COUNT("openedAt") as opened
    FROM "QdayPushLog"
    WHERE "sentAt" >= ${from}::timestamp
      AND "sentAt" <= ${to}::timestamp
      AND error IS NULL
    GROUP BY phase, "dayNumber"
    ORDER BY phase, "dayNumber"
  `;

  res.json(stats);
});
```

Admin UI: tạo route `/admin/qday-analytics` trong admin panel hiện có. Bảng với cột: Phase | Day | Sent | Clicked | CTR%.

---

## Build steps (theo thứ tự)

1. **Schema migration** (~30 phút)
   - Add 3 field User + table QdayPushLog vào `schema.prisma`
   - `npx prisma migrate dev --name add_zalo_push_scheduler`
   - Verify: `npx prisma studio` → kiểm tra schema mới

2. **Cron worker** (~2 giờ)
   - Tạo `backend/src/scheduler/zaloPush.ts`
   - Implement `computePushForUser()` helper với 3-tier logic
   - Test thủ công 1 user: tạo test user với `quitDate = today`, chạy cron 1 lần, verify chip qday-1 đã push

3. **Wire vào worker.ts** (~15 phút)
   - Import `zaloPush` vào `backend/src/scheduler/worker.ts`
   - Verify cron 08:00 ICT đăng ký đúng

4. **Click tracking endpoint** (~1 giờ)
   - Tạo route `POST /api/qday/track`
   - MU-plugin WP `track-qday-click.js` — embed vào sol.vn
   - Test: bấm 1 wikiUrl từ chip, verify `clickedAt` cập nhật

5. **Admin analytics** (~1 giờ)
   - Backend endpoint
   - Admin UI table mini

6. **End-to-end test** (~30 phút)
   - Tạo test user toàn lộ trình (51 ngày)
   - Manual trigger cron mỗi ngày 1 lần
   - Verify đủ 51 chip đẩy lên Zalo OA, click tracking hoạt động

---

## Roadmap sau Phase 5

- **Phase 6:** Maintenance phase (D31-D365 sau Q-Day) — weekly check-in, milestone celebrations, lapse recovery flow
- **Phase 7:** A/B test push time (08:00 vs 07:00 vs 20:00), copy variants
- **Phase 8:** Personalized push — chip variation theo trigger profile cá nhân
- **Phase 9:** Family push — vợ/người thân nhận thông báo milestone của user (D7, D14, D30, D90)

---

## Phụ lục: Prerequisites đã có ✅

| Item | Status | Path |
|---|---|---|
| Zalo OA Phase 1 (webhook + send) | ✅ LIVE | `backend/src/zalo/oaClient.ts` |
| Schema User.zaloUserId + quitDate | ✅ Tồn tại | `backend/prisma/schema.prisma` |
| Cron scheduler infrastructure | ✅ LIVE | `backend/src/scheduler/worker.ts` |
| computeDayNumber utility | ✅ Tồn tại | `backend/src/utils/dayNumber.ts` |
| 30 chip Q-Day trong DB | ✅ LIVE | seed qday-1 → qday-30 |
| 7 chip Làm Quen trong DB | ✅ LIVE | seed lam-quen-1 → 7 |
| 14 chip Giảm Dần trong DB | ✅ LIVE | seed giam-dan-1 → 14 |
| 21 bài Pre-Q-Day LIVE trên sol.vn | ⏳ Đang publish | 13 LIVE, 8 chờ user chạy publish |
| 30 bài Q-Day LIVE | ✅ LIVE | sol.vn từ 13/05/2026 |

---

## Open questions cho phiên Phase 5

1. **Cron time:** 08:00 ICT cố định cho mọi user, hay tôn trọng `user.pushTimeHour`?
2. **Multi-route conflict:** Nếu user vừa set `taperingStartDate` vừa set `quitDate` không khớp 14 ngày — ưu tiên field nào?
3. **Lapse logic:** Nếu user reply "tôi vấp" vào Zalo OA D5 Q-Day — push tiếp Day 6, hay reset Q-Day mới?
4. **Push limit:** Zalo OA free tier giới hạn 100k tin/tháng. Sol có cần throttle?
5. **Click tracking domain issue:** sol.vn (WP) vs api.sol.vn (backend) cross-domain CORS. Setup chính xác header.

---

**Em phiên Phase 5 sẽ bắt đầu bằng: schema migration → cron worker → test 1 user end-to-end. 3 bước cốt lõi xong = MVP Phase 5 LIVE.**
