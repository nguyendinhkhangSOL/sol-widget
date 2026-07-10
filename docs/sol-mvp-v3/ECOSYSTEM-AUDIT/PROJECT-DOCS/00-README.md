# Sol Ecosystem — Documentation

**Version:** 1.0
**Last updated:** 2026-07-07
**Owner:** Khang Sol (nguyendinhkhang@gmail.com)

Sol La Bàn — Hệ sinh thái tái khởi nghiệp cho người Việt 40-60.

## Docs index

Đọc theo thứ tự khi onboarding lần đầu:

| # | File | Nội dung | Đọc khi |
|---|------|----------|---------|
| 01 | `OVERVIEW.md` | Business model, 3 trụ, user personas, pricing | Onboarding member mới |
| 02 | `ARCHITECTURE.md` | Kiến trúc kỹ thuật: 3 domains, tech stack, data flow | Trước khi code |
| 03 | `DESIGN-DECISIONS.md` | ADR log — các quyết định kiến trúc + design | Trước khi ship feature mới |
| 04 | `CANONICAL-VERSIONS.md` | Version registry: file nào là truth, ở đâu | Trước khi vá bug |
| 05 | `WORKFLOW.md` | Dev workflow: Laptop → GitHub → Deploy | Hàng ngày |
| 06 | `DEPLOY.md` | Deploy commands cho VPS + cPanel | Khi push production |
| 07 | `RUNBOOK.md` | Emergency: site down, restore DB, rollback | Khi có sự cố |

## Rules không được vi phạm

1. **GitHub = Single Source of Truth.** Mọi edit qua git commit → push → pull. Cấm SSH VPS edit trực tiếp.
2. **Không commit `.env` hay secrets.** `.gitignore` phải chặn.
3. **Test local trước khi push.** Static HTML → open browser. Node.js → `npm run dev`.
4. **Backup trước migration DB.** `pg_dump` trước `prisma migrate deploy`.
5. **Commit message rõ ràng.** Format `<type>: <description>` (feat/fix/chore/docs/refactor).

## Repo structure

```
sol-ecosystem/
├── huongdi-public/     Static assets huongdi.sol.vn (VPS Node.js)
├── huongdi-backend/    Node.js API + Prisma
├── solvn-wp/           WordPress custom code sol.vn (cPanel shared host)
├── admin/              Admin panel adminhuongdi.sol.vn
├── content/            37 mô hình + 40 prompts + case studies
├── scripts/            Deploy + backup scripts
├── docs/               Documentation (this folder)
└── .gitignore
```

## Domains

| Domain | Environment | Stack | Status |
|--------|-------------|-------|--------|
| `huongdi.sol.vn` | VPS (Ubuntu 22) | Node.js + Postgres + Nginx | Active dev |
| `sol.vn` | cPanel shared host | WordPress + PHP | Active dev |
| `adminhuongdi.sol.vn` | VPS (subdomain) | React SPA | Active dev |
| `admin.sol.vn` | cPanel shared host | WordPress admin | ⚠️ Stable — DO NOT TOUCH |
| `bothuocla.sol.vn` | cPanel shared host | Legacy | ⚠️ Stable — DO NOT TOUCH |

## Contact

- **Owner:** Khang Sol
- **Email:** nguyendinhkhang@gmail.com
- **GitHub:** github.com/nguyendinhkhangSOL/sol-ecosystem (Private)
- **Company:** CTY CP VINET (MST 0104127836)
