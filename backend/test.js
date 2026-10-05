/**
 * Automated test suite for Marianna's backend requirements and Qingling's criteria
 * Usage: node test.js
 */

process.env.DATABASE_PATH = ':memory:'; // Keep tests out of the development database.
const app = require('./server');
const db = require('./db');

async function runTests() {
  console.log('\n=== STARTING BACKEND API TESTS ===\n');

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

    // TEST 1: Retrieve courses (GET /api/courses)
    const resCourses = await fetch(`${baseUrl}/courses`);
    const courses = await resCourses.json();
    assert(
      resCourses.status === 200 && Array.isArray(courses) && courses.length >= 2,
      'GET /api/courses returns status 200 and a list of active courses'
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
      'POST /api/auth/register creates an account and returns token and user data'
    );
    assert(
      regData.user.password_hash === undefined && regData.user.password === undefined,
      'Registration response does not expose password or password hash'
    );

    // TEST 3: Duplicate email rejection (409 Conflict)
    const resDuplicate = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    assert(
      resDuplicate.status === 409,
      'POST /api/auth/register rejects duplicate email (409 Conflict)'
    );

    // TEST 4: Short password rejection (< 8 characters)
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
      'POST /api/auth/register rejects password shorter than 8 characters (400 Bad Request)'
    );

    // TEST 5: Non-existent course rejection
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
      'POST /api/auth/register rejects non-existent course (400 Bad Request)'
    );

    // TEST 6: Successful login (POST /api/auth/login)
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
      'POST /api/auth/login returns status 200 and a new session token'
    );

    const authToken = loginData.token;

    // TEST 7: Invalid password on login
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
      'POST /api/auth/login returns 401 Unauthorized on invalid password'
    );

    // TEST 8: Access protected route (GET /api/auth/me)
    const resMe = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const meData = await resMe.json();
    assert(
      resMe.status === 200 && meData.user.email === testUser.email,
      'GET /api/auth/me returns profile data with valid Bearer token'
    );

    // TEST 9: Unauthorized access rejection
    const resUnauthorized = await fetch(`${baseUrl}/auth/me`);
    assert(
      resUnauthorized.status === 401,
      'GET /api/auth/me rejects request without token (401 Unauthorized)'
    );

    // TEST 10: User logout (POST /api/auth/logout)
    const resLogout = await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert(
      resLogout.status === 200,
      'POST /api/auth/logout successfully terminates session (200 OK)'
    );

    const malformed = await fetch(`${baseUrl}/auth/register`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...testUser,email:123})});
    assert(malformed.status === 400, 'Malformed field types return 400, not a server error');
    const malformedLogin = await fetch(`${baseUrl}/auth/login`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:123,password:[]})});
    assert(malformedLogin.status === 400, 'Malformed login fields return 400');
    db.prepare('UPDATE courses SET is_active = 0 WHERE id = ?').run('business-dev');
    const inactive = await fetch(`${baseUrl}/auth/register`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...testUser,email:'inactive@example.com',courseId:'business-dev'})});
    assert(inactive.status === 400, 'Inactive course registration rejected');
    db.prepare('UPDATE users SET status = ? WHERE id = ?').run('suspended',regData.user.id);
    const suspended = await fetch(`${baseUrl}/auth/me`,{headers:{Authorization:`Bearer ${regData.token}`}});
    assert(suspended.status === 403, 'Suspended account denied access with an existing token');
    const suspendedLogin = await fetch(`${baseUrl}/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:testUser.email,password:testUser.password})});
    assert(suspendedLogin.status === 403, 'Suspended account cannot log in');
    db.prepare('UPDATE users SET status = ? WHERE id = ?').run('active',regData.user.id);
    const invalidToken = await fetch(`${baseUrl}/auth/me`,{headers:{Authorization:'Bearer not-a-session'}});
    assert(invalidToken.status === 401, 'Invalid token rejected');
    const stored = db.prepare('SELECT password_hash,role FROM users WHERE id = ?').get(regData.user.id);
    assert(stored.password_hash !== testUser.password && stored.role === 'learner', 'Database stores a password hash and learner role');

    // TEST 11: Verify token is invalid after logout
    const resAfterLogout = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert(
      resAfterLogout.status === 401,
      'GET /api/auth/me returns 401 for token after session termination'
    );

  } catch (err) {
    console.error('Error during test execution:', err);
    failed++;
  } finally {
    // Clean up test records
    db.prepare("DELETE FROM users WHERE email LIKE 'test%@example.com'").run();

    server.close();
    console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===\n`);
    if (failed > 0) {
      process.exit(1);
    }
  }
}

runTests();
