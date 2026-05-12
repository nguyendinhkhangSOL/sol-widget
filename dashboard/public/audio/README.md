# Sol Voice Library — Audio Files

Folder này chứa file MP3 voice của Khang. Pilot dùng placeholder, Khang record thật sau.

## Placeholder (giả lập, không có audio thật)

Để test UI flow, em đã liệt kê 5 voice MVP. File MP3 placeholder = silent 60s MP3 hoặc Khang có thể dùng:

1. Generate silent MP3 60s từ ffmpeg: `ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 60 -q:a 9 -acodec libmp3lame placeholder-60s.mp3`
2. Hoặc dùng TTS tiếng Việt tạm: https://www.naturalreaders.com/online/

## 5 voice MVP

| File | Title | Duration | Trigger | Tier |
|---|---|---|---|---|
| `khang-day-0-welcome.mp3` | Anh không yếu — đây là não 25 năm | 60s | onboard | FREE |
| `khang-lapse-friendly.mp3` | Một điếu không phải thất bại | 90s | lapse | FREE |
| `khang-crisis-90s.mp3` | Anh đợi tôi 90 giây | 90s | crisis_90s | KHOI_DONG |
| `khang-day-7-report.mp3` | Anh đã thấy mình rồi | 3 phút | (manual) | FREE |
| `khang-day-14-milestone.mp3` | 14 ngày — anh đã giảm | 5 phút | (manual) | KHOI_DONG |

## Path khi serve

Static từ `/audio/` (Vite dev) hoặc `https://bothuocla.sol.vn/audio/` (prod).

Schema `KhangVoice.audioUrl` lưu path này.

## Khang record voice thật

Khi Khang record voice MP3 thật:

1. Replace file MP3 cùng tên trong folder này
2. Backend sync — không cần update DB nếu giữ filename
3. Push tới prod

Quality:
- Bitrate 128 kbps (đủ cho voice)
- Format MP3 (compatibility cao nhất)
- Mono OK (không cần stereo)
- Background yên tĩnh, không cần studio
- Khang nói thật, KHÔNG đọc script — có pause, có "ờm", có thở
