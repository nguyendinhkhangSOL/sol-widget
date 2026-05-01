# SOL Companion Widget

Chat-style companion widget cho lộ trình cai thuốc 30 ngày của SOL (`bothuocla.sol.vn`). Đi kèm người dùng xuyên suốt Wiki, Workbook, và Dashboard; tích hợp check-in, bài tập, AI Mentor, thông báo cá nhân hoá, và chế độ SOS.

```
sol-widget/
├── backend/        # Express + Socket.IO + Prisma + Claude API
├── frontend/       # React 18 + Vite + Tailwind — widget (floating, embeddable)
├── dashboard/      # React 18 + Vite + Tailwind — trang chủ bothuocla.sol.vn/dashboard
├── docker-compose.yml
└── README.md
```

Hai phần UI dùng chung backend:

| | Widget (`frontend/`) | Dashboard (`dashboard/`) |
|---|---|---|
| Vai trò | Companion nhỏ theo user ở mọi trang (wiki, workbook…) | Trang chính để xem hành trình đầy đủ |
| Dùng khi | Check-in nhanh, SOS, chat AI, bài tập | Phút tĩnh lặng: đọc nhật ký, xem pattern, cài đặt |
| Port dev | 5173 | 5174 |
| Tab | Greeting / Chat / Check-in / Hành trình / Bài tập / Hộp thư / Settings | Tổng quan / Hành trình / Nhật ký / Phân tích / Cài đặt |
| Deploy | Embed IIFE hoặc iframe vào mọi trang SOL | `bothuocla.sol.vn/dashboard` |

## 1. Yêu cầu

- Node.js 20+
- PostgreSQL 14+ (hoặc dùng `docker-compose up db`)
- `ANTHROPIC_API_KEY` (Claude Haiku + Sonnet)
- VAPID keypair cho Web Push: `npx web-push generate-vapid-keys`

## 2. Chạy nhanh (Docker)

```bash
cd sol-widget
cp backend/.env.example backend/.env
# điền ANTHROPIC_API_KEY, JWT_SECRET, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY
docker compose up -d db
cd backend && npm install && npx prisma migrate dev && npm run seed && cd ..
docker compose up backend frontend dashboard
```

- Widget dev harness: http://localhost:5173
- Dashboard: http://localhost:5174
- Backend API: http://localhost:4000

## 3. Chạy thủ công (dev)

### Backend
```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run seed              # tạo user demo +84900000001 + content mẫu
npm run dev               # ts-node-dev src/index.ts @ :4000
```

### Widget (companion)
```bash
cd frontend
npm install
npm run dev               # Vite @ :5173
```

### Dashboard (trang chính)
```bash
cd dashboard
npm install
npm run dev               # Vite @ :5174
```

OTP in ra log backend khi `NODE_ENV=development`.

## 4. Nhúng vào site khác (Wiki, Workbook, Dashboard)

Build bundle IIFE:
```bash
cd frontend
npm run build:embed       # xuất public/sol-widget.js
```

Sau đó nhúng vào bất kỳ trang nào:
```html
<script
  src="https://cdn.sol.vn/sol-widget.js"
  data-auto="true"
  data-api-base="https://api.sol.vn"
  data-token="<JWT của user hiện tại>"
  defer
></script>
```

API runtime:
```js
SOLWidget.init({ apiBase, socketBase, token, autoOpen });
SOLWidget.open();
SOLWidget.close();
SOLWidget.setToken(jwt);
SOLWidget.logout();
```

Service worker (`/sol-sw.js`) phải được serve ở root domain để nhận Web Push.

## 5. Kiến trúc

**Backend** (`backend/src/`)
- `auth/` — OTP + JWT (phone-based)
- `state/machine.ts` — state machine: `IDLE → CHECKIN_FLOW → EXERCISE_FLOW → AI_CHAT → CRISIS_MODE`
- `ai/mentor.ts` — Claude routing (Haiku primary, Sonnet khi cần), quota 30 tin nhắn/user/ngày
- `scheduler/worker.ts` — cron đẩy content module theo ngày + giờ cá nhân
- `notifications/` — Web Push (VAPID) + Inbox
- `socket/` — Socket.IO rooms theo `user:${id}`

**Frontend** (`frontend/src/`)
- `SolWidget.tsx` — orchestrator (auth gate / bubble / panel)
- `components/WidgetBubble.tsx` — icon thu gọn + badge chưa đọc
- `components/WidgetPanel.tsx` — header (Ngày X/30, chuỗi) + router view + tab bar
- `components/views/` — Greeting, Chat, CheckinFlow, ExerciseCard, CrisisMode, InboxView, Settings
- `state/store.ts` — Zustand, rage detection (đóng < 3s), auto-switch view theo `state`

## 6. Mô hình dữ liệu (Prisma)

- `User` — phone, name, pronouns, quitDate, FTND, riskyHours, topTriggers, settings, các metric engagement (streak, missedDaysInRow, refundEligible).
- `CheckIn` — pulse dữ liệu (smoked, craving 1–10, mood 1–5, sickDay).
- `ExerciseEntry` — workbook, content JSON, completedAt.
- `Message` — log hội thoại; `type` phân loại (CHAT / MORNING_GOAL / PHENOMENA_ALERT / EXERCISE_CARD / CHECKIN_STEP / CRISIS_PROMPT / NIGHT_STORY …).
- `ContentItem` — nội dung mẫu theo ngày (module + pushTime + exerciseSchema).
- `Notification` + `PushSubscription` — hộp thư + đăng ký trình duyệt.
- `CrisisEvent` — log SOS (intensityStart/End, stage).
- `UserState` — persistent state machine.

## 7. Refund gate (engagement logic)

- Cooling period: ngày 1–7 không refund (để user vượt qua đỉnh withdrawal).
- Engagement gate: > 1 ngày bỏ check-in → `refundEligible=false`.
- Sick day: mỗi user được 1 ngày "ốm" mỗi 10 ngày không tính vào chuỗi.
- Completion bonus: hoàn thành đủ 30 ngày (dù không cai hẳn) → bonus 150k.

Code: `backend/src/state/machine.ts → updateEngagement()`.

## 8. Chi phí AI mục tiêu

- Target: < 30k VND/user/tháng.
- Strategy: Haiku làm primary (~$0.25/1M input), chỉ fallback Sonnet khi:
  - `CRISIS_MODE` hoặc keyword SOS
  - Tin nhắn dài > 200 từ
  - Mood trend giảm 2 ngày liên tiếp
- Quota cứng: 30 tin nhắn AI / user / ngày. Vượt → khuyến khích check-in/bài tập.

## 9. Kiểm thử thủ công

```bash
# Gọi check-in
curl -X POST http://localhost:4000/checkins \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"smoked":false,"cravingIntensity":4,"mood":4}'

# Trigger crisis
curl -X POST http://localhost:4000/messages \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"content":"Tôi muốn hút quá","metadata":{"intent":"crisis_start","intensity":9}}'
```

## 10. Todo (V1.1)

- [ ] Nội dung 30 ngày biên tập đầy đủ (hiện chỉ seed mẫu ngày 1/2/3/7/14).
- [ ] Zalo OA fallback cho user không dùng web.
- [ ] Dashboard admin để theo dõi cohort.
- [ ] A/B test refund formula (F1 linear vs F2 accelerating).

---

© SOL — Founder: Nguyễn Đình Khang · nguyendinhkhang@gmail.com
