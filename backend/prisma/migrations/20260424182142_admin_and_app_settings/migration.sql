-- Admin role + AppSetting store for runtime-editable configuration
-- (AI provider selection, API key, model, quotas, etc.)

-- 1. Add isAdmin column to User
ALTER TABLE "User" ADD COLUMN "isAdmin" BOOLEAN NOT NULL DEFAULT false;

-- 2. AppSetting: generic key/value JSON store
CREATE TABLE "AppSetting" (
  "key"       TEXT NOT NULL,
  "value"     JSONB NOT NULL DEFAULT '{}',
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "updatedBy" TEXT,

  CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);
