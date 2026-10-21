const http = require('http');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'CBC_BTC',
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
    // 5. GET: Professor & subjects configuration
    // ----------------------------------------------------
    if (url.pathname === '/api/professor-subjects' && req.method === 'GET') {
      const profResult = await pool.query('SELECT professor_id, lecturer_name, lecturer_key FROM professors ORDER BY professor_id ASC');
      const subResult = await pool.query('SELECT subject_id, professor_id, subject_key, subject_label, subject_telugu FROM professor_subjects');

      const formattedData = profResult.rows.map(prof => ({
        lecturerKey: prof.lecturer_key,
        lecturerName: prof.lecturer_name,
        subjects: subResult.rows
          .filter(sub => sub.professor_id === prof.professor_id)
          .map(sub => ({
            key: sub.subject_key,
            label: sub.subject_label,
            telugu: sub.subject_telugu
          }))
      }));

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(formattedData));
      return;
    }

    // ----------------------------------------------------
    // 6. GET: Fetch academic evaluations for a student ID
    // ----------------------------------------------------
    if (url.pathname.startsWith('/api/evaluations/') && req.method === 'GET') {
      const studentId = url.pathname.split('/')[3];
      const result = await pool.query('SELECT * FROM student_evaluations WHERE student_id = $1', [Number(studentId)]);
      
      const evaluationsMap = {};
      result.rows.forEach(row => {
        const lecturerKey = row.lecturer_name;
        // Ignore any legacy stay_details keys if they exist in DB
        if (lecturerKey === 'stay_details') return;

        if (!evaluationsMap[lecturerKey]) evaluationsMap[lecturerKey] = {};
        
        evaluationsMap[lecturerKey][`${row.subject_key}Exam`] = row.exam;
        evaluationsMap[lecturerKey][`${row.subject_key}Notes`] = row.notes;
        evaluationsMap[lecturerKey][`${row.subject_key}Classes`] = row.classes;
        evaluationsMap[lecturerKey][`${row.subject_key}Permissions`] = row.permissions || '';
        evaluationsMap[lecturerKey][`${row.subject_key}VideoFileName`] = row.video_file_name || '';
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(evaluationsMap));
      return;
    }

    // ----------------------------------------------------
    // 7. PUT: Save or Update academic evaluations (Upsert)
    // ----------------------------------------------------
    if (url.pathname.startsWith('/api/evaluations/') && req.method === 'PUT') {
      const studentId = Number(url.pathname.split('/')[3]);
      const data = await parseBody(req);
      
      for (const [lecturerKey, subjectsObj] of Object.entries(data)) {
        // 🚫 Explicitly skip non-professor keys like stay_details, id, first_name, etc.
        if (lecturerKey === 'stay_details' || typeof subjectsObj !== 'object' || subjectsObj === null) continue;
        if (['id', 'first_name', 'last_name', 'district', 'phone', 'email', 'course', 'batch', 'photo_url', 'photoLink', 'photoUrl', 'accommodation', 'postGradStay', 'stayStartDateTime', 'stayEndDateTime'].includes(lecturerKey)) continue;

        const subjectKeys = new Set(Object.keys(subjectsObj).map(k => k.replace(/(Exam|Notes|Classes|Permissions|VideoFileName)$/, '')));

        for (const subKey of subjectKeys) {
          const exam = !!subjectsObj[`${subKey}Exam`];
          const notes = !!subjectsObj[`${subKey}Notes`];
          const classes = !!subjectsObj[`${subKey}Classes`];
          const permissions = subjectsObj[`${subKey}Permissions`] || '';
          const videoFileName = subjectsObj[`${subKey}VideoFileName`] || '';

          const upsertQuery = `
            INSERT INTO student_evaluations (student_id, lecturer_name, subject_key, exam, notes, classes, permissions, video_file_name)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (student_id, lecturer_name, subject_key) 
            DO UPDATE SET exam = $4, notes = $5, classes = $6, permissions = $7, video_file_name = $8;
          `;
          await pool.query(upsertQuery, [studentId, lecturerKey, subKey, exam, notes, classes, permissions, videoFileName]);
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Evaluations saved successfully' }));
      return;
    }

    // ----------------------------------------------------
    // 8. GET: Fetch student stay details by student ID
    // ----------------------------------------------------
    if (url.pathname.startsWith('/api/stays/') && req.method === 'GET') {
      const studentId = url.pathname.split('/')[3];
      const result = await pool.query('SELECT * FROM student_stays WHERE student_id = $1', [Number(studentId)]);
      
      if (result.rows.length > 0) {
        const row = result.rows[0];
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          stayStartDateTime: row.stay_start_date_time ? new Date(row.stay_start_date_time).toISOString().slice(0, 16) : '',
          stayEndDateTime: row.stay_end_date_time ? new Date(row.stay_end_date_time).toISOString().slice(0, 16) : '',
          ...(row.stay_details || {})
        }));
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          stayStartDateTime: '', 
          stayEndDateTime: '', 
          mother: false,
          father: false,
          guardian: false,
          childrenCount: 0, 
          brothersCount: 0, 
          sistersCount: 0, 
          stayNotes: '' 
        }));
      }
      return;
    }

    // ----------------------------------------------------
    // 9. PUT: Save or Update student stay details (Upsert)
    // ----------------------------------------------------
    if (url.pathname.startsWith('/api/stays/') && req.method === 'PUT') {
      const studentId = Number(url.pathname.split('/')[3]);
      const data = await parseBody(req);
      const { stayStartDateTime, stayEndDateTime, ...details } = data;

      const upsertQuery = `
        INSERT INTO student_stays (student_id, stay_start_date_time, stay_end_date_time, stay_details)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (student_id) 
        DO UPDATE SET 
          stay_start_date_time = $2, 
          stay_end_date_time = $3, 
          stay_details = $4;
      `;
      
      await pool.query(upsertQuery, [
        studentId, 
        stayStartDateTime || null, 
        stayEndDateTime || null, 
        JSON.stringify(details)
      ]);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Stay details saved successfully' }));
      return;
    }


    // GET: Fetch all professors
if (url.pathname === '/api/professors' && req.method === 'GET') {
  const result = await pool.query('SELECT professor_id, lecturer_key, lecturer_name FROM professors;');
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(result.rows));
  return;
}

// GET: Fetch all professor subjects
if (url.pathname === '/api/professor-subjects' && req.method === 'GET') {
  const result = await pool.query('SELECT subject_id, professor_id, subject_key, subject_label FROM professor_subjects;');
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(result.rows));
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
  console.log(`Server running on http://localhost:${PORT} connected to PostgreSQL (CBC_BTC)`);
});