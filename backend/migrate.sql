-- ============================================================
-- EEU Infrastructure Protector — Safe Migration Script
-- Run this on your Aiven MySQL to add any missing columns/tables
-- Safe to run multiple times — uses IF NOT EXISTS / IF EXISTS
-- ============================================================

-- ── 1. users table — add missing columns ────────────────────
ALTER TABLE users
  MODIFY COLUMN role ENUM('citizen','approver','electrician','admin') NOT NULL DEFAULT 'citizen';

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS reset_token         VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS reset_token_expires DATETIME NULL;

-- ── 2. groups table (reserved word — use backticks) ─────────
CREATE TABLE IF NOT EXISTS `groups` (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── 3. teams table (backward compat) ────────────────────────
CREATE TABLE IF NOT EXISTS teams (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  team_name   VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── 4. group_members table ───────────────────────────────────
CREATE TABLE IF NOT EXISTS group_members (
  group_id  INT NOT NULL,
  user_id   INT NOT NULL,
  PRIMARY KEY (group_id, user_id),
  FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)  REFERENCES users(id)    ON DELETE CASCADE
);

-- ── 5. service_requests — add missing columns ────────────────
ALTER TABLE service_requests
  ADD COLUMN IF NOT EXISTS category
    ENUM('power_outage','billing','meter','connection','maintenance','other')
    NOT NULL DEFAULT 'other';

ALTER TABLE service_requests
  ADD COLUMN IF NOT EXISTS group_id INT NULL;

-- Add FK for group_id only if it doesn't already exist
SET @fk_exists = (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'service_requests'
    AND CONSTRAINT_NAME = 'fk_sr_group'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE service_requests ADD CONSTRAINT fk_sr_group FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ── 6. infrastructure table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS infrastructure (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  asset_code   VARCHAR(100) NOT NULL UNIQUE,
  asset_type   ENUM('pole','transformer','cable','substation','meter','other') NOT NULL DEFAULT 'other',
  description  TEXT,
  location     VARCHAR(255),
  latitude     DECIMAL(10,8),
  longitude    DECIMAL(11,8),
  status       ENUM('active','damaged','under_maintenance','decommissioned') NOT NULL DEFAULT 'active',
  qr_code      TEXT,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── 7. infrastructure_reports — add missing columns ──────────
CREATE TABLE IF NOT EXISTS infrastructure_reports (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  citizen_id        INT NOT NULL,
  infrastructure_id INT,
  asset_code        VARCHAR(100),
  report_type       ENUM('damage','outage','vandalism','maintenance','other') NOT NULL DEFAULT 'other',
  title             VARCHAR(200) NOT NULL,
  description       TEXT NOT NULL,
  photo_url         VARCHAR(500),
  latitude          DECIMAL(10,8),
  longitude         DECIMAL(11,8),
  location_address  VARCHAR(255),
  status            ENUM('open','assigned','resolved') NOT NULL DEFAULT 'open',
  assigned_team_id  INT,
  group_id          INT NULL,
  resolved_at       TIMESTAMP NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (citizen_id)        REFERENCES users(id)          ON DELETE CASCADE,
  FOREIGN KEY (infrastructure_id) REFERENCES infrastructure(id) ON DELETE SET NULL
);

-- Add group_id to existing infrastructure_reports if missing
ALTER TABLE infrastructure_reports
  ADD COLUMN IF NOT EXISTS group_id INT NULL;

-- ── 8. ratings table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ratings (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  request_id  INT NOT NULL,
  citizen_id  INT NOT NULL,
  rating      TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  feedback    TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_rating (request_id, citizen_id),
  FOREIGN KEY (request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (citizen_id) REFERENCES users(id)            ON DELETE CASCADE
);

-- ── Done ─────────────────────────────────────────────────────
SELECT 'Migration complete' AS status;
