'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Container } from '@/shared/components/Container';
import { PageHeader } from '@/shared/components/PageHeader';
import { ROUTES } from '@/shared/constants/routes';
import {
  PRIMARY_SUBJECTS_BY_CATEGORY,
  QUALIFICATION_CATEGORIES,
  SUBJECT_OPTIONS_BY_CATEGORY,
} from '@/domains/students/learning-profile/constants/learningProfileOptions';
import { OptionCard } from '@/domains/students/learning-profile/components/OptionCard';
import { StudentOnboardingSectionBar } from '@/domains/students/learning-profile/components/StudentOnboardingSectionBar';
import {
  getStoredLearningProfile,
  updateStoredLearningProfile,
} from '@/domains/students/learning-profile/services/learningProfileStorage';
import type { QualificationCategory } from '@/domains/students/learning-profile/types/learningProfile';

/**
 * Removes duplicate strings while preserving their original order.
 */
function uniqueStrings(values: string[]) {
  return values.filter((value, index) => values.indexOf(value) === index);
}

/**
 * First student onboarding step.
 *
 * This creates the first part of the student's learning profile:
 * - qualifications they are studying
 * - subjects they want support with
 */
export function StudentSubjectsStep() {
  const router = useRouter();
  const initialProfile = getStoredLearningProfile();

  const [categories, setCategories] = useState<QualificationCategory[]>(
    initialProfile.categories
  );

  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    initialProfile.subjects
  );

  const [showAllSubjects, setShowAllSubjects] = useState(false);
  const [subjectSearch, setSubjectSearch] = useState('');

  const allSubjectOptions = useMemo(() => {
    return uniqueStrings(
      categories.flatMap((category) => SUBJECT_OPTIONS_BY_CATEGORY[category])
    );
  }, [categories]);

  const primarySubjectOptions = useMemo(() => {
    return uniqueStrings(
      categories.flatMap((category) => PRIMARY_SUBJECTS_BY_CATEGORY[category])
    );
  }, [categories]);

  const visibleSubjectOptions = useMemo(() => {
    const baseOptions = showAllSubjects ? allSubjectOptions : primarySubjectOptions;
    const normalisedSearch = subjectSearch.trim().toLowerCase();

    if (!normalisedSearch) return baseOptions;

    return allSubjectOptions.filter((subject) =>
      subject.toLowerCase().includes(normalisedSearch)
    );
  }, [allSubjectOptions, primarySubjectOptions, showAllSubjects, subjectSearch]);

  const hasSelectedAnything =
    categories.length > 0 || selectedSubjects.length > 0;

  const canContinue = categories.length > 0 && selectedSubjects.length > 0;

  function toggleCategory(category: QualificationCategory) {
    setCategories((currentCategories) => {
      if (currentCategories.includes(category)) {
        const nextCategories = currentCategories.filter(
          (item) => item !== category
        );

        /**
         * When a qualification is removed, remove subjects that no longer
         * belong to any remaining selected qualification.
         */
        const remainingSubjects = uniqueStrings(
          nextCategories.flatMap(
            (item) => SUBJECT_OPTIONS_BY_CATEGORY[item]
          )
        );

        setSelectedSubjects((currentSubjects) =>
          currentSubjects.filter((subject) =>
            remainingSubjects.includes(subject)
          )
        );

        return nextCategories;
      }

      return [...currentCategories, category];
    });
  }

  function toggleSubject(subject: string) {
    setSelectedSubjects((currentSubjects) =>
      currentSubjects.includes(subject)
        ? currentSubjects.filter((item) => item !== subject)
        : [...currentSubjects, subject]
    );
  }

  function clearSelection() {
    setCategories([]);
    setSelectedSubjects([]);
    setSubjectSearch('');
    setShowAllSubjects(false);
  }

  function continueToPreferences() {
    if (!canContinue) return;

    updateStoredLearningProfile({
      categories,
      subjects: selectedSubjects,
    });

    router.push(ROUTES.studentOnboardingPreferences);
  }

  function saveDraftProfile() {
    updateStoredLearningProfile({
      categories,
      subjects: selectedSubjects,
    });
  }

  return (
    <main className="min-h-screen bg-[#f8f7f4]">
      <PageHeader
        eyebrow="Student onboarding"
        title="What are you studying?"
        description="Choose your qualifications and the subjects you want help with."
      />

      <Container className="py-10 pb-28">
        <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
          <div className="grid gap-6">
            <Card>
              <h2 className="text-xl font-semibold">Qualifications</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Select every qualification you’re currently working towards.
              </p>

              <div className="mt-5 grid gap-3">
                {QUALIFICATION_CATEGORIES.map((option) => (
                  <OptionCard
                    key={option}
                    title={option}
                    selected={categories.includes(option)}
                    onToggle={() => toggleCategory(option)}
                  />
                ))}
              </div>
            </Card>

            <Card>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">
                    Currently selected
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Review your choices before continuing.
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

              <div className="mt-5 grid gap-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Qualifications
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {categories.length > 0 ? (
                      categories.map((category) => (
                        <Badge
                          key={category}
                          className="border-slate-300 bg-white text-slate-800"
                        >
                          {category}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">
                        No qualifications selected yet.
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Subjects
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedSubjects.length > 0 ? (
                      selectedSubjects.map((subject) => (
                        <Badge
                          key={subject}
                          className="border-slate-300 bg-white text-slate-800"
                        >
                          {subject}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">
                        No subjects selected yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Subjects</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Start with common STEM subjects, or search the full list.
                </p>
              </div>

              {categories.length > 0 && (
                <Button
                  variant="secondary"
                  onClick={() => setShowAllSubjects((current) => !current)}
                  className="shrink-0"
                >
                  {showAllSubjects ? 'Show less' : 'More subjects'}
                </Button>
              )}
            </div>

            {categories.length === 0 && (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                Choose at least one qualification first.
              </div>
            )}

            {categories.length > 0 && (
              <>
                {showAllSubjects && (
                  <label className="mt-5 block text-sm font-medium text-slate-700">
                    Search subjects
                    <input
                      value={subjectSearch}
                      onChange={(event) => setSubjectSearch(event.target.value)}
                      placeholder="Search maths, physics, UCAT..."
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500"
                    />
                  </label>
                )}

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {visibleSubjectOptions.map((subject) => (
                    <OptionCard
                      key={subject}
                      title={subject}
                      selected={selectedSubjects.includes(subject)}
                      onToggle={() => toggleSubject(subject)}
                    />
                  ))}
                </div>

                {visibleSubjectOptions.length === 0 && (
                  <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                    No subjects match your search.
                  </div>
                )}
              </>
            )}
          </Card>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <Button variant="secondary" href={ROUTES.home}>
            Back
          </Button>

          <div className="hidden text-sm text-slate-500 sm:block">
            {canContinue
              ? 'Ready to continue.'
              : 'Select at least one qualification and one subject.'}
          </div>

          <Button disabled={!canContinue} onClick={continueToPreferences}>
            Continue
          </Button>
        </div>
      </Container>

      <StudentOnboardingSectionBar
        currentStep="subjects"
        onBeforeNavigate={saveDraftProfile}
      />
    </main>
  );
}