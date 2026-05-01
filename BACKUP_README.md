# SOL Backup & Restore

## Khi nào dùng

- Trước khi đổi máy / cài lại Windows
- Trước khi làm thay đổi lớn DB (schema migration risky)
- Định kỳ hàng tuần (best practice)

## Backup — máy hiện tại

### Bước 1: Push code lên Git (nếu chưa)

```bash
cd D:\BOTHUOCLA\sol-widget

# Lần đầu setup
git init
git remote add origin git@github.com:khang/sol-widget.git
git add .
git commit -m "Initial backup before migration"
git push -u origin main

# Lần sau chỉ cần
git add .
git commit -m "Backup snapshot"
git push
```

⚠️ Đảm bảo `.gitignore` có:
```
node_modules/
dist/
.env
*.log
backups/
```

### Bước 2: Chạy backup.bat

```batch
REM Set DB password (nếu chưa)
set PGPASSWORD=your_postgres_password

REM Chạy script
backup.bat
```

Output: `backups\sol_backup_YYYY-MM-DD_HHMM.zip` chứa:
- `sol_db.dump` — Postgres database (custom format)
- `backend.env`, `frontend.env`, `dashboard.env` — secrets
- `CLAUDE_CONTEXT.md` — context cho Claude session mới

### Bước 3: Lưu file zip vào nơi an toàn

- USB
- Google Drive / OneDrive (private folder)
- KHÔNG push lên git (file zip chứa .env với secrets)

---

## Restore — máy mới

### Bước 1: Cài software cơ bản

```
- Node.js 20+        https://nodejs.org
- PostgreSQL 16      https://www.postgresql.org/download/windows/
- Git                https://git-scm.com
- Claude Desktop     (cho session AI)
- VS Code            (recommended)
```

Đảm bảo `pg_dump`, `pg_restore`, `psql` có trong PATH:
```bash
pg_dump --version
```

### Bước 2: Clone repo

```bash
git clone git@github.com:khang/sol-widget.git
cd sol-widget
```

### Bước 3: Tạo DB rỗng

```bash
set PGPASSWORD=your_postgres_password
createdb -U postgres sol
```

### Bước 4: Copy file zip backup vào folder sol-widget rồi restore

```bash
restore.bat sol_backup_2026-05-01_2305.zip
```

### Bước 5: Install deps + chạy

```bash
cd backend
npm install
npx prisma generate
npm run dev

REM Tab terminal mới
cd ..\frontend
npm install
npm run dev

REM Tab thứ 3
cd ..\dashboard
npm install
npm run dev
```

### Bước 6: Resume Claude session

1. Mở Claude Desktop → tạo session mới với cùng folder workspace `D:\BOTHUOCLA\sol-widget`
2. Paste vào Claude:
   > *"Đọc CLAUDE_CONTEXT.md trong repo, em là Claude tiếp nối session cũ. Tiếp tục từ chỗ Khang dừng."*
3. Claude đọc file → pickup full context → tiếp tục code

---

## Troubleshooting

### `pg_dump: command not found`
PostgreSQL không có trong PATH. Thêm thủ công:
```
C:\Program Files\PostgreSQL\16\bin
```

### `error: could not connect to server`
Postgres service chưa chạy. Mở Services.msc → tìm `postgresql-x64-16` → Start.

### `permission denied for database sol`
User `postgres` không có quyền hoặc password sai. Reset:
```bash
psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'newpass';"
set PGPASSWORD=newpass
```

### Restore xong DB nhưng app báo lỗi `field X does not exist`
Migration chưa apply hết. Chạy:
```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

### Widget không hiện trong dashboard sau restore
Widget chưa build. Chạy:
```bash
cd frontend
npm run build:embed:dashboard
```

---

## Backup định kỳ tự động (optional)

Khang có thể setup **Task Scheduler Windows** chạy `backup.bat` mỗi tuần:

1. Mở Task Scheduler (Win+R → `taskschd.msc`)
2. Create Basic Task → "SOL Weekly Backup"
3. Trigger: Weekly, ngày Chủ nhật 23:00
4. Action: Start a program → `D:\BOTHUOCLA\sol-widget\backup.bat`
5. Settings → "Run whether user is logged on or not"

⚠️ Set `PGPASSWORD` trong **System environment variables** để task scheduler có thể đọc.

---

*Tạo bởi Claude end of session 2026-05-01 — phục vụ migration sang máy khác.*
