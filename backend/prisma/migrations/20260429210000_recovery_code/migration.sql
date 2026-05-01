-- Layer 3: Recovery code (offline rescue)
-- Bcrypt hash của 12-ký-tự code. NULL = chưa generate (anon user, hoặc user
-- bind trước khi feature này deploy). Code plaintext chỉ hiện 1 lần khi sinh.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "recoveryCodeHash" TEXT;
