/**
 * File purpose: Shared academic option types loaded from Firestore.
 *
 * The master subject list is no longer owned by student or tutor UI code.
 * Both account types read the same Firestore-backed academic options so the
 * product cannot drift into two different hardcoded subject lists.
 */

import type { QualificationCategory } from '@/domains/students/learning-profile/types/learningProfile';

/** One Firestore document in the academicSubjects collection. */
export type AcademicSubjectGroup = {
  /** Firestore document id, for example "gcse" or "a-level". */
  id: string;

  /** Product-facing qualification label used in onboarding and filters. */
  category: QualificationCategory;

  /** Searchable subject names available under this qualification. */
  subjects: string[];
};

/** Fast lookup shape used by subject picker components. */
export type SubjectOptionsByCategory = Partial<
  Record<QualificationCategory, string[]>
>;
