'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  cancelBookingRequest,
} from '@/domains/booking/services/bookingService';
import type { BookingRequest } from '@/domains/booking/types/booking';
import { BookSessionModal } from '@/domains/booking/components/BookSessionModal';
import { TutorProfileModal } from '@/domains/tutors/tutor-discovery/components/TutorProfileModal';
import { getTutorProfile } from '@/domains/tutors/tutor-discovery/services/tutorProfileService';
import type { Tutor } from '@/domains/tutors/tutor-discovery/types/tutor';
import { cn } from '@/shared/utils/cn';

type SessionDetailModalProps = {
  booking: BookingRequest;
  otherPartyName: string;
  viewerRole: 'tutor' | 'student';
  viewerId: string;
  workspaceHref?: string;
  onClose: () => void;
};

export function SessionDetailModal({
  booking,
  otherPartyName,
  viewerRole,
  viewerId,
  workspaceHref,
  onClose,
}: SessionDetailModalProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [tutorProfileModal, setTutorProfileModal] = useState<Tutor | null>(null);
  const [isLoadingTutorProfile, setIsLoadingTutorProfile] = useState(false);

  async function handleTutorNameClick() {
    if (isLoadingTutorProfile) return;
    setIsLoadingTutorProfile(true);
    try {
      const profile = await getTutorProfile(booking.tutorId);
      setTutorProfileModal(profile);
    } finally {
      setIsLoadingTutorProfile(false);
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

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

  const isPast = sessionDate <= new Date();
  const isTerminal =
    booking.status === 'cancelled' || booking.status === 'declined';
  const canReschedule =
    !isPast &&
    !isTerminal &&
    (booking.status === 'confirmed' ||
      booking.status === 'pending_receiver' ||
      booking.status === 'pending_requester');
  const canCancel = !isTerminal && !isPast;

  async function handleCancel() {
    if (!confirmingCancel) {
      setConfirmingCancel(true);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await cancelBookingRequest(booking.id, viewerRole);
      onClose();
    } catch {
      setError('Could not cancel this session. Please try again.');
      setConfirmingCancel(false);
    } finally {
      setBusy(false);
    }
  }

  const statusBadge = getSessionStatusBadge(booking.status, isPast);

  if (typeof document === 'undefined') return null;

  const modal = (
    <>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-950">Session details</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M3 3l10 10M13 3L3 13" />
              </svg>
            </button>
          </div>

          <div className="p-6">
            <p className="text-lg font-semibold text-slate-950">{booking.subject}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
              with{' '}
              {viewerRole === 'student' ? (
                <button
                  type="button"
                  onClick={() => void handleTutorNameClick()}
                  disabled={isLoadingTutorProfile}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-950 transition hover:border-slate-300 hover:bg-slate-100 disabled:opacity-60"
                >
                  {isLoadingTutorProfile ? 'Loading...' : otherPartyName}
                  <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3 w-3 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="8" cy="5" r="3" />
                    <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" />
                  </svg>
                </button>
              ) : (
                <span className="font-medium text-slate-700">{otherPartyName}</span>
              )}
            </p>

            <span
              className={cn(
                'mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
                statusBadge.className
              )}
            >
              {statusBadge.label}
            </span>

            <div className="mt-4 grid gap-1.5 text-sm text-slate-600">
              <p><span className="font-medium text-slate-800">Date:</span> {dateLabel}</p>
              <p><span className="font-medium text-slate-800">Time:</span> {timeLabel}</p>
              <p><span className="font-medium text-slate-800">Duration:</span> {booking.durationMinutes} min</p>
              {booking.notes ? (
                <p className="mt-2 rounded-2xl bg-slate-50 px-3 py-2 text-xs italic text-slate-500">
                  &ldquo;{booking.notes}&rdquo;
                </p>
              ) : null}
            </div>

            {error ? (
              <p className="mt-3 rounded-2xl bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p>
            ) : null}

            {workspaceHref && booking.status === 'confirmed' ? (
              <div className="mt-5">
                <a
                  href={workspaceHref}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                >
                  Go to workspace
                  <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 3l5 5-5 5" />
                  </svg>
                </a>
              </div>
            ) : null}

            {(canReschedule || canCancel) && !confirmingCancel ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {canReschedule ? (
                  <ModalButton onClick={() => setShowReschedule(true)} variant="primary">
                    Reschedule
                  </ModalButton>
                ) : null}
                {canCancel ? (
                  <ModalButton onClick={() => void handleCancel()} variant="danger" busy={busy}>
                    Cancel session
                  </ModalButton>
                ) : null}
              </div>
            ) : null}

            {confirmingCancel ? (
              <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-sm text-slate-700">Cancel this session? The other party will be notified.</p>
                <div className="mt-3 flex gap-2">
                  <ModalButton onClick={() => void handleCancel()} variant="danger" busy={busy}>
                    Yes, cancel
                  </ModalButton>
                  <ModalButton onClick={() => setConfirmingCancel(false)} variant="ghost">
                    Keep it
                  </ModalButton>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {showReschedule ? (
        <BookSessionModal
          isOpen
          onClose={() => {
            setShowReschedule(false);
            onClose();
          }}
          tutorId={booking.tutorId}
          studentId={booking.studentId}
          counterpartyName={otherPartyName}
          initiatedBy={viewerRole}
          currentUserId={viewerId}
          mode="reschedule"
          existingBooking={{
            id: booking.id,
            subject: booking.subject,
            durationMinutes: booking.durationMinutes,
          }}
        />
      ) : null}

      {tutorProfileModal ? (
        <TutorProfileModal
          tutor={tutorProfileModal}
          readOnly
          onClose={() => setTutorProfileModal(null)}
        />
      ) : null}
    </>
  );

  return createPortal(modal, document.body);
}


function getSessionStatusBadge(status: BookingRequest['status'], isPast: boolean = false) {
  if (status === 'confirmed') {
    return isPast
      ? { label: 'Completed', className: 'logicgate-status-neutral' }
      : { label: 'Upcoming', className: 'logicgate-status-success' };
  }
  if (status === 'pending_receiver') {
    return { label: 'Awaiting response', className: 'logicgate-status-pending' };
  }
  if (status === 'pending_requester') {
    return { label: 'Awaiting confirmation', className: 'logicgate-status-info' };
  }
  if (status === 'declined') {
    return { label: 'Declined', className: 'logicgate-status-danger' };
  }
  if (status === 'cancelled') {
    return { label: 'Cancelled', className: 'logicgate-status-neutral' };
  }

  return { label: status, className: 'logicgate-status-neutral' };
}

function ModalButton({
  children,
  onClick,
  variant,
  busy,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant: 'primary' | 'ghost' | 'danger';
  busy?: boolean;
}) {
  const base =
    'inline-flex cursor-pointer items-center rounded-full px-4 py-2 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2';
  const variantClass = {
    primary: 'bg-slate-950 text-white hover:bg-slate-800',
    ghost: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
  }[variant];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={cn(base, variantClass, busy && 'pointer-events-none opacity-60')}
    >
      {children}
    </button>
  );
}
