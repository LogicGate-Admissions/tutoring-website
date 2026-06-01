import type { Tutor, TutorFilters } from '@/domains/tutors/tutor-discovery/types/tutor';

function normalise(value: string) {
  return value.trim().toLowerCase();
}

function hasAnyMatchingSubject(tutor: Tutor, selectedSubjects: string[]) {
  if (selectedSubjects.length === 0) return true;

  const tutorSubjects = tutor.subjects.map(normalise);

  return selectedSubjects.some((subject) =>
    tutorSubjects.includes(normalise(subject))
  );
}

function hasLearningStyle(tutor: Tutor, learningStyle: string) {
  if (!learningStyle) return true;

  return tutor.learningStyles
    .map(normalise)
    .includes(normalise(learningStyle));
}

function hasLevel(tutor: Tutor, level: string) {
  if (!level) return true;

  return tutor.levels.map(normalise).includes(normalise(level));
}

function hasUniversity(tutor: Tutor, university: string) {
  if (!university) return true;

  return normalise(tutor.university) === normalise(university);
}

function scoreTutor(tutor: Tutor, filters: TutorFilters) {
  let score = 0;

  score += tutor.rating * 10;
  score += filters.subjects.filter((subject) =>
    tutor.subjects.map(normalise).includes(normalise(subject))
  ).length * 20;

  if (filters.learningStyle && hasLearningStyle(tutor, filters.learningStyle)) {
    score += 10;
  }

  if (filters.level && hasLevel(tutor, filters.level)) {
    score += 10;
  }

  return score;
}

/**
 * Applies all tutor filters in one pure function.
 *
 * A pure function is easy to test because the same input always gives the same
 * output and it does not depend on React state or Firebase.
 */
export function filterTutors(tutors: Tutor[], filters: TutorFilters) {
  const filteredTutors = tutors.filter((tutor) => {
    return (
      hasAnyMatchingSubject(tutor, filters.subjects) &&
      hasLevel(tutor, filters.level) &&
      hasLearningStyle(tutor, filters.learningStyle) &&
      hasUniversity(tutor, filters.university) &&
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
