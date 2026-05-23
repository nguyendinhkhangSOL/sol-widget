# Sol — Communication Timeline & Critical Moments

**Phiên bản:** 1.0 (2026-05-15)
**Tác giả:** Sol Engineering + Khang Sol
**Mục đích:** Bản đồ chiến lược của toàn bộ tương tác giữa người cai thuốc và hệ thống Sol theo thời gian 52 ngày. Điểm tên từng touchpoint, phân tích các thời điểm bất ổn nhất + chiến lược ứng phó. Dùng làm reference cho:
- Khang & team CSKH khi handle khủng hoảng
- Engineering khi thiết kế tin nhắn mới
- Marketing khi đo lường engagement
- Onboarding nhân viên mới

---

## I. TỔNG QUAN HỆ THỐNG GIAO TIẾP

### Triết lý

Sol KHÔNG phải app cai thuốc một lần. Sol là **người bạn đồng hành 52 ngày** — Khang đã trải qua đường đó 5 năm trước, giờ kể lại chi tiết cho anh. Mỗi tin nhắn = một khoảnh khắc Khang ở cạnh.

3 nguyên tắc đối nhân của Sol:

1. **Không phán xét** — anh hút lại, anh sai, anh muốn bỏ cuộc — Sol vẫn ở đây.
2. **Khoa học + đời thường** — mỗi tin có cơ sở Cochrane/NEJM + ngôn ngữ Khang đời thực.
3. **Chủ động trước khủng hoảng** — Sol nhắn TRƯỚC khi anh thèm thuốc, không đợi anh kêu cứu.

### Channel Matrix

| Kênh | Hướng | Mục đích | Volume/ngày | Latency |
|------|-------|----------|-------------|---------|
| **Zalo OA ZNS** | Sol → User (push) | Daily chip, milestone, SOS template | 1-2 tin | < 60s |
| **Zalo OA Free Message** | Sol → User (reply 48h window) | Trả lời câu hỏi, random tip, SOS auto-reply | 2-5 tin | < 5s |
| **Zalo OA Inbound** | User → Sol | User chat, click SOS button | Tuỳ user | Realtime |
| **Email** | Sol → User | Login magic link, milestone certificate D30/60/365 | 1-2/tháng | < 1 phút |
| **Web sol.vn** | User → Sol | Đọc wiki articles, FAQ | Tuỳ search | N/A |
| **App bothuocla.sol.vn** | Hai chiều | Workbook, breathing, lapse log | Tuỳ user | Realtime |
| **Telegram (admin)** | Sol → Khang | SOS critical alert | Khi có critical | < 10s |
| **SMS (future)** | Sol → User | Khi Zalo unreachable | Backup | < 1 phút |

### Tone of Voice

| Phase | Tone | Đại diện |
|-------|------|----------|
| Pre-onboarding | Trung lập, scientific | Wiki SEO |
| Welcome | Ấm áp, đồng cảm | "Chào anh — em là Sol..." |
| Pre-Q-Day | Hiểu biết, khoa học | "Não anh đang quen với nicotine..." |
| Q-Day | Khuyến khích, chăm sóc | "Hôm nay là Ngày 1 anh không hút..." |
| D1-D7 | Cứu hộ, bình tĩnh | "Cơn thèm là sóng 90 giây..." |
| D8-D30 | Bạn bè, chia sẻ | "Khang Day 14 cũng vậy đó..." |
| Maintenance | Mentor, lâu năm | "Anh đã 60 ngày — Khang chúc mừng" |
| Crisis SOS | Khẩn cấp, cụ thể | "ĐỪNG LÀM GÌ 90 GIÂY. Hotline: 02439931800" |

---

## II. TIMELINE TỔNG — 52 NGÀY

```
Phase 0  ───── Pre-onboarding (Awareness) ──────────────────────── User chưa biết Sol
                  ↓ SEO / FB ads / word-of-mouth
Phase 1  ───── Onboarding (Day 0) ────────────────────────────────  Follow OA, choose lộ trình
                  ↓ Welcome flow + Q-Day picker
Phase 2  ───── Pre-Q-Day (T-21 → T-1) ────────────────────────────  Làm Quen + Giảm Dần
                  ↓ 21 daily chips + random tips
Phase 3  ───── Q-DAY (D0) ──────────────────────────────────────── ⭐ Cột mốc CẮT SẠCH
                  ↓ "Bắt đầu" tin + kích hoạt SOS
Phase 4  ───── Q-Day Series (D1 → D30) ──────────────────────────  4 milestones (D7/14/21/30)
                  ↓ 30 daily chips + random tips + SOS-ready
Phase 5  ───── Maintenance (D31 → ∞) ──────────────────────────────  Mentor mode
                  ↓ 1 tin/tuần + anniversary (60/90/365)
```

**Tổng touchpoint dự kiến cho 1 user:** ~ 250 tin trong 52 ngày (5 tin/ngày trung bình)

---

## III. PHÂN TÍCH TỪNG PHASE

### Phase 0 — Pre-onboarding (Awareness)

User chưa biết Sol tồn tại. Đang search "cai thuốc lá" trên Google hoặc nhậu nghe bạn kể.

**Touchpoint 0.1: SEO Wiki (103 bài có FAQ schema)**
- Channel: Web sol.vn
- Trigger: User search keyword (vd "cai thuốc lá tại nhà", "ngày 3 cai thuốc khó nhất")
- Content: 7 PILLAR + 21 Pre-Q-Day + 30 Q-Day + 11 Cluster + 34 CHIP = 103 bài
- CTA: "Mở app Đi Cùng Sol" → button → `bothuocla.sol.vn` → app
- KPI: CTR từ SERP (target 5-8% rich snippet), bounce rate (< 60%), time on page (> 90s)

**Touchpoint 0.2: Social proof Facebook group**
- Channel: External (Facebook, Zalo group)
- Content: Khang post case study, alumni share
- CTA: Link sol.vn hoặc OA QR code

**Touchpoint 0.3: Bạn bè giới thiệu (organic)**
- Channel: Word-of-mouth (Zalo cá nhân, lunch chat)
- Content: Alumni Sol kể chuyện
- CTA: Search "Đi Cùng Sol" trên Zalo

→ **Conversion goal:** User scan QR / click link → follow OA "Đi Cùng Sol"

---

### Phase 1 — Onboarding (Day 0, 5-10 phút)

#### Touchpoint 1.1: Welcome message (auto-fire)

**Trigger:** Webhook event `follow` → `handleFollow()`
**Channel:** Zalo OA Free Message
**Latency:** < 2 giây sau khi user click "Quan tâm OA"

```
Chào [tên user]!

Mình là Sol — đồng hành cai thuốc cùng Khang.

Khang đã hút 30 năm, cai 5 năm. Sol giúp anh:
• 7 ngày LÀM QUEN — hiểu cơ chế nghiện
• 14 ngày GIẢM DẦN — chuẩn bị cắt
• 30 ngày Q-DAY — duy trì + maintenance

Tổng 51 ngày — miễn phí.

Anh chọn lộ trình phù hợp:

[🆕 Tôi vừa quyết tâm (7+14+30 ngày)]
[🚀 Tôi đã sẵn sàng (14+30 ngày)]
[💪 Cai đã lâu — chỉ cần duy trì]
```

**KPI:**
- Welcome delivery rate: > 95%
- Button click rate: 60-80% (industry avg cho health app)
- Time-to-first-click: < 5 phút

#### Touchpoint 1.2: Journey choice handling

**Trigger:** User click 1 button → `user_send_text` với text `/lo-trinh-full-51`
**Action:**
1. Tạo User Sol nếu chưa có (anonymous-first)
2. Link `ZaloOAUser.userId` với User
3. Lưu state `waiting_qday` vào `UserState.stateData`
4. Reply tin Q-Day picker

**Q-Day picker reply:**
```
Tuyệt vời! Anh chọn 7 NGÀY LÀM QUEN + 14 NGÀY GIẢM DẦN + 30 NGÀY Q-DAY.

Q-Day là ngày anh cam kết CẮT SẠCH thuốc.
Anh muốn Q-Day vào khi nào?

[Hôm nay] [Ngày mai] [+7 ngày nữa]
```

User cũng có thể gõ ngày tự chọn ("20/05" hoặc "tuần sau").

#### Touchpoint 1.3: Enrollment confirmation

**Trigger:** User pick Q-Day → `handleQDayPick()` → `enrollUser()` → 52 ScheduledPush tạo
**Reply:**
```
Tuyệt! Sol đã set Q-Day: [20/05/2026].

Mỗi sáng 7h em sẽ gửi 1 bài chip + link wiki.
Bài đầu tiên sẽ đến vào sáng mai.

Khi nào cần SOS, gõ "sos" hoặc bấm nút.
Hotline: 02439931800

Đã tạo 52 lịch tin. Chúc anh thành công!

[Mở Sol đầy đủ] [Tôi đang khó]
```

→ User chính thức enrolled. 52 ScheduledPush trong DB chờ cron fire.

**Critical Moment 1:** Nếu user follow OA NHƯNG không click button trong 24h → no enrollment → silent drop-off.

→ **Mitigation:** Cron daily 9AM check user follow > 24h không enroll → push follow-up: "Anh quên chọn lộ trình chưa? Sol vẫn ở đây..."

---

### Phase 2 — Pre-Q-Day (T-21 → T-1, 21 ngày)

#### Phase 2A: Làm Quen (T-21 → T-15, 7 ngày)

Mục tiêu: User HIỂU vì sao mình nghiện trước khi bỏ. Tuyệt đối **không thúc ép bỏ**.

| Ngày | Slug | Chip preview | Critical? |
|------|------|--------------|-----------|
| T-21 | lam-quen-ngay-1 | "Vì sao bạn vẫn hút? Não đã quen nhận dopamine từ nicotine..." | Onboarding — first impression |
| T-20 | nghien-nicotine-la-gi | "Receptor nicotine tăng 3x sau 1 năm hút..." | Foundational science |
| T-19 | chi-phi-thuc-su-cua-thuoc-la | "5 năm = 36.5 triệu (1 Honda Wave)..." | Money motivation |
| T-18 | bo-thuoc-that-bai-nhieu-lan | "Trung bình 30+ lần thử mới cai. Khang lần 5..." | Self-compassion |
| T-17 | 3-phuong-phap-khoa-hoc | "Cold turkey 3-5%. NRT 10-15%. Champix 25-30%..." | Method awareness |
| T-16 | stages-of-change-quiz | "Test sẵn sàng cai chưa? 5 giai đoạn Prochaska..." | Readiness check |
| T-15 | cam-ket-chon-lo-trinh | "Bài cuối Làm Quen. Mai bắt đầu Giảm Dần..." | Commitment bridge |

**KPI Phase 2A:**
- Drop-off rate: < 15% (target — phase Làm Quen ít áp lực, dễ giữ user)
- Wiki click-through: > 30% (user vào sol.vn đọc kỹ)
- Reply rate: 5-10% (user chat hỏi câu hỏi)

#### Phase 2B: Giảm Dần (T-14 → T-1, 14 ngày)

Mục tiêu: Giảm dần 25% mỗi tuần, **chuẩn bị cắt sạch**.

| Ngày | Slug | Chip | Critical? |
|------|------|------|-----------|
| T-14 | giam-dan-ngay-1 | "Bắt đầu giảm 25%. Hôm nay 15 điếu thay vì 20..." | Action begins |
| T-13 | ban-do-trigger | "Vẽ 10 cú trigger cao nhất..." | Self-awareness |
| T-12 | tri-hoan-30-phut | "Mỗi cơn thèm chờ 30 phút..." | First control |
| T-11 | fagerstrom-test | "6 câu Fagerström đo mức nghiện..." | Personalize plan |
| T-10 | cat-dieu-dau-tien | "Điếu sáng = mạnh nhất Pavlov. Cắt hôm nay" | **⚠ Critical** |
| T-9 | tri-hoan-dieu-sang | "Chuyển điếu 1 từ 7h sang 9h..." | Habit shift |
| T-8 | giam-thanh-cong-50pct | "Mốc giảm 50%. Cilia phổi mở 1 phần..." | Encouragement |
| T-7 | giam-dan-ngay-7 | "Mốc 1 tuần Giảm Dần..." | Mid-checkpoint |
| T-6 | tang-cuong-sap-cat | "T-7 ngày. Mua NRT sẵn..." | Tool prep |
| T-5 | tu-bo-bat-lua-cuoi | "Bỏ tất cả bật lửa khỏi nhà..." | Physical commit |
| T-4 | noi-voi-vo-chong | "Báo trước vợ con — 7 ngày tới cáu gắt..." | Social support |
| T-3 | don-rac-nha | "Vứt tất cả thuốc + gạt tàn..." | **⚠ Critical — Resistance** |
| T-2 | plan-b-if-then | "5 tình huống if-then. Nếu cà phê thì uống nước..." | Crisis prep |
| T-1 | giam-dan-ngay-14 | "Đêm cuối. Ngủ sớm. Mai 7h Q-Day. Khang ở đây" | **⚠⚠ Critical — Anxiety peak** |

**Critical Moment 2 (T-10):** Cắt điếu đầu tiên = Pavlov phá. Thèm sinh lý + tâm lý cao.
- **Sol action:** Daily chip extra empathy + tăng random tip lên 30% (vs 20% bình thường)

**Critical Moment 3 (T-3):** Vứt thuốc + bật lửa = "physical commitment". 30% user thoái lui đây.
- **Sol action:** Daily chip có CTA "Tôi đã vứt" (button confirm) → tăng commitment

**Critical Moment 4 (T-1):** Đêm trước Q-Day. Anxiety peak. Mất ngủ.
- **Sol action:** Daily chip evening 9PM thay vì 7AM. Tone bình tĩnh. Khang voice message.

**KPI Phase 2B:**
- Drop-off rate: 25-35% (cao hơn 2A vì action thật)
- T-3 → T-1 retention: > 70% (giai đoạn quyết định)
- Reply rate: 15-25% (user hỏi nhiều hơn)

---

### Phase 3 — Q-DAY (D0)

⭐ **Cột mốc lớn nhất của journey.** Khang gọi đây là "ngày anh chính thức không hút trong [X] năm".

#### Touchpoint 3.1: Q-Day Morning push (7:00 AM)

**Template:** SOL_DAILY_CHIP với slug `q-day-bat-dau`

```
Ngày 0 — Q-Day Bắt Đầu

Hôm nay là ngày Q-Day. Anh chính thức không hút từ giây này.

Khang Day 0 đã đi qua 5 năm trước. Cảm xúc: vừa sợ vừa nhẹ nhõm.

Đọc đầy đủ: [link sol.vn/q-day-bat-dau]

[📖 Đọc bài hôm nay] [🆘 Tôi đang khó]
```

#### Touchpoint 3.2: Q-Day Evening check-in (8:00 PM)

**Free OA message** (không tốn ZNS — user đã interact 7AM nên 48h window mở):

```
Anh ơi, hết ngày Q-Day rồi.

24h đầu cơ thể đã làm những việc kỳ diệu:
- CO máu giảm 50% sau 8h
- Oxy bắt đầu hồi
- Nicotine bắt đầu thải

Anh ngủ ngon. Mai là Day 1.

[Ghi nhận hôm nay] [Tôi đang khó]
```

#### Touchpoint 3.3: Crisis-ready mode

Day 0 tất cả flags bật:
- Random tip rate 40% (vs 20% bình thường) tại 7h30, 10h, 13h30, 16h30, 21h
- SOS button luôn hiển thị
- Crisis keyword detection lowered threshold (mọi mention "thèm" cũng tag)

**Critical Moment 5 (D0):** 24h đầu — withdrawal physiological + psychological combined.
- **Sol action:** Triple touchpoint (morning + 3-5 random tips + evening).

**KPI Q-Day:**
- Q-Day completion (user không hút): target > 85%
- SOS trigger rate: 10-20% (cao — bình thường)
- Reply rate: 30-50%

---

### Phase 4 — Q-Day Series (D1 → D30, 30 ngày)

#### Phase 4A: Crisis Zone (D1-D7) — 7 ngày khó nhất

| Ngày | Slug | Chủ đề | Critical level |
|------|------|--------|----------------|
| D1 | ngay-1-24-gio-dau-tien | 24h đầu — CO giảm 50% | ⚠ |
| D2 | ngay-2-dinh-con-them | Đỉnh cơn thèm — receptor đói | ⚠⚠ |
| D3 | ngay-3-buc-tuong | **Bức Tường — 70% người vấp** | ⚠⚠⚠ |
| D4 | ngay-4-mat-ngu | Mất ngủ — REM rebound | ⚠⚠ |
| D5 | ngay-5-them-an | Thèm ăn + nỗi sợ tăng cân | ⚠ |
| D6 | ngay-6-cau-gat | Cáu gắt — đỉnh cortisol | ⚠⚠ |
| D7 | ngay-7-moc-1-tuan | **🎉 Mốc 1 TUẦN — milestone** | Celebrate |

**Critical Moment 6 (D3 — Bức Tường):**

D3 = withdrawal đỉnh điểm. Khoa học (NIDA 2019): 70% người không có support vấp ở D3.

**Sol action D3 deep care:**
- Daily chip 7AM với tone đặc biệt empathetic
- Random tip rate 50% (peak care)
- Push Khang voice message lúc 18:00
- Crisis keyword detection set ở mức sensitive nhất
- Reply window 24/7 (admin always-on)

**Template message D3:**
```
Hôm nay là Ngày 3 — ngày Bức Tường.

70% người không có support vấp hôm nay.

Nhưng anh có Sol + Khang + 95 câu trả lời sẵn.

Bí mật: cơn thèm là sóng 90 giây.
Đếm 1, 2, 3... đến 90. Sóng sẽ qua.

Khang Day 3 đã đi qua 5 năm trước.
Anh không đơn độc.

[Đọc đầy đủ] [Tôi đang khó]
```

#### Phase 4B: Stabilization (D8-D14)

| Ngày | Slug | Chủ đề | Critical |
|------|------|--------|----------|
| D8 | ngay-8-suong-mu-nao | Acetylcholine tái cân bằng | Medium |
| D9 | ngay-9-ho-co-dom | Cilia đẩy tar — dấu hiệu TỐT | Low |
| D10 | ngay-10-con-them-doi | Sinh lý → tâm lý (Pavlov) | Medium |
| D11 | ngay-11-vi-giac | Taste buds tái sinh | Low |
| D12 | ngay-12-dao-dong-nang-luong | Lúc khỏe lúc mệt | Low |
| D13 | ngay-13-cam-xuc-that-thuong | Depression check | ⚠⚠ |
| D14 | ngay-14-moc-2-tuan | **🎉 Mốc 2 TUẦN** | Celebrate |

**Critical Moment 7 (D13):** Đống Tro Tàn — anhedonia tạm thời, 30% có dấu hiệu depression nhẹ.
- **Sol action:** Daily chip phân biệt rõ "tự qua" vs "cần khám". Khang voice empathy.

#### Phase 4C: False Confidence (D15-D21) — danger zone

| Ngày | Slug | Chủ đề | Critical |
|------|------|--------|----------|
| D15 | ngay-15-tinh-huong-kho | Café, đồng nghiệp, bia hơi | ⚠⚠ |
| D16 | ngay-16-nhau-bia-hoi | **Đi nhậu lần đầu — combo nguy hiểm** | ⚠⚠⚠ |
| D17 | ngay-17-nham-chan | Low dopamine — nhàm chán | ⚠⚠ |
| D18 | ngay-18-stress-cong-viec | Work smoke break Pavlov | ⚠⚠ |
| D19 | ngay-19-ban-be-con-hut | Social influence 3x | ⚠⚠ |
| D20 | ngay-20-giac-mo-hut | 60% mơ hút thuốc | Medium |
| D21 | ngay-21-moc-3-tuan | **🎉 Mốc 3 TUẦN** | Celebrate |

**Critical Moment 8 (D15-D21 — False Confidence):**

Sau 2 tuần, cravings sinh học -70%. User cảm thấy "đã thắng" → chủ quan → đi nhậu thử lại → vấp.

Khoa học (Marlatt 1985): 70% relapse rate vào D15-D21 do tự tin quá.

**Sol action:**
- Daily chip emphasize "Pavlov vẫn mạnh dù sinh lý giảm"
- D16 push extra reminder evening 17h trước khi user đi nhậu
- Crisis keyword detection bật cao trở lại
- Random tip lúc 18h-21h tăng frequency

**Template D16:**
```
Hôm nay nếu anh đi nhậu, đọc bài này TRƯỚC khi ra cửa.

Rượu giảm ý chí 30%. Café + bia + bạn cũ = combo nguy hiểm nhất.

Plan B 5 bước:
1. Arrive late — đến muộn 30 phút
2. Đứng cạnh người không hút
3. Bài thoát: 10h tối "vợ gọi, em phải về"
4. Gọi 1 ly thay vì 3
5. Pocket NRT — chewing gum

Khang Day 16 cũng từng đi nhậu — em đã vượt qua.

[Đọc đầy đủ] [Tôi đang khó]
```

#### Phase 4D: Identity Shift (D22-D30)

| Ngày | Slug | Chủ đề |
|------|------|--------|
| D22 | ngay-22-con-them-sau-bua-an | Thèm sau cơm dai dẳng |
| D23 | ngay-23-cuoi-tuan | Cuối tuần đầu unstructured |
| D24 | ngay-24-toi-la-nguoi-khong-hut | **Identity shift** |
| D25 | ngay-25-can-tai-nghien | Lapse vs Relapse |
| D26 | ngay-26-tien-tiet-kiem | Báo cáo tiết kiệm tiền |
| D27 | ngay-27-gia-dinh | Gia đình thấy khác |
| D28 | ngay-28-tu-hao | Tự hào không phù phiếm |
| D29 | ngay-29-nhin-ve-thang-2-3 | Tháng 3-6 vẫn warning |
| D30 | ngay-30-moc-1-thang | **🎉🎉 GRADUATION** |

**Critical Moment 9 (D24 — Identity Shift):**

Tombor 2015: user chuyển từ "đang cai" sang "không hút" → relapse rate giảm 50%.

**Sol action:** Daily chip explicit identity language. Khang voice "anh đã trở thành ai mới".

**Critical Moment 10 (D30 — Graduation):**

Mốc 1 tháng = milestone lớn nhất phase 4. Cần celebration.

**Sol action:**
- Template `SOL_MILESTONE_GENERIC` với data: tiết kiệm tiền, % phục hồi, % giảm risk
- Email certificate PDF (gửi qua nodemailer)
- Invite community alumni
- Mở phase 5 Maintenance

```
Mốc 1 TUẦN — Tuyệt vời!

Anh đã không hút 30 ngày!
Tiết kiệm: 780.000 VND
Phổi: 50% phục hồi cilia

Khang chúc mừng anh. Anh đã trở thành người không hút.

Bây giờ chuyển sang Maintenance — 1 tin/tuần.

[📊 Xem báo cáo đầy đủ] [📣 Chia sẻ thành tựu]
```

**KPI Phase 4:**
- D1 → D7 retention: target > 75% (Bức Tường ở D3)
- D7 → D14: > 90%
- D14 → D21: > 85% (False Confidence zone)
- D21 → D30: > 95%
- D30 completion rate (target): 60-70%

---

### Phase 5 — Maintenance (D31 → ∞)

User đã graduate. Chuyển sang **mentor mode** — Sol gửi 1 tin/tuần.

#### Touchpoint Maintenance regular

- **Mỗi thứ 2 sáng 7AM:** Daily chip cho tuần đó (relapse prevention focus)
- **Anniversary milestones:** D60, D90, D180, D365 — special celebration
- **Trigger events:** Tết, đám tang/cưới, sinh nhật → push contextual support
- **Lapse event:** Nếu user log "đã hút lại" trong app → re-enroll vào shorter recovery flow

**Critical Moment 11 (D60-D90):**

Khoa học (Hughes 2004): relapse risk vẫn cao đến tháng 3. Đa số drop-off ở đoạn này.

**Sol action:**
- D60 push extra check-in: "Anh vẫn ổn chứ?"
- D90 chest X-ray reminder: "Đến mốc 3 tháng — chụp X-quang phổi để xem cilia phục hồi"

**Critical Moment 12 (D365):**

1 năm — relapse risk drops dramatically (Doll 2004). Heart attack risk -50%.

**Sol action:**
- Anniversary email + certificate
- Invite làm mentor cho user mới
- Khang voice congratulation

**KPI Phase 5:**
- Lapse rate D31-D90: < 25%
- D90 → D365 retention: > 60%
- Mentor recruitment: 5-10% alumni

---

## IV. CRISIS & SOS FLOW (XUYÊN SUỐT TIMELINE)

### Trigger 1: User click [🆘 SOS] button

Mỗi tin daily + welcome đều có button SOS payload `/sos`.

User click → webhook `user_send_text` text=`/sos` → `triggerSos()`:

1. **Severity classification:** mặc định `high` (button click thường là relapse risk)
2. **Tạo SOSAlert** trong DB (status=`pending`)
3. **Auto reply** template SOL_SOS_CRISIS với hotline 02439931800:
```
Sol đây anh. Đừng làm gì trong 90 giây.

Cơn thèm là sóng — sẽ qua trong 90 giây.
HÍT sâu 4 → CHẶN 7 → CHỜ 8 (lặp 3 lần).

Cần Khang gọi lại?
Hotline: 02439931800

[📞 Gọi hotline Sol] [📖 Đọc Sắp Hút Lại] [✓ Tôi đã vượt qua]
```
4. **Socket broadcast** `sos:new` event → admin dashboard hiện đỏ + bíp âm
5. **Telegram alert Khang** nếu severity=critical (TODO Sprint 4)

### Trigger 2: Crisis keyword detection

User chat thường vào OA → `intentRouter.routeUserMessage()` match keyword:

| Keyword | Severity | Phản ứng |
|---------|----------|----------|
| đau ngực dữ, ho ra máu, khó thở dữ | **critical** | Push hotline 115 (cấp cứu) + Telegram Khang |
| sắp hút, không kiềm, chịu không nổi, thua rồi, cứu | **high** | SOL_SOS_CRISIS template |
| tự hại, tự tử, không muốn sống, kết thúc | **medium** | Soft empathy + hotline mental health |
| bỏ cuộc, thèm chết được | high | Khang voice + plan B |

### Trigger 3: No-reply 3 days (TODO)

Cron 8AM mỗi ngày: check user `journeyStatus=active` chưa interact trong 72h.
→ Tạo SOSAlert severity=`low` (engagement check) → admin follow-up.

### Trigger 4: Admin manual

Khang chủ động tạo SOS qua dashboard `/admin/zalo/sos` → manual outreach.

### SOS Response Flow

```
User click SOS
   ↓
Backend tạo SOSAlert (pending)
   ↓
Auto reply Sol (auto_responded)
   ↓
[Nếu user click "Tôi đã vượt qua"]
   → status = resolved
[Nếu user reply tin]
   → Khang nhận socket alert → reply qua admin dashboard
   → status = admin_responding
[Nếu 72h không respond]
   → status = no_response_72h
   → trigger escalation (TODO: Khang call thật)
```

---

## V. TOUCHPOINT CATALOG (TỔNG HỢP)

### Push proactive (Sol → User, không cần user trigger)

| ID | Tên | Channel | Frequency | Phase |
|----|-----|---------|-----------|-------|
| SOL_DAILY_CHIP | Daily chip 7AM (giờ user chọn) | ZNS | 1/ngày | Phase 2 + 4 |
| SOL_MILESTONE_GENERIC | Milestone D7/14/21/30 | ZNS | 4 mốc | Phase 4 |
| SOL_DAILY_CHECKIN | Evening check-in 20h | ZNS | 1/ngày | Phase 4 |
| SOL_VOICE_RELEASE | Khang voice cột mốc | ZNS | 5 mốc | Phase 2+4 |
| SOL_Q_DAY_T_MINUS_2 | T-2 reminder | ZNS | 1 lần | T-2 |
| SOL_Q_DAY_T_MINUS_1 | Đêm trước Q-Day | ZNS | 1 lần | T-1 |
| SOL_Q_DAY_MORNING | Q-Day sáng | ZNS | 1 lần | D0 |
| SOL_GRADUATION | D30 graduation | ZNS | 1 lần | D30 |
| SOL_LAPSE_RECOVERY | Re-engagement sau lapse | ZNS | Khi cần | Bất kỳ |
| FREE_OA_RANDOM_TIP | Random tip 5 khung giờ | Free OA | 1-2/ngày | Phase 4 |
| FREE_OA_NO_REPLY | Check-in user 72h silent | Free OA | Khi cần | Phase 4-5 |
| EMAIL_WELCOME | Welcome email sau enroll | Email | 1 lần | Day 0 |
| EMAIL_MILESTONE_D30 | Certificate PDF | Email | 1 lần | D30 |
| EMAIL_ANNIVERSARY | D60/90/365 anniversary | Email | 3 lần | Phase 5 |

### Reactive (User trigger → Sol reply)

| ID | Tên | Channel | Trigger |
|----|-----|---------|---------|
| CANNED_REPLY | 95 reply có sẵn | Free OA | Match keyword intent |
| AI_FALLBACK | Claude AI khi không match canned | Free OA | Default |
| SOL_SOS_CRISIS | SOS auto reply | ZNS | Button click hoặc keyword |
| WELCOME_BUTTONS | 3 button journey | Free OA | Event `follow` |
| Q_DAY_PICKER | Hỏi Q-Day | Free OA | After journey choice |
| ENROLL_CONFIRM | Confirm 52 push tạo | Free OA | After Q-Day pick |

### Inbound (User → Sol)

| ID | Trigger | Sol action |
|----|---------|-----------|
| user_send_text | User chat text | intentRouter → CANNED/AI/CRISIS |
| user_send_image | User gửi ảnh | Reply "chỉ hỗ trợ text" |
| user_send_audio | User gửi audio | Reply "chỉ hỗ trợ text" + suggest call hotline |
| user_click_button (chat) | Click 1 trong 3 button welcome | handleJourneyChoice |
| user_click_button (ZNS) | Click button trong daily push | Mở URL hoặc trigger SOS |
| follow | User follow OA | handleFollow → Welcome message |
| unfollow | User unfollow | Mark `blockedAt`, không push thêm |

---

## VI. CRITICAL MOMENTS — TOP 12 THỜI ĐIỂM BẤT ỔN NHẤT

Đây là 12 thời điểm dễ vấp nhất, xếp theo mức độ ưu tiên:

### #1 — Day 3: Bức Tường (⚠⚠⚠⚠⚠)

**Khoa học:** Withdrawal đỉnh điểm. Receptor nicotine đói cực mạnh. 70% người không có support vấp.

**User experience:** Cảm xúc như sốt — cáu gắt, đói thuốc bất thường, khó tập trung.

**Sol action:**
- Daily chip 7AM tone empathy đặc biệt
- Khang voice message 18:00
- Random tip rate 50% (peak care)
- Crisis keyword detection sensitive nhất
- Reply window 24/7 admin always-on

**KPI:** D3 → D4 retention target > 75%

### #2 — Day 16: Đi nhậu lần đầu (⚠⚠⚠⚠⚠)

**Khoa học:** Combo café + bia + bạn cũ + rượu giảm ý chí 30%. 70% relapse rate ở false-confidence zone D15-D21.

**User experience:** "Tôi đã 2 tuần, chắc không sao đâu" → đi nhậu → ép → hút.

**Sol action:**
- D16 push extra reminder evening 17h
- Plan B 5 bước rõ ràng
- Pocket NRT gum khuyến cáo
- Khang voice "anh không cần chứng minh gì"

**KPI:** D16 → D17 retention > 80%

### #3 — T-1: Đêm trước Q-Day (⚠⚠⚠⚠)

**Khoa học:** Anticipatory anxiety. Mất ngủ. "Tomorrow is THE day".

**User experience:** Lo lắng, hối hận chọn lộ trình, muốn delay Q-Day thêm.

**Sol action:**
- Push evening 9PM thay vì 7AM
- Tone bình tĩnh, không thúc ép
- Khang voice empathy
- Reminder "Sol ở đây 24/7 ngày mai"

**KPI:** T-1 → D0 retention > 90%

### #4 — D0: Q-Day 24h (⚠⚠⚠⚠)

**Khoa học:** Physiological + psychological withdrawal combined. 50% người vấp trong 24h đầu nếu không có support.

**User experience:** Hỗn loạn cảm xúc — vừa tự hào vừa hoảng.

**Sol action:**
- Triple touchpoint: morning push + 3-5 random tips + evening check-in
- SOS button luôn hiển thị
- Khang voice "Day 0 Khang đã đi qua"

**KPI:** D0 → D1 retention > 85%

### #5 — Day 13: Đống Tro Tàn (⚠⚠⚠)

**Khoa học:** Anhedonia tạm thời. Dopamine baseline thấp 2-4 tuần. 30% có dấu hiệu depression nhẹ.

**User experience:** "Cuộc đời không có niềm vui gì nữa". Muốn quay lại.

**Sol action:**
- Daily chip phân biệt rõ "tự qua" vs "cần khám"
- Khang voice empathy
- Hotline mental health (nếu severity tăng)

**KPI:** D13 → D14 retention > 90%

### #6 — D60-D90: Maintenance drop-off (⚠⚠⚠)

**Khoa học:** Relapse risk vẫn cao đến tháng 3. Active intervention giảm → user cảm thấy "bỏ rơi".

**User experience:** "Sol đã bỏ tôi rồi" → cảm xúc tự ti → tìm thuốc.

**Sol action:**
- Anniversary D60 special push
- D90 X-ray reminder
- Mentor invitation
- Email check-in

**KPI:** D60 → D90 retention > 80%

### #7 — T-3: Vứt thuốc (⚠⚠⚠)

**Khoa học:** Physical commitment moment. 30% user thoái lui (giữ 1 gói "phòng hờ").

**User experience:** Resistance — "Tôi sẽ tự quản lý".

**Sol action:**
- Daily chip explicit instruction
- CTA "Tôi đã vứt" button (commitment confirmation)
- Khang voice "Em làm được rồi"

**KPI:** T-3 confirmation rate > 60%

### #8 — T-10: Cắt điếu sáng đầu tiên (⚠⚠⚠)

**Khoa học:** Pavlov điếu sáng = trigger số 1 trong văn hoá VN. Phá Pavlov này = phá cốt lõi.

**User experience:** Buổi sáng đầu không hút sau cà phê → bồn chồn.

**Sol action:**
- Daily chip với 5 thay thế cụ thể (uống nước, đi bộ, đánh răng...)
- Random tip 7h30 (sau cà phê) tăng frequency
- Khang voice "Em đã phá Pavlov này 5 năm trước"

**KPI:** T-10 → T-9 retention > 90%

### #9 — D15: Tình huống khó đầu tiên (⚠⚠⚠)

**Khoa học:** Cravings sinh học -70% nhưng Pavlov tâm lý cực mạnh. 70% relapse zone bắt đầu.

**User experience:** "Tôi đã thắng" → café với bạn → bạn rút thuốc → ép → vấp.

**Sol action:**
- Daily chip cảnh báo false confidence
- Plan B reminder
- Random tip 10:00 + 13:30 (giờ café)

**KPI:** D15 → D16 retention > 85%

### #10 — D6: Cáu gắt đỉnh (⚠⚠)

**Khoa học:** Cortisol cao, prefrontal cortex yếu. Gia đình bị "xả" → conflict → user xấu hổ → quay lại.

**User experience:** Vợ con tránh, đồng nghiệp khó chịu, bản thân không kiểm soát.

**Sol action:**
- Daily chip 5 kỹ thuật hạ cơn
- Template "báo trước vợ con" cho user gửi cho gia đình
- Khang voice "không phải tính cách anh"

**KPI:** D6 → D7 retention > 90%

### #11 — D24: Identity Shift (⚠⚠)

**Khoa học:** Tombor 2015: chuyển từ "đang cai" → "không hút" giảm relapse 50%.

**User experience:** Khoảnh khắc nhận ra mình đã khác.

**Sol action:**
- Daily chip explicit identity language
- Khang voice "anh đã trở thành ai mới"
- CTA "Tôi là người không hút" (commitment)

**KPI:** D24 → D30 retention > 95% (peak phase)

### #12 — D365: Anniversary (⚠)

**Khoa học:** Heart attack risk giảm 50%. 1 năm milestone.

**User experience:** Tự hào nhưng cũng cảm xúc — "1 năm trước tôi đã quyết định...".

**Sol action:**
- Anniversary email + certificate PDF
- Khang voice congratulation
- Mentor recruitment offer
- Social share template (FB, Zalo)

**KPI:** D365 mentor recruitment > 5%

---

## VII. ĐO LƯỜNG ENGAGEMENT

### Funnel metrics

```
Awareness (SEO/Ads)
   ↓ 100%
OA Follow
   ↓ 30-50%
Welcome button click
   ↓ 60-80%
Q-Day picked
   ↓ 90%
Enrolled (52 push created)
   ↓ 100%
D7 milestone reached
   ↓ 75%
D14 milestone reached
   ↓ 65%
D21 milestone reached
   ↓ 55%
D30 graduation (🎉)
   ↓ 50%
D60 maintenance
   ↓ 45%
D90
   ↓ 40%
D365 anniversary
   ↓ 30-35%
```

### Per-touchpoint KPIs

| KPI | Định nghĩa | Target |
|-----|-----------|--------|
| Delivery rate | ZNS gửi thành công / tổng gửi | > 98% |
| Open rate | User mở tin / delivered | > 70% (Zalo tốt hơn email) |
| Click rate | User click button/link / delivered | > 25% |
| Reply rate | User chat lại / delivered | 5-10% |
| SOS trigger rate | SOS / total daily push | 1-5% |
| Wiki click-through | sol.vn visit / push delivered | > 20% |

### Cost metrics

- **ZNS cost:** 300đ/tin
- **Tổng tin/user 52 ngày:** ~ 56 ZNS (52 daily + 4 milestone)
- **Cost/user:** ~ 16.800 VND cho 52 ngày
- **Random tip Free OA:** 0đ (trong 48h window)
- **Pilot 50 user:** ~ 840.000 VND
- **Scale 10.000 user:** ~ 168 triệu VND

---

## VIII. PERSONALIZATION SIGNALS

Mỗi tin được personalize theo các signals:

### Signals tĩnh (set lúc onboarding)
- `name` — tên user (set lúc Zalo follow hoặc onboarding)
- `pronouns` — anh/chị/em (set bởi user trong settings)
- `assistantName` — tên Sol custom ("Sol Đồng hành", "Sol Vợ yêu")
- `journeyType` — full-51 / lam-quen / giam-dan / q-day / maintenance
- `qDayDate` — milestone
- `quitReasons` — 3-5 lý do user viết (vd "vì cu Tí", "vợ nhăn")
- `topTriggers` — 3 trigger user khai (vd "nhậu", "cà phê sáng")
- `ftndScore` — 0-10 Fagerström → cohort LIGHT/MODERATE/HEAVY
- `yearsSmoked` — số năm hút → expectation phục hồi

### Signals động (update mỗi ngày)
- `currentJourneyDay` — recomputed mỗi 7:30 AM
- `riskyHours` — học từ check-in history
- `engagementScore` — sent/opened/clicked ratio
- `cohortKey` — auto-assign từ FTND

### Cách dùng trong template
```
"Khang Day {currentJourneyDay} đã trải qua. {pronouns} không đơn độc."
"Tiết kiệm {currentJourneyDay * 26000} VND đến nay."
"Trigger số 1 của {pronouns}: {topTriggers[0]}. Đừng quên Plan B."
```

---

## IX. RỦI RO & MITIGATION

### Rủi ro kỹ thuật

| Rủi ro | Impact | Mitigation |
|--------|--------|-----------|
| Zalo OA Access Token expired (90 ngày) | Tin không gửi được | Auto-refresh cron + alert Khang trước 7 ngày |
| ZNS template bị Zalo reject | Push fail toàn batch | Backup template + manual review weekly |
| DB down | Worker fail loop | Health check + auto-restart + uptime monitoring |
| Webhook URL not public | Welcome flow fail | Cloudflare Tunnel + VPS deploy |
| Rate limit Zalo (1000 tin/giờ) | Batch fail | Queue + retry với exponential backoff |
| User out of 48h window | Free OA fail | Fallback sang ZNS template (tốn $) |

### Rủi ro nội dung

| Rủi ro | Impact | Mitigation |
|--------|--------|-----------|
| Tin có từ "thuốc lá" bị Zalo flag | Template reject | Re-write trung tính ("chất gây nghiện") |
| Crisis keyword false positive | User confused | Whitelist + manual review SOS log weekly |
| Khang voice quá personal | Privacy concern | Generic voice + tuỳ chỉnh per cohort |
| Spam perception (1 tin/ngày + random tip) | User unfollow OA | Track unfollow rate < 5%, giảm frequency nếu cao |

### Rủi ro user experience

| Rủi ro | Impact | Mitigation |
|--------|--------|-----------|
| User vấp ở Bức Tường D3 → tự ti → bỏ | Lifetime churn | Lapse recovery flow + Khang voice "1 lapse ≠ relapse" |
| User cảm thấy bị bỏ rơi sau D30 | Drop-off | Maintenance check-in + anniversary + community |
| User không hiểu lộ trình | Confusion | Onboarding video + FAQ in welcome |
| Privacy concern lo data leak | Distrust | Privacy policy + data minimization + Vietnam server |

---

## X. ROADMAP TIẾP THEO

### Sprint 4 (đang chuẩn bị)
- Cloudflare Tunnel — webhook public URL
- Telegram bot — Khang alert SOS critical
- VPS Ubuntu deploy — production stable

### Sprint 5
- Lapse event tracking — "Tôi đã hút lại" → recovery flow
- Re-engagement nếu no-reply 3 ngày
- A/B test daily chip variants (Khang voice vs text)

### Sprint 6
- Cohort retention dashboard
- Predictive risk model (ML — predict relapse 7 ngày trước)
- Khang voice TTS từ template

### Sprint 7
- Community alumni network
- Mentor matching (1 mentor : 5 mentee)
- Group challenges (30 days no-smoke leaderboard)

---

## XII. LUỒNG DỮ LIỆU USER → SOL (Input)

Đây là chiều ngược của Section III — user gửi data gì vào hệ thống, ở đâu, được lưu thế nào.

### 12.1. Onboarding Inputs (Day 0, one-shot)

User cung cấp những thông tin nền tảng. Đây là dữ liệu **personalize toàn bộ 52 ngày**.

| Trường | User input qua | Bắt buộc? | Lưu vào | Dùng cho |
|--------|---------------|-----------|---------|----------|
| `zaloUserId` | Tự động khi follow OA | ✓ | `User.zaloUserId` + `ZaloOAUser.zaloUserId` | Auth + push routing |
| `name` | Auto từ Zalo displayName | ✓ | `User.name` | Cá nhân hoá tin ("Anh Khang...") |
| `phone` | Optional (qua "Liên kết SĐT") | Khuyến khích | `User.phone` (unique) | ZNS routing + recovery |
| `email` | Optional (qua "Liên kết email") | Maintenance | `User.email` | Login admin + email certificate |
| `pronouns` | Welcome flow button | ✓ | `User.pronouns` (default "anh") | Tone trong tin |
| `journeyType` | Welcome button click | ✓ | `User.journeyType` | Schedule 52 push |
| `qDayDate` | Q-Day picker | ✓ | `User.qDayDate` | Tính dayOffset |
| `preferredPushHour` | Settings (default 7) | Optional | `User.preferredPushHour` | Cron fire time |
| `age`, `yearsSmoked`, `cigsBaseline` | Onboarding wizard | Optional | `User.*` | Personalize |
| `ftndScore` | FTND quiz (T-11) | Optional | `User.ftndScore` (0-10) | Cohort assignment |
| `quitReasons` | Onboarding wizard (3-5 lý do) | Optional | `User.quitReasons` (String[]) | Replay lúc thèm |
| `topTriggers` | Onboarding wizard | Optional | `User.topTriggers` (String[]) | Personalize tip |

### 12.2. Daily Inputs (Recurring qua Zalo OA)

| Event | Trigger | Lưu vào |
|-------|---------|---------|
| `user_send_text` | User chat | `Message` (role=USER) + `ZaloOAUser.totalMsgIn++` |
| `user_click_button` (welcome) | Click button journey | `UserState.stateData` |
| `user_click_button` (ZNS) | Click button daily push | Trigger tuỳ button (SOS, URL) |
| `follow` | Click "Quan tâm OA" | `ZaloOAUser` (CREATE) |
| `unfollow` | Unfollow | `ZaloOAUser.blockedAt` |


### 12.3. Web Widget Chat — Tương tác qua sol.vn + dashboard (⭐ SECTION MỚI)

Đây là kênh thứ 2 (song song với Zalo OA) — user tương tác với Sol qua **embed widget** trên trang sol.vn hoặc **dashboard standalone** trên bothuocla.sol.vn.

#### 12.3.1. Kiến trúc Widget

- **Code:** `frontend/SolWidget.tsx` — React component
- **Embed:** `frontend/embed.ts` — IIFE expose `window.SOLWidget.init()`
- **API:** `window.SOLWidget.{init, open, close, openView, setToken, logout}`
- **UI:** Bubble góc dưới phải (`WidgetBubble`) + Panel slide-in (`WidgetPanel`)
- **Realtime:** Socket.IO với event `message:new`, `notification:new`, `checkin:reminder`

#### 12.3.2. Anonymous-first auth flow (UX v2)

Khác với Zalo OA (bắt buộc Zalo account), Web Widget cho user vào ngay không cần đăng ký:

```
User vào sol.vn/cai-thuoc-la-tai-nha (wiki có widget embed)
   ↓
SolWidget mount → check 3 nguồn token (priority order):
  1. URL ?zalo=success&token=XXX (Zalo OAuth callback) → save token
  2. localStorage 'sol_token' → session cũ resume
  3. Không có → POST /auth/anonymous { deviceUid, originDomain }
                → backend tạo User Sol anonymous (isAnonymous=true)
                → return JWT → localStorage.setItem
   ↓
User vào widget được ngay — KHÔNG cần phone/OTP/email
   ↓
Sau 3 ngày engagement → soft prompt "Liên kết Zalo bảo vệ hành trình"
```

#### 12.3.3. 15 Touchpoint Widget Chat

| Touchpoint | UI | API endpoint | Lưu vào |
|-----------|----|--------------|---------|
| Widget mount lần đầu | Bubble góc | `POST /auth/anonymous` | `User` (anon) |
| Click bubble open | Panel slide | `GET /users/me` | Read |
| User chat text | Input box | `POST /messages` | `Message` (USER) |
| Sol AI stream reply | Typing indicator | SSE `/messages/stream` | `Message` (ASSISTANT) |
| Daily check-in | Flow 4 step | `POST /checkins` | `CheckIn` |
| Click chip suggestion | Pre-filled prompt | `POST /messages` | `Message` + `CannedReply.usageCount++` |
| 90s breathing timer | Modal overlay | `POST /crisis-timer` | `CrisisTimerLog` |
| Log "Tôi đã hút" | Lapse modal | `POST /lapse` | `LapseEvent` + `CigaretteLog` |
| Workbook entry | Journal editor | `POST /journal` | `ProgressJournal` |
| Listen Khang voice | Audio player inline | `POST /voice/listen` | `KhangVoiceListen` |
| Quit reasons (3-5) | Onboarding wizard | `PUT /users/me/profile` | `User.quitReasons[]` |
| Topers triggers | Onboarding wizard | `PUT /users/me/profile` | `User.topTriggers[]` |
| FTND test 6 câu | Quiz UI | `PUT /users/me/profile` | `User.ftndScore` |
| Bind Zalo | Click button → OAuth | `POST /auth/zalo/callback` | `User.zaloUserId` + MERGE |
| Bind phone (OTP) | Modal nhập SĐT | `POST /auth/phone/{request,verify}` | `User.phone` + `OtpCode` |


#### 12.3.4. Realtime channel — Socket.IO

Widget mở socket connection ngay khi auth, lắng nghe 4 event chính:

```javascript
// frontend/src/hooks/useSocket.ts
const socket = io(socketBase, {
  auth: { token: localStorage.getItem('sol_token') }
});

socket.on('message:new', msg => store.addMessage(msg));
socket.on('notification:new', notif => store.addNotification(notif));
socket.on('checkin:reminder', () => store.showCheckinPrompt());
socket.on('sos:auto-trigger', () => store.openCrisisMode());
```

**Backend emit qua `emitToUser(userId, event, payload)`:**
- Worker push mới → emit `notification:new` → widget badge đỏ
- AI reply stream → emit `message:new` chunks → typing animation realtime
- Cron 20:00 → emit `checkin:reminder` → widget popup
- Crisis detect → emit `sos:auto-trigger` → widget auto mở Crisis Mode

#### 12.3.5. State sync giữa 3 surface (Widget ↔ Dashboard ↔ Zalo OA)

User có thể access Sol qua 3 nơi:

1. **Web Widget** — embed trên `sol.vn/*` (103 wiki page)
2. **Dashboard standalone** — `bothuocla.sol.vn` (app riêng, đầy đủ tính năng)
3. **Zalo OA** — chat 1-1 trên Zalo app

Cả 3 share **cùng 1 User record** qua identity binding:

```
Browser PC (lần 1):
  Sol.vn widget mở → deviceUid_A → User cmp1 (anonymous)

Mobile (Zalo):
  Follow OA Sol → zaloUserId_X → ZaloOAUser → User cmp2 (anonymous)

Bind Zalo trên Widget PC:
  Click "Liên kết Zalo" → OAuth → trả zaloUserId_X
  → backend MERGE: User cmp1 ← cmp2 (cmp2 deleted)
  → User cmp1.zaloUserId = X
  → ZaloOAUser.userId = cmp1
   ↓
Browser PC khác login Zalo:
  → fetch cùng User cmp1 → restore full state
```

**Cross-device sync via `syncBus`:**
- Widget emit "checkin:done" → Socket.IO broadcast tất cả device cùng userId
- Dashboard tab khác thấy update realtime (không cần F5)
- Mobile Zalo cũng nhận nếu user đang chat OA

#### 12.3.6. Widget vs Zalo OA — khác biệt strategic

| Tiêu chí | Web Widget | Zalo OA |
|----------|-----------|---------|
| Auth barrier | Anonymous-first (zero friction) | Phải follow OA Sol |
| Push proactive | Web Push (PWA) + Socket | ZNS template (mạnh hơn) |
| Reply latency | < 200ms (SSE stream) | < 5s (Zalo API) |
| Cost mỗi tin | 0 | ~ 300đ/tin ZNS |
| Reach (phone notif) | Chỉ khi user mở browser | ✓ Push notification mạnh |
| Privacy | Anonymous OK | Yêu cầu Zalo account |
| Stream typing | ✓ (AI thật chunk) | ✗ (fixed template) |
| Rich UI | ✓ (React component) | Text + button (3 max) |
| Voice playback | ✓ inline player | Phải click URL ra browser |
| Workbook journal | ✓ editor đầy đủ | Chỉ chat text |
| Crisis 90s timer | ✓ visual countdown | Text "đếm 1, 2, 3..." |

→ **Best practice:** User dùng **Zalo OA cho push** (Sol nhắc anh hằng ngày) + **Widget cho deep work** (workbook, voice, AI chat, checkin chi tiết).

#### 12.3.7. Widget Critical Moments (riêng cho web channel)

1. **First mount (anonymous)** — User mới vào sol.vn → silent create user → UX phải friction-less, không hỏi gì
2. **Recovery code prompt (D7)** — Soft prompt save mã 12 ký tự (`SOL-XXXX-XXXX-XXXX`) phòng mất localStorage
3. **Cross-device login (D14)** — User từ PC sang mobile → bind Zalo = khoá vàng portable
4. **Reconnect after offline** — Mất mạng → Socket.IO auto-reconnect, queue messages
5. **Multi-tab same browser** — User mở 2 tab sol.vn → cùng deviceUid → state shared qua localStorage event

### 12.4. Crisis Inputs (Event-triggered)

| Trigger | Source | Lưu vào | Severity |
|---------|--------|---------|----------|
| Click [🆘 SOS] button | Daily push hoặc welcome | `SOSAlert` (button) | high |
| Crisis keyword match | `intentRouter` | `SOSAlert` (keyword) | critical/high/medium auto |
| Click [Tôi đã vượt qua] | Sau SOS reply | `SOSAlert.status=resolved` | — |
| No-reply 3 days (cron) | Worker | `SOSAlert` (no_reply_3d) | low |
| Lapse > threshold | App lapse log | `LapseEvent` + trigger SOS recovery | medium |
| Admin manual | Dashboard | `SOSAlert` (admin_manual) | tuỳ admin |

### 12.5. Settings Updates (User-initiated)

| Action | API | Lưu vào |
|--------|-----|---------|
| Đổi giờ push | `PUT /api/users/me/settings` | `User.preferredPushHour` |
| Đổi tên/pronouns | `PUT /api/users/me` | `User.name/pronouns` |
| Pause journey | `POST /api/journey/pause` | `User.journeyStatus=paused` |
| Cancel journey | `POST /api/journey/cancel` | `cancelJourney()` |
| Mute N ngày | `PUT /api/messaging/profile` | `UserMessagingProfile.muteUntil` |
| Bind phone (OTP) | `POST /api/auth/phone/verify` | `User.phone` + `OtpCode` |
| Bind email | `POST /api/auth/email/verify` | `User.email` |
| Update quitReasons | `PUT /api/users/me/profile` | `User.quitReasons[]` |
| Update topTriggers | `PUT /api/users/me/profile` | `User.topTriggers[]` |
| Opt-out email | Click link trong email | `notificationPrefs.emailFunnel.optOut` |
| Unfollow Zalo OA | Zalo app | `ZaloOAUser.blockedAt` |


---

## XIII. SƠ ĐỒ LUỒNG DỮ LIỆU THEO THỜI GIAN

### 13.1. Sơ đồ tích luỹ data 52 ngày — text view

```
T-21 (Day 0 Onboarding):
  INPUT: name, journeyType, qDayDate, preferredPushHour
  WRITE: ZaloOAUser(1) + User(1) + UserState(1) + ScheduledPush(52)
  TỔNG: ~ 56 rows mới

T-21 → T-15 (Làm Quen, 7 ngày):
  INPUT: Reply chat, click wiki link, update profile dần
  WRITE: ZNSLog(1-2/ngày) + Message(0-5/ngày) + ScheduledPush UPDATE status
  TỔNG/ngày: 3-8 rows | 7 ngày: ~ 35 rows

T-14 → T-1 (Giảm Dần, 14 ngày):
  INPUT: CheckIn, CigaretteLog, ProgressJournal, button "Tôi đã vứt"
  WRITE: ZNSLog(1-2) + Message(3-8) + CheckIn(1) + CigaretteLog(1-N) + ProgressJournal(0-1)
  TỔNG/ngày: 7-15 rows | 14 ngày: ~ 150 rows

D0 (Q-Day):
  INPUT: SOS clicks (1-3), crisis keyword, victory, CrisisTimer
  WRITE: ZNSLog(3-5) + Message(10-20) + SOSAlert(1-3) + CrisisEvent(1-2) + CrisisTimerLog(1-5)
  SPIKE: 30-50 rows

D1 → D7 (Crisis Zone):
  INPUT: Daily CheckIn, SOS (D3 peak), heavy interaction
  WRITE: ZNSLog(2-4) + Message(5-15) + SOSAlert(0-2) + CheckIn(1) + CrisisTimerLog(0-3)
  TỔNG/ngày: 10-25 rows | 7 ngày: ~ 100-175 rows

D8 → D30 (Stabilization → Identity):
  Drop-off engagement gradual
  WRITE: ZNSLog(1-2) + Message(1-5) + CheckIn(0-1) + SOSAlert(0-1, peak D16)
  TỔNG/ngày: 3-7 rows | 23 ngày: ~ 80-160 rows

D31+ (Maintenance):
  WRITE: ZNSLog(1/tuần) + Message(3-10/tuần) + CheckIn(1-3/tuần) + LapseEvent(0-1/tuần)
  WEEKLY: 5-15 rows

═══════════════════════════════════════════════
TỔNG DATA 1 USER 52 NGÀY: ~ 540 rows
═══════════════════════════════════════════════
```

### 13.2. Sơ đồ event-driven write paths (Mermaid)

→ Xem file riêng [`SOL_DATA_FLOW_DIAGRAM.html`](./SOL_DATA_FLOW_DIAGRAM.html) — interactive Mermaid render trong browser. Bao gồm 12 sơ đồ:

1. Gantt timeline 52 ngày
2. Hướng luồng dữ liệu (User ↔ Backend ↔ External)
3. Flow Follow OA → Enroll
4. Flow Daily push cron fire
5. Flow SOS trigger + response
6. Flow Lapse recovery
7. State machine JourneyStatus
8. State machine ScheduledPush
9. State machine SOSAlert
10. State machine UserState
11. ER diagram 39 tables
12. Data accumulation chart

### 13.3. Retention policy (auto-cleanup)

| Table | Retention | Action |
|-------|-----------|--------|
| Message | 12 tháng | Auto-delete |
| CheckIn | 24 tháng | Anonymize |
| ZNSLog | 6 tháng | Aggregate → cache |
| ScheduledPush | 3 tháng | Auto-delete sau status final |
| SOSAlert | 24 tháng | Anonymize (legal y tế) |
| CrisisTimerLog | 6 tháng | Auto-delete |
| CigaretteLog, LapseEvent, ProgressJournal | Toàn đời | Giữ (user own) |
| OtpCode | 24 giờ | Auto-delete |
| EmailVerificationToken | 7 ngày | Auto-delete |
| User (deleted) | 30 ngày soft | Hard-delete |

---

## XIV. DATABASE SCHEMA — INVENTORY 39 TABLES

Phân theo domain:

### 14.1. Core User (5 tables)
`User`, `UserState`, `Cohort`, `UserMessagingProfile`, `MessagingPolicy`

### 14.2. Communication (8 tables)
`ZaloOAUser`, `ZNSLog`, `ZaloTemplate`, `ScheduledPush`, `Message`, `Notification`, `PushSubscription`, `OtpCode`

### 14.3. Crisis & Health (5 tables)
`SOSAlert`, `CrisisEvent`, `CrisisTimerLog`, `LapseEvent`, `CigaretteLog`

### 14.4. Engagement (11 tables)
`CheckIn`, `ExerciseEntry`, `ProgressJournal`, `Confession`, `ConfessionReaction`, `ConfessionRead`, `KhangQuestion`, `KhangQuestionUpvote`, `KhangVoice`, `KhangVoiceListen`, `KhangVoiceReaction`

### 14.5. Content (3 tables)
`ContentItem`, `ContentItemRevision`, `CannedReply`

### 14.6. Auth & Payment (5 tables)
`EmailVerificationToken`, `PaymentLog`, `RefundRequest`, `VoiceMessage`, `VoiceDelivery`

### 14.7. Settings (2 tables)
`AppSetting`, `AnonymousStatsCache`

---

## XV. STATE MACHINES

4 state machines chính (chi tiết Mermaid diagrams trong `SOL_DATA_FLOW_DIAGRAM.html`):

1. **JourneyStatus** — NULL → active → paused/relapsed/graduated
2. **ScheduledPush.status** — pending → sending → sent/failed/cancelled/expired
3. **SOSAlert.status** — pending → auto_responded → admin_responding → resolved
4. **UserState.state** — IDLE / CHECKIN_FLOW / EXERCISE_FLOW / AI_CHAT / CRISIS_MODE

---

## XVI. CHANGELOG TÀI LIỆU

- **2026-05-15** v1.0 — Initial draft sau Sprint 1-3 complete.
- **2026-05-15** v1.1 — Bổ sung Section XII (User → Sol input flow), XIII (data flow timeline), XIV (DB schema inventory), XV (state machines), XVI (changelog).
- **2026-05-15** v1.2 — Bổ sung Section 12.3 Web Widget Chat (15 touchpoint, anonymous-first auth, Socket.IO realtime, state sync 3 surface, comparison với Zalo OA).
- TODO: cập nhật sau pilot 50 user (Tuần 4 từ launch).

---

**Sources khoa học chính:**
- Cochrane Tobacco Addiction Group reviews (2018-2024)
- Marlatt G.A., Donovan D.M. (2005). *Relapse Prevention*. Guilford Press.
- Hughes J.R. (2004). Effects of abstinence from tobacco. *Nicotine & Tobacco Research*.
- Doll R., Peto R. (2004). Mortality in relation to smoking: 50 years' observations. *BMJ*.
- Tombor I. et al. (2015). Self-identity and stages of change in smoking cessation. *Drug and Alcohol Dependence*.
- Lally P. et al. (2010). How are habits formed: Modelling habit formation. *European Journal of Social Psychology*.
- Hajek P. et al. (2010). Withdrawal-oriented therapy. *Addiction*.
- NIDA Research Report Series (2019). Tobacco, Nicotine, and E-Cigarettes.

— *Sol Engineering biên soạn theo yêu cầu Khang Sol — reference cho team.*

---

## XVII. CHIẾN LƯỢC ĐA KÊNH — Zalo OA vs Web Widget vs Web App vs Backup channels

Đây là chương phân tích chiến lược về vai trò TỪNG kênh, cách bổ sung nhau, thay thế nhau, chi phí và resilience khi 1 kênh bị sập.

### 17.1. Tổng quan 5 kênh giao tiếp

| Kênh | Direction | Strength | Weakness | Best for |
|------|-----------|----------|----------|----------|
| **Zalo OA** (ZNS + Free OA) | Two-way | Phone reach mạnh, push notification ngay cả khi browser đóng | Cost ~300đ/tin, phụ thuộc Zalo API uptime, bị giới hạn 48h window | Daily push, SOS reply, milestone celebration |
| **Web Widget** (embed sol.vn) | Two-way | Anonymous-first, rich UI, AI stream realtime, 0đ/tin | Chỉ active khi user mở browser | Đọc wiki + chat sâu, contextual help |
| **Web App** (bothuocla.sol.vn) | Two-way | Full features (workbook, voice, checkin chi tiết), PWA install | Cần user proactive mở app | Deep work, daily ritual |
| **Email** | One-way (Sol→User) | Long-form, archive, deliverable đảm bảo | Latency cao, không realtime | Milestone certificate, magic link, weekly digest |
| **SMS** (future) | One-way | Universal — không cần app/internet | Cost cao (~700-1500đ/tin), VN regulation strict | Backup khi Zalo unreachable, emergency |
| **Telegram** (admin only) | Sol→Khang | Realtime push cho Khang admin | Không phải user-facing | SOS critical alert cho Khang |

### 17.2. Vai trò chính từng kênh — Strategic role matrix

```
┌─────────────────────────────────────────────────────────────────┐
│                  KÊNH                  ROLE                       │
├─────────────────────────────────────────────────────────────────┤
│  Zalo OA            =  REACH (kéo user đến)                       │
│  Web Widget         =  ENGAGEMENT (giữ user lâu trên wiki)        │
│  Web App            =  DEPTH (workbook, voice, deep ritual)       │
│  Email              =  CEREMONY (milestone certificate, archive)  │
│  SMS                =  SAFETY NET (khi Zalo down)                 │
│  Telegram (admin)   =  ALERT (Khang nhận SOS critical real-time)  │
└─────────────────────────────────────────────────────────────────┘
```

### 17.3. Cách 3 kênh chính BỔ SUNG nhau (Complementary)

**Zalo OA + Widget + Web App KHÔNG cạnh tranh — chúng là 3 lớp khác nhau của cùng 1 trải nghiệm:**

#### Lớp 1: Zalo OA = "Tiếng nhắc" (Top of mind)

- Sáng 7h: Sol nhắc anh qua ZNS — "Hôm nay là Ngày 5 anh không hút. Bài chip: thèm ăn..."
- Phone notification rung — anh để ý ngay cả khi đang nhậu
- Click button "Đọc đầy đủ" → mở browser → sol.vn wiki

**→ Zalo là cầu nối user đến Sol mỗi ngày.** Không có Zalo, user dễ quên Sol.

#### Lớp 2: Web Widget = "Cánh tay phải" (Contextual help)

- User đọc wiki sol.vn/ngay-5-them-an → có thắc mắc → bubble góc nháy → chat hỏi Sol
- AI Claude reply realtime (stream chunks) — < 200ms latency
- Context-aware: Sol biết user đang đọc bài D5 → reply chính xác topic đó

**→ Widget biến mỗi bài wiki thành cuộc tư vấn 1-1.** Không có widget, user chỉ đọc thụ động.

#### Lớp 3: Web App = "Phòng làm việc" (Deep ritual)

- User mở bothuocla.sol.vn mỗi tối → checkin (mood, craving 0-10) → workbook journal
- Listen Khang voice 2 phút (audio inline) → react ❤
- Crisis timer 90 giây visual countdown khi thèm
- Lapse log chi tiết (giờ, ngữ cảnh, trigger)

**→ Web App là nơi user xây habit + tự reflect.** Không có app, user mất ritual.

#### Sequence điển hình 1 ngày của user:

```
07:00 — Zalo OA push daily chip (ZNS)        ← Zalo
       ↓ Click "Đọc đầy đủ"
07:02 — Mở sol.vn wiki page                   ← Web
       ↓ Đọc + có thắc mắc
07:05 — Click Widget bubble → chat Sol        ← Widget
       ↓ AI reply realtime
07:10 — User đi làm (rời browser)             ← Phase mất kết nối
       ↓
10:00 — Random tip ZNS (giờ giải lao)         ← Zalo
       ↓
20:00 — Mở Web App → checkin tối             ← Web App
       ↓ Workbook journal
20:15 — Listen Khang voice 2 phút            ← Web App
       ↓
21:00 — Random tip ZNS (giờ nhậu)            ← Zalo
       ↓ User đang khó → click [SOS]
21:01 — Auto reply hotline 02439931800        ← Zalo + Web Widget popup
       ↓
21:05 — User dùng Crisis Timer 90s            ← Web App
       ↓ Vượt qua
21:07 — Click "Tôi đã vượt qua"               ← Web App
       ↓ Resolve SOS
21:08 — Sol chúc mừng + Khang voice          ← Zalo + Web App
```

→ **3 kênh xen kẽ trong 1 ngày** — mỗi kênh đóng vai trò khác.

### 17.4. Cách 3 kênh THAY THẾ nhau (Substitution / Failover)

Khi 1 kênh không khả dụng, các kênh khác đảm nhiệm thay:

#### Scenario A: Zalo OA bị sập (Zalo API down)

**Symptom:** ZNS send fail. Cron `fireDuePushes` fail toàn batch với error `ZNS_API_FAIL`.

**Sol response chain (auto):**

```
fireDuePushes() detect Zalo API down (3 fails liên tiếp trong 5 phút)
   ↓
Switch fallback mode:
   1. Web Push (PWA) — gửi notification qua browser nếu user đã subscribe
   2. Email digest — gom 2-3 daily chip thành 1 email gửi cuối ngày
   3. SMS (cho user có phone) — cho critical message (D3 Bức Tường, D16 đi nhậu, SOS)
   ↓
Admin dashboard hiện warning banner:
   "⚠ Zalo OA đang gián đoạn. Fallback qua Web Push/Email đang hoạt động.
    Last successful: 14:23 (2 giờ trước)."
   ↓
Khi Zalo recover (cron retry mỗi 5 phút):
   - Tự động resume ZNS push
   - Tin trễ trong window 7 ngày sẽ fire (status pending → sent)
   - Tin > 7 ngày → expire (không spam user)
```

**Impact:** User KHÔNG bị mất tin nếu có email/phone backup. Worst case: nhận chậm vài giờ.

#### Scenario B: Web App down (bothuocla.sol.vn 500)

**Symptom:** User mở web app → blank page hoặc 503.

**Sol response chain:**
- Static fallback page hiển thị: "Sol đang bảo trì. Đang hỏi anh ổn không? Tin nhắn tới Zalo OA / chat widget vẫn hoạt động."
- Zalo OA + Widget vẫn chạy độc lập (Socket.IO + REST API riêng từ backend cluster)
- Lapse log + Checkin tạm save vào localStorage → sync lại khi app lên

**Impact:** User mất tính năng workbook/voice/deep ritual, nhưng vẫn nhận push + chat được.

#### Scenario C: User unfollow Zalo OA

**Symptom:** `ZaloOAUser.blockedAt = now()` — Sol không thể push qua Zalo nữa.

**Sol response chain:**
- Switch sang Email-first mode: gửi 1 email/ngày (thay 1 ZNS)
- Web Widget vẫn hoạt động (user vẫn vào sol.vn được)
- Web App vẫn hoạt động qua deviceUid
- Sau 7 ngày unfollow → email "Anh ổn không? Sol vẫn ở đây nếu cần" + link "Re-follow OA"
- Crisis keyword detect trên widget/app → trigger email Khang (vì không push Zalo được)

**Impact:** User mất push notification mạnh, nhưng vẫn có 3 kênh fallback.

#### Scenario D: User mất phone (mất Zalo + SMS)

**Symptom:** User báo "tôi đổi số" hoặc mất phone.

**Recovery flow:**
- User vào sol.vn từ máy bất kỳ → click "Đã có tài khoản? Khôi phục" → nhập **mã recovery 12 ký tự** (`SOL-XXXX-XXXX-XXXX`) lúc onboarding
- Backend verify hash → cấp JWT mới → bind device mới
- Update phone qua OTP nếu cần

**Impact:** User restore được account, không mất hành trình. Đây là lý do mã recovery code là **lifeline cuối cùng**.

#### Scenario E: Backend database down

**Symptom:** PostgreSQL crash. Tất cả API trả 500.

**Sol response chain:**
- Static fallback responses từ CDN (Cloudflare cached canned reply)
- Widget hiển thị: "Em đang gặp sự cố nhỏ. Đây là 5 bài self-help từ Khang..."
- Cron tự pause (không fire ZNS để tránh gửi tin lỗi)
- Khang nhận Telegram alert "🚨 DB down" → on-call respond

**Impact:** Service degraded mode — user vẫn có content tĩnh, không có personalization.

### 17.5. Chi phí phân tích — Per User / Per Month / Per Channel

#### Cost mỗi tin nhắn

| Kênh | Cost/message | Setup | Monthly fixed |
|------|--------------|-------|---------------|
| ZNS Zalo | 300-500đ (Tag 2) | 0 | Deposit ~5-10tr (Zalo Business) |
| Free OA (48h window) | 0đ | 0 | 0 |
| Web Push (PWA) | 0đ | 0 | 0 (cần HTTPS) |
| Widget chat (Socket.IO) | 0đ | 0 | VPS cost |
| AI Claude reply | ~50-200đ (tuỳ length) | 0 | API key Anthropic |
| Email (SendGrid free) | ~0đ | 0 | Free up to 100/day |
| Email (SendGrid paid) | ~5-10đ | 0 | $20/m (40k email) |
| SMS (Viettel) | 700-1500đ | 0 | Per pay-as-go |
| Telegram (admin) | 0đ | 0 | 0 |

#### Cost per user qua 52 ngày journey

| Tier | Channels used | Estimated cost/user |
|------|---------------|---------------------|
| **Free tier** (Zalo + Web only) | ZNS 1/ngày (52) + AI reply (10 lần) | **52 × 300đ + 10 × 100đ = 16.600đ** |
| **Premium** (full features) | + Email weekly + SMS backup (5 lần critical) | 16.600 + 13 × 10đ + 5 × 1000đ = **21.730đ** |
| **Heavy crisis user** | + Extra ZNS milestone + Khang voice | + 10 ZNS = **24.730đ** |

**Scale estimate:**
- Pilot 50 user: ~ 1.2 triệu VND
- 1.000 user: ~ 22 triệu VND
- 10.000 user: ~ 220 triệu VND
- 100.000 user: ~ 2.2 tỷ VND (cần Zalo enterprise tier giảm 30-50%)

#### Tier hoá theo cost

Đề xuất 3 tier kinh doanh:

| Tier | Giá | Tính năng |
|------|-----|----------|
| **Free** | 0đ | 7+14+30 daily push Zalo + Web Widget + Web App |
| **Premium** (49k/tháng) | ~ 50k | + Email digest + SMS critical + Khang voice 2 mốc/tuần |
| **VIP** (199k/tháng) | ~ 200k | + Khang 1-1 voice call 30 phút/tuần + Custom plan |

→ Cost model: Free tier "lose" 16.600đ/user nhưng vẫn ROI nếu 20% upgrade Premium.

### 17.6. Tiện lợi (Convenience) — User experience matrix

| Tiêu chí | Zalo OA | Web Widget | Web App | Email | SMS |
|----------|---------|-----------|---------|-------|-----|
| **Cần install app riêng?** | ✗ (đã có Zalo sẵn) | ✗ (browser) | ✗ (PWA) | ✗ | ✗ |
| **Cần đăng ký tài khoản?** | Phải có Zalo | ✗ (anonymous) | ✗ (anonymous) | Phải có email | Phải có SĐT |
| **Phone notification?** | ✓ (mạnh nhất) | Chỉ Web Push (nếu enabled) | Chỉ Web Push | ✗ | ✓ |
| **Đọc khi đang nhậu/họp?** | ✓ (notif rung) | ✗ | ✗ | ✗ | ✓ (silent) |
| **Reply nhanh?** | ✓ (text quick) | ✓ | ✓ | ✗ (cồng kềnh) | ✗ |
| **Rich media (voice/image)?** | Hạn chế | ✓ | ✓ | ✓ | ✗ |
| **Offline mode?** | Cached message | ✗ | ✓ (PWA) | ✓ | ✓ |
| **Privacy concern?** | Trung bình (Zalo có data) | Cao (anonymous) | Cao | Trung bình | Thấp |
| **Onboarding friction?** | Trung bình (follow OA) | **Zero** | Zero | Phải nhập email | Phải bind SĐT |

**Insight:** Zalo + Widget là combo "low friction + high reach". Web App + Email là combo "high depth + ceremony".

### 17.7. Scenario: User ưu tiên Zalo nhiều hơn

**Profile:** User dành 70%+ tương tác qua Zalo, ít vào sol.vn hoặc Web App.

**Behavior signals:**
- `ZaloOAUser.totalMsgIn` > 50 trong 30 ngày
- `User` không có session sol.vn (no widget mount event)
- `CheckIn` từ app rất thưa (1-2 lần/tuần)

**Sol auto-adapt strategy:**

1. **Tăng ZNS frequency:** từ 1 → 2 tin/ngày (sáng + tối)
2. **Giảm Web Push:** vì user không mở browser → spam không cần thiết
3. **Email weekly digest:** 1 email/Chủ nhật gom highlight tuần (thay Web App workbook)
4. **Khang voice qua Zalo:** thay vì link → gửi audio file trực tiếp ZNS
5. **SOS reply tập trung Free OA:** dùng tối đa 48h window
6. **Daily chip ngắn hơn:** giảm 280 → 150 ký tự (vừa với phone glance)

**Trade-off:**
- ✓ User happy — Sol "respect" channel preference
- ✗ Mất deep work (no workbook, no voice replay) → recovery rate có thể thấp hơn 5-10%

→ **Mitigation:** D7 milestone email gửi link Web App với pitch "Mở app 5 phút thôi — anh đã vượt 1 tuần rồi"

### 17.8. Scenario: User ưu tiên Web/App nhiều hơn

**Profile:** User unfollow Zalo OA hoặc ít tương tác Zalo, dành nhiều thời gian trên Web App.

**Behavior signals:**
- `User.zaloUserId` null hoặc `ZaloOAUser.blockedAt` not null
- `CheckIn` daily đều đặn
- `ProgressJournal` có entries
- `KhangVoiceListen` count cao

**Sol auto-adapt strategy:**

1. **Web Push priority:** Subscribe Web Push trong onboarding → push qua browser thay Zalo
2. **In-app reminder:** Daily chip render trong Widget khi user mở wiki sol.vn
3. **Email digest tăng tần suất:** 2-3 email/tuần (đáng tin cậy hơn Web Push)
4. **Workbook gamification:** Streak badge cho daily checkin
5. **Khang voice unlock:** thưởng voice mới sau 7 ngày checkin
6. **AI chat depth:** mở rộng context window cho AI reply (200 tin gần đây)

**Trade-off:**
- ✓ User engagement cao, dữ liệu phong phú (CheckIn + Journal)
- ✗ Reach thấp khi browser đóng → có thể bỏ lỡ Bức Tường D3 nếu user ngày đó không mở

→ **Mitigation:** Cron 18h check user không opened Web Push trong 6h → fallback gửi email + SMS (nếu critical day).

### 17.9. Scenario: User mixed (lý tưởng)

**Profile:** Dùng đều cả 3 surface. Đây là cohort engagement cao nhất.

**Strategy:** Giữ status quo, không adapt riêng. Cron + scheduler handle bình thường.

**KPI:**
- D30 graduation rate: 60-70% (vs 40-50% single-channel)
- D365 retention: 30-35% (vs 15-20%)

### 17.10. Scenario: Zalo OA bị Zalo cấm tài khoản

**Worst-case scenario** (rất hiếm nhưng nguy hiểm):

**Triggers có thể:**
- Tin tự động bị flag spam
- User report OA quá nhiều
- Vi phạm Zalo Business policy
- Template bị reject hàng loạt

**Recovery plan (Business Continuity):**

1. **Switch toàn bộ user sang Email + SMS** trong 24h
2. **Notice trong Web App:** "Sol Zalo đang gián đoạn. Chúng tôi dùng email + SMS tạm thời."
3. **Restore data từ backup:** ScheduledPush vẫn còn → reschedule qua Email
4. **Appeal Zalo:** Khang liên hệ Zalo Business support
5. **Backup OA account thứ 2:** Setup sẵn 1 OA dự phòng (sub-account)
6. **Worst case:** Migrate user sang OA mới — gửi email mời follow OA backup

**Impact assessment:**
- Lost reach: 60-70% (Zalo là channel mạnh nhất)
- Recovery time: 1-3 ngày (Zalo appeal) hoặc 1 tuần (OA mới)
- User churn risk: 20-30% nếu downtime > 1 tuần

→ **Mitigation từ thiết kế:**
- Multi-channel arch (không phụ thuộc 1 kênh)
- Email collection từ Day 0 (bind email là khuyến khích)
- Recovery code 12 ký tự (lifeline cuối)

### 17.11. Decision Matrix — Khi nào dùng kênh nào?

| Loại tin | Kênh chính | Kênh backup | Lý do |
|----------|-----------|------------|-------|
| **Daily chip** (1/ngày 7AM) | Zalo ZNS | Email (nếu Zalo down) | Reach mạnh + cost reasonable |
| **Random tip** (5 khung giờ) | Zalo Free OA (in 48h window) | Web Push | 0đ + realtime |
| **Milestone D7/14/21/30** | Zalo ZNS + Email | Web Push | Celebrate ceremony cần stable |
| **SOS critical** (đau ngực, ho ra máu) | Zalo Free OA + Telegram (Khang) | Email + SMS | Phải gửi NGAY |
| **SOS high** (sắp hút) | Zalo Free OA | Widget popup nếu user online | < 5s response |
| **Daily check-in reminder** | Web Push (PWA) | Zalo ZNS | Soft reminder, không xâm phạm |
| **Workbook quote (Khang voice)** | Web App in-app | Email link | Cần rich audio player |
| **Magic link login admin** | Email | SMS (nếu email block) | Long-form OTP secure |
| **Lapse confirmation** | Web App in-app form | — | Cần UI chi tiết (giờ, trigger, count) |
| **Re-engagement (no-reply 3d)** | Zalo ZNS gentle | Email + SMS | Phải reach mạnh kéo lại |
| **Newsletter weekly** | Email | — | Long-form, không gấp |

### 17.12. Architectural principle — Channel-agnostic core

Sol backend được thiết kế **channel-agnostic** — content + logic core không phụ thuộc kênh nào cụ thể:

```
                    ┌──────────────────────┐
                    │  Sol Backend Core    │
                    │  (User Journey,      │
                    │   Content Library,   │
                    │   AI, Crisis Logic)  │
                    └─────────┬────────────┘
                              │
              ┌───────────────┼───────────────┬──────────────┐
              ▼               ▼               ▼              ▼
        ┌──────────┐    ┌──────────┐   ┌──────────┐   ┌──────────┐
        │ Zalo     │    │ Web      │   │ Web App  │   │ Email +  │
        │ Adapter  │    │ Widget   │   │ Adapter  │   │ SMS      │
        │          │    │ Adapter  │   │          │   │ Adapter  │
        └──────────┘    └──────────┘   └──────────┘   └──────────┘
              │               │               │              │
              ▼               ▼               ▼              ▼
            Zalo            Browser          PWA           SMTP+
            OpenAPI                                       VietelSMS
```

**Lợi ích:**
- Thêm kênh mới (Viber, Line, Telegram public) → chỉ cần 1 adapter
- Đổi vendor (SendGrid → Mailgun) → chỉ thay adapter
- A/B test channel: 50% user nhận Zalo, 50% Email → so sánh retention
- Future: thêm Voice call (Twilio) chỉ cần adapter mới

### 17.13. Tóm tắt — 1-page summary

```
┌─────────────────────────────────────────────────────────────┐
│  CHIẾN LƯỢC ĐA KÊNH SOL — 1-page summary                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  3 KÊNH CHÍNH:                                               │
│  • Zalo OA       = REACH (kéo user đến mỗi ngày)             │
│  • Web Widget    = ENGAGEMENT (giữ user trên wiki sâu hơn)   │
│  • Web App       = DEPTH (workbook, voice, ritual)           │
│                                                              │
│  3 KÊNH BACKUP:                                              │
│  • Email         = CEREMONY + Backup khi Zalo down           │
│  • SMS           = SAFETY NET cho critical message           │
│  • Telegram      = ADMIN alert (Khang nhận SOS critical)     │
│                                                              │
│  COST/USER 52 NGÀY: ~ 16-25k VND (free tier)                 │
│                                                              │
│  FAILOVER CHAIN:                                             │
│  Zalo down → Web Push → Email → SMS                          │
│                                                              │
│  USER PREFERENCE:                                            │
│  Heavy Zalo  → tăng ZNS 2x, gửi voice qua Zalo               │
│  Heavy Web   → priority Web Push, in-app reminder            │
│  Mixed       → status quo (engagement tối ưu)                │
│                                                              │
│  WORST CASE (Zalo cấm OA):                                   │
│  Switch sang Email + SMS trong 24h                           │
│  Setup backup OA #2 sẵn (mitigation)                         │
│                                                              │
│  ARCHITECTURAL PRINCIPLE:                                    │
│  Channel-agnostic core + adapter per channel                 │
│  → Thêm/đổi kênh không cần rewrite logic                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

