'use client';

import { useMemo, useState } from 'react';
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

const ALL_LEVEL_OPTIONS = [...QUALIFICATION_CATEGORIES];

const ALL_LEARNING_STYLE_OPTIONS = LEARNING_STYLE_OPTIONS.map(
  (style) => style.label
);

type TutorFiltersPanelProps = {
  filters: TutorFilters;
  onChange: (filters: TutorFilters) => void;
  onClear: () => void;
  onResetToOnboarding: () => void;
};

type MultiSelectFilterProps = {
  label: string;
  values: string[];
  selectedValues: string[];
  onToggle: (value: string) => void;
};

/**
 * Reusable searchable multi-select section.
 *
 * Used for subjects, levels, learning styles, and universities.
 */
function MultiSelectFilter({
  label,
  values,
  selectedValues,
  onToggle,
}: MultiSelectFilterProps) {
  const [search, setSearch] = useState('');

  const filteredValues = useMemo(() => {
    const normalisedSearch = search.trim().toLowerCase();

    if (!normalisedSearch) return values;

    return values.filter((value) =>
      value.toLowerCase().includes(normalisedSearch)
    );
  }, [search, values]);

  return (
    <div>
      <p className="text-sm font-medium text-slate-700">{label}</p>

      {selectedValues.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedValues.map((value) => (
            <button key={value} type="button" onClick={() => onToggle(value)}>
              <Badge className="border-slate-950 bg-slate-950 text-white">
                {value} ×
              </Badge>
            </button>
          ))}
        </div>
      )}

      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
      />

      <div className="mt-3 flex max-h-40 flex-wrap gap-2 overflow-y-auto pr-1">
        {filteredValues.map((value) => {
          const isSelected = selectedValues.includes(value);

          return (
            <button key={value} type="button" onClick={() => onToggle(value)}>
              <Badge
                className={
                  isSelected
                    ? 'border-slate-950 bg-slate-950 text-white'
                    : 'hover:border-slate-400'
                }
              >
                {value}
              </Badge>
            </button>
          );
        })}
      </div>

      {filteredValues.length === 0 && (
        <p className="mt-3 text-sm text-slate-500">No options found.</p>
      )}
    </div>
  );
}

/**
 * Left-side filter panel for student tutor discovery.
 *
 * These filters are independent from onboarding. They start from onboarding
 * values, but editing them here does not update the onboarding profile.
 */
export function TutorFiltersPanel({
  filters,
  onChange,
  onClear,
  onResetToOnboarding,
}: TutorFiltersPanelProps) {
  function toggleArrayValue(key: keyof Pick<
    TutorFilters,
    'subjects' | 'levels' | 'learningStyles' | 'universities'
  >, value: string) {
    const currentValues = filters[key];

    onChange({
      ...filters,
      [key]: currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value],
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
        <MultiSelectFilter
          label="Subjects"
          values={ALL_SUBJECT_OPTIONS}
          selectedValues={filters.subjects}
          onToggle={(value) => toggleArrayValue('subjects', value)}
        />

        <MultiSelectFilter
          label="Levels"
          values={ALL_LEVEL_OPTIONS}
          selectedValues={filters.levels}
          onToggle={(value) => toggleArrayValue('levels', value)}
        />

        <MultiSelectFilter
          label="Learning styles"
          values={ALL_LEARNING_STYLE_OPTIONS}
          selectedValues={filters.learningStyles}
          onToggle={(value) => toggleArrayValue('learningStyles', value)}
        />

        <MultiSelectFilter
          label="Universities"
          values={UNIVERSITY_FILTER_OPTIONS}
          selectedValues={filters.universities}
          onToggle={(value) => toggleArrayValue('universities', value)}
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

          <div className="flex items-center justify-between gap-3">
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