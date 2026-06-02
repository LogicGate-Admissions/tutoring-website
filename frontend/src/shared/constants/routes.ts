/**
 * File purpose: Shared constant used across domains to avoid duplicated string literals.
 */

/**
 * Central route names for the application.
 *
 * Use these constants instead of hard-coding route strings in components.
 * This makes route changes safer because the path only needs changing here.
 */
export const ROUTES = {
  home: '/',

  studentDashboard: '/student/dashboard',
  studentOnboardingSubjects: '/student/onboarding/subjects',
  studentOnboardingPreferences: '/student/onboarding/preferences',
  studentOnboardingAvailability: '/student/onboarding/availability',
  studentTutors: '/student/tutors',

  tutorDashboard: '/tutor/dashboard',
  tutorTrialSessions: '/tutor/trial-sessions',
} as const;
