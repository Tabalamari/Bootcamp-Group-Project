# F1 backend integration - 5 October 2026

Marianna's backend from `origin/main` at `fd384d6` is included locally on `feature/frontend-profile`, with narrow validation/test-isolation fixes. This integration is included in the F2 feature branch for team review; application code has not been merged into main.

## Run both services

In one terminal, run `cd backend`, `npm install`, then `npm start`.
In a second terminal, run `cd frontend`, `npm install`, then `npm run dev`.
Open http://127.0.0.1:5173/. Register a new account; the demo login is available only when `VITE_DEMO_MODE=true`.

Real authentication is now the default. The Vite `/api` proxy forwards to port 3000. Set `VITE_DEMO_MODE=true` in `.env.local` and restart Vite only when a standalone authentication demo is needed.

## Actual API contract

The authoritative endpoint documentation is [backend/README.md](../backend/README.md). It supersedes the earlier cookie/session API proposal.

- `GET /api/courses`: course objects; use server IDs `software-dev` and `business-dev`.
- `POST /api/auth/register`: `{displayName,email,password,courseId}` returns `{token,user}`.
- `POST /api/auth/login`: `{email,password}` returns `{token,user}`.
- `GET /api/auth/me`: current account with `Authorization: Bearer <token>`.
- `POST /api/auth/logout`: revoke the current token; returns a JSON message.
- Error responses use `{error: "message"}`.

The frontend keeps the bearer token in tab-scoped `sessionStorage` to restore the session after refresh. It stores no passwords. Invalid or suspended sessions clear the local token; network failures preserve it for retry. Successful logout revokes the server token before clearing browser state. Session storage is accessible to application JavaScript, so XSS prevention remains essential; it is not an HttpOnly cookie.

The backend uses SQLite, not the originally proposed PostgreSQL. Preserve this working implementation unless the team agrees to a database migration. The database file is ignored by Git. Backend tests use an isolated in-memory database and cannot delete development accounts.

## Profile distinction

F2 profile edits remain a separate, in-memory demo, including when using a real account. A visible banner explains this. Account registration persists in SQLite; profile photos, bios, skills and goals do not persist across reloads yet. F2 must not be marked integrated.

## Review and validation results

- Positive foundations: bcrypt password hashing, parameterized queries, email normalization, active-course validation, server-side learner role assignment, protected current-user access and token invalidation on logout.
- Fixed malformed register/login field types so they return 400 rather than 500.
- Isolated the supplied tests from the real database using `DATABASE_PATH=:memory:`; added inactive-course, suspension, invalid-token, input-type and password-storage checks.
- Backend: 19 checks passed.
- Frontend: seven automated tests passed, including bearer-token adapter/session behavior; production build passed.
- Browser: real registration, course choice, session restoration after reload, profile demo access, logout token revocation, incorrect-password errors, successful login, duplicate rejection and invalid-session recovery passed. The temporary browser-test user was deleted after the test.

## Remaining work and scope limits

This confirms the first authentication milestone works locally; it is not a full production security audit or full FR-01 completion. F6 account updates/password changes remain unimplemented. Before public deployment, Marianna should add authentication rate limits and session expiry, review bcrypt input-length limits, restrict deployment origins as appropriate, and plan persistent database hosting. The current backend has no session expiry or login throttling. Qingling's independent verification remains pending.

Malformed JSON/error response consistency and wider failure-path coverage can be reviewed during backend hardening. Existing sessions for suspended accounts are denied while suspended; reactivation currently makes an unexpired stored token usable again, so permanent suspension-time revocation is a later admin requirement to implement explicitly.
