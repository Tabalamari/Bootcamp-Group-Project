const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'database.sqlite');
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

  -- 4. Skills vocabulary
  CREATE TABLE IF NOT EXISTS skills (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    is_active INTEGER DEFAULT 1
  );

  -- 5. Interests vocabulary
  CREATE TABLE IF NOT EXISTS interests (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    is_active INTEGER DEFAULT 1
  );

  -- 6. Connection goals vocabulary
  CREATE TABLE IF NOT EXISTS connection_goals (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    is_active INTEGER DEFAULT 1
  );

  -- 7. User profiles
  CREATE TABLE IF NOT EXISTS profiles (
    user_id TEXT PRIMARY KEY,
    bio TEXT DEFAULT '',
    photo_url TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- 8. Profile skills relationship
  CREATE TABLE IF NOT EXISTS profile_skills (
    user_id TEXT NOT NULL,
    skill_id TEXT NOT NULL,
    PRIMARY KEY (user_id, skill_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
  );

  -- 9. Profile interests relationship
  CREATE TABLE IF NOT EXISTS profile_interests (
    user_id TEXT NOT NULL,
    interest_id TEXT NOT NULL,
    PRIMARY KEY (user_id, interest_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (interest_id) REFERENCES interests(id) ON DELETE CASCADE
  );

  -- 10. Profile goals relationship
  CREATE TABLE IF NOT EXISTS profile_goals (
    user_id TEXT NOT NULL,
    goal_id TEXT NOT NULL,
    PRIMARY KEY (user_id, goal_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (goal_id) REFERENCES connection_goals(id) ON DELETE CASCADE
  );
`);

// Backfill empty profile rows for any existing users
db.exec(`
  INSERT OR IGNORE INTO profiles (user_id, bio, photo_url)
  SELECT id, '', NULL FROM users
`);

// Initial course seeding (Seed data)
const seedCourse = db.prepare(`
  INSERT OR IGNORE INTO courses (id, name, is_active)
  VALUES (?, ?, ?)
`);

seedCourse.run('software-dev', 'Software Development', 1);
seedCourse.run('business-dev', 'Business Development', 1);

// Initial skills seeding
const seedSkill = db.prepare('INSERT OR IGNORE INTO skills (id, name, is_active) VALUES (?, ?, 1)');
[
  ['react', 'React'],
  ['javascript', 'JavaScript'],
  ['ui-design', 'UI design'],
  ['accessibility', 'Accessibility'],
  ['nodejs', 'Node.js'],
  ['python', 'Python'],
  ['market-research', 'Market research'],
  ['marketing', 'Marketing'],
  ['product-strategy', 'Product strategy']
].forEach(([id, name]) => seedSkill.run(id, name));

// Initial interests seeding
const seedInterest = db.prepare('INSERT OR IGNORE INTO interests (id, name, is_active) VALUES (?, ?, 1)');
[
  ['education', 'Education'],
  ['design', 'Design'],
  ['sustainability', 'Sustainability'],
  ['technology', 'Technology'],
  ['entrepreneurship', 'Entrepreneurship']
].forEach(([id, name]) => seedInterest.run(id, name));

// Initial connection goals seeding
const seedGoal = db.prepare('INSERT OR IGNORE INTO connection_goals (id, name, is_active) VALUES (?, ?, 1)');
[
  ['project-collaboration', 'Project collaboration'],
  ['cofounder-partnership', 'Co-founder partnership'],
  ['peer-support', 'Peer support'],
  ['friendship', 'Friendship']
].forEach(([id, name]) => seedGoal.run(id, name));

module.exports = db;
