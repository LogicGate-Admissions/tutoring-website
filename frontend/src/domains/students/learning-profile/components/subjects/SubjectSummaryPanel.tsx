/**
 * File purpose: Summary panel for the subjects selected for tutor matching.
 */

import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { cn } from '@/shared/utils/cn';
import type {
  QualificationCategory,
  QualificationSubjectSelection,
} from '@/domains/students/learning-profile/types/learningProfile';

/**
 * Left summary panel for the tutoring subjects that will drive tutor matching.
 *
 * It doubles as navigation: clicking a qualification makes that section active
 * for editing in the main subject picker.
 */
export function SubjectSummaryPanel({
  subjectSelections,
  activeCategory,
  title = 'Currently selected',
  description = 'Your choices are grouped by qualification.',
  emptyMessage = 'No qualifications or subjects selected yet.',
  canClear,
  onClearSelection,
  onSelectCategory,
  onRemoveCategory,
}: {
  subjectSelections: QualificationSubjectSelection[];
  activeCategory: QualificationCategory | '';
  title?: string;
  description?: string;
  emptyMessage?: string;
  canClear?: boolean;
  onClearSelection: () => void;
  onSelectCategory: (category: QualificationCategory) => void;
  onRemoveCategory: (category: QualificationCategory) => void;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {description}
          </p>
        </div>

        <Button
          variant="ghost"
          disabled={!(canClear ?? subjectSelections.length > 0)}
          onClick={onClearSelection}
          className="shrink-0 px-4 py-2"
        >
          Clear
        </Button>
      </div>

      <div className="mt-5 grid gap-4">
        {subjectSelections.length === 0 && (
          <p className="text-sm text-slate-500">{emptyMessage}</p>
        )}

        {subjectSelections.map((selection) => (
          <div
            key={selection.category}
            className={cn(
              'rounded-2xl border p-4',
              activeCategory === selection.category
                ? 'border-slate-950 bg-white'
                : 'border-slate-200 bg-slate-50'
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => onSelectCategory(selection.category)}
                className="text-left text-sm font-semibold text-slate-950 hover:underline"
              >
                {selection.category}
              </button>

              <button
                type="button"
                onClick={() => onRemoveCategory(selection.category)}
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
  );
}
