/**
 * File purpose: Render tutor qualification, subject, and per-subject pricing.
 *
 * Tutors choose what they teach using the same structured model as student
 * onboarding, but tutor onboarding also captures a price for each selected
 * qualification + subject pair.
 */

import { useMemo } from 'react';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { getSubjectsForQualification } from '@/domains/academic-options/services/academicOptionsService';
import type { SubjectOptionsByCategory } from '@/domains/academic-options/types/academicOptions';
import { QualificationSelector } from '@/domains/students/learning-profile/components/subjects/QualificationSelector';
import { SubjectPicker } from '@/domains/students/learning-profile/components/subjects/SubjectPicker';
import { getSubjectsForCategory } from '@/domains/students/learning-profile/components/subjects/SubjectSelectionHelpers';
import type {
  QualificationCategory,
  QualificationSubjectSelection,
} from '@/domains/students/learning-profile/types/learningProfile';
import type { TutorSubjectRate } from '@/domains/tutors/tutor-discovery/types/tutor';

type TutorTeachingSubjectsSectionProps = {
  subjectSelections: QualificationSubjectSelection[];
  subjectRates: TutorSubjectRate[];
  activeCategory: QualificationCategory | '';
  subjectOptionsByCategory: SubjectOptionsByCategory;
  isLoadingSubjects: boolean;
  onChangeSubjectSelections: (selections: QualificationSubjectSelection[]) => void;
  onChangeSubjectRates: (rates: TutorSubjectRate[]) => void;
  onChangeActiveCategory: (category: QualificationCategory | '') => void;
};

/** Check whether two pricing entries describe the same qualification + subject. */
function sameRatePair(
  first: Pick<TutorSubjectRate, 'qualification' | 'subject'>,
  second: Pick<TutorSubjectRate, 'qualification' | 'subject'>
) {
  return first.qualification === second.qualification && first.subject === second.subject;
}

/** Build the current selected qualification/subject pairs from the subject draft. */
function selectedPairs(subjectSelections: QualificationSubjectSelection[]) {
  return subjectSelections.flatMap((selection) =>
    selection.subjects.map((subject) => ({
      qualification: selection.category,
      subject,
    }))
  );
}

/** Keep the price list aligned to the selected subjects. */
function syncRatesToSelections(
  subjectSelections: QualificationSubjectSelection[],
  currentRates: TutorSubjectRate[]
) {
  return selectedPairs(subjectSelections).map((pair) => {
    const existingRate = currentRates.find((rate) => sameRatePair(rate, pair));

    return {
      ...pair,
      pricePerHour: existingRate?.pricePerHour ?? 0,
    };
  });
}

/** Turn the raw string input into a non-negative Firestore-safe price. */
function parsePriceInput(value: string) {
  if (value.trim() === '') return 0;

  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) return 0;

  return Math.max(parsedValue, 0);
}

export function TutorTeachingSubjectsSection({
  subjectSelections = [],
  subjectRates = [],
  activeCategory,
  subjectOptionsByCategory,
  isLoadingSubjects,
  onChangeSubjectSelections,
  onChangeSubjectRates,
  onChangeActiveCategory,
}: TutorTeachingSubjectsSectionProps) {
  const activeSubjects = getSubjectsForCategory(
    subjectSelections,
    activeCategory
  );

  const subjectOptions = useMemo(() => {
    return getSubjectsForQualification(
      subjectOptionsByCategory,
      activeCategory
    ).filter((subject) => !activeSubjects.includes(subject));
  }, [activeCategory, activeSubjects, subjectOptionsByCategory]);

  function replaceSubjectSelections(nextSelections: QualificationSubjectSelection[]) {
    /** Whenever selected subjects change, update pricing rows to match them. */
    onChangeSubjectSelections(nextSelections);
    onChangeSubjectRates(syncRatesToSelections(nextSelections, subjectRates));
  }

  function chooseCategory(category: QualificationCategory) {
    const alreadySelected = subjectSelections.some(
      (selection) => selection.category === category
    );

    if (alreadySelected) {
      onChangeActiveCategory(category);
      return;
    }

    replaceSubjectSelections([
      ...subjectSelections,
      { category, subjects: [] },
    ]);
    onChangeActiveCategory(category);
  }

  function removeCategory(category: QualificationCategory) {
    const nextSelections = subjectSelections.filter(
      (selection) => selection.category !== category
    );

    replaceSubjectSelections(nextSelections);

    if (activeCategory === category) {
      onChangeActiveCategory(nextSelections[0]?.category ?? '');
    }
  }


  function clearSubjectsForActiveCategory() {
    if (!activeCategory) return;

    const nextSelections = subjectSelections.map((selection) =>
      selection.category === activeCategory
        ? { ...selection, subjects: [] }
        : selection
    );

    replaceSubjectSelections(nextSelections);
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

    replaceSubjectSelections(nextSelections);
  }

  function clearSelection() {
    onChangeSubjectSelections([]);
    onChangeSubjectRates([]);
    onChangeActiveCategory('');
  }

  function updateRate(pair: TutorSubjectRate, value: string) {
    /** Use a number in state, but parse from a string to avoid leading-0 bugs. */
    onChangeSubjectRates(
      syncRatesToSelections(subjectSelections, subjectRates).map((rate) =>
        sameRatePair(rate, pair)
          ? { ...rate, pricePerHour: parsePriceInput(value) }
          : rate
      )
    );
  }

  const syncedRates = syncRatesToSelections(subjectSelections, subjectRates);

  return (
    <section className="grid gap-6">
      <div className="grid items-start gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-8">
          <QualificationSelector
            studiedSubjectSelections={subjectSelections}
            activeCategory={activeCategory}
            onChooseCategory={chooseCategory}
            onRemoveCategory={removeCategory}
            onClearAll={clearSelection}
            title="Select qualifications"
            description="Choose the qualifications you can teach. Black means you are currently editing that qualification."
            stepNumber={1}
          />
        </aside>

        <SubjectPicker
          activeCategory={activeCategory}
          subjectOptions={subjectOptions}
          activeSubjects={activeSubjects}
          onToggleSubject={toggleSubject}
          onClearActiveSubjects={clearSubjectsForActiveCategory}
          isLoadingSubjects={isLoadingSubjects}
          title="What subjects can you teach?"
          activeDescription={(category) =>
            `Choose the ${category} subjects you can tutor.`
          }
          emptyStateMessage="Choose a qualification first, then add the subjects you can teach."
          stepNumber={2}
        />
      </div>

      <Card>
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
            3
          </span>
          <h2 className="text-xl font-semibold">Rates per subject</h2>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Add a separate hourly rate for each qualification and subject you teach.
          This lets GCSE, A-level, and admissions support have different prices.
        </p>

        {syncedRates.length === 0 ? (
          <p className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
            Select subjects above before adding rates.
          </p>
        ) : (
          <div className="mt-5 grid gap-3">
            {syncedRates.map((rate) => (
              <label
                key={`${rate.qualification}-${rate.subject}`}
                className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-800 sm:grid-cols-[1fr_180px] sm:items-center"
              >
                <span>
                  {rate.qualification} · {rate.subject}
                </span>

                <span className="flex items-center gap-2">
                  <span className="text-slate-500">£</span>
                  <input
                    type="number"
                    min={0}
                    inputMode="decimal"
                    value={rate.pricePerHour === 0 ? '' : String(rate.pricePerHour)}
                    placeholder="e.g. 30"
                    onChange={(event) => updateRate(rate, event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
                  />
                </span>
              </label>
            ))}
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <Button type="button" variant="secondary" onClick={clearSelection}>
            Clear subjects
          </Button>
        </div>
      </Card>
    </section>
  );
}
