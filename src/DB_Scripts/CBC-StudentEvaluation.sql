-- 1. Drop or recreate student_evaluations to use proper foreign keys


CREATE TABLE professors (
    professor_id SERIAL PRIMARY KEY,
    lecturer_key VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'PROF_STEPHEN'
    lecturer_name VARCHAR(100) NOT NULL     -- e.g., 'Prof Stephen Suresh Babu'
);

CREATE TABLE subjects (
    subject_id SERIAL PRIMARY KEY,
    subject_key VARCHAR(50) UNIQUE NOT NULL,
    subject_label VARCHAR(150) NOT NULL
);

-- 2. Migrate existing unique subjects from the old table (if data exists)
INSERT INTO subjects (subject_key, subject_label)
SELECT DISTINCT subject_key, subject_label 
FROM professor_subjects
ON CONFLICT (subject_key) DO NOTHING;

-- 3. Create a clean junction/mapping table for Professors and Subjects
DROP TABLE IF EXISTS professor_subjects CASCADE;

CREATE TABLE professor_subjects (
    id SERIAL PRIMARY KEY,
    professor_id INT REFERENCES professors(professor_id) ON DELETE CASCADE,
    subject_id INT REFERENCES subjects(subject_id) ON DELETE CASCADE,
    CONSTRAINT unique_prof_subject UNIQUE (professor_id, subject_id)
);

CREATE TABLE student_evaluations (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL,
    professor_id INT REFERENCES professors(professor_id) ON DELETE CASCADE,
    subject_id INT REFERENCES subjects(subject_id) ON DELETE CASCADE,
    exam BOOLEAN DEFAULT FALSE,
    notes BOOLEAN DEFAULT FALSE,
    classes BOOLEAN DEFAULT FALSE,
    permissions TEXT DEFAULT '0',
    video_file_name VARCHAR(255),
    
    -- Ensures a student has only one evaluation row per subject, allowing the upsert to work smoothly
    CONSTRAINT unique_student_subject UNIQUE (student_id, subject_id)
);