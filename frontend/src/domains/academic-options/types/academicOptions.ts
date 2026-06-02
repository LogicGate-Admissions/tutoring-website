/**
 * File purpose: Shared academic option types.
 *
 * These types describe the master subject options used by:
 * - student onboarding
 * - tutor onboarding
 * - tutor discovery filters
 *
 * The option data currently lives in code, while Firestore stores what each
 * user selected from these options.
 */

import type { QualificationCategory } from '@/domains/students/learning-profile/types/learningProfile';

/**
 * One group of subjects under a qualification.
 *
 * Example:
 * {
 *   id: "a-level",
 *   category: "A-level",
 *   subjects: ["Maths", "Physics"]
 * }
 */
export type AcademicSubjectGroup = {
  id: string;
  category: QualificationCategory;
  subjects: string[];
};

/**
 * Fast lookup shape used by subject picker components.
 *
 * Example:
 * {
 *   "GCSE": ["Maths", "Physics"],
 *   "A-level": ["Maths", "Further Maths"]
 * }
 */
export type SubjectOptionsByCategory = Partial<
  Record<QualificationCategory, string[]>
>;