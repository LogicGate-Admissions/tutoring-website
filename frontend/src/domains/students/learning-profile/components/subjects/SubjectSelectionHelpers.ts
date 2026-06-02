import type {
  QualificationCategory,
  QualificationSubjectSelection,
} from '@/domains/students/learning-profile/types/learningProfile';

/**
 * Small pure helpers for the subjects step.
 *
 * These are kept outside the React component so future unit tests can validate
 * subject-selection behaviour without rendering the page.
 */
export function getSelectedCategories(
  selections: QualificationSubjectSelection[]
): QualificationCategory[] {
  return selections.map((selection) => selection.category);
}

export function getSubjectsForCategory(
  selections: QualificationSubjectSelection[],
  category: QualificationCategory | ''
) {
  if (!category) return [];

  return (
    selections.find((selection) => selection.category === category)?.subjects ??
    []
  );
}
