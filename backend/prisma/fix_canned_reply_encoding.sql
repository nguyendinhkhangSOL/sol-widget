-- ═══════════════════════════════════════════════════════════════════════
-- Sol — Fix UTF-8 encoding cho CannedReply (12-05-2026)
-- ═══════════════════════════════════════════════════════════════════════
-- DB volume từ máy cũ có 40+ CannedReply với label tiếng Việt bị strip
-- UTF-8 ("Tôi đang thèm" → "T??i ??ang th??m"). Source seed UTF-8 đúng.
--
-- Script này UPDATE tất cả 43 records về encoding đúng.
-- Idempotent — chạy nhiều lần OK.
--
-- CHẠY (từ PowerShell):
--   Get-Content C:\BOTHUOCLA\sol-widget\backend\prisma\fix_canned_reply_encoding.sql | docker exec -i sol-widget-db-1 psql -U sol sol
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

UPDATE "CannedReply" SET label = 'Tôi đang thèm thuốc',          icon = '🤔' WHERE slug = 'them-thuoc';
UPDATE "CannedReply" SET label = 'Tôi muốn bỏ cuộc',             icon = '😢' WHERE slug = 'bo-cuoc';
UPDATE "CannedReply" SET label = 'Hút lén 1 điếu có sao?',       icon = '🚬' WHERE slug = 'mot-dieu';
UPDATE "CannedReply" SET label = 'Bao lâu thì hết thèm?',        icon = '⏳' WHERE slug = 'bao-lau-het-them';
UPDATE "CannedReply" SET label = 'Mất ngủ phải làm sao?',        icon = '🌙' WHERE slug = 'mat-ngu';
UPDATE "CannedReply" SET label = 'Tôi hay cáu gắt — bình thường?', icon = '😤' WHERE slug = 'cau-gat';
UPDATE "CannedReply" SET label = 'Tôi sợ tăng cân',              icon = '⚖️' WHERE slug = 'tang-can';
UPDATE "CannedReply" SET label = 'Chuyển vape có an toàn?',      icon = '💨' WHERE slug = 'vape-an-toan';
UPDATE "CannedReply" SET label = 'Cơn thèm dữ dội quá',          icon = '🌊' WHERE slug = 'them-du-doi';
UPDATE "CannedReply" SET label = 'Tôi sắp hút lại — cứu',        icon = '🆘' WHERE slug = 'sap-hut-lai';
UPDATE "CannedReply" SET label = 'Tôi lỡ hút điếu rồi',          icon = '🌱' WHERE slug = 'lo-hut-roi';
UPDATE "CannedReply" SET label = 'Tôi ho có đờm nhiều',          icon = '🫁' WHERE slug = 'ho-co-dom';
UPDATE "CannedReply" SET label = 'Đau đầu sau khi cai',          icon = '🤕' WHERE slug = 'dau-dau';
UPDATE "CannedReply" SET label = 'Chóng mặt khi đứng dậy',       icon = '💫' WHERE slug = 'chong-mat';
UPDATE "CannedReply" SET label = 'Tôi thấy hơi khó thở',         icon = '😮‍💨' WHERE slug = 'kho-tho';
UPDATE "CannedReply" SET label = 'Tôi bị táo bón',               icon = '🌾' WHERE slug = 'tao-bon';
UPDATE "CannedReply" SET label = 'Miệng lở loét, khô đắng',      icon = '👄' WHERE slug = 'mieng-lo-loet';
UPDATE "CannedReply" SET label = 'Tôi thấy buồn vô cớ',          icon = '🌧️' WHERE slug = 'buon-chan';
UPDATE "CannedReply" SET label = 'Tôi cảm thấy cô đơn',          icon = '🌫️' WHERE slug = 'co-don';
UPDATE "CannedReply" SET label = 'Lo âu vô cớ, ngực tức',        icon = '😰' WHERE slug = 'lo-au';
UPDATE "CannedReply" SET label = 'Stress công việc — muốn hút',  icon = '💼' WHERE slug = 'stress-cong-viec';
UPDATE "CannedReply" SET label = 'Tôi không thấy là chính mình', icon = '🪞' WHERE slug = 'khong-la-minh';
UPDATE "CannedReply" SET label = 'Chiều nay đi nhậu — sao đây?', icon = '🍻' WHERE slug = 'di-nhau';
UPDATE "CannedReply" SET label = 'Cà phê sáng không có thuốc',   icon = '☕' WHERE slug = 'ca-phe-sang';
UPDATE "CannedReply" SET label = 'Bạn mời thuốc lúc nhậu',       icon = '🚭' WHERE slug = 'ban-moi-thuoc';
UPDATE "CannedReply" SET label = 'Vợ/chồng giận chuyện cai',     icon = '💔' WHERE slug = 'vo-chong-gian';
UPDATE "CannedReply" SET label = 'Sắp đi đám (cưới/tang)',       icon = '🌸' WHERE slug = 'dam-tang-cuoi';
UPDATE "CannedReply" SET label = 'Tết / lễ — ai cũng hút',       icon = '🎊' WHERE slug = 'tet-le';
UPDATE "CannedReply" SET label = 'Phổi tôi có hồi phục không?',  icon = '🫁' WHERE slug = 'phoi-hoi-phuc';
UPDATE "CannedReply" SET label = 'Tim mạch — bao lâu hồi phục?', icon = '❤️' WHERE slug = 'tim-mach';
UPDATE "CannedReply" SET label = 'Champix có nên dùng?',         icon = '💊' WHERE slug = 'champix';
UPDATE "CannedReply" SET label = 'Miếng dán nicotine có hiệu quả?', icon = '🩹' WHERE slug = 'mieng-dan-nicotine';
UPDATE "CannedReply" SET label = 'Khang đã từng thế này chưa?',  icon = '👴' WHERE slug = 'khang-tung-cam-thay';
UPDATE "CannedReply" SET label = 'Tôi sẽ thành công chứ?',       icon = '🌟' WHERE slug = 'thanh-cong-toi';
UPDATE "CannedReply" SET label = 'Tôi đáng hi sinh nhiều thế không?', icon = '🎯' WHERE slug = 'dang-hi-sinh';
UPDATE "CannedReply" SET label = 'Cách dùng SOL hiệu quả',       icon = '📱' WHERE slug = 'cach-dung-app';
UPDATE "CannedReply" SET label = 'Tôi muốn đổi Ngày bỏ',         icon = '📅' WHERE slug = 'doi-q-day';
UPDATE "CannedReply" SET label = 'Hoàn tiền thế nào?',           icon = '💰' WHERE slug = 'hoan-tien';
UPDATE "CannedReply" SET label = 'Liên hệ Khang trực tiếp',      icon = '✉️' WHERE slug = 'lien-he-khang';
UPDATE "CannedReply" SET label = 'Khi nào có voice Khang?',      icon = '🎙️' WHERE slug = 'voice-khang';
UPDATE "CannedReply" SET label = 'Tôi khạc đờm có máu',          icon = '🚨' WHERE slug = 'khac-mau';
UPDATE "CannedReply" SET label = 'Đau ngực dữ dội + khó thở',    icon = '🚑' WHERE slug = 'dau-nguc-du';
UPDATE "CannedReply" SET label = 'Tôi có ý nghĩ tự hại',         icon = '💚' WHERE slug = 'y-nghi-tu-hai';

-- Sweep User.pronouns: nếu byte length không khớp UTF-8 đúng → reset về 'anh'
-- (Default Sol v3 cho target user nam 30+)
UPDATE "User"
SET pronouns = 'anh'
WHERE pronouns IS NOT NULL
  AND (
    octet_length(pronouns) != char_length(pronouns) * 1
      AND octet_length(pronouns) NOT IN (3, 5, 4)  -- 'anh'=3, 'bạn'=5, 'chị'=4
  );

-- Verification: count CannedReply có nhiều `?` (sót nếu có)
DO $$
DECLARE
  bad_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO bad_count
  FROM "CannedReply"
  WHERE label ~ '\?\?+';
  IF bad_count > 0 THEN
    RAISE NOTICE 'Cảnh báo: còn % CannedReply có nhiều dấu hỏi (slug có thể không khớp)', bad_count;
  ELSE
    RAISE NOTICE 'OK: tất cả CannedReply đã đúng encoding';
  END IF;
END $$;

COMMIT;
