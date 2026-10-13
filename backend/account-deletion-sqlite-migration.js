function migrateSqliteForAccountDeletion(sqliteDb) {
  const conversations = sqliteDb.prepare('PRAGMA foreign_key_list(conversations)').all();
  const messages = sqliteDb.prepare('PRAGMA foreign_key_list(messages)').all();
  const columns = sqliteDb.prepare('PRAGMA table_info(conversations)').all();
  const senderColumn = sqliteDb.prepare('PRAGMA table_info(messages)').all().find(column => column.name === 'sender_id');
  const participantColumnsNullable = ['participant1_id', 'participant2_id'].every(name => {
    const column = columns.find(item => item.name === name);
    return column && column.notnull === 0;
  });
  const alreadyMigrated = participantColumnsNullable && senderColumn?.notnull === 0 &&
    conversations.filter(key => key.from.startsWith('participant')).every(key => key.on_delete === 'SET NULL') &&
    messages.find(key => key.from === 'sender_id')?.on_delete === 'SET NULL';
  if (alreadyMigrated) return false;

  sqliteDb.pragma('foreign_keys = OFF');
  sqliteDb.pragma('legacy_alter_table = OFF');
  try {
    sqliteDb.transaction(() => {
      sqliteDb.exec(`
        CREATE TABLE conversations_new (
          id TEXT PRIMARY KEY,
          participant1_id TEXT,
          participant2_id TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (participant1_id) REFERENCES users(id) ON DELETE SET NULL,
          FOREIGN KEY (participant2_id) REFERENCES users(id) ON DELETE SET NULL,
          UNIQUE(participant1_id, participant2_id)
        );
        CREATE TABLE messages_new (
          id TEXT PRIMARY KEY,
          conversation_id TEXT NOT NULL,
          sender_id TEXT,
          text TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (conversation_id) REFERENCES conversations_new(id) ON DELETE CASCADE,
          FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL
        );
        CREATE TABLE conversation_reads_new (
          conversation_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          last_read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (conversation_id, user_id),
          FOREIGN KEY (conversation_id) REFERENCES conversations_new(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        INSERT INTO conversations_new (id, participant1_id, participant2_id, created_at, updated_at)
          SELECT id, participant1_id, participant2_id, created_at, updated_at FROM conversations;
        INSERT INTO messages_new (id, conversation_id, sender_id, text, created_at)
          SELECT id, conversation_id, sender_id, text, created_at FROM messages;
        INSERT INTO conversation_reads_new (conversation_id, user_id, last_read_at)
          SELECT conversation_id, user_id, last_read_at FROM conversation_reads;
        DROP TABLE conversation_reads;
        DROP TABLE messages;
        DROP TABLE conversations;
        ALTER TABLE conversations_new RENAME TO conversations;
        ALTER TABLE messages_new RENAME TO messages;
        ALTER TABLE conversation_reads_new RENAME TO conversation_reads;
        CREATE INDEX idx_conversations_p1 ON conversations(participant1_id);
        CREATE INDEX idx_conversations_p2 ON conversations(participant2_id);
        CREATE INDEX idx_conversations_updated ON conversations(updated_at DESC);
        CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at ASC);
        CREATE INDEX idx_messages_sender ON messages(sender_id);
      `);
    })();
  } finally {
    sqliteDb.pragma('legacy_alter_table = OFF');
    sqliteDb.pragma('foreign_keys = ON');
  }

  const violations = sqliteDb.pragma('foreign_key_check');
  if (violations.length) {
    throw new Error(`SQLite account-deletion migration found foreign-key violation(s): ${JSON.stringify(violations)}`);
  }
  return true;
}

module.exports = { migrateSqliteForAccountDeletion };
