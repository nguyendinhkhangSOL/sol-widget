-- ═══════════════════════════════════════════════════════════════════════
-- Sol v3 Migration — Schedule update (12-05-2026)
-- ═══════════════════════════════════════════════════════════════════════
-- Mục đích: Update existing users theo Sol v3 schedule (51 ngày + Day 52 lễ)
--
-- Changes:
--   • KHOI_DONG: extend tierExpiresAt từ +10 days → +14 days (4 ngày extra)
--   • DONG_HANH: giữ +30 days (unchanged)
--   • Remove maintenanceUntil dependency (logic không dùng nữa)
--   • Grandfather pricing: existing DONG_HANH users giữ pricing cũ 99k
--                          (new users từ deploy date sẽ 199k)
--
-- SAFETY: Backup database trước khi chạy migration này.
--   pg_dump -U postgres sol_db > sol_db_backup_pre_v3.sql
--
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- ──────────────────────────────────────────────────────────────────────
-- 1. EXTEND KHOI_DONG users +4 days (chuyển từ schedule +10 → +14)
-- ──────────────────────────────────────────────────────────────────────
-- Existing users đang ở KHOI_DONG với tierStartedAt + 10 days → extend
-- thành tierStartedAt + 14 days để khớp Sol v3 schedule.
UPDATE "User"
SET "tierExpiresAt" = "tierStartedAt" + INTERVAL '14 days'
WHERE "tier" = 'KHOI_DONG'
  AND "tierStartedAt" IS NOT NULL
  AND "tierExpiresAt" < "tierStartedAt" + INTERVAL '14 days';

-- Log số users đã update
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM "User"
  WHERE "tier" = 'KHOI_DONG'
    AND "tierStartedAt" IS NOT NULL
    AND "tierExpiresAt" = "tierStartedAt" + INTERVAL '14 days';
  RAISE NOTICE 'KHOI_DONG users extended to +14 days: %', updated_count;
END $$;

-- ──────────────────────────────────────────────────────────────────────
-- 2. DEPRECATE maintenanceUntil (logic không còn dùng trong v3)
-- ──────────────────────────────────────────────────────────────────────
-- Sol v3 không có maintenance window — Day 52+ → ALUMNI miễn phí mãi.
-- KHÔNG xoá column (giữ backward compat), nhưng SET NULL cho users hiện tại
-- để stop logic check sai.
-- NOTE: Nếu Khang muốn keep historical data, comment out UPDATE below.
UPDATE "User"
SET "maintenanceUntil" = NULL
WHERE "maintenanceUntil" IS NOT NULL;

-- ──────────────────────────────────────────────────────────────────────
-- 3. ADD grandfathering column (optional — recommend)
-- ──────────────────────────────────────────────────────────────────────
-- Thêm column để track users đăng ký TRƯỚC v3 pricing change (giữ giá cũ).
-- Users mới sau deploy v3 → grandfathered = false → áp dụng pricing 199k.
-- Existing users → grandfathered = true → giữ pricing 99k cho DONG_HANH.
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "grandfathered_pricing" BOOLEAN DEFAULT false;

-- Mark all existing users là grandfathered (giữ pricing cũ).
-- New users từ deploy date sẽ default = false.
UPDATE "User"
SET "grandfathered_pricing" = true
WHERE "tierStartedAt" IS NOT NULL
  AND "tierStartedAt" < NOW();

-- ──────────────────────────────────────────────────────────────────────
-- 4. AUTO-PROMOTE expired users to ALUMNI (Sol v3 logic)
-- ──────────────────────────────────────────────────────────────────────
-- Users đang DONG_HANH/KHOI_DONG đã hết hạn → promote thành ALUMNI.
-- Sol v3: Day 52+ = NGƯỜI TỰ DO (ALUMNI) tự động miễn phí mãi.
UPDATE "User"
SET "tier" = 'ALUMNI'
WHERE "tier" IN ('KHOI_DONG', 'DONG_HANH')
  AND "tierExpiresAt" IS NOT NULL
  AND "tierExpiresAt" < NOW();

DO $$
DECLARE
  alumni_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO alumni_count FROM "User" WHERE "tier" = 'ALUMNI';
  RAISE NOTICE 'Total ALUMNI users after migration: %', alumni_count;
END $$;

-- ──────────────────────────────────────────────────────────────────────
-- 5. VERIFICATION QUERIES (read-only — chạy để check)
-- ──────────────────────────────────────────────────────────────────────
-- Distribution tier sau migration
DO $$
DECLARE
  free_count INTEGER;
  khoi_dong_count INTEGER;
  dong_hanh_count INTEGER;
  alumni_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO free_count       FROM "User" WHERE "tier" = 'FREE';
  SELECT COUNT(*) INTO khoi_dong_count  FROM "User" WHERE "tier" = 'KHOI_DONG';
  SELECT COUNT(*) INTO dong_hanh_count  FROM "User" WHERE "tier" = 'DONG_HANH';
  SELECT COUNT(*) INTO alumni_count     FROM "User" WHERE "tier" = 'ALUMNI';

  RAISE NOTICE '═══ Tier distribution after Sol v3 migration ═══';
  RAISE NOTICE 'FREE (Nhận Diện):       %', free_count;
  RAISE NOTICE 'KHOI_DONG (Kiểm Soát):  %', khoi_dong_count;
  RAISE NOTICE 'DONG_HANH (Làm Chủ):    %', dong_hanh_count;
  RAISE NOTICE 'ALUMNI (Người Tự Do):   %', alumni_count;
  RAISE NOTICE 'Total users:            %', free_count + khoi_dong_count + dong_hanh_count + alumni_count;
END $$;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════
-- ROLLBACK (nếu cần undo migration):
-- ═══════════════════════════════════════════════════════════════════════
-- BEGIN;
--   ALTER TABLE "User" DROP COLUMN IF EXISTS "grandfathered_pricing";
--   -- Note: tierExpiresAt và maintenanceUntil không restore được vì
--   -- migration đã modify in-place. Cần restore từ backup.
-- COMMIT;
