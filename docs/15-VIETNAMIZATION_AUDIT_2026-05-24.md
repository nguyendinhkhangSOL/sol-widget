# Vietnamization Audit — 2026-05-24

Audit + việt hoá toàn bộ user-facing strings của Sol Dashboard SPA. Target:
đàn ông Việt 45+, ít quen thuật ngữ khoa học hoặc tiếng Anh.

Sol phải feel "thuần Việt": founder-to-founder, gần gũi, không sách vở.

---

## Phạm vi audit

Đã review 20 files chính:

### Pages (10 files)
- `dashboard/src/pages/Overview.tsx`
- `dashboard/src/pages/Journey.tsx`
- `dashboard/src/pages/Workbook.tsx`
- `dashboard/src/pages/Chat.tsx`
- `dashboard/src/pages/TestFtnd.tsx`
- `dashboard/src/pages/Pricing.tsx`
- `dashboard/src/pages/Analytics.tsx`
- `dashboard/src/pages/Settings.tsx`
- `dashboard/src/pages/NgheKhang.tsx`
- `dashboard/src/pages/Login.tsx`

### Components key (5 files)
- `dashboard/src/components/JourneySimulator.tsx`
- `dashboard/src/components/DailyJourneyAlert.tsx`
- `dashboard/src/components/Layout.tsx`
- `dashboard/src/components/CohortBadge.tsx`
- `dashboard/src/components/views/phaseB/PhaseBar.tsx`
- `dashboard/src/components/views/phaseB/PhaseAction.tsx`
- `dashboard/src/components/views/phaseB/_shared.tsx`
- `dashboard/src/components/SilentCompanionshipWidgets.tsx`
- `dashboard/src/components/workbook/PrepSections.tsx`

### Libs (5 files)
- `dashboard/src/lib/vi-labels.ts` (master dictionary — đã mở rộng)
- `dashboard/src/lib/bodyRecovery.ts`
- `dashboard/src/lib/dailyJourneyAlerts.ts`
- `dashboard/src/lib/ftnd.ts`
- `dashboard/src/lib/toast.tsx`

---

## Decision log

### Giữ tên tiếng Anh (chuẩn quốc tế) — nhưng kèm chú thích Việt

| Từ giữ | Lý do | Chú thích kèm |
|---|---|---|
| **FTND** | Test chuẩn quốc tế Fagerström 1991, được WHO/CDC/Bộ Y tế VN khuyến nghị | "Mức Lệ Thuộc Nicotin (FTND)" lần đầu xuất hiện |
| **Dopamine** | Tên hoá chất quốc tế, dễ tra cứu nguồn | "Dopamine (chất hạnh phúc trong não)" lần đầu |
| **Nicotin** | Tên hoá chất phổ thông VN hoá phonetic OK | (không cần chú thích — phổ thông) |
| **CDC / NHS / AHA / WHO** | Tổ chức quốc tế, tên gốc dễ verify | Tạp chí + năm kèm Việt hoá ("Tạp chí Br J Addict") |
| **Sol** | Brand identity | (không dịch) |
| **Zalo OA** | Brand Zalo official | (không dịch) |
| **email** | Phổ thông VN, ngắn gọn | (giữ "email", tránh "thư điện tử") |

### Việt hoá hoàn toàn

| English | Vietnamese |
|---|---|
| Q-Day | **Ngày Quyết Định** (canonical — Khang chốt) |
| Cohort | **Lộ Trình** (35/52/65 ngày) hoặc **Nhóm Đồng Đội** |
| Tier | **Chặng** |
| Streak | **Chuỗi Ngày Sạch** |
| Withdrawal | **Triệu Chứng Cai** / **Cơn Cai** |
| Cravings | **Cơn Thèm** |
| Trigger | **Tình Huống Gây Thèm** / **Tình huống** |
| Onboarding | **Bắt Đầu** |
| Dashboard | **Hành Trình** |
| Profile | **Hồ Sơ Cá Nhân** |
| Settings | **Cài đặt** |
| Mastery score | **Chỉ Số Làm Chủ** |
| Magic link | **Liên kết đăng nhập một lần** |
| Sign in / Sign up | **Đăng nhập / Đăng ký** |
| Relapse | **Tái Hút** |
| Lapse | **Trượt Nhẹ** |
| Identity | **Chính Mình** / **Tự Nhận Diện** |
| Baseline | **Mức Nền** |
| Peak hour | **Giờ thèm nhất** |
| Receptor | **Thụ thể** |
| Cilia | **Lông mao phổi** |
| Half-life | (không xuất hiện UI — chỉ trong source data) |
| Carbon monoxide / CO | **Khí độc CO** |
| Plan B | **Kế Hoạch Dự Phòng** / **Kế B** |
| Check-in | **Ghi nhận** / **Ghi Nhận Hôm Nay** |
| Workbook | **Sổ Lưu Niệm** (KHÔNG "Sổ Hành Trình" — Khang chốt) |

### UI actions phổ biến

| English | Vietnamese |
|---|---|
| Loading… | Đang tải… |
| Save / Save changes | Lưu / Lưu thay đổi |
| Cancel | Bỏ qua |
| Submit | Gửi |
| Continue | Tiếp tục |
| Click / Tap to | Bấm để |
| Step 1/5 | Bước 1/5 |
| OK | Đồng ý |
| Error | Lỗi / Có lỗi xảy ra |
| Try again | Thử lại |
| Login / Logout | Đăng nhập / Đăng xuất |
| FREE | Miễn phí |
| Reset | Về mặc định / Đặt lại |
| Copy SĐT | Sao chép SĐT |
| Admin console | Quản trị |
| Voice (clip) | Bản ghi âm |
| Auto-charge | Tự trừ tiền |
| API error | Lỗi kết nối |
| Tracking | Theo dõi |
| Cardio | Tim mạch |
| Non-smoker | Người không hút |
| Identity | Tự nhận diện |
| Mentor | Người dẫn dắt / Khang |
| Wave (craving) | Đợt (cơn thèm) |
| Pattern | Quy luật |

### Phase B labels canonical (Khang chốt 2026-05-18)

| Legacy | V2 Canonical |
|---|---|
| Nhận Thức | **Nhận Diện** |
| Hành Động | **Kiểm Soát** |
| Giải Phóng | **Làm Chủ** |
| Tái Thiết | **Tái Thiết** (giữ) |

---

## Top 5 thuật ngữ cần Khang quyết tiếp

1. **Q-Day**: hiện tại đang dùng "Ngày Quyết Định" (canonical 2026-05-18).
   Có alias "Ngày Cai" trong dictionary. Có cần xuất hiện song song không?
   Ví dụ: "Ngày Quyết Định (Ngày Cai)" lần đầu để user 45+ nhận diện nhanh?

2. **Voice của Khang** → đã đổi thành "Bản ghi âm của Khang" trong sidebar
   nav. Title page `/voice` vẫn là Voice. Có muốn rename toàn bộ thành
   "Bản ghi âm" hay giữ "Voice" là brand wording riêng?

3. **Sol AI / Sol Chip / Sol Đồng hành** trong Chat bubble label:
   - Sol AI → đã đổi thành **"Sol"** (đơn giản hoá)
   - Sol Chip → **"Sol Gợi Ý"**
   - User hỏi Khang giữ luôn hay tìm wording đẹp hơn

4. **Dopamine** → đã kèm "(chất hạnh phúc trong não)" lần đầu.
   Có muốn dùng "hormone hạnh phúc" (phổ biến trên báo VN) thay không?
   Y khoa chính xác: dopamine là neurotransmitter, không phải hormone.

5. **FTND** trong UI:
   - Header "Test FTND — 6 câu" → giữ
   - Subtitle nhãn nav → đã có "Mức Lệ Thuộc"
   - Có cần thêm prefix Việt cho mọi mention không? Ví dụ "Bài Mức Lệ Thuộc"

---

## Files đã touch (master list)

| File | Loại thay đổi |
|---|---|
| `dashboard/src/lib/vi-labels.ts` | Mở rộng dictionary từ ~80 → ~150 labels |
| `dashboard/src/pages/Overview.tsx` | Sửa error messages, copy gắt hơn |
| `dashboard/src/pages/Journey.tsx` | Fix bug `currentStage` → `currentStageForBar`, "Click" → "Bấm", "Bonus" → "Tặng" |
| `dashboard/src/pages/Workbook.tsx` | TABS rename: Nhận Thức → Nhận Diện, Hành Động → Kiểm Soát, Giải Phóng → Làm Chủ. Q-Day → Ngày Quyết Định |
| `dashboard/src/pages/Chat.tsx` | "Sol AI" → "Sol", "Sol Chip" → "Sol Gợi Ý". Quota error message |
| `dashboard/src/pages/TestFtnd.tsx` | "Nicotine" → "Nicotin", "Step" → "Bước", "FREE" → "miễn phí", "Phase 1-4" → "Chặng 1-4", VN-ify scientific source |
| `dashboard/src/pages/Pricing.tsx` | "auto-charge" → "tự trừ tiền", VN-ify "máy chủ & DB" |
| `dashboard/src/pages/Analytics.tsx` | TABS rename, "Baseline" → "Mức nền", "Peak hour" → "Giờ thèm nhất", "Trigger" → "Tình huống gây thèm", "Day 1" → "Ngày 1" |
| `dashboard/src/pages/Settings.tsx` | Q-Day → Ngày Quyết Định, "Withdrawal/Slump/Habit Reset" → "Triệu Chứng Cai/Giảm Sút/Tái Lập Thói Quen", "Copy SĐT" → "Sao chép SĐT" |
| `dashboard/src/pages/Login.tsx` | Sửa error fallback "Có lỗi" → "Có lỗi xảy ra" |
| `dashboard/src/pages/NgheKhang.tsx` | "voice" → "bản ghi âm" |
| `dashboard/src/components/Layout.tsx` | "Admin console" → "Quản trị", "Voice của Khang" → "Bản ghi âm của Khang" |
| `dashboard/src/components/JourneySimulator.tsx` | "Curves" → "Theo nghiên cứu", "Cơ thể đang sửa" → "Cơ thể đang hồi phục", "Baseline" → "Mức nền" |
| `dashboard/src/components/CohortBadge.tsx` | "< 10" → "Dưới 10", "> 1 bao" → "Trên 1 bao" |
| `dashboard/src/components/views/phaseB/PhaseAction.tsx` | "vs Baseline" → "so với mức nền" |
| `dashboard/src/components/views/phaseB/_shared.tsx` | "STRESS: Stress" → "STRESS: Căng thẳng", "Peak" → "Giờ thèm nhất", "Trigger chính" → "Tình huống chính", "Ngày bỏ" → "Ngày Quyết Định" |
| `dashboard/src/components/SilentCompanionshipWidgets.tsx` | "5 trigger" → "5 tình huống", "Baseline" → "Mức nền" |
| `dashboard/src/components/workbook/PrepSections.tsx` | "Tái Phát" → "Tái Hút", "TRIGGER" → "TÌNH HUỐNG", "Sol Mentor" → "Sol" |
| `dashboard/src/lib/bodyRecovery.ts` | "Nicotine" → "Nicotin", "CO" → "Khí độc CO", "Cilia" → "Lông mao phổi", "Receptor nicotinic" → "Thụ thể Nicotin", "Dopamine" + "(chất hạnh phúc)" lần đầu, VN-ify tạp chí names |
| `dashboard/src/lib/dailyJourneyAlerts.ts` | Toàn bộ 27 alerts: "Nicotine" → "Nicotin", "Day X" → "Ngày X", "Cravings" → "Cơn thèm", "Relapse" → "Tái hút", "Identity" → "Tự nhận diện", "Default behavior" → "Trạng thái mặc định", "Non-smoker" → "Người không hút", "Cohort" → "Lộ trình", "Mentor" → "Người dẫn dắt", VN-ify nguồn |

---

## Suggestions cho future translators

### Quy tắc vàng

1. **KHÔNG dịch máy** — đọc lại to thành tiếng. Câu nào nghe "không Việt"
   (vd "Click vào nút") thì rewrite (vd "Bấm vào nút").

2. **Gọi user "anh" / "bạn"** theo `user.pronouns`. KHÔNG dùng "Quý khách"
   (quá formal) hay "bạn ơi" (quá quen với app Gen Z).

3. **Câu ngắn, dễ hiểu**. User 45+ đọc trên màn hình điện thoại nhỏ. Tránh
   câu ghép phức tạp, tránh từ Hán Việt nặng (vd "trải nghiệm" → "thử dùng",
   "tối ưu hoá" → "làm gọn hơn").

4. **Tone founder-to-founder**: tưởng tượng đang nói chuyện với một anh
   nông dân 50 tuổi ở quê. Ấm áp, thẳng thắn, không sách vở.

5. **Đọc lại context** trước khi đổi. Có những từ tiếng Anh là **brand
   identity** (Sol, Khang Sol, Zalo OA) — KHÔNG dịch.

### Khi nào giữ tiếng Anh

- Tên thương hiệu (Sol, Zalo, Gemini, Marlboro, Thăng Long)
- Tên tổ chức y tế quốc tế (CDC, NHS, WHO, AHA)
- Tên thuốc cai (Champix, Bupropion — VN bác sĩ dùng nguyên gốc)
- Định dạng kỹ thuật (URL, JSON, API… nhưng không nên xuất hiện UI)
- "email" (đã Việt hoá phonetic trong tiếng nói thường ngày)

### Khi nào KHÔNG được giữ tiếng Anh

- Từ điều khiển UI (Click, Submit, Loading, Save, Cancel…)
- Khái niệm tâm lý (Withdrawal, Cravings, Identity…)
- Thống kê (Baseline, Peak, Streak, Tracking…)
- Hành động (Reset, Auto-charge, Sticky bar…)

### Reuse dictionary

Khi thêm label mới, **cập nhật `vi-labels.ts`** trước khi dùng inline.
Mục đích: 1 từ tiếng Anh chỉ map sang 1 cụm tiếng Việt thống nhất across
toàn app. Tránh tình trạng cùng một feature mà 2 page gọi 2 tên khác nhau.

### Pre-commit checklist

Trước khi commit, search file tìm các pattern:
- `\b(Loading|Click|Tap|Submit|Save|Cancel|OK|Step|FREE|Baseline)\b`
- Nếu xuất hiện trong JSX text (không phải comment / variable name), cần xử lý.

```bash
# PowerShell quick scan
rg -n "(Click|Loading|Submit|FREE|Peak|Baseline|Tracking|Streak|Cohort|Trigger|Cravings|Withdrawal|Step \d)" dashboard/src --type tsx
```

---

## Stats

- **Số file đã review:** 20 files chính (10 pages + 9 components + 5 libs)
- **Số English/thuật ngữ phát hiện cần xử lý:** ~80+
- **Số đã fix trong audit này:** ~75 strings + đồng bộ master dictionary
- **Phase B view files (8) + admin pages:** chưa fix sâu — chỉ touch
  `PhaseAction.tsx`, `_shared.tsx`, `PhaseBar.tsx`. Còn 5 file Phase B
  khác (PhaseObserver, PhaseLiberation, PhaseRebuild, PhaseAmbassador,
  QDayCeremony, OnboardingWizard) chứa tương đối ít English — có thể audit
  pass-2 sau.
- **Internal code (variable names, function names):** KHÔNG đổi — giữ
  nguyên cho TypeScript compile + git diff dễ review.

---

## Files chưa touch (low impact / cần Khang quyết)

- `pages/Voice.tsx` — chưa review (nếu khác `NgheKhang.tsx`)
- `pages/Science.tsx` — có "Habit Reset" English label
- `pages/admin/**` — admin pages, không phải user-facing
- `components/views/phaseB/PhaseObserver.tsx`, `PhaseLiberation.tsx`, etc.
  — đã 90% Việt, còn vài "Stress/Trigger" lẻ tẻ
- `components/SilentCompanionshipWidgets.tsx` — đã fix major labels;
  còn vài chỗ "report" trong CSS uppercase

Pass-2 audit khuyến nghị: review thêm các file trên trong sprint sau.
