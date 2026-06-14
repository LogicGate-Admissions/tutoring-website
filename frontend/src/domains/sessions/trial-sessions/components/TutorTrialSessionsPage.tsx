'use client';

/**
 * File purpose: Tutor-facing page for reviewing Firebase trial requests.
 *
 * Requests are filtered by the signed-in tutor's Firebase uid. Tutors can also
 * reply to text-only pre-session messages before accepting a match.
 */

import { useEffect, useState } from 'react';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { DashboardShell } from '@/shared/components/dashboard/DashboardShell';
import { PageHeader } from '@/shared/components/PageHeader';
import { ROUTES } from '@/shared/constants/routes';
import { subscribeToCurrentUser } from '@/domains/auth/services/authService';
import type { AuthUser } from '@/domains/auth/types/auth';
import { SignOutButton } from '@/domains/auth/components/SignOutButton';
import { TrialStatusBadge } from '@/domains/sessions/trial-sessions/components/TrialStatusBadge';
import { PreBookingMessageThread } from '@/domains/sessions/trial-sessions/components/PreBookingMessageThread';
import {
  acceptTrialSessionRequest,
  addPreBookingMessage,
  subscribeToTutorTrialSessions,
  updateTrialSessionStatus,
} from '@/domains/sessions/trial-sessions/services/trialSessionService';
import type { TrialSessionRequest } from '@/domains/sessions/trial-sessions/types/trialSession';

export function TutorTrialSessionsPage() {
  const [currentTutor, setCurrentTutor] = useState<AuthUser | null>(null);
  const [requests, setRequests] = useState<TrialSessionRequest[]>([]);
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);

  useEffect(() => {
    /** Resolve which tutor is signed in before subscribing to their requests. */
    const unsubscribe = subscribeToCurrentUser((user) => {
      setCurrentTutor(user?.role === 'tutor' ? user : null);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    /** Subscribe only when a tutor is available; otherwise there is no owner id. */
    if (!currentTutor) return undefined;

    return subscribeToTutorTrialSessions(currentTutor.id, setRequests);
  }, [currentTutor]);

  const pendingRequests = requests.filter((request) => request.status === 'pending');

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
    <main className="min-h-screen bg-[#f8f7f4]">
      <PageHeader
        eyebrow="Tutor area"
        title="Match requests"
        description="Review student requirements, reply to clarifying messages, and accept or reject match requests."
      />

      <DashboardShell
        navItems={[
          {
            label: 'Dashboard',
            href: ROUTES.tutorDashboard,
            description: 'Tutor overview',
          },
          {
            label: 'Match requests',
            href: ROUTES.tutorTrialSessions,
            active: true,
            description: 'Student requirements',
          },
          {
            label: 'Tutor profile',
            href: ROUTES.tutorOnboarding,
            description: 'Subjects, rates, availability',
          },
        ]}
        action={<SignOutButton />}
      >
        <div className="grid gap-6">
          <Card>
            <h2 className="text-lg font-semibold">Request summary</h2>
            <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
              <p><span className="font-medium text-slate-950">Tutor:</span> {currentTutor?.name ?? 'Loading...'}</p>
              <p><span className="font-medium text-slate-950">Pending:</span> {pendingRequests.length}</p>
              <p><span className="font-medium text-slate-950">Total:</span> {requests.length}</p>
            </div>
          </Card>

          {requests.length === 0 && (
            <Card>
              <p className="font-medium">No match requests yet.</p>
              <p className="mt-2 text-sm text-slate-600">
                When students message or request a match with you, their requirements will appear here.
              </p>
            </Card>
          )}

          {requests.map((request) => (
            <Card key={request.id}>
              <div className="grid gap-5">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-semibold">{request.studentName}</h2>
                      <TrialStatusBadge status={request.status} />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge>{formatRequestedSubjects(request)}</Badge>
                      {request.level ? <Badge>{request.level}</Badge> : null}
                      <Badge>{request.learningStyle}</Badge>
                    </div>

                    {request.message ? (
                      <p className="mt-5 max-w-3xl leading-7 text-slate-600">
                        {request.message}
                      </p>
                    ) : null}

                    <p className="mt-4 text-sm font-medium text-slate-700">
                      Preferred time: {request.preferredTime}
                    </p>
                  </div>

                  {request.status === 'pending' && (
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
                  )}
                </div>

                <PreBookingMessageThread
                  messages={request.preBookingMessages ?? []}
                  currentUserId={currentTutor?.id}
                  disabled={request.status !== 'pending'}
                  placeholder="Reply to the student's question before accepting..."
                  emptyText="No clarifying messages yet."
                  onSend={(body) => handleTutorPreBookingMessage(request, body)}
                />
              </div>
            </Card>
          ))}
        </div>
      </DashboardShell>
    </main>
  );
}


function formatRequestedSubjects(request: TrialSessionRequest) {
  if (request.requestedSubjects && request.requestedSubjects.length > 0) {
    return request.requestedSubjects.map((subject) => subject.label).join(', ');
  }

  return [request.level, request.subject].filter(Boolean).join(' ') || 'Subject not set';
}
