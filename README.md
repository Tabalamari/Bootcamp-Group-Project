# Bootcamp Connect

> **A peer networking and collaboration platform bridging Software Developers and Business Developers.**

---

## 📌 Project Overview

Two distinct cohorts learn side by side: **Software Developers** and **Business Developers**. Each group possesses complementary skills and domain expertise that the other needs. **Bootcamp Connect** brings them together to spark co-founder partnerships, project collaborations, peer mentoring, and professional connections.

---

## 🚀 Current Project Status & Architecture

The project has achieved complete functional integration across all core functional requirements (FR-01 through FR-06), with a cloud database migration from SQLite to **PostgreSQL on Supabase**.

### 🌟 Key Highlights
- **Repository Branch:** `main` (fully synchronized with `origin/main`).
- **Production Database:** **PostgreSQL hosted on Supabase** (using the Supavisor Connection Pooler for robust IPv4/IPv6 support).
- **Dual-Database Support:** Transparent runtime adapter supporting both cloud PostgreSQL (`DB_CLIENT=postgres`) and local SQLite fallback (`DB_CLIENT=sqlite`).
- **Asynchronous Architecture:** Full Node.js / Express backend refactored with `async/await` and transactional safety using `AsyncLocalStorage` (`BEGIN` / `COMMIT` / `ROLLBACK`).
- **Data Migration:** 100% of existing dictionary tables, active users, profiles, relationships, sessions, and messaging records safely migrated from SQLite to Supabase.

---

## 🧪 Verification & Test Suite

The entire codebase is verified by an automated end-to-end and unit test suite running against the live Supabase database:

| Component | Test Suite | Tests Passed | Status |
| :--- | :--- | :--- | :--- |
| **Backend API** | `backend/test.js` | **71 / 71 passed** (0 failed) | ✅ 100% Passing |
| **Frontend UI/Logic** | `frontend/src/*.test.js` | **24 / 24 passed** (0 failed) | ✅ 100% Passing |
| **Total Automated Coverage** | — | **95 / 95 passed** | ✅ Verified |

### Functional Requirements Covered:
1. **FR-01: Authentication & Course Selection:** Secure user registration, password hashing (bcrypt), session tokens, course associations, and brute-force protection.
2. **FR-02: User Profiles:** Extended biographies, avatar uploads with format/size validation, skills, interests, and connection goals.
3. **FR-03: Peer Discovery & Explainable Fit:** Multi-criteria filtering (course, skills, interests, goals), full-text search, pagination, and evidence-based fit explanations without invented compatibility scores.
4. **FR-04: Private 1-on-1 Messaging:** Real-time conversation reuse, deduplication, chronological message history, server-enforced participant access control, and unread counters.
5. **FR-05: Administration & Taxonomy Management:** Role-based access control, creation and deactivation of skills/categories/interests, and learner moderation/suspension with immediate session revocation.
6. **FR-06: Account Settings & Security:** Profile updates, display name changes, course corrections, and password changes with reauthentication and auxiliary session revocation.

---

## 🛠️ Technology Stack

### Backend
- **Runtime:** Node.js (v20+)
- **Framework:** Express.js
- **Database:** PostgreSQL (Supabase) via `pg` (node-postgres)
- **Local Fallback:** SQLite via `better-sqlite3`
- **Security & Media:** `bcryptjs`, `multer`, `cors`, `dotenv`

### Frontend
- **Build Tool:** Vite
- **UI Framework:** Vanilla JavaScript & Semantic HTML5
- **Styling:** Custom CSS with modern responsive design and accessibility tokens
- **Testing:** Native Node test runner (`node --test`)

---

## 💻 Local Setup & Execution Guide

### 1. Prerequisites
- Node.js (v20.18+ or v22+ recommended)
- npm (v10+)
- An active internet connection for Supabase cloud database access

### 2. Environment Configuration
Create or verify `backend/.env`:
```env
PORT=3000
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"
DB_CLIENT=postgres
```
> **Security Note:** `backend/.env` is strictly ignored by `.gitignore` to prevent secret leakage.

### 3. Running the Backend Server
```bash
cd backend
npm install
npm start
```
The API server will start on `http://localhost:3000`.
- Health Check: `curl http://localhost:3000/api`
  ```json
  {"name":"Bootcamp Connect API","status":"online","version":"1.0.0","dbClient":"postgres"}
  ```

### 4. Running the Frontend Application
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
The application will be accessible in your browser at `http://127.0.0.1:5173`.

### 5. Running the Test Suites
- **Run Backend Tests:**
  ```bash
  cd backend
  npm test
  ```
- **Run Frontend Tests:**
  ```bash
  cd frontend
  npm test
  ```

---

## 🔄 Rollback & Backup Strategy

- **SQLite Preservation:** The original `backend/database.sqlite` file is preserved and untouched.
- **Instant Local Rollback:** If offline development or SQLite testing is needed, change `DB_CLIENT` in `backend/.env`:
  ```env
  DB_CLIENT=sqlite
  ```
  The dual-database adapter automatically routes all queries back to the local SQLite database without requiring any code modifications.

---

## 📄 License & Attribution
Developed as part of the Bootcamp Connect group project.
