-- Ensure table exists with correct schema
CREATE TABLE IF NOT EXISTS student_stays (
    id SERIAL PRIMARY KEY,
    student_id INTEGER UNIQUE NOT NULL,
    accommodation VARCHAR(255),
    post_grad_stay VARCHAR(255),
    stay_start_date_time TIMESTAMP,
    stay_end_date_time TIMESTAMP,
    family_parents VARCHAR(100),
    children_count INTEGER DEFAULT 0,
    brothers_count INTEGER DEFAULT 0,
    sisters_count INTEGER DEFAULT 0,
    stay_notes TEXT
);

-- Ensure columns exist if table was already created previously
ALTER TABLE student_stays ADD COLUMN IF NOT EXISTS accommodation VARCHAR(255);
ALTER TABLE student_stays ADD COLUMN IF NOT EXISTS post_grad_stay VARCHAR(255);
ALTER TABLE student_stays ADD COLUMN IF NOT EXISTS stay_start_date_time TIMESTAMP;
ALTER TABLE student_stays ADD COLUMN IF NOT EXISTS stay_end_date_time TIMESTAMP;
ALTER TABLE student_stays ADD COLUMN IF NOT EXISTS family_parents VARCHAR(100);
ALTER TABLE student_stays ADD COLUMN IF NOT EXISTS children_count INTEGER DEFAULT 0;
ALTER TABLE student_stays ADD COLUMN IF NOT EXISTS brothers_count INTEGER DEFAULT 0;
ALTER TABLE student_stays ADD COLUMN IF NOT EXISTS sisters_count INTEGER DEFAULT 0;
ALTER TABLE student_stays ADD COLUMN IF NOT EXISTS stay_notes TEXT;

-- Ensure UNIQUE constraint on student_id for upserts
ALTER TABLE student_stays DROP CONSTRAINT IF EXISTS student_stays_student_id_key;
ALTER TABLE student_stays ADD CONSTRAINT student_stays_student_id_key UNIQUE (student_id);