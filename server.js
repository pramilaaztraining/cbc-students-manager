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

  const urlParts = req.url.split('/');
  
  try {
    // ==========================================
    // 1. STUDENTS API ENDPOINTS (Strictly Demographics)
    // ==========================================

    if (req.method === 'GET' && req.url === '/api/students') {
      const query = `
        SELECT id, first_name, last_name, district, phone, email, course, batch, photo_url
        FROM students
        ORDER BY id ASC
      `;
      const result = await pool.query(query);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(result.rows));
    } 

    else if (req.method === 'POST' && req.url === '/api/students') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const data = JSON.parse(body);
          
          const studentQuery = `
            INSERT INTO students (first_name, last_name, district, phone, email, course, batch, photo_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *;
          `;
          
          const studentValues = [
            data.first_name || '', 
            data.last_name || '', 
            data.district || '', 
            data.phone || '',
            data.email || '', 
            data.course || '', 
            data.batch || '', 
            data.photoUrl || data.photo_url || data.photoLink || ''
          ];

          const studentResult = await pool.query(studentQuery, studentValues);
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(studentResult.rows[0]));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    else if (req.method === 'PUT' && urlParts[1] === 'api' && urlParts[2] === 'students' && urlParts[3]) {
      const studentId = urlParts[3];
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const data = JSON.parse(body);

          const updateStudentQuery = `
            UPDATE students 
            SET first_name = $1, last_name = $2, district = $3, phone = $4, email = $5, course = $6, batch = $7, photo_url = $8
            WHERE id = $9
            RETURNING *;
          `;
          
          const updateValues = [
            data.first_name || '', 
            data.last_name || '', 
            data.district || '', 
            data.phone || '',
            data.email || '', 
            data.course || '', 
            data.batch || '', 
            data.photoUrl || data.photo_url || data.photoLink || '', 
            studentId
          ];

          const updatedStudentRes = await pool.query(updateStudentQuery, updateValues);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(updatedStudentRes.rows[0]));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    else if (req.method === 'DELETE' && urlParts[1] === 'api' && urlParts[2] === 'students' && urlParts[3]) {
      const studentId = urlParts[3];
      await pool.query('DELETE FROM students WHERE id = $1', [studentId]);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, id: studentId }));
    } 

    // ==========================================
    // 2. ACADEMIC EVALUATIONS & PROFESSORS API
    // ==========================================

    else if (req.method === 'GET' && req.url.startsWith('/api/academic-evaluations')) {
      const query = `
        SELECT 
          s.id, s.first_name, s.last_name, s.district, s.course, s.batch,
          COALESCE(ae.stephen_data, '{}'::jsonb) AS stephen,
          COALESCE(ae.rajshekar_data, '{}'::jsonb) AS rajshekar,
          COALESCE(ae.sampath_data, '{}'::jsonb) AS sampath
        FROM students s
        LEFT JOIN academic_evaluations ae ON s.id = ae.student_id
        ORDER BY s.id ASC;
      `;
      const result = await pool.query(query);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(result.rows));
    }

    else if (req.method === 'GET' && req.url.startsWith('/api/professor-subjects')) {
      const profQuery = `SELECT * FROM professors ORDER BY professor_id ASC;`;
      const subjQuery = `SELECT * FROM professor_subjects;`;

      const profsResult = await pool.query(profQuery);
      const subjsResult = await pool.query(subjQuery);

      const formattedProfessors = profsResult.rows.map(prof => {
        const matchingSubjects = subjsResult.rows
          .filter(sub => sub.professor_id === prof.professor_id)
          .map(sub => ({
            key: sub.subject_key,
            label: sub.subject_label,
            ...(sub.subject_telugu ? { telugu: sub.subject_telugu } : {})
          }));

        return {
          lecturerKey: prof.lecturer_key,
          lecturerName: prof.lecturer_name,
          subjects: matchingSubjects
        };
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(formattedProfessors));
    }

    else if (req.method === 'POST' && req.url.startsWith('/api/academic-evaluations')) {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const data = JSON.parse(body);
          if (!data.id) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Student ID is required.' }));
          }

          const upsertQuery = `
            INSERT INTO academic_evaluations (student_id, stephen_data, rajshekar_data, sampath_data, updated_at)
            VALUES ($1, $2, $3, $4, NOW())
            ON CONFLICT (student_id) 
            DO UPDATE SET 
              stephen_data = EXCLUDED.stephen_data,
              rajshekar_data = EXCLUDED.rajshekar_data,
              sampath_data = EXCLUDED.sampath_data,
              updated_at = NOW()
            RETURNING *;
          `;

          const values = [
            data.id, 
            JSON.stringify(data.stephen || {}), 
            JSON.stringify(data.rajshekar || {}), 
            JSON.stringify(data.sampath || {})
          ];

          const result = await pool.query(upsertQuery, values);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Academic records updated successfully!', data: result.rows[0] }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    } 

    else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'API Route Not Found' }));
    }

  } catch (err) {
    console.error('Server error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
});

server.listen(5000, () => {
  console.log('Native Node.js server running on port 5000');
});