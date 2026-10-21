-- 1. Create the Professors table
CREATE TABLE IF NOT EXISTS professors (
    professor_id SERIAL PRIMARY KEY,
    lecturer_key VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'stephen', 'rajshekar', 'sampath'
    lecturer_name VARCHAR(100) NOT NULL       -- e.g., 'Prof Stephen Suresh Babu'
);

-- 2. Create the standalone Subjects table
CREATE TABLE IF NOT EXISTS subjects (
    subject_id SERIAL PRIMARY KEY,
    subject_key VARCHAR(50) UNIQUE NOT NULL,  -- e.g., 'synoptic', 'law', 'loc'
    subject_label VARCHAR(150) NOT NULL       -- e.g., 'Synoptic Gospels'
);

-- 3. Create the Junction Table mapping Professors to Subjects
CREATE TABLE IF NOT EXISTS professor_subjects (
    id SERIAL PRIMARY KEY,
    professor_id INT REFERENCES professors(professor_id) ON DELETE CASCADE,
    subject_id INT REFERENCES subjects(subject_id) ON DELETE CASCADE,
    CONSTRAINT unique_prof_subject UNIQUE (professor_id, subject_id)
);

-- 4. Create the Normalized Student Evaluations Table
CREATE TABLE IF NOT EXISTS student_evaluations (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL,
    professor_id INT REFERENCES professors(professor_id) ON DELETE CASCADE,
    subject_id INT REFERENCES subjects(subject_id) ON DELETE CASCADE,
    exam BOOLEAN DEFAULT FALSE,
    notes BOOLEAN DEFAULT FALSE,
    classes BOOLEAN DEFAULT FALSE,
    permissions TEXT DEFAULT '0',
    video_file_name VARCHAR(255),
    CONSTRAINT unique_student_subject UNIQUE (student_id, subject_id)
);

-- 5. Seed Initial Professors
INSERT INTO professors (lecturer_key, lecturer_name) VALUES
('stephen', 'Prof Stephen Suresh Babu'),
('rajshekar', 'Prof Rajshekar Sir'),
('sampath', 'Prof Sampath Kumar')
ON CONFLICT (lecturer_key) DO NOTHING;

-- 6. Seed Global Subjects
INSERT INTO subjects (subject_key, subject_label) VALUES
('synoptic', 'Synoptic Gospels'),
('actsEpistles', 'Acts & Epistles'),
('homiletics', 'Homiletics'),
('law', 'Law'),
('history', 'History'),
('poetic', 'Poetic & Wisdom'),
('prophetic', 'Prophetic'),
('loc', 'Life of Christ'),
('locChronological', 'Life of Christ - Chronological Study'),
('evangelism', 'Evangelism & Missions')
ON CONFLICT (subject_key) DO NOTHING;

-- 7. Map Professors to their respective Subjects in the Junction Table
-- Mapping for Stephen
INSERT INTO professor_subjects (professor_id, subject_id) VALUES
((SELECT professor_id FROM professors WHERE lecturer_key = 'stephen'), (SELECT subject_id FROM subjects WHERE subject_key = 'synoptic')),
((SELECT professor_id FROM professors WHERE lecturer_key = 'stephen'), (SELECT subject_id FROM subjects WHERE subject_key = 'actsEpistles')),
((SELECT professor_id FROM professors WHERE lecturer_key = 'stephen'), (SELECT subject_id FROM subjects WHERE subject_key = 'homiletics'))
ON CONFLICT DO NOTHING;

-- Mapping for Rajshekar
INSERT INTO professor_subjects (professor_id, subject_id) VALUES
((SELECT professor_id FROM professors WHERE lecturer_key = 'rajshekar'), (SELECT subject_id FROM subjects WHERE subject_key = 'law')),
((SELECT professor_id FROM professors WHERE lecturer_key = 'rajshekar'), (SELECT subject_id FROM subjects WHERE subject_key = 'history')),
((SELECT professor_id FROM professors WHERE lecturer_key = 'rajshekar'), (SELECT subject_id FROM subjects WHERE subject_key = 'poetic')),
((SELECT professor_id FROM professors WHERE lecturer_key = 'rajshekar'), (SELECT subject_id FROM subjects WHERE subject_key = 'prophetic'))
ON CONFLICT DO NOTHING;

-- Mapping for Sampath
INSERT INTO professor_subjects (professor_id, subject_id) VALUES
((SELECT professor_id FROM professors WHERE lecturer_key = 'sampath'), (SELECT subject_id FROM subjects WHERE subject_key = 'loc')),
((SELECT professor_id FROM professors WHERE lecturer_key = 'sampath'), (SELECT subject_id FROM subjects WHERE subject_key = 'locChronological')),
((SELECT professor_id FROM professors WHERE lecturer_key = 'sampath'), (SELECT subject_id FROM subjects WHERE subject_key = 'evangelism'))
ON CONFLICT DO NOTHING;