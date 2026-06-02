import {
  MAX_TUTOR_PRICE_PER_HOUR,
  MIN_TUTOR_PRICE_PER_HOUR,
} from '@/domains/tutors/tutor-discovery/constants/tutorProfiles';
import type {
  QualificationSubjectSelection,
  StudentLearningProfile,
} from '@/domains/students/learning-profile/types/learningProfile';
import type { TutorFilters } from '@/domains/tutors/tutor-discovery/types/tutor';

export const DEFAULT_TUTOR_FILTERS: TutorFilters = {
  subjects: [],
  levels: [],
  learningStyles: [],
  universities: [],
  minPricePerHour: MIN_TUTOR_PRICE_PER_HOUR,
  maxPricePerHour: MAX_TUTOR_PRICE_PER_HOUR,
  sortBy: 'Best match',
};

function uniqueValues<T>(values: T[]) {
  return values.filter((value, index) => values.indexOf(value) === index);
}

/**
 * Converts the saved onboarding profile into editable tutor search filters.
 *
 * This is a one-way copy: the tutor page can start from onboarding choices
 * without mutating onboarding while the student experiments with filters.
 */
export function profileToTutorFilters(profile: StudentLearningProfile) {
  return {
    ...DEFAULT_TUTOR_FILTERS,
    subjects: profile.subjectSelections.flatMap((selection) =>
      selection.subjects.map((subject) => ({
        level: selection.category,
        subject,
      }))
    ),
    levels: uniqueValues(
      profile.subjectSelections.map((selection) => selection.category)
    ),
    learningStyles: profile.learningStyles,
    universities: profile.preferredUniversities,
  } satisfies TutorFilters;
}

/**
 * Converts tutor filters back into the onboarding fields they are allowed to
 * update. Tutor-search-only settings such as price and sort order are ignored.
 */
export function tutorFiltersToProfileSelections(filters: TutorFilters) {
  return {
    subjectSelections: filters.levels.map((level) => ({
      category: level,
      subjects: filters.subjects
        .filter((subjectFilter) => subjectFilter.level === level)
        .map((subjectFilter) => subjectFilter.subject),
    })) satisfies QualificationSubjectSelection[],
    learningStyles: filters.learningStyles,
    preferredUniversities: filters.universities,
  };
}
