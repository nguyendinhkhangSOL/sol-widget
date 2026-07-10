# Sol CRM Master — Kiến trúc hệ thống quản trị khách hàng

**Đích:** Đưa TẤT CẢ user (mọi flow) về `adminhuongdi.sol.vn/customers` để quản trị, thống kê, báo cáo, CRM lâu dài.

**Version:** 1.0 — 2026-07-05
**Status:** Design phase (chờ anh approve trước khi build)

---

## 🎯 Vision — 1 Bảng Điều Khiển Duy Nhất

```
┌──────────────────────────────────────────────────────────────┐
│  adminhuongdi.sol.vn                                          │
│                                                                │
│  📊 Dashboard      → Metrics + Charts (revenue, growth, churn)│
│  👥 Customers      → Master view (từ MỌI nguồn) ← MỚI          │
│  💰 Leads          → Payment orders (giữ nguyên, chi tiết)     │
│  📝 Directions     → 37 mô hình management                    │
│  🎯 Cases + Articles → Content management                     │
│  📧 Campaigns      → Bulk email/Zalo campaigns (Phase 2)       │
│  ⚙  Settings       → System config                            │
└──────────────────────────────────────────────────────────────┘
```

**Nguyên tắc thiết kế:**
- 1 email = 1 customer record (regardless of source)
- Data không mất — history từ khi first touch
- Actionable — mọi row có thể tương tác (send email, add note, tag, etc.)
- Exportable — mọi list export CSV được

---

## 🗃 Data Model — Tables cần thiết

### Bảng đã có (giữ nguyên)

| Table | Vai trò | Ghi chú |
|-------|---------|---------|
| `users` | Master auth records | Email UNIQUE, password_hash, tier |
| `leads` | Payment orders | Từ /thanh-toan/, mỗi user có N leads |
| `lead_notifications` | Log emails/notifications gửi | Audit trail |
| `user_events` | User activity events | Track behavior |
| `p1_results`, `p2_results` | Quiz answers | Behavioral data |
| `saved_directions` | User saved 37 mô hình nào | Interest tracking |

### Bảng cần THÊM (Phase 1)

```prisma
// ═══════════════════════════════════════════════
// CUSTOMER NOTES — Admin ghi chú per user
// ═══════════════════════════════════════════════
model CustomerNote {
  id          Int      @id @default(autoincrement())
  userId      String?  @map("user_id")
  user        User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
  leadId      Int?     @map("lead_id")
  lead        Lead?    @relation(fields: [leadId], references: [id], onDelete: Cascade)

  content     String   @db.Text
  category    String   @default("general")  // general | call | meeting | issue | opportunity
  isPrivate   Boolean  @default(false)      @map("is_private")

  authorId    String                        @map("author_id")     // admin_user id
  createdAt   DateTime @default(now())      @map("created_at")
  updatedAt   DateTime @updatedAt           @map("updated_at")

  @@index([userId, createdAt])
  @@index([leadId, createdAt])
  @@map("customer_notes")
}

// ═══════════════════════════════════════════════
// CUSTOMER TAGS — Segmentation flexible
// ═══════════════════════════════════════════════
model CustomerTag {
  id          Int      @id @default(autoincrement())
  userId      String?  @map("user_id")
  user        User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
  leadId      Int?     @map("lead_id")
  lead        Lead?    @relation(fields: [leadId], references: [id], onDelete: Cascade)

  tag         String                                              // "vip", "hot-lead", "churned", "founder-target"

  addedById   String                        @map("added_by_id")   // admin who added
  createdAt   DateTime @default(now())      @map("created_at")

  @@unique([userId, tag])
  @@unique([leadId, tag])
  @@index([tag])
  @@map("customer_tags")
}

// ═══════════════════════════════════════════════
// FOLLOW-UP TASKS — CRM reminders
// ═══════════════════════════════════════════════
model FollowUp {
  id          Int      @id @default(autoincrement())
  userId      String?  @map("user_id")
  user        User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
  leadId      Int?     @map("lead_id")
  lead        Lead?    @relation(fields: [leadId], references: [id], onDelete: Cascade)

  title       String
  description String?  @db.Text
  dueAt       DateTime                      @map("due_at")
  status      String   @default("pending")  // pending | done | snoozed | cancelled
  completedAt DateTime?                     @map("completed_at")

  assignedToId String?                      @map("assigned_to_id")
  createdById String                        @map("created_by_id")
  createdAt   DateTime @default(now())      @map("created_at")

  @@index([status, dueAt])
  @@index([assignedToId, status])
  @@map("follow_ups")
}

// ═══════════════════════════════════════════════
// EMAIL CAMPAIGNS — Bulk send tracking (Phase 2)
// ═══════════════════════════════════════════════
model EmailCampaign {
  id            Int      @id @default(autoincrement())
  name          String
  subject       String
  bodyHtml      String   @db.Text @map("body_html")

  segmentFilter Json?                       @map("segment_filter")  // JSON filter: tier=ACTIVE, tag=vip, ...
  totalTargets  Int      @default(0)        @map("total_targets")
  sentCount     Int      @default(0)        @map("sent_count")
  openedCount   Int      @default(0)        @map("opened_count")
  clickedCount  Int      @default(0)        @map("clicked_count")

  status        String   @default("draft")  // draft | scheduled | sending | sent | archived
  scheduledAt   DateTime?                   @map("scheduled_at")
  sentAt        DateTime?                   @map("sent_at")

  createdById   String                      @map("created_by_id")
  createdAt     DateTime @default(now())    @map("created_at")

  @@index([status, scheduledAt])
  @@map("email_campaigns")
}
```

### View master (đã ship)

`email_master` — FULL OUTER JOIN users + leads → 1 row per unique email, có source badge + marketing_segment.

---

## 🎨 Frontend Pages — Admin UI

### Page 1: `/admin/customers` (LIST — Master view) ⭐

```
┌────────────────────────────────────────────────────────────────────┐
│  Customers                                             [+ Add] [⚙] │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  🔍 Search email/phone/name...                                     │
│                                                                     │
│  Filter: [Source ▼] [Tier ▼] [Segment ▼] [Tag ▼] [Date ▼] [Clear] │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ ☐ │ Email                       │ Tier    │ Source  │ Ngày │   │
│  ├────────────────────────────────────────────────────────────┤   │
│  │ ☐ │ nguyendinhkhang@gmail.com   │ ACTIVE  │ BOTH    │ 07-02│   │
│  │   │ 0912727388 · Đinh Khang     │ 499k/năm│ VIP     │      │   │
│  │ ─────────────────────────────────────────────────────────  │   │
│  │ ☐ │ ngayhomnayonline@gmail.com  │ FREE    │ USER    │ 07-05│   │
│  │   │ 0912345567 · Khangnd test1  │ nurture │ new     │      │   │
│  │ ─────────────────────────────────────────────────────────  │   │
│  │ ☐ │ nguyendinhkhang1@gmail.com  │ (none)  │ LEAD    │ 07-04│   │
│  │   │ 0912727382 · DinhKhang      │ PAID    │ orphan  │      │   │
│  │   │ ⚠ Chưa activate — Gửi magic link                     │   │
│  │ ─────────────────────────────────────────────────────────  │   │
│  │ ...                                                          │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Bulk actions: [Send Email] [Send Zalo] [Add Tag] [Export CSV]     │
│  Showing 1-20 of 7 · Page [1] 2 3 ... [Next]                      │
└────────────────────────────────────────────────────────────────────┘
```

**Filter dropdowns:**
- Source: All / BOTH / USER_ONLY / LEAD_ONLY
- Tier: All / FREE / ACTIVE / FOUNDER / EXPIRED
- Segment: All / FREE_USER / PAID_USER / ORPHAN_PAID / ABANDONED_CHECKOUT
- Tag: All / VIP / Hot lead / Churned / Founder target / ...
- Date range: Last 7/30/90 days / Custom

**Bulk actions:**
- Send Email (bulk template)
- Send Zalo (manual list export)
- Add Tag (bulk tagging)
- Export CSV (all filtered rows)

---

### Page 2: `/admin/customers/:id` (DETAIL — Full profile)

```
┌────────────────────────────────────────────────────────────────────┐
│  ← Customers                                                        │
│                                                                     │
│  Đinh Khang Nguyễn — nguyendinhkhang@gmail.com                     │
│  📞 0912727388 · 💬 Zalo: 091... · Ho Chi Minh                     │
│  🏷 Tags: [VIP] [Founder-target] [+]                                │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [Overview] [Payments] [Activity] [Chat] [Quiz] [Notes] [Settings] │
│                                                                     │
├─ Overview ─────────────────────────────────────────────────────────┤
│                                                                     │
│  Tier: ACTIVE · Expires: 2027-07-02 (12 tháng)                    │
│  Total spent: 499,000đ · 1 payment                                 │
│  Signed up: 2026-07-02 (3 ngày trước)                             │
│  Last active: 2026-07-05 03:44                                    │
│  Direction interest: Freelancer Chuyên Môn (saved 07-03)          │
│                                                                     │
│  ── Quick Stats ──                                                  │
│  Roadmap progress: 0% (chưa start)                                 │
│  Chat conversations: 3 · Sổ Hành Trình entries: 2                  │
│  Login count: 8 · Last IP: 14.231.190.236                         │
│                                                                     │
├─ Payments ─────────────────────────────────────────────────────────┤
│                                                                     │
│  Lead #4 · 499,000đ · ACTIVE (12 tháng) · ACTIVATED 07-02         │
│  Lead #3 · 499,000đ · ACTIVE · ACTIVATED (duplicate test) 07-02   │
│  ...                                                                │
│                                                                     │
├─ Activity Timeline ────────────────────────────────────────────────┤
│                                                                     │
│  🕐 03:44  Đăng nhập từ 14.231.190.236                             │
│  🕐 02:15  Xem trang /toi/roadmap/                                  │
│  🕒 07-04  Lưu direction "Freelancer Chuyên Môn"                    │
│  💬 07-03  Chat "Sol Đồng Hành AI" (5 messages)                     │
│  💰 07-02  Thanh toán Active 499k (Lead #4)                        │
│  📝 07-02  Đăng ký tài khoản                                        │
│                                                                     │
├─ Notes ────────────────────────────────────────────────────────────┤
│                                                                     │
│  [+ Thêm ghi chú]                                                   │
│                                                                     │
│  📞 07-04 · Khang · call                                            │
│    "Khách hàng gọi hỏi về Bước 4 Roadmap. Đã explain phase..."     │
│                                                                     │
│  ⭐ 07-02 · Khang · opportunity                                     │
│    "Founder target — chuyên môn IT + đã đầu tư Sol từ đầu"         │
│                                                                     │
├─ Follow-ups ───────────────────────────────────────────────────────┤
│                                                                     │
│  [+ New follow-up]                                                  │
│                                                                     │
│  ⏰ 07-08 · Send Founder Edition proposal                           │
│  ⏰ 07-15 · Check roadmap progress (30 ngày)                        │
└────────────────────────────────────────────────────────────────────┘
```

**Tabs:**
1. **Overview** — Snapshot metrics
2. **Payments** — All leads history
3. **Activity** — Timeline events
4. **Chat** — Sol Đồng Hành AI conversations
5. **Quiz** — P1/P2 results
6. **Notes** — Admin ghi chú
7. **Settings** — Reset password, ban user, delete, ...

---

### Page 3: `/admin/dashboard` (Enhanced stats)

```
┌────────────────────────────────────────────────────────────────────┐
│  Dashboard                                       [Last 30 days ▼] │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  📊 Overview                                                        │
│  ┌──────────┬──────────┬──────────┬──────────┐                     │
│  │ Total    │ Active   │ Revenue  │ MRR      │                     │
│  │ 7 users  │ 2 (28%)  │ 998k     │ 83k/mo   │                     │
│  │ ▲ +2 30d │ ▲ +1 30d │ ▲ +499k  │ +83k     │                     │
│  └──────────┴──────────┴──────────┴──────────┘                     │
│                                                                     │
│  📈 Growth chart (line chart 90 days)                              │
│  📊 Source breakdown (pie: BOTH / USER-only / LEAD-only)           │
│  📊 Tier distribution (pie: FREE / ACTIVE / FOUNDER)               │
│                                                                     │
│  ⚠  Alerts:                                                        │
│  • 2 leads paid nhưng chưa activate (orphan) [Take action]         │
│  • 3 users FREE quá 7 ngày chưa upgrade [Send nurture]             │
│  • 1 follow-up quá hạn: "Send Founder proposal to X"               │
│                                                                     │
│  🕐 Recent activity (last 10 events)                               │
│  ...                                                                │
└────────────────────────────────────────────────────────────────────┘
```

---

## 🔌 API Endpoints — Backend

### Customer Management

```
GET    /api/admin/customers
  Query: ?q=<search>&source=<BOTH|USER_ONLY|LEAD_ONLY>&tier=<>&segment=<>&tag=<>&page=1&limit=20
  Response: { items: [customer_master...], total, page, pages }

GET    /api/admin/customers/:emailOrId
  Response: { customer, leads[], payments[], notes[], tags[], events[], quiz[], follow_ups[] }

POST   /api/admin/customers/:id/notes
  Body: { content, category, is_private }

POST   /api/admin/customers/:id/tags
  Body: { tag }
DELETE /api/admin/customers/:id/tags/:tag

POST   /api/admin/customers/:id/follow-ups
  Body: { title, description, due_at }
PATCH  /api/admin/follow-ups/:id
  Body: { status } // done | snoozed | cancelled

POST   /api/admin/customers/bulk-email
  Body: { customer_ids: [], subject, body_html }
```

### Stats & Reports

```
GET    /api/admin/stats/overview
  Response: { total_customers, active_count, revenue_total, mrr, growth_pct }

GET    /api/admin/stats/growth?days=90
  Response: { labels: [dates], new_users: [], new_leads: [], revenue: [] }

GET    /api/admin/stats/source-breakdown
  Response: { BOTH: 2, USER_ONLY: 3, LEAD_ONLY: 2 }

GET    /api/admin/stats/tier-distribution
  Response: { FREE: 3, ACTIVE: 2, FOUNDER: 1, EXPIRED: 0 }

GET    /api/admin/stats/alerts
  Response: { orphan_paid: 2, free_over_7d: 3, overdue_followups: 1 }
```

### Export

```
GET    /api/admin/export/customers.csv
  Query: <same as list>
  Response: text/csv download
```

---

## 🚦 Roadmap Phases

| Phase | Việc | Effort | Priority |
|-------|------|--------|----------|
| **1** | Data foundation (view + migration) | 30 phút | ✅ DONE |
| **2** | Schema additions (notes + tags + followups) | 1 giờ | HIGH |
| **3** | Backend API endpoints (10 routes) | 1-2 ngày | HIGH |
| **4** | Frontend `/admin/customers` list page | 1 ngày | HIGH |
| **5** | Frontend `/admin/customers/:id` detail page | 1-2 ngày | HIGH |
| **6** | Enhanced `/admin/dashboard` stats + charts | 1 ngày | MEDIUM |
| **7** | Bulk actions (email, tag, export) | 1 ngày | MEDIUM |
| **8** | Email campaigns full flow | 2-3 ngày | LOW (Phase 2) |

**Total effort:** ~7-10 ngày dev (2 tuần)

---

## 💡 Design decisions

### Q: Tại sao KHÔNG merge users + leads thành 1 table?

**Rationale:** Separation of concerns
- `users` = **identity** (email, password, tier) — 1 record/email
- `leads` = **transactions** (payments) — N records/email
- User có thể có 1..N payment orders → cần N records
- Merge sẽ khó track payment history

### Q: Prisma migration hay raw SQL?

**Recommend Prisma migration** để consistent với codebase. Backend hiện đã dùng Prisma cho users, leads, journey_days.

### Q: Có nên track PII carefully?

- **Yes** — Phase 2 add: `is_pii_masked`, GDPR compliance fields
- Log data access qua `user_events` (admin_id + accessed_customer_id + action)

---

## 📊 CRM Best Practices tích hợp

**"Right-touch" segmentation:**

| Segment | Signal | Action |
|---------|--------|--------|
| FREE_USER | Đã đăng ký, chưa TT | Nurture email 7 ngày |
| ORPHAN_PAID | Đã TT, chưa activate | Gửi magic link + reminder |
| ABANDONED_CHECKOUT | Vào /thanh-toan/, không complete | Retarget 24h |
| PAID_USER | Đang dùng ACTIVE | Loyalty content + upsell Founder |
| CHURNED | ACTIVE hết hạn | Win-back offer |
| VIP | Tag "vip" | High-touch (Khang cá nhân liên hệ) |

Mỗi segment → template email + workflow riêng.

---

## ✅ Deliverables Phase 1 (session này)

- [x] Migration link existing data (ship trước — đã có `migration-01-link-existing.sh`)
- [x] Create view `email_master` (đã có `create-email-master-view.sql`)
- [ ] Prisma schema additions (CustomerNote, CustomerTag, FollowUp)
- [ ] Migration script apply Prisma changes

## Deliverables Phase 2 (session sau)

- [ ] Backend API endpoints (list customers + detail + notes + tags)
- [ ] Frontend list page `/admin/customers`

Anh approve architecture này rồi em ship code.
