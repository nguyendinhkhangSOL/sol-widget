-- ════════════════════════════════════════════════════════════════════
-- Silent Companionship Migration — Manual SQL (ADD-only)
-- ════════════════════════════════════════════════════════════════════
-- Pivot 2026-05-08 — drop community truyền thống, add 7 channels.
-- Chỉ ADD: 11 tables + 4 enums. KHÔNG động đến User/CheckIn/Message/...
-- Safe: không có DROP, không có data loss.
--
-- Run:
--   docker exec -i sol-widget-db-1 psql -U sol -d sol -f /path/to/this.sql
-- Hoặc:
--   Get-Content this.sql | docker exec -i sol-widget-db-1 psql -U sol -d sol
--
-- Sau khi chạy thành công:
--   docker exec -it sol-widget-backend-1 npx prisma generate
--   docker restart sol-widget-backend-1
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ─── ENUMS ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "ConfessionStatus" AS ENUM ('PENDING', 'PUBLISHED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "KhangQuestionStatus" AS ENUM ('PENDING', 'SELECTED', 'ANSWERED', 'ARCHIVED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "KhangVoiceStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ─── CONFESSION (Khoảng Lặng) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Confession" (
  "id"          TEXT PRIMARY KEY,
  "authorId"    TEXT NOT NULL,
  "content"     TEXT NOT NULL,
  "status"      "ConfessionStatus" NOT NULL DEFAULT 'PUBLISHED',
  "pinnedAt"    TIMESTAMP(3),
  "readCount"   INTEGER NOT NULL DEFAULT 0,
  "reactCount"  INTEGER NOT NULL DEFAULT 0,
  "autoTag"     TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Confession_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "Confession_status_createdAt_idx" ON "Confession"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "Confession_authorId_idx" ON "Confession"("authorId");

CREATE TABLE IF NOT EXISTS "ConfessionReaction" (
  "id"           TEXT PRIMARY KEY,
  "confessionId" TEXT NOT NULL,
  "userId"       TEXT NOT NULL,
  "reactionType" INTEGER NOT NULL,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConfessionReaction_confessionId_fkey" FOREIGN KEY ("confessionId") REFERENCES "Confession"("id") ON DELETE CASCADE,
  CONSTRAINT "ConfessionReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "ConfessionReaction_confessionId_userId_reactionType_key"
  ON "ConfessionReaction"("confessionId", "userId", "reactionType");
CREATE INDEX IF NOT EXISTS "ConfessionReaction_userId_idx" ON "ConfessionReaction"("userId");

CREATE TABLE IF NOT EXISTS "ConfessionRead" (
  "id"           TEXT PRIMARY KEY,
  "confessionId" TEXT NOT NULL,
  "userId"       TEXT NOT NULL,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConfessionRead_confessionId_fkey" FOREIGN KEY ("confessionId") REFERENCES "Confession"("id") ON DELETE CASCADE,
  CONSTRAINT "ConfessionRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "ConfessionRead_confessionId_userId_key"
  ON "ConfessionRead"("confessionId", "userId");

-- ─── KHANG VOICE LIBRARY ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "KhangVoice" (
  "id"               TEXT PRIMARY KEY,
  "title"            TEXT NOT NULL,
  "description"      TEXT,
  "audioUrl"         TEXT NOT NULL,
  "durationSec"      INTEGER NOT NULL,
  "topic"            TEXT NOT NULL,
  "minTier"          "UserTier" NOT NULL DEFAULT 'FREE',
  "autoPlayTrigger"  TEXT,
  "isQuestionReply"  BOOLEAN NOT NULL DEFAULT FALSE,
  "pinnedAt"         TIMESTAMP(3),
  "listenCount"      INTEGER NOT NULL DEFAULT 0,
  "reactCount"       INTEGER NOT NULL DEFAULT 0,
  "status"           "KhangVoiceStatus" NOT NULL DEFAULT 'PUBLISHED',
  "internalNotes"    TEXT,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL
);
CREATE INDEX IF NOT EXISTS "KhangVoice_status_topic_createdAt_idx"
  ON "KhangVoice"("status", "topic", "createdAt");
CREATE INDEX IF NOT EXISTS "KhangVoice_autoPlayTrigger_idx" ON "KhangVoice"("autoPlayTrigger");

CREATE TABLE IF NOT EXISTS "KhangVoiceListen" (
  "id"            TEXT PRIMARY KEY,
  "voiceId"       TEXT NOT NULL,
  "userId"        TEXT NOT NULL,
  "completionPct" INTEGER NOT NULL DEFAULT 0,
  "context"       TEXT NOT NULL DEFAULT 'manual',
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "KhangVoiceListen_voiceId_fkey" FOREIGN KEY ("voiceId") REFERENCES "KhangVoice"("id") ON DELETE CASCADE,
  CONSTRAINT "KhangVoiceListen_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "KhangVoiceListen_userId_voiceId_idx" ON "KhangVoiceListen"("userId", "voiceId");
CREATE INDEX IF NOT EXISTS "KhangVoiceListen_voiceId_createdAt_idx" ON "KhangVoiceListen"("voiceId", "createdAt");

CREATE TABLE IF NOT EXISTS "KhangVoiceReaction" (
  "id"           TEXT PRIMARY KEY,
  "voiceId"      TEXT NOT NULL,
  "userId"       TEXT NOT NULL,
  "reactionType" INTEGER NOT NULL,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "KhangVoiceReaction_voiceId_fkey" FOREIGN KEY ("voiceId") REFERENCES "KhangVoice"("id") ON DELETE CASCADE,
  CONSTRAINT "KhangVoiceReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "KhangVoiceReaction_voiceId_userId_key"
  ON "KhangVoiceReaction"("voiceId", "userId");

-- ─── KHANG QUESTION (Hỏi Khang) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "KhangQuestion" (
  "id"           TEXT PRIMARY KEY,
  "authorId"     TEXT NOT NULL,
  "content"      TEXT NOT NULL,
  "status"       "KhangQuestionStatus" NOT NULL DEFAULT 'PENDING',
  "selectedAt"   TIMESTAMP(3),
  "voiceReplyId" TEXT,
  "upvoteCount"  INTEGER NOT NULL DEFAULT 0,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,
  CONSTRAINT "KhangQuestion_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "KhangQuestion_voiceReplyId_fkey" FOREIGN KEY ("voiceReplyId") REFERENCES "KhangVoice"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "KhangQuestion_status_createdAt_idx" ON "KhangQuestion"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "KhangQuestion_authorId_idx" ON "KhangQuestion"("authorId");

CREATE TABLE IF NOT EXISTS "KhangQuestionUpvote" (
  "id"         TEXT PRIMARY KEY,
  "questionId" TEXT NOT NULL,
  "userId"     TEXT NOT NULL,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "KhangQuestionUpvote_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "KhangQuestion"("id") ON DELETE CASCADE,
  CONSTRAINT "KhangQuestionUpvote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "KhangQuestionUpvote_questionId_userId_key"
  ON "KhangQuestionUpvote"("questionId", "userId");

-- ─── CRISIS TIMER LOG ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "CrisisTimerLog" (
  "id"               TEXT PRIMARY KEY,
  "userId"           TEXT NOT NULL,
  "startedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endedAt"          TIMESTAMP(3),
  "delayDurationSec" INTEGER,
  "outcome"          TEXT,
  "triggerContext"   TEXT,
  "notes"            TEXT,
  CONSTRAINT "CrisisTimerLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "CrisisTimerLog_userId_startedAt_idx" ON "CrisisTimerLog"("userId", "startedAt");
CREATE INDEX IF NOT EXISTS "CrisisTimerLog_outcome_idx" ON "CrisisTimerLog"("outcome");

-- ─── ANONYMOUS STATS CACHE ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "AnonymousStatsCache" (
  "id"                  TEXT PRIMARY KEY,
  "period"              TEXT NOT NULL,
  "totalActiveUsers"    INTEGER NOT NULL DEFAULT 0,
  "lateNightOpens"      INTEGER NOT NULL DEFAULT 0,
  "lapseLogs"           INTEGER NOT NULL DEFAULT 0,
  "recoveryWithin24h"   INTEGER NOT NULL DEFAULT 0,
  "delayOver10min"      INTEGER NOT NULL DEFAULT 0,
  "voiceListens"        INTEGER NOT NULL DEFAULT 0,
  "topVoiceId"          TEXT,
  "topVoiceListenCount" INTEGER NOT NULL DEFAULT 0,
  "controlScoreAvg"     DOUBLE PRECISION NOT NULL DEFAULT 0,
  "qDaysSet"            INTEGER NOT NULL DEFAULT 0,
  "thirtyDayCleanCount" INTEGER NOT NULL DEFAULT 0,
  "computedAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "AnonymousStatsCache_period_key" ON "AnonymousStatsCache"("period");

-- ─── LAPSE EVENT (lapse-friendly, KHÔNG reset streak) ──────────────────
CREATE TABLE IF NOT EXISTS "LapseEvent" (
  "id"             TEXT PRIMARY KEY,
  "userId"         TEXT NOT NULL,
  "lapsedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "cigaretteCount" INTEGER NOT NULL DEFAULT 1,
  "context"        TEXT,
  "reflection"     TEXT,
  "recoveredAt"    TIMESTAMP(3),
  "voicePlayed"    BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LapseEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "LapseEvent_userId_lapsedAt_idx" ON "LapseEvent"("userId", "lapsedAt");

COMMIT;

-- ════════════════════════════════════════════════════════════════════
-- DONE — 11 tables + 3 enums added (1 enum UserTier giữ nguyên).
-- Verify:
--   SELECT COUNT(*) FROM "Confession";          -- = 0
--   SELECT COUNT(*) FROM "KhangVoice";          -- = 0
--   \dt+                                         -- list all tables
-- ════════════════════════════════════════════════════════════════════
