/* ─────────────────────────────────────────────────────────────────────────────
   DebugMyCV — Postgres schema (Supabase-compatible)
   Idempotent: CREATE TABLE IF NOT EXISTS. Safe to run twice.
   Optional first-run database creation is handled by scripts/db-setup.mjs.
   ───────────────────────────────────────────────────────────────────────────── */

-- This must run inside a transaction so multi-statement scripts are atomic.
BEGIN;

-- ── users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(120)    NOT NULL,
  email         VARCHAR(255)    NOT NULL,
  password_hash VARCHAR(255)    NOT NULL,
  created_at    TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_users_email UNIQUE (email)
);

-- ── resumes ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resumes (
  id                  BIGSERIAL PRIMARY KEY,
  user_id             INTEGER         NOT NULL,
  original_filename   VARCHAR(255)    NOT NULL,
  storage_identifier  CHAR(36)        NOT NULL,
  extracted_text      TEXT            NULL,
  file_size           BIGINT          NOT NULL DEFAULT 0,
  content_hash        CHAR(64)        NULL,
  uploaded_at         TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_resumes_storage_identifier UNIQUE (storage_identifier),
  CONSTRAINT fk_resumes_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── job_descriptions ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_descriptions (
  id                BIGSERIAL PRIMARY KEY,
  user_id           INTEGER         NOT NULL,
  label             VARCHAR(160)    NOT NULL,
  description_text  TEXT            NOT NULL,
  created_at        TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_jobs_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── analyses ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analyses (
  id                  BIGSERIAL PRIMARY KEY,
  user_id             INTEGER         NOT NULL,
  resume_id           BIGINT          NULL,
  job_description_id  BIGINT          NULL,
  match_score         INTEGER         NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  result_json         JSONB           NOT NULL,
  model_name          VARCHAR(160)    NOT NULL,
  status              VARCHAR(24)     NOT NULL DEFAULT 'completed',
  created_at          TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_analyses_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_analyses_resume
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE SET NULL,
  CONSTRAINT fk_analyses_job
    FOREIGN KEY (job_description_id) REFERENCES job_descriptions(id) ON DELETE SET NULL
);

-- ── daily_usage ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_usage (
  id                            BIGSERIAL PRIMARY KEY,
  user_id                       INTEGER         NOT NULL,
  usage_date                    DATE            NOT NULL,
  successful_resume_upload_count INTEGER      NOT NULL DEFAULT 0,
  ai_analysis_count             INTEGER      NOT NULL DEFAULT 0,
  CONSTRAINT uq_daily_usage_user_date UNIQUE (user_id, usage_date),
  CONSTRAINT fk_daily_usage_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── sessions (Supabase/Postgres-compatible, Express-session compatible) ───────
CREATE TABLE IF NOT EXISTS sessions (
  session_id VARCHAR(128) NOT NULL,
  expires    BIGINT       NOT NULL,
  data       TEXT         NULL,
  CONSTRAINT sessions_pkey PRIMARY KEY (session_id)
);

-- ── 24-hour auto-delete retention (idempotent) ─────────────────────────────────
ALTER TABLE analyses     ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE resumes      ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE job_descriptions ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- Deleting a resume or job description now cascades to its analyses.
ALTER TABLE analyses DROP CONSTRAINT IF EXISTS fk_analyses_resume;
ALTER TABLE analyses DROP CONSTRAINT IF EXISTS fk_analyses_job;
ALTER TABLE analyses
  ADD CONSTRAINT fk_analyses_resume FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE;
ALTER TABLE analyses
  ADD CONSTRAINT fk_analyses_job FOREIGN KEY (job_description_id) REFERENCES job_descriptions(id) ON DELETE CASCADE;

-- ── Consent records (idempotent) ───────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS consent_at      timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS consent_version text;

COMMIT;
