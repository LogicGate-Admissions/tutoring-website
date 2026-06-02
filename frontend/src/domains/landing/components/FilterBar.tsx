'use client';

import {
  LEARNING_STYLE_OPTIONS,
  QUALIFICATION_CATEGORIES,
  SUBJECT_OPTIONS_BY_CATEGORY,
} from '@/domains/students/learning-profile/constants/learningProfileOptions';

export type LandingFilters = {
  subjects: string[];
  maxPrice: number;
  levels: string[];
  minRating: number;
  styles: string[];
};

const subjectOptions = [...new Set(Object.values(SUBJECT_OPTIONS_BY_CATEGORY).flat())].sort();
const levelOptions = QUALIFICATION_CATEGORIES;
const styleOptions = LEARNING_STYLE_OPTIONS.map((s) => s.label);

type ChipProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

function Chip({ label, active, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border-2 border-slate-950 px-3 py-1.5 text-xs font-bold transition ${
        active
          ? 'bg-brand-primary text-white shadow-[2px_2px_0_#0f172a]'
          : 'bg-white text-slate-950 shadow-[2px_2px_0_#0f172a] hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  );
}

type FilterBarProps = {
  filters: LandingFilters;
  onChange: (filters: LandingFilters) => void;
};

export default function FilterBar({ filters, onChange }: FilterBarProps) {
  const toggle =<K extends keyof LandingFilters>(
    key: K extends 'subjects' | 'levels' | 'styles' ? K : never,
    value: string
  ) => {
    const current = filters[key] as string[];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    onChange({ ...filters, [key]: next });
  };

  const handleReset = () => {
    onChange({ subjects: [], maxPrice: 100, levels: [], minRating: 0, styles: [] });
  };

  const hasFilters =
    filters.subjects.length > 0 ||
    filters.maxPrice < 100 ||
    filters.levels.length > 0 ||
    filters.minRating > 0 ||
    filters.styles.length > 0;

  return (
    <aside className="space-y-6">
      {/* Subjects */}
      <div>
        <p className="mb-2.5 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
          Subject
        </p>
        <div className="flex flex-wrap gap-2">
          {subjectOptions.map((s) => (
            <Chip
              key={s}
              label={s}
              active={filters.subjects.includes(s)}
              onClick={() => toggle('subjects', s)}
            />
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
            Max price
          </p>
          <span className="text-xs font-bold text-slate-700">
            {filters.maxPrice >= 100 ? 'Any price' : `Up to £${filters.maxPrice}/hr`}
          </span>
        </div>
        <input
          type="range"
          min={15}
          max={100}
          step={5}
          value={filters.maxPrice}
          onChange={(e) => onChange({ ...filters, maxPrice: Number(e.target.value) })}
          className="w-full cursor-pointer accent-brand-primary"
          aria-label="Maximum price per hour"
        />
        <div className="mt-1 flex justify-between text-[10px] font-semibold text-slate-400">
          <span>£15/hr</span>
          <span>Any</span>
        </div>
      </div>

      {/* Level */}
      <div>
        <p className="mb-2.5 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
          Level
        </p>
        <div className="flex flex-wrap gap-2">
          {levelOptions.map((l) => (
            <Chip
              key={l}
              label={l}
              active={filters.levels.includes(l)}
              onClick={() => toggle('levels', l)}
            />
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <p className="mb-2.5 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
          Minimum rating
        </p>
        <div className="flex gap-2">
          {[0, 4.5, 4.8].map((r) => (
            <Chip
              key={r}
              label={r === 0 ? 'Any' : r === 4.5 ? '4.5+' : '4.8+'}
              active={filters.minRating === r}
              onClick={() => onChange({ ...filters, minRating: r })}
            />
          ))}
        </div>
      </div>

      {/* Teaching style */}
      <div>
        <p className="mb-2.5 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
          Teaching style
        </p>
        <div className="flex flex-wrap gap-2">
          {styleOptions.map((s) => (
            <Chip
              key={s}
              label={s}
              active={filters.styles.includes(s)}
              onClick={() => toggle('styles', s)}
            />
          ))}
        </div>
      </div>

      {/* Reset */}
      {hasFilters && (
        <button
          type="button"
          onClick={handleReset}
          className="text-sm font-semibold text-slate-500 underline underline-offset-2 transition hover:text-slate-950"
        >
          Reset all filters
        </button>
      )}
    </aside>
  );
}
