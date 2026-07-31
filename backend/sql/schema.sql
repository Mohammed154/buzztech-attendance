-- BuzzTech Attendance Platform — Database Schema
-- Run this once against your PostgreSQL database before starting the backend.

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid()

-- ─────────────────────────────────────────────
-- ADMIN
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
    admin_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- PERSON  (Management members AND Participants, unified)
-- ─────────────────────────────────────────────
CREATE TYPE person_type_enum AS ENUM ('MANAGEMENT', 'PARTICIPANT');

CREATE TABLE IF NOT EXISTS people (
    person_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name          TEXT NOT NULL,
    class_year         TEXT,                       -- e.g. "TE Computer", "2nd Year BBA"
    enrollment_number  TEXT,                       -- student/member enrollment ID (optional, unique)
    person_type        person_type_enum NOT NULL,
    sub_team           TEXT NOT NULL,               -- Management: CORE / DOCUMENTATION / WEBSITE /
                                                   -- PROMOTION / SOCIAL_MEDIA_MARKETING
                                                   -- Participant: hackathon team name
    position           TEXT,                        -- e.g. "Lead", "Volunteer", "Team Lead", "Member"
    contact_number     TEXT,
    unique_code        TEXT NOT NULL UNIQUE,         -- auto-generated, e.g. MGT-CORE-0001
    is_active          BOOLEAN NOT NULL DEFAULT TRUE,
    onboarded_by       UUID REFERENCES admins(admin_id),
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_people_type_team ON people (person_type, sub_team);
CREATE INDEX IF NOT EXISTS idx_people_name ON people (full_name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_people_enrollment ON people (enrollment_number) WHERE enrollment_number IS NOT NULL;

-- ─────────────────────────────────────────────
-- ATTENDANCE RECORD  (one row per person per day)
-- ─────────────────────────────────────────────
CREATE TYPE attendance_status_enum AS ENUM ('CHECKED_IN', 'CHECKED_OUT', 'EDITED');

CREATE TABLE IF NOT EXISTS attendance_records (
    record_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id            UUID NOT NULL REFERENCES people(person_id),
    date                  DATE NOT NULL,
    check_in_time         TIMESTAMPTZ,
    check_out_time        TIMESTAMPTZ,
    marked_by_admin_id    UUID REFERENCES admins(admin_id),
    status                attendance_status_enum NOT NULL DEFAULT 'CHECKED_IN',
    is_manual_correction  BOOLEAN NOT NULL DEFAULT FALSE,
    notes                 TEXT,
    slot                  TEXT,
    UNIQUE (person_id, date)   -- enforces "one row per person per day"
);

CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records (date);
CREATE INDEX IF NOT EXISTS idx_attendance_person ON attendance_records (person_id);

-- ─────────────────────────────────────────────
-- ATTENDANCE SLOTS (for management team sessions)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance_slots (
    slot_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_label  TEXT NOT NULL UNIQUE,
    start_time  TIME NOT NULL,
    end_time    TIME NOT NULL
);

INSERT INTO attendance_slots (slot_label, start_time, end_time) VALUES
('Slot-1', '09:35:00', '11:30:00'),
('Slot-2', '12:15:00', '14:15:00'),
('Slot-3', '14:30:00', '16:25:00')
ON CONFLICT (slot_label) DO NOTHING;

-- ─────────────────────────────────────────────
-- Handy view for reporting (matches the tabular report fields exactly)
-- ─────────────────────────────────────────────
CREATE OR REPLACE VIEW attendance_report_view AS
SELECT
    p.full_name,
    p.class_year,
    p.enrollment_number,
    p.position,
    p.person_type,
    p.sub_team,
    p.unique_code,
    a.date,
    a.check_in_time,
    a.check_out_time,
    a.status,
    a.is_manual_correction,
    a.slot
FROM attendance_records a
JOIN people p ON p.person_id = a.person_id
ORDER BY a.date DESC, p.full_name ASC;
