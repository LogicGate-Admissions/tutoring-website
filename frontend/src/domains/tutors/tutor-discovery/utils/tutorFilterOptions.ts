import {
  SUBJECT_OPTIONS_BY_CATEGORY,
} from '@/domains/students/learning-profile/constants/learningProfileOptions';
import type { QualificationCategory } from '@/domains/students/learning-profile/types/learningProfile';
import type { TutorSubjectFilter } from '@/domains/tutors/tutor-discovery/types/tutor';

/**
 * Build subject options from the currently selected qualification levels.
 *
 * We keep the level on each option because GCSE Maths and A-level Maths should
 * be treated as different tutor-matching filters, even though the label text is
 * both "Maths".
 */
export function getSubjectOptionsForLevels(
  levels: QualificationCategory[]
): TutorSubjectFilter[] {
  return levels.flatMap((level) =>
    SUBJECT_OPTIONS_BY_CATEGORY[level].map((subject) => ({ level, subject }))
  );
}

export function subjectFiltersMatch(
  first: TutorSubjectFilter,
  second: TutorSubjectFilter
) {
  return first.level === second.level && first.subject === second.subject;
}
