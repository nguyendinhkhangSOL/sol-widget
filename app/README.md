# 🌿 Sol Widget — MVP v0.1

> App đồng hành cai thuốc lá cho nam giới Việt 45+
> Built for **31-5-2026** (Ngày Thế giới Không Thuốc lá)

## Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS** (Sol brand)
- **PostgreSQL 16**
- **Resend** (email)
- **PM2** (process manager)
- Deploy: VPS Ubuntu 24.04 + Nginx + Certbot SSL

## Pages

| URL | Mục đích |
|---|---|
| `/` | Landing — Hero + CTA Test FTND |
| `/test-ftnd` | Test FTND 6 câu interactive |
| `/ket-qua/[nhe\|vua\|nang]` | Kết quả personalized + recommendation |
| `/dang-ky` | Form email/phone → Resend welcome |
| `/bang-gia` | 3 lộ trình NHẸ/VỪA/NẶNG + MoMo QR |
| `/khang-sol` | Founder story (E-E-A-T) |

## API

- `POST /api/test-result` — Save FTND test
- `POST /api/register` — Save user lead + send email

## Dev

```bash
npm install
cp .env.example .env.local
# Edit .env.local với DATABASE_URL + RESEND_API_KEY

npm run dev
# → http://localhost:3000
```

## Deploy

Xem [DEPLOY.md](./DEPLOY.md) — chi tiết deploy lên VPS.

## License

UNLICENSED — Proprietary của Đi Cùng Sol.
