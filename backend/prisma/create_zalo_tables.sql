-- ═══════════════════════════════════════════════════════════════════════
-- Sol Zalo OA Phase 1 — Tạo 5 bảng mới qua SQL (bypass Prisma db push)
-- ═══════════════════════════════════════════════════════════════════════
-- Lý do bypass: Prisma db push báo "User_phone_key already exists" do
-- DB drift. 5 bảng dưới đây hoàn toàn mới — chỉ ADD, không TOUCH User.
-- Idempotent: dùng "IF NOT EXISTS" — chạy nhiều lần OK.

BEGIN;

-- ─── 1. ZaloOAUser ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ZaloOAUser" (
  "id"           TEXT PRIMARY KEY,
  "userId"       TEXT UNIQUE,
  "zaloUserId"   TEXT UNIQUE NOT NULL,
  "oaId"         TEXT NOT NULL,
  "displayName"  TEXT,
  "avatarUrl"    TEXT,
  "followedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "blockedAt"    TIMESTAMP(3),
  "optedOut"     BOOLEAN NOT NULL DEFAULT false,
  "lastChatAt"   TIMESTAMP(3),
  "totalMsgIn"   INTEGER NOT NULL DEFAULT 0,
  "totalMsgOut"  INTEGER NOT NULL DEFAULT 0,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ZaloOAUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "ZaloOAUser_oaId_idx" ON "ZaloOAUser"("oaId");
CREATE INDEX IF NOT EXISTS "ZaloOAUser_lastChatAt_idx" ON "ZaloOAUser"("lastChatAt");

-- ─── 2. ZNSLog ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ZNSLog" (
  "id"             TEXT PRIMARY KEY,
  "userId"         TEXT NOT NULL,
  "templateCode"   TEXT NOT NULL,
  "zaloTemplateId" TEXT,
  "params"         JSONB NOT NULL DEFAULT '{}',
  "costVnd"        INTEGER NOT NULL DEFAULT 0,
  "status"         TEXT NOT NULL DEFAULT 'SENT',
  "sentAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deliveredAt"    TIMESTAMP(3),
  "openedAt"       TIMESTAMP(3),
  "clickedAt"      TIMESTAMP(3),
  "errorCode"      TEXT,
  "errorMessage"   TEXT,
  "experimentId"   TEXT,
  "variant"        TEXT,
  CONSTRAINT "ZNSLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "ZNSLog_userId_sentAt_idx" ON "ZNSLog"("userId", "sentAt");
CREATE INDEX IF NOT EXISTS "ZNSLog_templateCode_idx" ON "ZNSLog"("templateCode");
CREATE INDEX IF NOT EXISTS "ZNSLog_status_idx" ON "ZNSLog"("status");

-- ─── 3. ZaloTemplate ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ZaloTemplate" (
  "id"                TEXT PRIMARY KEY,
  "code"              TEXT UNIQUE NOT NULL,
  "zaloManagerName"   TEXT NOT NULL,
  "zaloTemplateId"    TEXT UNIQUE,
  "tag"               TEXT NOT NULL DEFAULT '2',
  "title"             TEXT NOT NULL,
  "body"              TEXT NOT NULL,
  "ctaButtons"        JSONB NOT NULL DEFAULT '[]',
  "params"            TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "charCount"         INTEGER NOT NULL DEFAULT 0,
  "status"            TEXT NOT NULL DEFAULT 'DRAFT',
  "rejectReason"      TEXT,
  "voiceTemplateCode" TEXT,
  "textFallbackCode"  TEXT,
  "createdBy"         TEXT,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL,
  "submittedAt"       TIMESTAMP(3),
  "approvedAt"        TIMESTAMP(3),
  "archivedAt"        TIMESTAMP(3)
);
CREATE INDEX IF NOT EXISTS "ZaloTemplate_status_idx" ON "ZaloTemplate"("status");
CREATE INDEX IF NOT EXISTS "ZaloTemplate_tag_idx" ON "ZaloTemplate"("tag");

-- ─── 4. MessagingPolicy ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "MessagingPolicy" (
  "id"          TEXT PRIMARY KEY,
  "scope"       TEXT NOT NULL DEFAULT 'GLOBAL',
  "cohortKey"   TEXT,
  "userId"      TEXT,
  "intensity"   TEXT NOT NULL DEFAULT 'MEDIUM',
  "config"      JSONB NOT NULL DEFAULT '{}',
  "enabled"     BOOLEAN NOT NULL DEFAULT true,
  "createdBy"   TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MessagingPolicy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "MessagingPolicy_scope_cohortKey_userId_key" ON "MessagingPolicy"("scope", "cohortKey", "userId");
CREATE INDEX IF NOT EXISTS "MessagingPolicy_scope_idx" ON "MessagingPolicy"("scope");

-- ─── 5. UserMessagingProfile ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "UserMessagingProfile" (
  "userId"          TEXT PRIMARY KEY,
  "cohortKey"       TEXT NOT NULL DEFAULT 'MODERATE',
  "ftndScore"       INTEGER,
  "boostMode"       BOOLEAN NOT NULL DEFAULT false,
  "boostUntil"      TIMESTAMP(3),
  "muteUntil"       TIMESTAMP(3),
  "crisisThreshold" INTEGER,
  "engagementScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalSent"       INTEGER NOT NULL DEFAULT 0,
  "totalOpened"     INTEGER NOT NULL DEFAULT 0,
  "totalClicked"    INTEGER NOT NULL DEFAULT 0,
  "totalBlocked"    INTEGER NOT NULL DEFAULT 0,
  "lastInteractAt"  TIMESTAMP(3),
  "notes"           TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserMessagingProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "UserMessagingProfile_cohortKey_idx" ON "UserMessagingProfile"("cohortKey");

-- ─── Verification ───────────────────────────────────────────────────────
DO $$
DECLARE
  cnt INTEGER;
BEGIN
  SELECT COUNT(*) INTO cnt
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('ZaloOAUser', 'ZNSLog', 'ZaloTemplate', 'MessagingPolicy', 'UserMessagingProfile');
  RAISE NOTICE '═══ Sol Zalo OA Phase 1 ═══';
  RAISE NOTICE 'Created tables: %/5', cnt;
END $$;

COMMIT;
