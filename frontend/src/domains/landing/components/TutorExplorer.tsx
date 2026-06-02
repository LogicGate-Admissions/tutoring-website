'use client';

import { TUTOR_PROFILES } from '@/domains/tutors/tutor-discovery/constants/tutorProfiles';
import { useMemo, useState } from 'react';
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
    return TUTOR_PROFILES.filter((t) => {
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

  const activeFilterCount =
    filters.subjects.length +
    filters.levels.length +
    filters.styles.length +
    (filters.maxPrice < 100 ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0);

  return (
    <section id="tutor-explorer" className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-10">
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950 text-wrap-balance lg:text-4xl">
            Browse tutors — no account needed
          </h2>
          <p className="mt-3 max-w-xl text-base leading-7 text-slate-600">
            Filter by subject, price, level, and teaching style. Create an account when you find someone you like.
          </p>
        </div>

        {/* Mobile filter toggle */}
        <div className="mb-6 lg:hidden">
          <button
            type="button"
            onClick={() => setFiltersExpanded((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M6 12h12M10 20h4" />
            </svg>
            {filtersExpanded ? 'Hide filters' : 'Show filters'}
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-950 text-[10px] font-semibold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Mobile filter panel */}
        {filtersExpanded && (
          <div className="mb-8 rounded-3xl border border-slate-200 bg-[#f8f7f4] p-6 shadow-sm lg:hidden">
            <FilterBar filters={filters} onChange={handleFilterChange} />
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          {/* Desktop sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-20 rounded-3xl border border-slate-200 bg-[#f8f7f4] p-6 shadow-sm">
              <FilterBar filters={filters} onChange={handleFilterChange} />
            </div>
          </div>

          {/* Card grid */}
          <div>
            <p className="mb-5 text-sm font-medium text-slate-500">
              {filteredTutors.length === 0
                ? 'No tutors match'
                : `${filteredTutors.length} tutor${filteredTutors.length === 1 ? '' : 's'} found`}
            </p>

            {filteredTutors.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <p className="text-base font-semibold text-slate-950">No tutors found</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Try widening your filters — we have tutors for many subjects and levels.
                </p>
              </div>
            ) : (
              <>
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
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
                      className="rounded-full border border-slate-300 bg-white px-8 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
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

      <AuthPromptModal isOpen={modalOpen} reason="view_profile" onClose={() => setModalOpen(false)} />
    </section>
  );
}
