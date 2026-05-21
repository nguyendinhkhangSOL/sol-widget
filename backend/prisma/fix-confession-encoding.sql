\set ON_ERROR_STOP on

UPDATE "Confession" SET content = 'Hôm nay tôi sạch ngày thứ 30. Vợ ôm tôi tối qua — lần đầu sau 5 năm. Tôi 47 tuổi, hút 30 năm, fail 4 lần. Cảm ơn ai đó đang đọc. Có thể được.' WHERE id = 'cmoxp5d2z0008w65z4xjjbrzl';
UPDATE "Confession" SET content = 'Tôi hút lại sau 11 ngày. Nhưng sáng nay tôi mở Sol lại. Có lẽ thế là đủ rồi.' WHERE id = 'cmoxp5d2a0002w65zijm7us56';
UPDATE "Confession" SET content = 'Q-Day của tôi tuần sau. Đêm nay tôi run. Mở Sol đọc Khoảng Lặng. Đọc bài của anh Day 30 — cảm ơn anh đã viết. Tôi sẽ thử.' WHERE id = 'cmoxp5d4c000kw65zowgh9g3v';
UPDATE "Confession" SET content = 'Tôi 45 tuổi, bị huyết áp cao. Bác sĩ nói nếu hút tiếp thì 5 năm nữa stroke. Tôi vẫn hút thêm 3 năm sau câu nói đó. Hôm nay Day 8 sạch. Đi khám lại tuần sau.' WHERE id = 'cmoxp5d44000iw65z35cdttm0';
UPDATE "Confession" SET content = 'Đám tang chú tôi đêm qua. Toàn người hút. Tôi hút 7 điếu. Sáng nay tôi sợ không dám mở app. Nhưng app push một dòng nhẹ "hôm qua khó". Tôi mở. Khang nói "không phải fail". Tôi khóc.' WHERE id = 'cmoxp5d37000aw65zqtcvpmz3';
UPDATE "Confession" SET content = 'Stress công việc ác liệt tuần này. Ngày nào cũng muốn quay lại. Mở Sol mỗi tối nghe Khang. Không hút điếu nào. Tôi không tin được chính mình.' WHERE id = 'cmoxp5d3x000gw65zgka314ub';
UPDATE "Confession" SET content = 'Tôi 52 tuổi. Bố tôi mất vì ung thư phổi năm tôi 30. Tôi vẫn hút. Hôm nay con gái tôi 18 tuổi sắp đi đại học xa nhà. Tôi muốn cô ấy nhớ tôi không phải mùi thuốc.' WHERE id = 'cmoxp5d3d000cw65z15fs1ccv';
UPDATE "Confession" SET content = 'Đêm qua 23h tôi crave kinh khủng. Mở voice Khang. Đợi 90 giây. Không hút. Sáng nay vẫn còn cảm giác ấy. Lần đầu sau 25 năm tôi quyết được điều gì đó về mình.' WHERE id = 'cmoxp5d2j0004w65zk0zm5ah0';
UPDATE "Confession" SET content = 'Đi nhậu tuần này lần đầu sau Q-Day Day 35. Anh em mời thuốc. Tôi nói "đang cai". Một thằng cười. Tôi không hút. Lần đầu tôi không quan tâm bị cười.' WHERE id = 'cmoxp5d3o000ew65zd26dftxa';
UPDATE "Confession" SET content = 'Vợ tôi không tin tôi nữa. 4 lần fail rồi. Lần này tôi không nói gì với cô ấy. Chỉ mở Sol thôi. Có lẽ ít kỳ vọng mới làm được.' WHERE id = 'cmoxp5d2r0006w65zy4hclue4';
UPDATE "Confession" SET content = 'Nay bắt đầu bỏ thuốc, cũng hơi mệt' WHERE id = 'cmoxqqoyx000s10bmjqqt4lwa';

SELECT id, LEFT(content, 50) FROM "Confession" ORDER BY "createdAt" LIMIT 5;
