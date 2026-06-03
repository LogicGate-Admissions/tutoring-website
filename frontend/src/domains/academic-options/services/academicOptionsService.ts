/**
 * File purpose: Shared academic option data used by students and tutors.
 *
 * These are stable product options, so they live in code rather than Firestore.
 * Firestore should store what users select from these lists, not the master
 * option lists themselves.
 */

import type { QualificationCategory } from '@/domains/students/learning-profile/types/learningProfile';
import type {
  AcademicSubjectGroup,
  SubjectOptionsByCategory,
} from '@/domains/academic-options/types/academicOptions';

/** Qualification categories shown in onboarding and tutor filters. */
export const QUALIFICATION_CATEGORIES: QualificationCategory[] = [
  'A-level',
  'GCSE',
  'University admissions',
  'IB',
  'IGCSE',
  'IAL',
  'Scottish Highers',
];

/**
 * Master subject list grouped by qualification.
 *
 * This is the single source of truth for subject options across student
 * onboarding, tutor onboarding, and tutor discovery filters.
 */
export const SUBJECT_OPTIONS_BY_CATEGORY: SubjectOptionsByCategory = {
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
  'University admissions': ['TMUA', 'MAT', 'STEP', 'UCAT', 'LNAT', 'ESAT', 'PAT'],
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

/** Build the group shape already used by the onboarding UI. */
export async function getAcademicSubjectGroups(): Promise<AcademicSubjectGroup[]> {
  return QUALIFICATION_CATEGORIES.map((category) => ({
    id: category.toLowerCase().replaceAll(' ', '-'),
    category,
    subjects: SUBJECT_OPTIONS_BY_CATEGORY[category] ?? [],
  }));
}

/** Return a qualification -> subjects lookup. Async keeps existing call sites stable. */
export async function getSubjectOptionsByCategory(): Promise<SubjectOptionsByCategory> {
  return SUBJECT_OPTIONS_BY_CATEGORY;
}

/** Safely read subjects for one qualification. */
export function getSubjectsForQualification(
  optionsByCategory: SubjectOptionsByCategory,
  category: QualificationCategory | ''
) {
  if (!category) return [];

  return optionsByCategory[category] ?? [];
}
