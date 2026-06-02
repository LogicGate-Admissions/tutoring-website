# Frontend Architecture

This `src/` folder is organised so new team members can quickly see where code belongs.

## Top-level structure

```txt
src/
  app/       Next.js routes only
  domains/   product features and business logic
  shared/    reusable UI, constants, Firebase setup, utilities
```

## Routing rule

Files in `src/app` should stay small. A route should usually import one domain component and render it.

Example:

```tsx
import { AuthPage } from '@/domains/auth/components/AuthPage';

export default function StudentLoginPage() {
  return <AuthPage role="student" />;
}
```

## Firebase data boundaries

The app now uses real Firebase Authentication and Firestore boundaries:

```txt
domains/auth/services/authService.ts
  Firebase Auth sign-up, login, Google sign-in, sign-out, route-guard user subscription

domains/students/learning-profile/services/learningProfileStorage.ts
  Firestore student onboarding profile reads/writes

domains/tutors/tutor-discovery/services/tutorProfileService.ts
  Firestore tutor profile reads/writes

domains/sessions/trial-sessions/services/trialSessionService.ts
  Firestore trial session requests
```

React components should not call Firebase directly. They should call the correct service. This keeps UI code readable and prevents duplicated database logic.

## Auth flow

```txt
/student/login
  email/password login
  email/password sign-up
  Google sign-in
  student accounts are stored in users/{uid} with role = "student"

/tutor/login
  email/password login
  email/password sign-up
  Google sign-in
  tutor accounts are stored in users/{uid} with role = "tutor"
```

After sign-up, users are sent to their role-specific onboarding. After onboarding is completed, future logins can route to the role dashboard.

## Firestore collections

Collection names live in:

```txt
shared/constants/firestoreCollections.ts
```

Current collections:

```txt
users
studentProfiles
tutorProfiles
trialSessionRequests
```

## Hardcoded data policy

Do not hardcode user-owned data such as:

```txt
student profiles
tutor profiles
trial session requests
authenticated users
```

Those now belong in Firebase.

It is still acceptable to keep stable product taxonomies in constants, such as:

```txt
qualification labels
subject option lists
learning style option lists
availability preset definitions
sort options
```

Those are product configuration, not user-created records. If the team later wants admins to edit those lists, they can also move into Firestore behind a service boundary.

## Testing rule

Put tests close to the logic they test:

```txt
filterTutors.ts
filterTutors.test.ts

learningProfileStorage.ts
learningProfileStorage.test.ts

SearchableMultiSelect.tsx
SearchableMultiSelect.test.tsx
```

Prefer testing pure utilities first because they are easier and more reliable than full page tests.

## Firebase-backed academic subjects

The master subject list is no longer stored in React constants. Both student
onboarding and tutor onboarding read subjects from Firestore through:

```txt
src/domains/academic-options/services/academicOptionsService.ts
```

Create one document per qualification inside Firestore:

```txt
academicSubjects/gcse
  category: "GCSE"
  subjects: ["Maths", "English", "Physics", "Chemistry", "Biology"]

academicSubjects/a-level
  category: "A-level"
  subjects: ["Maths", "Further Maths", "Physics", "Chemistry", "Biology"]

academicSubjects/university-admissions
  category: "University admissions"
  subjects: ["TMUA", "MAT", "STEP", "UCAT", "LNAT"]
```

The collection is intentionally shared. If the team adds a subject in Firebase,
it appears in both student onboarding and tutor onboarding without changing
code.

## Tutor onboarding tabs

Tutor onboarding is now a single route with tabs:

```txt
Subjects | Style | Availability | Profile
```

The Subjects tab stores per-subject rates:

```txt
subjectRates: [
  { qualification: "GCSE", subject: "Maths", pricePerHour: 25 },
  { qualification: "A-level", subject: "Maths", pricePerHour: 35 }
]
```

The public tutor card uses the cheapest rate as `pricePerHour`, while the tutor
profile modal shows the full rate table.
