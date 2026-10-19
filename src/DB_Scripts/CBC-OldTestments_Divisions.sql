-- 1. Create the Divisions table
CREATE TABLE ot_divisions (
    division_id SERIAL PRIMARY KEY,
    testament VARCHAR(50) NOT NULL, -- e.g., 'Old Testament'
    division_name VARCHAR(100) NOT NULL, -- e.g., 'The Pentateuch', 'Historical Books'
    sort_order INT NOT NULL -- Keeps them in chronological/traditional order
);

-- 2. Create the Books table
CREATE TABLE ot_books (
    book_id SERIAL PRIMARY KEY,
    division_id INT REFERENCES ot_divisions(division_id) ON DELETE CASCADE,
    book_name VARCHAR(100) NOT NULL,
    chapter_count INT, -- Optional: helpful for Bible apps/queries
    traditional_order INT NOT NULL -- Standard ordering within the canon
);

-- 3. Insert the Division Data
INSERT INTO ot_divisions (division_id, testament, division_name, sort_order) VALUES
(1, 'Old Testament', 'The Pentateuch (The Law)', 1),
(2, 'Old Testament', 'Historical Books', 2),
(3, 'Old Testament', 'Poetry and Wisdom Literature', 3),
(4, 'Old Testament', 'Major Prophets', 4),
(5, 'Old Testament', 'Minor Prophets', 5);

-- 4. Insert the 39 Books Data
INSERT INTO ot_books (division_id, book_name, chapter_count, traditional_order) VALUES
-- Pentateuch
(1, 'Genesis', 50, 1),
(1, 'Exodus', 40, 2),
(1, 'Leviticus', 27, 3),
(1, 'Numbers', 36, 4),
(1, 'Deuteronomy', 34, 5),

-- Historical Books
(2, 'Joshua', 24, 6),
(2, 'Judges', 21, 7),
(2, 'Ruth', 4, 8),
(2, '1 Samuel', 31, 9),
(2, '2 Samuel', 24, 10),
(2, '1 Kings', 22, 11),
(2, '2 Kings', 25, 12),
(2, '1 Chronicles', 29, 13),
(2, '2 Chronicles', 36, 14),
(2, 'Ezra', 10, 15),
(2, 'Nehemiah', 13, 16),
(2, 'Esther', 10, 17),

-- Poetry and Wisdom
(3, 'Job', 42, 18),
(3, 'Psalms', 150, 19),
(3, 'Proverbs', 31, 20),
(3, 'Ecclesiastes', 12, 21),
(3, 'Song of Solomon', 8, 22),

-- Major Prophets
(4, 'Isaiah', 66, 23),
(4, 'Jeremiah', 52, 24),
(4, 'Lamentations', 5, 25),
(4, 'Ezekiel', 48, 26),
(4, 'Daniel', 12, 27),

-- Minor Prophets
(5, 'Hosea', 14, 28),
(5, 'Joel', 3, 29),
(5, 'Amos', 9, 30),
(5, 'Obadiah', 1, 31),
(5, 'Jonah', 4, 32),
(5, 'Micah', 7, 33),
(5, 'Nahum', 3, 34),
(5, 'Habakkuk', 3, 35),
(5, 'Zephaniah', 3, 36),
(5, 'Haggai', 2, 37),
(5, 'Zechariah', 14, 38),
(5, 'Malachi', 4, 39);


--List all books grouped by their college division:
SELECT d.division_name, b.book_name, b.chapter_count
FROM ot_books b
JOIN ot_divisions d ON b.division_id = d.division_id
ORDER BY d.sort_order, b.traditional_order;

--Count how many books are in each division:
SELECT d.division_name, COUNT(b.book_id) AS total_books
FROM ot_divisions d
LEFT JOIN ot_books b ON d.division_id = b.division_id
GROUP BY d.division_name, d.sort_order
ORDER BY d.sort_order;


ALTER TABLE ot_divisions ADD COLUMN division_code VARCHAR(50);

UPDATE ot_divisions SET division_code = 'pentateuch' WHERE division_id = 1;
UPDATE ot_divisions SET division_code = 'history' WHERE division_id = 2;
UPDATE ot_divisions SET division_code = 'wisdom' WHERE division_id = 3;
UPDATE ot_divisions SET division_code = 'major_prophets' WHERE division_id = 4;
UPDATE ot_divisions SET division_code = 'minor_prophets' WHERE division_id = 5;