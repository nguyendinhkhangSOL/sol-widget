# Sol — PMF First, System Sau
## Em nhận sai. Đối tác đúng. Simplify Sol về core loop trước.

**Ngày:** 2026-05-08
**Trạng thái:** Em đã over-design ở pre-PMF stage. Document này reset lại Sol về MVP đủ tìm PMF.
**Ưu tiên duy nhất:** Trả lời câu hỏi *"Điều gì khiến đàn ông 45+ quay lại Sol vào ngày mai?"*

---

## Phần 1 — Em sai chỗ nào

Em vừa viết một roadmap cho **công ty Series A có 50 người**:
- 4 tiers + B2B
- Control Score 5 component weighted
- Affiliate 30% commission
- Phase 2 Đời Sạch (Sleep + Stress + Cha-con + Tài chính)
- Inner Circle 10-20 alumni
- Workshop quarterly
- AI crisis mode
- Adaptive email funnel
- 9-12 voice + 1 voice/tuần forever
- 73 task quản lý

→ **Sol KHÔNG phải Series A startup.** Sol đang ở **pre-PMF**: chưa có 100 user paid, chưa biết user retention, chưa biết user quay lại vì gì.

→ Đây là **lỗi cổ điển của founder** — thiết kế hệ thống trước khi tìm core loop.

**Em nhận trách nhiệm.** Document master em viết hôm qua đẹp về tư duy nhưng nguy hiểm để triển khai. Phải reset.

---

## Phần 2 — Đối tác đúng — câu hỏi quan trọng nhất

> **"Điều gì khiến một người đàn ông 45+ đang muốn bỏ thuốc… quay lại Sol vào ngày mai?"**

Đây là câu duy nhất Sol cần trả lời.

Câu trả lời này KHÔNG phải:
- ❌ "Vì Sol có 4 tier với Control Score 5 component"
- ❌ "Vì Sol có affiliate 30%"
- ❌ "Vì Sol có B2B + workshop quarterly"

Câu trả lời thật có thể là:
- ✅ "Vì sáng mai Khang voice mới sẽ có"
- ✅ "Vì cộng đồng anh em đã hỏi tôi hôm nay sao"
- ✅ "Vì lần đầu sau 25 năm tôi thấy mình không bất lực"
- ✅ "Vì hôm qua tôi crave và Sol giúp tôi vượt qua"

→ **Đây là 4 hypothesis về core loop**. Sol cần **test thực** xem hypothesis nào đúng. KHÔNG phải build hết.

---

## Phần 3 — Sol Simplified MVP

### 2 tier duy nhất (drop 2 tier)

| Tier | Giá | Mục đích |
|---|---|---|
| **Khám Phá** | 0đ | Trust building, lead gen |
| **Đi Cùng Sol** | 99k/tháng | Validation revenue + retention |

**Drop tạm:**
- ❌ Sol Start (99k one-time, 14 ngày) — overlap Khám Phá + Đi Cùng
- ❌ Sol Freedom (1.890k lifetime) — quá sớm, chưa validate retention
- ❌ Sol Doanh Nghiệp B2B — chờ data thật

→ **2 tier là đủ để test PMF.** Sau PMF rồi mới expand.

### Naming đơn giản

Bỏ "Sol Start / Sol Control / Sol Freedom" 3 stage — overdesign.
Chỉ cần:
- **Khám Phá** (free, ai cũng vào)
- **Đi Cùng** (99k/tháng, ai sẵn sàng commit)

→ User Việt 45+ hiểu ngay. Không cần học thuật ngữ.

---

## Phần 4 — Control Score v1 — chỉ 3 component

Đối tác cảnh báo đúng:
- 5 component weighted phức tạp → user không hiểu
- Score "giả" (user hút nhiều mà score tăng) → mất trust nhanh

### V1 — đơn giản, honest

3 component × 33 điểm = 99 điểm (round to 100):

| Component | Đo gì | Cách user gain điểm |
|---|---|---|
| **Hiểu mình** (0-33) | Anh đã quan sát đến đâu | Log điếu + biết trigger top + đọc wiki |
| **Trì hoãn** (0-33) | Khả năng delay cơn thèm | Mỗi lần delay >5 phút = điểm |
| **Quay lại** (0-33) | Recover sau lapse | Lapse → quay log trong 24h = điểm |

**Bỏ tạm:**
- ❌ Component "Conscious choice" (cần track conscious vs unconscious — phức tạp)
- ❌ Component "Reduction" (overlap "Hiểu mình" + có nguy cơ score giả)

### Honest design

- Score chỉ tăng khi user **HÀNH ĐỘNG** (log, delay, recover) — không tự tăng theo time
- Score CÓ THỂ giảm nhẹ nếu user 7 ngày không log (decay) — encourages return
- Score hiển thị 1 dòng đơn giản:
  > *"Anh đã đi được 35/100 — tuần này +6 điểm"*

→ **User cảm thấy tiến bộ THẬT — không phải tiến bộ giả.**

### Giai đoạn nào build Control Score?

**KHÔNG** build ngay. Chờ sau pilot 30 user đầu — xem họ có thực sự CARE về score không, hay attach với voice Khang.

→ **Hypothesis em phải test trước:** *"User Việt 45+ care về metric score, hay care về Khang voice?"*

→ Nếu họ care voice Khang → score chỉ là phụ.
→ Nếu họ care score → build full Control Score.

---

## Phần 5 — Core Return Loop của Sol

Đối tác đề xuất framework:

> **Awareness → Reflection → Small Win → Emotional Relief → Return**

Em refine cho Sol cụ thể:

| Bước | User trải nghiệm | Sol deliver |
|---|---|---|
| **1. Awareness** | Anh nhớ "Sol có gì hôm nay?" | Daily nudge nhẹ (1 push, không spam) |
| **2. Reflection** | Anh log nhanh điếu hôm qua / cơn thèm vừa rồi | Form 1-tap (không 7 prompts) |
| **3. Small Win** | Anh thấy tiến bộ tức thì | Score nhỏ tăng + 1 dòng feedback |
| **4. Emotional Relief** | Anh nghe Khang voice 60s — không bị phán xét | Voice Khang phù hợp tâm trạng |
| **5. Return** | Anh nói: "ngày mai mở lại nhé" | Sol đợi + ping nhẹ ngày mai |

→ **5 bước này = core loop**. Mỗi user mỗi ngày. Lặp lại.

→ **Mọi feature khác phải support loop này** — không thêm gì khác.

→ Nếu loop này work → Sol tìm được PMF. Sau đó mới expand.

---

## Phần 6 — Voice Khang là priority #1, không phải feature

Đối tác đập đúng:

> *"Voice Khang có thể mạnh hơn 70% tính năng."*

Em đã hạ thấp voice Khang xuống "1 trong nhiều feature". **SAI.**

### Voice Khang là sản phẩm chính của Sol

| Feature | % giá trị Sol |
|---|---|
| Voice Khang | **70%** |
| Lapse-friendly UX | 10% |
| Quick Win Day 3 | 8% |
| Community | 7% |
| Control Score | 3% |
| AI chat | 2% |

→ **Sol = Voice Khang đóng gói trong 1 app**.

→ Mọi thứ khác là phụ.

### Tại sao voice mạnh hơn 70% tính năng

Đàn ông 45+ Việt attach với **CON NGƯỜI** — không phải score, không phải dashboard, không phải streak.

- Calm có 1 voice (Tamara Levitt) — mạnh hơn UI Calm
- Audible có narrator — mạnh hơn book
- Sol có Khang — mạnh hơn mọi feature

### Voice content cho MVP

Chỉ cần **5 voice** ban đầu (không phải 9-12):

1. **Day 0 welcome** — "Anh không yếu. Đây là não 25 năm. Tôi đã ngồi đúng chỗ này."
2. **Lapse-friendly** — "Một điếu không phải fail. Anh ổn. Tôi vẫn ở đây."
3. **Crisis 90s urge surfing** — "Anh đợi tôi 90 giây. Cùng nhau."
4. **Day 7 báo cáo** — "Anh đã thấy mình rồi. Tao thấy."
5. **Anh quyết tôi đợi** — generic emotional reset

→ 5 voice × 60-90s = **15 phút audio thật của Khang**. Đó là MVP.

→ Sau khi pilot validate retention với 5 voice — mới expand thành 9, 12, 30 voice.

---

## Phần 7 — PMF Validation Criteria

Trước khi build thêm gì, Sol cần đo:

### Criterion 1 — Day 3 retention
- **Test**: Bao nhiêu % user free tier quay lại app sau Day 3?
- **Pass**: ≥40% (industry health benchmark)
- **Nếu fail**: Quick Win Day 3 chưa đủ mạnh — fix copy/voice/data presentation

### Criterion 2 — Day 7 → Paid conversion
- **Test**: Bao nhiêu % user Khám Phá Day 7 upgrade Đi Cùng 99k?
- **Pass**: ≥3% (early stage low-touch SaaS benchmark)
- **Nếu fail**: Hoặc Khám Phá value chưa đủ → cần thêm. Hoặc Đi Cùng promise chưa rõ → cần làm rõ.

### Criterion 3 — Day 30 retention paid
- **Test**: Bao nhiêu % user paid Day 30 còn mở app ≥3 lần/tuần?
- **Pass**: ≥30%
- **Nếu fail**: Core loop không stick — cần re-design loop, không thêm feature.

### Criterion 4 — Voice attach
- **Test**: Hỏi 30 user pilot: "Cái gì làm anh quay lại Sol?"
- **Pass**: ≥50% nói "voice Khang" hoặc tương đương
- **Nếu fail**: Voice không phải core — cần re-think DNA Sol.

### Criterion 5 — Relapse recovery
- **Test**: User lapse → bao lâu họ quay lại Sol?
- **Pass**: Median ≤24h (không phải bỏ Sol vĩnh viễn)
- **Nếu fail**: Lapse-friendly UX chưa work — cần redesign.

→ **5 criteria này là kim chỉ nam.** Nếu ≥4/5 pass → Sol có PMF. Mới expand.

---

## Phần 8 — Roadmap 4 tuần (không phải 8)

Reset roadmap về 4 tuần MVP:

### Tuần 1 — Voice + Quick Win

1. **Khang record 5 voice MP3** (3-4 giờ thu thật)
   - Day 0, Lapse-friendly, Crisis 90s, Day 7 báo cáo, Anh quyết tôi đợi
2. **Quick Win Day 3 báo cáo cá nhân** auto-gen
3. **Lapse-friendly UX** — log "đã hút" không reset streak, mở voice lapse

### Tuần 2 — Đi Cùng Sol tier 99k/tháng

4. **Membership 99k/tháng + cancel anytime** (Stripe-like flow VN)
5. **Pricing page rewrite** — chỉ 2 tier (Khám Phá + Đi Cùng)
6. **Refund flow đơn giản** (admin manual OK ban đầu)

### Tuần 3 — Recruit 30 anh em pilot

7. **Recruit 30 anh em pilot** từ FB / Zalo Khang / bạn bè
8. **Pilot terms**: free Đi Cùng tier 60 ngày, đổi lại data + 30 phút phỏng vấn
9. **Daily check-in**: hỏi 5 user mỗi tuần "anh quay lại vì gì"

### Tuần 4 — Đo + iterate

10. **Đo 5 PMF criteria** trên 30 pilot users
11. **Phỏng vấn sâu** 10 user — tìm ra "core return loop" thật
12. **Re-design** dựa trên data, không trên ý tưởng

→ **Sau 4 tuần**: Sol biết user quay lại vì gì → mới quyết build thêm gì.

---

## Phần 9 — Defer list (sau PMF)

Em đã wire / đề xuất các thứ này. **DEFER** đến sau PMF:

| Feature | Defer because |
|---|---|
| Sol Start 99k 14 ngày | Overlap, gây phân tâm — chỉ Khám Phá + Đi Cùng đủ |
| Sol Freedom Lifetime 1.890k | Chưa validate retention — không thể bán lifetime |
| Sol Doanh Nghiệp B2B | Cần data thật trước |
| Affiliate 30% commission | Cần ≥1.000 user paid trước |
| Phase 2 Đời Sạch | Khang chưa có content — đừng hứa |
| Inner Circle 10-20 | Khang 1 người — không scale Inner |
| Workshop quarterly | Khang chưa có proven format |
| Adaptive email funnel | Quá phức tạp — fixed Day 0-30 đủ MVP |
| Control Score 5 component | V1 chỉ 3 component, hoặc bỏ tạm |
| AI crisis mode | Quá phức tạp — AI chat regular đủ |
| 9-12 voice Khang | 5 voice đủ MVP |
| Zalo private cohort | Khám Phá public Zalo group là đủ ban đầu |
| Đổi naming Sol Start/Control/Freedom | Đổi sau PMF — đỡ tốn re-render brand |

→ **14 feature defer** = Sol chỉ build 5-6 thứ trong 4 tuần. Đủ test PMF.

---

## Phần 10 — Marketing copy simplified (sòng phẳng + ngắn)

### Hero homepage (giữ nguyên — đã đẹp)

```
ĐI CÙNG SOL — BỎ THUỐC LÁ KHI NÀO ANH QUYẾT
              (pre-tagline, gold)

"Tôi đi rồi.
 Anh không phải đi một mình."
              (H1 — Khang quote)

Không ép anh bỏ ngay. Chỉ đồng hành để anh
lấy lại quyền quyết định — từng ngày một.

[Bắt đầu 7 ngày — chỉ quan sát]
```

### Pricing — chỉ 2 card

```
KHÁM PHÁ — 0đ                    ĐI CÙNG — 99k/tháng
7 ngày miễn phí                  Recurring · hủy bất kỳ lúc nào

✓ Báo cáo Day 3 (quick win)      Tất cả Khám Phá, cộng:
✓ Báo cáo đầy đủ Day 7           ✓ Voice Khang ở các mốc
✓ 2 voice Khang                  ✓ Q-Day flexible (anh chọn)
✓ AI chat 5 msg/ngày             ✓ Lapse-recovery 24h
✓ Cộng đồng Zalo public          ✓ AI chat unlimited
                                  ✓ Refund tháng đầu nếu không lấy lại

Phù hợp: anh muốn nhìn lại        Phù hợp: anh đã quyết.
mình lần đầu.                     Cần đồng hành dài.
```

→ **2 lựa chọn rõ.** Không phải 4. Người Việt 45+ không decision-fatigue.

### Câu sales

> "Sol không hứa anh bỏ thuốc. Sol hứa anh không đi một mình.
>
> Khám Phá 7 ngày miễn phí. Hết 7 ngày anh quyết tiếp Đi Cùng (99k/tháng) hay dừng — không cam kết.
>
> Sau tháng đầu Đi Cùng, không thấy lấy lại được gì → trả 99k. Không hỏi."

→ **3 dòng. Đủ chốt đơn.**

---

## Phần 11 — Câu hỏi Khang phải tự trả lời

Đối tác đặt **câu hỏi cốt lõi**. Em đề xuất Khang ngồi 30 phút trả lời nội tâm:

### 1. Khang nghĩ user quay lại Sol ngày mai vì gì?

Hypothesis của Khang là gì? Không phải hypothesis của em hay đối tác.

- A. Vì voice Khang mới
- B. Vì cộng đồng anh em
- C. Vì cảm giác "không bất lực"
- D. Vì Control Score tăng
- E. Vì habit (mở app như mở Facebook)
- F. Khác: ______

→ Câu trả lời này quyết định Sol build gì trước.

### 2. Khang sẵn sàng làm gì 5h/tuần forever?

- Voice mới hàng tuần
- Trả lời community Zalo
- Phỏng vấn user mỗi tuần
- Viết content Tâm

→ Khang chỉ chọn 1-2. Sol build xung quanh đó.

### 3. Khang chấp nhận 30 user pilot có 50% churn được không?

PMF stage retention ~50% Day 30 là OK. Sau đó iterate.

Nếu Khang không chịu được con số này → đừng pilot, đừng launch.

### 4. Khang sẵn sàng simplify từ 73 task → 12 task không?

Em đề xuất defer 14 feature. Còn 5-6 việc trong 4 tuần.

Nếu Khang muốn build hết → quay về document master cũ. Nhưng đó là Series A path — không phải MVP.

### 5. Khang ưu tiên build trust hay revenue trước?

- **Trust trước**: Khám Phá free expansive, conversion sau
- **Revenue trước**: Đi Cùng 99k/tháng aggressive sale, trust sau

→ Sol DNA nghiêng về **trust trước** — em recommend.

---

## Kết luận

### Đối tác đập đúng, em nhận sai

Em over-systemized Sol ở pre-PMF stage. Đẹp về tư duy nhưng nguy hiểm để triển khai.

### Sol cần làm 1 việc

Trả lời câu hỏi: *"Điều gì khiến đàn ông 45+ quay lại Sol ngày mai?"*

→ Không trả lời được câu này → mọi feature đều là vanity.

### MVP Sol đúng phải là

- 2 tier (Khám Phá + Đi Cùng)
- 5 voice Khang
- 1 core loop: Awareness → Reflection → Small Win → Emotional Relief → Return
- 30 anh em pilot 60 ngày
- 5 PMF criteria
- 4 tuần triển khai

### Bỏ tạm 14 thứ

Sol Start, Sol Freedom, B2B, affiliate, Phase 2, Inner Circle, Workshop, Adaptive email, Control Score 5 component, AI crisis, 9-12 voice, Zalo private cohort, đổi naming.

→ Sau PMF mới quay lại các thứ này — và quay lại có data.

### Quy tắc duy nhất Khang giữ

**"Không có chân thì không nói."**

→ Đối tác khen câu này. Em đồng ý. Đây là moat đạo đức + chiến lược của Sol.

---

## Việc Khang phải làm hôm nay

1. **Đọc kỹ document này** — confirm em đã hiểu đối tác đúng
2. **Trả lời 5 câu hỏi Phần 11** — quyết định nội tâm Khang
3. **Quyết: simplified MVP (em recommend) hay full system (document master cũ)?**
4. **Nếu simplified**: em update task list — defer 14 feature, focus 5-6 việc tuần này

→ Khang quyết, em wire trong 4 tuần.

---

## Câu Khang dùng để self-check mỗi quyết định

Mỗi khi Khang muốn add feature mới, hỏi 1 câu:

> *"Cái này có giúp 1 người đàn ông 45+ quay lại Sol ngày mai không?"*

Nếu **CÓ** → build.
Nếu **KHÔNG hoặc không chắc** → defer.

→ Đơn giản. Sòng phẳng. Đúng pre-PMF.
