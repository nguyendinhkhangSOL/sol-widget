# Sol — Data Flow 2 Chiều với User
## Anh Hùng nhận gì + cập nhật gì + qua đâu

**Ngày:** 2026-05-08 (bổ sung cuối session)
**Mục đích:** Mô tả CỤ THỂ data flow giữa Sol ↔ Anh Hùng. Mỗi tương tác có UI element cụ thể, frequency, trực tiếp/gián tiếp.

---

## Phần 1 — SOL → ANH HÙNG (Anh nhận gì)

### A. TRỰC TIẾP — anh chủ động mở/click/yêu cầu

| # | Anh nhận gì | Qua đâu (UI) | Frequency | Sản phẩm |
|---|---|---|---|---|
| 1 | **Voice Khang Day 0** welcome | Auto-play khi onboard lần đầu | 1 lần | Sol Khám Phá |
| 2 | **Voice Khang library** theo chủ đề | Tab **"Nghe"** — list voice + filter | Anh chọn nghe khi muốn | Sol Khám Phá+ |
| 3 | **Báo cáo Day 3 quick win** | Dashboard widget khi mở app sáng Day 3 | 1 lần | Sol Khám Phá |
| 4 | **Báo cáo Day 7 đầy đủ** | Dashboard widget + email | 1 lần | Sol Khám Phá |
| 5 | **Báo cáo Day 14 milestone** | Dashboard widget + email | 1 lần | Sol Start |
| 6 | **Khoảng Lặng confessions** | Tab **"Đọc"** — feed list | Anh đọc khi muốn | Sol Khám Phá+ |
| 7 | **Anonymous Stats Feed** "Tuần này trong Sol" | Dashboard widget góc trên | Mỗi lần mở app | Sol Khám Phá+ |
| 8 | **Control Score** + Bậc Lấy Lại | Dashboard widget chính | Mỗi lần mở app | All tier |
| 9 | **AI chat reply** | Chat interface (bottom nav) | Anh gửi → reply trong giây | All tier |
| 10 | **Hỏi Khang trả lời qua Voice broadcast** | Tab **"Hỏi"** — list voice replies | Anh nghe khi muốn | Sol Start+ |
| 11 | **Crisis Timer 90s + voice** | Button "Tôi đang thèm" trong dashboard | Anh bấm khi crave | Sol Start+ |
| 12 | **Trigger Playbook 4 chiến thuật** | Tab "Sổ tay" / Workbook | Anh tự mở tham khảo | Sol Start+ |
| 13 | **Tin nhắn riêng Khang** | Inbox riêng trong Profile | 1-2 lần/tháng (Sol Trọn Vẹn) | Sol Trọn Vẹn |

### B. GIÁN TIẾP — Sol đẩy đến anh, anh không cần chủ động

| # | Anh nhận gì | Qua đâu | Frequency |
|---|---|---|---|
| 14 | **Push notification** "Hôm qua bao nhiêu điếu?" | Mobile/desktop notification | Mỗi sáng 7h |
| 15 | **Email Day 7 invite Sol Start** | Gmail/email anh | 1 lần |
| 16 | **Email Day 14 invite Sol Control** | Gmail/email anh | 1 lần |
| 17 | **Push notification "Voice mới của Khang"** | Notification | Mỗi tuần (Sol Control) |
| 18 | **Push notification lapse-friendly** | Notification | Khi anh log "đã hút" + 24h sau nếu im lặng |
| 19 | **Push Q-Day morning** | Notification 6h sáng Q-Day | 1 lần (ngày anh chọn) |
| 20 | **Push milestone** (7/14/30/60/52 ngày (51d Sol-active + Day 52 lễ tốt nghiệp)) | Notification | Mỗi mốc |
| 21 | **Email báo cáo Day 7/14** | Gmail | 2 lần |
| 22 | **Voice auto-play khi log lapse** | App tự open voice khi anh log "đã hút" | Khi lapse |
| 23 | **Voice auto-play sáng Q-Day** | App tự open khi mở app | Q-Day morning |

→ Tổng: **23 luồng output** từ Sol đến anh Hùng. **13 trực tiếp + 10 gián tiếp**.

---

## Phần 2 — ANH HÙNG → SOL (Anh cập nhật gì)

### C. TRỰC TIẾP — anh chủ động nhập/click

| # | Anh cập nhật gì | Qua đâu (UI) | Frequency | Friction |
|---|---|---|---|---|
| 1 | **Số điếu hôm qua** | Slider 0-50 trong push notification | Mỗi sáng | 5 giây ⭐ |
| 2 | **Trigger gắn cho điếu** | Tap chọn từ list 8 trigger preset | Mỗi điếu | 3 giây |
| 3 | **Crave timestamp + delay** | Button "Tôi đang thèm" → Crisis Timer | Khi crave | 2 giây |
| 4 | **Q-Day chọn ngày** | Calendar picker | 1 lần (đổi được) | 30 giây |
| 5 | **AI chat câu hỏi** | Text input bottom nav | Khi anh muốn | Anh gõ |
| 6 | **Hỏi Khang câu hỏi anonymous** | Text submit form trong tab "Hỏi" | 1-2 lần/tháng | Anh gõ |
| 7 | **Khoảng Lặng confession viết** | Text submit form trong tab "Đọc" | Hiếm (1-3 lần) | Anh gõ |
| 8 | **Pledges viết** | Text input Workbook | Day 0-7 | 5 phút |
| 9 | **Plan B cho 5 trigger** | Text input Workbook | Day 8-14 | 10 phút |
| 10 | **React Khoảng Lặng** | Tap 👍 / 🙏 / "Tôi cũng vậy" | Khi đọc | 1 giây ⭐ |
| 11 | **React Voice của Khang** | Tap 👍 sau nghe | Sau mỗi voice | 1 giây ⭐ |
| 12 | **Đặt tên tag riêng cho trigger** | Text input | 1 lần (optional) | 30 giây |
| 13 | **Vote câu hỏi trong Hỏi Khang** | Tap 👍 trên câu hỏi của người khác | Khi đọc | 1 giây |
| 14 | **Báo cáo lapse manual** | Button "Tôi vừa hút" | Khi lapse | 5 giây |
| 15 | **Hủy/đổi tier** | Settings → Pricing | Khi cần | 30 giây |
| 16 | **Yêu cầu refund** | Settings → Hỗ trợ | Khi cần | Chuyển khoản 7 ngày |
| 17 | **Form Feedback / Bug report** | Settings → Góp ý | Khi cần | Anh gõ |

### D. GIÁN TIẾP — Sol thu data từ behavior anh (anh không biết hoặc không chủ động)

| # | Sol thu gì | Qua đâu | Mục đích |
|---|---|---|---|
| 18 | **Thời điểm anh mở app** | App open events | Phân tích "anh dễ tổn thương lúc nào" |
| 19 | **Duration mở app** | Session tracking | Engagement metric |
| 20 | **Voice nghe full hay skip** | Audio play tracking | Hiệu quả voice nào |
| 21 | **Khoảng Lặng đọc bài nào** | Read tracking | Confessions resonant nhất |
| 22 | **Crisis Timer outcome** | Delay duration + sau đó hút hay không | Hiệu quả timer |
| 23 | **App open frequency** | Daily/weekly returns | Retention metric |
| 24 | **Time of day pattern** | Open times analysis | Trigger time discovery |
| 25 | **Lapse pattern correlation** | Lapse timing + context | Predict trigger |
| 26 | **AI chat topic** | NLP topic categorization | Insights cho Hỏi Khang queue |
| 27 | **Search/filter usage** | Voice library queries | Content gap analysis |
| 28 | **Tier upgrade timing** | Conversion funnel | Optimize email Day 7/14 |
| 29 | **Lapse-recovery time** | Time from lapse → quay lại app | Retention metric |
| 30 | **Notification open rate** | Push tracking | Optimize timing |

→ Tổng: **30 luồng input** anh Hùng → Sol. **17 trực tiếp + 13 gián tiếp**.

---

## Phần 3 — Map theo channel Sol (7 kênh)

### Kênh 1 — Chat với Sol (AI)

**Input từ anh:**
- Câu hỏi text bất kỳ
- React 👍 sau câu trả lời

**Output cho anh:**
- Reply text (CBT-tone)
- Voice Khang clip nếu phù hợp
- Crisis mode khi detect emergency

### Kênh 2 — Voice của Khang Library

**Input từ anh:**
- Click play voice
- Filter chủ đề
- React 👍 sau nghe
- Bookmark voice quan trọng

**Output cho anh:**
- 50+ voice clip theo chủ đề
- Voice mới push notification mỗi tuần (Sol Control)
- Listening history

### Kênh 3 — Khoảng Lặng

**Input từ anh:**
- Đọc passive
- React 👍 / 🙏 / "Tôi cũng vậy"
- Submit confession (text, anonymous)

**Output cho anh:**
- Feed 100+ confession anonymous
- Stats "X anh em đã đọc bài này"
- Filter mới nhất / được đọc nhiều

### Kênh 4 — Anonymous Stats Feed

**Input từ anh:**
- Không có direct input — Sol thu aggregated từ all users

**Output cho anh:**
- "Tuần này 214 anh em mở Sol sau 11h đêm"
- "63 anh em vừa hút lại hôm qua"
- Numbers update real-time

### Kênh 5 — Hỏi Khang ⭐

**Input từ anh:**
- Submit câu hỏi text anonymous
- Vote 👍 câu hỏi của người khác (?)

**Output cho anh:**
- Voice reply broadcast Khang post 1-2/tuần
- Notification "Khang vừa trả lời câu hỏi tuần này"
- Library tích lũy theo thời gian

### Kênh 6 — Tin Nhắn Riêng Khang (Sol Trọn Vẹn)

**Input từ anh:**
- Direct message Khang text/voice

**Output cho anh:**
- Khang reply within 48h
- Voice/text both OK

### Kênh 7 — Form Feedback

**Input từ anh:**
- Bug report / feature request

**Output cho anh:**
- Email confirm "đã nhận"
- Update khi feature ready

---

## Phần 4 — Theo flow journey anh Hùng

### Day 0 — Onboard

| Thời điểm | Anh làm gì | Sol làm gì |
|---|---|---|
| 23:18 | Click "Bắt đầu" | Tạo deviceUid, tạo profile anonymous |
| 23:18 | (passive) | Auto-play voice Khang Day 0 (output) |
| 23:19 | Slider điếu = 22 | Lưu baseline (input trực tiếp) |
| 23:20 | (passive) | Sol thu: time of onboard (gián tiếp) |
| 23:20 | Đóng app | Sol thu: session 2 phút (gián tiếp) |

### Day 1-2 — Quan sát

| Thời điểm | Anh làm gì | Sol làm gì |
|---|---|---|
| 7:00 | (passive) | Push notification "Hôm qua bao nhiêu?" (output gián tiếp) |
| 7:30 | Tap notification, slider | Lưu số điếu Day 1 (input trực tiếp) |
| 12:00 | Click tab "Đọc" | Show Khoảng Lặng feed (output) |
| 12:05 | Đọc 5 confession | Sol thu read tracking (input gián tiếp) |
| 12:06 | Tap 🙏 trên 1 bài | Lưu reaction (input trực tiếp) |

### Day 3 — Quick Win

| Thời điểm | Anh làm gì | Sol làm gì |
|---|---|---|
| 7:00 | (passive) | Push "Báo cáo 3 ngày đã sẵn" (output gián tiếp) |
| 7:30 | Mở app | Show báo cáo Day 3 widget (output trực tiếp) |
| 7:32 | Đọc báo cáo | Sol thu read time (gián tiếp) |
| 7:33 | Click Sol Start invite | Mở payment flow (output trực tiếp) |
| 7:35 | Chuyển khoản 99k | Tier upgrade (input trực tiếp) |

### Day 11 — Crisis Timer

| Thời điểm | Anh làm gì | Sol làm gì |
|---|---|---|
| 16:00 | Sếp gọi, anh stress | (Sol không biết) |
| 16:01 | Click "Tôi đang thèm" | Mở Crisis Timer (output) |
| 16:01 | (passive) | Voice Khang 90s play (output) |
| 16:01-02 | Đợi 90s | Sol thu delay duration (gián tiếp) |
| 16:03 | Cơn dịu, không hút | Sol thu outcome "delay success" (gián tiếp) |
| 16:03 | Tap "Đã qua" | Lưu success log (input trực tiếp) |

### Day 12 — Lapse 5 điếu đi nhậu

| Thời điểm | Anh làm gì | Sol làm gì |
|---|---|---|
| 23:00 | Về phòng, click "Tôi vừa hút" | Form ghi 5 điếu (input trực tiếp) |
| 23:01 | (passive) | Voice Khang 60s "không phải fail" (output) |
| 23:01 | (passive) | Sol KHÔNG reset streak (system) |

### Day 35 — Lapse 7 điếu đi đám tang + im lặng

| Thời điểm | Anh làm gì | Sol làm gì |
|---|---|---|
| Day 35 đêm | Hút 7 điếu, không log gì | Sol KHÔNG biết (chưa input) |
| Day 36 cả ngày | Im lặng, không mở app | Sol detect "1 ngày không mở" (gián tiếp) |
| Day 36 tối | (passive) | Push "Khang nhắn anh: hôm qua khó..." (output gián tiếp) |
| Day 36 21h | Mở app (passive) | Sol thu app reopen (gián tiếp) |
| Day 36 21h | (passive) | Voice Khang lapse-friendly auto-play (output) |
| Day 36 21h05 | Click "Đã hút 7 điếu" | Log retroactively (input trực tiếp) |
| Day 36 21h06 | Đóng app | Sol thu engagement (gián tiếp) |

→ Đây là **moment quan trọng nhất** của lapse-friendly UX: Sol detect anh im lặng → push gentle nudge → voice mở khi anh quay → anh log retroactively.

### Day 55 — Q-Day

| Thời điểm | Anh làm gì | Sol làm gì |
|---|---|---|
| 6:00 | (passive) | Push Q-Day morning (output gián tiếp) |
| 6:15 | Mở app | Auto-play voice Khang Q-Day 5 phút (output) |
| 13:00 | Crave, click Crisis Timer | (input + output) |
| 22:00 | Crave, click Crisis Timer | (input + output) |

### Day 85 — 30 ngày sạch + viết Khoảng Lặng

| Thời điểm | Anh làm gì | Sol làm gì |
|---|---|---|
| Sáng | (passive) | Push milestone + voice celebrate (output) |
| Tối | Click "Viết Khoảng Lặng" | Mở form text input (output) |
| Tối | Anh viết 100 chữ + Submit | Save anonymous confession (input trực tiếp) |
| Sau 24h | (passive) | Stats update "387 anh em đã đọc" (output gián tiếp) |

---

## Phần 5 — Bảng tổng kết frequency

### Anh Hùng tương tác với Sol mỗi tuần (typical Sol Control user)

| Tương tác | Frequency/tuần | Loại |
|---|---|---|
| Mở push notification log điếu | 7 lần (mỗi sáng) | Input trực tiếp 5s |
| Mở app proactively | 5-10 lần | Mixed |
| Đọc Khoảng Lặng | 2-4 lần | Output + input gián tiếp |
| Nghe voice Khang | 2-3 lần | Output trực tiếp |
| Crisis Timer | 1-3 lần | Input + output |
| AI chat | 0-2 lần | Input + output |
| Hỏi Khang submit | 0-0.25 lần | Input trực tiếp |
| Khoảng Lặng viết | 0-0.1 lần (rare) | Input trực tiếp |
| React 👍 / 🙏 | 5-15 lần | Input trực tiếp 1s |

→ **Anh dành ~15-30 phút/tuần** cho Sol active.

→ **Sol thu data passive** thêm 30+ data points/tuần (gián tiếp).

→ Anh **nhận** ~5-7 push notification/tuần (gián tiếp).

---

## Phần 6 — Friction analysis

Sol design với **friction tối thiểu** cho input:

| Input | Friction | Tại sao đơn giản? |
|---|---|---|
| Log số điếu | 5s slider | Đàn ông VN 45+ ngại nhập text dài |
| Log lapse | 5s click | Phải đơn giản hơn ý chí guilt |
| React | 1s tap | Pre-written buttons, không phải comment |
| Crisis Timer | 2s 1 click | Moment crave, không thời gian gõ |
| Hỏi Khang | Anh gõ | Vì anonymous + 1-2 lần/tháng OK |
| Khoảng Lặng viết | Anh gõ | Hiếm + tự nguyện |

→ **Friction high CHỈ ở actions hiếm** (Hỏi Khang, Khoảng Lặng viết).

→ **Friction low ở actions hàng ngày** (log điếu, react, crisis).

→ Đây là **UX rule cứng**: actions hàng ngày phải dưới 5 giây.

---

## Phần 7 — Tóm tắt 1 trang

### SOL → ANH HÙNG (output)

**Trực tiếp** (anh chủ động):
- Voice Khang library (Tab Nghe)
- Báo cáo Day 3/7/14 (Dashboard)
- Khoảng Lặng (Tab Đọc)
- Anonymous Stats Feed (Dashboard)
- Control Score (Dashboard)
- AI chat reply (Tab Chat)
- Hỏi Khang trả lời qua Voice (Tab Hỏi)
- Crisis Timer + voice (button)
- Tin Nhắn Riêng Khang (Profile inbox)

**Gián tiếp** (Sol đẩy):
- Push notification log điếu (mỗi sáng)
- Email Day 7/14
- Push voice mới (tuần)
- Push lapse-friendly (sau lapse)
- Push Q-Day morning
- Push milestone (7/30/60/52 ngày (51d Sol-active + Day 52 lễ tốt nghiệp))
- Voice auto-play khi lapse
- Voice auto-play Q-Day morning

### ANH HÙNG → SOL (input)

**Trực tiếp** (anh chủ động):
- Số điếu (slider 5s)
- Trigger tag (tap)
- Crisis timer activate (button)
- Q-Day chọn ngày (calendar)
- AI chat câu hỏi (text)
- Hỏi Khang câu hỏi (text anonymous)
- Khoảng Lặng confession (text anonymous, hiếm)
- Pledges + Plan B (workbook)
- React 👍 / 🙏 (1 tap)
- Lapse log (button)
- Refund / hủy (settings)

**Gián tiếp** (Sol thu passive):
- Time/duration mở app
- Voice nghe full/skip
- Khoảng Lặng đọc bài nào
- Crisis Timer outcome
- App return frequency
- Time of day pattern
- Lapse pattern + correlation
- AI chat topic NLP
- Notification open rate
- Tier upgrade funnel
- Lapse-recovery time

---

## Phần 8 — Wire status hiện tại

| Channel | Output đã wire? | Input đã wire? |
|---|---|---|
| 1. AI Chat | ✅ Có | ✅ Có |
| 2. Voice Library | ❌ Cần build (Khang record + UI) | ❌ Cần build |
| 3. Khoảng Lặng | ❌ Cần build (Task #79) | ❌ Cần build |
| 4. Stats Feed | ❌ Cần build (Task #82) | ✅ Backend có data |
| 5. Hỏi Khang | ❌ Cần build (Task #80) | ❌ Cần build |
| 6. Tin Nhắn Riêng | ❌ Cần build | ❌ Cần build |
| 7. Form Feedback | 🟡 Cơ bản có | 🟡 Cơ bản có |
| **Quick Win Day 3** | ❌ Cần build (Task #66) | ✅ Backend có data |
| **Crisis Timer** | ❌ Cần build | ❌ Cần build |
| **Lapse-friendly** | ❌ Cần build (Task #44) | 🟡 Form log có |
| **Push notifications** | 🟡 Email có, push chưa | ✅ Có thể trigger |

→ **AI Chat ✅** là channel duy nhất hoạt động end-to-end hiện tại.

→ **6/7 channel cần build** cho MVP.

---

## Câu kết

Bây giờ Khang có **bản đồ data flow đầy đủ**:
- 23 luồng output Sol → Anh (13 trực tiếp + 10 gián tiếp)
- 30 luồng input Anh → Sol (17 trực tiếp + 13 gián tiếp)

Mỗi tương tác có:
- UI element cụ thể
- Frequency
- Friction level
- Channel trong 7 kênh

→ **Document này = blueprint product** để em build wire 4 tuần tới.

→ Mỗi feature em wire phải reference 1 dòng trong bảng này.

→ Mỗi marketing claim phải có chân trong bảng này.

→ Nếu data flow nào không có trong bảng → Sol chưa hứa cái đó.
