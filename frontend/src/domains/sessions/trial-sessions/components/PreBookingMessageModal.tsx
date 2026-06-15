'use client';

import { Button } from '@/shared/components/Button';
import { PreBookingMessageThread } from '@/domains/sessions/trial-sessions/components/PreBookingMessageThread';
import { hasRequestedMatch } from '@/domains/sessions/trial-sessions/utils/trialRequestState';
import type {
  PreBookingMessage,
  TrialSessionRequest,
} from '@/domains/sessions/trial-sessions/types/trialSession';
import type { Tutor } from '@/domains/tutors/tutor-discovery/types/tutor';

const STUDENT_MESSAGE_LIMIT = 5;

export function PreBookingMessageModal({
  tutor,
  recipientName,
  request,
  currentUserId,
  viewerRole = 'student',
  isCreatingRequest = false,
  onClose,
  onSend,
  onAllowMessaging,
  onRequestMatch,
}: {
  tutor?: Tutor;
  recipientName?: string;
  request?: TrialSessionRequest;
  currentUserId?: string;
  viewerRole?: 'student' | 'tutor';
  isCreatingRequest?: boolean;
  onClose: () => void;
  onSend: (body: string) => Promise<void> | void;
  onAllowMessaging?: () => void;
  onRequestMatch?: () => void;
}) {
  const messages: PreBookingMessage[] = request?.preBookingMessages ?? [];
  const personName = tutor?.name ?? recipientName ?? 'this person';
  const isAccepted = request?.status === 'accepted';
  const isRejected = request?.status === 'rejected';
  const copy = getPreBookingCopy(viewerRole, personName);

  const studentMessageCount = messages.filter((m) => m.senderRole === 'student').length;
  const isStudentLimitReached = studentMessageCount >= STUDENT_MESSAGE_LIMIT;
  const messagingUnlocked = request?.messagingUnlocked ?? false;
  const isStudentBlocked = viewerRole === 'student' && isStudentLimitReached && !messagingUnlocked;
  const matchRequested = hasRequestedMatch(request);
  const remainingMessages =
    viewerRole === 'student' && !messagingUnlocked && !isStudentBlocked
      ? STUDENT_MESSAGE_LIMIT - studentMessageCount
      : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Pre-session messages
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Message {personName}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
              {copy.description}
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>

        {isAccepted ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
            This match has been accepted. Continue the conversation from My Tutors/My Students.
          </div>
        ) : null}

        {isRejected ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            This request was rejected, so messages are now read-only.
          </div>
        ) : null}

        {isStudentBlocked ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
            You&apos;ve sent {STUDENT_MESSAGE_LIMIT} messages. Waiting for {personName} to allow more.
          </div>
        ) : null}

        {viewerRole === 'tutor' && isStudentLimitReached && !messagingUnlocked ? (
          <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-700">
              {request?.studentName ?? 'The student'} has reached the {STUDENT_MESSAGE_LIMIT}-message limit.
            </p>
            <button
              type="button"
              onClick={onAllowMessaging}
              className="shrink-0 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Allow more messages
            </button>
          </div>
        ) : null}

        <div className="mt-5">
          <PreBookingMessageThread
            messages={messages}
            currentUserId={currentUserId}
            disabled={isCreatingRequest || isAccepted || isRejected || isStudentBlocked}
            placeholder={copy.placeholder}
            emptyText={copy.emptyText}
            helperText={copy.helperText}
            remainingMessages={remainingMessages}
            onSend={onSend}
          />
        </div>

        {viewerRole === 'student' && !isAccepted && !isRejected && onRequestMatch ? (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            {matchRequested ? (
              <p className="text-sm font-medium text-emerald-700">
                Match requested — waiting for {personName} to respond.
              </p>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-slate-600">
                  Ready to commit? Request a match and {personName} can accept.
                </p>
                <button
                  type="button"
                  onClick={onRequestMatch}
                  className="shrink-0 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Request Match
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function getPreBookingCopy(viewerRole: 'student' | 'tutor', personName: string) {
  if (viewerRole === 'tutor') {
    return {
      description:
        'Reply to the student before accepting the match. Once accepted, this conversation appears inside My Students.',
      placeholder: `Reply to ${personName} about timings, preparation, exam board, or whether you are the right fit...`,
      emptyText:
        'No messages yet. Use this space to clarify fit before accepting the student.',
      helperText:
        'Text-only replies before the first booked session. Attachments, urgent flags, and maths tools unlock after you accept the student.',
    };
  }

  return {
    description:
      'Ask short clarifying questions before booking. Once the match is accepted, this conversation appears inside My Tutors.',
    placeholder:
      'Ask about teaching style, exam board, timings, or what to prepare...',
    emptyText:
      'No messages yet. Send the first question to start a simple pre-session conversation.',
    helperText:
      'Text-only questions before the first booked session. Attachments, urgent flags, and maths tools unlock after the tutor accepts.',
  };
}
