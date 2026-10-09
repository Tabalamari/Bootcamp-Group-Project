const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage setup for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const err = new Error('INVALID_FILE_TYPE');
      err.code = 'INVALID_FILE_TYPE';
      cb(err);
    }
  }
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Photo upload middleware with custom error handling
function photoUploadMiddleware(req, res, next) {
  upload.single('photo')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'Photo file is too large. Maximum size is 5 MB' });
      }
      if (err.code === 'INVALID_FILE_TYPE') {
        return res.status(415).json({ error: 'Unsupported image format. Allowed formats: JPG, PNG, WebP' });
      }
      return res.status(400).json({ error: err.message || 'File upload error' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No photo file provided' });
    }
    next();
  });
}

// Helper to retrieve full profile for a user
async function getUserProfile(userId) {
  await db.prepare(`
    INSERT OR IGNORE INTO profiles (user_id, bio, photo_url)
    VALUES (?, '', NULL)
  `).run(userId);

  const row = await db.prepare(`
    SELECT 
      users.id, 
      users.display_name, 
      users.course_id, 
      courses.name AS course_name,
      profiles.bio,
      profiles.photo_url
    FROM users
    JOIN courses ON users.course_id = courses.id
    LEFT JOIN profiles ON users.id = profiles.user_id
    WHERE users.id = ?
  `).get(userId);

  if (!row) return null;

  const skills = (await db.prepare(`
    SELECT skills.name
    FROM profile_skills
    JOIN skills ON profile_skills.skill_id = skills.id
    WHERE profile_skills.user_id = ?
    ORDER BY skills.name ASC
  `).all(userId)).map(r => r.name);

  const interests = (await db.prepare(`
    SELECT interests.name
    FROM profile_interests
    JOIN interests ON profile_interests.interest_id = interests.id
    WHERE profile_interests.user_id = ?
    ORDER BY interests.name ASC
  `).all(userId)).map(r => r.name);

  const goals = (await db.prepare(`
    SELECT connection_goals.name
    FROM profile_goals
    JOIN connection_goals ON profile_goals.goal_id = connection_goals.id
    WHERE profile_goals.user_id = ?
    ORDER BY connection_goals.name ASC
  `).all(userId)).map(r => r.name);

  return {
    id: row.id,
    displayName: row.display_name,
    courseId: row.course_id,
    courseName: row.course_name,
    bio: row.bio || '',
    photoUrl: row.photo_url || null,
    skills,
    interests,
    goals
  };
}

// Basic health and info route
app.get('/api', (req, res) => {
  res.json({
    name: 'Bootcamp Connect API',
    status: 'online',
    version: '1.0.0',
    dbClient: db.clientType || 'postgres'
  });
});

// Middleware for route protection (session token verification)
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Session token is missing' });
    }

    const session = await db.prepare(`
      SELECT 
        users.id, 
        users.email, 
        users.display_name, 
        users.course_id, 
        users.role, 
        users.status, 
        courses.name AS course_name
      FROM sessions
      JOIN users ON sessions.user_id = users.id
      JOIN courses ON users.course_id = courses.id
      WHERE sessions.token = ?
    `).get(token);

    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    if (session.status === 'suspended') {
      return res.status(403).json({ error: 'Your account is suspended' });
    }

    req.user = session;
    req.token = token;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Authentication verification failed' });
  }
}

// -------------------------------------------------------------
// 1. Get list of active courses (GET /api/courses)
// -------------------------------------------------------------
app.get('/api/courses', async (req, res) => {
  try {
    const courses = await db.prepare(`
      SELECT id, name 
      FROM courses 
      WHERE is_active = 1 
      ORDER BY name ASC
    `).all();

    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve courses' });
  }
});

// -------------------------------------------------------------
// 2. Register a new user (POST /api/auth/register)
// -------------------------------------------------------------
app.post('/api/auth/register', async (req, res) => {
  try {
    const { displayName, email, password, courseId } = req.body;

    // Check required fields
    if (!displayName || !email || !password || !courseId) {
      return res.status(400).json({ error: 'All fields (displayName, email, password, courseId) are required' });
    }

    const trimmedName = displayName.trim();
    const normalizedEmail = email.trim().toLowerCase();

    // Validate name length
    if (trimmedName.length < 2) {
      return res.status(400).json({ error: 'Display name must be at least 2 characters long' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Check course existence and active status
    const course = await db.prepare('SELECT id, name FROM courses WHERE id = ? AND is_active = 1').get(courseId);
    if (!course) {
      return res.status(400).json({ error: 'Selected course does not exist or is unavailable' });
    }

    // Check email uniqueness
    const existingUser = await db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
    if (existingUser) {
      return res.status(409).json({ error: 'A user with this email is already registered' });
    }

    // Hash password and create user
    const userId = crypto.randomUUID();
    const passwordHash = bcrypt.hashSync(password, 10);

    await db.prepare(`
      INSERT INTO users (id, email, password_hash, display_name, course_id, role, status)
      VALUES (?, ?, ?, ?, ?, 'learner', 'active')
    `).run(userId, normalizedEmail, passwordHash, trimmedName, courseId);

    // Auto-create empty profile
    await db.prepare(`
      INSERT OR IGNORE INTO profiles (user_id, bio, photo_url)
      VALUES (?, '', NULL)
    `).run(userId);

    // Create session (auto-login)
    const token = crypto.randomUUID();
    await db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, userId);

    res.status(201).json({
      token,
      user: {
        id: userId,
        displayName: trimmedName,
        email: normalizedEmail,
        courseId: course.id,
        courseName: course.name,
        role: 'learner'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// -------------------------------------------------------------
// 3. User login (POST /api/auth/login)
// -------------------------------------------------------------
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await db.prepare(`
      SELECT 
        users.id, 
        users.email, 
        users.password_hash, 
        users.display_name, 
        users.course_id, 
        users.role, 
        users.status, 
        courses.name AS course_name
      FROM users
      JOIN courses ON users.course_id = courses.id
      WHERE users.email = ?
    `).get(normalizedEmail);

    // Unified error for security (prevent email enumeration)
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check account status
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Your account is suspended' });
    }

    // Create session
    const token = crypto.randomUUID();
    await db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, user.id);

    res.json({
      token,
      user: {
        id: user.id,
        displayName: user.display_name,
        email: user.email,
        courseId: user.course_id,
        courseName: user.course_name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to log in' });
  }
});

// -------------------------------------------------------------
// 4. Get current user profile (GET /api/auth/me)
// -------------------------------------------------------------
app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      displayName: req.user.display_name,
      email: req.user.email,
      courseId: req.user.course_id,
      courseName: req.user.course_name,
      role: req.user.role
    }
  });
});

// -------------------------------------------------------------
// 5. User logout (POST /api/auth/logout)
// -------------------------------------------------------------
app.post('/api/auth/logout', authMiddleware, async (req, res) => {
  try {
    await db.prepare('DELETE FROM sessions WHERE token = ?').run(req.token);
    res.json({ message: 'Successfully logged out' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to log out' });
  }
});

// -------------------------------------------------------------
// 6. Profile Options (GET /api/profile-options)
// -------------------------------------------------------------
app.get(['/api/profile-options', '/api/profile/options'], async (req, res) => {
  try {
    const skills = (await db.prepare('SELECT name FROM skills WHERE is_active = 1 ORDER BY name ASC').all()).map(r => r.name);
    const interests = (await db.prepare('SELECT name FROM interests WHERE is_active = 1 ORDER BY name ASC').all()).map(r => r.name);
    const goals = (await db.prepare('SELECT name FROM connection_goals WHERE is_active = 1 ORDER BY name ASC').all()).map(r => r.name);

    res.json({
      skills,
      interests,
      goals
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve profile options' });
  }
});

// -------------------------------------------------------------
// 7. Get Current User Profile (GET /api/profiles/me)
// -------------------------------------------------------------
app.get(['/api/profiles/me', '/api/profile/me'], authMiddleware, async (req, res) => {
  try {
    const profile = await getUserProfile(req.user.id);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

// -------------------------------------------------------------
// 8. Update Current User Profile (PATCH / PUT /api/profiles/me)
// -------------------------------------------------------------
async function handleUpdateProfile(req, res) {
  try {
    const { displayName, bio, skills, interests, goals } = req.body;

    if (displayName !== undefined) {
      if (typeof displayName !== 'string') {
        return res.status(400).json({ error: 'Display name must be a string' });
      }
      const trimmed = displayName.trim();
      if (trimmed.length < 2 || trimmed.length > 50) {
        return res.status(400).json({ error: 'Display name must be between 2 and 50 characters' });
      }
    }

    if (bio !== undefined) {
      if (typeof bio !== 'string') {
        return res.status(400).json({ error: 'Bio must be a string' });
      }
      if (bio.trim().length > 500) {
        return res.status(400).json({ error: 'Bio cannot exceed 500 characters' });
      }
    }

    const validSkillIds = [];
    if (skills !== undefined) {
      if (!Array.isArray(skills)) {
        return res.status(400).json({ error: 'Skills must be an array' });
      }
      for (const item of skills) {
        if (typeof item !== 'string' || !item.trim()) continue;
        const found = await db.prepare('SELECT id FROM skills WHERE is_active = 1 AND (LOWER(name) = LOWER(?) OR id = ?)').get(item, item);
        if (!found) {
          return res.status(400).json({ error: `Invalid or inactive skill: ${item}` });
        }
        if (!validSkillIds.includes(found.id)) validSkillIds.push(found.id);
      }
    }

    const validInterestIds = [];
    if (interests !== undefined) {
      if (!Array.isArray(interests)) {
        return res.status(400).json({ error: 'Interests must be an array' });
      }
      for (const item of interests) {
        if (typeof item !== 'string' || !item.trim()) continue;
        const found = await db.prepare('SELECT id FROM interests WHERE is_active = 1 AND (LOWER(name) = LOWER(?) OR id = ?)').get(item, item);
        if (!found) {
          return res.status(400).json({ error: `Invalid or inactive interest: ${item}` });
        }
        if (!validInterestIds.includes(found.id)) validInterestIds.push(found.id);
      }
    }

    const validGoalIds = [];
    if (goals !== undefined) {
      if (!Array.isArray(goals)) {
        return res.status(400).json({ error: 'Goals must be an array' });
      }
      for (const item of goals) {
        if (typeof item !== 'string' || !item.trim()) continue;
        const found = await db.prepare('SELECT id FROM connection_goals WHERE is_active = 1 AND (LOWER(name) = LOWER(?) OR id = ?)').get(item, item);
        if (!found) {
          return res.status(400).json({ error: `Invalid or inactive connection goal: ${item}` });
        }
        if (!validGoalIds.includes(found.id)) validGoalIds.push(found.id);
      }
    }

    // Atomic transaction for updates
    const updateTx = db.transaction(async () => {
      if (displayName !== undefined) {
        await db.prepare('UPDATE users SET display_name = ? WHERE id = ?').run(displayName.trim(), req.user.id);
      }

      await db.prepare(`
        INSERT INTO profiles (user_id, bio, photo_url)
        VALUES (?, '', NULL)
        ON CONFLICT(user_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
      `).run(req.user.id);

      if (bio !== undefined) {
        await db.prepare('UPDATE profiles SET bio = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?').run(bio.trim(), req.user.id);
      }

      if (skills !== undefined) {
        await db.prepare('DELETE FROM profile_skills WHERE user_id = ?').run(req.user.id);
        const insertSkill = db.prepare('INSERT OR IGNORE INTO profile_skills (user_id, skill_id) VALUES (?, ?)');
        for (const sId of validSkillIds) {
          await insertSkill.run(req.user.id, sId);
        }
      }

      if (interests !== undefined) {
        await db.prepare('DELETE FROM profile_interests WHERE user_id = ?').run(req.user.id);
        const insertInterest = db.prepare('INSERT OR IGNORE INTO profile_interests (user_id, interest_id) VALUES (?, ?)');
        for (const iId of validInterestIds) {
          await insertInterest.run(req.user.id, iId);
        }
      }

      if (goals !== undefined) {
        await db.prepare('DELETE FROM profile_goals WHERE user_id = ?').run(req.user.id);
        const insertGoal = db.prepare('INSERT OR IGNORE INTO profile_goals (user_id, goal_id) VALUES (?, ?)');
        for (const gId of validGoalIds) {
          await insertGoal.run(req.user.id, gId);
        }
      }
    });

    await updateTx();

    const profile = await getUserProfile(req.user.id);
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
}

app.patch(['/api/profiles/me', '/api/profile/me'], authMiddleware, handleUpdateProfile);
app.put(['/api/profiles/me', '/api/profile/me'], authMiddleware, handleUpdateProfile);

// -------------------------------------------------------------
// 9. Upload Profile Photo (POST /api/profiles/me/photo)
// -------------------------------------------------------------
app.post(['/api/profiles/me/photo', '/api/profile/me/photo'], authMiddleware, photoUploadMiddleware, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const prevProfile = await db.prepare('SELECT photo_url FROM profiles WHERE user_id = ?').get(req.user.id);
    if (prevProfile && prevProfile.photo_url) {
      const prevFilename = path.basename(prevProfile.photo_url);
      const prevFilePath = path.join(uploadsDir, prevFilename);
      if (fs.existsSync(prevFilePath)) {
        try {
          fs.unlinkSync(prevFilePath);
        } catch (e) {
          // ignore unlink error
        }
      }
    }

    const photoUrl = `/uploads/${req.file.filename}`;

    await db.prepare(`
      INSERT INTO profiles (user_id, bio, photo_url)
      VALUES (?, '', ?)
      ON CONFLICT(user_id) DO UPDATE SET photo_url = ?, updated_at = CURRENT_TIMESTAMP
    `).run(req.user.id, photoUrl, photoUrl);

    const profile = await getUserProfile(req.user.id);
    res.json({
      message: 'Photo uploaded successfully',
      photoUrl,
      profile
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

// -------------------------------------------------------------
// 10. Delete Profile Photo (DELETE /api/profiles/me/photo)
// -------------------------------------------------------------
app.delete(['/api/profiles/me/photo', '/api/profile/me/photo'], authMiddleware, async (req, res) => {
  try {
    const profile = await db.prepare('SELECT photo_url FROM profiles WHERE user_id = ?').get(req.user.id);
    if (profile && profile.photo_url) {
      const filename = path.basename(profile.photo_url);
      const filePath = path.join(uploadsDir, filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          // ignore unlink error
        }
      }
    }

    await db.prepare(`
      UPDATE profiles 
      SET photo_url = NULL, updated_at = CURRENT_TIMESTAMP 
      WHERE user_id = ?
    `).run(req.user.id);

    res.json({
      photoUrl: null,
      message: 'Photo removed successfully'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove photo' });
  }
});

// =============================================================
// FR-03: SEARCH & DISCOVERY (DISCOVER PEERS & EXPLAINABLE FIT)
// =============================================================

function normalizeCourseId(courseId) {
  if (!courseId) return '';
  return courseId.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function parseListParam(param) {
  if (!param) return [];
  if (Array.isArray(param)) {
    return param.map(item => String(item).trim().toLowerCase()).filter(Boolean);
  }
  return String(param)
    .split(',')
    .map(item => item.trim().toLowerCase())
    .filter(Boolean);
}

// Calculate evidence-based fit reasons between candidate and viewer
function calculateFitReasons(candidate, viewer) {
  const reasons = [];

  // 1. Shared interests
  const viewerInterests = (viewer.interests || []).map(s => s.toLowerCase());
  const sharedInterests = (candidate.interests || []).filter(item => viewerInterests.includes(item.toLowerCase()));
  if (sharedInterests.length > 0) {
    reasons.push(`Shared interest: ${sharedInterests.join(', ')}.`);
  }

  // 2. Shared skills
  const viewerSkills = (viewer.skills || []).map(s => s.toLowerCase());
  const sharedSkills = (candidate.skills || []).filter(item => viewerSkills.includes(item.toLowerCase()));
  if (sharedSkills.length > 0) {
    reasons.push(`Skill in common: ${sharedSkills.join(', ')}.`);
  }

  // 3. Shared connection goals
  const viewerGoals = (viewer.goals || []).map(s => s.toLowerCase());
  const sharedGoals = (candidate.goals || []).filter(item => viewerGoals.includes(item.toLowerCase()));
  if (sharedGoals.length > 0) {
    reasons.push(`Shared goal: ${sharedGoals.join(', ')}.`);
  }

  // 4. Complementary courses (different courses with shared interest in project collaboration)
  const normCandCourse = normalizeCourseId(candidate.courseId);
  const normViewerCourse = normalizeCourseId(viewer.courseId);
  const candHasProjectCollab = (candidate.goals || []).some(g => g.toLowerCase() === 'project collaboration');
  const viewerHasProjectCollab = (viewer.goals || []).some(g => g.toLowerCase() === 'project collaboration');

  if (normCandCourse && normViewerCourse && normCandCourse !== normViewerCourse && candHasProjectCollab && viewerHasProjectCollab) {
    reasons.push('Different courses, with a shared interest in project collaboration.');
  }

  // 5. Fallback when no criteria match
  if (reasons.length === 0) {
    reasons.push('No shared criteria found yet.');
  }

  return reasons;
}

// -------------------------------------------------------------
// 11. Search & Filter Profiles with Explainable Fit (GET /api/profiles)
// -------------------------------------------------------------
app.get('/api/profiles', authMiddleware, async (req, res) => {
  try {
    const viewer = await getUserProfile(req.user.id);
    if (!viewer) {
      return res.status(404).json({ error: 'Viewer profile not found' });
    }

    // Pagination parameters
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 12);

    // Parse filtering parameters
    const query = (req.query.query || '').trim().toLowerCase();
    const courseFilter = normalizeCourseId(req.query.courseId || req.query.course);
    const skillsFilter = parseListParam(req.query.skills).map(s => s.toLowerCase());
    const interestsFilter = parseListParam(req.query.interests).map(s => s.toLowerCase());
    const goalsFilter = parseListParam(req.query.goals).map(s => s.toLowerCase());

    // Fetch active candidates, strictly excluding current user and suspended accounts
    const candidateRows = await db.prepare(`
      SELECT users.id 
      FROM users 
      WHERE users.status = 'active' AND users.id != ?
      ORDER BY users.display_name ASC
    `).all(req.user.id);

    // Hydrate candidates and apply filters
    const matched = [];
    for (const row of candidateRows) {
      const candidate = await getUserProfile(row.id);
      if (!candidate) continue;

      // Filter: Text search query across name, bio, skills, and interests
      if (query) {
        const searchText = [
          candidate.displayName,
          candidate.bio,
          ...candidate.skills,
          ...candidate.interests
        ].join(' ').toLowerCase();

        if (!searchText.includes(query)) {
          continue;
        }
      }

      // Filter: Course filter
      if (courseFilter) {
        if (normalizeCourseId(candidate.courseId) !== courseFilter) {
          continue;
        }
      }

      // Filter: Skills filter (OR within group, AND across groups)
      if (skillsFilter.length > 0) {
        const candSkills = candidate.skills.map(s => s.toLowerCase());
        const matchesAnySkill = skillsFilter.some(s => candSkills.includes(s));
        if (!matchesAnySkill) {
          continue;
        }
      }

      // Filter: Interests filter (OR within group, AND across groups)
      if (interestsFilter.length > 0) {
        const candInterests = candidate.interests.map(i => i.toLowerCase());
        const matchesAnyInterest = interestsFilter.some(i => candInterests.includes(i));
        if (!matchesAnyInterest) {
          continue;
        }
      }

      // Filter: Goals filter (OR within group, AND across groups)
      if (goalsFilter.length > 0) {
        const candGoals = candidate.goals.map(g => g.toLowerCase());
        const matchesAnyGoal = goalsFilter.some(g => candGoals.includes(g));
        if (!matchesAnyGoal) {
          continue;
        }
      }

      // Compute explainable fit reasons based on saved profile data
      const fitReasons = calculateFitReasons(candidate, viewer);

      // Add profile card with private account fields excluded
      matched.push({
        id: candidate.id,
        displayName: candidate.displayName,
        courseId: candidate.courseId,
        courseName: candidate.courseName,
        bio: candidate.bio,
        photoUrl: candidate.photoUrl,
        skills: candidate.skills,
        interests: candidate.interests,
        goals: candidate.goals,
        fitReasons
      });
    }

    // Apply pagination
    const total = matched.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedProfiles = matched.slice(startIndex, startIndex + limit);

    res.json({
      profiles: paginatedProfiles,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to search profiles' });
  }
});

// -------------------------------------------------------------
// 12. View Candidate Profile Detail (GET /api/profiles/:userId)
// -------------------------------------------------------------
app.get(['/api/profiles/:userId', '/api/profile/:userId'], authMiddleware, async (req, res) => {
  try {
    const targetUser = await db.prepare('SELECT id, status FROM users WHERE id = ?').get(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    if (targetUser.status === 'suspended') {
      return res.status(403).json({ error: 'This profile is unavailable' });
    }

    const candidate = await getUserProfile(req.params.userId);
    const viewer = await getUserProfile(req.user.id);

    if (!candidate || !viewer) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const fitReasons = calculateFitReasons(candidate, viewer);

    res.json({
      id: candidate.id,
      displayName: candidate.displayName,
      courseId: candidate.courseId,
      courseName: candidate.courseName,
      bio: candidate.bio,
      photoUrl: candidate.photoUrl,
      skills: candidate.skills,
      interests: candidate.interests,
      goals: candidate.goals,
      fitReasons
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve profile details' });
  }
});

// =============================================================
// FR-04: DIRECT 1-ON-1 PRIVATE MESSAGING & CONVERSATIONS
// =============================================================

function canonicalizeParticipants(userA, userB) {
  return userA < userB ? [userA, userB] : [userB, userA];
}

async function getPublicUserSummary(userId) {
  const row = await db.prepare(`
    SELECT 
      users.id, 
      users.display_name, 
      users.status,
      courses.name AS course_name,
      profiles.photo_url
    FROM users
    JOIN courses ON users.course_id = courses.id
    LEFT JOIN profiles ON users.id = profiles.user_id
    WHERE users.id = ?
  `).get(userId);

  if (!row) return null;
  return {
    id: row.id,
    displayName: row.display_name,
    courseName: row.course_name,
    photoUrl: row.photo_url || null,
    status: row.status
  };
}

async function getUnreadCount(conversationId, userId) {
  const readRecord = await db.prepare(`
    SELECT last_read_at FROM conversation_reads 
    WHERE conversation_id = ? AND user_id = ?
  `).get(conversationId, userId);

  const lastReadAt = readRecord ? readRecord.last_read_at : '1970-01-01T00:00:00.000Z';

  const countRow = await db.prepare(`
    SELECT COUNT(*) AS count FROM messages 
    WHERE conversation_id = ? AND sender_id != ? AND created_at > ?
  `).get(conversationId, userId, lastReadAt);

  return countRow ? Number(countRow.count) : 0;
}

async function getLastMessage(conversationId) {
  const msg = await db.prepare(`
    SELECT id, conversation_id, sender_id, text, created_at 
    FROM messages 
    WHERE conversation_id = ? 
    ORDER BY created_at DESC, id DESC 
    LIMIT 1
  `).get(conversationId);

  if (!msg) return null;
  return {
    id: msg.id,
    conversationId: msg.conversation_id,
    senderId: msg.sender_id,
    text: msg.text,
    createdAt: msg.created_at
  };
}

async function formatConversation(conv, currentUserId) {
  const otherUserId = conv.participant1_id === currentUserId ? conv.participant2_id : conv.participant1_id;
  const otherUser = await getPublicUserSummary(otherUserId);
  const lastMessage = await getLastMessage(conv.id);
  const unreadCount = await getUnreadCount(conv.id, currentUserId);

  return {
    id: conv.id,
    otherParticipant: otherUser ? {
      id: otherUser.id,
      displayName: otherUser.displayName,
      courseName: otherUser.courseName,
      photoUrl: otherUser.photoUrl
    } : null,
    lastMessage,
    unreadCount,
    updatedAt: conv.updated_at
  };
}

// -------------------------------------------------------------
// 13. Get Conversations List / Inbox (GET /api/conversations)
// -------------------------------------------------------------
app.get('/api/conversations', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const rows = await db.prepare(`
      SELECT id, participant1_id, participant2_id, created_at, updated_at
      FROM conversations
      WHERE participant1_id = ? OR participant2_id = ?
      ORDER BY updated_at DESC
    `).all(currentUserId, currentUserId);

    const conversations = await Promise.all(rows.map(conv => formatConversation(conv, currentUserId)));

    res.json({ conversations });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve conversations' });
  }
});

// -------------------------------------------------------------
// 14. Start or Reuse Conversation (POST /api/conversations)
// -------------------------------------------------------------
app.post('/api/conversations', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const recipientId = req.body.recipientId || req.body.personId;

    if (!recipientId) {
      return res.status(400).json({ error: 'Recipient ID is required' });
    }

    if (recipientId === currentUserId) {
      return res.status(400).json({ error: 'Cannot start conversation with yourself' });
    }

    const recipient = await db.prepare('SELECT id, status FROM users WHERE id = ?').get(recipientId);
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient user not found' });
    }

    if (recipient.status === 'suspended') {
      return res.status(403).json({ error: 'This recipient is suspended and cannot be contacted' });
    }

    const [p1, p2] = canonicalizeParticipants(currentUserId, recipientId);
    let conversation = await db.prepare(`
      SELECT id, participant1_id, participant2_id, created_at, updated_at
      FROM conversations
      WHERE participant1_id = ? AND participant2_id = ?
    `).get(p1, p2);

    let isNew = false;
    const now = new Date().toISOString();

    if (!conversation) {
      const convId = crypto.randomUUID();
      await db.prepare(`
        INSERT INTO conversations (id, participant1_id, participant2_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(convId, p1, p2, now, now);

      conversation = await db.prepare('SELECT id, participant1_id, participant2_id, created_at, updated_at FROM conversations WHERE id = ?').get(convId);
      isNew = true;
    }

    // If an initial text message was provided in request body
    if (req.body.text !== undefined) {
      if (typeof req.body.text !== 'string' || !req.body.text.trim()) {
        return res.status(400).json({ error: 'Message must be between 1 and 2000 characters' });
      }
      const trimmed = req.body.text.trim();
      if (trimmed.length > 2000) {
        return res.status(400).json({ error: 'Message must be between 1 and 2000 characters' });
      }

      const msgId = crypto.randomUUID();
      const msgTime = new Date().toISOString();

      await db.prepare(`
        INSERT INTO messages (id, conversation_id, sender_id, text, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(msgId, conversation.id, currentUserId, trimmed, msgTime);

      await db.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?').run(msgTime, conversation.id);

      await db.prepare(`
        INSERT INTO conversation_reads (conversation_id, user_id, last_read_at)
        VALUES (?, ?, ?)
        ON CONFLICT(conversation_id, user_id) DO UPDATE SET last_read_at = ?
      `).run(conversation.id, currentUserId, msgTime, msgTime);

      conversation = await db.prepare('SELECT id, participant1_id, participant2_id, created_at, updated_at FROM conversations WHERE id = ?').get(conversation.id);
    }

    const formatted = await formatConversation(conversation, currentUserId);
    res.status(isNew ? 201 : 200).json({ conversation: formatted });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start or retrieve conversation' });
  }
});

// -------------------------------------------------------------
// 15. Get Single Conversation Detail (GET /api/conversations/:id)
// -------------------------------------------------------------
app.get('/api/conversations/:id', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const conversation = await db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (conversation.participant1_id !== currentUserId && conversation.participant2_id !== currentUserId) {
      return res.status(403).json({ error: 'Access denied: you are not a participant in this conversation' });
    }

    const formatted = await formatConversation(conversation, currentUserId);
    res.json({ conversation: formatted });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve conversation' });
  }
});

// -------------------------------------------------------------
// 16. Get Messages History (GET /api/conversations/:id/messages)
// -------------------------------------------------------------
app.get('/api/conversations/:id/messages', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const conversation = await db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Server-enforced participant authorization check
    if (conversation.participant1_id !== currentUserId && conversation.participant2_id !== currentUserId) {
      return res.status(403).json({ error: 'Access denied: you are not a participant in this conversation' });
    }

    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 1), 200);

    const rows = await db.prepare(`
      SELECT id, conversation_id, sender_id, text, created_at
      FROM messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC, id ASC
      LIMIT ?
    `).all(conversation.id, limit);

    const otherUserId = conversation.participant1_id === currentUserId ? conversation.participant2_id : conversation.participant1_id;
    const otherUser = await getPublicUserSummary(otherUserId);

    res.json({
      conversationId: conversation.id,
      otherParticipant: otherUser ? {
        id: otherUser.id,
        displayName: otherUser.displayName,
        courseName: otherUser.courseName,
        photoUrl: otherUser.photoUrl
      } : null,
      messages: rows.map(m => ({
        id: m.id,
        conversationId: m.conversation_id,
        senderId: m.sender_id,
        text: m.text,
        createdAt: m.created_at
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve messages' });
  }
});

// -------------------------------------------------------------
// 17. Send Message in Conversation (POST /api/conversations/:id/messages)
// -------------------------------------------------------------
app.post('/api/conversations/:id/messages', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const conversation = await db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Server-enforced participant authorization check
    if (conversation.participant1_id !== currentUserId && conversation.participant2_id !== currentUserId) {
      return res.status(403).json({ error: 'Access denied: you are not a participant in this conversation' });
    }

    // Check if recipient is suspended
    const otherUserId = conversation.participant1_id === currentUserId ? conversation.participant2_id : conversation.participant1_id;
    const recipient = await db.prepare('SELECT id, status FROM users WHERE id = ?').get(otherUserId);

    if (recipient && recipient.status === 'suspended') {
      return res.status(403).json({ error: 'Recipient account is suspended and cannot receive messages' });
    }

    // Validate message text length (1 to 2000 chars)
    if (!req.body || typeof req.body.text !== 'string') {
      return res.status(400).json({ error: 'Message text is required' });
    }

    const trimmed = req.body.text.trim();
    if (trimmed.length < 1 || trimmed.length > 2000) {
      return res.status(400).json({ error: 'Message must be between 1 and 2000 characters' });
    }

    const msgId = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.prepare(`
      INSERT INTO messages (id, conversation_id, sender_id, text, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(msgId, conversation.id, currentUserId, trimmed, now);

    await db.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?').run(now, conversation.id);

    // Update sender's read timestamp so their own message is not counted as unread
    await db.prepare(`
      INSERT INTO conversation_reads (conversation_id, user_id, last_read_at)
      VALUES (?, ?, ?)
      ON CONFLICT(conversation_id, user_id) DO UPDATE SET last_read_at = ?
    `).run(conversation.id, currentUserId, now, now);

    res.status(201).json({
      id: msgId,
      conversationId: conversation.id,
      senderId: currentUserId,
      text: trimmed,
      createdAt: now
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// -------------------------------------------------------------
// 18. Mark Conversation as Read (POST /api/conversations/:id/read)
// -------------------------------------------------------------
app.post('/api/conversations/:id/read', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const conversation = await db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Server-enforced participant authorization check
    if (conversation.participant1_id !== currentUserId && conversation.participant2_id !== currentUserId) {
      return res.status(403).json({ error: 'Access denied: you are not a participant in this conversation' });
    }

    const now = new Date().toISOString();
    await db.prepare(`
      INSERT INTO conversation_reads (conversation_id, user_id, last_read_at)
      VALUES (?, ?, ?)
      ON CONFLICT(conversation_id, user_id) DO UPDATE SET last_read_at = ?
    `).run(conversation.id, currentUserId, now, now);

    res.json({
      success: true,
      conversationId: conversation.id,
      unreadCount: 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark conversation as read' });
  }
});

// -------------------------------------------------------------
// Administrator Role-Based Authorization Middleware (FR-05)
// -------------------------------------------------------------
function adminMiddleware(req, res, next) {
  authMiddleware(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Administrator access required' });
    }
    next();
  });
}

function normalizeName(name) {
  if (typeof name !== 'string') return '';
  return name.trim().replace(/\s+/g, ' ');
}

const ADMIN_MANAGED_TABLES = {
  categories: { table: 'categories', hasCategory: false },
  skills: { table: 'skills', hasCategory: true },
  interests: { table: 'interests', hasCategory: true },
  courses: { table: 'courses', hasCategory: false }
};

// -------------------------------------------------------------
// 19. Administrator Workspace Data (GET /api/admin/workspace & /api/admin/load)
// -------------------------------------------------------------
app.get(['/api/admin/workspace', '/api/admin/load'], adminMiddleware, async (req, res) => {
  try {
    const categories = (await db.prepare('SELECT id, name, is_active FROM categories ORDER BY name ASC').all()).map(c => ({
      id: c.id,
      name: c.name,
      active: Boolean(c.is_active)
    }));

    const skills = (await db.prepare('SELECT id, name, category_id, is_active FROM skills ORDER BY name ASC').all()).map(s => ({
      id: s.id,
      name: s.name,
      categoryId: s.category_id || '',
      active: Boolean(s.is_active)
    }));

    const interests = (await db.prepare('SELECT id, name, category_id, is_active FROM interests ORDER BY name ASC').all()).map(i => ({
      id: i.id,
      name: i.name,
      categoryId: i.category_id || '',
      active: Boolean(i.is_active)
    }));

    const courses = (await db.prepare('SELECT id, name, is_active FROM courses ORDER BY name ASC').all()).map(c => ({
      id: c.id,
      name: c.name,
      active: Boolean(c.is_active)
    }));

    const usersRows = await db.prepare(`
      SELECT 
        users.id, 
        users.display_name, 
        users.email, 
        users.course_id, 
        users.role, 
        users.status, 
        courses.name AS course_name,
        profiles.bio,
        profiles.photo_url
      FROM users
      JOIN courses ON users.course_id = courses.id
      LEFT JOIN profiles ON users.id = profiles.user_id
      ORDER BY users.display_name ASC
    `).all();

    const users = await Promise.all(usersRows.map(async (u) => {
      const userSkills = (await db.prepare(`
        SELECT skills.name FROM profile_skills
        JOIN skills ON profile_skills.skill_id = skills.id
        WHERE profile_skills.user_id = ?
        ORDER BY skills.name ASC
      `).all(u.id)).map(r => r.name);

      const userInterests = (await db.prepare(`
        SELECT interests.name FROM profile_interests
        JOIN interests ON profile_interests.interest_id = interests.id
        WHERE profile_interests.user_id = ?
        ORDER BY interests.name ASC
      `).all(u.id)).map(r => r.name);

      const userGoals = (await db.prepare(`
        SELECT connection_goals.name FROM profile_goals
        JOIN connection_goals ON profile_goals.goal_id = connection_goals.id
        WHERE profile_goals.user_id = ?
        ORDER BY connection_goals.name ASC
      `).all(u.id)).map(r => r.name);

      return {
        id: u.id,
        displayName: u.display_name,
        email: u.email,
        courseId: u.course_id,
        courseName: u.course_name,
        role: u.role,
        status: u.status,
        bio: u.bio || '',
        photoUrl: u.photo_url || null,
        skills: userSkills,
        interests: userInterests,
        goals: userGoals
      };
    }));

    res.json({
      categories,
      skills,
      interests,
      courses,
      users
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load administrator workspace' });
  }
});

// -------------------------------------------------------------
// 20. Administrator Users List (GET /api/admin/users)
// -------------------------------------------------------------
app.get('/api/admin/users', adminMiddleware, async (req, res) => {
  try {
    const query = (req.query.query || '').trim().toLowerCase();
    const statusFilter = req.query.status || 'all';

    const usersRows = await db.prepare(`
      SELECT 
        users.id, 
        users.display_name, 
        users.email, 
        users.course_id, 
        users.role, 
        users.status, 
        courses.name AS course_name,
        profiles.bio,
        profiles.photo_url
      FROM users
      JOIN courses ON users.course_id = courses.id
      LEFT JOIN profiles ON users.id = profiles.user_id
      ORDER BY users.display_name ASC
    `).all();

    const filtered = usersRows.filter(u => {
      const matchQuery = !query || 
        u.display_name.toLowerCase().includes(query) || 
        u.email.toLowerCase().includes(query);
      const matchStatus = statusFilter === 'all' || u.status === statusFilter;
      return matchQuery && matchStatus;
    });

    const users = await Promise.all(filtered.map(async (u) => {
      const userSkills = (await db.prepare(`
        SELECT skills.name FROM profile_skills
        JOIN skills ON profile_skills.skill_id = skills.id
        WHERE profile_skills.user_id = ?
        ORDER BY skills.name ASC
      `).all(u.id)).map(r => r.name);

      const userInterests = (await db.prepare(`
        SELECT interests.name FROM profile_interests
        JOIN interests ON profile_interests.interest_id = interests.id
        WHERE profile_interests.user_id = ?
        ORDER BY interests.name ASC
      `).all(u.id)).map(r => r.name);

      return {
        id: u.id,
        displayName: u.display_name,
        email: u.email,
        courseId: u.course_id,
        courseName: u.course_name,
        role: u.role,
        status: u.status,
        bio: u.bio || '',
        photoUrl: u.photo_url || null,
        skills: userSkills,
        interests: userInterests
      };
    }));

    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
});

// -------------------------------------------------------------
// 21. Administrator User Inspection Detail (GET /api/admin/users/:id)
// -------------------------------------------------------------
app.get('/api/admin/users/:id', adminMiddleware, async (req, res) => {
  try {
    const user = await db.prepare(`
      SELECT 
        users.id, 
        users.display_name, 
        users.email, 
        users.course_id, 
        users.role, 
        users.status, 
        courses.name AS course_name,
        profiles.bio,
        profiles.photo_url
      FROM users
      JOIN courses ON users.course_id = courses.id
      LEFT JOIN profiles ON users.id = profiles.user_id
      WHERE users.id = ?
    `).get(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const skills = (await db.prepare(`
      SELECT skills.name FROM profile_skills
      JOIN skills ON profile_skills.skill_id = skills.id
      WHERE profile_skills.user_id = ?
      ORDER BY skills.name ASC
    `).all(user.id)).map(r => r.name);

    const interests = (await db.prepare(`
      SELECT interests.name FROM profile_interests
      JOIN interests ON profile_interests.interest_id = interests.id
      WHERE profile_interests.user_id = ?
      ORDER BY interests.name ASC
    `).all(user.id)).map(r => r.name);

    const goals = (await db.prepare(`
      SELECT connection_goals.name FROM profile_goals
      JOIN connection_goals ON profile_goals.goal_id = connection_goals.id
      WHERE profile_goals.user_id = ?
      ORDER BY connection_goals.name ASC
    `).all(user.id)).map(r => r.name);

    // Explicitly exclude private messages to guarantee privacy
    res.json({
      id: user.id,
      displayName: user.display_name,
      email: user.email,
      courseId: user.course_id,
      courseName: user.course_name,
      role: user.role,
      status: user.status,
      bio: user.bio || '',
      photoUrl: user.photo_url || null,
      skills,
      interests,
      goals
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to inspect user' });
  }
});

// -------------------------------------------------------------
// 22. Administrator User Moderation / Suspension (PATCH /api/admin/users/:id)
// -------------------------------------------------------------
app.patch('/api/admin/users/:id', adminMiddleware, async (req, res) => {
  try {
    const user = await db.prepare('SELECT id, course_id, status FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'This user is unavailable' });
    }

    const { courseId, status } = req.body || {};
    let updatedCourseId = user.course_id;
    let updatedStatus = user.status;
    let revokedSessions = 0;

    // Validate course assignment correction
    if (courseId !== undefined && courseId !== user.course_id) {
      const activeCourse = await db.prepare('SELECT id FROM courses WHERE id = ? AND is_active = 1').get(courseId);
      if (!activeCourse) {
        return res.status(400).json({ error: 'Choose an active course' });
      }
      updatedCourseId = activeCourse.id;
    }

    // Validate status change
    if (status !== undefined) {
      if (!['active', 'suspended'].includes(status)) {
        return res.status(400).json({ error: 'Choose a valid account status' });
      }
      updatedStatus = status;

      // Acceptance Criterion 7: Suspension revokes access immediately
      if (status === 'suspended') {
        const result = await db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);
        revokedSessions = result.changes;
      }
    }

    await db.prepare('UPDATE users SET course_id = ?, status = ? WHERE id = ?').run(updatedCourseId, updatedStatus, user.id);

    const updatedUser = await db.prepare(`
      SELECT 
        users.id, 
        users.display_name, 
        users.email, 
        users.course_id, 
        users.role, 
        users.status, 
        courses.name AS course_name
      FROM users
      JOIN courses ON users.course_id = courses.id
      WHERE users.id = ?
    `).get(user.id);

    res.json({
      id: updatedUser.id,
      displayName: updatedUser.display_name,
      courseId: updatedUser.course_id,
      courseName: updatedUser.course_name,
      status: updatedUser.status,
      revokedSessions
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// -------------------------------------------------------------
// 23. List Managed Records (GET /api/admin/:kind)
// -------------------------------------------------------------
app.get('/api/admin/:kind', adminMiddleware, async (req, res) => {
  try {
    const config = ADMIN_MANAGED_TABLES[req.params.kind];
    if (!config) {
      return res.status(404).json({ error: 'Unknown managed list' });
    }

    const rows = await db.prepare(`SELECT * FROM ${config.table} ORDER BY name ASC`).all();
    const records = rows.map(r => {
      const item = {
        id: r.id,
        name: r.name,
        active: Boolean(r.is_active)
      };
      if (config.hasCategory) {
        item.categoryId = r.category_id || '';
      }
      return item;
    });

    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve managed records' });
  }
});

// -------------------------------------------------------------
// 24. Create Managed Record (POST /api/admin/:kind)
// -------------------------------------------------------------
app.post('/api/admin/:kind', adminMiddleware, async (req, res) => {
  try {
    const config = ADMIN_MANAGED_TABLES[req.params.kind];
    if (!config) {
      return res.status(404).json({ error: 'Unknown managed list' });
    }

    const { name, categoryId } = req.body || {};
    const normalized = normalizeName(name);

    if (!normalized || normalized.length > 80) {
      return res.status(400).json({ error: 'Enter a name between 1 and 80 characters' });
    }

    // Duplicate check across existing names in this managed list (case-insensitive)
    const duplicate = await db.prepare(`SELECT id FROM ${config.table} WHERE LOWER(name) = LOWER(?)`).get(normalized);
    if (duplicate) {
      return res.status(409).json({ error: 'This name already exists in this list' });
    }

    // Category association validation for skills and interests
    let validCategoryId = null;
    if (config.hasCategory && categoryId) {
      const cat = await db.prepare('SELECT id, is_active FROM categories WHERE id = ?').get(categoryId);
      if (!cat || !cat.is_active) {
        return res.status(400).json({ error: 'Choose an active category' });
      }
      validCategoryId = cat.id;
    }

    // Generate unique ID
    let newId = normalized.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const idTaken = await db.prepare(`SELECT id FROM ${config.table} WHERE id = ?`).get(newId);
    if (!newId || idTaken) {
      newId = `${newId || req.params.kind.slice(0, -1)}-${crypto.randomUUID().slice(0, 8)}`;
    }

    if (config.hasCategory) {
      await db.prepare(`
        INSERT INTO ${config.table} (id, name, category_id, is_active)
        VALUES (?, ?, ?, 1)
      `).run(newId, normalized, validCategoryId);
    } else {
      await db.prepare(`
        INSERT INTO ${config.table} (id, name, is_active)
        VALUES (?, ?, 1)
      `).run(newId, normalized);
    }

    const created = {
      id: newId,
      name: normalized,
      active: true
    };
    if (config.hasCategory) {
      created.categoryId = validCategoryId || '';
    }

    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create managed record' });
  }
});

// -------------------------------------------------------------
// 25. Update or Deactivate Managed Record (PATCH /api/admin/:kind/:id)
// -------------------------------------------------------------
app.patch('/api/admin/:kind/:id', adminMiddleware, async (req, res) => {
  try {
    const config = ADMIN_MANAGED_TABLES[req.params.kind];
    if (!config) {
      return res.status(404).json({ error: 'Unknown managed list' });
    }

    const record = await db.prepare(`SELECT * FROM ${config.table} WHERE id = ?`).get(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'This record is unavailable' });
    }

    const { name, categoryId, active, isActive } = req.body || {};
    let updatedName = record.name;
    let updatedCategoryId = config.hasCategory ? record.category_id : null;
    let updatedActive = record.is_active;

    if (name !== undefined) {
      const normalized = normalizeName(name);
      if (!normalized || normalized.length > 80) {
        return res.status(400).json({ error: 'Enter a name between 1 and 80 characters' });
      }
      const duplicate = await db.prepare(`
        SELECT id FROM ${config.table} 
        WHERE LOWER(name) = LOWER(?) AND id != ?
      `).get(normalized, req.params.id);

      if (duplicate) {
        return res.status(409).json({ error: 'This name already exists in this list' });
      }
      updatedName = normalized;
    }

    if (config.hasCategory && categoryId !== undefined) {
      if (categoryId && categoryId !== record.category_id) {
        const cat = await db.prepare('SELECT id, is_active FROM categories WHERE id = ?').get(categoryId);
        if (!cat || !cat.is_active) {
          return res.status(400).json({ error: 'Choose an active category' });
        }
        updatedCategoryId = cat.id;
      } else if (!categoryId) {
        updatedCategoryId = null;
      }
    }

    if (active !== undefined) {
      updatedActive = active ? 1 : 0;
    } else if (isActive !== undefined) {
      updatedActive = isActive ? 1 : 0;
    }

    if (config.hasCategory) {
      await db.prepare(`
        UPDATE ${config.table}
        SET name = ?, category_id = ?, is_active = ?
        WHERE id = ?
      `).run(updatedName, updatedCategoryId, updatedActive, req.params.id);
    } else {
      await db.prepare(`
        UPDATE ${config.table}
        SET name = ?, is_active = ?
        WHERE id = ?
      `).run(updatedName, updatedActive, req.params.id);
    }

    const result = {
      id: record.id,
      name: updatedName,
      active: Boolean(updatedActive)
    };
    if (config.hasCategory) {
      result.categoryId = updatedCategoryId || '';
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update managed record' });
  }
});

// =============================================================
// FR-06: ACCOUNT SETTINGS
// =============================================================

const passwordAttemptLimiter = new Map();
const MAX_PASSWORD_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// -------------------------------------------------------------
// 26. Get Account Settings (GET /api/account)
// -------------------------------------------------------------
app.get(['/api/account', '/api/account/settings'], authMiddleware, async (req, res) => {
  try {
    const user = await db.prepare(`
      SELECT 
        users.id, 
        users.display_name, 
        users.email, 
        users.course_id, 
        users.role, 
        users.status, 
        courses.name AS course_name
      FROM users
      JOIN courses ON users.course_id = courses.id
      WHERE users.id = ?
    `).get(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User account not found' });
    }

    res.json({
      id: user.id,
      displayName: user.display_name,
      email: user.email,
      courseId: user.course_id,
      courseName: user.course_name,
      role: user.role,
      status: user.status
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve account settings' });
  }
});

// -------------------------------------------------------------
// 27. Update Account Settings (PATCH / PUT /api/account)
// -------------------------------------------------------------
async function handleUpdateAccount(req, res) {
  try {
    const { displayName, courseId } = req.body;

    if (displayName === undefined && courseId === undefined) {
      return res.status(400).json({ error: 'Provide at least one field to update (displayName or courseId)' });
    }

    let trimmedName = undefined;
    if (displayName !== undefined) {
      if (typeof displayName !== 'string') {
        return res.status(400).json({ error: 'Display name must be a string' });
      }
      trimmedName = displayName.trim();
      if (trimmedName.length < 1 || trimmedName.length > 80) {
        return res.status(400).json({ error: 'Enter a name between 1 and 80 characters.' });
      }
    }

    let validCourse = undefined;
    if (courseId !== undefined) {
      validCourse = await db.prepare('SELECT id, name FROM courses WHERE id = ? AND is_active = 1').get(courseId);
      if (!validCourse) {
        return res.status(400).json({ error: 'Choose an active course.' });
      }
    }

    const updateTx = db.transaction(async () => {
      if (trimmedName !== undefined && validCourse !== undefined) {
        await db.prepare('UPDATE users SET display_name = ?, course_id = ? WHERE id = ?').run(trimmedName, validCourse.id, req.user.id);
      } else if (trimmedName !== undefined) {
        await db.prepare('UPDATE users SET display_name = ? WHERE id = ?').run(trimmedName, req.user.id);
      } else if (validCourse !== undefined) {
        await db.prepare('UPDATE users SET course_id = ? WHERE id = ?').run(validCourse.id, req.user.id);
      }
    });

    await updateTx();

    const updatedUser = await db.prepare(`
      SELECT 
        users.id, 
        users.display_name, 
        users.email, 
        users.course_id, 
        users.role, 
        users.status, 
        courses.name AS course_name
      FROM users
      JOIN courses ON users.course_id = courses.id
      WHERE users.id = ?
    `).get(req.user.id);

    res.json({
      id: updatedUser.id,
      displayName: updatedUser.display_name,
      email: updatedUser.email,
      courseId: updatedUser.course_id,
      courseName: updatedUser.course_name,
      role: updatedUser.role,
      message: 'Account settings updated successfully'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update account settings' });
  }
}

app.patch(['/api/account', '/api/account/settings'], authMiddleware, handleUpdateAccount);
app.put(['/api/account', '/api/account/settings'], authMiddleware, handleUpdateAccount);

// -------------------------------------------------------------
// 28. Change Password with Reauthentication (POST /api/account/password)
// -------------------------------------------------------------
app.post('/api/account/password', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = Date.now();

    // Check brute-force rate limit
    const attemptRecord = passwordAttemptLimiter.get(userId);
    if (attemptRecord) {
      if (now - attemptRecord.firstAttemptTime > RATE_LIMIT_WINDOW_MS) {
        passwordAttemptLimiter.delete(userId);
      } else if (attemptRecord.count >= MAX_PASSWORD_ATTEMPTS) {
        return res.status(429).json({ error: 'Too many failed password attempts. Please try again later.' });
      }
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    // Fetch user password hash
    const user = await db.prepare('SELECT password_hash FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ error: 'User account not found' });
    }

    // Reauthenticate current password
    const isCurrentValid = bcrypt.compareSync(currentPassword, user.password_hash);
    if (!isCurrentValid) {
      const currentAttempts = passwordAttemptLimiter.get(userId) || { count: 0, firstAttemptTime: now };
      currentAttempts.count += 1;
      passwordAttemptLimiter.set(userId, currentAttempts);
      return res.status(401).json({ error: 'The current password is incorrect.' });
    }

    // Validate new password rules
    if (typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 128) {
      return res.status(400).json({ error: 'Use between 8 and 128 characters.' });
    }

    if (newPassword === currentPassword) {
      return res.status(400).json({ error: 'Choose a different password.' });
    }

    // Hash new password
    const newHash = bcrypt.hashSync(newPassword, 10);

    const updatePasswordTx = db.transaction(async () => {
      await db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, userId);
      // Revoke all other active sessions while preserving current token
      await db.prepare('DELETE FROM sessions WHERE user_id = ? AND token != ?').run(userId, req.token);
    });

    await updatePasswordTx();

    // Reset rate limiter on success
    passwordAttemptLimiter.delete(userId);

    res.json({
      message: 'Password updated successfully. Other active sessions have been revoked.',
      sessionsRevoked: true
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// Start the server if file is executed directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;
