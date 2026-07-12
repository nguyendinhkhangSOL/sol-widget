# Pillar CTA Reverse — Cross-link sol.vn → huongdi.sol.vn

Add block CTA "Bắt đầu DNA Test" cuối 7 pillar pages trên sol.vn → drive traffic về huongdi P1 quiz.

## Files

| File | Mục đích |
|---|---|
| `cta-block.html` | Block HTML Gutenberg với gradient, 3 benefits, UTM tracking |
| `append-cta-to-pillars.js` | Script Node tự động append CTA vào 7 pillars qua WP REST API |

## Cách chạy

### Bước 1: Dry-run preview (không update DB)

```bash
cd C:\BOTHUOCLA\sol-widget\docs\pillar-cta-reverse
node append-cta-to-pillars.js --dry-run
```

**Expected output:**
```
── Processing Pillar #1 — Freelancer Chuyên Môn (ID 3345) ──
  📝 DRY-RUN: would update 18.X KB
     Status: publish, Slug: freelancer-chuyen-mon-tuoi-45

── Processing Pillar #2 — Huấn luyện & Đào Tạo (ID 3348) ──
  📝 DRY-RUN: would update 17.X KB
...
```

### Bước 2: Live update

```bash
node append-cta-to-pillars.js
```

Idempotent — chạy lại sẽ skip pillar đã có CTA.

### Bước 3: Verify

Vào browser bất kỳ pillar:
```
https://sol.vn/huong-di/freelancer-chuyen-mon-tuoi-45/
```

Scroll xuống cuối → phải thấy block CTA gradient amber với:
- Headline "Hướng này phù hợp với anh không?"
- 3 cards (5 phút | Cá nhân hoá | Miễn phí)
- Button "Bắt đầu DNA Test →"
- Social proof "500+ anh em U45 tìm được hướng đi"

### Bước 4: Test click → tracking

Click button → URL phải có UTM:
```
https://huongdi.sol.vn/p1.html?utm_source=sol_pillar&utm_medium=cta_footer&utm_campaign=cross_link
```

GA4 sẽ tự nhận UTM tracking.

## Options khác

```bash
# Chỉ update 1-2 pillar cụ thể
node append-cta-to-pillars.js --ids 3345,3348

# Force re-append (xoá CTA cũ + add CTA mới)
node append-cta-to-pillars.js --force

# Combine
node append-cta-to-pillars.js --ids 3345 --force
```

## Rollback nếu cần

Script không lưu backup tự động. Nếu cần rollback:

```bash
# Force overwrite với version mới + tốt hơn (chạy update lại với CTA design mới)
node append-cta-to-pillars.js --force

# HOẶC manual: vào WP admin → Edit pillar → xoá block CTA → Save
```

## Cấu trúc CTA Block

```
┌──────────────────────────────────────────────┐
│ 🎯 BƯỚC TIẾP THEO                            │
│                                              │
│  Hướng này phù hợp với anh không?           │
│                                              │
│  Làm bài DNA Test 20 câu (5 phút) —          │
│  mình sẽ match anh với top 5 hướng đi        │
│  phù hợp nhất trong 37 hướng tái khởi nghiệp │
│                                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐         │
│  │⏱ 5 phút │ │🎯 Match │ │💯 Free  │         │
│  └─────────┘ └─────────┘ └─────────┘         │
│                                              │
│  ┌─────────────────────────────┐             │
│  │   Bắt đầu DNA Test →        │             │
│  └─────────────────────────────┘             │
│                                              │
│  Đã có 500+ anh em U45 tìm được hướng đi    │
└──────────────────────────────────────────────┘
```

## Expected impact (90 ngày)

| Metric | Trước | Sau (target) |
|---|---|---|
| Traffic huongdi.sol.vn từ sol.vn | <1% | 10-20% |
| Click-through pillar → P1 | 0% | 5-12% |
| Hoàn thành P1 từ pillar traffic | 0 | 50-150/tháng |
| Internal link signal Google | minimal | strong bi-directional |

---

*Author: Khang Sol*
*Version: 1.0 — Tháng 6/2026*
