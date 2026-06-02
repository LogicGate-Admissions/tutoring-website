'use client';

/**
 * File purpose: Application source file. Comments explain what this file owns and what should stay elsewhere.
 */

import { useEffect, useMemo, useState } from 'react';
import { HomeLinkButton } from '@/shared/components/HomeLinkButton';
import { Container } from '@/shared/components/Container';
import { PageHeader } from '@/shared/components/PageHeader';
import { SUBJECT_OPTIONS_BY_CATEGORY } from '@/domains/students/learning-profile/constants/learningProfileOptions';
import { StudentOnboardingSectionBar } from '@/domains/students/learning-profile/components/StudentOnboardingSectionBar';
import { QualificationSelector } from '@/domains/students/learning-profile/components/subjects/QualificationSelector';
import { SubjectPicker } from '@/domains/students/learning-profile/components/subjects/SubjectPicker';
import { SubjectSummaryPanel } from '@/domains/students/learning-profile/components/subjects/SubjectSummaryPanel';
import {
  getSelectedCategories,
  getSubjectsForCategory,
} from '@/domains/students/learning-profile/components/subjects/SubjectSelectionHelpers';
import {
  getStoredLearningProfile,
  updateStoredLearningProfile,
} from '@/domains/students/learning-profile/services/learningProfileStorage';
import type {
  QualificationCategory,
  QualificationSubjectSelection,
} from '@/domains/students/learning-profile/types/learningProfile';

/**
 * First student onboarding step.
 *
 * Subjects are grouped by qualification so GCSE Maths and A-level Maths remain
 * different choices. The component owns the selection state, while smaller
 * child components render the summary, qualification cards, and subject picker.
 */
export function StudentSubjectsStep() {
  const [subjectSelections, setSubjectSelections] = useState<
    QualificationSubjectSelection[]
  >([]);

  const [activeCategory, setActiveCategory] = useState<
    QualificationCategory | ''
  >('');

  useEffect(() => {
    /**
     * Load the signed-in student's saved Firestore profile after Firebase Auth
     * has restored the browser session.
     */
    let isMounted = true;

    async function loadProfile() {
      const profile = await getStoredLearningProfile();

      if (!isMounted) return;

      setSubjectSelections(profile.subjectSelections);
      setActiveCategory(profile.subjectSelections[0]?.category ?? '');
    }

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedCategories = getSelectedCategories(subjectSelections);

  const activeSubjects = getSubjectsForCategory(
    subjectSelections,
    activeCategory
  );

  /**
   * Do not show subjects already selected for the active qualification in the
   * combobox options, because selected items are already shown as pills.
   */
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
      setActiveCategory(category);
      return;
    }

    setSubjectSelections((currentSelections) => [
      ...currentSelections,
      { category, subjects: [] },
    ]);

    setActiveCategory(category);
  }

  function removeCategory(category: QualificationCategory) {
    setSubjectSelections((currentSelections) => {
      const nextSelections = currentSelections.filter(
        (selection) => selection.category !== category
      );

      if (activeCategory === category) {
        setActiveCategory(nextSelections[0]?.category ?? '');
      }

      return nextSelections;
    });
  }

  function toggleSubject(subject: string) {
    if (!activeCategory) return;

    setSubjectSelections((currentSelections) =>
      currentSelections.map((selection) => {
        if (selection.category !== activeCategory) return selection;

        const alreadySelected = selection.subjects.includes(subject);

        return {
          ...selection,
          subjects: alreadySelected
            ? selection.subjects.filter((item) => item !== subject)
            : [...selection.subjects, subject],
        };
      })
    );
  }

  function clearSelection() {
    setSubjectSelections([]);
    setActiveCategory('');
  }

  function saveDraftProfile() {
    void updateStoredLearningProfile({ subjectSelections });
  }

  return (
    <main className="min-h-screen bg-[#f8f7f4]">
      <PageHeader
        eyebrow="Student onboarding"
        title="What are you studying?"
        description="Choose your qualifications, then pick the subjects under each one."
      />

      <Container className="pt-4">
        <HomeLinkButton />
      </Container>

      <Container className="py-10 pb-28">
        <div className="grid items-start gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="grid gap-6 lg:sticky lg:top-8">
            <SubjectSummaryPanel
              subjectSelections={subjectSelections}
              activeCategory={activeCategory}
              onClearSelection={clearSelection}
              onSelectCategory={setActiveCategory}
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
        </div>
      </Container>

      <StudentOnboardingSectionBar
        currentStep="subjects"
        onBeforeNavigate={saveDraftProfile}
      />
    </main>
  );
}
