-- 1. Create the New Testament Divisions table
CREATE TABLE nt_divisions (
    division_id SERIAL PRIMARY KEY,
    testament VARCHAR(50) NOT NULL, -- 'New Testament'
    division_name VARCHAR(100) NOT NULL, -- Full display name
    division_code VARCHAR(50) NOT NULL, -- Short key matching your UI (e.g., 'gospels', 'pauline')
    sort_order INT NOT NULL -- Keeps the categories in standard canonical order
);

-- 2. Create the New Testament Books table
CREATE TABLE nt_books (
    book_id SERIAL PRIMARY KEY,
    division_id INT REFERENCES nt_divisions(division_id) ON DELETE CASCADE,
    book_name VARCHAR(100) NOT NULL,
    chapter_count INT, -- Helpful for application chapter lists/references
    traditional_order INT NOT NULL -- Standard 1-to-27 canonical ordering
);

-- 3. Insert the New Testament Divisions with short codes
INSERT INTO nt_divisions (division_id, testament, division_name, division_code, sort_order) VALUES
(1, 'New Testament', 'Gospels', 'gospels', 1),
(2, 'New Testament', 'Church History', 'acts', 2),
(3, 'New Testament', 'Pauline Epistles', 'pauline', 3),
(4, 'New Testament', 'General Epistles', 'general', 4),
(5, 'New Testament', 'Prophetic', 'prophetic', 5);

-- 4. Insert the 27 Books of the New Testament
INSERT INTO nt_books (division_id, book_name, chapter_count, traditional_order) VALUES
-- Gospels (gospels)
(1, 'Matthew', 28, 1),
(1, 'Mark', 16, 2),
(1, 'Luke', 24, 3),
(1, 'John', 21, 4),

-- Church History (acts)
(2, 'Acts', 28, 5),

-- Pauline Epistles (pauline)
(3, 'Romans', 16, 6),
(3, '1 Corinthians', 16, 7),
(3, '2 Corinthians', 13, 8),
(3, 'Galatians', 6, 9),
(3, 'Ephesians', 6, 10),
(3, 'Philippians', 4, 11),
(3, 'Colossians', 4, 12),
(3, '1 Thessalonians', 5, 13),
(3, '2 Thessalonians', 3, 14),
(3, '1 Timothy', 6, 15),
(3, '2 Timothy', 4, 16),
(3, 'Titus', 3, 17),
(3, 'Philemon', 1, 18),

-- General Epistles (general)
(4, 'Hebrews', 13, 19),
(4, 'James', 5, 20),
(4, '1 Peter', 5, 21),
(4, '2 Peter', 3, 22),
(4, '1 John', 5, 23),
(4, '2 John', 1, 24),
(4, '3 John', 1, 25),
(4, 'Jude', 1, 26),

-- Prophetic (prophetic)
(5, 'Revelation', 22, 27);