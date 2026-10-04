const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic health and info route
app.get('/api', (req, res) => {
  res.json({
    name: 'Bootcamp Connect API',
    status: 'online',
    version: '1.0.0'
  });
});

// Middleware for route protection (session token verification)
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Session token is missing' });
  }

  const session = db.prepare(`
    SELECT 
      users.id, 
      users.email, 
      users.display_name, 
      users.course_id, 
      users.role, 
      users.status, 
      courses.name AS course_name
    FROM sessions
    JOIN users ON sessions.user_id = users.id
    JOIN courses ON users.course_id = courses.id
    WHERE sessions.token = ?
  `).get(token);

  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  if (session.status === 'suspended') {
    return res.status(403).json({ error: 'Your account is suspended' });
  }

  req.user = session;
  req.token = token;
  next();
}

// -------------------------------------------------------------
// 1. Get list of active courses (GET /api/courses)
// -------------------------------------------------------------
app.get('/api/courses', (req, res) => {
  try {
    const courses = db.prepare(`
      SELECT id, name 
      FROM courses 
      WHERE is_active = 1 
      ORDER BY name ASC
    `).all();

    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve courses' });
  }
});

// -------------------------------------------------------------
// 2. Register a new user (POST /api/auth/register)
// -------------------------------------------------------------
app.post('/api/auth/register', (req, res) => {
  try {
    const { displayName, email, password, courseId } = req.body;

    // Check required fields
    if (!displayName || !email || !password || !courseId) {
      return res.status(400).json({ error: 'All fields (displayName, email, password, courseId) are required' });
    }

    const trimmedName = displayName.trim();
    const normalizedEmail = email.trim().toLowerCase();

    // Validate name length
    if (trimmedName.length < 2) {
      return res.status(400).json({ error: 'Display name must be at least 2 characters long' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Check course existence and active status
    const course = db.prepare('SELECT id, name FROM courses WHERE id = ? AND is_active = 1').get(courseId);
    if (!course) {
      return res.status(400).json({ error: 'Selected course does not exist or is unavailable' });
    }

    // Check email uniqueness
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
    if (existingUser) {
      return res.status(409).json({ error: 'A user with this email is already registered' });
    }

    // Hash password and create user
    const userId = crypto.randomUUID();
    const passwordHash = bcrypt.hashSync(password, 10);

    db.prepare(`
      INSERT INTO users (id, email, password_hash, display_name, course_id, role, status)
      VALUES (?, ?, ?, ?, ?, 'learner', 'active')
    `).run(userId, normalizedEmail, passwordHash, trimmedName, courseId);

    // Create session (auto-login)
    const token = crypto.randomUUID();
    db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, userId);

    res.status(201).json({
      token,
      user: {
        id: userId,
        displayName: trimmedName,
        email: normalizedEmail,
        courseId: course.id,
        courseName: course.name,
        role: 'learner'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// -------------------------------------------------------------
// 3. User login (POST /api/auth/login)
// -------------------------------------------------------------
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = db.prepare(`
      SELECT 
        users.id, 
        users.email, 
        users.password_hash, 
        users.display_name, 
        users.course_id, 
        users.role, 
        users.status, 
        courses.name AS course_name
      FROM users
      JOIN courses ON users.course_id = courses.id
      WHERE users.email = ?
    `).get(normalizedEmail);

    // Unified error for security (prevent email enumeration)
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check account status
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Your account is suspended' });
    }

    // Create session
    const token = crypto.randomUUID();
    db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, user.id);

    res.json({
      token,
      user: {
        id: user.id,
        displayName: user.display_name,
        email: user.email,
        courseId: user.course_id,
        courseName: user.course_name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to log in' });
  }
});

// -------------------------------------------------------------
// 4. Get current user profile (GET /api/auth/me)
// -------------------------------------------------------------
app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      displayName: req.user.display_name,
      email: req.user.email,
      courseId: req.user.course_id,
      courseName: req.user.course_name,
      role: req.user.role
    }
  });
});

// -------------------------------------------------------------
// 5. User logout (POST /api/auth/logout)
// -------------------------------------------------------------
app.post('/api/auth/logout', authMiddleware, (req, res) => {
  try {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(req.token);
    res.json({ message: 'Successfully logged out' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to log out' });
  }
});

// Start the server if file is executed directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;
