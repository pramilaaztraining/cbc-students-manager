-- =========================================================================
-- CHRIST BIBLE COLLEGE (CBC) BANGALORE - COMPLETE DATABASE & CASCADE SETUP
-- =========================================================================

-- Note: Run this command first if creating the database from scratch:
--CREATE DATABASE cbc_db;
---\c cbc_db;
-- -------------------------------------------------------------------------
-- 1. DROP EXISTING TABLES (If resetting in correct dependency order)
-- -------------------------------------------------------------------------
DROP TABLE IF EXISTS topical_division_items CASCADE;
DROP TABLE IF EXISTS topical_divisions CASCADE;
DROP TABLE IF EXISTS nt_books CASCADE;
DROP TABLE IF EXISTS nt_divisions CASCADE;
DROP TABLE IF EXISTS ot_books CASCADE;
DROP TABLE IF EXISTS ot_divisions CASCADE;
DROP TABLE IF EXISTS student_stays CASCADE;
DROP TABLE IF EXISTS student_evaluations CASCADE;
DROP TABLE IF EXISTS professor_subjects CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS professors CASCADE;
DROP TABLE IF EXISTS students CASCADE;


-- -------------------------------------------------------------------------
-- 2. CREATE TABLES WITH CASCADING DELETES
-- -------------------------------------------------------------------------

-- Core Students Table
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    district VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(100) NOT NULL,
    course VARCHAR(100) NOT NULL,
    batch VARCHAR(100) NOT NULL,
    photo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Professors Table
CREATE TABLE professors (
    professor_id SERIAL PRIMARY KEY,
    lecturer_key VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'stephen', 'rajshekar', 'sampath'
    lecturer_name VARCHAR(100) NOT NULL       -- e.g., 'Prof Stephen Suresh Babu'
);

-- Standalone Subjects Table
CREATE TABLE subjects (
    subject_id SERIAL PRIMARY KEY,
    subject_key VARCHAR(50) UNIQUE NOT NULL,  -- e.g., 'synoptic', 'law', 'loc'
    subject_label VARCHAR(150) NOT NULL       -- e.g., 'Synoptic Gospels'
);

-- Junction Table: Professors to Subjects (Cascades if professor or subject is deleted)
CREATE TABLE professor_subjects (
    id SERIAL PRIMARY KEY,
    professor_id INT REFERENCES professors(professor_id) ON DELETE CASCADE,
    subject_id INT REFERENCES subjects(subject_id) ON DELETE CASCADE,
    CONSTRAINT unique_prof_subject UNIQUE (professor_id, subject_id)
);

-- Student Academic Evaluations Table (Cascades if student, professor, or subject is deleted)
CREATE TABLE student_evaluations (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(id) ON DELETE CASCADE,
    professor_id INT REFERENCES professors(professor_id) ON DELETE CASCADE,
    subject_id INT REFERENCES subjects(subject_id) ON DELETE CASCADE,
    exam BOOLEAN DEFAULT FALSE,
    notes BOOLEAN DEFAULT FALSE,
    classes BOOLEAN DEFAULT FALSE,
    permissions TEXT DEFAULT '0',
    video_file_name VARCHAR(255),
    CONSTRAINT unique_student_subject UNIQUE (student_id, subject_id)
);

-- store the new Practical (Student Academic Evaluations)- Morning Devotion data (preaching, hosting, singing, and attendance_score).
CREATE TABLE IF NOT EXISTS student_devotions (
    id SERIAL PRIMARY KEY,
    student_id INTEGER UNIQUE REFERENCES students(id) ON DELETE CASCADE,
    preaching BOOLEAN DEFAULT FALSE,
    hosting BOOLEAN DEFAULT FALSE,
    singing BOOLEAN DEFAULT FALSE,
    attendance_score INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student Stays & Accommodation Table (Cascades if student is deleted)
CREATE TABLE student_stays (
    id SERIAL PRIMARY KEY,
    student_id INT UNIQUE NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  --  accommodation VARCHAR(255),
  --  post_grad_stay VARCHAR(255),
    stay_start_date_time TIMESTAMP,
    stay_end_date_time TIMESTAMP,
    family_parents VARCHAR(100),
    children_count INT DEFAULT 0,
    brothers_count INT DEFAULT 0,
    sisters_count INT DEFAULT 0,
    stay_notes TEXT
);

-- Old Testament Canon Tables
CREATE TABLE ot_divisions (
    division_id SERIAL PRIMARY KEY,
    testament VARCHAR(50) NOT NULL, 
    division_name VARCHAR(100) NOT NULL, 
    division_code VARCHAR(50),
    sort_order INT NOT NULL 
);

CREATE TABLE ot_books (
    book_id SERIAL PRIMARY KEY,
    division_id INT REFERENCES ot_divisions(division_id) ON DELETE CASCADE,
    book_name VARCHAR(100) NOT NULL,
    chapter_count INT,
    traditional_order INT NOT NULL 
);

-- New Testament Canon Tables
CREATE TABLE nt_divisions (
    division_id SERIAL PRIMARY KEY,
    testament VARCHAR(50) NOT NULL, 
    division_name VARCHAR(100) NOT NULL, 
    division_code VARCHAR(50) NOT NULL, 
    sort_order INT NOT NULL 
);

CREATE TABLE nt_books (
    book_id SERIAL PRIMARY KEY,
    division_id INT REFERENCES nt_divisions(division_id) ON DELETE CASCADE,
    book_name VARCHAR(100) NOT NULL,
    chapter_count INT,
    traditional_order INT NOT NULL 
);

-- Topical / Thematic Divisions (Life of Christ & Evangelism)
CREATE TABLE topical_divisions (
    division_id SERIAL PRIMARY KEY,
    subject_name VARCHAR(100) NOT NULL, 
    division_code VARCHAR(50) NOT NULL UNIQUE, 
    sort_order INT NOT NULL
);

CREATE TABLE topical_division_items (
    item_id SERIAL PRIMARY KEY,
    division_id INT REFERENCES topical_divisions(division_id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL, 
    reference_details VARCHAR(100), 
    display_order INT NOT NULL
);


-- -------------------------------------------------------------------------
-- 3. SEED INITIAL DATA
-- -------------------------------------------------------------------------

-- Seed Professors
INSERT INTO professors (lecturer_key, lecturer_name) VALUES
('stephen', 'Prof Stephen Suresh Babu'),
('rajshekar', 'Prof Rajshekar Sir'),
('sampath', 'Prof Sampath Kumar')
ON CONFLICT (lecturer_key) DO NOTHING;

-- Seed Global Subjects
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

-- Map Professors to Subjects
INSERT INTO professor_subjects (professor_id, subject_id) VALUES
((SELECT professor_id FROM professors WHERE lecturer_key = 'stephen'), (SELECT subject_id FROM subjects WHERE subject_key = 'synoptic')),
((SELECT professor_id FROM professors WHERE lecturer_key = 'stephen'), (SELECT subject_id FROM subjects WHERE subject_key = 'actsEpistles')),
((SELECT professor_id FROM professors WHERE lecturer_key = 'stephen'), (SELECT subject_id FROM subjects WHERE subject_key = 'homiletics')),
((SELECT professor_id FROM professors WHERE lecturer_key = 'rajshekar'), (SELECT subject_id FROM subjects WHERE subject_key = 'law')),
((SELECT professor_id FROM professors WHERE lecturer_key = 'rajshekar'), (SELECT subject_id FROM subjects WHERE subject_key = 'history')),
((SELECT professor_id FROM professors WHERE lecturer_key = 'rajshekar'), (SELECT subject_id FROM subjects WHERE subject_key = 'poetic')),
((SELECT professor_id FROM professors WHERE lecturer_key = 'rajshekar'), (SELECT subject_id FROM subjects WHERE subject_key = 'prophetic')),
((SELECT professor_id FROM professors WHERE lecturer_key = 'sampath'), (SELECT subject_id FROM subjects WHERE subject_key = 'loc')),
((SELECT professor_id FROM professors WHERE lecturer_key = 'sampath'), (SELECT subject_id FROM subjects WHERE subject_key = 'locChronological')),
((SELECT professor_id FROM professors WHERE lecturer_key = 'sampath'), (SELECT subject_id FROM subjects WHERE subject_key = 'evangelism'))
ON CONFLICT DO NOTHING;

-- Seed Old Testament Divisions
INSERT INTO ot_divisions (division_id, testament, division_name, division_code, sort_order) VALUES
(1, 'Old Testament', 'The Pentateuch (The Law)', 'pentateuch', 1),
(2, 'Old Testament', 'Historical Books', 'history', 2),
(3, 'Old Testament', 'Poetry and Wisdom Literature', 'wisdom', 3),
(4, 'Old Testament', 'Major Prophets', 'major_prophets', 4),
(5, 'Old Testament', 'Minor Prophets', 'minor_prophets', 5)
ON CONFLICT DO NOTHING;

-- Seed Old Testament Books
INSERT INTO ot_books (division_id, book_name, chapter_count, traditional_order) VALUES
(1, 'Genesis', 50, 1), (1, 'Exodus', 40, 2), (1, 'Leviticus', 27, 3), (1, 'Numbers', 36, 4), (1, 'Deuteronomy', 34, 5),
(2, 'Joshua', 24, 6), (2, 'Judges', 21, 7), (2, 'Ruth', 4, 8), (2, '1 Samuel', 31, 9), (2, '2 Samuel', 24, 10),
(2, '1 Kings', 22, 11), (2, '2 Kings', 25, 12), (2, '1 Chronicles', 29, 13), (2, '2 Chronicles', 36, 14), (2, 'Ezra', 10, 15),
(2, 'Nehemiah', 13, 16), (2, 'Esther', 10, 17),
(3, 'Job', 42, 18), (3, 'Psalms', 150, 19), (3, 'Proverbs', 31, 20), (3, 'Ecclesiastes', 12, 21), (3, 'Song of Solomon', 8, 22),
(4, 'Isaiah', 66, 23), (4, 'Jeremiah', 52, 24), (4, 'Lamentations', 5, 25), (4, 'Ezekiel', 48, 26), (4, 'Daniel', 12, 27),
(5, 'Hosea', 14, 28), (5, 'Joel', 3, 29), (5, 'Amos', 9, 30), (5, 'Obadiah', 1, 31), (5, 'Jonah', 4, 32),
(5, 'Micah', 7, 33), (5, 'Nahum', 3, 34), (5, 'Habakkuk', 3, 35), (5, 'Zephaniah', 3, 36), (5, 'Haggai', 2, 37),
(5, 'Zechariah', 14, 38), (5, 'Malachi', 4, 39)
ON CONFLICT DO NOTHING;

-- Seed New Testament Divisions
INSERT INTO nt_divisions (division_id, testament, division_name, division_code, sort_order) VALUES
(1, 'New Testament', 'Gospels', 'gospels', 1),
(2, 'New Testament', 'Church History', 'acts', 2),
(3, 'New Testament', 'Pauline Epistles', 'pauline', 3),
(4, 'New Testament', 'General Epistles', 'general', 4),
(5, 'New Testament', 'Prophetic', 'prophetic', 5)
ON CONFLICT DO NOTHING;

-- Seed New Testament Books
INSERT INTO nt_books (division_id, book_name, chapter_count, traditional_order) VALUES
(1, 'Matthew', 28, 1), (1, 'Mark', 16, 2), (1, 'Luke', 24, 3), (1, 'John', 21, 4),
(2, 'Acts', 28, 5),
(3, 'Romans', 16, 6), (3, '1 Corinthians', 16, 7), (3, '2 Corinthians', 13, 8), (3, 'Galatians', 6, 9), (3, 'Ephesians', 6, 10),
(3, 'Philippians', 4, 11), (3, 'Colossians', 4, 12), (3, '1 Thessalonians', 5, 13), (3, '2 Thessalonians', 3, 14), (3, '1 Timothy', 6, 15),
(3, '2 Timothy', 4, 16), (3, 'Titus', 3, 17), (3, 'Philemon', 1, 18),
(4, 'Hebrews', 13, 19), (4, 'James', 5, 20), (4, '1 Peter', 5, 21), (4, '2 Peter', 3, 22), (4, '1 John', 5, 23),
(4, '2 John', 1, 24), (4, '3 John', 1, 25), (4, 'Jude', 1, 26),
(5, 'Revelation', 22, 27)
ON CONFLICT DO NOTHING;

-- Seed Topical Divisions
INSERT INTO topical_divisions (division_id, subject_name, division_code, sort_order) VALUES
(1, 'Life of Christ', 'loc', 1),
(2, 'Life of Christ - Chronological', 'locChronological', 2),
(3, 'Evangelism & Missions', 'evangelism', 3)
ON CONFLICT (division_code) DO NOTHING;

-- Seed Topical Division Items
INSERT INTO topical_division_items (division_id, title, reference_details, display_order) VALUES
(1, 'The Eternal Word & Incarnation', 'John 1; Matthew 1; Luke 1', 1),
(1, 'Ministry in Galilee', 'Matthew 4-18; Mark 1-9', 2),
(1, 'Passion Week, Crucifixion & Resurrection', 'Matthew 21-28; John 12-21', 3),
(2, 'Phase 1: Pre-existence, Birth & Childhood', 'Luke 1-2; Matthew 1-2', 1),
(2, 'Phase 2: Baptism, Temptation & Early Judean Ministry', 'John 1-4; Matthew 3-4', 2),
(2, 'Phase 3: The Great Galilean Ministry', 'Matthew 5-13; Mark 2-6', 3),
(2, 'Phase 4: Later Judean & Perean Ministry', 'Luke 10-19; John 7-11', 4),
(2, 'Phase 5: Passion Week, Resurrection & Ascension', 'Matthew 21-28; Acts 1', 5),
(3, 'The Great Commission Mandate', 'Matthew 28:18-20; Acts 1:8', 1),
(3, 'Early Jerusalem Church & Witness', 'Acts 1-7', 2),
(3, 'Pauline Missionary Journeys', 'Acts 13-28', 3),
(3, 'Theological Foundations for Witness', 'Romans 10; 2 Corinthians 5', 4)
ON CONFLICT DO NOTHING;