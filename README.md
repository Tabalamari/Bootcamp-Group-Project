# Bootcamp Connect

Bootcamp Connect is a community platform for software-development and business-development learners. It helps people connect across courses, discover peers with complementary skills and interests, and continue conversations as they collaborate, mentor one another, and build professional relationships. The responsive app is designed for laptop, desktop, and mobile use.

## Features

- **Accounts and courses:** Register, sign in, choose a course, and sign out. Protected features require an authenticated account.
- **Profiles:** Create and edit a profile with a photo, biography, skills, interests, and collaboration goals. Profile data and photos persist across sessions.
- **Peer discovery:** Search and filter active learner profiles by course, skills, interests, and goals. Profile pages explain shared criteria behind each suggested connection.
- **Private messaging:** Start or continue one-to-one conversations, see conversation history and unread counts, delete a conversation from your own inbox while keeping the other participant’s history, and return to chats later.
- **Administration:** Authorized administrators can manage courses and profile categories, skills, and interests, and review or update learner accounts.
- **Account settings:** Update account details and course, change a password after confirming the current password, and change the login email after confirming the current password. The app does not send email verification messages.
- **Delete account:** Permanently remove an account after password confirmation and an explicit warning. The account's profile, credentials, sessions, personal options and photo are removed; existing chats remain for other participants with the former sender shown as “Deleted User,” and those conversations become read-only.

The deployed app is currently a **staging** service. Complete the two-account browser walkthrough and team review before treating it as production-ready.

## Current architecture

- Frontend: React 19 and Vite.
- Backend: Node.js 20+ and Express.
- Database: PostgreSQL hosted by Supabase, with SQLite retained for local development and isolated API tests.
- Profile photos: Supabase Storage in production; local `backend/uploads` for SQLite development.
- The Express server can serve `frontend/dist` when the frontend has been built, so the app can run from one Node host.

The repository contains the SQLite-to-PostgreSQL adapter, Supabase schema and starter data, and migration scripts. The repository alone cannot confirm the current row counts or contents of the team's live Supabase project; verify those in the Supabase dashboard before relying on a migration.

For an existing Supabase database, apply `backend/migrations/account-deletion-postgres.sql` before deploying account deletion. It changes only conversation and message foreign-key behavior so account removal anonymizes references while retaining history; it does not delete existing rows. Existing message text is retained and may still contain personal details written by participants, so account deletion does not erase or redact information included in message bodies.

For the optional “Delete for me” conversation action, apply `backend/migrations/conversation-hide-for-self.sql` before deploying the updated app. It adds per-user inbox hiding and a history cutoff without deleting shared messages. When the chat returns after a new message or the user opens it from Discover, the deleting user sees only messages sent after deletion; the other participant retains the full history.

## Local development

1. Install Node.js 20 or newer.
2. Copy `backend/.env.example` to `backend/.env`. Leave `DB_CLIENT=sqlite` for isolated local development. The SQLite file and local uploads are ignored by Git.
3. In one terminal, run:

   ```sh
   cd backend
   npm install
   npm start
   ```

4. In another terminal, run:

   ```sh
   cd frontend
   npm install
   npm run dev
   ```

The frontend runs at `http://127.0.0.1:5173` and proxies API and local-upload requests to the backend at `http://localhost:3000`.

To create a local administrator, set `ADMIN_BOOTSTRAP_EMAIL` and a unique `ADMIN_BOOTSTRAP_PASSWORD` of at least 12 characters in `backend/.env`, run `npm run admin:bootstrap` from `backend`, then remove those bootstrap variables. The app no longer creates an administrator with a built-in password.

## Supabase setup

1. Create a Supabase project and run `backend/supabase-schema.sql`, followed by `backend/supabase-seed.sql`, in the Supabase SQL Editor. The schema enables row-level security on app tables; the browser must use the Express API rather than a Supabase public database key. The seed script is safe to rerun and preserves existing rows.
2. Set `DB_CLIENT=postgres`, `DATABASE_URL`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` in the backend host’s secret settings. Keep the service-role key on the backend only. For IPv4-only environments, copy the Session pooler URL from Supabase's **Connect** panel. Download the database root certificate from **Database Settings → SSL Configuration** and set `DATABASE_SSL_CA_PATH` to its server-side path; TLS certificate verification remains enabled.
3. Create a **public** Storage bucket named `profile-photos` (or set `SUPABASE_PROFILE_PHOTOS_BUCKET` to your bucket name). The backend uses its service-role key for uploads and deletions; profile images are publicly readable.
4. If migrating existing SQLite data, preserve a backup of `backend/database.sqlite` and `backend/uploads`, apply the schema and seed scripts, then run `npm run db:migrate` and `npm run photos:migrate` from `backend`. These scripts write to the database and Storage project named by the configured secrets. Review their counts and verify users, profiles, conversations, messages, and photos in Supabase before switching the app over.
5. Bootstrap a real administrator with the one-time environment variables described above. If the old demo admin was already migrated, run the bootstrap command with `ADMIN_BOOTSTRAP_EMAIL=admin@example.com` and a new unique password to reset and secure that account. Do not leave bootstrap credentials configured after the command finishes.

For a split frontend/API deployment, set `VITE_API_URL` to the backend API URL (ending in `/api`) and configure `CORS_ORIGINS` on the backend with the exact frontend origin. The default `/api` URL works when the Express server serves the frontend from the same origin.

## Render staging deployment

The root `Dockerfile` and `render.yaml` configure one Render web service on the Free plan. The image builds the Vite frontend and runs Express, which serves the frontend and `/api` from one origin. Create the service from the GitHub repository using **New → Blueprint**; Render reads `render.yaml`. The public `profile-photos` Storage bucket must exist in the selected Supabase project.

Render asks for the following values as service secrets during setup; never commit them or place them in the Docker image: `DATABASE_URL` (Supabase Session pooler URL), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `DATABASE_SSL_CA` (the PEM contents of the Supabase database root certificate). Do not set `DATABASE_SSL_CA_PATH` on Render because the Docker image intentionally excludes the local CA file. Use a dedicated staging Supabase project where possible and avoid connecting an unverified deployment to real user data.

The Free web service sleeps after 15 minutes without traffic and may take about a minute to wake on the next request. Its filesystem is temporary, so the app uses Supabase PostgreSQL and Storage for persistent data. If the free monthly usage allowance is exceeded without a payment method, Render suspends the service or disables new builds instead of charging for the excess. After deployment, verify `/api/courses` and complete the two-account browser walkthrough. Never run migration or admin-bootstrap commands as part of image startup.

### Current staging deployment (13 October 2026)

- Public app: <https://bootcamp-connect-staging.onrender.com/>
- Render service: `bootcamp-connect-staging` on the Free plan; it deploys the `feature/prepare-supabase-production` branch.
- Latest deployed application commit: `1a823ff` (`feat: allow users to change login email`), merged into `main` by `670d6c3`. The service is live; `/health` and the Supabase-backed `/api/courses` endpoint both passed smoke checks.
- Render's `/health` endpoint checks that the web process is responding; it does not check Supabase. Use `/api/courses` to verify the PostgreSQL connection and seeded courses.
- The Render service's `DATABASE_SSL_CA` value must be the PEM certificate contents. `DATABASE_SSL_CA_PATH` is for local development where the certificate file exists.
- After changing `render.yaml`, run a manual Blueprint sync in Render and approve the listed service changes. Pushing a Blueprint change alone did not apply the updated health-check path.
- Still to verify on the deployed site: complete the end-to-end learner journey with two test accounts, including registration, profile/photo persistence, discovery, messaging, logout, and sign-in again. Treat the current deployment as staging until that walkthrough and the team's review are complete.

## Checks

Run the API suite from `backend`:

```sh
npm test
```

The API tests always use an in-memory SQLite database and generated test-admin credentials; they do not write to Supabase. Run frontend checks from `frontend`:

```sh
npm test
npm run build
```

Do not point automated tests at the production database. The migration scripts are separate manual commands and are never run on application startup.
