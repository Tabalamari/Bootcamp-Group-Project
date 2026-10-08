# F6 — Account settings frontend handoff

Published branch: `feature/frontend-account-settings`, based on F5. Committed and pushed to origin, including earlier feature dependencies. Application changes are not merged into main; only the tracker is updated there.

## Delivered

Signed-in Account settings page with editable sample display name and course, validation, save/cancel feedback and retry. Separate password form requires the current sample password, a different new password (8–128 characters) and matching confirmation. Password visibility is optional; sensitive fields clear after success or service failure and on leaving the page. Errors are associated with their fields. Desktop/laptop/mobile layouts preserve existing navigation.

## Try the preview

Use fictional passwords only. Initial current sample password: `DemoPass123!`. After a successful change, use the new sample password for the next change. Sample settings controls can fail the next valid save to test retry. Account edits survive navigation in this tab but reset on reload. Accounts are isolated by user ID.

This isolated in-memory preview does not update the real account, login password, header, profile or discovery. It does not call a password-verification API. No real passwords should be entered. The sample password is temporary memory only, never persisted to browser storage; production passwords must be verified and hashed on the backend.

## Marianna

Implement authenticated account read/update and password-change endpoints. Proposed contract: GET/PATCH `/api/account` for displayName/courseId, POST `/api/account/password` for currentPassword/newPassword. Validate active course IDs and agreed name/password limits, require current-password reauthentication, hash passwords, reject suspended/unauthorized requests and rate-limit sensitive operations. Agree whether successful password change revokes other sessions or all sessions; return the agreed session outcome for frontend handling. Never return/log password values. Keep account/profile names and course assignments consistent.

## Qingling

Verify empty/long names, inactive course rejection, save/cancel, failed-save retry, current-password errors, mismatch/length/same-password rejection, field clearing, isolation and responsive layouts. After integration, verify reload persistence, actual login with the new password, rejection of the old password, session policy and direct unauthorized requests. Check header/profile/discovery consistency.

## Malak

Replace the isolated sample adapter when account endpoints exist; load managed active courses, update shared account/profile state and implement the agreed reauthentication/session outcome. All F1–F6 frontend screens now have implementations, but F2–F6 integration and independent verification remain open.

## Validation

18 frontend tests and production build passed. Browser checks passed name validation, cancel, name/course save, simulated failure/retry, navigation retention, password mismatch, incorrect-current-password rejection, successful change and field clearing. No overflow at 320/390/1024/1440px; desktop/mobile visuals reviewed. Authentication was mocked for these focused checks; real account updates remain unverified.
