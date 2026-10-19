-- 1. Core Student Details (Managed via StudentFormScreen)
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

-- 2. Academic Evaluations (Managed via AcademicEvaluationsScreen)
CREATE TABLE student_evaluations (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(id) ON DELETE CASCADE,
    lecturer_name VARCHAR(100) NOT NULL, -- e.g., 'stephen', 'rajshekar', 'sampath'
    subject_key VARCHAR(100) NOT NULL,   -- e.g., 'synoptic', 'law', 'loc'
    exam BOOLEAN DEFAULT FALSE,
    notes BOOLEAN DEFAULT FALSE,
    classes BOOLEAN DEFAULT FALSE,
    permissions TEXT,
    video_file_name VARCHAR(255)
);

-- 3. Post-Grad Stay & Calendar Windows (Managed via StayCalendarScreen)
CREATE TABLE student_stays (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(id) ON DELETE CASCADE,
    accommodation VARCHAR(255),
    post_grad_stay VARCHAR(255),
    stay_start_date_time TIMESTAMP,
    stay_end_date_time TIMESTAMP
);