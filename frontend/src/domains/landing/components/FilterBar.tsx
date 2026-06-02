'use client';

import {
  LEARNING_STYLE_OPTIONS,
  QUALIFICATION_CATEGORIES,
  SUBJECT_OPTIONS_BY_CATEGORY,
} from '@/domains/students/learning-profile/constants/learningProfileOptions';
import { cn } from '@/shared/utils/cn';

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

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-xs font-medium transition',
        active
          ? 'border-slate-950 bg-slate-950 text-white'
          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50'
      )}
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
  const toggle = (key: 'subjects' | 'levels' | 'styles', value: string) => {
    const current = filters[key];
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
    <div className="space-y-6">
      {/* Subjects */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Subject</p>
        <div className="flex flex-wrap gap-1.5">
          {subjectOptions.map((s) => (
            <Chip key={s} label={s} active={filters.subjects.includes(s)} onClick={() => toggle('subjects', s)} />
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Max price</p>
          <span className="text-xs font-medium text-slate-600">
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
          className="w-full cursor-pointer accent-slate-950"
          aria-label="Maximum price per hour"
        />
        <div className="mt-1 flex justify-between text-[10px] font-medium text-slate-400">
          <span>£15/hr</span>
          <span>Any</span>
        </div>
      </div>

      {/* Level */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Level</p>
        <div className="flex flex-wrap gap-1.5">
          {levelOptions.map((l) => (
            <Chip key={l} label={l} active={filters.levels.includes(l)} onClick={() => toggle('levels', l)} />
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Minimum rating</p>
        <div className="flex gap-1.5">
          {([0, 4.5, 4.8] as const).map((r) => (
            <Chip
              key={r}
              label={r === 0 ? 'Any' : `${r}+`}
              active={filters.minRating === r}
              onClick={() => onChange({ ...filters, minRating: r })}
            />
          ))}
        </div>
      </div>

      {/* Teaching style */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Teaching style</p>
        <div className="flex flex-wrap gap-1.5">
          {styleOptions.map((s) => (
            <Chip key={s} label={s} active={filters.styles.includes(s)} onClick={() => toggle('styles', s)} />
          ))}
        </div>
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={handleReset}
          className="text-sm font-medium text-slate-500 underline underline-offset-2 transition hover:text-slate-950"
        >
          Reset all filters
        </button>
      )}
    </div>
  );
}
