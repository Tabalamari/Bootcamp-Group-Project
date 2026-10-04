/**
 * Автоматизований тестовий скрипт для перевірки всіх вимог Маріанни та критеріїв Цінглінг
 * Запуск: node test.js
 */

const app = require('./server');
const db = require('./db');

async function runTests() {
  console.log('\n=== ПОЧАТОК ТЕСТУВАННЯ BACKEND API ===\n');

  // Запуск сервера на вільному динамічному порті
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
    // Очищення тестових користувачів перед тестом (якщо залишились)
    db.prepare("DELETE FROM users WHERE email LIKE 'test%@example.com'").run();

    // ТЕСТ 1: Отримання курсів (GET /api/courses)
    const resCourses = await fetch(`${baseUrl}/courses`);
    const courses = await resCourses.json();
    assert(
      resCourses.status === 200 && Array.isArray(courses) && courses.length >= 2,
      'GET /api/courses повертає статус 200 та список активних курсів'
    );

    // ТЕСТ 2: Успішна реєстрація (POST /api/auth/register)
    const testUser = {
      displayName: 'Тестовий Студент',
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
      'POST /api/auth/register створює обліковий запис і повертає токен та дані користувача'
    );
    assert(
      regData.user.password_hash === undefined && regData.user.password === undefined,
      'Реєстрація не повертає пароль або хеш пароля у відповіді'
    );

    // ТЕСТ 3: Відхилення дубліката email (409 Conflict)
    const resDuplicate = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    assert(
      resDuplicate.status === 409,
      'POST /api/auth/register відхиляє дублікат email (409 Conflict)'
    );

    // ТЕСТ 4: Відхилення короткого пароля (< 8 символів)
    const resShortPass = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName: 'Короткий',
        email: 'test_short@example.com',
        password: 'short',
        courseId: 'software-dev'
      })
    });
    assert(
      resShortPass.status === 400,
      'POST /api/auth/register відхиляє пароль коротший за 8 символів (400 Bad Request)'
    );

    // ТЕСТ 5: Відхилення неіснуючого курсу
    const resInvalidCourse = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName: 'Невірний курс',
        email: 'test_invalid_course@example.com',
        password: 'password123',
        courseId: 'unknown-course-id'
      })
    });
    assert(
      resInvalidCourse.status === 400,
      'POST /api/auth/register відхиляє неіснуючий курс (400 Bad Request)'
    );

    // ТЕСТ 6: Успішний вхід (POST /api/auth/login)
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
      'POST /api/auth/login повертає статус 200 та новий сесійний токен'
    );

    const authToken = loginData.token;

    // ТЕСТ 7: Невірний пароль при вході
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
      'POST /api/auth/login повертає 401 Unauthorized при невірному паролі'
    );

    // ТЕСТ 8: Доступ до захищеного маршруту (GET /api/auth/me)
    const resMe = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const meData = await resMe.json();
    assert(
      resMe.status === 200 && meData.user.email === testUser.email,
      'GET /api/auth/me повертає дані профілю з валідним Bearer токеном'
    );

    // ТЕСТ 9: Відхилення неавторизованого доступу
    const resUnauthorized = await fetch(`${baseUrl}/auth/me`);
    assert(
      resUnauthorized.status === 401,
      'GET /api/auth/me відхиляє запит без токена (401 Unauthorized)'
    );

    // ТЕСТ 10: Вихід із системи (POST /api/auth/logout)
    const resLogout = await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert(
      resLogout.status === 200,
      'POST /api/auth/logout успішно завершує сесію (200 OK)'
    );

    // ТЕСТ 11: Перевірка, що токен більше не дійсний після logout
    const resAfterLogout = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert(
      resAfterLogout.status === 401,
      'GET /api/auth/me повертає 401 для токена після завершення сесії'
    );

  } catch (err) {
    console.error('Помилка під час виконання тестів:', err);
    failed++;
  } finally {
    // Очищення тестових записів
    db.prepare("DELETE FROM users WHERE email LIKE 'test%@example.com'").run();

    server.close();
    console.log(`\n=== РЕЗУЛЬТАТ: ${passed} пройдено, ${failed} провалено ===\n`);
    if (failed > 0) {
      process.exit(1);
    }
  }
}

runTests();
