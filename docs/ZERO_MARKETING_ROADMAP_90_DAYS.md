# SOL ZERO-MARKETING ROADMAP — 90 NGÀY

> Sau khi 7 pillar publish trên `sol.vn/huong-di/`, đây là 4 phase cụ thể để build organic traffic + leads → 50-100 P1 completion/tháng, 5000-15000 visit/tháng sau 6 tháng. KHÔNG tốn ad budget.
>
> **Tác giả:** Sol AI · **Date:** 2026-06-23 · **Status:** Active plan

---

## NGUYÊN TẮC ZERO-MARKETING

Sol KHÔNG cạnh tranh với startup vốn lớn ở Facebook Ads + Google Ads. Sol cạnh tranh ở 4 ưu thế:

1. **Niche cực hẹp** — "Đàn ông Việt 40-65 tái khởi nghiệp" (search volume thấp nhưng intent cao + competition gần như 0)
2. **Khang's first-hand experience** — 20 năm CNTT thật, không phải coach lý thuyết
3. **EEAT cluster sâu** — Thân/Tâm/Trí 3 trụ + 27k+ từ pillar content
4. **Network 20 năm** — Khang có 200-500 contact B2B sẵn, không phải build từ 0

Strategy: **slow + compound + authentic** — đối lập với "scale fast burn cash". Phù hợp với U45.

---

## PHASE 1: ACTIVATE (Tuần 1 — 23-29/6/2026)

Mục tiêu: 7 pillar đang ở DRAFT → publish + Google bắt đầu index.

### 1.1. Publish 7 pillar (Khang làm)

- ✅ Pillar #1 (3345): Đã có featured image. Update content Việt hoá → click Publish
- 🔲 Pillar #2 (3348) → #7 (3353): Verify content + featured image OK → Publish 6 cái

**Lệnh update Pillar #1 với content mới:**
```powershell
cd C:\BOTHUOCLA\sol-widget\docs\pillar-to-wp\
node publish-pillar-to-wp.js ..\huongdi-seo-content\pillar-01-freelancer-chuyen-mon.md --update 3345
```

### 1.2. Update sitemap WordPress (sol.vn)

Rank Math tự tạo sitemap. Sau khi 7 pillar publish, sitemap auto-include:
```
https://sol.vn/sitemap_index.xml
```

Check trong Rank Math → Sitemap Settings → verify CPT "huong-di" enabled.

### 1.3. Submit Google Search Console

Anh vào GSC property `sol.vn`:

```
URL Inspection → paste từng URL → Request Indexing:

https://sol.vn/huong-di/freelancer-chuyen-mon-tuoi-45/
https://sol.vn/huong-di/coaching-dao-tao-tuoi-45/
https://sol.vn/huong-di/content-creator-tuoi-45/
https://sol.vn/huong-di/khoi-nghiep-kinh-doanh-tinh-gon-tuoi-45/
https://sol.vn/huong-di/dai-ly-phan-phoi-tuoi-45/
https://sol.vn/huong-di/dich-vu-service-business-tuoi-45/
https://sol.vn/huong-di/dau-thau-hop-dong-tuoi-45/
```

Limit GSC: 10-20 request/ngày. Submit dần trong 1-2 ngày.

### 1.4. Cross-link audit (em làm)

Em viết script verify mỗi pillar có:
- 3+ link tới `/p1.html`
- Link tới `/p2.html`, `/p3.html`
- 2-3 link tới pillar khác (cluster)
- Link tới `sol.vn/khang-sol/`
- Link tới `bothuocla.sol.vn`

Đã có sẵn trong content. Verify sau publish.

### 1.5. Share manual lên LinkedIn + Facebook (Khang)

**LinkedIn Khang:** Mỗi pillar 1 post 200-300 từ + link → 7 posts trong 2 tuần (1 post / 2 ngày)

Template post:
```
Năm 2024 mình rời công ty cũ ở tuổi 45.

Sau 18 tháng, mình hệ thống hoá 37 hướng đi tái khởi nghiệp cho đàn ông U45.

Hôm nay mình share hướng đầu tiên: [Tên Pillar]

[Hook 2-3 câu]

[3 takeaway chính]

→ Đọc full tại: [link]

#TaiKhoiNghiep #U45 #VietNamFounders
```

**Facebook personal Khang:** Cross-post tương tự, audience khác = double reach.

→ Backlink + signal đầu tiên cho Google + traffic referral.

---

## PHASE 2: FOUNDATION (Tuần 2-4 — 30 NGÀY)

Mục tiêu: Build email list + community + setup analytics + bắt đầu 37 spoke pages.

### 2.1. Setup GA4 + Conversion tracking

Em hỗ trợ:
- Tạo GA4 property cho `sol.vn` (nếu chưa có)
- Inject GA4 tag vào WordPress (qua Rank Math hoặc manual)
- Setup conversion events:
  - P1 test started
  - P1 test completed
  - Email opt-in
  - Click "Liên hệ Khang"

→ Track ROI dù không có ad budget. Biết content nào convert.

### 2.2. Email list build

**Tool:** Convertkit (free 1000 subscribers) hoặc MailerLite (free 1000 sub)

**Opt-in form đặt ở:**
- Footer mỗi bài pillar
- Sidebar sol.vn
- Pop-up sau 30 giây (low aggressive)
- CTA cuối mỗi pillar: "Subscribe để nhận tuần 1 bài về tái khởi nghiệp U45"

**Lead magnet (em viết):**
"Bộ template 5 file Khang dùng khi tái khởi nghiệp"
- Template Capability Statement
- Template Contract freelance
- Template Invoice
- Bảng tính pricing freelance VN
- Checklist 30 ngày MVP validation

→ Free download trade email. Build list 100-500/tháng.

### 2.3. Newsletter Weekly — Khang viết

Mỗi sáng Chủ Nhật, Khang viết 1 newsletter 300-500 từ:
- Subject: "Tuần này mình học được gì về tái khởi nghiệp U45"
- Format: 1 câu chuyện thật + 1 lesson + 1 CTA

Tool: Convertkit broadcast. Schedule sáng Chủ Nhật.

→ Email list = tài sản số 1 cho Sol. KHÔNG phụ thuộc thuật toán FB/Google.

### 2.4. Khang's LinkedIn presence

Routine 3 posts/tuần (Thứ 2, 4, 6 sáng 8-9h):
- **Thứ 2:** Story-driven (kinh nghiệm tuần qua)
- **Thứ 4:** Framework/insight (mini-tutorial)
- **Thứ 6:** Curated content (chia sẻ + ý kiến Khang về bài/sách hay)

Mỗi post 250-400 từ. KHÔNG hashtag spam. KHÔNG ngày nào cũng post (LinkedIn algorithm phạt).

→ 12 posts/tháng → 150 posts/năm = personal brand Khang.

### 2.5. Cross-link cluster (em automate)

Em viết script audit + suggest internal link:
- Mỗi pillar phải link tới 2-3 pillar khác (DNA related)
- Mỗi pillar link tới ít nhất 5 spoke (khi có)
- Sitewide internal link min 15+ per page

Tool: Rank Math suggest internal link. Em verify + add manual nếu thiếu.

### 2.6. 37 Spoke Pages — Start

Mỗi tuần 5-6 spoke (sub-niche cụ thể trong 1 pillar). Ví dụ:

**Pillar #1 (Freelancer Chuyên Môn) → 7 spoke:**
- `/huong-di/tu-van-it-tuoi-45/`
- `/huong-di/tu-van-ke-toan-tuoi-45/`
- `/huong-di/tu-van-phap-ly-startup/`
- `/huong-di/tu-van-marketing-sme/`
- `/huong-di/hr-tuyen-dung-senior/`
- `/huong-di/pm-du-an-outsource/`
- `/huong-di/coaching-nghe-nghiep/`

Mỗi spoke 1500-2500 từ — chi tiết hơn pillar. Pattern: take 1 trong 7 hướng của Pillar #1 → expand thành 1 trang riêng.

→ Em delegate subagent viết 5 spoke/tuần × 7 tuần = 35 spoke (gần đủ 37 hướng).

---

## PHASE 3: AUTHORITY (Tuần 5-12 — 60-90 NGÀY)

Mục tiêu: Backlink + PR + community → DA tăng từ 0 lên 15-25, organic 1000-5000 visit/tháng.

### 3.1. Guest posting (10-20 posts)

Target blog VN có audience U45:
- **HBR Vietnam** (hbr.vn)
- **Brands Vietnam** (brandsvietnam.com)
- **HRchannels** (hrchannels.com)
- **VietnamWorks Blog**
- **Cafef.vn** (mục Khởi nghiệp)
- **Theleader.vn**
- **TechinAsia Vietnam**

Email outreach template (em viết):
```
Chào [Editor name],

Mình là Khang Sol — 20 năm CNTT, founder Đi Cùng Sol — startup hướng dẫn đàn ông Việt 40-65 tái khởi nghiệp.

Mình đang viết series về thực tế tái khởi nghiệp tuổi 45+ ở Việt Nam, dựa trên trải nghiệm của 50+ founder mình interview.

Đề xuất pitch 3 bài cho [blog name]:
1. [Topic 1]
2. [Topic 2]
3. [Topic 3]

Mỗi bài 1500-2000 từ, exclusive, không AI-generated.

Có thể tham khảo style của mình tại sol.vn/khang-sol/.

Cảm ơn.
Khang Sol
```

→ Mỗi guest post = 1 backlink chất lượng + 100-500 referral traffic. Target 10-20 trong 60-90 ngày.

### 3.2. Podcast guest appearance (5-10 podcasts)

Target podcast Việt:
- **TFS Podcast** (Trần Trọng Đan)
- **WeChoice / Vietcetera**
- **Trần Quốc Khánh Show**
- **HieuTV / Trungquandev**
- **The Quoc Khanh Show**
- **Sunhuyn Podcast**
- **Spiderum Podcast**

Email outreach (em viết). Mỗi podcast = 1 hour Khang xuất hiện = 1000-10000 listener exposure + 1 backlink show notes.

### 3.3. Báo VnExpress / Tuổi Trẻ pitch

Pitch story cho phóng viên:
- "Một CTO 45 tuổi rời corporation xây 3 startup phục vụ đàn ông VN trung niên"
- "Cộng đồng founder 45+ Việt Nam: 5 case study tái khởi nghiệp 2024-2026"

Email outreach tới Tuổi Trẻ Online, VnExpress mục Khởi nghiệp, Saigon Times.

→ 1 báo bài = 5000-50000 exposure + DA 70+ backlink. Worth 10-50 guest posts khác.

### 3.4. Cộng đồng Zalo + Facebook

**Zalo OA "Sol — U45 Tái Thiết":**
- 1-on-1 chat với subscriber
- Daily tip ngắn 100-200 từ
- Weekly group call (5-10 người)

**Facebook Group "Đi Cùng Sol — U45 Tái Khởi Nghiệp":**
- Private group, approval-based join
- Khang là admin
- Daily prompt + discussion
- Monthly offline meetup (HN/HCM)

→ Community = retention + word-of-mouth + repeat visitor. Target 200-500 members trong 90 ngày.

### 3.5. SEO technical optimization

Em audit + fix:
- Page speed (target Core Web Vitals >75)
- Mobile usability
- Schema markup verification
- Broken link check
- 404 redirect setup

Tool: Rank Math + Google PageSpeed Insights + Screaming Frog (free trial).

### 3.6. Content refresh

Mỗi 30 ngày, update 1-2 pillar cũ:
- Add new case study
- Update pricing 2026
- Refresh featured image nếu cần
- Update internal link với spoke mới

Google reward "fresh content". Pillar update = boost ranking đều đặn.

---

## PHASE 4: SCALE (Tháng 4-6 — Sau 90 ngày)

Mục tiêu: 10000-30000 visit/tháng, 50-200 P1 completion/tháng, 5-20 paid coaching/tháng.

### 4.1. Paid Course / Cohort launch

Sau 90 ngày có audience 500-2000 email + 100+ community member, launch:
- **Cohort 1 — "Tái Khởi Nghiệp U45 trong 90 ngày"**
- Pricing: 3-8 triệu / member
- 20-50 member / cohort
- Cohort 4 lần/năm (mỗi quý 1 lần)

→ Revenue 60-400 triệu / cohort. Major income channel.

### 4.2. Book "Tái Khởi Nghiệp Tuổi 45+" của Khang Sol

Compile 7 pillar + 37 spoke + Khang's story → 1 cuốn sách 300 trang. Tự xuất bản (KDP Amazon + Tiki Trading + Fahasa).

→ Sách = ultimate trust signal + lead magnet vĩnh viễn. 1 quyển 200k-500k. Bán 500-2000 quyển = 100-1000 triệu revenue + countless leads coaching.

### 4.3. Sol Community Membership

Paid membership "Sol Tri Tuệ" — 500k-2tr/tháng:
- Weekly 1-1 office hour với Khang
- Private community
- Monthly templates + tools
- Quarterly offline meetup

Target 50-200 member sau 6 tháng = 25-400 triệu/tháng recurring revenue.

### 4.4. B2B Consulting tăng pricing

Sau khi có authority, Khang tăng pricing consulting:
- Hourly: 1-3 triệu → 3-5 triệu
- Project: 30-80 triệu → 100-300 triệu
- Retainer: 30 triệu → 60-100 triệu/tháng

→ Doanh thu consulting 60-150 triệu/tháng → 200-500 triệu/tháng.

---

## CONVERSION FUNNEL OPTIMIZATION

Cấu trúc funnel zero-marketing Sol:

```
[Organic Traffic] (Google search "khởi nghiệp tuổi 45+")
       ↓ 100%
[Sol pillar page] (đọc 12 phút)
       ↓ 5-10%
[P1 test 5 phút] (huongdi.sol.vn/p1.html)
       ↓ 50%
[P2 + P3 hoàn thành] (mapping + ranking)
       ↓ 20%
[Email opt-in] (download template)
       ↓ 30%
[Newsletter subscriber 4 weeks]
       ↓ 5-10%
[Coaching booking call]
       ↓ 30%
[Paid coaching / course] (3-30 triệu)
```

**Math:** 1000 organic visit/tháng → 50-100 P1 → 25-50 P2/P3 → 5-15 email opt-in → 0-2 coaching booking/tháng.

→ Tháng 6 (10000-30000 visit): 50-200 P1, 5-20 coaching booking, 1-5 cohort signup.

**Revenue projection 6 tháng:**
- Coaching: 5-15 client × 10-30tr = 50-450tr/tháng
- Cohort: 20-50 × 5tr/quý = 100-250tr/quý
- Consulting: 1-2 project × 50-100tr = 50-200tr/tháng
- Sách: 50-200 quyển × 300k = 15-60tr/tháng

**Total potential month 6:** 150-500 triệu/tháng revenue. Zero ad budget.

---

## SCHEDULED AUTOMATION

Em setup cron task cho Khang để tự động hoá:

### Hàng ngày
- Check GSC errors/penalties (auto email Khang nếu có)
- Check uptime 4 domain (UptimeRobot free)
- Auto backup DB sol.vn + huongdi (daily 3am)

### Hàng tuần
- Pull GSC Performance report → email Khang Sunday morning
- LinkedIn auto-post (Khang draft, schedule qua Buffer free)
- Newsletter draft (Convertkit auto-schedule)

### Hàng tháng
- Rank Math sitemap audit
- Broken link check
- Top 10 ranking keyword report
- P1 completion stats
- Email list growth metric

Em viết script Node cho các tasks này, host trên VPS đã có (sol-vps-01).

---

## KPI TRACKING — 6 MILESTONES

| Milestone | Tuần | Indexed | Visit/tháng | P1 done/tháng | Email list | Revenue/tháng |
|---|---|---|---|---|---|---|
| Launch | 1 | 1/7 → 7/7 | 0-100 | 1-5 | 50-100 | 0 |
| Foundation | 4 | 7/7 | 200-500 | 10-30 | 200-500 | 5-20tr |
| Authority | 12 | 7 pillar + 35 spoke | 1000-3000 | 50-100 | 800-2000 | 30-100tr |
| Scale | 24 | full cluster | 10000-30000 | 200-500 | 3000-8000 | 100-300tr |
| Optimize | 36 | optimized | 30000-60000 | 500-1000 | 8000-15000 | 200-500tr |
| Compound | 52 | dominant | 50000-100000 | 1000-2000 | 15000-30000 | 300-1000tr |

---

## RISK + MITIGATION

| Risk | Likelihood | Mitigation |
|---|---|---|
| Google update penalty | Medium | Stick with EEAT, no thin content, no AI-only text |
| Khang burnout (work 1 mình) | High | Hire VA part-time 5-10tr/tháng sau Tháng 3 |
| Content quality drop | Medium | Khang review BẮT BUỘC mỗi bài subagent viết |
| Competition copy Sol | Low (niche hẹp) | Move fast, build moat qua personal brand |
| WordPress sol.vn down | Low | Daily backup + UptimeRobot alert |
| Subagent timeout (như đã gặp) | Medium | Chia batch nhỏ 1-2 agent, không launch 6 cùng lúc |

---

## RECOMMENDED ACTION — TUẦN NÀY

Anh chốt **top 3 việc tuần này** (23-29/6):

### 1️⃣ Publish 7 pillar (URGENT — 2 giờ Khang)
- Update Pillar #1 với content Việt hoá
- Verify content + featured image 6 pillar khác
- Click "Publish" trên wp-admin

### 2️⃣ Submit GSC (15 phút Khang)
- URL Inspection 7 URL → Request Indexing
- Verify Rank Math sitemap

### 3️⃣ Em set up Phase 2 prep (4 giờ em)
- Script auto-cross-link audit
- Generate 5 spoke first batch (Pillar #1 sub-niches)
- Email list opt-in form template
- LinkedIn post template 7 pillar

Sau khi xong 3 việc trên, em sẽ proactively suggest:
- GA4 tracking setup
- Convertkit/MailerLite signup
- Outreach email list 30 podcast/blog
- Plan Khang's LinkedIn 12 posts cho tháng tới

---

## TỔNG KẾT — "SOL ZERO-MARKETING THESIS"

Sol KHÔNG cạnh tranh ở "biggest budget" — Sol cạnh tranh ở:

1. **Niche cực hẹp** "Đàn ông Việt 40-65 tái khởi nghiệp" — competition gần 0
2. **Authentic voice** "mình-anh" — không corporate, không marketing fluff
3. **EEAT cluster** — Khang real first-hand 20 năm CNTT
4. **3 trụ ecosystem** Thân/Tâm/Trí — cross-promote tự nhiên
5. **27k+ từ content** chuyên sâu — Google reward depth over breadth

→ 6 tháng đầu sống bằng coaching + consulting cũ + content compound. Tháng 6-12 monetize qua cohort + course + membership. Năm 2 break-even nếu Khang focus full-time.

Đây là path "compound" — chậm 6 tháng đầu nhưng exponential từ tháng 12. Đối lập với "burn cash for growth" mà tuổi 45+ KHÔNG nên chọn.

Đi cùng nhau, đường dài đỡ mỏi.

---

**Author:** Sol AI · **Version:** 1.0 · **Date:** 2026-06-23
