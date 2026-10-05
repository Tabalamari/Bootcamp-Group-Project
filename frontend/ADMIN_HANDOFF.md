# F5 — Administration frontend handoff

Published branch: `feature/frontend-administration`, based on F4 commit `86ca2f5`. F5 is pushed to origin with its preceding feature dependencies. Application changes are not merged into main; only the tracker is updated there.

## Using the preview

Sign in and open **Admin preview**. The default Learner role shows an access-required screen. Select **Administrator (sample)** to explore fictional users and managed lists. This explicit preview switch grants no real privileges; it is not authentication or authorization.

Manage users, courses, categories, skills and interests. Create or rename list items, associate skills/interests with categories, deactivate/reactivate values, inspect fictional profiles, correct course assignments and suspend/reactivate sample users. Search and status filters, empty states, save feedback, cancel/confirmation dialogs and simulated save failure/retry are included. Native dialogs support keyboard focus and Escape to cancel.

Names normalize whitespace and reject case-insensitive duplicates within each list, including inactive values. Records retain stable IDs. Deactivation preserves existing references and excludes inactive categories/courses from new assignments in the admin preview. Existing inactive assignments remain readable and can be retained or replaced. No deletion or private-message viewing is offered.

## Boundaries

All administrative data is isolated in memory and resets on reload. Changes do not affect the F1 backend, learner profile choices, discovery or messaging. Sample suspension does not revoke a real session. The signed-in Admin preview entry is a demonstration, not a protected production administration route. The real integration must remove the preview role switch and use server-returned permissions. Frontend completion does not complete FR-05 security or cross-screen integration.

## Marianna

Provide authenticated administrator-only list/create/update/deactivate endpoints for managed records and list/detail/update operations for users. Agree stable IDs, category relationships, active flags, normalized duplicate rules and pagination. Proposed resources: `/api/admin/categories`, `/skills`, `/interests`, `/courses`, `/users` under the same admin prefix. Enforce roles for every operation; preserve referenced values; reject new inactive assignments; validate course corrections; revoke sessions when suspending users and exclude suspended users from discovery/contact. User endpoints must not include private conversations. Return consistent validation/errors; define stale-update conflict behavior. Wire active managed choices and status changes into the existing learner APIs.

## Qingling

Independently verify duplicate normalization, create/rename, category assignment, cancel/confirmation, deactivate/reactivate, preserved references, course correction, suspend/reactivate, empty/search and save retry. Check desktop/mobile and keyboard operation. After integration, verify direct unauthorized API denial, inactive options across learner screens, persistence, session revocation, discovery/contact exclusion and absence of private message access.

## Malak

Replace the sample service and preview role switch when the protected backend is available. Connect managed options and status updates across learner screens, then repeat end-to-end checks. F6 account settings is the next frontend feature after F5 review.

## Validation

16 frontend tests and the production build passed. Focused browser checks passed role preview, user suspension, duplicate rejection, creation/category assignment, cancel/deactivate, preserved references, search/empty and save failure/retry. Overflow checks passed at 320/390/1024/1440px; desktop/mobile screenshots reviewed. Authentication was mocked for these checks; real backend permissions remain unverified.
