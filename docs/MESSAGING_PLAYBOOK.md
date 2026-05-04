# SOL — Messaging Playbook

> **Mục đích**: Guide chuẩn để Khang Sol biên tập tin nhắn push notification + chip canned reply mà không cần em (Claude) review từng dòng.
>
> **Đối tượng**: 1 người duy nhất — Khang. Doc này KHÔNG phải brand book public.
>
> **Khi nào đọc**: trước khi edit `contentItems.ts`, `cannedReplies.ts`, hoặc thêm cron handler mới trong `worker.ts`.

---

## Phần 1 — Voice (giọng nói)

Mỗi tin nhắn phải nghe ra một trong 2 giọng dưới đây. Lẫn lộn = mất trust.

### Giọng A — Khang Sol (người anh đi trước)

Dùng cho:
- Founder weekly note (FOUNDER_WEEKLY)
- Onboarding 3-5 ngày đầu (Day 1-5 MORNING_GOAL)
- Reflection cuối hành trình (Day 28-30 NIGHT_STORY)

Đặc điểm:
- Ký tên cuối: `— Khang Sol`
- Dùng "mình" thay vì "Sol"
- Kể chuyện cá nhân ("25 năm hút", "lần thứ 8 mới bỏ được")
- Câu dài hơn, có cảm xúc
- Không dạy đời, chỉ chia sẻ

Ví dụ:
> "Tuần này {pronoun} thế nào? Mình tự nhủ một câu mỗi sáng: 'Hôm nay không phải hôm qua — mình có thể chọn lại.' {pronoun} cũng vậy nhé. — Khang Sol"

### Giọng B — Sol Đồng hành (assistant tự xưng)

Dùng cho:
- 90% daily content (Day 6-27)
- STREAK_MILESTONE
- SCIENCE_TIP, PHENOMENA_ALERT
- Crisis prep, evening check-in

Đặc điểm:
- KHÔNG ký tên (nó là giọng app, không phải người)
- Tự xưng `{selfRef}` ("Đồng hành" / "Phó tướng" — phụ thuộc user)
- Câu ngắn 8-15 từ
- Tone tích cực nhưng không hô khẩu hiệu
- Cite số liệu cụ thể ("CO giảm 50%" thay vì "đáng kể")

Ví dụ:
> "8 giờ — CO máu giảm 50% (CDC). Hồng cầu chở oxy hiệu quả hơn rồi {pronoun}."

### KHÔNG bao giờ trộn

- Khang Sol không dùng "Đồng hành" để chỉ chính mình
- Sol Đồng hành không kể chuyện "25 năm hút" (đó là chuyện Khang)
- Mỗi tin nhắn 1 giọng. Không "Khang Sol thân chào! Sol Đồng hành xin báo tin..."

---

## Phần 2 — Variable cheat sheet

Tất cả placeholder dưới đây đều được `personalize.ts` thay tự động. Anh CỨ DÙNG TỰ NHIÊN trong text — không cần check user đã điền chưa, có fallback hết.

### Identity

| Placeholder | Thay bằng | Fallback nếu chưa có | Khi dùng |
|-------------|-----------|----------------------|----------|
| `{pronoun}` | "anh" / "chị" / "em" / "Đại ca" | "bạn" | Mọi tin nhắn — câu xưng hô user |
| `{pronouns}` | (giống `{pronoun}`) | "bạn" | Alias để viết tự nhiên không cần nhớ số ít/nhiều |
| `{name}` | "Khang" / "Tâm" | "" (rỗng) | Khi muốn gọi tên cụ thể (vd thư cá nhân) |
| `{greet}` | "anh Khang" / "chị Tâm" / chỉ "anh" | "bạn" | Lời chào đầu — dùng đầu tin nhắn quan trọng |

### Assistant

| Placeholder | Thay bằng | Khi dùng |
|-------------|-----------|----------|
| `{assistantName}` | "Sol Đồng hành" / "Sol Phó tướng" / "Sol Vợ yêu" | Khi assistant cần "self-introduce" full |
| `{assistant}` | (giống `{assistantName}`) | Alias |
| `{selfRef}` | "Đồng hành" / "Phó tướng" / "Vợ yêu" (đã loại tiền tố "Sol ") | Khi assistant tự xưng tự nhiên ("{selfRef} ở đây") |

### Story (LEVEL 3 — mới)

| Placeholder | Thay bằng | Fallback | Sức mạnh |
|-------------|-----------|----------|----------|
| `{topReason}` | quitReasons[0] — "vì cu Tí" / "ho buổi sáng" | "lý do của anh" | Cao nhất — replay user's own words |
| `{reasonsList}` | "vì cu Tí, ho buổi sáng, vợ nhăn" (tất cả lý do, comma-sep) | "" (skip nguyên đoạn) | Reflection mạnh, dùng dịp lễ (Day 30) |
| `{topTrigger}` | topTriggers[0] — "nhậu" / "cà phê sáng" | "tình huống khó của anh" | Crisis prep, prepare ahead |

### Quy tắc dùng

1. **Mỗi tin nhắn dùng tối đa 3 placeholder**. Nhiều hơn thành "Mad Lib" lộ máy.

2. **{topReason} dùng strategic, không spam**. Cảm xúc đỉnh (Day 1, 7, 14, 30) thì dùng. Day thường thì không. Replay nhiều lần = quote-mining = tạo cảm giác bị surveillance.

3. **{name} chỉ dùng khi tin nhắn cá nhân**. Daily push KHÔNG dùng tên (sound bot). Founder weekly + crisis recovery THÌ dùng.

4. **Test với user "bạn" (chưa khai pronoun)**. Nếu fallback nghe ngộ ngộ ("bạn ơi" thay "anh ơi") thì OK. Nếu nghe broken thì viết lại.

---

## Phần 3 — Slot template (6 slot daily)

### MORNING_GOAL — 07:00

Job: Mở ngày, set 1 goal cụ thể. KHÔNG nhồi science.

Template:
```
Day {N}, {pronoun}: [hành động cụ thể trong ngày].
[1 câu lý do tại sao job này quan trọng cho ngày này.]
```

Ví dụ tốt:
- Day 1: `Day 1, anh: Hôm nay không hút. 24 giờ đầu là khó nhất sinh học — qua được là phần lớn người không bao giờ hút lại.`
- Day 7: `Tuần đầu xong rồi anh. Hôm nay thưởng cho mình 1 việc nhỏ — đi bộ 15 phút, uống cà phê chậm, gì cũng được.`

Ví dụ xấu (KHÔNG):
- ❌ "Chào anh! Hôm nay là Day 1 — ngày đầu tiên trong hành trình bỏ thuốc của anh. Nicotine sẽ bắt đầu thải khỏi cơ thể anh trong 72 giờ tới. Cố lên anh nhé! Sol Đồng hành sẽ luôn ở bên..."  (lê thê, science nhồi vào morning, exclamation dồn dập)

### SCIENCE_TIP — 10:00

Job: Giải thích cơ thể đang làm gì. Cite source. Tăng compliance qua hiểu biết.

Template:
```
[Mốc thời gian/ngày] — [thay đổi sinh học cụ thể] ([source]).
[1 câu giải thích ý nghĩa cho user.]
```

Ví dụ tốt:
- `8 giờ — CO máu giảm 50% (CDC). Hồng cầu chở oxy hiệu quả hơn rồi {pronoun}.`
- `Day 14 — tuần hoàn máu cải thiện rõ (Mayo Clinic). Leo cầu thang đỡ thở dốc đúng không {pronoun}?`

Source acceptable: CDC, NHS, Mayo Clinic, WHO, Hughes 2007, Cosgrove. **KHÔNG** dùng "research shows", "scientists say" — generic, mất trust.

### PHENOMENA_ALERT — 14:00 (chỉ 7 ngày trọng yếu)

Job: Cảnh báo trước phenomena (tăng cân, mất ngủ, buồn vô cớ). Người 45+ rất sợ surprises.

Template:
```
Day {N}: [phenomena cụ thể] — [đây là bình thường vì lý do gì].
[1 hành động đơn giản nếu có.]
```

Ví dụ:
- Day 4: `Đêm nay khó ngủ — bình thường. Não đang điều chỉnh dopamine. Tránh cà phê sau 14h, đọc sách giấy 30 phút trước ngủ.`
- Day 21: `Tự nhiên buồn không lý do — bình thường. Não đang reset baseline cảm xúc. 3-5 ngày sẽ qua. Đi bộ ngoài trời 20 phút giúp.`

### EXERCISE — 16:30

Job: Đề xuất 1 bài tập 5-10 phút. Action over reflection.

Template:
```
Bài tập hôm nay: [tiêu đề ngắn].
[1-2 câu hướng dẫn cụ thể.]
[CTA mở Exercise Card]
```

KHÔNG: "Hãy thử bài tập này..." (mơ hồ). DÙNG: imperative cụ thể.

### EVENING_CHECKIN — 20:00

Job: 30 giây check-in. KHÔNG long form.

Đã code trong worker.ts (không cần Khang edit). Format:
```
Title: "Chốt ngày thôi {pronoun} ơi"
Body: "Ngày {N} — 30 giây thôi {pronoun} ơi. Mình chờ {pronoun}."
```

### NIGHT_STORY — 21:30

Job: Đóng ngày. Tự hào nhỏ. KHÔNG dạy đời.

Template:
```
Đêm Day {N} — [1 hình ảnh/ý nghĩa của ngày này].
[1 câu để user mang vào giấc ngủ.]
```

Ví dụ tốt:
- Day 3: `Đêm Day 3 — đỉnh đã qua. Cảm xúc trong ngày là dấu hiệu não đang HỌC. Đêm nay {pronoun} ngủ với một kỳ tích sinh học.`
- Day 30: `Đêm Day 30 — kỷ lục viết xong. {topReason} — lý do {pronoun} bắt đầu, hôm nay vẫn còn đó. Tự hào.`

---

## Phần 4 — 30-day emotional arc

Đừng viết tin nhắn random theo ngày. Tin nhắn của một ngày phải feel đúng giai đoạn.

| Giai đoạn | Ngày | Emotional state | Voice strategy |
|-----------|------|-----------------|----------------|
| **Khởi động** | 1-2 | Hưng phấn + sợ | Khang Sol giọng cá nhân, khẳng định |
| **Đỉnh sóng** | 3-5 | Khó chịu cao điểm — đỉnh thèm, cáu | Sol Đồng hành giọng đồng cảm + Plan B cụ thể |
| **Bức tường** | 6-10 | Mệt mỏi, "tại sao tôi làm việc này" | Cite science nhiều, replay {topReason} |
| **Bước ngoặt** | 11-14 | Bắt đầu thấy khá hơn | Celebrate nhỏ, build confidence |
| **Tự tin giả** | 15-21 | "Tôi đã bỏ được rồi" — risky relapse | Cảnh báo phenomena, không cho phép overconfident |
| **Nội hóa** | 22-28 | Thói quen mới đang form | Reflection nhẹ, identity shift ("anh không hút thuốc") |
| **Cột mốc** | 29-30 | Tự hào + mơ hồ "tiếp theo gì" | Khang Sol return, set up next chapter |

Quy tắc:
- **Đỉnh sóng (Day 3-5)** dồn nhiều tin nhắn (đủ 6 slot/ngày). Đỉnh khó nhất sinh học.
- **Tự tin giả (Day 15-21)** giảm tin nhắn xuống 4 slot/ngày. Khoảng nghỉ — không spam khi user ổn.
- **Cột mốc (Day 29-30)** trộn voice. Sáng Khang Sol, đêm Sol Đồng hành. Identity shift.

---

## Phần 5 — Anti-pattern (KHÔNG làm)

❌ **Không dùng từ "AI"**. 45+ không hiểu hoặc sợ. Dùng "ứng dụng", "Sol", "{assistantName}".

❌ **Không xen tiếng Anh**. "milestone" → "cột mốc". "journey" → "hành trình". "quit" → "bỏ thuốc".

❌ **Không dồn 3 mục đích vào 1 tin**. Sáng = motivation. Trưa = warning. Tối = celebration. Mỗi tin 1 job.

❌ **Không dùng exclamation dồn**. Tối đa 1 dấu `!` mỗi tin nhắn.

❌ **Không thay tên user vào câu generic**. "Cố lên anh Khang!" sound bot. Dùng `{pronoun}` thôi, hoặc skip.

❌ **Không quote-mine {topReason} liên tục**. Day 1, 7, 14, 30 dùng 1-2 lần. Day khác đừng. Surveillance vibe.

❌ **Không dạy đời**. "Anh phải hiểu rằng..." → cắt. Chỉ chia sẻ + cite, không lecture.

❌ **Không sử dụng Markdown trong notification body**. Push notification render plain text — `**bold**` sẽ hiển thị thô.

❌ **Không emoji dồn dập**. Tối đa 1 emoji mỗi tin nhắn, dùng cuối tiêu đề (vd "🔥 2 ngày — đỉnh sóng đã qua").

❌ **Không CTA dài**. "Bấm vào đây để đọc bài viết chi tiết về quá trình..." → "Đọc sâu →"

---

## Phần 6 — Edit + test workflow

### Edit daily content (Day 1-30)

```bash
# 1. Mở file
code D:\BOTHUOCLA\sol-widget\backend\src\seed\contentItems.ts

# 2. Sửa title/body của item cần edit. Lưu.

# 3. Re-seed (idempotent — chỉ update row đã có)
cd D:\BOTHUOCLA\sol-widget\backend
npx tsx src/seed/runContentItems.ts

# 4. Test với test user
npx tsx src/seed/testPushPipeline.ts

# 5. Đọc output — verify text đã đúng
```

### Edit trigger-based (STREAK_MILESTONE, FOUNDER_WEEKLY...)

```bash
# 1. Mở worker.ts
code D:\BOTHUOCLA\sol-widget\backend\src\scheduler\worker.ts

# 2. Tìm const STREAK_MILESTONES (hoặc FOUNDER_WEEKLY_NOTES) — sửa string trực tiếp.

# 3. TS check
npx tsc --noEmit

# 4. Restart worker
pm2 restart sol-worker  # production
# hoặc kill terminal đang chạy worker rồi: npx tsx src/scheduler/worker.ts
```

### Edit canned chip Q&A

```bash
# Option A — qua seed file
code D:\BOTHUOCLA\sol-widget\backend\src\seed\cannedReplies.ts
npx tsx src/seed/runCannedReplies.ts

# Option B — qua Prisma Studio (visual)
npx prisma studio
# → table CannedReply → edit cell → Save Changes
```

### Test flow chuẩn (mỗi lần edit content)

```bash
cd D:\BOTHUOCLA\sol-widget\backend

# 1. TS clean
npx tsc --noEmit

# 2. Re-seed
npx tsx src/seed/runContentItems.ts

# 3. Test pipeline với test user Day N
npx tsx src/seed/createTestUser.ts   # tạo/update test user
npx tsx src/seed/testPushPipeline.ts

# 4. Verify output:
#    - Title không bị truncate
#    - {pronoun}, {topReason} thay đúng
#    - Channels đúng (morning/night/science = ["IN_WIDGET","WEB_PUSH"])
```

### Đổi user về Day khác để test

```bash
# Tạo file scratch
cat > D:\BOTHUOCLA\sol-widget\backend\src\seed\setTestUserDay.ts <<'EOF'
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const day = parseInt(process.argv[2] ?? '1', 10);
const quitDate = new Date(Date.now() - (day - 1) * 86400000);
prisma.user.update({
  where: { email: 'test@sol.vn' },
  data: { quitDate },
}).then(u => {
  console.log(`Test user → Day ${day} (quitDate: ${u.quitDate?.toISOString()})`);
  return prisma.$disconnect();
});
EOF

# Chạy:
npx tsx src/seed/setTestUserDay.ts 14   # set test user về Day 14
npx tsx src/seed/testPushPipeline.ts
```

---

## Phần 7 — Quality checklist trước khi merge

Trước khi commit content edit, anh tự check:

- [ ] Voice nhất quán (Khang Sol vs Sol Đồng hành) — không trộn trong 1 tin
- [ ] Câu < 20 từ (đếm thử bằng mắt)
- [ ] Không từ tiếng Anh xen kẽ
- [ ] Tối đa 1 emoji + 1 exclamation
- [ ] {topReason} chỉ dùng Day 1/7/14/21/30 (4-5 chỗ tổng cộng)
- [ ] Nếu có CTA → tối đa 1 link, copy ngắn ("Đọc sâu" thay "Bấm vào đây để xem...")
- [ ] Test với fallback (user pronoun=`bạn`, quitReasons=`[]`) — không broken
- [ ] TS clean
- [ ] Re-seed idempotent — chạy 2 lần không tạo duplicate

---

## Phần 8 — Pattern thư viện (sao chép adapt)

### Opening hook patterns

- `Day {N}, {pronoun}: [hành động]` — terse, command-like
- `[Time mốc] — [thay đổi sinh học] ([source])` — science slot
- `Đêm Day {N} — [hình ảnh]` — night story
- `Tuần này {pronoun} thế nào?` — founder weekly opener

### Closing patterns

- `— Khang Sol` — chỉ founder weekly + onboarding
- `Mình ở đây.` / `Mình ở đây cho {pronoun}.` — đồng hành, dùng cuối tin emotional
- `[CTA action] →` — practical, dẫn user vào widget
- (no closing) — daily content ngắn, kết tự nhiên cuối câu

### Câu chốt (closure phrases) thay vì exclamation

- `Tự hào.` (sau celebrate)
- `Bình thường.` (sau giải thích phenomena)
- `Mình ở đây.` (sau emotional)
- `Tiếp tục thôi.` (sau motivation)

---

## Phần 9 — Khi nào cần Claude (em) review

Edit nhỏ (typo, đổi 1-2 câu): Anh tự làm.

Cần em review nếu:
- Thêm slot mới (vd LUNCH_REMINDER 12h)
- Thay đổi voice của 1 character (Khang Sol vs Sol Đồng hành)
- Thay structure 30-day arc
- Thêm placeholder mới (vd `{spouseName}`, `{moneyDay}`)
- Tin nhắn cho dịp lễ (Tết, 30/4) — cần culture sensitivity

→ Khi cần, anh inbox em với câu: "Review tin nhắn này: [paste]". Em check theo playbook này.

---

**Lần update cuối**: 2026-05-04
**Người maintain**: Khang Sol
**Reference**: BRAND_POSITIONING.md (cast 5 nhân vật), `backend/src/utils/personalize.ts` (variable engine)
