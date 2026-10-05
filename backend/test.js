/**
 * Automated test suite for Marianna's backend requirements and Qingling's criteria
 * Covers FR-01 (Authentication & Courses) and FR-02 (User Profiles)
 * Usage: npm test
 */

const fs = require('fs');
const path = require('path');
const app = require('./server');
const db = require('./db');

async function runTests() {
  console.log('\n=== STARTING BACKEND API TESTS (FR-01 & FR-02) ===\n');

  // Start server on an ephemeral port
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // Clean up test users before tests (if any remain)
    db.prepare("DELETE FROM users WHERE email LIKE 'test%@example.com'").run();

    // =========================================================
    // FR-01: AUTHENTICATION & COURSES
    // =========================================================

    // TEST 1: Retrieve courses (GET /api/courses)
    const resCourses = await fetch(`${baseUrl}/courses`);
    const courses = await resCourses.json();
    assert(
      resCourses.status === 200 && Array.isArray(courses) && courses.length >= 2,
      'TEST 1: GET /api/courses returns status 200 and a list of active courses'
    );

    // TEST 2: Successful registration (POST /api/auth/register)
    const testUser = {
      displayName: 'Test Student',
      email: 'test_student@example.com',
      password: 'StrongPassword123!',
      courseId: 'software-dev'
    };

    const resRegister = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    const regData = await resRegister.json();
    assert(
      resRegister.status === 201 && regData.token && regData.user.email === testUser.email,
      'TEST 2: POST /api/auth/register creates an account and returns token and user data'
    );
    assert(
      regData.user.password_hash === undefined && regData.user.password === undefined,
      'TEST 3: Registration response does not expose password or password hash'
    );

    // TEST 4: Duplicate email rejection (409 Conflict)
    const resDuplicate = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    assert(
      resDuplicate.status === 409,
      'TEST 4: POST /api/auth/register rejects duplicate email (409 Conflict)'
    );

    // TEST 5: Short password rejection (< 8 characters)
    const resShortPass = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName: 'Short',
        email: 'test_short@example.com',
        password: 'short',
        courseId: 'software-dev'
      })
    });
    assert(
      resShortPass.status === 400,
      'TEST 5: POST /api/auth/register rejects password shorter than 8 characters (400 Bad Request)'
    );

    // TEST 6: Non-existent course rejection
    const resInvalidCourse = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName: 'Invalid Course',
        email: 'test_invalid_course@example.com',
        password: 'password123',
        courseId: 'unknown-course-id'
      })
    });
    assert(
      resInvalidCourse.status === 400,
      'TEST 6: POST /api/auth/register rejects non-existent course (400 Bad Request)'
    );

    // TEST 7: Successful login (POST /api/auth/login)
    const resLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });
    const loginData = await resLogin.json();
    assert(
      resLogin.status === 200 && loginData.token && loginData.user.email === testUser.email,
      'TEST 7: POST /api/auth/login returns status 200 and a new session token'
    );

    let authToken = loginData.token;
    const testUserId = loginData.user.id;

    // TEST 8: Invalid password on login
    const resWrongPass = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: 'wrong_password'
      })
    });
    assert(
      resWrongPass.status === 401,
      'TEST 8: POST /api/auth/login returns 401 Unauthorized on invalid password'
    );

    // TEST 9: Access protected route (GET /api/auth/me)
    const resMe = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const meData = await resMe.json();
    assert(
      resMe.status === 200 && meData.user.email === testUser.email,
      'TEST 9: GET /api/auth/me returns account data with valid Bearer token'
    );

    // TEST 10: Unauthorized access rejection
    const resUnauthorized = await fetch(`${baseUrl}/auth/me`);
    assert(
      resUnauthorized.status === 401,
      'TEST 10: GET /api/auth/me rejects request without token (401 Unauthorized)'
    );

    // =========================================================
    // FR-02: USER PROFILES
    // =========================================================

    // TEST 11: Get profile options vocabulary (GET /api/profile-options)
    const resOptions = await fetch(`${baseUrl}/profile-options`);
    const optionsData = await resOptions.json();
    assert(
      resOptions.status === 200 &&
      Array.isArray(optionsData.skills) && optionsData.skills.length >= 5 &&
      Array.isArray(optionsData.interests) && optionsData.interests.length >= 3 &&
      Array.isArray(optionsData.goals) && optionsData.goals.length >= 2,
      'TEST 11: GET /api/profile-options returns active skills, interests, and connection goals'
    );

    // TEST 12: Initial profile state (Acceptance Criteria 1 & 5)
    // Missing photo uses null/placeholder and does not prevent profile view
    const resInitialProfile = await fetch(`${baseUrl}/profiles/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const initialProfile = await resInitialProfile.json();
    assert(
      resInitialProfile.status === 200 &&
      initialProfile.id === testUserId &&
      initialProfile.displayName === testUser.displayName &&
      initialProfile.courseName === 'Software Development' &&
      initialProfile.bio === '' &&
      initialProfile.photoUrl === null &&
      Array.isArray(initialProfile.skills) && initialProfile.skills.length === 0,
      'TEST 12: Initial profile contains display name, course, empty bio, null photoUrl, and empty choices'
    );

    // TEST 13: Update profile details (Acceptance Criteria 1, 2, 3)
    const updatePayload = {
      displayName: 'Alex Rivers',
      bio: 'Enthusiastic full-stack student building bootcamp projects.',
      skills: ['React', 'JavaScript', 'Node.js'],
      interests: ['Technology', 'Education'],
      goals: ['Project collaboration', 'Co-founder partnership']
    };

    const resUpdateProfile = await fetch(`${baseUrl}/profiles/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify(updatePayload)
    });
    const updatedProfile = await resUpdateProfile.json();

    assert(
      resUpdateProfile.status === 200 &&
      updatedProfile.displayName === 'Alex Rivers' &&
      updatedProfile.bio === updatePayload.bio &&
      updatedProfile.skills.includes('React') &&
      updatedProfile.interests.includes('Technology') &&
      updatedProfile.goals.includes('Project collaboration'),
      'TEST 13: PATCH /api/profiles/me successfully updates profile, skills, interests, and goals'
    );

    // TEST 14: Persistence across re-login (Acceptance Criterion 3)
    // Logout and login again; verify updated profile retains changes
    await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const resReLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, password: testUser.password })
    });
    const reLoginData = await resReLogin.json();
    authToken = reLoginData.token;

    const resReloadedProfile = await fetch(`${baseUrl}/profiles/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const reloadedProfile = await resReloadedProfile.json();
    assert(
      resReloadedProfile.status === 200 &&
      reloadedProfile.displayName === 'Alex Rivers' &&
      reloadedProfile.bio === updatePayload.bio &&
      reloadedProfile.skills.length === 3 &&
      reloadedProfile.interests.length === 2 &&
      reloadedProfile.goals.length === 2,
      'TEST 14: Profile edits are retained persistently after signing out and signing back in'
    );

    // TEST 15: Validation - displayName bounds (2 to 80 chars)
    const resInvalidName = await fetch(`${baseUrl}/profiles/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ displayName: 'A' })
    });
    assert(
      resInvalidName.status === 400,
      'TEST 15: PATCH /api/profiles/me rejects display name shorter than 2 characters (400 Bad Request)'
    );

    // TEST 16: Validation - bio length (max 500 chars)
    const resLongBio = await fetch(`${baseUrl}/profiles/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ bio: 'a'.repeat(501) })
    });
    assert(
      resLongBio.status === 400,
      'TEST 16: PATCH /api/profiles/me rejects bio longer than 500 characters (400 Bad Request)'
    );

    // TEST 17: Validation - invalid skill selection (Acceptance Criterion 2)
    const resInvalidSkill = await fetch(`${baseUrl}/profiles/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ skills: ['NonExistentSkill12345'] })
    });
    assert(
      resInvalidSkill.status === 400,
      'TEST 17: PATCH /api/profiles/me rejects skills outside administrator-managed list (400 Bad Request)'
    );

    // TEST 18: Photo upload - valid PNG (Acceptance Criteria 1 & 6)
    const photoFormData = new FormData();
    const fakeImageBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG magic header
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52
    ]);
    const imageBlob = new Blob([fakeImageBuffer], { type: 'image/png' });
    photoFormData.append('photo', imageBlob, 'avatar.png');

    const resUploadPhoto = await fetch(`${baseUrl}/profiles/me/photo`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: photoFormData
    });
    const uploadPhotoData = await resUploadPhoto.json();
    assert(
      resUploadPhoto.status === 200 &&
      uploadPhotoData.photoUrl &&
      uploadPhotoData.photoUrl.startsWith('/uploads/'),
      'TEST 18: POST /api/profiles/me/photo accepts valid image and returns photoUrl'
    );

    // Verify static access to the uploaded image
    const resStaticImage = await fetch(`http://localhost:${port}${uploadPhotoData.photoUrl}`);
    assert(
      resStaticImage.status === 200,
      'TEST 19: Static route /uploads/... successfully serves uploaded photo'
    );

    // TEST 20: Photo upload - unsupported format (Acceptance Criterion 6)
    const invalidFormatFormData = new FormData();
    const textBlob = new Blob(['Not an image file'], { type: 'text/plain' });
    invalidFormatFormData.append('photo', textBlob, 'document.txt');

    const resInvalidFormat = await fetch(`${baseUrl}/profiles/me/photo`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: invalidFormatFormData
    });
    assert(
      resInvalidFormat.status === 415,
      'TEST 20: Photo upload rejects unsupported format (415 Unsupported Media Type)'
    );

    // TEST 21: Photo upload - oversized file (> 5 MB) (Acceptance Criterion 6)
    const oversizedFormData = new FormData();
    // 5.2 MB buffer
    const largeBlob = new Blob([new Uint8Array(5.2 * 1024 * 1024)], { type: 'image/jpeg' });
    oversizedFormData.append('photo', largeBlob, 'huge.jpg');

    const resOversized = await fetch(`${baseUrl}/profiles/me/photo`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: oversizedFormData
    });
    assert(
      resOversized.status === 413,
      'TEST 21: Photo upload rejects files exceeding 5 MB limit (413 Payload Too Large)'
    );

    // TEST 22: Photo removal (DELETE /api/profiles/me/photo)
    const resDeletePhoto = await fetch(`${baseUrl}/profiles/me/photo`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const deletePhotoData = await resDeletePhoto.json();
    assert(
      resDeletePhoto.status === 200 && deletePhotoData.photoUrl === null,
      'TEST 22: DELETE /api/profiles/me/photo resets photoUrl to null'
    );

    // TEST 23: Public profile view by another user (Acceptance Criteria 4 & 7)
    // Register second user to inspect first user's public profile
    const secondUser = {
      displayName: 'Second Learner',
      email: 'test_second@example.com',
      password: 'StrongPassword123!',
      courseId: 'business-dev'
    };
    const resSecondUser = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(secondUser)
    });
    const secondUserData = await resSecondUser.json();
    const secondToken = secondUserData.token;

    const resPublicProfile = await fetch(`${baseUrl}/profiles/${testUserId}`, {
      headers: { Authorization: `Bearer ${secondToken}` }
    });
    const publicProfile = await resPublicProfile.json();
    assert(
      resPublicProfile.status === 200 &&
      publicProfile.id === testUserId &&
      publicProfile.displayName === 'Alex Rivers' &&
      publicProfile.courseName === 'Software Development' &&
      publicProfile.bio === updatePayload.bio &&
      Array.isArray(publicProfile.skills) &&
      Array.isArray(publicProfile.interests) &&
      Array.isArray(publicProfile.goals),
      'TEST 23: GET /api/profiles/:userId returns public profile fields for other learners'
    );

    // TEST 24: Privacy check - verify private fields are excluded (Acceptance Criterion 7)
    assert(
      publicProfile.email === undefined &&
      publicProfile.password_hash === undefined &&
      publicProfile.password === undefined &&
      publicProfile.role === undefined &&
      publicProfile.status === undefined,
      'TEST 24: Public profile strictly excludes email, password_hash, role, and private account fields'
    );

    // TEST 25: Public profile 404 for unknown user
    const resNotFound = await fetch(`${baseUrl}/profiles/unknown-user-id`, {
      headers: { Authorization: `Bearer ${secondToken}` }
    });
    assert(
      resNotFound.status === 404,
      'TEST 25: GET /api/profiles/:userId returns 404 for non-existent user'
    );

    // TEST 26: Suspended account profile access restriction (403 Forbidden)
    db.prepare("UPDATE users SET status = 'suspended' WHERE id = ?").run(testUserId);
    const resSuspendedProfile = await fetch(`${baseUrl}/profiles/${testUserId}`, {
      headers: { Authorization: `Bearer ${secondToken}` }
    });
    assert(
      resSuspendedProfile.status === 403,
      'TEST 26: Suspended account profiles are inaccessible to other learners (403 Forbidden)'
    );

    // TEST 27: Unauthenticated profile requests return 401
    const resUnauthProfile = await fetch(`${baseUrl}/profiles/me`);
    assert(
      resUnauthProfile.status === 401,
      'TEST 27: GET /api/profiles/me rejects unauthenticated requests (401 Unauthorized)'
    );

  } catch (err) {
    console.error('Error during test execution:', err);
    failed++;
  } finally {
    // Clean up test records
    db.prepare("DELETE FROM users WHERE email LIKE 'test%@example.com'").run();

    server.close();
    console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===\n`);
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
