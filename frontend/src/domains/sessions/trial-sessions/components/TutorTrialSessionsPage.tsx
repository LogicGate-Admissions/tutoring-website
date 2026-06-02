'use client';

/**
 * File purpose: Tutor-facing page for reviewing real Firebase trial requests.
 *
 * Requests are filtered by the signed-in tutor's Firebase uid. There is no mock
 * tutor selector anymore because account identity now comes from Firebase Auth.
 */

import { useEffect, useState } from 'react';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Container } from '@/shared/components/Container';
import { PageHeader } from '@/shared/components/PageHeader';
import { subscribeToCurrentUser } from '@/domains/auth/services/authService';
import type { AuthUser } from '@/domains/auth/types/auth';
import { TrialStatusBadge } from '@/domains/sessions/trial-sessions/components/TrialStatusBadge';
import {
  subscribeToTutorTrialSessions,
  updateTrialSessionStatus,
} from '@/domains/sessions/trial-sessions/services/trialSessionService';
import type { TrialSessionRequest } from '@/domains/sessions/trial-sessions/types/trialSession';

export function TutorTrialSessionsPage() {
  const [currentTutor, setCurrentTutor] = useState<AuthUser | null>(null);
  const [requests, setRequests] = useState<TrialSessionRequest[]>([]);

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

  return (
    <main className="min-h-screen bg-[#f8f7f4]">
      <PageHeader
        eyebrow="Tutor area"
        title="Trial session requests"
        description="Review student context and accept or reject trial requests asynchronously."
      />

      <Container className="grid gap-6 py-10 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-5">
          <Card>
            <h2 className="text-lg font-semibold">Signed in tutor</h2>
            <div className="mt-4 grid gap-3 text-sm text-slate-600">
              <p><span className="font-medium text-slate-950">Tutor:</span> {currentTutor?.name ?? 'Loading...'}</p>
              <p><span className="font-medium text-slate-950">Pending:</span> {pendingRequests.length}</p>
              <p><span className="font-medium text-slate-950">Total:</span> {requests.length}</p>
            </div>
          </Card>
        </aside>

        <section className="grid gap-5">
          {requests.length === 0 && (
            <Card>
              <p className="font-medium">No trial requests yet.</p>
              <p className="mt-2 text-sm text-slate-600">
                When students request a trial with you, their requests will appear here.
              </p>
            </Card>
          )}

          {requests.map((request) => (
            <Card key={request.id}>
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-semibold">{request.studentName}</h2>
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

                {request.status === 'pending' && (
                  <div className="flex shrink-0 gap-3">
                    <Button onClick={() => updateTrialSessionStatus(request.id, 'accepted')}>
                      Accept
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => updateTrialSessionStatus(request.id, 'rejected')}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </section>
      </Container>
    </main>
  );
}
