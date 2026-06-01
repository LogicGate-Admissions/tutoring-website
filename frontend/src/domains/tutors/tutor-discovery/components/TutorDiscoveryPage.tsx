'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Container } from '@/shared/components/Container';
import { PageHeader } from '@/shared/components/PageHeader';
import { ROUTES } from '@/shared/constants/routes';
import { MOCK_STUDENT } from '@/domains/accounts/mockUsers';
import {
  getStoredLearningProfile,
  updateStoredLearningProfile,
} from '@/domains/students/learning-profile/services/learningProfileStorage';
import { timeBlockLabel } from '@/domains/students/learning-profile/utils/timeBlocks';
import {
  createTrialSessionRequest,
  subscribeToStudentTrialSessions,
} from '@/domains/sessions/trial-sessions/services/trialSessionService';
import type { TrialSessionRequest } from '@/domains/sessions/trial-sessions/types/trialSession';
import {
  MAX_TUTOR_PRICE_PER_HOUR,
  MIN_TUTOR_PRICE_PER_HOUR,
  TUTOR_PROFILES,
} from '@/domains/tutors/tutor-discovery/constants/tutorProfiles';
import { TutorCard } from '@/domains/tutors/tutor-discovery/components/TutorCard';
import { TutorFiltersPanel } from '@/domains/tutors/tutor-discovery/components/TutorFiltersPanel';
import { filterTutors } from '@/domains/tutors/tutor-discovery/utils/filterTutors';
import type { Tutor, TutorFilters } from '@/domains/tutors/tutor-discovery/types/tutor';

export const DEFAULT_FILTERS: TutorFilters = {
  subjects: [],
  levels: [],
  learningStyles: [],
  universities: [],
  minPricePerHour: MIN_TUTOR_PRICE_PER_HOUR,
  maxPricePerHour: MAX_TUTOR_PRICE_PER_HOUR,
  sortBy: 'Best match',
};

function uniqueStrings<T>(values: T[]) {
  return values.filter((value, index) => values.indexOf(value) === index);
}

function getOnboardingTutorFilters(): TutorFilters {
  const profile = getStoredLearningProfile();

  return {
    ...DEFAULT_FILTERS,
    subjects: profile.subjectSelections.flatMap((selection) =>
      selection.subjects.map((subject) => ({
        level: selection.category,
        subject,
      }))
    ),
    levels: uniqueStrings(
      profile.subjectSelections.map((selection) => selection.category)
    ),
    learningStyles: profile.learningStyles,
  };
}

/**
 * Student-facing tutor discovery page.
 *
 * The page is intentionally split into a left filter panel and a right tutor
 * results area. This keeps the browsing experience close to the original
 * prototype layout while keeping the code organised by domain components.
 */
export function TutorDiscoveryPage() {
  const [filters, setFilters] = useState<TutorFilters>(getOnboardingTutorFilters);
  const [studentRequests, setStudentRequests] = useState<TrialSessionRequest[]>([]);
  const [notice, setNotice] = useState('');
  const [selectedTutorId, setSelectedTutorId] = useState<string | null>(null);
  const [shortlistedTutorIds, setShortlistedTutorIds] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToStudentTrialSessions(
      MOCK_STUDENT.id,
      setStudentRequests
    );

    return () => unsubscribe();
  }, []);

  const filteredTutors = useMemo(
    () => filterTutors(TUTOR_PROFILES, filters),
    [filters]
  );

  const selectedTutor =
    filteredTutors.find((tutor) => tutor.id === selectedTutorId) ?? null;
  const selectedTutorSubjectMatches =
    selectedTutor?.subjects.filter((subject) =>
      filters.subjects.some(
        (subjectFilter) => subjectFilter.subject === subject
      )
    ) ?? [];

  function saveFiltersToOnboardingProfile() {
    const profile = getStoredLearningProfile();

    const subjectSelections = filters.levels.map((level) => ({
      category: level,
      subjects: filters.subjects
        .filter((subjectFilter) => subjectFilter.level === level)
        .map((subjectFilter) => subjectFilter.subject),
    }));

    updateStoredLearningProfile({
      ...profile,
      subjectSelections,
      learningStyles: filters.learningStyles,
    });

    setNotice('Your learning profile has been updated from these filters.');
  }

  function clearFilters() {
    setFilters(DEFAULT_FILTERS);
  }

  function resetToOnboardingFilters() {
    setFilters(getOnboardingTutorFilters());
  }

  function findExistingRequest(tutorId: string) {
    return studentRequests.find((request) => request.tutorId === tutorId);
  }

  function handleViewProfile(tutor: Tutor) {
    setSelectedTutorId(tutor.id);
  }

  function handleChat(tutor: Tutor) {
    setSelectedTutorId(tutor.id);
    setNotice(`Chat with ${tutor.name} is coming soon.`);
  }

  function toggleShortlist(tutor: Tutor) {
    setShortlistedTutorIds((currentTutorIds) => {
      const isShortlisted = currentTutorIds.includes(tutor.id);
      const nextTutorIds = isShortlisted
        ? currentTutorIds.filter((id) => id !== tutor.id)
        : [...currentTutorIds, tutor.id];

      setNotice(
        isShortlisted
          ? `${tutor.name} removed from shortlist.`
          : `${tutor.name} added to shortlist.`
      );

      return nextTutorIds;
    });
  }

  async function requestTrial(tutor: Tutor) {
    const profile = getStoredLearningProfile();

    await createTrialSessionRequest({
      tutorId: tutor.id,
      tutorName: tutor.name,
      studentId: MOCK_STUDENT.id,
      studentName: MOCK_STUDENT.name,
      subject:
        filters.subjects[0]?.subject ||
        profile.subjectSelections[0]?.subjects[0] ||
        tutor.subjects[0],
      level:
        filters.subjects[0]?.level ||
        filters.levels[0] ||
        profile.subjectSelections[0]?.category ||
        tutor.levels[0],
      learningStyle:
        filters.learningStyles[0] ||
        profile.learningStyles[0] ||
        tutor.learningStyles[0],
      preferredTime:
        profile.availability.map(timeBlockLabel).slice(0, 3).join(', ') ||
        tutor.availability,
      message:
        'I would like a trial session. I want help identifying weak points and getting clearer resources before sessions.',
    });

    setNotice(`Trial request sent to ${tutor.name}.`);
  }

  return (
    <main className="min-h-screen bg-[#f8f7f4]">
      <PageHeader
        eyebrow="Student area"
        title="Find your match."
        description="Use your learning profile to narrow tutors by subject, level, style, university, rating, and price."
      />

      <Container className="py-4">
        <Link href={ROUTES.studentOnboardingSubjects}>
          <Button variant="secondary">← Back to onboarding</Button>
        </Link>
      </Container>

      <Container className={`grid items-start gap-8 py-10 ${selectedTutor ? 'lg:grid-cols-[320px_minmax(0,1fr)_360px]' : 'lg:grid-cols-[320px_minmax(0,1fr)]'}`}>
        <div className="lg:sticky lg:top-8">
          <TutorFiltersPanel
            filters={filters}
            onChange={setFilters}
            onClear={clearFilters}
            onResetToOnboarding={resetToOnboardingFilters}
            onSaveToOnboarding={saveFiltersToOnboardingProfile}
          />
        </div>

        <section className="min-w-0">
          {notice && (
            <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
              {notice}
            </div>
          )}

          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                Tutor results
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                {filteredTutors.length} available matches
              </h2>
            </div>

            <p className="max-w-md text-sm leading-6 text-slate-600">
              Browse the tutors below and filter by what matters most.
            </p>
          </div>

          {filteredTutors.length === 0 ? (
            <Card>
              <p className="font-medium">No tutors match these filters.</p>
              <p className="mt-2 text-sm text-slate-600">
                Try increasing the max price or clearing one of the filters.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              {filteredTutors.map((tutor) => (
                <TutorCard
                  key={tutor.id}
                  tutor={tutor}
                  existingRequest={findExistingRequest(tutor.id)}
                  onRequestTrial={requestTrial}
                  onViewProfile={handleViewProfile}
                />
              ))}
            </div>
          )}
        </section>

        <aside className="lg:sticky lg:top-8">
          {selectedTutor && (
          <Card className="h-fit">
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                      Tutor profile
                    </p>
                    <h3 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                      {selectedTutor.name}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-slate-700">
                      {selectedTutor.headline}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedTutorId(null)}
                    className="rounded-full border border-slate-300 px-3 py-1 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
                    <p className="text-lg font-semibold text-slate-950">£{selectedTutor.pricePerHour}</p>
                    <p className="mt-1 text-[11px] font-medium text-slate-500">per hour</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
                    <p className="text-lg font-semibold text-slate-950">★ {selectedTutor.rating}</p>
                    <p className="mt-1 text-[11px] font-medium text-slate-500">
                      {selectedTutor.reviews} reviews
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
                    <p className="text-lg font-semibold text-slate-950">{selectedTutor.numberOfStudents}</p>
                    <p className="mt-1 text-[11px] font-medium text-slate-500">
                      students
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 text-sm leading-6 text-slate-600">
                  <p>{selectedTutor.bio}</p>

                  {selectedTutorSubjectMatches.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedTutorSubjectMatches.map((subject) => (
                        <span
                          key={subject}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700"
                        >
                          {subject} · {selectedTutor.rating.toFixed(1)} ★
                        </span>
                      ))}
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                      Learning styles
                    </p>
                    <p className="mt-2 text-slate-700">{selectedTutor.learningStyles.join(', ')}</p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                      Availability
                    </p>
                    <p className="mt-2 text-slate-700">{selectedTutor.availability}</p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                      Personality
                    </p>
                    <p className="mt-2 text-slate-700">{selectedTutor.personality.join(', ')}</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <Button variant="secondary" onClick={() => handleChat(selectedTutor)}>
                    Chat
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={() => toggleShortlist(selectedTutor)}
                  >
                    {shortlistedTutorIds.includes(selectedTutor.id)
                      ? 'Shortlisted'
                      : 'Shortlist'}
                  </Button>

                  <Button onClick={() => requestTrial(selectedTutor)}>Book trial</Button>
                </div>
              </div>
          </Card>
          )}
        </aside>
      </Container>
    </main>
  );
}