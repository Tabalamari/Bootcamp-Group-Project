# Backend: Bootcamp Connect (FR-01, FR-02, FR-03, FR-04, FR-05 & FR-06)

Backend implementation for Bootcamp Connect core features:
- **FR-01:** Registration, authentication, course selection, protected access, and logout.
- **FR-02:** User profiles, options vocabulary, profile viewing/editing, photo uploads/removal, and community profiles.
- **FR-03:** Search, filters (course, skills, interests, goals with AND/OR logic), factual explainable fit reasons, and pagination.
- **FR-04:** Private messaging (1-on-1 text conversations, deduplication, 2-participant server isolation, message persistence, inbox preview, unread tracking, suspension blocking).
- **FR-05:** Administration (admin workspace data, taxonomy & category management, soft deactivation, duplicate prevention, learner course correction, session revocation upon suspension, strict privacy isolation for student chats).
- **FR-06:** Account settings (authenticated name and course updates, password changes with reauthentication, session revocation policy, rate-limited attempts).

**Owner:** Marianna  
**Stack:** Node.js, Express.js, PostgreSQL (Supabase) or SQLite (local/test), Supabase Storage, `multer`, `bcryptjs`, Bearer Token (UUID)

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
The server will start at: `http://localhost:3000`. When `DB_CLIENT=sqlite`, the local database is created automatically and seeded with active courses, skills, interests, connection goals, and categories. The server does not create an administrator with a built-in password. Use the one-time `npm run admin:bootstrap` command with `ADMIN_BOOTSTRAP_EMAIL` and a unique `ADMIN_BOOTSTRAP_PASSWORD` in `backend/.env`, then remove those variables.

SQLite development photos are served from `/uploads`. In production, configure `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and a public Supabase Storage bucket (default `profile-photos`). The service-role key must remain server-side.

### Supabase database and existing-data migration

For a new Supabase project, apply `supabase-schema.sql` and then `supabase-seed.sql` in the Supabase SQL Editor. For an existing SQLite project, keep a backup of both `database.sqlite` and `uploads/`, set `DB_CLIENT=postgres` and `DATABASE_URL`, then run:

```bash
npm run db:migrate
npm run photos:migrate
```

These commands write to the Supabase project configured in the environment and should be run intentionally, never against a project you do not mean to change. Review their output and verify the resulting records and images in Supabase before switching traffic. The migration scripts leave the SQLite database and upload files intact.

Backend API tests use an in-memory SQLite database even when `backend/.env` contains Supabase settings. Never remove that isolation or run destructive tests against production data.

### 3. Automated Testing (for Marianna and Qingling)
```bash
npm test
```
The API suite runs 72 automated checks verifying the following. The command also runs four unit checks for Supabase Storage URL, upload, deletion, and error behavior in `photo-storage.test.js`:
- All FR-01 authentication, session, course, and error-handling requirements.
- All 7 FR-02 acceptance criteria (profile display, options vocabulary, persistent updates across sessions, ownership protection, photo fallback, photo format/size validation, and private field exclusion).
- All 9 FR-03 acceptance criteria (discovery query search, course filter, multi-select skill/interest/goal filters with OR/AND logic, filter clear, self & suspended exclusion, factual explainable fit reasons, empty state, and pagination).
- All 10 FR-04 acceptance criteria (start conversation and send 1-2000 chars text, conversation deduplication, self-messaging prohibition, server-enforced 2-participant isolation, chronological order with sender/timestamp, persistent storage across sessions, inbox preview with unread count, draft preservation on validation errors, suspended account blocking for senders and recipients, manual refresh compatibility).
- All 8 FR-05 acceptance criteria (admin role-based access control with 401/403 enforcement, workspace state hydration, taxonomy category management, duplicate validation across case/whitespace, safe deactivation without physical deletion, immediate session revocation upon suspension, learner course correction, and privacy protection excluding private messages from admin inspection).
- All FR-06 acceptance criteria (authenticated account settings inspection, display name and active course updates, empty and length validation, current-password reauthentication, password length and non-identity rules, subsequent login with new password and old password rejection, auxiliary session revocation, and rate limiting).

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

---

### FR-03: Search and Explainable Fit (Discovery)

#### 11. Search and Filter Profiles (Protected)
- **`GET /api/profiles`**
  - **Header:** `Authorization: Bearer <token>`
  - **Query Parameters (optional):**
    - `query` (string): case-insensitive text search across name, bio, skills, and interests.
    - `courseId` (string): filter by course (`software-dev` or `business-dev`).
    - `skills` (string or array): comma-separated skills (OR within skills filter).
    - `interests` (string or array): comma-separated interests (OR within interests filter).
    - `goals` (string or array): comma-separated connection goals (OR within goals filter).
    - `page` (number, default: 1): page number.
    - `limit` (number, default: 12): items per page.
  - **Filter Combination:** Different filter groups combine with **AND**; multiple selections within a group combine with **OR**.
  - **Exclusions:** The current user (`viewer`) and suspended accounts are strictly excluded.
  - **Success (200 OK):**
    ```json
    {
      "profiles": [
        {
          "id": "u-2",
          "displayName": "Amara Lewis",
          "courseId": "business-dev",
          "courseName": "Business Development",
          "bio": "Turning a sustainable shopping idea into a useful first product.",
          "photoUrl": "/uploads/u-2-1696512345.png",
          "skills": ["Market research", "Product strategy"],
          "interests": ["Sustainability", "Technology"],
          "goals": ["Project collaboration"],
          "fitReasons": [
            "Shared interest: Technology.",
            "Shared goal: Project collaboration.",
            "Different courses, with a shared interest in project collaboration."
          ]
        }
      ],
      "pagination": {
        "total": 1,
        "page": 1,
        "limit": 12,
        "totalPages": 1
      }
    }
    ```
  - *When no criteria match, `fitReasons` contains `["No shared criteria found yet."]`.*
  - *Private fields (`email`, `password_hash`, `role`, `status`) are strictly excluded.*

#### 12. View Public Profile of Another Learner (Protected)
- **`GET /api/profiles/:userId`**
  - **Header:** `Authorization: Bearer <token>`
  - **Success (200 OK):**
    ```json
    {
      "id": "target-user-id",
      "displayName": "Alex Rivers",
      "courseId": "software-dev",
      "courseName": "Software Development",
      "bio": "...",
      "photoUrl": "/uploads/...",
      "skills": ["React"],
      "interests": ["Technology"],
      "goals": ["Project collaboration"],
      "fitReasons": [
        "Skill in common: React."
      ]
    }
    ```
  - **Security Guarantee:** Private fields (`email`, `password_hash`, `role`, `status`) are strictly excluded from the response. Suspended accounts return `403 Forbidden`.

---

### FR-04: Private Messaging

#### 13. Inbox / Conversations List (Protected)
- **`GET /api/conversations`**
  - **Header:** `Authorization: Bearer <token>`
  - **Success (200 OK):** returns conversations involving the user, with other participant summary, last message preview, unread count, sorted by latest activity descending.
    ```json
    {
      "conversations": [
        {
          "id": "conv-uuid",
          "otherParticipant": {
            "id": "u-2",
            "displayName": "Amara Lewis",
            "courseName": "Business Development",
            "photoUrl": "/uploads/..."
          },
          "lastMessage": {
            "id": "msg-uuid",
            "senderId": "u-2",
            "text": "Hi! Excited to connect.",
            "createdAt": "2026-10-07T14:30:00.000Z"
          },
          "unreadCount": 1,
          "updatedAt": "2026-10-07T14:30:00.000Z"
        }
      ]
    }
    ```

#### 14. Start or Reuse Conversation (Protected)
- **`POST /api/conversations`**
  - **Header:** `Authorization: Bearer <token>`
  - **Request Body (JSON):**
    ```json
    {
      "recipientId": "u-2",
      "text": "Hello Amara, let's collaborate!"
    }
    ```
  - **Success (201 Created / 200 OK):** creates or reuses the conversation (deduplication). If `text` is provided, the message is sent. Self-messaging returns `400 Bad Request`. Suspended accounts return `403 Forbidden`.

#### 15. Message History (Protected)
- **`GET /api/conversations/:id/messages`**
  - **Header:** `Authorization: Bearer <token>`
  - **Success (200 OK):** returns chronological message history.
    ```json
    {
      "conversationId": "conv-uuid",
      "otherParticipant": {
        "id": "u-2",
        "displayName": "Amara Lewis",
        "courseName": "Business Development",
        "photoUrl": "/uploads/..."
      },
      "messages": [
        {
          "id": "msg-uuid",
          "conversationId": "conv-uuid",
          "senderId": "u-1",
          "text": "Hello Amara, let's collaborate!",
          "createdAt": "2026-10-07T14:30:00.000Z"
        }
      ]
    }
    ```
  - **Security Guarantee:** Server-enforced 2-participant isolation. Non-participants receive `403 Forbidden`.

#### 16. Send Message (Protected)
- **`POST /api/conversations/:id/messages`**
  - **Header:** `Authorization: Bearer <token>`
  - **Request Body (JSON):**
    ```json
    {
      "text": "Sounds great!"
    }
    ```
  - **Success (201 Created):** returns the created message object. Rejects empty messages and text > 2000 characters with `400 Bad Request`. Suspended accounts return `403 Forbidden`.

#### 17. Mark Conversation as Read (Protected)
- **`POST /api/conversations/:id/read`**
  - **Header:** `Authorization: Bearer <token>`
  - **Success (200 OK):**
    ```json
    {
      "success": true,
      "conversationId": "conv-uuid",
      "unreadCount": 0
    }
    ```

---

### FR-05: Administration (Administrator Protected)

All administrator endpoints require an active session belonging to a user with `role === 'admin'`. Authenticated users with `role === 'learner'` receive `403 Forbidden`. Unauthenticated requests receive `401 Unauthorized`.

#### 18. Administrator Workspace Data
- **`GET /api/admin/workspace`** (also accessible via **`GET /api/admin/load`**)
  - **Header:** `Authorization: Bearer <admin_token>`
  - **Success (200 OK):** returns the complete consolidated operational snapshot:
    ```json
    {
      "counts": {
        "users": 15,
        "skills": 9,
        "interests": 5,
        "goals": 4,
        "courses": 2,
        "categories": 2
      },
      "lists": {
        "skills": [ { "id": "javascript", "name": "JavaScript", "categoryId": "technical", "active": true } ],
        "interests": [ { "id": "technology", "name": "Technology", "active": true } ],
        "goals": [ { "id": "project-collab", "name": "Project collaboration", "active": true } ],
        "courses": [ { "id": "software-dev", "name": "Software Development", "active": true } ]
      },
      "categories": [
        { "id": "technical", "name": "Technical", "active": true },
        { "id": "business", "name": "Business", "active": true }
      ],
      "users": [ ... ]
    }
    ```

#### 19. Administrator User Directory
- **`GET /api/admin/users`**
  - **Header:** `Authorization: Bearer <admin_token>`
  - **Query Parameters (optional):**
    - `query` (string): case-insensitive search by user display name or email.
    - `status` (string, `all` | `active` | `suspended`): status filter.
  - **Success (200 OK):**
    ```json
    {
      "users": [
        {
          "id": "u-1",
          "displayName": "Alex Rivers",
          "email": "alex@example.com",
          "courseId": "software-dev",
          "courseName": "Software Development",
          "role": "learner",
          "status": "active",
          "bio": "Enthusiastic full-stack student...",
          "photoUrl": "/uploads/...",
          "skills": ["JavaScript", "Node.js"],
          "interests": ["Technology"]
        }
      ]
    }
    ```

#### 20. Administrator User Inspection Detail
- **`GET /api/admin/users/:id`**
  - **Header:** `Authorization: Bearer <admin_token>`
  - **Success (200 OK):** returns learner profile, assigned skills, interests, and goals.
  - **Privacy Guarantee (Acceptance Criterion 8):** strictly excludes private messages and conversations.

#### 21. Administrator User Moderation / Suspension
- **`PATCH /api/admin/users/:id`**
  - **Header:** `Authorization: Bearer <admin_token>`
  - **Request Body (JSON):**
    ```json
    {
      "courseId": "business-dev",
      "status": "suspended"
    }
    ```
  - **Success (200 OK):**
    ```json
    {
      "id": "u-1",
      "displayName": "Alex Rivers",
      "courseId": "business-dev",
      "courseName": "Business Development",
      "status": "suspended",
      "revokedSessions": 1
    }
    ```
  - **Acceptance Criterion 7:** Setting `status: "suspended"` immediately revokes all active database sessions (`DELETE FROM sessions WHERE user_id = ?`), preventing ongoing access, subsequent login attempts (returns `403 Forbidden`), and excluding the account from community discovery.

#### 22. List Managed Taxonomy Records
- **`GET /api/admin/:kind`**
  - **Header:** `Authorization: Bearer <admin_token>`
  - **URL Parameter `:kind`:** `skills` | `interests` | `courses` | `connection-goals` | `categories`
  - **Success (200 OK):** returns array of records including deactivated ones:
    ```json
    [
      { "id": "javascript", "name": "JavaScript", "categoryId": "technical", "active": true }
    ]
    ```

#### 23. Create Managed Taxonomy Record
- **`POST /api/admin/:kind`**
  - **Header:** `Authorization: Bearer <admin_token>`
  - **Request Body (JSON):**
    ```json
    {
      "name": "Cloud Architecture",
      "categoryId": "technical"
    }
    ```
  - **Validation:**
    - Name length: 1–80 characters.
    - Duplicate rejection (`409 Conflict`): normalized case-insensitive comparison across existing records.
    - Category check: if `categoryId` is supplied for skills/interests, it must point to an active category.
  - **Success (201 Created):** returns created record with generated ID.

#### 24. Update or Deactivate Managed Record
- **`PATCH /api/admin/:kind/:id`**
  - **Header:** `Authorization: Bearer <admin_token>`
  - **Request Body (JSON):**
    ```json
    {
      "name": "Updated Name",
      "categoryId": "technical",
      "active": false
    }
    ```
  - **Soft Deactivation (Acceptance Criterion 5):** records are preserved (`is_active = 0`) to safeguard historical references and learner profile data without performing physical deletion.

### FR-06: Account Settings

#### 25. Get Account Settings (Protected)
- **`GET /api/account`** (alias: `/api/account/settings`)
  - **Header:** `Authorization: Bearer <token>`
  - **Description:** Returns authenticated learner's account details for Malak's Account Settings view.
  - **Response (200 OK):**
    ```json
    {
      "id": "user-uuid",
      "displayName": "Alexander Smith",
      "email": "alex@example.com",
      "courseId": "software-dev",
      "courseName": "Software Development",
      "role": "learner",
      "status": "active"
    }
    ```

#### 26. Update Account Settings (Protected)
- **`PATCH /api/account`** (and `PUT /api/account`)
  - **Header:** `Authorization: Bearer <token>`
  - **Request Body (JSON):**
    ```json
    {
      "displayName": "Alexander Smith",
      "courseId": "business-dev"
    }
    ```
  - **Validation:**
    - `displayName`: 1–80 characters trimmed.
    - `courseId`: Must exist and have `is_active = 1`.
  - **Response (200 OK):**
    ```json
    {
      "id": "user-uuid",
      "displayName": "Alexander Smith",
      "email": "alex@example.com",
      "courseId": "business-dev",
      "courseName": "Business Development",
      "role": "learner",
      "message": "Account settings updated successfully"
    }
    ```

#### 27. Change Password with Reauthentication (Protected)
- **`POST /api/account/password`**
  - **Header:** `Authorization: Bearer <token>`
  - **Request Body (JSON):**
    ```json
    {
      "currentPassword": "OldPassword123!",
      "newPassword": "NewStrongPassword456!"
    }
    ```
  - **Security & Reauthentication:**
    - Validates `currentPassword` against stored bcrypt hash (`401 Unauthorized` if incorrect).
    - `newPassword` length must be between 8 and 128 characters.
    - `newPassword` must differ from `currentPassword`.
    - Revokes all other active sessions while preserving current token (`DELETE FROM sessions WHERE user_id = ? AND token != ?`).
    - In-memory rate limiting rejects brute-force attempts after 5 failures (`429 Too Many Requests`).
  - **Response (200 OK):**
    ```json
    {
      "message": "Password updated successfully. Other active sessions have been revoked.",
      "sessionsRevoked": true
    }
    ```

---

## 🗄 SQLite Database Schema

The `database.sqlite` file is created and migrated automatically:

1. **`courses`**: `id` (TEXT, PK), `name` (TEXT), `is_active` (INTEGER).
2. **`categories`**: `id` (TEXT, PK), `name` (TEXT, UNIQUE), `is_active` (INTEGER).
3. **`users`**: `id` (TEXT, PK), `email` (TEXT, UNIQUE), `password_hash` (TEXT), `display_name` (TEXT), `course_id` (TEXT, FK), `role` (TEXT), `status` (TEXT), `created_at` (DATETIME).
4. **`sessions`**: `token` (TEXT, PK), `user_id` (TEXT, FK), `created_at` (DATETIME).
5. **`skills`**: `id` (TEXT, PK), `name` (TEXT, UNIQUE), `category_id` (TEXT, FK categories), `is_active` (INTEGER).
6. **`interests`**: `id` (TEXT, PK), `name` (TEXT, UNIQUE), `category_id` (TEXT, FK categories), `is_active` (INTEGER).
7. **`connection_goals`**: `id` (TEXT, PK), `name` (TEXT, UNIQUE), `is_active` (INTEGER).
8. **`profiles`**: `user_id` (TEXT, PK, FK users), `bio` (TEXT), `photo_url` (TEXT), `created_at` (DATETIME), `updated_at` (DATETIME).
9. **`profile_skills`**: `(user_id, skill_id)` (PK, FKs).
10. **`profile_interests`**: `(user_id, interest_id)` (PK, FKs).
11. **`profile_goals`**: `(user_id, goal_id)` (PK, FKs).
12. **`conversations`**: `id` (TEXT, PK), `participant1_id` (TEXT, FK), `participant2_id` (TEXT, FK), `created_at` (DATETIME), `updated_at` (DATETIME), `UNIQUE(participant1_id, participant2_id)`.
13. **`messages`**: `id` (TEXT, PK), `conversation_id` (TEXT, FK), `sender_id` (TEXT, FK), `text` (TEXT), `created_at` (DATETIME).
14. **`conversation_reads`**: `(conversation_id, user_id)` (PK, FKs), `last_read_at` (DATETIME).
