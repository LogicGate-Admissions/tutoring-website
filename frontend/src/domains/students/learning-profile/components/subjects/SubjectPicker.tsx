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
  isLoadingSubjects = false,
}: {
  activeCategory: QualificationCategory | '';
  subjectOptions: string[];
  activeSubjects: string[];
  onToggleSubject: (subject: string) => void;
  isLoadingSubjects?: boolean;
}) {
  return (
    <Card>
      <div>
        <h2 className="text-xl font-semibold">Subjects</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {activeCategory
            ? `Choose subjects for ${activeCategory}.`
            : 'Choose a qualification first.'}
        </p>
      </div>

      {!activeCategory && (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
          Choose a qualification on the left to start selecting subjects.
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
              Selected subjects are shown here and in the summary on the left.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
