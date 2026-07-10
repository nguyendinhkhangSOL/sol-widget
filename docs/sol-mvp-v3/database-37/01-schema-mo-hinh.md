# Schema — Mỗi mô hình cần gì để BÁN được 499k?

*Nguyên tắc: User trả 499k → vào Bước 3 → xem 1 mô hình phù hợp → HIỂU đủ để quyết đầu tư 90 ngày làm nó.*

Mỗi mô hình phải trả lời 5 câu hỏi lớn của user:
1. **Có phù hợp với TÔI không?** (DNA + vốn ngầm match)
2. **Cần chuẩn bị gì?** (vốn tiền + thời gian + kỹ năng)
3. **Bao giờ có tiền?** (time to first revenue + income projection)
4. **Ai đã làm thành công?** (case study)
5. **Đi từng bước cụ thể?** (roadmap 90 ngày outline)

---

## 📋 Schema 15 trường (mandatory)

```yaml
# ═══════════════════════════════════════
# METADATA — Database indexing
# ═══════════════════════════════════════
id: "MH-001"                          # Unique ID (MH-001 → MH-037)
slug: "coaching-ceo-sme"              # URL-friendly slug
nhom: "Chuyên môn"                    # 1 trong 7 nhóm
trang_thai: "verified"                # draft / verified / featured
nguon: "khang_sol"                    # khang_sol / ai_curated / community
verified_at: "2026-07-01"             # Ngày Khang Sol review OK
last_reviewed: "2026-07-01"           # Auto-flag khi >12 tháng
ai_relevance: "high"                  # high/medium/low (AI trend impact)

# ═══════════════════════════════════════
# HERO — First impression khi user xem
# ═══════════════════════════════════════
ten: "Coaching CEO SME"                        # Ngắn (2-4 từ)
tagline: "Bán 20 năm kinh nghiệm SME thành gói coaching 15tr/tháng"
mo_ta_ngan: |                                  # 60-80 từ, hook
  "Bạn có 15-20 năm kinh nghiệm quản lý/vận hành SME.
  CEO các doanh nghiệp 5-20 tỷ đang stuck ở scale, 
  họ trả 15tr/tháng để có anh làm mentor 4h/tháng.
  Mô hình mỏng, tinh gọn, thu nhập ổn từ tháng 3."

# ═══════════════════════════════════════
# MATCHING — Phù hợp với ai?
# ═══════════════════════════════════════
dna_fit:
  logic: high                         # high/mid/low — cần logic mạnh
  doc_lap: high                       # cần tự chủ (OPC style)
  chien_luoc: high                    # cần tầm nhìn
  on_dinh: high                       # muốn dòng tiền đều
  # Người có DNA khớp ≥3 trục high = strong fit

von_ngam_min:
  ky_nang: 8                          # /10 — chuyên môn cao
  kinh_nghiem: 8                      # nhiều năm thực chiến
  quan_he: 6                          # network SME
  uy_tin: 7                           # có credentials
  # 8 trục 0-10, chỉ list trục quan trọng ≥6

phu_hop_do_tuoi: "45-60"              # sweet spot
phu_hop_gioi_tinh: "any"              # any / male / female

# ═══════════════════════════════════════
# INVESTMENT — Cần chuẩn bị gì?
# ═══════════════════════════════════════
von_tien_can:
  tối_thiểu: "10tr"                   # setup landing + tool
  khuyến_nghị: "30tr"                 # 3 tháng chi phí đệm
  chi_tiết: |
    - Landing page (Tilda/Wix): 3-5tr/năm
    - Calendly + Zoom Pro: 500k/tháng
    - LinkedIn Premium: 1.5tr/tháng
    - Nghiên cứu khách hàng: 5tr

quy_thoi_gian:
  hours_per_week_min: 15              # tối thiểu để bắt đầu
  hours_per_week_optimal: 25          # tối ưu 3-6 tháng đầu
  linh_hoạt: "high"                   # high/mid/low

time_to_first_revenue:
  optimistic: "30 ngày"
  realistic: "60-90 ngày"
  pessimistic: "6 tháng"

thu_nhap_ky_vong:
  thang_1: "0-15tr"                   # setup + first client
  thang_3: "15-45tr"                  # 1-3 clients
  thang_6: "30-75tr"                  # 3-5 clients
  thang_12: "50-120tr"                # 5-8 clients
  luu_y: "Con số ước tính. Kết quả phụ thuộc thực thi + DNA + vốn ngầm."

muc_rui_ro: "low"                     # low/mid/high

ai_tools:
  - "ChatGPT/Claude Team ($30/tháng) — draft assessment, followup"
  - "Notion AI — tổ chức note client"
  - "Fathom — ghi âm + tóm tắt call tự động"
  - "Loom — record video answer thay email"

# ═══════════════════════════════════════
# PROOF — Ai đã làm thành công?
# ═══════════════════════════════════════
case_studies:
  - name: "Anh A (ẩn danh)"
    tuoi: 52
    boi_canh: "Ex-CFO tập đoàn FMCG, layoff Q4 2024"
    hanh_trinh: "3 tháng test niche → chọn 'CFO advisory cho SME F&B chuỗi 5-15 chi nhánh'"
    ket_qua_6m: "3 clients × 18tr/tháng = 54tr/tháng revenue"
    key_learning: "Ngách càng hẹp càng dễ bán. Đừng cố serve mọi CEO."
  - name: "(cần 1-2 case nữa từ network Khang Sol)"

# ═══════════════════════════════════════
# ROADMAP OUTLINE — 90 ngày (chi tiết trong Bước 4)
# ═══════════════════════════════════════
roadmap_summary:
  tuan_1_4: "Nghiên cứu ngách + phỏng vấn 10 CEO SME + xác định pain 100% chung"
  tuan_5_8: "Design gói + landing page + pre-sell 3 người trong network"
  tuan_9_12: "Onboard 3 clients trả tiền + iterate delivery + prep scale"

# ═══════════════════════════════════════
# PITFALLS — Bẫy phổ biến (cảnh báo user)
# ═══════════════════════════════════════
common_pitfalls:
  - "Định giá theo giờ (2-5tr/giờ) → user quit vì so sánh với thu nhập cũ. Phải bán GÓI THÁNG 12-20tr."
  - "Serve mọi ngành → không có positioning. Phải chọn 1 ngành/1 giai đoạn."
  - "Đi Facebook ads → tốn tiền. LinkedIn organic + referral hiệu quả hơn cho B2B."
  - "Không có kế hoạch chuyển giao → khi có 5 clients, bận cả tháng, mất luận thời gian."

success_indicators:
  early: "5 phỏng vấn CEO trong tuần 1-4 (validate ngách)"
  mid: "1 pre-sell được confirm với đặt cọc trong tuần 5-8"
  late: "3 clients trả tiền + LTV >3 tháng trong tuần 9-12"

# ═══════════════════════════════════════
# TAGS — Filter/search
# ═══════════════════════════════════════
tags:
  - "B2B"
  - "Online + Offline hybrid"
  - "Knowledge work"
  - "Recurring revenue"
  - "Low startup cost"
  - "One-person business"

# ═══════════════════════════════════════
# INTERNAL LINK — Deep dive
# ═══════════════════════════════════════
pillar_url: "https://sol.vn/coaching-chuyen-mon-tuoi-45/"  # nếu có bài chuyên sâu
```

---

## 🎯 Priority tiers

Không cần fill 37 mô hình cùng lúc. Chia 3 tier:

### **Tier 1 — Hot 10 mô hình (Priority #1)**
Fill FULL schema. Đây là 10 mô hình sẽ show đầu tiên cho 80% user.
Estimate: 2-3 giờ/mô hình × 10 = **20-30 giờ**

### **Tier 2 — Medium 15 mô hình**
Fill 70% schema (bỏ deep case studies, chỉ 1 case ngắn). Show ở tab "Xem thêm".
Estimate: 1-2 giờ/mô hình × 15 = **15-30 giờ**

### **Tier 3 — Longtail 12 mô hình**
Fill 40% schema (tên, tagline, DNA fit, thu nhập range). Có thể "sắp có nội dung".
Estimate: 30 phút/mô hình × 12 = **6 giờ**

**Total effort MVP:** 40-70 giờ (2-3 tuần part-time)

---

## 🎨 Content sources

### Khang Sol writes (60%)
- Case studies từ network thật
- Pitfalls từ 20 năm kinh nghiệm
- Roadmap outline dựa trên experience
- Trust signals + credentials

### AI-assist draft (30%)
Claude/GPT prompt template:
```
Tôi đang xây database 37 mô hình khởi nghiệp tinh gọn cho người Việt 40-60.
Viết chi tiết cho mô hình sau [TEN MO HINH]:
- Mô tả 80 từ hook target 40-60
- DNA fit (Logic/Sáng tạo × Độc lập/Nhóm × Chiến lược/Thực thi × Ổn định/Đột phá)
- Vốn ngầm cần (8 trục: Kỹ năng/Kinh nghiệm/Quan hệ/Tài chính/Công nghệ/Thời gian/Tri thức/Uy tín)
- Vốn tiền cần + Thời gian đến revenue đầu tiên
- Thu nhập kỳ vọng theo tháng 1/3/6/12
- 3 common pitfalls + 3 success indicators
- Roadmap 90 ngày outline (3 giai đoạn 30 ngày)
- AI tools recommend
Tone: Việt Nam, thực chiến, không hype
```
→ Khang Sol review + edit

### Community input (10%, Phase 2+)
Active+ users share mô hình họ đang làm.

---

## 📦 Output format

Recommend: **Markdown files** trong git (`/database/mo-hinh/MH-001.md`)

Lý do:
- Version control (biết ai thay đổi khi nào)
- Easy convert to JSON cho engineering
- Non-technical friendly để Khang Sol viết
- Preview đẹp trên GitHub/Gitea

**Convention:**
- File: `MH-001-coaching-ceo-sme.md`
- Structure: YAML front matter + prose body

---

## ⚙️ Nex steps (mình sẽ build sequential)

1. ✅ **Schema** (file này)
2. ⏭️ **Gold standard example** — Viết `MH-001-coaching-ceo-sme.md` FULL (mình sẽ write, làm chuẩn cho Khang Sol replicate)
3. ⏭️ **Priority list** — Danh sách 37 mô hình đã prioritize thành 3 tiers
4. ⏭️ **Blank template** — Khang Sol copy + fill
5. ⏭️ **Sample AI prompt** — Cho Khang Sol dùng ChatGPT/Claude draft nhanh

---

*Đúng hướng. Đúng bước. Đúng tương lai — bắt đầu từ 37 mô hình có thịt.*
