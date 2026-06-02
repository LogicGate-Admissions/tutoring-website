/**
 * File purpose: Pure tutor-discovery helper logic. Keep matching rules here instead of inside React components.
 */

import type { TutorSubjectFilter } from '@/domains/tutors/tutor-discovery/types/tutor';

/**
 * Display helpers for tutor discovery.
 *
 * Keeping small formatting rules here prevents visual components from copying
 * the same string-building logic when cards, filters, and modals evolve
 * independently.
 */
export function tutorInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function tutorSubjectFilterKey(subjectFilter: TutorSubjectFilter) {
  return `${subjectFilter.level}|||${subjectFilter.subject}`;
}

export function tutorSubjectFilterLabel(subjectFilter: TutorSubjectFilter) {
  return `${subjectFilter.level} · ${subjectFilter.subject}`;
}
