-- Fix encoding cho admin user (Khang) — "Kh??ch A07C" → tên đẹp
-- Set tên + pronouns đúng cho admin
UPDATE "User"
SET "name" = 'Khang Sol',
    "pronouns" = 'anh'
WHERE "isAdmin" = true
  AND ("name" LIKE 'Kh??ch%' OR "name" LIKE '%???%' OR "name" IS NULL);

-- Sweep tất cả user có name "Kh??ch" → đổi thành "Khách"
-- (User anonymous Sol auto-generate name "Khách XXXX" — bị encoding hỏng từ máy cũ)
UPDATE "User"
SET "name" = REPLACE("name", 'Kh??ch', 'Khách')
WHERE "name" LIKE 'Kh??ch%';

-- Verify
SELECT id, name, pronouns, "isAdmin"
FROM "User"
WHERE "isAdmin" = true OR "name" LIKE 'Kh%';
