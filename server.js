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

// Secure password hashing helpers
const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
};

const verifyPassword = (password, storedHash) => {
  const [salt, originalHash] = storedHash.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === originalHash;
};

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
    // Database tables & schema setup
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
          password_hash VARCHAR(255),
          role_id INTEGER REFERENCES roles(id) DEFAULT 3,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`
      ALTER TABLE app_users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
    `);
    await pool.query(`
      ALTER TABLE students ADD COLUMN IF NOT EXISTS interest JSONB DEFAULT '[]'::jsonb;
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_stays (
          student_id INTEGER PRIMARY KEY,
          stay_start_date_time TIMESTAMP,
          stay_end_date_time TIMESTAMP,
          family_parents VARCHAR(100),
          sons_count INTEGER DEFAULT 0,
          daughters_count INTEGER DEFAULT 0,
          brothers_count INTEGER DEFAULT 0,
          sisters_count INTEGER DEFAULT 0,
          stay_notes TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

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
    // AUTHENTICATION ROUTES (Register & Login)
    // ====================================================

    if (url.pathname === '/api/auth/register' && req.method === 'POST') {
      const { email, password } = await parseBody(req);
      if (!email || !password) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Email and password are required' }));
        return;
      }

      const existingUser = await pool.query(`SELECT * FROM app_users WHERE email = $1`, [email]);
      if (existingUser.rows.length > 0 && existingUser.rows[0].password_hash) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Account already registered. Please log in.' }));
        return;
      }

      const hashedPassword = hashPassword(password);
      let user;

      if (existingUser.rows.length > 0) {
        const updateRes = await pool.query(`
          UPDATE app_users 
          SET password_hash = $1 
          WHERE email = $2 
          RETURNING id, email, (SELECT name FROM roles WHERE id = role_id) AS role;
        `, [hashedPassword, email]);
        user = updateRes.rows[0];
      } else {
        const insertRes = await pool.query(`
          INSERT INTO app_users (email, password_hash, role_id) 
          VALUES ($1, $2, 3) 
          RETURNING id, email, (SELECT name FROM roles WHERE id = role_id) AS role;
        `, [email, hashedPassword]);
        user = insertRes.rows[0];
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Registration successful', user }));
      return;
    }

    if (url.pathname === '/api/auth/login' && req.method === 'POST') {
      const { email, password } = await parseBody(req);
      if (!email || !password) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Email and password are required' }));
        return;
      }

      const userQuery = `
        SELECT u.id, u.email, u.password_hash, r.name AS role 
        FROM app_users u 
        JOIN roles r ON u.role_id = r.id 
        WHERE u.email = $1
      `;
      const result = await pool.query(userQuery, [email]);

      if (result.rows.length === 0 || !result.rows[0].password_hash) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid email or account not registered' }));
        return;
      }

      const user = result.rows[0];
      const isValid = verifyPassword(password, user.password_hash);

      if (!isValid) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Incorrect password' }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        message: 'Login successful',
        user: { id: user.id, email: user.email, role: user.role }
      }));
      return;
    }

    // ====================================================
    // APPLICATION ROUTES (Students Management)
    // ====================================================

    if (url.pathname === '/api/students' && req.method === 'GET') {
      const query = `
        SELECT id, first_name, last_name, district, phone, email, course, batch, interest, photo_url, created_at
        FROM students ORDER BY id ASC;
      `;
      const result = await pool.query(query);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result.rows));
      return;
    }

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

    if (url.pathname.startsWith('/api/students/') && req.method === 'DELETE') {
      const studentId = url.pathname.split('/')[3];
      await pool.query('DELETE FROM students WHERE id = $1', [Number(studentId)]);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
      return;
    }

    // ====================================================
    // STUDENT STAYS ROUTES
    // ====================================================

    if (url.pathname.startsWith('/api/student-stays/')) {
      const parts = url.pathname.split('/');
      const studentId = Number(parts[3]);

      if (isNaN(studentId)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid student ID' }));
        return;
      }

      if (req.method === 'GET') {
        const result = await pool.query('SELECT * FROM student_stays WHERE student_id = $1', [studentId]);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result.rows[0] || null));
        return;
      }

      if (req.method === 'PUT') {
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
  console.log(`Server running on http://localhost:${PORT}`);
});