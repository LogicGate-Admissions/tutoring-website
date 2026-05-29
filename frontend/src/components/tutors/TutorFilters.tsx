'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  allLearningStyleFilters,
  allLevelFilters,
  allSubjectFilters,
  universityFilters,
} from '../../lib/tutorOptions';

type TutorFiltersProps = {
  selectedSubjects: string[];
  selectedLevels: string[];
  selectedStyles: string[];
  selectedUniversities: string[];
  minPrice: number;
  maxPrice: number;
  onSubjectToggle: (subject: string) => void;
  onLevelToggle: (level: string) => void;
  onStyleToggle: (style: string) => void;
  onUniversityToggle: (university: string) => void;
  onMinPriceChange: (price: number) => void;
  onMaxPriceChange: (price: number) => void;
  onClear: () => void;
  onOnboardFilters: () => void;
};

type OpenMore = 'subject' | 'level' | 'style' | 'university' | null;

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
    if (!query) return options;
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

  const hiddenOptions = allOptions.filter(
    (option) => !visibleOptions.includes(option) && !selectedValues.includes(option)
  );

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

        {hiddenOptions.length > 0 && (
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
        )}
      </div>
    </div>
  );
}

function clampPrice(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

export default function TutorFilters({
  selectedSubjects,
  selectedLevels,
  selectedStyles,
  selectedUniversities,
  minPrice,
  maxPrice,
  onSubjectToggle,
  onLevelToggle,
  onStyleToggle,
  onUniversityToggle,
  onMinPriceChange,
  onMaxPriceChange,
  onClear,
  onOnboardFilters,
}: TutorFiltersProps) {
  const [openMore, setOpenMore] = useState<OpenMore>(null);
  
  const [minPriceInput, setMinPriceInput] = useState(String(minPrice));
  const [maxPriceInput, setMaxPriceInput] = useState(String(maxPrice));

  useEffect(() => {
    setMinPriceInput(String(minPrice));
  }, [minPrice]);

  useEffect(() => {
    setMaxPriceInput(String(maxPrice));
  }, [maxPrice]);

  const visibleSubjects = ['Maths', 'Physics', 'Further Maths', 'TMUA', 'MAT'];
  const visibleLevels = ['A-level', 'GCSE', 'University admissions'];
  const visibleStyles = ['Visual explanations', 'Past-paper drilling'];
  const visibleUniversities = ['Imperial College London', 'University of Cambridge'];

  const subjectOptions = allSubjectFilters.filter((subject) => subject !== 'All');
  const levelOptions = allLevelFilters.filter((level) => level !== 'Any Level');
  const styleOptions = allLearningStyleFilters.filter((style) => style !== 'Any Style');
  const universityOptions = universityFilters.filter(
    (university) => university !== 'Any University'
  );

const commitMinPrice = (value: string) => {
  const parsed = Number(value);

  if (value.trim() === '' || Number.isNaN(parsed)) {
    setMinPriceInput(String(minPrice));
    return;
  }

  const nextMin = Math.min(clampPrice(parsed), maxPrice);
  onMinPriceChange(nextMin);
  setMinPriceInput(String(nextMin));
};

  const commitMaxPrice = (value: string) => {
    const parsed = Number(value);

    if (value.trim() === '' || Number.isNaN(parsed)) {
      setMaxPriceInput(String(maxPrice));
      return;
    }

    const nextMax = Math.max(clampPrice(parsed), minPrice);
    onMaxPriceChange(nextMax);
    setMaxPriceInput(String(nextMax));
  };

  const handleMinSliderChange = (value: number) => {
    const nextMin = Math.min(clampPrice(value), maxPrice);
    onMinPriceChange(nextMin);
  };

  const handleMaxSliderChange = (value: number) => {
    const nextMax = Math.max(clampPrice(value), minPrice);
    onMaxPriceChange(nextMax);
  };

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
          title="Level"
          visibleOptions={visibleLevels}
          allOptions={levelOptions}
          selectedValues={selectedLevels}
          onToggle={onLevelToggle}
          moreKey="level"
          openMore={openMore}
          setOpenMore={setOpenMore}
          searchTitle="More levels"
          searchPlaceholder="Search levels..."
        />

        <div>
          <p className="mb-2 text-sm font-bold text-slate-500">Price per hour</p>

          <div className="rounded-[1.25rem] border-2 border-slate-950 bg-[#f7fbff] p-4">
            <div className="flex items-center justify-between gap-3">
              <label className="text-xs font-bold text-slate-500">
                Min
                <div className="mt-1 flex items-center gap-1 rounded-xl border-2 border-slate-950 bg-white px-3 py-2">
                  <span className="font-black">£</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={minPriceInput}
                    onChange={(event) => setMinPriceInput(event.target.value)}
                    onBlur={() => commitMinPrice(minPriceInput)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        commitMinPrice(minPriceInput);
                      }
                    }}
                    className="w-12 bg-transparent text-sm font-bold outline-none"
                  />
                </div>
              </label>

              <label className="text-xs font-bold text-slate-500">
                Max
                <div className="mt-1 flex items-center gap-1 rounded-xl border-2 border-slate-950 bg-white px-3 py-2">
                  <span className="font-black">£</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={maxPriceInput}
                    onChange={(event) => setMaxPriceInput(event.target.value)}
                    onBlur={() => commitMaxPrice(maxPriceInput)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        commitMaxPrice(maxPriceInput);
                      }
                    }}
                    className="w-12 bg-transparent text-sm font-bold outline-none"
                  />
                </div>
              </label>
            </div>

            <div className="mt-4 space-y-3">
              <input
                type="range"
                min={0}
                max={100}
                value={minPrice}
                onChange={(event) => handleMinSliderChange(Number(event.target.value))}
                className="w-full accent-cyan-300"
              />

              <input
                type="range"
                min={0}
                max={100}
                value={maxPrice}
                onChange={(event) => handleMaxSliderChange(Number(event.target.value))}
                className="w-full accent-cyan-300"
              />
            </div>

            <p className="mt-3 text-sm font-bold">
              £{minPrice}–£{maxPrice} / hour
            </p>
          </div>
        </div>

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