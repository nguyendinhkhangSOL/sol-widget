-- ── Anonymous-first auth + Zalo OAuth bind ─────────────────────────
-- Idempotent migration — có thể chạy lại nếu lần trước fail giữa chừng.
--
-- 1) Phone không còn bắt buộc (NULLable) — user mới có thể tạo ẩn danh
--    với chỉ deviceUid. Phone bind sau khi user mua gói hoặc liên kết.
-- 2) Thêm deviceUid (UUID localStorage), zaloUserId (Zalo OAuth ID),
--    isAnonymous flag, originDomain (partner attribution).
--
-- Backfill: tất cả user hiện có đều xem là KHÔNG ẩn danh (đã có phone),
-- isAnonymous = false. Default schema = true CHỈ áp dụng cho user mới.

-- Step 1: drop unique index cũ trên phone (Prisma @unique = INDEX, không phải CONSTRAINT)
DROP INDEX IF EXISTS "User_phone_key";

-- Step 2: phone → nullable (idempotent — DROP NOT NULL không fail nếu đã nullable)
ALTER TABLE "User" ALTER COLUMN "phone" DROP NOT NULL;

-- Step 3: thêm các field mới (idempotent với IF NOT EXISTS)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deviceUid" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "zaloUserId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isAnonymous" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "originDomain" TEXT;

-- Step 4: recreate unique indexes (drop trước để tránh conflict nếu đã chạy 1 phần)
DROP INDEX IF EXISTS "User_deviceUid_key";
DROP INDEX IF EXISTS "User_zaloUserId_key";
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone") WHERE "phone" IS NOT NULL;
CREATE UNIQUE INDEX "User_deviceUid_key" ON "User"("deviceUid") WHERE "deviceUid" IS NOT NULL;
CREATE UNIQUE INDEX "User_zaloUserId_key" ON "User"("zaloUserId") WHERE "zaloUserId" IS NOT NULL;

-- Step 5: index cho query nhanh (idempotent)
DROP INDEX IF EXISTS "User_deviceUid_idx";
DROP INDEX IF EXISTS "User_zaloUserId_idx";
CREATE INDEX "User_deviceUid_idx" ON "User"("deviceUid");
CREATE INDEX "User_zaloUserId_idx" ON "User"("zaloUserId");
