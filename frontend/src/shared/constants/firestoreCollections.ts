/**
 * File purpose: One source of truth for Firestore collection names.
 *
 * Firestore collection names are plain strings. If we duplicate those strings
 * across the app, one typo can silently create a second collection. This file
 * prevents that by making every service import the same names.
 */

export const FIRESTORE_COLLECTIONS = {
  /** User account metadata keyed by Firebase Auth uid. */
  users: 'users',

  /** Student onboarding/learning profiles keyed by Firebase Auth uid. */
  studentProfiles: 'studentProfiles',

  /** Tutor public/searchable profiles keyed by Firebase Auth uid. */
  tutorProfiles: 'tutorProfiles',

  /** Trial requests between one student and one tutor. */
  trialSessionRequests: 'trialSessionRequests',

  /** Booking lifecycle documents for confirmed and pending sessions. */
  bookingRequests: 'bookingRequests',

  /** Firestore-persisted in-app notifications for booking status changes. */
  bookingNotifications: 'bookingNotifications',
} as const;
