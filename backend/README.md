# Backend: Bootcamp Connect (FR-01)

Реалізація серверної частини для першої спільної фічі команди: **Реєстрація, автентифікація, вибір курсу, захищений доступ та вихід**.

**Відповідальна:** Маріанна  
**Стек:** Node.js, Express.js, SQLite (`better-sqlite3`), `bcryptjs`, Bearer Token (UUID)

---

## 🚀 Швидкий старт

### 1. Встановлення залежностей
```bash
cd backend
npm install
```

### 2. Запуск сервера
```bash
npm start
# або в режимі розробки з авто-перезавантаженням:
npm run dev
```
Сервер запуститься за адресою: `http://localhost:3000`  
База даних `database.sqlite` створиться автоматично з таблицями `courses`, `users`, `sessions` та двома активними курсами.

### 3. Автоматичне тестування (для Маріанни та Цінглінг)
```bash
npm test
```
Скрипт перевіряє всі 11 обов'язкових сценаріїв (реєстрація, валідація, захист від дублікатів, логін, правильний/неправильний пароль, доступ до `GET /api/auth/me`, логаут та інвалідація сесії).

---

## 📡 Ендпоінти API

Базовий URL: `http://localhost:3000/api`

### 1. Курси (Публічний)
- **`GET /api/courses`**
  - **Опис:** Повертає список активних курсів для форми реєстрації Малак.
  - **Відповідь (200 OK):**
    ```json
    [
      { "id": "software-dev", "name": "Software Development" },
      { "id": "business-dev", "name": "Business Development" }
    ]
    ```

### 2. Реєстрація (Публічний)
- **`POST /api/auth/register`**
  - **Тіло запиту (JSON):**
    ```json
    {
      "displayName": "Олександр",
      "email": "alex@example.com",
      "password": "password123",
      "courseId": "software-dev"
    }
    ```
  - **Успіх (201 Created):**
    ```json
    {
      "token": "3394982a-4318-472e-8418-e3a5a76fa4d5",
      "user": {
        "id": "...",
        "displayName": "Олександр",
        "email": "alex@example.com",
        "courseId": "software-dev",
        "courseName": "Software Development",
        "role": "learner"
      }
    }
    ```
  - **Помилки:**
    - `400 Bad Request` — не всі поля заповнені / пароль коротший 8 символів / неіснуючий курс.
    - `409 Conflict` — email вже використовується іншим користувачем.

### 3. Вхід (Публічний)
- **`POST /api/auth/login`**
  - **Тіло запиту (JSON):**
    ```json
    {
      "email": "alex@example.com",
      "password": "password123"
    }
    ```
  - **Успіх (200 OK):** повертає `token` та об'єкт `user`.
  - **Помилки:**
    - `401 Unauthorized` — невірний email або пароль (`{ "error": "Невірний email або пароль" }`).
    - `403 Forbidden` — акаунт заблоковано (`{ "error": "Ваш акаунт заблоковано" }`).

### 4. Дані поточного користувача (Захищений)
- **`GET /api/auth/me`**
  - **Заголовок:** `Authorization: Bearer <token>`
  - **Опис:** Викликається фронтендом для відображення захищеної Welcome-сторінки.
  - **Успіх (200 OK):**
    ```json
    {
      "user": {
        "id": "...",
        "displayName": "Олександр",
        "email": "alex@example.com",
        "courseId": "software-dev",
        "courseName": "Software Development",
        "role": "learner"
      }
    }
    ```
  - **Помилка (401 Unauthorized):** токен відсутній або недійсний.

### 5. Вихід (Захищений)
- **`POST /api/auth/logout`**
  - **Заголовок:** `Authorization: Bearer <token>`
  - **Успіх (200 OK):** `{ "message": "Успішний вихід" }`. Сесія видаляється з бази.

---

## 🗄 Структура бази даних SQLite

Файл `database.sqlite` створюється автоматично:

1. **`courses`**: `id` (TEXT, PK), `name` (TEXT), `is_active` (INTEGER).
2. **`users`**: `id` (TEXT, PK), `email` (TEXT, UNIQUE), `password_hash` (TEXT), `display_name` (TEXT), `course_id` (TEXT, FK), `role` (TEXT), `status` (TEXT), `created_at` (DATETIME).
3. **`sessions`**: `token` (TEXT, PK), `user_id` (TEXT, FK), `created_at` (DATETIME).
