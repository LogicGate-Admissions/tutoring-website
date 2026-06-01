'use client';

import { useMemo, useState } from 'react';
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
import type { QualificationCategory } from '@/domains/students/learning-profile/types/learningProfile';
import type {
  TutorFilters,
  TutorSubjectFilter,
} from '@/domains/tutors/tutor-discovery/types/tutor';

type TutorFiltersPanelProps = {
  filters: TutorFilters;
  onChange: (filters: TutorFilters) => void;
  onClear: () => void;
  onResetToOnboarding: () => void;
  onSaveToOnboarding: () => void;
};

type DropdownMultiSelectProps = {
  label: string;
  emptyLabel: string;
  options: string[];
  selectedValues: string[];
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
};

type SubjectOption = {
  level: QualificationCategory;
  subject: string;
};

type SubjectDropdownProps = {
  selectedLevels: QualificationCategory[];
  selectedSubjects: TutorSubjectFilter[];
  onAdd: (subject: TutorSubjectFilter) => void;
  onRemove: (subject: TutorSubjectFilter) => void;
};

function subjectOptionId(option: SubjectOption) {
  return `${option.level}|||${option.subject}`;
}

function subjectFilterId(subjectFilter: TutorSubjectFilter) {
  return `${subjectFilter.level}|||${subjectFilter.subject}`;
}

function subjectOptionLabel(option: SubjectOption) {
  return `${option.level} · ${option.subject}`;
}

/**
 * Dropdown-based multi-select for normal string filters.
 *
 * Example:
 * - levels
 * - learning styles
 * - universities
 */
function SearchableDropdownMultiSelect({
  label,
  emptyLabel,
  options,
  selectedValues,
  onAdd,
  onRemove,
}: DropdownMultiSelectProps) {
  const [search, setSearch] = useState('');

  const availableOptions = useMemo(() => {
    const normalisedSearch = search.trim().toLowerCase();

    return options
      .filter((option) => !selectedValues.includes(option))
      .filter((option) =>
        normalisedSearch
          ? option.toLowerCase().includes(normalisedSearch)
          : true
      );
  }, [options, search, selectedValues]);

  function addSelectedValue(value: string) {
    if (!value) return;

    onAdd(value);
    setSearch('');
  }

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

      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
      />

      <select
        value=""
        disabled={availableOptions.length === 0}
        onChange={(event) => addSelectedValue(event.target.value)}
        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
      >
        <option value="">
          {availableOptions.length === 0 ? 'No options available' : emptyLabel}
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

/**
 * Creates subject options from the selected levels.
 *
 * Example:
 * selected levels: GCSE, A-level
 *
 * dropdown options:
 * GCSE · Maths
 * GCSE · Physics
 * A-level · Maths
 * A-level · Physics
 */
function getSubjectOptionsForLevels(levels: QualificationCategory[]) {
  return levels.flatMap((level) =>
    SUBJECT_OPTIONS_BY_CATEGORY[level].map((subject) => ({
      level,
      subject,
    }))
  );
}

/**
 * Level-specific subject dropdown.
 *
 * This prevents duplicate-looking options such as two separate "Maths" items.
 * Instead, the user sees "GCSE · Maths" and "A-level · Maths".
 */
function SubjectDropdown({
  selectedLevels,
  selectedSubjects,
  onAdd,
  onRemove,
}: SubjectDropdownProps) {
  const [search, setSearch] = useState('');

  const subjectOptions = getSubjectOptionsForLevels(selectedLevels);
  const selectedSubjectIds = selectedSubjects.map(subjectFilterId);

  const availableSubjectOptions = useMemo(() => {
    const normalisedSearch = search.trim().toLowerCase();

    return subjectOptions
      .filter((option) => !selectedSubjectIds.includes(subjectOptionId(option)))
      .filter((option) =>
        normalisedSearch
          ? subjectOptionLabel(option).toLowerCase().includes(normalisedSearch)
          : true
      );
  }, [search, selectedSubjectIds, subjectOptions]);

  function addSelectedSubject(selectedId: string) {
    if (!selectedId) return;

    const selectedOption = availableSubjectOptions.find(
      (option) => subjectOptionId(option) === selectedId
    );

    if (!selectedOption) return;

    onAdd(selectedOption);
    setSearch('');
  }

  return (
    <div>
      <p className="text-sm font-medium text-slate-700">Subjects</p>

      {selectedSubjects.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedSubjects.map((selectedSubject) => (
            <button
              key={subjectFilterId(selectedSubject)}
              type="button"
              onClick={() => onRemove(selectedSubject)}
            >
              <Badge className="border-slate-950 bg-slate-950 text-white">
                {selectedSubject.level} · {selectedSubject.subject} ×
              </Badge>
            </button>
          ))}
        </div>
      )}

      <input
        value={search}
        disabled={selectedLevels.length === 0}
        onChange={(event) => setSearch(event.target.value)}
        className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
      />

      <select
        value=""
        disabled={
          selectedLevels.length === 0 || availableSubjectOptions.length === 0
        }
        onChange={(event) => addSelectedSubject(event.target.value)}
        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
      >
        <option value="">
          {selectedLevels.length === 0
            ? 'Select level(s) first'
            : availableSubjectOptions.length === 0
              ? 'No subjects available'
              : 'Add a subject'}
        </option>

        {availableSubjectOptions.map((option) => (
          <option key={subjectOptionId(option)} value={subjectOptionId(option)}>
            {subjectOptionLabel(option)}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Left-side filter panel for student tutor discovery.
 *
 * These filters start from onboarding values, but editing them here does not
 * change the student's saved onboarding profile unless the user explicitly
 * presses "Save to profile".
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

    onChange({
      ...filters,
      levels: [...filters.levels, level],
    });
  }

  function addLearningStyle(learningStyle: string) {
    if (filters.learningStyles.includes(learningStyle)) return;

    onChange({
      ...filters,
      learningStyles: [...filters.learningStyles, learningStyle],
    });
  }

  function addUniversity(university: string) {
    if (filters.universities.includes(university)) return;

    onChange({
      ...filters,
      universities: [...filters.universities, university],
    });
  }

  function removeLevel(level: QualificationCategory) {
    const nextLevels = filters.levels.filter((item) => item !== level);

    onChange({
      ...filters,
      levels: nextLevels,
      subjects: filters.subjects.filter(
        (subject) => subject.level !== level
      ),
    });
  }

  function removeLearningStyle(learningStyle: string) {
    onChange({
      ...filters,
      learningStyles: filters.learningStyles.filter(
        (item) => item !== learningStyle
      ),
    });
  }

  function removeUniversity(university: string) {
    onChange({
      ...filters,
      universities: filters.universities.filter(
        (item) => item !== university
      ),
    });
  }

  function addSubject(subject: TutorSubjectFilter) {
    const alreadySelected = filters.subjects.some(
      (selectedSubject) =>
        selectedSubject.level === subject.level &&
        selectedSubject.subject === subject.subject
    );

    if (alreadySelected) return;

    onChange({
      ...filters,
      subjects: [...filters.subjects, subject],
    });
  }

  function removeSubject(subject: TutorSubjectFilter) {
    onChange({
      ...filters,
      subjects: filters.subjects.filter(
        (selectedSubject) =>
          selectedSubject.level !== subject.level ||
          selectedSubject.subject !== subject.subject
      ),
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

      <div className="mt-4 grid gap-3">
        <Button
          variant="secondary"
          onClick={onResetToOnboarding}
          className="w-full px-4 py-2"
        >
          Reset to profile
        </Button>

        <Button
          variant="secondary"
          onClick={onSaveToOnboarding}
          className="w-full px-4 py-2"
        >
          Save filters to profile
        </Button>
      </div>

      <div className="mt-6 grid gap-6">
        <SearchableDropdownMultiSelect
          label="Levels"
          emptyLabel="Add a level"
          options={[...QUALIFICATION_CATEGORIES]}
          selectedValues={filters.levels}
          onAdd={(value) => addLevel(value as QualificationCategory)}
          onRemove={(value) => removeLevel(value as QualificationCategory)}
        />

        <SubjectDropdown
          selectedLevels={filters.levels}
          selectedSubjects={filters.subjects}
          onAdd={addSubject}
          onRemove={removeSubject}
        />

        <SearchableDropdownMultiSelect
          label="Learning styles"
          emptyLabel="Add a learning style"
          options={LEARNING_STYLE_OPTIONS.map((style) => style.label)}
          selectedValues={filters.learningStyles}
          onAdd={addLearningStyle}
          onRemove={removeLearningStyle}
        />

        <SearchableDropdownMultiSelect
          label="Universities"
          emptyLabel="Add a university"
          options={UNIVERSITY_FILTER_OPTIONS}
          selectedValues={filters.universities}
          onAdd={addUniversity}
          onRemove={removeUniversity}
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