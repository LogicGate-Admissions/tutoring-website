/**
 * File purpose: Pure tutor-discovery helper logic. Keep matching rules here instead of inside React components.
 */

import type {
  Tutor,
  TutorFilters,
  TutorSubjectFilter,
} from '@/domains/tutors/tutor-discovery/types/tutor';
import type { TimeBlock } from '@/domains/students/learning-profile/types/learningProfile';
import { timeToMinutes } from '@/domains/students/learning-profile/utils/timeBlocks';

function overlapMinutes(studentBlocks: TimeBlock[], tutorBlocks: TimeBlock[]): number {
  let total = 0;
  for (const s of studentBlocks) {
    for (const t of tutorBlocks) {
      if (s.day !== t.day) continue;
      const start = Math.max(timeToMinutes(s.from), timeToMinutes(t.from));
      const end = Math.min(timeToMinutes(s.to), timeToMinutes(t.to));
      if (end > start) total += end - start;
    }
  }
  return total;
}

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

function matchesSelectedSubject(
  tutor: Tutor,
  selectedSubject: TutorSubjectFilter
) {
  return (
    includesNormalised(tutor.subjects, selectedSubject.subject) &&
    includesNormalised(tutor.levels, selectedSubject.level)
  );
}

function hasAnySelectedSubjectMatch(
  tutor: Tutor,
  selectedSubjects: TutorSubjectFilter[]
) {
  if (selectedSubjects.length === 0) return true;

  return selectedSubjects.some((selectedSubject) =>
    matchesSelectedSubject(tutor, selectedSubject)
  );
}

/**
 * Applies the level/subject part of tutor matching.
 *
 * The important behaviour is UNION, not intersection:
 * - selected levels can match a tutor
 * - selected level-specific subjects can also match a tutor
 * - when both are selected, a tutor only needs to match one of those groups
 *
 * Other filters such as university, learning style and price still narrow the
 * results afterwards.
 */
function matchesLevelOrSubjectFilters(tutor: Tutor, filters: TutorFilters) {
  const hasLevelFilters = filters.levels.length > 0;
  const hasSubjectFilters = filters.subjects.length > 0;

  if (!hasLevelFilters && !hasSubjectFilters) return true;

  const matchesLevel =
    hasLevelFilters && hasAnyStringMatch(tutor.levels, filters.levels);

  const matchesSubject =
    hasSubjectFilters && hasAnySelectedSubjectMatch(tutor, filters.subjects);

  return matchesLevel || matchesSubject;
}

function scoreTutor(tutor: Tutor, filters: TutorFilters) {
  let score = 0;

  score += tutor.rating * 10;

  score += filters.subjects.filter((selectedSubject) =>
    matchesSelectedSubject(tutor, selectedSubject)
  ).length * 20;

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
export function filterTutors(
  tutors: Tutor[],
  filters: TutorFilters,
  studentAvailabilityBlocks?: TimeBlock[]
) {
  const filteredTutors = tutors.filter((tutor) => {
    return (
      matchesLevelOrSubjectFilters(tutor, filters) &&
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

    if (filters.sortBy === 'Most hours in common') {
      const student = studentAvailabilityBlocks ?? [];
      return (
        overlapMinutes(student, b.availabilityBlocks ?? []) -
        overlapMinutes(student, a.availabilityBlocks ?? [])
      );
    }

    return scoreTutor(b, filters) - scoreTutor(a, filters);
  });
}
