'use client';

/**
 * File purpose: Application source file. Comments explain what this file owns and what should stay elsewhere.
 */

import { Button } from '@/shared/components/Button';
import { SearchableMultiSelect } from '@/shared/components/SearchableMultiSelect';
import {
  LEARNING_STYLE_OPTIONS,
  QUALIFICATION_CATEGORIES,
} from '@/domains/students/learning-profile/constants/learningProfileOptions';
import {
  TUTOR_SORT_OPTIONS,
  UNIVERSITY_FILTER_OPTIONS,
} from '@/domains/tutors/tutor-discovery/constants/tutorProfiles';
import type { QualificationCategory } from '@/domains/students/learning-profile/types/learningProfile';
import type {
  TutorFilters,
  TutorSubjectFilter,
} from '@/domains/tutors/tutor-discovery/types/tutor';
import { PriceRangeControls } from '@/domains/tutors/tutor-discovery/components/filters/PriceRangeControls';
import {
  tutorSubjectFilterKey,
  tutorSubjectFilterLabel,
} from '@/domains/tutors/tutor-discovery/utils/tutorDisplay';
import {
  getSubjectOptionsForLevels,
  subjectFiltersMatch,
} from '@/domains/tutors/tutor-discovery/utils/tutorFilterOptions';

type TutorFiltersPanelProps = {
  filters: TutorFilters;
  onChange: (filters: TutorFilters) => void;
  onClear: () => void;
  onResetToOnboarding?: () => void;
  onSaveToOnboarding?: () => void;
};

/**
 * Left-side filter panel for student tutor discovery.
 *
 * This component only edits temporary browsing filters. It does not fetch tutor
 * data or save profile data directly. That separation keeps the page easier to
 * test: the panel emits changes, while TutorDiscoveryPage decides what to do
 * with those changes.
 */
export function TutorFiltersPanel({
  filters,
  onChange,
  onClear,
  onResetToOnboarding,
  onSaveToOnboarding,
}: TutorFiltersPanelProps) {
  function addLevel(level: QualificationCategory) {
    if (filters.levels.includes(level)) return;

    onChange({ ...filters, levels: [...filters.levels, level] });
  }

  function removeLevel(level: QualificationCategory) {
    /**
     * Removing a level must also remove subjects from that level, otherwise the
     * user could have a hidden GCSE Maths filter active after removing GCSE.
     */
    const nextLevels = filters.levels.filter((item) => item !== level);

    onChange({
      ...filters,
      levels: nextLevels,
      subjects: filters.subjects.filter((subject) => subject.level !== level),
    });
  }

  function addSubject(subject: TutorSubjectFilter) {
    if (filters.subjects.some((selected) => subjectFiltersMatch(selected, subject))) {
      return;
    }

    onChange({ ...filters, subjects: [...filters.subjects, subject] });
  }

  function removeSubject(subject: TutorSubjectFilter) {
    onChange({
      ...filters,
      subjects: filters.subjects.filter(
        (selected) => !subjectFiltersMatch(selected, subject)
      ),
    });
  }

  function addStringFilter(
    key: 'learningStyles' | 'universities',
    value: string
  ) {
    if (filters[key].includes(value)) return;

    onChange({ ...filters, [key]: [...filters[key], value] });
  }

  function removeStringFilter(
    key: 'learningStyles' | 'universities',
    value: string
  ) {
    onChange({
      ...filters,
      [key]: filters[key].filter((item) => item !== value),
    });
  }

  function updateMinimumPrice(value: number) {
    // Clamp so the range never becomes impossible.
    onChange({
      ...filters,
      minPricePerHour: Math.min(value, filters.maxPricePerHour),
    });
  }

  function updateMaximumPrice(value: number) {
    // Clamp so the range never becomes impossible.
    onChange({
      ...filters,
      maxPricePerHour: Math.max(value, filters.minPricePerHour),
    });
  }

  return (
    <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <FilterPanelHeader onClear={onClear} />

      {(onResetToOnboarding || onSaveToOnboarding) && (
        <ProfileFilterActions
          onResetToOnboarding={onResetToOnboarding}
          onSaveToOnboarding={onSaveToOnboarding}
        />
      )}

      <div className="mt-6 grid gap-6">
        <SearchableMultiSelect
          label="Levels"
          options={[...QUALIFICATION_CATEGORIES]}
          selectedOptions={filters.levels}
          getOptionKey={(level) => level}
          getOptionLabel={(level) => level}
          onSelect={addLevel}
          onRemove={removeLevel}
          emptyMessage="No levels found."
        />

        <SearchableMultiSelect
          label="Subjects"
          options={getSubjectOptionsForLevels(filters.levels)}
          selectedOptions={filters.subjects}
          getOptionKey={tutorSubjectFilterKey}
          getOptionLabel={tutorSubjectFilterLabel}
          onSelect={addSubject}
          onRemove={removeSubject}
          disabled={filters.levels.length === 0}
          disabledMessage="Select level(s) first."
          emptyMessage="No subjects found."
        />

        <SearchableMultiSelect
          label="Learning styles"
          options={LEARNING_STYLE_OPTIONS.map((style) => style.label)}
          selectedOptions={filters.learningStyles}
          getOptionKey={(style) => style}
          getOptionLabel={(style) => style}
          onSelect={(style) => addStringFilter('learningStyles', style)}
          onRemove={(style) => removeStringFilter('learningStyles', style)}
          emptyMessage="No learning styles found."
        />

        <SearchableMultiSelect
          label="Universities"
          options={UNIVERSITY_FILTER_OPTIONS}
          selectedOptions={filters.universities}
          getOptionKey={(university) => university}
          getOptionLabel={(university) => university}
          onSelect={(university) => addStringFilter('universities', university)}
          onRemove={(university) => removeStringFilter('universities', university)}
          emptyMessage="No universities found."
        />

        <SortControl
          value={filters.sortBy}
          onChange={(sortBy) => onChange({ ...filters, sortBy })}
        />

        <PriceRangeControls
          minPrice={filters.minPricePerHour}
          maxPrice={filters.maxPricePerHour}
          onMinPriceChange={updateMinimumPrice}
          onMaxPriceChange={updateMaximumPrice}
        />
      </div>
    </aside>
  );
}

function FilterPanelHeader({ onClear }: { onClear: () => void }) {
  return (
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
  );
}

function ProfileFilterActions({
  onResetToOnboarding,
  onSaveToOnboarding,
}: {
  onResetToOnboarding?: () => void;
  onSaveToOnboarding?: () => void;
}) {
  return (
    <div className="mt-4 grid gap-3">
      {onResetToOnboarding && (
        <Button
          variant="secondary"
          onClick={onResetToOnboarding}
          className="w-full px-4 py-2"
        >
          Reset to profile
        </Button>
      )}

      {onSaveToOnboarding && (
        <Button
          variant="secondary"
          onClick={onSaveToOnboarding}
          className="w-full px-4 py-2"
        >
          Save filters to profile
        </Button>
      )}
    </div>
  );
}

function SortControl({
  value,
  onChange,
}: {
  value: TutorFilters['sortBy'];
  onChange: (value: TutorFilters['sortBy']) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      Sort by
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as TutorFilters['sortBy'])}
        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
      >
        {TUTOR_SORT_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
