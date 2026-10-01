# Bootcamp Connect - Product Requirements Document

Date: 1 October 2026  
Status: Draft for implementation  
Source: `1-october-weekly-goals.pdf`, TechNative Digital

## 1. Product overview

Bootcamp Connect helps software development and business development learners find people with complementary skills, shared interests, and compatible goals. Connections may lead to project collaborations, co-founder partnerships, peer support, or friendships.

The initial product is a web application for the bootcamp community. Its core journey is: create an account, build a profile, discover a relevant person, understand why they might be a good fit, and start a private conversation.

## 2. Problem and objectives

Learners study alongside people whose skills could complement their own, but have no structured way to discover what those people can offer or what they are looking for.

The product must:

- Make learners and their goals discoverable within the community.
- Help users find relevant people using course, skills, interests, and connection goals.
- Explain potential fit using actual profile information.
- Support private conversations between learners.
- Give administrators tools to maintain users and the vocabulary used in profiles and discovery.

## 3. Users

| User | Needs |
| --- | --- |
| Software development learner | Find business expertise, project partners, peers, and people interested in their technical skills. |
| Business development learner | Find technical expertise, collaborators, and people who can help develop an idea. |
| Administrator | Manage users, courses, categories, skills, and interests. |

A learner may discover people on either course. Cross-course collaboration is encouraged, but same-course connections remain available.

## 4. Scope and assumptions

The brief's five essential features are required for the MVP. Suggested additions and stretch goals are deferred unless explicitly selected later.

Working assumptions, to be confirmed before public release:

- Profiles and discovery are available only to authenticated community members.
- Connection goals initially include collaboration, co-founder partnership, peer support, and friendship. These are proposed interpretations of the brief.
- Each account selects one active course; changing course is supported.
- Direct messaging is available without a connection request in the MVP, because mutual requests are an optional addition in the brief.
- Discovery uses filters and simple explanations of fit. A ranked matching algorithm is optional, not required for MVP completion.
- Email and password are the proposed sign-in method. The identity provider and technical stack remain undecided.
- The initial delivery is a bootcamp demonstration. Requirements for a public service require a separate release review.

## 5. MVP requirements and acceptance criteria

### FR-01: Registration, login, and account management

Users can register, select their course, sign in, sign out, and manage their account details.

Acceptance criteria:

- Registration requires a valid email address, password, display name, and active course.
- Duplicate email addresses cannot create separate accounts.
- Invalid or missing inputs produce clear, field-specific feedback.
- Successful registration creates a learner account and opens profile setup.
- Valid credentials allow sign-in; invalid credentials produce a generic failure message.
- Signing out ends the session and prevents access to protected pages.
- Users can update their display name, course, and password using an authenticated flow; password changes require reauthentication.
- Suspended accounts cannot sign in or access protected content.
- A learner cannot assign themselves administrator permissions.

### FR-02: User profiles

Users can create, view, and edit a profile containing a photo, bio, skills, interests, and what they are looking for.

Acceptance criteria:

- Profiles show display name, course, photo or placeholder, bio, skills, interests, and connection goals.
- Users can select skills and interests from administrator-managed lists.
- Users can save and revisit their own profile, with edits retained after signing out and back in.
- Users cannot edit another user's profile.
- A missing photo uses a placeholder and does not prevent profile creation.
- Photo uploads reject unsupported formats and files above the configured size limit.
- Email addresses and other private account fields are excluded from public-facing profile responses.

### FR-03: Search and explainable fit

Users can discover people through filters and see evidence of why a person may be relevant.

Acceptance criteria:

- Discovery supports course, skill, interest, and connection-goal filters.
- Different filter groups combine with AND; multiple selections within a group combine with OR.
- Users can clear filters and recover the full eligible profile list.
- Results show a concise profile summary and open the full profile.
- The current user and suspended accounts are excluded from results.
- Each result includes a factual fit explanation when relevant evidence exists, such as a shared interest, shared goal, or different course with the same collaboration goal.
- Explanations reference saved profile data and do not invent expertise or compatibility.
- When no fit signal exists, the interface says that no shared criteria were found, without implying a scored match.
- Empty results show a useful message and a way to adjust filters.

### FR-04: Private messaging

Users can start and continue one-to-one text conversations from a profile or their inbox.

Acceptance criteria:

- A user can start a conversation with another active user and send a non-empty text message.
- Starting a conversation with the same person reuses the existing conversation.
- Users cannot start a conversation with themselves.
- Only the two participants can list or read the conversation and send messages into it; this is enforced on the server.
- Messages show sender and timestamp and appear in chronological order.
- Sent messages remain available after a page reload or a new session.
- The inbox lists conversations and their latest message preview.
- Failed sends produce clear feedback and preserve the draft for retry.
- A suspended account cannot send messages or be contacted.
- Manual refresh is sufficient for MVP delivery; live updates are a stretch goal.

### FR-05: Administration

Administrators have protected screens for managing categories, skills, interests, courses, and users.

Acceptance criteria:

- Only administrators can access administration pages and their underlying operations.
- Administrators can create, rename, list, and deactivate categories, skills, interests, and courses.
- Skills and interests can be associated with a category; the precise taxonomy is configurable.
- Duplicate names within the same managed list are rejected after whitespace and case normalization.
- Deactivated values cannot be selected for new assignments; existing profile references remain readable until changed.
- Administrators can list users, inspect profile and account status, correct course assignments, and suspend or reactivate accounts.
- Suspension revokes access and removes the user from discovery.
- User management does not grant administrators routine access to private messages.
- Referenced records are deactivated instead of deleted to preserve existing relationships.

## 6. Main user journeys and screens

1. **Join:** registration -> course selection -> profile setup -> discovery.
2. **Find someone:** discovery -> apply filters -> review fit explanation -> full profile.
3. **Connect:** full profile -> start conversation -> send message -> revisit through inbox.
4. **Maintain a profile:** own profile -> edit details -> save -> view updated profile.
5. **Administer:** admin dashboard -> manage vocabulary or users -> save change -> confirm updated state.

Required screens: registration, login, account settings, own-profile editor, profile detail, discovery, inbox, conversation, and administration lists/editors.

All forms and lists must include appropriate loading, success, validation-error, failure, and empty states. Users receive clear confirmation when changes are saved.

## 7. Data requirements

| Entity | Key information and relationships |
| --- | --- |
| User | ID, email, authentication identity, role, status, course ID, creation and update timestamps. |
| Profile | User ID, display name, photo reference, bio, connection goals. |
| Course | ID, name, active status. |
| Category | ID, name, active status. |
| Skill / Interest | ID, name, optional category ID, active status. |
| ProfileSkill / ProfileInterest | Associations between profiles and selected skills or interests. |
| Conversation | ID, two distinct participant IDs, creation timestamp; unique per participant pair. |
| Message | ID, conversation ID, sender ID, text, creation timestamp. |

Passwords must be handled by a secure authentication mechanism and must never be stored as plaintext. Account details and profile data must be separated so discovery cannot expose private fields accidentally.

## 8. Non-functional requirements

- Enforce authentication, ownership, administrator roles, and conversation membership on the server for every protected operation.
- Validate and normalize inputs on the server; render user text safely and validate uploaded image files.
- Protect sessions, use HTTPS in hosted environments, and keep credentials and secrets out of source control and logs.
- Apply reasonable rate limits to authentication and message sending.
- Support keyboard navigation, labelled form controls, visible focus, readable contrast, and accessible error feedback.
- Maintain data integrity through unique constraints, valid references, and persistent storage.
- Log operational failures without recording passwords or private message bodies.
- Establish input length limits, upload limits, and pagination before implementation; the exact limits are implementation decisions.
- Proposed performance target: discovery and conversation views load within two seconds under an agreed bootcamp-sized test dataset and environment. Dataset size and measurement method must be confirmed before treating this as a release gate.

A fully mobile-friendly design is a stretch goal in the source brief. Basic readable layouts and usable controls should still be considered during implementation.

## 9. Optional features and stretch goals

### Suggested additional features from the brief

- Connection requests, with messaging available only after mutual agreement.
- Favourites or a profile shortlist.
- Notifications for matches, messages, and requests.
- Blocking, reporting, and an administrator moderation queue.
- Profile visibility and contact privacy settings.
- Events and meetups, including posting and joining.
- A project ideas board with expressions of interest.
- Administrator statistics for sign-ups, matches, and active conversations.
- Account deletion and data export.

### Stretch goals from the brief

- AI-assisted matching or icebreaker suggestions.
- Real-time chat.
- Mobile-friendly design.

These features are outside MVP acceptance. If connection requests are selected, messaging eligibility and the data model must be revised before implementation. Public release also requires explicit decisions on moderation, privacy, retention, account deletion, and data export.

## 10. Delivery plan

The brief sets an end-of-week learning milestone, not a deadline to finish the entire platform:

1. Have the development environment working: editor, GitHub, and a coding assistant or model able to respond and generate code.
2. Write the specification and architecture.
3. Start, implement, and test a first feature, with the Thursday session identified in the brief.

This PRD supplies the product specification. A separate architecture document and a working feature are still required to satisfy that milestone.

Recommended first feature: registration and login with course selection, session handling, sign-out, and a protected landing page. This creates the identity foundation for profiles, messages, and administration.

Recommended subsequent order:

1. Profile creation and editing, with seeded courses, skills, and interests.
2. Discovery filters and factual fit explanations.
3. Persistent private messaging.
4. Administration screens and account suspension.
5. End-to-end verification and demonstration using both learner roles and an administrator.

## 11. Validation and definition of done

The MVP is complete when all five essential features meet their acceptance criteria, data persists, and the complete core journey can be demonstrated.

Verification must cover:

- Registration, login, sign-out, account editing, and invalid-input cases.
- Profile ownership and successful save/reload.
- Combined filters, empty results, and evidence-based fit explanations.
- Two learners exchanging persistent messages.
- A third learner being denied access to their conversation, including direct requests.
- A learner being denied administration operations.
- Administrator vocabulary changes and user suspension, including access revocation.
- Upload validation, protected private fields, and failure feedback.

Use repeatable automated checks for core permissions and persistence, plus manual walkthroughs for usability and accessibility.

## 12. Success measures

Proposed measures for evaluating the pilot; numeric targets should be agreed once cohort size is known:

- Profile completion: share of registered users with a bio, at least one skill, one interest, and a connection goal.
- Discovery engagement: share of active users who open another person's profile.
- Conversation initiation: share of active users who send a first message to another user.
- Reciprocal conversations: conversations in which both participants send at least one message.
- Cross-course connections: reciprocal conversations between users from different courses.
- User feedback: whether users found someone relevant and understood the fit explanation.

Analytics implementation and an administrator statistics dashboard are not required for MVP delivery.

## 13. Open decisions and risks

| Decision or risk | Required resolution |
| --- | --- |
| Community access | Decide between open registration, invitations, or an approved-domain restriction. |
| Identity and architecture | Choose the stack, authentication provider, hosting, database, and photo storage; document them separately. |
| Course and vocabulary setup | Confirm initial course names, category structure, skills, interests, and connection goals. |
| Authentication recovery | Decide whether email verification and password recovery are needed for the pilot. |
| Unwanted contact | Decide whether mutual requests, blocking, and reporting should be promoted into scope before real community use. |
| Privacy and retention | Define who can view profiles, data retention, deletion/export workflows, and privacy information before public release. |
| Thin or empty profiles | Use onboarding guidance and demonstration accounts to make discovery useful during testing. |
| Matching expectations | Present fit as a transparent suggestion based on profile data; avoid unsupported compatibility claims. |
| Scope growth | Deliver the five essential areas before taking on optional features or AI. |

## 14. Source traceability

| Brief requirement | PRD coverage |
| --- | --- |
| Registration and login, course choice, account management | FR-01 |
| Photo, bio, skills, interests, and what users seek | FR-02 |
| Search and/or matching, with reasons for fit | FR-03 |
| Private conversations | FR-04 |
| Manage categories, skills, interests, courses, and users | FR-05 |
| Suggested additions and stretch goals | Section 9 |
| Environment, specification, architecture, first tested feature | Section 10 |
