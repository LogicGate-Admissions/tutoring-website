/**
 * File purpose: Shared route constants used across the app.
 *
 * Route strings should live here instead of being duplicated inside components.
 * That makes future URL changes safer because each path has one source of truth.
 */

/**
 * Central route map for public, student, and tutor areas.
 */
export const ROUTES = {
  /** Public landing page. */
  home: '/',

  /** Student authentication and product area. */
  studentLogin: '/student/login',
  studentDashboard: '/student/dashboard',
  studentOnboardingSubjects: '/student/onboarding/subjects',
  studentOnboardingPreferences: '/student/onboarding/preferences',
  studentOnboardingAvailability: '/student/onboarding/availability',
  studentTutors: '/student/tutors',

  /** Tutor authentication and product area. */
  tutorLogin: '/tutor/login',
  tutorOnboarding: '/tutor/onboarding',
  tutorDashboard: '/tutor/dashboard',
  tutorTrialSessions: '/tutor/trial-sessions',
} as const;
