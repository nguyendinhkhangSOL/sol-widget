# 🗺️ Sol — Journey Simulator Design Document

> **Mục đích**: Tài liệu kỹ thuật + khoa học cho component "Journey Simulator" — trang Hành Trình mặc định khi user vào dashboard. Document này ghi rõ formula, tham số, nguồn khoa học cho 4 body recovery curves để bất cứ session Claude nào (hoặc dev mới) cũng có thể kế thừa + review.
>
> **File implementation**:
> - `dashboard/src/lib/bodyRecovery.ts` (data + formula)
> - `dashboard/src/components/JourneySimulator.tsx` (UI)
>
> **Last updated**: 2026-05-23
> **Maintainer**: Khang Sol

---

## 1. 🎯 Vision

User vào dashboard → mặc định landing tại **Tổng Quan = Hành Trình** → thấy:

1. **Slider time-travel** kéo Day 0 → Day 730 (2 năm)
2. **Hero stats** nhảy số live theo slider: Điếu KHÔNG đốt / Tiền tiết kiệm / Tuổi thọ thêm
3. **4 progress rings** body recovery: Tim mạch / Phổi / Não bộ / Miễn dịch — fill % theo slider
4. **Milestones list** science-based với link nguồn (CDC/NHS/AHA)
5. **(Sắp tới)** Daily Alert pulse + Share PNG button

**Goal UX**: User vừa thấy thành quả hiện tại (slider ở vị trí "Hôm nay"), vừa có thể **kéo về tương lai** xem cơ thể mình sẽ ra sao Day 30 / Day 90 / Day 365 → motivation boost + share-able.

---

## 2. 📐 Recovery Curve Formula

### Hàm chính

```typescript
pct(curve, day) = floor + (max - floor) × (1 - 2^(-day / halfLifeDay))
```

Đây là **exponential half-life curve**:
- `day` = 0 → trả về `floor` (% recovery ban đầu, vd 5% cho heart, có cải thiện ngay 20 phút đầu)
- `day` = `halfLifeDay` → đạt 50% (giữa floor và max)
- `day` → ∞ → tiệm cận `max` (100%)

### Tham số cho 4 system

| System | halfLifeDay | maxPercent | initialPercent | Rationale |
|---|---:|---:|---:|---|
| 🫀 **Tim mạch** | 90 | 100 | 5 | Hồi phục nhanh tháng đầu (CDC: 20 phút huyết áp normal). 50% nguy cơ tim mạch giảm @ 1 năm → curve hit 94% @ Day 365 ≈ "function gần đầy đủ" |
| 🫁 **Phổi** | 180 | 100 | 2 | Chậm hơn — NHS confirms cilia mất 9 tháng full recovery, lung cancer risk giảm 50% mất 10 năm. 50% @ Day 180 |
| 🧠 **Não bộ** | 45 | 100 | 10 | Nhanh nhất — Brody 2006: nAChR upregulation reversal 6-12 tuần; Rademacher 2016: dopamine normalize 3 tháng. 50% @ Day 45, 90% @ Day 150 |
| 🛡️ **Miễn dịch** | 60 | 100 | 5 | Trung gian — WBC normalize 1 tuần, T-cell + B-cell full recovery 1 năm. 50% @ Day 60 |

### Bảng giá trị quick reference

| Ngày | Tim mạch | Phổi | Não bộ | Miễn dịch |
|---:|---:|---:|---:|---:|
| 1 | 6% | 2% | 12% | 6% |
| 7 | 11% | 5% | 22% | 13% |
| 30 | 25% | 13% | 47% | 34% |
| 90 | 55% | 32% | 79% | 67% |
| 180 | 76% | 52% | 94% | 89% |
| 365 | 94% | 76% | 99% | 99% |
| 730 | 99% | 94% | 100% | 100% |

→ **Brain rings fill fastest** = user thấy "đầu óc tỉnh táo nhanh nhất" = match science về dopamine reset.
→ **Lung rings slowest** = user thấy "phổi cần kiên nhẫn 1-5 năm" = match CDC.

---

## 3. 🔬 Nguồn khoa học (28 milestones)

Tất cả links đều là **public URLs** từ tổ chức y tế uy tín — anh có thể click verify.

### 3.1 Tim mạch (8 milestones)

| Day | Title | Source | URL |
|---|---|---|---|
| 20 phút | Nhịp tim & huyết áp giảm | CDC | https://www.cdc.gov/tobacco/about/benefits-of-quitting.html |
| 12 giờ | CO trong máu về bình thường | CDC | (same) |
| 1 ngày | Tuần hoàn cải thiện rõ | AHA | https://www.heart.org/en/healthy-living/healthy-lifestyle/quit-smoking-tobacco/benefits-of-quitting-smoking-over-time |
| 7 ngày | Mạch máu giãn nở tốt hơn | J Am Coll Cardiol 2024 | https://pmc.ncbi.nlm.nih.gov/articles/PMC11843939/ |
| 30 ngày | Tim đập hiệu quả hơn | CDC | (same as CDC above) |
| 1 năm | Nguy cơ NMCT giảm 50% | Surgeon General 2020 | https://www.cdc.gov/tobacco-surgeon-general-reports/reports/2020-smoking-cessation/index.html |
| 5 năm | Đột quỵ ngang người không hút | CDC | https://www.cdc.gov/tobacco/about/cigarettes-and-cardiovascular-disease.html |
| 15 năm | Tim mạch như người chưa hút | Surgeon General 2020 | (same) |

### 3.2 Phổi (7 milestones)

| Day | Title | Source | URL |
|---|---|---|---|
| 72 giờ | Phế quản giãn, thở dễ hơn | NHS | https://www.nhs.uk/live-well/quit-smoking/what-happens-when-you-quit-smoking/ |
| 14 ngày | Lông mao bắt đầu tái tạo | Surgeon General 2020 | https://www.hhs.gov/sites/default/files/2020-cessation-sgr-full-report.pdf |
| 30 ngày | Chức năng phổi tăng 30% | NHS | (same) |
| 9 tháng | Lông mao phục hồi gần hoàn toàn | NHS | (same) |
| 1 năm | Ho + khó thở giảm rõ | Surgeon General 2020 | (same) |
| 5 năm | Ung thư miệng-họng giảm 50% | CDC | https://www.cdc.gov/tobacco/about/benefits-of-quitting.html |
| 10 năm | Ung thư phổi giảm 50% | Surgeon General 2020 | (same) |

### 3.3 Não bộ (5 milestones)

| Day | Title | Source | URL |
|---|---|---|---|
| 2.5 ngày | Nicotine sạch khỏi cơ thể | Surgeon General 2020 | https://www.hhs.gov/sites/default/files/2020-cessation-sgr-full-report.pdf |
| 10 ngày | Cơn thèm thưa dần | Brody 2006, Arch Gen Psychiatry | https://pubmed.ncbi.nlm.nih.gov/16894066/ |
| 30 ngày | Receptor nicotinic về gần bình thường | Cosgrove 2009 / Brody 2013 | https://www.nature.com/articles/npp201353 |
| 90 ngày | Dopamine về mức bình thường | Rademacher 2016, Biol Psychiatry | https://pubmed.ncbi.nlm.nih.gov/26803340/ |
| 180 ngày | Mạch máu não & nhận thức cải thiện | McClernon-related | https://pmc.ncbi.nlm.nih.gov/articles/PMC5330670/ |

### 3.4 Miễn dịch (5 milestones)

| Day | Title | Source | URL |
|---|---|---|---|
| 1 ngày | Viêm cấp bắt đầu hạ | Mayo Clinic Proc 2005 | https://www.mayoclinicproceedings.org/article/S0025-6196(11)61584-X/abstract |
| 7 ngày | Số lượng bạch cầu giảm rõ | Br J Haematol | https://pubmed.ncbi.nlm.nih.gov/1538385/ |
| 30 ngày | Niêm mạc miệng & họng lành | NHS | https://www.nhs.uk/live-well/quit-smoking/what-happens-when-you-quit-smoking/ |
| 90 ngày | Tế bào miễn dịch tự nhiên hồi phục | Smoking & Inflammation, NCBI | https://www.ncbi.nlm.nih.gov/pmc/articles/PMC1160597/ |
| 365 ngày | Hệ miễn dịch thích nghi gần đầy đủ | Nature Comm 2024 | https://pubmed.ncbi.nlm.nih.gov/38355790/ |

---

## 4. 💰 Stats formula (hero numbers)

### 4.1 Điếu KHÔNG đốt

```
cigsAvoided = simDay × user.cigsBaseline
```

- `simDay` = vị trí slider (Day 0-730)
- `user.cigsBaseline` = số điếu/ngày user khai onboarding (1-60)

### 4.2 Tiền tiết kiệm

```
moneySaved = cigsAvoided × user.pricePerCig
```

- `user.pricePerCig` = giá mỗi điếu (default 1000đ — Vinataba 20k/bao 20 điếu)

### 4.3 Tuổi thọ thêm

```
lifeMinutes = cigsAvoided × 11
```

**Nguồn**: 11 minutes lost per cigarette — Shaw, Mitchell, Dorling. *Time per cigarette: variations between studies*. **BMJ 2000;320:53** ([link](https://www.bmj.com/content/320/7226/53)). Đây là average dùng phổ biến trong public health.

Format:
- < 60 phút → "X phút"
- < 24 giờ → "X.X giờ"
- < 30 ngày → "X.X ngày"
- ≥ 30 ngày → "X.X tháng"

### 4.4 Chỉ số làm chủ (Mastery Score)

Đây là feature riêng, KHÔNG phải mặc định trong Journey Simulator. Wire qua prop `masteryScore` (0-100). Endpoint: `GET /api/stats/control-score`.

Công thức ở `backend/src/stats/routes.ts:388-444`:
- Hiểu Mình (0-33): % ngày user log điếu / 30 × 33
- Trì Hoãn (0-33): số lần Crisis Timer thành công × 3, cap 33
- Quay Lại (0-33): số lapse recover < 24h × 5, cap 33

Threshold:
- 0-19: Chưa nhận ra
- 20-39: Đang nhận ra
- 40-59: Đang làm chủ
- 60-79: Làm chủ rõ
- 80-100: Tự do

---

## 5. 🎨 UI Design Decisions

### Slider position

- Default: `simDay = currentDay` (vị trí "Hôm nay")
- Min: 0 (chưa start)
- Max: 730 (2 năm, đủ cover Tái Thiết extension)
- Marker đỏ "▼ Hôm nay" trên slider để user biết vị trí thực

### Quick jumps

5 nút preset: Hôm nay / 1 tuần / 1 tháng / 3 tháng / 1 năm — bấm 1 chạm.

### Animation

- Slider thay đổi → ring fill transition 350ms easeOut
- Bấm "↩ Về hôm nay" → easeOutCubic 600ms ease back to currentDay

### Color palette

| System | Color | Why |
|---|---|---|
| Tim mạch | `#E24B4A` (đỏ) | Convention universal (heart = red) |
| Phổi | `#378ADD` (xanh dương) | Air, breath, oxygen |
| Não bộ | `#7F77DD` (tím) | Brain, neural |
| Miễn dịch | `#1D9E75` (xanh lá) | Health, regen, immune |

---

## 6. 🚀 Roadmap

### Phase 1 — DONE (23/5/2026)
- ✅ bodyRecovery.ts (28 milestones + 4 curves)
- ✅ JourneySimulator.tsx (slider + stats + rings + milestones)
- ✅ Wire vào Overview.tsx

### Phase 2 — Đang làm (24/5/2026)
- ⏳ Daily Alert pulse component (12-DAILY_ALERTS.md spec)
- ⏳ Share PNG button (html-to-image)
- ⏳ Wire Mastery Score endpoint

### Phase 3 — Sau launch (June 2026)
- 🔮 Lifetime value extrapolation (Day 730+)
- 🔮 Compare cohort: "Khang ở Day 35 (LIGHT) vs ở Day 35 (HEAVY)"
- 🔮 Push web/app notification về milestone đạt được

---

## 7. 📚 References

### Tổ chức y tế

- **CDC** — Centers for Disease Control and Prevention (USA): https://www.cdc.gov/tobacco
- **NHS** — National Health Service (UK): https://www.nhs.uk/live-well/quit-smoking
- **AHA** — American Heart Association: https://www.heart.org/en/healthy-living/healthy-lifestyle/quit-smoking-tobacco
- **HHS Surgeon General 2020** — Smoking Cessation report: https://www.hhs.gov/sites/default/files/2020-cessation-sgr-full-report.pdf
- **Mayo Clinic Proceedings**: https://www.mayoclinicproceedings.org
- **PubMed / PMC** — peer-reviewed: https://pubmed.ncbi.nlm.nih.gov

### Peer-reviewed papers

- Brody AL et al. (2006). *Cigarette smoking saturates brain α4β2 nicotinic acetylcholine receptors*. Arch Gen Psychiatry. [PubMed 16894066](https://pubmed.ncbi.nlm.nih.gov/16894066/)
- Cosgrove KP et al. / Brody AL (2013). *Brain nicotinic acetylcholine receptor occupancy: effect of smoking a denicotinized cigarette*. Neuropsychopharmacology. [Nature](https://www.nature.com/articles/npp201353)
- Rademacher L et al. (2016). *Recovery of midbrain striatal dopamine D2/D3 receptors after smoking cessation*. Biol Psychiatry. [PubMed 26803340](https://pubmed.ncbi.nlm.nih.gov/26803340/)
- Saint-André V et al. (2024). *Smoking changes adaptive immunity with persistent effects*. Nature Communications. [PubMed 38355790](https://pubmed.ncbi.nlm.nih.gov/38355790/)
- Shaw M, Mitchell R, Dorling D (2000). *Time per cigarette: BMJ.* BMJ;320:53. [BMJ link](https://www.bmj.com/content/320/7226/53)

### Project files

- Implementation: `dashboard/src/lib/bodyRecovery.ts`, `dashboard/src/components/JourneySimulator.tsx`
- Backend: `backend/src/journey/cohortConfig.ts` (3 cohort definitions)
- Wiki content (Vietnamese SEO): `wiki-skeletons/wiki-articles/QDAY-*.html`, `PILLAR-*.html`

---

## 8. ⚠️ Disclaimer y khoa

Các curves là **mô hình ước tính** dựa trên research aggregated. Không phải:
- Cá nhân hoá theo độ tuổi / năm hút thuốc / sức khoẻ nền của user
- Diagnostic / treatment advice
- Replacement cho bác sĩ

Footer Sol global (sol-global-footer.php) đã có medical disclaimer. Trong UI tương lai có thể add tooltip "% là ước tính trung bình. Cá nhân anh có thể khác" trên rings.

---

**Cross-references:**
- [09-DECISIONS.md](./09-DECISIONS.md) — quyết định 2026-05-23 chốt JourneySimulator
- [01-ARCHITECTURE.md](./01-ARCHITECTURE.md) — system architecture overview
- [05-ARCHITECTURE.md](./05-ARCHITECTURE.md) — frontend components

**Last updated**: 2026-05-23
**Maintainer**: Khang Sol
