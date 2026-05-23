# SOL — Báo cáo Chiến lược Omnichannel CX + Zalo OA Optimization

**Tác giả:** Đội tư vấn Sol (góc nhìn 3 chuyên gia: UX/Product, Digital Cessation Specialist, System Architect)
**Phạm vi:** Audit toàn bộ kênh giao tiếp Sol với khách hàng + Roadmap Zalo OA tối ưu cost-effectiveness
**Cập nhật:** 14-05-2026

---

## TÓM TẮT EXECUTIVE

Sol hiện có **8 kênh giao tiếp** với khách hàng, từ acquisition (sol.vn SEO) đến retention (Zalo OA push, Email funnel) và crisis intervention (Chat widget Socket.IO + Khang Voice). Sản phẩm đã hoàn thiện về mặt hạ tầng — vấn đề không phải xây kênh mới mà **tối ưu vận hành + phân vai kênh rõ ràng theo customer journey 51 ngày**.

Kết luận chính:

1. **Zalo OA là kênh trọng yếu nhất** với target demographic Sol (35-65 tuổi VN) — chi phí thấp nhất, reach cao nhất, retain mạnh nhất. Khuyến cáo: tận dụng 24h-rule để giữ 70% user ở free tier, ZNS template cho 30% dormant.

2. **Customer journey 51 ngày cần phân vai kênh rõ:** Acquisition (sol.vn) → Activation (webapp onboarding + Zalo bind) → Daily engagement (Zalo OA + Web Push) → Crisis (Chat widget + Khang Voice) → Long-term (Email weekly digest + Zalo group community).

3. **Cost model đề xuất:** Average ~650đ/user/tháng cho Zalo OA, ~50đ/user/tháng Email, 0đ Web Push, ~200đ/user/tháng Claude AI chat → Tổng ~900đ/user/tháng. So với pricing 25k/tuần (~100k/tháng), margin contribution channel >90%.

4. **Ưu tiên 90 ngày tới:** (1) Phase 5 Zalo Push Scheduler, (2) Đăng ký + approve 5 ZNS template, (3) Build Zalo group community cho cohort D30+, (4) Analytics dashboard omnichannel.

---

## PHẦN 1 — AUDIT 8 KÊNH GIAO TIẾP HIỆN TẠI

### Kênh 1: sol.vn (WordPress wiki + blog)

**Vị trí trong funnel:** TOP OF FUNNEL — Acquisition

**Tài sản hiện có:**
- 100+ bài Wiki cluster A/B/C đã LIVE
- 30 bài Q-Day series (post-Q-Day)
- 21 bài Pre-Q-Day series (7 Làm quen + 14 Giảm dần) — vừa publish session 14-05-2026
- 19 redirect 301 qua MU-plugin
- Rank Math SEO + GA4 + GSC setup
- SEO coverage ~2.350 search/tháng primary keywords

**Vai trò chính:**
- Bắt traffic organic từ Google (long-tail keywords)
- Educate prospect chưa quyết bỏ thuốc
- Demonstrate expertise scientific (90+ citations Cochrane/NEJM/BMJ)
- Drive về webapp qua CTA

**Việc cần làm vận hành:**
- Internal linking pass mỗi 2 tuần (giữa các bài cluster)
- Schema markup (Article + HowTo) cho rich snippet
- Sitemap update + GSC indexing request cho bài mới
- A/B test CTA copy (anh đã làm phần direct link → bothuocla.sol.vn)
- Quarterly content refresh — update stats, fix dead links

**KPI:**
- Organic search traffic (target 10k+/tháng trong 6 tháng)
- Average position primary keywords (target top 5)
- CTR sol.vn → bothuocla.sol.vn (target ≥3%)
- Dwell time (target ≥2 phút trung bình)

**Chi phí vận hành:** Hosting VPS + domain ~500k/tháng cố định. Cost per user = 0 (organic).

---

### Kênh 2: Webapp bothuocla.sol.vn

**Vị trí trong funnel:** MIDDLE + BOTTOM OF FUNNEL — Activation + Retention

**Tài sản hiện có:**
- Frontend React + Tailwind, mobile-first responsive
- Backend Express + Prisma + Socket.IO
- Onboarding anonymous-first (deviceUid → bind Zalo/phone sau)
- Chat widget với canned reply matching (93 chip canned_replies)
- Daily check-in + journey tracker
- Exercise modules + crisis prep
- Multi-tier subscription (free + 25k/tuần + premium)

**Vai trò chính:**
- Onboarding nhanh (target <60 giây từ landing → first check-in)
- Daily engagement (3-5 touchpoint/ngày: morning goal, check-in, content, exercise, night story)
- Crisis intervention real-time (chat widget + Plan B 90-second)
- Progress visualization (streak, days clean, money saved)
- Identity reinforcement ("Tôi là người không hút")

**Việc cần làm vận hành:**
- Daily content delivery theo journey (đã có CONTENT_ITEMS 127 items)
- Push notification scheduling (đã có Web Push)
- Chat widget routing — canned trước, AI sau (đã hoạt động)
- Journey state machine (UserState model với CHECKIN_FLOW, EXERCISE_FLOW)
- Streak tracking + milestone celebrations
- Lapse recovery flow ("đã hút lại" → Khang voice immediate response)

**KPI:**
- D1/D7/D30 retention (target 60/40/25%)
- DAU/MAU ratio (target ≥0.5 — sticky product)
- Check-in completion rate (target ≥70% D1-7, ≥50% D8-30)
- Time-to-first-value (target <5 phút sau onboarding)
- Conversion free → paid (target ≥5% D7, ≥15% D30)

**Chi phí vận hành:** VPS + Postgres + Redis + Claude AI usage. Cost per user ~3-5k/tháng (giảm dần khi scale).

---

### Kênh 3: Web Push notification

**Vị trí trong funnel:** RETENTION + RE-ENGAGEMENT

**Tài sản hiện có:**
- `backend/src/notifications/webpush.ts` — Web Push API integration
- `PushSubscription` Prisma model (lưu endpoint + keys)
- Cron scheduler đa slot (07:00 morning_goal, 10:00 science_tip, 14:00 phenomena, 16:30 exercise, 20:00 evening_checkin, 21:30 night_story)
- Crisis prep push mỗi 30 phút cho user có `riskyHours`
- Notification preferences (mergeWithDefaults, isInQuietHours, isInActiveWindow)

**Vai trò chính:**
- Bring user back to webapp daily — overcome forgetting curve
- Crisis intervention prevention (push trước khi peak craving)
- Streak protection ("Anh đã 7 ngày — đừng dừng hôm nay")
- Lightweight reminder (không như Zalo OA cần "đọc")

**Việc cần làm vận hành:**
- Permission prompt timing — KHÔNG hỏi lúc onboarding (chuyển đổi thấp)
- Hỏi sau khi user đã commit (D2-3, sau khi vượt cơn thèm đầu tiên)
- Quiet hours mặc định 22:00-06:00 (đã có logic)
- Rich notification với action button ("Đã đọc" / "Cần Sol")
- A/B test timing — 07:00 vs 08:00 vs personalized morning

**KPI:**
- Permission grant rate (target 35-45% — industry benchmark)
- Push delivery rate (browser-side, ngoài kiểm soát Sol)
- Click-through rate (target 8-12% — cao hơn email)
- Daily return rate via push (target 25-35%)

**Chi phí vận hành:** Gần như 0 đồng — Web Push protocol miễn phí, chỉ tốn bandwidth VPS.

**Hạn chế:**
- Chỉ hoạt động trên browser đã subscribe — user đổi máy, đổi browser → mất subscription
- iOS Safari mới support gần đây, market share VN ~15-20% iPhone — vẫn cần kênh khác bù
- Không persistent — user clear browser data thì mất

---

### Kênh 4: Email

**Vị trí trong funnel:** LONG-TERM RELATIONSHIP + RE-ENGAGEMENT INACTIVE

**Tài sản hiện có:**
- `backend/src/scheduler/emailFunnel.ts` — 12-email drip series theo journey
- `emailFunnelAdaptive.ts` — adaptive funnel (chưa LIVE production)
- `emailFunnelTemplates.ts` — template content
- Nodemailer integration
- Idempotent per dayInJourney
- Email + email_verified field trong User

**Vai trò chính:**
- Owned channel — không phụ thuộc platform khác (Facebook/Zalo có thể change policy)
- Long-form content (case study, deep dive science, founder story)
- Re-engagement cho user inactive 7-14 ngày
- Milestone celebrations (D7, D30, D90, D365)
- Receipts + onboarding hand-off
- Lapse recovery (D2 sau lapse: "Day 31 không phải Day 1")

**Việc cần làm vận hành:**
- 12 template email đã có — review + refresh mỗi quý
- Welcome series 3 emails (D0, D2, D5) cho user mới
- Weekly digest cho user active (mỗi Chủ Nhật tổng kết tuần)
- Re-engagement sequence 4 emails cho user inactive 7/14/30/60 ngày
- A/B test subject line — biggest lever cho open rate
- Personalization variables (tên, topReason, ngày, đã làm gì)

**KPI:**
- Open rate (target ≥35% — industry health 20-30%, Sol nên cao hơn vì rất targeted)
- Click rate (target ≥8%)
- Unsubscribe rate (<1%/email)
- Re-engagement success (user inactive 14d → active again target 15-20%)

**Chi phí vận hành:**
- Nodemailer + SMTP provider (vd Postmark, Sendgrid): ~$15-25/tháng cho 100k email
- ~25đ/email × 12 emails × 10k user/năm = 3 triệu/năm
- Per user: ~25đ/tháng (rẻ hơn cả ZNS)

---

### Kênh 5: Zalo OA

> Xem PHẦN 3 cho deep dive đầy đủ. Tóm tắt audit:

**Tài sản hiện có:**
- `backend/src/zalo/oaClient.ts` — send text + buttons + ZNS
- `webhook.ts` — handle user_send_text, follow, unfollow events
- `intentRouter.ts` — match user message → canned reply hoặc escalate
- `signature.ts` — verify Zalo webhook signature
- `templateRoutes.ts` — manage ZNS templates
- 5 Prisma models: ZaloOAUser, ZaloTemplate, UserMessagingProfile, etc.
- User.zaloUserId binding (anonymous → liên kết)

**Vai trò chính:**
- Daily push chip lộ trình (51 ngày: 7 Lam Quen + 14 Tapering + 30 Q-Day)
- Crisis 2-way chat — user thèm reply OA → Sol bot respond
- Re-engagement với ZNS template (paid, ~500đ/tin)
- Cross-device portability (user đổi máy vẫn nhận Zalo)
- Notification ưu thế VN — 80%+ target user dùng Zalo daily

**Chi phí ước tính:** ~650đ/user/tháng (chi tiết PHẦN 3)

---

### Kênh 6: Chat widget Socket.IO real-time

**Vị trí trong funnel:** CRISIS + REAL-TIME SUPPORT

**Tài sản hiện có:**
- Socket.IO bi-directional real-time
- 93 canned reply (42 Wiki cũ + 30 Q-Day + 21 Pre-Q-Day)
- Trigger matching với normalize Vietnamese (lowercase + bỏ dấu)
- Priority + minScore tuning per chip (CRITICAL 1000, thường 100)
- Claude AI fallback khi không match canned
- Crisis chat reply (Phase 1 đã LIVE)

**Vai trò chính:**
- Concierge 24/7 cho user trong webapp
- Fast response (canned reply <100ms, không gọi AI)
- Emergency intervention (chip "sap-hut-lai" priority 300, "y-nghi-tu-hai" priority 1000)
- Conversation memory cho follow-up
- A/B testing copy chip cá nhân theo user state

**Việc cần làm vận hành:**
- Monitor unmatched messages → mở rộng triggers
- Review crisis chip mỗi tuần (đặc biệt y nghĩ tự hại)
- Add chip mới khi có topic hot
- Voice consistency (Khang Sol vs Sol Đồng hành)
- Track conversation flow patterns

**KPI:**
- Canned hit rate (target ≥75% — fast + cheap)
- AI fallback rate (target ≤25% — vì Claude tốn token)
- Resolution rate trong 3 messages (target ≥70%)
- Time-to-first-response (target <1 giây qua Socket.IO)
- Escalation to Khang voice rate (track quality)

**Chi phí vận hành:** Canned reply ~0đ/message. AI fallback ~50đ/message (Claude Haiku). Average per user 5-10 messages/tháng = ~250-500đ/user/tháng.

---

### Kênh 7: Khang Voice — Founder voice content

**Vị trí trong funnel:** TRUST BUILDING + EMOTIONAL ANCHOR (xuyên suốt)

**Tài sản hiện có:**
- 96/100+ bài Wiki có "Khang Sol nói" embedded
- 5 lần cai (1995, 2010, 2015, 2018, 2020) — story arc đầy đủ
- 30 năm hút Vinataba, 5 năm tự do — credentials
- Story specific: vợ rót trà, quát con 7t, vấp 1998/2018 sinh nhật bạn
- `backend/src/voices/` directory — voice management
- Founder signature trong push notification, email, OA chip

**Vai trò chính:**
- Differentiator vs các app generic (đa số là "AI chatbot trung tính")
- Emotional anchor — user nhớ "có người giống mình đã thành công"
- Trust accelerator — 5 năm tự do là proof of work
- Crisis voice — "Khang nói chuyện với tôi như bạn nhậu, không như BS"
- Brand asset không thể copy

**Việc cần làm vận hành:**
- Voice consistency check trước publish (tránh AI generic)
- New content có "Khang nói" trong 70-80% bài quan trọng
- Video Khang short-form (TikTok/Reels potential, chưa khai thác)
- Live Q&A định kỳ (monthly) với cohort active
- Story expansion — add depth, không cliche

**KPI:**
- Qualitative: NPS, user testimonial mentions "Khang"
- Quantitative: brand recall test, time spent với "Khang says" sections
- Retention boost: cohort exposed to Khang voice vs control

**Chi phí vận hành:** Founder time — ưu tiên Sol quan trọng, không thể delegate hoàn toàn.

---

### Kênh 8: Phone/SMS — Backup channel (chưa khai thác)

**Trạng thái:** User.phone field tồn tại, OTP verification có, nhưng KHÔNG có outbound SMS/call.

**Lý do chưa build:**
- SMS VN ~2.000đ/tin — đắt gấp 4 ZNS, gấp 80 email
- Outbound call cần human ops team
- Zalo OA + Email cover 90% use case rẻ hơn

**Khi nào cần:**
- User mất Zalo + email (rất hiếm) — backup recovery
- Crisis CRITICAL (ý nghĩ tự hại) — escalate phone từ founder/clinical partner
- Subscription expiry reminder (cần độ cao reliability)

**Khuyến cáo:** Giữ optional, không invest sớm. SMS provider integration ready khi cần (Twilio/Vietnamobile API).

---

## PHẦN 2 — MA TRẬN VAI TRÒ KÊNH × CUSTOMER JOURNEY 51 NGÀY

```
                  L1   L7   T-14  T-1  D1    D7   D14   D30   D90   D365
                  ────────────────────────────────────────────────────────
sol.vn (SEO)      ███  ▓▓▓  ░░░   ░░░  ░░░   ░░░  ░░░   ░░░   ░░░   ░░░
Webapp app        ░░░  ███  ███   ███  ███   ███  ███   ███   ▓▓▓   ░░░
Web Push          ░░░  ▓▓▓  ███   ███  ███   ███  ███   ▓▓▓   ░░░   ░░░
Email             ░░░  ▓▓▓  ▓▓▓   ▓▓▓  ███   ███  ▓▓▓   ▓▓▓   ▓▓▓   ▓▓▓
Zalo OA push      ░░░  ███  ███   ███  ███   ███  ███   ███   ▓▓▓   ▓▓▓
Chat widget       ░░░  ▓▓▓  ███   ███  ███   ███  ▓▓▓   ▓▓▓   ░░░   ░░░
Khang Voice       ▓▓▓  ███  ███   ███  ███   ███  ███   ███   ▓▓▓   ▓▓▓
Phone/SMS         ░░░  ░░░  ░░░   ░░░  ░░░   ░░░  ░░░   ░░░   ░░░   ░░░

███ = primary channel (gánh chính)
▓▓▓ = support channel (bổ sung)
░░░ = passive/inactive
```

### Diễn giải:

**L1 → L7 (Làm quen):** Acquisition + Activation
- sol.vn dẫn user vào → Khang voice tạo trust trong bài → Webapp onboarding D7
- Email welcome series (D1, D3, D7)
- Zalo OA push chip Lam Quen mỗi sáng (sau khi user bind Zalo)

**T-14 → T-1 (Giảm dần):** Engagement intensity
- Webapp daily check-in + chat
- Zalo OA push chip Giam Dan
- Web Push reminder mỗi sáng
- Chat widget bắt đầu peak usage (cơn thèm tăng)

**D1 → D14 (Q-Day đầu — KHỦNG):** All channels MAX intensity
- Crisis chat widget active 24/7
- Zalo OA push 1-2 chip/ngày
- Web Push crisis prep mỗi 30 phút (khi riskyHours)
- Email milestone D7
- Khang voice xuyên suốt

**D15 → D30:** Maintenance start
- Chat widget giảm dần (cơn thèm giảm)
- Webapp daily content tiếp tục
- Zalo OA push tiếp
- Email weekly digest

**D31 → D90:** Re-engagement focus
- Webapp giảm intensity (DAU 30-40% bình thường)
- Zalo OA group community (nếu launch)
- Email monthly milestone

**D91 → D365:** Long-term retention
- Email + Zalo OA quarterly check-ins
- Khang voice yearly anniversary message
- Community + peer support

---

## PHẦN 3 — ZALO OA DEEP DIVE: KHAI THÁC TỐI ƯU

### 3.1 Vì sao Zalo OA là kênh quan trọng nhất với Sol?

**Demographics fit:**
- Sol target: nam 35-65 tuổi VN hút thuốc lâu năm
- Demographic này 85%+ dùng Zalo daily (StatCounter VN 2024)
- Facebook share giảm còn ~40% nhóm tuổi này
- iPhone/iOS chỉ 15-20% — nhiều người dùng Android entry-level

**Behavioral fit:**
- Nhóm này KHÔNG check email mỗi giờ (40-60% Vietnamese 35+ kiểm email <1 lần/ngày)
- Nhưng CHECK ZALO mỗi giờ (avg 12-20 lần/ngày)
- Notification Zalo có "weight" tâm lý cao hơn email
- User Việt 35+ thường KHÔNG cài app extra cho từng nhu cầu — Zalo là hub

**Cost fit:**
- Zalo OA free tier: 100k tin/tháng (đủ cho ~3.300 user push 1 tin/ngày)
- ZNS template: ~500đ/tin (vs SMS 2.000đ, vs email không có visibility)
- Webhook free, không tốn API call
- Subscriber rate cao (user follow OA thì retain >90% trong năm)

**Conclusion:** Với target audience Sol, Zalo OA có **ROI cao nhất trong tất cả các kênh** — vừa rộng (reach 85%) vừa rẻ (~650đ/user/tháng) vừa engaged (60-80% open rate).

---

### 3.2 Hiểu chính sách Zalo OA — Constraints

**Free tier (Standard OA):**
- 100k tin/tháng push tự do
- Chỉ push được trong **24h sau user tương tác** (gửi tin/tap button/follow mới)
- Sau 24h dormant → KHÔNG push được tự do, phải dùng ZNS
- Rate limit: 50 tin/giây (đủ cho mọi use case Sol scale 10k+ users)

**ZNS (Zalo Notification Service):**
- Template-based — phải submit template lên Zalo + chờ approve 2-3 ngày
- Chi phí: ~500đ/tin (B2C, OA Premium); thấp hơn cho volume cao
- Có thể push BẤT KỲ user nào (đã follow OA), kể cả dormant >24h
- Template content cố định, chỉ chèn variable (tên, ngày, link)

**Premium OA (tùy chọn nâng cấp):**
- Quota cao hơn (1M+ tin/tháng)
- Verified badge — tăng trust
- Chi phí: liên hệ Zalo sales, dao động vài chục triệu/tháng tùy nhu cầu
- **Sol chưa cần ngay** — free tier + ZNS strategic đủ tới 50k users

**Webhook events available:**
- `user_send_text` — user gửi tin nhắn
- `user_send_image` — user gửi ảnh
- `follow` — user follow OA
- `unfollow` — user unfollow
- `user_seen_message` — user đã đọc tin
- `user_click_chatnow` — user click button trong message

---

### 3.3 5-Layer Strategy khai thác Zalo OA

#### Layer 1 — Acquisition: Đẩy user follow OA

**Mục tiêu:** 60-70% user webapp follow Zalo OA Sol.

**Touchpoints để invite follow:**

1. **Webapp onboarding (highest conversion):**
   - Step 3 onboarding: "Liên kết Zalo nhận chip lộ trình mỗi sáng"
   - QR code lớn + button "Mở Zalo" deep link
   - Tỷ lệ follow expected: 55-70% nếu UX tốt

2. **sol.vn blog CTA:**
   - Bài có chip cuối → "Nhận chip tương tự mỗi sáng qua Zalo"
   - QR floating sticky bottom-right
   - Tỷ lệ: 8-15% organic visitor

3. **Email signature:**
   - Mỗi email có footer "Theo dõi Sol trên Zalo OA"
   - Tỷ lệ: 5-8% open

4. **Founder Khang social:**
   - Khi share story Khang Sol trên Facebook/TikTok → CTA dẫn Zalo OA
   - Tỷ lệ: 20-30% (cao vì organic + trust)

5. **In-app reminder:**
   - Sau D3-7, prompt soft "Nhận chip Zalo để không bỏ lỡ"
   - Tỷ lệ: 30-40% (user đã engaged)

**Incentive structure:**
- "Follow OA — nhận miễn phí 51 chip lộ trình cai thuốc" (perceived value cao)
- "Khang Sol tự gửi chip cho anh mỗi sáng" (personal touch)
- KHÔNG ép — softprompt sau khi user đã commit (D2+)

#### Layer 2 — Daily Free Push (Phase 5 em đã plan)

**Cron 08:00 ICT mỗi sáng:**

```
For each user có zaloUserId + zaloPushEnabled = true:
  1. Compute phase (Lam Quen / Tapering / Q-Day) + dayNumber
  2. Lookup canned_replies WHERE slug = '<phase>-<dayNumber>'
  3. Send OA text + button "Đọc đầy đủ → wikiUrl"
  4. Log QdayPushLog
```

**Quota math:**
- Mỗi user nhận 1 chip/ngày × 365 ngày = 365 tin/năm
- 10k users × 365 = 3.65 triệu tin/năm = ~305k tin/tháng
- Free tier 100k/tháng → cần upgrade hoặc tận dụng 24h-rule

**Tận dụng 24h-rule để giữ free:**

Chiến lược: thiết kế chip CÓ ACTION user reply để renew 24h window.

Mỗi chip có button:
- "✅ Đã đọc" — user tap → renew 24h cho free push tiếp
- "💬 Cần Sol hỗ trợ" — escalate sang chat AI
- "🎯 Đã làm xong" — confirm action + renew

User tap button = `user_click_chatnow` webhook → renew interaction window.

**Math optimization:**
- User active (tap ≥1 button/ngày): perpetual free push
- User active ratio target: 70-80%
- Free push quota cần: 70% × 10k × 365 = 2.55M tin/năm → spread đều ~210k/tháng → vẫn cần 2-3 OA accounts (giải pháp dưới)

#### Layer 3 — ZNS Template cho Critical Events

**Khi nào dùng ZNS:**
- User dormant >48h (không tap nút nào) — rớt khỏi 24h-rule
- Critical moments: D1 Q-Day reminder, lapse recovery, weekly milestone
- Marketing campaigns (promo, new feature)
- Re-engagement long-term (D30+, D90+)

**5 ZNS template Sol cần đăng ký:**

1. **`SOL_QDAY_REMINDER`** — Nhắc Q-Day 24h trước
   - Variables: {tên}, {ngày Q-Day}, {lý do}
   - Volume: 1 tin/user, life-time = 10k tin/năm

2. **`SOL_LAPSE_RECOVERY`** — Sau khi user báo lapse
   - Variables: {tên}, {ngày đã cai}, {ngày bắt đầu lại}
   - Volume: 30-40% user vấp 1 lần = 3-4k tin/năm

3. **`SOL_WEEKLY_MILESTONE`** — Tổng kết tuần D7, D14, D21, D30
   - Variables: {tên}, {ngày cai}, {tiết kiệm tiền}, {chip xem tuần này}
   - Volume: 4 tin/user × 70% completion = 28k tin/năm

4. **`SOL_REENGAGE_DORMANT`** — User dormant 14-30 ngày
   - Variables: {tên}, {ngày cuối cùng active}, {Khang nói 1 câu}
   - Volume: 20-30% user dormant = 2-3k tin/năm

5. **`SOL_ANNIVERSARY`** — Mốc 1 năm cai thành công
   - Variables: {tên}, {tổng tiền tiết kiệm}, {năm khỏe}
   - Volume: 1 tin/user × success rate 25% = 2.5k tin/năm

**ZNS cost math:**
- Total volume year 1: ~45k ZNS tin/năm
- 45k × 500đ = 22.5 triệu/năm
- Per user: 22.5M / 10k = 2.250đ/user/năm = **187đ/user/tháng**
- Rẻ hơn SMS (60.000đ/user/tháng) 320 lần

#### Layer 4 — 2-way Crisis Chat trong OA

**Mục tiêu:** Khi user thèm/khủng hoảng, reply OA thay vì mở webapp.

**Logic:**

```
Webhook user_send_text:
  1. Normalize text (lowercase + bỏ dấu)
  2. Match canned_replies triggers (existing logic intentRouter.ts)
  3. If match score ≥ 0.5:
     → Send canned chip text + button "Đọc đầy đủ"
     → Log conversation (ZaloConversation model)
  4. If match < 0.5 OR priority chip CRITICAL:
     → Escalate Claude AI với context Khang Sol persona
     → Send AI response
  5. If contain "y nghĩ tu hại" / "muốn chết":
     → Priority 1000 chip + push notification cho Khang/admin
     → Send hotline 1900 599 920 (TT Tâm thần TPHCM)
```

**Coverage:**
- 75% messages match canned (fast, ~0đ)
- 20% AI fallback (~50đ/message)
- 5% emergency escalate (manual review)

**Estimated cost:**
- User active reply OA 3-5 lần/tuần × 4 tuần = 12-20 reply/tháng
- 80% canned + 20% AI = ~10đ + 60đ = ~70đ/user/tháng

#### Layer 5 — Zalo Group Community (Q3 2026 launch)

**Mục tiêu:** Peer support cho cohort D30+, giảm churn long-term.

**Concept:**
- Tạo Zalo group "Bỏ Vinataba — Sol Cohort 2026"
- Mỗi cohort 20-30 user reach D30
- Founder Khang là admin chính
- Hoạt động: share milestone, hỏi đáp, support khi vấp
- Tự nhiên peer accountability — không cần tool

**Vai trò Sol:**
- Onboarding cohort mới mỗi tháng
- Moderating (Khang tham gia 1-2 post/tuần)
- Curate content tuần (best post Sol)
- Escalate lapse cases riêng tư

**KPI:**
- Active rate (post/comment ≥1 lần/tuần): target 40%
- Retention boost D90: target +15% so với cohort không tham gia group
- NPS group members: target ≥50 (vs 30 bình thường)

**Cost:** 0 đồng (Zalo group free) + Khang founder time.

---

### 3.4 Total Cost Model — Zalo OA scale 10k users

**Layer 1 (Acquisition):** 0đ — built into onboarding UX

**Layer 2 (Daily free push):**
- Active users (70%): 0đ
- Cần ~210k tin/tháng total → upgrade 1 OA Premium hoặc dùng 3 OA accounts ($0)
- **Recommended:** 1 OA Premium ~15M/tháng = 1.500đ/user/tháng cho active users

**Layer 3 (ZNS critical events):**
- 45k tin/năm × 500đ = 22.5M/năm
- Per user: **187đ/user/tháng**

**Layer 4 (2-way crisis chat):**
- Canned 80% × 0đ + AI 20% × 50đ × 15 message/tháng
- Per user: **~150đ/user/tháng** (Claude API cost)

**Layer 5 (Group community):**
- 0đ infra + 5-10h/tuần founder time

**TỔNG cost Zalo OA per user per month:**

| Component | Active user | Dormant user |
|---|---|---|
| Daily push | 1.500đ (Premium) hoặc 0đ (free + 24h-rule clever) | 0đ |
| ZNS critical | 50đ (1 tin/tháng) | 250đ (5 tin/tháng) |
| 2-way chat | 150đ | 0đ |
| **Total** | **~1.700đ** (Premium) hoặc **~200đ** (free) | **~250đ** |

**Average blended:** 70% active free + 30% dormant ZNS = **~280đ/user/tháng**

**So với pricing Sol 25k/tuần = 100k/tháng:** Cost Zalo OA chỉ 0.3% revenue. Rất hợp lý.

---

### 3.5 Strategy chốt: Free tier first, ZNS supplement, Premium khi scale

**Phase 5A (3 tháng đầu):**
- 1 OA Free tier
- Push daily theo Phase 5 plan
- 24h-rule cleverly (interactive buttons)
- 5 ZNS template approve song song
- Volume <100k/tháng → đủ free

**Phase 5B (3-6 tháng):**
- Volume up tới 200-300k/tháng → cần 2nd OA hoặc upgrade Premium
- ZNS volume tăng do nhiều cohort qua D30/D90 mile
- Group community soft launch

**Phase 5C (6-12 tháng, ≥10k users):**
- OA Premium 1 license (verified badge + quota cao)
- ZNS đầy đủ 5 template + variants
- Group community 5-10 active cohort
- Analytics dashboard mature

---

## PHẦN 4 — CHIẾN LƯỢC CHĂM SÓC KHÁCH HÀNG OMNICHANNEL

### 4.1 Phân vai theo customer state

**State A: VISITOR (chưa đăng ký)**
- Primary: sol.vn SEO content
- Secondary: Khang voice trong bài
- Goal: Educate + drive về webapp

**State B: ANONYMOUS USER (đã đăng ký webapp, chưa bind Zalo)**
- Primary: Web Push (nếu permission granted) + Email welcome
- Secondary: In-app prompt bind Zalo
- Goal: Build relationship + convince bind Zalo (cao convert)

**State C: ZALO-BOUND USER (đã follow OA)**
- Primary: **Zalo OA push** (kênh chính)
- Secondary: Webapp daily + chat widget khi crisis
- Tertiary: Email weekly digest
- Goal: Daily engagement, complete journey 51 ngày

**State D: PAID USER**
- Primary: Webapp full features + Zalo OA priority
- Secondary: Email premium content + Khang live Q&A
- Goal: Retain + advocate

**State E: DORMANT USER (inactive >14 ngày)**
- Primary: **ZNS template re-engagement**
- Secondary: Email re-engagement sequence
- Tertiary: Phone call (chỉ cho premium user inactive >60 ngày)
- Goal: Win back hoặc graceful exit

**State F: LAPSED USER (vấp ở D1-30)**
- Primary: Chat widget Khang voice IMMEDIATE
- Secondary: Email lapse recovery template
- Tertiary: Zalo OA chip "lo-hut-roi"
- Goal: "Lapse ≠ Relapse" — bring back trong 24h

**State G: GRADUATED (≥6 tháng cai)**
- Primary: Zalo group community
- Secondary: Email monthly digest + Khang anniversary
- Tertiary: NPS + referral request
- Goal: Long-term retention + word-of-mouth

### 4.2 Quy tắc vàng customer service Sol

1. **Khang voice là vũ khí số 1 — không tiết kiệm.** Mỗi crisis chip + email lapse có chữ ký Khang. Trust >>= AI.

2. **Tốc độ phản hồi:** Chat widget <1s (canned). AI fallback <3s. ZNS template <24h. Email <48h.

3. **Self-serve trước, human sau.** 93 chip canned cover 75% case. Còn lại escalate AI/Khang. Founder time là tài nguyên hiếm.

4. **Idempotent everything.** Cron push, email funnel, ZNS — tất cả phải tránh duplicate. Một push trùng = trust loss.

5. **Permission > Push.** Hỏi Web Push permission đúng thời điểm (D2-3 sau commit, không phải D0). Convert rate khác 5x.

6. **Cá nhân hóa lý do.** Mỗi user có {topReason} — nhắc khi crisis ("Anh nhớ — vì con anh"). Không generic.

7. **Lapse ≠ Failure.** Mọi channel có message "Day 31 không phải Day 1". Tránh AVE (abstinence violation effect — Marlatt).

8. **Cost-conscious design.** Mỗi message cân nhắc: canned (0đ) > Web Push (0đ) > Email (25đ) > Zalo free (0đ) > Zalo ZNS (500đ) > SMS (2000đ). Default xuống dưới khi cần.

---

## PHẦN 5 — ROADMAP ƯU TIÊN 90 NGÀY TỚI

### Tuần 1-2: Foundation
- ✅ 21 bài Pre-Q-Day LIVE (đã xong)
- ✅ 93 chip seed DB (đã xong)
- ⏳ Phase 5 schema migration (`User.lamQuenStartDate`, `taperingStartDate`, `QdayPushLog`)
- ⏳ Build `backend/src/scheduler/zaloPush.ts` cron worker

### Tuần 3-4: Zalo OA Layer 2 LIVE
- Cron 08:00 ICT push 1 chip/ngày
- Test 50 beta user thật
- Verify 24h-rule renew qua button tap
- Click tracking endpoint + MU-plugin frontend ping

### Tuần 5-6: ZNS Template approval
- Submit 5 template lên Zalo Business
- Đợi approve 2-3 ngày × 5 = 1-2 tuần
- Implement send-ZNS logic backend
- Test với 10 user dormant

### Tuần 7-8: Admin Analytics
- Endpoint `/api/admin/qday-analytics`
- Mini UI bảng Phase × Day × Sent × Clicked × CTR
- Daily summary email cho founder

### Tuần 9-10: Web Push optimization
- Permission prompt timing A/B test
- Quiet hours UI cho user tune
- Crisis prep push thông minh hơn (dựa nhật ký trigger)

### Tuần 11-12: Email funnel refresh
- Review 12 email templates, refresh stats + Khang voice
- Welcome series 3 emails new
- Lapse recovery template

### Tuần 13: Soft launch Zalo Group community
- Tạo group đầu tiên 20 user reach D30
- Khang admin
- Weekly post cadence

---

## PHỤ LỤC — Số liệu benchmark đáng nhớ

| Metric | Sol target | Industry benchmark |
|---|---|---|
| Zalo OA follow rate (webapp user) | 60-70% | 40-55% |
| Zalo OA push open rate | 60-80% | 50-65% (Vietnamese OA avg) |
| Email open rate | ≥35% | 20-30% |
| Email click rate | ≥8% | 2-5% |
| Web Push permission grant | 35-45% | 25-35% |
| Chat canned hit rate | ≥75% | 50-70% (chat bot industry) |
| D7 retention | 60% | 30-40% (health apps) |
| D30 retention | 25% | 8-15% (cessation apps) |
| Free → paid conversion D7 | ≥5% | 2-3% (SaaS) |
| ZNS CTR (re-engagement) | 15-25% | 8-15% |
| Cost per user/tháng (all channels) | <1.000đ | 5.000-15.000đ (cessation programs) |

---

## KẾT LUẬN

Sol đã sở hữu **stack omnichannel mạnh nhất Việt Nam trong segment cessation** — 8 kênh tích hợp, 93 chip canned, 96 bài content Khang voice, infra Zalo OA + Email + Web Push + Chat real-time đầy đủ.

**Cơ hội lớn nhất 90 ngày tới không phải build kênh mới — mà tối ưu vận hành 3 việc:**

1. **Zalo OA Push Scheduler LIVE** (Phase 5) — biến 93 chip thành dòng chảy daily tự động, đạt 70% user active free tier qua 24h-rule clever design.

2. **ZNS template approval + send logic** — mở khóa khả năng push dormant user, recover lapse cases, celebrate milestones với cost <250đ/user/tháng.

3. **Analytics dashboard omnichannel** — đo open/click/reply/click across 4 kênh chính (Zalo, Web Push, Email, Chat) để biết cái nào hiệu quả từng cohort.

**Cost model dự kiến:** ~900đ/user/tháng across all channels — 0.9% revenue Sol (25k/tuần ≈ 100k/tháng). Margin contribution channel >90%.

**Khuyến cáo cuối:** Tập trung 100% effort Phase 5 trong 4-6 tuần tới. Đừng phân tâm với new feature (đã có quá đủ). Vận hành tốt cái hiện có > build cái mới.

— **Sol Advisory Team**, 14-05-2026
