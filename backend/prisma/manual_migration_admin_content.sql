-- Manual migration cho Phase 1 AdminContent
-- Skip Prisma drift detection bằng cách chạy DDL trực tiếp.
-- Chạy: docker exec -i sol-widget-db-1 psql -U sol -d sol < manual_migration_admin_content.sql

BEGIN;

-- 1. Thêm enum ContentVoice (idempotent — bỏ qua nếu đã có)
DO $$ BEGIN
  CREATE TYPE "ContentVoice" AS ENUM ('KHANG_SOL', 'SOL_DONG_HANH');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add columns to ContentItem (idempotent — IF NOT EXISTS)
ALTER TABLE "ContentItem" ADD COLUMN IF NOT EXISTS "voice" "ContentVoice" NOT NULL DEFAULT 'SOL_DONG_HANH';
ALTER TABLE "ContentItem" ADD COLUMN IF NOT EXISTS "priority" INTEGER NOT NULL DEFAULT 100;
ALTER TABLE "ContentItem" ADD COLUMN IF NOT EXISTS "targetRules" JSONB;
ALTER TABLE "ContentItem" ADD COLUMN IF NOT EXISTS "variantGroup" TEXT;
ALTER TABLE "ContentItem" ADD COLUMN IF NOT EXISTS "weight" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "ContentItem" ADD COLUMN IF NOT EXISTS "lastEditedBy" TEXT;

-- 3. Drop old unique constraint + create new (with voice)
ALTER TABLE "ContentItem" DROP CONSTRAINT IF EXISTS "ContentItem_dayNumber_module_exerciseKey_key";
ALTER TABLE "ContentItem" DROP CONSTRAINT IF EXISTS "ContentItem_dayNumber_module_exerciseKey_voice_key";
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_dayNumber_module_exerciseKey_voice_key"
  UNIQUE ("dayNumber", "module", "exerciseKey", "voice");

-- 4. Replace index dayNumber+module → dayNumber+module+published
DROP INDEX IF EXISTS "ContentItem_dayNumber_module_idx";
CREATE INDEX IF NOT EXISTS "ContentItem_dayNumber_module_published_idx"
  ON "ContentItem"("dayNumber", "module", "published");

-- 5. Create ContentItemRevision table
CREATE TABLE IF NOT EXISTS "ContentItemRevision" (
    "id" TEXT NOT NULL,
    "contentItemId" TEXT NOT NULL,
    "versionNum" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "voice" "ContentVoice" NOT NULL,
    "targetRules" JSONB,
    "priority" INTEGER NOT NULL,
    "editedBy" TEXT NOT NULL,
    "editedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changeNote" TEXT,
    CONSTRAINT "ContentItemRevision_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ContentItemRevision_contentItemId_versionNum_idx"
  ON "ContentItemRevision"("contentItemId", "versionNum");

-- 6. FK to ContentItem (cascade delete)
DO $$ BEGIN
  ALTER TABLE "ContentItemRevision" ADD CONSTRAINT "ContentItemRevision_contentItemId_fkey"
    FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMIT;

-- Verify
SELECT 'Voice column:' AS info, COUNT(*) AS items_with_voice FROM "ContentItem" WHERE "voice" IS NOT NULL;
SELECT 'Voice distribution:' AS info, "voice", COUNT(*) AS cnt FROM "ContentItem" GROUP BY "voice";
SELECT 'Revision table:' AS info, COUNT(*) AS revision_count FROM "ContentItemRevision";
