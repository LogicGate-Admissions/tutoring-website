# Source structure

The source code is organised so different people can work in parallel without editing the same files unnecessarily.

The main rule is: **routes are thin, domains own product behaviour, shared owns reusable building blocks.**

## `app/`

Next.js routes only. Files in here should stay small and should normally only render a domain component.

Example: `app/student/tutors/page.tsx` renders `TutorDiscoveryPage`.

Keep business logic out of `app/` because route files are harder to reuse and test.

## `domains/`

Product areas. Each domain owns its own components, types, services, constants, and utility functions.

- `accounts/` temporary mock users and account types until real auth exists.
- `landing/` public homepage.
- `students/learning-profile/` onboarding/profile setup for student matching.
- `tutors/tutor-discovery/` tutor browsing, filters, profile modal, and matching logic.
- `sessions/trial-sessions/` trial request data model, Firebase service, and tutor-side request management.

### Domain folder rule

Use this layout inside a domain when it grows:

```txt
components/   React UI pieces
constants/    stable option lists and seed data
services/     localStorage, Firebase, or external data access
types/        TypeScript data shapes
utils/        pure logic that is easy to unit test
```

## `shared/`

Reusable building blocks that do not belong to one domain.

- `components/` generic UI primitives such as Button, Card, Badge, PageHeader, SearchableMultiSelect.
- `constants/` app-wide constants such as routes and Firestore collection names.
- `lib/` external library setup such as Firebase.
- `utils/` generic utilities.

## Commenting style

Comments should explain **why** the code exists and what rule it protects.

Good comments:

- explain a product rule, such as “GCSE Maths and A-level Maths are different choices”.
- explain an edge case, such as “deleting a merged preset/custom block should not reveal the preset underneath”.
- explain separation of responsibility between files.

Avoid comments that only repeat the code, such as “set value to true”.

## Testing rule

Put tests beside the logic they verify:

```txt
utils/filterTutors.ts
utils/filterTutors.test.ts
services/learningProfileStorage.ts
services/learningProfileStorage.test.ts
components/SearchableMultiSelect.tsx
components/SearchableMultiSelect.test.tsx
```

Start with pure `utils/` tests because they do not need React rendering or Firebase.

## Working rule

If a file is only used by one product area, keep it inside that domain. Move it to `shared/` only when two or more domains need it.

This keeps parallel work safer:

- A person working on onboarding should usually stay in `students/learning-profile/`.
- A person working on tutor matching should usually stay in `tutors/tutor-discovery/`.
- A person working on trial requests should usually stay in `sessions/trial-sessions/`.
- A person changing reusable UI should work in `shared/components/` and expect wider impact.

## Current hard-coded data and how we will remove it

At the moment, several files are intentionally static because the project does not
have login and database writes connected yet:

- `domains/accounts/mockUsers.ts` contains temporary student/tutor identities.
- `domains/tutors/tutor-discovery/constants/tutorProfiles.ts` contains temporary tutor profiles.
- `domains/students/learning-profile/constants/learningProfileOptions.ts` contains stable option lists such as subjects, learning styles, universities, and availability presets.

Do not replace every constant with Firebase at once. Use a staged approach:

1. Keep stable product vocabulary in constants.
   Subjects, qualification labels, learning-style labels, and preset labels are
   product configuration. These can remain local constants until the team needs
   an admin panel to edit them.

2. Move user-owned data behind services first.
   Student learning profiles, tutor profiles, and trial-session requests should
   be loaded through service functions. Components should not know whether data
   came from localStorage, mock arrays, or Firestore.

3. Add repository/service interfaces before Firebase.
   For example, `tutorProfileService.getTutorProfiles()` can return the same
   data as `TUTOR_PROFILES` today, then later read from Firestore without
   changing the UI components.

4. Once login is added, connect services to the authenticated user.
   Student pages should load the current student profile by `auth.currentUser.uid`.
   Tutor pages should load tutor-owned sessions and tutor-owned profile data by
   the same authenticated user id.

This keeps the code testable and stops Firebase details from leaking into every
component.

## Learning-profile component folders

The learning-profile domain is split by onboarding area:

- `components/subjects/` contains subject and qualification selection UI.
- `components/preferences/` contains learning-style and university preference UI.
- `components/availability/` contains availability presets, timetable, and manual time UI.

The page-level components (`StudentSubjectsStep`, `StudentPreferencesStep`, and
`StudentAvailabilityStep`) should coordinate state and saving. Smaller folder
components should render one clear part of the page.
