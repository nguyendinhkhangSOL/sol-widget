# Setup Silent Companionship — Pilot 2026-05-08

Pivot Sol triển khai 4 channels mới (Khoảng Lặng, Hỏi Khang, Voice Library, Crisis Timer) + lapse-friendly UX. Voice MP3 dùng placeholder, Khang record sau.

## Bước 1 — Database migration

```bash
cd D:\BOTHUOCLA\sol-widget\backend

# Stop backend nếu đang chạy (tránh lock Prisma client)
# Ctrl+C trên terminal đang npm run dev

# Generate migration cho 7 model mới
npx prisma migrate dev --name silent_companionship_pivot

# Generate Prisma client mới
npx prisma generate
```

## Bước 2 — Tạo audio folder + placeholder MP3

```bash
cd D:\BOTHUOCLA\sol-widget\dashboard\public\audio

# Tạo silent MP3 60s placeholder (cần ffmpeg cài sẵn)
# Windows: choco install ffmpeg, hoặc download từ ffmpeg.org

# 5 voice MVP placeholder
ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 60 -q:a 9 -acodec libmp3lame khang-day-0-welcome.mp3
ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 90 -q:a 9 -acodec libmp3lame khang-lapse-friendly.mp3
ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 90 -q:a 9 -acodec libmp3lame khang-crisis-90s.mp3
ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 180 -q:a 9 -acodec libmp3lame khang-day-7-report.mp3
ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 300 -q:a 9 -acodec libmp3lame khang-day-14-milestone.mp3
```

**Nếu không có ffmpeg**: tải file silent.mp3 bất kỳ → copy 5 lần với 5 tên trên.

Hoặc dùng tools online:
- https://www.online-convert.com/ → tạo silent MP3
- https://www.mp3silencegenerator.com/

## Bước 3 — Seed data (5 voice + 10 confessions)

```bash
cd D:\BOTHUOCLA\sol-widget\backend

# Seed 5 voice Khang
npx tsx src/seed/seedVoices.ts

# Seed 10 confessions (Khoảng Lặng demo)
npx tsx src/seed/seedConfessions.ts
```

## Bước 4 — Build + start

```bash
# Backend
cd D:\BOTHUOCLA\sol-widget\backend
npm run dev

# Dashboard (terminal khác)
cd D:\BOTHUOCLA\sol-widget\dashboard
npm run dev
```

## Bước 5 — Test 4 channels

1. Mở `http://localhost:5173` (dashboard)
2. Login or anonymous
3. Tab **Tổng quan** → see Crisis button + Quick Win + Control Score + Stats
4. Tab **Đọc** (`/doc`) → 10 confessions seed
5. Tab **Nghe Khang** (`/nghe`) → 5 voice (placeholder MP3 silent)
6. Tab **Hỏi Khang** (`/hoi`) → submit câu hỏi anonymous

## Bước 6 — Khang record voice thật

Khi Khang sẵn sàng:

1. Thu 5 voice MP3 thật theo content trong `seedVoices.ts`
2. Replace 5 file trong `dashboard/public/audio/` (giữ nguyên filename)
3. Push prod — backend không cần update DB

## API endpoints mới

| Path | Method | Mô tả |
|---|---|---|
| `/confessions` | GET | List Khoảng Lặng feed |
| `/confessions` | POST | Submit confession anonymous |
| `/confessions/:id/read` | POST | Mark đã đọc |
| `/confessions/:id/react` | POST | React 👍 / 🙏 / "Tôi cũng vậy" |
| `/khang-questions` | POST | Submit câu hỏi Hỏi Khang |
| `/khang-questions/voice-replies` | GET | List voice reply broadcast |
| `/khang-questions/mine` | GET | Câu hỏi của tôi |
| `/voices` | GET | Voice library (filter by topic) |
| `/voices/auto-play/:trigger` | GET | Voice auto-play context |
| `/voices/:id/listen` | POST | Track listen + completion |
| `/voices/:id/react` | POST | React voice |
| `/lapse` | POST | Log lapse (KHÔNG reset streak) |
| `/lapse/:id/recover` | POST | Mark recovered |
| `/lapse/:id/reflect` | POST | Add reflection |
| `/lapse/stats` | GET | Lapse-recovery stats |
| `/crisis-timer/start` | POST | Start 90s timer + voice |
| `/crisis-timer/:id/end` | POST | End timer with outcome |
| `/crisis-timer/stats` | GET | Delay capacity stats |
| `/stats/feed` | GET | Anonymous stats feed |
| `/stats/quick-win-day3` | GET | Báo cáo Day 3 cá nhân |
| `/stats/control-score` | GET | Control Score 3 component |

## Troubleshooting

### Migration error "Cannot rename enum value"
→ Em đã GIỮ tier names cũ (FREE/KHOI_DONG/DONG_HANH/ALUMNI), chỉ update comments. Không có rename → migration smooth.

### Voice 404
→ Check `dashboard/public/audio/` có 5 file MP3 placeholder chưa.

### Anonymous user không có audio access
→ Check `KhangVoice.minTier` = FREE cho 4/5 voice MVP.

### Khoảng Lặng empty
→ Run `npx tsx src/seed/seedConfessions.ts`.

### Stats Feed 0/0
→ Stats compute dựa trên data thật. Cần ít nhất 1 user log để có số.

## Frontend routes mới

| Path | Page | Tier required |
|---|---|---|
| `/doc` | KhoangLang (Khoảng Lặng) | All |
| `/nghe` | NgheKhang (Voice Library) | Tier-aware (filter by minTier) |
| `/hoi` | HoiKhang (Hỏi Khang) | All (submit), tier-aware (voice replies) |
