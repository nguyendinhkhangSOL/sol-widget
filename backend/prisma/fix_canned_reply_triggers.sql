-- Sol — Fix UTF-8 encoding cho field `triggers` của CannedReply
-- Thay đổi tất cả triggers về list cụm từ tiếng Việt đúng (lowercase, có dấu).
-- Matcher frontend tự normalize (bỏ dấu) khi compare với user input.

BEGIN;

-- Reset toàn bộ triggers về danh sách đúng từ source
UPDATE "CannedReply" SET triggers = ARRAY['thèm thuốc', 'đang thèm', 'muốn hút', 'thèm hút', 'cần điếu'] WHERE slug = 'them-thuoc';
UPDATE "CannedReply" SET triggers = ARRAY['bỏ cuộc', 'không nổi', 'thua rồi', 'chán quá', 'muốn dừng'] WHERE slug = 'bo-cuoc';
UPDATE "CannedReply" SET triggers = ARRAY['một điếu', 'hút lén', 'thử 1', 'lén hút', '1 điếu thôi'] WHERE slug = 'mot-dieu';
UPDATE "CannedReply" SET triggers = ARRAY['bao lâu', 'khi nào hết', 'thèm tới khi nào', 'mấy ngày'] WHERE slug = 'bao-lau-het-them';
UPDATE "CannedReply" SET triggers = ARRAY['mất ngủ', 'không ngủ được', 'khó ngủ', 'thức đêm'] WHERE slug = 'mat-ngu';
UPDATE "CannedReply" SET triggers = ARRAY['cáu gắt', 'bực bội', 'nóng tính', 'dễ cáu', 'khó chịu'] WHERE slug = 'cau-gat';
UPDATE "CannedReply" SET triggers = ARRAY['tăng cân', 'béo lên', 'mập', 'sợ béo'] WHERE slug = 'tang-can';
UPDATE "CannedReply" SET triggers = ARRAY['vape', 'thuốc điện tử', 'pod', 'chuyển vape'] WHERE slug = 'vape-an-toan';
UPDATE "CannedReply" SET triggers = ARRAY['thèm dữ dội', 'thèm quá', 'cơn thèm', 'thèm khủng khiếp', 'không chịu nổi'] WHERE slug = 'them-du-doi';
UPDATE "CannedReply" SET triggers = ARRAY['sắp hút', 'cứu tôi', 'sos', 'sắp lỡ', 'không kiềm được'] WHERE slug = 'sap-hut-lai';
UPDATE "CannedReply" SET triggers = ARRAY['lỡ hút', 'đã hút', 'hút rồi', 'tái phát', 'failed'] WHERE slug = 'lo-hut-roi';
UPDATE "CannedReply" SET triggers = ARRAY['ho có đờm', 'ho ra đờm', 'đờm nhiều', 'khạc đờm'] WHERE slug = 'ho-co-dom';
UPDATE "CannedReply" SET triggers = ARRAY['đau đầu', 'nhức đầu', 'đau nửa đầu'] WHERE slug = 'dau-dau';
UPDATE "CannedReply" SET triggers = ARRAY['chóng mặt', 'hoa mắt', 'đứng dậy chóng mặt'] WHERE slug = 'chong-mat';
UPDATE "CannedReply" SET triggers = ARRAY['khó thở', 'tức ngực', 'thở khó', 'hụt hơi'] WHERE slug = 'kho-tho';
UPDATE "CannedReply" SET triggers = ARRAY['táo bón', 'đi cầu khó', 'bón'] WHERE slug = 'tao-bon';
UPDATE "CannedReply" SET triggers = ARRAY['miệng lở', 'lở loét', 'khô miệng', 'đắng miệng'] WHERE slug = 'mieng-lo-loet';
UPDATE "CannedReply" SET triggers = ARRAY['buồn vô cớ', 'buồn không lý do', 'tủi thân', 'chán nản'] WHERE slug = 'buon-chan';
UPDATE "CannedReply" SET triggers = ARRAY['cô đơn', 'một mình', 'không ai hiểu', 'lẻ loi'] WHERE slug = 'co-don';
UPDATE "CannedReply" SET triggers = ARRAY['lo âu', 'hồi hộp', 'lo lắng vô cớ', 'tức ngực'] WHERE slug = 'lo-au';
UPDATE "CannedReply" SET triggers = ARRAY['stress', 'áp lực công việc', 'căng thẳng', 'mệt mỏi công việc'] WHERE slug = 'stress-cong-viec';
UPDATE "CannedReply" SET triggers = ARRAY['không là mình', 'lạ lạ', 'không phải tôi', 'mất bản thân'] WHERE slug = 'khong-la-minh';
UPDATE "CannedReply" SET triggers = ARRAY['đi nhậu', 'nhậu', 'rượu bia', 'tiệc tùng'] WHERE slug = 'di-nhau';
UPDATE "CannedReply" SET triggers = ARRAY['cà phê sáng', 'sáng cà phê', 'cafe sáng'] WHERE slug = 'ca-phe-sang';
UPDATE "CannedReply" SET triggers = ARRAY['bạn mời', 'rủ hút', 'đưa thuốc', 'mời điếu'] WHERE slug = 'ban-moi-thuoc';
UPDATE "CannedReply" SET triggers = ARRAY['vợ giận', 'chồng giận', 'gia đình giận', 'cãi nhau'] WHERE slug = 'vo-chong-gian';
UPDATE "CannedReply" SET triggers = ARRAY['đám cưới', 'đám tang', 'tiệc cưới', 'đám hỏi'] WHERE slug = 'dam-tang-cuoi';
UPDATE "CannedReply" SET triggers = ARRAY['tết', 'lễ', 'năm mới', 'hội', 'mọi người hút'] WHERE slug = 'tet-le';
UPDATE "CannedReply" SET triggers = ARRAY['phổi', 'phổi có hồi phục', 'phổi lành', 'phổi tốt'] WHERE slug = 'phoi-hoi-phuc';
UPDATE "CannedReply" SET triggers = ARRAY['tim mạch', 'tim', 'huyết áp', 'mạch máu'] WHERE slug = 'tim-mach';
UPDATE "CannedReply" SET triggers = ARRAY['champix', 'varenicline', 'thuốc cai'] WHERE slug = 'champix';
UPDATE "CannedReply" SET triggers = ARRAY['miếng dán', 'nicotine patch', 'patch', 'nrt'] WHERE slug = 'mieng-dan-nicotine';
UPDATE "CannedReply" SET triggers = ARRAY['khang từng', 'khang đã', 'anh khang', 'founder'] WHERE slug = 'khang-tung-cam-thay';
UPDATE "CannedReply" SET triggers = ARRAY['thành công', 'làm được không', 'có thành công', 'có cai được'] WHERE slug = 'thanh-cong-toi';
UPDATE "CannedReply" SET triggers = ARRAY['đáng hi sinh', 'có đáng', 'hi sinh', 'đáng không'] WHERE slug = 'dang-hi-sinh';
UPDATE "CannedReply" SET triggers = ARRAY['cách dùng', 'app hoạt động', 'làm sao dùng', 'hướng dẫn'] WHERE slug = 'cach-dung-app';
UPDATE "CannedReply" SET triggers = ARRAY['đổi q-day', 'đổi ngày', 'thay ngày bỏ', 'lùi ngày'] WHERE slug = 'doi-q-day';
UPDATE "CannedReply" SET triggers = ARRAY['hoàn tiền', 'refund', 'trả lại tiền', 'bỏ cuộc hoàn'] WHERE slug = 'hoan-tien';
UPDATE "CannedReply" SET triggers = ARRAY['liên hệ khang', 'gặp khang', 'nói với khang', 'khang trực tiếp'] WHERE slug = 'lien-he-khang';
UPDATE "CannedReply" SET triggers = ARRAY['voice khang', 'tiếng nói khang', 'audio khang'] WHERE slug = 'voice-khang';
UPDATE "CannedReply" SET triggers = ARRAY['khạc máu', 'ho ra máu', 'đờm có máu', 'máu trong đờm'] WHERE slug = 'khac-mau';
UPDATE "CannedReply" SET triggers = ARRAY['đau ngực dữ', 'đau tim', 'cấp cứu ngực', 'không thở được'] WHERE slug = 'dau-nguc-du';
UPDATE "CannedReply" SET triggers = ARRAY['tự hại', 'tự tử', 'không muốn sống', 'kết thúc'] WHERE slug = 'y-nghi-tu-hai';

-- Verify số record có triggers
DO $$
DECLARE
  total INTEGER;
  with_triggers INTEGER;
BEGIN
  SELECT COUNT(*) INTO total FROM "CannedReply";
  SELECT COUNT(*) INTO with_triggers FROM "CannedReply" WHERE array_length(triggers, 1) > 0;
  RAISE NOTICE 'Total CannedReply: %', total;
  RAISE NOTICE 'Có triggers: %', with_triggers;
END $$;

COMMIT;
