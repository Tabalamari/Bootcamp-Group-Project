# Bootcamp Connect - Team Assignments and Feature Tracker

Date: 1 October 2026  
Last updated: 8 October 2026

Related specification: [PRD.md](PRD.md), FR-01 through FR-05

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

Keep each feature on a separate branch. If the preceding branch has not merged, a new frontend branch can start from it; record that dependency and target the preceding branch for review until it merges. Publishing branches and merging to `main` are separate actions and require Malak's agreement. Do not merge merely to start the next feature.

## Feature status

| Feature                                                             | Malak: frontend                                                                       | Marianna: backend                                                                         | Qingling: git, data and verification | Integration                                                                        |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------- |
| F1 Registration, login, course selection and logout                 | **Connected and locally tested**, 5 Oct 2026                                          | Implemented; 19 backend checks passed, with validation/test-isolation fixes               | Independent verification pending     | Local integration passed; team review pending                                      |
| F2 Profile viewing/editing and profile photos                       | **Connected and locally tested**, 7 Oct 2026; `feature/integrate-profiles-discovery`   | Implemented; F1–F3 backend suite passed 40 checks                                          | Independent verification pending     | Local integration passed; team review pending                                      |
| F3 Discovery, filters and fit explanations                          | **Connected and locally tested**, 7 Oct 2026; `feature/integrate-profiles-discovery`   | Implemented; F1–F3 backend suite passed 40 checks                                          | Independent verification pending     | Local integration passed; team review pending                                      |
| F4 Conversations, messages and unread indicators                    | **Connected and locally tested**, 8 Oct 2026; `feature/integrate-messaging`             | Implemented; F1–F4 backend suite passed 51 checks                                          | Independent verification pending     | Two-account adapter/API check passed; independent team and browser review pending   |
| F5 Administration: users, courses, categories, skills and interests | **Done (sample data)**, 5 Oct 2026; `feature/frontend-administration`                 | Implemented; 61 backend checks passed (F1 through F5), covering all 8 acceptance criteria | Awaiting confirmation                | Pending integration                                                                |
| F6 Account settings: name, course and password changes              | **Done (sample data)**, 5 Oct 2026; `feature/frontend-account-settings`               | Awaiting confirmation                                                                     | Awaiting confirmation                | Pending integration                                                                |

F6 completes the account-management portion of FR-01 beyond the initial F1 milestone. Unread indicators in F4 reflect Malak's accepted messaging design. Other optional PRD features remain deferred. F1 backend implementation and local integration are verified below; independent verification remains pending.

## Assignments for the remaining features

| Feature             | Malak can build now                                                                                                                                                              | Marianna implements later                                                                                                                              | Qingling prepares and verifies                                                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F2 Profiles         | Profile display/editor; bio, skills, interests and goals; photo picker, preview, enlargement, edit and removal; validation and save/error states using a sample profile service. | Profile read/update operations; ownership checks; photo upload/storage and file validation; persistent skill/interest relationships.                   | Representative complete/empty profiles; valid/invalid photos; correct saved fields; ownership and photo-access checks after integration.                  |
| F3 Discovery        | Profile cards, filters, empty/loading/error states and explanations derived from sample profiles.                                                                                | Filter/query operations; eligible-user rules; pagination; factual fit data without exposing private account fields.                                    | Expected filter results, combined-filter cases, fit explanations and checks that suspended users/private fields are excluded.                             |
| F4 Messaging        | Conversation list; separate histories and drafts; open/reopen chats; send/retry states; unread badges and sample incoming-message alerts; mobile conversation navigation.        | Persistent conversations/messages; participant-only access; duplicate-conversation prevention; unread/read state; agreed message update mechanism.     | Multiple conversations and incoming-message fixtures; message order; unread clearing; isolation between chats; third-party access denial and persistence. |
| F5 Administration   | Screens for users and managed lists; create/edit/deactivate flows, confirmations, validation and failure states using sample services.                                           | Administrator authorization; list management; duplicate rules; reference-preserving deactivation; user suspension/reactivation and session revocation. | Duplicate/inactive values; existing references; role restrictions; suspended-user behavior; changes reflected in learner screens.                         |
| F6 Account settings | Editable name/course and password-change form; reauthentication prompts; success/error states using sample services.                                                             | Authenticated account updates; password verification/change; session handling; server-side validation.                                                 | Correct updates; invalid credentials; course validity; unauthorized changes and session behavior after password changes.                                  |

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
- Qingling next: independently verify admin authorization, category filtering, duplicate rejection, soft deactivation, session revocation, and learner privacy.
- Malak next: connect frontend `adminService.js` to real backend endpoints.

### Record for each subsequent completed frontend feature

Add a dated entry with: feature ID; owner; branch and implementation location; delivered behavior; actual check results; sample-data limitations; proposed API contract; and explicit next actions for Marianna, Qingling and Malak. Only mark the frontend column done; leave backend, verification and integration statuses unchanged unless evidence supports updating them.

## Shared first feature

Build **registration and login with course selection**. Users should be able to create an account, select their course, sign in, reach a protected welcome page, and sign out.

This is the team's first implementation milestone. The remaining account-management requirements in FR-01 will follow this initial feature.

## Ownership

| Team member | Strength                       | Responsibility                                                                                    |
| ----------- | ------------------------------ | ------------------------------------------------------------------------------------------------- |
| Malak       | Frontend                       | Registration and login interface, course selection, sign-out, and protected welcome page.         |
| Marianna    | Backend                        | Account creation, authentication, sessions, available-course data endpoint, and protected access. |
| Qingling    | Data analysis and verification | Initial course data, test data, data validation, and verification of the complete feature.        |

## Malak - Frontend

### Current status

Frontend demo implemented on `feature/frontend-auth` in [frontend/](frontend/). Uses React, JavaScript, Vite and Tailwind CSS with the approved blue design and responsive desktop, laptop and mobile layouts.

Registration, course selection, login, a welcome screen and logout are available using temporary sample accounts. Accounts and sessions reset on a page reload. This is frontend demonstration behavior, not real authentication or persistent storage.

Validation completed: production build; three automated validation/demo-service tests; browser walkthrough of registration, invalid login, successful login, logout, signed-out welcome-screen gating and demo reset. Layout overflow checks passed at 320px, 390px, 1024px and 1440px; desktop and mobile screenshots were reviewed. These checks do not replace Qingling's independent verification or backend security checks.

Current next steps: complete authenticated F4 messaging verification, then connect F5/F6 when their backend APIs are ready. F2/F3 are already integrated locally; Qingling's independent verification remains pending. Setup instructions and API details are in [frontend/README.md](frontend/README.md).

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
- [x] The F1 authentication interface works with the real backend; F2 remains a demo.

## Marianna - Backend

### Next handoff

Marianna's F1 backend is now on `origin/main`. Its [API README](https://github.com/Tabalamari/Bootcamp-Group-Project/blob/main/backend/README.md) was reviewed on 5 October 2026. It documents Node.js/Express, SQLite, bcrypt and bearer-token sessions. This differs from the earlier PostgreSQL plan and cookie-based frontend proposal; confirm the database choice with the team.

Completed integration: use returned tokens in `Authorization: Bearer ...`, restore sessions through `GET /api/auth/me`, read errors from `error`, use course IDs from the API (`software-dev`, `business-dev`), and handle the logout JSON response. The frontend adapter now uses this API and real authentication is the default. F2 remains a labelled profile demo until profile endpoints exist.

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

F1 is now connected locally. Use [the integration handoff](frontend/INTEGRATION.md) to run both services and independently verify real registration, courses, persistence, duplicate handling, session restoration and revoked tokens. F2 remains a separate demo. Record results; automated checks do not imply Qingling has completed her assignment.

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

F1 local integration checks pass. Independent team verification and merge approval remain open. F4's authenticated two-account adapter/API test has passed on `feature/integrate-messaging`; a browser walkthrough with team accounts and independent review remain pending. Application changes have not been merged into main.

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
- Malak: F2/F3 are integrated locally on `feature/integrate-profiles-discovery`; F4 messaging connection is in progress on `feature/integrate-messaging`.
- Details and startup instructions: [frontend/INTEGRATION.md](frontend/INTEGRATION.md).
- F2 and F1 integration commit `f79625a` is included in the published F3 branch. The separate F2 branch is now published to origin. Only this tracker update is being shared on main.

## F3 frontend completion - 5 October 2026

- Malak: completed sample discovery, search, course/skill/interest/goal filters, profile detail/back navigation and factual fit explanations. Published branch: `feature/frontend-discovery`, based on F2 commit `f79625a`. This branch includes its F2/F1 integration dependency; review that dependency before merging.
- Checks: build and 10 frontend tests passed; browser search/detail/empty/filter/reset flows passed; no overflow at 320, 390, 1024 or 1440px; desktop visual reviewed.
- Marianna: implement authenticated discovery/detail queries, managed options, pagination and server-side privacy/eligibility checks.
- Qingling: independently verify filtering/fit evidence, then real data and privacy after backend integration.
- Handoff: [frontend/DISCOVERY_HANDOFF.md](frontend/DISCOVERY_HANDOFF.md). The 5 October frontend completion used sample data; F3 backend integration is recorded below.
- F3 is published to origin/feature/frontend-discovery. The current local working branch is feature/frontend-account-settings. Only TEAM_ASSIGNMENTS.md is updated on main; F3 application code is not merged into main.
- Design: restored the left sidebar on desktop/laptop with compact navigation on mobile.
- Malak next: finish authenticated F4 messaging verification, then integrate F5-F6 when their backend endpoints are available.
- Tracker reconciliation: removed duplicate outdated F1/F2/F3 rows from the latest main tracker; current statuses and Marianna's completed F1 work are retained.

- Design: restored the left sidebar on desktop/laptop and compact mobile navigation.
- Tracker reconciliation: consolidated duplicate outdated F1-F3 rows from main; current statuses and Marianna's completed F1 work are retained.

## F2/F3 backend integration - 7 October 2026

- Connected profile viewing/editing and discovery/filtering to Marianna's APIs on `feature/integrate-profiles-discovery`.
- Checks: the F1–F3 backend suite passed 40 checks; local F2/F3 integration and frontend checks passed. Independent verification by Qingling remains pending.

## F4 frontend implementation - 5 October 2026

- Malak: messaging completed and published on feature/frontend-messaging, based on F3 commit 7b1e48d; production build and all 13 frontend tests passed. Browser checks passed for inbox, incoming alerts, read clearing, send, profile initiation, separate histories/drafts, retry, mobile back/reopen and overflow at 320/390/1024/1440px. Desktop and mobile visuals reviewed.
- Includes conversation list, profile initiation, separate histories/drafts, send/retry, timestamps, sample incoming alerts, unread counts and mobile back navigation.
- Marianna: persistent messaging APIs, participant authorization, unread/read state, update delivery and duplicate prevention.
- Qingling: independent message order, isolation, retry, unread and responsive checks; persistence/security checks after integration.
- Handoff: [F4 messaging handoff](https://github.com/Tabalamari/Bootcamp-Group-Project/blob/feature/frontend-messaging/frontend/MESSAGING_HANDOFF.md). Sample data resets on reload; real messaging integration remains pending. F4 is pushed to its own branch; only this tracker is updated on main. Application changes are not merged into main.

## F4 backend integration - 8 October 2026

- Connected the inbox, conversation history, send, read state, inbox refresh and unread badge to Marianna's authenticated messaging APIs on `feature/integrate-messaging`.
- Checks: 51 backend checks, 18 frontend tests and the production build passed. An isolated in-memory test used the actual frontend adapter with two authenticated accounts to verify conversation reuse, sending, ordered history, sender labels, unread clearing and account-isolated drafts/history; a third account was denied access (403). The Vite proxy returns 200 for courses and 401 for messaging without a token.
- A stale local backend initially returned 404 for messaging; it was restarted from the current F4-enabled source.
- Qingling: independently verify authenticated two-account conversations, message order and persistence, unread clearing and participant isolation.
- Remaining: Qingling's independent verification and a browser walkthrough with team accounts. F4 application changes are committed locally on `feature/integrate-messaging` and have not been pushed.

## F5 frontend completion - 5 October 2026

- Malak: published branch feature/frontend-administration, based on F4 commit 86ca2f5. Implemented sample user management and category/skill/interest/course lists; create/rename, duplicate validation, category assignment, deactivate/reactivate, course correction, suspend/reactivate confirmations, search/status filters and save retry.
- Checks: 16 frontend tests and production build passed; browser checks passed role preview, suspension, duplicate rejection, creation/category assignment, cancel/deactivate, retained references, search/empty and save failure/retry. No overflow at 320/390/1024/1440px; desktop/mobile visuals reviewed.
- Limits: isolated sample admin workspace; changes reset on reload and do not propagate to learner screens or real accounts. Role switch is preview-only, not server authorization. Session revocation and cross-screen managed data integration remain pending.
- Marianna: protected administration APIs, stable managed IDs, reference preservation, persistence, role enforcement, session revocation and learner API integration.
- Qingling: independent admin workflow, inactive-reference, duplicate and responsive checks; verify direct API authorization, persistence and suspension across learner screens after integration.
- Malak next: frontend review and F2-F6 integration as backend endpoints become available.
- Handoff: [F5 administration handoff](https://github.com/Tabalamari/Bootcamp-Group-Project/blob/feature/frontend-administration/frontend/ADMIN_HANDOFF.md). F5 is published to origin/feature/frontend-administration; only this tracker is updated on main. Application changes are not merged into main.

## F6 frontend completion - 5 October 2026

- Malak: completed and published on feature/frontend-account-settings. Sample name/course updates, save/cancel, field validation, current-password confirmation, new-password confirmation, visibility toggle, sensitive-field clearing and retry.
- Checks: 18 tests and build passed; browser name/course/save/cancel/retry/password flows passed; no overflow at 320/390/1024/1440px; desktop/mobile visually reviewed.
- Limits: isolated temporary preview; real account, password, profile/header and discovery remain unchanged. Current-password verification is simulated, not server reauthentication.
- Marianna: authenticated account/password endpoints, active-course validation, secure password verification/change and session policy; keep shared profile/account state consistent.
- Qingling: independent form checks, then persistence, real password login, session handling, authorization and cross-screen consistency after integration.
- Malak next: frontend review and integration as backend endpoints become available.
- Handoff: [F6 account settings handoff](https://github.com/Tabalamari/Bootcamp-Group-Project/blob/feature/frontend-account-settings/frontend/SETTINGS_HANDOFF.md). F6 is published to origin/feature/frontend-account-settings. Only this tracker is updated on main; application changes are not merged into main.
