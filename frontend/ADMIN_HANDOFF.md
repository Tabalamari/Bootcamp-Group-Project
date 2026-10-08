# F5 — Administration handoff

## Current integration

The administration frontend is connected locally on `feature/integrate-administration`, based on the F4 integration branch. It uses Marianna's FR-05 API and the signed-in user's Bearer token. The backend role controls access; the sample role switch and simulated save failure remain available only in demo mode.

Administrators can search and inspect users, correct course assignments, suspend/reactivate accounts, and create/edit/deactivate/reactivate categories, skills, interests and courses. Skill and interest records can be assigned to categories. User inspection shows account/profile fields and explicitly excludes private conversations. Backend deactivation preserves existing references, and suspension revokes active sessions.

## Verification status

- Frontend tests: 21 passed.
- Production frontend build: passed.
- Marianna's backend suite: 61 passed, including admin login and workspace, role enforcement, taxonomy management, course correction, session revocation and private-message privacy.
- Adapter tests cover authenticated workspace loading, managed-list and user mutations, and authorization errors.
- Still needed: browser walkthrough signed in as the seeded administrator and Qingling's independent verification. Keep FR-05's independent verification pending until those are done.

## Handoff

- **Marianna:** review the frontend/API connection on `feature/integrate-administration` and report any contract issues.
- **Qingling:** independently verify admin workflows, duplicate and inactive values, role denial, persistence, suspension effects, privacy and responsive behavior.
- **Malak:** complete the administrator browser walkthrough and address review feedback.

The prior sample-only frontend remains available in demo mode. Application changes are on the integration branch and have not been pushed or merged to `main`.
