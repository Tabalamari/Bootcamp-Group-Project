/**
 * Copy the existing SQLite rows to Supabase PostgreSQL.
 * Apply supabase-schema.sql in the Supabase SQL Editor first, then run this script
 * with DATABASE_URL set to the intended target database.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Database = require('better-sqlite3');
const { Pool } = require('pg');

const sqlitePath = process.env.DATABASE_PATH || path.join(__dirname, 'database.sqlite');
const databaseUrl = process.env.DATABASE_URL;
const tableDefinitions = [
  ['courses', ['id']],
  ['categories', ['id']],
  ['skills', ['id']],
  ['interests', ['id']],
  ['connection_goals', ['id']],
  ['users', ['id']],
  ['sessions', ['token']],
  ['profiles', ['user_id']],
  ['profile_skills', ['user_id', 'skill_id']],
  ['profile_interests', ['user_id', 'interest_id']],
  ['profile_goals', ['user_id', 'goal_id']],
  ['conversations', ['id']],
  ['messages', ['id']],
  ['conversation_reads', ['conversation_id', 'user_id']],
];

async function migrateTable(sqlite, client, tableName, keyColumns) {
  const rows = sqlite.prepare(`SELECT * FROM ${tableName}`).all();
  let inserted = 0;
  let alreadyPresent = 0;

  for (const [rowIndex, row] of rows.entries()) {
    const columns = Object.keys(row);
    const values = columns.map((column) => row[column]);
    const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
    const keyClause = keyColumns.map((column, index) => `${column} = $${index + 1}`).join(' AND ');
    const keyValues = keyColumns.map((column) => row[column]);

    try {
      const result = await client.query(
        `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
        values
      );
      const exists = await client.query(
        `SELECT 1 FROM ${tableName} WHERE ${keyClause} LIMIT 1`,
        keyValues
      );
      if (exists.rowCount !== 1) {
        throw new Error('row not found after insert');
      }
      if (result.rowCount === 1) inserted += 1;
      else alreadyPresent += 1;
    } catch (error) {
      // Do not print the row: user rows include email addresses and password hashes.
      const code = error.code ? ` (database error ${error.code})` : '';
      throw new Error(`Could not migrate row ${rowIndex + 1} in ${tableName}${code}`);
    }
  }

  console.log(`${tableName}: ${rows.length} source rows checked (${inserted} inserted, ${alreadyPresent} already present)`);
  return rows.length;
}

async function main() {
  if (!databaseUrl) throw new Error('DATABASE_URL is required; set it in backend/.env or the environment');
  if (!fs.existsSync(sqlitePath)) throw new Error(`SQLite source database was not found at ${sqlitePath}`);

  const sqlite = new Database(sqlitePath, { readonly: true, fileMustExist: true });
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: true },
    max: 1,
    connectionTimeoutMillis: 10000,
  });
  let client;

  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const totals = [];
    for (const [tableName, keyColumns] of tableDefinitions) {
      totals.push([tableName, await migrateTable(sqlite, client, tableName, keyColumns)]);
    }
    await client.query('COMMIT');
    console.log('\nMigration committed. Source keys were checked against Supabase for every table.');
    console.log(`Total source rows checked: ${totals.reduce((sum, [, count]) => sum + count, 0)}`);
  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    sqlite.close();
    if (client) client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(`Migration failed; no partial changes were committed. ${error.message}`);
  process.exitCode = 1;
});
