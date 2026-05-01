-- Pricing tiers, payments, refunds, voice library, cohorts.
-- Foundation cho 3-tier system: FREE / KHOI_DONG (99k/10d) / DONG_HANH (199k/30d+30d) / ALUMNI

-- ─────────── ENUMS ───────────
CREATE TYPE "UserTier" AS ENUM ('FREE', 'KHOI_DONG', 'DONG_HANH', 'ALUMNI');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELED', 'REFUNDED');
CREATE TYPE "PaymentProvider" AS ENUM ('MOCK', 'MOMO', 'VIETQR', 'BANK_TRANSFER');
CREATE TYPE "RefundStatus" AS ENUM ('REQUESTED', 'APPROVED', 'DENIED', 'PROCESSED');
CREATE TYPE "VoiceTriggerType" AS ENUM ('DAY_MATCH', 'CRISIS', 'MILESTONE', 'MANUAL');

-- ─────────── USER: TIER + RISK + COHORT FIELDS ───────────
ALTER TABLE "User"
  ADD COLUMN "tier" "UserTier" NOT NULL DEFAULT 'FREE',
  ADD COLUMN "tierStartedAt" TIMESTAMP(3),
  ADD COLUMN "tierExpiresAt" TIMESTAMP(3),
  ADD COLUMN "maintenanceUntil" TIMESTAMP(3),
  ADD COLUMN "dailyMessageCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "dailyMessageDate" DATE,
  ADD COLUMN "riskScore" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "riskScoreUpdated" TIMESTAMP(3),
  ADD COLUMN "cohortKey" TEXT;

CREATE INDEX "User_tier_idx" ON "User"("tier");
CREATE INDEX "User_cohortKey_idx" ON "User"("cohortKey");
CREATE INDEX "User_riskScore_idx" ON "User"("riskScore");

-- ─────────── PAYMENT LOG ───────────
CREATE TABLE "PaymentLog" (
  "id"              TEXT NOT NULL,
  "userId"          TEXT NOT NULL,
  "targetTier"      "UserTier" NOT NULL,
  "amountVnd"       INTEGER NOT NULL,
  "provider"        "PaymentProvider" NOT NULL DEFAULT 'MOCK',
  "providerOrderId" TEXT,
  "status"          "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "paidAt"          TIMESTAMP(3),
  "metadata"        JSONB NOT NULL DEFAULT '{}',
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PaymentLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PaymentLog_userId_createdAt_idx" ON "PaymentLog"("userId", "createdAt");
CREATE INDEX "PaymentLog_status_idx" ON "PaymentLog"("status");

ALTER TABLE "PaymentLog"
  ADD CONSTRAINT "PaymentLog_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────── REFUND REQUEST ───────────
CREATE TABLE "RefundRequest" (
  "id"          TEXT NOT NULL,
  "userId"      TEXT NOT NULL,
  "paymentId"   TEXT NOT NULL,
  "daysUsed"    INTEGER NOT NULL,
  "amountVnd"   INTEGER NOT NULL,
  "reason"      TEXT,
  "status"      "RefundStatus" NOT NULL DEFAULT 'REQUESTED',
  "adminNote"   TEXT,
  "approvedBy"  TEXT,
  "approvedAt"  TIMESTAMP(3),
  "processedAt" TIMESTAMP(3),
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RefundRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RefundRequest_paymentId_key" ON "RefundRequest"("paymentId");
CREATE INDEX "RefundRequest_status_createdAt_idx" ON "RefundRequest"("status", "createdAt");

ALTER TABLE "RefundRequest"
  ADD CONSTRAINT "RefundRequest_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RefundRequest"
  ADD CONSTRAINT "RefundRequest_paymentId_fkey"
  FOREIGN KEY ("paymentId") REFERENCES "PaymentLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────── VOICE MESSAGE ───────────
CREATE TABLE "VoiceMessage" (
  "id"          TEXT NOT NULL,
  "title"       TEXT NOT NULL,
  "audioUrl"    TEXT NOT NULL,
  "durationSec" INTEGER,
  "transcript"  TEXT,
  "triggerType" "VoiceTriggerType" NOT NULL,
  "dayMatch"    INTEGER,
  "tag"         TEXT,
  "minTier"     "UserTier" NOT NULL DEFAULT 'FREE',
  "enabled"     BOOLEAN NOT NULL DEFAULT true,
  "sortOrder"   INTEGER NOT NULL DEFAULT 100,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,

  CONSTRAINT "VoiceMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VoiceMessage_triggerType_dayMatch_idx" ON "VoiceMessage"("triggerType", "dayMatch");
CREATE INDEX "VoiceMessage_enabled_sortOrder_idx" ON "VoiceMessage"("enabled", "sortOrder");

-- ─────────── VOICE DELIVERY (idempotent log) ───────────
CREATE TABLE "VoiceDelivery" (
  "id"          TEXT NOT NULL,
  "userId"      TEXT NOT NULL,
  "voiceId"     TEXT NOT NULL,
  "deliveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "playedAt"    TIMESTAMP(3),

  CONSTRAINT "VoiceDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VoiceDelivery_userId_voiceId_key" ON "VoiceDelivery"("userId", "voiceId");
CREATE INDEX "VoiceDelivery_userId_deliveredAt_idx" ON "VoiceDelivery"("userId", "deliveredAt");

ALTER TABLE "VoiceDelivery"
  ADD CONSTRAINT "VoiceDelivery_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VoiceDelivery"
  ADD CONSTRAINT "VoiceDelivery_voiceId_fkey"
  FOREIGN KEY ("voiceId") REFERENCES "VoiceMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────── COHORT ───────────
CREATE TABLE "Cohort" (
  "key"            TEXT NOT NULL,
  "label"          TEXT NOT NULL,
  "startDate"      TIMESTAMP(3) NOT NULL,
  "endDate"        TIMESTAMP(3) NOT NULL,
  "totalMembers"   INTEGER NOT NULL DEFAULT 0,
  "paidMembers"    INTEGER NOT NULL DEFAULT 0,
  "alumniMembers"  INTEGER NOT NULL DEFAULT 0,
  "churnedMembers" INTEGER NOT NULL DEFAULT 0,
  "notes"          TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Cohort_pkey" PRIMARY KEY ("key")
);
