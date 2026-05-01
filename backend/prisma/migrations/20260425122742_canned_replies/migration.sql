-- Canned quick-reply chips for widget chat.
-- Founder/admin biên tập trước; widget render NGAY (không qua AI).

CREATE TABLE "CannedReply" (
  "id"        TEXT NOT NULL,
  "slug"      TEXT NOT NULL,
  "label"     TEXT NOT NULL,
  "icon"      TEXT NOT NULL DEFAULT '💬',
  "answer"    TEXT NOT NULL,
  "wikiUrl"   TEXT,
  "wikiLabel" TEXT,
  "reusable"  BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 100,
  "enabled"   BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CannedReply_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CannedReply_slug_key" ON "CannedReply"("slug");
CREATE INDEX "CannedReply_enabled_sortOrder_idx" ON "CannedReply"("enabled", "sortOrder");
