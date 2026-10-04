# Backend: Bootcamp Connect (FR-01)

Backend implementation for the team's first core feature: **Registration, authentication, course selection, protected access, and logout**.

**Owner:** Marianna  
**Stack:** Node.js, Express.js, SQLite (`better-sqlite3`), `bcryptjs`, Bearer Token (UUID)

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Start the Server
```bash
npm start
# or in development mode with auto-reload:
npm run dev
```
The server will start at: `http://localhost:3000`  
The database `database.sqlite` is created automatically with `courses`, `users`, and `sessions` tables and seeded with two active courses.

### 3. Automated Testing (for Marianna and Qingling)
```bash
npm test
```
The script tests all mandatory scenarios (registration, validation, duplicate rejection, login, valid/invalid password, protected access to `GET /api/auth/me`, logout, and session invalidation).

---

## 📡 API Endpoints

Base URL: `http://localhost:3000/api`

### 1. Courses (Public)
- **`GET /api/courses`**
  - **Description:** Returns the list of active courses for Malak's registration form.
  - **Response (200 OK):**
    ```json
    [
      { "id": "software-dev", "name": "Software Development" },
      { "id": "business-dev", "name": "Business Development" }
    ]
    ```

### 2. Registration (Public)
- **`POST /api/auth/register`**
  - **Request Body (JSON):**
    ```json
    {
      "displayName": "Alex",
      "email": "alex@example.com",
      "password": "password123",
      "courseId": "software-dev"
    }
    ```
  - **Success (201 Created):**
    ```json
    {
      "token": "3394982a-4318-472e-8418-e3a5a76fa4d5",
      "user": {
        "id": "...",
        "displayName": "Alex",
        "email": "alex@example.com",
        "courseId": "software-dev",
        "courseName": "Software Development",
        "role": "learner"
      }
    }
    ```
  - **Errors:**
    - `400 Bad Request` — missing required fields / password shorter than 8 characters / non-existent or inactive course.
    - `409 Conflict` — email is already registered by another user.

### 3. Login (Public)
- **`POST /api/auth/login`**
  - **Request Body (JSON):**
    ```json
    {
      "email": "alex@example.com",
      "password": "password123"
    }
    ```
  - **Success (200 OK):** returns `token` and `user` object.
  - **Errors:**
    - `401 Unauthorized` — invalid email or password (`{ "error": "Invalid email or password" }`).
    - `403 Forbidden` — account is suspended (`{ "error": "Your account is suspended" }`).

### 4. Current User Profile (Protected)
- **`GET /api/auth/me`**
  - **Header:** `Authorization: Bearer <token>`
  - **Description:** Called by the frontend to display the protected Welcome page.
  - **Success (200 OK):**
    ```json
    {
      "user": {
        "id": "...",
        "displayName": "Alex",
        "email": "alex@example.com",
        "courseId": "software-dev",
        "courseName": "Software Development",
        "role": "learner"
      }
    }
    ```
  - **Error (401 Unauthorized):** token missing or invalid.

### 5. Logout (Protected)
- **`POST /api/auth/logout`**
  - **Header:** `Authorization: Bearer <token>`
  - **Success (200 OK):** `{ "message": "Successfully logged out" }`. Session is removed from the database.

---

## 🗄 SQLite Database Schema

The `database.sqlite` file is created automatically:

1. **`courses`**: `id` (TEXT, PK), `name` (TEXT), `is_active` (INTEGER).
2. **`users`**: `id` (TEXT, PK), `email` (TEXT, UNIQUE), `password_hash` (TEXT), `display_name` (TEXT), `course_id` (TEXT, FK), `role` (TEXT), `status` (TEXT), `created_at` (DATETIME).
3. **`sessions`**: `token` (TEXT, PK), `user_id` (TEXT, FK), `created_at` (DATETIME).
