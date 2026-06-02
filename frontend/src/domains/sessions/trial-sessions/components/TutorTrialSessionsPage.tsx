'use client';

/**
 * File purpose: Application source file. Comments explain what this file owns and what should stay elsewhere.
 */

import { useEffect, useState } from 'react';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Container } from '@/shared/components/Container';
import { PageHeader } from '@/shared/components/PageHeader';
import { MOCK_TUTOR } from '@/domains/accounts/mockUsers';
import { TUTOR_PROFILES } from '@/domains/tutors/tutor-discovery/constants/tutorProfiles';
import { TrialStatusBadge } from '@/domains/sessions/trial-sessions/components/TrialStatusBadge';
import {
  subscribeToTutorTrialSessions,
  updateTrialSessionStatus,
} from '@/domains/sessions/trial-sessions/services/trialSessionService';
import type { TrialSessionRequest } from '@/domains/sessions/trial-sessions/types/trialSession';

/**
 * Tutor-facing page for reviewing trial session requests.
 *
 * The tutor selector is temporary until login exists. It is kept inside the
 * tutor route, not as a global student/tutor view switch.
 */
export function TutorTrialSessionsPage() {
  const [currentTutorId, setCurrentTutorId] = useState(MOCK_TUTOR.id);
  const [requests, setRequests] = useState<TrialSessionRequest[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToTutorTrialSessions(currentTutorId, setRequests);
    return () => unsubscribe();
  }, [currentTutorId]);

  const currentTutor = TUTOR_PROFILES.find((tutor) => tutor.id === currentTutorId);
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
            <h2 className="text-lg font-semibold">Acting as tutor</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Temporary selector until real login is added.
            </p>

            <select
              value={currentTutorId}
              onChange={(event) => setCurrentTutorId(event.target.value)}
              className="mt-4 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950"
            >
              {TUTOR_PROFILES.map((tutor) => (
                <option key={tutor.id} value={tutor.id}>{tutor.name}</option>
              ))}
            </select>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold">Summary</h2>
            <div className="mt-4 grid gap-3 text-sm text-slate-600">
              <p><span className="font-medium text-slate-950">Tutor:</span> {currentTutor?.name}</p>
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
                When students request a trial with this tutor, their requests will appear here.
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
                    <Button
                      onClick={() => updateTrialSessionStatus(request.id, 'accepted')}
                    >
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
