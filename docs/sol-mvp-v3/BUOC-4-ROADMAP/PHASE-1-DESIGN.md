# Bước 4 Roadmap 90 Ngày — Phase 1 Design

**Version:** 1.0
**Date:** 2026-07-05
**Status:** Draft cho anh review

---

## 🎯 Discovery — Data đã có sẵn

Kiểm tra Prisma schema `Direction` (từ task #62 Database Mô Hình), phát hiện:

```prisma
model Direction {
  // ...
  roadmap12Tuan         Json?    @map("roadmap_12_tuan")
  giaiDoan3TieuDe       Json?    @map("giai_doan_3_tieu_de")  // ["Định vị", "Momentum", "Khách #1"]
  saiLam5               Json?    @map("sai_lam_5")             // 5 sai lầm phổ biến
  solActiveFramework    Json?    @map("sol_active_framework")  // 6 framework
  congCu10              Json?    @map("cong_cu_10")            // 10 tool VN
  // ...
}
```

**Nghĩa là:** 37 mô hình có sẵn roadmap 12 tuần trong DB. **Không cần rebuild templates**.

**Task Phase 1 giảm scope:**
1. Verify data hiện có trong `roadmap12Tuan` — consistent không?
2. Design schema `UserRoadmap` + `RoadmapProgress` cho tracking
3. Wireframe page `/toi/roadmap/`

---

## 📐 Roadmap12Tuan JSON Schema (chuẩn hoá)

**Format đề xuất:**

```json
{
  "meta": {
    "total_weeks": 12,
    "phases": ["Định vị", "Momentum", "Khách #1"],
    "phase_weeks": [4, 4, 4]
  },
  "weeks": [
    {
      "week": 1,
      "phase": 1,
      "phase_name": "Định vị",
      "theme": "Xác định ngách chuyên môn",
      "actions": [
        {
          "id": "w1-a1",
          "title": "Liệt kê 3 ngách bạn từng làm 5+ năm",
          "type": "reflection",
          "time_min": 30,
          "tools": [],
          "output": "Danh sách 3 ngách + rank theo passion + expertise"
        },
        {
          "id": "w1-a2",
          "title": "Nghiên cứu 5 competitor VN trong ngách #1",
          "type": "research",
          "time_min": 60,
          "tools": ["Google", "LinkedIn"],
          "output": "Bảng so sánh: giá, dịch vụ, khách hàng target"
        },
        {
          "id": "w1-a3",
          "title": "Viết positioning statement 1 câu",
          "type": "output",
          "time_min": 45,
          "tools": ["ChatGPT prompt template"],
          "output": "Câu 1: Tôi giúp [X] đạt được [Y] qua [Z]"
        }
      ]
    },
    // ... week 2 → 12
  ]
}
```

**Fields chi tiết:**

| Field | Type | Ý nghĩa |
|-------|------|---------|
| `week` | int (1-12) | Tuần thứ mấy |
| `phase` | int (1-3) | Giai đoạn |
| `phase_name` | string | "Định vị" / "Momentum" / "Khách #1" |
| `theme` | string | Chủ đề tuần đó |
| `actions[]` | array | 3-5 actions/tuần |
| `action.id` | string | Unique ID (VD: `w3-a2`) |
| `action.title` | string | Việc cần làm (imperative) |
| `action.type` | enum | `reflection` / `research` / `output` / `outreach` / `learn` |
| `action.time_min` | int | Thời gian ước tính (phút) |
| `action.tools[]` | string[] | Công cụ cần dùng |
| `action.output` | string | Kết quả cụ thể sau khi làm xong |

---

## 🗄 Schema mới cần add — UserRoadmap + Progress

**Rationale:** User complete Bước 1+2+3 → chọn 1 mô hình → generate `UserRoadmap` snapshot từ `Direction.roadmap12Tuan`. User check off actions → track `RoadmapProgress`.

```prisma
// ═══════════════════════════════════════════════
// USER ROADMAP — Cá nhân hoá cho mỗi user
// ═══════════════════════════════════════════════

model UserRoadmap {
  id              Int              @id @default(autoincrement())
  userId          Int                                        @map("user_id")
  user            User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  directionId     String                                     @map("direction_id")
  direction       Direction        @relation(fields: [directionId], references: [id])

  // Snapshot roadmap tại thời điểm generate (nếu Direction update, user vẫn giữ snapshot cũ)
  snapshotData    Json                                       @map("snapshot_data")

  // Personalization context (từ Bước 1+2)
  userContext     Json?                                      @map("user_context")
  // { dna: {...}, vonNgam: {...}, hoursPerWeek: 10, startDate: "2026-07-05" }

  // Overall status
  status          String           @default("active")        // active | paused | completed | abandoned
  startedAt       DateTime         @default(now())           @map("started_at")
  targetEndDate   DateTime?                                  @map("target_end_date")  // startedAt + 90 days
  completedAt    DateTime?                                  @map("completed_at")

  // Denormalized progress %
  totalActions    Int              @default(0)               @map("total_actions")
  completedActions Int             @default(0)               @map("completed_actions")
  progressPct     Float            @default(0)               @map("progress_pct")     // 0-100

  createdAt       DateTime         @default(now())           @map("created_at")
  updatedAt       DateTime         @updatedAt                @map("updated_at")

  progress        RoadmapProgress[]

  @@unique([userId, directionId])
  @@index([userId, status])
  @@map("user_roadmaps")
}

// ═══════════════════════════════════════════════
// ROADMAP PROGRESS — Per-action tracking
// ═══════════════════════════════════════════════

model RoadmapProgress {
  id              Int              @id @default(autoincrement())
  userRoadmapId   Int                                        @map("user_roadmap_id")
  userRoadmap     UserRoadmap      @relation(fields: [userRoadmapId], references: [id], onDelete: Cascade)

  actionId        String                                     @map("action_id")        // "w1-a1"
  weekNumber      Int                                        @map("week_number")      // 1-12
  status          String           @default("pending")       // pending | in_progress | completed | skipped

  completedAt     DateTime?                                  @map("completed_at")
  userNote        String?          @db.Text                  @map("user_note")        // User notes/reflection

  createdAt       DateTime         @default(now())           @map("created_at")
  updatedAt       DateTime         @updatedAt                @map("updated_at")

  @@unique([userRoadmapId, actionId])
  @@index([userRoadmapId, status])
  @@map("roadmap_progress")
}
```

---

## 🎨 Wireframe — Trang `/toi/roadmap/`

```
┌───────────────────────────────────────────────────────┐
│  Roadmap 90 Ngày                        [avatar menu] │
│  Mô hình: 🎓 Freelancer Kế Toán U45                   │
│  Ngày bắt đầu: 05/07/2026 → Ngày đích: 03/10/2026    │
│                                                        │
│  ▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░  8/60 actions (13%) │
├───────────────────────────────────────────────────────┤
│                                                        │
│  ┌── GIAI ĐOẠN 1 · ĐỊNH VỊ (Tuần 1-4) ─── 25% ──┐   │
│  │                                                  │  │
│  │  [Tuần 1: Xác định ngách chuyên môn]  ✅ 3/3    │  │
│  │  [Tuần 2: Nghiên cứu thị trường]      ✅ 3/3    │  │
│  │  [Tuần 3: Tạo profile chuyên gia]     🟡 2/4    │  │
│  │  [Tuần 4: Xây dựng chỗ đứng]          ⚪ 0/4    │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  ┌── GIAI ĐOẠN 2 · MOMENTUM (Tuần 5-8) ─── 0% ────┐  │
│  │  [Tuần 5-8 locked cho đến khi hoàn thành GĐ 1]  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  ┌── GIAI ĐOẠN 3 · KHÁCH #1 (Tuần 9-12) ─ 0% ───┐   │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  [Xem tuần chi tiết ▼]                                │
│                                                        │
├───────────────────────────────────────────────────────┤
│  TUẦN 3 · Tạo profile chuyên gia (60 phút/action)     │
│                                                        │
│  ✅ Chụp ảnh professional + LinkedIn banner           │
│      → Output: 3 ảnh chọn, banner 1584x396           │
│      🕒 Hoàn thành 03/07/2026                        │
│                                                        │
│  ✅ Viết bio 150 chữ tối ưu keyword                  │
│      → Output: bio đăng LinkedIn + Facebook          │
│      🕒 Hoàn thành 04/07/2026                        │
│                                                        │
│  ⬜ Case study đầu tiên (nếu đã có project cũ)       │
│      → Output: 1 case 300-500 từ + số liệu           │
│      Tools: ChatGPT prompt template #5               │
│      [Đánh dấu hoàn thành] [Ghi chú]                 │
│                                                        │
│  ⬜ Setup Calendly link đặt lịch tư vấn miễn phí     │
│      → Output: URL calendly.com/yourname             │
│      [Đánh dấu hoàn thành]                           │
└───────────────────────────────────────────────────────┘
```

**Key UX principles:**
- **Progressive disclosure:** Chỉ show tuần hiện tại + tuần đã xong. Tuần future locked.
- **Momentum-based unlock:** Hoàn thành 60% actions của tuần N → unlock tuần N+1
- **Estimated time:** Mỗi action có `time_min` để user planning
- **Concrete output:** Không chung chung — có `output` cụ thể
- **User note:** Cho phép ghi lại reflection sau mỗi action

---

## 🔧 API Endpoints Phase 2 (design trước)

```
POST   /api/roadmap/generate
  Body: { directionId, hoursPerWeek?, startDate? }
  Response: { userRoadmapId, snapshotData }

GET    /api/roadmap/mine
  Response: [{ userRoadmapId, direction, progressPct, currentWeek }]

GET    /api/roadmap/:id
  Response: { userRoadmap, progress[] }

POST   /api/roadmap/:id/action/:actionId/complete
  Body: { note?: string }

POST   /api/roadmap/:id/action/:actionId/uncomplete

POST   /api/roadmap/:id/pause
POST   /api/roadmap/:id/resume
```

---

## 🚦 Phase Plan chi tiết

| Phase | Việc | Effort |
|-------|------|--------|
| **1a** | Verify data `roadmap12Tuan` trong DB đủ chuẩn cho 37 mô hình | 1 ngày |
| **1b** | Điền/chuẩn hoá schema JSON cho các mô hình chưa đủ | 2-3 ngày |
| **2a** | Prisma migration: add UserRoadmap + RoadmapProgress | 30 phút |
| **2b** | Backend API endpoints (6 routes trên) | 1 ngày |
| **3a** | Frontend `/toi/roadmap/` page — display + progress | 1-2 ngày |
| **3b** | Frontend `/toi/roadmap/:id/action/:actionId` — chi tiết + note | 1 ngày |
| **4** | E2E test flow: complete Bước 3 → generate roadmap → track progress | 0.5 ngày |

**Total effort:** ~7-10 ngày (1.5-2 tuần dev)

---

## ❓ Câu hỏi cho anh trước khi ship Phase 2

1. **Roadmap 90 ngày lock ngày bắt đầu tự động** (từ ngày user complete Bước 3) hay **user tự chọn start date**?

2. **Personalization mức độ nào cho Phase 1?**
   - **Simple:** Chỉ show base roadmap từ `Direction.roadmap12Tuan` — mọi user cùng mô hình = cùng roadmap
   - **Adjust theo thời gian:** User input `hoursPerWeek` (5h/10h/20h) → adjust số action/tuần
   - **Full personalized:** Kết hợp DNA + Vốn ngầm để prioritize actions

3. **Progressive unlock hay show all?**
   - **Locked:** Tuần 5 khóa cho đến khi complete 60% Tuần 1-4
   - **Show all:** Show hết 12 tuần từ đầu, user tự chọn skip

4. **Output tracking:** Cho user upload file/screenshot khi complete action, hay chỉ note text?

5. **Notification:** Email/Zalo reminder hàng tuần cho action pending?

---

## 📊 Success Metrics (đo lường Phase 3 sau launch)

- **Activation:** % Active user generate roadmap (target: 80%)
- **Week 1 completion:** % user complete Tuần 1 (target: 60%)
- **90-day completion:** % user hoàn thành ≥50% actions (target: 30%)
- **Retention:** % user active weekly (target: 40% at day 30)

---

## Next Step

Anh review design này rồi:
1. Approve schema + wireframe → em start Phase 2 (backend)
2. Feedback UX → em iterate
3. Hoặc quyết định giảm scope (VD: skip progress tracking Phase 1)
