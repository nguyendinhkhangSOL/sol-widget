-- Fix UTF-8 cho KhangVoice (5 voice MVP)
-- Match qua audioUrl LIKE filename (audioUrl không bị strip UTF-8)
\set ON_ERROR_STOP on

UPDATE "KhangVoice" SET
  title = 'Anh không yếu — đây là não 25 năm',
  description = 'Khang welcome anh em mới vào Sol. 60 giây đầu — Khang nói: "Anh không yếu. Não anh đã wire 30 năm với điếu thuốc. Đây là cơ chế, không phải nhân cách."',
  "internalNotes" = 'Seed MVP — placeholder audio. Khang record thật sau.'
WHERE "audioUrl" LIKE '%khang-day-0-welcome.mp3';

UPDATE "KhangVoice" SET
  title = 'Một điếu không phải thất bại',
  description = 'Voice quan trọng nhất khi anh hút lại. Khang nói: "Một điếu không phải fail. Anh ổn. Tôi vẫn ở đây. Mai sáng mở app lại nhé."',
  "internalNotes" = 'Seed MVP — placeholder audio. Khang record thật sau.'
WHERE "audioUrl" LIKE '%khang-lapse-friendly.mp3';

UPDATE "KhangVoice" SET
  title = 'Anh đợi tôi 90 giây',
  description = 'Khi anh đang thèm — bấm Đợi 90 giây. Khang ngồi cùng anh 90 giây. "Anh không cần bỏ. Chỉ đợi 90 giây."',
  "internalNotes" = 'Seed MVP — placeholder audio. Khang record thật sau.'
WHERE "audioUrl" LIKE '%khang-crisis-90s.mp3';

UPDATE "KhangVoice" SET
  title = 'Anh đã thấy mình rồi',
  description = 'Voice Ngày 7 sau khi báo cáo Khám Phá. Khang nói: "Anh đã thấy mình rồi. Tao thấy. 7 ngày anh đã làm điều mà 30 năm anh chưa làm."',
  "internalNotes" = 'Seed MVP — placeholder audio. Khang record thật sau.'
WHERE "audioUrl" LIKE '%khang-day-7-report.mp3';

UPDATE "KhangVoice" SET
  title = '14 ngày — anh đã giảm',
  description = 'Voice Ngày 14 mốc Sol Bứt Phá. Khang celebrate kết quả thực + nhắc anh không ép.',
  "internalNotes" = 'Seed MVP — placeholder audio. Khang record thật sau.'
WHERE "audioUrl" LIKE '%khang-day-14-milestone.mp3';

-- Verify
SELECT title, LEFT(description, 50) AS desc_preview FROM "KhangVoice" ORDER BY "createdAt" LIMIT 5;
