'use client';

/**
 * File purpose: Student-facing tutor discovery page.
 *
 * This page now uses real Firebase-backed data:
 * - current student comes from Firebase Auth + users collection
 * - student learning profile comes from Firestore
 * - tutor profiles come from Firestore, not a hardcoded array
 * - trial session requests are written/read from Firestore
 */

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Container } from '@/shared/components/Container';
import { PageHeader } from '@/shared/components/PageHeader';
import { subscribeToCurrentUser } from '@/domains/auth/services/authService';
import type { AuthUser } from '@/domains/auth/types/auth';
import {
  getStoredLearningProfile,
  updateStoredLearningProfile,
} from '@/domains/students/learning-profile/services/learningProfileStorage';
import { timeBlockLabel } from '@/domains/students/learning-profile/utils/timeBlocks';
import {
  addPreBookingMessage,
  createTrialSessionRequest,
  subscribeToStudentTrialSessions,
} from '@/domains/sessions/trial-sessions/services/trialSessionService';
import type { TrialSessionRequest } from '@/domains/sessions/trial-sessions/types/trialSession';
import { TutorCard } from '@/domains/tutors/tutor-discovery/components/TutorCard';
import { TutorFiltersPanel } from '@/domains/tutors/tutor-discovery/components/TutorFiltersPanel';
import { TutorProfileModal } from '@/domains/tutors/tutor-discovery/components/TutorProfileModal';
import { PreBookingMessageModal } from '@/domains/sessions/trial-sessions/components/PreBookingMessageModal';
import { getTutorProfiles } from '@/domains/tutors/tutor-discovery/services/tutorProfileService';
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
import type { StudentLearningProfile } from '@/domains/students/learning-profile/types/learningProfile';

const SHORTLIST_STORAGE_PREFIX = 'logicgate-shortlisted-tutors';

/**
 * Student-facing tutor discovery page.
 *
 * Responsibilities stay split:
 * - services load/save Firebase data
 * - filterTutors owns matching/sorting logic
 * - TutorFiltersPanel owns filter editing UI
 * - TutorCard/TutorProfileModal own tutor presentation
 */
export function TutorDiscoveryPage() {
  const [currentStudent, setCurrentStudent] = useState<AuthUser | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentLearningProfile | null>(null);
  const [filters, setFilters] = useState<TutorFilters>(DEFAULT_TUTOR_FILTERS);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [isLoadingTutors, setIsLoadingTutors] = useState(true);
  const [studentRequests, setStudentRequests] = useState<TrialSessionRequest[]>([]);
  const [notice, setNotice] = useState('');
  const [selectedTutorId, setSelectedTutorId] = useState<string | null>(null);
  const [shortlistedTutorIds, setShortlistedTutorIds] = useState<string[]>([]);
  const [messageTutorId, setMessageTutorId] = useState<string | null>(null);
  const [isCreatingPreBookingRequest, setIsCreatingPreBookingRequest] = useState(false);

  useEffect(() => {
    /** Keep the page aware of the signed-in student for request ownership. */
    const unsubscribe = subscribeToCurrentUser((user) => {
      setCurrentStudent(user?.role === 'student' ? user : null);
    });

    return () => unsubscribe();
  }, []);


  useEffect(() => {
    if (!currentStudent || typeof window === 'undefined') return undefined;

    const timer = window.setTimeout(() => {
      const storedIds = window.localStorage.getItem(
        `${SHORTLIST_STORAGE_PREFIX}:${currentStudent.id}`
      );
      setShortlistedTutorIds(storedIds ? JSON.parse(storedIds) : []);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [currentStudent]);

  useEffect(() => {
    /** Load the saved onboarding profile and initialise filters from it. */
    let isMounted = true;

    async function loadStudentProfile() {
      const profile = await getStoredLearningProfile();

      if (!isMounted) return;

      setStudentProfile(profile);
      setFilters(profileToTutorFilters(profile));
    }

    void loadStudentProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    /** Load public tutor profiles from Firestore instead of a local array. */
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

  useEffect(() => {
    /** Keep this student's trial requests live so card statuses update. */
    if (!currentStudent) return undefined;

    return subscribeToStudentTrialSessions(currentStudent.id, setStudentRequests);
  }, [currentStudent]);

  const dynamicMaxTutorPrice = useMemo(
    () => getDynamicMaxTutorPrice(tutors),
    [tutors]
  );

  const effectiveFilters = useMemo(() => {
    if (
      filters.maxPricePerHour === DEFAULT_TUTOR_FILTERS.maxPricePerHour &&
      dynamicMaxTutorPrice > DEFAULT_TUTOR_FILTERS.maxPricePerHour
    ) {
      return {
        ...filters,
        maxPricePerHour: dynamicMaxTutorPrice,
      };
    }

    return filters;
  }, [dynamicMaxTutorPrice, filters]);

  const tutorsMatchingNonPriceFilters = useMemo(() => {
    /**
     * The price histogram should respond to the currently selected subject,
     * level, university, learning-style and availability filters, but not to
     * the price range itself. Otherwise the bars disappear while the student
     * is dragging the hourly-rate handles.
     */
    return filterTutors(
      tutors,
      {
        ...effectiveFilters,
        minPricePerHour: DEFAULT_TUTOR_FILTERS.minPricePerHour,
        maxPricePerHour: dynamicMaxTutorPrice,
      },
      studentProfile?.availability
    );
  }, [dynamicMaxTutorPrice, effectiveFilters, tutors, studentProfile]);

  const filteredTutors = useMemo(
    () =>
      tutorsMatchingNonPriceFilters.filter(
        (tutor) =>
          tutor.pricePerHour >= effectiveFilters.minPricePerHour &&
          tutor.pricePerHour <= effectiveFilters.maxPricePerHour
      ),
    [
      effectiveFilters.minPricePerHour,
      effectiveFilters.maxPricePerHour,
      tutorsMatchingNonPriceFilters,
    ]
  );

  const selectedTutor = tutors.find((tutor) => tutor.id === selectedTutorId) ?? null;

  const selectedTutorRequest = selectedTutor
    ? findExistingRequest(selectedTutor.id)
    : undefined;

  const messageTutor = tutors.find((tutor) => tutor.id === messageTutorId) ?? null;
  const messageTutorRequest = messageTutor
    ? findExistingRequest(messageTutor.id)
    : undefined;

  async function saveFiltersToOnboardingProfile() {
    const profileSelections = tutorFiltersToProfileSelections(filters);
    const nextProfile = await updateStoredLearningProfile(profileSelections);

    setStudentProfile(nextProfile);
    setNotice('Your learning profile has been updated from these filters.');
  }

  function clearFilters() {
    setFilters({
      ...DEFAULT_TUTOR_FILTERS,
      maxPricePerHour: dynamicMaxTutorPrice,
    });
  }

  function resetToOnboardingFilters() {
    if (!studentProfile) return;

    setFilters(profileToTutorFilters(studentProfile));
  }

  function findExistingRequest(tutorId: string) {
    return studentRequests.find((request) => request.tutorId === tutorId);
  }

  function handleViewProfile(tutor: Tutor) {
    setSelectedTutorId(tutor.id);
  }

  function handleMessageTutor(tutor: Tutor) {
    setMessageTutorId(tutor.id);
  }

  async function handleSendPreBookingMessage(tutor: Tutor, body: string) {
    if (!currentStudent) {
      setNotice('Please log in again before messaging a tutor.');
      return;
    }

    const trimmedBody = body.trim();
    if (!trimmedBody) return;

    const existingRequest = findExistingRequest(tutor.id);

    if (existingRequest) {
      await addPreBookingMessage({
        requestId: existingRequest.id,
        senderId: currentStudent.id,
        senderRole: 'student',
        senderName: currentStudent.name,
        body: trimmedBody,
      });
      setNotice(`Message sent to ${tutor.name}.`);
      return;
    }

    setIsCreatingPreBookingRequest(true);

    try {
      const profile = studentProfile ?? (await getStoredLearningProfile());
      const now = new Date().toISOString();

      await createTrialSessionRequest({
        tutorId: tutor.id,
        tutorName: tutor.name,
        studentId: currentStudent.id,
        studentName: currentStudent.name,
        studentEmail: currentStudent.email,
        subject:
          filters.subjects[0]?.subject ||
          profile.subjectSelections[0]?.subjects[0] ||
          tutor.subjects[0] ||
          'Not specified',
        level:
          filters.subjects[0]?.level ||
          filters.levels[0] ||
          profile.subjectSelections[0]?.category ||
          tutor.levels[0] ||
          'Not specified',
        learningStyle:
          filters.learningStyles[0] ||
          profile.learningStyles[0] ||
          tutor.learningStyles[0] ||
          'Not specified',
        preferredTime:
          profile.availability.map(timeBlockLabel).slice(0, 3).join(', ') ||
          tutor.availability,
        message: trimmedBody,
        preBookingMessages: [
          {
            id: crypto.randomUUID(),
            senderId: currentStudent.id,
            senderRole: 'student',
            senderName: currentStudent.name,
            body: trimmedBody,
            createdAt: now,
          },
        ],
      });

      setNotice(`Message sent to ${tutor.name}.`);
    } finally {
      setIsCreatingPreBookingRequest(false);
    }
  }

  function toggleShortlist(tutor: Tutor) {
    setShortlistedTutorIds((currentTutorIds) => {
      const isShortlisted = currentTutorIds.includes(tutor.id);
      const nextTutorIds = isShortlisted
        ? currentTutorIds.filter((id) => id !== tutor.id)
        : [...currentTutorIds, tutor.id];

      if (currentStudent && typeof window !== 'undefined') {
        window.localStorage.setItem(
          `${SHORTLIST_STORAGE_PREFIX}:${currentStudent.id}`,
          JSON.stringify(nextTutorIds)
        );
      }

      setNotice(
        isShortlisted
          ? `${tutor.name} removed from shortlist.`
          : `${tutor.name} added to shortlist.`
      );

      return nextTutorIds;
    });
  }

  async function requestTrial(tutor: Tutor) {
    if (!currentStudent) {
      setNotice('Please log in again before requesting a match.');
      return;
    }

    const existingRequest = findExistingRequest(tutor.id);

    if (existingRequest) {
      setNotice(`You have already sent a match request to ${tutor.name}.`);
      return;
    }

    const profile = studentProfile ?? (await getStoredLearningProfile());

    await createTrialSessionRequest({
      tutorId: tutor.id,
      tutorName: tutor.name,
      studentId: currentStudent.id,
      studentName: currentStudent.name,
      studentEmail: currentStudent.email,
      subject:
        filters.subjects[0]?.subject ||
        profile.subjectSelections[0]?.subjects[0] ||
        tutor.subjects[0] ||
        'Not specified',
      level:
        filters.subjects[0]?.level ||
        filters.levels[0] ||
        profile.subjectSelections[0]?.category ||
        tutor.levels[0] ||
        'Not specified',
      learningStyle:
        filters.learningStyles[0] ||
        profile.learningStyles[0] ||
        tutor.learningStyles[0] ||
        'Not specified',
      preferredTime:
        profile.availability.map(timeBlockLabel).slice(0, 3).join(', ') ||
        tutor.availability,
      message:
        'I would like to request a match. I want help identifying weak points and getting clearer resources before sessions.',
      preBookingMessages: [
        {
          id: crypto.randomUUID(),
          senderId: currentStudent.id,
          senderRole: 'student',
          senderName: currentStudent.name,
          body:
            'I would like to request a match. I want help identifying weak points and getting clearer resources before sessions.',
          createdAt: new Date().toISOString(),
        },
      ],
    });

    setNotice(`Match request sent to ${tutor.name}.`);
  }

  return (
    <main className="min-h-screen bg-[#f8f7f4]">
      <PageHeader
        eyebrow="Student area"
        title="Find your match."
        description="Use your learning profile to narrow tutors by subject, level, style, university, rating, and price."
      />

      <Container className="grid items-start gap-8 py-10 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="lg:sticky lg:top-8">
          <TutorFiltersPanel
            filters={effectiveFilters}
            allTutors={tutorsMatchingNonPriceFilters}
            onChange={setFilters}
            onClear={clearFilters}
            onResetToOnboarding={resetToOnboardingFilters}
            onSaveToOnboarding={() => void saveFiltersToOnboardingProfile()}
          />
        </div>

        <section className="min-w-0">
          <TutorResultsHeader
            notice={notice}
            tutorCount={filteredTutors.length}
            isLoading={isLoadingTutors}
          />

          {isLoadingTutors ? (
            <Card>
              <p className="text-sm text-slate-600">Loading tutors from Firebase...</p>
            </Card>
          ) : filteredTutors.length === 0 ? (
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

      {selectedTutor && (
        <TutorProfileModal
          tutor={selectedTutor}
          existingRequest={selectedTutorRequest}
          isShortlisted={shortlistedTutorIds.includes(selectedTutor.id)}
          onClose={() => setSelectedTutorId(null)}
          onMessage={handleMessageTutor}
          onToggleShortlist={toggleShortlist}
          onRequestTrial={requestTrial}
        />
      )}


      {messageTutor && (
        <PreBookingMessageModal
          tutor={messageTutor}
          request={messageTutorRequest}
          currentUserId={currentStudent?.id}
          isCreatingRequest={isCreatingPreBookingRequest}
          onClose={() => setMessageTutorId(null)}
          onSend={(body) => handleSendPreBookingMessage(messageTutor, body)}
        />
      )}
    </main>
  );
}

function roundUpToStep(value: number, step = 5) {
  return Math.ceil(value / step) * step;
}

function getDynamicMaxTutorPrice(tutors: Tutor[]) {
  const highestTutorPrice = Math.max(
    DEFAULT_TUTOR_FILTERS.maxPricePerHour,
    ...tutors.map((tutor) => tutor.pricePerHour)
  );

  return Math.max(100, roundUpToStep(highestTutorPrice));
}

function TutorResultsHeader({
  notice,
  tutorCount,
  isLoading,
}: {
  notice: string;
  tutorCount: number;
  isLoading: boolean;
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
            {isLoading ? 'Loading tutors' : `${tutorCount} available matches`}
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
        Tutor profiles now come from Firebase. Create tutor accounts and complete
        tutor onboarding to add searchable tutor profiles.
      </p>
    </Card>
  );
}
