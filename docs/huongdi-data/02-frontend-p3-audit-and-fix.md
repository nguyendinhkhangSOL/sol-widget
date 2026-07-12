# Frontend P3 — Audit + Fix nút "Đọc bài chi tiết"

**Mục đích:** Đảm bảo user xem kết quả P3 trên huongdi.sol.vn có thể click → đọc bài SEO long-form trên sol.vn/huong-di/.

---

## I. Audit hiện trạng (chạy trên VPS)

### Bước 1: Tìm file P3 result component

```bash
# Tìm file render kết quả P3
sudo grep -rln "Direction\|solArticleUrl" /var/www/huongdi/frontend/src 2>/dev/null | head -10

# Hoặc tìm component card hiển thị direction
sudo find /var/www/huongdi/frontend/src -name "*.tsx" -o -name "*.jsx" -o -name "*.vue" 2>/dev/null | xargs grep -l "direction\|Direction" 2>/dev/null | head -10
```

### Bước 2: Check xem có dùng `solArticleUrl` không

```bash
sudo grep -rn "solArticleUrl" /var/www/huongdi/frontend/src 2>/dev/null
```

**Có 3 trường hợp:**

| Trường hợp | Hiện trạng | Fix cần làm |
|---|---|---|
| **A. Có dùng nhưng UI ẩn** | `{direction.solArticleUrl && <a>...</a>}` đã có | Không cần fix — chỉ điền URL trong DB |
| **B. Không reference field này** | Frontend bỏ qua field từ API response | Cần thêm UI button |
| **C. Có button nhưng URL sai** | Hardcode link khác | Cần fix code |

---

## II. Template UI button "Đọc bài chi tiết"

### A. Vanilla HTML/CSS (nếu frontend là static HTML)

```html
<!-- Add vào template card kết quả P3 -->
<div class="direction-card-cta">
  <a href="${direction.solArticleUrl}"
     target="_blank"
     rel="noopener"
     class="btn-read-article"
     onclick="trackP3Click('${direction.id}', '${direction.solArticleUrl}')">
    📖 Đọc bài chi tiết về hướng này
    <span class="arrow">→</span>
  </a>
</div>

<style>
.btn-read-article {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #d97706, #f59e0b);
  color: #fff;
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  text-decoration: none;
  box-shadow: 0 2px 6px rgba(217, 119, 6, 0.3);
  transition: transform 0.2s, box-shadow 0.2s;
}
.btn-read-article:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(217, 119, 6, 0.4);
}
.btn-read-article .arrow {
  transition: transform 0.2s;
}
.btn-read-article:hover .arrow {
  transform: translateX(3px);
}
</style>

<script>
function trackP3Click(directionId, url) {
  // GA4 / GTM event
  if (window.gtag) {
    gtag('event', 'p3_article_click', {
      direction_id: directionId,
      destination_url: url,
    });
  }
}
</script>
```

### B. React/JSX (nếu dùng React SPA)

```jsx
// File: huongdi-frontend/src/components/DirectionCard.tsx
import React from 'react';

interface DirectionCardProps {
  direction: {
    id: string;
    name: string;
    tagline?: string;
    solArticleUrl?: string;
    ebookUrl?: string;
  };
}

export function DirectionCard({ direction }: DirectionCardProps) {
  const hasArticle = direction.solArticleUrl && direction.solArticleUrl.trim() !== '';
  const hasEbook = direction.ebookUrl && direction.ebookUrl.trim() !== '';

  const handleArticleClick = () => {
    // Tracking
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'p3_article_click', {
        direction_id: direction.id,
        direction_name: direction.name,
        destination_url: direction.solArticleUrl,
      });
    }
  };

  return (
    <div className="direction-card">
      <h3>{direction.name}</h3>
      {direction.tagline && <p className="tagline">{direction.tagline}</p>}

      <div className="card-cta-row">
        {hasArticle && (
          <a
            href={direction.solArticleUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleArticleClick}
            className="btn-primary"
          >
            📖 Đọc bài chi tiết
            <span className="arrow">→</span>
          </a>
        )}

        {hasEbook && (
          <a
            href={direction.ebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            📥 Tải ebook PDF
          </a>
        )}
      </div>
    </div>
  );
}
```

### C. Tailwind CSS classes (nếu dùng Tailwind)

```jsx
{hasArticle && (
  <a
    href={direction.solArticleUrl}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-amber-600 to-amber-500 text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
  >
    📖 Đọc bài chi tiết
    <span className="transition-transform group-hover:translate-x-1">→</span>
  </a>
)}
```

---

## III. Backend API — đảm bảo trả về `solArticleUrl`

### Verify endpoint trả về field này

```bash
# Test endpoint public (no auth)
curl -s https://huongdi.sol.vn/api/directions | python3 -m json.tool | head -50

# Hoặc endpoint admin
curl -s -H "Authorization: Bearer $TOKEN" https://adminhuongdi.sol.vn/api/admin/directions | python3 -m json.tool | head -50
```

**Expected:** Mỗi direction object phải có field `solArticleUrl`. Nếu thiếu, kiểm tra `select` clause trong Prisma query.

### Nếu API public không trả về solArticleUrl

Tìm file route public:
```bash
sudo grep -rln "directions" /var/www/huongdi/backend/src/routes 2>/dev/null
```

Đảm bảo `findMany` hoặc `findUnique` cho public không có `select` whitelist loại bỏ field này. Thường code dạng:

```typescript
// CHƯA OK — chỉ trả các field cụ thể, MIGHT thiếu solArticleUrl
const dirs = await prisma.direction.findMany({
  select: { id: true, name: true, tagline: true, /* missing solArticleUrl */ }
});

// OK — trả tất cả field public-safe
const dirs = await prisma.direction.findMany({
  where: { status: 'PUBLISHED' },
  // không có select → trả full object
});
```

---

## IV. Tracking — GA4 + Google Tag Manager

Sau khi có nút click, setup tracking để đo conversion P3 → Article:

### GA4 Event setup

```javascript
// Trong DirectionCard click handler
gtag('event', 'p3_article_click', {
  direction_id: direction.id,
  direction_name: direction.name,
  destination_domain: 'sol.vn',
  destination_url: direction.solArticleUrl,
  // P3 session context
  user_top_category: result.topCategory,  // category mạnh nhất của user
  user_p1_completed: true,
});
```

### GA4 Custom dimensions cần tạo

| Dimension name | Scope | Mô tả |
|---|---|---|
| `direction_id` | Event | UUID direction |
| `direction_name` | Event | Tên direction |
| `user_top_category` | Event | Category P1 best fit |

### GA4 Goal/Conversion

Mark event `p3_article_click` là **conversion event** trong GA4 → track tỷ lệ P3 → sol.vn engagement.

---

## V. Cross-link 2 chiều — sol.vn → huongdi

Trên 7 Pillar Pages của sol.vn, thêm CTA back về huongdi:

### Block CTA cuối mỗi pillar page

```html
<!-- Insert vào WordPress page editor -->
<div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border-radius: 12px;
            padding: 24px;
            margin: 32px 0;
            text-align: center;">
  <h3 style="margin-top: 0; color: #92400e;">
    🎯 Hướng này phù hợp với anh không?
  </h3>
  <p style="color: #78350f; margin-bottom: 16px;">
    Làm bài test 20 câu (5 phút) để mình match đúng hướng đi cho anh.
  </p>
  <a href="https://huongdi.sol.vn/p1.html"
     target="_blank"
     style="display: inline-block;
            background: #d97706;
            color: #fff;
            padding: 12px 24px;
            border-radius: 10px;
            font-weight: 700;
            text-decoration: none;
            box-shadow: 0 2px 6px rgba(217, 119, 6, 0.3);">
    Bắt đầu DNA Test →
  </a>
</div>
```

→ Anh có thể thêm vào template footer của 7 pillar pages WP, hoặc copy-paste vào cuối mỗi bài.

---

## VI. Checklist deploy

### Phase A — Data (Backend)
- [ ] Chạy SQL `01-update-solArticleUrl.sql` trên DB
- [ ] Verify: `SELECT category, COUNT(*) FROM "Direction" WHERE "solArticleUrl" <> '' GROUP BY category;`

### Phase B — Frontend Audit
- [ ] Grep tìm component card direction
- [ ] Check xem có dùng `solArticleUrl` không
- [ ] Nếu chưa có UI → add component DirectionCard ở trên

### Phase C — API
- [ ] Verify endpoint public/admin trả về `solArticleUrl`
- [ ] Test bằng curl

### Phase D — Tracking
- [ ] Setup GA4 event `p3_article_click`
- [ ] Tạo custom dimensions
- [ ] Mark event là conversion

### Phase E — Cross-link reverse
- [ ] Thêm CTA "Bắt đầu DNA Test" vào 7 pillar pages WP
- [ ] Verify link đúng `huongdi.sol.vn/p1.html`

### Phase F — Smoke test
- [ ] Vào huongdi.sol.vn → làm P1 → P2 → P3
- [ ] Click nút "Đọc bài chi tiết" → đến đúng pillar page sol.vn
- [ ] Click CTA "Bắt đầu DNA Test" trong pillar page → quay về huongdi
- [ ] Check GA4 Realtime: event `p3_article_click` xuất hiện

---

## VII. Expected impact (90 ngày sau deploy)

| Metric | Trước | Sau (target) |
|---|---|---|
| Avg time on huongdi (P3 view) | 30s | 30s (không đổi) |
| Click rate P3 → sol.vn pillar | 0% | 15-25% |
| Pageview pillar /huong-di/* | từ Google | + 15-25% từ huongdi |
| Internal link signals (Google) | sol.vn ↔ huongdi minimal | Strong bi-directional |
| Newsletter signup từ pillar | 1-2% | 3-5% (do user đã warm up qua P3) |

---

*Author: Khang Sol — Đi Cùng Sol*
*Version: 1.0 — Tháng 6/2026*
