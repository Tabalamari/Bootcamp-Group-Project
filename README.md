# Bootcamp Connect

Bootcamp Connect helps software-development and business-development learners find peers for collaboration, mentoring, and professional connection.

## Current architecture

- Frontend: React 19 and Vite.
- Backend: Node.js 20+ and Express.
- Database: PostgreSQL hosted by Supabase, with SQLite retained for local development and isolated API tests.
- Profile photos: Supabase Storage in production; local `backend/uploads` for SQLite development.
- The Express server can serve `frontend/dist` when the frontend has been built, so the app can run from one Node host.

The repository contains the SQLite-to-PostgreSQL adapter, Supabase schema and starter data, and migration scripts. The repository alone cannot confirm the current row counts or contents of the team's live Supabase project; verify those in the Supabase dashboard before relying on a migration.

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
2. Set `DB_CLIENT=postgres`, `DATABASE_URL`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` in the backend host’s secret settings. Keep the service-role key on the backend only.
3. Create a **public** Storage bucket named `profile-photos` (or set `SUPABASE_PROFILE_PHOTOS_BUCKET` to your bucket name). The backend uses its service-role key for uploads and deletions; profile images are publicly readable.
4. If migrating existing SQLite data, preserve a backup of `backend/database.sqlite` and `backend/uploads`, apply the schema and seed scripts, then run `npm run db:migrate` and `npm run photos:migrate` from `backend`. These scripts write to the database and Storage project named by the configured secrets. Review their counts and verify users, profiles, conversations, messages, and photos in Supabase before switching the app over.
5. Bootstrap a real administrator with the one-time environment variables described above. If the old demo admin was already migrated, run the bootstrap command with `ADMIN_BOOTSTRAP_EMAIL=admin@example.com` and a new unique password to reset and secure that account. Do not leave bootstrap credentials configured after the command finishes.

For a split frontend/API deployment, set `VITE_API_URL` to the backend API URL (ending in `/api`) and configure `CORS_ORIGINS` on the backend with the exact frontend origin. The default `/api` URL works when the Express server serves the frontend from the same origin.

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
