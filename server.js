const http = require('http');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',              // Update with your actual PostgreSQL user
  host: 'localhost',
  database: 'CBC_BTC',   // Update with your actual database name
  password: 'postgres',     // Update with your actual password
  port: 5432,
});

const server = http.createServer(async (req, res) => {
  // Enable CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const urlParts = req.url.split('/');
  
  // GET /api/students - Fetch all students with their stay info
  if (req.method === 'GET' && req.url === '/api/students') {
    try {
      const query = `
        SELECT s.*, st.accommodation, st.post_grad_stay, st.stay_start_date_time, st.stay_end_date_time
        FROM students s
        LEFT JOIN student_stays st ON s.id = st.student_id
        ORDER BY s.id ASC
      `;
      const result = await pool.query(query);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result.rows));
    } catch (err) {
      console.error('Error fetching students:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  } 
  // POST /api/students - Create a new student profile
  else if (req.method === 'POST' && req.url === '/api/students') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          
          // 1. Insert core student info
          const studentQuery = `
            INSERT INTO students (first_name, last_name, district, phone, email, course, batch, photo_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *;
          `;
          const studentValues = [
            data.first_name, data.last_name, data.district, data.phone,
            data.email, data.course, data.batch, data.photoUrl || data.photo_url
          ];
          const studentResult = await client.query(studentQuery, studentValues);
          const newStudent = studentResult.rows[0];

          // 2. Insert stay record
          const stayQuery = `
            INSERT INTO student_stays (student_id, accommodation, post_grad_stay, stay_start_date_time, stay_end_date_time)
            VALUES ($1, $2, $3, $4, $5);
          `;
          const stayValues = [
            newStudent.id, data.accommodation, data.postGradStay,
            data.stayStartDateTime || null, data.stayEndDateTime || null
          ];
          await client.query(stayQuery, stayValues);

          await client.query('COMMIT');
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ...newStudent, accommodation: data.accommodation, postGradStay: data.postGradStay }));
        } catch (innerErr) {
          await client.query('ROLLBACK');
          throw innerErr;
        } finally {
          client.release();
        }
      } catch (err) {
        console.error('Error creating student:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  }
  // PUT /api/students/:id - Update student record by ID
  else if (req.method === 'PUT' && urlParts[1] === 'api' && urlParts[2] === 'students' && urlParts[3]) {
    const studentId = urlParts[3];
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const client = await pool.connect();
        try {
          await client.query('BEGIN');

          // 1. Update core student details
          const updateStudentQuery = `
            UPDATE students 
            SET first_name = $1, last_name = $2, district = $3, phone = $4, email = $5, course = $6, batch = $7, photo_url = $8
            WHERE id = $9
            RETURNING *;
          `;
          const studentValues = [
            data.first_name, data.last_name, data.district, data.phone,
            data.email, data.course, data.batch, data.photoUrl || data.photo_url, studentId
          ];
          const updatedStudentRes = await client.query(updateStudentQuery, studentValues);

          // 2. Upsert stay info
          const stayCheck = await client.query('SELECT * FROM student_stays WHERE student_id = $1', [studentId]);
          if (stayCheck.rows.length > 0) {
            await client.query(`
              UPDATE student_stays 
              SET accommodation = $1, post_grad_stay = $2, stay_start_date_time = $3, stay_end_date_time = $4
              WHERE student_id = $5
            `, [data.accommodation, data.postGradStay, data.stayStartDateTime || null, data.stayEndDateTime || null, studentId]);
          } else {
            await client.query(`
              INSERT INTO student_stays (student_id, accommodation, post_grad_stay, stay_start_date_time, stay_end_date_time)
              VALUES ($1, $2, $3, $4, $5)
            `, [studentId, data.accommodation, data.postGradStay, data.stayStartDateTime || null, data.stayEndDateTime || null]);
          }

          await client.query('COMMIT');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ...updatedStudentRes.rows[0], accommodation: data.accommodation, postGradStay: data.postGradStay }));
        } catch (innerErr) {
          await client.query('ROLLBACK');
          throw innerErr;
        } finally {
          client.release();
        }
      } catch (err) {
        console.error('Error updating student:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  }
  // DELETE /api/students/:id - Delete student by ID
  else if (req.method === 'DELETE' && urlParts[1] === 'api' && urlParts[2] === 'students' && urlParts[3]) {
    const studentId = urlParts[3];
    try {
      await pool.query('DELETE FROM students WHERE id = $1', [studentId]);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, id: studentId }));
    } catch (err) {
      console.error('Error deleting student:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

server.listen(5000, () => {
  console.log('Native Node.js server running on port 5000');
});