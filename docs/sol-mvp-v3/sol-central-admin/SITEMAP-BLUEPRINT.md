# Sol Central Admin — Sitemap Blueprint 2026

`adminhuongdi.sol.vn` = **Operational Center** cho toàn hệ sinh thái Sol.

## 🎯 Nguyên tắc kiến trúc

1. **Một cổng đăng nhập duy nhất** — Khang chỉ cần nhớ 1 URL
2. **Module-based** — mỗi domain nghiệp vụ = 1 module độc lập
3. **Consistent UX** — same layout, same interactions
4. **Role-based access** — sau này thêm cộng tác viên (VD: nhân viên content)
5. **Data cross-linking** — click SDT ở Leads → mở Direction đã làm của user đó

## 🗺️ Sitemap V2 — 6 module

```
adminhuongdi.sol.vn/
├── /login                         [existing] — Đăng nhập admin
│
├── /dashboard                     [NEW] — Overview tổng
│   ├─ KPI cards: leads pending, active users, monthly revenue
│   ├─ Recent activity feed
│   └─ Quick actions: approve latest lead, view GSC
│
├── /leads                         [NEW ⚡ P0] — User Management V1
│   ├─ /leads                     — List + filter + search
│   ├─ /leads/:id                 — Chi tiết + Zalo helper + logs
│   └─ /leads/stats               — Conversion funnel
│
├── /directions                    [EXISTING] — Direction DB (37 mô hình)
│   ├─ /directions                — Grid 37 mô hình
│   ├─ /directions/:id/edit       — CMS-style editor
│   └─ /directions/import         — Bulk import CSV/JSON
│
├── /users                         [NEW P1] — Sổ Hành Trình data
│   ├─ /users                     — List all Sol users (đã Active)
│   ├─ /users/:id                 — Xem journey: Bước 1-2-3-4 kết quả
│   └─ /users/:id/renewal         — Manual renew (365 ngày +1)
│
├── /prompts                       [NEW P1] — Prompt Library (40 câu hỏi)
│   ├─ /prompts                   — List 40 prompts
│   ├─ /prompts/:id/edit          — Edit prompt template
│   └─ /prompts/analytics         — Which prompts được dùng nhiều nhất
│
├── /content                       [NEW P2] — Content Management
│   ├─ /content/pillars           — WordPress pillars status
│   ├─ /content/seo               — GSC integration (impressions, clicks)
│   └─ /content/editorial         — Editorial calendar
│
├── /payments                      [NEW P2] — Payment reconciliation
│   ├─ /payments                  — Techcombank tx list (manual import CSV)
│   ├─ /payments/match            — Match tx ↔ leads
│   └─ /payments/reports          — Monthly revenue reports
│
├── /notifications                 [NEW P2] — Email/SMS log
│   ├─ /notifications             — All sent notifications
│   └─ /notifications/templates   — Email templates editor
│
└── /settings                      [NEW P3]
    ├─ /settings/account          — Khang profile
    ├─ /settings/api-keys         — Manage API keys (SMTP, SMS, Zalo OA)
    └─ /settings/audit-log        — Who did what when
```

## 🎨 Layout wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  🧭 Sol Admin           Search…              Khang ▼        │  ← Top bar
├───────────────┬─────────────────────────────────────────────┤
│               │                                             │
│  Dashboard    │                                             │
│  💰 Leads (3) │           MAIN CONTENT AREA                 │
│  🗺️  Directions│           (Route-based rendering)          │
│  👤 Users     │                                             │
│  🤖 Prompts   │                                             │
│  📝 Content   │                                             │
│  💳 Payments  │                                             │
│  🔔 Notifs    │                                             │
│  ⚙️  Settings  │                                             │
│               │                                             │
│  ────────     │                                             │
│  📊 Health   │                                             │
│    API: OK   │                                             │
│    DB: 12MB  │                                             │
│               │                                             │
└───────────────┴─────────────────────────────────────────────┘
```

Sidebar chính là menu — badge số bên cạnh Leads = số pending chưa approve.

## 🚦 Priority roadmap

### Phase 1 (HÔM NAY sau khi deploy backend V1)
- **P0:** Integrate `/leads` vào SPA hiện có
  - Tạo route `/leads` + `/leads/:id`
  - Menu item "💰 Leads" trong sidebar (kèm badge count)
  - Reuse code từ `admin-spa/leads-page.html` — convert thành component/route

### Phase 2 (Tuần sau)
- **P1:** `/users` — quản lý Sổ Hành Trình
- **P1:** `/prompts` — CRUD 40 câu hỏi AI

### Phase 3 (Tháng sau)
- **P2:** `/dashboard` — KPI cards + activity feed
- **P2:** `/payments` — Import CSV Techcombank + auto-match

### Phase 4 (Q3)
- **P2:** `/content` — GSC integration
- **P3:** `/settings` — API keys management

## 🔌 Integration pattern

Tùy vào stack của SPA hiện có (React/Vue/Svelte/vanilla), pattern tương tự:

### Nếu SPA là **Vanilla JS SPA** (single HTML + module JS):

Tạo file mới `/var/www/adminhuongdi/public/js/modules/leads.js`:

```javascript
// modules/leads.js
export const LeadsModule = {
  route: '/leads',
  label: '💰 Leads',
  badge: async () => {
    const r = await fetch('/api/admin/leads?status=pending&limit=1');
    const d = await r.json();
    return d.summary?.find(s => s.payment_status === 'pending')?.count || 0;
  },
  render: async (container) => {
    container.innerHTML = await fetch('/js/modules/leads.html').then(r => r.text());
    // Init handlers từ leads.js (đã có trong leads-page.html standalone)
    initLeadsPage();
  }
};
```

Rồi register trong `main.js`:

```javascript
import { LeadsModule } from './modules/leads.js';
import { DirectionsModule } from './modules/directions.js';

const MODULES = [DirectionsModule, LeadsModule, /*...*/];

MODULES.forEach(m => {
  router.addRoute(m.route, m.render);
  sidebar.addMenuItem(m);
});
```

### Nếu SPA là **React**:

```tsx
// components/pages/LeadsPage.tsx
import { LeadsList } from '../leads/LeadsList';
import { LeadDetail } from '../leads/LeadDetail';

export function LeadsPage() {
  return (
    <Routes>
      <Route path="/" element={<LeadsList />} />
      <Route path=":id" element={<LeadDetail />} />
    </Routes>
  );
}

// App.tsx
<Route path="/leads/*" element={<LeadsPage />} />
```

Menu bổ sung vào sidebar component.

## 🔐 Auth strategy

Giữ nguyên auth hiện có (JWT hoặc session). Route mới `/leads` chỉ cần **wrapped** bởi `<RequireAuth>` hoặc middleware kiểm tra token — cùng pattern như `/directions`.

## 📊 Data cross-linking (feature xịn)

Sau khi có `/users` module, các link giữa domain:

- **Leads → User**: Click SDT ở Leads → mở `/users/?sdt=0912xxx` xem journey user này
- **User → Direction**: Ở user detail, hiện đường link tới 3-5 mô hình user match trong Bước 3
- **Payment → Lead**: Click transaction TCB → auto highlight lead có SDT match

## 🎁 Bonus features roadmap

- **Global search bar** — gõ SDT → suggest lead + user + payment
- **Keyboard shortcuts** — Ctrl+K global search, Ctrl+/ shortcuts help
- **Dark mode** — toggle cho eye-strain khi làm đêm
- **Mobile responsive** — Khang dùng phone approve nhanh khi đi đường
- **Export CSV** — Leads/Users/Payments → CSV cho báo cáo thuế
- **Audit log** — track ai đã approve lead nào (khi có nhân viên)

---

## 🚀 Action items hôm nay

Trước khi em code integration cụ thể, em cần biết stack của SPA hiện tại. Anh có thể check giúp:

1. **Mở**: https://adminhuongdi.sol.vn/login
2. **F12 → Sources tab** → xem cây files
3. Chụp màn hình cho em thấy → em biết là React/Vue/Vanilla và integrate đúng pattern

Hoặc anh cho em biết:
- Framework nào? (React / Vue / vanilla JS / Svelte / ...)
- File source ở VPS path nào? (VD: `/var/www/adminhuongdi/`)
- Auth dùng JWT trong localStorage hay session cookie?

Em sẽ:
1. Đọc source code hiện có
2. Tạo component/module `/leads` follow đúng pattern
3. Push code + integration guide
