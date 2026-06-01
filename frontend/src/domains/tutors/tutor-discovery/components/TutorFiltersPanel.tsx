'use client';

import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import {
  LEARNING_STYLE_OPTIONS,
  QUALIFICATION_CATEGORIES,
  SUBJECT_OPTIONS_BY_CATEGORY,
} from '@/domains/students/learning-profile/constants/learningProfileOptions';
import {
  MAX_TUTOR_PRICE_PER_HOUR,
  MIN_TUTOR_PRICE_PER_HOUR,
  TUTOR_SORT_OPTIONS,
  UNIVERSITY_FILTER_OPTIONS,
} from '@/domains/tutors/tutor-discovery/constants/tutorProfiles';
import type { TutorFilters } from '@/domains/tutors/tutor-discovery/types/tutor';

type TutorFiltersPanelProps = {
  filters: TutorFilters;
  onChange: (filters: TutorFilters) => void;
  onClear: () => void;
  onResetToOnboarding: () => void;
};

type DropdownMultiSelectProps = {
  label: string;
  emptyLabel: string;
  options: string[];
  selectedValues: string[];
  disabled?: boolean;
  disabledMessage?: string;
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
};

/**
 * Dropdown-based multi-select.
 *
 * It behaves like a normal dropdown, but every selected option becomes
 * a removable pill. Selected options are removed from the dropdown so
 * the user cannot add the same filter twice.
 */
function DropdownMultiSelect({
  label,
  emptyLabel,
  options,
  selectedValues,
  disabled = false,
  disabledMessage,
  onAdd,
  onRemove,
}: DropdownMultiSelectProps) {
  const availableOptions = options.filter(
    (option) => !selectedValues.includes(option)
  );

  return (
    <div>
      <p className="text-sm font-medium text-slate-700">{label}</p>

      {selectedValues.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedValues.map((value) => (
            <button key={value} type="button" onClick={() => onRemove(value)}>
              <Badge className="border-slate-950 bg-slate-950 text-white">
                {value} ×
              </Badge>
            </button>
          ))}
        </div>
      )}

      <select
        value=""
        disabled={disabled || availableOptions.length === 0}
        onChange={(event) => {
          const selectedValue = event.target.value;
          if (!selectedValue) return;
          onAdd(selectedValue);
        }}
        className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
      >
        <option value="">
          {disabled
            ? disabledMessage ?? emptyLabel
            : availableOptions.length === 0
              ? 'All options selected'
              : emptyLabel}
        </option>

        {availableOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function uniqueStrings(values: string[]) {
  return values.filter((value, index) => values.indexOf(value) === index);
}

/**
 * Subjects depend on the levels the student has selected.
 *
 * Example:
 * selected levels: GCSE, A-level
 * available subjects: GCSE subjects + A-level subjects
 */
function getSubjectOptionsForLevels(levels: string[]) {
  return uniqueStrings(
    levels.flatMap((level) => {
      const typedLevel = level as keyof typeof SUBJECT_OPTIONS_BY_CATEGORY;
      return SUBJECT_OPTIONS_BY_CATEGORY[typedLevel] ?? [];
    })
  ).sort();
}

/**
 * Left-side filter panel for student tutor discovery.
 *
 * These filters start from onboarding values, but editing them here does not
 * change the student's saved onboarding profile.
 */
export function TutorFiltersPanel({
  filters,
  onChange,
  onClear,
  onResetToOnboarding,
}: TutorFiltersPanelProps) {
  const subjectOptions = getSubjectOptionsForLevels(filters.levels);

  function addArrayValue(
    key: 'subjects' | 'levels' | 'learningStyles' | 'universities',
    value: string
  ) {
    if (filters[key].includes(value)) return;

    /**
     * If a level is added, subjects stay as they are.
     * New subjects simply become available in the subject dropdown.
     */
    onChange({
      ...filters,
      [key]: [...filters[key], value],
    });
  }

  function removeArrayValue(
    key: 'subjects' | 'levels' | 'learningStyles' | 'universities',
    value: string
  ) {
    const nextValues = filters[key].filter((item) => item !== value);

    /**
     * If a level is removed, remove any selected subjects that no longer
     * belong to the remaining selected levels.
     */
    if (key === 'levels') {
      const remainingSubjectOptions = getSubjectOptionsForLevels(nextValues);

      onChange({
        ...filters,
        levels: nextValues,
        subjects: filters.subjects.filter((subject) =>
          remainingSubjectOptions.includes(subject)
        ),
      });

      return;
    }

    onChange({
      ...filters,
      [key]: nextValues,
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

      <div className="mt-4">
        <Button
          variant="secondary"
          onClick={onResetToOnboarding}
          className="w-full px-4 py-2"
        >
          Reset to onboarding
        </Button>
      </div>

      <div className="mt-6 grid gap-6">
        <DropdownMultiSelect
          label="Levels"
          emptyLabel="Add a level"
          options={[...QUALIFICATION_CATEGORIES]}
          selectedValues={filters.levels}
          onAdd={(value) => addArrayValue('levels', value)}
          onRemove={(value) => removeArrayValue('levels', value)}
        />

        <DropdownMultiSelect
          label="Subjects"
          emptyLabel="Add a subject"
          options={subjectOptions}
          selectedValues={filters.subjects}
          disabled={filters.levels.length === 0}
          disabledMessage="Select level(s) first"
          onAdd={(value) => addArrayValue('subjects', value)}
          onRemove={(value) => removeArrayValue('subjects', value)}
        />

        <DropdownMultiSelect
          label="Learning styles"
          emptyLabel="Add a learning style"
          options={LEARNING_STYLE_OPTIONS.map((style) => style.label)}
          selectedValues={filters.learningStyles}
          onAdd={(value) => addArrayValue('learningStyles', value)}
          onRemove={(value) => removeArrayValue('learningStyles', value)}
        />

        <DropdownMultiSelect
          label="Universities"
          emptyLabel="Add a university"
          options={UNIVERSITY_FILTER_OPTIONS}
          selectedValues={filters.universities}
          onAdd={(value) => addArrayValue('universities', value)}
          onRemove={(value) => removeArrayValue('universities', value)}
        />

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Sort by
          <select
            value={filters.sortBy}
            onChange={(event) =>
              onChange({
                ...filters,
                sortBy: event.target.value as TutorFilters['sortBy'],
              })
            }
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
          >
            {TUTOR_SORT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-2 text-sm font-medium text-slate-700">
          <div className="flex items-center justify-between gap-3">
            <span>Min hourly rate</span>
            <span className="font-semibold text-slate-950">
              £{filters.minPricePerHour}
            </span>
          </div>

          <input
            type="range"
            min={MIN_TUTOR_PRICE_PER_HOUR}
            max={MAX_TUTOR_PRICE_PER_HOUR}
            value={filters.minPricePerHour}
            onChange={(event) =>
              onChange({
                ...filters,
                minPricePerHour: Math.min(
                  Number(event.target.value),
                  filters.maxPricePerHour
                ),
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

          <div className="mt-3 flex items-center justify-between gap-3">
            <span>Max hourly rate</span>
            <span className="font-semibold text-slate-950">
              £{filters.maxPricePerHour}
            </span>
          </div>

          <input
            type="range"
            min={MIN_TUTOR_PRICE_PER_HOUR}
            max={MAX_TUTOR_PRICE_PER_HOUR}
            value={filters.maxPricePerHour}
            onChange={(event) =>
              onChange({
                ...filters,
                maxPricePerHour: Math.max(
                  Number(event.target.value),
                  filters.minPricePerHour
                ),
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
      </div>
    </aside>
  );
}