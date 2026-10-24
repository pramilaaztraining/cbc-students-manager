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

  // Root status check to prevent "Endpoint not found" when visiting localhost:5000/
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
    // 6. GET: Fetch normalized professor subjects (joining subjects & mapping tables)
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
    // 7. GET: Fetch academic evaluations for a student ID (Normalized by IDs)
    // ----------------------------------------------------
    if (url.pathname.startsWith('/api/evaluations/') && req.method === 'GET') {
      const studentId = url.pathname.split('/')[3];
      const result = await pool.query('SELECT * FROM student_evaluations WHERE student_id = $1', [Number(studentId)]);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result.rows));
      return;
    }

    // ----------------------------------------------------
    // 8. PUT: Save or Update academic evaluations (Upsert via subject_id & professor_id)
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

        // Validate and clamp permissions safely between 0 and 20
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
      res.end(JSON.stringify({ success: true, message: 'Evaluations saved successfully with validation' }));
      return;
    }

    // ----------------------------------------------------
    // 9. GET: Fetch student stay details by student ID
    // ----------------------------------------------------
    if (url.pathname.startsWith('/api/student-stays/') && req.method === 'GET') {
      const studentId = url.pathname.split('/')[3];
      const result = await pool.query('SELECT * FROM student_stays WHERE student_id = $1', [Number(studentId)]);
      
      if (result.rows.length > 0) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result.rows[0]));
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(null));
      }
      return;
    }

    // ----------------------------------------------------
    // 10. PUT: Save or Update student stay details (Upsert)
    // ----------------------------------------------------
    if (url.pathname.startsWith('/api/student-stays/') && req.method === 'PUT') {
      const studentId = Number(url.pathname.split('/')[3]);
      const data = await parseBody(req);
      
      const {
        stay_start_date_time,
        stay_end_date_time,
        family_parents,
        children_count,
        brothers_count,
        sisters_count,
        stay_notes
      } = data;

      const startDate = stay_start_date_time && stay_start_date_time.trim() !== '' ? stay_start_date_time : null;
      const endDate = stay_end_date_time && stay_end_date_time.trim() !== '' ? stay_end_date_time : null;

      const upsertQuery = `
        INSERT INTO student_stays (
          student_id, 
          stay_start_date_time, 
          stay_end_date_time,           
          family_parents,
          children_count, 
          brothers_count, 
          sisters_count, 
          stay_notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (student_id) 
        DO UPDATE SET           
          stay_start_date_time = $2, 
          stay_end_date_time = $3, 
          family_parents = $4,
          children_count = $5,
          brothers_count = $6,
          sisters_count = $7,
          stay_notes = $8;
      `;
      
      await pool.query(upsertQuery, [
        studentId,      
        startDate, 
        endDate,
        family_parents || null,
        Number(children_count) || 0,
        Number(brothers_count) || 0,
        Number(sisters_count) || 0,
        stay_notes || null
      ]);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Stay details saved successfully' }));
      return;
    }


    const XLSX = require('xlsx');

// ----------------------------------------------------
// 11. POST: Bulk upload students from Excel
// ----------------------------------------------------
if (url.pathname === '/api/students/upload' && req.method === 'POST') {
  // For raw file uploads using multipart/form-data, 
  // you can parse the buffer or use a lightweight parser like 'formidable' or 'multer'.
  
  // Example logic once you parse the uploaded file buffer into JSON:
  // (Assuming 'parsedStudents' is an array of student objects extracted from the Excel sheet)
  
  const parsedStudents = []; // Extracted from Excel rows

  for (const student of parsedStudents) {
    const { first_name, last_name, district, phone, email, course, batch } = student;
    
    const insertQuery = `
      INSERT INTO students (first_name, last_name, district, phone, email, course, batch)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT DO NOTHING;
    `;
    
    await pool.query(insertQuery, [
      first_name, 
      last_name, 
      district || null, 
      phone || null, 
      email || null, 
      course || null, 
      batch || null
    ]);
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, message: 'Students imported successfully from Excel!' }));
  return;
}


// ----------------------------------------------------
// GET: Fetch student devotion details by student ID
// ----------------------------------------------------
if (url.pathname.startsWith('/api/student-devotions/') && req.method === 'GET') {
  const studentId = url.pathname.split('/')[3];
  try {
    const result = await pool.query('SELECT * FROM student_devotions WHERE student_id = $1', [studentId]);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result.rows[0] || { preaching: false, hosting: false, singing: false, attendance_score: 0 }));
  } catch (err) {
    console.error('Error fetching student devotion:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
  return;
}

// ----------------------------------------------------
// PUT/POST: Save or update student devotion details
// ----------------------------------------------------
if (url.pathname.startsWith('/api/student-devotions/') && (req.method === 'PUT' || req.method === 'POST')) {
  const studentId = url.pathname.split('/')[3];
  let body = '';
  
  req.on('data', chunk => { body += chunk; });
  req.on('end', async () => {
    try {
      const data = JSON.parse(body);
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
    } catch (err) {
      console.error('Error saving student devotion:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to save student devotion details' }));
    }
  });
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