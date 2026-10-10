-- ─────────────────────────────────────────────────────────────────────────────
-- CareerLens AI — MySQL schema
-- Safe / idempotent: uses CREATE DATABASE IF NOT EXISTS and CREATE TABLE
-- IF NOT EXISTS. It never drops tables or deletes existing user data.
--
-- Usage:  mysql -u root -p < database/schema.sql
-- ─────────────────────────────────────────────────────────────────────────────

CREATE DATABASE IF NOT EXISTS `careerlens_ai`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `careerlens_ai`;

-- ── users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `users` (
  `id`            INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  `name`          VARCHAR(120)     NOT NULL,
  `email`         VARCHAR(255)     NOT NULL,
  `password_hash` VARCHAR(255)     NOT NULL,
  `created_at`    TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE = InnoDB;

-- ── resumes ──────────────────────────────────────────────────────────────────
-- PDFs are stored under a server-private directory using a generated UUID;
-- user supplied filenames are never used as filesystem paths.
CREATE TABLE IF NOT EXISTS `resumes` (
  `id`                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`           INT UNSIGNED    NOT NULL,
  `original_filename` VARCHAR(255)    NOT NULL,
  `storage_identifier` CHAR(36)       NOT NULL,
  `extracted_text`    MEDIUMTEXT      NULL,
  `file_size`         INT UNSIGNED    NOT NULL DEFAULT 0,
  `content_hash`      CHAR(64)        NULL,
  `uploaded_at`       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_resumes_storage_identifier` (`storage_identifier`),
  KEY `idx_resumes_user_uploaded_at` (`user_id`, `uploaded_at`),
  CONSTRAINT `fk_resumes_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB;

-- ── job_descriptions ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `job_descriptions` (
  `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`          INT UNSIGNED    NOT NULL,
  `label`            VARCHAR(160)    NOT NULL,
  `description_text` MEDIUMTEXT      NOT NULL,
  `created_at`       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_jobs_user_created_at` (`user_id`, `created_at`),
  CONSTRAINT `fk_jobs_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB;

-- ── analyses ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `analyses` (
  `id`                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`            INT UNSIGNED    NOT NULL,
  `resume_id`          BIGINT UNSIGNED NULL,
  `job_description_id` BIGINT UNSIGNED NULL,
  `match_score`        TINYINT UNSIGNED NOT NULL,
  `result_json`        JSON            NOT NULL,
  `model_name`         VARCHAR(160)    NOT NULL,
  `status`             VARCHAR(24)     NOT NULL DEFAULT 'completed',
  `created_at`         TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_analyses_user_created_at` (`user_id`, `created_at`),
  KEY `idx_analyses_resume` (`resume_id`),
  KEY `idx_analyses_job` (`job_description_id`),
  CONSTRAINT `fk_analyses_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_analyses_resume`
    FOREIGN KEY (`resume_id`) REFERENCES `resumes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_analyses_job`
    FOREIGN KEY (`job_description_id`) REFERENCES `job_descriptions` (`id`) ON DELETE SET NULL
) ENGINE = InnoDB;

-- ── daily_usage ──────────────────────────────────────────────────────────────
-- One row per (user, Asia/Kolkata calendar day). Quota enforcement uses
-- atomic conditional UPDATEs against this table, so concurrent requests can
-- never exceed the configured maximums.
CREATE TABLE IF NOT EXISTS `daily_usage` (
  `id`                            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`                       INT UNSIGNED    NOT NULL,
  `usage_date`                    DATE            NOT NULL,
  `successful_resume_upload_count` INT UNSIGNED    NOT NULL DEFAULT 0,
  `ai_analysis_count`             INT UNSIGNED    NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_daily_usage_user_date` (`user_id`, `usage_date`),
  KEY `idx_daily_usage_date` (`usage_date`),
  CONSTRAINT `fk_daily_usage_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB;

-- ── sessions ─────────────────────────────────────────────────────────────────
-- Created automatically by express-mysql-session on first server start; the
-- statement below is included so a DBA can provision it ahead of time.
CREATE TABLE IF NOT EXISTS `sessions` (
  `session_id` VARCHAR(128) NOT NULL,
  `expires`    INT UNSIGNED NOT NULL,
  `data`       MEDIUMTEXT   NULL,
  PRIMARY KEY (`session_id`),
  KEY `idx_sessions_expires` (`expires`)
) ENGINE = InnoDB;
