-- backend/prisma/manual_migration_email_auth.sql
-- Email magic link auth (2026-05-06).
-- Idempotent: dùng IF NOT EXISTS, có thể chạy lại nhiều lần an toàn.
-- Chạy:
--   Get-Content backend\prisma\manual_migration_email_auth.sql | docker compose exec -T db psql -U sol -d sol

BEGIN;

-- ─── EmailVerificationToken table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS "EmailVerificationToken" (
  "token"      TEXT PRIMARY KEY,
  "email"      TEXT NOT NULL,
  "fromUserId" TEXT,
  "expiresAt"  TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "EmailVerificationToken_email_createdAt_idx"
  ON "EmailVerificationToken"("email", "createdAt");

CREATE INDEX IF NOT EXISTS "EmailVerificationToken_expiresAt_idx"
  ON "EmailVerificationToken"("expiresAt");

-- ─── Verify ─────────────────────────────────────────────────────────────
SELECT
  'EmailVerificationToken' AS table_name,
  COUNT(*) AS rows
FROM "EmailVerificationToken";

COMMIT;
