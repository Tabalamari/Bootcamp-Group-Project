# F4 — Messaging frontend handoff

Published on `codex/frontend-messaging`, based on F3 commit `7b1e48d`. Includes the preceding F3/F2/F1 integration dependencies for review. Application changes are not merged into main; only the tracker is updated there.

## Delivered

Open a conversation from a Discover profile, reuse an existing conversation, list recipients with latest-message previews, reopen separate histories, retain per-conversation drafts while navigating, send text, retry a simulated failure, display timestamps, and show unread counts plus an incoming-message notice. Mobile has a conversation list and a back button from the open chat. Desktop keeps the sidebar and inbox together.

The inbox starts empty. Use **Try sample incoming message** in the sidebar to receive a fictional Amara message from any signed-in page. Open the conversation to clear its unread count. A visible open conversation is marked read; a hidden tab does not clear new unread messages until visible again. The sample controls can make the next send fail; the draft remains available for retry.

## Limitations

This is frontend sample behavior, not private messaging infrastructure. Messages and drafts are held in memory per signed-in user and reset on reload. No real recipients receive messages, no server persistence or authorization is implemented, and no browser/OS notifications are requested. Sample messages are capped at 2,000 characters; agree this limit with the backend. No automatic replies are presented as real activity.

## Marianna

Agree and implement authenticated conversation list/create, message list/send and mark-read endpoints. Suggested routes: GET/POST `/api/conversations`, GET/POST `/api/conversations/:id/messages`, POST `/api/conversations/:id/read`. Return conversation ID, public recipient information, latest preview/time, unread count, ordered message IDs/timestamps and pagination cursors. Define polling or event updates with Malak. Enforce participant access on every operation, reuse the same participant pair, reject self/suspended recipients, validate length, prevent duplicate retries with client message IDs, and persist messages/read state across sessions. Never expose private account fields. Replace the sample service with the agreed API adapter.

## Qingling

Independently verify multiple conversations, draft/history isolation, previews, ordering, blank/oversized input, failure/retry, unread counts and clearing, keyboard use and mobile back navigation. After integration, verify real two-account exchange, reload/session persistence, pagination, suspended users, participant-only access and third-party denial. Frontend checks do not prove server security.

## Malak

Review the local F4 interface with the team, then connect Marianna's messaging API when available. F5 administration is the next frontend feature after F4 approval.

## Validation

Production build and 13 frontend tests passed. Browser checks passed inbox empty state, simulated incoming alerts, read clearing, send, profile initiation, separate histories/drafts, failure/retry and mobile back/reopen. No horizontal overflow at 320, 390, 1024 and 1440 pixels. Desktop and mobile screenshots reviewed. Authentication was mocked for these focused messaging browser checks; they do not verify a real messaging backend.
