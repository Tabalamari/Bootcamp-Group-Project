# Bootcamp Connect frontend

Malak's frontend features: registration, course selection, login, welcome screen, logout, and profile viewing/editing with photo controls. React + JavaScript, Vite, and Tailwind CSS. Responsive desktop, laptop and mobile layouts follow the approved blue mockup.

## Run

Use Node.js 22.12+ (or a compatible newer LTS version).

```sh
cd frontend
npm install
npm run dev
```

Open the local address printed in the terminal. Run `npm test` for validation/demo-service checks and `npm run build` for a production build.

## Demo mode

Real authentication is enabled by default. To use the standalone demo, set `VITE_DEMO_MODE=true` and restart Vite. Demo mode is clearly labelled. Use fictional details. Sample login: `malak@example.com` / `DemoPass123!`.

In standalone demo mode, registration creates a temporary account that can be used to log in again after logout. All accounts and the session reset on a full page reload. Passwords are held only in temporary memory; nothing is stored in browser storage. This is an interface demonstration, not secure authentication. Real sessions, persistence, permissions and password handling belong to the backend.

## Backend integration

Real authentication is connected. See [INTEGRATION.md](INTEGRATION.md) for startup instructions, the actual API contract, test results and remaining work. The earlier proposed cookie-based API is superseded by Marianna's bearer-token API.

## Qingling's interface verification

- Register a fictional learner from each course; check the welcome details.
- Test missing fields, malformed email and a short registration password.
- Try a duplicate registration and incorrect login credentials.
- Sign out, then navigate back: the welcome screen must remain unavailable.
- Log in again using the created account before reloading.
- Check password visibility, keyboard navigation, and 320px, 390px, 1024px and 1440px layouts.
- With the real API connected, verify course-loading retry, failed requests, session restoration, and server-enforced authorization.

For profiles, sign in and select **View your profile** or your account avatar. See [the F2 handoff](PROFILE_HANDOFF.md) for delivered behavior, proposed API operations and verification tasks. Profile editing currently uses sample data only and resets on full reload.

F1 authentication is integrated and locally tested; independent verification and production hardening remain pending. F2 backend integration remains pending. Discovery is completed with sample data. Messaging is completed locally with sample data; administration has a local sample preview with backend integration pending.

F3 discovery is available from the signed-in Discover navigation. It uses fictional profiles; see [DISCOVERY_HANDOFF.md](DISCOVERY_HANDOFF.md) for the backend proposal and checks.

F4 sample messaging is available from Messages or a Discover profile. See [MESSAGING_HANDOFF.md](MESSAGING_HANDOFF.md) for demo controls, limitations and backend assignments. Conversations reset on reload.

F5 sample administration is available through **Admin preview**. Select the sample administrator role to review the screens. See [ADMIN_HANDOFF.md](ADMIN_HANDOFF.md) for scope, integration gaps and team assignments.

F6 is available from **Account settings** as an isolated sample preview. Use fictional passwords only. See [SETTINGS_HANDOFF.md](SETTINGS_HANDOFF.md) for instructions and backend assignments. Real account/password updates are pending integration.

F2 profiles and F3 discovery are connected locally to Marianna’s backend on the integration branch. See [F2/F3 integration handoff](F2_F3_INTEGRATION.md). F6 account edits and password changes remain a sample preview pending backend endpoints.
