/**
 * File purpose: Tutor discovery data types.
 *
 * These types describe the public tutor profile shape consumed by cards,
 * profile modals, filters, and sorting. Firestore mapping belongs in the
 * tutorProfileService, not in React components.
 */

import type {
  QualificationCategory,
  TimeBlock,
} from '@/domains/students/learning-profile/types/learningProfile';

/** Per-qualification, per-subject pricing set during tutor onboarding. */
export type TutorSubjectRate = {
  qualification: QualificationCategory;
  subject: string;
  pricePerHour: number;
};

/** Tutor profile shown to students while browsing. */
export type Tutor = {
  id: string;
  name: string;
  headline: string;
  university: string;
  degree: string;
  subjects: string[];
  levels: string[];
  learningStyles: string[];

  /** Cheapest hourly rate across the tutor's selected subjects. */
  pricePerHour: number;

  /** Full rate list shown inside the tutor profile modal. */
  subjectRates?: TutorSubjectRate[];

  rating: number;
  reviews: number;
  numberOfStudents: number;
  availability: string;
  availabilityBlocks?: TimeBlock[];
  bio: string;
  hobbies: string[];
  personality: string[];
  tags: string[];
};

export type TutorSortOption =
  | 'Best match'
  | 'Highest rated'
  | 'Lowest price'
  | 'Highest price'
  | 'Most hours in common';

/** Level-specific subject filter, e.g. GCSE Maths vs A-level Maths. */
export type TutorSubjectFilter = {
  level: QualificationCategory;
  subject: string;
};

/** Filters students can apply while browsing tutors. */
export type TutorFilters = {
  subjects: TutorSubjectFilter[];
  levels: QualificationCategory[];
  learningStyles: string[];
  universities: string[];
  minPricePerHour: number;
  maxPricePerHour: number;
  sortBy: TutorSortOption;
};
