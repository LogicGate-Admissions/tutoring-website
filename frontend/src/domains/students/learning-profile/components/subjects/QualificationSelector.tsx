/**
 * File purpose: Qualification-selection UI for the student subject onboarding step.
 */

import { Card } from '@/shared/components/Card';
import { cn } from '@/shared/utils/cn';
import { QUALIFICATION_CATEGORIES } from '@/domains/academic-options/services/academicOptionsService';
import type {
  QualificationCategory,
  QualificationSubjectSelection,
} from '@/domains/students/learning-profile/types/learningProfile';

function subjectCountForCategory(
  selections: QualificationSubjectSelection[],
  category: QualificationCategory
) {
  return (
    selections.find((selection) => selection.category === category)?.subjects
      .length ?? 0
  );
}

/**
 * Qualification selector.
 *
 * Selected qualifications are kept visible here so the main step does not need a
 * separate summary panel. Students can switch qualification, clear its subjects,
 * or remove it entirely from one place.
 */
export function QualificationSelector({
  studiedSubjectSelections = [],
  activeCategory,
  onChooseCategory,
  onRemoveCategory,
  onClearAll,
  title = 'Select qualifications',
  description = 'Choose the qualifications you study. Black means you are currently editing that qualification.',
}: {
  studiedSubjectSelections?: QualificationSubjectSelection[];
  activeCategory: QualificationCategory | '';
  onChooseCategory: (category: QualificationCategory) => void;
  onRemoveCategory: (category: QualificationCategory) => void;
  onClearAll: () => void;
  title?: string;
  description?: string;
}) {
  const selectedCategories = studiedSubjectSelections.map(
    (selection) => selection.category
  );
  return (
    <Card>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {description}
          </p>
        </div>

        {selectedCategories.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="self-start rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-950 hover:text-slate-950"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="mt-5 grid gap-3">
        {QUALIFICATION_CATEGORIES.map((category) => {
          const isSelected = selectedCategories.includes(category);
          const isActive = activeCategory === category;
          const selectedSubjectCount = subjectCountForCategory(
            studiedSubjectSelections,
            category
          );

          return (
            <div
              key={category}
              className={cn(
                'relative rounded-2xl border transition',
                isActive && 'border-slate-950 bg-slate-950 text-white shadow-sm',
                !isActive &&
                  isSelected &&
                  'border-slate-400 bg-slate-100 text-slate-950',
                !isActive &&
                  !isSelected &&
                  'border-slate-200 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50'
              )}
            >
              <button
                type="button"
                onClick={() => onChooseCategory(category)}
                className="w-full p-5 pr-24 text-left"
              >
                <span className="block text-sm font-semibold">{category}</span>

                {isActive && (
                  <span className="mt-2 block text-xs font-medium text-slate-300">
                    Currently editing
                  </span>
                )}

                {!isActive && isSelected && (
                  <span className="mt-2 block text-xs font-medium text-slate-500">
                    {selectedSubjectCount === 0
                      ? 'Selected, no subjects yet'
                      : `${selectedSubjectCount} subject${
                          selectedSubjectCount === 1 ? '' : 's'
                        } selected`}
                  </span>
                )}
              </button>

              {isSelected && (
                <button
                  type="button"
                  onClick={() => onRemoveCategory(category)}
                  className={cn(
                    'absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-medium transition',
                    isActive
                      ? 'bg-white/10 text-rose-100 hover:bg-white/15'
                      : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                  )}
                  aria-label={`Remove ${category}`}
                >
                  Remove
                </button>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
