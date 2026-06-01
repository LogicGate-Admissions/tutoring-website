import type {
  Tutor,
  TutorFilters,
  TutorSubjectFilter,
} from '@/domains/tutors/tutor-discovery/types/tutor';

function normalise(value: string) {
  return value.trim().toLowerCase();
}

function includesNormalised(values: string[], selectedValue: string) {
  return values.map(normalise).includes(normalise(selectedValue));
}

function hasAnyStringMatch(tutorValues: string[], selectedValues: string[]) {
  if (selectedValues.length === 0) return true;

  return selectedValues.some((selectedValue) =>
    includesNormalised(tutorValues, selectedValue)
  );
}

function hasSelectedUniversity(tutor: Tutor, selectedUniversities: string[]) {
  if (selectedUniversities.length === 0) return true;

  return selectedUniversities.some(
    (university) => normalise(university) === normalise(tutor.university)
  );
}

/**
 * Checks whether a tutor matches at least one selected level-specific subject.
 *
 * Important:
 * Our current tutor data stores subjects and levels separately, not as pairs.
 * So this means:
 *
 * Tutor teaches the selected subject AND teaches the selected level.
 *
 * Later, if tutor profiles become more detailed, we can store pairs like:
 * [{ level: 'GCSE', subject: 'Maths' }]
 */
function hasSelectedSubjectMatch(
  tutor: Tutor,
  selectedSubjects: TutorSubjectFilter[]
) {
  if (selectedSubjects.length === 0) return true;

  return selectedSubjects.some((selectedSubject) => {
    return (
      includesNormalised(tutor.subjects, selectedSubject.subject) &&
      includesNormalised(tutor.levels, selectedSubject.level)
    );
  });
}

function scoreTutor(tutor: Tutor, filters: TutorFilters) {
  let score = 0;

  score += tutor.rating * 10;

  score += filters.subjects.filter((selectedSubject) => {
    return (
      includesNormalised(tutor.subjects, selectedSubject.subject) &&
      includesNormalised(tutor.levels, selectedSubject.level)
    );
  }).length * 20;

  score += filters.levels.filter((level) =>
    includesNormalised(tutor.levels, level)
  ).length * 10;

  score += filters.learningStyles.filter((style) =>
    includesNormalised(tutor.learningStyles, style)
  ).length * 10;

  return score;
}

/**
 * Applies all tutor filters in one pure function.
 *
 * Empty filter arrays mean "any".
 */
export function filterTutors(tutors: Tutor[], filters: TutorFilters) {
  const filteredTutors = tutors.filter((tutor) => {
    return (
      hasSelectedSubjectMatch(tutor, filters.subjects) &&
      hasAnyStringMatch(tutor.levels, filters.levels) &&
      hasAnyStringMatch(tutor.learningStyles, filters.learningStyles) &&
      hasSelectedUniversity(tutor, filters.universities) &&
      tutor.pricePerHour >= filters.minPricePerHour &&
      tutor.pricePerHour <= filters.maxPricePerHour
    );
  });

  return [...filteredTutors].sort((a, b) => {
    if (filters.sortBy === 'Highest rated') {
      return b.rating - a.rating;
    }

    if (filters.sortBy === 'Lowest price') {
      return a.pricePerHour - b.pricePerHour;
    }

    if (filters.sortBy === 'Highest price') {
      return b.pricePerHour - a.pricePerHour;
    }

    return scoreTutor(b, filters) - scoreTutor(a, filters);
  });
}