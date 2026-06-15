'use client';

/**
 * File purpose: Main student dashboard for ongoing tutor support.
 */

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MathRenderer } from '@/domains/async-support/components/MathRenderer';
import { RelationshipListState } from '@/domains/async-support/components/RelationshipListState';
import { SupportRelationshipCard } from '@/domains/async-support/components/SupportRelationshipCard';
import { RelationshipSupportModal } from '@/domains/async-support/components/RelationshipSupportModal';
import type { RelationshipSupportModalFeature } from '@/domains/async-support/components/RelationshipSupportModal';
import { useRelationshipSummaries } from '@/domains/async-support/hooks/useRelationshipSummaries';
import type { RelationshipSupportSummary } from '@/domains/async-support/types/asyncSupport';
import { subscribeToCurrentUser } from '@/domains/auth/services/authService';
import type { AuthUser } from '@/domains/auth/types/auth';
import { MySessionsTab } from '@/domains/booking/components/sessions/MySessionsTab';
import type { BookingRequest } from '@/domains/booking/types/booking';
import { useBookings } from '@/domains/booking/hooks/useBookings';
import { PreBookingMessageModal } from '@/domains/sessions/trial-sessions/components/PreBookingMessageModal';
import { TrialStatusBadge } from '@/domains/sessions/trial-sessions/components/TrialStatusBadge';
import {
  addMatchRequestToPreBookingConversation,
  addPreBookingMessage,
  cancelTrialSessionRequest,
  withdrawMatchRequestFromPreBookingConversation,
  createTrialSessionRequest,
  markPreBookingMessagesSeen,
  subscribeToStudentTrialSessions,
  updateTrialSessionStatus,
} from '@/domains/sessions/trial-sessions/services/trialSessionService';
import type { TrialSessionRequest } from '@/domains/sessions/trial-sessions/types/trialSession';
import {
  getTrialRequestDisplayPriority,
  hasRequestedMatch,
} from '@/domains/sessions/trial-sessions/utils/trialRequestState';
import { getStoredLearningProfile } from '@/domains/students/learning-profile/services/learningProfileStorage';
import { timeBlockLabel } from '@/domains/students/learning-profile/utils/timeBlocks';
import { TutorProfileModal } from '@/domains/tutors/tutor-discovery/components/TutorProfileModal';
import { getTutorProfiles } from '@/domains/tutors/tutor-discovery/services/tutorProfileService';
import type { Tutor } from '@/domains/tutors/tutor-discovery/types/tutor';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Container } from '@/shared/components/Container';
import { ROUTES } from '@/shared/constants/routes';
import { cn } from '@/shared/utils/cn';
import { formatStoredSubjectLabel } from '@/shared/utils/subjectLabels';

type Section =
  | 'my-tutors'
  | 'pending-tutors'
  | 'my-sessions'
  | 'learning-profile'
  | 'find-tutors';

type ActiveSupportModal = {
  relationshipId: string;
  feature: RelationshipSupportModalFeature;
  personName: string;
} | null;

type PendingFilter = 'shortlisted' | 'messaged' | 'requested';

type PendingTutorItem = {
  tutor: Tutor;
  request?: TrialSessionRequest;
  reasons: PendingFilter[];
};

const SHORTLIST_STORAGE_PREFIX = 'logicgate-shortlisted-tutors';

const tabs: Array<{ id: Section; label: string; description: string }> = [
  {
    id: 'my-tutors',
    label: 'My tutors',
    description: 'Confirmed support',
  },
  {
    id: 'pending-tutors',
    label: 'Pending tutors',
    description: 'Shortlist & requests',
  },
  {
    id: 'my-sessions',
    label: 'My sessions',
    description: 'Book & manage',
  },
  {
    id: 'learning-profile',
    label: 'Learning profile',
    description: 'Edit preferences',
  },
  {
    id: 'find-tutors',
    label: 'Find tutors',
    description: 'Browse matches',
  },
];

const STUDENT_SECTIONS: Section[] = [
  'my-tutors',
  'pending-tutors',
  'my-sessions',
  'learning-profile',
  'find-tutors',
];

const pendingFilters: Array<{ id: PendingFilter; label: string }> = [
  { id: 'shortlisted', label: 'Shortlisted' },
  { id: 'messaged', label: 'Messaged' },
  { id: 'requested', label: 'Requested' },
];

function activeSectionFromParams(searchParams: ReturnType<typeof useSearchParams>): Section {
  const section = searchParams.get('section');
  if (section && STUDENT_SECTIONS.includes(section as Section)) {
    return section as Section;
  }
  return 'my-tutors';
}

export function StudentDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSection = activeSectionFromParams(searchParams);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const { relationships, isLoading, error } = useRelationshipSummaries('student');
  const [supportModal, setSupportModal] = useState<ActiveSupportModal>(null);
  const { upcomingSessions } = useBookings(currentUser?.id ?? '', 'student');
  const todayUpcomingCount = upcomingSessions.filter((b) => {
    const d = b.date.toDate();
    const today = new Date();
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  }).length;

  function setActiveSection(section: Section) {
    router.replace(`/student/dashboard?section=${section}`, { scroll: false });
  }

  useEffect(() => {
    const unsub = subscribeToCurrentUser((user) => {
      setCurrentUser(user?.role === 'student' ? user : null);
    });
    return unsub;
  }, []);

  return (
    <Container className="grid gap-6 py-8">
      <div className="grid items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <SideTabs
          tabs={tabs}
          activeTab={activeSection}
          onChange={setActiveSection}
          badgeCounts={{ 'my-sessions': todayUpcomingCount }}
        />

        <main className="min-w-0">
          {activeSection === 'my-sessions' ? (
            <MySessionsTab
              userId={currentUser?.id ?? ''}
              role="student"
              counterparties={relationships.map((r) => ({
                id: r.tutorId,
                name: r.tutorName,
              }))}
              getOtherPartyName={(b: BookingRequest) => {
                const rel = relationships.find((r) => r.tutorId === b.tutorId);
                return rel?.tutorName ?? 'Tutor';
              }}
              getWorkspaceHref={(b: BookingRequest) => {
                const rel = relationships.find(
                  (r) => r.tutorId === b.tutorId && r.studentId === b.studentId
                );
                return rel ? `/student/dashboard/support/${rel.id}/workspace` : undefined;
              }}
            />
          ) : activeSection === 'pending-tutors' ? (
            <PendingTutorsPanel
              currentStudent={currentUser}
              confirmedTutorIds={relationships.map((relationship) => relationship.tutorId)}
            />
          ) : (
            <RelationshipContent
              activeSection={activeSection}
              relationships={relationships}
              isLoading={isLoading}
              error={error}
              currentUserId={currentUser?.id ?? ''}
              onOpenSupport={(relationship, feature) =>
                setSupportModal({
                  relationshipId: relationship.id,
                  feature,
                  personName: relationship.tutorName || 'your tutor',
                })
              }
            />
          )}
        </main>
      </div>

      {supportModal ? (
        <RelationshipSupportModal
          relationshipId={supportModal.relationshipId}
          viewerRole="student"
          feature={supportModal.feature}
          title={
            supportModal.feature === 'messages'
              ? `Messages with ${supportModal.personName}`
              : `Shared resources with ${supportModal.personName}`
          }
          description={
            supportModal.feature === 'messages'
              ? 'Continue the accepted support conversation without leaving the dashboard.'
              : 'Upload, view, and manage shared lesson files without leaving the dashboard.'
          }
          onClose={() => setSupportModal(null)}
        />
      ) : null}
    </Container>
  );
}

function RelationshipContent({
  activeSection,
  relationships,
  isLoading,
  error,
  currentUserId,
  onOpenSupport,
}: {
  activeSection: Section;
  relationships: RelationshipSupportSummary[];
  isLoading: boolean;
  error: string | null;
  currentUserId: string;
  onOpenSupport: (relationship: RelationshipSupportSummary, feature: RelationshipSupportModalFeature) => void;
}) {
  if (activeSection === 'learning-profile') {
    return (
      <ActionCard
        title="Learning profile"
        description="Edit the subjects, learning styles, universities, and availability used to match you with tutors."
        href={ROUTES.studentOnboardingSubjects}
        buttonLabel="Edit learning profile"
      />
    );
  }

  if (activeSection === 'find-tutors') {
    return (
      <ActionCard
        title="Find tutors"
        description="Browse tutors that match your learning profile and request a match."
        href={ROUTES.studentTutors}
        buttonLabel="Find tutors"
      />
    );
  }

  if (isLoading || error || relationships.length === 0) {
    return (
      <RelationshipListState
        isLoading={isLoading}
        error={error}
        isEmpty={relationships.length === 0}
        emptyTitle="No tutors yet"
        emptyDescription="When a tutor accepts your request, they will appear here with message, resource, session, and workspace actions."
      />
    );
  }

  return (
    <div className="grid gap-4">
      {relationships.map((relationship) => (
        <SupportRelationshipCard
          key={relationship.id}
          relationship={relationship}
          viewerRole="student"
          currentUserId={currentUserId}
          actions={getStudentRelationshipActions(relationship, onOpenSupport)}
        />
      ))}
    </div>
  );
}

function PendingTutorsPanel({
  currentStudent,
  confirmedTutorIds,
}: {
  currentStudent: AuthUser | null;
  confirmedTutorIds: string[];
}) {
  const [requests, setRequests] = useState<TrialSessionRequest[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [shortlistedTutorIds, setShortlistedTutorIds] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<PendingFilter[]>(
    pendingFilters.map((filter) => filter.id)
  );
  const [selectedTutorId, setSelectedTutorId] = useState<string | null>(null);
  const [messageTutorId, setMessageTutorId] = useState<string | null>(null);
  const [isCreatingRequest, setIsCreatingRequest] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!currentStudent) return undefined;
    return subscribeToStudentTrialSessions(currentStudent.id, setRequests);
  }, [currentStudent]);

  useEffect(() => {
    let isMounted = true;

    async function loadTutors() {
      const profiles = await getTutorProfiles();
      if (isMounted) {
        setTutors(profiles);
      }
    }

    void loadTutors();

    return () => {
      isMounted = false;
    };
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

  const pendingItems = useMemo(() => {
    const items = new Map<string, PendingTutorItem>();
    const confirmedTutorIdSet = new Set(confirmedTutorIds);

    for (const tutorId of shortlistedTutorIds) {
      if (confirmedTutorIdSet.has(tutorId)) continue;

      const tutor = tutors.find((candidate) => candidate.id === tutorId);
      if (!tutor) continue;

      items.set(tutor.id, { tutor, reasons: ['shortlisted'] });
    }

    for (const request of requests) {
      if (request.status === 'accepted' || confirmedTutorIdSet.has(request.tutorId)) {
        continue;
      }

      const tutor = tutors.find((candidate) => candidate.id === request.tutorId);
      if (!tutor) continue;

      const existing = items.get(tutor.id) ?? { tutor, reasons: [] };
      const reasons = new Set<PendingFilter>(existing.reasons);
      const storedReasons = request.pendingReasons ?? [];

      if (hasRequestedMatch(request)) {
        reasons.add('requested');
      }

      if (storedReasons.includes('messaged') || (request.preBookingMessages ?? []).length > 0) {
        reasons.add('messaged');
      }

      if (reasons.size === 0) {
        reasons.add('requested');
      }

      const existingRequest = existing.request;
      const shouldUseThisRequest =
        !existingRequest ||
        getTrialRequestDisplayPriority(request) > getTrialRequestDisplayPriority(existingRequest) ||
        (getTrialRequestDisplayPriority(request) === getTrialRequestDisplayPriority(existingRequest) &&
          getRequestUpdatedMillis(request) > getRequestUpdatedMillis(existingRequest));
      const bestRequest = shouldUseThisRequest ? request : existingRequest;

      items.set(tutor.id, {
        tutor,
        request: bestRequest,
        reasons: [...reasons],
      });
    }

    const tutorOrder = new Map(tutors.map((tutor, index) => [tutor.id, index]));
    const allItems = [...items.values()].sort(
      (left, right) =>
        (tutorOrder.get(left.tutor.id) ?? Number.MAX_SAFE_INTEGER) -
        (tutorOrder.get(right.tutor.id) ?? Number.MAX_SAFE_INTEGER)
    );

    if (activeFilters.length === 0) {
      return [];
    }

    return allItems.filter((item) =>
      activeFilters.some((filter) => item.reasons.includes(filter))
    );
  }, [activeFilters, confirmedTutorIds, requests, shortlistedTutorIds, tutors]);

  const selectedTutor = tutors.find((tutor) => tutor.id === selectedTutorId) ?? null;
  const selectedTutorRequest = selectedTutor
    ? getLatestRequestForTutor(requests, selectedTutor.id)
    : undefined;
  const messageTutor = tutors.find((tutor) => tutor.id === messageTutorId) ?? null;
  const messageTutorRequest = messageTutor
    ? getLatestRequestForTutor(requests, messageTutor.id)
    : undefined;

  function toggleFilter(filter: PendingFilter) {
    setActiveFilters((currentFilters) =>
      currentFilters.includes(filter)
        ? currentFilters.filter((item) => item !== filter)
        : [...currentFilters, filter]
    );
  }

  function toggleShortlist(tutor: Tutor) {
    if (!currentStudent || typeof window === 'undefined') return;

    setShortlistedTutorIds((currentTutorIds) => {
      const isShortlisted = currentTutorIds.includes(tutor.id);
      const nextTutorIds = isShortlisted
        ? currentTutorIds.filter((id) => id !== tutor.id)
        : [...currentTutorIds, tutor.id];

      window.localStorage.setItem(
        `${SHORTLIST_STORAGE_PREFIX}:${currentStudent.id}`,
        JSON.stringify(nextTutorIds)
      );

      return nextTutorIds;
    });
  }

  async function openPendingTutorMessage(item: PendingTutorItem) {
    setMessageTutorId(item.tutor.id);

    if (item.request) {
      await markPreBookingMessagesSeen(item.request.id, 'student');
    }
  }

  async function sendPreBookingMessage(tutor: Tutor, body: string) {
    if (!currentStudent) {
      setNotice('Please log in again before messaging a tutor.');
      return;
    }

    const trimmedBody = body.trim();
    if (!trimmedBody) return;

    const existingRequest = getLatestRequestForTutor(requests, tutor.id);

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

    setIsCreatingRequest(true);

    try {
      const profile = await getStoredLearningProfile();
      const now = new Date().toISOString();

      await createTrialSessionRequest({
        tutorId: tutor.id,
        tutorName: tutor.name,
        studentId: currentStudent.id,
        studentName: currentStudent.name,
        studentEmail: currentStudent.email,
        subject:
          profile.subjectSelections[0]?.subjects[0] ||
          tutor.subjects[0] ||
          'Not specified',
        level:
          profile.subjectSelections[0]?.category ||
          tutor.levels[0] ||
          'Not specified',
        learningStyle:
          profile.learningStyles[0] || tutor.learningStyles[0] || 'Not specified',
        preferredTime:
          profile.availability.map(timeBlockLabel).slice(0, 3).join(', ') ||
          tutor.availability,
        message: trimmedBody,
        pendingReasons: ['messaged'],
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
      setIsCreatingRequest(false);
    }
  }


  async function requestMatch(tutor: Tutor) {
    if (!currentStudent) {
      setNotice('Please log in again before requesting a match.');
      return;
    }

    const existingRequest = getLatestRequestForTutor(requests, tutor.id);
    if (existingRequest) {
      if (existingRequest.status === 'rejected') {
        await updateTrialSessionStatus(existingRequest.id, 'pending');
        await addMatchRequestToPreBookingConversation({
          requestId: existingRequest.id,
          senderId: currentStudent.id,
          senderName: currentStudent.name,
        });
        setNotice(`Match request sent again to ${tutor.name}.`);
        return;
      }

      const requestedAlready = hasRequestedMatch(existingRequest);

      if (requestedAlready) {
        const remainingMessages = (existingRequest.preBookingMessages ?? []).filter(
          (message) => !isAutomaticMatchRequestMessage(message.body)
        );

        if (remainingMessages.length > 0) {
          await withdrawMatchRequestFromPreBookingConversation({
            requestId: existingRequest.id,
            remainingMessages,
          });
        } else {
          await cancelTrialSessionRequest(existingRequest.id);
        }

        setNotice(`Match request withdrawn from ${tutor.name}.`);
        return;
      }

      await addMatchRequestToPreBookingConversation({
        requestId: existingRequest.id,
        senderId: currentStudent.id,
        senderName: currentStudent.name,
      });
      setNotice(`Match request sent to ${tutor.name}.`);
      return;
    }

    const profile = await getStoredLearningProfile();

    await createTrialSessionRequest({
      tutorId: tutor.id,
      tutorName: tutor.name,
      studentId: currentStudent.id,
      studentName: currentStudent.name,
      studentEmail: currentStudent.email,
      subject:
        profile.subjectSelections[0]?.subjects[0] || tutor.subjects[0] || 'Not specified',
      level:
        profile.subjectSelections[0]?.category || tutor.levels[0] || 'Not specified',
      learningStyle:
        profile.learningStyles[0] || tutor.learningStyles[0] || 'Not specified',
      preferredTime:
        profile.availability.map(timeBlockLabel).slice(0, 3).join(', ') ||
        tutor.availability,
      message: '',
      pendingReasons: ['requested'],
      preBookingMessages: [],
    });

    setNotice(`Match request sent to ${tutor.name}.`);
  }

  return (
    <div className="grid gap-5">
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              Pending tutors
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Tutors you have shortlisted, messaged, or requested before they move into My tutors.
            </p>
          </div>

          <PendingFilterPills
            filters={pendingFilters}
            activeFilters={activeFilters}
            onToggle={toggleFilter}
          />
        </div>
      </Card>

      {notice ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
          {notice}
        </div>
      ) : null}

      {pendingItems.length === 0 ? (
        <Card>
          <p className="font-medium text-slate-950">No pending tutors yet.</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Shortlisted tutors, pre-booking messages, and pending match requests will appear here.
          </p>
          <div className="mt-4">
            <Button href={ROUTES.studentTutors}>Find tutors</Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pendingItems.map((item) => (
            <PendingTutorCard
              key={item.tutor.id}
              item={item}
              isShortlisted={shortlistedTutorIds.includes(item.tutor.id)}
              onViewProfile={() => setSelectedTutorId(item.tutor.id)}
              onMessage={() => void openPendingTutorMessage(item)}
              onToggleShortlist={() => toggleShortlist(item.tutor)}
              onRequestMatch={() => void requestMatch(item.tutor)}
              currentUserId={currentStudent?.id ?? ''}
            />
          ))}
        </div>
      )}

      {selectedTutor ? (
        <TutorProfileModal
          tutor={selectedTutor}
          existingRequest={selectedTutorRequest}
          isShortlisted={shortlistedTutorIds.includes(selectedTutor.id)}
          onClose={() => setSelectedTutorId(null)}
          onMessage={() => void openPendingTutorMessage({ tutor: selectedTutor, request: selectedTutorRequest, reasons: [] })}
          onToggleShortlist={toggleShortlist}
          onRequestTrial={(tutor) => void requestMatch(tutor)}
        />
      ) : null}

      {messageTutor ? (
        <PreBookingMessageModal
          tutor={messageTutor}
          request={messageTutorRequest}
          currentUserId={currentStudent?.id}
          viewerRole="student"
          isCreatingRequest={isCreatingRequest}
          onClose={() => setMessageTutorId(null)}
          onSend={(body) => sendPreBookingMessage(messageTutor, body)}
        />
      ) : null}
    </div>
  );
}

function PendingTutorCard({
  item,
  isShortlisted,
  currentUserId,
  onViewProfile,
  onMessage,
  onToggleShortlist,
  onRequestMatch,
}: {
  item: PendingTutorItem;
  isShortlisted: boolean;
  currentUserId: string;
  onViewProfile: () => void;
  onMessage: () => void;
  onToggleShortlist: () => void;
  onRequestMatch: () => void;
}) {
  const latestMessage = getLatestPreBookingMessage(item.request);
  const unreadCount = getUnreadPreBookingCount(item.request, currentUserId);
  const isRejected = item.request?.status === 'rejected';
  const hasRequested = item.reasons.includes('requested') && !isRejected;
  const requestButtonLabel = isRejected
    ? 'Request again'
    : hasRequested
      ? 'Unsend request'
      : 'Request match';

  return (
    <Card className="grid gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Tutor
          </p>

          <ProfileNameButton label={item.tutor.name || 'Unnamed'} onClick={onViewProfile} />

          <p className="mt-1 text-sm text-slate-600">
            {formatStoredSubjectLabel({ level: item.tutor.levels[0], subject: item.tutor.subjects[0] }) || 'Subject not set'}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {item.reasons.map((reason) => (
              <span
                key={reason}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-semibold capitalize',
                  getPendingTutorReasonBadgeClass(reason)
                )}
              >
                {reason}
              </span>
            ))}
            {item.request && hasRequestedMatch(item.request) ? (
              <TrialStatusBadge status={item.request.status} />
            ) : null}
          </div>

          <PendingLatestMessageSummary latestMessage={latestMessage} />
        </div>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          {unreadCount > 0 ? (
            <PendingMetricBadge label="Unread" value={unreadCount} active />
          ) : (
            <PendingMetricBadge label="Unread" value={0} />
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={onToggleShortlist}>
          {isShortlisted ? 'Shortlisted' : 'Shortlist'}
        </Button>
        <Button variant="secondary" onClick={onMessage}>
          Message
        </Button>
        <Button variant={hasRequested ? 'secondary' : 'primary'} onClick={onRequestMatch}>
          {requestButtonLabel}
        </Button>
      </div>
    </Card>
  );
}


function getPendingTutorReasonBadgeClass(reason: PendingFilter) {
  if (reason === 'requested') return 'logicgate-status-pending';
  if (reason === 'messaged') return 'logicgate-status-info';
  return 'logicgate-status-neutral';
}

function PendingFilterPills<T extends string>({
  filters,
  activeFilters,
  onToggle,
}: {
  filters: Array<{ id: T; label: string }>;
  activeFilters: T[];
  onToggle: (filter: T) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Filters
        </span>
        {filters.map((filter) => {
          const isActive = activeFilters.includes(filter.id);

          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => onToggle(filter.id)}
              aria-pressed={isActive}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                isActive
                  ? 'border-slate-950 bg-slate-950 text-white shadow-sm'
                  : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'flex h-3.5 w-3.5 items-center justify-center rounded-full border text-[0.55rem]',
                  isActive ? 'border-white bg-white text-slate-950' : 'border-slate-300 text-transparent'
                )}
              >
                ✓
              </span>
              {filter.label}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Showing tutors that match any selected filter.
      </p>
    </div>
  );
}

function PendingLatestMessageSummary({
  latestMessage,
}: {
  latestMessage: NonNullable<TrialSessionRequest['preBookingMessages']>[number] | null;
}) {
  if (!latestMessage) {
    return (
      <p className="mt-3 text-sm text-slate-500">
        No messages yet. Use Message to ask a clarifying question before booking.
      </p>
    );
  }

  return (
    <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        Latest message
      </p>
      <p className="mt-1 line-clamp-2 text-sm text-slate-700">
        <span className="font-semibold text-slate-900">
          {latestMessage.senderName || 'Unknown user'}:
        </span>{' '}
        <MathRenderer value={latestMessage.body} />
      </p>
      <p className="mt-1 text-xs text-slate-500">
        {formatPendingCardTime(latestMessage.createdAt)}
      </p>
    </div>
  );
}

function PendingMetricBadge({
  label,
  value,
  active = false,
}: {
  label: string;
  value: number;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        'min-w-20 rounded-2xl border px-3 py-2 text-center',
        active
          ? 'border-slate-950 bg-slate-950 text-white'
          : 'border-slate-200 bg-slate-50 text-slate-600'
      )}
    >
      <p className="text-lg font-semibold leading-none">{value}</p>
      <p className={cn('mt-1 text-[0.65rem] font-semibold uppercase tracking-wide', active ? 'text-slate-300' : 'text-slate-500')}>
        {label}
      </p>
    </div>
  );
}



function getLatestRequestForTutor(
  requests: TrialSessionRequest[],
  tutorId: string
) {
  return requests
    .filter((request) => request.tutorId === tutorId)
    .sort((a, b) => {
      const priorityDifference =
        getTrialRequestDisplayPriority(b) - getTrialRequestDisplayPriority(a);

      if (priorityDifference !== 0) {
        return priorityDifference;
      }

      return getRequestUpdatedMillis(b) - getRequestUpdatedMillis(a);
    })[0];
}

function getRequestUpdatedMillis(request: TrialSessionRequest) {
  const updatedAtMillis = timestampToMillis(request.updatedAt);
  if (updatedAtMillis) return updatedAtMillis;

  const createdAtMillis = timestampToMillis(request.createdAt);
  if (createdAtMillis) return createdAtMillis;

  const latestMessage = request.preBookingMessages?.at(-1);
  if (!latestMessage?.createdAt) return 0;

  const messageMillis = new Date(latestMessage.createdAt).getTime();
  return Number.isNaN(messageMillis) ? 0 : messageMillis;
}

function timestampToMillis(value: unknown) {
  if (!value) return 0;

  if (typeof value === 'string') {
    const millis = new Date(value).getTime();
    return Number.isNaN(millis) ? 0 : millis;
  }

  if (typeof value === 'object' && value !== null) {
    const timestampLike = value as { toMillis?: () => number; toDate?: () => Date };
    if (typeof timestampLike.toMillis === 'function') {
      return timestampLike.toMillis();
    }
    if (typeof timestampLike.toDate === 'function') {
      return timestampLike.toDate().getTime();
    }
  }

  return 0;
}

function isAutomaticMatchRequestMessage(body: string) {
  return body.toLowerCase().includes('request a match');
}

function getLatestPreBookingMessage(request?: TrialSessionRequest) {
  const messages = request?.preBookingMessages ?? [];
  return messages.length > 0 ? messages[messages.length - 1] : null;
}

function getUnreadPreBookingCount(request: TrialSessionRequest | undefined, currentUserId: string) {
  if (!request || !currentUserId) return 0;

  const seenAt = normaliseSeenDate(request.studentPreBookingSeenAt);

  return (request.preBookingMessages ?? []).filter((message) => {
    if (message.senderId === currentUserId) return false;
    if (!message.createdAt) return true;
    return !seenAt || message.createdAt > seenAt;
  }).length;
}

function normaliseSeenDate(value: unknown) {
  if (!value) return undefined;

  if (typeof value === 'string') return value;

  if (typeof value === 'object' && value !== null) {
    const timestampLike = value as { toDate?: () => Date };
    if (typeof timestampLike.toDate === 'function') {
      return timestampLike.toDate().toISOString();
    }
  }

  return undefined;
}

function formatPendingCardTime(value?: string) {
  if (!value) return 'Just now';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just now';

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function ProfileNameButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-950 transition hover:border-slate-300 hover:bg-slate-100"
    >
      {label}
      <ProfileIcon />
    </button>
  );
}

function ProfileIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5 text-slate-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="5" r="3" />
      <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    </svg>
  );
}

function SideTabs<T extends string>({
  tabs,
  activeTab,
  onChange,
  badgeCounts,
}: {
  tabs: Array<{ id: T; label: string; description: string }>;
  activeTab: T;
  onChange: (tab: T) => void;
  badgeCounts?: Partial<Record<T, number>>;
}) {
  return (
    <aside className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="grid gap-2">
        {tabs.map((tab) => {
          const badge = badgeCounts?.[tab.id];
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={cn(
                'rounded-2xl px-4 py-3 text-left transition',
                activeTab === tab.id
                  ? 'bg-slate-950 text-white'
                  : 'text-slate-700 hover:bg-slate-50'
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">{tab.label}</span>
                {badge ? (
                  <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[0.6rem] font-bold text-white">
                    {badge}
                  </span>
                ) : null}
              </span>
              <span
                className={cn(
                  'mt-1 block text-xs leading-5',
                  activeTab === tab.id ? 'text-slate-300' : 'text-slate-500'
                )}
              >
                {tab.description}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function ActionCard({
  title,
  description,
  href,
  buttonLabel,
}: {
  title: string;
  description: string;
  href: string;
  buttonLabel: string;
}) {
  return (
    <Card className="grid gap-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </div>

      <div>
        <Button href={href}>{buttonLabel}</Button>
      </div>
    </Card>
  );
}

function getStudentRelationshipActions(
  relationship: RelationshipSupportSummary,
  onOpenSupport: (relationship: RelationshipSupportSummary, feature: RelationshipSupportModalFeature) => void
) {
  const baseHref = `/student/dashboard/support/${relationship.id}`;

  return [
    {
      label: 'Message',
      onClick: () => onOpenSupport(relationship, 'messages'),
    },
    {
      label: 'Shared resources',
      onClick: () => onOpenSupport(relationship, 'resources'),
    },
    {
      label: 'Workspace',
      href: `${baseHref}/workspace`,
    },
  ];
}
