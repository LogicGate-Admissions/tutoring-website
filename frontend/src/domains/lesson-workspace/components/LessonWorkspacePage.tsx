"use client";

/**
 * File purpose:
 * Relationship-level live lesson workspace.
 *
 * Iteration 2 brings the lesson back into the platform: users enter a shared
 * workspace, then join an embedded Jitsi call when the session opens. The
 * whiteboard and shared resources panels are intentionally lightweight
 * placeholders so the video-call slice can be tested first.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { BookingRequest } from "@/domains/booking/types/booking";
import { useRelationshipBookings } from "@/domains/booking/hooks/useRelationshipBookings";
import {
  endLessonSession,
  startLessonSession,
} from "@/domains/booking/services/bookingService";
import { MessageThread } from "@/domains/async-support/components/MessageThread";
import { getStudentTutorRelationshipById } from "@/domains/async-support/services/relationshipsService";
import type {
  AsyncSupportRole,
  StudentTutorRelationship,
} from "@/domains/async-support/types/asyncSupport";
import { AppTopNav } from "@/shared/components/AppTopNav";
import { Button } from "@/shared/components/Button";
import { Card } from "@/shared/components/Card";
import { Container } from "@/shared/components/Container";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/shared/utils/cn";

type WorkspacePanel = "messages" | "resources";

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
  const [relationshipError, setRelationshipError] = useState<string | null>(
    null,
  );
  const [now, setNow] = useState(() => new Date());
  const [hasJoinedLocally, setHasJoinedLocally] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  const dashboardHref =
    viewerRole === "student" ? ROUTES.studentDashboard : ROUTES.tutorDashboard;
  const navUserType = viewerRole === "student" ? "student" : "tutor";

  const { bookings, loading: bookingsLoading } = useRelationshipBookings(
    relationship?.tutorId,
    relationship?.studentId,
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
          setRelationshipError("This workspace could not be found.");
        }
      } catch {
        if (!isActive) return;
        setRelationshipError("Could not load this workspace.");
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
    [bookings, now],
  );

  const lessonState = getLessonJoinState(currentLesson, now);
  const lessonIsLive = (currentLesson?.lessonStatus ?? "scheduled") === "live";
  const lessonCompleted = currentLesson?.lessonStatus === "completed";
  const showLiveWorkspace = Boolean(
    currentLesson && lessonIsLive && hasJoinedLocally,
  );

  const otherPersonName =
    viewerRole === "student"
      ? relationship?.tutorName
      : relationship?.studentName;
  const otherPersonLabel = viewerRole === "student" ? "Tutor" : "Student";

  async function handleJoinLesson() {
    if (!currentLesson || !lessonState.canJoin || lessonCompleted) return;

    try {
      setIsStarting(true);
      setActionError(null);

      if ((currentLesson.lessonStatus ?? "scheduled") !== "live") {
        await startLessonSession(currentLesson.id);
      }

      setHasJoinedLocally(true);
    } catch {
      setActionError("Could not start the lesson workspace. Please try again.");
    } finally {
      setIsStarting(false);
    }
  }

  async function handleEndLesson() {
    if (!currentLesson || viewerRole !== "tutor") return;

    const shouldEnd = window.confirm(
      "End this lesson for both you and the student?",
    );

    if (!shouldEnd) return;

    try {
      setIsEnding(true);
      setActionError(null);
      await endLessonSession(currentLesson.id);
      setHasJoinedLocally(false);
    } catch {
      setActionError("Could not end the lesson. Please try again.");
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
                Workspace with {otherPersonName || "your tutor"}
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
              {viewerRole === "tutor" && lessonIsLive ? (
                <Button
                  variant="danger"
                  onClick={handleEndLesson}
                  disabled={isEnding}
                >
                  {isEnding ? "Ending..." : "End lesson"}
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
                  <span className="font-semibold">{otherPersonLabel}:</span>{" "}
                  {otherPersonName || "Unknown"}
                </p>
                <p>
                  <span className="font-semibold">Subject:</span>{" "}
                  {relationship.level} {relationship.subject}
                </p>
                <p>
                  <span className="font-semibold">Lesson:</span>{" "}
                  {currentLesson
                    ? formatLessonSummary(currentLesson)
                    : "No confirmed lesson booked yet."}
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

        <div
          className={cn(
            "grid gap-4 lg:grid-cols-[88px_minmax(0,1fr)]",
            activePanel && "xl:grid-cols-[88px_380px_minmax(0,1fr)]",
          )}
        >
          <WorkspaceSidePanel
            activePanel={activePanel}
            onChange={setActivePanel}
            relationshipId={relationshipId}
            viewerRole={viewerRole}
          />

          <main className="grid min-w-0 gap-4">
            {showLiveWorkspace && currentLesson ? (
              <LiveLessonStage
                lesson={currentLesson}
                relationshipId={relationshipId}
              />
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
  const panelButtons = [
    ["messages", "Messages", ChatBubbleIcon],
    ["resources", "Shared resources", FolderIcon],
  ] as const;

  return (
    <>
      <Card className="self-start p-3">
        <div className="grid gap-3">
          {panelButtons.map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              title={activePanel === id ? `Close ${label}` : `Open ${label}`}
              aria-label={
                activePanel === id ? `Close ${label}` : `Open ${label}`
              }
              onClick={() => onChange(activePanel === id ? null : id)}
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-2xl border text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
                activePanel === id
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 bg-white hover:bg-slate-50",
              )}
            >
              <Icon className="h-6 w-6" />
            </button>
          ))}
        </div>
      </Card>

      {activePanel ? (
        <Card className="min-w-0 self-start overflow-hidden p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-950">
              {activePanel === "messages" ? "Messages" : "Shared resources"}
            </h2>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="rounded-full px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Close
            </button>
          </div>

          {activePanel === "messages" ? (
            <div className="max-h-[calc(100vh-260px)] min-w-0 overflow-y-auto overflow-x-hidden pr-1">
              <MessageThread
                relationshipId={relationshipId}
                viewerRole={viewerRole}
                density="embedded"
              />
            </div>
          ) : null}

          {activePanel === "resources" ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-500">
              Shared resources placeholder
            </div>
          ) : null}
        </Card>
      ) : null}
    </>
  );
}

function LiveLessonStage({
  lesson,
  relationshipId,
}: {
  lesson: BookingRequest;
  relationshipId: string;
}) {
  return (
    <div className="relative min-w-0">
      <WhiteboardPlaceholder />
      <FloatingJitsiCall lesson={lesson} relationshipId={relationshipId} />
    </div>
  );
}

function FloatingJitsiCall({
  lesson,
  relationshipId,
}: {
  lesson: BookingRequest;
  relationshipId: string;
}) {
  const headerHeight = 72;
  const jitsiBaseWidth = 560;
  const jitsiBaseHeight = 430;
  const minSize = { width: 360, height: 330 };
  const [position, setPosition] = useState({ x: 24, y: 24 });
  const [size, setSize] = useState({ width: 520, height: 430 });
  const dragStartRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const resizeStartRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originWidth: number;
    originHeight: number;
  } | null>(null);
  const roomName = buildJitsiRoomName(lesson.id || relationshipId);
  const src = `https://meet.jit.si/${encodeURIComponent(roomName)}`;
  const bodyHeight = Math.max(0, size.height - headerHeight);
  const jitsiScale = Math.min(
    size.width / jitsiBaseWidth,
    bodyHeight / jitsiBaseHeight,
  );
  const scaledJitsiWidth = jitsiBaseWidth * jitsiScale;
  const scaledJitsiHeight = jitsiBaseHeight * jitsiScale;

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    dragStartRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const dragStart = dragStartRef.current;
    if (!dragStart || dragStart.pointerId !== event.pointerId) return;

    setPosition({
      x: Math.max(0, dragStart.originX + event.clientX - dragStart.startX),
      y: Math.max(0, dragStart.originY + event.clientY - dragStart.startY),
    });
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const dragStart = dragStartRef.current;
    if (dragStart?.pointerId === event.pointerId) {
      dragStartRef.current = null;
    }
  }

  function handleResizePointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    resizeStartRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originWidth: size.width,
      originHeight: size.height,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleResizePointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const resizeStart = resizeStartRef.current;
    if (!resizeStart || resizeStart.pointerId !== event.pointerId) return;

    const maxWidth = Math.max(minSize.width, window.innerWidth - position.x - 24);
    const maxHeight = Math.max(
      minSize.height,
      window.innerHeight - position.y - 24,
    );

    setSize({
      width: clamp(
        resizeStart.originWidth + event.clientX - resizeStart.startX,
        minSize.width,
        maxWidth,
      ),
      height: clamp(
        resizeStart.originHeight + event.clientY - resizeStart.startY,
        minSize.height,
        maxHeight,
      ),
    });
  }

  function handleResizePointerUp(event: ReactPointerEvent<HTMLButtonElement>) {
    const resizeStart = resizeStartRef.current;
    if (resizeStart?.pointerId === event.pointerId) {
      resizeStartRef.current = null;
    }
  }

  return (
    <div
      className="absolute z-20 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
      }}
    >
      <div
        role="button"
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="flex h-[72px] cursor-move items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 select-none"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Live call
          </p>
          <h2 className="mt-1 text-sm font-semibold tracking-tight text-slate-950">
            Lesson call
          </h2>
        </div>
        <span className="text-xs font-semibold text-slate-400">
          Drag · Resize
        </span>
      </div>

      <div
        className="relative overflow-hidden bg-slate-950"
        style={{ height: bodyHeight }}
      >
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            width: jitsiBaseWidth,
            height: jitsiBaseHeight,
            transform: `translate(-50%, -50%) scale(${jitsiScale})`,
          }}
        >
          <iframe
            title="Embedded lesson call"
            src={src}
            allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
            className="h-full w-full border-0"
          />
        </div>
        {scaledJitsiWidth < size.width || scaledJitsiHeight < bodyHeight ? (
          <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" />
        ) : null}
      </div>

      <button
        type="button"
        aria-label="Resize lesson call"
        onPointerDown={handleResizePointerDown}
        onPointerMove={handleResizePointerMove}
        onPointerUp={handleResizePointerUp}
        onPointerCancel={handleResizePointerUp}
        className="absolute bottom-2 right-2 h-6 w-6 cursor-nwse-resize rounded-lg border border-white/40 bg-slate-950/70 text-white shadow-lg transition hover:bg-slate-800"
      >
        <span className="sr-only">Resize lesson call</span>
        <span aria-hidden="true" className="block translate-x-[7px] translate-y-[7px] text-xs leading-none">
          ⌟
        </span>
      </button>
    </div>
  );
}

function WhiteboardPlaceholder() {
  return (
    <Card className="min-w-0">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Whiteboard
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
            Persistent board
          </h2>
        </div>
      </div>
      <div className="mt-5 min-h-[calc(100vh-320px)] rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
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
          ? "This lesson has ended"
          : lessonIsLive
            ? "This lesson is live"
            : "Prepare for the next lesson"}
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
        {lessonState.helperText}
      </p>
    </Card>
  );
}

function ChatBubbleIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.7 8.7 0 0 1-7.8 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.5a8.4 8.4 0 0 1-.9-3.8A8.7 8.7 0 0 1 8.7 4a8.4 8.4 0 0 1 3.8-.9h.5A8.5 8.5 0 0 1 21 11v.5Z" />
      <path d="M8 10h8" />
      <path d="M8 14h5" />
    </svg>
  );
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2.5h7.5A2.5 2.5 0 0 1 21 10v6.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 16.5v-9Z" />
      <path d="M3 9h18" />
    </svg>
  );
}

type LessonJoinState = {
  canJoin: boolean;
  primaryLabel: string;
  helperText: string;
};

function selectWorkspaceLesson(bookings: BookingRequest[], now: Date) {
  const liveLesson = bookings.find(
    (booking) => booking.lessonStatus === "live",
  );
  if (liveLesson) return liveLesson;

  const activeOrFuture = bookings.filter((booking) => {
    if (booking.lessonStatus === "completed") return false;
    const start = booking.date.toDate();
    const unlockAt = new Date(start.getTime() - JOIN_UNLOCK_MINUTES * 60_000);
    return now >= unlockAt || start > now;
  });

  return activeOrFuture[0] ?? null;
}

function getLessonJoinState(
  lesson: BookingRequest | null,
  now: Date,
): LessonJoinState {
  if (!lesson) {
    return {
      canJoin: false,
      primaryLabel: "Join lesson",
      helperText: "No confirmed lesson has been booked for this workspace yet.",
    };
  }

  const status = lesson.lessonStatus ?? "scheduled";

  if (status === "completed") {
    return {
      canJoin: false,
      primaryLabel: "Lesson ended",
      helperText:
        "This live lesson has ended. The call and live workspace are no longer active.",
    };
  }

  if (status === "live") {
    return {
      canJoin: true,
      primaryLabel: "Join lesson",
      helperText:
        "The lesson is live. Join the embedded call from this workspace.",
    };
  }

  const start = lesson.date.toDate();
  const unlockAt = new Date(start.getTime() - JOIN_UNLOCK_MINUTES * 60_000);

  if (now >= unlockAt) {
    return {
      canJoin: true,
      primaryLabel: "Join lesson",
      helperText:
        "The lesson room is open. It will stay open until the tutor ends the lesson.",
    };
  }

  return {
    canJoin: false,
    primaryLabel: "Join lesson",
    helperText: `Join lesson will be available ${JOIN_UNLOCK_MINUTES} minutes before the scheduled start.`,
  };
}

function formatLessonSummary(lesson: BookingRequest) {
  const start = lesson.date.toDate();
  const end = new Date(start.getTime() + lesson.durationMinutes * 60_000);
  const dateLabel = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(start);
  const endLabel = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(end);

  return `${lesson.subject} · ${dateLabel}–${endLabel}`;
}


function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function buildJitsiRoomName(seed: string) {
  const safeSeed = seed
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return `logicgate-${safeSeed || "lesson"}`;
}
