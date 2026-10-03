# Bootcamp Connect - First Feature Assignments

Date: 1 October 2026  
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

### Tasks

- Build a registration form with display name, email, password, and course selection.
- Build the login form and sign-out control.
- Build a welcome page available only to signed-in users.
- Show field validation, loading indicators, success feedback, and clear errors.
- Populate the course selector from Marianna's available-courses endpoint.
- Connect the forms to the agreed backend operations.
- Use sample responses while the backend is being developed.

### Done when

- [ ] A user can register and sign in through the interface.
- [ ] Course options load and the selected course is submitted correctly.
- [ ] Invalid inputs and backend errors have understandable feedback.
- [ ] A signed-in user reaches the protected welcome page.
- [ ] Signing out returns the user to a public screen.
- [ ] The complete interface works with the real backend.

## Marianna - Backend

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

- [ ] Register a new learner with a course selection.
- [ ] Confirm the learner and course are stored correctly.
- [ ] Sign in and open the protected welcome page.
- [ ] Sign out and confirm protected access is denied.
- [ ] Demonstrate clear handling of invalid inputs and duplicate registration.
- [ ] Confirm the checks pass and record any remaining work.
- [ ] Commit the implementation and verification results to the shared repository through the team's agreed review process.

The feature is complete when all three contributions work together and the shared checklist passes.
