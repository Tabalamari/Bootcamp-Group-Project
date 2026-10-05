const path = require('path');
const Database = require('better-sqlite3');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

// Enable Foreign Keys support in SQLite
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  -- 1. Courses directory
  CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    is_active INTEGER DEFAULT 1
  );

  -- 2. User accounts
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    course_id TEXT NOT NULL,
    role TEXT DEFAULT 'learner',
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id)
  );

  -- 3. Active user sessions
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// Initial course seeding (Seed data)
const seedCourse = db.prepare(`
  INSERT OR IGNORE INTO courses (id, name, is_active)
  VALUES (?, ?, ?)
`);

seedCourse.run('software-dev', 'Software Development', 1);
seedCourse.run('business-dev', 'Business Development', 1);

module.exports = db;
