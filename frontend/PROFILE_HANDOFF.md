# F2 - Profiles and profile photos

Completed by Malak with sample data: 5 October 2026.

Branch: `feature/frontend-profile`, based on `feature/frontend-auth` (implementation commit `3fd1d61`). Authentication changes must be included before this feature can run. This feature branch is published for team review; it has not been merged into main.

## Delivered

- Signed-in profile page and editor with display name, bio, skills, interests and connection goals.
- Read-only course display; course changes belong to F6 account settings.
- Native file picker before upload; matching bordered controls with Edit photo and Remove photo/bin icon after selection.
- JPG, PNG and WebP validation, a 5 MB limit, image decoding checks and an enlarged photo dialog with Close/Escape support.
- Save and Cancel: drafts do not change the saved profile until saving; cancelling restores previous text, choices and photo.
- Saved photo and name update the account header. Removing and saving the photo restores the avatar placeholder.
- Empty-profile guidance, loading state, validation, save feedback and error handling.
- Responsive desktop, laptop and mobile layouts.

## Demo limitations

Profiles and photos are held in memory, separated by demo user ID. They survive navigation and logout/login within the same page session, but reset on full page reload. Photos are temporary data URLs, not uploaded files. Use fictional details and non-sensitive test photos.

Profile editing uses an in-memory demo adapter even with real authentication; a visible banner explains that distinction. A real profile adapter is still needed. Display-name changes update the demo interface/profile; Marianna must define how account and profile names stay synchronized in the real database. Client-side gating is not server authorization.

## Marianna - proposed backend contract for review

These operations are proposals, not existing endpoints. Keep them behind a replacement for `profileService.js`.

| Operation | Proposed endpoint | Result |
| --- | --- | --- |
| Load current profile | `GET /api/profiles/me` | Current user's profile only, authenticated by the session. |
| Load choices | `GET /api/profile-options` | Active skills, interests and goals with stable IDs and labels. |
| Save profile | `PATCH /api/profiles/me` | Validated saved profile; derive ownership from the session. |
| Upload photo | `POST /api/profiles/me/photo` | Multipart file upload returning a photo reference/URL. |
| Remove photo | `DELETE /api/profiles/me/photo` | Remove the stored photo/reference, preserving the profile. |

Proposed profile fields: `displayName`, `courseId`, `bio`, `skills`, `interests`, `goals`, `photoUrl`. The demo uses label arrays and a `photo` data URL; integration should map labels to stable IDs and replace `photo` with the backend's photo reference. Do not send demo data URLs as production upload requests.

Coordinate the upload/delete operations with profile Save so Cancel never removes a saved image or leaves an unintended photo change. Agree staged uploads or an atomic save operation before integrating.

Validate ownership, field lengths, allowed choices, file content and size on the server. Proposed limits: 80-character name, 500-character bio, 5 MB photo. Photo remains optional with a placeholder, following the PRD. Existing deactivated choices must remain readable. Keep email, password credentials and private account fields out of community-facing profile responses.

Return actionable errors without exposing internal details. Confirm name synchronization and photo access rules. Do not allow changing course through this profile operation; use F6 account settings.

## Qingling - verification handoff

- Check new/empty profiles and profiles with several selections.
- Save details, navigate away and back, then logout/login without reloading; confirm the same user's saved profile returns.
- Create a second demo account and verify it has a separate profile.
- Change fields/photo and Cancel; confirm previous saved values remain.
- Select JPG/PNG/WebP, unsupported formats, oversized files and corrupt image files.
- Enlarge a photo, close with the button and Escape, and check keyboard focus returns.
- Replace/remove/save photos; verify the header avatar updates.
- Check 320px, 390px, 1024px and 1440px layouts, especially the editor and photo controls.
- After integration, verify real persistence, API failures, upload/delete consistency and direct unauthorized requests against the server.

## Checks completed during implementation

Production build passed. Five automated tests passed across authentication and profile services. Profile browser checks passed for validation, save, upload format rejection, enlargement/Escape, cancellation, photo removal, header avatar updates, signed-out access and four responsive widths. Desktop profile and mobile editor screenshots were reviewed. Backend integration and Qingling's independent verification remain pending.
