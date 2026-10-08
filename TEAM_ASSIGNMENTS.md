# Bootcamp Connect - Team Assignments and Feature Tracker

Date: 1 October 2026  
Last updated: 8 October 2026

Related specification: [PRD.md](PRD.md), FR-01 through FR-06

## How we work while teammates are unavailable

Malak can build the frontend independently using fictional sample data and separate service adapters. Backend availability is not a prerequisite for frontend development. Proposed API contracts and assumptions must be documented for Marianna to review later.

For every feature completed, update this file in the same feature branch with the completion date, implementation location, checks performed, limitations and the remaining assignments. Mark work done only after it is implemented and checked. Interactive mockup behavior is design reference, not completed application code.

Use these status labels:

- **Done (sample data):** frontend behavior is implemented and checked; backend integration remains open.
- **In progress:** implementation has started but its checks are incomplete.
- **Not started:** no implementation is recorded in this branch.
- **Awaiting confirmation:** another team member's progress has not been reported; do not assume they have done no work.
- **Pending integration:** real frontend/backend connection and checks remain outstanding.
- **Done (integrated):** real backend behavior and independent verification have passed.
- **Merged to main:** feature implementation is on `main`; any explicitly pending independent or browser verification is still open.

Keep each feature on a separate branch. If the preceding branch has not merged, a new frontend branch can start from it; record that dependency and target the preceding branch for review until it merges. Publishing branches and merging to `main` are separate actions and require Malak's agreement. Do not merge merely to start the next feature.

## Feature status

| Feature | Malak: frontend | Marianna: backend | Qingling: data and verification | Integration |
| --- | --- | --- | --- | --- |
| F1 Registration, login, course selection and logout | **Merged to main**, 8 Oct 2026; `feature/frontend-auth` | Implemented; 19 backend checks passed, with validation/test-isolation fixes | Independent verification pending | Local integration passed; team review pending |
| F2 Profile viewing/editing and profile photos | **Merged to main**, 8 Oct 2026; `feature/integrate-profiles-discovery` | Implemented; F1–F3 backend suite passed 40 checks | Independent verification pending | Local integration passed; team review pending |
| F3 Discovery, filters and fit explanations | **Merged to main**, 8 Oct 2026; `feature/integrate-profiles-discovery` | Implemented; F1–F3 backend suite passed 40 checks | Independent verification pending | Local integration passed; team review pending |
| F4 Conversations, messages and unread indicators | **Merged to main**, 8 Oct 2026; `feature/integrate-messaging` | Implemented; F1–F4 backend suite passed 51 checks | Independent verification pending | Two-account adapter/API check passed; independent team and browser review pending |
| F5 Administration: users, courses, categories, skills and interests | **Merged to main**, 8 Oct 2026; `feature/integrate-administration` | Implemented; F1–F5 backend suite passed 61 checks | Independent verification pending | Backend suite and admin browser smoke passed; mutation walkthrough and independent verification pending |
| F6 Account settings: name, course and password changes | **Merged to main**, 8 Oct 2026; `feature/integrate-account-settings` | Implemented; F1–F6 backend suite passed 71 checks | Independent verification pending | Frontend suite (24), backend suite (71) and production build passed; settings browser walkthrough pending |

F6 completes the account-management portion of FR-01 beyond the initial F1 milestone. Unread indicators in F4 reflect Malak's accepted messaging design. Other optional PRD features remain deferred. The completed feature branches are now on `main`; Qingling's independent verification remains pending.

## Assignments for the remaining features

| Feature | Malak can build now | Marianna implements later | Qingling prepares and verifies |
| --- | --- | --- | --- |
| F2 Profiles | Profile display/editor; bio, skills, interests and goals; photo picker, preview, enlargement, edit and removal; validation and save/error states using a sample profile service. | Profile read/update operations; ownership checks; photo upload/storage and file validation; persistent skill/interest relationships. | Representative complete/empty profiles; valid/invalid photos; correct saved fields; ownership and photo-access checks after integration. |
| F3 Discovery | Profile cards, filters, empty/loading/error states and explanations derived from sample profiles. | Filter/query operations; eligible-user rules; pagination; factual fit data without exposing private account fields. | Expected filter results, combined-filter cases, fit explanations and checks that suspended users/private fields are excluded. |
| F4 Messaging | Conversation list; separate histories and drafts; open/reopen chats; send/retry states; unread badges and sample incoming-message alerts; mobile conversation navigation. | Persistent conversations/messages; participant-only access; duplicate-conversation prevention; unread/read state; agreed message update mechanism. | Multiple conversations and incoming-message fixtures; message order; unread clearing; isolation between chats; third-party access denial and persistence. |
| F5 Administration | Connected frontend for users and managed lists; review/fix integration issues on `feature/integrate-administration`. | F5 API implemented: administrator authorization, list management, duplicate rules, reference-preserving deactivation, user suspension/reactivation and session revocation. Review the integration. | Independently verify duplicate/inactive values, existing references, role restrictions, suspended-user behavior and changes reflected in learner screens. |
| F6 Account settings | Connected editable name/course and password-change form on `feature/integrate-account-settings`; review locally and complete browser checks. | F6 API implemented: authenticated account read/update, active-course validation, current-password reauthentication, password updates and revocation of other sessions. | Independently verify name/course persistence, invalid inputs/passwords, unauthenticated access, session handling and responsive layouts. |

Every frontend feature must support desktop, laptop and mobile, keyboard operation, relevant validation, loading, empty and error states. Keep all sample credentials/data fictional, and keep sample services replaceable by real API adapters.

## Completion and handoff record

### F1 - Frontend completed on 4 October 2026

- Owner: Malak. Implementation: [frontend/](frontend/).
- Delivered: registration, course selection, login, welcome screen, logout and responsive blue styling.
- Checks: production build; three validation/demo-service tests; browser journey checks; overflow checks at 320, 390, 1024 and 1440 pixels; desktop/mobile visual review.
- Limitation: sample accounts and session are temporary; refresh resets them. No real authentication, persistent database or server authorization is implemented.
- Handoff: [setup, proposed API contract and verification checklist](frontend/README.md).
- Branch: `feature/frontend-auth`; implementation commit `3fd1d61` pushed to origin. Merge approval remains pending.
- Updated 5 Oct: F1 is connected and tested locally; F2 is completed with sample data.
- Updated 5 Oct: Marianna implemented F1. Review the integration fixes and remaining backend hardening tasks below.
- Qingling next: independently verify the demo; prepare course/test data; verify the integrated backend when available.

### F2 - Frontend completed on 5 October 2026

- Owner: Malak. Implementation: `frontend/src/Profile.jsx` and `frontend/src/profileService.js`.
- Delivered: profile viewing/editing, name/bio, skills/interests/goals, read-only course, native photo picker, edit/remove controls with bin icon, enlarged photo view, save/cancel and header avatar updates.
- Checks: production build and five automated tests passed; browser checks for save, validation, photo handling, cancellation, signed-out access and 320/390/1024/1440px widths; desktop profile and mobile editor reviewed visually.
- Limitations: profiles/photos stay in memory and reset on reload; real profile API is not connected. Course changes are assigned to F6. Backend ownership and upload security remain pending.
- Handoff: [F2 API proposal and verification checklist](frontend/PROFILE_HANDOFF.md).
- Branch: `feature/frontend-profile`, based on `feature/frontend-auth` at `3fd1d61`; commit `f79625a` is included in the published F3 branch; the separate F2 branch is now published to origin; application code remains separate from `main`.
- Malak: F3 and F4 sample frontends are now complete; connect F2 when its backend is ready.
- Marianna next: profile/options endpoints, persistent relationships, ownership rules, photo storage/upload/removal and consistent Save/Cancel behavior.
- Qingling next: independently verify profile fields, user isolation, file errors, save/cancel and responsive layouts; verify real persistence and authorization after integration.

### F2 - Backend completed on 5 October 2026

- Owner: Marianna. Implementation: [backend/server.js](backend/server.js), [backend/db.js](backend/db.js), [backend/README.md](backend/README.md).
- Delivered:
  - Persistent SQLite tables: `skills`, `interests`, `connection_goals`, `profiles`, `profile_skills`, `profile_interests`, `profile_goals` with foreign key integrity, cascade deletion, and seed data matching Malak's frontend vocabulary.
  - Endpoints implemented:
    - `GET /api/profile-options` (and `/api/profile/options`): returns active vocabulary for skills, interests, and goals.
    - `GET /api/profiles/me` (and `/api/profile/me`): returns authenticated learner profile with display name, course, bio, photoUrl or null, and selected options.
    - `PATCH /api/profiles/me` (and `/api/profile/me`, `PUT`): atomic transaction updating display name, bio, skills, interests, and goals with validation (name length 2-80, bio max 500, vocabulary checks).
    - `POST /api/profiles/me/photo`: multipart upload via `multer` with format checks (JPG, PNG, WebP only) and 5 MB size limit.
    - `DELETE /api/profiles/me/photo`: removes photo file from disk and resets database photoUrl to null.
    - `GET /api/profiles/:userId`: public profile view for other learners, strictly excluding email, password_hash, role, and private fields; blocks suspended users.
- Checks: 27 automated tests passing in [backend/test.js](backend/test.js) covering all 7 FR-02 acceptance criteria.
- Qingling next: independently verify profile fields, persistence across sessions, file errors, and direct unauthorized requests.
- Malak next: review the locally integrated profile flow; Qingling's independent verification remains pending.

### F3 - Backend completed on 6 October 2026

- Owner: Marianna. Implementation: [backend/server.js](backend/server.js), [backend/test.js](backend/test.js), [backend/README.md](backend/README.md).
- Delivered:
  - Discovery filtering endpoint: `GET /api/profiles` with text search query, course filter, multi-select skills, interests, and goals.
  - Filter logic: OR within each multi-select group, AND across groups, clear filters returns full community list.
  - Server-enforced exclusion of viewer (`req.user.id`) and suspended accounts (`status === 'active'`).
  - Factual explainable fit engine (`calculateFitReasons`): shared interests, shared skills, shared goals, cross-course collaboration, and fallback to `"No shared criteria found yet."`.
  - Updated `GET /api/profiles/:userId` to include consistent `fitReasons`.
  - Strict privacy protection: private account fields (`email`, `password_hash`, `role`, `status`) omitted from all responses.
  - Pagination support: `page`, `limit`, `total`, `totalPages`.
- Checks: 40 automated tests passing in [backend/test.js](backend/test.js) covering all 9 FR-03 acceptance criteria.
- Qingling next: independently verify combined filters, fit explanations across course pairs, search results, and privacy rules.
- Malak next: review the locally integrated discovery flow; Qingling's independent verification remains pending.

### F4 - Backend completed on 7 October 2026

- Owner: Marianna. Implementation: [backend/server.js](backend/server.js), [backend/db.js](backend/db.js), [backend/test.js](backend/test.js), [backend/README.md](backend/README.md).
- Delivered:
  - SQLite schema for `conversations`, `messages`, and `conversation_reads` tables with canonical participant ordering to prevent duplicates.
  - Endpoints implemented:
    - `GET /api/conversations`: lists user's conversations with other participant summary, last message preview, unread count, sorted by latest activity descending.
    - `POST /api/conversations`: starts or reuses 1-on-1 conversations with deduplication and optional initial text message.
    - `GET /api/conversations/:id/messages`: chronological message history with server-enforced 2-participant isolation.
    - `POST /api/conversations/:id/messages`: sends text message (1-2000 chars) with suspension checks.
    - `POST /api/conversations/:id/read`: clears unread message count for that conversation.
  - Security & privacy: server-enforced isolation (403 for third parties), self-messaging rejection (400), suspended account blocking for senders and recipients (403), private fields (email, password_hash, role) strictly omitted.
- Checks: 51 automated tests passing in [backend/test.js](backend/test.js) covering all 10 FR-04 acceptance criteria.
- Qingling next: independently verify message order, chat isolation, unread clearing, direct API authorization, and persistence.
- Malak next: connect frontend `messagingService.js` to real backend endpoints.

### F5 - Backend completed on 8 October 2026

- Owner: Marianna. Implementation: [backend/server.js](backend/server.js), [backend/db.js](backend/db.js), [backend/test.js](backend/test.js), [backend/README.md](backend/README.md).
- Delivered:
  - SQLite schema updates: `categories` table (`id`, `name`, `is_active`) and `category_id` foreign key migrated to `skills` and `interests`.
  - Default administrator account seeded: `admin@example.com` (`AdminPassword123!`) with `role === 'admin'`.
  - Endpoints implemented:
    - `GET /api/admin/workspace` (and `/api/admin/load`): consolidated workspace state snapshot (counts, managed lists, categories, user directory).
    - `GET /api/admin/users`: lists users with status filter (`all`, `active`, `suspended`) and text search query across name and email.
    - `GET /api/admin/users/:id`: inspects user profile while strictly excluding private messages and conversations to guarantee student privacy.
    - `PATCH /api/admin/users/:id`: corrects course assignment and moderates user status; suspending a user immediately purges active sessions (`DELETE FROM sessions WHERE user_id = ?`) and blocks login.
    - `GET /api/admin/:kind`: retrieves managed taxonomy records (`skills`, `interests`, `courses`, `connection-goals`, `categories`) including inactive items.
    - `POST /api/admin/:kind`: creates new taxonomy item with normalized duplicate check and active category validation.
    - `PATCH /api/admin/:kind/:id`: updates name, category association, and soft deactivation/activation (`is_active: 0/1`) without physical deletion to preserve historical references.
  - Role-based authorization: `adminMiddleware` strictly gates all `/api/admin/*` endpoints (`401 Unauthorized` for unauthenticated, `403 Forbidden` for learners).
- Checks: 61 automated tests passing in [backend/test.js](backend/test.js) covering all 8 FR-05 acceptance criteria.
- Expanded the seeded Business skill catalog with 22 practical skills spanning finance, planning, marketing, sales, customer service, people management, operations and analytics.
- Qingling next: independently verify admin authorization, category filtering, duplicate rejection, soft deactivation, session revocation, and learner privacy.
- Malak next: complete the admin mutation walkthrough on `main` for create, edit, deactivate/reactivate and user course/status changes.

### F6 - Connected locally on 8 October 2026

- Owner: Malak (frontend integration), Marianna (backend). Frontend branch: `feature/integrate-account-settings` (merged to `main`).
- Connected [frontend/src/Settings.jsx](frontend/src/Settings.jsx) through [frontend/src/settingsApi.js](frontend/src/settingsApi.js) to authenticated `GET /api/account`, `PATCH /api/account` and `POST /api/account/password`. Successful account changes update the current user shown in the app; the course selector uses active courses. Real mode uses the backend; demo mode retains the sample service and controls.
- Backend source and tests are from Marianna's F6 commit `3359e0e`. The integration corrects a backend error message that incorrectly called the real password a sample password.
- Checks: frontend suite passed 24 tests; F1–F6 backend suite passed 71 checks; production build passed. Live check: frontend returned 200 and the protected account endpoint returned the expected 401 without authentication. Browser walkthrough and Qingling's independent verification remain pending.
- Next: Malak should verify name/course updates across settings, header, profile and welcome screens, and exercise password changes with a disposable account. Qingling should independently check persistence, access control, invalid inputs and session behavior. Do not change a real account password for testing.

### Record for each subsequent completed frontend feature

Add a dated entry with: feature ID; owner; branch and implementation location; delivered behavior; actual check results; sample-data limitations; proposed API contract; and explicit next actions for Marianna, Qingling and Malak. Only mark the frontend column done; leave backend, verification and integration statuses unchanged unless evidence supports updating them.

## Shared first feature

Build **registration and login with course selection**. Users should be able to create an account, select their course, sign in, reach a protected welcome page, and sign out.

This is the team's first implementation milestone. The remaining account-management requirements in FR-01 will follow this initial feature.

## Ownership

| Team member | Strength | Responsibility |
| --- | --- | --- |
| Malak | Frontend | Registration and login interface, course selection, sign-out, and protected welcome page. |
| Marianna | Backend | Account creation, authentication, sessions, available-course data endpoint, and protected access. |
| Qingling | Data analysis and verification | Initial course data, test data, data validation, and verification of the complete feature. |

## Malak - Frontend

### Current status

The React, JavaScript, Vite and Tailwind frontend for F1–F6 and Marianna's corresponding backend features are integrated on `main`. The application supports responsive desktop, laptop and mobile layouts. The backend suite passed 71 checks, the frontend suite passed 24 tests, and the production build passed after the combined merge.

Remaining work: Qingling's independent verification is pending. Malak still needs the F5 admin mutation walkthrough and the F6 account-settings browser walkthrough; the tracker records these checks. Setup instructions are in [frontend/README.md](frontend/README.md) and [frontend/INTEGRATION.md](frontend/INTEGRATION.md).

### Tasks

- Build a registration form with display name, email, password, and course selection.
- Build the login form and sign-out control.
- Build a welcome page available only to signed-in users.
- Show field validation, loading indicators, success feedback, and clear errors.
- Populate the course selector from Marianna's available-courses endpoint.
- Connect the forms to the agreed backend operations.
- Use sample responses while the backend is being developed.

### Done when

- [x] A user can register and sign in through the interface in demo mode.
- [x] Sample course options load and the selected course reaches the demo service correctly.
- [x] Invalid inputs and demo authentication errors have understandable feedback.
- [x] A signed-in demo user reaches the welcome page; signed-out users are gated in the interface.
- [x] Signing out returns the user to a public screen in demo mode.
- [x] Real API error responses and session behavior are verified locally after integration.
- [x] F1 authentication and F2–F6 are connected to the backend on `main`.

## Marianna - Backend

### Next handoff

Marianna's F1 backend is now on `origin/main`. Its [API README](https://github.com/Tabalamari/Bootcamp-Group-Project/blob/main/backend/README.md) was reviewed on 5 October 2026. It documents Node.js/Express, SQLite, bcrypt and bearer-token sessions. This differs from the earlier PostgreSQL plan and cookie-based frontend proposal; confirm the database choice with the team.

Completed integration: F1–F6 backend APIs are implemented and merged to `main`. The frontend uses bearer-token authentication, protected account/profile/discovery/messaging/administration/settings APIs, and server-backed courses. The full backend test suite passed 71 checks; see [backend/README.md](backend/README.md) for the API contract.

Qingling should run and independently review the backend checks, then verify the integrated browser journey, persistence and direct unauthorized requests. Backend execution passed 19 checks; seven frontend tests and the real browser authentication journey passed. This is local integration verification, not a full production security audit.

### Tasks

- Implement persistent user accounts and their course relationships.
- Implement registration, login, session handling, and sign-out.
- Provide an endpoint listing active courses.
- Validate registration fields and reject duplicate email addresses.
- Reject missing, unknown, or inactive course selections.
- Protect authenticated operations on the server.
- Handle passwords securely and exclude password credentials from responses.
- Document request fields, response formats, and expected errors for Malak and Qingling.

### Done when

- [x] Valid registration creates a persistent learner account with the correct course.
- [x] Duplicate emails and invalid registration data are rejected.
- [x] Valid credentials create an authenticated session; incorrect credentials fail.
- [x] Sessions support the frontend's agreed authentication flow.
- [x] Sign-out invalidates the session.
- [x] Signed-out requests cannot access protected data.
- [x] The available-courses endpoint returns the agreed active course records.

## Qingling - Data and Verification

### Next handoff

F1–F6 are connected and merged to `main`. Use [the integration handoff](frontend/INTEGRATION.md) to run both services and independently verify registration, profile persistence, discovery, messaging, administration, account settings and authorization. Record results; automated checks do not imply Qingling has completed her assignment.

### Tasks

- Agree the initial course names with the team and prepare seed data with stable identifiers.
- Prepare fictional test accounts and valid and invalid registration cases.
- Check that saved user records contain the correct course and required fields.
- Verify that duplicate emails do not create extra accounts.
- Verify registration, login, protected access, and sign-out across the integrated application.
- Record each test's expected result, actual result, and pass/fail status.
- Document failures with reproduction steps and verify fixes with the relevant owner.

### Done when

- [ ] Course seed data is agreed, consistent, and usable by the backend.
- [ ] Both course groups are represented in the test data.
- [ ] Registration stores the correct user and course information.
- [ ] Missing inputs, invalid emails, duplicate emails, and invalid courses are tested.
- [ ] Incorrect passwords and signed-out access are tested.
- [ ] Access after sign-out is denied, including direct requests to protected operations.
- [ ] Results are recorded and any unresolved failures are visible to the team.

## Integration decisions to confirm when the team is available

- Registration field names and validation rules.
- Initial course names and identifiers.
- API operations, request and response formats, and error messages.
- Authentication and session approach.
- What the protected welcome page displays.

Marianna leads the final API agreement, Malak confirms it supports the interface, and Qingling confirms it can be verified with the planned test data. Until then, Malak can proceed with documented provisional fields and sample services; these decisions do not block her frontend work.

## Working sequence

1. Document proposed fields, sample course data and API contracts; seek team agreement when available.
2. Malak builds each frontend feature independently with sample responses and updates this tracker. Marianna and Qingling can pick up their assigned work later or work in parallel when available.
3. Connect the frontend and backend.
4. Qingling runs the integrated checks; Malak and Marianna resolve failures in their areas.
5. Demonstrate the complete journey together and review it against the checklist below.

## Shared feature completion checklist

F1 local integration checks pass. Independent team verification and merge approval remain open. Current review work is on `feature/integrate-profiles-discovery`, based on F6. Marianna’s F2/F3 backend is integrated with Malak’s frontend on its own branch; application changes are not merged into main.

- [x] Register a new learner with a course selection.
- [x] Confirm the learner and course are stored correctly.
- [x] Sign in and open the protected welcome page.
- [x] Sign out and confirm protected access is denied.
- [x] Demonstrate clear handling of invalid inputs and duplicate registration.
- [x] Confirm the checks pass and record any remaining work.
- [ ] Commit the implementation and verification results to the shared repository through the team's agreed review process.

The feature is complete when all three contributions work together and the shared checklist passes.

## F1 integration update - 5 October 2026

- Imported Marianna's backend from `origin/main` (`fd384d6`) into the local feature branch without merging or pushing.
- Connected registration/login, real course IDs, bearer-token session restoration, API errors and server logout. Account data persists in SQLite; F2 profile edits/photos still reset on reload.
- Fixed malformed register/login input types and isolated backend tests from the development database. Database files are ignored by Git.
- Passed: 19 backend checks, seven frontend tests, production build and real browser checks for registration, session restoration, login failures, duplicate email, logout token revocation and invalid-session recovery.
- Marianna: review the small backend changes; add rate limiting, session expiry and remaining F6 account operations before treating full FR-01 as complete. SQLite is the implemented database; any PostgreSQL migration needs a team decision.
- Qingling: independently verify the integrated feature and record outcomes. Her status remains pending.
- Malak: review the connected UI, then continue F3; F2 integration awaits profile endpoints.
- Details and startup instructions: [frontend/INTEGRATION.md](frontend/INTEGRATION.md).
- F2/F3 frontend and backend integration is published on `feature/integrate-profiles-discovery`; see [frontend/F2_F3_INTEGRATION.md](frontend/F2_F3_INTEGRATION.md). Qingling’s independent verification remains pending.

## F3 frontend completion - 5 October 2026

- Malak: completed sample discovery, search, course/skill/interest/goal filters, profile detail/back navigation and factual fit explanations. Published branch: `feature/frontend-discovery`, based on F2 commit `f79625a`. This branch includes its F2/F1 integration dependency; review that dependency before merging.
- Checks: build and 10 frontend tests passed; browser search/detail/empty/filter/reset flows passed; no overflow at 320, 390, 1024 or 1440px; desktop visual reviewed.
- Marianna: implement authenticated discovery/detail queries, managed options, pagination and server-side privacy/eligibility checks.
- Qingling: independently verify filtering/fit evidence, then real data and privacy after backend integration.
- Handoff: [frontend/DISCOVERY_HANDOFF.md](frontend/DISCOVERY_HANDOFF.md). Sample data only; F3 backend integration is pending.
- F3 is published to origin/feature/frontend-discovery. F2/F3 integration is published on feature/integrate-profiles-discovery for review.
- Design: restored the left sidebar on desktop/laptop with compact navigation on mobile.
- Malak next: review connected F2/F3 and F4 messaging, then integrate F5-F6 as backend endpoints become available.
- Tracker reconciliation: removed duplicate outdated F1/F2/F3 rows from the latest main tracker; current statuses and Marianna's completed F1 work are retained.

- Design: restored the left sidebar on desktop/laptop and compact mobile navigation.
- Tracker reconciliation: consolidated duplicate outdated F1-F3 rows from main; current statuses and Marianna's completed F1 work are retained.

## F4 frontend implementation - 5 October 2026

- Malak: messaging completed and published on feature/frontend-messaging, based on F3 commit 7b1e48d; production build and all 13 frontend tests passed. Browser checks passed for inbox, incoming alerts, read clearing, send, profile initiation, separate histories/drafts, retry, mobile back/reopen and overflow at 320/390/1024/1440px. Desktop and mobile visuals reviewed.
- Includes conversation list, profile initiation, separate histories/drafts, send/retry, timestamps, sample incoming alerts, unread counts and mobile back navigation.
- Marianna: persistent messaging APIs, participant authorization, unread/read state, update delivery and duplicate prevention.
- Qingling: independent message order, isolation, retry, unread and responsive checks; persistence/security checks after integration.
- Handoff: [F4 messaging handoff](https://github.com/Tabalamari/Bootcamp-Group-Project/blob/feature/frontend-messaging/frontend/MESSAGING_HANDOFF.md). Sample data resets on reload; real messaging integration remains pending. F4 is pushed to its own branch; only this tracker is updated on main. Application changes are not merged into main.

## F4 backend integration - 8 October 2026

- Imported Marianna's merged FR-04 backend from `origin/main` into `feature/integrate-messaging` and connected the messaging UI to the authenticated conversation, history, send, read and inbox endpoints.
- Conversation lists and message history now persist through the API; unread counts refresh every 20 seconds and on demand. The demo-only incoming-message controls remain limited to demo mode.
- Checks: 51 backend checks, 18 frontend tests and the production build passed. An isolated in-memory test used the actual frontend messaging adapter with two authenticated accounts to verify conversation reuse, sending, ordered history, sender labels, unread clearing and account-isolated drafts/history. A third account was denied access (403). The Vite proxy reaches the protected messaging route (401 without a token); a stale local backend initially returned 404 and was restarted from the current source.
- Qingling: independently verify two-account conversation flow, message persistence, ordering, unread clearing and participant isolation.
- Remaining: independent verification by Qingling and a browser walkthrough using real team accounts. The F4 connection is being committed locally on `feature/integrate-messaging`; the application branch is not pushed.


## F5 frontend completion - 5 October 2026

- Malak: published branch feature/frontend-administration, based on F4 commit 86ca2f5. Implemented sample user management and category/skill/interest/course lists; create/rename, duplicate validation, category assignment, deactivate/reactivate, course correction, suspend/reactivate confirmations, search/status filters and save retry.
- Checks: 16 frontend tests and production build passed; browser checks passed role preview, suspension, duplicate rejection, creation/category assignment, cancel/deactivate, retained references, search/empty and save failure/retry. No overflow at 320/390/1024/1440px; desktop/mobile visuals reviewed.
- Limits: isolated sample admin workspace; changes reset on reload and do not propagate to learner screens or real accounts. Role switch is preview-only, not server authorization. Session revocation and cross-screen managed data integration remain pending.
- Marianna: protected administration APIs, stable managed IDs, reference preservation, persistence, role enforcement, session revocation and learner API integration.
- Qingling: independent admin workflow, inactive-reference, duplicate and responsive checks; verify direct API authorization, persistence and suspension across learner screens after integration.
- Malak next: review the connected F2/F3 flows, then integrate F4-F6 as backend endpoints become available.
- Handoff: [F5 administration handoff](https://github.com/Tabalamari/Bootcamp-Group-Project/blob/feature/frontend-administration/frontend/ADMIN_HANDOFF.md). F5 is published to origin/feature/frontend-administration; only this tracker is updated on main. Application changes are not merged into main.


## F6 frontend completion - 5 October 2026

- Malak: completed and published on feature/frontend-account-settings. Sample name/course updates, save/cancel, field validation, current-password confirmation, new-password confirmation, visibility toggle, sensitive-field clearing and retry.
- Checks: 18 tests and build passed; browser name/course/save/cancel/retry/password flows passed; no overflow at 320/390/1024/1440px; desktop/mobile visually reviewed.
- Limits: isolated temporary preview; real account, password, profile/header and discovery remain unchanged. Current-password verification is simulated, not server reauthentication.
- Marianna: authenticated account/password endpoints, active-course validation, secure password verification/change and session policy; keep shared profile/account state consistent.
- Qingling: independent form checks, then persistence, real password login, session handling, authorization and cross-screen consistency after integration.
- Malak next: frontend review and integration as backend endpoints become available.
- Handoff: [F6 account settings handoff](https://github.com/Tabalamari/Bootcamp-Group-Project/blob/feature/frontend-account-settings/frontend/SETTINGS_HANDOFF.md). F6 is published to origin/feature/frontend-account-settings. Only this tracker is updated on main; application changes are not merged into main.

## F2/F3 local integration - 7 October 2026

- Integrated Marianna’s F2/F3 backend from origin/main with Malak’s profile and discovery screens on `feature/integrate-profiles-discovery`, based on F6. Published for review; not merged into main.
- Profiles and managed options load from the API; profile edits persist; photo upload/removal uses protected endpoints. Discovery search, filters, profile details, fit explanations and pagination use protected APIs.
- Checks: backend suite 40/40; frontend suite 18/18; production build passed. Real browser journey passed profile save, photo upload/removal/persistence, server search/detail/fit/privacy/pagination, and 320/390/1024/1440 px layouts using temporary fictional accounts and an in-memory database.
- Qingling: independently verify; status remains pending. Marianna: review integration and advise on F6 account/password endpoints. F6 remains a sample preview.
- Handoff: [frontend/F2_F3_INTEGRATION.md](frontend/F2_F3_INTEGRATION.md). Application changes are on the integration branch; main remains unchanged.

## F5 local integration - 8 October 2026

- Imported Marianna's FR-05 backend from `origin/FR-05--administration` onto `feature/integrate-administration`, based on the F4 integration branch. Connected the admin workspace, managed category/skill/interest/course create/edit/deactivate/reactivate operations, and learner course/status updates to the authenticated administrator API.
- The signed-in account role now controls the real admin page; the sample role switch remains available only in demo mode. The user inspection view displays account/profile details while continuing to exclude private conversations.
- Checks: frontend tests 21/21; production build passed; Marianna's full backend API suite passed 61/61, including admin login/workspace access, learner 403 and unauthenticated 401, managed-list validation, course correction, suspension/session revocation and private-message privacy. Added adapter tests for authenticated workspace loading, managed-list/user mutations and authorization errors.
- Browser smoke check: signed in as the seeded administrator and confirmed the live Admin page loads the real user directory and categories from the backend. Still to verify interactively: create/edit/deactivate/reactivate and user course/status changes. Qingling's independent verification is pending, so do not mark FR-05 independently verified yet.
- Marianna: review the frontend/API connection on `feature/integrate-administration`.
- Qingling: independently verify admin workflows, role denial, persistence, suspension effects and privacy guarantees.
- Malak: complete browser walkthrough and address review feedback. Application changes remain off `main`; publish/merge only when agreed.
