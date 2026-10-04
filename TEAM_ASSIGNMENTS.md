# Bootcamp Connect - First Feature Assignments

Date: 1 October 2026  
Last updated: 4 October 2026

Related specification: [PRD.md](PRD.md), FR-01

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

Frontend demo implemented on `feature/frontend-auth` in [frontend/](frontend/). Uses React, JavaScript, Vite and Tailwind CSS with the approved blue design and responsive desktop, laptop and mobile layouts.

Registration, course selection, login, a welcome screen and logout are available using temporary sample accounts. Accounts and sessions reset on a page reload. This is frontend demonstration behavior, not real authentication or persistent storage.

Validation completed: production build; three automated validation/demo-service tests; browser walkthrough of registration, invalid login, successful login, logout, signed-out welcome-screen gating and demo reset. Layout overflow checks passed at 320px, 390px, 1024px and 1440px; desktop and mobile screenshots were reviewed. These checks do not replace Qingling's independent verification or backend security checks.

Next: review the proposed API contract with Marianna, connect the real backend, and resolve any integration issues. Setup instructions, sample credentials and the proposed API are in [frontend/README.md](frontend/README.md).

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

Review [the proposed frontend API contract](frontend/README.md#proposed-api-contract-for-marianna-to-review) before implementing or adapting endpoints. Confirm course IDs, validation rules, response shapes, session cookies and CSRF protection with Malak. The frontend includes an API adapter, but no backend is implemented in this branch. Backend completion has not yet been reported.

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

Start with the demo and [interface verification checklist](frontend/README.md#qinglings-interface-verification). Independently verify both course choices and error cases, and record results. Once Marianna's backend is connected, verify persistence, duplicate-account handling, session invalidation and unauthorized requests against the server. Verification completion has not yet been reported.

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

## Agree before implementation

- Registration field names and validation rules.
- Initial course names and identifiers.
- API operations, request and response formats, and error messages.
- Authentication and session approach.
- What the protected welcome page displays.

Marianna leads the API agreement, Malak confirms it supports the interface, and Qingling confirms it can be verified with the planned test data.

## Working sequence

1. Agree the shared fields, course data, and API contract.
2. Work in parallel: Malak builds with sample responses, Marianna implements the backend, and Qingling prepares data and verification cases.
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
