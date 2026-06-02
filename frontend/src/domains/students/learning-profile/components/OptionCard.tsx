'use client';

/**
 * File purpose: Application source file. Comments explain what this file owns and what should stay elsewhere.
 */

import { cn } from '@/shared/utils/cn';

type OptionCardProps = {
  title: string;
  description?: string;
  selected: boolean;
  onToggle: () => void;
};

/**
 * Selectable card used throughout the student learning profile flow.
 *
 * This keeps subject, style, and availability options visually consistent.
 */
export function OptionCard({
  title,
  description,
  selected,
  onToggle,
}: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={cn(
        'rounded-2xl border p-5 text-left transition',
        selected
          ? 'border-slate-950 bg-slate-950 text-white shadow-sm'
          : 'border-slate-200 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50'
      )}
    >
      <span className="block text-sm font-semibold">{title}</span>
      {description && (
        <span
          className={cn(
            'mt-2 block text-sm leading-6',
            selected ? 'text-slate-200' : 'text-slate-500'
          )}
        >
          {description}
        </span>
      )}
    </button>
  );
}
