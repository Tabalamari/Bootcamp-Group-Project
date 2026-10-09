-- =========================================================
-- Bootcamp Connect - Supabase PostgreSQL Schema (DDL)
-- =========================================================

-- 1. Courses directory
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_active SMALLINT DEFAULT 1
);

-- 2. Taxonomy categories (FR-05)
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  is_active SMALLINT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);

-- 3. Skills vocabulary
CREATE TABLE IF NOT EXISTS skills (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  is_active SMALLINT DEFAULT 1,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL
);

-- 4. Interests vocabulary
CREATE TABLE IF NOT EXISTS interests (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  is_active SMALLINT DEFAULT 1,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL
);

-- 5. Connection goals vocabulary
CREATE TABLE IF NOT EXISTS connection_goals (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  is_active SMALLINT DEFAULT 1
);

-- 6. User accounts
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  course_id TEXT NOT NULL REFERENCES courses(id),
  role TEXT DEFAULT 'learner',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 7. Active user sessions
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- 8. User profiles
CREATE TABLE IF NOT EXISTS profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT DEFAULT '',
  photo_url TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Profile skills relationship
CREATE TABLE IF NOT EXISTS profile_skills (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, skill_id)
);

-- 10. Profile interests relationship
CREATE TABLE IF NOT EXISTS profile_interests (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interest_id TEXT NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, interest_id)
);

-- 11. Profile goals relationship
CREATE TABLE IF NOT EXISTS profile_goals (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_id TEXT NOT NULL REFERENCES connection_goals(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, goal_id)
);

-- 12. Conversations (1-on-1 private messaging)
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  participant1_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  participant2_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant1_id, participant2_id)
);
CREATE INDEX IF NOT EXISTS idx_conversations_p1 ON conversations(participant1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_p2 ON conversations(participant2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC);

-- 13. Messages
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

-- 14. Conversation read tracking
CREATE TABLE IF NOT EXISTS conversation_reads (
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

-- The application accesses these tables through the Express backend. Enable RLS
-- so Supabase's public Data API roles cannot read user or messaging data directly.
-- The backend's server-side database connection uses its privileged connection role.
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_reads ENABLE ROW LEVEL SECURITY;
