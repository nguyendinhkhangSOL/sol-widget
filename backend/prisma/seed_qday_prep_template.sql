-- ═══════════════════════════════════════════════════════════════════════
-- Sol — Seed ZNS template SOL_QDAY_PREP_REMINDER (push T-7 reminder checklist)
-- ═══════════════════════════════════════════════════════════════════════
-- Push 7 ngày trước Q-Day để user đọc bài + tick checklist 8 mục.
-- Phải tick 3 mục BẮT BUỘC để Q-Day kích hoạt (qDayConfirmedAt).
-- ═══════════════════════════════════════════════════════════════════════

INSERT INTO "ZaloTemplate" (id, code, "zaloManagerName", tag, title, body, "ctaButtons", params, "charCount", status, "updatedAt")
VALUES
  ('zalo_tpl_qday_prep', 'SOL_QDAY_PREP_REMINDER', 'Sol — Nhắc chuẩn bị Q-Day',
   '2',
   'Còn {days_left} ngày — chuẩn bị Q-Day chưa?',
   E'{name} ơi — còn {days_left} ngày tới Q-Day {qday_date}.\n\nĐọc checklist 8 mục để chuẩn bị:\n• 3 mục BẮT BUỘC (gate Q-Day)\n• 5 mục KHUYẾN KHÍCH (tăng tỷ lệ thành công)\n\nTick xong 3 mục bắt buộc → Q-Day kích hoạt.',
   '[{"label":"📋 Mở Checklist","type":"OPEN_URL","value":"https://bothuocla.sol.vn/q-day-checklist"},{"label":"📖 Đọc bài chuẩn bị","type":"OPEN_URL","value":"https://sol.vn/chuan-bi-q-day-cai-thuoc"},{"label":"Tôi đang khó","type":"OPEN_ZALO_CHAT","value":"sos"}]',
   ARRAY['name','days_left','qday_date'],
   285, 'DRAFT', NOW())

ON CONFLICT (code) DO UPDATE SET
  "zaloManagerName" = EXCLUDED."zaloManagerName",
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  "ctaButtons" = EXCLUDED."ctaButtons",
  params = EXCLUDED.params,
  "charCount" = EXCLUDED."charCount",
  "updatedAt" = NOW();

-- Verify
-- SELECT code, status, "charCount" FROM "ZaloTemplate" WHERE code = 'SOL_QDAY_PREP_REMINDER';
