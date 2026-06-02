/**
 * File purpose: Pure tutor-discovery helper logic for building filter options.
 *
 * Subject options are passed in from academicOptionsService.
 * This file stays pure so it can be unit tested without Firebase.
 */

import { getSubjectsForQualification } from '@/domains/academic-options/services/academicOptionsService';
import type { SubjectOptionsByCategory } from '@/domains/academic-options/types/academicOptions';
import type { QualificationCategory } from '@/domains/students/learning-profile/types/learningProfile';
import type { TutorSubjectFilter } from '@/domains/tutors/tutor-discovery/types/tutor';

/** Build level-specific subject filter options from selected qualification levels. */
export function getSubjectOptionsForLevels(
  levels: QualificationCategory[],
  optionsByCategory: SubjectOptionsByCategory
): TutorSubjectFilter[] {
  return levels.flatMap((level) =>
    getSubjectsForQualification(optionsByCategory, level).map((subject) => ({
      level,
      subject,
    }))
  );
}

/** Compare filters by both qualification and subject name. */
export function subjectFiltersMatch(
  first: TutorSubjectFilter,
  second: TutorSubjectFilter
) {
  return first.level === second.level && first.subject === second.subject;
}
