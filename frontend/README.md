# Bootcamp Connect frontend

Malak's first feature: registration, course selection, login, welcome screen and logout. React + JavaScript, Vite, and Tailwind CSS. Responsive desktop, laptop and mobile layouts follow the approved blue mockup.

## Run

Use Node.js 22.12+ (or a compatible newer LTS version).

```sh
cd frontend
npm install
npm run dev
```

Open the local address printed in the terminal. Run `npm test` for validation/demo-service checks and `npm run build` for a production build.

## Demo mode

Demo mode is enabled by default and clearly labelled. Use fictional details. Sample login: `malak@example.com` / `DemoPass123!`.

Registration creates a temporary account that can be used to log in again after logout. All accounts and the session reset on a full page reload. Passwords are held only in temporary memory; nothing is stored in browser storage. This is an interface demonstration, not secure authentication. Real sessions, persistence, permissions and password handling belong to the backend.

## Proposed API contract for Marianna to review

This contract is a frontend integration proposal, not an agreed or implemented backend. The course IDs and 8-character registration password minimum are provisional.

| Method | Path | Request | Success response |
| --- | --- | --- | --- |
| GET | `/api/courses` | None | `[{ "id": "software-development", "name": "Software development" }, ...]` |
| GET | `/api/auth/session` | Session cookie | `{ "user": User }`; 401 if signed out |
| POST | `/api/auth/register` | `{ displayName, email, password, courseId }` | `{ "user": User }` and session cookie |
| POST | `/api/auth/login` | `{ email, password }` | `{ "user": User }` and session cookie |
| POST | `/api/auth/logout` | Session cookie | 204; session invalidated |

`User` contains `id`, `displayName`, `email`, and `courseId`. Errors use an appropriate HTTP status with `{ "message": "User-facing explanation" }`. Never return password credentials.

To connect the backend, copy `.env.example` to `.env.local`, set `VITE_DEMO_MODE=false`, and run Marianna's API on port 3000. Vite proxies `/api` locally. Hosted environments need a same-origin API route or explicitly configured credentialed CORS. Agree secure HttpOnly cookie configuration and CSRF protection with Marianna. Client-side screen gating is not server authorization. Never put backend secrets in `VITE_*` variables.

## Qingling's interface verification

- Register a fictional learner from each course; check the welcome details.
- Test missing fields, malformed email and a short registration password.
- Try a duplicate registration and incorrect login credentials.
- Sign out, then navigate back: the welcome screen must remain unavailable.
- Log in again using the created account before reloading.
- Check password visibility, keyboard navigation, and 320px, 390px, 1024px and 1440px layouts.
- With the real API connected, verify course-loading retry, failed requests, session restoration, and server-enforced authorization.

Backend integration and end-to-end security checks remain pending. This feature does not yet implement profile editing, discovery, messaging, or administration.
