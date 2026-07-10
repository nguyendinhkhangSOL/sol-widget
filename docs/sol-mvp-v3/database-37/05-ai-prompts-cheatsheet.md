# AI Prompts Cheatsheet — Draft 37 mô hình nhanh

*Copy-paste prompt vào ChatGPT/Claude → AI draft nội dung → Khang Sol edit + verify.*

**Nguyên tắc:** AI làm 70% work, Khang Sol làm 30% (fact-check + case study + insight độc bản).

---

## 🎯 Master Prompt (dùng đầu tiên)

```
Tôi là Nguyễn Đình Khang (Khang Sol), sáng lập Sol.vn — hệ thống tái khởi nghiệp
đúng hướng cho người Việt 40-60. Tôi đang xây database 37 mô hình khởi nghiệp
tinh gọn phù hợp với market Việt Nam.

Bạn là senior consultant expert về:
- SME Vietnam market (2020-2026)
- Lean startup + Product-market fit
- Career pivot cho executives 40-60

Task: Viết CHI TIẾT cho mô hình sau, dùng template Markdown mình cung cấp.

Yêu cầu quality:
1. Số liệu REALISTIC (không hype)
2. Case study tương thích Việt Nam (VD tên/địa điểm)
3. Tone thực chiến, tôn trọng, viết bằng "bạn" (không "anh/chị")
4. Số VND, không dùng USD
5. Tránh buzzword ("growth hack", "10x", "disruption")
6. Focus hiện thực Việt Nam 40-60 (khách hàng B2B/B2C VN, network local, etc.)

Format output: Markdown với YAML front matter đúng schema.
```

---

## 📝 Per-Model Prompt Template

```
[MASTER PROMPT trên]

═══════════════════════════════════════════════════════════
MÔ HÌNH CẦN VIẾT:
═══════════════════════════════════════════════════════════

Tên: [TÊN MÔ HÌNH]
Nhóm: [1 trong 7 nhóm]
ID: MH-[XXX]
Slug: [ten-mo-hinh-slug]

Context bổ sung (nếu có):
- [Ngành cụ thể, target audience, gì đặc biệt]

═══════════════════════════════════════════════════════════
Vui lòng viết theo template Markdown sau:
═══════════════════════════════════════════════════════════

[PASTE 04-template-blank.md ở đây]

═══════════════════════════════════════════════════════════
Yêu cầu đặc biệt:
═══════════════════════════════════════════════════════════

1. Case study: Draft 1 case (tôi sẽ điền real case sau)
2. Roadmap 90 ngày: 3 giai đoạn 30 ngày, mỗi giai đoạn 4-6 actions cụ thể
3. Số thu nhập: Việt Nam SME market, không copy US numbers
4. AI tools: Prioritize tools rẻ (Free/Team tier) cho early-stage
5. Bẫy phổ biến: Realistic cho market Việt Nam (không phải US assumption)

Xuất Markdown đầy đủ, sẵn sàng copy vào file.
```

---

## 🎨 Nhóm-specific tweaks

### Nhóm 1: Chuyên môn (Consulting)
Add to prompt:
```
Special: Focus B2B senior services. Target: CEO/Founder SME 5-50 tỷ.
Pricing: Retainer 8-25tr/tháng, KHÔNG per-hour. Delivery: Zoom + Whatsapp.
Vietnamese SME pain: scale, financial control, digital transformation, talent.
```

### Nhóm 2: Đào tạo (Training)
```
Special: Focus 1-1 hoặc small group (5-15 người). Pricing: Cohort model 3-8tr/tháng
hoặc 20-50tr/khóa 3 tháng. Delivery: Zoom + private community (Discord/Circle).
```

### Nhóm 3: Nội dung số (Digital Content)
```
Special: Long-term play. Break-even 6-12 tháng. Revenue mix: ad + affiliate +
sponsor + course + membership. Target: 10K+ subs/followers before monetize.
```

### Nhóm 4: Kinh doanh nhỏ (Small Business)
```
Special: Physical component có thể có. Focus asset-light models. Avoid heavy
inventory. Prefer digital-first (Shopify, Etsy VN, Sendo Business).
```

### Nhóm 5: Dịch vụ hàng ngày
```
Special: Local market Việt Nam (Hà Nội/HCM/Đà Nẵng). Physical presence. Team
1-3 người OK. Marketing: Google Maps + Facebook local + word-of-mouth.
```

### Nhóm 6: Dịch vụ chuyên biệt
```
Special: Niche expertise cần credentials (legal, accounting, IT security).
Compliance cẩn thận. Pricing premium 30-100tr/dự án hoặc 20-50tr/tháng retainer.
```

### Nhóm 7: Đầu tư & Tài sản
```
Special: KHÔNG đưa lời khuyên đầu tư cụ thể (compliance). Chỉ mô tả mô hình
+ pros/cons + case study có thật. Add disclaimer YMYL cuối bài.
```

---

## ✅ Post-AI Quality Checklist

Sau khi AI generate, Khang Sol check:

- [ ] Số liệu Việt Nam đúng (VND, market size, thực tế)
- [ ] Case study có thể verify (không bịa)
- [ ] Roadmap ACTIONABLE (không mơ hồ)
- [ ] Không hứa hẹn quá (compliance YMYL)
- [ ] Tone phù hợp 40-60 (tôn trọng, không patronize)
- [ ] Tags đúng convention
- [ ] YAML front matter valid
- [ ] Verify_at + last_reviewed đã update
- [ ] Ít nhất 1 phần "insight độc bản" từ Khang Sol (AI không có)

**Rule quan trọng:** Nếu Khang Sol không tin 1 điểm nào trong output → sửa ngay, đừng để. User 40-60 rất tinh, họ phát hiện bullshit ngay.

---

## 🚀 Bulk-fill workflow (efficient)

### Session 1: Setup (30 phút)
1. Mở ChatGPT Team/Claude Pro
2. Paste Master Prompt (system-level)
3. Upload template + schema doc + priority list

### Session 2-11: Fill Tier 1 (2-3h/session × 10 sessions)
Mỗi session:
1. Chọn 1 mô hình từ priority list
2. Paste Per-Model prompt + specific tweak (theo nhóm)
3. AI generate → download output
4. Khang Sol review + edit 30% (add real case, insight, fix numbers)
5. Save file `MH-XXX-slug.md` trong `/database/mo-hinh/`

### Session 12-14: Fill Tier 2 (5h/session × 3 sessions)
- Bulk mode: AI generate 5 mô hình cùng lúc (giảm depth 30%)
- Review nhanh — chỉ check quality bar

### Session 15: Tier 3 stubs (2 giờ)
- Chỉ hero + 1 paragraph description + "Sắp có nội dung chi tiết"

---

## 🎯 Budget & Timeline

| Phase | Effort | Timeline |
|---|---|---|
| Setup + Gold standard | 5h (mình đã làm) | Xong ✓ |
| Tier 1 (10 mô hình full) | 20-30h | Tuần 1-2 |
| Tier 2 (15 mô hình medium) | 15-20h | Tuần 3 |
| Tier 3 (12 stubs) | 5-8h | Tuần 3 cuối |
| Quality review + verify | 5h | Rải rác |
| **Total** | **50-70h** | **~3 tuần part-time** |

**AI cost:** ~500k VND cho ChatGPT Team hoặc Claude Pro 1 tháng.

---

*Đúng hướng. Đúng bước. Đúng tương lai.*
