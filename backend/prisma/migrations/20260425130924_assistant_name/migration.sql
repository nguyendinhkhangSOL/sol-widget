-- Onboarding mở rộng:
-- 1. pronouns vẫn là String (sẵn) → cho phép tuỳ chỉnh "Ngài", "Đại ca"…
--    Không cần sửa schema, chỉ relax validation backend.
-- 2. Thêm assistantName: tên user dùng để gọi trợ lý Sol
--    ("Sol Trợ lý", "Sol Phó tướng", "Sol Đồng hành", hoặc tuỳ chỉnh).

ALTER TABLE "User"
  ADD COLUMN "assistantName" TEXT NOT NULL DEFAULT 'Sol Đồng hành';
