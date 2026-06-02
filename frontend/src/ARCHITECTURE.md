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
