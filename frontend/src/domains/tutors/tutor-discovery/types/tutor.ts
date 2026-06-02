/**
 * File purpose: Application source file. Comments explain what this file owns and what should stay elsewhere.
 */

import type {
  QualificationCategory,
  TimeBlock,
} from '@/domains/students/learning-profile/types/learningProfile';

/**
 * Tutor profile shown to students while browsing.
 */
export type Tutor = {
  id: string;
  name: string;
  headline: string;
  university: string;
  degree: string;
  subjects: string[];
  levels: string[];
  learningStyles: string[];
  pricePerHour: number;
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
  | 'Highest price';

/**
 * A subject filter is qualification-specific.
 *
 * This means GCSE Maths and A-level Maths are no longer treated as the same
 * selected filter, even though they share the same subject name.
 */
export type TutorSubjectFilter = {
  level: QualificationCategory;
  subject: string;
};

/**
 * Filters students can apply while browsing tutors.
 *
 * These are separate from onboarding.
 * Tutor filters can be edited freely without changing the student's saved
 * onboarding profile unless the user explicitly presses "Save to profile".
 */
export type TutorFilters = {
  subjects: TutorSubjectFilter[];
  levels: QualificationCategory[];
  learningStyles: string[];
  universities: string[];
  minPricePerHour: number;
  maxPricePerHour: number;
  sortBy: TutorSortOption;
};