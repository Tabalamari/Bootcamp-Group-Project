require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('./db');

async function bootstrapAdmin() {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  const displayName = process.env.ADMIN_BOOTSTRAP_DISPLAY_NAME?.trim() || 'Platform Administrator';
  const courseId = process.env.ADMIN_BOOTSTRAP_COURSE_ID || 'software-dev';

  if (!email || !password || password.length < 12) {
    throw new Error('Set ADMIN_BOOTSTRAP_EMAIL and an ADMIN_BOOTSTRAP_PASSWORD of at least 12 characters');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('ADMIN_BOOTSTRAP_EMAIL must be a valid email address');
  }

  const course = await db.prepare('SELECT id FROM courses WHERE id = ?').get(courseId);
  if (!course) throw new Error(`Course ${courseId} does not exist; apply the Supabase schema and seed courses first`);

  const passwordHash = bcrypt.hashSync(password, 12);
  const existing = await db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  const userId = existing?.id || crypto.randomUUID();
  const legacyAdmin = email === 'admin@example.com'
    ? null
    : await db.prepare("SELECT id FROM users WHERE id = 'admin-root' AND email = 'admin@example.com'").get();
  const removeLegacyDemoAdmin = Boolean(legacyAdmin);

  await db.transaction(async () => {
    if (existing) {
      await db.prepare(`
        UPDATE users SET password_hash = ?, display_name = ?, course_id = ?, role = 'admin', status = 'active'
        WHERE id = ?
      `).run(passwordHash, displayName, courseId, userId);
      await db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
    } else {
      await db.prepare(`
        INSERT INTO users (id, email, password_hash, display_name, course_id, role, status)
        VALUES (?, ?, ?, ?, ?, 'admin', 'active')
      `).run(userId, email, passwordHash, displayName, courseId);
    }
    if (removeLegacyDemoAdmin) {
      await db.prepare('DELETE FROM users WHERE id = ?').run(legacyAdmin.id);
    }
    await db.prepare(`
      INSERT OR IGNORE INTO profiles (user_id, bio, photo_url) VALUES (?, 'Platform Administrator', NULL)
    `).run(userId);
  });

  console.log(`Admin account ready: ${email}. Existing sessions were revoked if the account already existed.`);
  if (removeLegacyDemoAdmin) console.log('Removed the legacy demo admin account with the known sample password.');
}

bootstrapAdmin()
  .catch((error) => {
    console.error(`Admin bootstrap failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.close();
  });
