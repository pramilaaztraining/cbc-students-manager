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
  // ✅ FIX: Explicitly allow PUT and DELETE in Access-Control-Allow-Methods
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
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
    // 1. GET: Fetch all students
    if (url.pathname === '/api/students' && req.method === 'GET') {
      const result = await pool.query(
        `SELECT id, first_name, last_name, district, phone, email, course, batch, photo_url, created_at 
         FROM students ORDER BY id ASC`
      );
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result.rows));
      return;
    }

    // 2. POST: Create new student
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

    // 3. PUT: Update existing student by ID
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

    // 4. DELETE student by ID
    if (url.pathname.startsWith('/api/students/') && req.method === 'DELETE') {
      const studentId = url.pathname.split('/')[3];
      await pool.query('DELETE FROM students WHERE id = $1', [Number(studentId)]);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
      return;
    }

    // 5. GET: Professor subjects configuration
    if (url.pathname === '/api/professor-subjects' && req.method === 'GET') {
      const profResult = await pool.query('SELECT professor_id, name, lecturer_key FROM professors');
      const subResult = await pool.query('SELECT subject_id, professor_id, subject_key, label, telugu_label FROM subjects');

      const formattedData = profResult.rows.map(prof => ({
        lecturerKey: prof.lecturer_key,
        lecturerName: prof.name,
        subjects: subResult.rows
          .filter(sub => sub.professor_id === prof.professor_id)
          .map(sub => ({
            key: sub.subject_key,
            label: sub.label,
            telugu: sub.telugu_label
          }))
      }));

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(formattedData));
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