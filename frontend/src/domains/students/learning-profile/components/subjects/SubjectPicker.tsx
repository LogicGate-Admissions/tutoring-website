/**
 * File purpose: Small subject-selection UI/helper file. It keeps StudentSubjectsStep readable.
 */

import { Card } from '@/shared/components/Card';
import { SearchableMultiSelect } from '@/shared/components/SearchableMultiSelect';
import type { QualificationCategory } from '@/domains/students/learning-profile/types/learningProfile';

/**
 * Subject picker for the currently active qualification.
 *
 * It receives already-filtered options so the parent controls the selection
 * rules while this component stays purely presentational.
 */
export function SubjectPicker({
  activeCategory,
  subjectOptions,
  activeSubjects,
  onToggleSubject,
  onClearActiveSubjects,
  isLoadingSubjects = false,
  title = 'What subjects do you study?',
  activeDescription,
  inactiveDescription = 'Choose a qualification first.',
  emptyStateMessage = 'Choose a qualification first, then add the subjects you currently study.',
  stepNumber,
}: {
  activeCategory: QualificationCategory | '';
  subjectOptions: string[];
  activeSubjects: string[];
  onToggleSubject: (subject: string) => void;
  onClearActiveSubjects: () => void;
  isLoadingSubjects?: boolean;
  title?: string;
  activeDescription?: (category: QualificationCategory) => string;
  inactiveDescription?: string;
  emptyStateMessage?: string;
  stepNumber?: number;
}) {
  return (
    <Card>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            {stepNumber && (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                {stepNumber}
              </span>
            )}
            <h2 className="text-xl font-semibold">{title}</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {activeCategory
              ? activeDescription?.(activeCategory) ??
                `Choose the ${activeCategory} subjects you are currently studying.`
              : inactiveDescription}
          </p>
        </div>

        {activeCategory && activeSubjects.length > 0 && (
          <button
            type="button"
            onClick={onClearActiveSubjects}
            className="self-start rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-950 hover:text-slate-950"
          >
            Clear subjects
          </button>
        )}
      </div>

      {!activeCategory && (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
          {emptyStateMessage}
        </div>
      )}

      {activeCategory && (
        <div className="mt-5">
          {isLoadingSubjects && (
            <p className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Loading subjects from Firebase...
            </p>
          )}


          <SearchableMultiSelect
            label="Search subjects"
            options={subjectOptions}
            selectedOptions={activeSubjects}
            getOptionKey={(subject) => subject}
            getOptionLabel={(subject) => subject}
            onSelect={onToggleSubject}
            onRemove={onToggleSubject}
            emptyMessage={
              isLoadingSubjects
                ? 'Loading subjects...'
                : 'No subjects found for this qualification in Firebase.'
            }
          />

          {activeSubjects.length > 0 && (
            <p className="mt-4 text-sm text-slate-600">
              Next, choose which of these subjects you want tutoring for below.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
