const http = require('http');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'cbc_db',
  password: 'postgres',
  port: 5432,
});

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  // Root status check
  if (url.pathname === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'API server is running successfully!' }));
    return;
  }

  const parseBody = (req) => {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });
  };

  try {
    // ----------------------------------------------------
    // 1. GET: Fetch all students (Core details only)
    // ----------------------------------------------------
    if (url.pathname === '/api/students' && req.method === 'GET') {
      const query = `
        SELECT 
          id, first_name, last_name, district, phone, email, course, batch, photo_url, created_at
        FROM students
        ORDER BY id ASC;
      `;
      const result = await pool.query(query);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result.rows));
      return;
    }

    // ----------------------------------------------------
    // 2. POST: Create new student
    // ----------------------------------------------------
    if (url.pathname === '/api/students' && req.method === 'POST') {
      const data = await parseBody(req);
      const { first_name, last_name, district, phone, email, course, batch, photo_url, photoUrl } = data;
      const finalPhoto = photo_url || photoUrl || null;

      const query = `
        INSERT INTO students (first_name, last_name, district, phone, email, course, batch, photo_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, first_name, last_name, district, phone, email, course, batch, photo_url, created_at;
      `;
      const result = await pool.query(query, [first_name, last_name, district, phone, email, course, batch, finalPhoto]);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result.rows[0]));
      return;
    }

    // ----------------------------------------------------
    // 3. PUT: Update existing student by ID
    // ----------------------------------------------------
    if (url.pathname.startsWith('/api/students/') && req.method === 'PUT') {
      const studentId = url.pathname.split('/')[3];
      const data = await parseBody(req);
      const { first_name, last_name, district, phone, email, course, batch, photo_url, photoUrl } = data;
      const finalPhoto = photo_url || photoUrl || null;

      const query = `
        UPDATE students 
        SET first_name = $1, last_name = $2, district = $3, phone = $4, email = $5, course = $6, batch = $7, photo_url = $8
        WHERE id = $9
        RETURNING id, first_name, last_name, district, phone, email, course, batch, photo_url, created_at;
      `;
      const result = await pool.query(query, [first_name, last_name, district, phone, email, course, batch, finalPhoto, Number(studentId)]);

      if (result.rows.length === 0) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Student not found' }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result.rows[0]));
      return;
    }

    // ----------------------------------------------------
    // 4. DELETE student by ID
    // ----------------------------------------------------
    if (url.pathname.startsWith('/api/students/') && req.method === 'DELETE') {
      const studentId = url.pathname.split('/')[3];
      await pool.query('DELETE FROM students WHERE id = $1', [Number(studentId)]);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
      return;
    }

    // ----------------------------------------------------
    // 5. GET: Fetch all professors
    // ----------------------------------------------------
    if (url.pathname === '/api/professors' && req.method === 'GET') {
      const result = await pool.query('SELECT professor_id, lecturer_key, lecturer_name FROM professors ORDER BY professor_id ASC;');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result.rows));
      return;
    }

    // ----------------------------------------------------
    // 6. GET: Fetch normalized professor subjects
    // ----------------------------------------------------
    if (url.pathname === '/api/professor-subjects' && req.method === 'GET') {
      const query = `
        SELECT 
          ps.id AS mapping_id,
          ps.professor_id,
          s.subject_id,
          s.subject_key,
          s.subject_label
        FROM professor_subjects ps
        JOIN subjects s ON ps.subject_id = s.subject_id
        ORDER BY s.subject_id ASC;
      `;
      const result = await pool.query(query);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result.rows));
      return;
    }

    // ----------------------------------------------------
    // 6.1 GET: Fetch all subjects list
    // ----------------------------------------------------
    if (url.pathname === '/api/subjects' && req.method === 'GET') {
      const result = await pool.query('SELECT subject_id AS id, subject_key, subject_label AS name FROM subjects ORDER BY subject_id ASC;');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result.rows));
      return;
    }

    // ----------------------------------------------------
    // 7. GET: Fetch academic evaluations for a student ID
    // ----------------------------------------------------
    if (url.pathname.startsWith('/api/evaluations/') && req.method === 'GET') {
      const studentId = url.pathname.split('/')[3];
      const result = await pool.query('SELECT * FROM student_evaluations WHERE student_id = $1', [Number(studentId)]);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result.rows));
      return;
    }

    // ----------------------------------------------------
    // 8. PUT: Save or Update academic evaluations
    // ----------------------------------------------------
    if (url.pathname.startsWith('/api/evaluations/') && req.method === 'PUT') {
      const studentId = Number(url.pathname.split('/')[3]);
      const data = await parseBody(req);
      const evaluations = data.evaluations || [];

      if (!Array.isArray(evaluations)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Evaluations payload must be an array' }));
        return;
      }

      for (const ev of evaluations) {
        const { professor_id, subject_id, exam, notes, classes, permissions, video_file_name } = ev;
        if (!subject_id || !professor_id) continue;

        let parsedPermissions = Number(permissions);
        if (isNaN(parsedPermissions) || parsedPermissions < 0) {
          parsedPermissions = 0;
        } else if (parsedPermissions > 20) {
          parsedPermissions = 20;
        }

        const upsertQuery = `
          INSERT INTO student_evaluations (student_id, professor_id, subject_id, exam, notes, classes, permissions, video_file_name)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (student_id, subject_id) 
          DO UPDATE SET 
            professor_id = $2,
            exam = $4, 
            notes = $5, 
            classes = $6, 
            permissions = $7, 
            video_file_name = $8;
        `;
        await pool.query(upsertQuery, [
          studentId, 
          Number(professor_id), 
          Number(subject_id), 
          !!exam, 
          !!notes, 
          !!classes, 
          String(parsedPermissions), 
          video_file_name || null
        ]);
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Evaluations saved successfully' }));
      return;
    }

    // ----------------------------------------------------
    // 9. GET: Fetch student stay details by student ID
    // ----------------------------------------------------
    if (url.pathname.startsWith('/api/student-stays/') && req.method === 'GET') {
      const studentId = url.pathname.split('/')[3];
      const result = await pool.query('SELECT * FROM student_stays WHERE student_id = $1', [Number(studentId)]);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result.rows[0] || null));
      return;
    }

    // ----------------------------------------------------
    // 10. PUT: Save or Update student stay details
    // ----------------------------------------------------
    if (url.pathname.startsWith('/api/student-stays/') && req.method === 'PUT') {
      const studentId = Number(url.pathname.split('/')[3]);
      const data = await parseBody(req);
      
      const {
        stay_start_date_time,
        stay_end_date_time,
        family_parents,
        sons_count,
        daughters_count,
        brothers_count,
        sisters_count,
        stay_notes
      } = data;

      const startDate = stay_start_date_time && stay_start_date_time.trim() !== '' ? stay_start_date_time : null;
      const endDate = stay_end_date_time && stay_end_date_time.trim() !== '' ? stay_end_date_time : null;

      const upsertQuery = `
        INSERT INTO student_stays (
          student_id, stay_start_date_time, stay_end_date_time, family_parents, sons_count, daughters_count, brothers_count, sisters_count, stay_notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (student_id) 
        DO UPDATE SET           
          stay_start_date_time = $2, 
          stay_end_date_time = $3, 
          family_parents = $4,
          sons_count = $5,
          daughters_count = $6,
          brothers_count = $7,
          sisters_count = $8,
          stay_notes = $9;
      `;
      
      await pool.query(upsertQuery, [
        studentId,      
        startDate, 
        endDate,
        family_parents || null,
        Number(sons_count) || 0,
        Number(daughters_count) || 0,
        Number(brothers_count) || 0,
        Number(sisters_count) || 0,
        stay_notes || null
      ]);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Stay details saved successfully' }));
      return;
    }

    // ----------------------------------------------------
    // 11. GET: Fetch Student Exam Scores filtered by subject
    // ----------------------------------------------------
    if (url.pathname === '/api/exam-scores' && req.method === 'GET') {
      const subject = url.searchParams.get('subject');
      const query = `
        SELECT 
          s.id, 
          CONCAT(s.first_name, ' ', s.last_name) AS name,
          COALESCE(e.exam_status, 'Pending') AS "examStatus",
          COALESCE(e.notes_status, '') AS "notesStatus",
          COALESCE(e.classes_perm, 0) AS "classesPerm",
          COALESCE(e.video_submission, false) AS "videoSubmission"
        FROM students s
        LEFT JOIN examscores e ON s.id = e.student_id AND e.subject = $1
        ORDER BY s.id ASC;
      `;
      const result = await pool.query(query, [subject || 'History']);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result.rows));
      return;
    }

    // ----------------------------------------------------
    // 11.1 GET: Fetch ALL exam scores across all students and subjects
    // ----------------------------------------------------
    if (url.pathname === '/api/exam-scores/all' && req.method === 'GET') {
      const query = `
        SELECT student_id, subject AS subject_id, exam_status AS score 
        FROM examscores;
      `;
      const result = await pool.query(query);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result.rows));
      return;
    }

    // ----------------------------------------------------
    // 12. POST/PUT: Save or Update individual student Exam Score
    // ----------------------------------------------------
    if (url.pathname === '/api/exam-scores' && (req.method === 'POST' || req.method === 'PUT')) {
      const data = await parseBody(req);
      const { subject, studentId, examStatus, notesStatus, classesPerm, videoSubmission } = data;

      const upsertQuery = `
        INSERT INTO examscores (student_id, subject, exam_status, notes_status, classes_perm, video_submission, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        ON CONFLICT (student_id, subject) 
        DO UPDATE SET 
          exam_status = EXCLUDED.exam_status,
          notes_status = EXCLUDED.notes_status,
          classes_perm = EXCLUDED.classes_perm,
          video_submission = EXCLUDED.video_submission,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *;
      `;

      const result = await pool.query(upsertQuery, [
        studentId, 
        subject, 
        examStatus || 'Pending', 
        notesStatus || '', 
        Number(classesPerm) || 0, 
        !!videoSubmission
      ]);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: result.rows[0] }));
      return;
    }

    // ----------------------------------------------------
    // 12.1 PUT: Save student exam scores in bulk (Master Sheet)
    // ----------------------------------------------------
    if (url.pathname.startsWith('/api/exam-scores/') && req.method === 'PUT') {
      const studentId = Number(url.pathname.split('/')[3]);
      const data = await parseBody(req);
      const evaluations = data.evaluations || [];

      for (const ev of evaluations) {
        const { subject_id, score } = ev;
        if (!subject_id) continue;

        const upsertQuery = `
          INSERT INTO examscores (student_id, subject, exam_status, updated_at)
          VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
          ON CONFLICT (student_id, subject) 
          DO UPDATE SET 
            exam_status = EXCLUDED.exam_status,
            updated_at = CURRENT_TIMESTAMP;
        `;
        await pool.query(upsertQuery, [studentId, subject_id, String(score ?? '')]);
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
      return;
    }

    // ----------------------------------------------------
    // 13. GET: Fetch student devotion details by student ID
    // ----------------------------------------------------
    if (url.pathname.startsWith('/api/student-devotions/') && req.method === 'GET') {
      const studentId = url.pathname.split('/')[3];
      const result = await pool.query('SELECT * FROM student_devotions WHERE student_id = $1', [studentId]);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result.rows[0] || { preaching: false, hosting: false, singing: false, attendance_score: 0 }));
      return;
    }

    // ----------------------------------------------------
    // 14. PUT/POST: Save or update student devotion details
    // ----------------------------------------------------
    if (url.pathname.startsWith('/api/student-devotions/') && (req.method === 'PUT' || req.method === 'POST')) {
      const studentId = url.pathname.split('/')[3];
      const data = await parseBody(req);
      const { preaching, hosting, singing, attendance_score } = data;

      const upsertQuery = `
        INSERT INTO student_devotions (student_id, preaching, hosting, singing, attendance_score, updated_at)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        ON CONFLICT (student_id) 
        DO UPDATE SET 
          preaching = EXCLUDED.preaching,
          hosting = EXCLUDED.hosting,
          singing = EXCLUDED.singing,
          attendance_score = EXCLUDED.attendance_score,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *;
      `;

      const result = await pool.query(upsertQuery, [studentId, preaching, hosting, singing, attendance_score]);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: result.rows[0] }));
      return;
    }

    // Default 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint not found' }));

  } catch (err) {
    console.error('Server error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} connected to PostgreSQL (cbc_db)`);
});