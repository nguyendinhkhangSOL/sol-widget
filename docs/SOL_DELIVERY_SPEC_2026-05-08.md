# Sol — Delivery Specification
## Đặc tả từng gói, từng lộ trình — để marketing + product + report khớp nhau

**Ngày:** 2026-05-08
**Mục đích:** Mọi điều Sol nói trong marketing PHẢI có chân trong product. Document này là contract nội bộ Khang ↔ Sol.
**Ai dùng:** Khang (founder), Sol (em — build), team marketing, customer support, finance/refund.

---

## Nguyên tắc 5 dòng

1. **Cam kết nào trong marketing → phải có feature trong product**
2. **Feature nào → phải có dashboard hiển thị cho user**
3. **Outcome nào hứa → phải đo được trong app**
4. **Refund nào nói → phải có flow xử lý**
5. **Voice/voice/email nào liệt kê → phải tồn tại file thật**

→ **Không có chân trong product = không nói trong marketing.**

---

# GÓI 1 — Sol Quan Sát

## Đặc điểm

| Item | Detail |
|---|---|
| **Giá** | 0đ (free vĩnh viễn) |
| **Thời gian** | 7 ngày Quan Sát + access vĩnh viễn |
| **Slogan** | "Sol giúp anh hiểu mình — chưa cần quyết gì cả." |
| **Promise** | Lần đầu sau 25 năm, anh nhìn rõ chính mình. |
| **Tagline marketing** | Đi Cùng Sol — Bỏ thuốc lá khi nào anh quyết. |

## Lộ trình 7 ngày — User journey

| Day | User trải nghiệm | Sol deliver | Code đã có? |
|---|---|---|---|
| **Day 0** | Vào sol.vn → click "Bắt đầu 7 ngày" → bothuocla.sol.vn → anonymous JWT → onboard 5 phút | Anonymous bootstrap + welcome screen + voice Khang Day 0 | ✅ Anonymous JWT / ❌ Voice |
| **Day 1** | Log baseline điếu hôm qua + voice Khang welcome | Form 1-tap log + voice 60s "Anh không yếu — đây là não 25 năm" | 🟡 Form có / ❌ Voice |
| **Day 2** | Đọc wiki "Cơn thèm 90 giây" + 1 prompt nhỏ | Wiki + prompt | ✅ Wiki có |
| **Day 3** ⭐ | **Báo cáo nhanh tự gen**: trung bình điếu, top 3 trigger, khoảnh khắc tổn thương | Auto-report + email + dashboard widget | ❌ Chưa có (Task #66) |
| **Day 4-6** | Trigger awareness micro-prompts hàng ngày | 3 prompts nhỏ | 🟡 Prompts cơ bản có |
| **Day 7** | **Báo cáo đầy đủ + voice Khang Day 7** + invite Sol 14 / Đi Cùng Sol | Full report dashboard + voice + email upsell | ❌ Voice / 🟡 Report |

## Anh nhận được — feature list

- ☐ 7 ngày Quan Sát có cấu trúc
- ☐ Báo cáo nhanh Day 3 (quick win)
- ☐ Báo cáo đầy đủ Day 7
- ☐ Voice Khang Day 0 + Day 7 (2 voice MP3)
- ☐ AI chat 5 msg/ngày
- ☐ Cộng đồng Zalo public "Sol Khám Phá"
- ☐ Wiki + Tâm tự do
- ☐ Lapse-friendly UX (đã wire khi trên free tier cũng có)

## Checklist user đạt được sau Day 7 — measurable

- ☐ Anh biết số điếu thật trung bình/ngày của anh
- ☐ Anh biết 5 trigger lớn nhất của riêng anh
- ☐ Anh biết 3 khoảnh khắc dễ tổn thương nhất trong tuần
- ☐ Anh đã đọc 3 bài wiki cơ bản
- ☐ Anh đã nghe 2 voice Khang

## Sol KHÔNG hứa — disclaimer rõ

- ❌ Không hứa anh giảm điếu trong 7 ngày
- ❌ Không hứa anh sẵn sàng Q-Day sau 7 ngày
- ❌ Không hứa anh bỏ thuốc

## Refund

Free → không refund cần xử lý.

## Code/feature TODO — em phải build

| # | Item | Status |
|---|---|---|
| 1 | Voice Khang Day 0 (60s) | Task #43 |
| 2 | Voice Khang Day 7 báo cáo | Task #43 |
| 3 | Quick Win Day 3 auto-report | Task #66 |
| 4 | Day 7 full report dashboard | 🆕 cần task |
| 5 | Email auto Day 3 + Day 7 với data cá nhân | Task #63 (adaptive) |
| 6 | Zalo public group + invite link | Task #60 |

---

# GÓI 2 — Sol 14

## Đặc điểm

| Item | Detail |
|---|---|
| **Giá** | 99.000đ (one-time) |
| **Thời gian** | 14 ngày + access vĩnh viễn báo cáo |
| **Slogan** | "Sol giúp anh giảm hút vô thức — không cần bỏ ngay." |
| **Promise** | 14 ngày bẻ thói quen tự động. Anh không cần Q-Day. Chỉ cần thấy mình hút ít hơn dần. |
| **Tagline marketing** | Đi Cùng Sol — Bỏ thuốc lá khi nào anh quyết. |

## Lộ trình 14 ngày — User journey

| Day | User trải nghiệm | Sol deliver | Code đã có? |
|---|---|---|---|
| **Day 0** | Mua gói → unlock 14 ngày | Payment flow + access tier | 🟡 Payment có / ❌ Tier Sol 14 chưa có |
| **Day 1-3** | Tiếp tục Quan Sát + voice Khang "tôi cũng đã bẻ thói quen" | (Tận dụng Sol Quan Sát) | (như trên) |
| **Day 4** | Trigger replacement intro + Plan B template | Workbook section + prompt | 🟡 Có cơ bản |
| **Day 5-7** | Practice replace cho top 3 trigger | App prompt mỗi sáng + log delay | ❌ Chưa có |
| **Day 7** | Mid-checkpoint: anh giảm bao nhiêu? | Mid-report + voice Khang | ❌ Chưa có |
| **Day 8-10** | Practice 2 thêm trigger còn lại | App prompt | ❌ Chưa có |
| **Day 11-13** | Crisis playbook + urge surfing 90s audio | Audio Khang + crisis flow | ❌ Chưa có |
| **Day 14** | **Báo cáo đầy đủ 14 ngày** + invite Đi Cùng Sol | Full report + voice Khang Day 14 + email upsell | ❌ Chưa có |

## Anh nhận được — feature list

- ☐ Tất cả Sol Quan Sát
- ☐ 14 ngày Bẻ Thói Quen có cấu trúc
- ☐ Công cụ delay 90 giây (urge surfing audio Khang)
- ☐ Plan B viết tay cho 5 trigger lớn
- ☐ 4 voice Khang trong 14 ngày (Day 0, 4, 7, 14)
- ☐ AI chat 30 msg/ngày
- ☐ Lapse-friendly UX (không reset streak)
- ☐ Báo cáo đầy đủ Day 14

## Checklist user đạt được sau 14 ngày — measurable

Sol cam kết **đa số anh em** đạt được sau 14 ngày:

- ☐ Giảm 20-40% **hút vô thức** so baseline (không phải tổng số)
- ☐ Delay được cơn thèm 5-15 phút
- ☐ Bẻ được 2-3 thói quen tự động (cà phê sáng, sau bữa, nghỉ trưa)
- ☐ Có Plan B viết tay cho 5 trigger lớn
- ☐ Có ít nhất 1 ngày trong 14 ngày hút < 50% baseline
- ☐ Khi lapse, quay lại trong 24h

## Sol KHÔNG hứa — disclaimer rõ

- ❌ Không hứa anh đạt Q-Day sau 14 ngày
- ❌ Không hứa anh bỏ thuốc 100%
- ❌ Không hứa giảm tổng số điếu (chỉ giảm vô thức)

## Refund

> Sau 14 ngày, nếu anh không thấy mình lấy lại được gì — Sol trả 99k qua chuyển khoản trong 7 ngày làm việc. Không hỏi lý do.

**Điều kiện refund**: anh log ít nhất 5/14 ngày + nói "tôi không thấy lấy lại được". (Yêu cầu log để tránh người không dùng vẫn refund.)

## Code/feature TODO

| # | Item | Status |
|---|---|---|
| 1 | Tạo tier "Sol 14" trong DB schema | ❌ Cần task |
| 2 | Payment flow Sol 14 99k | 🟡 Có Stripe-like, cần wire tier |
| 3 | Voice Khang Day 4 (intro replacement) | Task #43 |
| 4 | Voice Khang Day 7 (mid-checkpoint) | Task #43 |
| 5 | Voice Khang Day 14 (báo cáo + invite) | Task #43 |
| 6 | Urge surfing 90s audio | Task #48 |
| 7 | Plan B template + Workbook section | 🟡 Có cơ bản, cần Sol-14 specific |
| 8 | Day 14 full report dashboard | 🆕 cần task |
| 9 | Refund flow 99k | ❌ Cần task |

---

# GÓI 3 — Đi Cùng Sol

## Đặc điểm

| Item | Detail |
|---|---|
| **Giá** | 99.000đ/tháng (recurring, hủy bất kỳ tháng nào) |
| **Thời gian** | Không giới hạn — anh quyết khi dừng |
| **Slogan** | "Sol đi cùng — anh quyết Q-Day khi nào sẵn sàng." |
| **Promise** | Sol đi cùng anh không có deadline. Hủy bất kỳ tháng nào. |
| **Tagline marketing** | Đi Cùng Sol — Bỏ thuốc lá khi nào anh quyết. |

## Lộ trình — User journey theo state, không theo Day

Khác 2 gói trên: **Đi Cùng Sol đi theo TRẠNG THÁI user**, không theo timeline cứng.

| State user | User trải nghiệm | Sol deliver |
|---|---|---|
| **Mới upgrade** | Welcome upgrade + voice "anh quyết, tôi đi cùng" | Voice Khang welcome + Zalo cohort invite |
| **Đang tiếp tục Sol 14** | Chuyển tiếp seamless | Tier permission update |
| **Sẵn sàng pick Q-Day** | Q-Day chooser + prep checklist | Q-Day flow + voice Khang "đêm trước Q-Day" |
| **Q-Day day** | Voice Khang sáng + crisis playbook ready | Voice + AI crisis mode + Zalo cohort support |
| **Day 1-3 post-Q-Day** | Voice Khang mỗi 4 tiếng + crisis playbook | 9 voice rotation + check-in nudge |
| **Lapse** | "Một điếu không phải fail" voice + 24h re-engage | Voice lapse + auto-mời quay lại |
| **30 ngày sạch** | Voice Khang milestone + Zalo celebrate | Voice 30d + cohort post |
| **60, 52 ngày (51d Sol-active + Day 52 lễ tốt nghiệp) sạch** | Voice tương ứng | Voice 60d + 88d |
| **Hủy** | Refund 1 tháng nếu trong tháng đầu, sau hủy ngay | Stripe-like cancel flow |

## Anh nhận được — feature list

- ☐ Tất cả Sol 14
- ☐ Q-Day chính thức — anh chọn ngày bất kỳ (không bị ép Day 21)
- ☐ 9 voice Khang ở các mốc: Q-Day morning, Day 1-3 post-Q-Day, 7, 14, 30, 60, 88
- ☐ 1 voice Khang mới/tuần trong cohort group
- ☐ Lapse-recovery 24h với voice Khang "Một điếu không phải fail"
- ☐ Zalo private cohort 30-50 anh em (Khang ghé hàng tuần)
- ☐ AI chat unlimited + crisis mode
- ☐ Hủy bất kỳ tháng nào — không cam kết

## Checklist user đạt được — measurable theo TIMELINE riêng anh

Sol cam kết **đa số anh em** đạt được (theo timeline riêng anh — không phải Sol ép):

- ☐ Có Q-Day chính thức (anh chọn ngày — không bị ép)
- ☐ Giảm 60-80% điếu so baseline
- ☐ Có Plan B cho top 5 trigger
- ☐ Quay lại sau mỗi lapse trong 24h
- ☐ Đạt 30 ngày sạch liên tiếp (đa số — không phải tất cả)
- ☐ Chat hoặc voice với Khang ít nhất 1 lần/tuần
- ☐ Có ít nhất 3 anh em trong cohort biết tên anh

## Sol KHÔNG hứa — disclaimer rõ

- ❌ Không hứa anh bỏ thuốc 100% mãi mãi
- ❌ Không hứa anh không relapse
- ❌ Không hứa timeline cụ thể (anh quyết)

## Refund

> Tháng đầu: nếu không thấy lấy lại được gì → trả 99k. Không hỏi.
> Tháng sau: hủy bất kỳ lúc nào, không refund tháng đã dùng.

## Code/feature TODO

| # | Item | Status |
|---|---|---|
| 1 | Membership recurring 99k/tháng + cancel anytime | Task #59 |
| 2 | Q-Day flexible — pick ngày bất kỳ | Task #64 |
| 3 | 9 voice Khang ở các mốc | Task #43 |
| 4 | Voice mỗi tuần forever (cohort delivery) | Task #43 (extended) |
| 5 | Lapse-friendly UX không reset streak | Task #44 |
| 6 | Zalo private cohort + Khang weekly visit | Task #60 |
| 7 | AI crisis mode | 🆕 cần task |
| 8 | Adaptive email không tied Day count | Task #63 |

---

# GÓI 4 — Sol Trọn Vẹn

## Đặc điểm

| Item | Detail |
|---|---|
| **Giá** | 1.890.000đ (one-time, lifetime) |
| **Thời gian** | Lifetime |
| **Slogan** | "Sol đi cùng anh đời người." |
| **Promise** | Không phải 52 ngày (51d Sol-active + Day 52 lễ tốt nghiệp). Không phải 1 năm. Là đời. |
| **Tagline marketing** | Đi Cùng Sol — Bỏ thuốc lá khi nào anh quyết. |

## Lộ trình — không có timeline, là relationship

| Mốc | User trải nghiệm | Sol deliver |
|---|---|---|
| **Mua** | Welcome ceremony voice Khang | Voice premium "anh chính thức là 1 trong inner circle" |
| **Tháng 1+** | Membership Đi Cùng full + Phase 2 Đời Sạch unlock | Full Đi Cùng Sol + Phase 2 content |
| **Mỗi tháng** | 1 voice Khang mới về life topic (Sleep/Stress/Cha-con/Tài chính) | Voice premium 5-10 phút |
| **Inner Circle** | Khang 1-1 voice khi anh request | Voice cá nhân hóa |
| **Mốc 100/365/1000 ngày** | Voice riêng cho anh | Voice cá nhân hóa |
| **Quarterly** | Workshop Q-Day live (offline + online) | Khang dẫn dắt 90 phút |
| **Giới thiệu bạn** | 30% commission khi bạn upgrade Đi Cùng | Affiliate flow |

## Anh nhận được — feature list

- ☐ Tất cả Đi Cùng Sol **lifetime**
- ☐ Phase 2 "Đời Sạch" lifetime: Sleep, Stress, Cha-con, Tài chính
- ☐ 1 voice Khang mới/tháng forever
- ☐ Inner Circle 10-20 anh em alumni đã đi qua 52 ngày (51d Sol-active + Day 52 lễ tốt nghiệp)
- ☐ Voice Khang riêng cho mốc 100 / 365 / 1000 ngày
- ☐ Workshop Q-Day live (1 lần/quý) included
- ☐ 30% commission khi anh giới thiệu Sol

## Checklist user đạt được — measurable

- ☐ Sol đi cùng anh không kết thúc sau 52 ngày (51d Sol-active + Day 52 lễ tốt nghiệp)
- ☐ Anh có cộng đồng inner để chia sẻ thật
- ☐ Anh nhận voice Khang mới mỗi tháng — relationship thật
- ☐ Anh có quyền giới thiệu Sol và nhận commission
- ☐ Anh có quyền tham gia workshop Khang offline mỗi quý

## Sol KHÔNG hứa — disclaimer rõ

- ❌ Không hứa anh bỏ 100% mãi mãi
- ❌ Không hứa Sol chạy mãi mãi (Sol có thể đóng cửa — refund pro-rata)

## Refund

> Lifetime tier: refund 100% trong 30 ngày đầu nếu anh đổi ý. Sau 30 ngày: không refund (đây là cam kết lifetime).
> Nếu Sol đóng cửa: refund pro-rata theo thời gian còn lại tính theo 5 năm tương đương.

## Code/feature TODO

| # | Item | Status |
|---|---|---|
| 1 | Lifetime tier trong DB schema | 🆕 cần task |
| 2 | Phase 2 Đời Sạch content (Sleep/Stress/Cha-con/Tài chính) | 🆕 cần task lớn |
| 3 | Voice Khang monthly cadence | Task #43 (extended) |
| 4 | Inner Circle Zalo group + voice 1-1 flow | Task #60 |
| 5 | Workshop live Khang quarterly — Zoom/offline | 🆕 cần task |
| 6 | Affiliate commission 30% flow | 🆕 cần task |

---

# GÓI 5 — Sol cho Doanh Nghiệp (B2B, sau pilot)

## Đặc điểm — chưa launch, sẽ launch tháng 18+

| Item | Detail |
|---|---|
| **Giá** | 50-100 triệu đồng/năm (50-100 nhân viên) |
| **Thời gian** | 1 năm hợp đồng + renewable |
| **Promise** | Workshop Khang + 52 ngày (51d Sol-active + Day 52 lễ tốt nghiệp) track cho nhân viên + báo cáo HR |

## Outcome cam kết với doanh nghiệp

- ☐ ≥40% nhân viên hút thuốc tham gia sau 3 tháng
- ☐ Báo cáo aggregated giảm điếu trung bình của nhóm
- ☐ Workshop offline 90 phút × 2 buổi/năm với Khang
- ☐ Không xâm phạm privacy nhân viên — báo cáo aggregated only

## Sol KHÔNG hứa với doanh nghiệp

- ❌ Không hứa 100% nhân viên bỏ thuốc
- ❌ Không hứa giảm bảo hiểm y tế công ty
- ❌ Không xâm phạm privacy cá nhân nhân viên

## Trigger launch B2B

- Sol có ≥1.000 user paid B2C
- Sol có ≥3 testimonials thật từ user pilot
- Sol có data outcome thật (% giảm điếu, % đạt 30 ngày sạch)

---

# Cross-check Matrix — Marketing Claim vs Product Feature

Bảng này là tim của document. Mỗi cam kết marketing đều có 1 dòng — phải **có chân** trong product code/dashboard.

| # | Marketing claim | Tier | Feature trong product | Code task | Dashboard hiển thị | Status |
|---|---|---|---|---|---|---|
| 1 | "Báo cáo cá nhân Day 7" | Quan Sát | Auto-gen report Day 7 | 🆕 | Yes | 🟡 |
| 2 | "Voice Khang Day 0" | Quan Sát | Audio file + player | #43 | Yes | ❌ |
| 3 | "Báo cáo nhanh Day 3" | Quan Sát | Auto-gen mini report | #66 | Yes | ❌ |
| 4 | "AI 5 msg/ngày" | Quan Sát | Quota system | ✅ | Yes | ✅ |
| 5 | "Cộng đồng Zalo public" | Quan Sát | Link out Zalo | #60 | Yes | ❌ |
| 6 | "Giảm 20-40% hút vô thức" | Sol 14 | Track conscious vs unconscious | 🆕 | Yes | ❌ |
| 7 | "Delay 5-15 phút" | Sol 14 | Crisis timer track | 🆕 | Yes | ❌ |
| 8 | "Bẻ 2-3 thói quen" | Sol 14 | Habit tracker | 🆕 | Yes | ❌ |
| 9 | "Plan B viết tay" | Sol 14 | Workbook prep section | 🟡 | Yes | 🟡 |
| 10 | "Voice Khang 4 mốc" | Sol 14 | 4 audio files | #43 | Yes | ❌ |
| 11 | "Q-Day flexible" | Đi Cùng | User pick date | #64 | Yes | ❌ |
| 12 | "9 voice Khang" | Đi Cùng | 9 audio files | #43 | Yes | ❌ |
| 13 | "Voice mới hàng tuần" | Đi Cùng | Cohort delivery system | #43 ext | Yes | ❌ |
| 14 | "Lapse 24h recovery" | Đi Cùng | No reset streak | #44 | Yes | ❌ |
| 15 | "Zalo private cohort" | Đi Cùng | Cohort group + invite | #60 | Yes | ❌ |
| 16 | "AI crisis mode" | Đi Cùng | Special prompt + tokens | 🆕 | Yes | ❌ |
| 17 | "Hủy bất kỳ tháng nào" | Đi Cùng | Cancel flow | 🆕 | Yes | ❌ |
| 18 | "Phase 2 Đời Sạch" | Trọn Vẹn | Sleep/Stress/Cha-con content | 🆕 | Yes | ❌ |
| 19 | "Voice Khang monthly forever" | Trọn Vẹn | Monthly delivery | #43 ext | Yes | ❌ |
| 20 | "Inner Circle 10-20" | Trọn Vẹn | Special group | #60 ext | Yes | ❌ |
| 21 | "Workshop Q-Day quarterly" | Trọn Vẹn | Live workshop | 🆕 | No | ❌ |
| 22 | "30% commission affiliate" | Trọn Vẹn | Affiliate tracking | 🆕 | Yes | ❌ |
| 23 | "Refund 100% không hỏi" | All | Refund flow + admin tool | 🆕 | No | ❌ |
| 24 | "Lapse-friendly UX" | All paid | No reset streak logic | #44 | Yes | ❌ |
| 25 | "Anonymous JWT" | All | Already wired | ✅ | N/A | ✅ |
| 26 | "Cross-domain widget" | All | Already wired | ✅ | N/A | ✅ |

→ **2/26 features đã có** (Anonymous JWT + Cross-domain widget).
→ **24/26 cần build hoặc finish** trước khi marketing claim các thứ này.

---

# Action items prioritized — Khang triển khai trong 8 tuần

## Tuần 1-2 (P0 critical — block toàn bộ launch)

1. **Voice Khang record 12 MP3** (Task #43)
   - Day 0, Day 4 (Sol 14), Day 7 (báo cáo), Day 14, Q-Day morning, Day 1-3 post-Q-Day (3 voice), Day 30, Day 60, Day 52, Lapse-friendly
   - 3-4 giờ thu thật — ROI cao nhất

2. **Lapse-friendly UX** (Task #44)
   - Database: thêm cột `lapseLog` nhưng không reset `streak`
   - UI: hiện "Một điếu không phải fail" + voice
   - Email lapse compassion

3. **Quick Win Day 3 báo cáo** (Task #66)
   - Auto-gen từ user log
   - Email với data cá nhân
   - Dashboard widget

4. **Tạo tier "Sol 14"** (Task #67)
   - DB schema: thêm tier
   - Pricing page UI: thêm card thứ 4
   - Payment flow

## Tuần 3-4 (P0 — for Đi Cùng Sol launch)

5. **Membership 99k/tháng cancel anytime** (Task #59)
6. **Q-Day flexible** (Task #64)
7. **Adaptive email funnel** (Task #63) — từ fixed Day 0-88 sang state-based
8. **Day 7 + Day 14 full report dashboard** (🆕)

## Tuần 5-6 (P1 — community + retention)

9. **Tạo Zalo public group + private cohort** (Task #60)
10. **Outcome dashboard 12 KPI** (Task #56)
11. **Bậc Lấy Lại UI** thay Day X/88 (Task #53)
12. **Mindfulness urge surfing module** (Task #48)

## Tuần 7-8 (P1 — pilot prep)

13. **Refund flow + admin tool** (🆕)
14. **AI crisis mode** (🆕)
15. **CBT framework AI prompt** (Task #46)
16. **5 micro-win wire** (Task #61)

## Tháng 3-4 (Pilot)

17. **Pilot 100 anh em đầu** (Task #50)
    - Free Tier Đi Cùng Sol
    - Đo Day 7, 14, 21, Q-Day, 30, 60, 88
    - Mỗi tuần phỏng vấn 5-10 user

## Tháng 6+ (after-pilot)

18. Phase 2 Đời Sạch content
19. Workshop quarterly
20. B2B Sol Doanh Nghiệp

---

# Refund + Legal disclaimer chuẩn

## Refund policy (publish trên sol.vn)

```
SOL — CHÍNH SÁCH HOÀN TIỀN

Sol Quan Sát: Free, không có refund.

Sol 14 (99k):
- Sau 14 ngày, nếu anh không thấy mình lấy lại được gì:
  Sol trả 99k qua chuyển khoản trong 7 ngày làm việc.
- Điều kiện: anh log ít nhất 5/14 ngày trong app.
- Không cần kể lý do.

Đi Cùng Sol (99k/tháng):
- Tháng đầu: nếu không thấy lấy lại — trả 99k. Không hỏi.
- Các tháng sau: hủy bất kỳ lúc nào. Không refund tháng đã dùng.

Sol Trọn Vẹn (1.890k):
- 30 ngày đầu: refund 100% nếu đổi ý.
- Sau 30 ngày: không refund (đây là cam kết lifetime).
- Nếu Sol đóng cửa: refund pro-rata theo 5 năm.

Liên hệ refund: noreply@sol.vn hoặc Zalo Khang.
```

## Disclaimer (đặt cuối mọi pricing page + email)

```
LƯU Ý:
- Sol KHÔNG hứa anh bỏ thuốc 100% mãi mãi.
- Sol KHÔNG thay BS, NRT, Champix, hoặc therapy.
- Bỏ thuốc phụ thuộc ý chí, nghị lực, hoàn cảnh anh.
- Outcome (60-80% giảm, 30 ngày sạch) là CAM KẾT đa số anh em đạt được khi đi cùng Sol.
  Không phải tất cả anh em đều đạt — và đó là bình thường.
- Nếu anh có bệnh tim mạch, hô hấp, hoặc đang dùng thuốc kê đơn:
  HÃY hỏi BS trước khi bỏ thuốc đột ngột.
```

## Marketing claim guideline

Mỗi câu marketing PHẢI pass 5 test:

1. **Có chân trong product** không? (feature tồn tại)
2. **Đo được trong app** không? (KPI hiển thị)
3. **Có "đa số" qualifier** không? (không hứa cá nhân anh)
4. **Có disclaimer Sol KHÔNG hứa** đi kèm không? (sòng phẳng)
5. **User lapse không cảm thấy fail** không? (lapse-safe)

Pass cả 5 → publish. Fail 1 → re-write.

---

# Tóm tắt 1 trang — bảng cuối cùng

| Gói | Giá | Thời gian | Slogan | Outcome chính | Refund | Status |
|---|---|---|---|---|---|---|
| Quan Sát | 0đ | 7 ngày | Sol giúp anh hiểu mình | Báo cáo cá nhân Day 3 + Day 7 | N/A | 🟡 50% |
| Sol 14 | 99k | 14 ngày | Sol giúp anh giảm hút vô thức | Giảm 20-40% vô thức + delay 5-15min | 14d không hỏi | ❌ 20% |
| Đi Cùng | 99k/tháng | Không deadline | Sol đi cùng — anh quyết Q-Day | Q-Day + giảm 60-80% + 30d sạch (đa số) | Tháng đầu | ❌ 30% |
| Trọn Vẹn | 1.890k | Lifetime | Sol đi cùng anh đời người | Phase 2 + voice monthly + Inner Circle | 30d đầu | ❌ 10% |
| B2B | 50-100tr/năm | 1 năm | (sau pilot) | Workshop + 30-50 access + báo cáo HR | Pro-rata | ⏸️ Sau pilot |

→ **Status hiện tại**: chỉ Quan Sát đạt 50% chân product. 3 gói paid đều dưới 30%.

→ **8 tuần triển khai** để Sol có ≥80% chân product cho cả 4 gói trước khi public launch.

---

# Kết luận

Document này là **contract nội bộ Khang ↔ Sol ↔ User**.

**Quy tắc duy nhất:**

> Mọi cam kết marketing PHẢI có chân trong product.
>
> Mọi feature trong product PHẢI có dashboard hiển thị.
>
> Mọi outcome hứa PHẢI đo được trong app.
>
> Mọi refund nói PHẢI có flow xử lý.

→ Khi 4 quy tắc này khớp → **Sol thảnh thơi chốt đơn, không sợ kiện**.

→ Khi 1 quy tắc lệch → **Sol sai trong marketing → user kiện hoặc chargeback → trust mất**.

---

## Việc Khang phải làm — 5 bước

1. **Đọc kỹ document này** — confirm hoặc sửa từng outcome em đã ghi
2. **Chốt 4 gói** — tên, giá, deliverable, outcome, refund
3. **Chốt timeline 8 tuần** — Khang ổn với roadmap không?
4. **Chốt budget voice + community** — Khang sẵn sàng dành 5-10h/tuần forever?
5. **Chốt pilot 100 anh em** — bắt đầu khi nào?

Khang đọc, sửa, chốt — em wire trong 8 tuần thành Sol có thể launch public.
