'use client';

/**
 * File purpose:
 * Relationship-level live lesson workspace.
 *
 * Iteration 2 brings the lesson back into the platform: users enter a shared
 * workspace, then join an embedded Jitsi call when the session opens. The
 * whiteboard and shared resources panels are intentionally lightweight
 * placeholders so the video-call slice can be tested first.
 */

import { useEffect, useMemo, useState } from 'react';
import type { BookingRequest } from '@/domains/booking/types/booking';
import { useRelationshipBookings } from '@/domains/booking/hooks/useRelationshipBookings';
import {
  endLessonSession,
  startLessonSession,
} from '@/domains/booking/services/bookingService';
import { MessageThread } from '@/domains/async-support/components/MessageThread';
import { getStudentTutorRelationshipById } from '@/domains/async-support/services/relationshipsService';
import type {
  AsyncSupportRole,
  StudentTutorRelationship,
} from '@/domains/async-support/types/asyncSupport';
import { AppTopNav } from '@/shared/components/AppTopNav';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Container } from '@/shared/components/Container';
import { ROUTES } from '@/shared/constants/routes';
import { cn } from '@/shared/utils/cn';

type WorkspacePanel = 'messages' | 'resources';

type LessonWorkspacePageProps = {
  relationshipId: string;
  viewerRole: AsyncSupportRole;
};

const JOIN_UNLOCK_MINUTES = 5;

export function LessonWorkspacePage({
  relationshipId,
  viewerRole,
}: LessonWorkspacePageProps) {
  const [relationship, setRelationship] =
    useState<StudentTutorRelationship | null>(null);
  const [activePanel, setActivePanel] = useState<WorkspacePanel | null>(null);
  const [isLoadingRelationship, setIsLoadingRelationship] = useState(true);
  const [relationshipError, setRelationshipError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [hasJoinedLocally, setHasJoinedLocally] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  const dashboardHref =
    viewerRole === 'student' ? ROUTES.studentDashboard : ROUTES.tutorDashboard;
  const navUserType = viewerRole === 'student' ? 'student' : 'tutor';

  const { bookings, loading: bookingsLoading } = useRelationshipBookings(
    relationship?.tutorId,
    relationship?.studentId
  );

  useEffect(() => {
    let isActive = true;

    async function loadRelationship() {
      try {
        setIsLoadingRelationship(true);
        setRelationshipError(null);

        const loadedRelationship =
          await getStudentTutorRelationshipById(relationshipId);

        if (!isActive) return;

        setRelationship(loadedRelationship);

        if (!loadedRelationship) {
          setRelationshipError('This workspace could not be found.');
        }
      } catch {
        if (!isActive) return;
        setRelationshipError('Could not load this workspace.');
      } finally {
        if (isActive) setIsLoadingRelationship(false);
      }
    }

    loadRelationship();

    return () => {
      isActive = false;
    };
  }, [relationshipId]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 30_000);

    return () => window.clearInterval(intervalId);
  }, []);

  const currentLesson = useMemo(
    () => selectWorkspaceLesson(bookings, now),
    [bookings, now]
  );

  const lessonState = getLessonJoinState(currentLesson, now);
  const lessonIsLive = (currentLesson?.lessonStatus ?? 'scheduled') === 'live';
  const lessonCompleted = currentLesson?.lessonStatus === 'completed';
  const showLiveWorkspace = Boolean(currentLesson && lessonIsLive && hasJoinedLocally);

  const otherPersonName =
    viewerRole === 'student' ? relationship?.tutorName : relationship?.studentName;
  const otherPersonLabel = viewerRole === 'student' ? 'Tutor' : 'Student';

  async function handleJoinLesson() {
    if (!currentLesson || !lessonState.canJoin || lessonCompleted) return;

    try {
      setIsStarting(true);
      setActionError(null);

      if ((currentLesson.lessonStatus ?? 'scheduled') !== 'live') {
        await startLessonSession(currentLesson.id);
      }

      setHasJoinedLocally(true);
    } catch {
      setActionError('Could not start the lesson workspace. Please try again.');
    } finally {
      setIsStarting(false);
    }
  }

  async function handleEndLesson() {
    if (!currentLesson || viewerRole !== 'tutor') return;

    const shouldEnd = window.confirm(
      'End this lesson for both you and the student?'
    );

    if (!shouldEnd) return;

    try {
      setIsEnding(true);
      setActionError(null);
      await endLessonSession(currentLesson.id);
      setHasJoinedLocally(false);
    } catch {
      setActionError('Could not end the lesson. Please try again.');
    } finally {
      setIsEnding(false);
    }
  }

  return (
    <>
      <AppTopNav userType={navUserType} />

      <Container className="grid gap-6 py-8">
        <div>
          <Button href={dashboardHref} variant="secondary">
            Back to dashboard
          </Button>
        </div>

        <Card>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Live lesson workspace
          </p>

          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                Workspace with {otherPersonName || 'your tutor'}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Join the lesson, keep the relationship context nearby, and use
                the same workspace before, during, and after the session.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleJoinLesson}
                disabled={!lessonState.canJoin || isStarting || lessonCompleted}
              >
                {lessonState.primaryLabel}
              </Button>
              {viewerRole === 'tutor' && lessonIsLive ? (
                <Button
                  variant="danger"
                  onClick={handleEndLesson}
                  disabled={isEnding}
                >
                  {isEnding ? 'Ending...' : 'End lesson'}
                </Button>
              ) : null}
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
            {isLoadingRelationship || bookingsLoading ? (
              <p>Loading lesson workspace...</p>
            ) : relationshipError ? (
              <p className="text-rose-600">{relationshipError}</p>
            ) : relationship ? (
              <div className="grid gap-1">
                <p>
                  <span className="font-semibold">{otherPersonLabel}:</span>{' '}
                  {otherPersonName || 'Unknown'}
                </p>
                <p>
                  <span className="font-semibold">Subject:</span>{' '}
                  {relationship.level} {relationship.subject}
                </p>
                <p>
                  <span className="font-semibold">Lesson:</span>{' '}
                  {currentLesson
                    ? formatLessonSummary(currentLesson)
                    : 'No confirmed lesson booked yet.'}
                </p>
                <p className="text-slate-500">{lessonState.helperText}</p>
              </div>
            ) : null}
          </div>

          {actionError ? (
            <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {actionError}
            </p>
          ) : null}
        </Card>

        <div className="grid gap-6 xl:grid-cols-[440px_minmax(0,1fr)]">
          <WorkspaceSidePanel
            activePanel={activePanel}
            onChange={setActivePanel}
            relationshipId={relationshipId}
            viewerRole={viewerRole}
          />

          <main className="grid min-w-0 gap-6">
            {showLiveWorkspace && currentLesson ? (
              <>
                <JitsiCallPanel lesson={currentLesson} relationshipId={relationshipId} />
                <WhiteboardPlaceholder />
              </>
            ) : (
              <WaitingWorkspaceCard
                lessonState={lessonState}
                lessonIsLive={lessonIsLive}
                lessonCompleted={lessonCompleted}
              />
            )}
          </main>
        </div>
      </Container>
    </>
  );
}

function WorkspaceSidePanel({
  activePanel,
  onChange,
  relationshipId,
  viewerRole,
}: {
  activePanel: WorkspacePanel | null;
  onChange: (panel: WorkspacePanel | null) => void;
  relationshipId: string;
  viewerRole: AsyncSupportRole;
}) {
  return (
    <Card className="self-start p-4">
      <div className="grid gap-2">
        {(
          [
            ['messages', 'Messages'],
            ['resources', 'Shared resources'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(activePanel === id ? null : id)}
            className={cn(
              'rounded-2xl px-4 py-3 text-left text-sm font-semibold transition',
              activePanel === id
                ? 'bg-slate-950 text-white'
                : 'text-slate-700 hover:bg-slate-50'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {activePanel ? (
        <div className="mt-5 rounded-2xl bg-slate-50 p-4">
          {activePanel === 'messages' ? (
            <div>
              <h2 className="text-sm font-semibold text-slate-950">Messages</h2>
              <div className="mt-4 max-h-[680px] overflow-y-auto pr-1">
                <MessageThread relationshipId={relationshipId} viewerRole={viewerRole} />
              </div>
            </div>
          ) : null}

          {activePanel === 'resources' ? (
            <div>
              <h2 className="text-sm font-semibold text-slate-950">
                Shared resources
              </h2>
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                Shared resources placeholder
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}

function JitsiCallPanel({
  lesson,
  relationshipId,
}: {
  lesson: BookingRequest;
  relationshipId: string;
}) {
  const roomName = buildJitsiRoomName(lesson.id || relationshipId);
  const src = `https://meet.jit.si/${encodeURIComponent(roomName)}#config.prejoinPageEnabled=false`;

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-slate-200 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Live call
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
          Embedded lesson call
        </h2>
      </div>
      <iframe
        title="Embedded lesson call"
        src={src}
        allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
        className="h-[520px] w-full border-0"
      />
    </Card>
  );
}

function WhiteboardPlaceholder() {
  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        Whiteboard
      </p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
        Persistent board placeholder
      </h2>
      <div className="mt-5 min-h-[220px] rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
        Whiteboard area
      </div>
    </Card>
  );
}

function WaitingWorkspaceCard({
  lessonState,
  lessonIsLive,
  lessonCompleted,
}: {
  lessonState: LessonJoinState;
  lessonIsLive: boolean;
  lessonCompleted: boolean;
}) {
  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        Lesson room
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
        {lessonCompleted
          ? 'This lesson has ended'
          : lessonIsLive
            ? 'This lesson is live'
            : 'Prepare for the next lesson'}
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
        {lessonState.helperText}
      </p>
    </Card>
  );
}

type LessonJoinState = {
  canJoin: boolean;
  primaryLabel: string;
  helperText: string;
};

function selectWorkspaceLesson(bookings: BookingRequest[], now: Date) {
  const liveLesson = bookings.find((booking) => booking.lessonStatus === 'live');
  if (liveLesson) return liveLesson;

  const activeOrFuture = bookings.filter((booking) => {
    if (booking.lessonStatus === 'completed') return false;
    const start = booking.date.toDate();
    const unlockAt = new Date(start.getTime() - JOIN_UNLOCK_MINUTES * 60_000);
    return now >= unlockAt || start > now;
  });

  return activeOrFuture[0] ?? null;
}

function getLessonJoinState(
  lesson: BookingRequest | null,
  now: Date
): LessonJoinState {
  if (!lesson) {
    return {
      canJoin: false,
      primaryLabel: 'Join lesson',
      helperText: 'No confirmed lesson has been booked for this workspace yet.',
    };
  }

  const status = lesson.lessonStatus ?? 'scheduled';

  if (status === 'completed') {
    return {
      canJoin: false,
      primaryLabel: 'Lesson ended',
      helperText:
        'This live lesson has ended. The call and live workspace are no longer active.',
    };
  }

  if (status === 'live') {
    return {
      canJoin: true,
      primaryLabel: 'Join lesson',
      helperText:
        'The lesson is live. Join the embedded call from this workspace.',
    };
  }

  const start = lesson.date.toDate();
  const unlockAt = new Date(start.getTime() - JOIN_UNLOCK_MINUTES * 60_000);

  if (now >= unlockAt) {
    return {
      canJoin: true,
      primaryLabel: 'Join lesson',
      helperText:
        'The lesson room is open. It will stay open until the tutor ends the lesson.',
    };
  }

  return {
    canJoin: false,
    primaryLabel: 'Join lesson',
    helperText: `Join lesson will be available ${JOIN_UNLOCK_MINUTES} minutes before the scheduled start.`,
  };
}

function formatLessonSummary(lesson: BookingRequest) {
  const start = lesson.date.toDate();
  const end = new Date(start.getTime() + lesson.durationMinutes * 60_000);
  const dateLabel = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(start);
  const endLabel = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(end);

  return `${lesson.subject} · ${dateLabel}–${endLabel}`;
}

function buildJitsiRoomName(seed: string) {
  const safeSeed = seed
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  return `logicgate-${safeSeed || 'lesson'}`;
}
