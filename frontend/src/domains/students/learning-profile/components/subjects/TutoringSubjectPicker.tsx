/**
 * File purpose: Lets students choose tutoring needs from the subjects they study.
 */

import { Card } from '@/shared/components/Card';
import { cn } from '@/shared/utils/cn';
import type {
  QualificationCategory,
  QualificationSubjectSelection,
} from '@/domains/students/learning-profile/types/learningProfile';

function selectedTutoringSubjectsForCategory(
  selections: QualificationSubjectSelection[],
  category: QualificationCategory
) {
  return (
    selections.find((selection) => selection.category === category)?.subjects ??
    []
  );
}

/**
 * Students first say what they study. This picker then narrows that down to the
 * subjects they actually want tutoring for, avoiding misleading tutor matches.
 */
export function TutoringSubjectPicker({
  studiedSubjectSelections,
  tutoringSubjectSelections,
  onToggleSubject,
  stepNumber,
}: {
  studiedSubjectSelections: QualificationSubjectSelection[];
  tutoringSubjectSelections: QualificationSubjectSelection[];
  onToggleSubject: (category: QualificationCategory, subject: string) => void;
  stepNumber?: number;
}) {
  const studiedSubjects = studiedSubjectSelections.filter(
    (selection) => selection.subjects.length > 0
  );

  return (
    <Card>
      <div>
        <div className="flex items-center gap-3">
          {stepNumber && (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
              {stepNumber}
            </span>
          )}
          <h2 className="text-xl font-semibold">What do you want tutoring for?</h2>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Select from the subjects you study. These choices are used to match you
          with tutors.
        </p>
      </div>

      {studiedSubjects.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
          Add at least one subject above before choosing what you want tutoring
          for.
        </div>
      ) : (
        <div className="mt-5 grid gap-4">
          {studiedSubjects.map((selection) => {
            const selectedSubjects = selectedTutoringSubjectsForCategory(
              tutoringSubjectSelections,
              selection.category
            );

            return (
              <section
                key={selection.category}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <h3 className="text-sm font-semibold text-slate-950">
                  {selection.category}
                </h3>

                <div className="mt-3 flex flex-wrap gap-2">
                  {selection.subjects.map((subject) => {
                    const isSelected = selectedSubjects.includes(subject);

                    return (
                      <button
                        key={`${selection.category}-${subject}`}
                        type="button"
                        onClick={() => onToggleSubject(selection.category, subject)}
                        className={cn(
                          'rounded-full border px-3 py-2 text-sm font-medium transition',
                          isSelected
                            ? 'border-slate-950 bg-slate-950 text-white'
                            : 'border-slate-300 bg-white text-slate-700 hover:border-slate-950'
                        )}
                      >
                        {subject}
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </Card>
  );
}
