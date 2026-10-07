# F2 and F3 frontend/backend integration

Integration branch: `feature/integrate-profiles-discovery`, based on F6. Backend implementation was merged from `origin/main` on 7 October 2026. This branch is published for review; application changes have not been merged into main.

## F2 profile integration

- `GET /api/profiles/me` loads the signed-in learner’s persistent profile.
- `GET /api/profile-options` supplies the current skills, interests and goals.
- `PATCH /api/profiles/me` saves the display name, bio and selected options.
- `POST /api/profiles/me/photo` uploads the selected image as multipart `photo`; `DELETE` on the same route removes it.
- Bearer session token is sent from session storage. Photo URLs are resolved against the backend host. The browser’s existing file type, 5 MB and image-decode checks still apply.
- Course remains read-only on the profile screen and belongs to F6 account settings. Marianna has not added account update or password-change routes, so F6 remains a sample preview.

## F3 discovery integration

- `GET /api/profiles` receives search, course, skill, interest, goal and pagination query parameters.
- API results include public learner details and factual `fitReasons`; detail uses `GET /api/profiles/:userId`.
- Search and filters are sent to the server (220 ms typing debounce); pagination uses the API metadata. The app does not expose email, role or account status.
- Active managed options are loaded from the backend. Self/suspended exclusions and fit evidence are enforced/calculated by the backend implementation.

## Local verification

- Marianna’s backend suite: 40 passed, 0 failed, including auth, profile ownership/privacy, photo upload validation, search/filter logic, fit reasons and pagination.
- Malak’s frontend suite: 18 passed; production build passed.
- Real browser/API flow with temporary fictional users: registration and bearer-token use; profile read, managed options, bio/name/skill save and persistence; real photo upload, display and removal; server search, profile detail, factual fit, pagination and privacy; 320/390/1024/1440 px overflow checks passed.
- The backend preview used an in-memory SQLite database. Uploaded photo was removed after the browser check. The temporary accounts disappeared when the server stopped.
- Authentication was exercised against the actual local backend. Qingling’s independent verification remains pending. These checks do not assess production deployment or perform an independent security audit.

## Remaining work

- Qingling: independently repeat F2/F3 flows and confirm direct unauthorized requests, private-field exclusion, self/suspended behavior, persistence and expected filter results.
- Marianna: review the integration and decide whether to add account/course/password endpoints for F6.
- Malak: connect F6 when those endpoints are available and address any review findings.
