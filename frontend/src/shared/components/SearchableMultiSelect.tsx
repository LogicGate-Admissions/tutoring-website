'use client';

/**
 * File purpose: Reusable UI component shared across domains. Keep it generic and product-agnostic.
 */

import { useMemo, useState } from 'react';
import { Badge } from '@/shared/components/Badge';

type SearchableMultiSelectProps<Option> = {
  label: string;
  options: Option[];
  selectedOptions: Option[];
  getOptionKey: (option: Option) => string;
  getOptionLabel: (option: Option) => string;
  onSelect: (option: Option) => void;
  onRemove: (option: Option) => void;
  disabled?: boolean;
  disabledMessage?: string;
  emptyMessage?: string;
};

/**
 * Shared searchable multi-select combobox.
 *
 * This is used anywhere the app needs "search, pick, turn into pill" behaviour.
 * It supports both simple string options and richer object options by requiring
 * callers to provide key and label functions.
 */
export function SearchableMultiSelect<Option>({
  label,
  options,
  selectedOptions,
  getOptionKey,
  getOptionLabel,
  onSelect,
  onRemove,
  disabled = false,
  disabledMessage = 'Not available',
  emptyMessage = 'No options found',
}: SearchableMultiSelectProps<Option>) {
  // Phase 1: local UI state only; selected values remain owned by the parent.
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Phase 2: derive available options from current search and selected pills.
  const availableOptions = useMemo(() => {
    const selectedOptionKeys = new Set(selectedOptions.map(getOptionKey));
    const normalisedSearch = search.trim().toLowerCase();

    return options
      .filter((option) => !selectedOptionKeys.has(getOptionKey(option)))
      .filter((option) => {
        if (!normalisedSearch) return true;

        return getOptionLabel(option).toLowerCase().includes(normalisedSearch);
      });
  }, [getOptionKey, getOptionLabel, options, search, selectedOptions]);

  function chooseOption(option: Option) {
    onSelect(option);
    setSearch('');
    // Keep the list open after a selection because the input still has focus.
    // Without this, clicking the already-focused input again does not fire
    // onFocus, so users have to type or blur/refocus to see options.
    setIsOpen(true);
  }

  return (
    <div>
      <p className="text-sm font-medium text-slate-700">{label}</p>

      {/* Phase 3: selected options are visible and removable. */}
      {selectedOptions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedOptions.map((option) => (
            <button
              key={getOptionKey(option)}
              type="button"
              onClick={() => onRemove(option)}
            >
              <Badge className="border-slate-950 bg-slate-950 text-white">
                {getOptionLabel(option)} ×
              </Badge>
            </button>
          ))}
        </div>
      )}

      {/* Phase 4: the input is the dropdown trigger and live search field. */}
      <div className="relative mt-3">
        <input
          value={search}
          disabled={disabled}
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            setSearch(event.target.value);
            setIsOpen(true);
          }}
          onBlur={() => {
            window.setTimeout(() => setIsOpen(false), 120);
          }}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        />

        {/* Phase 5: custom dropdown updates while the user types. */}
        {isOpen && !disabled && (
          <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
            {availableOptions.length > 0 ? (
              availableOptions.map((option) => (
                <button
                  key={getOptionKey(option)}
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    chooseOption(option);
                  }}
                  className="block w-full rounded-xl px-3 py-2 text-left text-sm text-slate-800 transition hover:bg-slate-100"
                >
                  {getOptionLabel(option)}
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-slate-500">
                {emptyMessage}
              </p>
            )}
          </div>
        )}

        {disabled && (
          <p className="mt-2 text-sm text-slate-500">{disabledMessage}</p>
        )}
      </div>
    </div>
  );
}
