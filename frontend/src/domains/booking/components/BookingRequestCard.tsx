'use client';

/**
 * File purpose: Card UI for a single booking request.
 *
 * Renders status badge, session details, and contextual actions based on
 * the booking's current status and the viewing user's role. Destructive
 * actions show an inline confirmation prompt rather than a modal.
 */

import { useState } from 'react';
import {
  acceptBookingRequest,
  cancelBookingRequest,
  declineBookingRequest,
} from '@/domains/booking/services/bookingService';
import type { BookingRequest } from '@/domains/booking/types/booking';
import { cn } from '@/shared/utils/cn';

type BookingRequestCardProps = {
  booking: BookingRequest;
  viewerRole: 'tutor' | 'student';
  viewerId: string;
  /** Name of the other party (tutor name for student viewers, student name for tutor viewers). */
  otherPartyName: string;
};

type ConfirmingAction = 'cancel' | 'decline' | null;

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending_receiver: {
    label: 'Awaiting response',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  pending_requester: {
    label: 'Awaiting your confirmation',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  confirmed: {
    label: 'Confirmed',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-slate-100 text-slate-500 border-slate-200',
  },
  declined: {
    label: 'Declined',
    className: 'bg-rose-50 text-rose-600 border-rose-200',
  },
};

export function BookingRequestCard({
  booking,
  viewerRole,
  otherPartyName,
}: BookingRequestCardProps) {
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<ConfirmingAction>(null);

  const viewerIsInitiator = booking.initiatedBy === viewerRole;
  const viewerIsReceiver = !viewerIsInitiator;

  const sessionDate = booking.date.toDate();
  const dateLabel = sessionDate.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const timeLabel = sessionDate.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const statusBadge = STATUS_LABELS[booking.status] ?? {
    label: booking.status,
    className: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  const isTerminal =
    booking.status === 'cancelled' || booking.status === 'declined';

  async function runAction(fn: () => Promise<void>) {
    setBusy(true);
    setActionError(null);
    try {
      await fn();
    } catch {
      setActionError('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
      setConfirming(null);
    }
  }

  function handleAccept() {
    void runAction(() => acceptBookingRequest(booking.id, viewerRole));
  }

  function handleDecline() {
    if (confirming !== 'decline') {
      setConfirming('decline');
      return;
    }
    void runAction(() => declineBookingRequest(booking.id));
  }

  function handleCancel() {
    if (confirming !== 'cancel') {
      setConfirming('cancel');
      return;
    }
    void runAction(() => cancelBookingRequest(booking.id, viewerRole));
  }

  return (
    <div
      className={cn(
        'rounded-3xl border bg-white p-5 shadow-sm transition',
        isTerminal ? 'opacity-60' : 'border-slate-200'
      )}
    >
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">{booking.subject}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            with {otherPartyName}
          </p>
        </div>
        <span
          className={cn(
            'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium',
            statusBadge.className
          )}
        >
          {statusBadge.label}
        </span>
      </div>

      {/* Session details */}
      <div className="mt-4 grid gap-1 text-sm text-slate-600">
        <p>
          <span className="font-medium text-slate-800">Date:</span> {dateLabel}
        </p>
        <p>
          <span className="font-medium text-slate-800">Time:</span> {timeLabel}
        </p>
        <p>
          <span className="font-medium text-slate-800">Duration:</span>{' '}
          {booking.durationMinutes} min
        </p>
        {booking.notes ? (
          <p className="mt-1 rounded-2xl bg-slate-50 px-3 py-2 text-xs italic text-slate-500">
            &ldquo;{booking.notes}&rdquo;
          </p>
        ) : null}
      </div>

      {/* Error */}
      {actionError ? (
        <p className="mt-3 rounded-2xl bg-rose-50 px-3 py-2 text-xs text-rose-600">
          {actionError}
        </p>
      ) : null}

      {/* Actions */}
      {!isTerminal ? (
        <div className="mt-4">
          {confirming ? (
            <InlineConfirm
              message={
                confirming === 'cancel'
                  ? 'Cancel this session?'
                  : 'Decline this request?'
              }
              confirmLabel={confirming === 'cancel' ? 'Yes, cancel' : 'Yes, decline'}
              onConfirm={confirming === 'cancel' ? handleCancel : handleDecline}
              onAbort={() => setConfirming(null)}
              busy={busy}
              danger
            />
          ) : (
            <ActionRow
              booking={booking}
              viewerIsReceiver={viewerIsReceiver}
              busy={busy}
              onAccept={handleAccept}
              onDecline={handleDecline}
              onCancel={handleCancel}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}

function ActionRow({
  booking,
  viewerIsReceiver,
  busy,
  onAccept,
  onDecline,
  onCancel,
}: {
  booking: BookingRequest;
  viewerIsReceiver: boolean;
  busy: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onCancel: () => void;
}) {
  const { status } = booking;

  if (status === 'pending_receiver' && viewerIsReceiver) {
    return (
      <div className="flex flex-wrap gap-2">
        <ActionButton onClick={onAccept} busy={busy} variant="primary">
          Accept
        </ActionButton>
        <ActionButton onClick={onDecline} busy={busy} variant="danger">
          Decline
        </ActionButton>
      </div>
    );
  }

  if (status === 'pending_receiver' && !viewerIsReceiver) {
    return (
      <ActionButton onClick={onCancel} busy={busy} variant="ghost">
        Cancel request
      </ActionButton>
    );
  }

  if (status === 'pending_requester' && !viewerIsReceiver) {
    return (
      <div className="flex flex-wrap gap-2">
        <ActionButton onClick={onAccept} busy={busy} variant="primary">
          Confirm session
        </ActionButton>
        <ActionButton onClick={onCancel} busy={busy} variant="ghost">
          Cancel
        </ActionButton>
      </div>
    );
  }

  if (status === 'pending_requester' && viewerIsReceiver) {
    return (
      <p className="text-xs text-slate-500">Waiting for the other party to confirm.</p>
    );
  }

  if (status === 'confirmed') {
    return (
      <ActionButton onClick={onCancel} busy={busy} variant="danger">
        Cancel session
      </ActionButton>
    );
  }

  return null;
}

function InlineConfirm({
  message,
  confirmLabel,
  onConfirm,
  onAbort,
  busy,
  danger,
}: {
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onAbort: () => void;
  busy: boolean;
  danger?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
      <p className="text-sm text-slate-700">{message}</p>
      <div className="flex gap-2">
        <ActionButton onClick={onConfirm} busy={busy} variant={danger ? 'danger' : 'primary'}>
          {confirmLabel}
        </ActionButton>
        <ActionButton onClick={onAbort} busy={busy} variant="ghost">
          Keep it
        </ActionButton>
      </div>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  busy,
  variant,
}: {
  children: React.ReactNode;
  onClick: () => void;
  busy: boolean;
  variant: 'primary' | 'ghost' | 'danger';
}) {
  const base =
    'inline-flex cursor-pointer items-center rounded-full px-4 py-1.5 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2';

  const variantClass = {
    primary: 'bg-slate-950 text-white hover:bg-slate-800',
    ghost: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
  }[variant];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={busy ? undefined : onClick}
      onKeyDown={(e) => {
        if (!busy && (e.key === 'Enter' || e.key === ' ')) onClick();
      }}
      aria-disabled={busy}
      className={cn(base, variantClass, busy && 'pointer-events-none opacity-60')}
    >
      {children}
    </div>
  );
}
