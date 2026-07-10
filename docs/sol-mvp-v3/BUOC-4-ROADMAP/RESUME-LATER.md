# Bước 4 Roadmap — Resume Later Guide

**Ngày ghi:** 2026-07-05
**Trạng thái:** Paused vì Anthropic API hết credit. Sẵn sàng chạy tiếp khi anh nạp credit.

---

## 📍 Đang ở đâu trong flow

```
✅ Phase 1a: Verify DB schema — 37 mô hình có roadmap_90 (2-3 items — quá sơ sài)
✅ Phase 1b: Design JSON schema chi tiết (12 tuần × 3-5 actions × 3 giai đoạn)
✅ Phase 1c: Sample rich roadmap "Freelancer Chuyên Môn" (48 actions) — anh approved
⏸ Phase 1d: Bulk generate 36 roadmaps còn lại với Claude API ← PAUSED HERE
⬜ Phase 1e: Import 37 roadmaps vào DB (backup roadmap_90 cũ trước)
⬜ Phase 2:  Backend API + Frontend /toi/roadmap/
```

---

## 🎯 Việc còn lại — 3 bước

### Bước A: Nạp credit Anthropic

Vào https://console.anthropic.com/settings/billing

- **Nạp $10** → đủ chạy bulk 36 roadmaps (~$6) + buffer $4 cho Sol Đồng Hành AI chatbot
- Thanh toán VISA/Mastercard quốc tế
- Credit áp dụng ngay lập tức

### Bước B: Chạy script bulk generate

Files đã sẵn trên VPS:
- `/var/www/huongdi/backend/scripts/generate-roadmaps.js`
- `/tmp/sample-roadmap-freelancer.json`

Command:
```bash
ssh sol-vps
cd /var/www/huongdi/backend

# Test với 1 mô hình trước (chi phí ~$0.17)
sudo node scripts/generate-roadmaps.js --test life-coaching-career-coaching

# Kiểm tra file output có OK không:
cat /tmp/roadmaps-generated/roadmap-life-coaching-career-coaching.json | jq '.metadata'

# Nếu OK → chạy full bulk 36 mô hình (~10-15 phút, ~$6)
sudo node scripts/generate-roadmaps.js

# Download 36 files JSON về máy anh (để em review)
exit  # thoát ssh
scp -r sol-vps:/tmp/roadmaps-generated C:\BOTHUOCLA\sol-widget\docs\sol-mvp-v3\BUOC-4-ROADMAP\generated\
```

### Bước C: Ping em để continue Phase 1e (import vào DB)

Sau khi anh có 36 files JSON, ping em → em ship script SQL migration:
- Backup roadmap_90 cũ vào field `roadmap_90_v1`
- UPDATE 37 rows với content mới
- Verify count + JSON structure

---

## 📝 Alternative: Chạy manual (không cần API credit)

Nếu anh không muốn nạp credit ngay, có thể **generate từng mô hình bằng Claude web app** (https://claude.ai — free plan cũng chạy được).

**Quy trình:**

1. Mở https://claude.ai → new conversation
2. Copy prompt bên dưới, THAY 3 placeholder `[XXX]` bằng data thực của mô hình
3. Claude generate JSON → anh copy save vào file `roadmap-<slug>.json`
4. Lặp lại cho 36 mô hình

**Lấy data 36 mô hình từ VPS:**
```bash
ssh sol-vps
sudo -u postgres psql huongdi_prod << 'SQL'
COPY (
  SELECT json_agg(
    json_build_object(
      'id', id,
      'name', name,
      'slug', slug,
      'tagline', tagline,
      'description', description,
      'why_fit', why_fit,
      'barriers', barriers,
      'vp_people', vp_people, 'vp_expert', vp_expert,
      'vp_builder', vp_builder, 'vp_independent', vp_independent,
      'vr_capital', vr_capital, 'vr_time', vr_time,
      'vr_tech', vr_tech, 'vr_network', vr_network,
      'vr_risk', vr_risk, 'vr_energy', vr_energy
    )
  )
  FROM directions
  WHERE id != '214e7b23-a38a-4d6a-8c81-91bd3297d1a8'
  ORDER BY sort_order
) TO '/tmp/36-directions.json';
SQL

# Download file về máy
scp sol-vps:/tmp/36-directions.json ./
```

Anh mở file `36-directions.json` → copy data từng mô hình → paste vào prompt Claude web.

---

## 🎯 MASTER PROMPT (copy nguyên vào Claude web)

**Instruction:** Thay 3 placeholder `[[DIRECTION_DATA_JSON]]`, `[[DIRECTION_ID]]`, `[[DIRECTION_NAME]]` bằng data thực. Paste SAMPLE JSON vào chỗ `[[SAMPLE_JSON]]`.

```
Bạn là chuyên gia coach nghề nghiệp cho người Việt Nam 40-60 tuổi. Nhiệm vụ: viết roadmap 90 ngày CHI TIẾT cho mô hình kinh doanh sau, theo format JSON identical với sample.

═══ MÔ HÌNH ═══
[[DIRECTION_DATA_JSON]]

═══ SAMPLE REFERENCE (Freelancer Chuyên Môn) ═══
[[SAMPLE_JSON]]

═══ YÊU CẦU OUTPUT ═══
Trả về CHỈ JSON hợp lệ (không markdown wrapping, không giải thích). Schema y hệt sample:

1. version: "1.0"
2. direction_id: "[[DIRECTION_ID]]"
3. direction_name: "[[DIRECTION_NAME]]"
4. total_weeks: 12
5. total_actions: khoảng 40-50 (tổng actions trong 12 tuần)
6. phases: 3 giai đoạn [Định vị (T1-4), Momentum (T5-8), Khách #1 (T9-12)] — MỖI phase có "goal" cụ thể cho mô hình này
7. weeks: 12 tuần, mỗi tuần có 3-5 actions:
   - id: "wX-aY" format
   - title: hành động cụ thể, imperative (không "bạn nên..." mà "Làm...")
   - type: reflection | research | output | outreach | learn
   - time_min: 30-180 phút (thực tế)
   - tools: array công cụ cụ thể (VD ["Canva", "LinkedIn"])
   - output: kết quả cụ thể có thể verify được (VD "1 URL portfolio live", "3 case studies 400-500 chữ")
8. metadata: target_income_end_90d, target_pipeline_end_90d, prerequisites (3-5 items), common_failures (3-5 items), success_indicators (3 milestones tuần 4, 8, 12)

═══ QUY TẮC CHẤT LƯỢNG ═══

- Ngôn ngữ tiếng Việt, dùng "bạn/anh/chị" — chuẩn hoá 1 kiểu xuyên suốt
- Tools phải cụ thể: tên platform/app thực (Notion, Canva, Fastwork.vn, Sepay, ...)
- Actions phải phù hợp thực tế Việt Nam (VD MST cá nhân, thuế khoán, Zalo, VietQR)
- Output phải MEASURABLE (verify được, có số/URL/document cụ thể)
- Considering DNA scores: nếu mô hình có vp_people cao → nhiều outreach actions. Nếu vp_expert cao → nhiều content thought leadership actions
- Considering resources: nếu vr_capital cao → phase 1 phải có action về capital planning. Nếu vr_tech cao → phase 1 học tech
- Time realistic: total hours 12 tuần ≤ 120h (10h/tuần average)
- Phase 3 (Khách #1) phải kết thúc bằng: đóng deal đầu + retention plan

TRẢ VỀ CHỈ JSON.
```

---

## 📚 File & Location References

**Trên máy anh (Windows):**
- `C:\BOTHUOCLA\sol-widget\docs\sol-mvp-v3\BUOC-4-ROADMAP\` — folder chứa toàn bộ Bước 4
  - `PHASE-1-DESIGN.md` — Design overview
  - `sample-roadmap-freelancer-chuyen-mon.json` — Sample rich roadmap
  - `generate-roadmaps.js` — Script Node.js bulk generator
  - `deploy-generator.sh` — Setup script cho VPS
  - `check-real-schema.sh` — Debug DB schema
  - `check-roadmap-90-data.sh` — Debug roadmap_90 content
  - `RESUME-LATER.md` — File này

**Trên VPS (huongdi.sol.vn):**
- `/var/www/huongdi/backend/scripts/generate-roadmaps.js`
- `/tmp/sample-roadmap-freelancer.json`
- `/tmp/roadmaps-generated/` (output folder, empty until run)

**Task tracking:**
- #63 in_progress: Bước 4 Roadmap 90 Ngày Template engine
- #148 completed: Sample rich roadmap Freelancer
- #149 in_progress: Bulk generate 36 roadmaps (PAUSED)
- #150 pending: Import 37 roadmaps vào DB
- #146 pending: Phase 2 Backend API + Personalization

---

## 💰 Cost Summary

| Item | Cost |
|------|------|
| Anthropic credit nạp | $10 (~250,000 VND) |
| Bulk generate 36 roadmaps (Sonnet 4.6) | ~$6 |
| Buffer for retries + Sol Đồng Hành AI | ~$4 |
| **Total nạp** | **$10** |

Alternative: Dùng Claude web free plan (chạy manual, không cần API credit) — chỉ mất thời gian copy-paste 36 lần.

---

## ✅ Next session — Quick resume

Khi anh sẵn sàng continue, chỉ cần ping em:

> "Đã nạp credit Anthropic, chạy tiếp Bước 4 Phase 1d"

Em sẽ:
1. Verify credit balance
2. Guide test 1 mô hình
3. Full bulk 36 mô hình
4. Review output cùng anh
5. Phase 1e: Import DB
6. Phase 2: Ship backend + frontend
