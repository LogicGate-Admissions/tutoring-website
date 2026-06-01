import type { Tutor, TutorFilters } from '@/domains/tutors/tutor-discovery/types/tutor';

function normalise(value: string) {
  return value.trim().toLowerCase();
}

function hasAnyMatch(tutorValues: string[], selectedValues: string[]) {
  if (selectedValues.length === 0) return true;

  const normalisedTutorValues = tutorValues.map(normalise);

  return selectedValues.some((selectedValue) =>
    normalisedTutorValues.includes(normalise(selectedValue))
  );
}

function hasSelectedUniversity(tutor: Tutor, selectedUniversities: string[]) {
  if (selectedUniversities.length === 0) return true;

  return selectedUniversities
    .map(normalise)
    .includes(normalise(tutor.university));
}

function scoreTutor(tutor: Tutor, filters: TutorFilters) {
  let score = 0;

  score += tutor.rating * 10;

  score += filters.subjects.filter((subject) =>
    tutor.subjects.map(normalise).includes(normalise(subject))
  ).length * 20;

  score += filters.levels.filter((level) =>
    tutor.levels.map(normalise).includes(normalise(level))
  ).length * 10;

  score += filters.learningStyles.filter((style) =>
    tutor.learningStyles.map(normalise).includes(normalise(style))
  ).length * 10;

  return score;
}

/**
 * Applies all tutor filters in one pure function.
 *
 * Empty filter arrays mean "any".
 * Example:
 * levels: [] means any level.
 * levels: ['GCSE', 'A-level'] means tutors must teach at least one of those.
 */
export function filterTutors(tutors: Tutor[], filters: TutorFilters) {
  const filteredTutors = tutors.filter((tutor) => {
    return (
      hasAnyMatch(tutor.subjects, filters.subjects) &&
      hasAnyMatch(tutor.levels, filters.levels) &&
      hasAnyMatch(tutor.learningStyles, filters.learningStyles) &&
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