/**
 * File purpose: Render qualification + subject selection for tutor onboarding.
 *
 * Tutors choose what they can teach using the same structured model as student
 * onboarding. This prevents vague free-text profiles and makes tutor matching
 * easier because GCSE Maths and A-level Maths remain separate choices.
 */

import { useMemo } from 'react';
import { SUBJECT_OPTIONS_BY_CATEGORY } from '@/domains/students/learning-profile/constants/learningProfileOptions';
import { QualificationSelector } from '@/domains/students/learning-profile/components/subjects/QualificationSelector';
import { SubjectPicker } from '@/domains/students/learning-profile/components/subjects/SubjectPicker';
import { SubjectSummaryPanel } from '@/domains/students/learning-profile/components/subjects/SubjectSummaryPanel';
import {
  getSelectedCategories,
  getSubjectsForCategory,
} from '@/domains/students/learning-profile/components/subjects/SubjectSelectionHelpers';
import type {
  QualificationCategory,
  QualificationSubjectSelection,
} from '@/domains/students/learning-profile/types/learningProfile';

type TutorTeachingSubjectsSectionProps = {
  /** Qualification/subject pairs currently selected by the tutor. */
  subjectSelections: QualificationSubjectSelection[];

  /** The qualification currently being edited in the subject picker. */
  activeCategory: QualificationCategory | '';

  /** Replaces the selected qualification/subject draft. */
  onChangeSubjectSelections: (selections: QualificationSubjectSelection[]) => void;

  /** Changes which qualification the subject picker is editing. */
  onChangeActiveCategory: (category: QualificationCategory | '') => void;
};

/**
 * Tutor teaching subjects section.
 *
 * The layout intentionally mirrors student onboarding: summary on the left,
 * qualification picker under it, subject picker on the right. Reusing the same
 * mental model keeps the product consistent for both account types.
 */
export function TutorTeachingSubjectsSection({
  subjectSelections,
  activeCategory,
  onChangeSubjectSelections,
  onChangeActiveCategory,
}: TutorTeachingSubjectsSectionProps) {
  const selectedCategories = getSelectedCategories(subjectSelections);

  const activeSubjects = getSubjectsForCategory(
    subjectSelections,
    activeCategory
  );

  const subjectOptions = useMemo(() => {
    if (!activeCategory) return [];

    return SUBJECT_OPTIONS_BY_CATEGORY[activeCategory].filter(
      (subject) => !activeSubjects.includes(subject)
    );
  }, [activeCategory, activeSubjects]);

  function chooseCategory(category: QualificationCategory) {
    const alreadySelected = subjectSelections.some(
      (selection) => selection.category === category
    );

    if (alreadySelected) {
      onChangeActiveCategory(category);
      return;
    }

    onChangeSubjectSelections([
      ...subjectSelections,
      { category, subjects: [] },
    ]);
    onChangeActiveCategory(category);
  }

  function removeCategory(category: QualificationCategory) {
    const nextSelections = subjectSelections.filter(
      (selection) => selection.category !== category
    );

    onChangeSubjectSelections(nextSelections);

    if (activeCategory === category) {
      onChangeActiveCategory(nextSelections[0]?.category ?? '');
    }
  }

  function toggleSubject(subject: string) {
    if (!activeCategory) return;

    const nextSelections = subjectSelections.map((selection) => {
      if (selection.category !== activeCategory) return selection;

      const alreadySelected = selection.subjects.includes(subject);

      return {
        ...selection,
        subjects: alreadySelected
          ? selection.subjects.filter((item) => item !== subject)
          : [...selection.subjects, subject],
      };
    });

    onChangeSubjectSelections(nextSelections);
  }

  function clearSelection() {
    onChangeSubjectSelections([]);
    onChangeActiveCategory('');
  }

  return (
    <section className="grid items-start gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="grid gap-6 lg:sticky lg:top-8">
        <SubjectSummaryPanel
          subjectSelections={subjectSelections}
          activeCategory={activeCategory}
          onClearSelection={clearSelection}
          onSelectCategory={onChangeActiveCategory}
          onRemoveCategory={removeCategory}
        />

        <QualificationSelector
          selectedCategories={selectedCategories}
          activeCategory={activeCategory}
          onChooseCategory={chooseCategory}
        />
      </aside>

      <SubjectPicker
        activeCategory={activeCategory}
        subjectOptions={subjectOptions}
        activeSubjects={activeSubjects}
        onToggleSubject={toggleSubject}
      />
    </section>
  );
}
