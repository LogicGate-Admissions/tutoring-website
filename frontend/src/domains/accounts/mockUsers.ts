/**
 * File purpose: Temporary account model/mock data used until Firebase Authentication is connected.
 */

import type { AppUser } from '@/domains/accounts/types';

/**
 * Temporary users used until real authentication is added.
 *
 * These are intentionally isolated in the accounts domain so adding login later
 * means replacing this file/hook, not rewriting tutor discovery or sessions.
 */
export const MOCK_STUDENT: AppUser = {
  id: 'student-alex',
  name: 'Alex Student',
  role: 'student',
};

/**
 * This id matches one of the mock tutor profiles.
 */
export const MOCK_TUTOR: AppUser = {
  id: 'maya-patel',
  name: 'Maya Patel',
  role: 'tutor',
};
