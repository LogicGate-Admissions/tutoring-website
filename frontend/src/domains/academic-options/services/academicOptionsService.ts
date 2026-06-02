/**
 * File purpose: Shared academic option data used by both students and tutors.
 *
 * We keep these options in code because they are stable product configuration,
 * not user-created data.
 *
 * Firestore should store what users select from these lists, not the master
 * option lists themselves.
 *
 * This means:
 * - student onboarding reads these options from code
 * - tutor onboarding reads these options from code
 * - tutor filters read these options from code
 * - Firestore stores the selected subjects/qualifications per user
 */

import type { QualificationCategory } from '@/domains/students/learning-profile/types/learningProfile';
import type {
  AcademicSubjectGroup,
  SubjectOptionsByCategory,
} from '@/domains/academic-options/types/academicOptions';

/**
 * Qualification categories shown in onboarding and tutor filters.
 *
 * These values must match the QualificationCategory union type exactly.
 */
export const QUALIFICATION_CATEGORIES: QualificationCategory[] = [
  'GCSE',
  'A-level',
  'University admissions',
  'IB',
  'IGCSE',
  'IAL',
  'Scottish Highers',
];

/**
 * Master subject list grouped by qualification.
 *
 * This is the single source of truth for subject options.
 * Do not create separate student/tutor subject arrays elsewhere.
 */
export const SUBJECT_OPTIONS_BY_CATEGORY: SubjectOptionsByCategory = {
  GCSE: [
    'Maths',
    'English Language',
    'English Literature',
    'Biology',
    'Chemistry',
    'Physics',
    'Computer Science',
    'History',
    'Geography',
    'Economics',
    'Business',
    'Psychology',
  ],

  'A-level': [
    'Maths',
    'Further Maths',
    'Physics',
    'Chemistry',
    'Biology',
    'Computer Science',
    'Economics',
    'Business',
    'Psychology',
    'History',
    'Geography',
    'English Literature',
    'Politics',
  ],

  'University admissions': [
    'TMUA',
    'MAT',
    'STEP',
    'UCAT',
    'LNAT',
    'ESAT',
    'PAT',
  ],

  IB: [
    'Mathematics AA',
    'Mathematics AI',
    'Physics',
    'Chemistry',
    'Biology',
    'Computer Science',
    'Economics',
    'Business Management',
    'English',
    'History',
    'Geography',
    'Psychology',
  ],

  IGCSE: [
    'Maths',
    'English Language',
    'English Literature',
    'Biology',
    'Chemistry',
    'Physics',
    'Computer Science',
    'History',
    'Geography',
    'Economics',
    'Business',
  ],

  IAL: [
    'Maths',
    'Further Maths',
    'Physics',
    'Chemistry',
    'Biology',
    'Computer Science',
    'Economics',
    'Business',
  ],

  'Scottish Highers': [
    'Mathematics',
    'English',
    'Physics',
    'Chemistry',
    'Biology',
    'Computing Science',
    'History',
    'Geography',
    'Business Management',
  ],
};

/**
 * Build the same group shape that the UI already expects.
 *
 * Keeping this function means the student/tutor components do not need a big
 * rewrite. They can still call getAcademicSubjectGroups(), but now the data
 * comes from code instead of Firestore.
 */
export async function getAcademicSubjectGroups(): Promise<AcademicSubjectGroup[]> {
  return QUALIFICATION_CATEGORIES.map((category) => ({
    id: category.toLowerCase().replaceAll(' ', '-'),
    category,
    subjects: SUBJECT_OPTIONS_BY_CATEGORY[category] ?? [],
  }));
}

/**
 * Return a qualification -> subjects lookup.
 *
 * This is async only to avoid changing all existing call sites.
 * The data itself is local and returns immediately.
 */
export async function getSubjectOptionsByCategory(): Promise<SubjectOptionsByCategory> {
  return SUBJECT_OPTIONS_BY_CATEGORY;
}

/**
 * Safely read the subject list for one qualification.
 *
 * Components should use this helper instead of indexing the object directly,
 * because it handles the empty category state cleanly.
 */
export function getSubjectsForQualification(
  optionsByCategory: SubjectOptionsByCategory,
  category: QualificationCategory | ''
) {
  if (!category) return [];

  return optionsByCategory[category] ?? [];
}