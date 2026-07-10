# Sol User Management V1

## Cấu trúc thư mục

```
user-management-v1/
├── README.md                          ← file này
├── backend/                           ← Node.js API mở rộng
│   ├── db/
│   │   ├── schema.sql                 ← SQLite schema
│   │   └── seed.sql                   ← Test data (optional)
│   ├── routes/
│   │   ├── leads.js                   ← POST /api/leads (public)
│   │   ├── admin-leads.js             ← GET/POST /api/admin/leads/* (auth)
│   │   └── activate.js                ← GET /api/activate (public, magic link)
│   ├── services/
│   │   ├── notification.js            ← Zalo + Email khi có payment mới
│   │   └── magic-token.js             ← Generate + verify token
│   ├── migrate.js                     ← Chạy 1 lần để tạo bảng
│   └── register-routes.js             ← Instructions gắn vào server.js hiện có
├── admin-spa/                         ← Extension cho adminhuongdi.sol.vn
│   └── leads-page.html                ← Page mới cho admin
├── frontend/                          ← Pages public trên sol.vn
│   ├── kich-hoat.html                 ← Magic link activation page
│   └── thanh-toan-integration.md      ← Guide sửa /thanh-toan/ để POST API
└── deploy/
    ├── SSH-DEPLOY-STEPS.md            ← Từng bước SSH deploy
    └── test-payment-flow.md           ← Test end-to-end
```

## Kiến trúc

- **DB**: SQLite tại `/var/www/huongdi/db/leads.db`
- **API**: Extension cho backend Node.js hiện có tại `/var/www/huongdi/backend/`
- **Admin panel**: Menu mới "💰 Leads" trong adminhuongdi.sol.vn SPA
- **Notification cho Khang**: Email immediate (+ SMS optional). Không dùng Telegram.
- **Send magic link tới User**: Email tự động (nếu user có email) + Zalo cá nhân Khang gửi thủ công qua admin panel (deep-link + tin nhắn có sẵn)
- **Zalo OA sẽ dùng ở Phase 2** khi doanh số > 20 user/tháng
- **Magic link**: sol.vn/kich-hoat/?token=xxx → set localStorage → redirect

## User states

```
1. PENDING     → User submit form, chưa chuyển khoản
2. PAID        → Khang confirm đã nhận tiền (approve manual)
3. ACTIVATED   → User đã click magic link, tier=active hoạt động
4. EXPIRED     → Hết 365 ngày, cần renew
5. CANCELLED   → Từ chối/spam
```

## Workflow

1. User điền form tại sol.vn/thanh-toan/
2. Frontend POST → `huongdi.sol.vn/api/leads`
3. API lưu SQLite + gửi Email + Telegram notification
4. Khang mở app Techcombank, match SDT vs chuyển khoản
5. Khang mở adminhuongdi.sol.vn/leads → click "Approve" 
6. API generate magic_token → SMS/Zalo cho user link `sol.vn/kich-hoat/?token=xxx`
7. User click link → localStorage set → redirect huongdi.sol.vn
8. User giờ đã Active — unlock 37 mô hình

## MVP scope (v1)

- ✅ POST /leads
- ✅ Admin approve/reject
- ✅ Magic link activate
- ✅ Email notification auto tới Khang khi có lead
- ✅ Admin panel có deep-link Zalo + tin nhắn mẫu để Khang gửi Zalo cá nhân
- ✅ Auto-send email magic link tới user (nếu có email)
- ⏳ SMS notification real-time cho Khang (optional — Speedsms.vn 400đ/SMS)
- ⏳ Zalo OA (Phase 2, khi doanh số > 20/tháng)
- ⏳ Auto-match Techcombank transaction (Phase 3)
- ⏳ Renewal reminder 30 ngày trước expiry (Phase 2)
