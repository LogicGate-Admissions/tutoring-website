/**
 * File purpose: Small subject-selection UI/helper file. It keeps StudentSubjectsStep readable.
 */

import { Card } from '@/shared/components/Card';
import { cn } from '@/shared/utils/cn';
import { QUALIFICATION_CATEGORIES } from '@/domains/students/learning-profile/constants/learningProfileOptions';
import type { QualificationCategory } from '@/domains/students/learning-profile/types/learningProfile';

/**
 * Qualification selector.
 *
 * A category can be selected and active separately: selected means it is saved
 * in the profile draft, active means the subject picker is currently editing it.
 */
export function QualificationSelector({
  selectedCategories,
  activeCategory,
  onChooseCategory,
}: {
  selectedCategories: QualificationCategory[];
  activeCategory: QualificationCategory | '';
  onChooseCategory: (category: QualificationCategory) => void;
}) {
  return (
    <Card>
      <h2 className="text-xl font-semibold">Qualifications</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Select all qualifications that apply. Black means you are currently
        editing it.
      </p>

      <div className="mt-5 grid gap-3">
        {QUALIFICATION_CATEGORIES.map((category) => {
          const isSelected = selectedCategories.includes(category);
          const isActive = activeCategory === category;

          return (
            <button
              key={category}
              type="button"
              onClick={() => onChooseCategory(category)}
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
              <span className="block text-sm font-semibold">{category}</span>

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
  );
}
