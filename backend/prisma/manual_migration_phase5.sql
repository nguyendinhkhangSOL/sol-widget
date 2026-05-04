-- Phase 5 — Smart Notification Schedule migration
-- Chạy: type prisma\manual_migration_phase5.sql | docker exec -i sol-widget-db-1 psql -U sol -d sol
-- Hoặc local Postgres: psql -U sol -d sol -f prisma\manual_migration_phase5.sql

BEGIN;

-- 1. Enum Moment
DO $$ BEGIN
  CREATE TYPE "Moment" AS ENUM (
    'COFFEE_MORNING',
    'TEA_AFTERNOON',
    'POST_LUNCH',
    'POST_DINNER',
    'PRE_SOCIAL_DRINK',
    'PRE_BEDTIME',
    'GENERIC'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. ContentItem add moment column
ALTER TABLE "ContentItem" ADD COLUMN IF NOT EXISTS "moment" "Moment";

-- 3. User add notificationPrefs JSON column (default {})
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notificationPrefs" JSONB NOT NULL DEFAULT '{}';

COMMIT;

-- Verify
SELECT 'Moment enum:' AS info, COUNT(*) AS distinct_moments FROM (
  SELECT unnest(enum_range(NULL::"Moment")) AS m
) sub;

SELECT 'ContentItem.moment:' AS info, COUNT(*) AS items_with_moment
FROM "ContentItem" WHERE "moment" IS NOT NULL;

SELECT 'User.notificationPrefs:' AS info, COUNT(*) AS users_with_prefs
FROM "User" WHERE "notificationPrefs" IS NOT NULL;
