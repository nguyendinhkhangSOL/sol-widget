# Sol Ecosystem V2 — Implementation Roadmap

**Timeframe:** T7/2026 — T6/2027 (Year 1)
**Constraint:** 1 founder (Khang) + part-time content help

---

## I. PHASE 1 — Foundation (T7-T9/2026, Quý 1)

### Goal: Sách V1 ra mắt + store + checkout hoạt động

| Task | Owner | Effort (hours) | Priority |
|---|---|---|---|
| 📝 Viết sách V1 (~280 trang) | Khang | 200h | P0 |
| 🎨 Design ebook cover + layout (Canva/Figma) | Freelance | 20h | P0 |
| 📄 Build sol.vn/sach/ store page (Wordpress + custom blocks) | Sol dev | 30h | P0 |
| 💳 Setup Stripe + bank transfer integration | Sol dev | 20h | P0 |
| 📧 Setup MailerLite + 7-email welcome sequence | Sol dev | 15h | P0 |
| 🔐 Build sol.vn/thanh-vien/ member area (basic) | Sol dev | 40h | P0 |
| ✅ Beta launch với 10 early readers | Khang | 10h | P0 |
| 📊 Setup GA4 + funnel tracking events | Sol dev | 8h | P1 |

**Deliverable Q1:** First 10-30 beta sales, feedback validated, V1.0 ra mắt.

---

## II. PHASE 2 — SaaS Gating + SEO (T10-T12/2026, Quý 2)

### Goal: huongdi gated cho active members + 7 pillars rank Google

| Task | Owner | Effort | Priority |
|---|---|---|---|
| 🔐 Build SSO architecture (shared cookie .sol.vn) | Sol dev | 40h | P0 |
| 🚧 Gate huongdi P1/P2/P3 behind login | Sol dev | 20h | P0 |
| 🎁 Build demo mode (5 câu P1 free) | Sol dev | 12h | P0 |
| 🔍 Submit GSC + index 7 pillars | Khang | 5h | P0 |
| 🔗 Build 5 quality backlinks (guest post / blog VN) | Khang | 30h | P1 |
| 📝 Write 14 spoke pages (2/pillar) | Khang + Sol AI | 80h | P1 |
| 🎙 Record + publish Episode 0 podcast | Khang | 8h | P1 |
| 📱 Setup Newsletter + weekly cadence | Khang | 10h/tháng | P1 |
| 🏠 Update WP homepage sol.vn (Sol ecosystem 3 trụ) | Sol dev | 15h | P2 |

**Deliverable Q2:** 50-100 active members, 5000+ pageviews/tháng từ SEO.

---

## III. PHASE 3 — Premium Tier + Cohort (T1-T3/2027, Quý 3)

### Goal: Recurring revenue from Active + first cohort

| Task | Owner | Effort | Priority |
|---|---|---|---|
| 🛣️ Build Roadmap™ tool (P4) MVP | Sol dev | 60h | P0 |
| 👥 Beta cohort #1 — 10 anh em × 90 ngày | Khang | 40h | P0 |
| 📚 Sách V1.5 update (thêm 2 chương) | Khang | 60h | P1 |
| 🎯 Office hours monthly (Zoom recurring) | Khang | 4h/tháng | P1 |
| 📊 Active dashboard sol.vn/thanh-vien/dashboard/ improvements | Sol dev | 30h | P1 |
| 🎙 Record 7 podcast episodes (1-7) | Khang | 50h | P2 |
| 📝 Write 14 more spoke pages (4 spokes total now) | Khang | 80h | P2 |

**Deliverable Q3:** First 10-cohort revenue (~80-100tr), Active growing to 200+.

---

## IV. PHASE 4 — AI Mentor + Scale (T4-T6/2027, Quý 4)

### Goal: AI Mentor MVP + 200+ Active subscribers

| Task | Owner | Effort | Priority |
|---|---|---|---|
| 🤖 Build Sol AI Mentor™ MVP (Claude API + Khang's content) | Sol dev | 80h | P0 |
| 🎓 Train AI on Khang books + pillars + cohort transcripts | Sol AI | 40h | P0 |
| 🚀 Beta launch AI Mentor cho Active members | Sol dev | 10h | P0 |
| 📊 A/B test pricing (199 vs 249 vs 299) | Sol dev | 15h | P1 |
| 🎯 Optimize conversion funnel based on Y1 data | Sol dev | 30h | P1 |
| 📝 Publish 14 spoke pages remaining (total 28 spokes) | Khang | 80h | P1 |
| 🎬 Launch YouTube channel (8 long-form videos) | Khang | 60h | P2 |
| 🎉 Year 1 retrospective + Year 2 plan | Khang | 20h | P1 |

**Deliverable Q4:** AI Mentor live, 500+ Active subscribers, 30M+ revenue Y1.

---

## V. Resource Allocation — Founder time

### Khang's time budget (~30h/tuần = 1560h/năm)

| Bucket | % | Hours/year | Priority |
|---|---|---|---|
| 📝 Sách writing + updates | 25% | 390h | P0 |
| 📝 Pillar + spoke content | 20% | 312h | P0 |
| 🎙 Podcast + Video | 15% | 234h | P1 |
| 👥 Cohort + Office hours | 12% | 187h | P1 |
| 📧 Newsletter + Community | 8% | 125h | P1 |
| 🎯 Strategy + Analytics | 10% | 156h | P2 |
| 🏢 Other business (CTY CNTT + TMĐT) | 10% | 156h | reserved |
| **Total Sol** | **90%** | **1404h** | |

### Dev resource (allocate carefully)

Recommend:
- **Hire 1 freelance dev** part-time 20h/tuần (~10 triệu/tháng)
- Specialty: React + Node.js + WordPress
- Total Year 1: ~1000h dev time = đủ cho Phase 1-4

---

## VI. Budget Year 1 — Conservative scenario

### Revenue (conservative)
| Quý | Sales/quý | Avg price | Revenue |
|---|---|---|---|
| Q1 | 30 sách (beta) | 199k | 6tr |
| Q2 | 80 sách | 249k | 20tr |
| Q3 | 120 sách + 10 cohort | 249k + 5tr cohort = 80tr | 80tr |
| Q4 | 200 sách + 15 cohort + 50 renewals | (200×249) + (15×5tr) + (50×99) | 130tr |
| **Total Y1** | **430 sách + 25 cohort + 50 renewals** |  | **~236tr** |

### Costs Year 1
| Item | Cost |
|---|---|
| Freelance dev (10tr × 12) | 120tr |
| Hosting + SSL (1tr × 12) | 12tr |
| MailerLite (290k × 12) | 3.5tr |
| Stripe fees (3% × 236tr) | 7tr |
| Domain + tools | 5tr |
| Marketing (organic only) | 0tr |
| **Total Y1 cost** | **~148tr** |

### Net Y1
**236tr - 148tr = ~88tr profit Year 1** (conservative)

→ Year 2 với compound effect: **>500tr revenue** (5-10× Y1).

---

## VII. Risk Mitigation

### Risk 1: Khang time conflict (CTY CNTT + TMĐT)
- **Mitigation**: 90% Khang time vào Sol, 10% other businesses run on autopilot/team
- **Fallback**: Hire content writer cho spoke pages

### Risk 2: Sách writing slow
- **Mitigation**: Voice-record + transcribe + edit (50% faster than typing)
- **Fallback**: V1 chỉ 200 trang (đủ value, có thể launch sớm hơn)

### Risk 3: Low SEO traction Q1-Q2
- **Mitigation**: Tận dụng FB Group + bothuocla cho organic traffic
- **Fallback**: 1-2tr Facebook ads/tháng (Q3+) cho high-converting ad sets

### Risk 4: Dev availability
- **Mitigation**: Hire qua TopCV/Upwork, có backup 2-3 dev sẵn
- **Fallback**: Khang code phần frontend đơn giản (anh có background CNTT)

### Risk 5: Competition appears
- **Mitigation**: Tốc độ + niche focus + community + AI mentor moat
- **Reality check**: Nhỡ có competition, Sol vẫn unique vì 100% Việt + founder-led + Sol AI Mentor™

---

## VIII. Quick-action items NEXT 7 days

| # | Action | Time | Output |
|---|---|---|---|
| 1 | Verify Landing Page mới live OK trên huongdi.sol.vn | 30 phút | Screenshot confirm |
| 2 | Patch 7 spoke pages p3-*.html với header mới | 20 phút | All page nav Việt hoá |
| 3 | Tạo `sol.vn/sach/` placeholder page (coming soon) | 1 giờ | URL reserved + ranking signal |
| 4 | Submit GSC sitemap mới có URL Việt hoá | 15 phút | Google reindex starts |
| 5 | Soạn email newsletter announce rebrand + landing | 1 giờ | Send to existing subscribers |
| 6 | Plan structure cuốn sách V1 (outline 12-15 chương) | 2 giờ | Outline ready for writing |
| 7 | Start writing chương 1 sách | 4 giờ | Draft chapter 1 |

---

## IX. Critical decisions to confirm with Khang

### Q1: Pricing strategy
- **Recommend**: Start 199k (first 100 sales) → 249k (next 500) → 299k (scale)
- **Alt**: Tiered with discount cohort members
- **Khang decide**: 199 / 249 / 299?

### Q2: Active renewal price
- **Recommend**: 99k/năm (continuing, low friction)
- **Alt**: 149k/năm
- **Khang decide**: 99 / 149?

### Q3: Free vs Paid demo huongdi
- **Recommend**: Demo 5-7 câu free (lure), 13-20 câu paid (full)
- **Alt**: Demo 20 câu free, gate ở P2+P3
- **Khang decide**: Where to draw the gating line?

### Q4: SSO complexity vs simple WP login
- **Recommend**: Phase 1 simple WP login → Phase 2 SSO across .sol.vn
- **Alt**: Build SSO right away (complex, 40h dev)
- **Khang decide**: Speed-to-market hay clean architecture từ đầu?

### Q5: bothuocla future
- **Recommend**: Keep 100% free forever, internal funnel only
- **Alt**: Future Premium features (community moderation, video tracker)
- **Khang decide**: bothuocla mãi free hay potential monetize?

---

## X. Done definitions

### "Sách V1 ra mắt" =
- ✅ 280+ trang PDF
- ✅ ePub format
- ✅ Cover design pro
- ✅ Mục lục + intro + 12-15 chương
- ✅ Case study 5+ anh em
- ✅ Pricing card + checkout
- ✅ Beta 10 readers approved

### "SaaS gated" =
- ✅ SSO architecture deployed
- ✅ P1/P2/P3 require login
- ✅ Demo mode 5 câu free
- ✅ Active flag in user DB
- ✅ Renewal flow tested

### "SEO ranked" =
- ✅ 7 Pillar pages all indexed
- ✅ Average position top 20 cho 5+ target keywords
- ✅ 5000+ organic pageviews/tháng
- ✅ 200+ newsletter subscribers từ SEO

### "Active 500+" =
- ✅ 500+ paid Active accounts
- ✅ Monthly churn < 10%
- ✅ MRR > 5tr (50 renewals × 99k/tháng equivalent)
- ✅ NPS > 50

---

*Sol — Đi cùng nhau, đường dài đỡ mỏi.*
*Year 1 = Foundation. Year 2 = Compound. Year 3 = Scale.*
