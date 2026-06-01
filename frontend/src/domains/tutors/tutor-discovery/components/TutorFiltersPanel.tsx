'use client';

import { Button } from '@/shared/components/Button';
import { SearchableMultiSelect } from '@/shared/components/SearchableMultiSelect';
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

function subjectFilterId(subjectFilter: TutorSubjectFilter) {
  return `${subjectFilter.level}|||${subjectFilter.subject}`;
}

function subjectFilterLabel(subjectFilter: TutorSubjectFilter) {
  return `${subjectFilter.level} · ${subjectFilter.subject}`;
}

/**
 * Creates level-specific subject options.
 *
 * Example:
 * GCSE · Maths
 * A-level · Maths
 *
 * This avoids the confusing duplicate "Maths" issue.
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
 * Left-side filter panel for student tutor discovery.
 *
 * These filters start from onboarding values, but editing them here does not
 * change the saved onboarding profile unless the user presses
 * "Save filters to profile".
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

  function addLearningStyle(learningStyle: string) {
    if (filters.learningStyles.includes(learningStyle)) return;

    onChange({
      ...filters,
      learningStyles: [...filters.learningStyles, learningStyle],
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

  function addUniversity(university: string) {
    if (filters.universities.includes(university)) return;

    onChange({
      ...filters,
      universities: [...filters.universities, university],
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
          getOptionKey={subjectFilterId}
          getOptionLabel={subjectFilterLabel}
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
          onSelect={addLearningStyle}
          onRemove={removeLearningStyle}
          emptyMessage="No learning styles found."
        />

        <SearchableMultiSelect
          label="Universities"
          options={UNIVERSITY_FILTER_OPTIONS}
          selectedOptions={filters.universities}
          getOptionKey={(university) => university}
          getOptionLabel={(university) => university}
          onSelect={addUniversity}
          onRemove={removeUniversity}
          emptyMessage="No universities found."
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