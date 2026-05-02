# Voice Khang — 15 scripts để record

Đây là tài sản KHÔNG AI nào sao chép được. Mỗi voice là Khang nói với 1 người cụ thể, vào đúng khoảnh khắc họ cần. Đó là moat thật của SOL.

## Quy tắc record (đọc trước khi quay)

### Thiết bị
- Mic clip-on Lavalier (Boya BY-M1 ~400k, hoặc Rode SmartLav+ ~1.5tr)
- Phòng yên — đóng cửa, tắt máy lạnh, không quạt
- iPhone Voice Memos hoặc app ghi âm chất lượng cao
- Format export: MP3 64-128 kbps, mono

### Tone của Khang
- **KHÔNG đọc kịch bản như TV news** — nói chuyện như với 1 người bạn cụ thể
- Tưởng tượng đang nói với 1 người Khang biết — vợ, em trai, đồng nghiệp đang cai
- Có pause tự nhiên — sau câu cảm xúc, để 1-2 giây
- Có thở — không tránh tiếng thở giữa câu (nó tự nhiên, người 45+ thấy ấm áp hơn)
- Không "kịch tính" quá — Khang là người thật, không phải diễn viên

### Pace
- 150-170 từ/phút (chậm hơn TV nhưng không quá chậm)
- Test: đọc 1 đoạn 30 giây — nếu hết quá 30s → chậm lại

### Khi vấp
- Stop → hít thở → đọc lại từ đầu câu (không phải từ đầu đoạn)
- Khi edit, cắt phần vấp → giữ flow

### Edit
- CapCut hoặc Audacity (free)
- Cut khoảng lặng quá dài (>3s) — giữ pause tự nhiên 1-2s
- Music nền — KHÔNG. Voice solo + breath = chất lượng tốt nhất.
- Normalize volume cuối cùng

### Xuất file
- Filename: `khang-voice-<slug>.mp3` (vd `khang-voice-d3-dem-kho-nhat.mp3`)
- Upload lên Bunny.net (private bucket có signed URL)
- Paste URL vào `/admin/voice` trong dashboard

## Danh sách 15 scripts

### 🌅 Core day-match (6 scripts) — recordable trong 1 buổi sáng
| # | File | Day | Tier | Duration |
|---|---|---|---|---|
| 01 | `01_d1-welcome.md` | Day 1 | FREE+ | 60-75s |
| 02 | `02_d3-dem-kho-nhat.md` | Day 3 | KHOI_DONG+ | 75-90s |
| 03 | `03_d7-tuan-dau.md` | Day 7 | KHOI_DONG+ | 60-80s |
| 04 | `04_d14-dong-tro-tan.md` | Day 14 | DONG_HANH | 75-90s |
| 05 | `05_d21-habit-shift.md` | Day 21 | DONG_HANH | 60-75s |
| 06 | `06_d30-thu-ky-tich.md` | Day 30 | DONG_HANH | 120-180s |

### 🆘 Crisis (2 scripts) — gửi khi user khủng hoảng
| 07 | `07_crisis-muon-bo-cuoc.md` | — | KHOI_DONG+ | 60-75s |
| 08 | `08_crisis-lo-hut-1-dieu.md` | — | KHOI_DONG+ | 45-60s |

### 📅 Extended day-match (4 scripts)
| 09 | `09_d2-sang-dau-tien.md` | Day 2 | KHOI_DONG+ | 45-60s |
| 10 | `10_d5-dinh-da-qua.md` | Day 5 | KHOI_DONG+ | 45-60s |
| 11 | `11_d10-bao-cao.md` | Day 10 | KHOI_DONG+ | 60-90s |
| 12 | `12_d45-maintenance.md` | Day 45 | DONG_HANH | 60-75s |

### 🏆 Milestone (2 scripts) — gửi khi đạt mốc đặc biệt
| 13 | `13_milestone-100k-saved.md` | — | FREE+ | 30-45s |
| 14 | `14_milestone-10-ngay-sach.md` | — | KHOI_DONG+ | 45-60s |

### 📨 Manual (1 script) — Khang chủ động gửi
| 15 | `15_manual-pre-nhau-warning.md` | — | KHOI_DONG+ | 45-60s |

## Roadmap record

**Tuần 1:** Record 6 core day-match (01-06) — quan trọng nhất, paid user nhận liên tục
**Tuần 2:** Record 2 crisis (07-08) — sẽ gửi cho rất nhiều user
**Tuần 3:** Record 4 extended day-match (09-12)
**Tuần 4:** Record 2 milestone + 1 manual (13-15)

Tổng: ~4-6 giờ record + edit cho cả 15 scripts. Có thể chia 3-4 buổi sáng cuối tuần.

## Tag schema cho admin/voice

Khi upload qua `/admin/voice`, dùng tag:
- `welcome` — D1
- `crisis-peak-d3` — D3
- `weekly-milestone` — D7, D14, D21
- `month-letter` — D30
- `crisis-relapse-thinking` — Crisis muốn bỏ cuộc
- `crisis-after-lapse` — Crisis lỡ hút
- `milestone-money` — 100k
- `milestone-streak` — 10 ngày
- `pre-event-nhau` — Manual cảnh báo nhậu

## Thay vì hoàn hảo — record xong cả 15 trước

Cảm giác "voice tệ" ở take đầu là bình thường. Để Khang record CẢ 15 lần đầu (1-2 giờ) — sẽ tự thấy take 14-15 đã tốt hơn take 1-2 nhiều. Sau đó nghe lại, chọn cái nào tệ → re-record. Lặp 2-3 vòng → tất cả OK.

KHÔNG dành 1 buổi cho 1 voice "perfect". Chậm. Nản. Bỏ giữa chừng.
