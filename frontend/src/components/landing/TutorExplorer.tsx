'use client';

import { useMemo, useState } from 'react';
import { tutors } from '../../lib/tutorOptions';
import AuthPromptModal from './AuthPromptModal';
import FilterBar, { type LandingFilters } from './FilterBar';
import LandingTutorCard from './LandingTutorCard';

const PAGE_SIZE = 8;

export default function TutorExplorer() {
  const [filters, setFilters] = useState<LandingFilters>({
    subjects: [],
    maxPrice: 100,
    levels: [],
    minRating: 0,
    styles: [],
  });
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [modalOpen, setModalOpen] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const filteredTutors = useMemo(() => {
    return tutors.filter((t) => {
      if (filters.subjects.length > 0 && !filters.subjects.some((s) => t.subjects.includes(s))) return false;
      if (filters.levels.length > 0 && !filters.levels.some((l) => t.levels.includes(l))) return false;
      if (filters.styles.length > 0 && !filters.styles.some((s) => t.learningStyles.includes(s))) return false;
      if (t.pricePerHour > filters.maxPrice && filters.maxPrice < 100) return false;
      if (t.rating < filters.minRating) return false;
      return true;
    });
  }, [filters]);

  const handleFilterChange = (next: LandingFilters) => {
    setFilters(next);
    setVisibleCount(PAGE_SIZE);
  };

  const visibleTutors = filteredTutors.slice(0, visibleCount);
  const hasMore = visibleCount < filteredTutors.length;

  return (
    <section
      id="tutor-explorer"
      className="bg-white py-20"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        {/* Section header */}
        <div className="mb-10">
          <h2
            className="font-serif font-bold text-slate-950 text-wrap-balance"
            style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', letterSpacing: '-0.025em' }}
          >
            Browse tutors — no account needed
          </h2>
          <p className="mt-3 max-w-xl text-base font-medium text-slate-500">
            Filter by subject, price, level, and teaching style. Create an account when you find someone you like.
          </p>
        </div>

        {/* Mobile filter toggle */}
        <div className="mb-6 lg:hidden">
          <button
            type="button"
            onClick={() => setFiltersExpanded((v) => !v)}
            className="flex items-center gap-2 rounded-xl border-2 border-slate-950 bg-white px-4 py-2.5 text-sm font-bold shadow-[3px_3px_0_#0f172a] transition hover:bg-slate-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M6 12h12M10 20h4" />
            </svg>
            {filtersExpanded ? 'Hide filters' : 'Show filters'}
            {(filters.subjects.length + filters.levels.length + filters.styles.length > 0 || filters.maxPrice < 100 || filters.minRating > 0) && (
              <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-primary text-[10px] font-black text-white">
                {filters.subjects.length + filters.levels.length + filters.styles.length + (filters.maxPrice < 100 ? 1 : 0) + (filters.minRating > 0 ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {/* Mobile filter panel */}
        {filtersExpanded && (
          <div className="mb-8 rounded-[1.75rem] border-2 border-slate-950 bg-surface-soft p-6 shadow-[6px_6px_0_#0f172a] lg:hidden">
            <FilterBar filters={filters} onChange={handleFilterChange} />
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          {/* Desktop sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-20 rounded-[1.75rem] border-2 border-slate-950 bg-surface-soft p-6 shadow-[6px_6px_0_#0f172a]">
              <FilterBar filters={filters} onChange={handleFilterChange} />
            </div>
          </div>

          {/* Card grid */}
          <div>
            <div className="mb-5 flex items-center justify-between">
              <p className="text-sm font-bold text-slate-500">
                {filteredTutors.length === 0
                  ? 'No tutors match'
                  : `${filteredTutors.length} tutor${filteredTutors.length === 1 ? '' : 's'} found`}
              </p>
            </div>

            {filteredTutors.length === 0 ? (
              <div className="rounded-[1.75rem] border-2 border-slate-950 bg-surface-soft p-10 text-center shadow-[6px_6px_0_#0f172a]">
                <p className="text-lg font-bold text-slate-950">No tutors found</p>
                <p className="mt-2 text-sm font-medium text-slate-500">
                  Try widening your filters — we have tutors for many subjects and levels.
                </p>
              </div>
            ) : (
              <>
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {visibleTutors.map((tutor) => (
                    <LandingTutorCard
                      key={tutor.id}
                      tutor={tutor}
                      onGateClick={() => setModalOpen(true)}
                    />
                  ))}
                </div>

                {hasMore && (
                  <div className="mt-10 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                      className="rounded-xl border-2 border-slate-950 bg-white px-8 py-3 text-sm font-bold shadow-[4px_4px_0_#0f172a] transition hover:bg-slate-50 hover:shadow-[5px_5px_0_#0f172a] active:translate-x-px active:translate-y-px"
                    >
                      Load more tutors
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <AuthPromptModal
        isOpen={modalOpen}
        reason="view_profile"
        onClose={() => setModalOpen(false)}
      />
    </section>
  );
}
