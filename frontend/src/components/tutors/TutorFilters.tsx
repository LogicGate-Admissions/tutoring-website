'use client';

import { useMemo, useState } from 'react';
import {
  allLearningStyleFilters,
  allSubjectFilters,
  universityFilters,
} from '../../lib/tutorOptions';

type TutorFiltersProps = {
  selectedSubjects: string[];
  selectedStyles: string[];
  selectedUniversities: string[];
  onSubjectToggle: (subject: string) => void;
  onStyleToggle: (style: string) => void;
  onUniversityToggle: (university: string) => void;
  onClear: () => void;
  onOnboardFilters: () => void;
};

type OpenMore = 'subject' | 'style' | 'university' | null;

function FilterChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border-2 border-slate-950 px-3 py-1 text-sm font-bold transition ${
        selected
          ? 'bg-cyan-100 shadow-[2px_2px_0_#0f172a]'
          : 'bg-white hover:bg-slate-50'
      }`}
    >
      {label} {selected && '✓'}
    </button>
  );
}

function SearchableMore({
  title,
  placeholder,
  options,
  selectedValues,
  open,
  onOpen,
  onClose,
  onToggle,
}: {
  title: string;
  placeholder: string;
  options: string[];
  selectedValues: string[];
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onToggle: (value: string) => void;
}) {
  const [search, setSearch] = useState('');

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return options;
    }

    return options.filter((option) => option.toLowerCase().includes(query));
  }, [options, search]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={open ? onClose : onOpen}
        className="rounded-full border-2 border-slate-950 bg-white px-3 py-1 text-sm font-bold shadow-[2px_2px_0_#0f172a] transition hover:bg-cyan-50"
      >
        More
      </button>

      {open && (
        <div className="absolute left-0 top-10 z-30 w-72 rounded-[1.25rem] border-2 border-slate-950 bg-white p-4 shadow-[6px_6px_0_#0f172a]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="font-bold">{title}</p>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border-2 border-slate-950 px-2 text-sm font-black hover:bg-slate-50"
            >
              ×
            </button>
          </div>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={placeholder}
            className="mb-3 w-full rounded-xl border-2 border-slate-950 px-3 py-2 text-sm font-semibold outline-none"
          />

          <div className="max-h-56 space-y-2 overflow-auto">
            {filteredOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onToggle(option)}
                className={`block w-full rounded-xl border-2 border-slate-950 px-3 py-2 text-left text-sm font-bold transition ${
                  selectedValues.includes(option)
                    ? 'bg-cyan-100'
                    : 'bg-white hover:bg-slate-50'
                }`}
              >
                {option} {selectedValues.includes(option) && '✓'}
              </button>
            ))}

            {filteredOptions.length === 0 && (
              <p className="rounded-xl border-2 border-slate-950 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-500">
                No matches found.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FilterSection({
  title,
  visibleOptions,
  allOptions,
  selectedValues,
  onToggle,
  moreKey,
  openMore,
  setOpenMore,
  searchTitle,
  searchPlaceholder,
}: {
  title: string;
  visibleOptions: string[];
  allOptions: string[];
  selectedValues: string[];
  onToggle: (value: string) => void;
  moreKey: OpenMore;
  openMore: OpenMore;
  setOpenMore: (value: OpenMore) => void;
  searchTitle: string;
  searchPlaceholder: string;
}) {
  const hiddenSelectedValues = selectedValues.filter(
    (value) => !visibleOptions.includes(value)
  );

  const hiddenOptions = allOptions.filter((option) => !visibleOptions.includes(option));

  return (
    <div>
      <p className="mb-2 text-sm font-bold text-slate-500">{title}</p>

      <div className="flex flex-wrap gap-2">
        {visibleOptions.map((option) => (
          <FilterChip
            key={option}
            label={option}
            selected={selectedValues.includes(option)}
            onClick={() => onToggle(option)}
          />
        ))}

        {hiddenSelectedValues.map((option) => (
          <FilterChip
            key={option}
            label={option}
            selected
            onClick={() => onToggle(option)}
          />
        ))}

        <SearchableMore
          title={searchTitle}
          placeholder={searchPlaceholder}
          options={hiddenOptions}
          selectedValues={selectedValues}
          open={openMore === moreKey}
          onOpen={() => setOpenMore(moreKey)}
          onClose={() => setOpenMore(null)}
          onToggle={onToggle}
        />
      </div>
    </div>
  );
}

export default function TutorFilters({
  selectedSubjects,
  selectedStyles,
  selectedUniversities,
  onSubjectToggle,
  onStyleToggle,
  onUniversityToggle,
  onClear,
  onOnboardFilters,
}: TutorFiltersProps) {
  const [openMore, setOpenMore] = useState<OpenMore>(null);

  const visibleSubjects = ['Maths', 'Physics', 'Further Maths', 'TMUA', 'MAT'];
  const visibleStyles = ['Visual explanations', 'Past-paper drilling'];
  const visibleUniversities = ['Imperial College London', 'University of Cambridge'];

  const subjectOptions = allSubjectFilters.filter((subject) => subject !== 'All');
  const styleOptions = allLearningStyleFilters.filter((style) => style !== 'Any Style');
  const universityOptions = universityFilters.filter(
    (university) => university !== 'Any University'
  );

  return (
    <aside className="h-fit rounded-[1.75rem] border-2 border-slate-950 bg-white p-6 shadow-[6px_6px_0_#0f172a]">
      <h2 className="text-xl font-bold">Find a tutor</h2>

      <div className="mt-6 space-y-6">
        <FilterSection
          title="Subject"
          visibleOptions={visibleSubjects}
          allOptions={subjectOptions}
          selectedValues={selectedSubjects}
          onToggle={onSubjectToggle}
          moreKey="subject"
          openMore={openMore}
          setOpenMore={setOpenMore}
          searchTitle="More subjects"
          searchPlaceholder="Search subjects..."
        />

        <FilterSection
          title="Learning Style"
          visibleOptions={visibleStyles}
          allOptions={styleOptions}
          selectedValues={selectedStyles}
          onToggle={onStyleToggle}
          moreKey="style"
          openMore={openMore}
          setOpenMore={setOpenMore}
          searchTitle="More learning styles"
          searchPlaceholder="Search learning styles..."
        />

        <FilterSection
          title="University"
          visibleOptions={visibleUniversities}
          allOptions={universityOptions}
          selectedValues={selectedUniversities}
          onToggle={onUniversityToggle}
          moreKey="university"
          openMore={openMore}
          setOpenMore={setOpenMore}
          searchTitle="More universities"
          searchPlaceholder="Search universities..."
        />

        <button
          type="button"
          onClick={onOnboardFilters}
          className="w-full rounded-xl border-2 border-slate-950 bg-cyan-100 px-5 py-3 text-sm font-bold shadow-[3px_3px_0_#0f172a] transition hover:bg-cyan-200"
        >
          Onboard filters
        </button>

        <button
          type="button"
          onClick={onClear}
          className="w-full rounded-xl border-2 border-slate-950 bg-white px-5 py-3 text-sm font-bold shadow-[3px_3px_0_#0f172a] transition hover:bg-slate-50"
        >
          Clear filters
        </button>
      </div>
    </aside>
  );
}