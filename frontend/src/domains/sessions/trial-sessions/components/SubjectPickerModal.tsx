'use client';

import type { RequestedTutoringSubject } from '@/domains/sessions/trial-sessions/types/trialSession';
import type { Tutor } from '@/domains/tutors/tutor-discovery/types/tutor';
import { formatStoredSubjectLabel } from '@/shared/utils/subjectLabels';

export type SubjectPickerChoice = RequestedTutoringSubject & {
  key: string;
  pricePerHour?: number;
};

export function SubjectPickerModal({
  tutor,
  selectedSubjectKeys,
  onToggle,
  busy,
  onConfirm,
  onCancel,
}: {
  tutor: Tutor;
  selectedSubjectKeys: string[];
  onToggle: (key: string) => void;
  busy: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}) {
  const choices = getSubjectPickerChoices(tutor);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <h2 className="text-base font-semibold text-slate-950">What subjects do you need help with?</h2>
        <p className="mt-1 text-sm text-slate-500">
          Choose one or more subjects you want {tutor.name} to teach you. Each option includes the level.
        </p>

        <div className="mt-4 grid max-h-72 gap-2 overflow-y-auto pr-1">
          {choices.map((choice) => {
            const isSelected = selectedSubjectKeys.includes(choice.key);

            return (
              <button
                key={choice.key}
                type="button"
                onClick={() => onToggle(choice.key)}
                className={`w-full rounded-2xl border px-4 py-2.5 text-left text-sm font-medium transition ${
                  isSelected
                    ? 'border-slate-950 bg-slate-950 text-white'
                    : 'border-slate-200 bg-white text-slate-800 hover:border-slate-400'
                }`}
              >
                <span>{choice.label}</span>
                {typeof choice.pricePerHour === 'number' ? (
                  <span className={`ml-2 text-xs ${isSelected ? 'text-slate-200' : 'text-slate-500'}`}>
                    £{choice.pricePerHour}/hr
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={selectedSubjectKeys.length === 0 || busy}
            onClick={() => void onConfirm()}
            className="flex-1 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            {busy ? 'Sending…' : 'Request match'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function getSubjectPickerChoices(tutor: Tutor): SubjectPickerChoice[] {
  const subjectRates = tutor.subjectRates ?? [];

  if (subjectRates.length > 0) {
    return dedupeSubjectChoices(
      subjectRates.map((rate) => ({
        key: `${rate.qualification}:${rate.subject}`,
        level: rate.qualification,
        subject: rate.subject,
        label: formatStoredSubjectLabel({ level: rate.qualification, subject: rate.subject }),
        pricePerHour: rate.pricePerHour,
      }))
    );
  }

  const levels = tutor.levels.length > 0 ? tutor.levels : [''];
  const subjects = tutor.subjects.length > 0 ? tutor.subjects : ['Not specified'];

  return dedupeSubjectChoices(
    levels.flatMap((level) =>
      subjects.map((subject) => ({
        key: `${level || 'level'}:${subject}`,
        level,
        subject,
        label: formatStoredSubjectLabel({ level, subject }) || subject,
      }))
    )
  );
}

export function dedupeSubjectChoices(choices: SubjectPickerChoice[]): SubjectPickerChoice[] {
  const seen = new Set<string>();

  return choices.filter((choice) => {
    const key = `${choice.level}:${choice.subject}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function normaliseRequestedSubjects(
  choices: SubjectPickerChoice[]
): RequestedTutoringSubject[] {
  return choices.map(({ level, subject, label }) => ({
    level,
    subject,
    label: formatStoredSubjectLabel({ level, subject, label }),
  }));
}
