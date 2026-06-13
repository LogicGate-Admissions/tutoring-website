'use client';

/**
 * File purpose: Main tutor dashboard for ongoing student support.
 */

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  acceptTrialSessionRequest,
  addPreBookingMessage,
  ensureTutorStudentLink,
  markPreBookingMessagesSeen,
  subscribeToTutorTrialSessions,
  updateTrialSessionStatus,
} from '@/domains/sessions/trial-sessions/services/trialSessionService';
import type { TrialSessionRequest } from '@/domains/sessions/trial-sessions/types/trialSession';
import { hasRequestedMatch } from '@/domains/sessions/trial-sessions/utils/trialRequestState';
import { StudentProfileModal } from '@/domains/students/learning-profile/components/StudentProfileModal';
import { getStudentLearningProfileById } from '@/domains/students/learning-profile/services/learningProfileStorage';
import type { StudentLearningProfile } from '@/domains/students/learning-profile/types/learningProfile';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Container } from '@/shared/components/Container';
import { ROUTES } from '@/shared/constants/routes';
import { cn } from '@/shared/utils/cn';

type Section = 'my-students' | 'pending-students' | 'my-sessions' | 'tutor-profile';
type ActiveSupportModal = {
  relationshipId: string;
  feature: RelationshipSupportModalFeature;
  personName: string;
} | null;

type PendingFilter = 'messaged' | 'requested' | 'rejected';

const tabs: Array<{ id: Section; label: string; description: string }> = [
  {
    id: 'my-students',
    label: 'My students',
    description: 'Confirmed support',
  },
  {
    id: 'pending-students',
    label: 'Pending students',
    description: 'Requests & messages',
  },
  {
    id: 'my-sessions',
    label: 'My sessions',
    description: 'Book & manage',
  },
  {
    id: 'tutor-profile',
    label: 'My profile',
    description: 'Edit your profile',
  },
];

const TUTOR_SECTIONS: Section[] = [
  'my-students',
  'pending-students',
  'my-sessions',
  'tutor-profile',
];

const pendingFilters: Array<{ id: PendingFilter; label: string }> = [
  { id: 'messaged', label: 'Messaged' },
  { id: 'requested', label: 'Requested' },
  { id: 'rejected', label: 'Rejected' },
];

function activeSectionFromParams(searchParams: ReturnType<typeof useSearchParams>): Section {
  const section = searchParams.get('section');
  if (section === 'trial-requests') {
    return 'pending-students';
  }
  if (section && TUTOR_SECTIONS.includes(section as Section)) {
    return section as Section;
  }
  return 'my-students';
}

export function TutorDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSection = activeSectionFromParams(searchParams);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const { relationships, isLoading, error } = useRelationshipSummaries('tutor');
  const [supportModal, setSupportModal] = useState<ActiveSupportModal>(null);
  const { upcomingSessions } = useBookings(currentUser?.id ?? '', 'tutor');
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
    router.replace(`/tutor/dashboard?section=${section}`, { scroll: false });
  }

  useEffect(() => {
    const unsub = subscribeToCurrentUser((user) => {
      setCurrentUser(user?.role === 'tutor' ? user : null);
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
              role="tutor"
              counterparties={relationships.map((r) => ({
                id: r.studentId,
                name: r.studentName,
              }))}
              getOtherPartyName={(b: BookingRequest) => {
                const rel = relationships.find((r) => r.studentId === b.studentId);
                return rel?.studentName ?? 'Student';
              }}
              getWorkspaceHref={(b: BookingRequest) => {
                const rel = relationships.find(
                  (r) => r.tutorId === b.tutorId && r.studentId === b.studentId
                );
                return rel ? `/tutor/dashboard/support/${rel.id}/workspace` : undefined;
              }}
            />
          ) : activeSection === 'pending-students' ? (
            <PendingStudentsPanel
              currentTutor={currentUser}
              confirmedStudentIds={relationships.map((relationship) => relationship.studentId)}
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
                  personName: relationship.studentName || 'your student',
                })
              }
            />
          )}
        </main>
      </div>

      {supportModal ? (
        <RelationshipSupportModal
          relationshipId={supportModal.relationshipId}
          viewerRole="tutor"
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
  if (activeSection === 'tutor-profile') {
    return (
      <ActionCard
        title="My profile"
        description="Edit the subjects, degree, university, pricing, learning styles and availability shown to students."
        href={ROUTES.tutorOnboarding}
        buttonLabel="Edit my profile"
      />
    );
  }

  if (isLoading || error || relationships.length === 0) {
    return (
      <RelationshipListState
        isLoading={isLoading}
        error={error}
        isEmpty={relationships.length === 0}
        emptyTitle="No students yet"
        emptyDescription="When you accept a student, they will appear here with message, resource, session, and workspace actions."
      />
    );
  }

  return (
    <div className="grid gap-4">
      {relationships.map((relationship) => (
        <SupportRelationshipCard
          key={relationship.id}
          relationship={relationship}
          viewerRole="tutor"
          currentUserId={currentUserId}
          actions={getTutorRelationshipActions(relationship, onOpenSupport)}
        />
      ))}
    </div>
  );
}

function PendingStudentsPanel({
  currentTutor,
  confirmedStudentIds,
}: {
  currentTutor: AuthUser | null;
  confirmedStudentIds: string[];
}) {
  const [requests, setRequests] = useState<TrialSessionRequest[]>([]);
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<PendingFilter[]>(
    pendingFilters.map((filter) => filter.id)
  );
  const [messageRequest, setMessageRequest] = useState<TrialSessionRequest | null>(null);
  const [studentProfileForModal, setStudentProfileForModal] = useState<{
    studentName: string;
    profile: StudentLearningProfile;
  } | null>(null);
  const [loadingStudentProfileId, setLoadingStudentProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentTutor) return undefined;
    return subscribeToTutorTrialSessions(currentTutor.id, setRequests);
  }, [currentTutor]);

  const pendingRequests = useMemo(() => {
    const confirmedStudentIdSet = new Set(confirmedStudentIds);
    const currentRequests = requests.filter(
      (request) =>
        request.status !== 'accepted' && !confirmedStudentIdSet.has(request.studentId)
    );

    if (activeFilters.length === 0) {
      return [];
    }

    return currentRequests.filter((request) => {
      if (request.status === 'rejected') {
        return activeFilters.includes('rejected');
      }

      const storedReasons = request.pendingReasons ?? [];
      const isMessaged =
        storedReasons.includes('messaged') || (request.preBookingMessages ?? []).length > 0;
      const isRequested = hasRequestedMatch(request);

      return activeFilters.some((filter) => {
        if (filter === 'messaged') return isMessaged;
        if (filter === 'requested') return isRequested;
        return false;
      });
    });
  }, [activeFilters, confirmedStudentIds, requests]);

  function toggleFilter(filter: PendingFilter) {
    setActiveFilters((currentFilters) =>
      currentFilters.includes(filter)
        ? currentFilters.filter((item) => item !== filter)
        : [...currentFilters, filter]
    );
  }

  async function openPendingStudentMessage(request: TrialSessionRequest) {
    setMessageRequest(request);
    await markPreBookingMessagesSeen(request.id, 'tutor');
  }

  async function handleTutorPreBookingMessage(request: TrialSessionRequest, body: string) {
    if (!currentTutor) return;

    await addPreBookingMessage({
      requestId: request.id,
      senderId: currentTutor.id,
      senderRole: 'tutor',
      senderName: currentTutor.name,
      body,
    });
  }


  async function handleStudentProfileClick(request: TrialSessionRequest) {
    if (loadingStudentProfileId) return;

    setLoadingStudentProfileId(request.studentId);

    try {
      let profile: StudentLearningProfile;

      try {
        profile = await getStudentLearningProfileById(request.studentId);
      } catch (error) {
        if (!currentTutor) {
          throw error;
        }

        await ensureTutorStudentLink({
          tutorId: currentTutor.id,
          studentId: request.studentId,
          source: 'profilePreview',
        });
        profile = await getStudentLearningProfileById(request.studentId);
      }

      setStudentProfileForModal({
        studentName: request.studentName,
        profile,
      });
    } finally {
      setLoadingStudentProfileId(null);
    }
  }

  async function handleAccept(request: TrialSessionRequest) {
    setBusyRequestId(request.id);

    try {
      await acceptTrialSessionRequest(request);
    } finally {
      setBusyRequestId(null);
    }
  }

  async function handleReject(request: TrialSessionRequest) {
    setBusyRequestId(request.id);

    try {
      await updateTrialSessionStatus(request.id, 'rejected');
    } finally {
      setBusyRequestId(null);
    }
  }

  async function handleMoveBackToPending(request: TrialSessionRequest) {
    setBusyRequestId(request.id);

    try {
      await updateTrialSessionStatus(request.id, 'pending');
    } finally {
      setBusyRequestId(null);
    }
  }

  return (
    <div className="grid gap-5">
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              Pending students
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Students who have messaged you, requested a match, or were previously rejected before they move into My students.
            </p>
          </div>

          <PendingFilterPills
            filters={pendingFilters}
            activeFilters={activeFilters}
            onToggle={toggleFilter}
          />
        </div>
      </Card>

      {pendingRequests.length === 0 ? (
        <Card>
          <p className="font-medium text-slate-950">No pending students yet.</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Pre-booking messages, pending match requests, and rejected students matching the selected filters will appear here.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pendingRequests.map((request) => (
            <PendingStudentCard
              key={request.id}
              request={request}
              isLoadingProfile={loadingStudentProfileId === request.studentId}
              disabled={busyRequestId === request.id}
              onViewProfile={() => void handleStudentProfileClick(request)}
              onMessage={() => void openPendingStudentMessage(request)}
              onAccept={() => void handleAccept(request)}
              onReject={() => void handleReject(request)}
              onMoveBackToPending={() => void handleMoveBackToPending(request)}
              currentUserId={currentTutor?.id ?? ''}
            />
          ))}
        </div>
      )}

      {messageRequest ? (
        <PreBookingMessageModal
          recipientName={messageRequest.studentName}
          request={messageRequest}
          currentUserId={currentTutor?.id}
          viewerRole="tutor"
          isCreatingRequest={busyRequestId === messageRequest.id}
          onClose={() => setMessageRequest(null)}
          onSend={(body) => handleTutorPreBookingMessage(messageRequest, body)}
        />
      ) : null}

      {studentProfileForModal ? (
        <StudentProfileModal
          studentName={studentProfileForModal.studentName}
          profile={studentProfileForModal.profile}
          onClose={() => setStudentProfileForModal(null)}
        />
      ) : null}

    </div>
  );
}

function PendingStudentCard({
  request,
  isLoadingProfile,
  disabled,
  currentUserId,
  onViewProfile,
  onMessage,
  onAccept,
  onReject,
  onMoveBackToPending,
}: {
  request: TrialSessionRequest;
  isLoadingProfile: boolean;
  disabled: boolean;
  currentUserId: string;
  onViewProfile: () => void;
  onMessage: () => void;
  onAccept: () => void;
  onReject: () => void;
  onMoveBackToPending: () => void;
}) {
  const hasMessages = (request.preBookingMessages ?? []).length > 0;
  const latestMessage = getLatestPreBookingMessage(request);
  const unreadCount = getUnreadPreBookingCount(request, currentUserId);
  const isRejected = request.status === 'rejected';

  return (
    <Card className="grid gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Student
          </p>

          <ProfileNameButton
            label={isLoadingProfile ? 'Loading...' : request.studentName || 'Unnamed'}
            disabled={isLoadingProfile}
            onClick={onViewProfile}
          />

          <p className="mt-1 text-sm text-slate-600">
            {request.level} {request.subject}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <TrialStatusBadge status={request.status} />
            {hasMessages ? (
              <span className="logicgate-status-info rounded-full border px-3 py-1 text-xs font-semibold">
                Messaged
              </span>
            ) : null}
          </div>

          <p className="mt-3 text-sm text-slate-500">
            Preferred time: {request.preferredTime}
          </p>

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
        <Button variant="secondary" disabled={disabled} onClick={onMessage}>
          Message
        </Button>
        {isRejected ? (
          <Button disabled={disabled} onClick={onMoveBackToPending}>
            {disabled ? 'Saving...' : 'Move to pending'}
          </Button>
        ) : (
          <>
            <Button disabled={disabled} onClick={onAccept}>
              {disabled ? 'Saving...' : 'Accept'}
            </Button>
            <Button variant="secondary" disabled={disabled} onClick={onReject}>
              Reject
            </Button>
          </>
        )}
      </div>
    </Card>
  );
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
        Showing students that match any selected filter.
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
        No messages yet. Students can ask clarifying questions before a match is accepted.
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
        {latestMessage.body}
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

function getLatestPreBookingMessage(request?: TrialSessionRequest) {
  const messages = request?.preBookingMessages ?? [];
  return messages.length > 0 ? messages[messages.length - 1] : null;
}

function getUnreadPreBookingCount(request: TrialSessionRequest | undefined, currentUserId: string) {
  if (!request || !currentUserId) return 0;

  const seenAt = normaliseSeenDate(request.tutorPreBookingSeenAt);

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
  disabled = false,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-950 transition hover:border-slate-300 hover:bg-slate-100 disabled:opacity-60"
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

function getTutorRelationshipActions(
  relationship: RelationshipSupportSummary,
  onOpenSupport: (relationship: RelationshipSupportSummary, feature: RelationshipSupportModalFeature) => void
) {
  const baseHref = `/tutor/dashboard/support/${relationship.id}`;

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
