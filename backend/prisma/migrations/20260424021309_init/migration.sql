-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('CHAT', 'MORNING_GOAL', 'SCIENCE_TIP', 'PHENOMENA_ALERT', 'EXERCISE_CARD', 'CHECKIN_PROMPT', 'CHECKIN_STEP', 'NIGHT_STORY', 'STREAK_MILESTONE', 'CRISIS_PROMPT', 'SYSTEM_NOTICE', 'WIKI_LINK');

-- CreateEnum
CREATE TYPE "ContentModule" AS ENUM ('MORNING_GOAL', 'SCIENCE_TIP', 'PHENOMENA_ALERT', 'EXERCISE', 'NIGHT_STORY');

-- CreateEnum
CREATE TYPE "ConversationState" AS ENUM ('IDLE', 'CHECKIN_FLOW', 'EXERCISE_FLOW', 'AI_CHAT', 'CRISIS_MODE');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('MORNING_GOAL', 'SCIENCE_TIP', 'PHENOMENA_ALERT', 'EXERCISE_REMINDER', 'EVENING_CHECKIN', 'CRISIS_PREP', 'STREAK_MILESTONE', 'MISSED_DAY', 'REENGAGEMENT', 'FOUNDER_WEEKLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "DeliveryChannel" AS ENUM ('IN_WIDGET', 'WEB_PUSH', 'EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('SCHEDULED', 'SENT', 'DELIVERED', 'FAILED', 'SUPPRESSED', 'READ');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT NOT NULL,
    "pronouns" TEXT NOT NULL DEFAULT 'bạn',
    "ftndScore" INTEGER,
    "quitDate" TIMESTAMP(3),
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    "riskyHours" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "topTriggers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "settings" JSONB NOT NULL DEFAULT '{}',
    "checkinStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastCheckinDate" TIMESTAMP(3),
    "missedDaysInRow" INTEGER NOT NULL DEFAULT 0,
    "totalDaysActive" INTEGER NOT NULL DEFAULT 0,
    "refundEligible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckIn" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "smoked" BOOLEAN NOT NULL,
    "smokeCount" INTEGER,
    "cravingIntensity" INTEGER NOT NULL,
    "mood" INTEGER NOT NULL,
    "hardestMoment" TEXT,
    "copingAction" TEXT,
    "win" TEXT,
    "note" TEXT,
    "isSickDay" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "exerciseKey" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ExerciseEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "type" "MessageType" NOT NULL DEFAULT 'CHAT',
    "content" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentItem" (
    "id" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "module" "ContentModule" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "wikiUrl" TEXT,
    "imageUrl" TEXT,
    "audioUrl" TEXT,
    "exerciseKey" TEXT,
    "exerciseSchema" JSONB,
    "pushTime" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserState" (
    "userId" TEXT NOT NULL,
    "state" "ConversationState" NOT NULL DEFAULT 'IDLE',
    "stateData" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserState_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "wikiUrl" TEXT,
    "ctaLabel" TEXT,
    "ctaAction" TEXT,
    "channels" "DeliveryChannel"[] DEFAULT ARRAY['IN_WIDGET']::"DeliveryChannel"[],
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "status" "DeliveryStatus" NOT NULL DEFAULT 'SCHEDULED',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrisisEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trigger" TEXT,
    "intensityStart" INTEGER,
    "intensityEnd" INTEGER,
    "stage" TEXT NOT NULL DEFAULT 'breathing',
    "durationSec" INTEGER,
    "resolvedAt" TIMESTAMP(3),
    "escalatedToHuman" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrisisEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpCode" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- CreateIndex
CREATE INDEX "CheckIn_userId_dayNumber_idx" ON "CheckIn"("userId", "dayNumber");

-- CreateIndex
CREATE UNIQUE INDEX "CheckIn_userId_date_key" ON "CheckIn"("userId", "date");

-- CreateIndex
CREATE INDEX "ExerciseEntry_userId_dayNumber_idx" ON "ExerciseEntry"("userId", "dayNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ExerciseEntry_userId_dayNumber_exerciseKey_key" ON "ExerciseEntry"("userId", "dayNumber", "exerciseKey");

-- CreateIndex
CREATE INDEX "Message_userId_createdAt_idx" ON "Message"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ContentItem_dayNumber_module_idx" ON "ContentItem"("dayNumber", "module");

-- CreateIndex
CREATE UNIQUE INDEX "ContentItem_dayNumber_module_exerciseKey_key" ON "ContentItem"("dayNumber", "module", "exerciseKey");

-- CreateIndex
CREATE INDEX "Notification_userId_scheduledAt_idx" ON "Notification"("userId", "scheduledAt");

-- CreateIndex
CREATE INDEX "Notification_status_scheduledAt_idx" ON "Notification"("status", "scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- CreateIndex
CREATE INDEX "CrisisEvent_userId_createdAt_idx" ON "CrisisEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "OtpCode_phone_createdAt_idx" ON "OtpCode"("phone", "createdAt");

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseEntry" ADD CONSTRAINT "ExerciseEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserState" ADD CONSTRAINT "UserState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrisisEvent" ADD CONSTRAINT "CrisisEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
