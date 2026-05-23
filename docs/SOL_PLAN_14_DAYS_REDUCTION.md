# SOL — Kế hoạch Nội dung 21 Ngày Pre-Q-Day (7 Làm quen + 14 Giảm dần)

**Trạng thái:** APPROVED v1.0 — Khang chốt 14-05-2026, bắt đầu sản xuất
**Ngày tạo:** 14-05-2026
**Phase trong lộ trình:** Giai đoạn 1+2 trong chuỗi 3 giai đoạn

```
[7 NGÀY LÀM QUEN]  →  [14 NGÀY GIẢM DẦN]  →  [30 ngày Q-Day series]
 (orientation —          (tapering —            (đã LIVE — 30/30)
  đang plan)              đang plan)
```

---

## DECISIONS LOG — Khang chốt 14-05-2026

| Q | Quyết định | Ghi chú |
|---|---|---|
| Q1 | Tên series: **"14 Ngày Giảm Dần"** + **"7 Ngày Làm Quen"** | Đặt tên chính thức |
| Q2 | Slug: `lam-quen-ngay-N` (1-7) + `giam-dan-ngay-N` (1-14) | Em chốt — VN search natural |
| Q3 | Mô hình tapering: **Hierarchical chính + Scheduled delay phụ** | Em chốt — như §1 plan |
| Q4 | FTND test: **Embed JS calculator interactive** | Em chốt — engagement + lead capture |
| Q5 | **7 ngày "Làm quen" CŨNG VIẾT** theo cùng format | Khang chốt |
| Q6 | **Cho cả 2 route** — cold turkey skip 21 ngày, hoặc tapering full | Khang chốt |
| Q7 | Voice: **Hỗn hợp** — Khang Sol cá nhân ở Day 1, 7, 14 + milestone; Sol Đồng hành ở science days | Em chốt |
| Q8 | Citation: **Cuối bài** (đồng bộ Q-Day) | Em chốt |
| Q9 | Pricing CTA: **Landing riêng** `/14-ngay-giam-dan/` + `/7-ngay-lam-quen/` | Em chốt — A/B test sau |
| Q10 | Order viết: **Em chủ động — priority SEO + pillar trước** | Khang chốt |

**Pillar order viết (Wave 1 — 4 bài full trong session 14-05-2026):**
1. `lam-quen-ngay-1` — Tại sao bỏ thuốc — 5 lý do khoa học (ENTRY page)
2. `giam-dan-ngay-1` — Giảm dần thuốc lá có hiệu quả không? (SEO 210)
3. `giam-dan-ngay-7` — Cách cai thuốc dần dần — cắt điếu đầu tiên (SEO **480** — cao nhất)
4. `giam-dan-ngay-14` — Đêm trước Q-Day (BRIDGE → Q-Day series)

**Wave 2 (phiên sau, 6-8 bài):** lam-quen 2/3/7 + giam-dan 2/13/8/9/5 (theo SEO descending)
**Wave 3 (phiên sau, còn lại):** Tất cả các bài science-detail còn lại

---

## 1. Cơ sở khoa học của phương pháp "giảm dần"

### Đây không phải opinion — đây là evidence

Hai chiến lược cai thuốc đã được nghiên cứu rộng rãi: **cold turkey** (bỏ đột ngột) vs **gradual reduction** (giảm dần đến Q-Day rồi dừng).

**Bằng chứng chính:**

| Nghiên cứu | Kết luận |
|---|---|
| **Lindson-Hawley et al. 2016, Cochrane Review** (51 trials, 22,000+ smokers) | Gradual reduction = abrupt quit ở 6-month abstinence rate (RR 1.01, 95% CI 0.87-1.17). Hai cách tương đương. |
| **Lindson 2019 update** | Reduction + cessation medication > reduction one (RR 1.74). Có NRT/Champix tăng gấp đôi. |
| **Hughes 2007** | "Pre-quit nicotine reduction" giảm withdrawal severity ở D1-3 sau Q-Day. |
| **Stead & Lancaster 2007, Cochrane** | Behavioral preparation (planning, removing cues) tăng odds quit success 1.5-2x. |
| **WHO 2020 + USDHHS 2008 Clinical Practice Guideline** | Cả 2 chiến lược đều được khuyến cáo. Bệnh nhân tự chọn — preference matter. |

**Kết luận cho Sol:** 14 ngày giảm dần là evidence-based — không phải "soft option" mà là một lộ trình khoa học song song. Người Việt thường ngại cold turkey vì sợ withdrawal khó chịu nơi làm việc/gia đình → tapering là cửa vào dễ hơn.

### Có 3 mô hình tapering chính

1. **Scheduled reduction (giảm theo lịch số điếu/ngày)**
   - Ngày 1-3: giảm 25%, Ngày 4-7: giảm 50%, Ngày 8-12: giảm 75%, Ngày 13-14: <5 điếu
   - Rủi ro: "compensatory smoking" (Strasser 2007) — hút sâu hơn để bù nicotine

2. **Hierarchical reduction (loại bỏ điếu "dễ" trước)**
   - User đánh giá mỗi điếu 0-3 sao (mức quan trọng/khoái cảm)
   - Cắt từ điếu 0 sao → 1 sao → … → giữ điếu sáng (3 sao) đến gần Q-Day
   - **Đây là mô hình Sol khuyến cáo** — self-efficacy ramp-up, compensation thấp hơn

3. **Scheduled delay (trì hoãn giờ hút)**
   - Mỗi ngày trì hoãn điếu đầu tiên thêm 15-30 phút
   - Phù hợp người FTND cao (≥7), morning cigarette là dominant trigger

**Kết hợp tối ưu cho Sol:** Mô hình 2 (hierarchical) làm xương sống + chèn yếu tố trì hoãn morning cigarette ở D-9 + chuẩn bị NRT ở D-5.

---

## 1B. Khung 7 ngày LÀM QUEN — chia 2 giai đoạn

**Mục tiêu:** User CHƯA quyết bỏ thuốc. Đang ở contemplation stage (Transtheoretical Model — Prochaska & DiClemente 1983). Mission: build motivation + clarity, không ép quyết định.

```
L-1 → L-3   :  AWARENESS BUILDING (3 ngày) — Tác hại + lợi ích
L-4 → L-7   :  DECISION SUPPORT   (4 ngày) — Phương pháp + commitment
```

**Quy ước slug:** `lam-quen-ngay-1` → `lam-quen-ngay-7` (1 = entry, 7 = quyết định ngày bắt đầu).

### Bản đồ 7 bài Làm quen

| Day | Slug | Theme | Science anchor | SEO target | Chip preview |
|---|---|---|---|---|---|
| L-1 | `lam-quen-ngay-1-tai-sao-bo-thuoc-la` | 5 lý do bỏ thuốc dựa trên bằng chứng | US Surgeon General 2014; WHO 2021 mortality data | "tại sao nên bỏ thuốc lá" (320/tháng) | 🎯 Hôm nay: chưa cần quyết. Đọc 5 lý do — sống thêm 10 năm trung bình (Lancet 2013), tiết kiệm 30M/năm, hồi phục phổi sau 9 tháng. Cân nhắc xem bao nhiêu lý do đánh anh nhất. |
| L-2 | `lam-quen-ngay-2-nghien-nicotine-la-gi` | Cơ chế nghiện sinh học — không phải "yếu ý chí" | Benowitz 2010; receptor upregulation | "nghiện nicotine là gì" (180) | 🧠 Nghiện thuốc không phải yếu ý chí — não anh đã upregulate 300% receptor nicotine (Benowitz 2010). Hiểu bộ máy = bớt tự trách. Hôm nay: đọc cơ chế, chưa làm gì. |
| L-3 | `lam-quen-ngay-3-chi-phi-thuc-su` | Calculator chi phí: tiền + năm sống + bệnh | WHO economics; smoking-attributable cost | "chi phí hút thuốc lá" (110) + "calculator" | 💰 30k/ngày × 365 × 30 năm = 328M. Cộng 10 năm sống mất (Doll 2004): mỗi điếu = 11 phút đời. Tính riêng cho anh ở link bài (interactive calculator). |
| L-4 | `lam-quen-ngay-4-tai-sao-bo-thuoc-thuong-that-bai` | Common pitfalls — không phải tại bạn | Hughes 2008 — 75% người thử mỗi năm | "bỏ thuốc thất bại nhiều lần" (95) | 🔄 Trung bình 7-10 lần thử mới thành công (Chaiton 2016). Không phải yếu — là sinh học. Hôm nay: nhớ lại 3 lần thử trước, ghi lý do từng lần vấp. |
| L-5 | `lam-quen-ngay-5-3-phuong-phap-khoa-hoc` | Cold turkey, Tapering, NRT/Champix — so sánh | Cochrane reviews | "phương pháp cai thuốc lá nào hiệu quả" (240) | 🔬 3 phương pháp đã được chứng minh: cold turkey (RR x1), tapering (RR x1), NRT/Champix (x1.5-2.9). Cả 3 đều work — chọn theo tính cách. Hôm nay: đọc 3 phương pháp, chọn 1. |
| L-6 | `lam-quen-ngay-6-do-muc-san-sang` | Stages of Change assessment | Prochaska TTM 1983 | "tôi đã sẵn sàng bỏ thuốc chưa" (75) | 📊 5 stage sẵn sàng (Prochaska): Pre-contemplation → Contemplation → Preparation → Action → Maintenance. Làm test 5 câu — biết anh đang ở đâu. Stage 3 mới nên đặt Q-Day. |
| L-7 | `lam-quen-ngay-7-cam-ket-chon-lo-trinh` | Commitment ceremony + chọn route | Implementation intention; commitment device theory | "cam kết bỏ thuốc lá" (45) | ✍ Hôm nay: viết cam kết 1 câu + chọn lộ trình (cold turkey ngay / tapering 14 ngày / chờ thêm). Ký tên + ngày. Báo 1 người thân. Mai bắt đầu chính thức. |

**Embed tech notes:**
- L-3: JS calculator (chi phí theo số điếu × giá × năm hút)
- L-6: JS Stages of Change quiz 5-câu (Prochaska based)
- L-7: JS commitment form + email send-to-self

---

## 2. Khung 14 ngày — chia 3 giai đoạn

```
D-14 ── D-11   :  AWARENESS (4 ngày)   — Hiểu mình, chưa giảm
D-10 ── D-5    :  REDUCTION  (6 ngày)  — Cắt từng điếu theo bậc
D-4  ── D-1    :  COUNTDOWN  (4 ngày)  — Chuẩn bị Q-Day
D0             :  → bàn giao series 30 ngày Q-Day
```

**Quy ước ngày:** Sol gọi user theo "T-N" (Tapering, N ngày trước Q-Day) trên UI; slug sol.vn dùng `giam-dan-ngay-N` (1-14, N nhỏ = xa Q-Day, N=14 = ngay trước Q-Day) để SEO friendly.

Mapping nội bộ:
```
T-14 = giam-dan-ngay-1   (xa nhất, awareness)
T-13 = giam-dan-ngay-2
...
T-1  = giam-dan-ngay-14  (sát Q-Day, countdown)
```

---

## 3. Bản đồ 14 bài — Chi tiết từng ngày

Mỗi ngày = 1 bài HTML (1500-2500 từ) + 1 chip 60-80 từ + 1 OG image 1200x630.

### Giai đoạn 1 — AWARENESS (D-14 → D-11)

#### T-14 (D-14): Khởi đầu — Giảm dần có hiệu quả không?
- **Theme:** Đặt nền tảng khoa học, giải tỏa nghi ngờ
- **Science anchor:** Lindson 2016 Cochrane — gradual = abrupt; choice matter
- **Key science:** Non-inferiority RCT data, success rate 6-month
- **Daily action:** Không thay đổi gì hôm nay. Chỉ đếm số điếu hút.
- **Chip preview:** `🌱 T-14 — Giảm dần có khoa học hậu thuẫn. Cochrane 2016 (51 trials, 22k người): tapering = bỏ đột ngột về tỷ lệ thành công 6 tháng. Hôm nay: chỉ đếm điếu, chưa cắt. Sol đi cùng anh 14 ngày tới.`
- **SEO target:**
  - Primary: `giảm dần thuốc lá có hiệu quả không` (search ~210/tháng)
  - Secondary: `phương pháp tapering thuốc lá`, `cold turkey vs giảm dần`
- **CTA:** "Bắt đầu lộ trình 14 ngày miễn phí"

#### T-13 (D-13): Bản đồ trigger — 5 loại điếu phổ biến nhất
- **Theme:** Cue-reactivity, Pavlovian conditioning
- **Science anchor:** Conklin 2007 cue exposure; Tiffany 1990 cognitive processing model
- **Key science:** ~80% smokers có 3-5 "anchor cigarettes" gắn cố định với cue (cà phê sáng, sau bữa ăn, lái xe, bia hơi, sau sex)
- **Daily action:** Ghi mỗi điếu hôm nay: giờ + nơi + cảm xúc trước/sau (template sẵn)
- **Chip preview:** `🗺 T-13 — 80% điếu thuốc gắn với 3-5 trigger cố định: cà phê sáng, sau bữa ăn, bia hơi, lái xe, sau sex. Hôm nay: ghi nhật ký — mỗi điếu ghi giờ + nơi + cảm xúc. Đừng cắt vội.`
- **SEO:**
  - Primary: `trigger thèm thuốc là gì` (140/tháng)
  - Secondary: `nhật ký hút thuốc mẫu`, `cue reactivity thuốc lá`

#### T-12 (D-12): Phân loại điếu — High-value vs Automatic
- **Theme:** Habit hierarchy, mindful vs mindless
- **Science anchor:** West & Hardy 2006 PRIME theory; Wood & Neal 2007 habit research
- **Key science:** Trung bình 70% điếu là "automatic" (đốt mà không nhận thức), 30% là "deliberate". Cắt automatic dễ hơn 3x.
- **Daily action:** Đánh sao 0-3 cho mỗi điếu ghi hôm qua. 0 sao = không nhớ tại sao; 3 sao = thật sự muốn.
- **Chip preview:** `⭐ T-12 — 70% điếu thuốc là "tự động" (đốt không suy nghĩ), chỉ 30% là "có ý thức". Hôm nay: cho điểm 0-3 sao mỗi điếu hôm qua. Điếu 0-1 sao = mục tiêu cắt đầu tiên.`
- **SEO:**
  - Primary: `thói quen hút thuốc tự động`
  - Secondary: `phân loại điếu thuốc`, `prime theory hút thuốc`

#### T-11 (D-11): Đo mức độ phụ thuộc — Test Fagerström (FTND)
- **Theme:** Diagnostic clarity, personalize strategy
- **Science anchor:** Heatherton et al. 1991 — Fagerström Test for Nicotine Dependence (FTND), 6 câu hỏi, score 0-10
- **Key science:** FTND ≤3 = phụ thuộc nhẹ (NRT đủ); 4-6 = trung bình (NRT combo); ≥7 = nặng (cần kê toa Champix/Bupropion)
- **Daily action:** Làm FTND 6 câu (Sol embed form), in/screenshot kết quả
- **Chip preview:** `📊 T-11 — Test Fagerström 6 câu trong 2 phút → biết mức phụ thuộc nicotine 0-10. Điểm ≥7 cần thuốc kê toa. Hôm nay: làm test, screenshot. Quyết định thuốc/NRT sang T-5.`
- **SEO:**
  - Primary: `test fagerstrom tiếng Việt` (50/tháng — niche nhưng converting cao)
  - Secondary: `đo mức phụ thuộc nicotine`, `nicotine dependence score`
- **Tech note:** Bài này cần embed interactive form (JS calculator) — KHÔNG chỉ static HTML

---

### Giai đoạn 2 — REDUCTION (D-10 → D-5)

#### T-10 (D-10): Cắt điếu đầu tiên — Chọn điếu 0 sao dễ nhất
- **Theme:** Self-efficacy ramp-up
- **Science anchor:** Bandura 1977 self-efficacy; mastery experiences = strongest source
- **Key science:** Cắt thắng dễ trước → tự tin → cắt khó sau. Sequence quan trọng hơn quantity.
- **Daily action:** Chọn 1 điếu 0 sao từ nhật ký T-13. Hôm nay: không hút điếu đó.
- **Chip preview:** `✂ T-10 — Hôm nay cắt 1 điếu (chọn từ list 0 sao). Bắt đầu nhỏ để não tin "mình làm được". Tự tin xây từ thắng nhỏ. Cố nhớ cảm giác khi vượt qua giờ đó không cần thuốc.`
- **SEO:**
  - Primary: `cách cai thuốc dần dần` (~480/tháng — KHỦNG)
  - Secondary: `bỏ điếu thuốc đầu tiên`, `tự tin cai thuốc`

#### T-9 (D-9): Cắt thêm 2 điếu — Trì hoãn morning cigarette
- **Theme:** Morning cigarette = highest dependence marker
- **Science anchor:** Baker et al. 2007; FTND item 1 ("Sau khi thức dậy bao lâu thì anh hút?")
- **Key science:** Hút trong 5 phút đầu = nicotine dependence cao. Trì hoãn = tín hiệu cho não rằng "morning ≠ smoke".
- **Daily action:** Trì hoãn điếu sáng ≥60 phút sau khi thức. Trong khoảng đó: uống nước lạnh, đánh răng, đi bộ 200 bước.
- **Chip preview:** `☕ T-9 — Điếu sáng là điếu nghiện nhất (FTND #1). Hôm nay: trì hoãn 60 phút sau dậy. Trong giờ đó: uống nước, đánh răng, đi bộ. Morning ≠ smoke — não cần học lại.`
- **SEO:**
  - Primary: `điếu thuốc sáng có nghiện hơn`
  - Secondary: `trì hoãn điếu thuốc sáng`, `cách bỏ thuốc sáng`

#### T-8 (D-8): Cảnh báo "compensatory smoking" — hút sâu hơn không bù được
- **Theme:** Behavioral compensation effect
- **Science anchor:** Strasser et al. 2007; Benowitz 2002
- **Key science:** Khi giảm số điếu, người hút có xu hướng hít sâu hơn, giữ khói lâu hơn → bù 50% nicotine bị mất. Đây là TRAP của tapering — phải nhận biết.
- **Daily action:** Tự quay video khi hút 1 điếu hôm nay. Soát: có hít sâu khác mọi khi không? Có giữ lâu hơn không?
- **Chip preview:** `⚠ T-8 — Trap của giảm dần: hít sâu/giữ lâu để bù → "compensatory smoking" (Strasser 2007). Bù 50% nicotine = bằng không cắt. Hôm nay: quay video chính mình hút, soát kỹ.`
- **SEO:**
  - Primary: `compensatory smoking là gì`
  - Secondary: `hít sâu thuốc lá có hại hơn`, `bù nicotine khi cai`

#### T-7 (D-7): Mốc 1 tuần giảm — Đánh giá không tự trừng phạt
- **Theme:** Mid-point reflection, recalibration
- **Science anchor:** Marlatt Relapse Prevention; self-compassion (Neff 2003)
- **Key science:** Self-criticism tăng relapse 40%; self-compassion + concrete plan = bền vững.
- **Daily action:** Đếm tổng điếu tuần này vs tuần trước. Target giảm ≥30%. Nếu chưa đạt: KHÔNG tự trách, viết 3 điều đã làm tốt.
- **Chip preview:** `🎯 T-7 — Mốc 1 tuần. Đếm điếu tuần này vs tuần trước. Target -30%. Chưa đạt? Không tự trách — viết 3 điều tốt anh đã làm. Self-criticism tăng tỷ lệ vấp 40%.`
- **SEO:**
  - Primary: `tuần 1 cai thuốc lá đánh giá`
  - Secondary: `tự trách khi cai thuốc`, `self-compassion bỏ thuốc`

#### T-6 (D-6): Behavior substitution — Build "Kit thay thế"
- **Theme:** Replacement behaviors for oral/manual fixation
- **Science anchor:** Marlatt RP framework; Pomerleau 2002 oral fixation
- **Key science:** Hút có 2 thành phần: nicotine (hóa) + oral fixation (tay/miệng). Cắt nicotine dễ; cắt oral fixation cần substitute.
- **Daily action:** Mua/chuẩn bị "Kit Sol": kẹo cao su không đường, hạt hướng dương, ống hút inox, túi đi bộ 200 bước.
- **Chip preview:** `🎒 T-6 — Hút = nicotine + thói quen tay-miệng. Hôm nay: chuẩn bị "Kit Sol" → kẹo cao su, hạt hướng dương, ống hút inox, túi đi bộ. Có vật thay = tay không hụt.`
- **SEO:**
  - Primary: `cách thay thế thói quen hút thuốc`
  - Secondary: `kit cai thuốc tự làm`, `oral fixation cai thuốc`

#### T-5 (D-5): Quyết định NRT/thuốc kê — Đặt mua/đặt lịch khám
- **Theme:** Cessation medication doubles success rate
- **Science anchor:** Stead 2012 Cochrane NRT (RR 1.55); Hughes 2014 bupropion (RR 1.62); Cahill 2013 varenicline (RR 2.24)
- **Key science:** Combination NRT (patch + lozenge) = OR 1.71 vs single. Champix = OR 2.88 vs placebo.
- **Daily action:** Theo FTND ở T-11: ≤3 không cần; 4-6 đặt mua NRT (patch 21mg + lozenge 2mg); ≥7 đặt lịch khám BS để kê Champix/Bupropion.
- **Chip preview:** `💊 T-5 — Theo FTND của anh: nếu ≥4 → NRT (patch + lozenge) tăng odds 1.7x. ≥7 → kê toa Champix/Bupropion (2.2-2.8x). Hôm nay: đặt mua/đặt khám. Sol đi cùng quyết định.`
- **SEO:**
  - Primary: `nrt là gì có hiệu quả không`
  - Secondary: `thuốc cai thuốc lá kê đơn`, `champix bupropion khác nhau`

---

### Giai đoạn 3 — COUNTDOWN (D-4 → D-1)

#### T-4 (D-4): Chọn Q-Day — Timing tối ưu
- **Theme:** Optimal quit date selection
- **Science anchor:** USDHHS 2008 CPG; West 2017 — quit dates within 2 weeks have highest success
- **Key science:** Q-Day không nên xa quá 7 ngày (giảm momentum) cũng không cùng ngày stressor (deadline, tang/cưới). Có 1 ngày nghỉ làm sau Q-Day +50% odds.
- **Daily action:** Đặt Q-Day cụ thể, ghi vào lịch, báo 3 người thân qua tin nhắn.
- **Chip preview:** `📅 T-4 — Đặt Q-Day. Quy tắc: trong 7 ngày tới, không trùng deadline/tang/cưới, có 1 ngày nghỉ ngay sau. Báo 3 người thân hôm nay. Sol sẽ counter-count.`
- **SEO:**
  - Primary: `chọn ngày q day cai thuốc`
  - Secondary: `q day là gì`, `ngày bỏ thuốc nào tốt nhất`

#### T-3 (D-3): Stimulus control — Loại bỏ cue khỏi môi trường
- **Theme:** Environmental design
- **Science anchor:** Conklin et al. 2008; cue exposure → craving spike 200-400%
- **Key science:** Visual cue (gạt tàn, bao thuốc), olfactory cue (mùi áo, mùi xe, mùi rèm) đều trigger craving. Dọn hết = giảm relapse risk 60%.
- **Daily action:** Vứt: gạt tàn, bật lửa, bao thuốc còn lại (KHÔNG GIỮ "1 BAO PHÒNG HỜ"). Giặt: rèm, áo khoác. Hút bụi xe.
- **Chip preview:** `🧹 T-3 — Vứt gạt tàn + bật lửa + bao thuốc còn lại (KHÔNG giữ "phòng hờ"). Giặt rèm + áo khoác. Hút bụi xe. Cue visual + olfactory tăng craving 2-4x. Sạch môi trường = -60% nguy cơ vấp.`
- **SEO:**
  - Primary: `dọn nhà cai thuốc`
  - Secondary: `loại bỏ mùi thuốc lá trong nhà`, `gạt tàn cai thuốc`

#### T-2 (D-2): Implementation intention — Viết 5 Plan B
- **Theme:** If-then planning
- **Science anchor:** Gollwitzer 1999, 2006 — implementation intentions; meta-analysis effect size d=0.65 (medium-large)
- **Key science:** "Khi X xảy ra, tôi sẽ làm Y" (vs "Tôi sẽ cố không hút") = 2-3x success rate. Vì sao: pre-decision giảm cognitive load lúc thèm.
- **Daily action:** Viết 5 câu If-Then cho 5 trigger top (từ nhật ký T-13). Vd: "Khi sau bữa cơm tối thèm, tôi sẽ ra ban công uống nước lạnh 5 phút."
- **Chip preview:** `📝 T-2 — Viết 5 câu "Khi X thì Y" cho 5 trigger nặng nhất. Gollwitzer: if-then plan tăng odds 2-3x. Vd: "Khi sau cơm tối thèm → ra ban công uống nước 5 phút". Cụ thể như công thức nấu ăn.`
- **SEO:**
  - Primary: `plan b cai thuốc lá`
  - Secondary: `if then planning bỏ thuốc`, `kế hoạch chống tái nghiện`

#### T-1 (D-1): Đêm trước Q-Day — Ritual + chuẩn bị thể chất
- **Theme:** Last cigarette ritual, body prep
- **Science anchor:** Marlatt — symbolic transition; Sweanor 2007 — meaningful closure rituals reduce post-quit grief
- **Key science:** "Last cigarette ritual" có ý thức = closure tâm lý, giảm "lapse fantasy" 30%. Ngủ 7+ giờ đêm trước = withdrawal D1 nhẹ hơn 40%.
- **Daily action:** Hút điếu cuối với ý thức (không vội, ngoài trời, viết 1 câu vĩnh biệt). Ăn no bữa tối + 1 quả chuối + 1 ly nước. Đi bộ 30 phút. Ngủ trước 23h.
- **Chip preview:** `🌙 T-1 — Đêm trước Q-Day. Hút điếu cuối có ý thức — ngoài trời, không vội, viết 1 câu vĩnh biệt. Ăn no + chuối + nước. Đi bộ 30 phút. Ngủ trước 23h. Mai 24h khó nhất — chuẩn bị thân thể.`
- **SEO:**
  - Primary: `ngày trước q day cai thuốc`
  - Secondary: `chuẩn bị bỏ thuốc lá`, `last cigarette ritual`

---

### → D0 = Q-Day → bàn giao series Q-Day đã có

Bài T-1 kết thúc với CTA: "Mai là Ngày 1 — bấm vào đây xem 30 ngày tới có gì" → link `https://sol.vn/ngay-1-24-gio-dau-tien-bo-thuoc-la/`.

---

## 4. Format bài viết — đồng bộ với Q-Day series

Mỗi bài T-N HTML theo template cũ (giống QDAY-*.html):

```
<div class="sol-wiki">
  <p class="lead"> — Hook 2-3 câu, đặt vấn đề
  <div class="tldr"> — TL;DR 4-5 bullet ngắn
  [content sections — 3-5 H2]
  <div class="chip-summary"> — Chip 60-80 từ + emoji + link đầy đủ
  <div class="disclaimer"> — Disclaimer y khoa
  <div class="references"> — 3-6 nguồn khoa học
  <div class="related-links"> — Link tới 3 bài sol.vn liên quan
  <div class="cta-box"> — CTA "Bắt đầu lộ trình 14 ngày miễn phí"
  <p class="footer-meta"> — Author + cập nhật
</div>
```

**Độ dài:** 1500-2500 từ mỗi bài. T-11 (FTND) và T-4 (Q-Day picker) cần JS embed nên dài hơn (~3000 từ + form).

**OG image:** 14 ảnh 1200×630 PNG, theo template Q-Day. Tên file: `og-t-N.png` hoặc `og-giam-dan-ngay-N.png`. Visual concept: countdown timer/calendar.

---

## 5. SEO Strategy

### Top opportunity keywords (Việt Nam, low-comp + intent cao)

| Bài | Primary keyword | Vol/tháng* | Difficulty |
|---|---|---|---|
| T-10 | cách cai thuốc dần dần | 480 | LOW (no big competitor) |
| T-14 | giảm dần thuốc lá có hiệu quả | 210 | LOW |
| T-13 | trigger thèm thuốc là gì | 140 | LOW |
| T-9 | điếu thuốc sáng nghiện | 110 | LOW |
| T-2 | plan b cai thuốc lá | 90 | LOW |
| T-11 | test fagerström tiếng việt | 50 | NICHE (cao convert) |
| T-3 | dọn nhà cai thuốc | 40 | NICHE |

*Ước lượng từ pattern Q-Day analytics + Google Trends VN — cần verify qua Ahrefs/SEMrush hoặc Khang search trực tiếp.

### Internal linking plan

Mỗi bài T-N link tới:
- 1 bài T-N±1 (bài liền kề)
- 1 bài cluster A/B Wiki cũ có liên quan (vd T-6 → B6 "Thèm thuốc đêm khuya 90 giây")
- 1 bài Q-Day phù hợp (vd T-1 → QDAY-1)

### Schema markup

Mỗi bài thêm JSON-LD `Article` + `HowTo` (cho các bài action-based) — boost rich snippet rate.

---

## 6. Plan sản xuất

### Phase 4B — Pre-production (~1 ngày, sau khi Khang approve plan này)

1. Khang review + chốt 14 outline + slug
2. Em viết outline chi tiết cho 14 bài (heading H2/H3 + key citation cho mỗi bài)
3. Khang voice review trên T-1 đầu (sample) trước khi viết hết

### Phase 4C — Content writing (~3-4 phiên Claude, mỗi phiên 4-5 bài)

Output mỗi phiên:
- 4-5 file HTML hoàn chỉnh, naming `TAPER-NN-<topic>.html` trong `wiki-skeletons/wiki-articles/`
- 4-5 OG images (batch qua og-gen.py)
- Chip summary embed trong HTML (extract sau bằng `extract-chip-summaries.js` mở rộng)

### Phase 4D — Publish lên sol.vn (~1 phiên)

- Tạo WordPress posts qua existing `publish-qday-series.js` clone
- Set Rank Math SEO meta (focus keyword, title, desc, OG)
- Update sitemap
- Internal linking pass

### Phase 4E — Seed Zalo (~30 phút)

- Mở rộng `extract-chip-summaries.js` để parse TAPER-*.html
- Tạo seed mới `seed:taper-chips` → DB với slug `taper-1` … `taper-14`
- Schema `User.quitDate` đã có; cần field mới `tapering_start_date` (DateTime?) để track ngày bắt đầu 14-day

### Phase 4F — Push integration (gộp vào PHASE 5)

- Cron 08:00 ICT extend logic: nếu user có `taperingStartDate` thì push chip taper trước khi push qday
- Logic: D-14 đến D-1 push `taper-N`; D0 onwards push `qday-N`

---

## 7. Tích hợp với Phase 5 (Zalo push scheduler)

Hai luồng push song song:

| User state | Logic | Push slug |
|---|---|---|
| Có `taperingStartDate`, chưa tới `quitDate` | Push `taper-N` (N = ngày từ taper start) | `taper-1`…`taper-14` |
| Đã qua `quitDate`, trong 30 ngày đầu | Push `qday-N` (N = ngày từ quit) | `qday-1`…`qday-30` |
| Sau Q-Day 30 | Push maintenance series (Phase 6, future) | — |

User chọn route:
- **Cold turkey**: chỉ set `quitDate`, bỏ qua tapering
- **Tapering**: set `taperingStartDate` (=today), `quitDate` (=today+14). Sau Q-Day auto-flow vào series 30 ngày.

---

## 8. Câu hỏi cần Khang quyết trước khi viết

| # | Câu hỏi | Default em propose |
|---|---|---|
| Q1 | Đặt tên series: "14 Ngày Giảm Dần" (chuẩn) hay "Tuần 2 Bộ Thuốc" hay khác? | **"14 Ngày Giảm Dần"** — clear, SEO friendly |
| Q2 | Slug: `giam-dan-ngay-N` hay `chuan-bi-bo-thuoc-N` hay `t-minus-N`? | **`giam-dan-ngay-N`** — VN search natural |
| Q3 | Mô hình tapering: Hierarchical (loại điếu dễ trước) — emer propose? Hay cho user chọn? | **Hierarchical chính + scheduled delay phụ** (như em phác) |
| Q4 | T-11 FTND có cần embed JS calculator interactive không, hay chỉ static form PDF tải về? | **Embed JS** — cao engagement, capture lead |
| Q5 | Có viết kèm 7 ngày "làm quen" (orientation) trước 14 ngày này không, hay tạm dừng plan đó? | **Tạm gác** — focus 14 ngày trước, orientation phase sau |
| Q6 | Có cho user route "cold turkey không tapering" không, hay tất cả phải qua 14 ngày? | **Cho cả 2 route** — user choice, default cold turkey |
| Q7 | Voice các bài: Khang Sol cá nhân (như D1-D2 Q-Day) hay Sol Đồng hành chuẩn? | **Hỗn hợp**: T-14, T-7, T-1 = Khang Sol; còn lại = Sol Đồng hành |
| Q8 | Citation footnote inline (như Q-Day) hay danh sách cuối bài? | **Cuối bài** — đỡ rối, đồng bộ Q-Day |
| Q9 | Pricing CTA: link landing /dang-ky/ chung hay tạo landing riêng /giam-dan-14-ngay/? | **Landing riêng** — track conversion từng phase, A/B test sau |
| Q10 | Order viết: linear T-14 → T-1, hay theo priority SEO (T-10, T-14, T-13 trước)? | **Theo SEO** — T-10, T-14, T-13, T-2, T-9, … lấy traffic sớm |

---

## 9. Open risks

- **Risk 1: Compensatory smoking truyền thông sai có thể khiến user nghĩ "tapering vô ích".** Cần T-8 viết rất kỹ, không scary.
- **Risk 2: FTND test có thể intimidate user mới.** Cần T-11 wrap với tone "đây là thông tin để Sol giúp anh chọn đúng, không phải đánh giá".
- **Risk 3: 14 ngày dài — drop-off có thể cao ở T-7 → T-5.** Cần Zalo push reminder cụ thể, không generic.
- **Risk 4: SEO competing với Q-Day series.** Cần internal linking chuẩn để Google biết Q-Day = main series, Tapering = sub.

---

**Kết kế hoạch — chờ Khang trả lời 10 câu Q1-Q10, em sẽ chốt outline 14 bài và lên lịch viết.**
