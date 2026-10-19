-- 1. Create the Professors table
CREATE TABLE IF NOT EXISTS professors (
    professor_id SERIAL PRIMARY KEY,
    lecturer_key VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'stephen', 'rajshekar', 'sampath'
    lecturer_name VARCHAR(100) NOT NULL       -- e.g., 'Prof Stephen Suresh Babu'
);

-- 2. Create the Subjects table linked to each Professor
CREATE TABLE IF NOT EXISTS professor_subjects (
    subject_id SERIAL PRIMARY KEY,
    professor_id INT REFERENCES professors(professor_id) ON DELETE CASCADE,
    subject_key VARCHAR(50) NOT NULL,         -- e.g., 'synoptic', 'law', 'loc'
    subject_label VARCHAR(150) NOT NULL,      -- e.g., 'Synoptic Gospels'
    subject_telugu VARCHAR(100)               -- Optional localized text
);

-- 3. Seed Initial Data
INSERT INTO professors (lecturer_key, lecturer_name) VALUES
('stephen', 'Prof Stephen Suresh Babu'),
('rajshekar', 'Prof Rajshekar Sir'),
('sampath', 'Prof Sampath Kumar')
ON CONFLICT (lecturer_key) DO NOTHING;

-- Seed Subjects for Stephen
INSERT INTO professor_subjects (professor_id, subject_key, subject_label) VALUES
((SELECT professor_id FROM professors WHERE lecturer_key = 'stephen'), 'synoptic', 'Synoptic Gospels'),
((SELECT professor_id FROM professors WHERE lecturer_key = 'stephen'), 'actsEpistles', 'Acts & Epistles'),
((SELECT professor_id FROM professors WHERE lecturer_key = 'stephen'), 'homiletics', 'Homiletics');

-- Seed Subjects for Rajshekar
INSERT INTO professor_subjects (professor_id, subject_id, subject_label) VALUES
((SELECT professor_id FROM professors WHERE lecturer_key = 'rajshekar'), 'law', 'Law'),
((SELECT professor_id FROM professors WHERE lecturer_key = 'rajshekar'), 'history', 'History'),
((SELECT professor_id FROM professors WHERE lecturer_key = 'rajshekar'), 'poetic', 'Poetic & Wisdom'),
((SELECT professor_id FROM professors WHERE lecturer_key = 'rajshekar'), 'prophetic', 'Prophetic');

-- Seed Subjects for Sampath
INSERT INTO professor_subjects (professor_id, subject_key, subject_label, subject_telugu) VALUES
((SELECT professor_id FROM professors WHERE lecturer_key = 'sampath'), 'loc', 'Life of Christ', NULL),
((SELECT professor_id FROM professors WHERE lecturer_key = 'sampath'), 'locChronological', 'Life of Christ - Chronological Study', 'కాల్ క్రానికల్'),
((SELECT professor_id FROM professors WHERE lecturer_key = 'sampath'), 'evangelism', 'Evangelism & Missions', NULL);