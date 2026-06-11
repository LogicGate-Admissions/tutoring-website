'use client';

import { Button } from '@/shared/components/Button';
import { PreBookingMessageThread } from '@/domains/sessions/trial-sessions/components/PreBookingMessageThread';
import type {
  PreBookingMessage,
  TrialSessionRequest,
} from '@/domains/sessions/trial-sessions/types/trialSession';
import type { Tutor } from '@/domains/tutors/tutor-discovery/types/tutor';

export function PreBookingMessageModal({
  tutor,
  request,
  currentUserId,
  isCreatingRequest = false,
  onClose,
  onSend,
}: {
  tutor: Tutor;
  request?: TrialSessionRequest;
  currentUserId?: string;
  isCreatingRequest?: boolean;
  onClose: () => void;
  onSend: (body: string) => Promise<void> | void;
}) {
  const messages: PreBookingMessage[] = request?.preBookingMessages ?? [];
  const isAccepted = request?.status === 'accepted';
  const isRejected = request?.status === 'rejected';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Pre-session messages
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Message {tutor.name}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
              Ask short clarifying questions before booking. Once the match is
              accepted, this conversation appears inside My Tutors.
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>

        {isAccepted ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
            This match has been accepted. Continue the conversation from My Tutors.
          </div>
        ) : null}

        {isRejected ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            This request was rejected, so messages are now read-only.
          </div>
        ) : null}

        <div className="mt-5">
          <PreBookingMessageThread
            messages={messages}
            currentUserId={currentUserId}
            disabled={isCreatingRequest || isAccepted || isRejected}
            placeholder="Ask about teaching style, exam board, timings, or what to prepare..."
            emptyText="No messages yet. Send the first question to start a simple pre-session conversation."
            onSend={onSend}
          />
        </div>
      </div>
    </div>
  );
}
