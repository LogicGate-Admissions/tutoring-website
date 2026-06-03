/**
 * File purpose: Shared academic option types.
 *
 * These types describe the subject option data used by student onboarding,
 * tutor onboarding, and tutor discovery filters.
 */

import type { QualificationCategory } from '@/domains/students/learning-profile/types/learningProfile';

/** One qualification group and its available subjects. */
export type AcademicSubjectGroup = {
  id: string;
  category: QualificationCategory;
  subjects: string[];
};

/** Fast lookup shape used by subject picker components. */
export type SubjectOptionsByCategory = Partial<
  Record<QualificationCategory, string[]>
>;
