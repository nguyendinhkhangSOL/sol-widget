# SOL — Admin Content Design Doc

> **Status**: DRAFT — chờ Khang approve trước khi execute Phase 1.
> **Owner**: Khang Sol (solo founder, sẽ là user duy nhất của admin panel)
> **Author**: Claude (em) — 2026-05-04
> **Scope**: Build hệ thống biên tập tin nhắn (linh hồn của Sol) với personalization sâu — không phải SEO content, mà là content riêng cho từng user theo nhiều thuộc tính.

---

## 1. Triết lý

> "Mình càng hiểu người dùng, tin nhắn càng sát nhu cầu. Spam hoặc the same là user vứt ngay." — Khang

3 nguyên tắc chốt:

1. **Mỗi tin nhắn là kết quả của 1 phép match** giữa content (do Khang biên tập) và user attributes (thu thập qua onboarding + behavior). Không có tin nhắn "generic".
2. **Edit dễ + safe** — Khang có thể sửa 100+ lần trong năm, không sợ phá production. Full version history + preview trước save.
3. **Mở rộng được** — schema thiết kế cho 8 thuộc tính targeting (đã chốt), nhưng dễ add thuộc tính thứ 9-15 sau (vd thời gian thức dậy, nghề nghiệp).

---

## 2. 4 chốt từ Khang (2026-05-04)

| # | Câu hỏi | Quyết định | Implication |
|---|---------|------------|-------------|
| 1 | Voice variant — user chọn hay admin set? | **Admin set (có default)** | ContentItem có field `voice: 'khang_sol' \| 'sol_dong_hanh'`, mặc định `'sol_dong_hanh'`. Admin có thể set khác per item. User KHÔNG thấy option chọn. |
| 2 | Targeting AND (strict) hay weighted score? | **Strict AND** | Match rule: TẤT CẢ targetRules pass thì item match. Dễ debug, rõ ràng. Nhiều item match thì priority cao nhất thắng. |
| 3 | Audit log — full revision hay chỉ lastEdited? | **Full revision history** | Model `ContentItemRevision` mới. Mỗi save = 1 row revision. Có thể restore version cũ. Storage tăng 10x cho ContentItem nhưng content critical, đáng. |
| 4 | Migrate hardcode (STREAK/FOUNDER/EVENING) sang DB — Phase 1 hay Phase 3? | **Phase 3** | Phase 1 chỉ edit 127 ContentItem có sẵn. Hardcode worker.ts vẫn giữ. Phase 3 (sau 50+ user) migrate hết — khi đó voice ổn định, edit ít hơn. |

---

## 3. Schema design

### 3.1 ContentItem extend (Phase 1)

```prisma
model ContentItem {
  id         String        @id @default(cuid())
  dayNumber  Int           // 1..30
  module     ContentModule
  title      String
  body       String        @db.Text
  wikiUrl    String?
  imageUrl   String?
  audioUrl   String?
  exerciseKey    String?
  exerciseSchema Json?

  pushTime   String?
  published  Boolean       @default(true)

  // ── PHASE 1 — Voice + priority ──────────────────────────────────────
  voice      ContentVoice  @default(SOL_DONG_HANH)
  priority   Int           @default(100)  // Cao = thắng khi nhiều item match

  // ── PHASE 2 — Targeting rules ───────────────────────────────────────
  targetRules Json?         // null = default, không lọc
  // Shape:
  //   { ageMin?: 40, ageMax?: 60,
  //     yearsSmokedMin?: 10, yearsSmokedMax?: 30,
  //     ftndMin?: 0, ftndMax?: 10,
  //     gender?: 'male'|'female',
  //     region?: 'north'|'central'|'south',
  //     interests?: ['fitness','family'],   // user phải có ít nhất 1
  //     cigaretteType?: ['cigarette','thuốc lào','vape'] }

  // ── PHASE 3 — A/B test (sau) ────────────────────────────────────────
  variantGroup String?      // null hoặc tên nhóm vd "morning_day7_test1"
  weight       Int          @default(1)

  // ── Audit ───────────────────────────────────────────────────────────
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
  lastEditedBy String?      // userId của Khang

  revisions    ContentItemRevision[]

  @@unique([dayNumber, module, exerciseKey, voice])  // EXTEND unique để cho phép 2 voice/slot
  @@index([dayNumber, module, published])
}

enum ContentVoice {
  KHANG_SOL          // Giọng Khang Sol — ký tên, cá nhân
  SOL_DONG_HANH      // Giọng Sol Đồng hành — assistant tự xưng
}
```

**Lý do unique change**: hiện tại `@@unique([dayNumber, module, exerciseKey])` chỉ cho 1 item per slot. Sau khi thêm voice, cho phép Day 14 MORNING có 2 variant (khang_sol + sol_dong_hanh) — admin set 1 cái default qua priority.

### 3.2 ContentItemRevision (mới)

```prisma
model ContentItemRevision {
  id           String      @id @default(cuid())
  contentItemId String
  contentItem   ContentItem @relation(fields: [contentItemId], references: [id], onDelete: Cascade)

  // Snapshot tại thời điểm revision
  versionNum   Int          // 1, 2, 3... (incremental)
  title        String
  body         String       @db.Text
  voice        ContentVoice
  targetRules  Json?
  priority     Int

  // Metadata
  editedBy     String       // userId Khang
  editedAt     DateTime     @default(now())
  changeNote   String?      // Khang ghi chú "đổi voice cho mềm hơn"

  @@index([contentItemId, versionNum])
}
```

### 3.3 User schema extension (Phase 2 — chưa migrate ngay)

User đã có: `age`, `yearsSmoked`, `ftndScore`, `quitDate`, `quitReasons`, `topTriggers`, `pronouns`.

CHƯA có (Phase 2 add):

```prisma
model User {
  // ... existing fields

  // ── Targeting attributes (Phase 2) ──────────────────────────────────
  gender        Gender?           // collected qua onboarding wizard
  region        Region?           // user tự chọn Bắc/Trung/Nam, ảnh hưởng dialect
  interests     String[] @default([])    // ['fitness','family','career','spirituality']
  cigaretteType String?           // 'cigarette' | 'thuoc_lao' | 'vape' | 'cigar'
}

enum Gender {
  MALE
  FEMALE
  OTHER
}

enum Region {
  NORTH        // Bắc — phrase "anh ơi", "đúng không"
  CENTRAL      // Trung — phrase "anh hè", "phải hông"
  SOUTH        // Nam — phrase "anh ơi", "ha", "vậy nha"
}
```

**Onboarding flow Phase 2**:
- Bước 1 (đã có): pronouns, name, quitDate
- Bước 2 (mới): gender, age, yearsSmoked, cigaretteType
- Bước 3 (mới): region, interests (multi-select)
- Bước 4 (đã có): quitReasons, topTriggers

User có quyền skip bước 2-3 — content fallback default (không targeting rules) sẽ phục vụ.

---

## 4. Targeting algorithm

### 4.1 Match logic

```typescript
function matchTargetRules(rules: TargetRules | null, user: User): boolean {
  if (!rules) return true; // null = default, match all

  // AND strict: tất cả rule phải pass
  if (rules.ageMin && user.age && user.age < rules.ageMin) return false;
  if (rules.ageMax && user.age && user.age > rules.ageMax) return false;
  if (rules.yearsSmokedMin && user.yearsSmoked && user.yearsSmoked < rules.yearsSmokedMin) return false;
  if (rules.yearsSmokedMax && user.yearsSmoked && user.yearsSmoked > rules.yearsSmokedMax) return false;
  if (rules.ftndMin && user.ftndScore && user.ftndScore < rules.ftndMin) return false;
  if (rules.ftndMax && user.ftndScore && user.ftndScore > rules.ftndMax) return false;
  if (rules.gender && user.gender !== rules.gender) return false;
  if (rules.region && user.region !== rules.region) return false;
  if (rules.cigaretteType && user.cigaretteType !== rules.cigaretteType) return false;
  if (rules.interests && rules.interests.length > 0) {
    const overlap = rules.interests.some(i => user.interests.includes(i));
    if (!overlap) return false;
  }

  return true;
}
```

**Quan trọng — handling missing field**: user CHƯA điền `gender` → `user.gender = null`. Nếu `rules.gender = 'male'` → return false (không match). User skip onboarding step 2 → KHÔNG nhận content có targeting → fallback default. Đây là feature, không phải bug.

### 4.2 Selection logic — nhiều item match

Worker query content cho 1 (dayNumber, module):

```typescript
async function selectContentItem(dayNumber: number, module: ContentModule, user: User): Promise<ContentItem | null> {
  const candidates = await prisma.contentItem.findMany({
    where: { dayNumber, module, published: true },
  });

  // Filter qua targeting + voice
  const matched = candidates.filter(item => matchTargetRules(item.targetRules, user));

  if (matched.length === 0) return null;

  // Sort priority desc, lấy item đầu
  matched.sort((a, b) => b.priority - a.priority);
  return matched[0];
}
```

**Edge cases**:
- 0 item match → log warning, không bắn notification (user không bị spam tin nhắn không phù hợp)
- Nhiều item match cùng priority → lấy `updatedAt` mới nhất (deterministic)
- Item priority 1000 (CRITICAL) không qua targeting → ALWAYS match (dùng cho phenomena khẩn)

### 4.3 Priority convention

| Priority | Use case |
|----------|----------|
| 1000 | CRITICAL — luôn match, override targeting (vd phenomena alert sức khỏe) |
| 500 | HIGH — targeting strict, ưu tiên trước default |
| 100 | DEFAULT — fallback khi không có targeted version |
| 50 | LOW — backup, ít khi dùng |
| 0 | DEPRECATED — giữ trong DB cho revision, không bao giờ pick |

---

## 5. API spec

### 5.1 GET /admin/content

Query params:
- `module?` — filter theo module
- `dayNumber?` — filter theo day
- `voice?` — filter theo voice
- `search?` — full-text search title + body
- `published?` — true/false/all

Response:
```json
{
  "items": [
    {
      "id": "cm...",
      "dayNumber": 14,
      "module": "MORNING_GOAL",
      "title": "Day 14: 2 TUẦN — receptor giảm 40%.",
      "body": "...",
      "voice": "SOL_DONG_HANH",
      "priority": 100,
      "targetRules": null,
      "published": true,
      "lastEditedBy": "khang",
      "updatedAt": "...",
      "revisionCount": 3
    }
  ],
  "total": 127
}
```

### 5.2 PATCH /admin/content/:id

Body:
```json
{
  "title": "...",
  "body": "...",
  "voice": "KHANG_SOL",
  "targetRules": { "gender": "male", "ageMin": 45 },
  "priority": 100,
  "published": true,
  "changeNote": "Đổi voice cho mềm hơn"
}
```

Side effect: tự động tạo `ContentItemRevision` row trước khi update.

Response: updated item.

### 5.3 POST /admin/content

Body: same as PATCH. Tạo item mới.

### 5.4 GET /admin/content/:id/revisions

Response:
```json
{
  "revisions": [
    { "versionNum": 3, "title": "...", "body": "...", "editedAt": "...", "changeNote": "..." },
    { "versionNum": 2, "...": "..." },
    { "versionNum": 1, "...": "..." }
  ]
}
```

### 5.5 POST /admin/content/:id/restore/:versionNum

Restore từ revision cũ. Tự động tạo revision mới (current state) trước khi overwrite.

### 5.6 POST /admin/content/preview

Body:
```json
{
  "title": "...",
  "body": "...",
  "voice": "SOL_DONG_HANH",
  "mockUser": {
    "name": "Khang",
    "pronouns": "anh",
    "assistantName": "Sol Phó tướng",
    "quitReasons": ["vì cu Tí"],
    "topTriggers": ["nhậu"],
    "age": 50,
    "gender": "male",
    "region": "north"
  }
}
```

Response:
```json
{
  "renderedTitle": "Day 14: 2 TUẦN...",
  "renderedBody": "anh Khang. Hôm nay receptor... vì cu Tí — 14 ngày rồi anh vẫn giữ. Mình gửi anh voice Day 14.",
  "wouldMatchUser": true,
  "warnings": []  // vd ["body chứa từ tiếng Anh: milestone", "câu 1 dài 25 từ > 20"]
}
```

Preview engine = personalize + linter check anti-pattern (từ MESSAGING_PLAYBOOK).


---

## 6. UI wireframe — AdminContent page

Layout 3 zone, desktop only (Khang dùng laptop biên tập).

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ SOL Admin · Content                                                  Khang Sol  ▾  Đăng xuất │
├──────────────┬──────────────────────────────────┬───────────────────────────────────────┤
│ FILTER       │ LIST (127 items)                  │ EDIT / PREVIEW                         │
│              │                                   │                                        │
│ Module       │ ┌─────────────────────────────┐  │ ┌──────────────────────────────────┐  │
│ ▢ All        │ │ Day 1  [MORNING] khang_sol   │  │ │  Day 14 · MORNING_GOAL           │  │
│ ▢ MORNING    │ │ "Day 1, anh: Hôm nay không…" │  │ │  Voice: ◉ Sol Đồng hành          │  │
│ ▢ SCIENCE    │ │ priority 100 · v3            │  │ │         ○ Khang Sol              │  │
│ ▢ PHENOMENA  │ ├─────────────────────────────┤  │ │  Priority: [100__]               │  │
│ ▢ EXERCISE   │ │ Day 1  [SCIENCE] sol_dh      │  │ │  Published: ☑                    │  │
│ ▢ NIGHT      │ │ "8 giờ — CO máu giảm 50%"    │  │ │                                  │  │
│              │ │ priority 100 · v1            │  │ │  Title:                          │  │
│ Day          │ ├─ ... 125 more ...           │  │ │  ┌─────────────────────────────┐ │  │
│ [1__] - [30] │ │                              │  │ │  │ Day 14: 2 TUẦN — receptor… │ │  │
│              │ │ + Add new content            │  │ │  └─────────────────────────────┘ │  │
│ Voice        │ └─────────────────────────────┘  │ │  56 chars                        │  │
│ ◉ All        │                                   │ │                                  │  │
│ ○ Khang Sol  │                                   │ │  Body:                           │  │
│ ○ Sol DH     │                                   │ │  ┌─────────────────────────────┐ │  │
│              │                                   │ │  │ {greet}. Hôm nay receptor… │ │  │
│ Targeting    │                                   │ │  │ {topReason} — 14 ngày rồi… │ │  │
│ ☐ Có rules   │                                   │ │  │                            │ │  │
│ ☐ Default    │                                   │ │  └─────────────────────────────┘ │  │
│              │                                   │ │  186 chars · 32 từ               │  │
│ Search       │                                   │ │                                  │  │
│ [_________]  │                                   │ │  Targeting (collapse):           │  │
│              │                                   │ │  ▸ ageMin     [45__] ageMax [60] │  │
│              │                                   │ │  ▸ yearsSmokedMin [10] max [__]  │  │
│              │                                   │ │  ▸ ftndMin    [0_] max [10]      │  │
│              │                                   │ │  ▸ gender     ◉Any ○M ○F         │  │
│              │                                   │ │  ▸ region     ◉Any ○Bắc ○TR ○Nam │  │
│              │                                   │ │  ▸ interests  ☐fitness ☐family   │  │
│              │                                   │ │  ▸ cigaretteType ◉Any ○cig ○lào  │  │
│              │                                   │ │                                  │  │
│              │                                   │ │  Change note:                    │  │
│              │                                   │ │  [Đổi voice mềm hơn ___________] │  │
│              │                                   │ │                                  │  │
│              │                                   │ │  [Preview]  [Save]  [Cancel]     │  │
│              │                                   │ │                                  │  │
│              │                                   │ │  ─── PREVIEW (mock user) ────    │  │
│              │                                   │ │  Mock user: Khang, anh, age 50,  │  │
│              │                                   │ │  reasons: vì cu Tí               │  │
│              │                                   │ │  [Change mock]                   │  │
│              │                                   │ │                                  │  │
│              │                                   │ │  📱 Notification preview:         │  │
│              │                                   │ │  ┌──────────────────────────┐    │  │
│              │                                   │ │  │ Day 14: 2 TUẦN…           │   │  │
│              │                                   │ │  │ anh Khang. Hôm nay…       │   │  │
│              │                                   │ │  │ vì cu Tí — 14 ngày rồi…   │   │  │
│              │                                   │ │  └──────────────────────────┘    │  │
│              │                                   │ │  ✓ Match user                    │  │
│              │                                   │ │  ⚠ "milestone" — từ TA xen kẽ    │  │
│              │                                   │ │                                  │  │
│              │                                   │ │  ─── REVISION HISTORY ────       │  │
│              │                                   │ │  v3 · 2026-05-04 14:23 · "..." │  │
│              │                                   │ │       Khang · note: Đổi voice    │  │
│              │                                   │ │       [View] [Restore]           │  │
│              │                                   │ │  v2 · 2026-05-03 09:15           │  │
│              │                                   │ │  v1 · 2026-05-02 16:00 (initial) │  │
│              │                                   │ └──────────────────────────────────┘  │
└──────────────┴──────────────────────────────────┴───────────────────────────────────────┘
```

### 6.1 Interactions

- **Click item trong LIST** → load vào EDIT panel (right)
- **Filter** → live filter LIST
- **Search** → debounced 300ms, search title + body
- **Preview button** → re-render preview với current edits + mock user
- **Save button** → POST PATCH → snapshot revision → update DB → toast "Saved v4"
- **Restore button trên revision** → confirm modal → POST restore → reload edit panel
- **Voice radio change** → preview tự refresh (không cần click Preview)
- **Targeting expand** → mỗi rule có collapse/expand riêng (default collapsed nếu null)

### 6.2 Validation rules (frontend + backend)

- Title: 1-200 chars
- Body: 1-2000 chars
- Câu trong body > 20 từ → warning (không block)
- Body chứa từ tiếng Anh không trong whitelist (Plan B, OK) → warning
- Targeting `ageMin > ageMax` → error block
- `ftnd` ngoài 0-10 → error block

### 6.3 Linter rules (preview warnings)

Em build linter library `validateContent.ts`:

```typescript
const VN_45_BLACKLIST = ['milestone', 'journey', 'comeback', 'commit', 'review'];
const VN_45_WHITELIST = ['Plan B', 'OK', 'Day', 'CO', 'NHS', 'CDC'];

function lintContent(text: string): LintWarning[] {
  const warnings: LintWarning[] = [];

  // Câu dài > 20 từ
  text.split(/[.!?]/).forEach((sentence, i) => {
    const words = sentence.trim().split(/\s+/).filter(Boolean);
    if (words.length > 20) {
      warnings.push({ severity: 'medium', msg: `Câu ${i+1} dài ${words.length} từ (>20)` });
    }
  });

  // Từ tiếng Anh
  const englishWords = text.match(/\b[a-zA-Z]{4,}\b/g) || [];
  for (const word of englishWords) {
    if (VN_45_BLACKLIST.includes(word.toLowerCase())) {
      warnings.push({ severity: 'high', msg: `"${word}" — từ TA xen kẽ` });
    }
  }

  // Quá nhiều exclamation
  const exCount = (text.match(/!/g) || []).length;
  if (exCount > 1) {
    warnings.push({ severity: 'medium', msg: `${exCount} dấu "!" (>1)` });
  }

  // Quá nhiều emoji
  const emojiCount = (text.match(/\p{Emoji}/gu) || []).length;
  if (emojiCount > 1) {
    warnings.push({ severity: 'low', msg: `${emojiCount} emoji (>1)` });
  }

  return warnings;
}
```

---

## 7. File mới em sẽ tạo (Phase 1)

### Backend

```
backend/src/admin/content/
├── routes.ts          # 6 endpoint (GET/POST/PATCH/revisions/restore/preview)
├── service.ts         # Business logic + revision tracking
└── linter.ts          # Lint engine (anti-pattern check)
```

### Frontend (dashboard)

```
dashboard/src/pages/admin/AdminContent.tsx              # Main page (3-zone layout)
dashboard/src/components/admin/ContentList.tsx          # LIST panel với filter
dashboard/src/components/admin/ContentEditor.tsx        # EDIT panel form
dashboard/src/components/admin/ContentPreview.tsx       # Preview panel + lint warnings
dashboard/src/components/admin/RevisionHistory.tsx      # Revision log
dashboard/src/components/admin/MockUserPicker.tsx       # Đổi mock user
```

### Database migration

```
backend/prisma/migrations/<timestamp>_admin_content_phase1/
└── migration.sql
```

Fields add:
- `ContentItem.voice`, `priority`, `lastEditedBy`, `targetRules` (null Phase 1)
- New table `ContentItemRevision`
- Enum `ContentVoice`
- `@@unique` đổi từ `[dayNumber, module, exerciseKey]` → `[dayNumber, module, exerciseKey, voice]`

---

## 8. Phase roadmap (3 sprint)

### Phase 1 — MVP edit (4-5h em build)

**Scope**:
- Schema migration: voice + priority + lastEditedBy + ContentItemRevision
- Backend 6 endpoint
- Frontend AdminContent page (3 zone)
- Linter library
- Mock user preview
- Revision history + restore
- E2E test

**Out of scope** (Phase 2+):
- Targeting rules UI active (chỉ schema, UI hiện disabled section)
- A/B test variant
- Migrate hardcode worker.ts → DB

**Success criteria**:
- Khang edit Day 14 MORNING_GOAL body → save → 5s sau worker query lấy text mới (không restart)
- Revision v1, v2, v3 hiện đúng, restore work
- Linter cảnh báo "milestone" + câu dài > 20 từ
- Preview render đúng với mock user

### Phase 2 — Targeting active (3-4h em build, sau 50+ user)

**Scope**:
- User schema extend: gender, region, interests, cigaretteType
- Onboarding wizard step 2-3 thu thập
- Targeting rules UI active trong AdminContent
- Worker.ts dùng `selectContentItem` algorithm
- Multi-variant per slot: Day 14 MORNING có 3 item (default + male+north + female), worker pick đúng

**Success criteria**:
- User male+north Day 14 → nhận tin nhắn variant cho male+north
- User female → nhận default
- Khi xoá variant duy nhất → fallback về default

### Phase 3 — Migrate hardcode + A/B test (4-5h, sau 200+ user)

**Scope**:
- Move STREAK_MILESTONES → ContentItem với module mới `STREAK_MILESTONE`
- Move FOUNDER_WEEKLY_NOTES → module `FOUNDER_WEEKLY`
- Move EVENING_CHECKIN_PROMPTS → module `EVENING_CHECKIN`
- A/B test: variantGroup + weight, worker pick weighted random
- Analytics: track open/click rate per item, show stats trong AdminContent

### Phase 4 — Voice variant + dialect (1-2h, sau 500+ user)

**Scope**:
- User chọn voice trong settings (override admin default)
- Region dialect: tự động chuyển "đúng không" → "phải hông" cho user region=south
- Multilingual support (English fallback cho user English-pref)

---

## 9. Câu hỏi mở (cho phiên sau)

1. **Permission**: hiện chỉ Khang là admin. Nếu sau có cộng tác viên biên tập thì phân quyền sao? → Phase 4+
2. **Auto-save draft**: nếu Khang đang edit, tab close, nội dung lưu tạm? → Phase 2 nếu cần
3. **Bulk edit**: select nhiều item → bulk update voice/priority? → Phase 3
4. **Import/export CSV**: cho Khang chỉnh sửa offline qua Excel? → Phase 4 nếu cần
5. **Localization**: tin nhắn cho user xài tiếng Anh (con cái Khang ở Mỹ)? → Phase 4

---

## 10. Risk & mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Khang edit sai → user nhận tin lỗi | High | Med | Preview + linter trước save. Revision history khôi phục 5 giây. |
| DB migration mất data | Med | High | Backup ContentItem trước migrate. `prisma migrate` dev mode test trước. |
| Worker performance giảm vì query nhiều item per user | Low | Med | Phase 2 thêm cache 5 phút trong Redis hoặc memory (chỉ 127 items, fit cache dễ). |
| Khang dùng targeting sai → user fallback default mất content cá nhân | Med | Low | Phase 2 add testing tool: "test rule với user cụ thể" trong UI. |
| Schema change Phase 2 break Phase 1 data | Low | High | Phase 1 add field `targetRules` nullable từ đầu. Phase 2 chỉ thêm UI active, không change schema. |

---

## 11. Approval checklist

Anh review + check từng dòng dưới đây nếu OK:

- [ ] Schema design (Section 3) — voice + priority + targetRules + revision
- [ ] 4 chốt (Section 2) — đúng ý anh muốn
- [ ] Targeting AND strict (Section 4) — không cần weighted
- [ ] UI wireframe (Section 6) — 3 zone layout chấp nhận
- [ ] Phase roadmap (Section 8) — Phase 1 scope OK
- [ ] File structure (Section 7) — chia routes + service + linter OK
- [ ] Risks (Section 10) — có lỗ hổng gì em miss không

Anh feedback / approve em bắt đầu execute Phase 1.

---

**Lần update cuối**: 2026-05-04
**Status**: DRAFT — chờ Khang review
**Next action sau approve**: Em execute Phase 1 — schema migration → backend → frontend → test → handoff.

---

## 12. Phase 5 — Smart Notification Schedule (chốt 2026-05-04)

> **Triết lý**: "Bảng điều khiển càng thông minh càng ghi điểm" (Khang). Hiện tại worker.ts cron fix 6 giờ/ngày → fail mode lớn vì user dậy 9h, đi làm ca đêm, đi xe lúc 14h. Phase 5 thay fix-cron bằng **smart scheduler** — match content với moment thật của user.

### 12.1 Chốt từ Khang (4 câu hỏi → 5 quyết định)

| # | Câu hỏi | Chốt |
|---|---------|------|
| 1 | dailyMax range | **1-5** (0 = phải opt-out push hoàn toàn qua disable). Default: 3. |
| 2 | 6 moments default | **Đủ**: coffeeMorning, teaAfternoon, postLunch, postDinner, preSocialDrink, preBedtime |
| 3 | Khai báo moment bắt buộc? | **Skip được** — không khai → fallback GENERIC content |
| 4 | Weekend reduce 50% | **Default ON** — cuối tuần giảm tần suất tự động |
| 5 | Smart anti-spam (5 tin không mở liên tiếp → "nghỉ vài hôm?") | **Có** — Phase 6 |

### 12.2 Schema mới

```prisma
model User {
  // ... existing
  notificationPrefs Json @default("{}")
  // shape:
  //   {
  //     dailyMax: 3,                  // 1-5
  //     activeStart: "09:00",
  //     activeEnd: "21:00",
  //     quietStart: "22:00",
  //     quietEnd: "06:00",
  //     weekendReduce: true,          // T7-CN giảm 50%
  //     moments: {                     // skip được — null nghĩa user chưa khai
  //       coffeeMorning: "07:30",
  //       teaAfternoon: "14:00",
  //       postLunch: "12:30",
  //       postDinner: "19:00",
  //       preSocialDrink: "18:30",
  //       preBedtime: "22:30"
  //     },
  //     consecutiveUnopened: 0        // counter cho anti-spam Phase 6
  //   }
}

model ContentItem {
  // ... existing
  moment Moment?  // null = GENERIC, không match moment cụ thể
}

enum Moment {
  COFFEE_MORNING       // user uống cà phê
  TEA_AFTERNOON        // trà đá / nghỉ trưa
  POST_LUNCH           // sau bữa cơm trưa
  POST_DINNER          // sau bữa cơm tối
  PRE_SOCIAL_DRINK     // chuẩn bị nhậu / tiệc
  PRE_BEDTIME          // trước khi ngủ
  GENERIC              // không gắn moment, fallback default
}
```

### 12.3 Smart scheduler logic (replace fix-cron)

```typescript
// Cron mỗi 15 phút thay vì cron giờ cố định
cron.schedule('*/15 * * * *', async () => {
  const now = new Date();
  const users = await prisma.user.findMany({ where: { quitDate: { not: null } } });

  for (const user of users) {
    const prefs = user.notificationPrefs as NotificationPrefs;
    const dailyMax = prefs.dailyMax ?? 3;

    // Skip nếu trong quiet hours
    if (isInQuietHours(now, prefs)) continue;

    // Skip nếu ngoài active window
    if (!isInActiveWindow(now, prefs)) continue;

    // Đếm tin gửi hôm nay
    const sentToday = await countNotificationsSentToday(user.id);

    // Apply weekend reduce
    const effectiveMax = isWeekend(now) && prefs.weekendReduce
      ? Math.ceil(dailyMax / 2)
      : dailyMax;

    if (sentToday >= effectiveMax) continue;

    // Tìm content match moment
    const currentMoment = detectCurrentMoment(now, prefs.moments);
    const dayNumber = computeDayNumber(user.quitDate);

    const candidates = await prisma.contentItem.findMany({
      where: {
        dayNumber,
        published: true,
        OR: [
          { moment: currentMoment },          // match moment user khai
          { moment: null },                    // hoặc GENERIC fallback
        ],
      },
      orderBy: { priority: 'desc' },
    });

    // Filter qua targeting + chưa gửi hôm nay
    const filtered = await filterAlreadySent(candidates, user.id, today);
    const passed = filtered.filter(c => matchTargetRules(c.targetRules, user));

    if (passed.length === 0) continue;

    // Pick item priority cao nhất
    const item = passed[0];
    await enqueueNotification(item, user);
  }
});

function detectCurrentMoment(now: Date, moments: any): Moment {
  if (!moments) return 'GENERIC';
  const hhmm = formatTime(now);  // "07:32"
  for (const [key, value] of Object.entries(moments)) {
    if (Math.abs(diffMinutes(hhmm, value)) <= 15) {
      return MOMENT_MAP[key];   // "coffeeMorning" → "COFFEE_MORNING"
    }
  }
  return 'GENERIC';
}
```

### 12.4 Admin dashboard `/admin/notifications`

3 zone:

**Top — Stats hôm nay**:
- Tổng tin gửi: 342 (98 user × 3.5 trung bình)
- Open rate: 84% (287/342)
- Click rate: 45% (156/342)
- Heatmap 24h phân phối tin theo giờ

**Middle — Phân tích theo moment**:
- COFFEE_MORNING: 42 user opt-in, 38 mở (90%)
- PRE_BEDTIME: 38 user opt-in, 29 mở (76%)
- PRE_SOCIAL_DRINK: 27 user opt-in, 22 mở (81%)
- ...
- GENERIC fallback: 56 tin (32% — quá nhiều, content cần tag moment hơn)

**Bottom — Per-user table**:
| User | Day | Pref | Sent today | Last | Open rate 7d |
|------|-----|------|------------|------|--------------|
| Khang Test | 14 | 3 tin | 3/3 | 21:30 | 95% |
| Bác Tú | 7 | 2 tin | 1/2 | 08:15 | 60% |

Click 1 user → drill-down xem từng tin 7 ngày + open/click status.

**Cảnh báo**:
- 8 user opt-out push 24h qua → click xem lý do
- 12 user dailyMax=1 (siêu ít) → có thể content nhồi quá → review

### 12.5 User Settings UI mới

Trang `/settings` user widget thêm tab "Tin nhắn":

```
┌─ Tin nhắn từ Sol ──────────────────────────────────────────┐
│                                                              │
│  CƯỜNG ĐỘ                                                    │
│  Mỗi ngày anh muốn nhận bao nhiêu tin?                      │
│  [1 ●─○─○─○─○ 5]   (đang chọn: 3)                          │
│                                                              │
│  KHUNG GIỜ                                                   │
│  Bắt đầu nhận: [09:00▾]                                     │
│  Kết thúc:    [21:00▾]                                      │
│  Yên tĩnh:    [22:00▾] đến [06:00▾]                        │
│  ☑ Cuối tuần giảm 50%                                       │
│                                                              │
│  THÓI QUEN HÀNG NGÀY (Sol nhắn đúng lúc anh thường thèm)    │
│  ☑ Cà phê sáng        [07:30▾]                             │
│  ☑ Trà đá trưa        [14:00▾]                             │
│  ☐ Sau bữa cơm trưa   [12:30▾]                             │
│  ☑ Sau bữa cơm tối    [19:00▾]                             │
│  ☐ Trước khi đi nhậu  [18:30▾]                             │
│  ☑ Trước khi ngủ      [22:30▾]                             │
│                                                              │
│  → Càng khai cụ thể, tin nhắn càng đúng thời điểm.          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 12.6 Lộ trình build Phase 5 (~12h em chia 3 phiên)

| Phase | Scope | Time | Dependency |
|-------|-------|------|-----------|
| **5a** — User prefs schema + Settings UI | Schema migration, NotificationPrefs panel trong Settings widget, onboarding step 4 (skip-able) | 3-4h | Phase 1 work |
| **5b** — Smart scheduler worker | Replace fix-cron `*/15 * * * *`, detectCurrentMoment, anti-spam counter | 4-5h | 5a done |
| **5c** — Admin /admin/notifications dashboard | Stats top, moment analysis, per-user table với drill-down | 3-4h | 5b deployed 7 ngày để có data |
| **5d** — Tag 127 content theo moment | Khang quyết item nào COFFEE_MORNING vs GENERIC, em apply qua AdminContent UI | 1-2h Khang time | 5b done |

### 12.7 Smart anti-spam (Phase 6 — sau Phase 5)

Counter `consecutiveUnopened` trong notificationPrefs:
- Mỗi tin user không mở trong 24h → counter +1
- Mở tin → reset 0
- Counter = 5 → gửi tin đặc biệt: "Anh có muốn nghỉ vài hôm không? Mình tạm dừng push 3 ngày, trừ khi anh mở widget."
- Counter = 8 → auto-set `dailyMax = 1` cho 7 ngày, sau đó reset
- Counter = 15 → ask UX "có muốn opt-out push hoàn toàn?"

Mục đích: tự bảo vệ user khỏi notification fatigue → giữ trust dài hạn.

