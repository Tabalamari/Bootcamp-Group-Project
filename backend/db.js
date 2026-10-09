const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { AsyncLocalStorage } = require('async_hooks');
const bcrypt = require('bcryptjs');

const isPostgresClient = process.env.DB_CLIENT === 'postgres' || 
  (Boolean(process.env.DATABASE_URL) && process.env.DB_CLIENT !== 'sqlite');

let dbExport;

if (isPostgresClient) {
  const { Pool, types } = require('pg');
  // Parse PostgreSQL BIGINT (OID 20, e.g. COUNT(*)) as standard JS integer
  types.setTypeParser(20, val => parseInt(val, 10));

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  });

  pool.on('error', (err) => {
    console.error('[Supabase PostgreSQL Pool Error]:', err.message);
  });

  const txStorage = new AsyncLocalStorage();

  function convertSqlForPostgres(sql) {
    let s = sql.replace(/\browid\b/gi, 'id');
    if (/INSERT\s+OR\s+IGNORE\s+INTO/i.test(s)) {
      s = s.replace(/INSERT\s+OR\s+IGNORE\s+INTO/i, 'INSERT INTO');
      if (!/ON\s+CONFLICT/i.test(s)) {
        s = s.trim() + ' ON CONFLICT DO NOTHING';
      }
    }
    let p = 0;
    return s.replace(/\?/g, () => '$' + (++p));
  }

  function normalizeParams(params) {
    if (params.length === 1 && Array.isArray(params[0])) {
      return params[0];
    }
    return params;
  }

  dbExport = {
    clientType: 'postgres',
    pool,
    prepare(sql) {
      const pgSql = convertSqlForPostgres(sql);
      return {
        async get(...params) {
          const executor = txStorage.getStore() || pool;
          const res = await executor.query(pgSql, normalizeParams(params));
          return res.rows[0] !== undefined ? res.rows[0] : undefined;
        },
        async all(...params) {
          const executor = txStorage.getStore() || pool;
          const res = await executor.query(pgSql, normalizeParams(params));
          return res.rows;
        },
        async run(...params) {
          const executor = txStorage.getStore() || pool;
          const res = await executor.query(pgSql, normalizeParams(params));
          return { changes: res.rowCount, rowCount: res.rowCount };
        }
      };
    },
    async exec(sql) {
      const executor = txStorage.getStore() || pool;
      return await executor.query(sql);
    },
    transaction(fn) {
      return async (...args) => {
        const existingClient = txStorage.getStore();
        if (existingClient) {
          return await fn(...args);
        }
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const result = await txStorage.run(client, () => fn(...args));
          await client.query('COMMIT');
          return result;
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }
      };
    },
    pragma() {},
    async close() {
      await pool.end();
    }
  };

  // Ensure default administrator user exists in Supabase
  (async () => {
    try {
      const existingAdmin = await dbExport.prepare("SELECT id FROM users WHERE email = 'admin@example.com'").get();
      if (!existingAdmin) {
        const adminPasswordHash = bcrypt.hashSync('AdminPassword123!', 10);
        await dbExport.prepare(`
          INSERT INTO users (id, email, password_hash, display_name, course_id, role, status)
          VALUES ('admin-root', 'admin@example.com', ?, 'Administrator', 'software-dev', 'admin', 'active')
          ON CONFLICT (id) DO NOTHING
        `).run(adminPasswordHash);
        await dbExport.prepare("INSERT INTO profiles (user_id, bio) VALUES ('admin-root', 'Platform Administrator') ON CONFLICT (user_id) DO NOTHING").run();
      }
    } catch (err) {
      console.warn('[Supabase Init Warning]:', err.message);
    }
  })();

} else {
  // SQLite fallback client
  const Database = require('better-sqlite3');
  const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'database.sqlite');
  const sqliteDb = new Database(dbPath);

  sqliteDb.pragma('foreign_keys = ON');

  // Create SQLite tables if needed
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      is_active INTEGER DEFAULT 1
    );

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

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS skills (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS interests (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS connection_goals (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS profiles (
      user_id TEXT PRIMARY KEY,
      bio TEXT DEFAULT '',
      photo_url TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS profile_skills (
      user_id TEXT NOT NULL,
      skill_id TEXT NOT NULL,
      PRIMARY KEY (user_id, skill_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS profile_interests (
      user_id TEXT NOT NULL,
      interest_id TEXT NOT NULL,
      PRIMARY KEY (user_id, interest_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (interest_id) REFERENCES interests(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS profile_goals (
      user_id TEXT NOT NULL,
      goal_id TEXT NOT NULL,
      PRIMARY KEY (user_id, goal_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (goal_id) REFERENCES connection_goals(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      participant1_id TEXT NOT NULL,
      participant2_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (participant1_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (participant2_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(participant1_id, participant2_id)
    );

    CREATE INDEX IF NOT EXISTS idx_conversations_p1 ON conversations(participant1_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_p2 ON conversations(participant2_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC);

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at ASC);
    CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

    CREATE TABLE IF NOT EXISTS conversation_reads (
      conversation_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      last_read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (conversation_id, user_id),
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
  `);

  const skillCols = sqliteDb.prepare("PRAGMA table_info(skills)").all().map(c => c.name);
  if (!skillCols.includes('category_id')) {
    sqliteDb.exec("ALTER TABLE skills ADD COLUMN category_id TEXT REFERENCES categories(id) ON DELETE SET NULL");
  }

  const interestCols = sqliteDb.prepare("PRAGMA table_info(interests)").all().map(c => c.name);
  if (!interestCols.includes('category_id')) {
    sqliteDb.exec("ALTER TABLE interests ADD COLUMN category_id TEXT REFERENCES categories(id) ON DELETE SET NULL");
  }

  // SQLite seeds
  const seedCourse = sqliteDb.prepare('INSERT OR IGNORE INTO courses (id, name, is_active) VALUES (?, ?, 1)');
  seedCourse.run('software-dev', 'Software Development');
  seedCourse.run('business-dev', 'Business Development');

  const seedCategory = sqliteDb.prepare('INSERT OR IGNORE INTO categories (id, name, is_active) VALUES (?, ?, 1)');
  seedCategory.run('technical', 'Technical');
  seedCategory.run('business', 'Business');

  const seedSkill = sqliteDb.prepare('INSERT OR IGNORE INTO skills (id, name, is_active) VALUES (?, ?, 1)');
  [
    ['react', 'React'],
    ['javascript', 'JavaScript'],
    ['ui-design', 'UI design'],
    ['accessibility', 'Accessibility'],
    ['nodejs', 'Node.js'],
    ['python', 'Python'],
    ['market-research', 'Market research'],
    ['marketing', 'Marketing'],
    ['product-strategy', 'Product strategy'],
    ['accounting-bookkeeping', 'Accounting and bookkeeping'],
    ['budgeting-forecasting', 'Budgeting and forecasting'],
    ['business-analysis', 'Business analysis'],
    ['business-development', 'Business development'],
    ['business-planning', 'Business planning'],
    ['content-marketing', 'Content marketing'],
    ['customer-relationship-management', 'Customer relationship management'],
    ['customer-service', 'Customer service'],
    ['data-analysis', 'Data analysis'],
    ['digital-marketing', 'Digital marketing'],
    ['entrepreneurship', 'Entrepreneurship'],
    ['financial-analysis', 'Financial analysis'],
    ['human-resources', 'Human resources'],
    ['leadership', 'Leadership'],
    ['negotiation', 'Negotiation'],
    ['operations-management', 'Operations management'],
    ['presentation-skills', 'Presentation skills'],
    ['project-management', 'Project management'],
    ['sales', 'Sales'],
    ['strategic-planning', 'Strategic planning'],
    ['supply-chain-management', 'Supply chain management'],
    ['team-management', 'Team management']
  ].forEach(([id, name]) => seedSkill.run(id, name));

  const seedInterest = sqliteDb.prepare('INSERT OR IGNORE INTO interests (id, name, is_active) VALUES (?, ?, 1)');
  [
    ['education', 'Education'],
    ['design', 'Design'],
    ['sustainability', 'Sustainability'],
    ['technology', 'Technology'],
    ['entrepreneurship', 'Entrepreneurship']
  ].forEach(([id, name]) => seedInterest.run(id, name));

  const seedGoal = sqliteDb.prepare('INSERT OR IGNORE INTO connection_goals (id, name, is_active) VALUES (?, ?, 1)');
  [
    ['project-collaboration', 'Project collaboration'],
    ['cofounder-partnership', 'Co-founder partnership'],
    ['peer-support', 'Peer support'],
    ['friendship', 'Friendship']
  ].forEach(([id, name]) => seedGoal.run(id, name));

  const existingAdmin = sqliteDb.prepare("SELECT id FROM users WHERE email = 'admin@example.com'").get();
  if (!existingAdmin) {
    const adminPasswordHash = bcrypt.hashSync('AdminPassword123!', 10);
    sqliteDb.prepare(`
      INSERT INTO users (id, email, password_hash, display_name, course_id, role, status)
      VALUES (?, 'admin@example.com', ?, 'Administrator', 'software-dev', 'admin', 'active')
    `).run('admin-root', adminPasswordHash);
    sqliteDb.prepare("INSERT OR IGNORE INTO profiles (user_id, bio) VALUES ('admin-root', 'Platform Administrator')").run();
  }

  function normalizeParams(params) {
    if (params.length === 1 && Array.isArray(params[0])) {
      return params[0];
    }
    return params;
  }

  dbExport = {
    clientType: 'sqlite',
    rawDb: sqliteDb,
    prepare(sql) {
      let cleanSql = sql.replace(/\browid\b/gi, 'id');
      const stmt = sqliteDb.prepare(cleanSql);
      return {
        async get(...params) {
          return stmt.get(...normalizeParams(params));
        },
        async all(...params) {
          return stmt.all(...normalizeParams(params));
        },
        async run(...params) {
          return stmt.run(...normalizeParams(params));
        }
      };
    },
    async exec(sql) {
      return sqliteDb.exec(sql);
    },
    transaction(fn) {
      return async (...args) => {
        sqliteDb.exec('BEGIN IMMEDIATE');
        try {
          const res = await fn(...args);
          sqliteDb.exec('COMMIT');
          return res;
        } catch (err) {
          sqliteDb.exec('ROLLBACK');
          throw err;
        }
      };
    },
    pragma(cmd) {
      return sqliteDb.pragma(cmd);
    },
    close() {
      sqliteDb.close();
    }
  };
}

module.exports = dbExport;
