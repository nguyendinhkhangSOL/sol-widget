-- ═══════════════════════════════════════════════════════════════════════
-- Sol v3 — Seed 12 ZNS templates vào ZaloTemplate
-- ═══════════════════════════════════════════════════════════════════════
-- Tất cả template đã re-write trung tính (pass Zalo review)
-- Idempotent: dùng ON CONFLICT — chạy nhiều lần OK.

INSERT INTO "ZaloTemplate" (id, code, "zaloManagerName", tag, title, body, "ctaButtons", params, "charCount", status, "updatedAt")
VALUES
  -- 1. Welcome Day 1
  ('zalo_tpl_welcome', 'SOL_WELCOME', 'Sol — Chào mừng Day 1',
   '2',
   'Chào {name} — anh đã tham gia chương trình Sol!',
   E'7 ngày đầu là chặng Nhận Diện — anh chỉ cần quan sát.\nCoach cá nhân hoá đã sẵn sàng đồng hành.\n\n— Khang Sol',
   '[{"label":"Nghe voice chào mừng","type":"OPEN_URL","value":"https://bothuocla.sol.vn/voice/welcome"},{"label":"Mở Sol","type":"OPEN_URL","value":"https://bothuocla.sol.vn"}]',
   ARRAY['name'], 211, 'DRAFT', NOW()),

  -- 2. Voice Release (Day 3/7/14/30/51)
  ('zalo_tpl_voice', 'SOL_VOICE_RELEASE', 'Sol — Voice Khang cột mốc',
   '2',
   'Cột mốc Ngày {day} của {name}!',
   E'Khang vừa gửi anh 1 voice riêng cho hôm nay — {voice_title}.\n\n2 phút thôi. Anh nghe khi tiện.',
   '[{"label":"Nghe Khang","type":"OPEN_URL","value":"https://bothuocla.sol.vn/voice"},{"label":"Mở Sol","type":"OPEN_URL","value":"https://bothuocla.sol.vn"}]',
   ARRAY['day','name','voice_title'], 162, 'DRAFT', NOW()),

  -- 3. Q-Day T-2 (Day 20)
  ('zalo_tpl_tminus2', 'SOL_Q_DAY_T_MINUS_2', 'Sol — Còn 2 ngày cột mốc',
   '2',
   'Còn 2 ngày tới cột mốc cam kết của {name}.',
   E'Tối nay anh ngồi yên 10 phút — viết 3 lý do anh đã ghi tuần đầu.\nSol sẽ đồng hành chặng tiếp theo.',
   '[{"label":"Mở Sổ Hành Trình","type":"OPEN_URL","value":"https://bothuocla.sol.vn/workbook"},{"label":"Gọi Khang","type":"MAKE_PHONE_CALL","value":"+84912727381"}]',
   ARRAY['name'], 195, 'DRAFT', NOW()),

  -- 4. Q-Day T-1 (Day 21 tối)
  ('zalo_tpl_tminus1', 'SOL_Q_DAY_T_MINUS_1', 'Sol — Đêm trước cột mốc',
   '2',
   'Đêm nay là đêm cuối chặng Kiểm Soát của {name}.',
   E'Mình là Khang. Mai anh chỉ cần xác nhận — Sol đã đo nhịp.\nNgủ sớm. Mai 7h Sol gọi anh.',
   '[{"label":"Đọc lại lý do","type":"OPEN_URL","value":"https://bothuocla.sol.vn/workbook"},{"label":"Voice Khang","type":"OPEN_URL","value":"https://bothuocla.sol.vn/voice/day-21"}]',
   ARRAY['name'], 197, 'DRAFT', NOW()),

  -- 5. Q-Day Morning (Day 22)
  ('zalo_tpl_qday', 'SOL_Q_DAY_MORNING', 'Sol — Sáng cột mốc 22',
   '2',
   'Hôm nay là cột mốc Ngày 22 của {name}!',
   E'Bắt đầu chặng 30 ngày tiếp theo. Anh đã chuẩn bị 3 tuần.\nSol đã sẵn sàng. Khang ở đó.',
   '[{"label":"Mở Sol — Cam kết","type":"OPEN_URL","value":"https://bothuocla.sol.vn/q-day"},{"label":"Gọi Khang","type":"MAKE_PHONE_CALL","value":"+84912727381"}]',
   ARRAY['name'], 178, 'DRAFT', NOW()),

  -- 6. Graduation (Day 52)
  ('zalo_tpl_grad', 'SOL_GRADUATION', 'Sol — Lễ Tốt Nghiệp Day 52',
   '2',
   '{name} đã đi qua 52 ngày!',
   E'Hôm nay là Lễ Tốt Nghiệp. Anh tiết kiệm {total_saved}đ.\nKhang gửi anh thư cuối + album hành trình.',
   '[{"label":"Mở Album","type":"OPEN_URL","value":"https://bothuocla.sol.vn/album"},{"label":"Trở thành Đại Sứ","type":"OPEN_URL","value":"https://bothuocla.sol.vn/alumni"}]',
   ARRAY['name','total_saved'], 180, 'DRAFT', NOW()),

  -- 7. Daily Check-in
  ('zalo_tpl_checkin', 'SOL_DAILY_CHECKIN', 'Sol — Nhắc check-in tối',
   '2',
   'Anh ơi, 30 giây check-in tối nay.',
   E'Hôm nay anh ở Ngày {day}, streak {streak} ngày.\nSol đợi anh ghi lại 1 dòng.',
   '[{"label":"Check-in 30 giây","type":"OPEN_URL","value":"https://bothuocla.sol.vn/checkin"}]',
   ARRAY['day','streak'], 135, 'DRAFT', NOW()),

  -- 8. Crisis Detect
  ('zalo_tpl_crisis', 'SOL_CRISIS_DETECT', 'Sol — Phát hiện moment khó',
   '2',
   'Mình thấy {name} đang ở moment khó.',
   E'Đừng cố một mình. Bài tập 4-7-8 chỉ 4 phút.\nHoặc gọi Khang nếu cần.',
   '[{"label":"Mở bài tập","type":"OPEN_URL","value":"https://bothuocla.sol.vn/breathing"},{"label":"Gọi Khang","type":"MAKE_PHONE_CALL","value":"+84912727381"}]',
   ARRAY['name'], 142, 'DRAFT', NOW()),

  -- 9. Refund Confirm
  ('zalo_tpl_refund', 'SOL_REFUND_CONFIRM', 'Sol — Xác nhận hoàn tiền',
   '2',
   'Sol đã nhận yêu cầu của {name}.',
   E'Trong 7 ngày, {amount}đ sẽ về tài khoản. Không hỏi gì thêm.\nKhang vẫn ở đó nếu anh muốn quay lại.',
   '[{"label":"Xem trạng thái","type":"OPEN_URL","value":"https://bothuocla.sol.vn/refund"}]',
   ARRAY['name','amount'], 175, 'DRAFT', NOW()),

  -- 10. Alumni Invite
  ('zalo_tpl_alumni', 'SOL_ALUMNI_INVITE', 'Sol — Mời mentor cohort',
   '2',
   '{name} ơi, cohort tháng {cohort} có 5 anh em sắp cột mốc 22.',
   E'Anh nhắn 1 câu cho họ được không? Sol gửi (ẩn danh) tới người đang khó.',
   '[{"label":"Gửi 1 câu","type":"OPEN_ZALO_CHAT","value":"oa_sol"}]',
   ARRAY['name','cohort'], 165, 'DRAFT', NOW()),

  -- 11. Lapse Recovery
  ('zalo_tpl_lapse', 'SOL_LAPSE_RECOVERY', 'Sol — Kéo lại user vắng',
   '2',
   'Mình không thấy {name} 7 ngày rồi.',
   E'Không phán xét. Chỉ muốn biết anh ổn không.\nKhi sẵn sàng quay lại, Sol vẫn ở đây.',
   '[{"label":"Nhắn Sol","type":"OPEN_ZALO_CHAT","value":"oa_sol"}]',
   ARRAY['name'], 140, 'DRAFT', NOW()),

  -- 12. Payment Received
  ('zalo_tpl_payment', 'SOL_PAYMENT_RECEIVED', 'Sol — Xác nhận thanh toán',
   '2',
   'Sol đã nhận thanh toán của {name} — chặng {tier}.',
   E'Voucher đã kích hoạt. Sol và Khang đợi anh ở chặng tiếp theo.',
   '[{"label":"Mở Sol","type":"OPEN_URL","value":"https://bothuocla.sol.vn"},{"label":"Voice chào","type":"OPEN_URL","value":"https://bothuocla.sol.vn/voice/welcome"}]',
   ARRAY['name','tier'], 158, 'DRAFT', NOW())

ON CONFLICT (code) DO UPDATE
  SET "zaloManagerName" = EXCLUDED."zaloManagerName",
      title             = EXCLUDED.title,
      body              = EXCLUDED.body,
      "ctaButtons"      = EXCLUDED."ctaButtons",
      params            = EXCLUDED.params,
      "charCount"       = EXCLUDED."charCount",
      "updatedAt"       = NOW();

-- Verify
SELECT code, "zaloManagerName", status, "charCount"
FROM "ZaloTemplate"
ORDER BY code;
