# Voice 01 — Day 1 Welcome

## Metadata
- **Trigger:** DAY_MATCH, dayMatch=1
- **Min tier:** FREE
- **Duration:** 60-75 giây
- **Tag:** `welcome`
- **Mood:** ấm áp, có hy vọng, không doạ
- **Ngữ cảnh gửi:** User vừa hoàn thành Q-Day checklist + kích hoạt Q-Day. Voice này là "lời chào đầu tiên" của Khang.

## Recording notes

- **Tone:** như nói với 1 người em hoặc đồng nghiệp đang lo
- **Pace:** chậm — đặc biệt 2 câu đầu
- **Pause:** sau "30 năm" (~1.5s), sau "Đêm đó ấm" (~2s), trước câu cuối
- **Cảm xúc:** không "khoe", không "động viên giả" — kể như một sự thật
- **Lưu ý xưng hô:** dùng "bạn" hoặc "em" tuỳ user — voice này dùng "bạn" cho an toàn (universal)

## Script

> Chào bạn. Tôi là Khang.
>
> Hôm nay là ngày đầu tiên bạn không hút.
>
> [pause ~1s]
>
> Tôi biết cảm giác này. 5 năm trước tôi cũng ngồi đúng chỗ bạn đang ngồi. 24 giờ qua, có thể bạn đã đặt cốc cà phê xuống vài lần và tay tự động vươn về cái bao thuốc — không có. Có thể bạn đang nghĩ "không biết mình có làm được không."
>
> [pause ~1.5s]
>
> Để tôi kể bạn một chuyện nhỏ. Đêm đầu tiên cai năm 2020, tôi không ngủ được. Tôi nằm nhìn trần nhà, sờ ngón tay mình thấy ấm hơn mọi khi. 30 năm hút thuốc, mỗi mùa đông tay tôi luôn lạnh ngắt. Đêm đó ấm.
>
> [pause ~2s]
>
> Tôi nghĩ — *cơ thể này nó công nhận mình rồi*. Đó là khoảnh khắc tôi hiểu — cai không phải mình chống lại cơ thể. Cai là mình đứng cùng phía với nó.
>
> [pause ~1s]
>
> Bạn à, hôm nay bạn không cần làm gì hoàn hảo. Chỉ cần không hút. Một ngày thôi.
>
> Mai tôi sẽ ở đây với bạn.
>
> [pause ~1s]
>
> Có gì khó, mở widget, gõ vài câu — tôi đọc.

## Alt version — cho user "lần thử thứ N"

Nếu user là re-quitter (đã có history, deep profile có dấu hiệu thử nhiều lần), có thể record version riêng:

> "Chào bạn. Tôi là Khang.
>
> Tôi không biết đây là lần thử thứ mấy của bạn. Lần thứ 5 của tôi tôi cũng đã từng nghĩ 'thôi, tôi không phải người cai được'. Lần thứ 7 mới được.
>
> Số lần thử không quan trọng. Quan trọng là hôm nay bạn đang ở đây..."

(viết dài tương tự)

## Khi nào upload

Sau khi record xong + edit + export MP3:
1. Upload lên Bunny.net hoặc S3 với signed URL
2. Vào `/admin/voice` → "Thêm voice mới"
3. Title: "Chào ngày đầu — Day 1"
4. Audio URL: paste link từ Bunny
5. Trigger type: DAY_MATCH
6. Day match: 1
7. Min tier: FREE
8. Tag: `welcome`
9. Lưu

## Test trước khi public

- Tạo 1 user test với quitDate = hôm nay
- Verify scheduler tự gửi voice này (hoặc trigger manual nếu chưa có scheduler)
- Nghe lại trong widget chat → check chất lượng audio
- Check transcript hiện đúng nếu user mở "Đọc lời thoại"
