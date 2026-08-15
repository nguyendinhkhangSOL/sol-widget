-- ===== LAT1 =====
-- ============================================================
-- LÁT 1 — HỒ SƠ CHUNG · migration thô (tương đương LAT1-ho-so-chung.prisma)
-- Idempotent: chạy lại nhiều lần không lỗi. CHẠY SAU KHI BACKUP.
-- Dev có thể dùng `prisma migrate` (khuyến nghị) HOẶC chạy file này.
-- DB: huongdi_prod (PostgreSQL 16). Bảng users đã tồn tại (id uuid).
-- ============================================================


-- ─── ENUMS (tạo nếu chưa có) ───────────────────────────────
DO $$ BEGIN
  CREATE TYPE "ProfileFieldSource" AS ENUM ('CV','PHONG_VAN','BAI_TEST','KHACH_KHAI','HE_SUY_RA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ProfileFieldStatus" AS ENUM ('DA_XAC_NHAN','CHUA_XAC_NHAN','CON_TRONG');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ConsentKind" AS ENUM ('CV_READ','VOICE','LABAN_TRANSFER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── job_profiles ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_profiles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  target_title text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ─── profile_fields (4 khối, có nhãn nguồn/trạng thái) ──────
CREATE TABLE IF NOT EXISTS profile_fields (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  uuid NOT NULL REFERENCES job_profiles(id) ON DELETE CASCADE,
  field_code  text NOT NULL,
  block_no    integer NOT NULL,
  value       text,
  source      "ProfileFieldSource",
  status      "ProfileFieldStatus" NOT NULL DEFAULT 'CON_TRONG',
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_profile_field UNIQUE (profile_id, field_code)
);
CREATE INDEX IF NOT EXISTS idx_profile_fields_status ON profile_fields (profile_id, status);

-- ─── profile_skills (gắn mã KN.*) ──────────────────────────
CREATE TABLE IF NOT EXISTS profile_skills (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  uuid NOT NULL REFERENCES job_profiles(id) ON DELETE CASCADE,
  skill_code  text NOT NULL,
  source      "ProfileFieldSource",
  status      "ProfileFieldStatus" NOT NULL DEFAULT 'CHUA_XAC_NHAN',
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_profile_skill UNIQUE (profile_id, skill_code)
);

-- ─── data_consents (mục 6 + Luật 91/2025) ──────────────────
CREATE TABLE IF NOT EXISTS data_consents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind        "ConsentKind" NOT NULL,
  granted     boolean NOT NULL DEFAULT false,
  granted_at  timestamptz,
  revoked_at  timestamptz,
  evidence    jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_consent UNIQUE (user_id, kind)
);


-- ─── KIỂM TRA (chạy sau, phải thấy 4 bảng) ─────────────────
-- SELECT table_name FROM information_schema.tables
-- WHERE table_name IN ('job_profiles','profile_fields','profile_skills','data_consents');

-- ===== LAT2 =====
-- ============================================================
-- LÁT 2 — migration thô (tương đương LAT2-cham-diem.prisma). Idempotent.
-- CHẠY SAU: backup + Lát 1 migration (job_profiles đã có).
-- ============================================================

DO $$ BEGIN
  CREATE TYPE "ApplyVia" AS ENUM ('TRANG_TUYEN_DUNG','NGUOI_QUEN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS cv_documents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  uuid NOT NULL REFERENCES job_profiles(id) ON DELETE CASCADE,
  label       text,
  is_original boolean NOT NULL DEFAULT false,
  file_url    text,
  parsed_text text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cv_documents_original ON cv_documents (profile_id, is_original);

CREATE TABLE IF NOT EXISTS job_targets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  uuid NOT NULL REFERENCES job_profiles(id) ON DELETE CASCADE,
  title       text,
  jd_raw      text NOT NULL,
  apply_via   "ApplyVia",
  required    jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS match_runs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id   uuid NOT NULL REFERENCES job_targets(id) ON DELETE CASCADE,
  score_first integer NOT NULL,
  score_now   integer NOT NULL,
  checklist   jsonb NOT NULL DEFAULT '[]'::jsonb,
  chieu2      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_match_runs_target ON match_runs (target_id, created_at);


-- ===== LAT3 =====
-- ============================================================
-- LÁT 3 — migration thô (tương đương LAT3-dung-ho-so.prisma). Idempotent.
-- CHẠY SAU: backup + Lát 1 (job_profiles, profile_fields, profile_skills, data_consents).
-- ============================================================

DO $$ BEGIN
  CREATE TYPE "BuildStatus" AS ENUM ('DANG_LAM','XONG','BO_DO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "AnswerSource" AS ENUM ('GO_TAY','CHON_GOI_Y','GIONG_NOI');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS build_sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  uuid NOT NULL REFERENCES job_profiles(id) ON DELETE CASCADE,
  status      "BuildStatus" NOT NULL DEFAULT 'DANG_LAM',
  step_no     integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_build_sessions_profile ON build_sessions (profile_id, status);

CREATE TABLE IF NOT EXISTS build_answers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    uuid NOT NULL REFERENCES build_sessions(id) ON DELETE CASCADE,
  question_code text NOT NULL,
  field_code    text,
  answer_text   text NOT NULL,
  source        "AnswerSource" NOT NULL DEFAULT 'GO_TAY',
  extracted     jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_build_answers_session ON build_answers (session_id, question_code);


-- ===== LAT4 =====
-- ============================================================
-- LÁT 4 — migration thô (tương đương LAT4-phong-van.prisma). Idempotent.
-- CHẠY SAU: backup + Lát 1 (job_profiles) + Lát 2 (job_targets).
-- ============================================================

DO $$ BEGIN
  CREATE TYPE "InterviewStatus" AS ENUM ('DANG_TAP','XONG','BO_DO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "QSource" AS ENUM ('TU_JD','HANH_VI','KHOANG_TRONG');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS interview_sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  uuid NOT NULL REFERENCES job_profiles(id) ON DELETE CASCADE,
  target_id   uuid REFERENCES job_targets(id) ON DELETE SET NULL,
  status      "InterviewStatus" NOT NULL DEFAULT 'DANG_TAP',
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_profile ON interview_sessions (profile_id, status);

CREATE TABLE IF NOT EXISTS interview_questions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  order_no    integer NOT NULL,
  q_source    "QSource" NOT NULL,
  ref_code    text,
  text        text NOT NULL,
  goi_y       text
);
CREATE INDEX IF NOT EXISTS idx_interview_questions_session ON interview_questions (session_id, order_no);

CREATE TABLE IF NOT EXISTS interview_answers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL UNIQUE REFERENCES interview_questions(id) ON DELETE CASCADE,
  audio_url   text,
  transcript  text,
  seconds     integer,
  self_note   text,
  feedback    jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);


-- ===== LAT5 =====
-- ============================================================
-- LÁT 5 — migration thô (tương đương LAT5-thu-ung-tuyen.prisma). Idempotent.
-- CHẠY SAU: backup + Lát 1 (job_profiles) + Lát 2 (job_targets).
-- ============================================================

CREATE TABLE IF NOT EXISTS cover_letters (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  uuid NOT NULL REFERENCES job_profiles(id) ON DELETE CASCADE,
  target_id   uuid NOT NULL REFERENCES job_targets(id)  ON DELETE CASCADE,
  to_name     text,
  body        text NOT NULL,
  edited      boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cover_letters_profile_target ON cover_letters (profile_id, target_id);


-- ===== LAT6 =====
-- ============================================================
-- LÁT 6 — migration thô (tương đương LAT6-ban-giao-labansol.prisma). Idempotent.
-- CHẠY SAU: backup + Lát 1 (job_profiles, profile_skills).
-- KHÔNG đụng bảng `models` (chỉ đọc). Chỉ tạo bảng lưu kết quả map.
-- ============================================================

CREATE TABLE IF NOT EXISTS model_match_runs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  uuid NOT NULL REFERENCES job_profiles(id) ON DELETE CASCADE,
  results     jsonb NOT NULL DEFAULT '[]'::jsonb,
  top_mh_id   text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_model_match_runs_profile ON model_match_runs (profile_id, created_at);


