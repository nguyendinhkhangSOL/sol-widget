# 29. Nhượng Quyền Thương Hiệu

**Slug**: `nhuong-quyen-thuong-hieu`
**Category**: KINH_DOANH
**Sort order**: 5
**Status**: ⬜ TODO
**Direction ID**: `bfb89eee-4104-4921-a5a5-953ee6158354`

---

## Hướng dẫn

1. **Bỏ qua file này nếu đã ✅ DONE**
2. Mở https://claude.ai (free plan OK, dùng Sonnet 4.5)
3. Copy **TOÀN BỘ nội dung từ dòng "═══ PROMPT ═══" xuống hết**
4. Paste vào Claude web → nhấn gửi
5. Claude sẽ generate JSON roadmap 90 ngày chi tiết
6. Copy JSON output → save thành `roadmap-nhuong-quyen-thuong-hieu.json` trong folder `generated/`
7. Đổi status file này thành ✅ DONE + note ngày

---

═══ PROMPT ═══

Bạn là chuyên gia coach nghề nghiệp cho người Việt Nam 40-60 tuổi. Nhiệm vụ: viết roadmap 90 ngày CHI TIẾT cho mô hình kinh doanh sau, theo format JSON identical với sample.

═══ MÔ HÌNH ═══

**Tên**: Nhượng Quyền Thương Hiệu
**Slug**: nhuong-quyen-thuong-hieu
**Tagline**: Mở kinh doanh theo mô hình franchise
**Category**: KINH_DOANH

**Description**:
Mua franchise của thương hiệu F&B, dịch vụ, giáo dục đã có hệ thống.

**Vì sao phù hợp 40-60**:
Phù hợp người có vốn lớn, muốn kinh doanh nhưng không muốn build từ đầu.

**Rào cản đặc thù**:
[
  "Vốn đầu tư ban đầu cao",
  "Phụ thuộc brand chính",
  "Tỷ lệ thất bại vẫn cao"
]

**DNA fit scores (0-100)**:
- People (thích tiếp xúc): 60
- Expert (chuyên môn sâu): 35
- Builder (thích tự xây): 55
- Independent (tự chủ): 50

**Resource requirements (0-100, cao = cần nhiều)**:
- Capital (vốn): 80
- Time (thời gian): 70
- Tech (công nghệ): 35
- Network (quan hệ): 55
- Risk (rủi ro): 55
- Energy (năng lượng): 70

**Bonus metrics (0-100)**:
- Income speed (tốc độ có thu nhập): 65
- Income potential (tiềm năng thu nhập): 70
- Scalability (khả năng scale): 40
- AI leverage (leverage được AI): 30

═══ SAMPLE REFERENCE (Freelancer Chuyên Môn) ═══

```json
{
  "version": "1.0",
  "direction_id": "214e7b23-a38a-4d6a-8c81-91bd3297d1a8",
  "direction_name": "Freelancer Chuyên Môn",
  "total_weeks": 12,
  "total_actions": 48,
  "phases": [
    { "num": 1, "name": "Định vị", "weeks": [1, 2, 3, 4], "goal": "Xác định ngách + xây dựng chỗ đứng chuyên gia" },
    { "num": 2, "name": "Momentum", "weeks": [5, 6, 7, 8], "goal": "Tạo lead đầu tiên, build portfolio thực chiến" },
    { "num": 3, "name": "Khách #1", "weeks": [9, 10, 11, 12], "goal": "Chốt khách đầu + tối ưu pricing + xây process" }
  ],
  "weeks": [
    {
      "week": 1,
      "phase": 1,
      "phase_name": "Định vị",
      "theme": "Xác định ngách chuyên môn của bạn",
      "hours_estimated": 8,
      "actions": [
        {
          "id": "w1-a1",
          "title": "Liệt kê 3 mảng chuyên môn bạn từng làm 5+ năm",
          "type": "reflection",
          "time_min": 30,
          "tools": [],
          "output": "Bảng 3 mảng + rank theo passion (1-10) + expertise (1-10) + market demand (1-10)"
        },
        {
          "id": "w1-a2",
          "title": "Chọn 1 ngách có tổng điểm cao nhất làm mảng chính",
          "type": "output",
          "time_min": 45,
          "tools": [],
          "output": "1 câu: 'Tôi là chuyên gia [X] giúp [Y] giải quyết [Z]'"
        },
        {
          "id": "w1-a3",
          "title": "Nghiên cứu 5 freelancer VN cùng ngách trên LinkedIn/Upwork",
          "type": "research",
          "time_min": 90,
          "tools": ["LinkedIn", "Upwork", "Fastwork.vn"],
          "output": "Bảng so sánh 5 người: giá/giờ, dịch vụ, portfolio, khách target"
        },
        {
          "id": "w1-a4",
          "title": "Xác định giá thị trường cho ngách của bạn",
          "type": "research",
          "time_min": 45,
          "tools": ["Fastwork.vn", "Vlance.vn"],
          "output": "Range giá: min - median - max (per hour hoặc per project)"
        }
      ]
    },
    {
      "week": 2,
      "phase": 1,
      "phase_name": "Định vị",
      "theme": "Xây dựng bộ nhận diện chuyên gia",
      "hours_estimated": 6,
      "actions": [
        {
          "id": "w2-a1",
          "title": "Tối ưu LinkedIn profile: ảnh + banner + headline + About",
          "type": "output",
          "time_min": 90,
          "tools": ["Canva", "LinkedIn"],
          "output": "Profile LinkedIn với headline chuyên gia + banner 1584x396 + About 300 chữ có keyword ngách"
        },
        {
          "id": "w2-a2",
          "title": "Chụp/chọn 3 ảnh professional (headshot + working shot)",
          "type": "output",
          "time_min": 120,
          "tools": ["iPhone/DSLR", "Snapseed"],
          "output": "3 ảnh chọn: 1 headshot chính, 1 half-body, 1 working (dùng cho LinkedIn/website)"
        },
        {
          "id": "w2-a3",
          "title": "Đăng ký domain cá nhân + hosting rẻ (tên: hocanchoi.com)",
          "type": "output",
          "time_min": 45,
          "tools": ["Namecheap", "Hostinger"],
          "output": "1 domain + hosting đã hoạt động (URL redirect tạm về LinkedIn OK)"
        }
      ]
    },
    {
      "week": 3,
      "phase": 1,
      "phase_name": "Định vị",
      "theme": "Portfolio + case studies đầu tiên",
      "hours_estimated": 10,
      "actions": [
        {
          "id": "w3-a1",
          "title": "Chọn 3 project cũ tốt nhất từ công việc past làm case study",
          "type": "reflection",
          "time_min": 60,
          "tools": [],
          "output": "3 project chọn + note ngắn về vai trò + kết quả đạt được"
        },
        {
          "id": "w3-a2",
          "title": "Viết case study #1 theo format STAR (Situation-Task-Action-Result)",
          "type": "output",
          "time_min": 90,
          "tools": ["Google Docs", "ChatGPT prompt template"],
          "output": "Case study 400-500 chữ, có số liệu cụ thể (VD: giảm 30% chi phí, tăng 50% conversion)"
        },
        {
          "id": "w3-a3",
          "title": "Viết case study #2 + #3 tương tự",
          "type": "output",
          "time_min": 180,
          "tools": ["Google Docs"],
          "output": "2 case studies nữa mỗi cái 400-500 chữ"
        },
        {
          "id": "w3-a4",
          "title": "Build simple portfolio page trên Notion/Framer/Behance",
          "type": "output",
          "time_min": 90,
          "tools": ["Notion", "Framer", "Behance"],
          "output": "1 URL public showing 3 case studies + về-tôi + liên-hệ"
        }
      ]
    },
    {
      "week": 4,
      "phase": 1,
      "phase_name": "Định vị",
      "theme": "Setup infrastructure kinh doanh",
      "hours_estimated": 6,
      "actions": [
        {
          "id": "w4-a1",
          "title": "Setup Calendly link đặt lịch tư vấn miễn phí 15 phút",
          "type": "output",
          "time_min": 30,
          "tools": ["Calendly (free)"],
          "output": "1 URL Calendly có sẵn 5 slot/tuần cho tư vấn"
        },
        {
          "id": "w4-a2",
          "title": "Viết template email báo giá + hợp đồng ngắn 2 trang",
          "type": "output",
          "time_min": 90,
          "tools": ["Google Docs", "template mẫu online"],
          "output": "2 template: (1) quote email, (2) hợp đồng freelance 2 trang có điều khoản thanh toán"
        },
        {
          "id": "w4-a3",
          "title": "Đăng ký MST cá nhân hoặc hộ kinh doanh (nếu chưa)",
          "type": "output",
          "time_min": 120,
          "tools": ["UBND phường/thuế"],
          "output": "Mã số thuế cá nhân hoặc GPKD hộ cá nhân — sẵn sàng xuất hoá đơn"
        },
        {
          "id": "w4-a4",
          "title": "Setup Sepay/VietQR nhận thanh toán chuyên nghiệp",
          "type": "output",
          "time_min": 30,
          "tools": ["Sepay.vn"],
          "output": "1 QR link nhận thanh toán tự động, ghi rõ nội dung"
        }
      ]
    },
    {
      "week": 5,
      "phase": 2,
      "phase_name": "Momentum",
      "theme": "Kích hoạt mạng lưới cũ",
      "hours_estimated": 8,
      "actions": [
        {
          "id": "w5-a1",
          "title": "Lập list 30 ex-colleague/khách hàng cũ có thể refer bạn",
          "type": "reflection",
          "time_min": 60,
          "tools": ["Excel/Sheet"],
          "output": "30 tên + SĐT/email + relationship + ước tính khả năng refer"
        },
        {
          "id": "w5-a2",
          "title": "Gửi tin nhắn Zalo/messenger cá nhân cho 30 người: 'Anh/chị giờ chuyển freelance...'",
          "type": "outreach",
          "time_min": 90,
          "tools": ["Zalo", "Facebook Messenger"],
          "output": "30 tin nhắn đã gửi, template cá nhân hoá theo relationship"
        },
        {
          "id": "w5-a3",
          "title": "Follow-up 10 người phản hồi tích cực, đề nghị cà phê 30 phút",
          "type": "outreach",
          "time_min": 120,
          "tools": ["Calendly link"],
          "output": "5-10 cuộc gặp cà phê scheduled trong 2 tuần tới"
        }
      ]
    },
    {
      "week": 6,
      "phase": 2,
      "phase_name": "Momentum",
      "theme": "Content thought leadership khởi động",
      "hours_estimated": 8,
      "actions": [
        {
          "id": "w6-a1",
          "title": "Viết 3 bài LinkedIn ngắn (150-200 chữ) chia sẻ insight ngành",
          "type": "output",
          "time_min": 180,
          "tools": ["LinkedIn", "ChatGPT (viết nháp)"],
          "output": "3 bài post live trên LinkedIn, cách nhau 2-3 ngày"
        },
        {
          "id": "w6-a2",
          "title": "Comment thoughtfully 5 post của người có 10k+ follower trong ngách",
          "type": "outreach",
          "time_min": 60,
          "tools": ["LinkedIn"],
          "output": "5 comment 30-60 chữ có insight, không sale, nhưng đủ nổi bật"
        },
        {
          "id": "w6-a3",
          "title": "Kết nối 20 target khách hàng mới trên LinkedIn",
          "type": "outreach",
          "time_min": 45,
          "tools": ["LinkedIn Sales Navigator (free 30 days) hoặc search"],
          "output": "20 connection request đã gửi, có personalized note"
        }
      ]
    },
    {
      "week": 7,
      "phase": 2,
      "phase_name": "Momentum",
      "theme": "Cold outreach có chiến lược",
      "hours_estimated": 10,
      "actions": [
        {
          "id": "w7-a1",
          "title": "Xác định 20 công ty target theo tiêu chí ngách + quy mô + pain point",
          "type": "research",
          "time_min": 120,
          "tools": ["LinkedIn", "Google", "Facebook page ngành"],
          "output": "20 công ty với: tên, decision maker (name+role+LinkedIn), pain point cụ thể"
        },
        {
          "id": "w7-a2",
          "title": "Viết cold email template (3 variations) test A/B",
          "type": "output",
          "time_min": 90,
          "tools": ["Email template", "ChatGPT"],
          "output": "3 email template: (1) direct value prop, (2) case study angle, (3) mutual connection"
        },
        {
          "id": "w7-a3",
          "title": "Gửi 20 cold outreach messages (10 email + 10 LinkedIn DM)",
          "type": "outreach",
          "time_min": 120,
          "tools": ["Gmail", "LinkedIn"],
          "output": "20 outreach đã gửi, tracked trong sheet: sent date, reply status"
        }
      ]
    },
    {
      "week": 8,
      "phase": 2,
      "phase_name": "Momentum",
      "theme": "Free value pilot - Thu hút lead đầu tiên",
      "hours_estimated": 8,
      "actions": [
        {
          "id": "w8-a1",
          "title": "Design 'free audit' hoặc 'free consultation' 30 phút cho 3 target",
          "type": "output",
          "time_min": 60,
          "tools": ["Google Docs"],
          "output": "Free audit framework 5-7 câu hỏi + 1 template report 2 trang"
        },
        {
          "id": "w8-a2",
          "title": "Tổ chức 3 buổi free consult với lead (từ cold outreach hoặc network)",
          "type": "outreach",
          "time_min": 180,
          "tools": ["Google Meet", "Zoom"],
          "output": "3 cuộc consultation done, mỗi cuộc kèm audit report 2 trang gửi email sau"
        },
        {
          "id": "w8-a3",
          "title": "Follow-up 3 lead: đề nghị paid engagement từ consultation",
          "type": "outreach",
          "time_min": 60,
          "tools": ["Email"],
          "output": "3 proposal gửi ra: scope + timeline + price. Track response."
        }
      ]
    },
    {
      "week": 9,
      "phase": 3,
      "phase_name": "Khách #1",
      "theme": "Pricing chiến lược + đóng deal đầu",
      "hours_estimated": 6,
      "actions": [
        {
          "id": "w9-a1",
          "title": "Xác định pricing strategy: hourly / project / retainer",
          "type": "reflection",
          "time_min": 60,
          "tools": [],
          "output": "1 công thức pricing: value-based + safety margin 30%. Có 3 tier: essential / standard / premium"
        },
        {
          "id": "w9-a2",
          "title": "Chuẩn bị negotiation script + template phản hồi objections",
          "type": "output",
          "time_min": 90,
          "tools": ["Google Docs"],
          "output": "1 doc: 5 objections thường gặp + response template cho mỗi cái"
        },
        {
          "id": "w9-a3",
          "title": "Chốt deal đầu tiên (target: giảm giá tối đa 15%, không hơn)",
          "type": "outreach",
          "time_min": 180,
          "tools": ["Zoom", "Email", "Hợp đồng"],
          "output": "1 hợp đồng đã ký + advance payment nhận (30-50%). Nếu chưa được, iterate pitch."
        }
      ]
    },
    {
      "week": 10,
      "phase": 3,
      "phase_name": "Khách #1",
      "theme": "Delivery khách đầu excellent",
      "hours_estimated": 15,
      "actions": [
        {
          "id": "w10-a1",
          "title": "Setup project management: Notion/Trello board + weekly status doc",
          "type": "output",
          "time_min": 60,
          "tools": ["Notion", "Trello"],
          "output": "1 project workspace shared với khách + template weekly report"
        },
        {
          "id": "w10-a2",
          "title": "Kick-off meeting: nắm rõ requirement, deadline, deliverables",
          "type": "outreach",
          "time_min": 90,
          "tools": ["Zoom", "Meeting notes"],
          "output": "1 meeting notes doc share với khách + confirm scope trong 24h"
        },
        {
          "id": "w10-a3",
          "title": "Deep work 10h — deliver phase 1 output (mid-project milestone)",
          "type": "output",
          "time_min": 600,
          "tools": ["Deliverable-specific"],
          "output": "1 mid-project deliverable submitted + review call với khách"
        }
      ]
    },
    {
      "week": 11,
      "phase": 3,
      "phase_name": "Khách #1",
      "theme": "Referral system + brand asset build",
      "hours_estimated": 8,
      "actions": [
        {
          "id": "w11-a1",
          "title": "Ask cho testimonial + LinkedIn recommendation từ khách #1",
          "type": "outreach",
          "time_min": 60,
          "tools": ["Email template ask"],
          "output": "1 testimonial 100-150 chữ + 1 LinkedIn recommendation live"
        },
        {
          "id": "w11-a2",
          "title": "Update case study #4 (project đang làm) — anonymized nếu cần",
          "type": "output",
          "time_min": 90,
          "tools": ["Portfolio site"],
          "output": "Case study #4 live trên portfolio, có metrics + before/after"
        },
        {
          "id": "w11-a3",
          "title": "Design referral program: 10% commission cho ai refer thành công",
          "type": "output",
          "time_min": 60,
          "tools": ["Email template"],
          "output": "1 announcement email gửi network 30 người + tracking sheet"
        },
        {
          "id": "w11-a4",
          "title": "Send follow-up nurture email cho 15 lead 'cold' cuối phase 2",
          "type": "outreach",
          "time_min": 90,
          "tools": ["Email"],
          "output": "15 email personal follow-up với new insight/case study attached"
        }
      ]
    },
    {
      "week": 12,
      "phase": 3,
      "phase_name": "Khách #1",
      "theme": "Retention + roadmap Q2 (tháng 4-6)",
      "hours_estimated": 6,
      "actions": [
        {
          "id": "w12-a1",
          "title": "Wrap-up khách #1: final delivery + post-mortem review",
          "type": "output",
          "time_min": 120,
          "tools": ["Deliverable", "Email"],
          "output": "1 final deliverable + retrospective doc (what went well, what to improve)"
        },
        {
          "id": "w12-a2",
          "title": "Propose retainer contract hoặc phase 2 project với khách #1",
          "type": "outreach",
          "time_min": 60,
          "tools": ["Proposal template"],
          "output": "1 proposal 6-tháng retainer (~50% original project value/tháng) hoặc phase 2 project"
        },
        {
          "id": "w12-a3",
          "title": "Đánh giá 90 ngày: doanh thu, lead pipeline, learning",
          "type": "reflection",
          "time_min": 90,
          "tools": ["Sheet metrics"],
          "output": "1 doc gồm: doanh thu tháng 1-3, số lead active, referral pipeline, top 3 learning"
        },
        {
          "id": "w12-a4",
          "title": "Plan Q2 (tháng 4-6): target 3 khách, 2 case study mới, pricing bump 20%",
          "type": "reflection",
          "time_min": 90,
          "tools": ["Notion/Google Doc"],
          "output": "1 quarterly plan Q2 với 3 goals + 5 monthly milestones"
        }
      ]
    }
  ],
  "metadata": {
    "target_income_end_90d": "20-40 triệu/tháng (khách #1 stable)",
    "target_pipeline_end_90d": "5-10 warm leads for month 4-6",
    "prerequisites": [
      "Có 5+ năm kinh nghiệm chuyên môn thực chiến",
      "10-20h/tuần quỹ thời gian",
      "Buffer tài chính 6 tháng"
    ],
    "common_failures": [
      "Undercharge ban đầu vì thiếu tự tin — không thể tăng giá sau này",
      "Chờ khách hàng đến thay vì proactive outreach",
      "Nhận project không phù hợp ngách — làm scattered, không build brand",
      "Không tracked metrics — không biết cái gì work"
    ],
    "success_indicators": [
      "Tuần 4: có portfolio 3 case study live",
      "Tuần 8: có 5+ warm lead trong pipeline",
      "Tuần 12: đóng ≥1 khách với giá tối thiểu 15tr/project (hoặc 500k/giờ)"
    ]
  }
}

```

═══ YÊU CẦU OUTPUT ═══

Trả về CHỈ JSON hợp lệ (không markdown wrapping, không giải thích thêm). Schema y hệt sample:

1. `version`: "1.0"
2. `direction_id`: "bfb89eee-4104-4921-a5a5-953ee6158354"
3. `direction_name`: "Nhượng Quyền Thương Hiệu"
4. `total_weeks`: 12
5. `total_actions`: 40-50 (tổng actions trong 12 tuần)
6. `phases`: 3 giai đoạn `[Định vị (T1-4), Momentum (T5-8), Khách #1 (T9-12)]` — MỖI phase có `goal` cụ thể cho mô hình **Nhượng Quyền Thương Hiệu**
7. `weeks`: 12 tuần, mỗi tuần có 3-5 actions:
   - `id`: `"wX-aY"` format
   - `title`: hành động cụ thể, imperative (không "bạn nên..." mà "Làm...")
   - `type`: `reflection | research | output | outreach | learn`
   - `time_min`: 30-180 phút (thực tế)
   - `tools`: array công cụ cụ thể (VD `["Canva", "LinkedIn", "Fastwork.vn"]`)
   - `output`: kết quả cụ thể có thể verify được (VD "1 URL portfolio live", "3 case studies 400-500 chữ")
8. `metadata`:
   - `target_income_end_90d`: doanh thu dự kiến cuối 90 ngày (thực tế cho mô hình này)
   - `target_pipeline_end_90d`: pipeline dự kiến cho tháng 4-6
   - `prerequisites`: 3-5 điều kiện tiên quyết
   - `common_failures`: 3-5 sai lầm phổ biến
   - `success_indicators`: 3 milestone (tuần 4, 8, 12)

═══ QUY TẮC CHẤT LƯỢNG ═══

- Ngôn ngữ tiếng Việt, dùng "bạn" xuyên suốt (không mix "anh/chị/em")
- Tools phải cụ thể: tên platform/app thực tồn tại (Notion, Canva, Fastwork.vn, Sepay, Zalo, ChatGPT, Claude, Gemini, ...)
- Actions phù hợp thực tế Việt Nam (VD MST cá nhân, thuế khoán 1.5%, Zalo group, VietQR, momo)
- Output phải MEASURABLE (verify được, có số/URL/document cụ thể)
- **Considering DNA scores cho mô hình này**:
  - vp_people 60/100 → nhiều outreach actions
  - vp_expert 35/100 → ít content/thought leadership actions
- **Considering resources**:
  - vr_capital 80/100 → phase 1 phải có action về capital planning
  - vr_tech 35/100 → tech không phải bottleneck
- Time realistic: total hours 12 tuần ≤ 120h (10h/tuần average)
- Phase 3 (Khách #1) phải kết thúc bằng: đóng deal đầu + retention plan

**TRẢ VỀ CHỈ JSON. KHÔNG explain, KHÔNG markdown wrapping.**
