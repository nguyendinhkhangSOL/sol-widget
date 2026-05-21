-- ═══════════════════════════════════════════════════════════════════════
-- Sol v4 — Seed 3 ZNS templates cho Phase 5 (51-Day Journey scheduler)
-- ═══════════════════════════════════════════════════════════════════════
-- Bổ sung cho 12 template đã có (seed_zalo_templates.sql):
--   1. SOL_DAILY_CHIP         — daily push generic (Pre-Q + Q-Day 1-30)
--   2. SOL_SOS_CRISIS         — emergency response với hotline 02439931800
--   3. SOL_MILESTONE_GENERIC  — celebration 7/14/21/30 ngày
--
-- Sau khi seed, anh submit lên Zalo Manager (https://oa.zalo.me) để duyệt.
-- Tag 2 (Customer Care) — phù hợp lộ trình cai thuốc.
--
-- Run:
--   psql $DATABASE_URL -f prisma/seed_phase5_journey_templates.sql
-- ═══════════════════════════════════════════════════════════════════════

INSERT INTO "ZaloTemplate" (id, code, "zaloManagerName", tag, title, body, "ctaButtons", params, "charCount", status, "updatedAt")
VALUES
  -- ─── 1. DAILY CHIP (sử dụng hằng ngày trừ milestone) ─────────────────
  -- Dùng cho Pre-Q-Day (T-21 → T-1) + Q-Day (D1 → D30), trừ 4 mốc 7/14/21/30
  -- → SOL_MILESTONE_GENERIC chiếm
  ('zalo_tpl_daily_chip', 'SOL_DAILY_CHIP', 'Sol — Daily Chip Hành Trình',
   '2',
   'Ngày {day_label} — {chip_title}',
   E'{chip_body}\n\nĐọc đầy đủ: {cta_text}',
   '[{"label":"Đọc bài hôm nay","type":"OPEN_URL","value":"{cta_url}"},{"label":"Tôi đang khó","type":"OPEN_ZALO_CHAT","value":"sos"}]',
   ARRAY['day_label','chip_title','chip_body','cta_text','cta_url'],
   280, 'DRAFT', NOW()),

  -- ─── 2. SOS CRISIS (hotline 02439931800) ─────────────────────────────
  -- Auto-fire khi user click [Tôi đang khó] hoặc match crisis keyword
  -- triggerType phân biệt severity: critical (đau ngực 115) / high (sắp hút)
  ('zalo_tpl_sos_crisis', 'SOL_SOS_CRISIS', 'Sol — Cứu Khẩn Cấp',
   '2',
   'Sol đây {name}. Đừng làm gì trong 90 giây',
   E'Cơn thèm là sóng — sẽ qua trong 90 giây.\n\nHÍT sâu 4 → CHẶN 7 → CHỜ 8 (lặp 3 lần).\n\nCần Khang gọi lại?\nHotline CSKH: 02439931800',
   '[{"label":"Gọi hotline Sol","type":"MAKE_PHONE_CALL","value":"02439931800"},{"label":"Đọc Sắp Hút Lại","type":"OPEN_URL","value":"https://sol.vn/sap-hut-lai-cuu/"},{"label":"Tôi đã vượt qua","type":"OPEN_ZALO_CHAT","value":"victory"}]',
   ARRAY['name'],
   235, 'DRAFT', NOW()),

  -- ─── 3. MILESTONE 7/14/21/30 (celebration) ───────────────────────────
  -- Push thay SOL_DAILY_CHIP vào ngày 7, 14, 21, 30 (mốc lớn)
  -- params: {name, milestone_day, days_saved_money_vnd, days_co_recovery, custom_msg}
  ('zalo_tpl_milestone_gen', 'SOL_MILESTONE_GENERIC', 'Sol — Mốc Ngày 7/14/21/30',
   '2',
   'Mốc {milestone_day} ngày của {name} — Tuyệt vời!',
   E'Anh đã không hút {milestone_day} ngày!\n\nTiết kiệm: {days_saved_money_vnd} VND\nPhổi: {co_recovery_pct}% phục hồi\n\n{custom_msg}',
   '[{"label":"Xem báo cáo đầy đủ","type":"OPEN_URL","value":"https://bothuocla.sol.vn/milestone/{milestone_day}"},{"label":"Chia sẻ thành tựu","type":"OPEN_ZALO_CHAT","value":"share_milestone"}]',
   ARRAY['name','milestone_day','days_saved_money_vnd','co_recovery_pct','custom_msg'],
   245, 'DRAFT', NOW())

ON CONFLICT (code) DO UPDATE SET
  "zaloManagerName" = EXCLUDED."zaloManagerName",
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  "ctaButtons" = EXCLUDED."ctaButtons",
  params = EXCLUDED.params,
  "charCount" = EXCLUDED."charCount",
  "updatedAt" = NOW();

-- Verify
-- SELECT code, status, "zaloTemplateId", LENGTH(body) FROM "ZaloTemplate"
-- WHERE code IN ('SOL_DAILY_CHIP','SOL_SOS_CRISIS','SOL_MILESTONE_GENERIC');
