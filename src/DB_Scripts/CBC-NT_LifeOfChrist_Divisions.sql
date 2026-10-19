-- 1. Create the Topical/Thematic Divisions table
CREATE TABLE topical_divisions (
    division_id SERIAL PRIMARY KEY,
    subject_name VARCHAR(100) NOT NULL, -- Full display name
    division_code VARCHAR(50) NOT NULL UNIQUE, -- Short key matching your UI (e.g., 'loc', 'locChronological', 'evangelism')
    sort_order INT NOT NULL
);

-- 2. Create a mapping table to link subjects to specific books or custom reading lists
CREATE TABLE topical_division_items (
    item_id SERIAL PRIMARY KEY,
    division_id INT REFERENCES topical_divisions(division_id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL, -- e.g., 'Harmonized Gospels: Birth & Early Life' or 'Book of Acts (Missions)'
    reference_details VARCHAR(100), -- Optional: specific chapters or focus text (e.g., 'Matthew 1-2; Luke 1-2')
    display_order INT NOT NULL
);

-- 3. Insert the Topical Divisions
INSERT INTO topical_divisions (division_id, subject_name, division_code, sort_order) VALUES
(1, 'Life of Christ', 'loc', 1),
(2, 'Life of Christ - Chronological', 'locChronological', 2),
(3, 'Evangelism & Missions', 'evangelism', 3);

-- 4. Insert sample mapping items/details for each subject
INSERT INTO topical_division_items (division_id, title, reference_details, display_order) VALUES
-- Life of Christ (loc)
(1, 'The Eternal Word & Incarnation', 'John 1; Matthew 1; Luke 1', 1),
(1, 'Ministry in Galilee', 'Matthew 4-18; Mark 1-9', 2),
(1, 'Passion Week, Crucifixion & Resurrection', 'Matthew 21-28; John 12-21', 3),

-- Life of Christ - Chronological (locChronological)
(2, 'Phase 1: Pre-existence, Birth & Childhood', 'Luke 1-2; Matthew 1-2', 1),
(2, 'Phase 2: Baptism, Temptation & Early Judean Ministry', 'John 1-4; Matthew 3-4', 2),
(2, 'Phase 3: The Great Galilean Ministry', 'Matthew 5-13; Mark 2-6', 3),
(2, 'Phase 4: Later Judean & Perean Ministry', 'Luke 10-19; John 7-11', 4),
(2, 'Phase 5: Passion Week, Resurrection & Ascension', 'Matthew 21-28; Acts 1', 5),

-- Evangelism & Missions (evangelism)
(3, 'The Great Commission Mandate', 'Matthew 28:18-20; Acts 1:8', 1),
(3, 'Early Jerusalem Church & Witness', 'Acts 1-7', 2),
(3, 'Pauline Missionary Journeys', 'Acts 13-28', 3),
(3, 'Teologic Foundations for Witness', 'Romans 10; 2 Corinthians 5', 4);

--Useful Query to Fetch UI Subjects with Their Details:
SELECT d.subject_name, d.division_code, i.title, i.reference_details
FROM topical_divisions d
JOIN topical_division_items i ON d.division_id = i.division_id
ORDER BY d.sort_order, i.display_order;