'use client';

/**
 * File purpose: Main tutor dashboard for ongoing student support.
 */

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RelationshipListState } from '@/domains/async-support/components/RelationshipListState';
import { SupportRelationshipCard } from '@/domains/async-support/components/SupportRelationshipCard';
import { useRelationshipSummaries } from '@/domains/async-support/hooks/useRelationshipSummaries';
import type { RelationshipSupportSummary } from '@/domains/async-support/types/asyncSupport';
import { subscribeToCurrentUser } from '@/domains/auth/services/authService';
import type { AuthUser } from '@/domains/auth/types/auth';
import { MySessionsTab } from '@/domains/booking/components/sessions/MySessionsTab';
import type { BookingRequest } from '@/domains/booking/types/booking';
import { PreBookingMessageThread } from '@/domains/sessions/trial-sessions/components/PreBookingMessageThread';
import { TrialStatusBadge } from '@/domains/sessions/trial-sessions/components/TrialStatusBadge';
import {
  acceptTrialSessionRequest,
  addPreBookingMessage,
  subscribeToTutorTrialSessions,
  updateTrialSessionStatus,
} from '@/domains/sessions/trial-sessions/services/trialSessionService';
import type { TrialSessionRequest } from '@/domains/sessions/trial-sessions/types/trialSession';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Container } from '@/shared/components/Container';
import { ROUTES } from '@/shared/constants/routes';
import { cn } from '@/shared/utils/cn';

type Section = 'my-students' | 'pending-students' | 'my-sessions' | 'tutor-profile';
type PendingFilter = 'messaged' | 'requested';

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
      <Card>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Tutor dashboard
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          Manage your students
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Keep confirmed students, pending student messages, sessions, and your tutor profile in one place.
        </p>
      </Card>

      <div className="grid items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <SideTabs
          tabs={tabs}
          activeTab={activeSection}
          onChange={setActiveSection}
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
            />
          )}
        </main>
      </div>
    </Container>
  );
}

function RelationshipContent({
  activeSection,
  relationships,
  isLoading,
  error,
  currentUserId,
}: {
  activeSection: Section;
  relationships: RelationshipSupportSummary[];
  isLoading: boolean;
  error: string | null;
  currentUserId: string;
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
          actions={getTutorRelationshipActions(relationship.id)}
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
  const [activeFilters, setActiveFilters] = useState<PendingFilter[]>([]);

  useEffect(() => {
    if (!currentTutor) return undefined;
    return subscribeToTutorTrialSessions(currentTutor.id, setRequests);
  }, [currentTutor]);

  const pendingRequests = useMemo(() => {
    const confirmedStudentIdSet = new Set(confirmedStudentIds);
    const currentRequests = requests.filter(
      (request) => request.status === 'pending' && !confirmedStudentIdSet.has(request.studentId)
    );

    if (activeFilters.length === 0) {
      return currentRequests;
    }

    return currentRequests.filter((request) => {
      const isMessaged = (request.preBookingMessages ?? []).length > 0;
      const isRequested = request.status === 'pending';

      return activeFilters.some((filter) => {
        if (filter === 'messaged') return isMessaged;
        return isRequested;
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

  return (
    <div className="grid gap-5">
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              Pending students
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Students who have messaged you or requested a match before they move into My students.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {pendingFilters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => toggleFilter(filter.id)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                  activeFilters.includes(filter.id)
                    ? 'border-slate-950 bg-slate-950 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {pendingRequests.length === 0 ? (
        <Card>
          <p className="font-medium text-slate-950">No pending students yet.</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Pre-booking messages and pending match requests will appear here.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pendingRequests.map((request) => (
            <Card key={request.id}>
              <div className="grid gap-5">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
                        {request.studentName}
                      </h3>
                      <TrialStatusBadge status={request.status} />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge>{request.subject}</Badge>
                      <Badge>{request.level}</Badge>
                      <Badge>{request.learningStyle}</Badge>
                    </div>

                    <p className="mt-5 max-w-3xl leading-7 text-slate-600">
                      {request.message}
                    </p>

                    <p className="mt-4 text-sm font-medium text-slate-700">
                      Preferred time: {request.preferredTime}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-3">
                    <Button
                      disabled={busyRequestId === request.id}
                      onClick={() => void handleAccept(request)}
                    >
                      {busyRequestId === request.id ? 'Saving...' : 'Accept'}
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={busyRequestId === request.id}
                      onClick={() => void handleReject(request)}
                    >
                      Reject
                    </Button>
                  </div>
                </div>

                <PreBookingMessageThread
                  messages={request.preBookingMessages ?? []}
                  currentUserId={currentTutor?.id}
                  disabled={busyRequestId === request.id}
                  placeholder="Reply to the student's question before accepting..."
                  emptyText="No clarifying messages yet."
                  onSend={(body) => handleTutorPreBookingMessage(request, body)}
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function SideTabs<T extends string>({
  tabs,
  activeTab,
  onChange,
}: {
  tabs: Array<{ id: T; label: string; description: string }>;
  activeTab: T;
  onChange: (tab: T) => void;
}) {
  return (
    <aside className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="grid gap-2">
        {tabs.map((tab) => (
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
            <span className="block text-sm font-semibold">{tab.label}</span>
            <span
              className={cn(
                'mt-1 block text-xs leading-5',
                activeTab === tab.id ? 'text-slate-300' : 'text-slate-500'
              )}
            >
              {tab.description}
            </span>
          </button>
        ))}
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

function getTutorRelationshipActions(relationshipId: string) {
  const baseHref = `/tutor/dashboard/support/${relationshipId}`;

  return [
    {
      label: 'Message',
      href: `${baseHref}/messages`,
    },
    {
      label: 'Shared resources',
      href: `${baseHref}/resources`,
    },
    {
      label: 'Workspace',
      href: `${baseHref}/workspace`,
    },
  ];
}
