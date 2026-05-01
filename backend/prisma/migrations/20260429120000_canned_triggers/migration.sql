-- Add trigger fields to CannedReply for intent matching in chat widget.
-- triggers: array of phrases user might type → match → return canned answer instantly
-- priority: higher = match first when multiple chips overlap
-- minScore: confidence threshold (0-1, default 0.5)

ALTER TABLE "CannedReply"
  ADD COLUMN "triggers" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 100,
  ADD COLUMN "minScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5;

CREATE INDEX "CannedReply_priority_idx" ON "CannedReply"("priority");
