# Bootcamp Connect - Team Assignments and Feature Tracker

Date: 1 October 2026  
Last updated: 4 October 2026

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

| Feature | Malak: frontend | Marianna: backend | Qingling: data and verification | Integration |
| --- | --- | --- | --- | --- |
| F1 Registration, login, course selection and logout | **Done (sample data)**, 4 Oct 2026; `feature/frontend-auth`, commit `3fd1d61` | **Done**, 4 Oct 2026; `backend/`, commit `8ea04f8` | Awaiting confirmation | Pending integration |
| F2 Profile viewing/editing and profile photos | Not started; next frontend feature | Awaiting confirmation | Awaiting confirmation | Pending integration |
| F3 Discovery, filters and fit explanations | Not started | Awaiting confirmation | Awaiting confirmation | Pending integration |
| F4 Conversations, messages and unread indicators | Not started | Awaiting confirmation | Awaiting confirmation | Pending integration |
| F5 Administration: users, courses, categories, skills and interests | Not started | Awaiting confirmation | Awaiting confirmation | Pending integration |
| F6 Account settings: name, course and password changes | Not started | Awaiting confirmation | Awaiting confirmation | Pending integration |

F6 completes the account-management portion of FR-01 beyond the initial F1 milestone. Unread indicators in F4 reflect Malak's accepted messaging design. Other optional PRD features remain deferred. No backend or independent verification completion is claimed by this tracker.

## Assignments for the remaining features

| Feature | Malak can build now | Marianna implements later | Qingling prepares and verifies |
| --- | --- | --- | --- |
| F2 Profiles | Profile display/editor; bio, skills, interests and goals; photo picker, preview, enlargement, edit and removal; validation and save/error states using a sample profile service. | Profile read/update operations; ownership checks; photo upload/storage and file validation; persistent skill/interest relationships. | Representative complete/empty profiles; valid/invalid photos; correct saved fields; ownership and photo-access checks after integration. |
| F3 Discovery | Profile cards, filters, empty/loading/error states and explanations derived from sample profiles. | Filter/query operations; eligible-user rules; pagination; factual fit data without exposing private account fields. | Expected filter results, combined-filter cases, fit explanations and checks that suspended users/private fields are excluded. |
| F4 Messaging | Conversation list; separate histories and drafts; open/reopen chats; send/retry states; unread badges and sample incoming-message alerts; mobile conversation navigation. | Persistent conversations/messages; participant-only access; duplicate-conversation prevention; unread/read state; agreed message update mechanism. | Multiple conversations and incoming-message fixtures; message order; unread clearing; isolation between chats; third-party access denial and persistence. |
| F5 Administration | Screens for users and managed lists; create/edit/deactivate flows, confirmations, validation and failure states using sample services. | Administrator authorization; list management; duplicate rules; reference-preserving deactivation; user suspension/reactivation and session revocation. | Duplicate/inactive values; existing references; role restrictions; suspended-user behavior; changes reflected in learner screens. |
| F6 Account settings | Editable name/course and password-change form; reauthentication prompts; success/error states using sample services. | Authenticated account updates; password verification/change; session handling; server-side validation. | Correct updates; invalid credentials; course validity; unauthorized changes and session behavior after password changes. |

Every frontend feature must support desktop, laptop and mobile, keyboard operation, relevant validation, loading, empty and error states. Keep all sample credentials/data fictional, and keep sample services replaceable by real API adapters.

## Completion and handoff record

### F1 - Frontend completed on 4 October 2026

- Owner: Malak. Implementation: [frontend/](https://github.com/Tabalamari/Bootcamp-Group-Project/tree/feature/frontend-auth/frontend).
- Delivered: registration, course selection, login, welcome screen, logout and responsive blue styling.
- Checks: production build; three validation/demo-service tests; browser journey checks; overflow checks at 320, 390, 1024 and 1440 pixels; desktop/mobile visual review.
- Limitation: sample accounts and session are temporary; refresh resets them. No real authentication, persistent database or server authorization is implemented.
- Handoff: [setup, proposed API contract and verification checklist](https://github.com/Tabalamari/Bootcamp-Group-Project/blob/feature/frontend-auth/frontend/README.md).
- Branch: `feature/frontend-auth`; implementation commit `3fd1d61` pushed to origin. Merge approval remains pending.
- Malak next: start F2 independently, then connect F1 when the backend is available.
- Marianna next: review F1's API proposal and implement account/session/course operations.
- Qingling next: independently verify the demo; prepare course/test data; verify the integrated backend when available.

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

Frontend demo implemented on `feature/frontend-auth` in [frontend/](https://github.com/Tabalamari/Bootcamp-Group-Project/tree/feature/frontend-auth/frontend). Uses React, JavaScript, Vite and Tailwind CSS with the approved blue design and responsive desktop, laptop and mobile layouts.

Registration, course selection, login, a welcome screen and logout are available using temporary sample accounts. Accounts and sessions reset on a page reload. This is frontend demonstration behavior, not real authentication or persistent storage.

Validation completed: production build; three automated validation/demo-service tests; browser walkthrough of registration, invalid login, successful login, logout, signed-out welcome-screen gating and demo reset. Layout overflow checks passed at 320px, 390px, 1024px and 1440px; desktop and mobile screenshots were reviewed. These checks do not replace Qingling's independent verification or backend security checks.

Next: proceed with F2 using sample data while Marianna is unavailable. Review the proposed F1 API contract and connect the real backend when she returns. Setup instructions, sample credentials and the proposed API are in [frontend/README.md](https://github.com/Tabalamari/Bootcamp-Group-Project/blob/feature/frontend-auth/frontend/README.md).

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
- [ ] Real API error responses and session behavior are verified after integration.
- [ ] The complete interface works with the real backend.

## Marianna - Backend

### Next handoff

Review [the proposed frontend API contract](https://github.com/Tabalamari/Bootcamp-Group-Project/blob/feature/frontend-auth/frontend/README.md#proposed-api-contract-for-marianna-to-review) before implementing or adapting endpoints. Confirm course IDs, validation rules, response shapes, session cookies and CSRF protection with Malak. The frontend includes an API adapter, but no backend is implemented in this branch. Backend completion has not yet been reported.

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

- [ ] Valid registration creates a persistent learner account with the correct course.
- [ ] Duplicate emails and invalid registration data are rejected.
- [ ] Valid credentials create an authenticated session; incorrect credentials fail.
- [ ] Sessions support the frontend's agreed authentication flow.
- [ ] Sign-out invalidates the session.
- [ ] Signed-out requests cannot access protected data.
- [ ] The available-courses endpoint returns the agreed active course records.

## Qingling - Data and Verification

### Next handoff

Start with the demo and [interface verification checklist](https://github.com/Tabalamari/Bootcamp-Group-Project/blob/feature/frontend-auth/frontend/README.md#qinglings-interface-verification). Independently verify both course choices and error cases, and record results. Once Marianna's backend is connected, verify persistence, duplicate-account handling, session invalidation and unauthorized requests against the server. Verification completion has not yet been reported.

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

The shared checklist remains open until the real backend is connected and verified. Malak's demo completion alone does not complete this milestone. Changes are reviewed on `feature/frontend-auth`; merging to `main` is a separate team decision.

- [ ] Register a new learner with a course selection.
- [ ] Confirm the learner and course are stored correctly.
- [ ] Sign in and open the protected welcome page.
- [ ] Sign out and confirm protected access is denied.
- [ ] Demonstrate clear handling of invalid inputs and duplicate registration.
- [ ] Confirm the checks pass and record any remaining work.
- [ ] Commit the implementation and verification results to the shared repository through the team's agreed review process.

The feature is complete when all three contributions work together and the shared checklist passes.
