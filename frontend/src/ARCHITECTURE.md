# Source structure

The source code is organised so different people can work in parallel without editing the same files unnecessarily.

## `app/`

Next.js routes only. Files in here should stay small and should normally only render a domain component.

Example: `app/student/tutors/page.tsx` renders `TutorDiscoveryPage`.

## `domains/`

Product areas. Each domain owns its own components, types, services, constants, and utility functions.

- `accounts/` temporary mock users and account types until real auth exists.
- `landing/` public homepage.
- `students/learning-profile/` onboarding/profile setup for student matching.
- `tutors/tutor-discovery/` tutor browsing, filters, profile modal, and matching logic.
- `sessions/trial-sessions/` trial request data model, Firebase service, and tutor-side request management.

## `shared/`

Reusable building blocks that do not belong to one domain.

- `components/` generic UI primitives such as Button, Card, Badge, PageHeader, SearchableMultiSelect.
- `constants/` app-wide constants such as routes and Firestore collection names.
- `lib/` external library setup such as Firebase.
- `utils/` generic utilities.

## Working rule

If a file is only used by one product area, keep it inside that domain. Move it to `shared/` only when two or more domains need it.

This keeps parallel work safer:

- A person working on onboarding should usually stay in `students/learning-profile/`.
- A person working on tutor matching should usually stay in `tutors/tutor-discovery/`.
- A person working on trial requests should usually stay in `sessions/trial-sessions/`.
- A person changing reusable UI should work in `shared/components/` and expect wider impact.
