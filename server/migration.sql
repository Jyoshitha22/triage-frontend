
-- Run this ONCE against your EXISTING database. init_db() in the
-- backend only creates brand-new tables (hospital_admins) — it can't
-- add columns to tables you already created, so this does that part.

ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS hospital_type   VARCHAR(50);
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS registration_id VARCHAR(60);
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS city            VARCHAR(100);
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS state           VARCHAR(100);

ALTER TABLE doctors ADD COLUMN IF NOT EXISTS hospital_id       INT REFERENCES hospitals(hospital_id);
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS email             VARCHAR(100) UNIQUE;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS password_hash     VARCHAR(255);
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS languages_spoken  VARCHAR(200);
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS qualification     VARCHAR(100);
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS is_available      BOOLEAN DEFAULT TRUE;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS is_active         BOOLEAN DEFAULT TRUE;

ALTER TABLE patients ADD COLUMN IF NOT EXISTS email       VARCHAR(100) UNIQUE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS city        VARCHAR(100);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS allergies   TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS conditions  TEXT;

ALTER TABLE symptom_records ADD COLUMN IF NOT EXISTS original_text TEXT;

ALTER TABLE doctor_responses ADD COLUMN IF NOT EXISTS original_text TEXT;

-- hospital_admins is created automatically by the backend on first run
-- (init_db()), but here's the equivalent DDL for reference:
-- CREATE TABLE IF NOT EXISTS hospital_admins (
--     admin_id SERIAL PRIMARY KEY,
--     email VARCHAR(100) NOT NULL UNIQUE,
--     password_hash VARCHAR(255) NOT NULL,
--     hospital_id INT REFERENCES hospitals(hospital_id),
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );