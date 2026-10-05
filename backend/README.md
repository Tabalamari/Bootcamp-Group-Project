# Backend: Bootcamp Connect (FR-01 & FR-02)

Backend implementation for Bootcamp Connect core features:
- **FR-01:** Registration, authentication, course selection, protected access, and logout.
- **FR-02:** User profiles, options vocabulary, profile viewing/editing, photo uploads/removal, and community profiles.

**Owner:** Marianna  
**Stack:** Node.js, Express.js, SQLite (`better-sqlite3`), `multer`, `bcryptjs`, Bearer Token (UUID)

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
The database `database.sqlite` is created automatically with all tables and seeded with active courses, skills, interests, and connection goals. Static uploads are served from `/uploads`.

### 3. Automated Testing (for Marianna and Qingling)
```bash
npm test
```
The script runs 27 automated checks verifying:
- All FR-01 authentication, session, course, and error-handling requirements.
- All 7 FR-02 acceptance criteria (profile display, options vocabulary, persistent updates across sessions, ownership protection, photo fallback, photo format/size validation, and private field exclusion).

---

## 📡 API Endpoints

Base URL: `http://localhost:3000/api`

### FR-01: Authentication & Courses

#### 1. Courses (Public)
- **`GET /api/courses`**
  - **Description:** Returns the list of active courses for Malak's registration form.
  - **Response (200 OK):**
    ```json
    [
      { "id": "software-dev", "name": "Software Development" },
      { "id": "business-dev", "name": "Business Development" }
    ]
    ```

#### 2. Registration (Public)
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
  - **Success (201 Created):** returns session token and user object, automatically initializing an empty profile.

#### 3. Login (Public)
- **`POST /api/auth/login`**
  - **Request Body (JSON):**
    ```json
    {
      "email": "alex@example.com",
      "password": "password123"
    }
    ```
  - **Success (200 OK):** returns session `token` and `user` object.

#### 4. Current User Session (Protected)
- **`GET /api/auth/me`**
  - **Header:** `Authorization: Bearer <token>`
  - **Success (200 OK):** returns authenticated user identity.

#### 5. Logout (Protected)
- **`POST /api/auth/logout`**
  - **Header:** `Authorization: Bearer <token>`
  - **Success (200 OK):** `{ "message": "Successfully logged out" }`. Session is removed from the database.

---

### FR-02: User Profiles

#### 6. Profile Options (Public / Authenticated)
- **`GET /api/profile-options`**
  - **Description:** Returns administrator-managed vocabulary lists for skills, interests, and connection goals.
  - **Response (200 OK):**
    ```json
    {
      "skills": ["Accessibility", "JavaScript", "Market research", "Marketing", "Node.js", "Product strategy", "Python", "React", "UI design"],
      "interests": ["Design", "Education", "Entrepreneurship", "Sustainability", "Technology"],
      "goals": ["Co-founder partnership", "Friendship", "Peer support", "Project collaboration"]
    }
    ```

#### 7. Current User Profile (Protected)
- **`GET /api/profiles/me`**
  - **Header:** `Authorization: Bearer <token>`
  - **Success (200 OK):**
    ```json
    {
      "id": "u-12345",
      "displayName": "Alex Rivers",
      "courseId": "software-dev",
      "courseName": "Software Development",
      "bio": "Enthusiastic full-stack student building bootcamp projects.",
      "photoUrl": "/uploads/u-12345-1696512345678.png",
      "skills": ["JavaScript", "Node.js", "React"],
      "interests": ["Education", "Technology"],
      "goals": ["Co-founder partnership", "Project collaboration"]
    }
    ```
  - *Note: `photoUrl` is `null` if no photo is uploaded (uses client-side placeholder).*

#### 8. Update Current Profile (Protected)
- **`PATCH /api/profiles/me`** (also supports `PUT`)
  - **Header:** `Authorization: Bearer <token>`
  - **Request Body (JSON):**
    ```json
    {
      "displayName": "Alex Rivers",
      "bio": "Updated bio text...",
      "skills": ["React", "Node.js"],
      "interests": ["Technology"],
      "goals": ["Project collaboration"]
    }
    ```
  - **Validation:**
    - `displayName`: 2–80 characters.
    - `bio`: maximum 500 characters.
    - `skills`, `interests`, `goals`: must be arrays containing valid choices from the managed options list.
  - **Success (200 OK):** returns updated profile object.

#### 9. Upload Profile Photo (Protected)
- **`POST /api/profiles/me/photo`**
  - **Header:** `Authorization: Bearer <token>`
  - **Body:** `multipart/form-data` with file field `photo`
  - **Validation:** JPG, PNG, WebP only; maximum size 5 MB.
  - **Success (200 OK):**
    ```json
    {
      "photoUrl": "/uploads/u-12345-1696512345678.jpg",
      "message": "Photo uploaded successfully"
    }
    ```
  - **Errors:**
    - `413 Payload Too Large` — file exceeds 5 MB.
    - `415 Unsupported Media Type` — unsupported format.
    - `400 Bad Request` — missing file.

#### 10. Remove Profile Photo (Protected)
- **`DELETE /api/profiles/me/photo`**
  - **Header:** `Authorization: Bearer <token>`
  - **Success (200 OK):**
    ```json
    {
      "photoUrl": null,
      "message": "Photo removed successfully"
    }
    ```

#### 11. View Public Profile of Another Learner (Protected)
- **`GET /api/profiles/:userId`**
  - **Header:** `Authorization: Bearer <token>`
  - **Success (200 OK):**
    ```json
    {
      "id": "target-user-id",
      "displayName": "Alex Rivers",
      "courseName": "Software Development",
      "bio": "...",
      "photoUrl": "/uploads/...",
      "skills": ["React"],
      "interests": ["Technology"],
      "goals": ["Project collaboration"]
    }
    ```
  - **Security Guarantee:** Private fields (`email`, `password_hash`, `role`, `status`) are strictly excluded from the response. Suspended accounts return `403 Forbidden`.

---

## 🗄 SQLite Database Schema

The `database.sqlite` file is created and migrated automatically:

1. **`courses`**: `id` (TEXT, PK), `name` (TEXT), `is_active` (INTEGER).
2. **`users`**: `id` (TEXT, PK), `email` (TEXT, UNIQUE), `password_hash` (TEXT), `display_name` (TEXT), `course_id` (TEXT, FK), `role` (TEXT), `status` (TEXT), `created_at` (DATETIME).
3. **`sessions`**: `token` (TEXT, PK), `user_id` (TEXT, FK), `created_at` (DATETIME).
4. **`skills`**: `id` (TEXT, PK), `name` (TEXT, UNIQUE), `is_active` (INTEGER).
5. **`interests`**: `id` (TEXT, PK), `name` (TEXT, UNIQUE), `is_active` (INTEGER).
6. **`connection_goals`**: `id` (TEXT, PK), `name` (TEXT, UNIQUE), `is_active` (INTEGER).
7. **`profiles`**: `user_id` (TEXT, PK, FK users), `bio` (TEXT), `photo_url` (TEXT), `created_at` (DATETIME), `updated_at` (DATETIME).
8. **`profile_skills`**: `(user_id, skill_id)` (PK, FKs).
9. **`profile_interests`**: `(user_id, interest_id)` (PK, FKs).
10. **`profile_goals`**: `(user_id, goal_id)` (PK, FKs).
