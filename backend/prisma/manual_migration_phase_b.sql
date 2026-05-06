-- backend/prisma/manual_migration_phase_b.sql
-- Phase B: 88-day journey (NHAN_THUC + HANH_DONG + GIAI_PHONG + TAI_THIET)
-- Q-Day Day 28 ceremony + onboarding baseline + cumulative money saved.
--
-- Idempotent: dùng IF NOT EXISTS, có thể chạy lại nhiều lần an toàn.
-- Chạy:
--   docker compose exec db psql -U sol -d sol -f /docker-entrypoint-initdb.d/manual_migration_phase_b.sql
-- Hoặc:
--   Get-Content backend\prisma\manual_migration_phase_b.sql | docker compose exec -T db psql -U sol -d sol

BEGIN;

-- ─── User onboarding fields ───────────────────────────────────────────────
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "qDayConfirmedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "cigsBaseline" INTEGER NOT NULL DEFAULT 20;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "pricePerCig" INTEGER NOT NULL DEFAULT 1250;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "onboardingCompletedAt" TIMESTAMP(3);

-- ─── Tier pricing: flex hardcoded trong backend/src/tiers/pricing.ts ──────
-- Không có Tier table — pricing là constants. Skip DB change.
-- Default = 10.000đ × số ngày phase. Promo Khởi Chạy = 75% off.

-- ─── Index for Q-Day queries (worker schedule notif) ──────────────────────
CREATE INDEX IF NOT EXISTS "User_qDayConfirmedAt_idx" ON "User"("qDayConfirmedAt");
CREATE INDEX IF NOT EXISTS "User_quitDate_idx" ON "User"("quitDate");

-- ─── Verify ───────────────────────────────────────────────────────────────
SELECT
  COUNT(*) AS total_users,
  COUNT("qDayConfirmedAt") AS qday_confirmed,
  AVG("cigsBaseline") AS avg_baseline,
  AVG("pricePerCig") AS avg_price
FROM "User";

COMMIT;
