'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { HomeLinkButton } from '@/shared/components/HomeLinkButton';
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
import { TUTOR_PROFILES } from '@/domains/tutors/tutor-discovery/constants/tutorProfiles';
import { TutorCard } from '@/domains/tutors/tutor-discovery/components/TutorCard';
import { TutorFiltersPanel } from '@/domains/tutors/tutor-discovery/components/TutorFiltersPanel';
import { TutorProfileModal } from '@/domains/tutors/tutor-discovery/components/TutorProfileModal';
import { filterTutors } from '@/domains/tutors/tutor-discovery/utils/filterTutors';
import {
  DEFAULT_TUTOR_FILTERS,
  profileToTutorFilters,
  tutorFiltersToProfileSelections,
} from '@/domains/tutors/tutor-discovery/utils/tutorFilterMapping';
import type {
  Tutor,
  TutorFilters,
} from '@/domains/tutors/tutor-discovery/types/tutor';

function getOnboardingTutorFilters() {
  return profileToTutorFilters(getStoredLearningProfile());
}

/**
 * Student-facing tutor discovery page.
 *
 * Responsibilities are intentionally split:
 * - TutorFiltersPanel owns editing filters.
 * - TutorCard owns compact result display.
 * - TutorProfileModal owns detailed profile actions.
 * - filterTutors owns matching/sorting logic.
 */
export function TutorDiscoveryPage() {
  // Phase 1: initialise page state from the saved onboarding profile.
  const [filters, setFilters] = useState<TutorFilters>(
    getOnboardingTutorFilters
  );
  const [studentRequests, setStudentRequests] = useState<TrialSessionRequest[]>(
    []
  );
  const [notice, setNotice] = useState('');
  const [selectedTutorId, setSelectedTutorId] = useState<string | null>(null);
  const [shortlistedTutorIds, setShortlistedTutorIds] = useState<string[]>([]);

  // Phase 2: keep trial request state synced with Firestore.
  useEffect(() => {
    const unsubscribe = subscribeToStudentTrialSessions(
      MOCK_STUDENT.id,
      setStudentRequests
    );

    return () => unsubscribe();
  }, []);

  // Phase 3: derive display data from state without storing duplicates.
  const filteredTutors = useMemo(
    () => filterTutors(TUTOR_PROFILES, filters),
    [filters]
  );

  const selectedTutor =
    TUTOR_PROFILES.find((tutor) => tutor.id === selectedTutorId) ?? null;

  const selectedTutorRequest = selectedTutor
    ? findExistingRequest(selectedTutor.id)
    : undefined;

  // Phase 4: filter/profile actions are small wrappers around domain helpers.
  function saveFiltersToOnboardingProfile() {
    const profileSelections = tutorFiltersToProfileSelections(filters);

    updateStoredLearningProfile({
      ...getStoredLearningProfile(),
      ...profileSelections,
    });

    setNotice('Your learning profile has been updated from these filters.');
  }

  function clearFilters() {
    setFilters(DEFAULT_TUTOR_FILTERS);
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
    const existingRequest = findExistingRequest(tutor.id);

    if (existingRequest) {
      setNotice(`You have already sent a trial request to ${tutor.name}.`);
      return;
    }

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
      {/* Phase 5: page-level navigation stays outside the filter/results grid. */}
      <PageHeader
        eyebrow="Student area"
        title="Find your match."
        description="Use your learning profile to narrow tutors by subject, level, style, university, rating, and price."
      />

      <Container className="flex items-center gap-3 py-4">
        <HomeLinkButton />

        <Link href={ROUTES.studentOnboardingSubjects}>
          <Button variant="secondary">← Edit profile</Button>
        </Link>
      </Container>

      {/* Phase 6: filters and results stay in a stable two-column layout. */}
      <Container className="grid items-start gap-8 py-10 lg:grid-cols-[320px_minmax(0,1fr)]">
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
          <TutorResultsHeader
            notice={notice}
            tutorCount={filteredTutors.length}
          />

          {filteredTutors.length === 0 ? (
            <NoTutorMatches />
          ) : (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              {filteredTutors.map((tutor) => (
                <TutorCard
                  key={tutor.id}
                  tutor={tutor}
                  existingRequest={findExistingRequest(tutor.id)}
                  onViewProfile={handleViewProfile}
                />
              ))}
            </div>
          )}
        </section>
      </Container>

      {/* Phase 7: profile details open as an overlay, never as a third column. */}
      {selectedTutor && (
        <TutorProfileModal
          tutor={selectedTutor}
          existingRequest={selectedTutorRequest}
          isShortlisted={shortlistedTutorIds.includes(selectedTutor.id)}
          onClose={() => setSelectedTutorId(null)}
          onChat={handleChat}
          onToggleShortlist={toggleShortlist}
          onRequestTrial={requestTrial}
        />
      )}
    </main>
  );
}

function TutorResultsHeader({
  notice,
  tutorCount,
}: {
  notice: string;
  tutorCount: number;
}) {
  return (
    <>
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
            {tutorCount} available matches
          </h2>
        </div>

        <p className="max-w-md text-sm leading-6 text-slate-600">
          Browse the tutors below and open a profile when you want more detail.
        </p>
      </div>
    </>
  );
}

function NoTutorMatches() {
  return (
    <Card>
      <p className="font-medium">No tutors match these filters.</p>
      <p className="mt-2 text-sm text-slate-600">
        Try increasing the max price or clearing one of the filters.
      </p>
    </Card>
  );
}
