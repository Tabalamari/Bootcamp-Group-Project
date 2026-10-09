/**
 * Migration script: Migrate SQLite data to Supabase PostgreSQL
 * Usage: node backend/migrate-sqlite-to-supabase.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Database = require('better-sqlite3');
const { Pool } = require('pg');

const sqlitePath = path.join(__dirname, 'database.sqlite');
const sqlite = new Database(sqlitePath);

const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrateTable(tableName, pkeyConflictClause) {
  const rows = sqlite.prepare(`SELECT * FROM ${tableName}`).all();
  if (rows.length === 0) {
    console.log(`- ${tableName}: 0 rows to migrate`);
    return 0;
  }

  const columns = Object.keys(rows[0]);
  const colList = columns.join(', ');
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

  const sql = `
    INSERT INTO ${tableName} (${colList})
    VALUES (${placeholders})
    ${pkeyConflictClause}
  `;

  let inserted = 0;
  for (const row of rows) {
    const values = columns.map(col => row[col]);
    try {
      await pgPool.query(sql, values);
      inserted++;
    } catch (err) {
      console.error(`Error migrating row in ${tableName}:`, row, err.message);
    }
  }

  console.log(`✓ ${tableName}: successfully migrated ${inserted}/${rows.length} rows`);
  return inserted;
}

async function runMigration() {
  console.log('=== STARTING SQLITE TO SUPABASE DATA MIGRATION ===\n');

  try {
    // 1. Dictionaries and taxonomies
    await migrateTable('courses', 'ON CONFLICT (id) DO NOTHING');
    await migrateTable('categories', 'ON CONFLICT (id) DO NOTHING');
    await migrateTable('skills', 'ON CONFLICT (id) DO NOTHING');
    await migrateTable('interests', 'ON CONFLICT (id) DO NOTHING');
    await migrateTable('connection_goals', 'ON CONFLICT (id) DO NOTHING');

    // 2. Users and active sessions
    await migrateTable('users', 'ON CONFLICT (id) DO NOTHING');
    await migrateTable('sessions', 'ON CONFLICT (token) DO NOTHING');

    // 3. Profiles and relationships
    await migrateTable('profiles', 'ON CONFLICT (user_id) DO NOTHING');
    await migrateTable('profile_skills', 'ON CONFLICT (user_id, skill_id) DO NOTHING');
    await migrateTable('profile_interests', 'ON CONFLICT (user_id, interest_id) DO NOTHING');
    await migrateTable('profile_goals', 'ON CONFLICT (user_id, goal_id) DO NOTHING');

    // 4. Conversations and messaging
    await migrateTable('conversations', 'ON CONFLICT (id) DO NOTHING');
    await migrateTable('messages', 'ON CONFLICT (id) DO NOTHING');
    await migrateTable('conversation_reads', 'ON CONFLICT (conversation_id, user_id) DO NOTHING');

    console.log('\n=== MIGRATION COMPLETED SUCCESSFULLY! ===');
  } catch (err) {
    console.error('Fatal migration error:', err);
  } finally {
    sqlite.close();
    await pgPool.end();
  }
}

runMigration();
