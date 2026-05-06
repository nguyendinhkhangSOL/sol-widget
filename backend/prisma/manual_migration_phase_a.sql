-- Phase A — Continuous Journey + Exit-friendly migration

BEGIN;

-- 1. CigaretteLog table
CREATE TABLE IF NOT EXISTS "CigaretteLog" (
    "id"          TEXT NOT NULL,
    "userId"      TEXT NOT NULL,
    "smokedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trigger"     TEXT,
    "context"     TEXT,
    "delayedMin"  INTEGER,
    "skipped"     BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "CigaretteLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CigaretteLog_userId_smokedAt_idx"
  ON "CigaretteLog"("userId", "smokedAt");

DO $$ BEGIN
  ALTER TABLE "CigaretteLog" ADD CONSTRAINT "CigaretteLog_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. ProgressJournal table
CREATE TABLE IF NOT EXISTS "ProgressJournal" (
    "id"                       TEXT NOT NULL,
    "userId"                   TEXT,
    "daysJourneyed"            INTEGER NOT NULL,
    "cigsLogged"               INTEGER NOT NULL DEFAULT 0,
    "cigsSkipped"              INTEGER NOT NULL DEFAULT 0,
    "moneySaved"               INTEGER NOT NULL DEFAULT 0,
    "topTriggers"              JSONB,
    "emotionalArc"             JSONB,
    "letterToSelf"             TEXT,
    "bodyMilestonesUnlocked"   JSONB,
    "paidAmount"               INTEGER NOT NULL DEFAULT 0,
    "refundedAmount"           INTEGER NOT NULL DEFAULT 0,
    "pdfUrl"                   TEXT,
    "exitReason"               TEXT,
    "exitedAt"                 TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProgressJournal_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ProgressJournal_userId_exitedAt_idx"
  ON "ProgressJournal"("userId", "exitedAt");

DO $$ BEGIN
  ALTER TABLE "ProgressJournal" ADD CONSTRAINT "ProgressJournal_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 3. User add exitedAt + exitReason
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "exitedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "exitReason" TEXT;

COMMIT;

-- Verify
SELECT 'CigaretteLog:' AS info, COUNT(*) AS rows FROM "CigaretteLog";
SELECT 'ProgressJournal:' AS info, COUNT(*) AS rows FROM "ProgressJournal";
SELECT 'User.exitedAt:' AS info, COUNT(*) AS users FROM "User";
