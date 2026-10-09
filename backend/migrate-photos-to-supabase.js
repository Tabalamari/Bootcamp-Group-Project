/**
 * Copy profile images referenced by SQLite to the Supabase Storage bucket, then
 * replace their local /uploads URLs in the matching PostgreSQL profiles.
 * This is idempotent; it leaves the source uploads untouched as a rollback copy.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Database = require('better-sqlite3');
const { Pool } = require('pg');
const { createSupabasePhotoStorage } = require('./photo-storage');

const sqlitePath = process.env.DATABASE_PATH || path.join(__dirname, 'database.sqlite');
const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, 'uploads');
const contentTypes = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  }
  if (!fs.existsSync(sqlitePath)) throw new Error(`SQLite source database was not found at ${sqlitePath}`);

  const sqlite = new Database(sqlitePath, { readonly: true, fileMustExist: true });
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: true },
    max: 1,
    connectionTimeoutMillis: 10000,
  });
  const storage = createSupabasePhotoStorage({
    url: process.env.SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    bucket: process.env.SUPABASE_PROFILE_PHOTOS_BUCKET || 'profile-photos',
  });

  try {
    const profiles = sqlite.prepare(`
      SELECT user_id, photo_url FROM profiles
      WHERE photo_url LIKE '/uploads/%'
      ORDER BY user_id
    `).all();
    const client = await pool.connect();
    try {
      let migrated = 0;
      for (const profile of profiles) {
        const filename = path.basename(profile.photo_url);
        const sourcePath = path.join(uploadsDir, filename);
        const extension = path.extname(filename).toLowerCase();
        if (!contentTypes[extension]) throw new Error(`Unsupported image extension for ${filename}`);
        if (!fs.existsSync(sourcePath)) throw new Error(`Source image is missing: ${sourcePath}`);

        const objectKey = `${profile.user_id}/${filename}`;
        const photoUrl = await storage.upload(objectKey, fs.readFileSync(sourcePath), contentTypes[extension], { upsert: true });
        const result = await client.query(
          'UPDATE profiles SET photo_url = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
          [photoUrl, profile.user_id]
        );
        if (result.rowCount !== 1) throw new Error(`No Supabase profile found for user ${profile.user_id}`);
        migrated += 1;
        console.log(`Migrated photo for profile ${profile.user_id}`);
      }
      console.log(`Photo migration complete: ${migrated} of ${profiles.length} profile photos copied.`);
    } finally {
      client.release();
    }
  } finally {
    sqlite.close();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(`Photo migration failed. Source files were preserved. ${error.message}`);
  process.exitCode = 1;
});
