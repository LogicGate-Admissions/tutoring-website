/**
 * File purpose: Central auth/account types shared by student, tutor, and route guards.
 *
 * Firebase Auth gives us identity: uid, email, displayName.
 * Firestore stores product metadata: role, onboarding status, createdAt.
 * These app types combine the pieces the UI actually needs.
 */

/** The two account roles currently supported by the product. */
export type AuthRole = 'student' | 'tutor';

/** The form mode decides whether email/password should sign in or create. */
export type AuthMode = 'login' | 'signup';

/** Minimal signed-in user shape used across the frontend. */
export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: AuthRole;
  hasCompletedOnboarding: boolean;
  photoUrl?: string;
};

/** Email/password form values collected by the shared auth page. */
export type EmailPasswordAuthValues = {
  name: string;
  email: string;
  password: string;
};
