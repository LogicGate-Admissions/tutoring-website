'use client';

import { Button } from '@/shared/components/Button';
import { Badge } from '@/shared/components/Badge';
import {
  LEARNING_STYLE_OPTIONS,
  QUALIFICATION_CATEGORIES,
  SUBJECT_OPTIONS_BY_CATEGORY,
} from '@/domains/students/learning-profile/constants/learningProfileOptions';
import {
  TUTOR_SORT_OPTIONS,
  UNIVERSITY_FILTER_OPTIONS,
  MAX_TUTOR_PRICE_PER_HOUR,
  MIN_TUTOR_PRICE_PER_HOUR,
} from '@/domains/tutors/tutor-discovery/constants/tutorProfiles';
import type { TutorFilters } from '@/domains/tutors/tutor-discovery/types/tutor';

const ALL_SUBJECT_OPTIONS = Array.from(
  new Set(Object.values(SUBJECT_OPTIONS_BY_CATEGORY).flat())
).sort();

type TutorFiltersPanelProps = {
  filters: TutorFilters;
  onChange: (filters: TutorFilters) => void;
  onClear: () => void;
};

/**
 * Left-side filter panel for student tutor discovery.
 *
 * This owns only filter controls. It does not create trial requests and it does
 * not know how tutor cards are rendered, which keeps the component focused.
 */
export function TutorFiltersPanel({
  filters,
  onChange,
  onClear,
}: TutorFiltersPanelProps) {
  function toggleSubject(subject: string) {
    onChange({
      ...filters,
      subjects: filters.subjects.includes(subject)
        ? filters.subjects.filter((item) => item !== subject)
        : [...filters.subjects, subject],
    });
  }

  return (
    <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            Filters
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
            Find your match
          </h2>
        </div>

        <Button variant="ghost" onClick={onClear} className="px-3 py-2">
          Clear
        </Button>
      </div>

      <div className="mt-6 grid gap-5">
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Level
          <select
            value={filters.level}
            onChange={(event) => onChange({ ...filters, level: event.target.value })}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
          >
            <option value="">Any level</option>
            {QUALIFICATION_CATEGORIES.map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Learning style
          <select
            value={filters.learningStyle}
            onChange={(event) =>
              onChange({ ...filters, learningStyle: event.target.value })
            }
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
          >
            <option value="">Any style</option>
            {LEARNING_STYLE_OPTIONS.map((style) => (
              <option key={style.label} value={style.label}>{style.label}</option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          University
          <select
            value={filters.university}
            onChange={(event) =>
              onChange({ ...filters, university: event.target.value })
            }
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
          >
            <option value="">Any university</option>
            {UNIVERSITY_FILTER_OPTIONS.map((university) => (
              <option key={university} value={university}>{university}</option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Sort by
          <select
            value={filters.sortBy}
            onChange={(event) =>
              onChange({ ...filters, sortBy: event.target.value as TutorFilters['sortBy'] })
            }
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
          >
            {TUTOR_SORT_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>

        <div className="grid gap-2 text-sm font-medium text-slate-700">
          <div className="flex items-center justify-between gap-3">
            <span>Min hourly rate</span>
            <span className="font-semibold text-slate-950">£{filters.minPricePerHour}</span>
          </div>

          <input
            type="range"
            min={MIN_TUTOR_PRICE_PER_HOUR}
            max={MAX_TUTOR_PRICE_PER_HOUR}
            value={filters.minPricePerHour}
            onChange={(event) =>
              onChange({
                ...filters,
                minPricePerHour: Math.min(Number(event.target.value), filters.maxPricePerHour),
              })
            }
          />

          <input
            type="number"
            min={MIN_TUTOR_PRICE_PER_HOUR}
            max={MAX_TUTOR_PRICE_PER_HOUR}
            value={filters.minPricePerHour}
            onChange={(event) => {
              const typedValue = Number(event.target.value);
              onChange({
                ...filters,
                minPricePerHour: Number.isNaN(typedValue)
                  ? MIN_TUTOR_PRICE_PER_HOUR
                  : Math.min(typedValue, filters.maxPricePerHour),
              });
            }}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
          />

          <div className="flex items-center justify-between gap-3">
            <span>Max hourly rate</span>
            <span className="font-semibold text-slate-950">£{filters.maxPricePerHour}</span>
          </div>

          <input
            type="range"
            min={MIN_TUTOR_PRICE_PER_HOUR}
            max={MAX_TUTOR_PRICE_PER_HOUR}
            value={filters.maxPricePerHour}
            onChange={(event) =>
              onChange({
                ...filters,
                maxPricePerHour: Math.max(Number(event.target.value), filters.minPricePerHour),
              })
            }
          />

          <input
            type="number"
            min={MIN_TUTOR_PRICE_PER_HOUR}
            max={MAX_TUTOR_PRICE_PER_HOUR}
            value={filters.maxPricePerHour}
            onChange={(event) => {
              const typedValue = Number(event.target.value);
              onChange({
                ...filters,
                maxPricePerHour: Number.isNaN(typedValue)
                  ? MAX_TUTOR_PRICE_PER_HOUR
                  : Math.max(typedValue, filters.minPricePerHour),
              });
            }}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
          />
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700">Subjects</p>
          <div className="mt-3 flex max-h-64 flex-wrap gap-2 overflow-y-auto pr-1">
            {ALL_SUBJECT_OPTIONS.map((subject) => (
              <button
                key={subject}
                type="button"
                onClick={() => toggleSubject(subject)}
              >
                <Badge
                  className={
                    filters.subjects.includes(subject)
                      ? 'border-slate-950 bg-slate-950 text-white'
                      : 'hover:border-slate-400'
                  }
                >
                  {subject}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
