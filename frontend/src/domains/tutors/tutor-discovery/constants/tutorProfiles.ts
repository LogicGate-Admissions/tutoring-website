/**
 * File purpose: Stable tutor-discovery filter configuration.
 *
 * Tutor profiles themselves now come from Firestore via tutorProfileService.
 * These constants remain local because they are product UI settings, not user
 * data created by tutors.
 */

import type { TutorSortOption } from '@/domains/tutors/tutor-discovery/types/tutor';

export const TUTOR_SORT_OPTIONS: TutorSortOption[] = [
  'Best match',
  'Highest rated',
  'Lowest price',
  'Highest price',
];

export const UNIVERSITY_FILTER_OPTIONS = [
  'Imperial College London',
  'University of Cambridge',
  'University of Oxford',
  'University College London',
  'King’s College London',
  'London School of Economics',
  'University of Warwick',
  'University of Manchester',
  'University of Bristol',
  'University of Edinburgh',
];

/** Conservative product-wide price bounds used before tutor data is loaded. */
export const MIN_TUTOR_PRICE_PER_HOUR = 0;
export const MAX_TUTOR_PRICE_PER_HOUR = 100;
