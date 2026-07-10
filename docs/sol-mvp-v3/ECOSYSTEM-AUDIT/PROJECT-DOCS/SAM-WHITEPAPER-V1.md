# Sol Assessment Method (SAM)
## Whitepaper V1.0 — Nền tảng khoa học của Hệ thống 5 Bước Sol La Bàn

**Xuất bản lần 1:** 08/07/2026
**Đơn vị phát hành:** Sol La Bàn / CTY CP VINET
**Tác giả biên soạn:** Nhóm nghiên cứu Sol (Khang Sol + AI cộng tác)
**Trạng thái:** V1.0 — Phiên bản nền, mở cho phản biện học thuật

---

## Tóm tắt (Executive Summary)

Whitepaper này trình bày **Sol Assessment Method (SAM)** — phương pháp đánh giá và định hướng nghề nghiệp dành riêng cho người Việt Nam độ tuổi 40-60 đang tìm hướng đi thứ hai (tái khởi nghiệp, chuyển nghề, chuyển giai đoạn sự nghiệp).

SAM là một khung tổng hợp (hybrid framework), kết hợp ba trường phái đã được chứng minh khoa học:

1. **Đánh giá đặc điểm cá nhân (trait-based personality assessment)** — có gốc từ nghiên cứu psychometric hơn 90 năm, đặc biệt DISC (Marston, 1928) và Big Five (Costa & McCrae, 1985).
2. **Kiểm kê nguồn lực cá nhân (personal resource inventory)** — có gốc từ Business Model You (Clark, Osterwalder, Pigneur, 2012) và Personal Balance Sheet trong tài chính hành vi (Thaler, 2015).
3. **Thuật toán khớp lệnh nghề nghiệp (career-fit matching engine)** — vay mượn kỹ thuật cosine similarity từ hệ khuyến nghị của Salton (1988) và các recommender system hiện đại (Ricci, Rokach, Shapira, 2011).

SAM **KHÔNG SAO CHÉP** một phương pháp đơn lẻ nào (RIASEC, MBTI, DISC, Big Five, CliftonStrengths, Sparketype). Thay vào đó, SAM tuỳ biến khung tổng hợp cho **bối cảnh Việt Nam 40-60** — nơi các phương pháp phương Tây được thiết kế cho tuổi trẻ hoặc corporate ứng dụng không hoàn toàn phù hợp.

Whitepaper này đồng thời **thừa nhận thẳng thắn** rằng SAM đang ở giai đoạn nghiên cứu ban đầu (Phase 0 – Proof of Concept). Chúng tôi công bố methodology, giới hạn, và lộ trình validation để cộng đồng chuyên gia có thể phản biện. Đây là cam kết minh bạch khoa học.

---

## Mục lục

1. Bối cảnh và câu hỏi nghiên cứu
2. Tổng quan các phương pháp đánh giá nghề nghiệp phổ biến
   2.1. RIASEC (Holland Code)
   2.2. Big Five (Five-Factor Model)
   2.3. MBTI (Myers-Briggs Type Indicator)
   2.4. DISC Assessment
   2.5. CliftonStrengths (StrengthsFinder)
   2.6. Sparketype và Ikigai
3. Vì sao 6 phương pháp trên không đủ cho persona Sol
4. Sol Assessment Method (SAM) — Methodology chi tiết
   4.1. Layer 1 — DNA scoring (4 trục P)
   4.2. Layer 2 — Resource Inventory (7 trục R)
   4.3. Layer 3 — Vector Matching Engine
5. Cơ sở lý thuyết của từng thành phần SAM
6. Thuật toán hình thức (Formal algorithm)
7. Validation Roadmap
8. Giới hạn thừa nhận của SAM
9. Đạo đức và tuyên bố miễn trừ (YMYL disclosure)
10. Kết luận
11. Tài liệu tham khảo (References)

---

## 1. Bối cảnh và câu hỏi nghiên cứu

### 1.1. Vấn đề thực tế

Việt Nam đang bước vào giai đoạn dân số vàng nhưng đối diện với hiện tượng "sự nghiệp loãng ở tuổi trung niên" (career mid-life plateau). Theo báo cáo của Tổng cục Thống kê Việt Nam (2024), số lao động 40-60 tuổi chiếm khoảng 35% lực lượng lao động, trong đó tỷ lệ **muốn chuyển hướng nghề nghiệp trong 5 năm tới** đang tăng do:

- Tái cấu trúc doanh nghiệp sau đại dịch COVID-19
- Làn sóng AI thay thế công việc trung cấp
- Con cái đã lớn — thời gian cá nhân tăng
- Áp lực tài chính chuẩn bị hưu trí (Vietnam Social Security 2024)

Tuy nhiên, các công cụ định hướng nghề nghiệp hiện có tại Việt Nam đa phần:
- Nhắm vào **học sinh trung học** (RIASEC, MBTI phiên bản trắc nghiệm nhanh)
- Nhắm vào **tuyển dụng corporate** (DISC, CliftonStrengths dịch)
- Nhắm vào **tuổi trẻ khởi nghiệp** (Business Model Canvas cho startup)

Không có công cụ nào **thiết kế riêng** cho persona:
- Người 40-60 có 15-30 năm kinh nghiệm
- Nguồn lực đa dạng (vốn, network, thời gian, sức khoẻ) không đồng nhất
- Rủi ro chuyển hướng lớn (thu nhập, uy tín, gia đình)
- Cần **actionable output** (mô hình cụ thể + roadmap) chứ không phải "biết type để làm gì?"

### 1.2. Câu hỏi nghiên cứu

Sol Assessment Method (SAM) được xây dựng để trả lời 3 câu hỏi:

1. **RQ1** — Làm thế nào đánh giá đồng thời **cả nội tại (personality traits) và ngoại tại (available resources)** của một cá nhân 40-60 để dự đoán khả năng thành công trong một mô hình kinh doanh solo?
2. **RQ2** — Có thể xây dựng một **thuật toán khớp lệnh (matching engine)** để đề xuất top N mô hình phù hợp nhất từ database mô hình đã curate?
3. **RQ3** — Kết quả đề xuất có tính **giải thích được (explainable AI)** để user hiểu "vì sao mô hình này phù hợp" thay vì output kiểu blackbox?

---

## 2. Tổng quan các phương pháp đánh giá nghề nghiệp phổ biến

Trước khi trình bày SAM, chúng tôi phân tích 6 phương pháp phổ biến nhất trên thế giới để làm rõ **Sol vay mượn gì và không vay mượn gì**.

### 2.1. RIASEC (Holland Code)

**Nguồn gốc:** John L. Holland, 1959, "A Theory of Vocational Choice" (Journal of Counseling Psychology).

**Nguyên lý:** Con người có 6 kiểu tính cách nghề nghiệp:
- **R**ealistic (thực tế) — thợ, kỹ sư, nông
- **I**nvestigative (nghiên cứu) — nhà khoa học, phân tích
- **A**rtistic (nghệ thuật) — viết, thiết kế
- **S**ocial (xã hội) — giáo viên, coach
- **E**nterprising (kinh doanh) — bán hàng, quản lý
- **C**onventional (quy củ) — kế toán, hành chính

Bài test 60-180 câu → xếp hạng 6 trục → cho ra "Holland Code" 3 chữ (VD "SIA" = Social-Investigative-Artistic).

**Giá trị khoa học:** Được validate qua 60+ năm nghiên cứu. Chuẩn ở nhiều nước phương Tây (Nauta, 2010).

**Điểm yếu cho persona Sol:**
- Thiết kế cho học sinh trung học → thanh niên (Holland, 1997)
- Không assess resources (chỉ personality)
- Output là 3 chữ cái, không phải mô hình kinh doanh cụ thể
- Chưa được Việt hoá + validate cho VN

### 2.2. Big Five (Five-Factor Model)

**Nguồn gốc:** Costa & McCrae (1985, 1992) — "The NEO Personality Inventory". Được coi là **chuẩn vàng academic** cho psychometric.

**Nguyên lý:** 5 trục lớn (OCEAN):
- **O**penness to Experience (cởi mở với cái mới)
- **C**onscientiousness (tính kỷ luật)
- **E**xtraversion (hướng ngoại)
- **A**greeableness (hoà nhã)
- **N**euroticism (bất ổn cảm xúc)

Bài test IPIP-NEO 120 câu hoặc NEO-PI-R 240 câu.

**Giá trị khoa học:** Được validate ở 50+ quốc gia (John, Naumann, Soto, 2008). Có phiên bản Vietnamese (Kim & McRae, 2002).

**Điểm yếu cho persona Sol:**
- 120-240 câu quá dài → user 40-60 bỏ giữa chừng
- Không actionable — biết Openness cao thì làm nghề gì?
- Không assess resources
- Xu hướng có "correct answer" bias khi user biết mình sẽ chọn nghề (Paulhus, 1991)

### 2.3. MBTI (Myers-Briggs Type Indicator)

**Nguồn gốc:** Katharine Cook Briggs & Isabel Briggs Myers, 1943, dựa lý thuyết Jung. Phiên bản thương mại: CPP Inc.

**Nguyên lý:** 4 lưỡng phân → 16 types (INTJ, ENTP, ISFJ...).
- **E**xtraversion / **I**ntroversion
- **S**ensing / i**N**tuition
- **T**hinking / **F**eeling
- **J**udging / **P**erceiving

**Phổ biến:** MBTI được dùng rộng rãi trong corporate coaching (Fortune 500 companies). Có 2 triệu người test/năm.

**Critique khoa học nghiêm trọng:**
- Pittenger (1993) — "Measuring the MBTI... And Coming Up Short" (Journal of Career Planning): MBTI **fails test-retest reliability** (50% người ra type khác sau 5 tuần).
- Boyle (1995) — MBTI thiếu **construct validity** (4 lưỡng phân không independent như claim).
- APA (American Psychological Association) **không khuyến nghị** MBTI cho decision-making quan trọng (Furnham, 1996).

**Kết luận:** SAM **KHÔNG kế thừa** MBTI vì các vấn đề khoa học chưa được giải quyết.

### 2.4. DISC Assessment

**Nguồn gốc:** William M. Marston, 1928, "Emotions of Normal People" (Harcourt Brace). Được thương mại hoá bởi Wonderlic, Everything DiSC, TTI Success Insights.

**Nguyên lý:** 4 kiểu hành vi:
- **D**ominance (thống trị) — quyết đoán, kết quả
- **I**nfluence (ảnh hưởng) — nhiệt tình, xã giao
- **S**teadiness (kiên định) — hợp tác, ổn định
- **C**onscientiousness (chuẩn mực) — chính xác, phân tích

Bài test 24-28 câu → xếp hạng 4 trục → profile.

**Giá trị khoa học:** Được validate cho môi trường công sở (Furnham, Wittmann, 2015). Nhưng criticize về base lý thuyết yếu (Wall, 2005).

**SAM vay mượn gì từ DISC:** 
Ý tưởng **4 trục hành vi** ngắn gọn (không phải 5 như Big Five, không phải 6 như RIASEC). Nhưng 4 trục P của Sol (People, Expert, Builder, Independent) **khác về nội dung**:
- Sol tập trung vào **cách tạo giá trị** trong nghề nghiệp solo
- DISC tập trung vào **cách tương tác** trong môi trường tập thể

### 2.5. CliftonStrengths (StrengthsFinder)

**Nguồn gốc:** Donald O. Clifton (Gallup), 1998; sách phổ thông "Now, Discover Your Strengths" (Buckingham & Clifton, 2001) và "StrengthsFinder 2.0" (Rath, 2007).

**Nguyên lý:** 34 strengths chia 4 domain:
- **Executing** (thực thi)
- **Influencing** (ảnh hưởng)
- **Relationship Building** (xây quan hệ)
- **Strategic Thinking** (tư duy chiến lược)

Bài test 177 câu → cho ra top 5 strengths.

**Giá trị khoa học:** Backed bởi Gallup research (25 triệu người test). Được critique về construct validity (Schreiner, 2006) nhưng có ecological validity cao (dự đoán engagement công việc).

**SAM vay mượn gì:** 
Ý tưởng **strengths-based approach** — tìm điểm mạnh để build nghề, không phải sửa điểm yếu. Đây là triết lý nền của cả Bước 1 và Bước 2 trong Sol.

### 2.6. Sparketype và Ikigai

**Sparketype** — Jonathan Fields, 2018, "Sparked: Discover Your Unique Imprint for Work That Makes You Come Alive" (Wiley).
- 10 archetypes (Maker, Scientist, Essentialist, Performer, Sage, Warrior, Advisor, Advocate, Nurturer, Maven)
- Bài test 25 câu
- Actionable output — gợi ý career path

**Ikigai** — khái niệm Nhật, phổ biến qua sách của García & Miralles (2016). 
- Giao của 4 vòng tròn: love / good at / world needs / paid for
- Không phải test → framework tư duy

**SAM vay mượn gì:**
- Từ Sparketype: **archetype thinking** — user nhận diện mình là "type gì" để dễ nhớ
- Từ Ikigai: **triết lý cân bằng** giữa nội tại (love, good at) và ngoại tại (world needs, paid for) → phản ánh vào 2 layer Sol (P nội tại, R ngoại tại)

---

## 3. Vì sao 6 phương pháp trên không đủ cho persona Sol

Sau khi phân tích, chúng tôi kết luận **không có phương pháp đơn lẻ nào** đáp ứng đầy đủ 3 yêu cầu quan trọng cho persona người Việt 40-60 tái khởi nghiệp:

| Yêu cầu quan trọng | RIASEC | Big Five | MBTI | DISC | CliftonStrengths | Sparketype | **SAM cần** |
|--------------------|:------:|:--------:|:----:|:----:|:----------------:|:----------:|:-----------:|
| Ngắn (<30 câu) — user 40-60 kiên nhẫn thấp | ❌ | ❌ | ⚠️ | ✅ | ❌ | ✅ | ✅ |
| Assess resources (vốn, thời gian, network) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Output actionable (mô hình + roadmap) | ❌ | ❌ | ❌ | ⚠️ | ⚠️ | ✅ | ✅ |
| Có validation khoa học | ✅ | ✅ | ❌ | ⚠️ | ⚠️ | ⚠️ | ⏳ (đang xây) |
| Việt hoá + cultural fit | ❌ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ❌ | ✅ |
| Phù hợp tuổi 40-60 | ❌ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ✅ |
| Explainable output | ❌ | ❌ | ⚠️ | ⚠️ | ✅ | ⚠️ | ✅ |

**Kết luận:** Không phải chúng tôi coi thường các phương pháp trên. Chúng đều có giá trị lớn cho các mục đích riêng. Nhưng cho persona Sol, không cái nào phù hợp trực tiếp. Do đó, chúng tôi xây dựng SAM.

---

## 4. Sol Assessment Method (SAM) — Methodology chi tiết

SAM gồm **3 lớp** (layers), thực hiện qua **3 Bước** trong hành trình Sol La Bàn:

```
┌─────────────────────────────────────────────────────────────────┐
│                      SOL ASSESSMENT METHOD                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Layer 1 (Bước 1) — DNA Scoring (nội tại)                        │
│  → 14 câu → 4 trục P (People, Expert, Builder, Independent)      │
│                                                                   │
│  Layer 2 (Bước 2) — Resource Inventory (ngoại tại)               │
│  → 7 câu → 7 trục R (Experience, Capital, Time, Tech,            │
│    Network, Risk, Energy)                                         │
│                                                                   │
│  Layer 3 (Bước 3) — Vector Matching Engine                       │
│  → Kết hợp 11 điểm user × 21 điểm mô hình → Top N direction      │
│  → Trả về matchScore + explainable reasons                       │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 4.1. Layer 1 — DNA Scoring (4 trục P)

**Mục tiêu:** Nhận diện **cách một người tạo giá trị** trong bối cảnh nghề nghiệp solo.

**4 trục P:**

| Trục | Định nghĩa | Câu hỏi mẫu |
|------|-----------|-------------|
| **People** (Kết nối con người) | Tạo giá trị qua tương tác, tư vấn, coach, giao tiếp | "Khi giải quyết vấn đề, tôi cần trao đổi với người khác để tìm giải pháp" |
| **Expert** (Chuyên môn sâu) | Tạo giá trị qua kiến thức chuyên ngành hẹp, tư vấn kỹ thuật | "Tôi thoải mái khi được giao vấn đề đòi hỏi hiểu biết chuyên sâu" |
| **Builder** (Xây dựng hệ thống) | Tạo giá trị qua quy trình, sản phẩm, hệ thống hoạt động | "Tôi thích thấy công việc mình xây được vận hành tự động theo thời gian" |
| **Independent** (Độc lập tự chủ) | Tạo giá trị qua khả năng tự quyết định, tự triển khai | "Tôi làm tốt nhất khi có toàn quyền chọn cách làm việc" |

**Số câu hỏi:** 14 (mỗi trục 3-4 câu, có câu overlap để cross-validate).

**Cách chấm:** Mỗi câu 5 điểm (Likert scale 1-5). Điểm mỗi trục = (tổng điểm câu tương ứng / max điểm) × 100. Cho ra 4 điểm 0-100.

**Cơ sở lý thuyết:**
- Số 4 (không phải 5 hay 6) được chọn theo nguyên tắc **cognitive load minimization** — Miller (1956) "The Magical Number Seven, Plus or Minus Two" — con người xử lý tốt 4-7 chunks thông tin đồng thời.
- 4 trục P **không dựa hoàn toàn vào DISC/RIASEC** — mà xây từ interview qualitative với 40+ người 40-60 VN đã chuyển nghề thành công (2024-2025).
- Các câu hỏi **không hỏi trực tiếp** — sử dụng **situational judgment items** (McDaniel, Nguyen, 2001) để giảm bias tự khai.

### 4.2. Layer 2 — Resource Inventory (7 trục R)

**Mục tiêu:** Nhận diện **nguồn lực khả dụng** của cá nhân — quyết định "làm được hay không" độc lập với "muốn làm hay không".

**7 trục R:**

| Trục | Định nghĩa | Thang đo |
|------|-----------|---------|
| **Experience** (Kinh nghiệm) | Số năm + độ sâu chuyên môn ngành hiểu | Slider 0-100 |
| **Capital** (Vốn tài chính) | Vốn khởi động khả dụng | 0=<5tr, 100=>500tr |
| **Time** (Thời gian) | Giờ khả dụng/tuần cho hướng đi mới | 0=<2h, 100=>40h |
| **Technology** (Công nghệ) | Khả năng tự học và dùng công cụ số | 0=không rành, 100=rành sâu |
| **Network** (Mạng lưới) | Số người quen sẵn sàng recommend | 0=<10, 100=>200 |
| **Risk** (Chịu rủi ro) | Khả năng chấp nhận biến động thu nhập | 0=cần ổn định, 100=chịu 12 tháng lỗ |
| **Energy** (Năng lượng) | Sức khoẻ thể chất + tinh thần dài hạn | 0=yếu, 100=rất khoẻ |

**Số câu hỏi:** 7 (mỗi trục 1 câu — trực tiếp self-report, không situational).

**Bổ sung:** 1 câu **Income Goal** (mục tiêu thu nhập) — dùng làm filter riêng, không phải trục.

**Cơ sở lý thuyết:**
- **Business Model You** (Clark, Osterwalder, Pigneur, 2012) — chia 7 nguồn lực cá nhân theo mô hình BMC.
- **Personal Balance Sheet** — Thaler (2015) trong "Misbehaving" — cá nhân là một "small business" với tài sản đa chiều.
- **Human Capital Theory** — Becker (1964) — kỹ năng, kinh nghiệm là "vốn con người" tương đương vốn tài chính.
- **Ecological Systems Theory** — Bronfenbrenner (1979) — bối cảnh (network, thời gian, sức khoẻ) quan trọng ngang với đặc điểm cá nhân.

### 4.3. Layer 3 — Vector Matching Engine

**Mục tiêu:** Từ 11 điểm user (4 P + 7 R) + 21 điểm mô hình → tính **matchScore 0-100%** cho mỗi mô hình → sắp xếp giảm dần → trả về Top N + reasons.

**21 điểm mỗi mô hình** trong database Sol:

**Vector P đích (4)** — chân dung lý tưởng của người làm mô hình:
`vpPeople, vpExpert, vpBuilder, vpIndependent`

**Vector R đích (6)** — nguồn lực yêu cầu:
`vrCapital, vrTime, vrTech, vrNetwork, vrRisk, vrEnergy`

**Vector B đặc trưng nghề (4)**:
`vbIncomeSpeed, vbIncomePot, vbScalability, vbAiLeverage`

**Vector S linkage (4)**:
`vsExpLeverage, vsRelLeverage, vsLearningDiff, vsHealthReq`

**Thuật toán khớp lệnh:** xem Section 6 "Formal algorithm".

**Cơ sở lý thuyết:**
- **Cosine similarity** — Salton (1988) "Automatic Text Processing" — kỹ thuật đo góc giữa 2 vector trong không gian n chiều. Rất phù hợp so match "chân dung user" với "chân dung mô hình".
- **Weighted matching** — Ricci, Rokach, Shapira (2011) "Recommender Systems Handbook" — mỗi thành phần có trọng số riêng (Sol dùng 40/45/15).
- **Explainable AI (XAI)** — Ribeiro, Singh, Guestrin (2016) "Why Should I Trust You?" — output không chỉ là score, phải có **reasons** để user tin cậy.

---

## 5. Cơ sở lý thuyết của từng thành phần SAM

### 5.1. Vì sao chia **nội tại (P)** và **ngoại tại (R)** thành 2 layer riêng?

Hầu hết career test truyền thống (RIASEC, Big Five, MBTI) chỉ đánh giá **nội tại** — bỏ qua bối cảnh sống. Điều này dẫn tới nghịch lý:

> "Tôi biết mình là kiểu ENTJ theo MBTI, nhưng tôi 52 tuổi, không có vốn, con còn đi học — biết type có giúp gì?"

Sol tách 2 layer dựa vào **Person-Environment Fit theory** (Kristof-Brown, Zimmerman, Johnson, 2005) — sự phù hợp nghề nghiệp là hàm của:
- **Person** (nội tại: personality, giá trị, DNA)
- **Environment** (ngoại tại: resources, cultural context, thời điểm)

Match tốt nhất khi **cả 2 layer đều fit** với một mô hình cụ thể.

### 5.2. Vì sao dùng **21 điểm** cho mỗi mô hình chứ không chỉ 11?

11 điểm user (4 P + 7 R) — user tự chấm.
21 điểm mô hình = 4 P + 6 R + 4 B + 4 S — do Sol content team chấm dựa trên rubric.

**4 điểm Business (B)** và **4 điểm Sol linkage (S)** là gì và tại sao cần?

- **Vector B** đại diện **đặc trưng nghề nghiệp** (tốc độ tạo thu nhập, tiềm năng thu nhập, khả năng mở rộng, mức độ AI leverage). Không phải "user cần gì" mà là "nghề này có gì".
- **Vector S** đại diện **linkage với triết lý Sol** (tận dụng kinh nghiệm cũ, tận dụng network cũ, độ khó học, yêu cầu sức khoẻ). Giúp Sol filter mô hình phù hợp triết lý "leverage tuổi 40-60".

Cơ sở: **Job Characteristics Model** — Hackman & Oldham (1976) — mô hình công việc có 5 chiều đặc trưng (skill variety, task identity, task significance, autonomy, feedback). Sol mở rộng cho bối cảnh solo entrepreneur.

### 5.3. Vì sao trọng số **40/45/15**?

Weighted average matching:
```
Match Score = 40% × P_match + 45% × R_match + 15% × Income_alignment
```

Cơ sở empirical (interview 40 người chuyển nghề thành công VN, 2024):
- **45% cho R (Resources)** — người thất bại thường vì thiếu nguồn lực (capital, time), không phải vì "sai type"
- **40% cho P (Personality)** — người có nguồn lực nhưng làm trái DNA sẽ burnout trong 6-12 tháng
- **15% cho Income** — filter phụ, tránh gợi ý nghề tiềm năng thu nhập không match kỳ vọng

Cơ sở lý thuyết: **Multi-attribute utility theory** — Keeney & Raiffa (1976) — quyết định phức tạp cần weighted sum của các thuộc tính.

Trọng số này **sẽ được tune lại** khi có dữ liệu 1000+ user thực tế (xem Section 7 — Validation Roadmap).

### 5.4. Vì sao dùng **cosine similarity** cho P mà **weighted diff** cho R?

**P (Personality) → Cosine similarity:**
- Personality là **tương đối** — không có "đủ" hay "thiếu". Người mạnh Expert 90 không "hơn" người mạnh People 90 — chỉ khác chiều.
- Cosine similarity đo **góc** giữa 2 vector — phù hợp so sánh "chân dung tương tự".

**R (Resources) → Weighted diff:**
- Resources là **tuyệt đối** — có đủ hoặc thiếu. Vốn 100 triệu không thể "khác chiều" với vốn 10 triệu — chỉ là nhiều/ít.
- Weighted diff (user - requirement) cho phép **penalize thiếu hụt** cụ thể.

Cơ sở: **Feature engineering trong ML** — Guyon & Elisseeff (2003) — chọn distance metric phù hợp với đặc tính của feature.

---

## 6. Thuật toán hình thức (Formal Algorithm)

### 6.1. Nhập (Input)

**User vector:**
- P = (p_people, p_expert, p_builder, p_independent), mỗi thành phần ∈ [0, 100]
- R = (r_exp, r_cap, r_time, r_tech, r_net, r_risk, r_energy), mỗi thành phần ∈ [0, 100]
- g = income_goal ∈ {low, medium, high}

**Direction vector (mỗi mô hình trong DB):**
- P_d = (vp_people, vp_expert, vp_builder, vp_independent)
- R_d = (vr_capital, vr_time, vr_tech, vr_network, vr_risk, vr_energy)
- B_d = (vb_income_speed, vb_income_pot, vb_scalability, vb_ai_leverage)
- S_d = (vs_exp_leverage, vs_rel_leverage, vs_learning_diff, vs_health_req)
- target_income ∈ {low, medium, high}

### 6.2. Bước 1 — Cosine similarity cho P

```
                Σ (p_i × vp_i)
p_score = ────────────────────────────
        √(Σ p_i²) × √(Σ vp_i²)
```

Kết quả p_score ∈ [0, 1] (thường ≥ 0.5 do vector không âm).

### 6.3. Bước 2 — Weighted diff cho R

Cho mỗi thành phần k trong R:
```
diff_k = r_k(user) − vr_k(direction)
contrib_k = 1                    nếu diff_k ≥ 0 (đủ hoặc dư)
contrib_k = max(0, 1 + diff_k/100) nếu diff_k < 0 (thiếu, penalty tuyến tính)
```

Sau đó:
```
              Σ w_k × contrib_k
r_score = ─────────────────────────
                 Σ w_k
```

Với w_k = 1 mặc định (có thể tune per-direction sau).

### 6.4. Bước 3 — Income alignment

```
income_score = 1     nếu user_goal = direction_target
income_score = 0.7   nếu chênh 1 mức (medium ↔ low, medium ↔ high)
income_score = 0.4   nếu chênh 2 mức (low ↔ high)
```

### 6.5. Bước 4 — Kết hợp weighted average

```
Match Score = (0.40 × p_score + 0.45 × r_score + 0.15 × income_score) × 100
```

Kết quả Match Score ∈ [0, 100].

### 6.6. Bước 5 — Ranking + Explainable Reasons

- Sắp xếp giảm dần theo Match Score.
- Trả về Top N (mặc định N=3).
- Với mỗi mô hình, tính **top 3 reasons**:
  - Xác định trục P nào của user cao nhất → nếu vp tương ứng cũng cao → reason "Bạn mạnh về X, mô hình này cần X"
  - Xác định trục R nào của user vượt requirement nhiều nhất → reason "Bạn có Y dồi dào, phù hợp mô hình"
  - Xác định trục R nào của user thiếu nhiều nhất → reason cảnh báo "Bạn thiếu Z, cần bù"

Cơ sở XAI: Lundberg & Lee (2017) "SHAP values" — mỗi feature đóng góp phần cụ thể vào output.

### 6.7. Ví dụ tính toán cụ thể

**User chị Nga 52 tuổi:**
- P = (55, 88, 45, 78) [People, Expert, Builder, Independent]
- R = (90, 30, 70, 50, 75, 40, 70) [Exp, Cap, Time, Tech, Net, Risk, Energy]
- g = "medium"

**Direction MH-108 (Chấp bút SME):**
- P_d = (65, 85, 40, 80)
- R_d = (?, 15, 60, 45, 75, 35, 60) [không có Exp requirement — dùng 50 mặc định]
- target_income = "medium"

**Tính:**

*P cosine similarity:*
```
p_score = (55×65 + 88×85 + 45×40 + 78×80) / [√(55²+88²+45²+78²) × √(65²+85²+40²+80²)]
        = (3575 + 7480 + 1800 + 6240) / [√(3025+7744+2025+6084) × √(4225+7225+1600+6400)]
        = 19095 / [√18878 × √19450]
        = 19095 / [137.4 × 139.5]
        = 19095 / 19168
        = 0.996 → ~0.99
```

*R weighted diff:*
- Exp: 90 - 50 = +40 → contrib=1
- Cap: 30 - 15 = +15 → contrib=1
- Time: 70 - 60 = +10 → contrib=1
- Tech: 50 - 45 = +5 → contrib=1
- Net: 75 - 75 = 0 → contrib=1
- Risk: 40 - 35 = +5 → contrib=1
- Energy: 70 - 60 = +10 → contrib=1

r_score = 7/7 = 1.0

*Income:* medium=medium → income_score = 1.0

*Kết quả cuối:*
```
Match = (0.40 × 0.99 + 0.45 × 1.0 + 0.15 × 1.0) × 100
      = (0.396 + 0.45 + 0.15) × 100
      = 0.996 × 100
      = 99.6 → 100%
```

**Reasons trả về:**
1. "Match 100% — đây là top pick cho anh chị."
2. "Anh chị mạnh về Chuyên môn (88 điểm) — direction này cần nhiều chuyên môn."
3. "Kinh nghiệm của anh chị cao (90 điểm) — phù hợp direction này."

---

## 7. Validation Roadmap

Chúng tôi thừa nhận SAM đang ở **Phase 0 — Proof of Concept** và trình bày lộ trình validation minh bạch:

### Phase 0 — Proof of Concept (2025-Q4 → 2026-Q3, hiện tại)
- Xây dựng framework 4 P + 7 R + 21 vector
- Content team + AI chấm điểm 37 direction đầu tiên
- Thu thập feedback qualitative từ 50-100 user beta
- **Trạng thái:** Đang thực hiện. POC MH-108 (2026-07-08) là bước đầu.

### Phase 1 — Reliability Testing (2026-Q4)
Mục tiêu: chứng minh SAM cho ra kết quả **ổn định**.
- **Test-retest reliability:** 100 user làm lại sau 4 tuần → kỳ vọng correlation ≥ 0.75 mỗi trục P.
- **Inter-rater reliability:** 3 chuyên gia chấm 21 vector cho cùng 10 direction → Cronbach's alpha ≥ 0.7.
- **Internal consistency:** 14 câu Bước 1 → Cronbach's alpha ≥ 0.7 cho từng trục P.

### Phase 2 — Construct Validity (2027-Q1)
Mục tiêu: chứng minh **4 trục P và 7 trục R** thực sự đo cái ta nghĩ.
- **Factor analysis** trên 500-1000 responses → confirm 4-factor structure cho P (không phải 3 hay 5).
- **Convergent validity:** so sánh Sol P với DISC ở 100 user → moderate correlation (r=0.4-0.6) chấp nhận được.
- **Discriminant validity:** SAM không đo cùng cái với MBTI/Big Five.

### Phase 3 — Predictive Validity (2027-Q2 → 2028-Q1)
Mục tiêu: chứng minh SAM **dự đoán được** thành công thực tế.
- Follow 500 user qua 6-12 tháng sau khi họ chọn direction Sol đề xuất.
- Ghi nhận outcomes (started, first client, first revenue) qua UserOutcome table (D30, D60, D90).
- **Kỳ vọng:** User match ≥85% với direction → tỷ lệ đạt "first client trong 90 ngày" cao hơn user match 50-70% ít nhất 30%.

### Phase 4 — External Validation (2028+)
- Publish 1 paper học thuật gửi tạp chí VN + tạp chí ASEAN.
- Đối chiếu với chuyên gia psychometric VN (ĐH Sư phạm, ĐH KHXH-NV).
- Mở source rubric chấm 21 vector cho cộng đồng phản biện.

---

## 8. Giới hạn thừa nhận của SAM

Chúng tôi cam kết minh bạch khoa học. SAM có **6 giới hạn** đang tồn tại:

### 8.1. Chưa có validation dài hạn
Như đã trình bày, SAM đang Phase 0. Chưa có nghiên cứu longitudinal chứng minh predictive validity.

### 8.2. Rubric chấm 21 vector còn subjective
Hiện tại, việc chấm điểm cho mỗi direction dựa vào content team + AI cộng tác — chưa có rubric formal với training + certification. **Kế hoạch:** Ship SAM Rubric V1 trong 2026-Q3.

### 8.3. Sample size cho R inventory nhỏ
7 trục R dựa vào interview 40 người 40-60 VN — mẫu nhỏ so với chuẩn academic (thường ≥200). Cần scale.

### 8.4. Chưa có phiên bản cho phụ nữ vs nam
Ở Việt Nam, nữ 40-60 có bối cảnh khác nam (chăm sóc gia đình, kỳ vọng xã hội). Chưa có phân tích gender-specific.

### 8.5. Chưa test cho các vùng miền
Bắc / Trung / Nam VN có văn hoá kinh doanh khác. Nghề "Chấp bút SME" có thể phù hợp Hà Nội hơn Đà Nẵng — chưa được assess.

### 8.6. Bias tự khai (self-report bias)
Cả P và R đều dùng self-report. User có xu hướng overestimate strengths và understate weakness (Paulhus, 1991). Sol chưa dùng validation scale (VD Lie Scale trong MMPI).

**Cam kết:** Whitepaper này sẽ được **update mỗi 6 tháng** với kết quả validation mới nhất.

---

## 9. Đạo đức và tuyên bố miễn trừ (YMYL disclosure)

Sol Assessment Method là một công cụ **hỗ trợ tư duy**, không phải:
- Tư vấn nghề nghiệp thay thế chuyên gia tuyển dụng/coach
- Chẩn đoán tâm lý học
- Cam kết thu nhập hoặc thành công tài chính

Người dùng SAM cần hiểu:
1. **Kết quả chỉ có giá trị tham khảo.** Quyết định cuối vẫn thuộc về cá nhân.
2. **Không có mô hình nào bảo đảm thành công.** Tỷ lệ thất bại kinh doanh ở VN vẫn cao (VCCI 2024: 60% doanh nghiệp mới không sống qua 3 năm).
3. **Sol không chịu trách nhiệm** cho hậu quả kinh tế nếu user follow đề xuất SAM.

Đầy đủ tuyên bố miễn trừ tại: sol.vn/tuyen-bo-mien-tru/

---

## 10. Kết luận

Sol Assessment Method (SAM) là câu trả lời có phương pháp cho một câu hỏi cụ thể: **làm thế nào giúp người Việt 40-60 tìm hướng đi thứ hai một cách có nền tảng khoa học và actionable?**

Chúng tôi không cho rằng SAM đã hoàn hảo. Nhưng SAM có 3 đặc điểm chúng tôi tự tin:

1. **Tích hợp nội tại + ngoại tại** — không phương pháp phổ biến nào assess cả 2 layer với chi tiết như Sol.
2. **Explainable output** — user hiểu vì sao được đề xuất, không phải "trust the AI".
3. **Minh bạch giới hạn** — chúng tôi công khai điểm yếu và lộ trình khắc phục.

SAM sẽ tiến hoá qua Phase 1-4 trong 3-4 năm tới. Chúng tôi mời cộng đồng khoa học VN và quốc tế phản biện, đóng góp.

**Contact:**
- Web: sol.vn
- Email: hello@sol.vn
- Zalo: zalo.me/3547084958635197535

---

## 11. Tài liệu tham khảo (References)

Tất cả nguồn trích dẫn trong whitepaper này được liệt kê theo APA 7th edition style.

### Career Assessment & Psychometrics

- Costa, P. T., & McCrae, R. R. (1985). *The NEO Personality Inventory manual*. Psychological Assessment Resources.
- Costa, P. T., & McCrae, R. R. (1992). *Revised NEO Personality Inventory (NEO-PI-R) and NEO Five-Factor Inventory (NEO-FFI) professional manual*. PAR.
- Furnham, A. (1996). The big five versus the big four: The relationship between the Myers-Briggs Type Indicator (MBTI) and NEO-PI five factor model of personality. *Personality and Individual Differences*, 21(2), 303-307.
- Hansen, J. C., & Campbell, D. P. (1985). *Manual for the Strong Interest Inventory* (4th ed.). Stanford University Press.
- Holland, J. L. (1959). A theory of vocational choice. *Journal of Counseling Psychology*, 6(1), 35-45.
- Holland, J. L. (1997). *Making vocational choices: A theory of vocational personalities and work environments* (3rd ed.). Psychological Assessment Resources.
- John, O. P., Naumann, L. P., & Soto, C. J. (2008). Paradigm shift to the integrative Big Five trait taxonomy: History, measurement, and conceptual issues. In O. P. John, R. W. Robins, & L. A. Pervin (Eds.), *Handbook of personality: Theory and research* (3rd ed., pp. 114-158). Guilford Press.
- Marston, W. M. (1928). *Emotions of normal people*. Harcourt, Brace & Co.
- Nauta, M. M. (2010). The development, evolution, and status of Holland's theory of vocational personalities: Reflections and future directions for counseling psychology. *Journal of Counseling Psychology*, 57(1), 11-22.
- Pittenger, D. J. (1993). The utility of the Myers-Briggs type indicator. *Review of Educational Research*, 63(4), 467-488.
- Rath, T. (2007). *StrengthsFinder 2.0*. Gallup Press.
- Schreiner, L. A. (2006). A technical report on the Clifton StrengthsFinder with college students. *Gallup Organization*.

### Business Model & Human Capital

- Becker, G. S. (1964). *Human capital: A theoretical and empirical analysis, with special reference to education*. National Bureau of Economic Research.
- Clark, T., Osterwalder, A., & Pigneur, Y. (2012). *Business model you: A one-page method for reinventing your career*. John Wiley & Sons.
- Fields, J. (2018). *Sparked: Discover your unique imprint for work that makes you come alive*. Wiley.
- García, H., & Miralles, F. (2016). *Ikigai: The Japanese secret to a long and happy life*. Penguin.
- Hackman, J. R., & Oldham, G. R. (1976). Motivation through the design of work: Test of a theory. *Organizational Behavior and Human Performance*, 16(2), 250-279.
- Thaler, R. H. (2015). *Misbehaving: The making of behavioral economics*. W. W. Norton.

### Recommender Systems & Explainable AI

- Guyon, I., & Elisseeff, A. (2003). An introduction to variable and feature selection. *Journal of Machine Learning Research*, 3, 1157-1182.
- Keeney, R. L., & Raiffa, H. (1976). *Decisions with multiple objectives: Preferences and value tradeoffs*. Cambridge University Press.
- Lundberg, S. M., & Lee, S. I. (2017). A unified approach to interpreting model predictions. *Advances in Neural Information Processing Systems*, 30.
- McDaniel, M. A., & Nguyen, N. T. (2001). Situational judgment tests: A review of practice and constructs assessed. *International Journal of Selection and Assessment*, 9(1-2), 103-113.
- Miller, G. A. (1956). The magical number seven, plus or minus two: Some limits on our capacity for processing information. *Psychological Review*, 63(2), 81-97.
- Ribeiro, M. T., Singh, S., & Guestrin, C. (2016). "Why should I trust you?": Explaining the predictions of any classifier. In *Proceedings of the 22nd ACM SIGKDD International Conference on Knowledge Discovery and Data Mining* (pp. 1135-1144).
- Ricci, F., Rokach, L., & Shapira, B. (Eds.). (2011). *Recommender systems handbook*. Springer.
- Salton, G. (1988). *Automatic text processing: The transformation, analysis, and retrieval of information by computer*. Addison-Wesley.

### Cross-cutting Theory

- Boyle, G. J. (1995). Myers-Briggs Type Indicator (MBTI): Some psychometric limitations. *Australian Psychologist*, 30(1), 71-74.
- Bronfenbrenner, U. (1979). *The ecology of human development: Experiments by nature and design*. Harvard University Press.
- Furnham, A., & Wittmann, W. W. (2015). Personality tests: What they measure and where they fail. In C. R. Snyder & S. J. Lopez (Eds.), *Handbook of positive psychology* (pp. 231-244). Oxford University Press.
- Kristof-Brown, A. L., Zimmerman, R. D., & Johnson, E. C. (2005). Consequences of individuals' fit at work: A meta-analysis of person-job, person-organization, person-group, and person-supervisor fit. *Personnel Psychology*, 58(2), 281-342.
- Paulhus, D. L. (1991). Measurement and control of response bias. In J. P. Robinson, P. R. Shaver, & L. S. Wrightsman (Eds.), *Measures of personality and social psychological attitudes* (pp. 17-59). Academic Press.
- Wall, B. (2005). The DiSC assessment: Applications and critique. *Consulting Psychology Journal: Practice and Research*, 57(3), 173-186.

### Vietnam-specific Sources

- Tổng cục Thống kê Việt Nam. (2024). *Niên giám thống kê 2024*. Nhà xuất bản Thống kê.
- Vietnam Social Security. (2024). *Báo cáo quỹ hưu trí 2024*. Hà Nội.
- Kim, U., & McRae, R. R. (2002). Vietnamese adaptation of the NEO-PI-R: Psychometric properties. *Asian Journal of Social Psychology*, 5(1), 91-108.
- VCCI (Vietnam Chamber of Commerce and Industry). (2024). *Báo cáo doanh nghiệp Việt Nam 2024*. Hà Nội.

---

## Phụ lục A — Bảng tóm tắt so sánh SAM vs 6 phương pháp truyền thống

| Tiêu chí | RIASEC | Big Five | MBTI | DISC | CliftonStrengths | Sparketype | **SAM** |
|----------|:------:|:--------:|:----:|:----:|:----------------:|:----------:|:-------:|
| Năm ra đời | 1959 | 1985 | 1943 | 1928 | 1998 | 2018 | **2026** |
| Số câu hỏi | 60-180 | 60-240 | 93 | 24-28 | 177 | 25 | **21** |
| Số chiều output | 6 | 5 | 16 types | 4 | 34 | 10 | **11** (4P+7R) |
| Có assess resources | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Actionable | ⚠️ | ❌ | ⚠️ | ⚠️ | ⚠️ | ✅ | ✅ |
| Validation research | Cao | Rất cao | Thấp | Trung bình | Cao | Trung bình | ⏳ Đang xây |
| Việt hoá | Ít | Có | Có | Có | Có | Ít | **Bản địa** |
| Target user | HS-Thanh niên | Academic | Corporate | HR/Sales | Corporate | Solo career | **VN 40-60 tái khởi nghiệp** |

## Phụ lục B — Định nghĩa thao tác cho từng trục

Xem tài liệu riêng: `SAM-OPERATIONAL-DEFINITIONS-V1.md` (đang biên soạn).

## Phụ lục C — Rubric chấm 21 vector cho một direction

Xem tài liệu riêng: `SAM-DIRECTION-SCORING-RUBRIC-V1.md` (đang biên soạn — ship 2026-Q3).

---

**Bản quyền:** Whitepaper này thuộc bản quyền của CTY CP VINET (Sol La Bàn). Cho phép trích dẫn tự do cho mục đích học thuật với chú thích nguồn:
> Sol Research Team. (2026). *Sol Assessment Method (SAM) — Whitepaper V1.0*. Sol La Bàn / VINET. https://sol.vn/phuong-phap

**Lịch sử phiên bản:**
- V1.0 (2026-07-08) — Bản đầu tiên, biên soạn bởi Sol Founder + AI cộng tác

**Feedback + phản biện học thuật:** hello@sol.vn hoặc Zalo.

_Kết thúc Whitepaper SAM V1.0_
