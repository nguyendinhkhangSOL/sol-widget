-- ─────────────────────────────────────────────────────────────────────
-- PHASE 5 — 51-Day Journey scheduler (Sol v4 15-05-2026)
--
-- Khi user enroll journey qua Zalo OA Welcome flow, backend tạo 51 record
-- ScheduledPush (1/ngày). Cron mỗi 5 phút query record có scheduledAt <= now()
-- & status='pending' rồi gửi ZNS qua oaClient.znsSendTemplate().
--
-- Run trên DB:
--   psql $DATABASE_URL -f prisma/manual_migration_phase5_journey.sql
-- Hoặc:
--   npx prisma migrate dev --name phase5_journey_scheduler
-- ─────────────────────────────────────────────────────────────────────

-- ─── Extend User với journey fields ──────────────────────────────────
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "journeyType"         TEXT,
  ADD COLUMN IF NOT EXISTS "qDayDate"            TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "currentJourneyDay"   INTEGER,
  ADD COLUMN IF NOT EXISTS "journeyStatus"       TEXT,
  ADD COLUMN IF NOT EXISTS "preferredPushHour"   INTEGER NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS "pushTimezone"        TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
  ADD COLUMN IF NOT EXISTS "journeyEnrolledAt"   TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "journeyEndedAt"      TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "User_journeyType_journeyStatus_idx"
  ON "User"("journeyType", "journeyStatus");

CREATE INDEX IF NOT EXISTS "User_qDayDate_idx"
  ON "User"("qDayDate");

-- ─── Table: ScheduledPush ────────────────────────────────────────────
-- 51 record/user (1/ngày). Pre-computed lúc enroll. Cron fire ra ZNS.
CREATE TABLE IF NOT EXISTS "ScheduledPush" (
  "id"             TEXT NOT NULL,
  "userId"         TEXT NOT NULL,
  "dayOffset"      INTEGER NOT NULL,
  "journeyType"    TEXT NOT NULL,
  "templateCode"   TEXT NOT NULL,
  "wikiSlug"       TEXT,
  "templateParams" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "scheduledAt"    TIMESTAMP(3) NOT NULL,
  "status"         TEXT NOT NULL DEFAULT 'pending',
  "sentAt"         TIMESTAMP(3),
  "znsLogId"       TEXT,
  "errorMessage"   TEXT,
  "errorCode"      TEXT,
  "retryCount"     INTEGER NOT NULL DEFAULT 0,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ScheduledPush_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ScheduledPush_userId_dayOffset_journeyType_key"
    UNIQUE ("userId", "dayOffset", "journeyType"),
  CONSTRAINT "ScheduledPush_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ScheduledPush_scheduledAt_status_idx"
  ON "ScheduledPush"("scheduledAt", "status");

CREATE INDEX IF NOT EXISTS "ScheduledPush_userId_status_idx"
  ON "ScheduledPush"("userId", "status");

CREATE INDEX IF NOT EXISTS "ScheduledPush_templateCode_idx"
  ON "ScheduledPush"("templateCode");

-- ─── Table: SOSAlert ──────────────────────────────────────────────────
-- Track sự kiện khẩn cấp riêng (không lẫn với ZNSLog).
CREATE TABLE IF NOT EXISTS "SOSAlert" (
  "id"                   TEXT NOT NULL,
  "userId"               TEXT NOT NULL,
  "triggerType"          TEXT NOT NULL,
  "matchedKeyword"       TEXT,
  "userMessage"          TEXT,
  "triggeredAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status"               TEXT NOT NULL DEFAULT 'pending',
  "autoResponseZnsLogId" TEXT,
  "respondedByAdminId"   TEXT,
  "respondedAt"          TIMESTAMP(3),
  "responseMessage"      TEXT,
  "resolvedAt"           TIMESTAMP(3),
  "resolutionNotes"      TEXT,
  "severity"             TEXT NOT NULL DEFAULT 'medium',
  "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SOSAlert_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SOSAlert_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "SOSAlert_userId_triggeredAt_idx"
  ON "SOSAlert"("userId", "triggeredAt");

CREATE INDEX IF NOT EXISTS "SOSAlert_status_severity_idx"
  ON "SOSAlert"("status", "severity");

CREATE INDEX IF NOT EXISTS "SOSAlert_triggeredAt_idx"
  ON "SOSAlert"("triggeredAt");

-- ─── Verify ──────────────────────────────────────────────────────────
-- SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('ScheduledPush', 'SOSAlert');  -- expect 2
-- SELECT column_name FROM information_schema.columns WHERE table_name='User' AND column_name LIKE 'journey%';
