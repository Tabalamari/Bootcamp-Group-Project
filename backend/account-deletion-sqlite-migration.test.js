const test = require('node:test');
const assert = require('node:assert/strict');
const Database = require('better-sqlite3');
const { migrateSqliteForAccountDeletion } = require('./account-deletion-sqlite-migration');

test('SQLite migration preserves message/read rows and anonymizes deleted-user references', () => {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE users (id TEXT PRIMARY KEY);
    CREATE TABLE conversations (
      id TEXT PRIMARY KEY,
      participant1_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      participant2_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT,
      updated_at TEXT,
      UNIQUE(participant1_id, participant2_id)
    );
    CREATE INDEX idx_conversations_p1 ON conversations(participant1_id);
    CREATE INDEX idx_conversations_p2 ON conversations(participant2_id);
    CREATE INDEX idx_conversations_updated ON conversations(updated_at DESC);
    CREATE TABLE messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      created_at TEXT
    );
    CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at ASC);
    CREATE INDEX idx_messages_sender ON messages(sender_id);
    CREATE TABLE conversation_reads (
      conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      last_read_at TEXT,
      PRIMARY KEY (conversation_id, user_id)
    );
    INSERT INTO users VALUES ('owner'), ('peer');
    INSERT INTO conversations VALUES ('chat', 'owner', 'peer', 'start', 'later');
    INSERT INTO messages VALUES ('m1', 'chat', 'owner', 'kept text', 'first'), ('m2', 'chat', 'peer', 'reply', 'second');
    INSERT INTO conversation_reads VALUES ('chat', 'peer', 'seen');
  `);

  assert.equal(migrateSqliteForAccountDeletion(db), true);
  assert.equal(migrateSqliteForAccountDeletion(db), false, 'migration is skipped on a second run');
  db.prepare("DELETE FROM users WHERE id = 'owner'").run();
  assert.deepEqual(db.prepare('SELECT id, participant1_id, participant2_id FROM conversations').get(), {
    id: 'chat', participant1_id: null, participant2_id: 'peer'
  });
  assert.deepEqual(db.prepare('SELECT id, sender_id, text FROM messages ORDER BY id').all(), [
    { id: 'm1', sender_id: null, text: 'kept text' },
    { id: 'm2', sender_id: 'peer', text: 'reply' },
  ]);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM conversation_reads').get().count, 1);
  assert.deepEqual(db.pragma('foreign_key_check'), []);
  db.close();
});
