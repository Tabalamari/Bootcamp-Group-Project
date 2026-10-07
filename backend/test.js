/**
 * Automated test suite for Marianna's backend requirements and Qingling's criteria
 * Covers FR-01 (Authentication & Courses), FR-02 (User Profiles), FR-03 (Search & Explainable Fit), and FR-04 (Private Messaging)
 * Usage: npm test
 */

const fs = require('fs');
const path = require('path');
const app = require('./server');
const db = require('./db');

async function runTests() {
  console.log('\n=== STARTING BACKEND API TESTS (FR-01, FR-02, FR-03 & FR-04) ===\n');

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
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
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
      Array.isArray(publicProfile.goals) &&
      Array.isArray(publicProfile.fitReasons),
      'TEST 23: GET /api/profiles/:userId returns public profile fields and fitReasons for other learners'
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

    // Restore test user to active status for Discovery tests
    db.prepare("UPDATE users SET status = 'active' WHERE id = ?").run(testUserId);

    // TEST 27: Unauthenticated profile requests return 401
    const resUnauthProfile = await fetch(`${baseUrl}/profiles/me`);
    assert(
      resUnauthProfile.status === 401,
      'TEST 27: GET /api/profiles/me rejects unauthenticated requests (401 Unauthorized)'
    );

    // =========================================================
    // FR-03: SEARCH AND EXPLAINABLE FIT (DISCOVERY)
    // =========================================================

    // Setup candidate fixtures for Discovery testing
    // Candidate 1: Amara Lewis (business-dev, Sustainability, Project collaboration)
    const amaraUser = {
      displayName: 'Amara Lewis',
      email: 'test_amara@example.com',
      password: 'StrongPassword123!',
      courseId: 'business-dev'
    };
    const resAmara = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(amaraUser)
    });
    const amaraData = await resAmara.json();
    await fetch(`${baseUrl}/profiles/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${amaraData.token}` },
      body: JSON.stringify({
        bio: 'Turning a sustainable shopping idea into a useful first product. Looking for a developer.',
        skills: ['Market research', 'Product strategy'],
        interests: ['Sustainability', 'Technology'],
        goals: ['Project collaboration']
      })
    });

    // Candidate 2: Daniel Park (software-dev, React, Accessibility, Design, Peer support)
    const danielUser = {
      displayName: 'Daniel Park',
      email: 'test_daniel@example.com',
      password: 'StrongPassword123!',
      courseId: 'software-dev'
    };
    const resDaniel = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(danielUser)
    });
    const danielData = await resDaniel.json();
    await fetch(`${baseUrl}/profiles/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${danielData.token}` },
      body: JSON.stringify({
        bio: 'Frontend learner interested in accessible experiences.',
        skills: ['React', 'Accessibility'],
        interests: ['Education', 'Design'],
        goals: ['Peer support']
      })
    });

    // Candidate 3: Sofia Ahmed (business-dev, Marketing, Entrepreneurship, Friendship)
    const sofiaUser = {
      displayName: 'Sofia Ahmed',
      email: 'test_sofia@example.com',
      password: 'StrongPassword123!',
      courseId: 'business-dev'
    };
    const resSofia = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sofiaUser)
    });
    const sofiaData = await resSofia.json();
    await fetch(`${baseUrl}/profiles/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sofiaData.token}` },
      body: JSON.stringify({
        bio: 'Exploring ideas and looking for friendship.',
        skills: ['Marketing'],
        interests: ['Entrepreneurship'],
        goals: ['Friendship']
      })
    });

    // Candidate 4: Suspended User (must never appear in discovery)
    const suspendedUser = {
      displayName: 'Suspended Member',
      email: 'test_suspended_discovery@example.com',
      password: 'StrongPassword123!',
      courseId: 'software-dev'
    };
    const resSusp = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(suspendedUser)
    });
    const suspData = await resSusp.json();
    db.prepare("UPDATE users SET status = 'suspended' WHERE id = ?").run(suspData.user.id);

    // TEST 28: Full Discovery List - Exclusion of self and suspended accounts (Acceptance Criterion 5)
    // Logged in as testUser (Alex Rivers, software-dev)
    const resAllDiscovery = await fetch(`${baseUrl}/profiles`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const allDiscoveryData = await resAllDiscovery.json();
    const candidateIds = allDiscoveryData.profiles.map(p => p.id);

    assert(
      resAllDiscovery.status === 200 &&
      !candidateIds.includes(testUserId) &&
      !candidateIds.includes(suspData.user.id) &&
      candidateIds.includes(amaraData.user.id) &&
      candidateIds.includes(danielData.user.id) &&
      candidateIds.includes(sofiaData.user.id),
      'TEST 28: GET /api/profiles returns active community members while strictly excluding self and suspended users'
    );

    // TEST 29: Clear filters recovers full list (Acceptance Criterion 3)
    assert(
      allDiscoveryData.pagination.total >= 4 &&
      allDiscoveryData.profiles.length === allDiscoveryData.pagination.total,
      'TEST 29: Default request without filter parameters returns full eligible community list'
    );

    // TEST 30: Course filter (Acceptance Criterion 1)
    const resCourseFilter = await fetch(`${baseUrl}/profiles?courseId=business-dev`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const courseFilterData = await resCourseFilter.json();
    const allBusiness = courseFilterData.profiles.every(p => p.courseId === 'business-dev');
    assert(
      resCourseFilter.status === 200 && allBusiness && courseFilterData.profiles.length >= 2,
      'TEST 30: Course filter correctly returns only participants from selected course'
    );

    // TEST 31: Single skill filter (Acceptance Criterion 1)
    const resSkillFilter = await fetch(`${baseUrl}/profiles?skills=Accessibility`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const skillFilterData = await resSkillFilter.json();
    assert(
      resSkillFilter.status === 200 &&
      skillFilterData.profiles.length === 1 &&
      skillFilterData.profiles[0].displayName === 'Daniel Park',
      'TEST 31: Single skill filter returns users possessing the requested skill'
    );

    // TEST 32: Multiple selections within group combine with OR (Acceptance Criterion 2)
    const resOrFilter = await fetch(`${baseUrl}/profiles?skills=Accessibility,Marketing`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const orFilterData = await resOrFilter.json();
    const orNames = orFilterData.profiles.map(p => p.displayName);
    assert(
      resOrFilter.status === 200 &&
      orNames.includes('Daniel Park') &&
      orNames.includes('Sofia Ahmed'),
      'TEST 32: Multiple selections within skill group combine with OR logic'
    );

    // TEST 33: Different filter groups combine with AND (Acceptance Criterion 2)
    // courseId=business-dev AND interests=Sustainability -> should match Amara Lewis only
    const resAndFilter = await fetch(`${baseUrl}/profiles?courseId=business-dev&interests=Sustainability`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const andFilterData = await resAndFilter.json();
    assert(
      resAndFilter.status === 200 &&
      andFilterData.profiles.length === 1 &&
      andFilterData.profiles[0].displayName === 'Amara Lewis',
      'TEST 33: Different filter groups (course AND interest) combine with AND logic'
    );

    // TEST 34: Text search query across name, bio, skills, and interests
    const resQuerySearch = await fetch(`${baseUrl}/profiles?query=sustainable`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const querySearchData = await resQuerySearch.json();
    assert(
      resQuerySearch.status === 200 &&
      querySearchData.profiles.length === 1 &&
      querySearchData.profiles[0].displayName === 'Amara Lewis',
      'TEST 34: Text search query finds matches across bio and profile fields'
    );

    // TEST 35: Factual evidence-based fit explanation (Acceptance Criteria 6 & 7)
    // Viewer: Alex Rivers (software-dev, skills: [React, JavaScript, Node.js], interests: [Technology, Education], goals: [Project collaboration, Co-founder partnership])
    // Candidate Amara Lewis: (business-dev, interests: [Sustainability, Technology], goals: [Project collaboration])
    const amaraProfileCard = allDiscoveryData.profiles.find(p => p.id === amaraData.user.id);
    assert(
      amaraProfileCard &&
      Array.isArray(amaraProfileCard.fitReasons) &&
      amaraProfileCard.fitReasons.some(r => r.includes('Shared interest: Technology')) &&
      amaraProfileCard.fitReasons.some(r => r.includes('Shared goal: Project collaboration')) &&
      amaraProfileCard.fitReasons.some(r => r.includes('Different courses, with a shared interest in project collaboration')),
      'TEST 35: Candidate includes factual fit reasons: shared interest, shared goal, and cross-course collaboration'
    );

    // TEST 36: Skill in common fit explanation
    // Candidate Daniel Park has skill 'React' in common with viewer Alex Rivers
    const danielProfileCard = allDiscoveryData.profiles.find(p => p.id === danielData.user.id);
    assert(
      danielProfileCard &&
      danielProfileCard.fitReasons.some(r => r.includes('Skill in common: React')),
      'TEST 36: Candidate includes factual fit reasons for shared skills'
    );

    // TEST 37: Fallback explanation when no criteria match (Acceptance Criterion 8)
    // Candidate Sofia Ahmed has no shared skills, interests, or goals with Alex Rivers
    const sofiaProfileCard = allDiscoveryData.profiles.find(p => p.id === sofiaData.user.id);
    assert(
      sofiaProfileCard &&
      sofiaProfileCard.fitReasons.length === 1 &&
      sofiaProfileCard.fitReasons[0] === 'No shared criteria found yet.',
      'TEST 37: When no shared criteria exist, fitReasons states "No shared criteria found yet."'
    );

    // TEST 38: Empty search results state (Acceptance Criterion 9)
    const resEmpty = await fetch(`${baseUrl}/profiles?query=unmatchable_string_xyz_123`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const emptyData = await resEmpty.json();
    assert(
      resEmpty.status === 200 &&
      Array.isArray(emptyData.profiles) &&
      emptyData.profiles.length === 0 &&
      emptyData.pagination.total === 0,
      'TEST 38: Search yielding no matches returns an empty array with total count 0'
    );

    // TEST 39: Pagination parameters (page and limit)
    const resPaged = await fetch(`${baseUrl}/profiles?limit=2&page=1`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const pagedData = await resPaged.json();
    assert(
      resPaged.status === 200 &&
      pagedData.profiles.length === 2 &&
      pagedData.pagination.limit === 2 &&
      pagedData.pagination.page === 1 &&
      pagedData.pagination.totalPages >= 2,
      'TEST 39: Pagination parameters limit and page return correctly sliced records with pagination metadata'
    );

    // TEST 40: Discovery privacy guarantee (Acceptance Criterion 7)
    const allCardsOmitPrivateFields = allDiscoveryData.profiles.every(p =>
      p.email === undefined &&
      p.password_hash === undefined &&
      p.password === undefined &&
      p.role === undefined &&
      p.status === undefined
    );
    assert(
      allCardsOmitPrivateFields,
      'TEST 40: Discovery profiles strictly exclude email, password_hash, role, and private account fields'
    );

    // =========================================================
    // FR-04: PRIVATE MESSAGING
    // =========================================================

    // TEST 41: Start conversation and send non-empty text message (Acceptance Criterion 1)
    const resStartConv = await fetch(`${baseUrl}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        recipientId: amaraData.user.id,
        text: 'Hello Amara, excited to collaborate on a bootcamp project!'
      })
    });
    const convData1 = await resStartConv.json();
    assert(
      resStartConv.status === 201 &&
      convData1.conversation &&
      convData1.conversation.id &&
      convData1.conversation.otherParticipant.id === amaraData.user.id &&
      convData1.conversation.lastMessage &&
      convData1.conversation.lastMessage.text === 'Hello Amara, excited to collaborate on a bootcamp project!' &&
      convData1.conversation.lastMessage.senderId === testUserId,
      'TEST 41: A user can start a conversation with another active user and send a non-empty text message (201 Created)'
    );

    const testConvId = convData1.conversation.id;

    // TEST 42: Deduplication - Starting a conversation with the same person reuses existing conversation (Acceptance Criterion 2)
    // Amara opens conversation with testUser
    const resReuseConv = await fetch(`${baseUrl}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${amaraData.token}`
      },
      body: JSON.stringify({
        recipientId: testUserId
      })
    });
    const convData2 = await resReuseConv.json();
    assert(
      resReuseConv.status === 200 &&
      convData2.conversation &&
      convData2.conversation.id === testConvId &&
      convData2.conversation.otherParticipant.id === testUserId,
      'TEST 42: Starting a conversation with the same person reuses the existing conversation (Deduplication)'
    );

    // TEST 43: Users cannot start a conversation with themselves (Acceptance Criterion 3)
    const resSelfConv = await fetch(`${baseUrl}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        recipientId: testUserId
      })
    });
    assert(
      resSelfConv.status === 400,
      'TEST 43: Users cannot start a conversation with themselves (400 Bad Request)'
    );

    // TEST 44: Server-enforced 2-participant isolation (Acceptance Criterion 4)
    // Daniel (third party) tries to access or send to conversation between testUser and Amara
    const resThirdPartyRead = await fetch(`${baseUrl}/conversations/${testConvId}/messages`, {
      headers: { Authorization: `Bearer ${danielData.token}` }
    });
    const resThirdPartySend = await fetch(`${baseUrl}/conversations/${testConvId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${danielData.token}`
      },
      body: JSON.stringify({ text: 'Intruding into private chat!' })
    });
    const resThirdPartyMarkRead = await fetch(`${baseUrl}/conversations/${testConvId}/read`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${danielData.token}` }
    });
    assert(
      resThirdPartyRead.status === 403 &&
      resThirdPartySend.status === 403 &&
      resThirdPartyMarkRead.status === 403,
      'TEST 44: Only the two participants can read, send messages, or update read state; enforced on the server (403 Forbidden)'
    );

    // TEST 45: Messages show sender and timestamp and appear in chronological order (Acceptance Criterion 5)
    // Amara sends a reply
    const resAmaraReply = await fetch(`${baseUrl}/conversations/${testConvId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${amaraData.token}`
      },
      body: JSON.stringify({ text: 'Hi Alex! I would love to discuss ideas.' })
    });

    // Alex sends a follow-up
    const resAlexFollowup = await fetch(`${baseUrl}/conversations/${testConvId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({ text: 'Great! Let us connect later today.' })
    });

    // Fetch conversation message history as Alex
    const resHistory = await fetch(`${baseUrl}/conversations/${testConvId}/messages`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const historyData = await resHistory.json();
    const isChronological =
      historyData.messages.length === 3 &&
      new Date(historyData.messages[0].createdAt).getTime() <= new Date(historyData.messages[1].createdAt).getTime() &&
      new Date(historyData.messages[1].createdAt).getTime() <= new Date(historyData.messages[2].createdAt).getTime();

    assert(
      resHistory.status === 200 &&
      isChronological &&
      historyData.messages[0].senderId === testUserId &&
      historyData.messages[1].senderId === amaraData.user.id &&
      historyData.messages[2].senderId === testUserId &&
      historyData.messages.every(m => m.id && m.text && m.createdAt),
      'TEST 45: Messages show sender and timestamp and appear in chronological order'
    );

    // TEST 46: Sent messages remain available after a new session / persistence in SQLite (Acceptance Criterion 6)
    // Log in again as testUser to simulate a new session
    const resNewLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, password: testUser.password })
    });
    const newLoginData = await resNewLogin.json();
    const resPersistedHistory = await fetch(`${baseUrl}/conversations/${testConvId}/messages`, {
      headers: { Authorization: `Bearer ${newLoginData.token}` }
    });
    const persistedData = await resPersistedHistory.json();
    assert(
      resPersistedHistory.status === 200 &&
      persistedData.messages.length === 3 &&
      persistedData.messages[2].text === 'Great! Let us connect later today.',
      'TEST 46: Sent messages persist in database and remain accessible in new user sessions'
    );

    // TEST 47: The inbox lists conversations and their latest message preview with unread count (Acceptance Criterion 7)
    // Check inbox for Amara (Alex sent the last message, so Amara should have 1 unread message)
    const resAmaraInbox = await fetch(`${baseUrl}/conversations`, {
      headers: { Authorization: `Bearer ${amaraData.token}` }
    });
    const amaraInboxData = await resAmaraInbox.json();
    const amaraConv = amaraInboxData.conversations.find(c => c.id === testConvId);
    assert(
      resAmaraInbox.status === 200 &&
      amaraConv &&
      amaraConv.otherParticipant.id === testUserId &&
      amaraConv.lastMessage.text === 'Great! Let us connect later today.' &&
      amaraConv.unreadCount === 1,
      'TEST 47: The inbox lists conversations, latest message preview, and unread count'
    );

    // TEST 48: Read endpoint clears unread count (Mark Read)
    const resMarkRead = await fetch(`${baseUrl}/conversations/${testConvId}/read`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${amaraData.token}` }
    });
    const markReadData = await resMarkRead.json();
    const resAmaraInboxAfterRead = await fetch(`${baseUrl}/conversations`, {
      headers: { Authorization: `Bearer ${amaraData.token}` }
    });
    const amaraInboxAfterReadData = await resAmaraInboxAfterRead.json();
    const amaraConvAfterRead = amaraInboxAfterReadData.conversations.find(c => c.id === testConvId);
    assert(
      resMarkRead.status === 200 &&
      markReadData.unreadCount === 0 &&
      amaraConvAfterRead.unreadCount === 0,
      'TEST 48: POST /api/conversations/:id/read clears the unread count for that conversation'
    );

    // TEST 49: Failed sends produce clear feedback and reject invalid input (Acceptance Criterion 8)
    const resBlankSend = await fetch(`${baseUrl}/conversations/${testConvId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({ text: '   ' })
    });
    const oversizedText = 'a'.repeat(2001);
    const resOversizedSend = await fetch(`${baseUrl}/conversations/${testConvId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({ text: oversizedText })
    });
    assert(
      resBlankSend.status === 400 &&
      resOversizedSend.status === 400,
      'TEST 49: Failed sends produce clear feedback and reject empty text or text > 2000 chars (400 Bad Request)'
    );

    // TEST 50: A suspended account cannot send messages or be contacted (Acceptance Criterion 9)
    // 1. Try to start conversation with suspended account
    const resContactSuspended = await fetch(`${baseUrl}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({ recipientId: suspData.user.id })
    });

    // 2. Try to send message as suspended user
    const resSuspendedSend = await fetch(`${baseUrl}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${suspData.token}`
      },
      body: JSON.stringify({ recipientId: testUserId, text: 'Hello from suspended user' })
    });

    assert(
      resContactSuspended.status === 403 &&
      resSuspendedSend.status === 403,
      'TEST 50: A suspended account cannot send messages or be contacted (403 Forbidden)'
    );

    // TEST 51: Privacy constraint - Conversation participant objects strictly exclude private account fields
    const recipientSummary = convData1.conversation.otherParticipant;
    assert(
      recipientSummary &&
      recipientSummary.displayName &&
      recipientSummary.email === undefined &&
      recipientSummary.password_hash === undefined &&
      recipientSummary.password === undefined &&
      recipientSummary.role === undefined &&
      recipientSummary.status === undefined,
      'TEST 51: Conversation participant summaries strictly exclude email, password_hash, role, and private fields'
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
