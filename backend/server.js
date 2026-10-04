const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Базовий інформаційний маршрут
app.get('/api', (req, res) => {
  res.json({
    name: 'Bootcamp Connect API',
    status: 'online',
    version: '1.0.0'
  });
});

// Middleware для захисту маршрутів (перевірка токена сесії)
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Необхідно увійти в систему' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Токен сесії не надано' });
  }

  const session = db.prepare(`
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
    return res.status(401).json({ error: 'Сесія недійсна або застаріла' });
  }

  if (session.status === 'suspended') {
    return res.status(403).json({ error: 'Ваш акаунт заблоковано' });
  }

  req.user = session;
  req.token = token;
  next();
}

// -------------------------------------------------------------
// 1. Отримати список активних курсів (GET /api/courses)
// -------------------------------------------------------------
app.get('/api/courses', (req, res) => {
  try {
    const courses = db.prepare(`
      SELECT id, name 
      FROM courses 
      WHERE is_active = 1 
      ORDER BY name ASC
    `).all();

    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: 'Помилка отримання списку курсів' });
  }
});

// -------------------------------------------------------------
// 2. Реєстрація нового користувача (POST /api/auth/register)
// -------------------------------------------------------------
app.post('/api/auth/register', (req, res) => {
  try {
    const { displayName, email, password, courseId } = req.body;

    // Перевірка обов'язкових полів
    if (!displayName || !email || !password || !courseId) {
      return res.status(400).json({ error: "Всі поля (displayName, email, password, courseId) є обов'язковими" });
    }

    const trimmedName = displayName.trim();
    const normalizedEmail = email.trim().toLowerCase();

    // Валідація довжини імені
    if (trimmedName.length < 2) {
      return res.status(400).json({ error: "Ім'я повинно містити щонайменше 2 символи" });
    }

    // Валідація формату email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Введіть коректну адресу електронної пошти' });
    }

    // Валідація довжини пароля
    if (password.length < 8) {
      return res.status(400).json({ error: 'Пароль повинен містити щонайменше 8 символів' });
    }

    // Перевірка існування та активності курсу
    const course = db.prepare('SELECT id, name FROM courses WHERE id = ? AND is_active = 1').get(courseId);
    if (!course) {
      return res.status(400).json({ error: 'Обраний курс не існує або недоступний для вибору' });
    }

    // Перевірка унікальності email
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
    if (existingUser) {
      return res.status(409).json({ error: 'Користувач із цим email вже зареєстрований' });
    }

    // Хешування пароля та створення користувача
    const userId = crypto.randomUUID();
    const passwordHash = bcrypt.hashSync(password, 10);

    db.prepare(`
      INSERT INTO users (id, email, password_hash, display_name, course_id, role, status)
      VALUES (?, ?, ?, ?, ?, 'learner', 'active')
    `).run(userId, normalizedEmail, passwordHash, trimmedName, courseId);

    // Створення сесії (автологін)
    const token = crypto.randomUUID();
    db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, userId);

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
    res.status(500).json({ error: 'Помилка при реєстрації користувача' });
  }
});

// -------------------------------------------------------------
// 3. Вхід у систему (POST /api/auth/login)
// -------------------------------------------------------------
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Введіть email та пароль' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = db.prepare(`
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

    // Уніфікована помилка для безпеки (запобігання скануванню email)
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Невірний email або пароль' });
    }

    // Перевірка статусу акаунта
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Ваш акаунт заблоковано' });
    }

    // Створення сесії
    const token = crypto.randomUUID();
    db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, user.id);

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
    res.status(500).json({ error: 'Помилка при вході' });
  }
});

// -------------------------------------------------------------
// 4. Отримання даних поточного користувача (GET /api/auth/me)
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
// 5. Вихід із системи (POST /api/auth/logout)
// -------------------------------------------------------------
app.post('/api/auth/logout', authMiddleware, (req, res) => {
  try {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(req.token);
    res.json({ message: 'Успішний вихід' });
  } catch (error) {
    res.status(500).json({ error: 'Помилка при виході' });
  }
});

// Запуск сервера, якщо файл викликано напряму
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;
