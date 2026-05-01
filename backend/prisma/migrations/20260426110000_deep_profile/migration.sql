-- Deep profile fields for personalization (Group 1)
-- All optional → existing users không bị ảnh hưởng, default rỗng/null.

ALTER TABLE "User"
  ADD COLUMN "age" INTEGER,
  ADD COLUMN "yearsSmoked" INTEGER,
  ADD COLUMN "quitReasons" TEXT[] DEFAULT ARRAY[]::TEXT[];
