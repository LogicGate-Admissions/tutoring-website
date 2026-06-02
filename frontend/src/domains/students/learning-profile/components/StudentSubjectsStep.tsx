'use client';

/**
 * File purpose: First student onboarding step for qualifications and subjects.
 *
 * The student chooses the qualifications they study, then chooses subjects
 * inside each qualification. The subject list itself comes from academicOptionsService so students and tutors use the same source
 * of truth.
 */

import { useEffect, useMemo, useState } from 'react';
import { Container } from '@/shared/components/Container';
import { PageHeader } from '@/shared/components/PageHeader';
import {
  getSubjectOptionsByCategory,
  getSubjectsForQualification,
} from '@/domains/academic-options/services/academicOptionsService';
import type { SubjectOptionsByCategory } from '@/domains/academic-options/types/academicOptions';
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
 * Student subject onboarding step.
 *
 * State stays here because the page must save the complete subject selection
 * when the user navigates away through the bottom onboarding tabs.
 */
export function StudentSubjectsStep() {
  const [subjectSelections, setSubjectSelections] = useState<
    QualificationSubjectSelection[]
  >([]);
  const [activeCategory, setActiveCategory] = useState<
    QualificationCategory | ''
  >('');
  const [subjectOptionsByCategory, setSubjectOptionsByCategory] =
    useState<SubjectOptionsByCategory>({});
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [subjectLoadError, setSubjectLoadError] = useState<string | null>(null);

  useEffect(() => {
    /** Load the signed-in student's existing onboarding selections. */
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

  useEffect(() => {
    /** Load shared master subject options. */
    let isMounted = true;

    async function loadAcademicSubjects() {
      setIsLoadingSubjects(true);
      setSubjectLoadError(null);

      try {
        const options = await getSubjectOptionsByCategory();

        if (isMounted) {
          setSubjectOptionsByCategory(options);
        }
      } catch {
        if (isMounted) {
          setSubjectLoadError(
            'Could not load subject options. Please refresh the page.'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingSubjects(false);
        }
      }
    }

    void loadAcademicSubjects();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedCategories = getSelectedCategories(subjectSelections);

  const activeSubjects = getSubjectsForCategory(
    subjectSelections,
    activeCategory
  );

  /** Hide already-selected subjects because selected subjects appear as pills. */
  const subjectOptions = useMemo(() => {
    return getSubjectsForQualification(
      subjectOptionsByCategory,
      activeCategory
    ).filter((subject) => !activeSubjects.includes(subject));
  }, [activeCategory, activeSubjects, subjectOptionsByCategory]);

  function chooseCategory(category: QualificationCategory) {
    /** Selecting an existing category switches the picker to that category. */
    const alreadySelected = subjectSelections.some(
      (selection) => selection.category === category
    );

    if (alreadySelected) {
      setActiveCategory(category);
      return;
    }

    /** New categories start with no subjects until the student chooses them. */
    setSubjectSelections((currentSelections) => [
      ...currentSelections,
      { category, subjects: [] },
    ]);

    setActiveCategory(category);
  }

  function removeCategory(category: QualificationCategory) {
    /** Removing a qualification also removes all subjects inside it. */
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

    /** Toggle only inside the currently active qualification. */
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
    /** Reset both the selected data and the active editor panel. */
    setSubjectSelections([]);
    setActiveCategory('');
  }

  function saveDraftProfile() {
    /** Save without blocking navigation; Firestore updates in the background. */
    void updateStoredLearningProfile({ subjectSelections });
  }

  return (
    <main className="min-h-screen bg-[#f8f7f4]">
      <PageHeader
        eyebrow="Student onboarding"
        title="What are you studying?"
        description="Choose your qualifications, then pick the subjects under each one."
      />


      <Container className="py-10 pb-28">
        {subjectLoadError && (
          <p className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {subjectLoadError}
          </p>
        )}

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
            isLoadingSubjects={isLoadingSubjects}
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
