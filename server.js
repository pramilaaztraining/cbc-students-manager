const http = require('http');
const { Pool } = require('pg');
const crypto = require('crypto');

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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'API server with Auth & CBC Manager is running successfully!' }));
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
    // Ensure interest column is stored as JSONB to support multi-select arrays
    await pool.query(`
      ALTER TABLE students ADD COLUMN IF NOT EXISTS interest JSONB DEFAULT '[]'::jsonb;
    `);

    // Helper to format incoming interest data into a proper JSON string for PostgreSQL JSONB
    const formatInterestForDb = (interest) => {
      if (!interest) return JSON.stringify([]);
      if (Array.isArray(interest)) return JSON.stringify(interest);
      if (typeof interest === 'string') {
        try {
          const parsed = JSON.parse(interest);
          if (Array.isArray(parsed)) return JSON.stringify(parsed);
        } catch (e) {
          const parts = interest.split(',').map(i => i.trim()).filter(Boolean);
          return JSON.stringify(parts);
        }
      }
      return JSON.stringify([]);
    };

    // ====================================================
    // AUTHENTICATION ROUTES (OTP Generation & Verification)
    // ====================================================

    if (url.pathname === '/api/auth/send-otp' && req.method === 'POST') {
      const { email } = await parseBody(req);
      if (!email) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Email is required' }));
        return;
      }

      const otpCode = crypto.randomInt(100000, 999999).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS roles (
            id SERIAL PRIMARY KEY,
            name VARCHAR(50) UNIQUE NOT NULL
        );
      `);
      await pool.query(`
        INSERT INTO roles (name) VALUES ('admin'), ('faculty'), ('student') 
        ON CONFLICT (name) DO NOTHING;
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS app_users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            role_id INTEGER REFERENCES roles(id) DEFAULT 3,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS auth_otps (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            otp_code VARCHAR(6) NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await pool.query(
        `INSERT INTO auth_otps (email, otp_code, expires_at) VALUES ($1, $2, $3)`,
        [email, otpCode, expiresAt]
      );

      console.log(`[🔐 DEV-MODE OTP] Verification code for ${email}: ${otpCode}`);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'OTP sent successfully.' }));
      return;
    }

    if (url.pathname === '/api/auth/verify-otp' && req.method === 'POST') {
      const { email, otp } = await parseBody(req);
      
      const otpCheck = await pool.query(
        `SELECT * FROM auth_otps WHERE email = $1 AND otp_code = $2 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1`,
        [email, otp]
      );

      if (otpCheck.rows.length === 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid or expired OTP code' }));
        return;
      }

      await pool.query(`DELETE FROM auth_otps WHERE email = $1`, [email]);

      let userQuery = `
        SELECT u.id, u.email, r.name AS role 
        FROM app_users u 
        JOIN roles r ON u.role_id = r.id 
        WHERE u.email = $1
      `;
      let userResult = await pool.query(userQuery, [email]);

      let user;
      if (userResult.rows.length === 0) {
        const defaultRole = 3;
        const newUserQuery = `
          INSERT INTO app_users (email, role_id) 
          VALUES ($1, $2) 
          RETURNING id, email, (SELECT name FROM roles WHERE id = $2) AS role;
        `;
        const newUserRes = await pool.query(newUserQuery, [email, defaultRole]);
        user = newUserRes.rows[0];
      } else {
        user = userResult.rows[0];
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        message: 'Authentication successful',
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      }));
      return;
    }

    // ====================================================
    // APPLICATION ROUTES (Students, Exams, Stay, etc.)
    // ====================================================

    // 1. GET: Fetch all students
    if (url.pathname === '/api/students' && req.method === 'GET') {
      const query = `
        SELECT 
          id, first_name, last_name, district, phone, email, course, batch, interest, photo_url, created_at
        FROM students
        ORDER BY id ASC;
      `;
      const result = await pool.query(query);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result.rows));
      return;
    }

    // 2. POST: Create new student
    if (url.pathname === '/api/students' && req.method === 'POST') {
      const data = await parseBody(req);
      const { first_name, last_name, district, phone, email, course, batch, interest, photo_url, photoUrl } = data;
      const finalPhoto = photo_url || photoUrl || null;
      const interestJson = formatInterestForDb(interest);

      const query = `
        INSERT INTO students (first_name, last_name, district, phone, email, course, batch, interest, photo_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)
        RETURNING id, first_name, last_name, district, phone, email, course, batch, interest, photo_url, created_at;
      `;
      const result = await pool.query(query, [first_name, last_name, district, phone, email, course, batch, interestJson, finalPhoto]);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result.rows[0]));
      return;
    }

    // 3. PUT: Update existing student by ID
    if (url.pathname.startsWith('/api/students/') && req.method === 'PUT') {
      const studentId = url.pathname.split('/')[3];
      const data = await parseBody(req);
      const { first_name, last_name, district, phone, email, course, batch, interest, photo_url, photoUrl } = data;
      const finalPhoto = photo_url || photoUrl || null;
      const interestJson = formatInterestForDb(interest);

      const query = `
        UPDATE students 
        SET first_name = $1, last_name = $2, district = $3, phone = $4, email = $5, course = $6, batch = $7, interest = $8::jsonb, photo_url = $9
        WHERE id = $10
        RETURNING id, first_name, last_name, district, phone, email, course, batch, interest, photo_url, created_at;
      `;
      const result = await pool.query(query, [first_name, last_name, district, phone, email, course, batch, interestJson, finalPhoto, Number(studentId)]);

      if (result.rows.length === 0) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Student not found' }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result.rows[0]));
      return;
    }

    // 4. DELETE student by ID
    if (url.pathname.startsWith('/api/students/') && req.method === 'DELETE') {
      const studentId = url.pathname.split('/')[3];
      await pool.query('DELETE FROM students WHERE id = $1', [Number(studentId)]);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
      return;
    }

    // 5. GET: Fetch all professors
    if (url.pathname === '/api/professors' && req.method === 'GET') {
      const result = await pool.query('SELECT professor_id, lecturer_key, lecturer_name FROM professors ORDER BY professor_id ASC;');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result.rows));
      return;
    }

    // 6. GET: Fetch normalized professor subjects
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

    if (url.pathname === '/api/subjects' && req.method === 'GET') {
      const result = await pool.query('SELECT subject_id AS id, subject_key, subject_label AS name FROM subjects ORDER BY subject_id ASC;');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result.rows));
      return;
    }

    if (url.pathname.startsWith('/api/evaluations/') && req.method === 'GET') {
      const studentId = url.pathname.split('/')[3];
      const result = await pool.query('SELECT * FROM student_evaluations WHERE student_id = $1', [Number(studentId)]);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result.rows));
      return;
    }

    if (url.pathname.startsWith('/api/evaluations/') && req.method === 'PUT') {
      const studentId = Number(url.pathname.split('/')[3]);
      const data = await parseBody(req);
      const evaluations = data.evaluations || [];

      for (const ev of evaluations) {
        const { professor_id, subject_id, exam, notes, classes, permissions, video_file_name } = ev;
        if (!subject_id || !professor_id) continue;

        let parsedPermissions = Number(permissions);
        if (isNaN(parsedPermissions) || parsedPermissions < 0) parsedPermissions = 0;
        else if (parsedPermissions > 20) parsedPermissions = 20;

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
        await pool.query(upsertQuery, [studentId, Number(professor_id), Number(subject_id), !!exam, !!notes, !!classes, String(parsedPermissions), video_file_name || null]);
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Evaluations saved successfully' }));
      return;
    }

    if (url.pathname.startsWith('/api/student-stays/') && req.method === 'GET') {
      const studentId = url.pathname.split('/')[3];
      const result = await pool.query('SELECT * FROM student_stays WHERE student_id = $1', [Number(studentId)]);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result.rows[0] || null));
      return;
    }

    if (url.pathname.startsWith('/api/student-stays/') && req.method === 'PUT') {
      const studentId = Number(url.pathname.split('/')[3]);
      const data = await parseBody(req);
      const { stay_start_date_time, stay_end_date_time, family_parents, sons_count, daughters_count, brothers_count, sisters_count, stay_notes } = data;

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
        studentId, startDate, endDate, family_parents || null,
        Number(sons_count) || 0, Number(daughters_count) || 0,
        Number(brothers_count) || 0, Number(sisters_count) || 0,
        stay_notes || null
      ]);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Stay details saved successfully' }));
      return;
    }

    if (url.pathname === '/api/exam-scores' && req.method === 'GET') {
      const subjectId = url.searchParams.get('subject') || url.searchParams.get('subject_id');
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
      const result = await pool.query(query, [Number(subjectId) || 16]);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result.rows));
      return;
    }

    if (url.pathname === '/api/exam-scores/all' && req.method === 'GET') {
      const query = `SELECT student_id, subject AS subject_id, exam_status AS score FROM examscores;`;
      const result = await pool.query(query);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result.rows));
      return;
    }

    if (url.pathname === '/api/exam-scores' && (req.method === 'POST' || req.method === 'PUT')) {
      const data = await parseBody(req);
      const { subject, subject_id, studentId, examStatus, notesStatus, classesPerm, videoSubmission } = data;
      const finalSubjectId = Number(subject_id || subject);

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
        Number(studentId), finalSubjectId, examStatus || 'Pending', 
        notesStatus || '', Number(classesPerm) || 0, !!videoSubmission
      ]);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: result.rows[0] }));
      return;
    }

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