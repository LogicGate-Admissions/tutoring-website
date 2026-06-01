'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Container } from '@/shared/components/Container';
import { PageHeader } from '@/shared/components/PageHeader';
import { cn } from '@/shared/utils/cn';
import { ROUTES } from '@/shared/constants/routes';
import {
  PRIMARY_SUBJECTS_BY_CATEGORY,
  QUALIFICATION_CATEGORIES,
  SUBJECT_OPTIONS_BY_CATEGORY,
} from '@/domains/students/learning-profile/constants/learningProfileOptions';
import { StudentOnboardingSectionBar } from '@/domains/students/learning-profile/components/StudentOnboardingSectionBar';
import {
  getStoredLearningProfile,
  updateStoredLearningProfile,
} from '@/domains/students/learning-profile/services/learningProfileStorage';
import type {
  QualificationCategory,
  QualificationSubjectSelection,
} from '@/domains/students/learning-profile/types/learningProfile';

function getSelectedCategories(
  selections: QualificationSubjectSelection[]
): QualificationCategory[] {
  return selections.map((selection) => selection.category);
}

function getSubjectsForCategory(
  selections: QualificationSubjectSelection[],
  category: QualificationCategory | ''
) {
  if (!category) return [];

  return (
    selections.find((selection) => selection.category === category)?.subjects ??
    []
  );
}

/**
 * First student onboarding step.
 *
 * This step lets a student choose multiple qualifications, but keeps subjects
 * grouped under each qualification.
 *
 * That means GCSE Maths and A-level Maths are different selections.
 */
export function StudentSubjectsStep() {
  const initialProfile = getStoredLearningProfile();

  const [subjectSelections, setSubjectSelections] = useState<
    QualificationSubjectSelection[]
  >(initialProfile.subjectSelections);

  const [activeCategory, setActiveCategory] = useState<
    QualificationCategory | ''
  >(initialProfile.subjectSelections[0]?.category ?? '');

  const [subjectSearch, setSubjectSearch] = useState('');

  const selectedCategories = getSelectedCategories(subjectSelections);
  const activeSubjects = getSubjectsForCategory(
    subjectSelections,
    activeCategory
  );

  const subjectOptions = useMemo(() => {
    if (!activeCategory) return [];

    const normalisedSearch = subjectSearch.trim().toLowerCase();

    return SUBJECT_OPTIONS_BY_CATEGORY[activeCategory]
      .filter((subject) => !activeSubjects.includes(subject))
      .filter((subject) =>
        normalisedSearch
          ? subject.toLowerCase().includes(normalisedSearch)
          : true
      );
  }, [activeCategory, activeSubjects, subjectSearch]);

  const hasSelectedAnything = subjectSelections.length > 0;

  function chooseCategory(category: QualificationCategory) {
    const alreadySelected = subjectSelections.some(
      (selection) => selection.category === category
    );

    /**
     * If it is already selected, clicking it just changes the active tab.
     * It does not remove it.
     */
    if (alreadySelected) {
      setActiveCategory(category);
      setSubjectSearch('');
      return;
    }

    /**
     * If it is not selected yet, add it and make it the active tab.
     */
    setSubjectSelections((currentSelections) => [
      ...currentSelections,
      { category, subjects: [] },
    ]);

    setActiveCategory(category);
    setSubjectSearch('');
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

  function addSubjectFromDropdown(subject: string) {
    if (!subject || !activeCategory) return;

    toggleSubject(subject);
    setSubjectSearch('');
  }

  function toggleSubject(subject: string) {
    if (!activeCategory) return;

    setSubjectSelections((currentSelections) =>
      currentSelections.map((selection) => {
        if (selection.category !== activeCategory) {
          return selection;
        }

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
    setSubjectSearch('');
  }

  function saveDraftProfile() {
    updateStoredLearningProfile({
      subjectSelections,
    });
  }

  return (
    <main className="min-h-screen bg-[#f8f7f4]">
      <PageHeader
        eyebrow="Student onboarding"
        title="What are you studying?"
        description="Choose your qualifications, then pick the subjects under each one."
      />

      <Container className="py-10 pb-28">
        <div className="grid items-start gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="grid gap-6 lg:sticky lg:top-8">
            <Card>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">
                    Currently selected
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Your choices are grouped by qualification.
                  </p>
                </div>

                <Button
                  variant="ghost"
                  disabled={!hasSelectedAnything}
                  onClick={clearSelection}
                  className="shrink-0 px-4 py-2"
                >
                  Clear
                </Button>
              </div>

              <div className="mt-5 grid gap-4">
                {subjectSelections.length === 0 && (
                  <p className="text-sm text-slate-500">
                    No qualifications or subjects selected yet.
                  </p>
                )}

                {subjectSelections.map((selection) => (
                  <div
                    key={selection.category}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveCategory(selection.category)}
                        className="text-left text-sm font-semibold text-slate-950 hover:underline"
                      >
                        {selection.category}
                      </button>

                      <button
                        type="button"
                        onClick={() => removeCategory(selection.category)}
                        className="text-xs font-medium text-slate-500 hover:text-rose-600"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {selection.subjects.length > 0 ? (
                        selection.subjects.map((subject) => (
                          <Badge
                            key={`${selection.category}-${subject}`}
                            className="border-slate-300 bg-white text-slate-800"
                          >
                            {subject}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">
                          No subjects chosen for this qualification yet.
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h2 className="text-xl font-semibold">Qualifications</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Select all qualifications that apply. Black means you are
                currently editing it.
              </p>

              <div className="mt-5 grid gap-3">
                {QUALIFICATION_CATEGORIES.map((category) => {
                  const isSelected = selectedCategories.includes(category);
                  const isActive = activeCategory === category;

                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => chooseCategory(category)}
                      className={cn(
                        'rounded-2xl border p-5 text-left transition',
                        isActive &&
                          'border-slate-950 bg-slate-950 text-white shadow-sm',
                        !isActive &&
                          isSelected &&
                          'border-slate-400 bg-slate-100 text-slate-950',
                        !isActive &&
                          !isSelected &&
                          'border-slate-200 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50'
                      )}
                    >
                      <span className="block text-sm font-semibold">
                        {category}
                      </span>

                      {isActive && (
                        <span className="mt-2 block text-xs font-medium text-slate-300">
                          Currently editing
                        </span>
                      )}

                      {!isActive && isSelected && (
                        <span className="mt-2 block text-xs font-medium text-slate-500">
                          Selected
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </Card>
          </aside>

          <Card>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Subjects</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {activeCategory
                    ? `Choose subjects for ${activeCategory}.`
                    : 'Choose a qualification first.'}
                </p>
              </div>
            </div>

            {!activeCategory && (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                Choose a qualification on the left to start selecting subjects.
              </div>
            )}

            {activeCategory && (
              <div className="mt-5">
                <label className="block text-sm font-medium text-slate-700">
                  Search subjects
                  <input
                    value={subjectSearch}
                    onChange={(event) => setSubjectSearch(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500"
                  />
                </label>

                <select
                  value=""
                  disabled={subjectOptions.length === 0}
                  onChange={(event) => addSubjectFromDropdown(event.target.value)}
                  className="mt-3 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="">
                    {subjectOptions.length === 0 ? 'No subjects available' : 'Add a subject'}
                  </option>

                  {subjectOptions.map((subject) => (
                    <option key={`${activeCategory}-${subject}`} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>

                {activeSubjects.length > 0 && (
                  <p className="mt-4 text-sm text-slate-600">
                    Selected subjects are shown in the summary on the left.
                  </p>
                )}
              </div>
            )}
          </Card>
        </div>
      </Container>

      <StudentOnboardingSectionBar
        currentStep="subjects"
        onBeforeNavigate={saveDraftProfile}
      />
    </main>
  );
}