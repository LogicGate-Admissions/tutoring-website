'use client';

/**
 * File purpose: First student onboarding step for academic subjects.
 *
 * This step separates the student's full study context from the smaller set of
 * subjects they actually want tutoring for. Tutor matching continues to use
 * `subjectSelections`, while `studiedSubjectSelections` preserves the wider
 * academic profile.
 */

import { useEffect, useMemo, useState } from 'react';
import { Container } from '@/shared/components/Container';
import { PageHeader } from '@/shared/components/PageHeader';
import {
  getSubjectOptionsByCategory,
  getSubjectsForQualification,
} from '@/domains/academic-options/services/academicOptionsService';
import type { SubjectOptionsByCategory } from '@/domains/academic-options/types/academicOptions';
import {
  StudentOnboardingFlowControls,
  StudentOnboardingSectionBar,
} from '@/domains/students/learning-profile/components/StudentOnboardingSectionBar';
import { QualificationSelector } from '@/domains/students/learning-profile/components/subjects/QualificationSelector';
import { SubjectPicker } from '@/domains/students/learning-profile/components/subjects/SubjectPicker';
import { TutoringSubjectPicker } from '@/domains/students/learning-profile/components/subjects/TutoringSubjectPicker';
import { getSubjectsForCategory } from '@/domains/students/learning-profile/components/subjects/SubjectSelectionHelpers';
import {
  getStoredLearningProfile,
  updateStoredLearningProfile,
} from '@/domains/students/learning-profile/services/learningProfileStorage';
import type {
  QualificationCategory,
  QualificationSubjectSelection,
} from '@/domains/students/learning-profile/types/learningProfile';

function removeSubjectFromSelections(
  selections: QualificationSubjectSelection[],
  category: QualificationCategory,
  subject: string
) {
  return selections
    .map((selection) => {
      if (selection.category !== category) return selection;

      return {
        ...selection,
        subjects: selection.subjects.filter((item) => item !== subject),
      };
    })
    .filter((selection) => selection.subjects.length > 0);
}

function toggleSubjectInsideCategory(
  selections: QualificationSubjectSelection[],
  category: QualificationCategory,
  subject: string
) {
  return selections.map((selection) => {
    if (selection.category !== category) return selection;

    const alreadySelected = selection.subjects.includes(subject);

    return {
      ...selection,
      subjects: alreadySelected
        ? selection.subjects.filter((item) => item !== subject)
        : [...selection.subjects, subject],
    };
  });
}

function toggleTutoringSubject(
  selections: QualificationSubjectSelection[],
  category: QualificationCategory,
  subject: string
) {
  const existingSelection = selections.find(
    (selection) => selection.category === category
  );

  if (!existingSelection) {
    return [...selections, { category, subjects: [subject] }];
  }

  return toggleSubjectInsideCategory(selections, category, subject).filter(
    (selection) => selection.subjects.length > 0
  );
}

/** Student subject onboarding step. */
export function StudentSubjectsStep() {
  const [studiedSubjectSelections, setStudiedSubjectSelections] = useState<
    QualificationSubjectSelection[]
  >([]);
  const [tutoringSubjectSelections, setTutoringSubjectSelections] = useState<
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

      setStudiedSubjectSelections(profile.studiedSubjectSelections);
      setTutoringSubjectSelections(profile.subjectSelections);
      setActiveCategory(profile.studiedSubjectSelections[0]?.category ?? '');
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

  const studiedSubjectsForActiveCategory = getSubjectsForCategory(
    studiedSubjectSelections,
    activeCategory
  );

  /** Hide already-selected study subjects because selected subjects appear as pills. */
  const subjectOptions = useMemo(() => {
    return getSubjectsForQualification(
      subjectOptionsByCategory,
      activeCategory
    ).filter((subject) => !studiedSubjectsForActiveCategory.includes(subject));
  }, [activeCategory, studiedSubjectsForActiveCategory, subjectOptionsByCategory]);

  function chooseCategory(category: QualificationCategory) {
    /** Selecting an existing category switches the picker to that category. */
    const alreadySelected = studiedSubjectSelections.some(
      (selection) => selection.category === category
    );

    if (alreadySelected) {
      setActiveCategory(category);
      return;
    }

    /** New categories start with no subjects until the student chooses them. */
    setStudiedSubjectSelections((currentSelections) => [
      ...currentSelections,
      { category, subjects: [] },
    ]);

    setActiveCategory(category);
  }


  function clearSubjectsForCategory(category: QualificationCategory) {
    /** Keep the qualification selected but remove all subjects and matching needs. */
    setStudiedSubjectSelections((currentSelections) =>
      currentSelections.map((selection) =>
        selection.category === category ? { ...selection, subjects: [] } : selection
      )
    );

    setTutoringSubjectSelections((currentSelections) =>
      currentSelections.filter((selection) => selection.category !== category)
    );
  }

  function removeCategory(category: QualificationCategory) {
    /** Removing a study qualification also removes tutoring subjects inside it. */
    setStudiedSubjectSelections((currentSelections) => {
      const nextSelections = currentSelections.filter(
        (selection) => selection.category !== category
      );

      if (activeCategory === category) {
        setActiveCategory(nextSelections[0]?.category ?? '');
      }

      return nextSelections;
    });

    setTutoringSubjectSelections((currentSelections) =>
      currentSelections.filter((selection) => selection.category !== category)
    );
  }

  function toggleStudiedSubject(subject: string) {
    if (!activeCategory) return;

    const wasSelected = studiedSubjectsForActiveCategory.includes(subject);

    /** Toggle only inside the currently active qualification. */
    setStudiedSubjectSelections((currentSelections) =>
      toggleSubjectInsideCategory(currentSelections, activeCategory, subject)
    );

    /** A subject cannot remain a tutoring need if the student no longer studies it. */
    if (wasSelected) {
      setTutoringSubjectSelections((currentSelections) =>
        removeSubjectFromSelections(currentSelections, activeCategory, subject)
      );
    }
  }

  function toggleWantedTutoringSubject(
    category: QualificationCategory,
    subject: string
  ) {
    setTutoringSubjectSelections((currentSelections) =>
      toggleTutoringSubject(currentSelections, category, subject)
    );
  }

  function clearSelection() {
    /** Reset both the study context and the tutoring need. */
    setStudiedSubjectSelections([]);
    setTutoringSubjectSelections([]);
    setActiveCategory('');
  }

  function saveDraftProfile() {
    /** Save without blocking navigation; Firestore updates in the background. */
    void updateStoredLearningProfile({
      studiedSubjectSelections,
      subjectSelections: tutoringSubjectSelections,
    });
  }

  return (
    <main className="min-h-screen bg-[#f8f7f4]">
      <PageHeader
        eyebrow="Student onboarding"
        title="Subjects and tutoring needs"
        description="First add the subjects you study, then choose which of those you want tutoring for."
      />

      <StudentOnboardingSectionBar
        currentStep="subjects"
        onBeforeNavigate={saveDraftProfile}
      />

      <Container className="py-8">
        {subjectLoadError && (
          <p className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {subjectLoadError}
          </p>
        )}

        <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <QualificationSelector
            studiedSubjectSelections={studiedSubjectSelections}
            activeCategory={activeCategory}
            onChooseCategory={chooseCategory}
            onRemoveCategory={removeCategory}
            onClearAll={clearSelection}
          />

          <section className="grid min-w-0 gap-6">
            <SubjectPicker
              activeCategory={activeCategory}
              subjectOptions={subjectOptions}
              activeSubjects={studiedSubjectsForActiveCategory}
              onToggleSubject={toggleStudiedSubject}
              onClearActiveSubjects={() => {
                if (activeCategory) clearSubjectsForCategory(activeCategory);
              }}
              isLoadingSubjects={isLoadingSubjects}
            />

            <TutoringSubjectPicker
              studiedSubjectSelections={studiedSubjectSelections}
              tutoringSubjectSelections={tutoringSubjectSelections}
              onToggleSubject={toggleWantedTutoringSubject}
            />
          </section>
        </div>
      </Container>

      <StudentOnboardingFlowControls
        currentStep="subjects"
        onBeforeNavigate={saveDraftProfile}
      />
    </main>
  );
}
