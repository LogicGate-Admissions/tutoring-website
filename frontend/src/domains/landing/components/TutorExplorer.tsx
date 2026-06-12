'use client';

/**
 * File purpose: Landing-page component. It should reuse domain components rather than duplicating product logic.
 */

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/shared/components/Card';
import { TutorCard } from '@/domains/tutors/tutor-discovery/components/TutorCard';
import { TutorFiltersPanel } from '@/domains/tutors/tutor-discovery/components/TutorFiltersPanel';
import { getTutorProfiles } from '@/domains/tutors/tutor-discovery/services/tutorProfileService';
import { filterTutors } from '@/domains/tutors/tutor-discovery/utils/filterTutors';
import { DEFAULT_TUTOR_FILTERS } from '@/domains/tutors/tutor-discovery/utils/tutorFilterMapping';
import type { Tutor, TutorFilters } from '@/domains/tutors/tutor-discovery/types/tutor';
import AuthPromptModal from './AuthPromptModal';

const PAGE_SIZE = 8;

function activeFilterCount(filters: TutorFilters) {
  return (
    filters.subjects.length +
    filters.levels.length +
    filters.learningStyles.length +
    filters.universities.length +
    (filters.minPricePerHour !== DEFAULT_TUTOR_FILTERS.minPricePerHour ? 1 : 0) +
    (filters.maxPricePerHour !== DEFAULT_TUTOR_FILTERS.maxPricePerHour ? 1 : 0) +
    (filters.sortBy !== DEFAULT_TUTOR_FILTERS.sortBy ? 1 : 0)
  );
}

/**
 * Public tutor explorer shown on the landing page.
 *
 * It reuses the real tutor discovery filters and cards so the public preview
 * matches the signed-in student experience. Profile/booking actions are gated
 * behind the auth prompt because landing-page visitors have not signed in yet.
 */
export default function TutorExplorer() {
  const [filters, setFilters] = useState<TutorFilters>(DEFAULT_TUTOR_FILTERS);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [isLoadingTutors, setIsLoadingTutors] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [modalOpen, setModalOpen] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  useEffect(() => {
    /** Public preview uses the same Firestore-backed tutor profiles as signed-in discovery. */
    let isMounted = true;

    async function loadTutors() {
      setIsLoadingTutors(true);

      try {
        const profiles = await getTutorProfiles();

        if (isMounted) {
          setTutors(profiles);
        }
      } finally {
        if (isMounted) {
          setIsLoadingTutors(false);
        }
      }
    }

    void loadTutors();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredTutors = useMemo(
    () => filterTutors(tutors, filters),
    [filters, tutors]
  );

  const visibleTutors = filteredTutors.slice(0, visibleCount);
  const hasMore = visibleCount < filteredTutors.length;
  const numberOfActiveFilters = activeFilterCount(filters);

  function handleFilterChange(nextFilters: TutorFilters) {
    setFilters(nextFilters);
    setVisibleCount(PAGE_SIZE);
  }

  function clearFilters() {
    handleFilterChange(DEFAULT_TUTOR_FILTERS);
  }

  function openAuthPrompt() {
    setModalOpen(true);
  }

  return (
    <section id="tutor-explorer" className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-10">
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950 text-wrap-balance lg:text-4xl">
            Browse tutors - no account needed
          </h2>
          <p className="mt-3 max-w-xl text-base leading-7 text-slate-600">
            Explore the same matching filters students use after onboarding.
            Create an account when you are ready to view full profiles or book.
          </p>
        </div>

        <div className="mb-6 lg:hidden">
          <button
            type="button"
            onClick={() => setFiltersExpanded((current) => !current)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <span aria-hidden="true">☰</span>
            {filtersExpanded ? 'Hide filters' : 'Show filters'}
            {numberOfActiveFilters > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-950 text-[10px] font-semibold text-white">
                {numberOfActiveFilters}
              </span>
            )}
          </button>
        </div>

        {filtersExpanded && (
          <div className="mb-8 lg:hidden">
            <TutorFiltersPanel
              filters={filters}
              onChange={handleFilterChange}
              onClear={clearFilters}
            />
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="hidden lg:block">
            <div className="sticky top-20">
              <TutorFiltersPanel
                filters={filters}
                onChange={handleFilterChange}
                onClear={clearFilters}
              />
            </div>
          </div>

          <div>
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                  Tutor results
                </p>
                <h3 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                  {isLoadingTutors
                    ? 'Loading tutors'
                    : filteredTutors.length === 0
                      ? 'No tutors match'
                      : `${filteredTutors.length} available match${filteredTutors.length === 1 ? '' : 'es'}`}
                </h3>
              </div>

              <p className="max-w-md text-sm leading-6 text-slate-600">
                This is a preview. Opening profiles or booking a trial asks the
                visitor to create a student account first.
              </p>
            </div>

            {isLoadingTutors ? (
              <Card>
                <p className="text-sm text-slate-600">Loading tutors from Firebase...</p>
              </Card>
            ) : filteredTutors.length === 0 ? (
              <Card>
                <p className="font-medium">No tutors match these filters.</p>
                <p className="mt-2 text-sm text-slate-600">
                  Tutor profiles are now loaded from Firebase. Complete tutor onboarding to publish profiles.
                </p>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                  {visibleTutors.map((tutor) => (
                    <TutorCard
                      key={tutor.id}
                      tutor={tutor}
                      onViewProfile={openAuthPrompt}
                    />
                  ))}
                </div>

                {hasMore && (
                  <div className="mt-10 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}
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

      <AuthPromptModal
        isOpen={modalOpen}
        reason="view_profile"
        onClose={() => setModalOpen(false)}
      />
    </section>
  );
}
